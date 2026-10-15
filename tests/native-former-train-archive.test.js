import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer,historicalFormerRegistryEntries,groupUnlinkedTrainRides} from '../assets/native-admin.js';
import {translateOfficerText} from '../assets/native-admin-i18n.js';
const valid=(name,count=1)=>({name,ride_count:count,dates:['2026-06-10'],source:'historical_train'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn){for(let i=0;i<180;i++){if(fn())return;await sleep(6)}assert.ok(fn(),'UI did not reach expected state')}
test('Former train-only entries are archived without invented member IDs or fabricated stats',()=>{
 const registered=[{id:'r1',name:'Registered Former',lifecycle:'former'},{id:'r2',name:'Active Player',lifecycle:'active'}];
 const items=[valid('Retired One',3),valid('Registered Former'),valid('Active Player'),
  {name:'Invalid Source',source:'unmatched',ride_count:4,dates:['2026-06-10']},
  valid('Retired Two',1)];
 const archived=historicalFormerRegistryEntries(items,registered);
 assert.deepEqual(archived.map(x=>x.name),['Retired One','Retired Two']);
 assert.equal(archived[0].ride_count,3);
 assert.equal(Object.prototype.hasOwnProperty.call(archived[0],'id'),false);
 assert.equal(Object.prototype.hasOwnProperty.call(archived[0],'rank'),false);
});
test('Classified former rides are no longer misreported as unverified train players',()=>{
 const rides=[{status:'completed',linked:false,former_archive:true,driver:'Retired One',date:'2026-06-10'},
 {status:'completed',linked:false,driver:'Unidentified Person',date:'2026-06-11'},
 {status:'completed',linked:false,driver:'Retired One',date:'2026-06-12',former_archive:true}];
 assert.deepEqual(groupUnlinkedTrainRides(rides).map(x=>x.name),['Unidentified Person']);
});
test('Former section in member archive shows source-only records and never modifies registry',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;globalThis.window=dom.window;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 let updates=0;
 globalThis.fetch=async(url,opt={})=>{
  const path=new URL(url).pathname;
  if(opt.method==='POST'&&path!=='/api/native-login')updates++;
  if(path==='/api/native-login')return Response.json({token:'synthetic-private',name:'Officer',role:'R5'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({history:[],archivedFormerTrainDrivers:[valid('Retired One',3),valid('Registered Former',2),valid('Active Player',1)],counts:{}});
  if(path==='/api/officer-alerts')return Response.json({});
  if(path==='/api/member-registry')return Response.json({members:[
   {id:'r1',name:'Registered Former',rank:'R3',lifecycle:'former',blacklisted:false},
   {id:'r2',name:'Active Player',rank:'R4',lifecycle:'active',blacklisted:false}
  ],counts:{active:1,former:1,blacklisted:0}});
  if(path==='/api/members')return Response.json([]);
  return Response.json({}, {status:404});
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const submit=form=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';submit(q('form'));
 await until(()=>q('[data-officer-tab=more]'));q('[data-officer-tab=more]').click();
 await until(()=>q('[data-officer-tab=registry]'));q('[data-officer-tab=registry]').click();
 await until(()=>q('#registry-list'));
 assert.equal(q('.native-historical-member')?.textContent.includes('Retired One'),true);
 assert.equal(q('.native-historical-member')?.textContent.includes('Registered Former'),false,'Existing archive row is not duplicated');
 assert.equal(q('.native-historical-member')?.textContent.includes('Active Player'),false,'Active user is not fabricated as former');
 assert.equal(q('[data-registry-edit]')!==null,true,'Real member registry still editable');
 q('[data-native-registry-filter=former]').click();
 await until(()=>q('[data-native-registry-filter=former]').getAttribute('aria-pressed')==='true');
 assert.equal(mount.querySelectorAll('.native-historical-member').length,1);
 assert.match(q('#registry-list').textContent,/Retired One/);
 q('[data-native-registry-filter=active]').click();
 assert.equal(mount.querySelectorAll('.native-historical-member').length,0);
 assert.equal(updates,0,'No synthetic member or registry mutation is sent');
});
test('Four archival labels are localized in all fifteen officer languages',()=>{
 const sources=['Ehemalige aus Zugliste','Historische Zugfahrten ohne Spielerakte','Ehemalig (Zugliste)','Zuglisten-Namen ohne Spielerakte'];
 for(const language of ['en','uk','ja','fr','it','id','ar','ko','sv','pt','nl','th','km','fil'])
  for(const value of sources)assert.notEqual(translateOfficerText(value,language),value,language+' '+value);
});
