const metricKeys=['power','kills','donations_weekly'];
const emptyMetric=()=>({verified:0,coverage:0,total:null,median:null});
const byWeek=(items,key='week')=>new Map((items||[]).map(item=>[item[key],item]));

export function buildAllianceTrendSeries(trends={},vs={},range='all'){
 const profile=byWeek(trends.weeks),duel=byWeek(vs.weeks),labels=[...new Set([...profile.keys(),...duel.keys()])].sort();
 const points=labels.map(week=>{
  const profileWeek=profile.get(week),vsWeek=duel.get(week),days=vsWeek?.dayTotals||[];
  const met=days.reduce((sum,day)=>sum+(Number.isSafeInteger(day.passed)?day.passed:0),0);
  const below=days.reduce((sum,day)=>sum+(Number.isSafeInteger(day.failed)?day.failed:0),0);
  const unknown=days.reduce((sum,day)=>sum+(Number.isSafeInteger(day.unknown)?day.unknown:0),0);
  const confirmed=met+below;
  return {week,captured_at:profileWeek?.captured_at||null,is_complete:profileWeek?.is_complete===true,
   metrics:Object.fromEntries(metricKeys.map(metric=>[metric,profileWeek?.metrics?.[metric]||emptyMetric()])),
   vs:{met,below,unknown,confirmed,percent:confirmed?Math.round(met/confirmed*100):null}};
 });
 if(range==='previous')return points.slice(-2);
 if(['2','4','5'].includes(String(range)))return points.slice(-Number(range));
 return points;
}

const delta=(latest,first)=>{
 if(!latest||!first||!Number.isSafeInteger(latest.total)||!Number.isSafeInteger(first.total)||latest.week===first.week)return null;
 return latest.total-first.total;
};

export function renderAllianceTrends(trends={},vs={},options={}){
 const {range='all',language='de',esc=String,numberText=String}=options,en=language==='en',text=(de,english)=>en?english:de,e=esc,n=numberText;
 const points=buildAllianceTrendSeries(trends,vs,range),latest=points.at(-1),first=points[0];
 if(!latest)return '<section class="native-alliance-trends"><p class="native-muted">'+text('Noch keine bestätigten Allianz-Verlaufsdaten.','No confirmed alliance trend data yet.')+'</p></section>';
 const labels={power:text('Stärke','Power'),kills:'Kills',donations_weekly:text('Wochenspenden','Weekly donations')};
 const cards=metricKeys.map(metric=>{
  const value=latest.metrics[metric],change=delta({...value,week:latest.week},{...first.metrics[metric],week:first.week});
  return '<article class="native-trend-kpi"><small>'+e(labels[metric])+'</small><strong>'+(value.total===null?'—':n(value.total))+'</strong>'+
   '<span>'+text('Median','Median')+': '+(value.median===null?'—':n(value.median))+'</span>'+
   '<small>'+n(value.verified)+' '+text('bestätigt','confirmed')+' · '+n(value.coverage)+'%</small>'+
   '<b>'+(change===null?text('Kein Vergleich','No comparison'):(change>0?'+':'')+n(change)+' '+text('seit','since')+' '+e(first.week))+'</b></article>';
 }).join('');
 const vsChange=latest.vs.percent!==null&&first.vs.percent!==null&&latest.week!==first.week?latest.vs.percent-first.vs.percent:null;
 const rows=points.slice().reverse().map(point=>{
  const cells=metricKeys.map(metric=>{
   const value=point.metrics[metric],maximum=Math.max(...points.map(item=>item.metrics[metric].total??0),1),width=value.total===null?0:Math.max(1,Math.round(value.total/maximum*100));
   return '<div class="native-trend-metric"><span>'+e(labels[metric])+'</span><div class="native-trend-track" aria-hidden="true"><i style="width:'+width+'%"></i></div>'+
    '<strong>'+(value.total===null?'—':n(value.total))+'</strong><small>'+n(value.verified)+' · '+n(value.coverage)+'%</small></div>';
  }).join('');
  return '<article class="native-trend-week"><h3>'+e(point.week)+(point.is_complete?'':' <small>'+text('Teilaufnahme','Partial capture')+'</small>')+'</h3>'+cells+
   '<div class="native-trend-metric"><span>'+text('VS-Zielquote','VS goal rate')+'</span><div class="native-trend-track" aria-hidden="true"><i style="width:'+(point.vs.percent??0)+'%"></i></div>'+
   '<strong>'+(point.vs.percent===null?'—':n(point.vs.percent)+'%')+'</strong><small>'+n(point.vs.met)+'/'+n(point.vs.confirmed)+' · '+n(point.vs.unknown)+' '+text('unklar','unknown')+'</small></div></article>';
 }).join('');
 return '<section class="native-alliance-trends"><div class="native-trend-kpis">'+cards+
  '<article class="native-trend-kpi"><small>'+text('VS-Zielquote','VS goal rate')+'</small><strong>'+(latest.vs.percent===null?'—':n(latest.vs.percent)+'%')+'</strong>'+
  '<span>'+n(latest.vs.met)+'/'+n(latest.vs.confirmed)+' '+text('bestätigte Zieltage','confirmed goal days')+'</span><small>'+n(latest.vs.unknown)+' '+text('unbekannt','unknown')+'</small>'+
  '<b>'+(vsChange===null?text('Kein Vergleich','No comparison'):(vsChange>0?'+':'')+n(vsChange)+text(' Prozentpunkte',' percentage points'))+'</b></article></div>'+
  '<div class="native-trend-weeks">'+rows+'</div><p class="native-muted">'+text('Nur bestätigte Werte aktiver IDs. Unbekannte Werte sind nicht 0; Teilaufnahmen bleiben gekennzeichnet.','Confirmed values for active IDs only. Unknown is not zero; partial captures remain marked.')+'</p></section>';
}
