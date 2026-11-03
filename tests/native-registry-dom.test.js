import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
async function openMore(mount) {
 for(let i=0;i<160;i++){
  const more=mount.querySelector('[data-officer-tab=more]');
  if(more){more.click();return}
  await new Promise(resolve=>setTimeout(resolve,6));
 }
 throw Error('More page did not become available');
}


test('Registry preserves conflicting edits, reloads explicitly, and submits the displayed revision',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const win=dom.window,originalWindow=globalThis.window,originalFetch=globalThis.fetch;
 globalThis.window=win;win.confirm=()=>true;win.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=originalWindow;globalThis.fetch=originalFetch;dom.window.close()});
 let revision='a'.repeat(64),rank='R2',lifecycle='active',failReload=false,posts=[];
 const profile=()=>({id:'synthetic-member',name:'Synthetic Member',rank,status:'active',imported_rank:'R1',source_status:'former',state_source:'registry',source_difference:1,registry_updated_at:'2026-10-13T00:00:00Z',registry_updated_by:'<Synthetic Officer>'});
 globalThis.fetch=async(url,options)=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-memory-only',name:'Synthetic Officer',role:'R5'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{missing_recent:0}});
  if(path==='/api/members')return Response.json([profile()]);
  if(path==='/api/member/synthetic-member')return Response.json({member:profile(),stats:[],weeks:[]});
  assert.equal(path,'/api/member-registry');
  if(options.method==='POST'){
   const payload=JSON.parse(options.body);posts.push(payload);
   if(payload.revision!==revision)return Response.json({error:'Conflict'},{status:409});
   rank=payload.rank;revision='c'.repeat(64);return Response.json({ok:true});
  }
  if(failReload)return Response.json({error:'Temporarily unavailable'},{status:503});
  return Response.json({members:[{id:'synthetic-member',name:'Synthetic Member',rank,lifecycle,blacklisted:0,reason:'Initial synthetic reason',revision}],counts:{active:1,former:0,blacklisted:0}});
 };
 const mount=win.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const until=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(predicate(),'UI did not settle')};
 const submit=form=>form.dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';submit(q('form'));
 await openMore(mount);
 await until(()=>q('[data-officer-tab=registry]'));q('[data-officer-tab=registry]').click();
 await until(()=>q('[data-registry-edit]'));q('[data-registry-edit]').click();
 let form=q('#registry-save');
 assert.equal(form.elements.namedItem('reason').required,true);
 assert.equal(form.elements.namedItem('reason').minLength,8);
 assert.equal(form.dataset.revision,'a'.repeat(64));
 form.elements.namedItem('rank').value='R3';form.elements.namedItem('reason').value='My unsaved evidence';
 revision='b'.repeat(64);rank='R1';submit(form);
 await until(()=>form.dataset.conflict==='1');
 assert.equal(posts.length,1);assert.equal(posts[0].revision,'a'.repeat(64));
 assert.equal(form.elements.namedItem('rank').value,'R3');
 assert.equal(form.elements.namedItem('reason').value,'My unsaved evidence');
 assert.equal(form.querySelector('[type=submit]').disabled,true);
 submit(form);assert.equal(posts.length,1);
 win.confirm=()=>false;q('[data-registry-reload]').click();assert.equal(q('#registry-save'),form);
 win.confirm=()=>true;failReload=true;q('[data-registry-reload]').click();
 await until(()=>q('#native-form-message').textContent==='Temporarily unavailable');
 assert.equal(q('#registry-save'),form);assert.equal(form.dataset.revision,'a'.repeat(64));
 failReload=false;q('[data-registry-reload]').click();
 await until(()=>q('#registry-save')!==form);form=q('#registry-save');
 assert.equal(form.dataset.revision,'b'.repeat(64));assert.equal(form.elements.namedItem('rank').value,'R1');
 form.elements.namedItem('rank').value='R3';submit(form);
 await until(()=>posts.length===2&&!q('#registry-save'));
 assert.equal(posts[1].revision,'b'.repeat(64));assert.equal(rank,'R3');
 q('[data-officer-tab=members]').click();await until(()=>q('[data-native-member]'));
 q('[data-native-member]').click();await until(()=>q('#native-person').textContent.includes('Abweichender Import'));
 assert.match(q('#native-person').textContent,/R1/);
 assert.match(q('#native-person').textContent,/<Synthetic Officer>/);
 assert.equal(q('#native-person synthetic'),null);
 await openMore(mount);
 lifecycle='unverified';rank=null;q('[data-officer-tab=registry]').click();
 await until(()=>q('[data-registry-edit]'));q('[data-registry-edit]').click();
 form=q('#registry-save');assert.equal(form.elements.namedItem('rank').value,'');
 assert.equal(form.elements.namedItem('lifecycle').value,'');assert.equal(form.checkValidity(),false);
});
