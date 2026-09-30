import { BUILD_VERSION, ALLIANCE_CONFIG, LIVE_NOTICE } from './config.js';
import { LANGUAGES, LOCALES, UI, resolveLanguagePreference, translate, loadLanguage } from './i18n.js';
import { COPY, TASKS, DAILY_GUIDES } from './content.js';
import { DAY_ONE_GROUP, SEASON_COPY, SEASON_CONTENT, SEASON_GUIDES, SEASON_ROADMAP, SEASON_GUIDE_ROADMAP, seasonTasks, seasonSynergies, seasonTodayTasks, seasonContext, isSeasonDailyTask, upcoming } from './season.js';
import { GUIDE_COPY, GUIDE_TEXT, MEMBER_MEDIA } from './guide-text.js';
import { SEASON_LIBRARY_COPY, SEASON_LIBRARY_GUIDES, SEASON_LIBRARY_MEDIA } from './season-library.js';
import { TECH_GUIDE_TITLE, techGuideHtml } from './tech-guide.js';
import { professionGuideHtml, PROFESSION_GUIDE_SEARCH } from './profession-guide.js';
import { trainGuideHtml, trainGuideTitle, trainGuideSectionTitle, TRAIN_GUIDE_SEARCH } from './train-guide.js';
import { memberRoute, guideHash, guideUrl } from './guide-links.js';
import { DAY_MS, WEEKDAYS, guideState, selectedDate, checklistKey, armsWindow, availableTask, enemyBusterPhase, seasonEventInstant } from './engine.js';
import { createStorage, checkedMap } from './storage.js';
import { OVERVIEW_COPY } from './overview-i18n.js';
import { taskReferences, taskDone, writeTask, availabilityKey, taskToken, taskProgress, taskVisible, seasonTaskUnlocked, nextReset, conciseTask, TASK_GUIDES } from './overview.js';

const dictionary = {...UI,...COPY,...SEASON_COPY,...GUIDE_COPY,...SEASON_LIBRARY_COPY};
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let storageFailed = false;
const storage = createStorage(() => window.localStorage, () => { storageFailed = true; });
function legacyPreference(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
const storedLanguage = storage.get('rzsn-language', null);
const legacyLanguage = legacyPreference('lw_lang');
const languagePreference = resolveLanguagePreference(storedLanguage,legacyLanguage,navigator.languages || [navigator.language]);
let lang = languagePreference.lang;
await loadLanguage(lang);
if (languagePreference.detected) storage.set('rzsn-language',lang);
let state = guideState();
let selectedDay = state.weekdayIndex;
let currentView = '';
let guideFilter='current';
let taskFilter='open';
let guideSearchQuery='';
let guideContextObserver=null;
const t = (key, values={}) => OVERVIEW_COPY[lang]?.[key]?.replace(/\{(\w+)\}/g,(_,name)=>values[name]??`{${name}}`) ?? translate(dictionary,key,lang,values);
const tx = (key, values) => escape(t(key,values));
const main = document.querySelector('main');
const menu = document.querySelector('#menu');
const languageDialog = document.querySelector('#language-dialog');
const setupLanguage = document.querySelector('#setup-language');
const themeOptions = document.querySelector('#theme-options');
const setupContinue = document.querySelector('#setup-continue');
const themeToggle = document.querySelector('#theme-toggle');
const settingsOpen = document.querySelector('#settings-open');
const installApp = document.querySelector('#install-app');
const firstVisitNote = document.querySelector('#first-visit-note');
const firstVisitSettings = document.querySelector('#first-visit-settings');
const firstVisitDismiss = document.querySelector('#first-visit-dismiss');
const phaseLabel = s => s.phase === 'PRE_SEASON' ? t('pre') : s.phase === 'POST_SEASON' ? t('post') : `${t('week')} ${s.week}`;
const longDate = date => new Intl.DateTimeFormat(LOCALES[lang], {dateStyle:'full',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
const paragraph = key => `<p>${tx(key)}</p>`;
const list = keys => `<ul class="plain">${keys.map(k=>`<li>${tx(k)}</li>`).join('')}</ul>`;
const section = (title, body) => `<section class="section"><h2>${tx(title)}</h2>${body}</section>`;
const details = (title, body, open = false, id = '') => `<details${open?' open':''}${id?` data-disclosure="${escape(id)}"`:''}><summary>${escape(title)}</summary>${body}</details>`;
const link = (view, text) => `<a class="link-button" href="#${view}">${tx(text)} <span aria-hidden="true">→</span></a>`;
const permitted = id => !LIVE_NOTICE.active || !LIVE_NOTICE.suppressTaskIds.includes(id);
const guideAlt = media => media.day ? t('dayGuideAlt',{day:t(media.day)}) : t(media.alt);
const guidePreviewSrc = src => src.replace('/assets/member/','/assets/member/preview/');
function guideFigure(id) {
  const media=MEMBER_MEDIA[id];
  const alt=guideAlt(media);
  return `<figure class="guide-figure"><a href="${media.src}" target="_blank" rel="noopener" aria-label="${escape(alt)} ${tx('imageHint')}"><img src="${guidePreviewSrc(media.src)}" data-guide-image data-src="${guidePreviewSrc(media.src)}" width="${media.width}" height="${media.height}" loading="lazy" fetchpriority="low" decoding="async" alt="${escape(alt)}"></a><div class="guide-image-fallback" role="status" hidden><strong>${tx('imageUnavailable')}</strong><a href="${media.src}" target="_blank" rel="noopener">${tx('imageOpenOriginal')}</a></div><figcaption><strong>${escape(alt)}</strong><span>${tx('imageHint')}</span><small>${tx('imageLanguage')}</small></figcaption></figure>`;
}
function guideTextBlocks(title,blocks,{showTitle=true}={}) {
  return `<section class="guide-text"><p class="guide-text__label">${tx('guideTextTitle')}</p>${showTitle?`<h3>${escape(title)}</h3>`:''}<div class="guide-text__blocks">${blocks.map(block=>`<details class="guide-text__block${block.tone==='warning'?' guide-text__block--warning':''}"><summary>${tx(block.heading)}</summary><div class="guide-text__block-body"><p>${tx(block.text)}</p></div></details>`).join('')}</div></section>`;
}
function guideText(id,{showTitle=true}={}) {
  return guideTextBlocks(guideAlt(MEMBER_MEDIA[id]),GUIDE_TEXT[id],{showTitle});
}
const guideCard = id => `<article class="guide-card">${guideText(id)}${guideFigure(id)}</article>`;
const guideShareButton = id => `<div class="guide-share-row"><button type="button" class="guide-share" data-share-guide="${escape(id)}">${tx('shareGuide')}</button></div>`;
const guideGallery = ids => ids.length ? `<div class="guide-gallery">${ids.map(guideCard).join('')}</div>` : '';
function guideDisclosure(id) {
  const title=shortGuideTitle(id);
  const current=id===`vs-${state.weekday}`;
  return `<details class="guide-disclosure" data-search data-filter-item data-guide-category="vs" data-guide-current="${current}" data-guide-today="${current}" data-guide-label="${tx('today')}" data-guide-id="${escape(id)}"><summary data-guide-label="${tx('today')}">${escape(title)}</summary><article class="guide-card guide-card--inside guide-card--split"><div class="guide-card__info">${guideShareButton(id)}${guideText(id,{showTitle:false})}</div><div class="guide-card__visuals">${guideFigure(id)}</div></article></details>`;
}
function seasonLibraryFigure(code,title) {
  const media=SEASON_LIBRARY_MEDIA[code];
  const alt=`${title} · #${code}`;
  return `<figure class="guide-figure"><a href="${media.src}" target="_blank" rel="noopener" aria-label="${escape(alt)} ${tx('imageHint')}"><img src="${guidePreviewSrc(media.src)}" data-guide-image data-src="${guidePreviewSrc(media.src)}" width="${media.width}" height="${media.height}" loading="lazy" fetchpriority="low" decoding="async" alt="${escape(alt)}"></a><div class="guide-image-fallback" role="status" hidden><strong>${tx('imageUnavailable')}</strong><a href="${media.src}" target="_blank" rel="noopener">${tx('imageOpenOriginal')}</a></div><figcaption><strong>${escape(alt)}</strong><span>${tx('imageHint')}</span><small>${tx('imageLanguage')}</small></figcaption></figure>`;
}
function seasonGuideWeek(id) {
  return SEASON_GUIDE_ROADMAP.find(group=>group.guides.includes(id))?.week ?? '';
}
function seasonGuideIsCurrent(id) {
  const week=seasonGuideWeek(id);
  if (typeof week==='number') return week===state.week;
  const range=String(week).match(/(\d+)\D+(\d+)/);
  return Boolean(range && state.week>=Number(range[1]) && state.week<=Number(range[2]));
}
function seasonGuideIsToday(id) {
  return SEASON_ROADMAP.some(item=>item.day===state.seasonDay && item.guides.includes(id));
}
function seasonLibraryDisclosure(id) {
  const guide=SEASON_LIBRARY_GUIDES[id];
  const title=t(guide.title);
  const images=`<div class="guide-card__visuals season-library-images">${guide.media.map(code=>seasonLibraryFigure(code,title)).join('')}</div>`;
  const profession=id==='profession'?professionGuideHtml(lang,escape):'';
  const searchTerms=id==='profession'?` ${PROFESSION_GUIDE_SEARCH}`:'';
  const today=seasonGuideIsToday(id);
  const current=seasonGuideIsCurrent(id)||today;
  return `<details class="guide-disclosure" data-search data-filter-item data-guide-category="season" data-guide-current="${current}" data-guide-today="${today}" data-guide-label="${tx('today')}" data-guide-id="${escape(id)}" data-season-guide="${escape(id)}" data-search-extra="${escape(searchTerms)}"><summary data-guide-label="${tx('today')}">${escape(title)}</summary><article class="guide-card guide-card--inside guide-card--split"><div class="guide-card__info">${guideShareButton(id)}${guideTextBlocks(title,guide.blocks,{showTitle:false})}${profession}</div>${images}</article></details>`;
}
function techGuideDisclosure() {
  return `<details class="guide-disclosure guide-disclosure--tech" data-search data-filter-item data-guide-id="tech" data-guide-category="tech" data-guide-current="false" data-tech-guide><summary>${escape(TECH_GUIDE_TITLE)}</summary><div class="tech-guide-shell">${guideShareButton('tech')}${techGuideHtml(lang,escape)}</div></details>`;
}
function trainGuideDisclosure() {
  const title=trainGuideTitle(lang);
  return `<details class="guide-disclosure guide-disclosure--train" data-search data-filter-item data-guide-id="train" data-guide-category="account" data-guide-current="false" data-search-extra="${escape(TRAIN_GUIDE_SEARCH)}"><summary>${escape(title)}</summary><article class="guide-card guide-card--inside guide-card--train">${guideShareButton('train')}${trainGuideHtml(lang,escape)}</article></details>`;
}
function notice() {
  if (!LIVE_NOTICE.active) return '';
  return `<aside class="card warning" aria-label="${tx('call')}"><h2>${tx('call')}</h2><p>${escape(LIVE_NOTICE.message[lang])}</p></aside>`;
}
function enemyBusterBanner(s) {
  const phase=enemyBusterPhase(s);
  if (!phase) return '';
  if (phase==='upcoming') {
    return `<aside class="enemy-buster" aria-labelledby="enemy-buster-title"><span class="badge">${tx('important')}</span><h2 id="enemy-buster-title">${tx('enemyBusterUpcomingTitle')}</h2><p class="enemy-buster__window">${tx('enemyBusterWindow')}</p><p>${tx('enemyBusterUpcomingText')}</p></aside>`;
  }
  const key=`rzsn-enemy-buster-shield-${s.date}`;
  const confirmed=storage.get(key,false)===true;
  return `<aside class="enemy-buster enemy-buster--active" data-confirmed="${confirmed}" aria-labelledby="enemy-buster-title"><span class="badge">${tx('important')}</span><h2 id="enemy-buster-title">${tx('enemyBusterActiveTitle')}</h2><p class="enemy-buster__window">${tx('enemyBusterWindow')}</p><label class="shield-confirm"><input type="checkbox" data-shield-check data-key="${escape(key)}"${confirmed?' checked':''}><span>${tx('shieldConfirmLabel')}</span></label><div class="shield-state" aria-live="polite"><p class="shield-state__pending">${tx('shieldPendingText')}</p><p class="shield-state__confirmed">${tx('shieldConfirmedText')}</p></div></aside>`;
}
function countdown() {
  const minutes = Math.floor(state.countdown / 60000);
  return t('countdown',{d:Math.floor(minutes/1440),h:Math.floor(minutes%1440/60),m:minutes%60});
}
function status() {
  return `<div class="overview-meta"><span>${tx('serverDay')} ${state.serverDay}</span><span>${escape(phaseLabel(state))}${state.seasonDay>0&&state.week<=8?` · ${tx('seasonDay')} ${state.seasonDay}`:''}</span>${state.phase==='PRE_SEASON'?`<span id="countdown">${escape(countdown())}</span>`:''}</div>`;
}
function arms(s, guide) {
  if (!guide.arms) return paragraph('unconfirmed');
  const hours=n=>`${String(n%24).padStart(2,'0')}:00`;
  const current=s.date===state.date;
  return `<div class="arms-clock"><strong class="time">${hours(guide.arms.start)}–${hours(guide.arms.end)} ST</strong>${current?`<span class="time-status" data-arms-state data-state="${armsWindow(state,guide)}">${tx(armsWindow(state,guide))}</span>`:''}</div><small>${escape(guide.arms.type)}</small>`;
}
function shortGuideTitle(id) {
  if (id.startsWith('vs-') && WEEKDAYS.includes(id.slice(3))) return t(id.slice(3));
  if (id==='vs-secret-missions') return t('secretMissionsGuideTitle');
  if (id==='tech') return TECH_GUIDE_TITLE;
  if (id==='train') return trainGuideTitle(lang);
  return SEASON_LIBRARY_GUIDES[id]?t(SEASON_LIBRARY_GUIDES[id].title):guideAlt(MEMBER_MEDIA[id]);
}
function taskTitle(task) {
  const special={profession:'compactProfession',serumPuzzle:'compactSerum',geneticRecombination:'compactGenetic'};
  return special[task.id]?t(special[task.id]):conciseTask(t(task.text||task.id));
}
function taskItem(kind,task,s=state) {
  const refs=taskReferences(kind,task.id,s);
  const unavailable=checkedMap(storage.get(availabilityKey(s)))[taskToken(refs[0])]===true;
  return {...task,kind,s,refs,done:taskDone(storage,refs),unavailable};
}
function seasonTaskGroups(s=state) {
  const ids=seasonTasks(s).filter(id=>permitted(id)&&seasonTaskUnlocked(id,s));
  const dailyIds=s.seasonDay===1?DAY_ONE_GROUP.tasks:s.phase==='PRE_SEASON'?['prepSeason']:seasonTodayTasks(s);
  const todayIds=[...new Set(dailyIds)].filter(id=>ids.includes(id));
  const weekIds=ids.filter(id=>!todayIds.includes(id)&&!['legion'].includes(id));
  return {todayIds,weekIds};
}
function allTaskItems(s=state) {
  const groups=seasonTaskGroups(s);
  return [...vsOnlyTasks(s).map(task=>taskItem('vs',task,s)),...dailyTasks(s).map(task=>taskItem('daily',task,s)),...groups.todayIds.map(id=>taskItem('season',{id},s)),...groups.weekIds.map(id=>taskItem('season',{id},s))];
}
function vsOnlyTasks(s=state) {
  const shared=new Set([...TASKS.map(task=>task.id),...seasonTasks(s)]);
  return DAILY_GUIDES[s.weekday].tasks.filter(id=>permitted(id)&&!shared.has(id)).map(id=>({id}));
}
function progressMarkup(items,label=t('routine')) {
  const {done,total}=taskProgress(items);
  return `<div class="task-progress" data-task-progress data-refs="${escape(JSON.stringify(items.map(item=>item.refs)))}"><div class="progress-row"><span>${escape(label)}</span><strong data-progress-label>${tx('progress',{done,total})}</strong></div><progress value="${done}" max="${total||1}" aria-label="${escape(label)}" data-progress-bar></progress></div>`;
}
function remainingReset() {
  const minutes=Math.max(0,Math.ceil((nextReset(state)-state.now)/60000));
  return t('remaining',{h:Math.floor(minutes/60),m:minutes%60});
}
function resetCard() {
  return `<div class="reset-card"><span>${tx('nextReset')}</span><strong>00:00 ST</strong><small data-reset-countdown>${escape(remainingReset())}</small></div>`;
}
function minimum(s = state) {
  // Sunday is preparation, not a scored VS day.
  return s.weekdayIndex ? `<p class="muted">${tx('minimum',{points:new Intl.NumberFormat(LOCALES[lang],{notation:'compact',maximumFractionDigits:1}).format(ALLIANCE_CONFIG.vsDailyMinimum)})}</p>` : '';
}
function starterGuide() {
  return `<aside class="card starter-guide" aria-labelledby="starter-guide-title"><h2 id="starter-guide-title">${tx('starterTitle')}</h2><p>${tx('starterIntro')}</p><ol class="starter-steps"><li><div class="starter-step"><strong>${tx('today')}</strong><span>${tx('starterToday')}</span></div></li><li><div class="starter-step"><a href="#daily">${tx('daily')}</a><span>${tx('starterDaily')}</span></div></li><li><div class="starter-step"><a href="#vs">${tx('vs')}</a><span>${tx('starterVs')}</span></div></li></ol></aside>`;
}
function dailyTasks(s = state) {
  // Approximate personal cadence only, based on this member's own last checkmark.
  const history = storage.get('rzsn-cadence',{});
  return TASKS.filter(task => availableTask(task,s) && permitted(task.id)).filter(task => {
    if (!['every_48h','every_2_days'].includes(task.frequency)) return true;
    const last = Number(history?.[task.id]);
    return taskDone(storage,taskReferences('daily',task.id,s)) || !last || s.now.getTime() - last >= 2 * DAY_MS;
  });
}

function frequencyText(task) {
  if (['every_48h','every_2_days'].includes(task.frequency)) return t('every2');
  if (['event_specific','season_specific'].includes(task.frequency)) return t('available');
  return task.frequency === 'twice_daily' ? t('twice') : '';
}
function checklist(kind, tasks, s = state, {filter='all', group=''}={}) {
  return `<ul class="checklist overview-checklist" data-task-list data-task-filter="${filter}">${tasks.filter(task=>permitted(task.id)).map(task=>{
    const item=taskItem(kind,task,s);
    const ref=item.refs[0];
    const title=taskTitle(task);
    const guideId=TASK_GUIDES[task.id];
    const frequency=frequencyText(task);
    return `<li class="task-row" data-task-row data-done="${item.done}" data-unavailable="${item.unavailable}" data-refs="${escape(JSON.stringify(item.refs))}"${taskVisible(item,filter)?'':' hidden'}><div class="task-line"><label><input type="checkbox" data-check="${escape(task.id)}" data-key="${ref.key}" data-kind="${ref.kind}" data-origin-kind="${kind}" data-date="${s.date}"${item.done?' checked':''}${item.unavailable?' disabled':''}><span class="task-text">${escape(title)}${frequency?`<small>${escape(frequency)}</small>`:''}</span></label><details class="task-detail" data-disclosure="task-${group}-${kind}-${escape(task.id)}"><summary aria-label="${tx('details')} · ${escape(title)}">${tx('details')}</summary><div class="task-detail-body"><p>${tx(task.text||task.id)}</p>${guideId?`<a class="task-guide" href="${guideHash(guideId)}">${escape(shortGuideTitle(guideId))} →</a>`:''}<button type="button" class="availability-toggle" data-unavailable-toggle data-token="${escape(taskToken(ref))}" data-date="${s.date}">${tx(item.unavailable?'restoreTask':'skipToday')}</button></div></details></div></li>`;
  }).join('')}</ul>`;
}
function taskGroup(kind,tasks,title,id,{open=false,filter=taskFilter}={}) {
  if (!tasks.length) return '';
  const items=tasks.map(task=>taskItem(kind,task));
  const {done,total}=taskProgress(items);
  const visible=items.some(item=>taskVisible(item,filter));
  return `<details class="task-group" data-task-group data-disclosure="${id}"${open?' open':''}${visible?'':' hidden'}><summary><span>${escape(title)}</span><span class="group-progress" data-group-progress>${done} / ${total}</span></summary>${checklist(kind,tasks,state,{filter,group:id})}</details>`;
}
function nextCards(limit = 3, excludedDays = []) {
  return upcoming(state,limit,excludedDays).map(e=>{
    const id=TASK_GUIDES[e.id];
    const title=id?shortGuideTitle(id):conciseTask(t(e.id));
    const day=e.day===state.seasonDay+1?t('tomorrow'):`${t('seasonDay')} ${e.day}`;
    const time=new Intl.DateTimeFormat(LOCALES[lang],{day:'numeric',month:'short',timeZone:'Europe/Berlin'}).format(seasonEventInstant(e.day));
    return `<details class="next-event" data-disclosure="next-${e.day}-${e.id}"><summary><small>${escape(day)} · ${escape(time)}</small><strong>${escape(title)}${['kim','dva','tesla'].includes(e.id)?` · ${{kim:'Kimberly',dva:'DVA',tesla:'Tesla'}[e.id]}`:''}</strong></summary>${paragraph(e.id)}${id?`<a href="${guideHash(id)}">${escape(shortGuideTitle(id))} →</a>`:''}</details>`;
  }).join('');
}

const roadmapKindKey = kind => ({personal:'daily',alliance:'call',recurring:'action',mixed:'important'}[kind] || 'important');
function roadmapGuideLinks(entry) {
  const ids=[...new Set(entry.guides || [])].filter(id=>SEASON_LIBRARY_GUIDES[id]);
  if (!ids.length) return '';
  return `<div class="roadmap-guide-links">${ids.map(id=>`<a href="${guideHash(id)}">${tx(SEASON_LIBRARY_GUIDES[id].title)}</a>`).join('')}</div>`;
}
function roadmapMilestone(entry,status) {
  const week=Math.ceil(entry.day/7);
  const here=status==='current'? `<span class="roadmap-here">${tx('roadmapHere')}</span>` : '';
  return `<li class="roadmap-item roadmap-item--${status}" data-roadmap-day="${entry.day}"><span class="roadmap-dot" aria-hidden="true"></span><article><div class="roadmap-meta"><span>${tx('week')} ${week} · ${tx('seasonDay')} ${entry.day}</span><span class="roadmap-kind roadmap-kind--${escape(entry.kind)}">${tx(roadmapKindKey(entry.kind))}</span></div><div class="roadmap-title-row"><h3>${tx(entry.label)}</h3>${here}</div>${roadmapGuideLinks(entry)}</article></li>`;
}
function roadmapPositionMarker(day) {
  return `<li class="roadmap-position" aria-current="step"><span class="roadmap-dot" aria-hidden="true"></span><div><strong>${tx('roadmapHere')}</strong><span>${tx('seasonDay')} ${day}</span></div></li>`;
}
function roadmapGlance(s=state) {
  const active=s.seasonDay>=1 && s.seasonDay<=56;
  const current=active ? SEASON_ROADMAP.filter(entry=>entry.day===s.seasonDay) : [];
  const next=SEASON_ROADMAP.find(entry=>entry.day>(s.seasonDay || 0));
  const nowText=current.length ? current.map(entry=>t(entry.label)).join(' · ') : active ? `${t('seasonDay')} ${s.seasonDay}` : phaseLabel(s);
  const nextText=next ? `${t('seasonDay')} ${next.day} · ${t(next.label)}` : t('post');
  return `<div class="roadmap-glance"><div><small>${tx('today')}</small><strong>${escape(nowText)}</strong></div><div><small>${tx('next')}</small><strong>${escape(nextText)}</strong></div></div>`;
}
function seasonRoadmap() {
  const day=state.seasonDay;
  const active=day>=1 && day<=56;
  const exact=active && SEASON_ROADMAP.some(entry=>entry.day===day);
  let markerInserted=false;
  const rows=[];
  for (const entry of SEASON_ROADMAP) {
    if (active && !exact && !markerInserted && entry.day>day) {
      rows.push(roadmapPositionMarker(day));
      markerInserted=true;
    }
    const status=state.phase==='POST_SEASON' || (active && entry.day<day) ? 'past'
      : active && entry.day===day ? 'current' : 'future';
    rows.push(roadmapMilestone(entry,status));
  }
  if (active && !exact && !markerInserted) rows.push(roadmapPositionMarker(day));
  return `<ol class="season-roadmap">${rows.join('')}</ol>`;
}
function roadmapMiniPreview(s=state) {
  const day=s.seasonDay;
  const active=day>=1 && day<=56;
  const startIndex=active
    ? Math.max(0,SEASON_ROADMAP.findIndex(entry=>entry.day>=day))
    : s.phase==='POST_SEASON' ? Math.max(0,SEASON_ROADMAP.length-2) : 0;
  return SEASON_ROADMAP.slice(startIndex,startIndex+3).map(entry=>`<span class="roadmap-mini-item"><small>${tx('seasonDay')} ${entry.day}</small><strong>${tx(entry.label)}</strong></span>`).join('');
}
function seasonRoadmapDisclosure() {
  return `<details class="roadmap-disclosure" data-disclosure="season-roadmap"><summary><span class="roadmap-summary-copy"><strong>${tx('timeline')}</strong><small>${state.seasonDay>=1&&state.seasonDay<=56?`${tx('roadmapHere')} · ${tx('seasonDay')} ${state.seasonDay}`:escape(phaseLabel(state))}</small></span><span class="roadmap-mini">${roadmapMiniPreview()}</span></summary><div class="roadmap-disclosure__body">${roadmapGlance()}${seasonRoadmap()}</div></details>`;
}
function nextRoadmapText(s=state) {
  const next=SEASON_ROADMAP.find(entry=>entry.day>s.seasonDay);
  return next ? `${t('seasonDay')} ${next.day} · ${t(next.label)}` : t('post');
}
function today() {
  const guide=DAILY_GUIDES[state.weekday];
  const routine=allTaskItems();
  const candidates=[...guide.tasks.map(id=>taskItem('vs',{id})),...seasonTodayTasks(state).filter(permitted).map(id=>taskItem('season',{id})),...routine];
  const unique=[...new Map(candidates.filter(item=>permitted(item.id)).map(item=>[taskToken(item.refs[0]),item])).values()];
  const pending=unique.filter(item=>!item.done&&!item.unavailable).slice(0,4);
  const quickTasks=pending.map(item=>checklist(item.kind,[item],state,{filter:'open',group:'today'})).join('');
  const related=[`vs-${state.weekday}`,...seasonSynergies(state).map(id=>TASK_GUIDES[id]),...(state.week>=1&&state.week<=8?['profession']:[])].filter(Boolean);
  const next=SEASON_ROADMAP.find(entry=>entry.day>state.seasonDay);
  return `<header class="page-heading"><div><p class="eyebrow">${escape(longDate(state.date))}</p><h1>${tx('today')}</h1></div>${status()}</header>${notice()}${enemyBusterBanner(state)}
    <section class="focus-panel"><div class="focus-panel__main"><span class="eyebrow">${tx('focus')}</span><h2>${tx(state.weekday)}</h2><p>${tx(guide.focus)}</p>${minimum()}<a class="primary-link" href="#vs">${tx('doNow')} →</a></div><div class="focus-panel__time"><span class="eyebrow">${tx('bestArms')}</span>${arms(state,guide)}${resetCard()}</div><div class="focus-panel__save"><strong>${tx('save')}</strong><span>${guide.save.filter(permitted).map(id=>tx(id)).join(' · ')}</span></div></section>
    <div class="overview-columns"><section class="open-tasks"><div class="section-heading"><h2>${tx('doNow')}</h2><a href="#daily">${tx('tasks')} →</a></div>${progressMarkup(routine,t('tasks'))}${quickTasks||`<p class="empty-state">${tx('allDone')}</p>`}<p class="empty-state" data-today-empty hidden>${tx('allDone')}</p><a class="text-link" href="#daily">${tx('checklist')} →</a></section><aside class="overview-aside"><section><h2>${tx('relevantGuides')}</h2><div class="related-guides">${[...new Set(related)].slice(0,3).map(id=>`<a href="${guideHash(id)}"><span>${escape(shortGuideTitle(id))}</span><span aria-hidden="true">↗</span></a>`).join('')}</div></section><section class="next-preview"><span class="eyebrow">${tx('nextMilestone')}</span><h2>${next?tx(next.label):tx('post')}</h2>${next?`<p>${tx('seasonDay')} ${next.day} · ${tx('week')} ${Math.ceil(next.day/7)}</p>`:''}<a href="#season">${tx('season')} →</a></section></aside></div>`;
}
function daySelector() {
  return `<div class="week-selector" role="group" aria-label="${tx('vs')}">${WEEKDAYS.map((day,index)=>{
    const date = new Date(`${selectedDate(state,index)}T12:00:00Z`);
    const label = new Intl.DateTimeFormat(LOCALES[lang],{weekday:'short',timeZone:'UTC'}).format(date);
    const dateLabel = new Intl.DateTimeFormat(LOCALES[lang],{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(date);
    return `<button type="button" data-day="${index}" data-current="${index===state.weekdayIndex}" aria-pressed="${index===selectedDay}"${index===state.weekdayIndex?' aria-current="date"':''} aria-label="${escape(longDate(selectedDate(state,index)))} · ${tx(day)}"><span>${escape(label)}</span><small>${escape(dateLabel)}</small></button>`;
  }).join('')}</div>`;
}
function daily() {
  const tasks=dailyTasks();
  const groups=seasonTaskGroups();
  const items=allTaskItems();
  return `<header class="page-heading"><div><p class="eyebrow">${escape(longDate(state.date))}</p><h1>${tx('tasks')}</h1></div>${resetCard()}</header><p class="intro">${tx('tasksIntro')}</p>${notice()}${progressMarkup(items,t('tasks'))}<div class="task-filters" role="group" aria-label="${tx('tasks')}">${[['open','openTasks'],['all','allTasks'],['unavailable','unavailableTasks']].map(([id,key])=>`<button type="button" data-task-filter-button="${id}" aria-pressed="${id===taskFilter}">${tx(key)}</button>`).join('')}</div><p class="empty-state" data-tasks-empty hidden></p><div class="task-groups">${taskGroup('vs',vsOnlyTasks(),`${t('vs')} · ${t(state.weekday)}`,'vs-tasks',{open:true})}${taskGroup('season',groups.todayIds.map(id=>({id})),t('season'),'season-routine',{open:true})}${['freebies','alliance','action','map','timing'].map((category,index)=>taskGroup('daily',tasks.filter(task=>task.category===category),t(category),category,{open:index===0})).join('')}${taskGroup('season',groups.weekIds.map(id=>({id})),`${t('season')} · ${t('thisWeek')}`,'season-week-tasks')}</div><p class="muted task-note">${tx('resetNote')}</p><aside class="rule-note">${tx('safeServer')}</aside>`;
}
function vs() {
  const date=selectedDate(state,selectedDay);
  const s=guideState(new Date(`${date}T12:00:00+02:00`));
  const guide=DAILY_GUIDES[s.weekday];
  const tasks=[...new Set([...guide.tasks,...seasonSynergies(s)])].filter(permitted).map(id=>({id}));
  const avoid=guide.avoid.filter(id=>!guide.save.includes(id)&&permitted(id));
  return `<header class="page-heading"><h1>${tx('vs')}</h1></header>${notice()}${daySelector()}<div class="vs-heading"><div><p class="eyebrow">${escape(longDate(s.date))}</p><h2>${tx(s.weekday)}</h2>${minimum(s)}</div><div class="vs-window"><span class="eyebrow">${tx('bestArms')}</span>${arms(s,guide)}</div></div>${enemyBusterBanner(s)}<section class="vs-plan"><h2>${tx('doNow')}</h2>${checklist('vs',tasks,s,{group:'vs'})}</section><div class="save-note"><strong>${tx('save')} · ${tx(WEEKDAYS[(selectedDay+1)%7])}</strong>${list(guide.save.filter(permitted))}</div>${avoid.length?`<aside class="rule-note">${list(avoid)}</aside>`:''}${details(t('vsDetails'),guideGallery([`vs-${s.weekday}`])+paragraph('armsNote'),false,'vs-explanation')}<a class="text-link" href="${guideHash('vs-secret-missions')}">${tx('secretMissionsGuideTitle')} →</a>${selectedDay===6?paragraph('fight'):''}`;
}

function first24Body({withChecklist = false} = {}) {
  const flow = `<ol class="flow">${t('loop').split(' → ').map(step=>`<li>${escape(step)}</li>`).join('')}</ol>`;
  const farm = `<dl class="facts">${[t('immediate'),`Farm 1 → ${t('level')} 5`,`Farm 2 → ${t('level')} 10`,`Farm 3 → ${t('level')} 10`,'Season Weekly Pass · 1,000 Diamonds'].map((unlock,index)=>`<div><dt>Farm ${index+1}</dt><dd>${escape(unlock)}</dd></div>`).join('')}</dl>`;
  const vri = details(`VRI · ${t('details')}`,`<dl class="facts">${[['1–5','100'],['6–15','250'],['16–20','400'],['21–30','500']].map(([level,value])=>`<div><dt>${tx('level')} ${level}</dt><dd>+${value} / ${tx('level')}</dd></div>`).join('')}<div><dt>${tx('max')}</dt><dd>10,000</dd></div></dl>`);
  const tasks = withChecklist ? checklist('season',DAY_ONE_GROUP.tasks.map(id=>({id}))) : '';
  return tasks+`<aside class="card warning season-pass-recommendation">${paragraph('pass')}</aside>`+guideCard('farms')+flow+paragraph('farms')+farm+paragraph('farmRate')+paragraph('vri')+vri+paragraph('firstBlood')+paragraph('resistanceCheck')+paragraph('profession');
}
function first24({withChecklist = false, open = false} = {}) {
  return details(`${t('seasonDay')} 1 · ${t('first24')}`,first24Body({withChecklist}),open,'first24');
}
function season() {
  const {todayIds,weekIds}=seasonTaskGroups();
  const current=state.week>8?9:state.week;
  const isPreSeason=state.phase==='PRE_SEASON';
  const contextIds=seasonContext(state).filter(permitted);
  const todayItems=todayIds.map(id=>taskItem('season',{id}));
  const timeline=Object.entries(SEASON_CONTENT).map(([phase,items],index)=>details(index===0?t('pre'):index===9?t('post'):`${t('week')} ${index}`,list(items)+guideGallery(SEASON_GUIDES[phase]||[]),index===current,phase)).join('');
  return `<header class="page-heading"><h1>${tx('season')}</h1>${status()}</header>${notice()}${seasonGuidePosition()}<nav class="section-links" aria-label="${tx('season')}"><a href="#season" data-season-jump="season-today">${tx('today')}</a><a href="#season" data-season-jump="season-week">${tx('thisWeek')}</a><a href="#season" data-season-jump="season-next">${tx('next')}</a></nav><div class="overview-columns season-columns"><div><section id="season-today"><div class="section-heading"><h2>${tx('today')}</h2><a href="#daily">${tx('tasks')} →</a></div>${progressMarkup(todayItems,t('season'))}${checklist('season',todayIds.map(id=>({id})),state,{group:'season'})}${state.seasonDay===1?first24({open:false}):''}</section><section class="section" id="season-week"><h2>${tx('thisWeek')}</h2>${weekIds.length?checklist('season',weekIds.map(id=>({id})),state,{group:'week'}):paragraph('allDone')}</section></div><aside id="season-next"><h2>${tx('nextMilestone')}</h2>${isPreSeason?first24({open:false})+nextCards(3,[DAY_ONE_GROUP.day]):nextCards()}</aside></div>${contextIds.length?details(t('important'),list(contextIds),false,'season-context'):''}${details(t('details'),timeline,false,'season-week-details')}${section('timeline',seasonRoadmapDisclosure())}`;
}

const REFERENCE_LABELS = {
  safeServer:'Server 2261',minister:'Minister Buff',philosophy:'Upgrade Timing',
  hero:'Hero',drone:'Drone',buildings:'Building Power',profession:'Engineer / War Leader',
  radarSave:'Radar Tasks',star:'Star Missions',ssr:'SSR Gear Chests',chests:'Event / Arms Race Chests',
};
const REFERENCE_GROUPS = [
  {title:'guideRules',ids:['safeServer','minister','philosophy']},
  {title:'guideGrowth',ids:['hero','drone','buildings','profession']},
  {title:'guidePlanning',ids:['radarSave','star','ssr','chests']},
];
function referenceLibrary() {
  return `<div id="search-results" class="reference-groups">${REFERENCE_GROUPS.map(group=>`<section class="reference-group" data-search-group><h3>${tx(group.title)}</h3><dl class="reference-list">${group.ids.map(id=>`<div class="reference-note" data-search="${id}" data-filter-item data-guide-category="account" data-guide-current="false"><dt>${escape(REFERENCE_LABELS[id])}</dt><dd>${paragraph(id)}</dd></div>`).join('')}</dl></section>`).join('')}</div>`;
}
function seasonWeekIsCurrent(week) {
  if (typeof week==='number') return week===state.week;
  const range=String(week).match(/(\d+)\D+(\d+)/);
  return Boolean(range && state.week>=Number(range[1]) && state.week<=Number(range[2]));
}
function seasonGuideRoadmapLibrary() {
  const groups=[...SEASON_GUIDE_ROADMAP].sort((a,b)=>Number(seasonWeekIsCurrent(b.week))-Number(seasonWeekIsCurrent(a.week)));
  return `<div class="guide-roadmap">${groups.map(group=>{
    const current=seasonWeekIsCurrent(group.week);
    return `<section class="guide-roadmap-week${current?' guide-roadmap-week--current':''}" data-search-group data-season-current="${current}"><h3><span>${tx('week')} ${escape(group.week)}</span></h3><div class="guide-disclosures">${group.guides.map(seasonLibraryDisclosure).join('')}</div></section>`;
  }).join('')}</div>`;
}
function seasonGuidePosition() {
  if (state.seasonDay<1 || state.seasonDay>56) return '';
  const milestone=SEASON_ROADMAP.find(item=>item.day===state.seasonDay);
  const progress=Math.max(0,Math.min(100,(state.seasonDay/56)*100));
  return `<div class="season-guide-position" aria-label="${tx('seasonDay')} ${state.seasonDay}, ${tx('week')} ${state.week}"><div class="season-guide-position__meta"><strong>${tx('seasonDay')} ${state.seasonDay}</strong><span>${tx('week')} ${state.week}</span>${milestone?`<small>${tx(milestone.label)}</small>`:''}</div><div class="season-guide-position__rail" aria-hidden="true"><span style="width:${progress.toFixed(2)}%"></span></div></div>`;
}
function guideFilterBar() {
  const filters=[['all','filterAll'],['current','filterCurrent'],['season','filterSeason'],['vs','filterVs'],['tech','filterTech'],['account','filterAccount']];
  return `<div class="guide-tools"><div class="guide-filters" role="group" aria-label="${tx('guides')}">${filters.map(([id,key])=>`<button type="button" data-guide-filter="${id}" aria-pressed="${id===guideFilter}">${tx(key)}</button>`).join('')}</div><span id="guide-results-count" class="guide-results-count"></span></div>`;
}
function guideContextBar() {
  return `<div id="guide-context-bar" class="guide-context-bar" hidden><a href="#guides">${tx('backToGuides')}</a><strong data-guide-context-title></strong><button type="button" data-guide-top aria-label="${tx('backToTop')}">↑</button></div>`;
}
function guides() {
  const currentVsGuide=`vs-${state.weekday}`;
  const vsGuides=[currentVsGuide,...WEEKDAYS.map(day=>`vs-${day}`).filter(id=>id!==currentVsGuide),'vs-secret-missions'];
  const search=`<label class="search">${tx('search')}<input type="search" id="search" autocomplete="off" value="${escape(guideSearchQuery)}"></label><p id="no-results" role="status" hidden>${tx('noResults')}</p>`;
  const techLibrary=`<div class="guide-disclosures">${techGuideDisclosure()}</div>`;
  const vsLibrary=`<div class="guide-disclosures">${vsGuides.map(guideDisclosure).join('')}</div>`;
  const trainLibrary=`<div class="guide-disclosures">${trainGuideDisclosure()}</div>`;
  const seasonLibrary=seasonGuideRoadmapLibrary();
  const vsSection=`<section class="section guide-section--vs"><h2>${tx('vs')}</h2>${vsLibrary}</section>`;
  const seasonSection=`<section class="section guide-section--season"><h2>${tx('season')}</h2>${seasonGuidePosition()}${seasonLibrary}</section>`;
  const trainSection=`<section class="section guide-section--alliance"><h2>${escape(trainGuideSectionTitle(lang))}</h2>${trainLibrary}</section>`;
  const techSection=`<section class="section"><h2>${tx('filterTech')}</h2>${techLibrary}</section>`;
  return `${guideContextBar()}<h1>${tx('guides')}</h1><p class="intro">${tx('guideIntro')}</p>${notice()}${search}${guideFilterBar()}<div class="guide-library">${vsSection}${seasonSection}${trainSection}${techSection}</div>${section('quickReference',referenceLibrary())}`;
}
const views = {today,daily,vs,season,guides,admin:()=>`<h1>${tx('admin')}</h1>${paragraph('adminPending')}`};
function syncChrome() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-ui]').forEach(el=>{el.textContent = t(el.dataset.ui);});
  document.querySelector('#language').value = lang;
  document.querySelector('#override').textContent = t('override');
  document.querySelector('#honest').textContent = t('honest');
  document.querySelector('.site-footer small').textContent = `RZSN · Rising Sun · Luna · ${BUILD_VERSION}`;
  document.querySelector('.main-nav').setAttribute('aria-label',t('menu'));
  syncThemeControls();
  const adminUrl = ALLIANCE_CONFIG.adminUrl;
  if (adminUrl && (/^https:\/\//i.test(adminUrl) || /^\/admin\/$/.test(adminUrl))) {
    document.querySelector('#admin-link').href = adminUrl;
    document.querySelector('#admin-link').rel = 'noreferrer';
  }
  document.querySelectorAll('.main-nav a').forEach(a=>{
    if (a.hash === `#${currentView}`) a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
  showStorageError();
}
function showStorageError() {
  const error = document.querySelector('#storage-error');
  error.hidden = !storageFailed;
  error.textContent = t('unavailableStorage');
}
function syncTaskState() {
  const skipped=checkedMap(storage.get(availabilityKey(state)));
  const describe=refs=>({refs,done:taskDone(storage,refs),unavailable:skipped[taskToken(refs[0])]===true});
  main.querySelectorAll('[data-task-progress]').forEach(element=>{
    const stats=taskProgress(JSON.parse(element.dataset.refs).map(describe));
    element.querySelector('[data-progress-label]').textContent=t('progress',stats);
    const bar=element.querySelector('progress');
    bar.value=stats.done;bar.max=stats.total||1;
  });
  main.querySelectorAll('[data-task-row]').forEach(row=>{
    const refs=JSON.parse(row.dataset.refs);
    const input=row.querySelector('[data-check]');
    const unavailable=checkedMap(storage.get(`rzsn-unavailable-${input.dataset.date}`))[taskToken(refs[0])]===true;
    const item={refs,done:taskDone(storage,refs),unavailable};
    input.checked=item.done;input.disabled=unavailable;
    row.dataset.done=String(item.done);row.dataset.unavailable=String(unavailable);
    row.hidden=!taskVisible(item,row.closest('[data-task-list]').dataset.taskFilter);
    row.querySelector('[data-unavailable-toggle]').textContent=t(unavailable?'restoreTask':'skipToday');
  });
  main.querySelectorAll('[data-task-group]').forEach(group=>{
    const items=[...group.querySelectorAll('[data-task-row]')].map(row=>describe(JSON.parse(row.dataset.refs)));
    const stats=taskProgress(items);
    group.querySelector('[data-group-progress]').textContent=`${stats.done} / ${stats.total}`;
    group.hidden=!group.querySelector('[data-task-row]:not([hidden])');
  });
  const empty=main.querySelector('[data-tasks-empty]');
  if (empty) {
    empty.hidden=Boolean(main.querySelector('[data-task-row]:not([hidden])'));
    empty.textContent=t(taskFilter==='unavailable'?'noneUnavailable':'allDone');
  }
}
function openDirectGuide(guideId,{sectionId='',scroll=true}={}) {
  if (!guideId || currentView!=='guides') return false;
  const target=[...main.querySelectorAll('[data-guide-id]')].find(el=>el.dataset.guideId===guideId);
  if (!target) return false;
  target.hidden=false;
  target.open=true;
  let scrollTarget=target;
  if (sectionId) {
    const nested=[...target.querySelectorAll('[data-section-id]')].find(el=>el.dataset.sectionId===sectionId);
    if (nested) { nested.hidden=false; nested.open=true; scrollTarget=nested; }
  }
  if (scroll) requestAnimationFrame(()=>scrollTarget.scrollIntoView({behavior:'auto',block:'start',inline:'nearest'}));
  return true;
}
function decorateGuidePreviews() {
  const selectors='.guide-disclosure,.guide-text__block,.tech-guide__phase,.tech-guide__topic,.profession-path__section,.profession-path__tips-disclosure';
  main.querySelectorAll(selectors).forEach(details=>{
    const summary=details.querySelector(':scope > summary');
    if (!summary || summary.querySelector(':scope > .disclosure-title')) return;
    const title=document.createElement('span');
    title.className='disclosure-title';
    while (summary.firstChild) title.append(summary.firstChild);
    summary.append(title);

    const source=details.querySelector(
      ':scope > .guide-card--inside,:scope > .tech-guide-shell,:scope > .guide-text__block-body,:scope > .tech-guide__phase-body,:scope > .tech-guide__topic-body,:scope > .profession-path__body,:scope > .profession-path__tips'
    );
    const previewNode=source?.querySelector('p:not(.guide-text__label),li');
    const previewText=previewNode?.textContent.replace(/\s+/g,' ').trim();
    if (previewText) {
      const preview=document.createElement('span');
      preview.className='disclosure-preview';
      preview.setAttribute('aria-hidden','true');
      preview.textContent=previewText;
      summary.append(preview);
      details.classList.add('disclosure-has-preview');
    }
    const sectionId=details.dataset.sectionId;
    const guide=details.closest('[data-guide-id]');
    if (sectionId && guide && source && !source.querySelector(':scope > .section-share-row')) {
      const row=document.createElement('div');
      row.className='section-share-row';
      row.innerHTML=`<button type="button" class="section-share" data-share-section="${escape(sectionId)}" data-share-guide="${escape(guide.dataset.guideId)}">${tx('shareSection')}</button>`;
      source.prepend(row);
    }
  });
}
function setupGuideContextBar() {
  guideContextObserver?.disconnect();
  guideContextObserver=null;
  const bar=main.querySelector('#guide-context-bar');
  if (!bar) return;
  const openGuide=main.querySelector('.guide-disclosure[open][data-guide-id]');
  if (!openGuide) { bar.hidden=true; return; }
  const summary=openGuide.querySelector(':scope > summary');
  const title=summary?.querySelector('.disclosure-title')?.textContent?.trim() || summary?.textContent?.trim() || '';
  const titleEl=bar.querySelector('[data-guide-context-title]');
  if (titleEl) titleEl.textContent=title;
  guideContextObserver=new IntersectionObserver(entries=>{
    bar.hidden=entries[0]?.isIntersecting!==false;
  },{threshold:0,rootMargin:'-8px 0px 0px 0px'});
  if (summary) guideContextObserver.observe(summary);
}
function highlightGuideLabel(element,query) {
  if (!element) return;
  const base=element.dataset.searchLabel || element.textContent || '';
  if (!element.dataset.searchLabel) element.dataset.searchLabel=base;
  element.replaceChildren();
  if (!query) { element.textContent=base; return; }
  const lower=base.toLocaleLowerCase(LOCALES[lang]);
  const needle=query.toLocaleLowerCase(LOCALES[lang]);
  const index=lower.indexOf(needle);
  if (index<0) { element.textContent=base; return; }
  element.append(document.createTextNode(base.slice(0,index)));
  const mark=document.createElement('mark');
  mark.textContent=base.slice(index,index+needle.length);
  element.append(mark,document.createTextNode(base.slice(index+needle.length)));
}
function applyGuideFilters() {
  if (currentView!=='guides') return;
  const raw=guideSearchQuery.trim();
  const query=raw.toLocaleLowerCase(LOCALES[lang]);
  let found=0;
  main.querySelectorAll('[data-filter-item]').forEach(item=>{
    const filterMatch=guideFilter==='all'
      || (guideFilter==='current' && item.dataset.guideCurrent==='true')
      || item.dataset.guideCategory===guideFilter;
    const haystack=(item.textContent+(item.dataset.searchExtra||'')).toLocaleLowerCase(LOCALES[lang]);
    const searchMatch=!query || haystack.includes(query);
    item.hidden=!(filterMatch && searchMatch);
    if (!item.hidden) found++;

    if (item.matches('.guide-disclosure')) {
      item.classList.toggle('guide-disclosure--search-match',Boolean(query) && !item.hidden);
      if (query) item.open=false;
      const title=item.querySelector(':scope > summary > .disclosure-title');
      highlightGuideLabel(title,raw);
      const titleText=(title?.dataset.searchLabel || title?.textContent || '').toLocaleLowerCase(LOCALES[lang]);
      const titleMatch=!query || titleText.includes(query);
      const nested=item.querySelectorAll('.guide-text__block,.profession-path__section,.profession-path__tips-disclosure,.tech-guide__phase,.tech-guide__topic');
      nested.forEach(section=>{
        section.open=false;
        section.hidden=Boolean(query) && !titleMatch && !section.textContent.toLocaleLowerCase(LOCALES[lang]).includes(query);
      });
    } else {
      highlightGuideLabel(item.querySelector('dt'),raw);
    }
  });
  main.querySelectorAll('[data-search-group]').forEach(group=>{
    group.hidden=!group.querySelector('[data-filter-item]:not([hidden])');
  });
  main.querySelectorAll('.guide-library>.section').forEach(group=>{
    group.hidden=!group.querySelector('[data-filter-item]:not([hidden])');
  });
  const referenceSection=main.querySelector('#search-results')?.closest('.section');
  if (referenceSection) referenceSection.hidden=!referenceSection.querySelector('[data-filter-item]:not([hidden])');
  const noResults=main.querySelector('#no-results');
  if (noResults) noResults.hidden=found>0;
  const count=main.querySelector('#guide-results-count');
  if (count) count.textContent=t('resultsCount',{count:found});
}
function render({focus = false,preserve = false} = {}) {
  const route=memberRoute(location.hash);
  if (route.view === 'main') { main.focus(); return; }
  currentView = Object.hasOwn(views,route.view) ? route.view : 'today';
  if (currentView==='guides' && route.guideId) { guideFilter='all'; guideSearchQuery=''; }
  const open = preserve ? new Set([...main.querySelectorAll('details[open][data-disclosure]')].map(el=>el.dataset.disclosure)) : null;
  main.innerHTML = views[currentView]();
  if (open) main.querySelectorAll('[data-disclosure]').forEach(el=>{el.open=open.has(el.dataset.disclosure);});
  decorateGuidePreviews();
  syncTaskState();
  syncChrome();
  document.title = `${t(currentView==='daily'?'tasks':currentView)} · RZSN Member Hub`;
  if (currentView==='guides') applyGuideFilters();
  const directGuide=openDirectGuide(route.guideId,{sectionId:route.sectionId,scroll:true});
  if (currentView==='guides') requestAnimationFrame(setupGuideContextBar);
  if (focus && !directGuide) { main.focus({preventScroll:true}); window.scrollTo(0,0); }
}
function refreshClock() {
  const next = guideState();
  if (next.date!==state.date) {
    state=next; selectedDay=state.weekdayIndex; render({preserve:true});
  } else {
    state=next;
    const timer = document.querySelector('#countdown');
    if (timer) timer.textContent=countdown();
    document.querySelectorAll('[data-arms-state]').forEach(el=>{const phase=armsWindow(state,DAILY_GUIDES[state.weekday]);el.textContent=t(phase);el.dataset.state=phase;});
    document.querySelectorAll('[data-reset-countdown]').forEach(el=>{el.textContent=remainingReset();});
  }
}
const languageEntries = Object.entries(LANGUAGES).sort(([a],[b])=>a==='en'?-1:b==='en'?1:0);
document.querySelector('#language').innerHTML = languageEntries.map(([code,name])=>`<option value="${code}" lang="${code}">${code.toUpperCase()} · ${escape(name)}</option>`).join('');
setupLanguage.innerHTML = languageEntries.map(([code,name])=>`<option value="${code}" lang="${code}">${escape(name)}</option>`).join('');
setupLanguage.value=lang;
let setupLanguageChosen = true;
const savedThemeRaw = storage.get('rzsn-theme',legacyPreference('lw_theme'));
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
let activeTheme = ['light','dark'].includes(savedThemeRaw) ? savedThemeRaw : systemTheme;
let setupThemeChosen = true;
function updateSetupReady() {
  setupContinue.disabled = !(setupLanguageChosen && setupThemeChosen);
}
function syncThemeControls() {
  document.documentElement.dataset.theme=activeTheme;
  const nextTheme=activeTheme==='dark'?'light':'dark';
  themeToggle.querySelector('span').textContent=activeTheme==='dark'?'🌙':'☀️';
  const label=`${t('theme')} · ${t(nextTheme)}`;
  themeToggle.setAttribute('aria-label',label);
  themeToggle.title=label;
  themeOptions.querySelectorAll('[data-theme-choice]').forEach(button=>{
    if (button.value===activeTheme) button.setAttribute('aria-current','true');
    else button.removeAttribute('aria-current');
  });
  updateSetupReady();
}
function setTheme(value,{persist=true}={}) {
  if (!['light','dark'].includes(value)) return;
  activeTheme=value;
  if (persist) storage.set('rzsn-theme',value);
  syncThemeControls();
  showStorageError();
}
setTheme(activeTheme,{persist:false});
async function setLanguage(value,{persist=true}={}) {
  if (!Object.hasOwn(LANGUAGES,value)) return;
  await loadLanguage(value);
  lang=value;
  setupLanguageChosen=true;
  if (persist) storage.set('rzsn-language',lang);
  document.querySelector('#language').value=lang;
  setupLanguage.value=lang;
  render({preserve:true});
  updateSetupReady();
  showStorageError();
}
document.querySelector('#language').addEventListener('change',async event=>setLanguage(event.target.value));
setupLanguage.addEventListener('change',async event=>setLanguage(event.target.value));
themeOptions.addEventListener('click',event=>{
  const button=event.target.closest('[data-theme-choice]');
  if (!button) return;
  setupThemeChosen=true;
  setTheme(button.value);
});
setupContinue.addEventListener('click',()=>{
  if (!setupLanguageChosen || !setupThemeChosen) return;
  storage.set('rzsn-language',lang);
  languageDialog.close();
});
settingsOpen.addEventListener('click',()=>{menu.open=false;languageDialog.showModal();});
firstVisitSettings.addEventListener('click',()=>{firstVisitNote.hidden=true;languageDialog.showModal();});
firstVisitDismiss.addEventListener('click',()=>{firstVisitNote.hidden=true;storage.set('rzsn-first-visit-note',true);});
languageDialog.addEventListener('cancel',event=>{event.preventDefault();languageDialog.close();});
themeToggle.addEventListener('click',()=>{
  setupThemeChosen=true;
  setTheme(activeTheme==='dark'?'light':'dark');
});
document.addEventListener('keydown',event=>{if (event.key==='Escape' && menu.open) {menu.open=false;menu.querySelector('summary').focus();}});
document.addEventListener('click',event=>{if (!menu.contains(event.target)) menu.open=false;});
document.addEventListener('error',event=>{
  const image=event.target;
  if (!(image instanceof HTMLImageElement) || !image.matches('[data-guide-image]')) return;
  if (!image.dataset.retried) {
    image.dataset.retried='true';
    const retryUrl=new URL(image.dataset.src,document.baseURI);
    retryUrl.searchParams.set('v',BUILD_VERSION);
    image.src=retryUrl.href;
    return;
  }
  image.closest('a').hidden=true;
  image.closest('.guide-figure').querySelector('.guide-image-fallback').hidden=false;
},true);
main.addEventListener('click',event=>{
  const button = event.target.closest('[data-day]');
  if (!button) return;
  selectedDay=Number(button.dataset.day); render();
  main.querySelector(`[data-day="${selectedDay}"]`).focus({preventScroll:true});
});
async function copyGuideLink(url) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }
  const input=document.createElement('textarea');
  input.value=url;
  input.setAttribute('readonly','');
  input.style.position='fixed';
  input.style.opacity='0';
  document.body.append(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}
main.addEventListener('click',async event=>{
  const button=event.target.closest('[data-share-guide]');
  if (!button) return;
  const id=button.dataset.shareGuide;
  const sectionId=button.dataset.shareSection || '';
  const disclosure=button.closest('[data-guide-id]');
  const section=sectionId ? button.closest('[data-section-id]') : null;
  const title=(section?.querySelector(':scope > summary') || disclosure?.querySelector(':scope > summary'))?.textContent?.trim() || 'RZSN Guide';
  const url=guideUrl(id,location.href,sectionId);
  try {
    if (navigator.share) {
      await navigator.share({title,url});
      return;
    }
    await copyGuideLink(url);
    const previous=button.textContent;
    button.textContent=t('linkCopied');
    setTimeout(()=>{if(button.isConnected) button.textContent=previous;},1600);
  } catch (error) {
    if (error?.name!=='AbortError') {
      try {
        await copyGuideLink(url);
        const previous=button.textContent;
        button.textContent=t('linkCopied');
        setTimeout(()=>{if(button.isConnected) button.textContent=previous;},1600);
      } catch {}
    }
  }
});

main.addEventListener('change',event=>{
  const input=event.target;
  if (input.matches('[data-shield-check]')) {
    storage.set(input.dataset.key,input.checked);
    input.closest('.enemy-buster').dataset.confirmed=String(input.checked);
    showStorageError();
    return;
  }
  if (!input.matches('[data-check]')) return;
  const refs=JSON.parse(input.closest('[data-task-row]').dataset.refs);
  writeTask(storage,refs,input.checked);
  const task=TASKS.find(task=>task.id===input.dataset.check);
  if (input.dataset.kind==='daily' && ['every_48h','every_2_days'].includes(task?.frequency)) {
    const previous=storage.get('rzsn-cadence',{});
    const history=previous && typeof previous==='object' && !Array.isArray(previous)?previous:{};
    if (input.checked) history[task.id]=state.now.getTime(); else delete history[task.id];
    storage.set('rzsn-cadence',history);
  }
  syncTaskState();
  if (currentView==='today') {
    render({preserve:true});
    main.querySelector('[data-check],.text-link')?.focus({preventScroll:true});
  } else if (input.closest('[hidden]')) {
    main.querySelector('[data-task-filter-button][aria-pressed="true"]')?.focus({preventScroll:true});
  }
  showStorageError();
});
main.addEventListener('click',event=>{
  const filter=event.target.closest('[data-task-filter-button]');
  if (filter) {
    taskFilter=filter.dataset.taskFilterButton;
    main.querySelectorAll('[data-task-filter-button]').forEach(button=>button.setAttribute('aria-pressed',String(button===filter)));
    main.querySelectorAll('[data-task-list]').forEach(list=>{list.dataset.taskFilter=taskFilter;});
    syncTaskState();
    if (!main.querySelector('[data-task-group][open]:not([hidden])')) {
      const first=main.querySelector('[data-task-group]:not([hidden])');
      if (first) first.open=true;
    }
  }
  const button=event.target.closest('[data-unavailable-toggle]');
  if (!button) return;
  const key=`rzsn-unavailable-${button.dataset.date}`;
  const unavailable=checkedMap(storage.get(key));
  if (unavailable[button.dataset.token]) delete unavailable[button.dataset.token];
  else unavailable[button.dataset.token]=true;
  storage.set(key,unavailable);
  syncTaskState();
  if (currentView==='today') render({preserve:true});
  if (!button.isConnected || button.closest('[hidden]')) main.querySelector('[data-task-filter-button][aria-pressed="true"],[data-check]:not(:disabled),.text-link')?.focus({preventScroll:true});
  showStorageError();
});
main.addEventListener('input',event=>{
  if (event.target.id!=='search') return;
  guideSearchQuery=event.target.value;
  if (guideSearchQuery.trim() && guideFilter==='current') {
    guideFilter='all';
    main.querySelectorAll('[data-guide-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.guideFilter===guideFilter)));
  }
  applyGuideFilters();
  setupGuideContextBar();
});
main.addEventListener('click',event=>{
  const seasonJump=event.target.closest('[data-season-jump]');
  if (seasonJump) {
    event.preventDefault();
    document.getElementById(seasonJump.dataset.seasonJump)?.scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  const filter=event.target.closest('[data-guide-filter]');
  if (filter) {
    guideFilter=filter.dataset.guideFilter;
    main.querySelectorAll('[data-guide-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button===filter)));
    applyGuideFilters();
    setupGuideContextBar();
    return;
  }
  const top=event.target.closest('[data-guide-top]');
  if (top) {
    const openGuide=main.querySelector('.guide-disclosure[open][data-guide-id]');
    (openGuide || main).scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  if (event.target.closest('.guide-disclosure>summary')) requestAnimationFrame(()=>setTimeout(setupGuideContextBar,0));
});
window.addEventListener('hashchange',()=>{menu.open=false;render({focus:true});});
window.addEventListener('storage',()=>render({preserve:true}));
window.addEventListener('focus',refreshClock);
new ResizeObserver(entries=>{
  document.documentElement.style.setProperty('--nav-height',`${Math.ceil(entries[0].target.getBoundingClientRect().height)+16}px`);
}).observe(document.querySelector('.main-nav'));
document.addEventListener('visibilitychange',()=>{if (!document.hidden) refreshClock();});
setInterval(refreshClock,15000);

let installPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installPrompt=event;
  installApp.hidden=false;
});
installApp.addEventListener('click',async()=>{
  if (!installPrompt) return;
  menu.open=false;
  await installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt=null;
  installApp.hidden=true;
});
window.addEventListener('appinstalled',()=>{installPrompt=null;installApp.hidden=true;});
if ('serviceWorker' in navigator && location.protocol==='https:') {
  navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
}

render();
if (languagePreference.detected && !storage.get('rzsn-first-visit-note',false)) firstVisitNote.hidden=false;
