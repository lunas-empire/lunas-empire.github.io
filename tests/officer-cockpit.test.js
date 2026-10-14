import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOfficerActions} from '../assets/officer-cockpit.js';
const day='2026-10-14';
const action=options=>buildOfficerActions({today:day,...options});
test('Officer cockpit shows only actionable work, at most five, and no invented warnings',()=>{
 assert.deepEqual(action({summary:{reviews:0},operations:{tasks:[],events:[],absences:[]},trains:{calendar:[]}}),[]);
 const options={
  summary:{reviews:3},operations:{
   tasks:[{status:'open',due_date:day},{status:'done',due_date:day}],
   absences:[{start_date:'2026-10-12',end_date:'2026-10-17',substitute_id:null}],
   events:[{event_date:'2026-10-15',event_type:'zombie_siege',outcome:'scheduled',lead_id:null}]
  },trains:{calendar:[{date:day,type:'R4',entry:null}]},
  vs:{weeks:[{week:'2026-W41',state:'final',members:[
   {repeatedLowDays:true,failed:4},{repeatedLowDays:false,failed:1}]}]},
  donations:{weeks:[{week:'2026-W41',is_complete:true,members:[{status:'below',points:19000}]}]}
 };
 const tasks=action(options);
 assert.equal(tasks.length,5);
 assert.equal(tasks[0].action,'review-open');
 assert.deepEqual(tasks.map(t=>t.action),['review-open','tasks-open','absences-open','train-today','vs-open']);
 assert.equal(new Set(tasks.map(t=>t.action)).size,5);
});
test('Unknown, historical and incomplete measurements cannot generate a compliance alert',()=>{
 const options={vs:{weeks:[{state:'preliminary',week:'2026-W41',members:[{repeatedLowDays:true,failed:4}]},
   {state:'final',week:'2026-W40',members:[{repeatedLowDays:true,failed:4}]}]},
 donations:{weeks:[{week:'2026-W41',is_complete:false,members:[{status:'below',points:1234}]}]}};
 assert.deepEqual(action(options),[]);
 assert.deepEqual(action({vs:{weeks:[{state:'final',week:'2026-W41',
    members:[{failed:0,unknown:6,status:'unverified',repeatedLowDays:false}]}]}}),[]);
});
test('Finished actions vanish and a planned ride is not claimed as completed',()=>{
 const operations={tasks:[{status:'done',due_date:day}],absences:[{start_date:day,end_date:day,substitute_id:'officer'}],
   events:[{event_date:day,lead_id:'officer',outcome:'scheduled'}]};
 assert.deepEqual(action({summary:{reviews:0},operations,trains:{calendar:[{date:day,entry:{status:'completed',linked:true}}]}}),[]);
 const planned=action({operations,trains:{calendar:[{date:day,type:'Members Day',entry:{status:'planned',linked:true}}]}});
 assert.equal(planned.length,1);
 assert.equal(planned[0].action,'train-today');
 assert.equal(planned[0].detail,'Geplant');
});
test('Only verified final-week donation values create a specific linked warning',()=>{
 const found=action({donations:{weeks:[{week:'2026-W41',is_complete:true,members:[
  {status:'below',points:17000},{status:'unknown',points:null},{status:'met',points:20000}
 ]}]}});
 assert.equal(found.length,1);
 assert.equal(found[0].action,'donations-open');
 assert.equal(found[0].title,'1 · 2026-W41');
});
