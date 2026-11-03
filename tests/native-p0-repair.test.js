import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
import {OFFICER_TEXT,OFFICER_LANGUAGES} from '../assets/native-admin-i18n.js';

test('P0 source and repair labels are present for all officer languages',()=>{
 for(const language of OFFICER_LANGUAGES){
  if(language==='de')continue;
  for(const label of ['Quelle','Datum','unbekannt','Prüfnotiz','Fahrer aus Allianz','Zuordnung offen']){
   assert.ok(OFFICER_TEXT[language]?.[label],`${language}: ${label}`);
  }
 }
});

async function waitFor(check){
 for(let i=0;i<100;i++){
  if(check())return;
  await new Promise(resolve=>setTimeout(resolve,5));
 }
 assert.ok(check(),'UI did not settle');
}

test('historical ride repair stays on its original date, uses an active ID and revision, and needs a note',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch,oldForm=globalThis.FormData;
 globalThis.window=dom.window;globalThis.FormData=dom.window.FormData;
 dom.window.confirm=()=>true;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;globalThis.FormData=oldForm;dom.window.close()});
 const active='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',former='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
 const ride={date:'2026-07-17',status:'completed',linked:false,member_id:null,driver:'Synthetic Short',original_name:'Synthetic Short',note:'Original import',revision:5};
 const train={today:'2026-10-15',history:[ride],calendar:[],counts:{completed:1},members:[
  {id:active,name:'Synthetic Confirmed',rank:'R4',status:'active'},
  {id:former,name:'Synthetic Former',rank:'R3',status:'former'}]};
 const posts=[];
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:2,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members:[]});
  if(path==='/api/train-manager')return Response.json(train);
  if(path==='/api/train-dice')return Response.json([]);
  if(path==='/api/members')return Response.json([]);
  if(path==='/api/train-rotation')return Response.json({revision:0,types:[],coordinators:[]});
  if(path==='/api/train-assignments'&&opts.method==='POST'){posts.push(JSON.parse(opts.body));return Response.json({ok:true})}
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const submit=form=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';submit(q('form'));
 await waitFor(()=>q('[data-officer-tab=train]'));
 q('[data-officer-tab=train]').click();
 await waitFor(()=>q('.native-train-unlinked-dates button'));
 q('.native-train-unlinked-dates button').click();
 const form=q('#native-train-save');
 assert.equal(form.dataset.repairDate,ride.date);
 assert.equal(form.querySelector('[name=date]').readOnly,true);
 assert.equal(form.querySelector('[name=status]').value,'completed');
 assert.equal(form.querySelector('[name=driver_name]'),null);
 assert.equal(form.querySelector(`[name=member_id] option[value="${former}"]`),null);
 assert.match(form.textContent,/Synthetic Short/);
 form.querySelector('[name=member_id]').value=active;
 submit(form);
 assert.equal(posts.length,0,'A repair without a review note cannot be saved');
 form.querySelector('[data-native-repair-reason]').value='Original proof confirms this player';
 form.querySelector('[name=date]').value='2026-07-18';
 submit(form);
 assert.equal(posts.length,0,'A changed date cannot create a second ride');
 form.querySelector('[name=date]').value=ride.date;
 submit(form);
 await waitFor(()=>posts.length===1);
 assert.equal(posts[0].date,ride.date);
 assert.equal(posts[0].status,'completed');
 assert.equal(posts[0].member_id,active);
 assert.equal(posts[0].expected_revision,5);
 assert.equal(posts[0].driver_name,undefined);
 assert.equal(posts[0].note,'Original import | Original proof confirms this player');
});
