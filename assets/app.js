import { BUILD_VERSION, ALLIANCE_CONFIG, LIVE_NOTICE } from './config.js';
import { LANGUAGES, LOCALES, UI, resolveLanguagePreference, translate } from './i18n.js';
import { COPY, TASKS, DAILY_GUIDES } from './content.js';
import { DAY_ONE_GROUP, SEASON_COPY, SEASON_CONTENT, SEASON_GUIDES, seasonTasks, seasonSynergies, upcoming } from './season.js';
import { DAY_MS, WEEKDAYS, guideState, selectedDate, checklistKey, armsWindow, availableTask, enemyBusterPhase } from './engine.js';
import { todayPriorities } from './priority.js';
import { createStorage, checkedMap } from './storage.js';

const dictionary = {...UI,...COPY,...SEASON_COPY};
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
const languageOptions = document.querySelector('#language-options');
const phaseLabel = s => s.phase === 'PRE_SEASON' ? t('pre') : s.phase === 'POST_SEASON' ? t('post') : `${t('week')} ${s.week}`;
const longDate = date => new Intl.DateTimeFormat(LOCALES[lang], {dateStyle:'full',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
const paragraph = key => `<p>${tx(key)}</p>`;
const list = keys => `<ul class="plain">${keys.map(k=>`<li>${tx(k)}</li>`).join('')}</ul>`;
const section = (title, body) => `<section class="section"><h2>${tx(title)}</h2>${body}</section>`;
const details = (title, body, open = false, id = '') => `<details${open?' open':''}${id?` data-disclosure="${escape(id)}"`:''}><summary>${escape(title)}</summary>${body}</details>`;
const link = (view, text) => `<a class="link-button" href="#${view}">${tx(text)} <span aria-hidden="true">→</span></a>`;
const permitted = id => !LIVE_NOTICE.active || !LIVE_NOTICE.suppressTaskIds.includes(id);
const MEMBER_MEDIA = {
  farms:{src:'/assets/member/farms-vri.webp',alt:'imageFarmsAlt',width:960,height:722},
  resistance:{src:'/assets/member/resistance.webp',alt:'imageResistanceAlt',width:960,height:786},
  weapons:{src:'/assets/member/weapons.webp',alt:'imageWeaponsAlt',width:960,height:692},
  'vs-sunday':{src:'/assets/member/vs-sunday.webp',day:'sunday',width:960,height:1280},
  'vs-sunday-prep':{src:'/assets/member/vs-sunday-prep.webp',alt:'vsPrepGuideAlt',width:960,height:1197},
  'vs-monday':{src:'/assets/member/vs-monday.webp',day:'monday',width:960,height:1280},
  'vs-tuesday':{src:'/assets/member/vs-tuesday.webp',day:'tuesday',width:960,height:1200},
  'vs-wednesday':{src:'/assets/member/vs-wednesday.webp',day:'wednesday',width:960,height:1200},
  'vs-thursday':{src:'/assets/member/vs-thursday.webp',day:'thursday',width:960,height:1200},
  'vs-friday':{src:'/assets/member/vs-friday.webp',day:'friday',width:960,height:1280},
  'vs-saturday':{src:'/assets/member/vs-saturday.webp',day:'saturday',width:960,height:1200},
  'vs-secret-missions':{src:'/assets/member/vs-secret-missions.webp',alt:'secretMissionsGuideAlt',width:960,height:1200},
};
function guideFigure(id) {
  const media=MEMBER_MEDIA[id];
  const alt=media.day?t('dayGuideAlt',{day:t(media.day)}):t(media.alt);
  return `<figure class="guide-figure"><a href="${media.src}" target="_blank" rel="noopener" aria-label="${escape(alt)} ${tx('imageHint')}"><img src="${media.src}" width="${media.width}" height="${media.height}" loading="lazy" decoding="async" alt="${escape(alt)}"></a><figcaption><strong>${escape(alt)}</strong><span>${tx('imageHint')}</span><small>${tx('imageLanguage')}</small></figcaption></figure>`;
}
const guideGallery = ids => ids.length ? `<div class="guide-gallery">${ids.map(guideFigure).join('')}</div>` : '';
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
  return `<strong class="time">${hours(guide.arms.start)}–${hours(guide.arms.end)}</strong><p>${escape(guide.arms.type)}</p>${s.date === state.date ? `<p data-arms-state>${tx(armsWindow(state,guide))}</p>` : ''}<small>${tx('armsNote')}</small>`;
}
function minimum(s = state) {
  // Sunday is preparation, not a scored VS day.
  return s.weekdayIndex ? `<p class="muted">${tx('minimum',{points:new Intl.NumberFormat(LOCALES[lang],{notation:'compact',maximumFractionDigits:1}).format(ALLIANCE_CONFIG.vsDailyMinimum)})}</p>` : '';
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
    // Doom Walker remains a daily mark even when it is explained inside Season.
    const itemKind=kind==='season' && task.id==='doom'?'daily':kind;
    const key=checklistKey(itemKind,s);
    const checks=checkedMap(storage.get(key));
    return `<li><label><input type="checkbox" data-check="${escape(task.id)}" data-key="${key}" data-kind="${itemKind}"${checks[task.id]?' checked':''}><span class="task-text">${tx(task.text || task.id)}${task.frequency && frequencyText(task)?`<small>${escape(frequencyText(task))}</small>`:''}</span></label></li>`;
  }).join('')}</ul>`;
}
function nextCards(limit = 3, excludedDays = []) {
  return upcoming(state,limit,excludedDays).map(e=>details(`${t('seasonDay')} ${e.day} · ${['kim','dva','tesla'].includes(e.id)?{kim:'Kimberly',dva:'DVA',tesla:'Tesla'}[e.id]:t('next')}`,paragraph(e.id)+(e.id==='kim'?guideFigure('weapons'):'')+(['kim','dva','tesla'].includes(e.id)?paragraph('weapon'):''))).join('');
}
function today() {
  const guide = DAILY_GUIDES[state.weekday];
  const priorities = todayPriorities(state);
  const shown = new Set(priorities.map(p=>p.id));
  const cards = priorities.filter(p=>p.id!=='notice').map(p=>`<li class="${p.id==='shield'?'warning':''}" data-priority="${p.id}"><span class="badge">${tx(p.source)}</span>${p.id==='arms'?arms(state,guide):p.id==='save'?list(guide.save.filter(permitted)):p.id==='shield'?`<h3>${tx(p.id)}</h3>`:paragraph(p.id)}</li>`).join('');
  const seasonIds = seasonTasks(state).filter(id=>!shown.has(id) && permitted(id)).slice(0,state.seasonDay?2:1);
  const nextSeason = state.phase === 'PRE_SEASON' ? first24() : nextCards(1);
  return `<h1>MEMBER HUB</h1><p class="intro">${escape(longDate(state.date))}</p>${status()}${notice()}${enemyBusterBanner(state)}${section('focus',`<ul class="priority-list">${cards}</ul>`)}${section('vs',`<h3>${tx(state.weekday)}</h3>${minimum()}${guideFigure(`vs-${state.weekday}`)}${!shown.has('arms')?details(t('bestArms'),arms(state,guide)):''}${!shown.has('save')?details(t('save'),list(guide.save.filter(permitted))):''}${link('vs','details')}`)}${section('season',`<h3>${escape(phaseLabel(state))}</h3>${list(seasonIds)}${link('season','details')}`)}${section('daily',`${progress('daily',dailyTasks().map(task=>task.id))}${link('daily','checklist')}`)}${section('next',`<h3>${tx('tomorrow')} · ${tx(WEEKDAYS[(state.weekdayIndex+1)%7])}</h3>${nextSeason}`)}`;
}
function daySelector() {
  return `<div class="week-selector" role="group" aria-label="${tx('vs')}">${WEEKDAYS.map((day,index)=>{
    const date = new Date(`${selectedDate(state,index)}T12:00:00Z`);
    const label = new Intl.DateTimeFormat(LOCALES[lang],{weekday:'short',timeZone:'UTC'}).format(date);
    return `<button type="button" data-day="${index}" data-current="${index===state.weekdayIndex}" aria-pressed="${index===selectedDay}" aria-label="${escape(longDate(selectedDate(state,index)))} · ${tx(day)}">${escape(label)}</button>`;
  }).join('')}</div>`;
}
function daily() {
  const tasks = dailyTasks();
  return `<h1>${tx('daily')}</h1><p class="intro">${escape(longDate(state.date))} · ${tx('reset')}</p>${notice()}${progress('daily',tasks.map(task=>task.id))}<aside class="card warning">${paragraph('safeServer')}</aside>${['freebies','alliance','action','map','timing'].map(category=>details(t(category),checklist('daily',tasks.filter(task=>task.category===category))+(category==='timing'?paragraph('minister')+paragraph('philosophy')+paragraph('ssr'):''),category==='freebies',category)).join('')}${link('vs','vs')}`;
}
function vs() {
  const date = selectedDate(state,selectedDay);
  const s = guideState(new Date(`${date}T12:00:00+02:00`));
  const guide = DAILY_GUIDES[s.weekday];
  const tasks = [...new Set([...guide.tasks,...seasonSynergies(s)])].map(id=>({id}));
  const guideIds=[`vs-${s.weekday}`,...(s.weekday==='sunday'?['vs-sunday-prep']:[])];
  return `<h1>${tx('vs')}</h1>${notice()}${daySelector()}<p class="intro">${escape(longDate(s.date))}</p><h2>${tx(s.weekday)}</h2>${minimum(s)}${enemyBusterBanner(s)}${guideGallery(guideIds)}${checklist('vs',tasks,s)}${section('bestArms',arms(s,guide))}${section('avoid',list(guide.avoid.filter(permitted)))}${section('save',list(guide.save.filter(permitted)))}${details(t('secretMissionsGuideTitle'),guideFigure('vs-secret-missions'),false,'secret-missions-guide')}${section('tomorrow',`<h3>${tx(WEEKDAYS[(selectedDay+1)%7])}</h3>`)}${selectedDay===6?paragraph('fight'):''}`;
}
function first24Body({withChecklist = false} = {}) {
  const flow = `<ol class="flow">${t('loop').split(' → ').map(step=>`<li>${escape(step)}</li>`).join('')}</ol>`;
  const farm = `<dl class="facts">${[t('immediate'),`Farm 1 → ${t('level')} 5`,`Farm 2 → ${t('level')} 10`,`Farm 3 → ${t('level')} 10`,'Weekly Pass'].map((unlock,index)=>`<div><dt>Farm ${index+1}</dt><dd>${escape(unlock)}</dd></div>`).join('')}</dl>`;
  const vri = details(`VRI · ${t('details')}`,`<dl class="facts">${[['1–5','100'],['6–15','250'],['16–20','400'],['21–30','500']].map(([level,value])=>`<div><dt>${tx('level')} ${level}</dt><dd>+${value} / ${tx('level')}</dd></div>`).join('')}<div><dt>${tx('max')}</dt><dd>10,000</dd></div></dl>`);
  const tasks = withChecklist ? checklist('season',DAY_ONE_GROUP.tasks.map(id=>({id}))) : '';
  return tasks+guideFigure('farms')+flow+paragraph('farms')+farm+paragraph('farmRate')+paragraph('pass')+paragraph('vri')+vri+paragraph('firstBlood')+paragraph('resistanceCheck')+paragraph('profession');
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
    ...(state.seasonDay >= 1 && state.seasonDay <= 56 ? ['doom','resistanceCheck'] : []),
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
const references = ['philosophy','minister','drone','hero','radarSave','star','buildings','ssr','chests','safeServer','profession'];
function guides() {
  return `<h1>${tx('guides')}</h1>${notice()}<label class="search">${tx('search')}<input type="search" id="search" autocomplete="off"></label><p id="no-results" role="status" hidden>${tx('noResults')}</p><div id="search-results">${references.map(id=>`<article class="card" data-search="${id}">${paragraph(id)}</article>`).join('')}</div>`;
}
const views = {today,daily,vs,season,guides,admin:()=>`<h1>${tx('admin')}</h1>${paragraph('adminPending')}`};
function syncChrome() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-ui]').forEach(el=>{el.textContent = t(el.dataset.ui);});
  document.querySelector('#language').value = lang;
  document.querySelector('#override').textContent = t('override');
  document.querySelector('#honest').textContent = t('honest');
  document.querySelector('.site-footer small').textContent = `RZSN · Rising Sun · Luna · ${BUILD_VERSION}`;
  document.querySelector('.main-nav').setAttribute('aria-label',t('menu'));
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
languageOptions.innerHTML = languageEntries.map(([code,name])=>`<button type="button" value="${code}" lang="${code}" data-language-choice${code===lang?' aria-current="true"':''}${code==='en'?' autofocus':''}>${escape(name)}</button>`).join('');
document.querySelector('#language').addEventListener('change',event=>{lang=event.target.value;storage.set('rzsn-language',lang);render({preserve:true});});
languageOptions.addEventListener('click',event=>{
  const button=event.target.closest('[data-language-choice]');
  if (!button) return;
  lang=button.value;
  storage.set('rzsn-language',lang);
  languageDialog.close();
  render({preserve:true});
});
languageDialog.addEventListener('cancel',event=>event.preventDefault());
function setTheme(value) {
  if (value==='system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme=value;
  document.querySelector('#theme').value=value;
}
const savedTheme = storage.get('rzsn-theme',legacyPreference('lw_theme') || 'system');
setTheme(['light','dark','system'].includes(savedTheme)?savedTheme:'system');
document.querySelector('#theme').addEventListener('change',event=>{setTheme(event.target.value);storage.set('rzsn-theme',event.target.value);showStorageError();});
document.addEventListener('keydown',event=>{if (event.key==='Escape' && menu.open) {menu.open=false;menu.querySelector('summary').focus();}});
document.addEventListener('click',event=>{if (!menu.contains(event.target)) menu.open=false;});
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
  main.querySelectorAll('[data-search]').forEach(el=>{el.hidden=!el.textContent.toLocaleLowerCase(LOCALES[lang]).includes(query);if (!el.hidden) found++;});
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
if (languagePreference.needsSelection) languageDialog.showModal();
