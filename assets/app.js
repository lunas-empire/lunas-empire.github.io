import { BUILD_VERSION, ALLIANCE_CONFIG, LIVE_NOTICE } from './config.js';
import { LANGUAGES, LOCALES, UI, resolveLanguagePreference, translate } from './i18n.js';
import { COPY, TASKS, DAILY_GUIDES } from './content.js';
import { DAY_ONE_GROUP, SEASON_COPY, SEASON_CONTENT, SEASON_GUIDES, seasonTasks, seasonSynergies, upcoming } from './season.js';
import { GUIDE_COPY, GUIDE_TEXT, MEMBER_MEDIA } from './guide-text.js';
import { SEASON_LIBRARY_COPY, SEASON_LIBRARY_GUIDES, SEASON_LIBRARY_MEDIA } from './season-library.js';
import { TECH_GUIDE_HTML, TECH_GUIDE_TITLE } from './tech-guide.js';
import { professionGuideHtml, PROFESSION_GUIDE_SEARCH } from './profession-guide.js';
import { DAY_MS, WEEKDAYS, guideState, selectedDate, checklistKey, armsWindow, availableTask, enemyBusterPhase } from './engine.js';
import { todayPriorities } from './priority.js';
import { createStorage, checkedMap } from './storage.js';

const dictionary = {...UI,...COPY,...SEASON_COPY,...GUIDE_COPY,...SEASON_LIBRARY_COPY};
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let storageFailed = false;
const storage = createStorage(() => window.localStorage, () => { storageFailed = true; });
function legacyPreference(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
const storedLanguage = storage.get('rzsn-language', null);
const legacyLanguage = legacyPreference('lw_lang');
const languagePreference = resolveLanguagePreference(storedLanguage,legacyLanguage);
let lang = languagePreference.lang;
let state = guideState();
let selectedDay = state.weekdayIndex;
let currentView = '';
const t = (key, values) => translate(dictionary,key,lang,values);
const tx = (key, values) => escape(t(key,values));
const main = document.querySelector('main');
const menu = document.querySelector('#menu');
const languageDialog = document.querySelector('#language-dialog');
const setupLanguage = document.querySelector('#setup-language');
const themeOptions = document.querySelector('#theme-options');
const setupContinue = document.querySelector('#setup-continue');
const themeToggle = document.querySelector('#theme-toggle');
const phaseLabel = s => s.phase === 'PRE_SEASON' ? t('pre') : s.phase === 'POST_SEASON' ? t('post') : `${t('week')} ${s.week}`;
const longDate = date => new Intl.DateTimeFormat(LOCALES[lang], {dateStyle:'full',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
const paragraph = key => `<p>${tx(key)}</p>`;
const list = keys => `<ul class="plain">${keys.map(k=>`<li>${tx(k)}</li>`).join('')}</ul>`;
const section = (title, body) => `<section class="section"><h2>${tx(title)}</h2>${body}</section>`;
const details = (title, body, open = false, id = '') => `<details${open?' open':''}${id?` data-disclosure="${escape(id)}"`:''}><summary>${escape(title)}</summary>${body}</details>`;
const link = (view, text) => `<a class="link-button" href="#${view}">${tx(text)} <span aria-hidden="true">→</span></a>`;
const permitted = id => !LIVE_NOTICE.active || !LIVE_NOTICE.suppressTaskIds.includes(id);
const guideAlt = media => media.day ? t('dayGuideAlt',{day:t(media.day)}) : t(media.alt);
function guideFigure(id) {
  const media=MEMBER_MEDIA[id];
  const alt=guideAlt(media);
  return `<figure class="guide-figure"><a href="${media.src}" target="_blank" rel="noopener" aria-label="${escape(alt)} ${tx('imageHint')}"><img src="${media.src}" data-guide-image data-src="${media.src}" width="${media.width}" height="${media.height}" loading="lazy" decoding="async" alt="${escape(alt)}"></a><div class="guide-image-fallback" role="status" hidden><strong>${tx('imageUnavailable')}</strong><a href="${media.src}" target="_blank" rel="noopener">${tx('imageOpenOriginal')}</a></div><figcaption><strong>${escape(alt)}</strong><span>${tx('imageHint')}</span><small>${tx('imageLanguage')}</small></figcaption></figure>`;
}
function guideTextBlocks(title,blocks,{showTitle=true}={}) {
  return `<section class="guide-text"><p class="guide-text__label">${tx('guideTextTitle')}</p>${showTitle?`<h3>${escape(title)}</h3>`:''}<p class="guide-text__intro">${tx('guideTextIntro')}</p><div class="guide-text__blocks">${blocks.map(block=>`<section class="guide-text__block${block.tone==='warning'?' guide-text__block--warning':''}"><h4>${tx(block.heading)}</h4><p>${tx(block.text)}</p></section>`).join('')}</div></section>`;
}
function guideText(id,{showTitle=true}={}) {
  return guideTextBlocks(guideAlt(MEMBER_MEDIA[id]),GUIDE_TEXT[id],{showTitle});
}
const guideCard = id => `<article class="guide-card">${guideText(id)}${guideFigure(id)}</article>`;
const guideGallery = ids => ids.length ? `<div class="guide-gallery">${ids.map(guideCard).join('')}</div>` : '';
function guideDisclosure(id) {
  const title=guideAlt(MEMBER_MEDIA[id]);
  return `<details class="guide-disclosure" data-search><summary>${escape(title)}</summary><article class="guide-card guide-card--inside">${guideText(id,{showTitle:false})}${guideFigure(id)}</article></details>`;
}
function seasonLibraryFigure(code,title) {
  const media=SEASON_LIBRARY_MEDIA[code];
  const alt=`${title} · #${code}`;
  return `<figure class="guide-figure"><a href="${media.src}" target="_blank" rel="noopener" aria-label="${escape(alt)} ${tx('imageHint')}"><img src="${media.src}" data-guide-image data-src="${media.src}" width="${media.width}" height="${media.height}" loading="lazy" decoding="async" alt="${escape(alt)}"></a><div class="guide-image-fallback" role="status" hidden><strong>${tx('imageUnavailable')}</strong><a href="${media.src}" target="_blank" rel="noopener">${tx('imageOpenOriginal')}</a></div><figcaption><strong>${escape(alt)}</strong><span>${tx('imageHint')}</span><small>${tx('imageLanguage')}</small></figcaption></figure>`;
}
function seasonLibraryDisclosure(id) {
  const guide=SEASON_LIBRARY_GUIDES[id];
  const title=t(guide.title);
  const images=`<div class="season-library-images">${guide.media.map(code=>seasonLibraryFigure(code,title)).join('')}</div>`;
  const profession=id==='profession'?professionGuideHtml(lang,escape):'';
  const searchTerms=id==='profession'?` ${PROFESSION_GUIDE_SEARCH}`:'';
  return `<details class="guide-disclosure" data-search data-season-guide="${escape(id)}" data-search-extra="${escape(searchTerms)}"><summary>${escape(title)}</summary><article class="guide-card guide-card--inside">${guideTextBlocks(title,guide.blocks,{showTitle:false})}${profession}${images}</article></details>`;
}
function techGuideDisclosure() {
  return `<details class="guide-disclosure guide-disclosure--tech" data-search data-tech-guide><summary>${escape(TECH_GUIDE_TITLE)}</summary><div class="tech-guide-shell">${TECH_GUIDE_HTML}</div></details>`;
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
  return `<div class="status"><div><small>${tx('serverDay')}</small><strong>${state.serverDay}</strong></div><div><small>${escape(phaseLabel(state))}</small>${state.seasonDay && state.week <= 8 ? `<strong>${tx('seasonDay')} ${state.seasonDay}</strong>` : ''}</div>${state.phase === 'PRE_SEASON' ? `<div class="countdown"><small>${tx('starts')}</small><strong id="countdown" role="timer" aria-live="off">${escape(countdown())}</strong></div>` : ''}</div><small>${tx('reset')}</small>`;
}
function arms(s, guide) {
  if (!guide.arms) return paragraph('unconfirmed');
  const hours = n => `${String(n % 24).padStart(2,'0')}:00`;
  return `<strong class="time">${hours(guide.arms.start)}–${hours(guide.arms.end)} ST</strong><p>${escape(guide.arms.type)}</p>${s.date === state.date ? `<p data-arms-state>${tx(armsWindow(state,guide))}</p>` : ''}<small>${tx('armsNote')}</small>`;
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
  const checks = checkedMap(storage.get(checklistKey('daily',s)));
  return TASKS.filter(task => availableTask(task,s) && permitted(task.id)).filter(task => {
    if (!['every_48h','every_2_days'].includes(task.frequency)) return true;
    const last = Number(history?.[task.id]);
    return checks[task.id] || !last || s.now.getTime() - last >= 2 * DAY_MS;
  });
}
function progress(kind, ids, s = state) {
  const checks = checkedMap(storage.get(checklistKey(kind,s)));
  const done = ids.filter(id=>checks[id]).length;
  return `<div class="progress-row"><span>${tx('routine')}</span><span data-progress-label>${tx('progress',{done,total:ids.length})}</span></div><progress value="${done}" max="${ids.length || 1}" aria-label="${tx('routine')}" data-progress-bar></progress>`;
}
function frequencyText(task) {
  if (['every_48h','every_2_days'].includes(task.frequency)) return t('every2');
  if (['event_specific','season_specific'].includes(task.frequency)) return t('available');
  return task.frequency === 'twice_daily' ? t('twice') : '';
}
function checklist(kind, tasks, s = state) {
  return `<ul class="checklist">${tasks.filter(task=>permitted(task.id)).map(task=>{
    // Doom Walker remains a normal daily mark; pumpkin likes have their own Season-daily reset.
    const itemKind=kind==='season' && task.id==='doom'
      ? 'daily'
      : kind==='season' && task.id==='pumpkinLikes'
        ? 'seasonDaily'
        : kind;
    const key=checklistKey(itemKind,s);
    const checks=checkedMap(storage.get(key));
    return `<li><label><input type="checkbox" data-check="${escape(task.id)}" data-key="${key}" data-kind="${itemKind}"${checks[task.id]?' checked':''}><span class="task-text">${tx(task.text || task.id)}${task.frequency && frequencyText(task)?`<small>${escape(frequencyText(task))}</small>`:''}</span></label></li>`;
  }).join('')}</ul>`;
}
function nextCards(limit = 3, excludedDays = []) {
  return upcoming(state,limit,excludedDays).map(e=>details(`${t('seasonDay')} ${e.day} · ${['kim','dva','tesla'].includes(e.id)?{kim:'Kimberly',dva:'DVA',tesla:'Tesla'}[e.id]:t('next')}`,paragraph(e.id)+(e.id==='kim'?guideCard('weapons'):'')+(['kim','dva','tesla'].includes(e.id)?paragraph('weapon'):''))).join('');
}
function today() {
  const guide = DAILY_GUIDES[state.weekday];
  const priorities = todayPriorities(state);
  const shown = new Set(priorities.map(p=>p.id));
  const cards = priorities.filter(p=>p.id!=='notice').map(p=>`<li class="${p.id==='shield'?'warning':''}" data-priority="${p.id}"><span class="badge">${tx(p.source)}</span>${p.id==='arms'?arms(state,guide):p.id==='save'?list(guide.save.filter(permitted)):p.id==='shield'?`<h3>${tx(p.id)}</h3>`:paragraph(p.id)}</li>`).join('');
  const seasonPool=seasonTasks(state).filter(id=>!shown.has(id) && permitted(id));
  const seasonIds=(state.seasonDay>=1 && state.seasonDay<=56
    ? ['profession','pumpkinLikes',...seasonPool.filter(id=>!['profession','pumpkinLikes'].includes(id))]
    : seasonPool).slice(0,state.seasonDay?2:1);
  const nextSeason = state.phase === 'PRE_SEASON' ? first24() : nextCards(1);
  return `<h1>MEMBER HUB</h1><p class="intro">${escape(longDate(state.date))}</p>${status()}${notice()}${enemyBusterBanner(state)}${starterGuide()}${section('focus',`<ul class="priority-list">${cards}</ul>`)}${section('daily',`${paragraph('dailyIntro')}${progress('daily',dailyTasks().map(task=>task.id))}${link('daily','checklist')}`)}${section('vs',`${paragraph('vsIntro')}<h3>${tx(state.weekday)}</h3>${minimum()}${guideCard(`vs-${state.weekday}`)}${!shown.has('arms')?details(t('bestArms'),arms(state,guide)):''}${!shown.has('save')?details(t('save'),list(guide.save.filter(permitted))):''}${link('vs','details')}`)}${section('season',`<h3>${escape(phaseLabel(state))}</h3>${list(seasonIds)}${link('season','details')}`)}${section('next',`<h3>${tx('tomorrow')} · ${tx(WEEKDAYS[(state.weekdayIndex+1)%7])}</h3>${nextSeason}`)}`;
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
  const tasks = dailyTasks();
  return `<h1>${tx('daily')}</h1><p class="intro">${escape(longDate(state.date))} · ${tx('reset')}</p>${paragraph('dailyIntro')}${notice()}${progress('daily',tasks.map(task=>task.id))}<aside class="card warning">${paragraph('safeServer')}</aside>${['freebies','alliance','action','map','timing'].map(category=>details(t(category),checklist('daily',tasks.filter(task=>task.category===category))+(category==='timing'?paragraph('minister')+paragraph('philosophy')+paragraph('ssr'):''),category==='freebies',category)).join('')}${link('vs','vs')}`;
}
function vs() {
  const date = selectedDate(state,selectedDay);
  const s = guideState(new Date(`${date}T12:00:00+02:00`));
  const guide = DAILY_GUIDES[s.weekday];
  const tasks = [...new Set([...guide.tasks,...seasonSynergies(s)])].map(id=>({id}));
  const guideIds=[`vs-${s.weekday}`];
  return `<h1>${tx('vs')}</h1>${paragraph('vsIntro')}${notice()}${daySelector()}<p class="intro">${escape(longDate(s.date))}</p><h2>${tx(s.weekday)}</h2>${minimum(s)}${enemyBusterBanner(s)}${guideGallery(guideIds)}${checklist('vs',tasks,s)}${section('bestArms',arms(s,guide))}${section('avoid',list(guide.avoid.filter(permitted)))}${section('save',list(guide.save.filter(permitted)))}${details(t('secretMissionsGuideTitle'),guideCard('vs-secret-missions'),false,'secret-missions-guide')}${section('tomorrow',`<h3>${tx(WEEKDAYS[(selectedDay+1)%7])}</h3>`)}${selectedDay===6?paragraph('fight'):''}`;
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
  const ids = seasonTasks(state);
  const current = state.week > 8 ? 9 : state.week;
  const isPreSeason = state.phase === 'PRE_SEASON';
  const isDayOne = state.seasonDay === DAY_ONE_GROUP.day;
  const todayIds = isPreSeason ? ['prepSeason'] : isDayOne ? DAY_ONE_GROUP.tasks : [
    ...(state.seasonDay >= 1 && state.seasonDay <= 56 ? ['profession','pumpkinLikes','doom','resistanceCheck'] : []),
    ...seasonSynergies(state),
  ];
  const uniqueTodayIds = [...new Set(todayIds)].filter(id=>ids.includes(id));
  const weekIds = ids.filter(id=>!uniqueTodayIds.includes(id));
  const todayBody = isDayOne ? first24({withChecklist:true,open:true}) : checklist('season',uniqueTodayIds.map(id=>({id})));
  const nextBody = isPreSeason
    ? first24({open:state.countdown<=3*DAY_MS})+nextCards(3,[DAY_ONE_GROUP.day])
    : nextCards();
  const timeline = Object.entries(SEASON_CONTENT).map(([phase,items],index)=>details(index===0?t('pre'):index===9?t('post'):`${t('week')} ${index}`,list(items)+guideGallery(SEASON_GUIDES[phase] || []),index===current || index===current+1,phase)).join('');
  return `<h1>${tx('season')}</h1>${status()}${notice()}${section('today',todayBody)}${section('thisWeek',`<h3>${escape(phaseLabel(state))}</h3>${checklist('season',weekIds.map(id=>({id})))}`)}${section('next',nextBody)}${section('timeline',timeline)}`;
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
  return `<div id="search-results" class="reference-groups">${REFERENCE_GROUPS.map(group=>`<section class="reference-group" data-search-group><h3>${tx(group.title)}</h3><dl class="reference-list">${group.ids.map(id=>`<div class="reference-note" data-search="${id}"><dt>${escape(REFERENCE_LABELS[id])}</dt><dd>${paragraph(id)}</dd></div>`).join('')}</dl></section>`).join('')}</div>`;
}
function guides() {
  const vsGuides=[...WEEKDAYS.map(day=>`vs-${day}`),'vs-secret-missions'];
  const seasonGuides=Object.keys(SEASON_LIBRARY_GUIDES);
  const search=`<label class="search">${tx('search')}<input type="search" id="search" autocomplete="off"></label><p id="no-results" role="status" hidden>${tx('noResults')}</p>`;
  const techLibrary=`<div class="guide-disclosures">${techGuideDisclosure()}</div>`;
  const vsLibrary=`<div class="guide-disclosures">${vsGuides.map(guideDisclosure).join('')}</div>`;
  const seasonLibrary=`<div class="guide-disclosures">${seasonGuides.map(seasonLibraryDisclosure).join('')}</div>`;
  const techSection=`<section class="section"><h2>RZSN TECH</h2>${techLibrary}</section>`;
  return `<h1>${tx('guides')}</h1><p class="intro">${tx('guidesIntro')}</p>${notice()}${search}<div class="guide-library">${techSection}${section('vs',vsLibrary)}${section('season',seasonLibrary)}</div>${section('quickReference',referenceLibrary())}`;
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
function render({focus = false,preserve = false} = {}) {
  const hash = location.hash.slice(1);
  if (hash === 'main') { main.focus(); return; }
  currentView = Object.hasOwn(views,hash) ? hash : 'today';
  const open = preserve ? new Set([...main.querySelectorAll('details[open][data-disclosure]')].map(el=>el.dataset.disclosure)) : null;
  main.innerHTML = views[currentView]();
  if (open) main.querySelectorAll('[data-disclosure]').forEach(el=>{el.open=open.has(el.dataset.disclosure);});
  syncChrome();
  document.title = `${t(currentView==='admin'?'admin':currentView)} · RZSN Member Hub`;
  if (focus) { main.focus({preventScroll:true}); window.scrollTo(0,0); }
}
function refreshClock() {
  const next = guideState();
  if (next.date!==state.date) {
    state=next; selectedDay=state.weekdayIndex; render({preserve:true});
  } else {
    state=next;
    const timer = document.querySelector('#countdown');
    if (timer) timer.textContent=countdown();
    document.querySelectorAll('[data-arms-state]').forEach(el=>{el.textContent=t(armsWindow(state,DAILY_GUIDES[state.weekday]));});
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
function setLanguage(value,{persist=true}={}) {
  if (!Object.hasOwn(LANGUAGES,value)) return;
  lang=value;
  setupLanguageChosen=true;
  if (persist) storage.set('rzsn-language',lang);
  document.querySelector('#language').value=lang;
  setupLanguage.value=lang;
  render({preserve:true});
  updateSetupReady();
  showStorageError();
}
document.querySelector('#language').addEventListener('change',event=>setLanguage(event.target.value));
setupLanguage.addEventListener('change',event=>setLanguage(event.target.value));
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
languageDialog.addEventListener('cancel',event=>event.preventDefault());
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
main.addEventListener('change',event=>{
  const input=event.target;
  if (input.matches('[data-shield-check]')) {
    storage.set(input.dataset.key,input.checked);
    input.closest('.enemy-buster').dataset.confirmed=String(input.checked);
    showStorageError();
    return;
  }
  if (!input.matches('[data-check]')) return;
  const key=input.dataset.key;
  const checks=checkedMap(storage.get(key));
  if (input.checked) checks[input.dataset.check]=true;
  else delete checks[input.dataset.check];
  storage.set(key,checks);
  const task=TASKS.find(task=>task.id===input.dataset.check);
  if (input.dataset.kind==='daily' && ['every_48h','every_2_days'].includes(task?.frequency)) {
    const previous=storage.get('rzsn-cadence',{});
    const history=previous && typeof previous==='object' && !Array.isArray(previous)?previous:{};
    if (input.checked) history[task.id]=state.now.getTime(); else delete history[task.id];
    storage.set('rzsn-cadence',history);
  }
  // Update progress without replacing the focused checkbox or collapsing its group.
  if (input.dataset.kind==='daily') {
    const ids=dailyTasks().map(task=>task.id);
    const done=ids.filter(id=>checks[id]).length;
    document.querySelectorAll('[data-progress-label]').forEach(el=>{el.textContent=t('progress',{done,total:ids.length});});
    document.querySelectorAll('[data-progress-bar]').forEach(el=>{el.value=done;el.max=ids.length || 1;});
  }
  showStorageError();
});
main.addEventListener('input',event=>{
  if (event.target.id!=='search') return;
  const query=event.target.value.trim().toLocaleLowerCase(LOCALES[lang]);
  let found=0;
  main.querySelectorAll('[data-search]').forEach(el=>{
    const haystack=(el.textContent+(el.dataset.searchExtra||'')).toLocaleLowerCase(LOCALES[lang]);
    el.hidden=!haystack.includes(query);
    if (!el.hidden) found++;
    if (el.matches('.guide-disclosure')) el.open=Boolean(query) && !el.hidden;
  });
  main.querySelectorAll('.profession-path__section').forEach((section,index)=>{
    section.open=query ? section.textContent.toLocaleLowerCase(LOCALES[lang]).includes(query) : index===0;
  });
  main.querySelectorAll('[data-search-group]').forEach(group=>{group.hidden=!group.querySelector('[data-search]:not([hidden])');});
  document.querySelector('#no-results').hidden=found>0;
});
window.addEventListener('hashchange',()=>{menu.open=false;render({focus:true});});
window.addEventListener('storage',()=>render({preserve:true}));
window.addEventListener('focus',refreshClock);
new ResizeObserver(entries=>{
  document.documentElement.style.setProperty('--nav-height',`${Math.ceil(entries[0].target.getBoundingClientRect().height)+16}px`);
}).observe(document.querySelector('.main-nav'));
document.addEventListener('visibilitychange',()=>{if (!document.hidden) refreshClock();});
setInterval(refreshClock,15000);
render();
if (languagePreference.needsSelection || !setupThemeChosen) languageDialog.showModal();
