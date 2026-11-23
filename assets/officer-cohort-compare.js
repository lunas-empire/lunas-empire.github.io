const activeMembers=data=>(data.members||[]).filter(member=>member.status!=='former');
const median=values=>{
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[middle]:Math.round((sorted[middle-1]+sorted[middle])/2);
};
const total=values=>values.reduce((sum,value)=>sum+value,0);
const ratio=(met,known)=>known?Math.round(met/known*100):null;

export function memberCohortStats(memberId,data={}){
 const stats={vsMet:0,vsKnown:0,donationMet:0,donationKnown:0,power:null,kills:null};
 for(const week of data.vs?.weeks||[]){
  if(week.state!=='final')continue;
  for(const person of week.members||[]){
   if(person.id!==memberId||person.former===true)continue;
   for(const day of person.days||[]){
    if(!day.verified||!Number.isSafeInteger(day.points))continue;
    stats.vsKnown++;if(day.passed===true||(day.passed===undefined&&day.points>=week.threshold))stats.vsMet++;
   }
  }
 }
 for(const week of data.donations?.weeks||[]){
  for(const person of week.members||[]){
   if(person.id!==memberId||!Number.isSafeInteger(person.points))continue;
   stats.donationKnown++;if(person.status==='met')stats.donationMet++;
  }
 }
 const member=activeMembers(data).find(item=>item.id===memberId);
 if(member){
  if(Number.isSafeInteger(member.power))stats.power=member.power;
  if(Number.isSafeInteger(member.kills))stats.kills=member.kills;
 }
 return stats;
}

export function summarizeCohort(ids,data={}){
 const selected=new Set(ids),members=activeMembers(data).filter(member=>selected.has(member.id)),stats=members.map(member=>memberCohortStats(member.id,data));
 const sum=key=>stats.reduce((value,item)=>value+item[key],0),values=key=>stats.map(item=>item[key]).filter(Number.isSafeInteger);
 return {size:members.length,vs:{met:sum('vsMet'),known:sum('vsKnown'),percent:ratio(sum('vsMet'),sum('vsKnown'))},
  donations:{met:sum('donationMet'),known:sum('donationKnown'),percent:ratio(sum('donationMet'),sum('donationKnown'))},
  power:{known:values('power').length,total:total(values('power')),median:median(values('power'))},
  kills:{known:values('kills').length,total:total(values('kills')),median:median(values('kills'))}};
}

export function renderCohortCompare(data={},state={},options={}){
 const {language='de',esc=String,numberText=String}=options,en=language==='en',text=(de,english)=>en?english:de,e=esc,n=numberText;
 const selection={A:state.A||[],B:state.B||[]},members=activeMembers(data),query=String(state.query||'').toLocaleLowerCase();
 const stats=new Map(members.map(member=>[member.id,memberCohortStats(member.id,data)]));
 const filtered=members.filter(member=>!query||member.name.toLocaleLowerCase().includes(query)).sort((a,b)=>{
  const mode=state.sort||'name';
  if(mode==='rank')return String(a.rank).localeCompare(String(b.rank))||a.name.localeCompare(b.name);
  if(mode==='problem')return ((stats.get(a.id).vsMet/Math.max(1,stats.get(a.id).vsKnown))-(stats.get(b.id).vsMet/Math.max(1,stats.get(b.id).vsKnown)))||a.name.localeCompare(b.name);
  if(mode==='donations')return (stats.get(b.id).donationMet-stats.get(a.id).donationMet)||a.name.localeCompare(b.name);
  if(mode==='power')return ((stats.get(b.id).power??-1)-(stats.get(a.id).power??-1))||a.name.localeCompare(b.name);
  return a.name.localeCompare(b.name);
 });
 const groupCard=key=>{
  const summary=summarizeCohort(selection[key],data),percent=value=>value===null?'—':n(value)+'%';
  return '<section class="native-cohort-summary"><h3>'+key+' · '+n(summary.size)+' '+text('Mitglieder','members')+'</h3>'+
   '<dl><div><dt>'+text('VS-Zieltage','VS goal days')+'</dt><dd>'+n(summary.vs.met)+'/'+n(summary.vs.known)+' · '+percent(summary.vs.percent)+'</dd></div>'+
   '<div><dt>'+text('Spendenziel','Donation goal')+'</dt><dd>'+n(summary.donations.met)+'/'+n(summary.donations.known)+' · '+percent(summary.donations.percent)+'</dd></div>'+
   '<div><dt>'+text('Stärke · bestätigt','Power · confirmed')+'</dt><dd>'+n(summary.power.total)+' · '+n(summary.power.known)+'</dd></div>'+
   '<div><dt>'+text('Kills · bestätigt','Kills · confirmed')+'</dt><dd>'+n(summary.kills.total)+' · '+n(summary.kills.known)+'</dd></div></dl>'+
   (summary.size&&summary.size<3?'<p class="native-cohort-warning">'+text('Kleine Gruppe: nur eingeschränkt vergleichbar.','Small group: comparison is limited.')+'</p>':'')+
   '<div class="native-cohort-people">'+selection[key].map(id=>{const member=members.find(item=>item.id===id);return member?'<button type="button" data-native-member="'+e(id)+'">'+e(member.name)+'</button>':''}).join('')+'</div></section>';
 };
 const picker=filtered.map(member=>'<div class="native-cohort-row"><span><strong>'+e(member.name)+'</strong><small>'+e(member.rank)+' · VS '+n(stats.get(member.id).vsMet)+'/'+n(stats.get(member.id).vsKnown)+'</small></span>'+
  '<button type="button" data-cohort-pick="A:'+e(member.id)+'" aria-pressed="'+selection.A.includes(member.id)+'">A</button>'+
  '<button type="button" data-cohort-pick="B:'+e(member.id)+'" aria-pressed="'+selection.B.includes(member.id)+'">B</button></div>').join('');
 return '<section class="native-cohort-compare"><div class="native-cohort-toolbar"><button type="button" data-native-cohort-close>'+text('Schließen','Close')+'</button><label>'+text('Sortieren','Sort')+'<select id="native-cohort-sort">'+[['name','Name'],['rank','Rang'],['problem','VS-Probleme'],['donations','Spenden'],['power','Stärke']].map(([value,label])=>'<option value="'+value+'" '+(state.sort===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label></div>'+
  '<div class="native-cohort-summaries">'+groupCard('A')+groupCard('B')+'</div><details class="native-fold native-cohort-picker"><summary>'+text('Mitglieder auswählen','Select members')+'</summary><div class="native-fold-body"><label>'+text('Suchen','Search')+'<input id="native-cohort-search" type="search" value="'+e(state.query||'')+'" autocomplete="off"></label><div class="native-cohort-list">'+picker+'</div></div></details>'+
  '<p class="native-muted">'+text('Nur bestätigte Werte derselben aktiven IDs. Unbekannte Werte erhöhen weder Zähler noch Nenner; keine automatische Bewertung.','Confirmed values for the same active IDs only. Unknown values affect neither numerator nor denominator; no automatic scoring.')+'</p></section>';
}
