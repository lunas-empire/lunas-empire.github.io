export function renderDataQuality(result,operations,{language='de',esc=String,numberText=String}={}){
 const en=language==='en',text=(de,english)=>en?english:de,e=esc,n=numberText,names=new Map((operations.members||[]).map(member=>[member.id,member.name]));
 const coverage=result.coverage||{},profile=result.sources?.profile,vs=result.sources?.vs,lw=result.sources?.lw;
 const source=(title,value,detail)=>'<article class="native-quality-source"><small>'+e(title)+'</small><strong>'+e(value||'—')+'</strong><span>'+e(detail)+'</span></article>';
 const count=(title,value,action,label)=>value?'<button type="button" class="native-quality-issue" '+(action?action+'="'+label+'"':'')+'><span>'+e(title)+'</span><strong>'+n(value)+'</strong><small>'+text('Öffnen','Open')+'</small></button>':'';
 const anomalies=(result.anomalies||[]).map(item=>'<article class="native-quality-person"><button type="button" data-native-member="'+e(item.member_id)+'"><strong>'+e(names.get(item.member_id)||item.member_id)+'</strong><span>'+e(item.metric)+' · '+n(item.previous_value)+' → '+n(item.current_value)+'</span><small>'+n(item.absolute_change)+text(' Veränderung',' change')+(item.percent_change===null?'':' · '+Math.round(item.percent_change)+'%')+'</small></button></article>').join('');
 const conflicts=(result.registry_conflicts||[]).map(item=>'<button type="button" class="native-quality-person" data-native-member="'+e(item.id)+'"><strong>'+e(names.get(item.id)||item.id)+'</strong><span>'+e(item.status)+' ↔ '+e(item.lifecycle)+'</span><small>'+text('Registry prüfen','Review registry')+'</small></button>').join('');
 return '<section class="native-data-quality"><div class="native-quality-sources">'+
  source(text('Letzte Profilaufnahme','Latest profile capture'),profile?.week,profile?.captured_at||text('Keine','None'))+
  source(text('Letzte VS-Woche','Latest VS week'),vs?.week,vs?.state||text('Keine','None'))+
  source(text('Letzter LW-Import','Latest LW import'),lw?.report_date,lw?.created_at||text('Keiner','None'))+
  (profile&&profile.is_complete===0?'<p class="native-quality-warning">'+text('Neueste Profilaufnahme ist kein vollständiger Roster.','Latest profile capture is not a complete roster.')+'</p>':'')+'</div><div class="native-quality-issues">'+
  count(text('Offene Prüffälle','Open reviews'),coverage.open_reviews,'data-native-action','review-open')+
  count(text('Unbestätigte Aliase','Unverified aliases'),coverage.unverified_aliases,'data-officer-tab','watch')+
  count(text('Unverknüpfte LW-Werte','Unlinked LW observations'),coverage.unmatched_lw,'data-officer-tab','lwImport')+
  count(text('Offene Identitäten im Protokoll','Pending protocol identities'),coverage.pending_protocol,'data-officer-tab','reviews')+
  count(text('Generische Logbeobachtungen','Unclassified log observations'),coverage.generic_protocol,'data-officer-tab','events')+
  (coverage.incomplete_days?.length?'<article class="native-quality-incomplete"><strong>'+text('Unbestätigte Tageswerte','Unconfirmed daily values')+'</strong><span>'+coverage.incomplete_days.map(day=>text('Tag ','Day ')+(day.weekday+1)+': '+n(day.n)).join(' · ')+'</span></article>':'')+'</div>'+
  (anomalies?'<section class="native-quality-anomalies"><h3>'+text('Auffällige Wertänderungen','Notable value changes')+'</h3><p class="native-muted">'+text('Nur als Quellenhinweis, keine automatische Korrektur.','Source indicators only; no automatic correction.')+'</p>'+anomalies+'</section>':'')+
  (conflicts?'<section class="native-quality-anomalies"><h3>'+text('Registry-Konflikte','Registry conflicts')+'</h3>'+conflicts+'</section>':'')+
  (!anomalies&&!conflicts?'<p class="native-muted">'+text('Keine Sprungwerte oder Registry-Konflikte erkannt.','No value jumps or registry conflicts detected.')+'</p>':'')+'</section>';
}
