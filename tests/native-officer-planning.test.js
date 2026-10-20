import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {
 createOfficerPlanning,escapePlanningHtml,planningCopy,
 renderDesertWarRoom,renderGeneralTrial,renderImpactWarnings
} from '../assets/native-officer-planning.js';

const trialData={
 runs:[{id:'run-1',label:'<Trial & private>',trial_date:'2026-10-20',status:'completed',revision:2}],
 entries:[{id:'entry-1',run_id:'run-1',member_name:'<Player>',member_id:'member-1',trial_level:6,status:'completed',improvement:3,revision:1}],
 members:[{id:'member-1',name:'<Player>',rank:'R4'}],history:[]
};
const warData={
 rooms:[{id:'room-1',title:'<Private plan>',event_date:'2026-10-24',status:'confirming',revision:1}],
 slots:[{id:'slot-1',room_id:'room-1',member_id:'member-1',member_name:'<Member>',member_rank:'R3',squad:'reserve',position:2,assignment_role:'player',confirmation:'confirmed',revision:1}],
 members:[{id:'member-1',name:'<Member>',rank:'R3'}],history:[]
};

test('planning renderers escape all protected values and preserve x1-x9 semantics',()=>{
 const trial=renderGeneralTrial(trialData,'en'),war=renderDesertWarRoom(warData,'en');
 assert.match(trial,/x6/);assert.match(trial,/\+3/);assert.match(trial,/&lt;Player&gt;/);
 assert.doesNotMatch(trial,/<Player>|<Trial & private>/);
 assert.match(war,/Reserve/);assert.match(war,/Confirmed/);assert.match(war,/No automatic lineup/);
 assert.match(war,/&lt;Member&gt;/);assert.doesNotMatch(war,/<Member>|<Private plan>/);
 assert.equal(escapePlanningHtml('"<x>&\''),'&quot;&lt;x&gt;&amp;&#39;');
});

test('impact warnings are escaped, read-only and do not invent conflicts',()=>{
 const html=renderImpactWarnings([{member_name:'<Officer>',date:'2026-10-24',kind:'task',related_title:'<Secret>',role:'assignee'}],'en');
 assert.match(html,/READ ONLY/);assert.match(html,/Advisory only/);
 assert.match(html,/&lt;Officer&gt;/);assert.match(html,/&lt;Secret&gt;/);
 assert.doesNotMatch(html,/<Officer>|<Secret>|<button|<form/);
 assert.match(renderImpactWarnings([],'en'),/No known scheduling conflicts/);
});

test('all 15 officer languages have dedicated protected-planning guidance',()=>{
 const languages=['de','en','uk','ja','fr','it','id','ar','ko','sv','pt','nl','th','km','fil'];
 for(const language of languages){
  const copy=planningCopy(language);
  for(const key of ['planning','trialHelp','warHelp','noAuto','impact','impactHelp','noConflicts','reserve','confirmed'])
   assert.ok(copy[key]?.trim(),language+'/'+key);
  if(language!=='de')assert.notEqual(copy.trialHelp,planningCopy('de').trialHelp,language);
 }
});

test('controller denies non-officers before loading private data',async()=>{
 const dom=new JSDOM('<main id="root"></main>'),root=dom.window.document.querySelector('#root');let calls=0;
 const controller=createOfficerPlanning({root,mode:'trial',language:'en',role:'R3',request:async()=>{calls++;return trialData}});
 await controller.load();
 assert.equal(calls,0);assert.match(root.textContent,/R4\/R5 authorization required/);
 dom.window.close();
});

test('controller loads on demand and submits an audited revision payload',async t=>{
 const dom=new JSDOM('<main id="root"></main>'),root=dom.window.document.querySelector('#root');
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const previous={FormData:globalThis.FormData};globalThis.FormData=dom.window.FormData;
 t.after(()=>{globalThis.FormData=previous.FormData;dom.window.close()});
 const calls=[];
 const request=async(path,options)=>{calls.push({path,options});return path==='/api/general-trial'?trialData:{ok:true}};
 const controller=createOfficerPlanning({root,mode:'trial',language:'en',role:'R4',request});
 await controller.load();
 assert.deepEqual(calls.map(call=>call.path),['/api/general-trial']);
 root.querySelector('[data-planning-edit-entry]').click();
 const form=root.querySelector('[data-planning-save=trial-entry]');
 form.elements.namedItem('reason').value='Verified source screenshot';
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 for(let index=0;index<30&&calls.length<3;index++)await new Promise(resolve=>setTimeout(resolve,2));
 assert.equal(calls[1].path,'/api/general-trial/entries');
 assert.equal(calls[1].options.body.expected_revision,1);
 assert.equal(calls[1].options.body.trial_level,6);
 assert.equal(calls[2].path,'/api/general-trial');
});

test('planning layout has explicit responsive, focus and touch-target safeguards',()=>{
 const css=readFileSync(new URL('../assets/hub.css',import.meta.url),'utf8');
 assert.match(css,/\.native-squad-grid\{display:grid;grid-template-columns:repeat\(3/);
 assert.match(css,/@media\(max-width:700px\)[\s\S]*\.native-squad-grid\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.native-planning-table:focus-visible\{outline:3px/);
 assert.match(css,/\.native-planning-actions button,[^{]+\{min-height:44px\}/);
});

test('public HTML contains no protected planning payload or private member values',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/general-trial-root|desert-war-room-root|member_name|private_notes/);
});
