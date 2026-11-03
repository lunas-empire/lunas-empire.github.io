import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,extname} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const publicTextExt=new Set(['.html','.js','.mjs','.json','.css','.md','.xml','.txt','.yml','.yaml','.webmanifest','.svg']);
const names=[['chat','gpt'].join(''),['chat-','gpt'].join(''),['open','ai'].join('')];
const banned=names.map(value=>new RegExp(value,'i'));

test('public site pages, metadata, source credits and domains contain no unwanted product attribution',()=>{
 const tracked=execFileSync('git',['ls-files','-z'],{cwd:root})
  .toString('utf8').split('\0').filter(Boolean);
 const failures=[];
 let scanned=0;
 for(const filename of tracked){
  if(!publicTextExt.has(extname(filename).toLowerCase())) continue;
  if(filename.startsWith('tests/')) continue;
  const contents=readFileSync(resolve(root,filename),'utf8');
  scanned++;
  for(const pattern of banned){
   if(pattern.test(contents))failures.push(filename+': '+pattern.source);
  }
 }
 assert.ok(scanned>=35,'Expected to audit public text assets and guides');
 assert.deepEqual(failures,[],'Unexpected external attribution in published files');
});
