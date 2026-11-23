import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildActionCenter,renderActionCenter} from '../assets/officer-action-center.js';

const person=(id,name,points,extra={})=>({id,name,days:points.map((value,weekday)=>({weekday,verified:Number.isSafeInteger(value),points:Number.isSafeInteger(value)?value:null,quality:Number.isSafeInteger(value)?'observed':'inferred'})),...extra});
const week=(label,members)=>({week:label,state:'final',members});
const lowWeek=(label,id='repeat',name='Repeat')=>week(label,[person(id,name,[0,2000000,3000000,8000000,9000000,0])]);
const weeks=[
 lowWeek('2026-W46'),lowWeek('2026-W45'),
 week('2026-W44',[
  person('repeat','Repeat',[4000000,4000000,4000000,4000000,4000000,9000000]),
  person('never','Never',[4000000,4000000,4000000,4000000,0,9000000]),
  person('better','Better',[0,0,4000000,4000000,4000000,9000000]),
  {...person('former','Former',[0,0,0,0,0,0]),former:true}
 ]),
 week('2026-W43',[
  person('never','Never',[4000000,4000000,4000000,4000000,0,9000000]),
  person('better','Better',[0,0,0,4000000,4000000,9000000])
 ]),
 week('2026-W42',[
  person('never','Never',[4000000,4000000,4000000,4000000,0,9000000]),
  person('better','Better',[0,0,0,0,4000000,9000000])
 ]),
 week('2026-W41',[person('better','Better',[0,0,0,0,4000000,9000000])])
];
weeks[0].members.push(person('better','Better',[4000000,4000000,4000000,4000000,4000000,0]));
weeks[0].members.push(person('never','Never',[4000000,4000000,4000000,4000000,0,0]));
weeks[0].members.push({...person('unclear','Unclear',[0,0,4000000,4000000,4000000,0]),unknownDays:2,weekly_points_complete:false});

test('Action center reuses permanent IDs, excludes former and separates coaching, proof gaps and progress',()=>{
 const groups=buildActionCenter(weeks,{absences:[{member_id:'repeat',start_date:'2026-11-20',end_date:'2026-11-21'}]},'8');
 assert.deepEqual(new Set(groups.coaching.map(item=>item.id)),new Set(['repeat','never','better']));
 assert.equal(groups.coaching.find(item=>item.id==='repeat').lowDays,6);
 assert.equal(groups.coaching.find(item=>item.id==='repeat').absences.length,1);
 assert.equal(groups.coaching.find(item=>item.id==='never').bestMet,4);
 assert.deepEqual(groups.clarify.map(item=>item.id),['unclear']);
 assert.equal(groups.improved.find(item=>item.id==='better').metDelta,4);
 assert.ok(!JSON.stringify(groups).includes('Former'));
});

test('Action center renders evidence links and task actions without automatic sanctions',()=>{
 const html=renderActionCenter(weeks,{absences:[]},{range:'8',numberText:String});
 const dom=new JSDOM(html),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('[data-native-action-task]').length>0,true);
 assert.equal(doc.querySelector('[data-native-action-task="repeat"]').textContent,'Aufgabe');
 assert.equal(doc.querySelector('[data-native-member="unclear"]').textContent,'Belege');
 assert.match(doc.body.textContent,/Entscheidungshilfe, keine Sanktion/);
 assert.match(doc.body.textContent,/2 unbestätigte Tage/);
 assert.equal(doc.querySelectorAll('.native-action-person').length>3,true);
 assert.doesNotMatch(html,/Former|undefined/);
 dom.window.close();
});
