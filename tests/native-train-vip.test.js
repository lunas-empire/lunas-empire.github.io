import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer,trainTimelineGroups} from '../assets/native-admin.js';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',F='33333333-3333-4333-8333-333333333333';
const until=async p=>{for(let i=0;i<150;i++){if(p())return;await new Promise(r=>setTimeout(r,5))}assert.ok(p(),'UI did not settle')};
async function setup(t,{vip={},dice=[],error=0,readError=false,role='R4'}={}){
 const dom=new JSDOM('<html lang="de"><main id="mount"></main></html>',{url:'http://localhost/#admin'});
 const previous={window:globalThis.window,fetch:globalThis.fetch};globalThis.window=dom.window;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();Object.assign(globalThis,previous);dom.window.close()});
 const roster=[{id:A,name:'Synthetic Winner',status:'active',rank:'R3'},{id:B,name:'Synthetic VIP <safe>',status:'active',rank:'R1'},{id:F,name:'Former',status:'former',rank:'R4'}];
 const calls=[];let saved=false;
 let state={vip_member_id:null,vip_name:null,vip_revision:0,vip_status:'unknown',...vip};
 let results=dice;
 const trains=()=>({today:'2026-11-11',history:[{date:'2026-11-10',driver:'Past',status:'completed'}],calendar:['2026-11-11','2026-11-12'].map(date=>({date,...state,state:'open'})),vip_passengers:state.vip_revision?[{ride_date:'2026-11-11',...state}]:[],counts:{},members:roster.filter(m=>m.rank!=='R1')});
 globalThis.fetch=async(url,opts={})=>{
  const u=new URL(url),path=u.pathname,body=opts.body?JSON.parse(opts.body):null;calls.push({path,body,method:opts.method||'GET'});
  if(path==='/api/native-login')return Response.json({token:'synthetic',role,name:'Officer'});
  if(opts.method==='POST'){
   if(error)return Response.json({error:'Synthetic conflict or refusal'},{status:error});
   saved=true;
   if(path==='/api/train-vip'||Object.hasOwn(body,'vip_member_id')){
    const id=path==='/api/train-vip'?body.member_id:body.vip_member_id;
    state={vip_member_id:id,vip_name:roster.find(m=>m.id===id)?.name??null,vip_revision:state.vip_revision+1,vip_status:id?'selected':'unassigned'};
   }
   if(path==='/api/train-dice')results=[{ride_date:body.date,winner_id:body.winner_id,winner_name:roster.find(m=>m.id===body.winner_id)?.name,...body,revision:body.expected_revision+1,...state}];
   if(path==='/api/train-dice/delete')results=[];
   return Response.json({ok:true});
  }
  if(saved&&readError&&path==='/api/train-manager')return Response.json({error:'Readback unavailable'},{status:503});
  if(path==='/api/train-manager')return Response.json(trains());
  if(path==='/api/train-dice')return Response.json(results);
  if(path==='/api/train-vip')return Response.json({date:u.searchParams.get('date'),...state});
  if(path==='/api/train-rotation')return Response.json(null);
  if(path==='/api/members')return Response.json(roster);
  if(path==='/api/member/'+B)return Response.json({member:roster[1],vip_rides:[{ride_date:'2026-11-11',vip_member_id:B}],rides:[],dice_wins:[],stats:[],weeks:[],days:[]});
  return Response.json(path==='/api/operations'?{tasks:[],absences:[]}:{});
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';
 const submit=form=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 submit(q('form'));await until(()=>q('[data-officer-tab=train]'));q('[data-officer-tab=train]').click();await until(()=>q('#native-train-body'));
 return {q,mount,dom,calls,submit,until};
}
test('VIP-only date uses active roster including R1, explicit clear and confirmed readback',async t=>{
 const {q,calls,submit}=await setup(t);
 q('[data-native-vip-date="2026-11-11"]').click();await until(()=>q('#native-vip-save'));
 const f=q('#native-vip-save');assert.equal(f.elements.member_id.value,'');assert.ok(f.querySelector(`option[value="${B}"]`));assert.equal(f.querySelector(`option[value="${F}"]`),null);
 f.elements.member_id.value=B;submit(f);submit(f);await until(()=>/^Gespeichert/.test(q('[data-native-train-status]').textContent));
 assert.deepEqual(calls.filter(c=>c.path==='/api/train-vip'&&c.body).map(c=>c.body),[{date:'2026-11-11',member_id:B,expected_revision:0}]);
 assert.ok(calls.filter(c=>c.path==='/api/train-manager').length>=3);assert.ok(calls.filter(c=>c.path==='/api/train-dice').length>=2);
 assert.match(q('#native-train-body').textContent,/Synthetic VIP <safe>/);assert.equal(q('safe'),null);
 q('[data-native-vip-date="2026-11-11"]').click();await until(()=>q('#native-vip-save'));q('#native-vip-save').elements.member_id.value='__none';submit(q('#native-vip-save'));await until(()=>calls.some(c=>c.body?.member_id===null));
 assert.equal(calls.find(c=>c.body?.member_id===null).body.expected_revision,1);
 await until(()=>/^Gespeichert/.test(q('[data-native-train-status]').textContent));assert.match(q('#native-train-body').textContent,/explizit unbesetzt/);
});
test('Dice submits first and second place in one atomic POST; unknown VIP is omitted',async t=>{
 const {q,calls,submit}=await setup(t);q('[data-native-dice-date="2026-11-11"]').click();await until(()=>q('#native-dice-save'));
 let f=q('#native-dice-save');assert.equal(f.elements.winner_id.value,'');assert.equal(f.elements.vip_member_id.value,'');
 f.elements.winner_id.value=A;f.elements.vip_member_id.value=B;submit(f);await until(()=>/^Gespeichert/.test(q('[data-native-train-status]').textContent));
 const posts=calls.filter(c=>c.body&&c.path!=='/api/native-login');assert.equal(posts.length,1);
 assert.deepEqual(posts[0].body,{date:'2026-11-11',winner_id:A,roll_value:null,note:'',expected_revision:0,vip_member_id:B,expected_vip_revision:0});
 assert.match(q('#native-train-body').textContent,/1\. Platz.*Synthetic Winner/s);assert.match(q('#native-train-body').textContent,/2\. Platz.*Synthetic VIP/s);
});
test('missing VIP stays unknown when saving winner only; same winner and VIP rejected locally',async t=>{
 const {q,calls,submit}=await setup(t);q('[data-native-dice-date="2026-11-11"]').click();await until(()=>q('#native-dice-save'));const f=q('#native-dice-save');
 f.elements.winner_id.value=A;f.elements.vip_member_id.value=A;submit(f);assert.match(q('#native-dice-message').textContent,/verschieden/);assert.equal(calls.filter(c=>c.path==='/api/train-dice'&&c.body).length,0);
 f.elements.vip_member_id.value='';submit(f);await until(()=>calls.some(c=>c.path==='/api/train-dice'&&c.body));assert.equal(Object.hasOwn(calls.find(c=>c.path==='/api/train-dice'&&c.body).body,'vip_member_id'),false);
});
for(const error of [409,403,503])test('visible save error and no blind overwrite '+error,async t=>{
 const {q,calls,submit}=await setup(t,{error});q('[data-native-vip-date="2026-11-11"]').click();await until(()=>q('#native-vip-save'));const f=q('#native-vip-save');f.elements.member_id.value=B;submit(f);await until(()=>/Synthetic|geändert/.test(q('[data-native-train-status]').textContent));
 if(error===409){await until(()=>q('#native-vip-save')&&q('#native-vip-save')!==f);assert.ok(calls.filter(c=>c.path==='/api/train-vip'&&!c.body).length>=2);}
 assert.equal(calls.filter(c=>c.path==='/api/train-vip'&&c.body).length,1);
});
test('save receipt followed by read failure is not called unsaved and cannot repost',async t=>{
 const {q,submit}=await setup(t,{readError:true});q('[data-native-vip-date="2026-11-11"]').click();await until(()=>q('#native-vip-save'));const f=q('#native-vip-save');f.elements.member_id.value=B;submit(f);await until(()=>/Readback unavailable/.test(q('[data-native-train-status]').textContent));assert.match(q('[data-native-train-status]').textContent,/bestätigt/);assert.equal(f.querySelector('[type=submit]').disabled,true);
});
test('VIP history independent of driver and winner, name/ID/date search, cutoff and profile',async t=>{
 const v={ride_date:'2026-11-11',vip_member_id:B,vip_name:'Synthetic VIP',vip_revision:1,vip_status:'selected'};
 for(const member of ['synthetic vip',B]){const g=trainTimelineGroups({today:'2026-11-12',vipPassengers:[v,{...v,ride_date:'2026-11-10'}],member,date:'2026-11-11'});assert.equal(g.pastCount,1);assert.equal(g.past[0].kind,'vip');}
 const {q,until}=await setup(t,{vip:{vip_member_id:B,vip_name:'Synthetic VIP',vip_revision:1,vip_status:'selected'}});
 assert.equal(q('[data-native-vip-date="2026-11-10"]'),null);
 q('[data-officer-tab=members]').click();await until(()=>q(`[data-native-member="${B}"]`));q(`[data-native-member="${B}"]`).click();await until(()=>q('[data-native-profile-vip]'));
 assert.match(q('[data-native-profile-vip]').textContent,/2026-11-11/);assert.match(q('[data-native-profile-vip]').textContent,/VIP-Fahrgast/);
});

test('former VIP stays historical; date changes load their own revision; pre-cutoff Dice omits VIP',async t=>{
 const {q,dom,submit,calls}=await setup(t,{vip:{vip_member_id:F,vip_name:'Former',vip_revision:7,vip_status:'selected'}});
 q('[data-native-vip-date="2026-11-11"]').click();await until(()=>q('#native-vip-save'));
 let f=q('#native-vip-save');assert.match(f.textContent,/Former.*nicht mehr aktiv/);assert.equal(f.elements.member_id.value,'');assert.equal(f.querySelector(`option[value="${F}"]`),null);
 f.elements.date.value='2026-11-12';f.elements.date.dispatchEvent(new dom.window.Event('change',{bubbles:true}));await until(()=>q('#native-vip-save')&&q('#native-vip-save')!==f);f=q('#native-vip-save');assert.equal(f.dataset.date,'2026-11-12');assert.equal(f.dataset.revision,'7');
 q('[data-native-dice-date="2026-11-11"]').click();await until(()=>q('#native-dice-save'));f=q('#native-dice-save');f.elements.date.value='2026-11-10';f.elements.date.dispatchEvent(new dom.window.Event('change',{bubbles:true}));await until(()=>q('#native-dice-save')&&q('#native-dice-save')!==f);
 f=q('#native-dice-save');assert.equal(f.elements.vip_member_id,undefined);f.elements.winner_id.value=A;submit(f);await until(()=>calls.some(c=>c.path==='/api/train-dice'&&c.body));const payload=calls.find(c=>c.path==='/api/train-dice'&&c.body).body;assert.equal(payload.date,'2026-11-10');assert.equal(Object.hasOwn(payload,'vip_member_id'),false);
});
test('deleting Dice preserves independent VIP, posts no VIP deletion, and rereads both lists',async t=>{
 const {q,dom,calls}=await setup(t,{vip:{vip_member_id:B,vip_name:'Synthetic VIP',vip_revision:3,vip_status:'selected'},dice:[{ride_date:'2026-11-11',winner_id:A,winner_name:'Synthetic Winner',revision:2}]});
 dom.window.prompt=()=> 'Synthetic deletion reason';q('[data-native-dice-date="2026-11-11"]').click();await until(()=>q('[data-native-dice-delete]'));q('[data-native-dice-delete]').click();await until(()=>/VIP-Auswahl bleibt/.test(q('[data-native-train-status]').textContent));
 assert.deepEqual(calls.filter(c=>c.path==='/api/train-dice/delete').map(c=>c.body),[{date:'2026-11-11',expected_revision:2,reason:'Synthetic deletion reason'}]);assert.equal(calls.filter(c=>c.path==='/api/train-vip'&&c.body).length,0);assert.match(q('#native-train-body').textContent,/Synthetic VIP/);assert.match(q('#native-train-body').textContent,/1\. Platz: unbekannt/);
});
test('Dice conflict refreshes winner and VIP revisions without retrying POST',async t=>{
 const {q,calls,submit}=await setup(t,{error:409});q('[data-native-dice-date="2026-11-11"]').click();await until(()=>q('#native-dice-save'));const f=q('#native-dice-save');f.elements.winner_id.value=A;f.elements.vip_member_id.value=B;submit(f);await until(()=>q('#native-dice-save')&&q('#native-dice-save')!==f);await until(()=>/409/.test(q('[data-native-train-status]').textContent));assert.equal(calls.filter(c=>c.path==='/api/train-dice'&&c.body).length,1);assert.ok(calls.filter(c=>c.path==='/api/train-dice'&&!c.body).length>=2);
});
test('expired session reports visible error and cannot save again',async t=>{
 const {q,submit,calls}=await setup(t,{error:401});q('[data-native-vip-date="2026-11-11"]').click();await until(()=>q('#native-vip-save'));const f=q('#native-vip-save');f.elements.member_id.value=B;submit(f);await until(()=>/Sitzung abgelaufen/.test(q('[data-native-train-status]').textContent));submit(f);assert.equal(calls.filter(c=>c.path==='/api/train-vip'&&c.body).length,1);
});
test('stale VIP response cannot replace driver editor or populate after logout',async t=>{
 const {q,calls}=await setup(t);const fetch=globalThis.fetch;let release;globalThis.fetch=async(url,opts)=>{if(new URL(url).pathname==='/api/train-vip')await new Promise(r=>{release=r});return fetch(url,opts)};
 q('[data-native-vip-date="2026-11-11"]').click();await until(()=>release);q('[data-native-train="2026-11-11"]').click();release();await new Promise(r=>setTimeout(r,15));assert.ok(q('#native-train-save'));assert.equal(q('#native-vip-save'),null);
 release=null;q('[data-native-vip-date="2026-11-11"]').click();await until(()=>release);clearOfficer();release();await new Promise(r=>setTimeout(r,15));assert.equal(q('#native-vip-save'),null);assert.equal(calls.filter(c=>c.path==='/api/train-vip'&&c.body).length,0);
});
