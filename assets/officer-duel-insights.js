const official=match=>match.status==='final'&&['win','loss','tie'].includes(match.official_result)&&match.verification_status!=='unconfirmed';

export function buildDuelInsights(data={}){
 const matches=(data.matches||[]).filter(official),opponents=new Map(),days=Array.from({length:6},(_,index)=>({day_index:index+1,our_score:0,opponent_score:0,known:0,wins:0,losses:0,ties:0,evidence_ids:[]}));
 for(const match of matches){
  const id=match.opponent_id||match.opponent_tag_snapshot+'|'+match.opponent_server_snapshot;
  if(!opponents.has(id))opponents.set(id,{id,name:match.opponent_name_snapshot,tag:match.opponent_tag_snapshot,server:match.opponent_server_snapshot,matches:0,wins:0,losses:0,ties:0,weeks:[]});
  const opponent=opponents.get(id);opponent.matches++;opponent[match.official_result==='win'?'wins':match.official_result==='loss'?'losses':'ties']++;opponent.weeks.push(match.iso_week);
  for(const day of match.days||[]){
   if(!['win','loss','tie'].includes(day.result)||day.verification_status==='unknown')continue;
   const target=days[day.day_index-1];if(!target)continue;
   target.known++;target[day.result==='win'?'wins':day.result==='loss'?'losses':'ties']++;
   if(Number.isSafeInteger(day.our_score))target.our_score+=day.our_score;
   if(Number.isSafeInteger(day.opponent_score))target.opponent_score+=day.opponent_score;
   if(day.evidence_id)target.evidence_ids.push(day.evidence_id);
  }
 }
 return {summary:{matches:matches.length,wins:matches.filter(match=>match.official_result==='win').length,losses:matches.filter(match=>match.official_result==='loss').length,ties:matches.filter(match=>match.official_result==='tie').length},
  opponents:[...opponents.values()].sort((a,b)=>b.matches-a.matches||a.name.localeCompare(b.name)),days};
}

export function renderDuelInsights(data={},options={}){
 const {language='de',esc=String,numberText=String}=options,en=language==='en',text=(de,english)=>en?english:de,e=esc,n=numberText,insights=buildDuelInsights(data);
 if(!insights.summary.matches)return '<section class="native-duel-insights"><h3>'+text('Gegner- & Duellverlauf','Opponent & duel history')+'</h3><p class="native-muted">'+text('Noch keine bestätigten finalen Matches. Unbestätigte OCR-Aufnahmen werden nicht ausgewertet.','No confirmed final matches yet. Unconfirmed OCR captures are not analyzed.')+'</p><button type="button" data-native-dl-scroll-entry>'+text('Erfassung öffnen','Open capture')+'</button></section>';
 return '<section class="native-duel-insights"><h3>'+text('Gegner- & Duellverlauf','Opponent & duel history')+'</h3><div class="native-duel-insight-counts">'+[['Matches',insights.summary.matches],[text('Siege','Wins'),insights.summary.wins],[text('Niederlagen','Losses'),insights.summary.losses],[text('Unentschieden','Ties'),insights.summary.ties]].map(([label,value])=>'<article><small>'+e(label)+'</small><strong>'+n(value)+'</strong></article>').join('')+'</div>'+
  '<div class="native-duel-opponents">'+insights.opponents.map(opponent=>'<article><span><strong>['+e(opponent.tag)+'] '+e(opponent.name)+'</strong><small>#'+e(opponent.server)+' · '+opponent.weeks.map(e).join(', ')+'</small></span><span>'+n(opponent.wins)+' / '+n(opponent.losses)+' / '+n(opponent.ties)+'<small>'+text('S / N / U','W / L / T')+'</small></span></article>').join('')+'</div>'+
  '<div class="native-duel-day-insights">'+insights.days.map(day=>'<article><strong>'+text('Tag','Day')+' '+n(day.day_index)+'</strong><span>'+n(day.wins)+' / '+n(day.losses)+' / '+n(day.ties)+'<small>'+text('S / N / U · bestätigt','W / L / T · confirmed')+'</small></span><span>'+n(day.our_score)+' : '+n(day.opponent_score)+'</span>'+day.evidence_ids.map(id=>'<button type="button" data-native-dl-evidence="'+e(id)+'">'+text('Beleg','Evidence')+'</button>').join('')+'</article>').join('')+'</div>'+
  '<p class="native-muted">'+text('Nur final bestätigte Matches und bestätigte Tageswerte. Keine Prognose.','Confirmed final matches and confirmed daily values only. No prediction.')+'</p></section>';
}
