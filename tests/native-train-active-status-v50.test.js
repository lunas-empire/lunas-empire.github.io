import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {formerArchiveFromTrain} from '../assets/former-train-archive.js';

// Simulates a digest already verified as belonging to a current player.
// Public tests intentionally use only synthetic names.
const digestBuffer=Uint8Array.from(Buffer.from(
 '68665c3a52c9fa7a041637eef6dc21bb42fd6ac49e601e622156565716b38fcd','hex')).buffer;
const activeDigest={digest:async()=>digestBuffer};
const ride=name=>({date:'2026-07-17',status:'completed',linked:false,member_id:null,original_name:name,former_archive:true});
test('leadership-confirmed active train driver cannot reappear as former from a stale Worker archive',async()=>{
 const train={history:[ride('Synthetic Current')],archivedFormerTrainDrivers:[
  {name:'Synthetic Current',dates:['2026-07-17'],ride_count:1,source:'historical_train'}
 ]};
 const result=await formerArchiveFromTrain(train,[],activeDigest);
 assert.deepEqual(result,[]);
 assert.equal(train.history[0].former_archive,false);
 assert.equal(train.counts.historical_former,0);
});
test('genuine archive names continue to work and dates are retained',async()=>{
 const train={history:[],archivedFormerTrainDrivers:[
  {name:'Synthetic Former',dates:['2026-07-17'],ride_count:1,source:'historical_train'}
 ]};
 const archived=await formerArchiveFromTrain(train,[],webcrypto.subtle);
 assert.equal(archived.length,1);
 assert.equal(archived[0].name,'Synthetic Former');
 assert.deepEqual(archived[0].dates,['2026-07-17']);
});
test('a matching registered active player suppresses duplicate former entries',async()=>{
 const train={history:[],archivedFormerTrainDrivers:[
  {name:'Synthetic Current',dates:['2026-06-13'],ride_count:1,source:'historical_train'}
 ]};
 const result=await formerArchiveFromTrain(train,[{name:'Synthetic Current',status:'active',id:'current'}],webcrypto.subtle);
 assert.deepEqual(result,[]);
});
