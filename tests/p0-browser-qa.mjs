// Run with `node tests/p0-browser-qa.mjs`. All officer API responses are synthetic.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createPublicServer} from '../scripts/serve.js';

const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lX8AAAAASUVORK5CYII=','base64');
const sha=createHash('sha256').update(image).digest('hex');
const fixture=role=>`(() => {
 const original=window.fetch.bind(window),bytes=Uint8Array.from(atob('${image.toString('base64')}'),c=>c.charCodeAt(0));
 let cases=[
  {id:'case-zero',kind:'vs_day',category:'vs_uncertain',metric:'Montag',source_name:'Synthetic Zero',source_batch:'vs/2026-W41',source_value:null,context:{date:'2026-10-05'},evidence_sha:'${sha}'},
  {id:'case-next',kind:'profile',category:'missing',metric:'power',source_name:'Synthetic Next',source_batch:'profiles/2026-10-11',source_value:null,evidence_sha:'${sha}'}];
 window.__syntheticWrites=[];
 let aliases=[{alias:'Prior & Exact',normalized:'prior & exact',origin:'historical',verified:true}];
 window.fetch=(input,options={})=>{
  const path=new URL(input,location.href).pathname;
  if(!path.startsWith('/api/'))return original(input,options);
  const json=(value,status=200)=>Promise.resolve(new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}}));
  if(path==='/api/native-login')return json({token:'synthetic-only',name:'Synthetic Officer',role:'${role}'});
  if(path==='/api/session')return json({authenticated:true,reviewWritesEnabled:true});
  if(path==='/api/overview')return json({active:2,reviews:cases.length});
  if(path==='/api/operations')return json({tasks:[],events:[],absences:[],members:[]});
  if(path==='/api/train-manager')return json({today:'2026-10-15',calendar:[],counts:{completed:1},history:[
   {date:'2026-07-17',status:'completed',linked:false,member_id:null,driver:'Synthetic Short',original_name:'Synthetic Short',revision:5}],members:[
   {id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',name:'Synthetic Confirmed',rank:'R4',status:'active'},
   {id:'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',name:'Synthetic Former',rank:'R3',status:'former'}]});
  if(path==='/api/train-dice')return json([]);
  if(path==='/api/members')return json([{id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',name:'Synthetic Confirmed',rank:'R4',status:'active'}]);
  if(path==='/api/member/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa')return json({member:{id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',name:'Synthetic Confirmed',rank:'R4',status:'active'},stats:[],weeks:[]});
  if(path==='/api/member/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa/aliases'){
   if(options.method==='POST'){
    const body=JSON.parse(options.body);window.__syntheticWrites.push({path,body});
    aliases.push({alias:body.alias,normalized:body.alias.toLowerCase(),origin:'officer',verified:true});return json({ok:true});
   }
   return json({member_id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',name:'Synthetic Confirmed',aliases});
  }
  if(path==='/api/officer-alerts')return json({});
  if(path==='/api/reviews')return json(cases);
  if(path==='/api/identity-options'||path.startsWith('/api/profile-captures'))return json([]);
  if(path.startsWith('/api/reviews/')&&path.endsWith('/evidence'))return Promise.resolve(new Response(bytes,{headers:{'Content-Type':'image/png'}}));
  if(path.startsWith('/api/reviews/')&&path.endsWith('/resolve')){
   const body=JSON.parse(options.body);window.__syntheticWrites.push({path,body});
   cases=cases.filter(item=>!path.includes(item.id));return json({ok:true,status:'approved'});
  }
  throw Error('Unexpected synthetic API request: '+path);
 };
})()`;
new Function(fixture('R4'));

async function browserQA(executable,role){
 const profile=await mkdtemp(join(tmpdir(),'luna-p0-browser-'));
 const child=spawn(executable,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
  '--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 try{
  let port;
  for(let i=0;i<120;i++){
   try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break}
   catch{await delay(100)}
  }
  assert.ok(port,`${executable}: DevTools did not start`);
  const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page=tabs.find(item=>item.type==='page');assert.ok(page);
  const socket=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
  let nextId=0;const pending=new Map();
  socket.onmessage=event=>{
   const message=JSON.parse(event.data);
   if(!message.id)return;
   const job=pending.get(message.id);if(!job)return;pending.delete(message.id);
   if(message.error)job.reject(Error(message.error.message));else job.resolve(message.result);
  };
  const send=(method,params={})=>new Promise((resolve,reject)=>{
   const id=++nextId;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
   const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
   if(result.exceptionDetails)throw Error(result.exceptionDetails.text);
   return result.result.value;
  };
  const until=async expression=>{
   for(let i=0;i<140;i++){
    const value=await evaluate(expression);if(value)return value;await delay(50);
   }
   throw Error(`${executable}: browser wait failed: ${expression}`);
  };
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:fixture(role)});
  await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/#admin`});
  await until(`Boolean(document.querySelector('#native-officer-login'))`);
  const measures=[];
  for(const width of [320,375,390,430])for(const theme of ['dark','light']){
   await send('Emulation.setDeviceMetricsOverride',{width,height:820,deviceScaleFactor:2,mobile:true});
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:theme}]});
   const result=await evaluate(`({viewport:innerWidth,scroll:document.documentElement.scrollWidth,theme:matchMedia('(prefers-color-scheme: ${theme})').matches})`);
   assert.equal(result.viewport,width);assert.equal(result.theme,true);
   assert.ok(result.scroll<=width,`${executable} ${width} ${theme}: horizontal scroll ${result.scroll}`);
   measures.push(`${width}/${theme}`);
  }
  await evaluate(`(()=>{const form=document.querySelector('#native-officer-login');form.elements.code.value='synthetic';form.requestSubmit()})()`);
  await until(`Boolean(document.querySelector('[data-officer-tab=more]'))`);
  await evaluate(`document.querySelector('[data-officer-tab=more]').click()`);
  await until(`Boolean(document.querySelector('[data-officer-tab=reviews]'))`);
  await evaluate(`document.querySelector('[data-officer-tab=reviews]').click()`);
  await until(`Boolean(document.querySelector('[data-review-id=case-zero]'))`);
  for(const width of [320,375,390,430])for(const theme of ['dark','light']){
   await send('Emulation.setDeviceMetricsOverride',{width,height:820,deviceScaleFactor:2,mobile:true});
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:theme}]});
   const scroll=await evaluate(`document.documentElement.scrollWidth`);
   assert.ok(scroll<=width,`${executable} review ${width} ${theme}: horizontal scroll ${scroll}`);
  }
  await evaluate(`document.querySelector('[data-review-id=case-zero]').open=true`);
  await until(`Boolean(document.querySelector('[data-review-id=case-zero] [data-native-review-expand]'))`);
  assert.equal(await evaluate(`document.querySelector('[data-review-id=case-zero] [data-native-review-expand]').tagName`),'BUTTON');
  await evaluate(`(()=>{window.__opened=[];window.open=(...args)=>window.__opened.push(args);document.querySelector('[data-review-id=case-zero] [data-native-review-expand]').click()})()`);
  assert.equal(await evaluate(`window.__opened.length`),1);
  assert.equal(await evaluate(`document.querySelector('[data-review-id=case-zero] [data-native-review-resolve=approve]').disabled`),false);
  assert.match(await evaluate(`document.querySelector('[data-review-id=case-zero] .native-review-source').textContent`),/2026-10-05.*unbekannt.*SHA-256/);
  await evaluate(`(()=>{const card=document.querySelector('[data-review-id=case-zero]');card.querySelector('[data-native-review-value]').value='0';card.querySelector('[data-native-review-reason]').value='Synthetic source shows a visible zero';window.confirm=()=>true;card.querySelector('[data-native-review-resolve=approve]').click()})()`);
  await until(`window.__syntheticWrites.length===1`);
  assert.equal(await evaluate(`window.__syntheticWrites[0].body.corrected_value`),0);
  await until(`Boolean(document.querySelector('[data-review-id=case-next][open]'))`);
  assert.equal(await evaluate(`document.activeElement===document.querySelector('[data-review-id=case-next] summary')`),true);
  await evaluate(`document.querySelector('[data-officer-tab=train]').click()`);
  await until(`Boolean(document.querySelector('.native-train-unlinked-dates button'))`);
  await evaluate(`document.querySelector('.native-train-unlinked-dates button').click()`);
  assert.equal(await evaluate(`document.querySelector('#native-train-save').dataset.repairDate`),'2026-07-17');
  assert.equal(await evaluate(`Boolean(document.querySelector('#native-train-save [name=driver_name]'))`),false);
  assert.equal(await evaluate(`Boolean(document.querySelector('#native-train-save option[value="bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb"]'))`),false);
  for(const width of [320,375,390,430]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:820,deviceScaleFactor:2,mobile:true});
   assert.ok(await evaluate(`document.documentElement.scrollWidth`)<=width,`${executable} train repair ${width}: horizontal scroll`);
  }
  await evaluate(`document.querySelector('[data-officer-tab=members]').click()`);
  await until(`Boolean(document.querySelector('[data-native-member]'))`);
  await evaluate(`document.querySelector('[data-native-member]').click()`);
  await until(`document.querySelector('[data-native-alias-count]')?.textContent==='1'`);
  assert.equal(await evaluate(`document.querySelector('.native-member-aliases').open`),false);
  await evaluate(`(()=>{document.querySelector('.native-member-aliases').open=true;document.querySelector('[data-native-alias-open]').click()})()`);
  for(const width of [320,375,390,430])for(const theme of ['dark','light']){
   await send('Emulation.setDeviceMetricsOverride',{width,height:820,deviceScaleFactor:2,mobile:true});
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:theme}]});
   assert.ok(await evaluate(`document.documentElement.scrollWidth`)<=width,`${executable} alias profile ${width} ${theme}: horizontal scroll`);
  }
  await evaluate(`(()=>{const form=document.querySelector('[data-native-alias-form]');form.elements.alias.value='Exact New Name';form.elements.reason.value='Historical screenshot';form.elements.ack.checked=true;form.requestSubmit()})()`);
  await until(`document.querySelector('[data-native-alias-count]')?.textContent==='2'`);
  assert.equal(await evaluate(`document.querySelector('[data-native-alias-list] li:last-child').textContent`),'Exact New Name');
  socket.close();
  return `${executable.split('\\').at(-1)} ${role}: ${measures.join(', ')}; synthetic OCR, train repair, and member aliases passed`;
 }finally{
  child.kill();await delay(250);
  await rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:200});
 }
}

const server=createPublicServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
 for(const [exe,role] of [
  ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','R4'],
  ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe','R5']]){
  console.log(await browserQA(exe,role));
 }
}finally{await new Promise(resolve=>server.close(resolve))}
