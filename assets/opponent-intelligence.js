import {opponentCopy} from './opponent-intelligence-i18n.js';
import {LOCALES} from './i18n.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const list=value=>Array.isArray(value)?value:[];
const metrics=['power','hero_power','total_troops','drone','kills','t1_power','t2_power','t3_power','t4_power','gorilla_power'];
const metricLabels={power:'Power',hero_power:'Hero Power',total_troops:'Total Troops',drone:'Drone',kills:'Kills',t1_power:'T1 Power',t2_power:'T2 Power',t3_power:'T3 Power',t4_power:'T4 Power',gorilla_power:'Gorilla Power'};
const text=(copy,key,values={})=>Object.entries(values).reduce((result,[name,value])=>result.replace('{'+name+'}',String(value??copy.unknown)),copy[key]);
const format=(value,locale)=>Number.isFinite(value)?new Intl.NumberFormat(locale).format(value):null;
const delta=(own,opponent,locale)=>own?.median===null||opponent?.median===null?'':format(opponent.median-own.median,locale);
function comparisonTable(comparison,copy,locale,metric){
 const row=comparison?.metrics?.[metric];if(!row)return '';
 const cell=(side,key)=>format(side?.[key],locale)??'<span title="'+esc(copy.notCaptured)+'">—</span>';
 const coverage=side=>format(side?.verified,locale)??'0';
 return '<div class="native-opponent-table-wrap"><table class="native-opponent-table"><caption>'+esc(metricLabels[metric])+'</caption><thead><tr><th scope="col">'+esc(copy.opponentSide)+'</th><th scope="col">'+esc(copy.coverage)+'</th><th scope="col">'+esc(copy.median)+'</th><th scope="col">P25</th><th scope="col">P75</th><th scope="col">Min</th><th scope="col">Max</th></tr></thead><tbody>'+
  [['own',copy.own],['opponent',copy.opponentSide]].map(([key,label])=>'<tr><th scope="row">'+esc(label)+'</th><td>'+coverage(row[key])+'</td>'+['median','p25','p75','min','max'].map(field=>'<td>'+cell(row[key],field)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+
  (delta(row.own,row.opponent,locale)?'<p class="native-opponent-delta"><strong>'+esc(copy.difference)+':</strong> '+esc(delta(row.own,row.opponent,locale))+' <span class="native-muted">'+esc(copy.opponentSide)+' − '+esc(copy.own)+'</span></p>':'');
}
function topPlayers(rows,copy,locale,metric){
 const ranked=list(rows).filter(row=>Number.isSafeInteger(row.values?.[metric])).sort((a,b)=>b.values[metric]-a.values[metric]).slice(0,10);
 if(!ranked.length)return '<p class="native-muted">'+esc(copy.notCaptured)+'</p>';
 return '<ol class="native-opponent-top">'+ranked.map(row=>'<li><span data-native-no-translate>'+esc(row.source_name)+'</span><strong>'+esc(format(row.values[metric],locale))+'</strong><small data-native-no-translate>'+esc(row.source_rank||copy.unknown)+'</small></li>').join('')+'</ol>';
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
export function renderOpponentIntelligence(data={},options={}){
 const language=options.language||'de',copy=opponentCopy(language),locale=LOCALES[language]||LOCALES.de,metric=metrics.includes(options.metric)?options.metric:'power';
 const matches=list(options.allMatches||data.matches),snapshots=list(data.snapshots),selected=data.selected;
 const currentMatch=list(data.matches).find(match=>match.id===selected?.match_id)||list(data.matches)[0]||matches[0];
 return '<div class="native-opponent-intel" lang="'+esc(language)+'" dir="'+(language==='ar'?'rtl':'ltr')+'"><div class="native-row native-data-heading"><div><h2>'+esc(copy.title)+'</h2><p class="native-muted">'+esc(copy.intro)+'</p></div><button type="button" data-native-opponent-reload>'+esc(copy.reload)+'</button></div>'+
  (matches.length?'<div class="native-opponent-controls"><label>'+esc(copy.week)+'<select data-native-opponent-week>'+matches.map(match=>'<option value="'+esc(match.iso_week)+'" '+(match.iso_week===(selected?.iso_week||currentMatch?.iso_week)?'selected':'')+'>'+esc(match.iso_week)+' · '+esc(match.alliance_tag)+'</option>').join('')+'</select></label>'+
  (snapshots.length?'<label>'+esc(copy.snapshot)+'<select data-native-opponent-snapshot>'+snapshots.map(item=>'<option value="'+esc(item.id)+'" '+(item.id===selected?.id?'selected':'')+'>'+esc(item.report_date)+' · '+esc(item.row_count)+' '+esc(copy.players)+'</option>').join('')+'</select></label>':'')+'</div>':'')+
  (!matches.length?'<p class="native-evidence-note">'+esc(copy.noMatch)+'</p><button type="button" data-officer-tab="duelLeague">Duel &amp; League</button>':'<details class="native-fold native-opponent-add"><summary>'+esc(copy.addSnapshot)+'</summary><form data-native-opponent-upload><p><strong>'+esc(copy.opponent)+':</strong> <span data-native-no-translate>'+esc(currentMatch?.alliance_name)+' ['+esc(currentMatch?.alliance_tag)+'] · S'+esc(currentMatch?.server_number??copy.unknown)+'</span></p><input type="hidden" name="match_id" value="'+esc(currentMatch?.id)+'"><label>'+esc(copy.reportDate)+'<input type="date" name="report_date" required></label><label>'+esc(copy.file)+'<input type="file" name="csv" accept=".csv,text/csv" required></label><label class="native-opponent-confirm"><input type="checkbox" name="confirmed" required> '+esc(copy.confirm)+'</label><button type="submit" class="native-game-primary">'+esc(copy.upload)+'</button></form></details>')+
  '<p data-native-opponent-status role="status" aria-live="polite"></p>'+
  (!selected?'<p class="native-muted">'+esc(copy.noSnapshots)+'</p>':'<section class="native-opponent-current"><div class="native-row"><div><h3 data-native-no-translate>'+esc(selected.alliance_name)+' ['+esc(selected.alliance_tag)+'] · S'+esc(selected.server_number??copy.unknown)+'</h3><p class="native-muted">'+esc(text(copy,'dates',{own:data.ownBatch?.report_date,opponent:selected.report_date}))+'</p></div><button type="button" data-native-opponent-original>'+esc(copy.download)+'</button></div><p class="native-evidence-note">'+esc(copy.noPrediction)+'</p><label>'+esc(copy.metric)+'<select data-native-opponent-metric>'+metrics.map(key=>'<option value="'+key+'" '+(key===metric?'selected':'')+'>'+esc(metricLabels[key])+'</option>').join('')+'</select></label>'+comparisonTable(data.comparison,copy,locale,metric)+'<div class="native-opponent-analysis"><section><h3>'+esc(copy.topPlayers)+'</h3>'+topPlayers(data.opponentRows,copy,locale,metric)+'</section><section><h3>'+esc(copy.squads)+'</h3>'+squads(data.opponentRows,copy)+'</section></div></section>'+evolution(data,copy,locale))+
  '<section class="native-opponent-history"><h3>'+esc(copy.history)+'</h3>'+(snapshots.length?'<div class="native-opponent-history-list">'+snapshots.map(item=>'<button type="button" data-native-opponent-open="'+esc(item.id)+'" '+(item.id===selected?.id?'aria-current="true"':'')+'><strong data-native-no-translate>'+esc(item.iso_week)+' · '+esc(item.alliance_tag)+'</strong><span>'+esc(item.report_date)+'</span><small>'+esc(item.row_count)+' '+esc(copy.players)+'</small></button>').join('')+'</div>':'<p class="native-muted">'+esc(copy.noSnapshots)+'</p>')+'</section></div>';
}
export function createOpponentIntelligenceController({root,api,language='de'}={}){
 if(!root||!api)throw new TypeError('Opponent root and API are required');
 let data={},allMatches=[],state={week:null,metric:'power'},busy=false;
 const draw=()=>{root.innerHTML=renderOpponentIntelligence(data,{language,allMatches,metric:state.metric})};
 const load=async({week=state.week,snapshot=null,previous=null}={})=>{
  if(busy)return;busy=true;
  try{data=await api.read({week,snapshot,previous});allMatches=[...new Map([...list(data.matches),...allMatches].map(item=>[item.id,item])).values()].sort((a,b)=>b.iso_week.localeCompare(a.iso_week));state.week=week;draw()}catch(error){root.innerHTML='<p class="native-error" role="alert">'+esc(error.message||opponentCopy(language).readError)+'</p><button type="button" data-native-opponent-reload>'+esc(opponentCopy(language).reload)+'</button>'}finally{busy=false}
 };
 root.addEventListener('click',async event=>{
  const open=event.target.closest?.('[data-native-opponent-open]');if(open){await load({week:state.week,snapshot:open.dataset.nativeOpponentOpen});return}
  if(event.target.closest?.('[data-native-opponent-reload]')){await load({});return}
  const original=event.target.closest?.('[data-native-opponent-original]');if(original&&data.selected){original.disabled=true;try{const result=await api.original(data.selected.id),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',result.bytes))].map(value=>value.toString(16).padStart(2,'0')).join('');if(hash!==result.sha256)throw Error('SHA mismatch');const url=URL.createObjectURL(new Blob([result.bytes],{type:'text/csv;charset=utf-8'})),anchor=root.ownerDocument.createElement('a');anchor.href=url;anchor.download='opponent-lw.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(error){root.querySelector('[data-native-opponent-status]').textContent=error.message}finally{original.disabled=false}}
 });
 root.addEventListener('change',async event=>{
  if(event.target.matches('[data-native-opponent-metric]')){state.metric=event.target.value;draw()}
  if(event.target.matches('[data-native-opponent-week]'))await load({week:event.target.value});
  if(event.target.matches('[data-native-opponent-snapshot]'))await load({snapshot:event.target.value});
  if(event.target.matches('[data-native-opponent-previous]'))await load({snapshot:data.selected?.id,previous:event.target.value||null});
 });
 root.addEventListener('submit',async event=>{
  const form=event.target.closest?.('[data-native-opponent-upload]');if(!form)return;event.preventDefault();if(busy)return;
  const status=root.querySelector('[data-native-opponent-status]'),file=form.elements.csv.files?.[0],button=form.querySelector('[type=submit]');
  if(!file||!form.elements.confirmed.checked)return;if(file.size>262144){status.textContent='256 KiB';return}
  busy=true;button.disabled=true;
  try{const bytes=await file.arrayBuffer(),receipt=await api.upload(bytes,{matchId:form.elements.match_id.value,reportDate:form.elements.report_date.value,confirmed:true}),reread=await api.read({week:receipt.selected?.iso_week,snapshot:receipt.selected?.id});if(!receipt.selected||reread.selected?.id!==receipt.selected.id||reread.selected?.sha256!==receipt.selected.sha256||reread.selected?.row_count!==receipt.selected.row_count)throw Error('Readback mismatch');data={...reread,reused:receipt.reused};state.week=data.selected?.iso_week||state.week;form.elements.csv.value='';draw();root.querySelector('[data-native-opponent-status]').textContent=opponentCopy(language)[data.reused?'reused':'uploadSuccess']}catch(error){status.textContent=error.message;button.disabled=false}finally{busy=false}
 });
 return{load};
}
