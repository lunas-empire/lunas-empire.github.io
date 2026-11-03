/** Native duel-league UI. Authentication and transport remain owned by native-admin.js. */
import {duelCopy,duelEnumLabel} from './native-duel-league-i18n.js';
export const DUEL_DAY_WEIGHTS=Object.freeze([1,2,2,2,2,4]);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const list=value=>Array.isArray(value)?value:[];
const text=value=>value==null||String(value).trim()===''?null:String(value).trim();
const integer=value=>value==null||value===''?null:(Number.isSafeInteger(Number(value))?Number(value):null);
const enumText=(value,copy)=>duelEnumLabel(copy,value);
const enumOptions=(values,copy,selected='')=>values.map(value=>'<option value="'+value+'" '+(selected===value?'selected':'')+'>'+esc(enumText(value,copy))+'</option>').join('');
const resultOptions=(copy,selected='unknown',includeUpcoming=false)=>enumOptions(['unknown','win','loss','tie',...(includeUpcoming?['upcoming']:[])],copy,selected);
const valueText=(value,copy)=>value==null?'<span class="native-dl-unknown">'+esc(copy.unknown)+'</span>':esc(value);
const iso=value=>value?new Date(value).toISOString():null;
const fill=(form,name,value)=>{const field=form.elements[name];if(field)field.value=value??''};
const idempotency=cryptoRef=>'duel-'+cryptoRef.randomUUID();

function normalizeDay(source={},index=0){return {day_index:integer(source.day_index)??index+1,vp_weight:integer(source.vp_weight)??DUEL_DAY_WEIGHTS[index],our_score:integer(source.our_score),opponent_score:integer(source.opponent_score),result:text(source.result)||'unknown',evidence_id:text(source.evidence_id)}}
function normalizeMatch(source={}){const supplied=list(source.days);return {...source,iso_week:text(source.iso_week),revision:integer(source.revision)??0,opponent_tag_snapshot:text(source.opponent_tag_snapshot),opponent_name_snapshot:text(source.opponent_name_snapshot),opponent_server_snapshot:integer(source.opponent_server_snapshot),interim_our_wins:integer(source.interim_our_wins),interim_opponent_wins:integer(source.interim_opponent_wins),days:DUEL_DAY_WEIGHTS.map((_,index)=>normalizeDay(supplied.find(day=>day.day_index===index+1),index))}}
function normalizeSnapshot(source={}){return {...source,rows:list(source.rows).map(row=>({...row,week_results:[row.week1_result??'unknown',row.week2_result??'unknown',row.week3_result??'unknown',row.week4_result??'unknown']}))}}
function normalizeProposal(source={}){return {...source,evidence_ids:list(source.evidence_ids),proposal:source.proposal&&typeof source.proposal==='object'?source.proposal:{}}}
export function normalizeDuelLeague(source={}){
 const matches=list(source.matches).map(normalizeMatch),leagues=list(source.leagues),snapshots=list(source.snapshots).map(normalizeSnapshot);
 return {day_weights:list(source.day_weights),total_weight:integer(source.total_weight),matches,leagues,snapshots,evidence:list(source.evidence),capture_sessions:list(source.capture_sessions),proposals:list(source.proposals).map(normalizeProposal)};
}
function evidenceButton(id,copy){return id?'<button type="button" class="native-dl-evidence-link" data-native-dl-evidence="'+esc(id)+'">'+esc(copy.viewEvidence)+'</button>':''}
function dayTable(match,copy){return '<div class="native-dl-days" role="table" aria-label="'+esc(copy.days)+'"><div class="native-dl-day native-dl-day-head" role="row"><span>'+esc(copy.days)+'</span><span>'+esc(copy.weight)+'</span><span>'+esc(copy.ours)+'</span><span>'+esc(copy.theirs)+'</span><span>'+esc(copy.dayResult)+'</span></div>'+match.days.map((day,index)=>'<div class="native-dl-day" role="row"><strong>'+esc(copy.dayNames[index])+'</strong><span>×'+day.vp_weight+'</span><span>'+valueText(day.our_score,copy)+'</span><span>'+valueText(day.opponent_score,copy)+'</span><span>'+esc(enumText(day.result||'unknown',copy))+evidenceButton(day.evidence_id,copy)+'</span></div>').join('')+'</div>'}
function matchCard(match,copy,open=false){return '<details class="native-fold native-dl-match" '+(open?'open':'')+'><summary><span><strong>'+esc(match.iso_week||copy.unknown)+'</strong> · ['+esc(match.opponent_tag_snapshot||copy.unknown)+'] '+esc(match.opponent_name_snapshot||copy.unknown)+' · #'+esc(match.opponent_server_snapshot??copy.unknown)+'</span><span>'+valueText(match.interim_our_wins,copy)+':'+valueText(match.interim_opponent_wins,copy)+' · '+esc(enumText(match.status||'unknown',copy))+'</span></summary><div class="native-fold-body">'+(match.interim_our_wins===1&&match.interim_opponent_wins===0&&match.status!=='final'?'<p class="native-evidence-note">'+esc(copy.interimScore)+'</p>':'')+dayTable(match,copy)+'</div></details>'}
function snapshotCard(snapshot,copy){return '<details class="native-fold native-dl-league"><summary><strong>'+esc(enumText(snapshot.coverage_status||'unknown',copy))+'</strong><span>'+esc(snapshot.captured_at||copy.unknown)+' · '+esc(copy.round)+' '+esc(snapshot.league_round??copy.unknown)+'</span></summary><div class="native-fold-body">'+(snapshot.rows.length?snapshot.rows.map(row=>'<div class="native-row"><strong>'+esc(row.rank_number)+'. ['+esc(row.alliance_tag)+'] '+esc(row.alliance_name||copy.unknown)+'</strong><span>#'+esc(row.server_number??copy.unknown)+' · '+row.week_results.map(value=>esc(enumText(value,copy))).join(' / ')+'</span>'+evidenceButton(row.evidence_id,copy)+'</div>').join(''):'<p class="native-muted">'+esc(copy.noSnapshots)+'</p>')+'</div></details>'}
const input=(name,label,type='text',extra='')=>'<label>'+esc(label)+'<input type="'+type+'" name="'+name+'" '+extra+'></label>';
function dayInputs(copy){return DUEL_DAY_WEIGHTS.map((weight,index)=>'<div class="native-dl-day-edit"><strong>'+esc(copy.dayNames[index])+' ×'+weight+'</strong>'+input('our_score_'+(index+1),copy.ourScore,'number','min="0" step="1"')+input('opponent_score_'+(index+1),copy.opponentScore,'number','min="0" step="1"')+'<label>'+esc(copy.dayResult)+'<select name="result_'+(index+1)+'">'+resultOptions(copy)+'</select></label></div>').join('')}
function matchForm(copy){return '<details class="native-fold native-dl-entry"><summary>'+esc(copy.manual)+'</summary><form class="native-form native-dl-match-form"><input type="hidden" name="proposal_id"><input type="hidden" name="evidence_ids" value="[]">'+input('iso_week',copy.week,'text','required pattern="20[0-9]{2}-W[0-9]{2}" placeholder="2026-W43"')+input('revision',copy.revision,'number','required min="0" value="0"')+input('reason',copy.reason,'text','required minlength="8" maxlength="500"')+input('cycle_label',copy.cycle,'text','required placeholder="S38"')+input('starts_week',copy.starts,'text','required pattern="20[0-9]{2}-W[0-9]{2}" placeholder="2026-W43"')+input('ends_week',copy.ends,'text','required pattern="20[0-9]{2}-W[0-9]{2}" placeholder="2026-W46"')+'<label>'+esc(copy.tier)+'<select name="tier">'+enumOptions(['silver','gold','diamond','unknown'],copy,'silver')+'</select></label>'+input('raw_tier_label',copy.rawTier)+input('league_round',copy.round,'number','required min="1" max="4" value="1"')+input('opponent_tag',copy.tag,'text','required minlength="2" maxlength="12"')+input('opponent_name',copy.name,'text','required minlength="2" maxlength="120"')+input('server_number',copy.server,'number','required min="1" max="99999"')+'<label>'+esc(copy.status)+'<select name="status">'+enumOptions(['live','scheduled','unverified','final'],copy,'live')+'</select></label><label>'+esc(copy.officialResult)+'<select name="official_result"><option value="">—</option>'+enumOptions(['win','loss','tie'],copy)+'</select></label>'+input('interim_our_wins',copy.ourWins,'number','min="0" max="6"')+input('interim_opponent_wins',copy.opponentWins,'number','min="0" max="6"')+'<fieldset><legend>'+esc(copy.days)+' · '+esc(copy.weight)+' 1, 2, 2, 2, 2, 4</legend><div class="native-dl-day-editor">'+dayInputs(copy)+'</div></fieldset><button type="submit">'+esc(copy.saveMatch)+'</button><p role="status" aria-live="polite"></p></form></details>'}
function rankRow(copy,row={}){const results=row.week_results||['unknown','upcoming','upcoming','upcoming'];return '<div class="native-dl-rank-row" data-native-dl-rank-row>'+input('rank_number',copy.rank,'number','required min="1" max="100" value="'+esc(row.rank_number??'')+'"')+input('alliance_tag',copy.tag,'text','required minlength="2" maxlength="12" value="'+esc(row.alliance_tag??'')+'"')+input('alliance_name',copy.name,'text','value="'+esc(row.alliance_name??'')+'"')+input('server_number',copy.server,'number','min="1" max="99999" value="'+esc(row.server_number??'')+'"')+[0,1,2,3].map(index=>'<label>'+esc(copy.weekResult)+' '+(index+1)+'<select name="week_'+(index+1)+'">'+resultOptions(copy,results[index],true)+'</select></label>').join('')+'</div>'}
function snapshotForm(copy){return '<details class="native-fold native-dl-entry"><summary>'+esc(copy.snapshotInput)+'</summary><form class="native-form native-dl-snapshot-form"><input type="hidden" name="proposal_id"><input type="hidden" name="evidence_ids" value="[]">'+input('cycle_label',copy.cycle,'text','required placeholder="S38"')+input('league_round',copy.round,'number','required min="1" max="4" value="1"')+input('captured_at',copy.captured,'datetime-local','required')+input('reason',copy.reason,'text','required minlength="8" maxlength="500"')+input('expected_rank_count',copy.expectedRanks,'number','required min="1" max="100" value="16"')+'<label><input type="checkbox" name="official_snapshot"> '+esc(copy.officialSnapshot)+'</label><label>'+esc(copy.officialOutcome)+'<select name="official_outcome"><option value="">—</option>'+enumOptions(['promoted','retained','relegated','unknown'],copy)+'</select></label><div data-native-dl-rank-rows>'+rankRow(copy)+'</div><button type="button" data-native-dl-add-rank>+</button><button type="submit">'+esc(copy.saveSnapshot)+'</button><p role="status" aria-live="polite"></p></form></details>'}
function captureCards(data,language){
 const de=language==='de',sessions=list(data.capture_sessions);
 const title=de?'Aufnahmen von Zentrale':'Captures from Zentrale';
 const intro=de?'Duell und Liga werden am Aufnahme-PC erfasst. Originalbilder bleiben dort; hier erscheinen ausschließlich OCR-Ergebnisse.':'Duel and League are captured on the game PC. Original images stay there; only OCR results appear here.';
 const empty=de?'Noch keine Zentrale-Aufnahme eingegangen.':'No device capture received yet.';
 return '<section class="native-dl-captures"><h3>'+esc(title)+'</h3><p class="native-muted">'+esc(intro)+'</p>'+
 (sessions.length?sessions.map(item=>{
  const parsed=item.parsed||{},duel=item.kind==='duel',review=item.agreement!=='agreed';
  const heading=duel?(de?'Duell':'Duel'):(de?'Liga':'League');
  const detail=duel?(parsed.opponent?'['+parsed.opponent.tag+'] '+parsed.opponent.name+' · '+(parsed.interim_our_wins??'?')+':'+(parsed.interim_opponent_wins??'?'):'Gegner / Spielstand unbekannt'):
   ((parsed.rows||[]).length+' '+(de?'Rangzeilen':'rank rows')+' · '+(parsed.coverage_status||'partial'));
  return '<details class="native-fold native-dl-capture"><summary><strong>'+esc(heading)+' · '+esc(item.scope_key)+'</strong><span>'+
   esc(review?(de?'OCR-Prüfung nötig':'OCR review required'):(de?'OCR-Abgleich stimmt überein':'Independent OCR agrees'))+
   '</span></summary><div class="native-fold-body"><p>'+esc(detail)+'</p><p class="native-muted">'+
   esc(item.source_count)+' '+esc(de?'Bilder lokal auf Zentrale':'images local to Zentrale')+' · '+
   esc(item.captured_at||'')+'</p><p class="native-evidence-note">'+
   esc(de?'Nicht offiziell bestätigt. Kein automatisches Finalisieren oder Überschreiben.':'Unconfirmed observation. No automatic finalization or overwrites.')+
   '</p><button type="button" data-native-dl-review-capture="'+esc(item.idempotency_key)+'">'+esc(de?'OCR-Werte prüfen':'Review OCR values')+'</button></div></details>';
 }).join(''):'<p class="native-muted">'+esc(empty)+'</p>')+'</section>';
}
function proposalCards(data,copy){
 const pending=data.proposals.filter(item=>item.status==='pending');
 if(!pending.length)return '';
 return '<section class="native-dl-proposals"><h3>'+esc(copy.ocr)+'</h3>'+
  pending.map(item=>'<article class="native-dl-proposal"><strong>'+esc(enumText(item.proposal_kind,copy))+
  ' · '+esc(item.scope_key)+'</strong><span>'+item.evidence_ids.map(id=>evidenceButton(id,copy)).join('')+
  '</span><button type="button" data-native-dl-review-proposal="'+esc(item.id)+'">'+esc(copy.review)+'</button></article>').join('')+'</section>';
}
export function renderDuelLeague(source={},language='de'){
 const copy=duelCopy(language),data=normalizeDuelLeague(source),current=data.matches[0],lang=language in {de:1,en:1,uk:1,ja:1,fr:1,it:1,id:1,ar:1,ko:1,sv:1,pt:1,nl:1,th:1,km:1,fil:1}?language:'de';
 return '<div class="native-dl" lang="'+lang+'" dir="'+(lang==='ar'?'rtl':'ltr')+'"><div class="native-row native-data-heading"><div><h2>'+esc(copy.title)+'</h2><p class="native-muted">'+esc(copy.intro)+'</p></div><button type="button" data-native-dl-reload>'+esc(copy.reload)+'</button></div><p class="native-muted">'+esc(copy.noPrediction)+'</p><section><h3>'+esc(copy.current)+'</h3>'+(current?matchCard(current,copy,true):'<p class="native-muted">'+esc(copy.noDuel)+'</p>')+'</section><section><h3>'+esc(copy.history)+'</h3>'+(data.matches.slice(1).length?data.matches.slice(1).map(item=>matchCard(item,copy)).join(''):'<p class="native-muted">'+esc(copy.noDuel)+'</p>')+'</section><section><h3>'+esc(copy.league)+'</h3>'+(data.leagues.length?data.leagues.map(league=>'<details class="native-fold"><summary><strong>'+esc(league.cycle_label)+'</strong><span>'+esc(enumText(league.tier,copy))+' · '+esc(league.starts_week)+'–'+esc(league.ends_week)+'</span></summary><div class="native-fold-body"><h4>'+esc(copy.snapshots)+'</h4>'+(data.snapshots.filter(snapshot=>snapshot.league_id===league.id).map(snapshot=>snapshotCard(snapshot,copy)).join('')||'<p class="native-muted">'+esc(copy.noSnapshots)+'</p>')+'</div></details>').join(''):'<p class="native-muted">'+esc(copy.noLeagues)+'</p>')+'</section>'+captureCards(data,language)+'<div class="native-dl-inputs">'+matchForm(copy)+snapshotForm(copy)+'</div>'+proposalCards(data,copy)+'<section class="native-dl-evidence" aria-live="polite"></section></div>';
}
export function matchPayload(form,keyFactory=()=>idempotency(globalThis.crypto)){
 const status=form.elements.status.value,official=text(form.elements.official_result.value),evidenceIds=JSON.parse(form.elements.evidence_ids.value||'[]');
 const payload={idempotency_key:keyFactory(),iso_week:text(form.elements.iso_week.value),revision:integer(form.elements.revision.value),reason:text(form.elements.reason.value),league:{cycle_label:text(form.elements.cycle_label.value),starts_week:text(form.elements.starts_week.value),ends_week:text(form.elements.ends_week.value),tier:form.elements.tier.value,raw_tier_label:text(form.elements.raw_tier_label.value)},league_round:integer(form.elements.league_round.value),opponent:{tag:text(form.elements.opponent_tag.value),name:text(form.elements.opponent_name.value),server_number:integer(form.elements.server_number.value)},status,official_result:status==='final'?official:null,interim_our_wins:integer(form.elements.interim_our_wins.value),interim_opponent_wins:integer(form.elements.interim_opponent_wins.value),days:DUEL_DAY_WEIGHTS.map((vp_weight,index)=>({day_index:index+1,vp_weight,our_score:integer(form.elements['our_score_'+(index+1)].value),opponent_score:integer(form.elements['opponent_score_'+(index+1)].value),result:form.elements['result_'+(index+1)].value,...(evidenceIds.length?{evidence_id:evidenceIds[Math.min(index,evidenceIds.length-1)]}:{})}))};
 const proposal=text(form.elements.proposal_id.value);if(proposal)payload.proposal_id=proposal;return payload;
}
export function snapshotPayload(form,keyFactory=()=>idempotency(globalThis.crypto)){
 const rows=[...form.querySelectorAll('[data-native-dl-rank-row]')].map(row=>({rank_number:integer(row.querySelector('[name=rank_number]').value),alliance_tag:text(row.querySelector('[name=alliance_tag]').value),alliance_name:text(row.querySelector('[name=alliance_name]').value),server_number:integer(row.querySelector('[name=server_number]').value),week_results:[1,2,3,4].map(index=>row.querySelector('[name=week_'+index+']').value)}));
 const official=form.elements.official_snapshot.checked,payload={idempotency_key:keyFactory(),cycle_label:text(form.elements.cycle_label.value),league_round:integer(form.elements.league_round.value),captured_at:iso(form.elements.captured_at.value),reason:text(form.elements.reason.value),expected_rank_count:integer(form.elements.expected_rank_count.value),official_snapshot:official,official_outcome:official?(text(form.elements.official_outcome.value)||'unknown'):null,evidence_ids:JSON.parse(form.elements.evidence_ids.value||'[]'),rows};
 const proposal=text(form.elements.proposal_id.value);if(proposal)payload.proposal_id=proposal;return payload;
}
function applyMatchProposal(form,item){const proposal=item.proposal||{};fill(form,'proposal_id',item.id);fill(form,'evidence_ids',JSON.stringify(item.evidence_ids));fill(form,'iso_week',item.scope_key);fill(form,'opponent_tag',proposal.opponent?.tag);fill(form,'opponent_name',proposal.opponent?.name);fill(form,'server_number',proposal.opponent?.server_number);fill(form,'status',proposal.status||'live');fill(form,'official_result',proposal.official_result);fill(form,'interim_our_wins',proposal.interim_our_wins);fill(form,'interim_opponent_wins',proposal.interim_opponent_wins);for(const [index,day] of list(proposal.days).entries()){fill(form,'our_score_'+(index+1),day.our_score);fill(form,'opponent_score_'+(index+1),day.opponent_score);fill(form,'result_'+(index+1),day.result||'unknown')}}
function applySnapshotProposal(form,item,copy){const proposal=item.proposal||{};fill(form,'proposal_id',item.id);fill(form,'evidence_ids',JSON.stringify(item.evidence_ids));fill(form,'cycle_label',proposal.cycle_label||item.scope_key);const container=form.querySelector('[data-native-dl-rank-rows]');container.innerHTML=list(proposal.rows).map(row=>rankRow(copy,row)).join('')||rankRow(copy)}
export function createDuelLeagueController({root,api,language='de',cryptoRef=globalThis.crypto}={}){
 if(!root||!api)throw new TypeError('Duel & League root and API are required');const copy=duelCopy(language);let objectUrl='',data=normalizeDuelLeague({});
 const status=(node,message,error=false)=>{if(node){node.textContent=message;node.classList.toggle('native-error',error)}};
 const errorMessage=(error,fallback)=>error?.localized?error.message:fallback;
 const load=async()=>{root.innerHTML='<p role="status">'+esc(copy.loading)+'</p>';try{data=normalizeDuelLeague(await api.read());root.innerHTML=renderDuelLeague(data,language)}catch(error){root.innerHTML='<p class="native-error" role="alert">'+esc(errorMessage(error,copy.readError))+'</p><button type="button" data-native-dl-reload>'+esc(copy.reload)+'</button>'}};
 const save=async(form,call,payload)=>{const output=form.querySelector('[role=status]'),button=form.querySelector('[type=submit]');button.disabled=true;status(output,copy.saving);try{await call(payload);await load()}catch(error){status(output,errorMessage(error,copy.writeError),true);button.disabled=false}};
 root.addEventListener('click',async event=>{
  if(event.target.closest?.('[data-native-dl-reload]')){await load();return}
  if(event.target.closest?.('[data-native-dl-add-rank]')){const form=event.target.closest('form');form.querySelector('[data-native-dl-rank-rows]').insertAdjacentHTML('beforeend',rankRow(copy));return}
  const capture=event.target.closest?.('[data-native-dl-review-capture]');
  if(capture){
   const item=data.capture_sessions.find(row=>row.idempotency_key===capture.dataset.nativeDlReviewCapture);
   if(!item)return;
   const proposal=item.parsed||{},duel=item.kind==='duel';
   const form=root.querySelector(duel?'.native-dl-match-form':'.native-dl-snapshot-form');
   if(!form)return;
   if(duel){
    fill(form,'iso_week',item.scope_key);fill(form,'opponent_tag',proposal.opponent?.tag);
    fill(form,'opponent_name',proposal.opponent?.name);
    fill(form,'server_number',proposal.opponent?.server_number);
    fill(form,'interim_our_wins',proposal.interim_our_wins);
    fill(form,'interim_opponent_wins',proposal.interim_opponent_wins);
    fill(form,'status','unverified');fill(form,'official_result','');
   }else{
    fill(form,'cycle_label',item.scope_key);
    const instant=new Date(item.captured_at);
    if(!Number.isNaN(instant.valueOf()))fill(form,'captured_at',new Date(instant.getTime()-instant.getTimezoneOffset()*60000).toISOString().slice(0,16));
    const rows=list(proposal.rows);
    if(rows.length){
     fill(form,'expected_rank_count',Math.max(...rows.map(row=>row.rank_number)));
     form.querySelector('[data-native-dl-rank-rows]').innerHTML=rows.map(row=>rankRow(copy,row)).join('');
    }
    form.elements.official_snapshot.checked=false;
   }
   form.closest('details').open=true;form.scrollIntoView?.({block:'start'});
   return;
  }
  const review=event.target.closest?.('[data-native-dl-review-proposal]');if(review){const item=data.proposals.find(proposal=>proposal.id===review.dataset.nativeDlReviewProposal);if(!item)return;const selector=item.proposal_kind==='match_week'?'.native-dl-match-form':'.native-dl-snapshot-form',form=root.querySelector(selector);if(item.proposal_kind==='match_week')applyMatchProposal(form,item);else applySnapshotProposal(form,item,copy);form.closest('details').open=true;form.scrollIntoView?.({block:'start'});return}
   const evidence=event.target.closest?.('[data-native-dl-evidence]');if(evidence){const area=root.querySelector('.native-dl-evidence');status(area,copy.loading);try{const blob=await api.loadEvidence(evidence.dataset.nativeDlEvidence);if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(blob);area.innerHTML='<div class="native-fold"><button type="button" data-native-dl-evidence-close>'+esc(copy.closeEvidence)+'</button><img src="'+esc(objectUrl)+'" alt="'+esc(copy.evidence)+'"></div>'}catch(error){status(area,errorMessage(error,copy.readError),true)}return}
  if(event.target.closest?.('[data-native-dl-evidence-close]')){if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl='';root.querySelector('.native-dl-evidence').innerHTML=''}
 });
 root.addEventListener('submit',async event=>{
  const form=event.target;if(!form.matches('.native-dl-match-form,.native-dl-snapshot-form'))return;event.preventDefault();if(!form.reportValidity()){status(form.querySelector('[role=status]'),copy.required,true);return}
  if(form.matches('.native-dl-match-form')){const payload=matchPayload(form,()=>idempotency(cryptoRef));if(payload.status==='final'&&!['win','loss','tie'].includes(payload.official_result)){status(form.querySelector('[role=status]'),copy.required,true);return}await save(form,api.saveMatch,payload);return}
  if(form.matches('.native-dl-snapshot-form')){await save(form,api.saveLeagueSnapshot,snapshotPayload(form,()=>idempotency(cryptoRef)));return}

 });
 return {load,destroy(){if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=''}};
}
