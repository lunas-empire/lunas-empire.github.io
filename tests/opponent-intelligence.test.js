import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {OPPONENT_LANGUAGES,OPPONENT_KEYS,OPPONENT_COPY,opponentCopy} from '../assets/opponent-intelligence-i18n.js';
import {renderOpponentIntelligence,createOpponentIntelligenceController} from '../assets/opponent-intelligence.js';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
const wait=async condition=>{for(let i=0;i<250;i++){if(condition())return;await new Promise(resolve=>setTimeout(resolve,7))}assert.ok(condition())};
const side=(median,verified)=>({median,verified,p25:median,p75:median,min:0,max:median});
const selected={id:'opponent-lw-'+'a'.repeat(64),sha256:'a'.repeat(64),match_id:'match',iso_week:'2026-W47',report_date:'2026-11-21',row_count:2,alliance_tag:'TEST',alliance_name:'Synthetic Opponent',server_number:9999};
const previous={...selected,id:'opponent-lw-'+'b'.repeat(64),report_date:'2026-11-16'};
const data={matches:[{id:'match',iso_week:'2026-W47',alliance_tag:'TEST',alliance_name:'Synthetic Opponent',server_number:9999}],snapshots:[selected,previous],selected,ownBatch:{report_date:'2026-11-15'},opponentRows:[{source_row:1,source_name:'Synthetic Zero',source_rank:'R1',values:{power:0,'T1 type':'Tank'}},{source_row:2,source_name:'Synthetic High',source_rank:'R4',values:{power:200,'T1 type':'Aircraft'}}],comparison:{metrics:{power:{own:side(100,1),opponent:side(100,2)},drone:{own:side(null,0),opponent:side(null,0)}}}};
test('All opponent UI languages have complete non-empty dictionaries',()=>{
 assert.equal(OPPONENT_LANGUAGES.length,15);
 for(const language of OPPONENT_LANGUAGES){const copy=OPPONENT_COPY[language];assert.ok(copy);for(const key of OPPONENT_KEYS){assert.equal(typeof copy[key],'string');assert.ok(copy[key].trim(),language+' '+key)}assert.equal(opponentCopy(language).title,copy.title)}
});
test('Opponent rendering preserves zero, hides missing values and contains no coordinates or prediction',()=>{
 const html=renderOpponentIntelligence(data,{language:'en',metric:'power'});
 assert.match(html,/Synthetic Opponent/);assert.match(html,/Measurable differences only/);assert.match(html,/100/);assert.match(html,/2026-11-15/);
 assert.match(html,/Own snapshot/);assert.match(html,/Opponent development/);assert.doesNotMatch(html,/Coords|1:2|win probability|LWMap/i);
 const empty=renderOpponentIntelligence({matches:data.matches,snapshots:[],selected:null},{language:'en'});assert.match(empty,/One import is enough/);
 const other={...data.matches[0],id:'other-match',iso_week:'2026-W48',alliance_tag:'NEXT'};
 const emptyWeek=renderOpponentIntelligence({matches:[other],snapshots:[],selected:null},{language:'en',allMatches:[data.matches[0],other]});
 assert.match(emptyWeek,/name="match_id" value="other-match"/);assert.doesNotMatch(emptyWeek,/name="match_id" value="match"/);
});
test('Controller loads history, uploads confirmed raw CSV and selects another metric',async t=>{
 const dom=new JSDOM('<main id="root"></main>',{url:'https://lunas-empire.github.io/#admin'});t.after(()=>dom.window.close());
 let upload=null,reads=[],result={...data,reused:false};
 const controller=createOpponentIntelligenceController({root:dom.window.document.querySelector('main'),language:'en',api:{
  read:async params=>{reads.push(params);return data},
  upload:async(bytes,params)=>{upload={bytes,params};return result},
  original:async()=>({bytes:new TextEncoder().encode('synthetic').buffer,sha256:''})
 }});
 await controller.load();const root=dom.window.document.querySelector('main'),form=root.querySelector('[data-native-opponent-upload]');
 assert.ok(form);form.elements.report_date.value='2026-11-21';form.elements.confirmed.checked=true;
 const bytes=new TextEncoder().encode('synthetic').buffer;Object.defineProperty(form.elements.csv,'files',{value:[{size:bytes.byteLength,arrayBuffer:async()=>bytes}]});
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>upload);
 assert.equal(upload.bytes,bytes);assert.equal(upload.params.matchId,'match');assert.equal(upload.params.reportDate,'2026-11-21');assert.equal(upload.params.confirmed,true);
 assert.equal(reads.at(-1).snapshot,selected.id);
 await wait(()=>root.querySelector('[data-native-opponent-status]').textContent.includes('saved and read back'));
 root.querySelector('[data-native-opponent-metric]').value='drone';root.querySelector('[data-native-opponent-metric]').dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.match(root.querySelector('.native-opponent-table caption').textContent,/Drone/);
 root.querySelector('[data-native-opponent-previous]').value=previous.id;root.querySelector('[data-native-opponent-previous]').dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 await wait(()=>reads.some(params=>params.previous===previous.id));
 assert.equal(dom.window.localStorage.length,0);assert.equal(dom.window.sessionStorage.length,0);
});
test('Native admin opens VS opponent panel with authenticated read-only API',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'}),oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 let opponentReads=0;
 globalThis.fetch=async(url,options={})=>{
  const parsed=new URL(url),path=parsed.pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Synthetic R4',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{}});
  if(path==='/api/opponent-intelligence'){opponentReads++;assert.equal(options.headers.Authorization,'Bearer synthetic-token');assert.equal(options.credentials,'omit');return Response.json(data)}
  throw Error('Unexpected route '+path);
 };
 const mount=dom.window.document.querySelector('#mount');initNativeAdmin(mount);await renderNativeAdmin(mount);
 mount.querySelector('[name=code]').value='synthetic';mount.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>mount.querySelector('[data-officer-tab=vs]'));mount.querySelector('[data-officer-tab=vs]').click();await wait(()=>mount.querySelector('[data-officer-tab=opponentIntel]'));
 mount.querySelector('[data-officer-tab=opponentIntel]').click();await wait(()=>mount.querySelector('.native-opponent-intel'));
 assert.equal(opponentReads,1);assert.match(mount.textContent,/VS-Gegner/);assert.equal(mount.querySelector('iframe'),null);
});


test('Top-N lists expose own and opponent LW details and direct player comparison',async t=>{
 const rows=side=>Array.from({length:60},(_,index)=>({source_row:index+1,source_name:side+' '+(index+1),source_rank:index%2?'R4':'R1',values:{power:index+1,drone:100+index,hq:30,vip:7,'T1 type':index%2?'Aircraft':'Tank','T1 heroes':'Hero '+(index+1),Shield:index%2?'1h':null}}));
 const rich={...data,ownRows:rows('Own'),opponentRows:rows('Opponent')};
 const html=renderOpponentIntelligence(rich,{language:'en',metric:'power',limit:'15'});
 const dom=new JSDOM(html);t.after(()=>dom.window.close());
 assert.deepEqual([...dom.window.document.querySelectorAll('[data-native-opponent-limit] option')].map(node=>node.value),['10','15','20','30','50','all']);
 assert.equal(dom.window.document.querySelectorAll('.native-opponent-player-columns>section')[0].querySelectorAll('.native-opponent-player').length,15);
 assert.equal(dom.window.document.querySelectorAll('.native-opponent-player-columns>section')[1].querySelectorAll('.native-opponent-player').length,15);
 assert.match(html,/Hero 60/);assert.match(html,/Total Troops/);assert.match(html,/T1 Power/);assert.match(html,/VIP/);
 const live=new JSDOM('<main id="root"></main>',{url:'https://lunas-empire.github.io/#admin'});t.after(()=>live.window.close());
 live.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const root=live.window.document.querySelector('#root'),controller=createOpponentIntelligenceController({root,language:'en',api:{read:async()=>rich}});
 await controller.load();const first=root.querySelector('.native-opponent-player-columns>section:last-child .native-opponent-player');
 first.querySelector('summary').click();assert.equal(first.open,true);
 first.querySelector('[data-native-opponent-compare]').click();
 const comparison=root.querySelector('#native-opponent-person-comparison');assert.ok(comparison);
 assert.match(comparison.textContent,/Own 60/);assert.match(comparison.textContent,/Opponent 60/);
 const ownSelect=comparison.querySelector('[data-native-opponent-compare-own]');ownSelect.value='1';ownSelect.dispatchEvent(new live.window.Event('change',{bubbles:true}));
 assert.match(root.querySelector('#native-opponent-person-comparison').textContent,/Own 1/);
 const limit=root.querySelector('[data-native-opponent-limit]');limit.value='all';limit.dispatchEvent(new live.window.Event('change',{bubbles:true}));
 assert.equal(root.querySelectorAll('.native-opponent-player-columns>section')[0].querySelectorAll('.native-opponent-player').length,60);
 assert.equal(live.window.localStorage.length,0);assert.equal(live.window.sessionStorage.length,0);
});
