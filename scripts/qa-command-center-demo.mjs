// Headless Chrome smoke test for public, synthetic staging Command Center.
// Keeps browser profile and optional screenshots outside the publish repository.
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const qa=path.join(root,'command-center','.private','qa','staging-demo-chrome');
await mkdir(qa,{recursive:true});
const chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port=49577;
const browser=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
 '--remote-debugging-port='+port,'--remote-allow-origins=*','--user-data-dir='+qa,'about:blank'],{windowsHide:true,stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const pending=new Map();let index=0;let socket;const errors=[];
async function target(){
 for(let i=0;i<65;i++){
  try{const r=await fetch('http://127.0.0.1:'+port+'/json/list');const list=await r.json();const p=list.find(x=>x.type==='page');if(p)return p}catch{}
  await sleep(180);
 }
 throw Error('Chrome did not start');
}
function send(method,params={}){
 return new Promise((resolve,reject)=>{
  const id=++index;pending.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function evalJs(expression){
 const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(r.result?.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));
 return r.result?.result?.value;
}
try{
 const t=await target();
 socket=new WebSocket(t.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 socket.addEventListener('message',e=>{
  const m=JSON.parse(e.data);
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails?.text||'Exception');
  if(!m.id)return;const p=pending.get(m.id);if(!p)return;pending.delete(m.id);
  if(m.error)p.reject(Error(m.error.message));else p.resolve(m);
 });
 await send('Page.enable');await send('Runtime.enable');
 for(const width of [320,390,1365]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:820,deviceScaleFactor:1,mobile:width<600});
  await send('Page.navigate',{url:'http://127.0.0.1:49383/command-center/'});
  await sleep(1200);
  const active=await evalJs("document.querySelector('#active').textContent.trim()");
  if(active!=='14')throw Error('Demo overview not rendered: '+active+' at '+width);
  const wide=await evalJs('document.documentElement.scrollWidth');
  if(wide>width+2)throw Error('Horizontal overflow '+wide+' at '+width);
  await evalJs("document.querySelector('[data-tab=members]').click()");
  await sleep(250);
  const members=await evalJs("document.querySelectorAll('#member-rows tr').length");
  if(members!==14)throw Error('Member table incomplete: '+members);
  await evalJs("document.querySelector('#member-search').value='Orion';document.querySelector('#member-search').dispatchEvent(new Event('input',{bubbles:true}))");
  await sleep(250);
  const filtered=await evalJs("document.querySelectorAll('#member-rows tr').length");
  if(filtered!==1)throw Error('Search failed '+filtered);
  await evalJs("document.querySelector('[data-tab=review]').click()");
  await sleep(200);
  const reviewCount=await evalJs("document.querySelectorAll('[data-review]').length");
  if(reviewCount!==5)throw Error('OCR review cards missing: '+reviewCount);
  const writeButtons=await evalJs("document.querySelectorAll('[data-action=approve]').length");
  if(writeButtons!==0)throw Error('Demo accidentally exposes write controls');
  await evalJs("document.querySelector('[data-tab=train]').click()");
  await sleep(150);
  const trains=await evalJs("document.querySelectorAll('#train-list .mini').length");
  if(trains!==7)throw Error('Train history missing '+trains);
  console.log('BROWSER QA PASSED',width+'px', 'members',members,'reviews',reviewCount,'trains',trains);
 }
 if(errors.length)throw Error('Browser exceptions: '+errors.join(' | '));
 console.log('All demo pages functional; no horizontal overflow and no write controls.');
}finally{
 try{socket?.close()}catch{}
 browser.kill();
}
