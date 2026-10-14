import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {LOCALES} from '../assets/i18n.js';
import {OFFICER_LANGUAGES,OFFICER_TEXT,translateOfficerText,localizeOfficerTree,officerLocale} from '../assets/native-admin-i18n.js';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
const wait=async predicate=>{
 for(let i=0;i<150;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}
 assert.ok(predicate(),'localization timeout');
};
test('Every officer language has a complete static dictionary, sane glossary and locale',()=>{
 assert.equal(OFFICER_LANGUAGES.length,15);
 const keys=['Weitere Verwaltung','Wähle einen Bereich, um deine Allianz zu verwalten.',
  'Allianz & Planung','Mitglieder & Kontrolle','System & Sicherheit','Kommando',
  'VS & Daten','Allianz','Einsätze','Mehr','Ränge & Archiv','Mitglieder-Abgleich',
  'OCR-Prüffälle','Admin-Protokoll','Spieler suchen','Aufgaben','Abwesenheiten',
  'Zugangscodes','Einstellungen','Bearbeiten','Abbrechen','Löschen','Speichern','Anmelden'];
 for(const lang of OFFICER_LANGUAGES.filter(x=>x!=='de')){
  assert.ok(OFFICER_TEXT[lang],lang);
  assert.ok(Object.keys(OFFICER_TEXT[lang]).length>=500,lang+' dictionary incomplete');
  for(const key of keys){
   const value=translateOfficerText(key,lang);
   assert.ok(value?.trim(),lang+' '+key+' empty');
   assert.doesNotMatch(value,/\uFFFD|\\uFFFD|undefined/,lang+' '+key+' broken');
  }
  assert.ok(LOCALES[lang],lang);
 }
 assert.equal(translateOfficerText('Weitere Verwaltung','ja'),'その他の管理');
 assert.equal(translateOfficerText('Weitere Verwaltung','en'),'More Management');
 assert.equal(translateOfficerText('OCR-Prüffälle','en'),'OCR Reviews');
 assert.equal(translateOfficerText('Weitere Verwaltung','de'),'Weitere Verwaltung');
});
test('Officer localization translates exact static labels but not player text or typed values',()=>{
 const dom=new JSDOM('<!doctype html><html lang="fr"><body><div id="mount"><span>Weitere Verwaltung</span><button aria-label="Spieler suchen" title="Einstellungen">Aufgaben</button><input placeholder="Spieler suchen" value="NoTranslationOfMemberName"></div></body></html>');
 const mount=dom.window.document.querySelector('#mount');
 assert.equal(officerLocale(dom.window.document),'fr-FR');
 const n=localizeOfficerTree(mount,'fr');
 assert.ok(n>=4);
 assert.equal(mount.querySelector('span').textContent,translateOfficerText('Weitere Verwaltung','fr'));
 assert.equal(mount.querySelector('button').textContent,translateOfficerText('Aufgaben','fr'));
 assert.equal(mount.querySelector('input').value,'NoTranslationOfMemberName');
 assert.equal(mount.querySelector('input').placeholder,translateOfficerText('Spieler suchen','fr'));
 assert.equal(localizeOfficerTree(mount,'fr'),0,'No double translation');
 dom.window.close();
});
test('All 15 languages localize the login, fifth tab, ten tile labels, settings and dynamic navigation',async()=>{
 for(const lang of OFFICER_LANGUAGES){
  clearOfficer();
  const dom=new JSDOM('<!doctype html><html lang="'+lang+'"><body><main id="mount"></main></body></html>',{url:'https://lunas-empire.github.io/#admin'});
  const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
  globalThis.window=dom.window;
  dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
  globalThis.fetch=async (url,opts={})=>{
   const path=new URL(url).pathname;
   if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Luna',role:'R4',siteOwner:true});
   if(path==='/api/overview')return Response.json({active:92,reviews:0});
   if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members:[]});
   if(path==='/api/train-manager')return Response.json({today:'2026-10-14',history:[],calendar:[],counts:{}});
   if(path==='/api/alliance-requirements')return Response.json({vs_daily_minimum:3600000,
    donation_weekly_minimum:20000,min_active_vs_days:5,low_vs_day_warning_count:2,
    shield_reminder_saturday:true,revision:1,updated_at:'2026-10-14'});
   throw Error('Unexpected test endpoint '+path);
  };
  try{
   const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
   initNativeAdmin(mount);
   await renderNativeAdmin(mount);
   assert.equal(mount.lang,lang);
   assert.equal(mount.dir,lang==='ar'?'rtl':'ltr');
   assert.equal(q('button[type=submit]').textContent,translateOfficerText('Anmelden',lang));
   q('[name=code]').value='synthetic';
   q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
   await wait(()=>q('[data-officer-tab=more]'));
   await wait(()=>q('[data-officer-tab=more]').textContent===translateOfficerText('Mehr',lang));
   q('[data-officer-tab=more]').click();
   await wait(()=>q('.native-hub-section h3'));
   await wait(()=>q('.native-hub-section h3').textContent===translateOfficerText('Allianz & Planung',lang));
   assert.equal(q('.native-hub-heading'),null,'More hub header must not exist');
   assert.equal(mount.querySelectorAll('.native-hub-tile').length,10,lang);
   assert.equal(mount.querySelectorAll('.native-hub-tile-gold').length,0,lang);
   assert.equal(q('.native-hub-section h3').textContent,translateOfficerText('Allianz & Planung',lang));
   assert.equal(q('[data-officer-tab=tasks].native-hub-tile strong').textContent,translateOfficerText('Aufgaben',lang));
   q('.native-hub-tile[data-officer-tab=requirements]').click();
   await wait(()=>q('#native-requirements-save'));
   await wait(()=>q('#native-requirements-save button[type=submit]').textContent===
    translateOfficerText('Allianzregeln speichern',lang));
   assert.equal(q('[name=vs_daily_minimum]').value,'3600000');
   assert.equal(q('[name=donation_weekly_minimum]').value,'20000');
   q('.native-hub-return [data-officer-tab=more]').click();
   await wait(()=>q('.native-hub-section h3'));
  }finally{
   clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close();
  }
 }
});

test('Dynamic English labels, counts and updated status nodes use translated UI copy only',async t=>{
 const dom=new JSDOM('<!doctype html><html lang="en"><body><main id="mount"></main></body></html>',{url:'https://lunas-empire.github.io/#admin'});
 const mount=dom.window.document.querySelector('#mount');
 t.after(()=>{clearOfficer();dom.window.close()});
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 const status=mount.querySelector('#native-login-status');
 status.textContent='Anmeldung wird geprüft …';
 await wait(()=>status.textContent===translateOfficerText('Anmeldung wird geprüft …','en'));
 assert.equal(status.textContent,'Verifying login…');
 assert.equal(translateOfficerText('24 Spieler','en'),'24 Players');
 assert.equal(translateOfficerText('25 Aufgaben (10)','en'),'25 Aufgaben (10)','Unrecognized player or free text must remain untouched');
 assert.equal(translateOfficerText('Aufgaben (10)','en'),translateOfficerText('Aufgaben','en')+' (10)');
 assert.equal(mount.querySelector('[name=code]').getAttribute('type'),'password');
});
