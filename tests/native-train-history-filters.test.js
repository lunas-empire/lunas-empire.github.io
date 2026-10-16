import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {trainTimelineGroups,initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
import {OFFICER_LANGUAGES,translateOfficerText} from '../assets/native-admin-i18n.js';

const ride=(date,driver,member_id)=>({date,status:'completed',driver,member_id});
const wait=async predicate=>{
 for(let i=0;i<180;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,6))}
 assert.ok(predicate(),'train UI did not settle');
};

test('member and exact date filter all historical rows before pagination',()=>{
 const history=Array.from({length:30},(_,i)=>ride(`2026-09-${String(i+1).padStart(2,'0')}`,i<25?'Café\u200B Driver':'Other Driver',i===2?'p1':null));
 history[2].driver='Old Display';history[2].original_name='Original Rider';
 history.push(ride('2026-10-20','Café Driver'));
 const options={history,today:'2026-10-16',members:[{id:'p1',name:'Café Captain'}]};
 const first=trainTimelineGroups({...options,member:'CAFÉ',limit:20});
 assert.equal(first.pastCount,25);
 assert.equal(first.totalPastCount,39,'30 completed rides and nine static Dice winners');
 assert.equal(first.past.length,20);
 assert.equal(first.hasMore,true);
 assert.equal(trainTimelineGroups({...options,member:'café',limit:40}).past.length,25);
 assert.equal(trainTimelineGroups({...options,member:'original rider'}).pastCount,1);
 assert.equal(trainTimelineGroups({...options,member:'CAPTAIN'}).pastCount,1);
 assert.equal(trainTimelineGroups({...options,member:'Café',date:'2026-09-14'}).pastCount,1);
 assert.equal(trainTimelineGroups({...options,member:'Café',date:'2026-09-16'}).pastCount,1);
 assert.equal(trainTimelineGroups({...options,member:'Bramser',date:'2026-09-16'}).pastCount,1,'static Wednesday Dice winner is searchable');
 assert.equal(trainTimelineGroups({...options,member:'Café',date:'2026-09-17'}).pastCount,1);
 assert.equal(trainTimelineGroups({...options,member:'Nobody',date:'2026-09-14'}).pastCount,0);
 assert.equal(trainTimelineGroups({...options,date:'2026-02-30'}).pastCount,0,'invalid date cannot match');
 assert.equal(first.future.length,0,'future completed ride is not past or future planned');
 const linkedDice=trainTimelineGroups({today:'2026-10-16',dice:[{ride_date:'2026-10-14',winner_name:'Former Display',winner_id:'p2'}],members:[{id:'p2',name:'Current Winner'}],member:'current winner',date:'2026-10-14'});
 assert.equal(linkedDice.pastCount,1,'Dice winner ID can match a current canonical name');
 assert.equal(linkedDice.past[0].kind,'dice');
});

test('collapsed history retains focused filters, paging and expanded state across train renders',async t=>{
 const dom=new JSDOM('<!doctype html><html lang="de"><body><main id="mount"></main></body></html>',{url:'https://lunas-empire.github.io/#admin'});
 const previous={window:globalThis.window,fetch:globalThis.fetch};
 globalThis.window=dom.window;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const history=Array.from({length:30},(_,i)=>ride(`2026-09-${String(i+1).padStart(2,'0')}`,i<25?'Café\u200B Driver':'Other Driver'));
 history[29].driver='<img src=x onerror=alert(1)>';
 const train={today:'2026-10-16',calendar:[],history,counts:{completed:30,planned:0},members:[],absences:[]};
 globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname;
  const data={
   '/api/native-login':{token:'synthetic',role:'R5',name:'Sample Officer'},
   '/api/overview':{active:1,reviews:0},
   '/api/operations':{tasks:[],events:[],absences:[],members:[]},
   '/api/train-manager':train,
   '/api/train-dice':[],
   '/api/members':[],
   '/api/train-rotation':{revision:1,types:[],coordinators:[],auto_suggest:true},
   '/api/officer-alerts':{}
  };
  assert.equal(options.method||'GET',path==='/api/native-login'?'POST':'GET');
  assert.ok(path in data,'Unexpected endpoint '+path);
  return Response.json(data[path]);
 };
 t.after(()=>{clearOfficer();globalThis.window=previous.window;globalThis.fetch=previous.fetch;dom.window.close()});
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';
 q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>q('[data-officer-tab=train]'));
 q('[data-officer-tab=train]').click();
 await wait(()=>q('.native-train-history'));
 let fold=q('.native-train-history');
 assert.equal(fold.open,false);
 fold.querySelector('summary').click();
 await wait(()=>fold.open);
 const member=q('#native-train-history-member');
 member.focus();member.value='CAFÉ';member.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 assert.equal(dom.window.document.activeElement,member,'input keeps focus');
 assert.equal(q('#native-train-history-member'),member,'input node is preserved');
 assert.equal(fold.querySelector('[data-native-history-count]').textContent,'25');
 assert.match(fold.querySelector('[data-native-history-results]').textContent,/25 Treffer von 39/);
 assert.equal(fold.querySelectorAll('.native-train-history-list [data-native-train]').length,20);
 q('[data-native-more=train]').click();
 assert.equal(q('#native-train-history-member'),member);
 assert.equal(member.value,'CAFÉ');
 assert.equal(fold.open,true);
 assert.equal(fold.querySelectorAll('.native-train-history-list [data-native-train]').length,25);
 const date=q('#native-train-history-date');date.value='2026-09-14';date.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.equal(fold.querySelectorAll('.native-train-history-list [data-native-train]').length,1);
 assert.equal(fold.querySelector('[data-native-history-count]').textContent,'1');
 member.value='Nobody';member.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 assert.match(fold.querySelector('.native-train-history-list').textContent,/Keine passenden Einträge/);
 member.value='Bramser';member.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 date.value='2026-09-16';date.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.ok(fold.querySelector('[data-native-dice-date="2026-09-16"]'));
 q('[data-native-history-reset]').click();
 assert.equal(member.value,'');assert.equal(date.value,'');
 assert.equal(fold.querySelector('[data-native-history-count]').textContent,'39');
 assert.equal(fold.open,true);
 member.value='CAFÉ';member.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 fold.querySelector('.native-train-history-list [data-native-train]').click();
 assert.ok(q('#native-train-save'),'opening an editor keeps history available');
 assert.equal(member.value,'CAFÉ');
 q('[data-officer-tab=overview]').click();await wait(()=>!q('.native-train-history'));
 q('[data-officer-tab=train]').click();await wait(()=>q('.native-train-history'));
 fold=q('.native-train-history');
 assert.equal(fold.open,true);
 assert.equal(q('#native-train-history-member').value,'CAFÉ');
 assert.equal(fold.querySelector('[data-native-history-count]').textContent,'25');
 assert.match(q('.native-train-highlights').textContent,/30/);
 const search=q('#native-train-history-member');search.value='<img';search.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 assert.equal(fold.querySelector('.native-train-history-list img'),null,'historical display names are escaped');
 assert.match(fold.querySelector('.native-train-history-list strong').textContent,/<img src=x/);
});

test('filter labels translate in every locale and fit a narrow layout',async()=>{
 const labels=['Mitglied suchen','Datum filtern','Spielername …','Filter zurücksetzen','Keine passenden Einträge.','Treffer','von'];
 for(const lang of OFFICER_LANGUAGES)for(const label of labels){
  const translated=translateOfficerText(label,lang);
  assert.ok(translated.trim());
  if(lang!=='de')assert.notEqual(translated,label,`${lang}: ${label}`);
  assert.doesNotMatch(translated,/\uFFFD|undefined/);
 }
 const css=await readFile(new URL('../assets/hub.css',import.meta.url),'utf8');
 assert.match(css,/@media\(max-width:22rem\).*native-train-history-filters\{display:grid/);
 assert.match(css,/native-train-history-filters input\{[^}]*width:100%;min-width:0/);
});
