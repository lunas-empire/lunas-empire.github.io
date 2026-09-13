import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { UI, LANGUAGES } from '../assets/i18n.js';
import { COPY, TASKS, DAILY_GUIDES } from '../assets/content.js';
import { SEASON_COPY, SEASON_CONTENT, EVENTS } from '../assets/season.js';
import { LIVE_NOTICE } from '../assets/config.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const dictionary={...UI,...COPY,...SEASON_COPY};
for (const [key,row] of Object.entries(dictionary)) {
  assert.equal(row.length,Object.keys(LANGUAGES).length,`${key}: language count`);
  const placeholders=value=>[...value.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
  for (const value of row) {
    assert.ok(typeof value==='string' && value.trim(),`${key}: empty translation`);
    assert.ok(!/[\uFFFD\u0080-\u009F]/u.test(value),`${key}: encoding damage`);
    assert.deepEqual(placeholders(value),placeholders(row[1]),`${key}: placeholder mismatch`);
  }
}
assert.equal(new Set(TASKS.map(t=>t.id)).size,TASKS.length,'duplicate task IDs');
const ids=[...TASKS.map(t=>t.text),...Object.values(DAILY_GUIDES).flatMap(g=>[g.focus,...g.tasks,...g.avoid,...g.save]),...Object.values(SEASON_CONTENT).flat(),...EVENTS.map(e=>e.id)];
ids.forEach(id=>assert.ok(dictionary[id],`Missing content: ${id}`));
if (LIVE_NOTICE.active) Object.keys(LANGUAGES).forEach(lang=>assert.ok(LIVE_NOTICE.message[lang]?.trim(),`Live notice missing ${lang}`));
async function files(directory) {
  const result=[];
  for (const item of await readdir(directory,{withFileTypes:true})) {
    if (item.name.startsWith('.') || item.name==='node_modules') continue;
    const path=join(directory,item.name);
    result.push(...item.isDirectory()?await files(path):[path]);
  }
  return result;
}
for (const file of await files(root)) {
  assert.ok(!/[/\\](?:private|admin)(?:[/\\]|$)/.test(file),'Private content in public tree');
  if (/\.(?:js|mjs)$/.test(file)) {
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert.equal(result.status,0,`${relative(root,file)}: ${result.stderr}`);
  }
  if (file.endsWith('.html')) {
    const source=await readFile(file,'utf8');
    const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(ids.length,new Set(ids).size,`${file}: duplicate HTML IDs`);
    assert.ok(!source.includes('copyTmpl(') && !source.includes('Operation KABUM'),'Admin wiki in public HTML');
  }
}
console.log(`Validation passed: ${Object.keys(dictionary).length} translation keys × 7 languages; task references, syntax, public/private separation.`);
