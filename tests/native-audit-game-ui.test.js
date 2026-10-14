import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {auditCategory,auditChanges,initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

test('Audit groups distinguish verified categories, including access and archive',()=>{
 assert.equal(auditCategory({object_kind:'ocr_review',action:'resolve'}),'ocr');
 assert.equal(auditCategory({object_kind:'profile_capture',action:'upload'}),'ocr');
 assert.equal(auditCategory({object_kind:'member_registry',action:'manual_update',after_json:'{"lifecycle":"former"}'}),'archive');
 assert.equal(auditCategory({object_kind:'member_registry',action:'manual_update',after_json:'{"rank_override":"R3"}'}),'members');
 assert.equal(auditCategory({object_kind:'train_dice',action:'update'}),'train');
 assert.equal(auditCategory({object_kind:'officer_credentials',action:'officer_code_reset'}),'access');
 assert.equal(auditCategory({object_kind:'tasks',action:'complete'}),'tasks');
 assert.equal(auditCategory({object_kind:'events',action:'start'}),'events');
 assert.equal(auditCategory({object_kind:'diplomacy',action:'save'}),'diplomacy');
 assert.equal(auditCategory({object_kind:'unclassified',action:'noop'}),'other');
});

test('Native alliance admin log: filter, group, search, reveal all 355 records and no secret display',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const win=dom.window,previousWindow=globalThis.window,previousFetch=globalThis.fetch;
 globalThis.window=win;win.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=previousWindow;globalThis.fetch=previousFetch;dom.window.close()});
 const data=[
  {id:'access-1',object_kind:'officer_credentials',action:'officer_code_reset',actor:'Luna',object_id:'other-officer',at:'2026-10-14 10:00:00',after_json:JSON.stringify({reason:'Rotated access',code_mac:'NEVER_SHOW_AUTH_SECRET'})},
  {id:'member-1',object_kind:'member_registry',action:'manual_update',actor:'Loki',object_id:'member-a',at:'2026-10-14 09:00:00',after_json:JSON.stringify({rank_override:'R4'})},
  {id:'archive-1',object_kind:'member_registry',action:'manual_update',actor:'Luna',object_id:'member-b',at:'2026-10-13 11:00:00',after_json:JSON.stringify({lifecycle:'former'})},
  {id:'train-1',object_kind:'train_dice',action:'dice_winner',actor:'Loki',object_id:'ride-a',at:'2026-10-13 10:00:00',after_json:'{}'},
  {id:'event-1',object_kind:'events',action:'complete',actor:'Luna',object_id:'event-a',at:'2026-10-12 10:00:00',after_json:'{}'},
  {id:'task-1',object_kind:'tasks',action:'complete',actor:'Loki',object_id:'task-a',at:'2026-10-11 10:00:00',after_json:JSON.stringify({status:'done'})},
  ...Array.from({length:349},(_,i)=>({id:'ocr-'+i,object_kind:'ocr_review',action:'ocr_alert',actor:i%2?'Loki':'Luna',object_id:'ocr-'+i,at:'2026-10-10 08:00:00',after_json:'{}'}))
 ];
 let requests=[];
 globalThis.fetch=async (url)=>{
  const path=new URL(url).pathname+new URL(url).search;requests.push(path);
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Luna',role:'R4',siteOwner:true});
  if(path==='/api/overview')return Response.json({active:94,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-14',history:[],calendar:[],counts:{}});
  if(path==='/api/activity?limit=500')return Response.json(data);
  throw Error('Unexpected request '+path);
 };
 const mount=win.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const until=async check=>{for(let i=0;i<170;i++){if(check())return;await new Promise(r=>setTimeout(r,5))}assert.ok(check(),'Expected UI not found')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';q('form').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=activity]'));
 q('[data-officer-tab=activity]').click();
 await until(()=>q('[data-audit-category=all]'));
 assert.ok(requests.includes('/api/activity?limit=500'));
 assert.match(q('.native-audit-count').textContent,/355 passende Einträge/);
 assert.equal(q('[data-audit-category=ocr] small').textContent,'349');
 assert.equal(q('[data-audit-category=access] small').textContent,'1');
 assert.equal(q('.native-audit-group-access').open,true,'First category open');
 assert.ok(q('.native-audit-group-tasks'));
 assert.ok(q('.native-audit-group-ocr'));
 assert.doesNotMatch(mount.textContent,/NEVER_SHOW_AUTH_SECRET/);
 q('[data-audit-category=access]').click();
 assert.equal(q('[data-audit-category=access]').getAttribute('aria-pressed'),'true');
 assert.equal(q('.native-audit-count').textContent.includes('1 passende Einträge'),true);
 assert.equal(q('.native-audit-entry').textContent.includes('Luna'),true);
 q('[data-audit-category=ocr]').click();
 assert.equal(q('.native-audit-count').textContent.includes('349 passende Einträge'),true);
 assert.equal(q('.native-audit-entry').textContent.includes('ocr_alert'),true);
 assert.equal(q('.native-audit-entry').getAttribute('open'),null);
 const countBefore=mount.querySelectorAll('.native-audit-entry').length;
 assert.equal(countBefore,30);
 q('[data-native-more=activity]').click();
 assert.equal(mount.querySelectorAll('.native-audit-entry').length,60);
 q('#activity-group-by').value='actor';
 q('#activity-group-by').dispatchEvent(new win.Event('change',{bubbles:true}));
 assert.ok(mount.querySelector('.native-audit-group'));
 assert.ok(mount.textContent.includes('Luna'));
 const search=q('#activity-search');
 search.value='nonexistent member';
 search.dispatchEvent(new win.Event('input',{bubbles:true}));
 assert.match(q('#activity-list').textContent,/Keine passenden Änderungen/);
 assert.equal(q('#activity-search').value,'nonexistent member');
 const restored=q('#activity-search');restored.value='ocr-7';restored.dispatchEvent(new win.Event('input',{bubbles:true}));
 assert.match(q('.native-audit-count').textContent,/passende Einträge/);
 assert.ok(mount.querySelectorAll('.native-audit-entry').length>0);
});

test('Alliance policy audit renders exactly changed thresholds and shield flag without secrets',()=>{
 const before={vs_daily_minimum:3600000,donation_weekly_minimum:20000,min_active_vs_days:5,low_vs_day_warning_count:2,shield_reminder_saturday:true};
 const after={...before,vs_daily_minimum:4000000,donation_weekly_minimum:25000,shield_reminder_saturday:false,reason:'Officer changed priorities'};
 const event={object_kind:'alliance_requirements',action:'alliance_requirements_update',before_json:JSON.stringify(before),after_json:JSON.stringify(after)};
 assert.equal(auditCategory(event),'policy');
 const diff=auditChanges(event);
 assert.deepEqual(diff.map(x=>x.field),['Begründung','VS-Punkte pro Tag','Spenden pro Woche','Samstag Schild-Erinnerung']);
 assert.equal(diff.find(x=>x.field==='VS-Punkte pro Tag').after,'4000000');
 assert.equal(diff.find(x=>x.field==='Samstag Schild-Erinnerung').after,'Nein');
});
