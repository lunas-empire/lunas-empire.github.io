import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {ALLIANCE_ANALYSIS_COPY,ALLIANCE_ANALYSIS_KEYS,ALLIANCE_ANALYSIS_LANGUAGES} from '../assets/alliance-analysis-i18n.js';
import {renderAllianceAnalysis,createAllianceAnalysisController} from '../assets/alliance-analysis.js';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const selected={id:'alliance-lw-'+'a'.repeat(64),request_id:'request-a',opponent_id:'a',alliance_tag:'AAA',alliance_name:'Alliance A',server_number:1001,report_date:'2026-11-23',row_count:1};
const other={...selected,id:'alliance-lw-'+'b'.repeat(64),opponent_id:'b',alliance_tag:'BBB',alliance_name:'Alliance B',server_number:1002};
const row=(name,power,hero)=>({source_row:1,source_name:name,source_rank:'R4',values:{power,hero_power:hero,drone:100,kills:0,'T1 type':'Tank','T1 heroes':'Kimberly'}});
const data={siteOwner:true,requests:[{id:'request-a',status:'pending',alliance_tag:'AAA',alliance_name:'Alliance A',server_number:1001,requested_by_name:'Officer',requested_at:'2026-11-23'}],snapshots:[selected,other],alliances:[],selected,rows:[row('Player A',100,200)],comparisonRows:[row('Player B',300,400)],comparison:{snapshot:other,comparison:{metrics:{power:{own:{median:100,verified:1},opponent:{median:300,verified:1}}}}},evolution:null};

test('Alliance analysis dictionaries are complete in all existing languages',()=>{
 for(const language of ALLIANCE_ANALYSIS_LANGUAGES){const copy=ALLIANCE_ANALYSIS_COPY[language];for(const key of ALLIANCE_ANALYSIS_KEYS)assert.ok(copy[key]?.trim(),language+' '+key)}
});

test('Alliance A/B archive, Top-N, Hero Power and manual notice render with owner-only upload',()=>{
 const html=renderAllianceAnalysis(data,{language:'en',metric:'power',limit:'15'});
 assert.match(html,/Alliance A/);assert.match(html,/Alliance B/);assert.match(html,/up to 24 hours/);assert.match(html,/data-alliance-upload/);assert.match(html,/Hero Power/);assert.match(html,/data-alliance-limit/);
 const dom=new JSDOM(html);assert.equal(dom.window.document.querySelectorAll('.native-opponent-player').length,2);dom.window.close();
 const officerView=renderAllianceAnalysis({...data,siteOwner:false},{language:'de'});assert.doesNotMatch(officerView,/data-alliance-upload/);assert.match(officerView,/data-alliance-request/);
});

test('Controller submits a new request and opens direct A/B player comparison',async t=>{
 const dom=new JSDOM('<main id="root"></main>',{url:'https://lunas-empire.github.io/#admin'});t.after(()=>dom.window.close());
 const root=dom.window.document.querySelector('#root');let requested=null;
 const controller=createAllianceAnalysisController({root,language:'en',api:{read:async()=>data,request:async body=>{requested=body;return{...data,selected:null}},upload:async()=>data}});
 await controller.load();const form=root.querySelector('[data-alliance-request]');
 form.elements.server_number.value='9999';form.elements.alliance_tag.value='TEST';form.elements.alliance_name.value='Synthetic';
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(requested.server_number,9999);assert.equal(requested.alliance_tag,'TEST');assert.match(requested.idempotency_key,/^[a-f0-9]{64}$/);
 root.querySelector('[data-native-opponent-compare]').click();
 assert.ok(root.querySelector('#native-opponent-person-comparison'));
 assert.match(root.querySelector('#native-opponent-person-comparison').textContent,/Player A/);assert.match(root.querySelector('#native-opponent-person-comparison').textContent,/Player B/);
});


test('Native admin opens alliance analysis with authenticated read-only API',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'}),oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 let reads=0;
 globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname,data={
   '/api/native-login':{token:'synthetic-token',name:'Synthetic R4',role:'R4'},
   '/api/overview':{active:1,reviews:0},'/api/operations':{tasks:[]},'/api/train-manager':{counts:{}},
   '/api/alliance-analysis':{siteOwner:false,requests:[],snapshots:[],alliances:[],selected:null,rows:[],comparisonRows:[]}
  };
  if(path==='/api/alliance-analysis'){reads++;assert.equal(options.headers.Authorization,'Bearer synthetic-token');assert.equal(options.credentials,'omit')}
  if(!Object.hasOwn(data,path))throw Error('Unexpected route '+path);
  return Response.json(data[path]);
 };
 const mount=dom.window.document.querySelector('#mount');initNativeAdmin(mount);await renderNativeAdmin(mount);
 mount.querySelector('[name=code]').value='synthetic';mount.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 for(let i=0;i<120&&!mount.querySelector('[data-officer-tab=vs]');i++)await new Promise(r=>setTimeout(r,5));
 mount.querySelector('[data-officer-tab=vs]').click();
 for(let i=0;i<120&&!mount.querySelector('[data-officer-tab=allianceAnalysis]');i++)await new Promise(r=>setTimeout(r,5));
 mount.querySelector('[data-officer-tab=allianceAnalysis]').click();
 for(let i=0;i<120&&!mount.querySelector('.native-alliance-analysis');i++)await new Promise(r=>setTimeout(r,5));
 assert.equal(reads,1);assert.match(mount.textContent,/Allianz-Analyser/);assert.equal(mount.querySelector('iframe'),null);
});
