import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{groupUnlinkedTrainRides}from'../assets/native-admin.js';
test('unlinked train rides are grouped by exact original name; user names are not guessed',()=>{
 const items=[{date:'2026-06-15',driver:'Loki',original_name:'Loki',status:'completed',linked:false},{date:'2026-06-22',driver:'Loki',original_name:'Loki',status:'completed',linked:false},{date:'2026-07-03',driver:'Toll',original_name:'Toll',status:'completed',linked:false},{date:'2026-07-04',driver:'Loki D Sun',original_name:'Loki D Sun',status:'completed',linked:true},{date:'2026-07-08',driver:'Guest',status:'planned',linked:false}];
 const out=groupUnlinkedTrainRides(items);
 assert.deepEqual(out.map(x=>[x.name,x.count]),[['Loki',2],['Toll',1]]);
 assert.deepEqual(out[0].dates,['2026-06-22','2026-06-15']);
});
test('Unicode zero-width variation groups correctly, but similar real names stay separate',()=>{
 const result=groupUnlinkedTrainRides([{date:'2026-09-12',driver:'Lissa City',status:'completed',linked:false},{date:'2026-09-11',driver:'Lissa City \u200b',status:'completed',linked:false},{date:'2026-09-13',driver:'Lissa City2',status:'completed',linked:false}]);
 assert.deepEqual(result.map(x=>x.count),[2,1]);
 assert.equal(result.length,2);
});
test('private train reconciliation exposes explicit actions and accessible list',async()=>{
 const s=await readFile(new URL('../assets/native-admin.js',import.meta.url),'utf8');
 assert.match(s,/data-native-train-unlinked|native-train-unlinked-dates/);
 assert.match(s,/Noch zuordnen/);
 assert.match(s,/aria-label.*assignVerb/,'screen-reader action uses the localized verb');
});
