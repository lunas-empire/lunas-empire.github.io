import {opponentCopy} from './opponent-intelligence-i18n.js';
import {LOCALES} from './i18n.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const list=value=>Array.isArray(value)?value:[];
const metrics=['power','hero_power','army_power','total_troops','drone','kills','hq','vip','t1_power','t2_power','t3_power','t4_power','gorilla_power'];
const metricLabels={power:'Power',hero_power:'Hero Power',army_power:'Army Power',total_troops:'Total Troops',drone:'Drone',kills:'Kills',hq:'HQ',vip:'VIP',t1_power:'T1 Power',t2_power:'T2 Power',t3_power:'T3 Power',t4_power:'T4 Power',gorilla_power:'Gorilla Power'};
const textFields=['Profession','Shield','Left / away',...['T1','T2','T3','T4'].flatMap(t=>[t+' type',t+' heroes'])];
const text=(copy,key,values={})=>Object.entries(values).reduce((result,[name,value])=>result.replace('{'+name+'}',String(value??copy.unknown)),copy[key]);
const format=(value,locale)=>Number.isFinite(value)?new Intl.NumberFormat(locale).format(value):null;
const delta=(own,opponent,locale)=>own?.median===null||opponent?.median===null?'':format(opponent.median-own.median,locale);
const fieldValue=(row,key,locale,copy)=>{
 const value=row?.values?.[key],formatted=metrics.includes(key)?format(value,locale):value;
 return formatted===null||formatted===undefined||formatted===''?'<span title="'+esc(copy.notCaptured)+'">—</span>':'<span data-native-no-translate>'+esc(formatted)+'</span>';
};
function comparisonTable(comparison,copy,locale,metric){
 const row=comparison?.metrics?.[metric];if(!row)return '';
 const cell=(side,key)=>format(side?.[key],locale)??'<span title="'+esc(copy.notCaptured)+'">—</span>';
 const coverage=side=>format(side?.verified,locale)??'0';
 return '<div class="native-opponent-table-wrap"><table class="native-opponent-table"><caption>'+esc(metricLabels[metric])+'</caption><thead><tr><th scope="col">'+esc(copy.opponentSide)+'</th><th scope="col">'+esc(copy.coverage)+'</th><th scope="col">'+esc(copy.median)+'</th><th scope="col">P25</th><th scope="col">P75</th><th scope="col">Min</th><th scope="col">Max</th></tr></thead><tbody>'+
  [['own',copy.own],['opponent',copy.opponentSide]].map(([key,label])=>'<tr><th scope="row">'+esc(label)+'</th><td>'+coverage(row[key])+'</td>'+['median','p25','p75','min','max'].map(field=>'<td>'+cell(row[key],field)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+
  (delta(row.own,row.opponent,locale)?'<p class="native-opponent-delta"><strong>'+esc(copy.difference)+':</strong> '+esc(delta(row.own,row.opponent,locale))+' <span class="native-muted">'+esc(copy.opponentSide)+' − '+esc(copy.own)+'</span></p>':'');
}
function rankedRows(rows,metric,limit){
 const ranked=list(rows).filter(row=>Number.isSafeInteger(row.values?.[metric])).sort((a,b)=>b.values[metric]-a.values[metric]||a.source_row-b.source_row);
 return limit==='all'?ranked:ranked.slice(0,Number(limit));
}
function playerDetails(row,copy,locale){
 return '<dl class="native-opponent-player-details">'+[...metrics,...textFields].map(key=>'<div><dt>'+esc(metricLabels[key]||key)+'</dt><dd>'+fieldValue(row,key,locale,copy)+'</dd></div>').join('')+'</dl>';
}
function playerList(rows,side,metric,limit,copy,locale,canCompare){
 const ranked=rankedRows(rows,metric,limit);
 if(!ranked.length)return '<p class="native-muted">'+esc(copy.notCaptured)+'</p>';
 return '<ol class="native-opponent-top native-opponent-player-list">'+ranked.map((row,index)=>'<li><details class="native-opponent-player"><summary><span class="native-opponent-player-rank">'+esc(index+1)+'</span><span class="native-opponent-player-name" data-native-no-translate><strong>'+esc(row.source_name)+'</strong><small>'+esc(row.source_rank||copy.unknown)+'</small></span><b>'+esc(format(row.values[metric],locale))+'</b></summary><div class="native-opponent-player-body"><h4>'+esc(copy.playerDetails)+'</h4>'+playerDetails(row,copy,locale)+(canCompare?'<button type="button" data-native-opponent-compare="'+esc(side)+'" data-native-opponent-row="'+esc(row.source_row)+'">'+esc(copy.comparePlayer)+'</button>':'')+'</div></details></li>').join('')+'</ol>';
}
function squads(rows,copy){
 const counts=new Map();for(const row of list(rows)){const value=row.values?.['T1 type'];if(value)counts.set(value,(counts.get(value)||0)+1)}
 const entries=[...counts].sort((a,b)=>b[1]-a[1]);if(!entries.length)return '<p class="native-muted">'+esc(copy.notCaptured)+'</p>';
 return '<div class="native-opponent-squads">'+entries.map(([name,count])=>'<div><span data-native-no-translate>'+esc(name)+'</span><div class="native-trend-track" aria-hidden="true"><i style="width:'+Math.round(count/list(rows).length*100)+'%"></i></div><strong>'+count+'</strong></div>').join('')+'</div>';
}
function evolution(data,copy,locale){
 const current=data.selected,options=data.snapshots.filter(item=>item.match_id===current?.id||item.match_id===current?.match_id).filter(item=>item.id!==current?.id);
 if(!current||!options.length)return '';
 return '<section class="native-opponent-evolution"><h3>'+esc(copy.evolution)+'</h3><label>'+esc(copy.compareWith)+'<select data-native-opponent-previous><option value="">'+esc(copy.current)+'</option>'+options.map(item=>'<option value="'+esc(item.id)+'" '+(data.evolution?.snapshot?.id===item.id?'selected':'')+'>'+esc(item.report_date)+'</option>').join('')+'</select></label>'+(data.evolution?comparisonTable(data.evolution.comparison,copy,locale,'power'):'')+'</section>';
}
function personSelect(side,rows,selected,copy,locale){
 const collator=new Intl.Collator(locale,{numeric:true,sensitivity:'base'}),ordered=[...rows].sort((a,b)=>collator.compare(a.source_name,b.source_name)||a.source_row-b.source_row);
 return '<label>'+esc(side==='own'?copy.own:copy.opponentSide)+'<select data-native-opponent-compare-'+side+'>'+ordered.map(row=>'<option value="'+esc(row.source_row)+'" '+(row.source_row===selected?'selected':'')+'>'+esc(row.source_name)+'</option>').join('')+'</select></label>';
}
function personComparison(data,compare,copy,locale){
 if(!compare)return '';
 const own=list(data.ownRows).find(row=>row.source_row===compare.ownRow),opponent=list(data.opponentRows).find(row=>row.source_row===compare.opponentRow);
 if(!own||!opponent)return '';
 const rows=[...metrics,...textFields].map(key=>{
  const a=own.values?.[key],b=opponent.values?.[key],difference=metrics.includes(key)&&Number.isSafeInteger(a)&&Number.isSafeInteger(b)?format(b-a,locale):null;
  return '<tr><th scope="row">'+esc(metricLabels[key]||key)+'</th><td>'+fieldValue(own,key,locale,copy)+'</td><td>'+fieldValue(opponent,key,locale,copy)+'</td><td>'+(difference===null?'—':esc(difference))+'</td></tr>';
 }).join('');
 return '<section id="native-opponent-person-comparison" class="native-opponent-person-comparison"><h3>'+esc(copy.comparePlayer)+'</h3><div class="native-opponent-person-selects">'+personSelect('own',list(data.ownRows),own.source_row,copy,locale)+personSelect('opponent',list(data.opponentRows),opponent.source_row,copy,locale)+'</div><div class="native-opponent-table-wrap"><table class="native-opponent-table native-opponent-person-table"><thead><tr><th scope="col">'+esc(copy.metric)+'</th><th scope="col">'+esc(copy.own)+'</th><th scope="col">'+esc(copy.opponentSide)+'</th><th scope="col">'+esc(copy.difference)+'</th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="native-muted">'+esc(copy.opponentSide)+' − '+esc(copy.own)+'</p></section>';
}
export function renderOpponentIntelligence(data={},options={}){
 const language=options.language||'de',copy=opponentCopy(language),locale=LOCALES[language]||LOCALES.de,metric=metrics.includes(options.metric)?options.metric:'power',limit=['10','15','20','30','50','all'].includes(String(options.limit))?String(options.limit):'10';
 const matches=list(options.allMatches||data.matches),snapshots=list(data.snapshots),selected=data.selected,ownRows=list(data.ownRows),opponentRows=list(data.opponentRows);
 const currentMatch=list(data.matches).find(match=>match.id===selected?.match_id)||list(data.matches)[0]||matches[0];
 const limitOptions=['10','15','20','30','50','all'].map(value=>'<option value="'+value+'" '+(value===limit?'selected':'')+'>'+(value==='all'?esc(copy.all):value)+'</option>').join('');
 return '<div class="native-opponent-intel" lang="'+esc(language)+'" dir="'+(language==='ar'?'rtl':'ltr')+'"><div class="native-row native-data-heading"><div><h2>'+esc(copy.title)+'</h2><p class="native-muted">'+esc(copy.intro)+'</p></div><button type="button" data-native-opponent-reload>'+esc(copy.reload)+'</button></div>'+
  (matches.length?'<div class="native-opponent-controls"><label>'+esc(copy.week)+'<select data-native-opponent-week>'+matches.map(match=>'<option value="'+esc(match.iso_week)+'" '+(match.iso_week===(selected?.iso_week||currentMatch?.iso_week)?'selected':'')+'>'+esc(match.iso_week)+' · '+esc(match.alliance_tag)+'</option>').join('')+'</select></label>'+
  (snapshots.length?'<label>'+esc(copy.snapshot)+'<select data-native-opponent-snapshot>'+snapshots.map(item=>'<option value="'+esc(item.id)+'" '+(item.id===selected?.id?'selected':'')+'>'+esc(item.report_date)+' · '+esc(item.row_count)+' '+esc(copy.players)+'</option>').join('')+'</select></label>':'')+'</div>':'')+
  (!matches.length?'<p class="native-evidence-note">'+esc(copy.noMatch)+'</p><button type="button" data-officer-tab="duelLeague">Duel &amp; League</button>':'<details class="native-fold native-opponent-add"><summary>'+esc(copy.addSnapshot)+'</summary><form data-native-opponent-upload><p><strong>'+esc(copy.opponent)+':</strong> <span data-native-no-translate>'+esc(currentMatch?.alliance_name)+' ['+esc(currentMatch?.alliance_tag)+'] · S'+esc(currentMatch?.server_number??copy.unknown)+'</span></p><input type="hidden" name="match_id" value="'+esc(currentMatch?.id)+'"><label>'+esc(copy.reportDate)+'<input type="date" name="report_date" required></label><label>'+esc(copy.file)+'<input type="file" name="csv" accept=".csv,text/csv" required></label><label class="native-opponent-confirm"><input type="checkbox" name="confirmed" required> '+esc(copy.confirm)+'</label><button type="submit" class="native-game-primary">'+esc(copy.upload)+'</button></form></details>')+
  '<p data-native-opponent-status role="status" aria-live="polite"></p>'+
  (!selected?'<p class="native-muted">'+esc(copy.noSnapshots)+'</p>':'<section class="native-opponent-current"><div class="native-row"><div><h3 data-native-no-translate>'+esc(selected.alliance_name)+' ['+esc(selected.alliance_tag)+'] · S'+esc(selected.server_number??copy.unknown)+'</h3><p class="native-muted">'+esc(text(copy,'dates',{own:data.ownBatch?.report_date,opponent:selected.report_date}))+'</p></div><button type="button" data-native-opponent-original>'+esc(copy.download)+'</button></div><p class="native-evidence-note">'+esc(copy.noPrediction)+'</p><div class="native-opponent-analysis-controls"><label>'+esc(copy.metric)+'<select data-native-opponent-metric>'+metrics.map(key=>'<option value="'+key+'" '+(key===metric?'selected':'')+'>'+esc(metricLabels[key])+'</option>').join('')+'</select></label><label>'+esc(copy.topN)+'<select data-native-opponent-limit>'+limitOptions+'</select></label></div>'+comparisonTable(data.comparison,copy,locale,metric)+
   '<section class="native-opponent-player-rankings"><div class="native-opponent-player-columns"><section><h3>'+esc(copy.own)+'</h3>'+(ownRows.length?playerList(ownRows,'own',metric,limit,copy,locale,opponentRows.length>0):'<p class="native-muted">'+esc(copy.noOwnPlayers)+'</p>')+'</section><section><h3>'+esc(copy.opponentSide)+'</h3>'+playerList(opponentRows,'opponent',metric,limit,copy,locale,ownRows.length>0)+'</section></div></section>'+
   personComparison(data,options.compare,copy,locale)+'<div class="native-opponent-analysis"><section><h3>'+esc(copy.own)+' · '+esc(copy.squads)+'</h3>'+squads(ownRows,copy)+'</section><section><h3>'+esc(copy.opponentSide)+' · '+esc(copy.squads)+'</h3>'+squads(opponentRows,copy)+'</section></div></section>'+evolution(data,copy,locale))+
  '<section class="native-opponent-history"><h3>'+esc(copy.history)+'</h3>'+(snapshots.length?'<div class="native-opponent-history-list">'+snapshots.map(item=>'<button type="button" data-native-opponent-open="'+esc(item.id)+'" '+(item.id===selected?.id?'aria-current="true"':'')+'><strong data-native-no-translate>'+esc(item.iso_week)+' · '+esc(item.alliance_tag)+'</strong><span>'+esc(item.report_date)+'</span><small>'+esc(item.row_count)+' '+esc(copy.players)+'</small></button>').join('')+'</div>':'<p class="native-muted">'+esc(copy.noSnapshots)+'</p>')+'</section></div>';
}
export function createOpponentIntelligenceController({root,api,language='de'}={}){
 if(!root||!api)throw new TypeError('Opponent root and API are required');
 let data={},allMatches=[],state={week:null,metric:'power',limit:'10',compare:null},busy=false;
 const draw=()=>{root.innerHTML=renderOpponentIntelligence(data,{language,allMatches,metric:state.metric,limit:state.limit,compare:state.compare})};
 const load=async({week=state.week,snapshot=null,previous=null}={})=>{
  if(busy)return;busy=true;
  try{data=await api.read({week,snapshot,previous});allMatches=[...new Map([...list(data.matches),...allMatches].map(item=>[item.id,item])).values()].sort((a,b)=>b.iso_week.localeCompare(a.iso_week));state.week=week;state.compare=null;draw()}catch(error){root.innerHTML='<p class="native-error" role="alert">'+esc(error.message||opponentCopy(language).readError)+'</p><button type="button" data-native-opponent-reload>'+esc(opponentCopy(language).reload)+'</button>'}finally{busy=false}
 };
 root.addEventListener('click',async event=>{
  const open=event.target.closest?.('[data-native-opponent-open]');if(open){await load({week:state.week,snapshot:open.dataset.nativeOpponentOpen});return}
  if(event.target.closest?.('[data-native-opponent-reload]')){await load({});return}
  const compare=event.target.closest?.('[data-native-opponent-compare]');
  if(compare){
   const side=compare.dataset.nativeOpponentCompare,row=Number(compare.dataset.nativeOpponentRow),own=rankedRows(data.ownRows,state.metric,'all'),opponent=rankedRows(data.opponentRows,state.metric,'all');
   state.compare={ownRow:side==='own'?row:state.compare?.ownRow??own[0]?.source_row,opponentRow:side==='opponent'?row:state.compare?.opponentRow??opponent[0]?.source_row};
   if(Number.isSafeInteger(state.compare.ownRow)&&Number.isSafeInteger(state.compare.opponentRow)){draw();root.querySelector('#native-opponent-person-comparison')?.scrollIntoView?.({block:'start'})}return;
  }
  const original=event.target.closest?.('[data-native-opponent-original]');if(original&&data.selected){original.disabled=true;try{const result=await api.original(data.selected.id),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',result.bytes))].map(value=>value.toString(16).padStart(2,'0')).join('');if(hash!==result.sha256)throw Error('SHA mismatch');const url=URL.createObjectURL(new Blob([result.bytes],{type:'text/csv;charset=utf-8'})),anchor=root.ownerDocument.createElement('a');anchor.href=url;anchor.download='opponent-lw.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(error){root.querySelector('[data-native-opponent-status]').textContent=error.message}finally{original.disabled=false}}
 });
 root.addEventListener('change',async event=>{
  if(event.target.matches('[data-native-opponent-metric]')){state.metric=event.target.value;draw();return}
  if(event.target.matches('[data-native-opponent-limit]')){state.limit=event.target.value;draw();return}
  if(event.target.matches('[data-native-opponent-compare-own]')){state.compare={...state.compare,ownRow:Number(event.target.value)};draw();return}
  if(event.target.matches('[data-native-opponent-compare-opponent]')){state.compare={...state.compare,opponentRow:Number(event.target.value)};draw();return}
  if(event.target.matches('[data-native-opponent-week]'))await load({week:event.target.value});
  if(event.target.matches('[data-native-opponent-snapshot]'))await load({snapshot:event.target.value});
  if(event.target.matches('[data-native-opponent-previous]'))await load({snapshot:data.selected?.id,previous:event.target.value||null});
 });
 root.addEventListener('submit',async event=>{
  const form=event.target.closest?.('[data-native-opponent-upload]');if(!form)return;event.preventDefault();if(busy)return;
  const status=root.querySelector('[data-native-opponent-status]'),file=form.elements.csv.files?.[0],button=form.querySelector('[type=submit]');
  if(!file||!form.elements.confirmed.checked)return;if(file.size>262144){status.textContent='256 KiB';return}
  busy=true;button.disabled=true;
  try{const bytes=await file.arrayBuffer(),receipt=await api.upload(bytes,{matchId:form.elements.match_id.value,reportDate:form.elements.report_date.value,confirmed:true}),reread=await api.read({week:receipt.selected?.iso_week,snapshot:receipt.selected?.id});if(!receipt.selected||reread.selected?.id!==receipt.selected.id||reread.selected?.sha256!==receipt.selected.sha256||reread.selected?.row_count!==receipt.selected.row_count)throw Error('Readback mismatch');data={...reread,reused:receipt.reused};state.week=data.selected?.iso_week||state.week;state.compare=null;form.elements.csv.value='';draw();root.querySelector('[data-native-opponent-status]').textContent=opponentCopy(language)[data.reused?'reused':'uploadSuccess']}catch(error){status.textContent=error.message;button.disabled=false}finally{busy=false}
 });
 return{load};
}
