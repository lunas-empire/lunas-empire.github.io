import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { UI, LANGUAGES, translate } from '../assets/i18n.js';
import { COPY, TASKS, DAILY_GUIDES } from '../assets/content.js';
import { SEASON_COPY, SEASON_CONTENT, EVENTS } from '../assets/season.js';
import { GUIDE_COPY, GUIDE_TEXT, MEMBER_MEDIA } from '../assets/guide-text.js';
import { LIVE_NOTICE } from '../assets/config.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const dictionary={...UI,...COPY,...SEASON_COPY,...GUIDE_COPY};
const baseLanguages=['de','en','uk','ja','fr','it','id'];
const placeholders=value=>[...value.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
for (const [key,row] of Object.entries(dictionary)) {
  assert.equal(row.length,baseLanguages.length,`${key}: base language count`);
  for (const lang of Object.keys(LANGUAGES)) {
    const value=translate(dictionary,key,lang);
    assert.ok(typeof value==='string' && value.trim(),`${key}: empty translation [${lang}]`);
    assert.ok(!/[\uFFFD\u0080-\u009F]/u.test(value),`${key}: encoding damage [${lang}]`);
    assert.deepEqual(placeholders(value),placeholders(row[1]),`${key}: placeholder mismatch [${lang}]`);
  }
}
assert.equal(new Set(TASKS.map(t=>t.id)).size,TASKS.length,'duplicate task IDs');
assert.deepEqual(Object.keys(GUIDE_TEXT).sort(),Object.keys(MEMBER_MEDIA).sort(),'Every displayed guide image has a text equivalent');
for (const [id,blocks] of Object.entries(GUIDE_TEXT)) {
  assert.ok(blocks.length>=2,`${id}: incomplete text equivalent`);
  for (const block of blocks) {
    assert.ok(dictionary[block.heading],`${id}: missing heading ${block.heading}`);
    assert.ok(dictionary[block.text],`${id}: missing text ${block.text}`);
  }
}
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
  const publicPath=relative(root,file).replaceAll('\\','/');
  assert.ok(!/(?:^|\/)private(?:\/|$)/.test(publicPath),'Private content in public tree');
  if (publicPath.startsWith('admin/')) {
    assert.match(publicPath,/^admin\/(?:(?:index\.html|styles\.css|app\.js|crypto\.js)|data\/(?:manifest\.json|wiki\.bin|images\/(?:image|\d+)\.(?:png|jpg)\.bin))$/,'Unexpected file in encrypted admin tree');
  }
  if (/\.(?:js|mjs)$/.test(file)) {
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert.equal(result.status,0,`${relative(root,file)}: ${result.stderr}`);
  }
  if (file.endsWith('.html')) {
    const source=await readFile(file,'utf8');
    const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(ids.length,new Set(ids).size,`${file}: duplicate HTML IDs`);
    assert.ok(!source.includes('copyTmpl(') && !source.includes('Operation KABUM'),'Plaintext admin wiki in public HTML');
  }
}
const manifest=JSON.parse(await readFile(join(root,'admin','data','manifest.json'),'utf8'));
assert.equal(manifest.kdf?.iterations,600000,'Encrypted admin PBKDF2 work factor');
assert.equal(Object.keys(manifest.files?.images || {}).length,29,'All encrypted admin images are present');
console.log(`Validation passed: ${Object.keys(dictionary).length} translation keys × ${Object.keys(LANGUAGES).length} languages; task references, syntax, encrypted admin separation.`);
