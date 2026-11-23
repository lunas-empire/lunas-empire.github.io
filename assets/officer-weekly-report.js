import {buildAllianceTrendSeries} from './officer-alliance-trends.js';
import {buildReadinessComparison} from './officer-readiness.js';
import {filterEventInsights} from './officer-event-insights.js';
import {buildRewardFairness} from './officer-reward-fairness.js';
import {buildDuelInsights} from './officer-duel-insights.js';
import {dailyOfficerBrief} from './officer-reports.js';

const integer=value=>Number.isSafeInteger(value)?value:null;
const difference=(latest,previous)=>integer(latest)===null||integer(previous)===null?null:latest-previous;

export function buildWeeklyReport(data={},options={}){
 const language=options.language||'de',en=language==='en',text=(de,english)=>en?english:de,number=value=>Number(value).toLocaleString(en?'en-US':'de-DE');
 const points=buildAllianceTrendSeries(data.trends,data.vs,'previous'),latest=points.at(-1),first=points[0];
 if(!latest)return text('RZSN R4-Wochenbericht: Noch keine bestätigten Wochendaten.','RZSN R4 weekly report: No confirmed weekly data yet.');
 const metric=(key,label)=>{
  const current=latest.metrics[key],previous=first?.metrics[key],delta=difference(current.total,previous?.total);
  return label+': '+(current.total===null?text('unbekannt','unknown'):number(current.total))+(delta===null?'':' ('+(delta>0?'+':'')+number(delta)+')')+' · '+current.verified+' '+text('bestätigt','confirmed');
 };
 const donation=data.donations?.weeks?.[0],readiness=buildReadinessComparison(data.readiness,'power'),troops=buildReadinessComparison(data.readiness,'total_troops');
 const events=filterEventInsights(data.eventInsights),rewards=buildRewardFairness(data.trains,data.dice,data.members),duel=buildDuelInsights(data.duel);
 const readinessLine=(label,item)=>label+': '+(item.latest?number(item.latest.metrics[item.metric].total)+' · '+item.latest.report_date+(item.totalDelta===null?'':' ('+(item.totalDelta>0?'+':'')+number(item.totalDelta)+')'):text('keine Daten','no data'));
 const lines=['RZSN '+text('R4-Wochenbericht','R4 weekly report')+' | '+latest.week,
  text('Nur bestätigte Werte; unbekannte Werte sind nicht 0. Keine automatischen Sanktionen.','Confirmed values only; unknown is not zero. No automatic sanctions.'),'',
  text('ENTWICKLUNG','DEVELOPMENT'),metric('power',text('Stärke','Power')),metric('kills','Kills'),metric('donations_weekly',text('Wochenspenden','Weekly donations')),
  'VS: '+latest.vs.met+'/'+latest.vs.confirmed+' '+text('bestätigte Zieltage','confirmed goal days')+' · '+latest.vs.unknown+' '+text('unklar','unknown'),
  text('Spenden','Donations')+': '+(donation?donation.met+'/'+donation.verified+' '+text('im Ziel','at goal')+' · '+donation.below+' '+text('unter Ziel','below')+' · '+donation.unknown+' '+text('unbekannt','unknown'):text('keine Daten','no data')),'',
  text('BEREITSCHAFT','READINESS'),readinessLine(text('Power','Power'),readiness),readinessLine(text('Truppen','Troops'),troops),'',
  text('EVENTS & VERGABEN','EVENTS & REWARDS'),
  text('Events','Events')+': '+events.summary.completed+' '+text('abgeschlossen','completed')+' · '+events.summary.failed+' '+text('fehlgeschlagen','failed')+' · '+events.summary.scheduled+' '+text('geplant','scheduled'),
  text('Züge','Trains')+': '+(data.trains?.counts?.completed??text('unbekannt','unknown'))+' '+text('abgeschlossen','completed')+' · '+(data.trains?.counts?.planned??text('unbekannt','unknown'))+' '+text('geplant','planned'),
  'VIP: '+rewards.summary.vipRecords+' '+text('Belege','records')+' / '+rewards.summary.vipCovered+' IDs · Dice: '+rewards.summary.diceRecords+' '+text('Belege','records')+' / '+rewards.summary.diceCovered+' IDs',
  rewards.summary.completeRound?text('Vergaberunde vollständig belegt.','Award round fully documented.'):text('Keine vollständige Vergaberunde; keine Fairnesswertung.','No complete award round; no fairness assessment.'),'',
  text('DUELL','DUEL')+': '+(duel.summary.matches?duel.summary.matches+' '+text('Matches','matches')+' · '+duel.summary.wins+' '+text('Siege','wins')+' / '+duel.summary.losses+' '+text('Niederlagen','losses')+' / '+duel.summary.ties+' '+text('Unentschieden','ties'):text('Keine bestätigten finalen Matches.','No confirmed final matches.')),'',
  text('DATENLÜCKEN & NÄCHSTE AKTIONEN','DATA GAPS & NEXT ACTIONS'),
  text('Offene OCR-Reviews','Open OCR reviews')+': '+(data.overview?.reviews??text('unbekannt','unknown'))+' · '+text('Offene Aufgaben','Open tasks')+': '+((data.operations?.tasks||[]).filter(task=>task.status!=='done').length),
  en?dailyOfficerBrief({date:data.trains?.today,overview:data.overview,operations:data.operations,trains:data.trains}):text('Bitte Datenlücken und geplante Einsätze vor Entscheidungen prüfen. Keine automatische Archivierung oder Sanktion.','Review data gaps and planned operations before decisions. No automatic archiving or sanctions.')];
 return lines.join('\n');
}
