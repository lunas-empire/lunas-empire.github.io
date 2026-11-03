import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {createStatEvidenceViewer} from '../assets/native-stat-evidence.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
test('Source image preview cannot silently link another player; explicit confirmation is mandatory',async t=>{
 const dom=new JSDOM('<div id="content"></div>',{url:'https://lunas-empire.github.io/#admin'});
 const win=globalThis.window,fetchBefore=globalThis.fetch,urlBefore=URL.createObjectURL,revokeBefore=URL.revokeObjectURL;
 globalThis.window=dom.window;
 URL.createObjectURL=()=> 'blob:synthetic-private';URL.revokeObjectURL=()=>{};
 let prompt=0;dom.window.confirm=()=>{prompt++;return true};
 const png=new Uint8Array([137,80,78,71,13,10,26,10,...Array(65).fill(2)]);
 const hash=[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',png))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const key='snap-a|member-a|donations_weekly',capture='donations_weekly-2026-10-11-001';
 let linked=false,writes=0,reads=0;
 const base='/api/stat-evidence/snap-a/member-a/donations_weekly';
 const request=async(path,options)=>{
  if(path===base){
   return {snapshot_id:'snap-a',member_id:'member-a',metric:'donations_weekly',value:15000,
    captured_at:'2026-10-11T10:00:00Z',
    verified_source:linked?{kind:'linked_capture',id:capture,sha256:hash}:null,
    candidates:linked?[]:[{id:capture,sha256:hash,capture_index:1}]};
  }
  if(path===base+'/link'){
   assert.equal(options.body.capture_id,capture);assert.equal(options.body.sha256,hash);
   assert.ok(options.body.reason.length>=8);writes++;linked=true;return {ok:true};
  }
  throw Error('Unexpected request '+path);
 };
 globalThis.fetch=async url=>{reads++;return new Response(png,{headers:{'Content-Type':'image/png'}})};
 t.after(()=>{viewer.close();globalThis.fetch=fetchBefore;globalThis.window=win;URL.createObjectURL=urlBefore;URL.revokeObjectURL=revokeBefore;dom.window.close()});
 const viewer=createStatEvidenceViewer({request,getToken:()=> 'synthetic',apiBase:'https://private.example'});
 const container=dom.window.document.getElementById('content');
 await viewer.open(container,key);
 assert.equal(writes,0);
 assert.equal(reads,0,'Never show top ranked random capture by default');
 await viewer.step(0);
 assert.equal(reads,1,'Image is loaded only after explicit source browse');
 assert.match(container.querySelector('.native-stat-candidate-count').textContent,/1 \/ 1/);
 assert.equal(container.querySelector('[data-native-stat-link]').disabled,false);
 await viewer.link();
 assert.equal(prompt,1);
 assert.equal(writes,1);
 assert.ok(container.querySelector('#native-stat-evidence-viewer img'));
 assert.equal(container.querySelector('[data-native-stat-link]'),null);
});
