import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
globalThis.crypto||=webcrypto;
test('VS player/day opens exact row crop and original SHA, never unrelated top-three or guessed OCR review',async t=>{
 const dom=new JSDOM('<main id="app"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 URL.createObjectURL=()=> 'blob:synthetic-vs';URL.revokeObjectURL=()=>{};
 const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',member='Correct Player Name';
 const png=new Uint8Array([137,80,78,71,13,10,26,10,...Array(73).fill(11)]);
 const hash=[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',png))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const calls=[];
 const images='/api/vs-source/2026-W41/'+id+'/1/image';
 const data={
  '/api/native-login':{token:'synthetic-memory',name:'QA',role:'R5'},
  '/api/overview':{active:1,reviews:0},
  '/api/operations':{tasks:[],events:[],absences:[]},
  '/api/train-manager':{today:'2026-10-15',calendar:[],history:[],counts:{}},
  '/api/officer-alerts':{vs:{confirmed_repeated_low:0},donations:{confirmed_below:null}},
  '/api/vs-intelligence':{weeks:[{week:'2026-W41',state:'final',priority:1,
   members:[{id,name:member,rank:'R2',failed:1,unknown:0,
    days:[{weekday:0,verified:false,points:null},{weekday:1,verified:true,points:2548100}]}]}]},
  ['/api/vs-source/2026-W41/'+id+'/1']:{
   member_name:member,value:2548100,source:{kind:'ocr_original_row',
    capture_id:'2026-W41-1-020',sha256:hash,row_y:342,
    source_name:'Wrong OCR Spelling',source_value:2548100,
    visually_checked:false,image_available:true}}
 };
 globalThis.fetch=async (url,options={})=>{
  const path=new URL(url).pathname;calls.push(path);
  if(path===images){
   assert.equal(options.headers.Authorization,'Bearer synthetic-memory');
   return new Response(png,{headers:{'Content-Type':'image/png'}});
  }
  if(!Object.hasOwn(data,path))throw Error('Unexpected source lookup '+path);
  return Response.json(data[path]);
 };
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;
  URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;dom.window.close()});
 const app=dom.window.document.querySelector('#app');
 const find=async sel=>{for(let i=0;i<125;i++){const node=app.querySelector(sel);if(node)return node;await new Promise(r=>setTimeout(r,8))}
  throw Error('Missing '+sel)};
 initNativeAdmin(app);await renderNativeAdmin(app);
 (await find('input[name="code"]')).value='synthetic';
 app.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 (await find('[data-officer-tab=vs]')).click();
 (await find('.native-vs-group summary')).click();
 const day=await find('[data-native-vs-image="2026-W41|'+id+'|1"]');
 day.click();
 const row=await find('#native-vs-evidence-viewer .native-stat-row-identity');
 assert.match(row.textContent,/Correct Player Name/);
 assert.match(row.textContent,/2.548.100/);
 assert.doesNotMatch(row.textContent,/Wrong OCR Spelling/);
 assert.equal(calls.filter(x=>x===images).length,1);
 assert.ok(!calls.some(x=>x.includes('/api/vs-days/')),
  'No legacy same-day screenshot or top-three fallback request');
 assert.ok(app.querySelector('#native-vs-evidence-viewer .native-stat-full-image img'));
 app.querySelector('[data-native-vs-image-close]').click();
});

test('missing archived VS source offers its exact day upload and rejects a different SHA',async t=>{
 const dom=new JSDOM('<main id="app"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch,oldForm=globalThis.FormData;
 const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 globalThis.window=dom.window;globalThis.FormData=dom.window.FormData;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 URL.createObjectURL=()=> 'blob:synthetic-vs';URL.revokeObjectURL=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;globalThis.FormData=oldForm;
  URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;dom.window.close()});
 const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',week='2026-W41',day=1;
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,...Array(72).fill(5)]);
 const hash=Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256',png)),v=>v.toString(16).padStart(2,'0')).join('');
 let available=false;const uploads=[];
 const sourcePath=`/api/vs-source/${week}/${id}/${day}`;
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-15',calendar:[],history:[],counts:{}});
  if(path==='/api/officer-alerts')return Response.json({});
  if(path==='/api/vs-intelligence')return Response.json({weeks:[{week,state:'final',members:[{id,name:'Synthetic Player',rank:'R2',
   days:[{weekday:day,verified:true,points:0}]}]}]});
  if(path===sourcePath)return Response.json({member_name:'Synthetic Player',source:{sha256:hash,row_y:280,
   source_name:'Synthetic OCR',source_value:0,image_available:available}});
  if(path===`${sourcePath}/image`)return new Response(png,{headers:{'Content-Type':'image/png'}});
  if(path===`/api/vs-days/${week}/${id}/${day}/evidence`&&opts.method==='PUT'){
   uploads.push(opts);available=true;return Response.json({ok:true,sha256:hash});
  }
  throw Error('Unexpected '+path);
 };
 const app=dom.window.document.querySelector('#app');
 const find=async selector=>{for(let i=0;i<100;i++){const item=app.querySelector(selector);if(item)return item;
  await new Promise(resolve=>setTimeout(resolve,5))}throw Error('Missing '+selector)};
 initNativeAdmin(app);await renderNativeAdmin(app);
 (await find('[name=code]')).value='synthetic';
 app.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 (await find('[data-officer-tab=vs]')).click();
 (await find('.native-vs-group summary')).click();
 (await find(`[data-native-vs-image="${week}|${id}|${day}"]`)).click();
 const form=await find('#native-vs-evidence-upload');
 assert.match(form.closest('#native-vs-evidence-image').textContent,/Synthetic Player.*Synthetic OCR.*OCR: 0.*Y: 280.*SHA-256/);
 assert.match(app.querySelector('#native-vs-evidence-viewer h3').textContent,/Dienstag.*2026-W41/);
 assert.equal(form.dataset.expectedSha,hash);
 assert.equal(form.elements.namedItem('reason').value,'','Review reason must be entered by the officer');
 const wrong=new Blob([Uint8Array.from([...png.slice(0,-1),6])],{type:'image/png'});
 Object.defineProperty(form.elements.namedItem('image'),'files',{value:[wrong],configurable:true});
 form.elements.namedItem('reason').value='Synthetic row and zero checked';
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await find('.native-vs-evidence-upload-result');
 for(let i=0;i<100&&!form.querySelector('.native-vs-evidence-upload-result').textContent;i++)await new Promise(resolve=>setTimeout(resolve,5));
 assert.match(form.querySelector('.native-vs-evidence-upload-result').textContent,/Prüfsumme/);
 assert.equal(uploads.length,0);
 Object.defineProperty(form.elements.namedItem('image'),'files',{value:[new Blob([png],{type:'image/png'})],configurable:true});
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 for(let i=0;i<100&&uploads.length===0;i++)await new Promise(resolve=>setTimeout(resolve,5));
 assert.equal(uploads.length,1);
 assert.equal(uploads[0].headers.Authorization,'Bearer synthetic');
 assert.equal(uploads[0].body.size,png.length);
});
