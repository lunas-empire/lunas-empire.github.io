import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');

test('guide search filters matches without auto-expanding every guide',()=>{
  assert.match(app,/if \(query\) el\.open=false;/);
  assert.doesNotMatch(app,/el\.open=Boolean\(query\)/);
  assert.match(app,/guide-disclosure--search-match/);
});

test('nested profession and tech topics are filtered but remain collapsed',()=>{
  assert.match(app,/section\.hidden=!section\.textContent/);
  assert.match(app,/section\.open=false;/);
  assert.match(app,/phase\.hidden=!headingMatch && !standaloneMatch/);
});
