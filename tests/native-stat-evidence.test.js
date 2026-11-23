import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
test('Weekly donation value and profile history open only the exact private approved screenshot',async t=>{
 const dom=new JSDOM('<html lang="en"><body><main id="app"></main></body></html>',
  {url:'https://lunas-empire.github.io/#admin'});
 const oldW=globalThis.window,oldF=globalThis.fetch,oldURL=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 URL.createObjectURL=()=> 'blob:private-synthetic';URL.revokeObjectURL=()=>{};
 const image=new Uint8Array([137,80,78,71,13,10,26,10,...Array(60).fill(1)]);
 const sha=Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256',image)),x=>x.toString(16).padStart(2,'0')).join('');
 const calls=[];
 const weekly={minimum:20000,weeks:[{week:'2026-W41',snapshot_id:'snap-a',captured_at:'2026-10-11T11:00:00Z',is_complete:true,
 active:1,verified:1,met:0,below:1,unknown:0,members:[{
 id:'member-a',name:'Synthetic Member',rank:'R4',snapshot_id:'snap-a',points:15000,
 status:'below',difference:-5000,delta:null,previous_week:null}]}]};
 globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname;calls.push(path);
  const data={
   '/api/native-login':{token:'test-memory',name:'Synthetic',role:'R5'},
   '/api/overview':{reviews:0,active:1},
   '/api/operations':{tasks:[],events:[],absences:[]},
   '/api/train-manager':{today:'2026-10-14',history:[],calendar:[],counts:{}},
   '/api/officer-alerts':{vs:{confirmed_repeated_low:null},donations:{confirmed_below:null}},
   '/api/donations-intelligence':weekly,
   '/api/member/member-a':{member:{id:'member-a',name:'Synthetic Member',rank:'R4',status:'active'},
    stats:[{snapshot_id:'snap-a',metric:'donations_weekly',value:15000,quality:'observed',captured_at:'2026-10-11T11:00:00Z'}],
    weeks:[],days:[],rides:[],dice_wins:[],achievements:[]},
   '/api/members':[{id:'member-a',name:'Synthetic Member',rank:'R4',status:'active'}],
   '/api/stat-evidence/snap-a/member-a/donations_weekly':{
    snapshot_id:'snap-a',member_id:'member-a',metric:'donations_weekly',value:15000,
    quality:'observed',captured_at:'2026-10-11T11:00:00Z',
    verified_source:{kind:'linked_capture',id:'donations_weekly-2026-10-11-002',sha256:sha},candidates:[]}
  };
  if(path==='/api/stat-evidence/snap-a/member-a/donations_weekly/image'){
   assert.equal(options.headers.Authorization,'Bearer test-memory');
   return new Response(image,{headers:{'Content-Type':'image/png'}});
  }
  if(!Object.hasOwn(data,path))throw Error('Unexpected request '+path);
  return Response.json(data[path]);
 };
 t.after(()=>{clearOfficer();globalThis.window=oldW;globalThis.fetch=oldF;
  URL.createObjectURL=oldURL;URL.revokeObjectURL=oldRevoke;dom.window.close()});
 const app=dom.window.document.querySelector('#app');
 const until=async selector=>{for(let i=0;i<100;i++){const node=app.querySelector(selector);if(node)return node;await new Promise(r=>setTimeout(r,10))}
  throw Error('UI missing '+selector)};
 initNativeAdmin(app);await renderNativeAdmin(app);
 (await until('input[name="code"]')).value='test';
 app.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 (await until('[data-officer-tab=vs]')).click();
 (await until('[data-officer-tab=donations]')).click();
 const value=await until('.native-donation-person [data-native-stat-evidence]');
 assert.equal(value.dataset.nativeStatEvidence,'snap-a|member-a|donations_weekly');
 value.click();
 await until('#native-stat-evidence-viewer img');
 assert.ok(calls.includes('/api/stat-evidence/snap-a/member-a/donations_weekly/image'));
 assert.equal(app.querySelectorAll('[data-native-stat-link]').length,0,'Verified proof skips candidate selection');
 app.querySelector('[data-native-stat-close]').click();
 assert.equal(app.querySelector('#native-stat-evidence-viewer'),null);
});

test('weekly fallback opens exact private original without a takeover action',async t=>{
 const dom=new JSDOM('<main id="app"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch,oldCreate=URL.createObjectURL;
 globalThis.window=dom.window;URL.createObjectURL=()=> 'blob:weekly-proof';
 const image=new Uint8Array([137,80,78,71,13,10,26,10,...Array(60).fill(2)]);
 const sha=Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256',image)),x=>x.toString(16).padStart(2,'0')).join('');
 const captureId='12345678-1234-4abc-8def-1234567890ab';
 globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/capture-archive/'+captureId+'/image'){
   assert.equal(options.headers.Authorization,'Bearer weekly-memory');
   return new Response(image,{headers:{'Content-Type':'image/png'}});
  }
  const data={
   '/api/native-login':{token:'weekly-memory',name:'Officer',role:'R4'},
   '/api/overview':{reviews:0,active:1},'/api/operations':{tasks:[],events:[],members:[]},
   '/api/train-manager':{today:'2026-11-22',history:[],calendar:[],counts:{}},
   '/api/vs-intelligence':{weeks:[{week:'2026-W47',state:'preliminary',members:[],dayTotals:[],
    weeklyFallback:{status:'partial_top20',verified_rows:0,deferred_rows:1,captured_at:'2026-11-22T12:00:00+01:00',
     rows:[{source_row:1,source_name:'Synthetic Review',weekly_rank:1,weekly_points:null,state:'deferred',
      capture_id:captureId,capture_sha256:sha}]}}]}
  };
  if(!Object.hasOwn(data,path))throw Error('Unexpected request '+path);
  return Response.json(data[path]);
 };
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;URL.createObjectURL=oldCreate;dom.window.close()});
 const app=dom.window.document.querySelector('#app');
 const until=async predicate=>{for(let i=0;i<120;i++){const node=app.querySelector(predicate);if(node)return node;await new Promise(r=>setTimeout(r,5))}throw Error('UI missing '+predicate)};
 initNativeAdmin(app);await renderNativeAdmin(app);
 app.querySelector('[name=code]').value='synthetic';
 app.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 (await until('[data-officer-tab=vs]')).click();
 const proof=await until('[data-native-weekly-evidence]');proof.click();
 await until('#native-stat-evidence-viewer img');
 assert.equal(app.querySelectorAll('[data-native-stat-link]').length,0,'proof view has no takeover action');
});
