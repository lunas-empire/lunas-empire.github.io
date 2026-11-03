import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {TELEPORT_GUIDE_ID,teleportGuideTitle,teleportGuideHtml} from '../assets/teleport-guide.js';
import {guideTopicOf,guideTopicCount} from '../assets/guide-library-nav.js';
const languages=['de','en','uk','ja','fr','it','id','ar','ko','sv','pt','nl','th','km','fil'];
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
test('teleport guide is present in Alliance category and navigable',()=>{
 assert.equal(TELEPORT_GUIDE_ID,'free-teleport');
 assert.equal(guideTopicOf(TELEPORT_GUIDE_ID),'alliance');
 assert.equal(guideTopicCount('alliance',[],[]),8);
});
test('15 locales contain concrete gameplay instructions and five real photographs',()=>{
 for(const lang of languages){
  const title=teleportGuideTitle(lang);
  const html=teleportGuideHtml(lang,escape);
  assert.ok(title.length>12,lang);
  assert.match(html,/Alliance Assaults/);
  assert.match(html,/Grouping/);
  assert.ok(html.includes('teleport-vs.webp'));
  assert.ok(html.includes('teleport-season-grouping.png'));
  assert.equal((html.match(/<img /g)||[]).length,5);
  assert.doesNotMatch(html,/undefined|watermark/);
 }
});
test('all screenshots are local WebP and PNG with clickable source credits',async()=>{
 for(const name of ['teleport-vs.webp','teleport-place.webp','teleport-return.webp','teleport-season-grouping.png','teleport-season-server.png']){
  const data=await readFile(new URL('../assets/member/teleport/'+name,import.meta.url));
  assert.ok(data.byteLength>3000,name);
  if(name.endsWith('.png')) assert.equal(data.subarray(1,4).toString(),'PNG');
  else assert.equal(data.subarray(8,12).toString(),'WEBP');
 }
 const html=teleportGuideHtml('en',escape);
 assert.ok(html.includes('https://www.tkw.world/lastwar-faq'));
 assert.ok(html.includes('https://www.lastwargame.online/en/teleport-guide/'));
 assert.ok(!html.includes('teleport-route.svg') && !html.includes('teleport-hive.svg'));
});
