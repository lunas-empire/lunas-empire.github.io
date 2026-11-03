import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
const wait=async predicate=>{for(let i=0;i<200;i++){if(predicate())return;await new Promise(done=>setTimeout(done,8))}assert.ok(predicate(),'timeout loading panel')};
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
 throw Error('unmocked '+path);
};
test('Audit visible German leftovers in all officer section renderers with synthetic data',async t=>{
 const dom=new JSDOM('<!doctype html><html lang="en"><body><main id="mount"></main></body></html>',{url:'https://lunas-empire.github.io/#admin'});
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const original={window:globalThis.window,fetch:globalThis.fetch};
 globalThis.window=dom.window;
 globalThis.fetch=async url=>Response.json(mk(new URL(url).pathname+new URL(url).search));
 t.after(()=>{clearOfficer();globalThis.window=original.window;globalThis.fetch=original.fetch;dom.window.close()});
 const mount=dom.window.document.getElementById('mount');
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 const form=mount.querySelector('#native-officer-login');form.querySelector('input[name=code]').value='synthetic';form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>mount.querySelector('[data-officer-tab=more]'));
 const panels=['overview','members','vs','train','registry','watch','diplomacy','tasks','absences','events','activity','reviews','access','requirements'];
 const report=[];
 const suspicious=/\b(?:Quellen|Wochensnapshots|Spielerakte|erledigt|Offiziers|Bestätigt|Keine |Noch |Fehlt |Eingetragen|Bisher |Abwesenheiten|Aufgaben|Spieler mit|gespeichert|überprüf|bestätig|Rang ungeklärt|Tagesziel|Zugfahrer|Ausgewählt|Prüfung|Spieler suchen|vergleichen)\b/u;
 for(const panel of panels){
  if(!['overview','members','vs','train'].includes(panel)){
   mount.querySelector('[data-officer-tab=more]').click();
   await wait(()=>mount.querySelector('.native-hub-tile[data-officer-tab='+panel+']'));
  }
  mount.querySelector('[data-officer-tab='+panel+']').click();
  await wait(()=>mount.querySelector('#native-admin-content')?.children.length>0);
  await new Promise(res=>setTimeout(res,40));
  const content=mount.querySelector('#native-admin-content');
  const text=content?.textContent?.trim()||'';
  const selectors={
   registry:'[data-native-member-create]',diplomacy:'[data-native-diplomacy-new]',
   tasks:'[data-native-new=tasks]',absences:'[data-native-new=absences]',
   events:'[data-native-event-quick]',train:'[data-native-train]',
   access:'[data-native-access-mode]'
  };
  const action=content.querySelector(selectors[panel]||'[data-never]');
  let formText='';
  if(action){
   action.click();
   await new Promise(res=>setTimeout(res,80));
   formText=(content.querySelector('form:not(#native-officer-login)')?.textContent||'').slice(0,3200);
  }
  report.push({panel,size:text.length,error:!!content?.querySelector('.native-error'),residual:text,form:formText,preview:text.slice(0,160)});
 }
 if(report.some(r=>r.error))console.log('LOCALE_PANEL_ERRORS '+JSON.stringify(report.filter(r=>r.error)));
 assert.equal(report.length,14);
 assert.ok(report.every(r=>r.size>0),'Every panel should render');
 const german=/(?:[äöüß]|\b(?:VS-Duell|von|zum|Spieler|Abwesenheiten|Aufgaben|Geplant|Gefahren|Fahrtenzahl|Vorläufig|Einträge|Ergebnisse|bestätigt|nicht|wird|werden|beim|keine|Keine|Noch|Schildpflicht|Zugfahrer|Änderung|Rang|Wochenspende|Mitglied|Sicherheitsprüfung|Offizier|Zuordnung|offenen|vergangen|Vorschlag|pru[eü]f|speichern|Ersatz|Frist|Stärke)\b)/iu;
 for(const row of report){
  assert.equal(row.error,false,row.panel+' crashed during localization');
  assert.ok(!german.test(row.residual),'German UI text in '+row.panel+': '+row.residual);
  if(row.form)assert.ok(!german.test(row.form),'German UI text in '+row.panel+' form: '+row.form);
 }

});
