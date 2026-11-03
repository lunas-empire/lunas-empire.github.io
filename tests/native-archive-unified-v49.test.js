import test from 'node:test';import assert from 'node:assert/strict';import {mergeFormerMemberRows} from '../assets/native-admin.js';
test('Historical train riders and registered former members share one alphabetical archive list',()=>{
 const members=[{name:'Zelda',id:'z',lifecycle:'former'},{name:'Anna',id:'a',lifecycle:'former'}];
 const trains=[{name:'Milo',ride_count:2,dates:['2026-09-01','2026-09-08'],source:'historical_train'},{name:'Benny',ride_count:1,dates:['2026-09-06'],source:'historical_train'}];
 const rows=mergeFormerMemberRows(members,trains);
 assert.deepEqual(rows.map(x=>x.value.name),['Anna','Benny','Milo','Zelda']);
 assert.deepEqual(rows.map(x=>x.kind),['member','train','train','member']);
 assert.equal(rows[1].value.id,undefined,'Train riders must never gain synthetic member IDs');
 assert.equal(rows[2].value.ride_count,2);
});
test('No archived train source is duplicated, truncated or hidden by pagination when merged',()=>{
 const rows=mergeFormerMemberRows([{id:'a',name:'Amy'}],Array.from({length:25},(_,i)=>({name:'Historical '+i,ride_count:1,dates:['2026-08-01']})));
 assert.equal(rows.length,26);
 assert.equal(rows.filter(x=>x.kind==='train').length,25);
});
