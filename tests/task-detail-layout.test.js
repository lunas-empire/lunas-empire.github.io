import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('expanded task detail occupies full task row instead of narrow grid column',async()=>{
 const css=await readFile(new URL('../assets/overview.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/\.task-detail\[open\]\s*\{display:contents\}/,'do not flatten details into grid');
 assert.match(css,/\.task-line>\.task-detail\[open\]\s*\{[^}]*display:block;[^}]*grid-column:1\s*\/\s*-1;[^}]*grid-row:2/s);
 assert.match(css,/\.task-line>\.task-detail\s+\.task-detail-body\s*\{[^}]*width:100%;[^}]*min-width:0;/s);
 assert.match(css,/\.task-line>label\s*\{min-width:0\}/);
 assert.match(css,/\.task-line>\.task-detail\[open\]>summary\s*\{[^}]*white-space:nowrap;/s);
});
