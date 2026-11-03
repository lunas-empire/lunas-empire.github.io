import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
import {OFFICER_LANGUAGES,translateOfficerText} from '../assets/native-admin-i18n.js';

const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await tick()}assert.ok(predicate(),'UI did not settle')}
async function setup(t,role){
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 const state={aliases:[{alias:'Old <b>One</b>',normalized:'old one',origin:'historical',verified:true}],posts:[],response:null};
 globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',role,name:'Synthetic Officer'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[]});
  if(path==='/api/train-manager')return Response.json({calendar:[],counts:{}});
  if(path==='/api/members')return Response.json([{id:'member-1',name:'Current',rank:'R2',status:'active'}]);
  if(path==='/api/member/member-1')return Response.json({member:{id:'member-1',name:'Current',rank:'R2',status:'active'},stats:[],weeks:[]});
  if(path==='/api/member/member-1/aliases'){
   assert.equal(options.headers.Authorization,'Bearer synthetic-token');
   if(options.method==='POST'){
    const body=JSON.parse(options.body);state.posts.push(body);
    if(role==='R3')return Response.json({error:'Forbidden'},{status:403});
    if(state.response)return state.response(body);
    if(!state.aliases.some(row=>row.alias===body.alias))state.aliases.push({alias:body.alias,normalized:body.alias.toLowerCase(),origin:'officer',verified:true});
    return Response.json({ok:true});
   }
   return Response.json({member_id:'member-1',name:'Current',aliases:state.aliases});
  }
  throw Error('Unexpected API request '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=members]'));
 q('[data-officer-tab=members]').click();await until(()=>q('[data-native-member]'));
 q('[data-native-member]').click();await until(()=>q('[data-native-alias-count]')?.textContent==='1');
 return {dom,mount,q,state,submit:form=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}))};
}

test('R3 can read exact aliases but cannot submit even through a synthetic form',async t=>{
 const {q,state,submit}=await setup(t,'R3');
 assert.equal(q('[data-native-alias-open]'),null);
 assert.equal(q('[data-native-alias-list] li').textContent,'Old <b>One</b>');
 assert.equal(q('[data-native-alias-list] b'),null);
 const form=q('.native-member-aliases').ownerDocument.createElement('form');
 form.setAttribute('data-native-alias-form','');q('.native-member-aliases').append(form);submit(form);
 assert.match(q('[data-native-alias-status]').textContent,/R4\/R5/);
 assert.equal(state.posts.length,0);
});

for(const role of ['R4','R5'])test(`${role} confirms an exact historical name only after server success; Cancel clears draft`,async t=>{
 const {q,state,submit}=await setup(t,role);
 assert.equal(q('.native-member-aliases').open,false);
 q('.native-member-aliases').open=true;
 q('[data-native-alias-open]').click();
 let form=q('[data-native-alias-form]');
 form.elements.namedItem('alias').value='Unsaved';form.elements.namedItem('reason').value='Source screenshot';
 q('[data-native-alias-cancel]').click();
 assert.equal(form.hidden,true);assert.equal(form.elements.namedItem('alias').value,'');assert.equal(state.posts.length,0);
 q('[data-native-alias-open]').click();form=q('[data-native-alias-form]');
 const alias='Exact <img src=x onerror=alert(1)> Name';
 form.elements.namedItem('alias').value=alias;form.elements.namedItem('reason').value='Historical screenshot';
 submit(form);await tick();assert.equal(state.posts.length,0,'unchecked acknowledgement blocks writes');
 form.elements.namedItem('ack').checked=true;
 let release;state.response=body=>new Promise(resolve=>{release=()=>{state.aliases.push({alias:body.alias,normalized:'exact',origin:'officer',verified:true});resolve(Response.json({ok:true}))}});
 submit(form);await until(()=>Boolean(release));
 assert.equal(q('[data-native-alias-count]').textContent,'1','pending POST cannot display a confirmation');
 assert.equal(q('[data-native-alias-list] img'),null);
 assert.deepEqual(state.posts[0],{alias,reason:'Historical screenshot'});
 release();await until(()=>q('[data-native-alias-count]').textContent==='2');
 assert.equal(q('[data-native-alias-list] li:last-child').textContent,alias);
 assert.equal(q('[data-native-alias-list] img'),null);
 assert.equal(q('[data-native-alias-form]').hidden,true);
 assert.equal(q('[data-native-alias-status]').textContent,'Spielername bestätigt.');
});

test('409 preserves the draft; an idempotent replay updates the list once',async t=>{
 const {q,state,submit}=await setup(t,'R4');
 q('.native-member-aliases').open=true;q('[data-native-alias-open]').click();
 const form=q('[data-native-alias-form]');form.elements.namedItem('alias').value='Old <b>One</b>';
 form.elements.namedItem('reason').value='Archived screenshot';form.elements.namedItem('ack').checked=true;
 state.response=()=>Response.json({error:'Invalid alias'},{status:400});submit(form);
 await until(()=>q('[data-native-alias-status]').textContent.includes('ungültig'));
 assert.equal(q('[data-native-alias-count]').textContent,'1');
 state.response=()=>Response.json({error:'Conflict'},{status:409});submit(form);
 await until(()=>q('[data-native-alias-status]').textContent.includes('anderen Mitglied'));
 assert.equal(form.elements.namedItem('alias').value,'Old <b>One</b>');
 assert.equal(form.elements.namedItem('reason').value,'Archived screenshot');
 assert.equal(q('[data-native-alias-count]').textContent,'1');
 state.response=()=>Response.json({ok:true,replayed:true});submit(form);
 await until(()=>q('[data-native-alias-status]').textContent==='Spielername bestätigt.');
 assert.equal(q('[data-native-alias-count]').textContent,'1');
 assert.equal(q('[data-native-alias-list] li').textContent,'Old <b>One</b>');
 assert.equal(state.posts.length,3);
});

test('alias UI keys exist in every officer language',()=>{
 for(const lang of OFFICER_LANGUAGES){
  if(lang==='de')continue;
  for(const key of ['Frühere Spielernamen','+ Name bestätigen','Namen bestätigen','Spielername bestätigt.'])
   assert.notEqual(translateOfficerText(key,lang),key,`${lang}: ${key}`);
 }
});
