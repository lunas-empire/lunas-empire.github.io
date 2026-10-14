import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
import {translateOfficerText} from '../assets/native-admin-i18n.js';
const wait=async condition=>{for(let i=0;i<250;i++){if(condition())return;await new Promise(res=>setTimeout(res,7))}assert.ok(condition(),'UI did not settle')};
test('Real member reconciliation UI is entirely English for archive rules and warnings',async t=>{
 const dom=new JSDOM('<!doctype html><html lang="en"><body><main id="mount"></main></body></html>',{url:'https://lunas-empire.github.io/#admin'});
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const original={window:globalThis.window,fetch:globalThis.fetch};
 globalThis.window=dom.window;
 t.after(()=>{clearOfficer();globalThis.window=original.window;globalThis.fetch=original.fetch;dom.window.close()});
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',role:'R4',name:'Officer',siteOwner:false});
  if(path==='/api/overview')return Response.json({active:92,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-14',calendar:[],history:[],counts:{}});
  if(path==='/api/membership-watch')return Response.json({state:'review_candidates',profile:{current:{captured_at:'2026-10-11T01:00:00Z'}},vs:{current:{week:'2026-W41'}},candidates:[]});
  if(path==='/api/archive-eligibility')return Response.json({ready:true,candidates:[]});
  throw Error('Unexpected endpoint '+path);
 };
 const mount=dom.window.document.getElementById('mount');
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 const form=mount.querySelector('#native-officer-login');
 form.querySelector('input[name=code]').value='synthetic';
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>mount.querySelector('[data-officer-tab=more]'));
 mount.querySelector('[data-officer-tab=more]').click();
 await wait(()=>mount.querySelector('.native-hub-tile[data-officer-tab=watch]'));
 mount.querySelector('[data-officer-tab=watch]').click();
 await wait(()=>mount.querySelector('#native-watch-list .native-evidence-note'));
 await wait(()=>mount.querySelector('#native-watch-list').textContent.includes('nightly staging check'));
 const content=mount.querySelector('#native-admin-content').textContent;
 const german=['Quellen','Wochensnapshots','bestätigte Kandidaten','Spielerakte geändert','Austritt','vollständig','archiviert','Stärke-Snapshot','Prüfkandidaten','Sicherheitsprüfung'];
 for(const token of german)assert.ok(!content.includes(token),'German residue: '+token);
 assert.match(content,/Power .*2026-10-11/);
 assert.match(content,/The nightly staging check/);
 assert.match(content,/R4\/R5 are never archived automatically/);
 assert.match(content,/No automatic removals/);
 assert.match(content,/Candidates for review/);
 assert.match(content,/Missing from power snapshot/);
 assert.match(content,/No missing members appear/);
});
test('All languages translate archive warnings but never player identifiers',()=>{
 for(const language of ['en','uk','ja','fr','it','id','ar','ko','sv','pt','nl','th','km','fil']){
  const german='Fehlt ein Spieler auf einem Screenshot, bleibt er aktiv. Bei fehlenden Daten ist keine Blacklist zulässig. Status und Blacklist werden ausschließlich manuell in der Spielerakte geändert.';
  assert.notEqual(translateOfficerText(german,language),german,language);
 }
 const name='R5 · Łuna_日本🇵🇹';
 assert.equal(translateOfficerText(name,'en'),name);
});

test('Partial already translated sentences receive a second safe pass without changing source measurements',()=>{
 const original='Stärke 2026-10-11 · VS 2026-W41 · Quellen sind unterschiedlich vollständig';
 const translated=translateOfficerText(original,'en');
 assert.ok(!translated.includes('Quellen sind'),translated);
 assert.ok(translated.includes('2026-10-11')&&translated.includes('2026-W41'),translated);
 assert.equal(translateOfficerText('Gefahren','en'),'Completed');
 assert.equal(translateOfficerText('VS-Duell','en'),'Alliance Duel');
 assert.equal(translateOfficerText('Samstag an den Schild erinnern','en'),'Remind members to shield on Saturday');
 assert.equal(translateOfficerText('Mitglied 日本🇯🇵 UnbekanntXYZ','en'),'Mitglied 日本🇯🇵 UnbekanntXYZ','Player-provided identifiers must never be machine-translated');
});

test('Localized composite sentences translate leftover German fragments without changing unknown player identifiers',async()=>{
 const {translateOfficerFragments}=await import('../assets/native-admin-fragments.js');
 const raw='Stärke 2026-10-11 · VS 2026-W41 · Quellen sind unterschiedlich vollständig';
 const english=translateOfficerText(raw,'en');
 assert.ok(english.includes('Power 2026-10-11'));
 assert.ok(english.includes('Data sources differ in completeness'));
 assert.equal(translateOfficerFragments('XYPrüfkandidatenZ','en'),'XYPrüfkandidatenZ');
 assert.equal(translateOfficerFragments('Prüfkandidaten','en'),'Candidates for review');
 assert.equal(translateOfficerText('UserXYPrüfkandidatenZ','en'),'UserXYPrüfkandidatenZ');
});
