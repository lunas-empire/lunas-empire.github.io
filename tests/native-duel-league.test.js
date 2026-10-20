import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {DUEL_DAY_WEIGHTS,createDuelLeagueController,matchPayload,normalizeDuelLeague,prepareEvidence,renderDuelLeague,sha256Hex,snapshotPayload} from '../assets/native-duel-league.js';
import {clearOfficer,initNativeAdmin,renderNativeAdmin} from '../assets/native-admin.js';

const uuid='12345678-1234-4234-8234-123456789abc';
const sample={
 day_weights:DUEL_DAY_WEIGHTS,total_weight:13,
 matches:[{id:'match-1',iso_week:'2026-W43',revision:2,cycle_label:'S38',league_round:1,
  opponent_tag_snapshot:'BAD',opponent_name_snapshot:'<img src=x onerror=alert(1)>',opponent_server_snapshot:2261,
  interim_our_wins:1,interim_opponent_wins:0,status:'live',official_result:null,confirmed_vp:1,opponent_confirmed_vp:0,
  days:DUEL_DAY_WEIGHTS.map((vp_weight,index)=>({day_index:index+1,vp_weight,our_score:index?null:123,opponent_score:null,result:index?'unknown':'win'}))}],
 leagues:[{id:'league-1',cycle_label:'S38',starts_week:'2026-W43',ends_week:'2026-W46',tier:'silver',raw_tier_label:'Silber'}],
 snapshots:[{id:'snapshot-1',league_id:'league-1',league_round:1,captured_at:'2026-10-20T12:00:00.000Z',coverage_status:'partial',rows:[
  {rank_number:1,alliance_tag:'RZSN',alliance_name:'RisingSun',server_number:2261,week1_result:'unknown',week2_result:'upcoming',week3_result:'upcoming',week4_result:'upcoming'}]}],
 evidence:[{id:uuid,evidence_kind:'match_week',scope_key:'2026-W43',image_order:1}],
 proposals:[{id:uuid,proposal_kind:'match_week',scope_key:'2026-W44',evidence_ids:[uuid],status:'pending',proposal:{
  opponent:{tag:'ZKL',name:'RESORT AND SPA',server_number:2261},interim_our_wins:1,interim_opponent_wins:0,status:'live',official_result:null,
  days:DUEL_DAY_WEIGHTS.map((vp_weight,index)=>({day_index:index+1,vp_weight,our_score:null,opponent_score:null,result:'unknown'}))}}]
};

const makeMatchForm=()=>{
 const dom=new JSDOM(renderDuelLeague(sample,'en'));
 const form=dom.window.document.querySelector('.native-dl-match-form');
 form.elements.iso_week.value='2026-W43';form.elements.revision.value='0';form.elements.reason.value='Manual correction';
 form.elements.cycle_label.value='S38';form.elements.starts_week.value='2026-W43';form.elements.ends_week.value='2026-W46';
 form.elements.tier.value='silver';form.elements.raw_tier_label.value='Silber';form.elements.league_round.value='1';
 form.elements.opponent_tag.value='ZKL';form.elements.opponent_name.value='RESORT AND SPA';form.elements.server_number.value='2261';
 form.elements.status.value='live';form.elements.interim_our_wins.value='1';form.elements.interim_opponent_wins.value='0';
 return {dom,form};
};

test('renders exact overview safely in DE and EN without a backend-pending warning',()=>{
 const data=normalizeDuelLeague(sample);
 assert.deepEqual(data.matches[0].days.map(day=>day.vp_weight),DUEL_DAY_WEIGHTS);assert.equal(data.matches[0].days[1].our_score,null);
 const de=renderDuelLeague(sample,'de');
 assert.doesNotMatch(de,/<img src=x/);assert.match(de,/&lt;img src=x onerror=alert\(1\)&gt;/);
 assert.match(de,/1:0 ist nur ein Zwischenstand/);assert.doesNotMatch(de,/Backend-Freigabe/);
 const en=renderDuelLeague(sample,'en');assert.match(en,/Historic 4-week leagues/);assert.match(en,/TextDetector/);assert.doesNotMatch(en,/Duellverlauf|Unbekannt/);
});

test('match payload uses backend keys, six exact days, null blanks, and never finalizes 1:0 live',()=>{
 const {dom,form}=makeMatchForm();form.elements.our_score_1.value='0';
 const payload=matchPayload(form,()=> 'duel-1234567890abcdef');
 assert.deepEqual(Object.keys(payload),['idempotency_key','iso_week','revision','reason','league','league_round','opponent','status','official_result','interim_our_wins','interim_opponent_wins','days']);
 assert.deepEqual(payload.league,{cycle_label:'S38',starts_week:'2026-W43',ends_week:'2026-W46',tier:'silver',raw_tier_label:'Silber'});
 assert.deepEqual(payload.opponent,{tag:'ZKL',name:'RESORT AND SPA',server_number:2261});
 assert.equal(payload.status,'live');assert.equal(payload.official_result,null);assert.equal(payload.days.length,6);
 assert.deepEqual(payload.days[0],{day_index:1,vp_weight:1,our_score:0,opponent_score:null,result:'unknown'});
 assert.equal(payload.days[5].vp_weight,4);assert.equal('own_score' in payload.days[0],false);assert.equal('server' in payload,false);
 dom.window.close();
});

test('snapshot payload matches backend contract and preserves editable four-week results',()=>{
 const dom=new JSDOM(renderDuelLeague(sample,'en'));const form=dom.window.document.querySelector('.native-dl-snapshot-form');
 form.elements.cycle_label.value='S38';form.elements.league_round.value='1';form.elements.captured_at.value='2026-10-20T12:00';
 form.elements.reason.value='Manual scroll review';form.elements.expected_rank_count.value='16';
 form.elements.rank_number.value='1';form.elements.alliance_tag.value='RZSN';form.elements.alliance_name.value='RisingSun';form.elements.server_number.value='2261';
 form.elements.week_1.value='unknown';form.elements.week_2.value='upcoming';form.elements.week_3.value='upcoming';form.elements.week_4.value='upcoming';
 const payload=snapshotPayload(form,()=> 'duel-1234567890abcdef');
 assert.deepEqual(Object.keys(payload),['idempotency_key','cycle_label','league_round','captured_at','reason','expected_rank_count','official_snapshot','official_outcome','evidence_ids','rows']);
 assert.deepEqual(payload.rows,[{rank_number:1,alliance_tag:'RZSN',alliance_name:'RisingSun',server_number:2261,week_results:['unknown','upcoming','upcoming','upcoming']}]);
 assert.match(payload.captured_at,/[zZ]|[+-]\d\d:\d\d$/);assert.equal(payload.official_snapshot,false);assert.equal(payload.official_outcome,null);dom.window.close();
});

test('SHA-256 is lowercase hex over exact bytes',async()=>{
 assert.equal(await sha256Hex(new TextEncoder().encode('abc'),webcrypto),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('oversized Safari upload uses HTML image fallback and releases its object URL and decoded image',async()=>{
 let created=0,revoked=0,cleared=0,drawn=false;
 class FakeImage{set src(value){if(!value){cleared++;return}this.naturalWidth=1200;this.naturalHeight=800;queueMicrotask(()=>this.onload())}}
 const view={Image:FakeImage,URL:{createObjectURL:()=>{created++;return 'blob:safari-fallback'},revokeObjectURL:url=>{assert.equal(url,'blob:safari-fallback');revoked++}}};
 const canvas={getContext:()=>({drawImage:()=>{drawn=true}}),toBlob:resolve=>resolve(new Blob([new Uint8Array([1,2,3])],{type:'image/jpeg'}))};
 const documentRef={defaultView:view,createElement:name=>{assert.equal(name,'canvas');return canvas}},file=new File([new Uint8Array(950001)],'large.png',{type:'image/png'});
 const prepared=await prepareEvidence(file,documentRef);
 assert.equal(prepared.reduced,true);assert.equal(prepared.filename,'large.png.downsampled.jpg');assert.equal(prepared.file.type,'image/jpeg');assert.equal(drawn,true);
 assert.equal(created,1);assert.equal(revoked,1);assert.equal(cleared,1);
});

test('proposal review fills an editable form and confirms only through saveMatch',async t=>{
 const dom=new JSDOM('<main id="root"></main>',{url:'https://example.test'});t.after(()=>dom.window.close());
 const calls=[],root=dom.window.document.querySelector('#root');
 const api={read:async()=>sample,saveMatch:async payload=>calls.push(['match',payload]),saveLeagueSnapshot:async()=>{},uploadEvidence:async()=>{},createOcrProposal:async()=>{},loadEvidence:async()=>new Blob()};
 const controller=createDuelLeagueController({root,api,language:'en',cryptoRef:webcrypto});await controller.load();
 root.querySelector('[data-native-dl-review-proposal]').click();const form=root.querySelector('.native-dl-match-form');
 assert.equal(form.elements.proposal_id.value,uuid);assert.equal(form.elements.opponent_tag.value,'ZKL');assert.equal(calls.length,0);
 form.elements.reason.value='Reviewed OCR values';form.elements.cycle_label.value='S38';form.elements.starts_week.value='2026-W43';form.elements.ends_week.value='2026-W46';form.elements.tier.value='silver';form.elements.league_round.value='1';
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(calls[0][0],'match');assert.equal(calls[0][1].proposal_id,uuid);assert.deepEqual(calls[0][1].days.map(day=>day.evidence_id),Array(6).fill(uuid));controller.destroy();
});

test('manual OCR fallback submits the exact proposal contract after evidence upload',async t=>{
 const dom=new JSDOM('<main id="root"></main>',{url:'https://example.test'});t.after(()=>dom.window.close());
 const calls=[],root=dom.window.document.querySelector('#root');
 const api={read:async()=>sample,saveMatch:async()=>{},saveLeagueSnapshot:async()=>{},loadEvidence:async()=>new Blob(),
  uploadEvidence:async payload=>{calls.push(['upload',payload]);return {evidence_id:uuid}},createOcrProposal:async payload=>calls.push(['ocr',payload])};
 const controller=createDuelLeagueController({root,api,language:'en',cryptoRef:webcrypto,textDetectorClass:null});await controller.load();
 const form=root.querySelector('.native-dl-upload-form');form.elements.scope_key.value='S38';form.elements.kind.value='league_scroll';
 form.elements.captured_at.value='2026-10-20T12:00';form.elements.ocr_text.value='1. [RZSN] RisingSun #2261 | unknown, upcoming, upcoming, upcoming';
 const image=new File([new Uint8Array([137,80,78,71,13,10,26,10,...Array(50).fill(1)])],'scroll.png',{type:'image/png'});
 Object.defineProperty(form.elements.files,'files',{configurable:true,value:[image]});form.elements.files.required=false;
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 for(let index=0;index<50&&!calls.some(call=>call[0]==='ocr');index++)await new Promise(resolve=>setTimeout(resolve,5));
 const payload=calls.find(call=>call[0]==='ocr')[1];
 assert.deepEqual(Object.keys(payload),['idempotency_key','proposal_kind','scope_key','evidence_ids','ocr_texts']);
 assert.match(payload.idempotency_key,/^duel-[0-9a-f-]{36}$/);assert.equal(payload.proposal_kind,'league_scroll');assert.equal(payload.scope_key,'S38');
 assert.deepEqual(payload.evidence_ids,[uuid]);assert.deepEqual(payload.ocr_texts,['1. [RZSN] RisingSun #2261 | unknown, upcoming, upcoming, upcoming']);controller.destroy();
});

test('mobile upload preview preserves image order, supports removal, and is accessibly described',async t=>{
 const dom=new JSDOM('<main id="root"></main>',{url:'https://example.test'});t.after(()=>dom.window.close());
 const root=dom.window.document.querySelector('#root'),api={read:async()=>sample,saveMatch:async()=>{},saveLeagueSnapshot:async()=>{},uploadEvidence:async()=>({evidence_id:uuid}),createOcrProposal:async()=>{},loadEvidence:async()=>new Blob()};
 const controller=createDuelLeagueController({root,api,language:'en',cryptoRef:webcrypto,textDetectorClass:null});await controller.load();
 const form=root.querySelector('.native-dl-upload-form'),first=new File([new Uint8Array([1])],'first.png',{type:'image/png'}),second=new File([new Uint8Array([2])],'second.jpg',{type:'image/jpeg'});
 Object.defineProperty(form.elements.files,'files',{configurable:true,value:[first,second]});form.elements.files.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 const preview=form.querySelector('[data-native-dl-upload-preview]');assert.match(preview.textContent,/first\.png.*second\.jpg/s);assert.equal(preview.querySelectorAll('li').length,2);
 assert.equal(form.elements.files.getAttribute('aria-describedby'),'native-dl-upload-help native-dl-upload-status');assert.equal(form.elements.ocr_text.getAttribute('aria-describedby'),'native-dl-ocr-help');
 preview.querySelector('[data-native-dl-remove-file="1"]').click();assert.equal(preview.querySelectorAll('li').length,1);assert.doesNotMatch(preview.textContent,/second\.jpg/);assert.equal(dom.window.document.activeElement,preview.querySelector('[data-native-dl-remove-file="0"]'));controller.destroy();
});

test('manual OCR block mismatch is rejected before any private image upload',async t=>{
 const dom=new JSDOM('<main id="root"></main>',{url:'https://example.test'});t.after(()=>dom.window.close());
 const calls=[],root=dom.window.document.querySelector('#root'),api={read:async()=>sample,saveMatch:async()=>{},saveLeagueSnapshot:async()=>{},uploadEvidence:async payload=>{calls.push(payload);return {evidence_id:uuid}},createOcrProposal:async()=>{},loadEvidence:async()=>new Blob()};
 const controller=createDuelLeagueController({root,api,language:'en',cryptoRef:webcrypto,textDetectorClass:null});await controller.load();const form=root.querySelector('.native-dl-upload-form');
 form.elements.scope_key.value='S38';form.elements.captured_at.value='2026-10-20T12:00';form.elements.ocr_text.value='only one OCR block';
 const files=[new File([new Uint8Array([1])],'one.png',{type:'image/png'}),new File([new Uint8Array([2])],'two.png',{type:'image/png'})];Object.defineProperty(form.elements.files,'files',{configurable:true,value:files});form.elements.files.required=false;
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(calls.length,0);assert.match(form.querySelector('[role=status]').textContent,/must match the number of images/);controller.destroy();
});

test('partial multi-image failure retries exact pending payload without duplicate evidence and safely retries the proposal',async t=>{
 const dom=new JSDOM('<main id="root"></main>',{url:'https://example.test'});t.after(()=>dom.window.close());
 const calls=[],proposalCalls=[],stored=new Map(),root=dom.window.document.querySelector('#root'),retrySample={...sample,evidence:[...sample.evidence,{id:'existing-league-evidence',evidence_kind:'league_scroll',scope_key:'S38',image_order:4}]};let uploadFailurePending=true,proposalFailurePending=true;
 const api={read:async()=>retrySample,saveMatch:async()=>{},saveLeagueSnapshot:async()=>{},loadEvidence:async()=>new Blob(),uploadEvidence:async payload=>{
  calls.push(payload);if(calls.length===2&&uploadFailurePending){uploadFailurePending=false;throw Error('Synthetic offline interruption')}
  if(!stored.has(payload.metadata.idempotency_key))stored.set(payload.metadata.idempotency_key,'evidence-'+stored.size);return {evidence_id:stored.get(payload.metadata.idempotency_key)};
 },createOcrProposal:async payload=>{proposalCalls.push(payload);if(proposalFailurePending){proposalFailurePending=false;throw Error('Synthetic proposal interruption')}}};
 const controller=createDuelLeagueController({root,api,language:'en',cryptoRef:webcrypto,textDetectorClass:null});await controller.load();const form=root.querySelector('.native-dl-upload-form');
 form.elements.scope_key.value='S38';form.elements.kind.value='league_scroll';form.elements.captured_at.value='2026-10-20T12:00';form.elements.ocr_text.value='first\n--- IMAGE ---\nsecond';
 const files=[new File([new Uint8Array([1])],'one.png',{type:'image/png',lastModified:1}),new File([new Uint8Array([2])],'two.png',{type:'image/png',lastModified:2})];Object.defineProperty(form.elements.files,'files',{configurable:true,value:files});form.elements.files.required=false;form.elements.files.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));for(let index=0;index<50&&calls.length<2;index++)await new Promise(resolve=>setTimeout(resolve,5));
 assert.match(form.querySelector('[role=status]').textContent,/1 of 2 images were saved.*safe to retry/s);assert.equal(form.querySelector('[type=submit]').disabled,false);
 const failedPayload=calls[1];form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));for(let index=0;index<50&&proposalCalls.length<1;index++)await new Promise(resolve=>setTimeout(resolve,5));
 assert.equal(calls.length,3,'the completed first image is not uploaded again');assert.deepEqual(calls[2],failedPayload,'the interrupted image reuses its exact file and metadata payload');
 assert.deepEqual(calls.map(call=>call.metadata.image_order),[5,6,6]);assert.equal(stored.size,2,'the server sees exactly one idempotency record per selected image');
 assert.deepEqual(proposalCalls[0].evidence_ids,['evidence-0','evidence-1']);assert.equal(form.querySelector('[type=submit]').disabled,false);
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));for(let index=0;index<50&&proposalCalls.length<2;index++)await new Promise(resolve=>setTimeout(resolve,5));
 assert.equal(calls.length,3,'proposal retry does not upload evidence again');assert.deepEqual(proposalCalls[1],proposalCalls[0],'proposal retry reuses the exact payload and idempotency key');controller.destroy();
});

test('kind, scope, and capture-time edits reset the persisted upload attempt metadata',async t=>{
 const dom=new JSDOM('<main id="root"></main>',{url:'https://example.test'});t.after(()=>dom.window.close());
 const calls=[],root=dom.window.document.querySelector('#root');let reject=true;
 const api={read:async()=>sample,saveMatch:async()=>{},saveLeagueSnapshot:async()=>{},createOcrProposal:async()=>{},loadEvidence:async()=>new Blob(),uploadEvidence:async payload=>{calls.push(payload);if(reject){reject=false;throw Error('offline')}return {evidence_id:uuid}}};
 const controller=createDuelLeagueController({root,api,language:'en',cryptoRef:webcrypto,textDetectorClass:null});await controller.load();const form=root.querySelector('.native-dl-upload-form');
 form.elements.kind.value='match_week';form.elements.scope_key.value='2026-W43';form.elements.captured_at.value='2026-10-20T12:00';
 const image=new File([new Uint8Array([1])],'proof.png',{type:'image/png',lastModified:1});Object.defineProperty(form.elements.files,'files',{configurable:true,value:[image]});form.elements.files.required=false;form.elements.files.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));for(let index=0;index<50&&calls.length<1;index++)await new Promise(resolve=>setTimeout(resolve,5));
 form.elements.kind.value='league_scroll';form.elements.scope_key.value='S39';form.elements.captured_at.value='2026-10-21T13:30';form.elements.scope_key.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));for(let index=0;index<50&&calls.length<2;index++)await new Promise(resolve=>setTimeout(resolve,5));
 assert.notEqual(calls[1].metadata.idempotency_key,calls[0].metadata.idempotency_key);assert.equal(calls[1].metadata.kind,'league_scroll');assert.equal(calls[1].metadata.scope_key,'S39');assert.equal(calls[1].metadata.image_order,1);assert.notEqual(calls[1].metadata.captured_at,calls[0].metadata.captured_at);controller.destroy();
});

test('native admin sends exact Bearer upload headers, SHA, binary body, and /image GET path',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const previousWindow=globalThis.window,previousFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};dom.window.document.documentElement.lang='en';
 t.after(()=>{clearOfficer();globalThis.window=previousWindow;globalThis.fetch=previousFetch;dom.window.close()});
 const calls=[];globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname;calls.push({path,options});
  if(path==='/api/native-login')return Response.json({token:'duel-token',name:'Officer',role:'R5'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});if(path==='/api/operations')return Response.json({tasks:[],events:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-20',history:[],calendar:[],counts:{}});if(path==='/api/duel-league')return Response.json(sample);
  if(path==='/api/duel-league/evidence')return Response.json({ok:true,evidence_id:uuid});
  if(path===`/api/duel-league/evidence/${uuid}/image`)return new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'image/png'}});
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount');
 const until=async predicate=>{for(let index=0;index<100;index++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(predicate(),'render timeout: '+mount.textContent)};
 initNativeAdmin(mount);await renderNativeAdmin(mount);mount.querySelector('[name=code]').value='code';
 mount.querySelector('#native-officer-login').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await until(()=>mount.querySelector('[data-officer-tab=vs]'));
 mount.querySelector('[data-officer-tab=vs]').click();await until(()=>mount.querySelector('[data-officer-tab=duelLeague]'));mount.querySelector('[data-officer-tab=duelLeague]').click();await until(()=>mount.querySelector('.native-dl-upload-form'));
 const upload=mount.querySelector('.native-dl-upload-form');upload.elements.scope_key.value='2026-W44';upload.elements.captured_at.value='2026-10-20T12:00';
 const bytes=new Uint8Array([137,80,78,71,13,10,26,10,...Array(50).fill(1)]);const image=new File([bytes],'proof one.png',{type:'image/png'});
 Object.defineProperty(upload.elements.files,'files',{configurable:true,value:[image]});upload.elements.files.required=false;
 upload.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await until(()=>calls.some(call=>call.path==='/api/duel-league/evidence'));
 const evidenceCall=calls.find(call=>call.path==='/api/duel-league/evidence');
 assert.equal(evidenceCall.options.credentials,'omit');assert.equal(evidenceCall.options.headers.Authorization,'Bearer duel-token');
 assert.equal(evidenceCall.options.headers['Content-Type'],'image/png');assert.equal(evidenceCall.options.headers['X-Duel-Filename'],'proof%20one.png');
 assert.equal(evidenceCall.options.headers['X-Duel-Kind'],'match_week');assert.equal(evidenceCall.options.headers['X-Duel-Scope'],'2026-W44');
 assert.equal(evidenceCall.options.headers['X-Duel-Order'],'1');assert.match(evidenceCall.options.headers['X-Duel-Captured-At'],/[zZ]|[+-]\d\d:\d\d$/);
 assert.match(evidenceCall.options.headers['X-Duel-SHA256'],/^[a-f0-9]{64}$/);assert.equal(evidenceCall.options.body,image);
 mount.querySelector(`[data-native-dl-evidence="${uuid}"]`).click();await until(()=>calls.some(call=>call.path.endsWith('/image')));
 assert.equal(calls.find(call=>call.path.endsWith('/image')).path,`/api/duel-league/evidence/${uuid}/image`);
});
