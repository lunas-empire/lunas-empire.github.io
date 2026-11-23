import {allianceAnalysisCopy} from './alliance-analysis-i18n.js';
import {LOCALES} from './i18n.js';
import {playerList,personComparison,comparisonTable} from './opponent-intelligence.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const list=value=>Array.isArray(value)?value:[];
const metrics=['power','hero_power','army_power','total_troops','drone','kills','hq','vip','t1_power','t2_power','t3_power','t4_power','gorilla_power'];
const labels={power:'Power',hero_power:'Hero Power',army_power:'Army Power',total_troops:'Total Troops',drone:'Drone',kills:'Kills',hq:'HQ',vip:'VIP',t1_power:'T1 Power',t2_power:'T2 Power',t3_power:'T3 Power',t4_power:'T4 Power',gorilla_power:'Gorilla Power'};
const allianceLabel=item=>'['+String(item?.alliance_tag||'?')+'] '+String(item?.alliance_name||'?')+' · S'+String(item?.server_number??'?');
const idem=()=>crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');

function requestForm(copy){
 return '<details class="native-fold native-alliance-request"><summary>'+esc(copy.request)+'</summary><form data-alliance-request><label>'+esc(copy.server)+'<input name="server_number" type="number" min="1" max="99999" required></label><label>'+esc(copy.tag)+'<input name="alliance_tag" minlength="2" maxlength="12" required></label><label>'+esc(copy.name)+'<input name="alliance_name" minlength="2" maxlength="120" required></label><button type="submit">'+esc(copy.request)+'</button></form></details>';
}
function pendingRequests(data,copy){
 const pending=list(data.requests).filter(item=>item.status==='pending');
 if(!pending.length)return '';
 return '<section class="native-alliance-pending"><h3>'+esc(copy.pending)+' <b>'+pending.length+'</b></h3><p class="native-evidence-note">'+esc(copy.manualNotice)+'</p>'+pending.map(item=>'<details class="native-fold native-alliance-pending-item"><summary><span data-native-no-translate>'+esc(allianceLabel(item))+'</span><small>'+esc(item.requested_by_name)+' · '+esc(item.requested_at)+'</small></summary><div class="native-fold-body"><p class="native-muted">'+esc(copy.manualNotice)+'</p>'+(data.siteOwner?'<form data-alliance-upload><input type="hidden" name="request_id" value="'+esc(item.id)+'"><label>'+esc(copy.reportDate)+'<input type="date" name="report_date" required></label><label>'+esc(copy.file)+'<input type="file" name="csv" accept=".csv,text/csv" required></label><label><input type="checkbox" name="confirmed" required> '+esc(copy.confirm)+'</label><button type="submit">'+esc(copy.uploadNow)+'</button></form>':'')+'</div></details>').join('')+'</section>';
}
function snapshotOptions(snapshots,selected){
 return snapshots.map(item=>'<option value="'+esc(item.id)+'" '+(item.id===selected?'selected':'')+'>'+esc(allianceLabel(item))+' · '+esc(item.report_date)+'</option>').join('');
}
export function renderAllianceAnalysis(data={},options={}){
 const language=options.language||'de',copy=allianceAnalysisCopy(language),locale=LOCALES[language]||LOCALES.de,metric=metrics.includes(options.metric)?options.metric:'power',limit=['10','15','20','30','50','all'].includes(String(options.limit))?String(options.limit):'10';
 const selected=data.selected,comparison=data.comparison?.snapshot,rows=list(data.rows),otherRows=list(data.comparisonRows),snapshots=list(data.snapshots);
 const metricOptions=metrics.map(key=>'<option value="'+key+'" '+(key===metric?'selected':'')+'>'+esc(labels[key])+'</option>').join('');
 const limitOptions=['10','15','20','30','50','all'].map(value=>'<option value="'+value+'" '+(value===limit?'selected':'')+'>'+(value==='all'?esc(copy.all):value)+'</option>').join('');
 return '<div class="native-alliance-analysis" lang="'+esc(language)+'" dir="'+(language==='ar'?'rtl':'ltr')+'"><div class="native-row native-data-heading"><div><h2>'+esc(copy.title)+'</h2><p class="native-muted">'+esc(copy.manualNotice)+'</p></div><button type="button" data-alliance-reload>'+esc(copy.reload)+'</button></div>'+requestForm(copy)+pendingRequests(data,copy)+'<p data-alliance-status role="status" aria-live="polite"></p>'+
  (snapshots.length?'<section class="native-alliance-archive"><h3>'+esc(copy.archive)+'</h3><div class="native-opponent-controls"><label>'+esc(copy.allianceA)+'<select data-alliance-snapshot>'+snapshotOptions(snapshots,selected?.id)+'</select></label><label>'+esc(copy.allianceB)+'<select data-alliance-compare><option value="">—</option>'+snapshotOptions(snapshots,comparison?.id)+'</select></label></div></section>':'')+
  (!selected?'<p class="native-muted">'+esc(copy.noData)+'</p>':'<section class="native-alliance-current"><h3 data-native-no-translate>'+esc(allianceLabel(selected))+'</h3><p class="native-muted">'+esc(selected.report_date)+' · '+esc(selected.row_count)+' '+esc(copy.players)+'</p><div class="native-opponent-analysis-controls"><label>'+esc(copy.metric)+'<select data-alliance-metric>'+metricOptions+'</select></label><label>'+esc(copy.topN)+'<select data-alliance-limit>'+limitOptions+'</select></label></div>'+
   (comparison?comparisonTable(data.comparison.comparison,copy,locale,metric):'')+
   '<div class="native-opponent-player-columns"><section><h3>'+esc(copy.allianceA)+'</h3>'+playerList(rows,'own',metric,limit,copy,locale,otherRows.length>0)+'</section>'+(otherRows.length?'<section><h3>'+esc(copy.allianceB)+'</h3>'+playerList(otherRows,'opponent',metric,limit,copy,locale,rows.length>0)+'</section>':'')+'</div>'+personComparison({ownRows:rows,opponentRows:otherRows},options.playerCompare,copy,locale)+'</section>'+
   '<details class="native-fold native-alliance-evolution"><summary>'+esc(copy.evolution)+'</summary><label>'+esc(copy.compareWith)+'<select data-alliance-previous><option value="">'+esc(copy.current)+'</option>'+snapshotOptions(snapshots.filter(item=>item.opponent_id===selected.opponent_id&&item.id!==selected.id),data.evolution?.snapshot?.id)+'</select></label>'+(data.evolution?comparisonTable(data.evolution.comparison,copy,locale,'power'):'')+'</details>')+
  '</div>';
}
export function createAllianceAnalysisController({root,api,language='de'}={}){
 if(!root||!api)throw new TypeError('Alliance analysis root and API are required');
 let data={},snapshots=[],state={snapshot:null,previous:null,compare:null,metric:'power',limit:'10',playerCompare:null},busy=false;
 const draw=()=>{root.innerHTML=renderAllianceAnalysis({...data,snapshots},{language,metric:state.metric,limit:state.limit,playerCompare:state.playerCompare})};
 const load=async()=>{
  if(busy)return;busy=true;
  try{data=await api.read({snapshot:state.snapshot,previous:state.previous,compare:state.compare});snapshots=[...new Map([...list(data.snapshots),...snapshots].map(item=>[item.id,item])).values()].sort((a,b)=>b.report_date.localeCompare(a.report_date));state.snapshot=data.selected?.id||null;state.playerCompare=null;draw()}catch(error){root.innerHTML='<p class="native-error" role="alert">'+esc(error.message)+'</p><button type="button" data-alliance-reload>'+esc(allianceAnalysisCopy(language).reload)+'</button>'}finally{busy=false}
 };
 root.addEventListener('click',async event=>{
  if(event.target.closest?.('[data-alliance-reload]')){await load();return}
  const button=event.target.closest?.('[data-native-opponent-compare]');if(!button)return;
  const side=button.dataset.nativeOpponentCompare,row=Number(button.dataset.nativeOpponentRow),own=list(data.rows),other=list(data.comparisonRows);
  state.playerCompare={ownRow:side==='own'?row:state.playerCompare?.ownRow??own[0]?.source_row,opponentRow:side==='opponent'?row:state.playerCompare?.opponentRow??other[0]?.source_row};
  if(Number.isSafeInteger(state.playerCompare.ownRow)&&Number.isSafeInteger(state.playerCompare.opponentRow)){draw();root.querySelector('#native-opponent-person-comparison')?.scrollIntoView?.({block:'start'})}
 });
 root.addEventListener('change',async event=>{
  if(event.target.matches('[data-alliance-metric]')){state.metric=event.target.value;draw();return}
  if(event.target.matches('[data-alliance-limit]')){state.limit=event.target.value;draw();return}
  if(event.target.matches('[data-native-opponent-compare-own]')){state.playerCompare={...state.playerCompare,ownRow:Number(event.target.value)};draw();return}
  if(event.target.matches('[data-native-opponent-compare-opponent]')){state.playerCompare={...state.playerCompare,opponentRow:Number(event.target.value)};draw();return}
  if(event.target.matches('[data-alliance-snapshot]')){state.snapshot=event.target.value;state.previous=null;await load();return}
  if(event.target.matches('[data-alliance-compare]')){state.compare=event.target.value||null;await load();return}
  if(event.target.matches('[data-alliance-previous]')){state.previous=event.target.value||null;await load()}
 });
 root.addEventListener('submit',async event=>{
  const request=event.target.closest?.('[data-alliance-request]'),upload=event.target.closest?.('[data-alliance-upload]');if(!request&&!upload)return;
  event.preventDefault();if(busy)return;const form=event.target,status=root.querySelector('[data-alliance-status]'),button=form.querySelector('[type=submit]');busy=true;button.disabled=true;
  try{
   if(request){const receipt=await api.request({alliance_tag:form.elements.alliance_tag.value,alliance_name:form.elements.alliance_name.value,server_number:Number(form.elements.server_number.value),idempotency_key:idem()});state.snapshot=receipt.selected?.id||null;status.textContent=allianceAnalysisCopy(language).requestSent}
   else{const file=form.elements.csv.files?.[0];if(!file||!form.elements.confirmed.checked)return;if(file.size>262144){status.textContent='256 KiB';return}const bytes=await file.arrayBuffer(),receipt=await api.upload(bytes,{requestId:form.elements.request_id.value,reportDate:form.elements.report_date.value,confirmed:true});state.snapshot=receipt.selected?.id||null;status.textContent=allianceAnalysisCopy(language)[receipt.reused?'reused':'uploadSuccess']}
   await load();
  }catch(error){status.textContent=error.message;button.disabled=false}finally{busy=false}
 });
 return{load};
}
