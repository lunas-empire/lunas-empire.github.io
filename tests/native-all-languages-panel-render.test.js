import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
import {LANGUAGES} from '../assets/i18n.js';
import {DUEL_COPY} from '../assets/native-duel-league-i18n.js';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const until=async fn=>{for(let i=0;i<160;i++){if(fn())return;await sleep(6)}assert.ok(fn(),'UI did not settle')};
const mk=(path)=>{
 if(path==='/api/native-login')return {token:'test',role:'R4',name:'Test Officer',siteOwner:true};
 if(path==='/api/overview')return {active:92,reviews:0,reviewCount:0};
 if(path==='/api/operations')return {tasks:[],events:[],absences:[],members:[]};
 if(path==='/api/members')return [{id:'p1',name:'User Sample',rank:'R5',power:80376261,kills:1712531,donations_weekly:41750}];
 if(path==='/api/train-manager')return {today:'2026-10-14',calendar:[{date:'2026-10-14',type:'Members Day',suggestions:[{id:'p1',name:'User Sample',rank:'R5'}]}],history:[],absences:[],counts:{},members:[]};
 if(path==='/api/train-rotation')return {revision:1,types:['Members Day','R5','R4','R5','R4','Members Day','VS Hero'],coordinators:['','','','','','',''],auto_suggest:true};
 if(path==='/api/train-dice')return [];
 if(path==='/api/member-registry')return {members:[],counts:{active:92,former:2,blacklisted:0}};
 if(path==='/api/membership-watch')return {state:'review_candidates',profile:{current:{captured_at:'2026-10-11'}},vs:{current:{week:'2026-W41'}},candidates:[]};
 if(path==='/api/archive-eligibility')return {ready:true,candidates:[]};
 if(path==='/api/diplomacy')return {relations:[]};
 if(path==='/api/activity?limit=500')return {entries:[]};
 if(path==='/api/reviews?status=open')return [];
 if(path==='/api/identity-options')return [];
 if(path==='/api/session')return {reviewWritesEnabled:false};
 if(path.startsWith('/api/profile-captures'))return [];
 if(path==='/api/alliance-requirements')return {vs_daily_minimum:3600000,donation_weekly_minimum:20000,min_active_vs_days:5,low_vs_day_warning_count:2,shield_reminder_saturday:true,revision:1};
 if(path==='/api/officer-access')return {accounts:[]};
 if(path==='/api/vs-intelligence')return {weeks:[{week:'2026-W41',threshold:3600000,dayTotals:[],rankings:[],records:[],players:[],rows:[],groups:[],priority:0,unknownDays:12,failedDays:173,perfect:17}]};
 if(path==='/api/donations-intelligence')return {weeks:[{week:'2026-W41',captured_at:'2026-10-11T00:19:00Z',is_complete:true,met:78,below:14,unknown:0,verified:92,active:92,rows:[],players:[],members:[]}]};
 if(path==='/api/duel-league')return {matches:[{iso_week:'2026-W41',opponent_tag_snapshot:'DATA',opponent_name_snapshot:'Player Name Untranslated',opponent_server_snapshot:2261,status:'live',days:[{day_index:1,result:'win'}]}],leagues:[{id:'l1',cycle_label:'S38',starts_week:'2026-W41',ends_week:'2026-W44',tier:'silver'}],snapshots:[{league_id:'l1',coverage_status:'partial',rows:[]}],proposals:[],evidence:[]};
 throw Error('unmocked '+path);
};

for(const locale of Object.keys(LANGUAGES)){
 test('All 15 officer panels render for '+locale+' with safe localized text (synthetic R4)',async t=>{
  const dom=new JSDOM('<!doctype html><html lang="'+locale+'"><body><main id="mount"></main></body></html>',{url:'https://lunas-empire.github.io/#admin'});
  dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
  const prior={window:globalThis.window,fetch:globalThis.fetch};
  globalThis.window=dom.window;globalThis.fetch=async url=>{const u=new URL(url);return Response.json(mk(u.pathname+u.search))};
  t.after(()=>{clearOfficer();globalThis.window=prior.window;globalThis.fetch=prior.fetch;dom.window.close()});
  const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
  initNativeAdmin(mount);await renderNativeAdmin(mount);
  q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  await until(()=>q('[data-officer-tab=more]'));
  for(const panel of ['overview','members','vs','duelLeague','train','registry','watch','diplomacy','tasks','absences','events','activity','reviews','access','requirements']){
   if(!['overview','members','vs','duelLeague','train'].includes(panel)){
    q('[data-officer-tab=more]').click();
    await until(()=>q('.native-hub-tile[data-officer-tab='+panel+']'));
   }
   q('[data-officer-tab='+panel+']').click();
   await until(()=>q('#native-admin-content')?.children.length>0);
   await sleep(45);
   const region=q('#native-admin-content');
   assert.ok(region.textContent.trim().length>0,locale+'/'+panel+' blank');
   assert.equal(region.querySelector('.native-error'),null,locale+'/'+panel+' render failed');
   assert.doesNotMatch(region.textContent,/\uFFFD/u,locale+'/'+panel+' damaged Unicode');
   assert.equal(q('.native-report-panel'),null,locale+'/'+panel+' report draft unexpectedly visible');
   assert.equal(q('[data-native-jump-report]'),null,locale+'/'+panel+' report shortcut unexpectedly visible');
   if(panel==='duelLeague'){
    assert.match(region.textContent,new RegExp(DUEL_COPY[locale].title),locale+' duel title fallback');
    assert.match(region.textContent,/Player Name Untranslated/,locale+' player data translated');
    assert.equal(region.querySelector('.native-dl')?.getAttribute('dir'),locale==='ar'?'rtl':'ltr');
    assert.equal(q('[data-officer-tab=duelLeague]').textContent,DUEL_COPY[locale].title,locale+' duel nav title');
   }
  }
 });
}
