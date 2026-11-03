import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
import {formerArchiveFromTrain,normalizeTrainIdentity} from '../assets/former-train-archive.js';
import {translateOfficerText} from '../assets/native-admin-i18n.js';
const crypto=webcrypto;
const item=(name,dates=['2026-09-02'])=>({name,ride_count:dates.length,dates,source:'historical_train'});
test('worker-confirmed former train passengers are not fabricated into member identities',async()=>{
 const train={history:[{date:'2026-09-02',status:'completed',linked:false,driver:'Unknown Name'}],archivedFormerTrainDrivers:[item('Old Rider'),item('Known Rider')]};
 const m=[{id:'1',name:'Known Rider',rank:'R5',status:'active'}];
 const rows=await formerArchiveFromTrain(train,m,crypto.subtle);
 assert.deepEqual(rows.map(x=>x.name),['Old Rider']);
 assert.equal(rows[0].id,undefined);
 assert.equal(rows[0].rank,undefined);
 assert.equal(train.counts.historical_former,1);
 assert.notEqual(train.history[0].former_archive,true,'Unknown names are never auto-archived');
});
test('duplicate train dates, invalid source and known active names cannot inflate the archive',async()=>{
 const train={archivedFormerTrainDrivers:[item('Retired',[ '2026-06-01','2026-06-01','bad']),{name:'Unsafe',source:'unmatched',ride_count:3,dates:['2026-06-02']}]};
 const former=await formerArchiveFromTrain(train,[],crypto.subtle);
 assert.equal(former.length,1);assert.deepEqual(former[0].dates,['2026-06-01']);assert.equal(former[0].ride_count,1);
});
test('normalization strips invisible characters but preserves distinct real names',()=>{
 assert.equal(normalizeTrainIdentity('Rider \u200B'),'rider');
 assert.notEqual(normalizeTrainIdentity('Rider 2'),normalizeTrainIdentity('Rider'));
});
async function wait(ok){for(let i=0;i<200;i++){if(ok())return;await new Promise(r=>setTimeout(r,8))}assert.ok(ok(),'UI stalled')}
test('Alliance > Members includes archive section and keeps active rank separate',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const originalWindow=globalThis.window,originalFetch=globalThis.fetch,originalCrypto=globalThis.crypto;
 globalThis.window=dom.window;
 Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=originalWindow;globalThis.fetch=originalFetch;Object.defineProperty(globalThis,'crypto',{value:originalCrypto,configurable:true});dom.window.close()});
 let postCount=0;
 globalThis.fetch=async(url,opt={})=>{
  const p=new URL(url).pathname;
  if(opt.method==='POST'&&p!=='/api/native-login')postCount++;
  if(p==='/api/native-login')return Response.json({token:'synthetic-only',name:'Officer',role:'R5'});
  if(p==='/api/overview')return Response.json({active:2,reviews:0});
  if(p==='/api/operations')return Response.json({tasks:[],events:[],absences:[]});
  if(p==='/api/officer-alerts')return Response.json({});
  if(p==='/api/members')return Response.json([
   {id:'a',name:'Current One',rank:'R5',status:'active',power:100},
   {id:'b',name:'Archived Member',rank:'R4',status:'former'},
   {id:'c',name:'Current Two',rank:'R4',status:'active'}
  ]);
  if(p==='/api/train-manager')return Response.json({
   history:[],archivedFormerTrainDrivers:[item('Old Rider',[ '2026-09-01','2026-09-08']),item('Current One')],counts:{}
  });
  return Response.json({}, {status:404});
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 initNativeAdmin(mount);
 await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';
 q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>q('[data-officer-tab=members]'));
 q('[data-officer-tab=members]').click();
 await wait(()=>q('details.native-members-archive'));
 const archive=q('details.native-members-archive');
 assert.match(archive.textContent,/Old Rider/);
 assert.match(archive.textContent,/Archived Member/);
 assert.doesNotMatch(archive.textContent,/Current One/);
 assert.equal(q('[data-rank=R5]')!==null,true);
 assert.equal(q('[data-rank=R4]')!==null,true);
 assert.match(archive.textContent,/2026-09-01/);
 assert.match(archive.textContent,/2026-09-08/);
 assert.equal(archive.querySelectorAll('[data-native-member]').length,1,'Only real archived users open normal dossier');
 assert.equal(archive.querySelectorAll('.native-rank-members').length,1,'A single unified member list');
 assert.equal(archive.querySelectorAll('.native-archive-row').length,1);
 assert.match(archive.querySelector('.native-archive-row').textContent,/Zugfahrt/);
 assert.deepEqual([...archive.querySelector('.native-rank-members').children].map(x=>x.querySelector('strong').textContent),['Archived Member','Old Rider'],'Former profile and train rider are alphabetically interleaved');
 assert.equal(postCount,0,'Historical listing never posts a fake member');
 const search=q('#native-member-search');search.value='Old Rider';
 search.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 await wait(()=>q('details.native-members-archive')?.open);
 assert.match(q('details.native-members-archive').textContent,/Old Rider/);
 assert.doesNotMatch(q('details.native-members-archive').textContent,/Archived Member/);
});
test('new archive labels are available across 15 officer languages',()=>{
 for(const lang of ['en','uk','ja','fr','it','id','ar','ko','sv','pt','nl','th','km','fil']){
  assert.notEqual(translateOfficerText('Historischer Zugbeleg, noch keine Spielerakte',lang),'Historischer Zugbeleg, noch keine Spielerakte',lang);
  assert.notEqual(translateOfficerText('Ehemalige Mitglieder',lang),'Ehemalige Mitglieder',lang);
 }
});
