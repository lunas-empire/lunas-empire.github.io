import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {membershipWatchSummary,initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
async function openMore(mount) {
 for(let i=0;i<160;i++){
  const more=mount.querySelector('[data-officer-tab=more]');
  if(more){more.click();return}
  await new Promise(resolve=>setTimeout(resolve,6));
 }
 throw Error('More page did not become available');
}


const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const fresh=()=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 dom.window.confirm=()=>true;
 const previous={window:globalThis.window,fetch:globalThis.fetch,FormData:globalThis.FormData};
 globalThis.window=dom.window;globalThis.FormData=dom.window.FormData;
 return {dom,mount:dom.window.document.querySelector('#mount'),close(){
  clearOfficer();globalThis.window=previous.window;globalThis.fetch=previous.fetch;
  globalThis.FormData=previous.FormData;dom.window.close();
 }};
};
const until=async check=>{
 for(let i=0;i<130;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,6))}
 assert.ok(check(),'UI did not settle');
};
const mockWatch={
 state:'review_candidates',profile:{current:{captured_at:'2026-10-13T10:00:00Z'}},
 vs:{current:{week:'2026-W41'}},
 candidates:[{id,name:'Synthetic Member',rank:'R3',priority:'cross_source',
  missing_profile:true,missing_vs:true,last_seen:'2026-10-10',blacklisted:false,action:'review_only'}]
};
const relation={id:'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',server:2261,tag:'ALLY',name:'Synthetic Alliance',
 stance:'ally',war_support:'assist',attack_policy:'no_attack',verification:'confirmed',
 notes:'Synthetic note',active:1,revision:1,updated_at:'2026-10-13T12:00:00Z'};
function mockFetch({notEnabled=false,conflict=false}={}){
 const writes=[];
 globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Synthetic Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-13',calendar:[],history:[],counts:{}});
  if(path==='/api/members')return Response.json([{id,name:'Synthetic Member',rank:'R3'}]);
  if(path==='/api/member/'+id)return Response.json({member:{id,name:'Synthetic Member',rank:'R3',status:'active',state_source:'import'},stats:[],weeks:[]});
  if(path==='/api/member-registry')return Response.json({members:[
   {id,name:'Synthetic Member',rank:'R3',lifecycle:'active',blacklisted:false,reason:'',revision:'b'.repeat(64)}
  ],counts:{active:1,former:0,blacklisted:0}});
  if(path==='/api/membership-watch')return notEnabled?Response.json({error:'Not found'},{status:404}):Response.json(mockWatch);
  if(path==='/api/diplomacy'){
   if(notEnabled)return Response.json({error:'Not found'},{status:404});
   if(options.method==='POST'){
    const body=JSON.parse(options.body);writes.push(body);
    if(conflict)return Response.json({error:'Stale entry'},{status:409});
    return Response.json({ok:true,id:relation.id,revision:2});
   }
   return Response.json({relations:[relation]});
  }
  throw Error('Unexpected '+path);
 };
 return writes;
}
async function login(mount,dom){
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 const form=mount.querySelector('#native-officer-login');
 form.elements.namedItem('code').value='synthetic';
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>mount.querySelector('[data-officer-tab=members]'));
}
test('Passively missing screenshots never blacklist or archive members',async t=>{
 const ctx=fresh();t.after(()=>ctx.close());const writes=mockFetch();
 await login(ctx.mount,ctx.dom);
 ctx.mount.querySelector('[data-officer-tab=members]').click();
 await openMore(ctx.mount);
 await until(()=>ctx.mount.querySelector('[data-officer-tab=watch]'));
 await openMore(ctx.mount);
 ctx.mount.querySelector('[data-officer-tab=watch]').click();
 await until(()=>ctx.mount.querySelector('[data-native-watch-person]'));
 const text=ctx.mount.querySelector('#native-watch-list').textContent;
 assert.match(text,/Kein automatischer Austritt/);
 assert.match(text,/Neue Stärke-Aufnahme: nicht enthalten/);
 assert.match(text,/Neue VS-Aufnahme: nicht enthalten/);
 assert.equal(writes.length,0);
 ctx.mount.querySelector('[data-native-watch-person]').click();
 await until(()=>ctx.mount.querySelector('[data-native-manage]'));
 ctx.mount.querySelector('[data-native-manage]').click();
 await until(()=>ctx.mount.querySelector('#registry-save'));
 assert.equal(ctx.mount.querySelector('#registry-save [name=blacklisted]').checked,false);
 assert.equal(ctx.mount.querySelector('#registry-save [name=lifecycle]').value,'active');
 assert.equal(writes.length,0);
 await openMore(ctx.mount);
 ctx.mount.querySelector('[data-officer-tab=registry]').click();
 await until(()=>ctx.mount.querySelector('[data-native-registry-filter=blacklist]'));
 ctx.mount.querySelector('[data-native-registry-filter=blacklist]').click();
 await until(()=>ctx.mount.querySelector('[data-native-registry-filter=blacklist]')?.getAttribute('aria-pressed')==='true');
 assert.equal(ctx.mount.querySelectorAll('[data-registry-edit]').length,0);
 ctx.mount.querySelector('[data-native-registry-filter=active]').click();
 assert.equal(ctx.mount.querySelectorAll('[data-registry-edit]').length,1);
});
test('Diplomacy edits preserve alliance relation, separate war help and verified source',async t=>{
 const ctx=fresh();t.after(()=>ctx.close());const writes=mockFetch();
 await login(ctx.mount,ctx.dom);
 await openMore(ctx.mount);
 ctx.mount.querySelector('[data-officer-tab=diplomacy]').click();
 await until(()=>ctx.mount.querySelector('[data-native-diplomacy-edit]'));
 const item=ctx.mount.querySelector('[data-native-diplomacy-edit]');
 assert.match(item.textContent,/Wir helfen/);
 assert.match(item.textContent,/Nicht angreifen/);
 item.click();
 await until(()=>ctx.mount.querySelector('#native-diplomacy-save'));
 const form=ctx.mount.querySelector('#native-diplomacy-save');
 form.elements.namedItem('war_support').value='none';
 form.elements.namedItem('reason').value='Synthetic agreement changed in officer meeting';
 form.dispatchEvent(new ctx.dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>writes.length===1);
 assert.equal(writes[0].id,relation.id);
 assert.equal(writes[0].revision,1);
 assert.equal(writes[0].stance,'ally');
 assert.equal(writes[0].war_support,'none');
 assert.equal(writes[0].attack_policy,'no_attack');
 assert.equal(writes[0].active,true);
 assert.ok(!Object.hasOwn(writes[0],'actor'),'Actor must come from the session');
 await until(()=>ctx.mount.querySelector('.native-confirmed'));
});
test('Diplomacy conflicts keep unsaved text and require explicit reload',async t=>{
 const ctx=fresh();t.after(()=>ctx.close());const writes=mockFetch({conflict:true});
 await login(ctx.mount,ctx.dom);
 await openMore(ctx.mount);
 ctx.mount.querySelector('[data-officer-tab=diplomacy]').click();
 await until(()=>ctx.mount.querySelector('[data-native-diplomacy-edit]'));
 ctx.mount.querySelector('[data-native-diplomacy-edit]').click();
 await until(()=>ctx.mount.querySelector('#native-diplomacy-save'));
 const form=ctx.mount.querySelector('#native-diplomacy-save');
 form.elements.namedItem('notes').value='Unsent synthetic note';
 form.elements.namedItem('reason').value='Synthetic followup to agreement notes';
 form.dispatchEvent(new ctx.dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>form.dataset.conflict==='1');
 assert.equal(form.elements.namedItem('notes').value,'Unsent synthetic note');
 assert.equal(form.querySelector('[type=submit]').disabled,true);
 assert.equal(form.querySelector('[data-native-diplomacy-reload]').hidden,false);
 assert.equal(writes.length,1);
});
test('New Cloudflare endpoints fail closed while existing registry stays reachable',async t=>{
 const ctx=fresh();t.after(()=>ctx.close());mockFetch({notEnabled:true});
 await login(ctx.mount,ctx.dom);
 ctx.mount.querySelector('[data-officer-tab=members]').click();
 await openMore(ctx.mount);
 await until(()=>ctx.mount.querySelector('[data-officer-tab=watch]'));
 await openMore(ctx.mount);
 ctx.mount.querySelector('[data-officer-tab=watch]').click();
 await until(()=>ctx.mount.querySelector('#native-watch-list')?.textContent.includes('erst nach dem geschützten'));
 await openMore(ctx.mount);
 ctx.mount.querySelector('[data-officer-tab=diplomacy]').click();
 await until(()=>ctx.mount.querySelector('#native-diplomacy-list')?.textContent.includes('noch nicht aktiviert'));
 assert.equal(ctx.mount.querySelector('[data-native-diplomacy-new]').disabled,true);
 ctx.mount.querySelector('[data-officer-tab=members]').click();
 await until(()=>ctx.mount.querySelector('[data-native-member]'));
});
test('Summary groups evidence alerts without creating a punishment score',()=>{
 assert.deepEqual(membershipWatchSummary(mockWatch),{count:1,both:1,profile:1,vs:1});
 assert.deepEqual(membershipWatchSummary(null),{count:0,both:0,profile:0,vs:0});
});
