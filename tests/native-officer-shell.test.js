import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Single-shell officer navigation never hides ordinary RZSN pages',()=>{
 const document=new JSDOM(read('index.html')).window.document;
 assert.equal(document.querySelectorAll('header.site-header').length,1);
 assert.equal(document.querySelectorAll('nav.main-nav').length,1);
 assert.equal(document.querySelectorAll('#admin-link[href="#admin"]').length,1);
 const app=read('assets/app.js'),css=read('assets/hub.css');
 assert.match(app,/dataset\.officerMode=String\(currentView==='admin'&&location\.hostname!=='rzsn-home\.github\.io'\)/);
 assert.match(css,/html\[data-officer-mode='true'\] \.main-nav\{visibility:visible\}/);
 assert.doesNotMatch(css,/html\[data-officer-mode='false'\] \.main-nav\{display:none/);
 assert.match(css,/\.native-officer-strip\{/);
 assert.match(css,/html\[data-officer-mode='true'\] body\{/);
});


test('root admin retains the native session across reviews, language, theme and hub navigation',async()=>{
 const dom=new JSDOM(read('index.html'),{url:'https://lunas-empire.github.io/#admin-review',pretendToBeVisual:true});
 const win=dom.window,prior=new Map(),calls=[];
 const expose=(key,value)=>{prior.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true})};
 win.matchMedia=()=>({matches:false});win.scrollTo=()=>{};win.HTMLElement.prototype.scrollIntoView=()=>{};
 for(const key of ['window','document','navigator','location','HTMLImageElement'])expose(key,key==='window'?win:win[key]);
 expose('requestAnimationFrame',fn=>win.requestAnimationFrame(fn));
 expose('ResizeObserver',class{observe(){} disconnect(){}});
 expose('IntersectionObserver',class{observe(){} disconnect(){}});
 expose('setInterval',()=>0);
 expose('fetch',async(url,options={})=>{
  const path=new URL(url).pathname;calls.push({path,auth:options.headers?.Authorization});
  const data={'/api/native-login':{role:'R4',name:'Synthetic Officer',token:'synthetic-memory-only'},'/api/overview':{active:0,reviews:0},'/api/operations':{tasks:[],events:[],absences:[]},'/api/train-manager':{calendar:[],history:[],counts:{}},'/api/officer-alerts':{},'/api/reviews':[], '/api/identity-options':[], '/api/session':{reviewWritesEnabled:false},'/api/profile-captures':[], '/api/capture-publication-review':{items:[],total_pending:0}, '/api/capture-publication-review/decisions':{items:[],total:0}};
  assert.ok(Object.hasOwn(data,path),'Unexpected endpoint '+path);
  return Response.json(data[path]);
 });
 const until=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,10))}assert.ok(fn(),'root UI did not settle')};
 const q=selector=>win.document.querySelector(selector);
 const nav=async hash=>{win.location.hash=hash;await new Promise(r=>setTimeout(r,50))};
 let mod;
 try{
  win.localStorage.setItem('rzsn-language',JSON.stringify('de'));
  await import('../assets/app.js?root-native-regression');
  await until(()=>q('#native-officer-login'));
  assert.equal(win.location.pathname,'/');
  const mount=q('#native-officer-root');
  q('[name=code]').value='synthetic';q('#native-officer-login').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
  await until(()=>q('#native-source-reviews'));
  assert.equal(q('iframe'),null);
  assert.equal(q('#admin-link').getAttribute('aria-current'),'page');
  assert.equal(q('[data-view=wiki]'),null);
  await nav('#admin');assert.equal(q('#native-officer-root'),mount);
  q('[data-officer-tab=overview]').click();await until(()=>q('.native-dashboard'));
  q('#language').value='en';q('#language').dispatchEvent(new win.Event('change',{bubbles:true}));
  await until(()=>win.document.documentElement.lang==='en'&&mount.lang==='en');
  assert.equal(q('#native-officer-root'),mount);
  const theme=win.document.documentElement.dataset.theme;q('#theme-toggle').click();
  assert.notEqual(win.document.documentElement.dataset.theme,theme);
  await nav('#admin-review');await until(()=>q('#native-source-reviews'));
  q('.brand').click();await until(()=>!q('#native-officer-root'));
  assert.equal(win.location.hash,'#today');
  await nav('#admin');await until(()=>q('#native-source-reviews'));
  assert.equal(calls.filter(x=>x.path==='/api/native-login').length,1);
  assert.ok(calls.filter(x=>x.path==='/api/reviews').every(x=>x.auth==='Bearer synthetic-memory-only'));
  mod=await import('../assets/native-admin.js');assert.equal(mod.hasOfficer(),true);
 }finally{
  mod ||= await import('../assets/native-admin.js');mod.clearOfficer();
  for(const [key,descriptor]of prior)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
  dom.window.close();
 }
});
