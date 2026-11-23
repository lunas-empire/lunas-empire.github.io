import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const until=async predicate=>{for(let i=0;i<160;i++){if(predicate())return;await new Promise(r=>setTimeout(r,5))}assert.ok(predicate(),'UI did not settle')};
async function setup(t,{writes=true,role='R4',postError=false,refreshError=false,evidence=false,kind='identity'}={}){
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const previous={window:globalThis.window,fetch:globalThis.fetch};globalThis.window=dom.window;
 dom.window.HTMLElement.prototype.scrollIntoView=function(){this.dataset.scrolled='true'};
 t.after(()=>{clearOfficer();Object.assign(globalThis,previous);dom.window.close()});
 const item={source_name:'<Unknown & player>',week:'2026-W45',snapshot_id:'source',source_row:7,member_id:null,metric:'name',kind:'identity',value:null};
 const bytes=new Uint8Array(100);bytes.set([137,80,78,71,13,10,26,10]);
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 const calls=[];let opened=false,failPost=postError,failRefresh=refreshError,release;
 const gate=new Promise(resolve=>{release=resolve});
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;calls.push({path,opts});
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role});
  if(path==='/api/overview')return Response.json({active:0,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({calendar:[],counts:{}});
  if(path==='/api/session')return Response.json({reviewWritesEnabled:writes});
  if(path==='/api/identity-options')return Response.json([{id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',name:'Synthetic permanent member',rank:'R4',status:'active'}]);
  if(path==='/api/reviews/case-exact/evidence')return new Response(bytes,{headers:{'Content-Type':'image/png'}});
  if(path==='/api/reviews/pending')return Response.json({queues:{identities:{available:true,count:1,items:[item]},donations:{available:false,count:null,items:[]}}});
  if(path==='/api/reviews/open'){
   await gate;if(failPost){failPost=false;return Response.json({error:'Exact conflict <retry>'},{status:409})}
   opened=true;return Response.json({ok:true,review_id:'case-exact'});
  }
  if(path==='/api/reviews'){
   if(opened&&failRefresh){failRefresh=false;return Response.json({error:'Readback unavailable'},{status:503})}
   return Response.json(opened?[...Array.from({length:25},(_,i)=>({id:'other-'+i,source_name:'Other',kind:'identity'})),{id:'case-exact',source_name:item.source_name,kind,metric:'name',evidence_sha:evidence?sha:null}]:[]);
  }
  return Response.json({items:[],total_pending:0});
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=more]'));q('[data-officer-tab=more]').click();await until(()=>q('[data-officer-tab=reviews]'));q('[data-officer-tab=reviews]').click();
 await until(()=>q('[data-pending-queues] button'));
 return {dom,mount,q,calls,item,release,sha};
}

for(const config of [{writes:false},{writes:true,role:'R3'},{writes:true,role:'R1'}])test('pending source inspection remains available without write authorization '+JSON.stringify(config),async t=>{
 const {q,mount,calls}=await setup(t,config);
 const inspect=q('[data-pending-inspect]');assert.ok(inspect);inspect.click();
 assert.ok(q('[data-pending-item]').open);assert.match(q('[data-pending-item]').textContent,/source_row.*7/s);
 assert.match(q('[data-pending-item]').textContent,/R4\/R5|Backend|backend/);
 assert.equal(q('[data-pending-open]'),null);assert.equal(mount.querySelector('unknown'),null);
 q('[data-pending-sources]').click();assert.equal(mount.ownerDocument.activeElement,q('[data-source-filters] input'));
 assert.equal(calls.filter(c=>c.opts.method==='POST'&&c.path!=='/api/native-login').length,0);
});

test('pending open posts once and reveals exact case beyond filters and pagination',async t=>{
 const {q,mount,calls,item,release}=await setup(t);
 q('#review-search-native').value='will hide case';q('#review-image-native').value='with';q('#review-kind-native').value='profile';
 const button=q('[data-pending-open]');assert.ok(button);button.click();button.click();release();
 await until(()=>q('[data-review-id="case-exact"]')?.open);
 assert.equal(calls.filter(c=>c.path==='/api/reviews/open').length,1);
 assert.deepEqual(JSON.parse(calls.find(c=>c.path==='/api/reviews/open').opts.body),{...item,queue:'identities'});
 const card=q('[data-review-id="case-exact"]');assert.equal(card.dataset.scrolled,'true');assert.equal(mount.ownerDocument.activeElement,card.querySelector('summary'));
 assert.match(card.querySelector('.native-review-message').textContent,/case-exact/,'success remains visible in the opened destination');
 assert.match(q('[data-pending-message]').textContent,/case-exact/);assert.equal(q('[data-pending-item]').open,false);
 button.click();assert.equal(calls.filter(c=>c.path==='/api/reviews/open').length,1);
});

for(const mode of ['postError','refreshError'])test('pending failures are explicit and retry '+mode,async t=>{
 const {q,calls,release}=await setup(t,{[mode]:true});const button=q('[data-pending-open]');assert.ok(button);button.click();release();
 await until(()=>/Exact conflict|Readback unavailable/.test(q('[data-pending-message]').textContent));
 assert.equal(button.disabled,false);button.click();await until(()=>q('[data-review-id="case-exact"]')?.open);
 assert.equal(calls.filter(c=>c.path==='/api/reviews/open').length,mode==='postError'?2:1,'readback retry never reposts a successful open');
});

test('logout during pending open cannot fetch or populate a new session',async t=>{
 const {q,calls,release}=await setup(t);const button=q('[data-pending-open]');assert.ok(button);button.click();clearOfficer();release();
 await new Promise(r=>setTimeout(r,30));assert.equal(calls.filter(c=>c.path==='/api/reviews').length,1);
 assert.equal(q('[data-review-id="case-exact"]'),null);
});

test('pending reload coalesces repeated clicks and stale readback never renders',async t=>{
 const {q,calls,release}=await setup(t,{role:'R5'});
 const fetch=globalThis.fetch;let pendingRelease,refreshRelease,pendingStarted=false,refreshStarted=false;
 globalThis.fetch=async(url,opts)=>{
  const path=new URL(url).pathname;
  if(path==='/api/reviews/pending'){pendingStarted=true;await new Promise(resolve=>{pendingRelease=resolve})}
  if(path==='/api/reviews'){refreshStarted=true;await new Promise(resolve=>{refreshRelease=resolve})}
  return fetch(url,opts);
 };
 const reload=q('[data-pending-reload]');reload.click();reload.click();reload.click();
 assert.equal(pendingStarted,true);pendingRelease();await until(()=>!reload.disabled);
 assert.equal(calls.filter(c=>c.path==='/api/reviews/pending').length,2,'one initial read and one explicit reload');
 q('[data-pending-open]').click();release();await until(()=>refreshStarted);clearOfficer();refreshRelease();
 await new Promise(r=>setTimeout(r,30));assert.equal(q('[data-review-id="case-exact"]'),null);
});

async function openedCase(t,options){
 const state=await setup(t,options);state.dom.window.confirm=()=>true;
 state.q('[data-pending-open]').click();state.release();
 await until(()=>state.q('[data-review-id="case-exact"]')?.open);
 state.q('[data-native-review-reason]').value='Synthetic source checked manually';
 return state;
}

for(const mode of ['missing receipt','wrong case','missing readback','wrong decision'])test('review completion refuses false success: '+mode,async t=>{
 const {q}=await openedCase(t),fetch=globalThis.fetch;let posted=false;
 globalThis.fetch=async(url,opts={})=>{
  const parsed=new URL(url);
  if(parsed.pathname==='/api/reviews/case-exact/resolve'){
   posted=true;return Response.json(mode==='missing receipt'?{}:{ok:true,review_id:mode==='wrong case'?'other-case':'case-exact',status:'dismissed',kind:'identity'});
  }
  if(posted&&parsed.pathname==='/api/reviews')return Response.json(mode==='missing readback'?[]:[{id:'case-exact',status:'dismissed',resolution:{action:mode==='wrong decision'?'approve':'dismiss',reason:'Synthetic source checked manually'}}]);
  return fetch(url,opts);
 };
 q('[data-native-review-resolve="dismiss"]').click();
 await until(()=>posted);await new Promise(r=>setTimeout(r,25));
 assert.ok(q('[data-review-id="case-exact"]'),'unverified completion must remain visible');
 assert.equal(q('#native-review-finished').textContent,'');
 assert.match(q('.native-review-message').textContent,/Quittung|Rückles|Status/);
});

test('acknowledged completion retries only independent readback and never posts twice',async t=>{
 const {q}=await openedCase(t),fetch=globalThis.fetch;let posts=0,reads=0;
 globalThis.fetch=async(url,opts={})=>{
  const parsed=new URL(url);
  if(parsed.pathname==='/api/reviews/case-exact/resolve'){
   posts++;return Response.json({ok:true,review_id:'case-exact',status:'dismissed',kind:'identity'});
  }
  if(posts&&parsed.pathname==='/api/reviews'){
   reads++;if(reads===1)return Response.json({error:'Synthetic readback outage'},{status:503});
   assert.equal(parsed.searchParams.get('status'),'dismissed');
   return Response.json([{id:'case-exact',status:'dismissed',resolution:{action:'dismiss',reason:'Synthetic source checked manually'}}]);
  }
  return fetch(url,opts);
 };
 q('[data-native-review-resolve="dismiss"]').click();
 await until(()=>/outage/.test(q('.native-review-message')?.textContent));
 q('[data-native-review-resolve="dismiss"]').click();
 await until(()=>!q('[data-review-id="case-exact"]'));
 assert.equal(posts,1);assert.equal(reads,2);
 assert.match(q('#native-review-finished').textContent,/case-exact.*quittiert.*gelesen/);
});

for(const kind of ['identity','vs_day'])for(const wrongReadback of [false,true])test('evidence-backed manual '+kind+' requires matching saved identity/value: '+wrongReadback,async t=>{
 const {q,sha}=await openedCase(t,{evidence:true,kind}),fetch=globalThis.fetch;
 await until(()=>!q('[data-native-review-resolve="approve"]').disabled);
 assert.ok(q('.native-review-image img'),'only the explicitly linked evidence was loaded');
 const member='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
 if(kind==='identity'){
  await until(()=>q('[data-native-review-pick]'));q('[data-native-review-pick]').click();
  assert.equal(q('[data-native-review-member]').value,member);
 }else q('[data-native-review-value]').value='0';
 let posted,reads=0;
 globalThis.fetch=async(url,opts={})=>{
  const parsed=new URL(url);
  if(parsed.pathname==='/api/reviews/case-exact/resolve'){
   posted=JSON.parse(opts.body);
   assert.equal(posted.evidence_sha,sha);
   if(kind==='identity')assert.equal(posted.member_id,member);else assert.equal(posted.corrected_value,0);
   return Response.json({ok:true,review_id:'case-exact',status:'approved',kind});
  }
  if(posted&&parsed.pathname==='/api/reviews'){
   reads++;assert.equal(parsed.searchParams.get('status'),'approved');
   const resolution={...posted,...(wrongReadback?(kind==='identity'?{member_id:'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'}:{corrected_value:null}):{})};
   return Response.json([{id:'case-exact',status:'approved',evidence_sha:sha,resolution}]);
  }
  return fetch(url,opts);
 };
 q('[data-native-review-resolve="approve"]').click();
 await until(()=>reads===1);await new Promise(r=>setTimeout(r,15));
 assert.equal(Boolean(q('[data-review-id="case-exact"]')),wrongReadback);
 if(wrongReadback)assert.match(q('.native-review-message').textContent,/Rücklesekontrolle/);
 else assert.match(q('#native-review-finished').textContent,/case-exact.*quittiert.*gelesen/);
});

test('logout during completion prevents readback in the next session',async t=>{
 const {q}=await openedCase(t),fetch=globalThis.fetch;let release,posts=0,reads=0;
 const gate=new Promise(resolve=>{release=resolve});
 globalThis.fetch=async(url,opts={})=>{
  if(new URL(url).pathname==='/api/reviews/case-exact/resolve'){
   posts++;await gate;return Response.json({ok:true,review_id:'case-exact',status:'dismissed',kind:'identity'});
  }
  if(posts&&new URL(url).pathname==='/api/reviews')reads++;
  return fetch(url,opts);
 };
 q('[data-native-review-resolve="dismiss"]').click();await until(()=>posts===1);
 clearOfficer();release();await new Promise(r=>setTimeout(r,25));
 assert.equal(reads,0);assert.equal(q('#native-review-finished').textContent,'');
});
