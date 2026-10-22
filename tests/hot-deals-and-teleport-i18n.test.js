import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {HOT_DEALS_ID,HOT_DEALS_LOCALES,hotDealsCopy,hotDealsHtml,hotDealsTitle,HOT_DEALS_SEASON,HOT_DEALS_OFFSEASON,HOT_DEALS_SOURCE} from '../assets/hot-deals-guide.js';
import {TELEPORT_GUIDE_ID,TELEPORT_GUIDE_LOCALES,teleportGuideCopy,teleportGuideHtml} from '../assets/teleport-guide.js';
import {guideTopicOf,guideTopicCount} from '../assets/guide-library-nav.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localeSet=['de','en','uk','ja','fr','it','id','ar','ko','sv','pt','nl','th','km','fil'];
test('new guide isolated under economy, existing teleport remains in alliance',()=>{
 assert.equal(HOT_DEALS_ID,'hot-deals-events');
 assert.equal(TELEPORT_GUIDE_ID,'free-teleport');
 assert.equal(guideTopicOf(HOT_DEALS_ID),'economy');
 assert.equal(guideTopicOf(TELEPORT_GUIDE_ID),'alliance');
 assert.equal(guideTopicCount('economy',[],[]),3);
 assert.equal(guideTopicCount('alliance',[],[]),8);
});
test('all 15 full translations: Hot Deals and Teleport have no incomplete fallback',()=>{
 assert.deepEqual([...HOT_DEALS_LOCALES],localeSet);
 assert.deepEqual([...TELEPORT_GUIDE_LOCALES],localeSet);
 const headings=new Set();
 for(const lang of localeSet){
  const h=hotDealsCopy(lang),t=teleportGuideCopy(lang);
  assert.equal(h.length,20,'Hot Deals '+lang);
  assert.equal(t.length,12,'Teleport '+lang);
  assert.ok(h.every(s=>typeof s==='string'&&s.length>=1),'Hot text '+lang);
  assert.ok(t.every(s=>typeof s==='string'&&s.length>=3),'Teleport text '+lang);
  assert.ok(h.slice(11).every(s=>s.length>25),'Hot tips '+lang);
  assert.equal(t[3].split('||').length,3,'Teleport VS steps '+lang);
  assert.equal(t[5].split('||').length,3,'Teleport Season steps '+lang);
  assert.equal(t[7].split('||').length,2,'Teleport R4/R5 steps '+lang);
  assert.equal(t[9].split('||').length,3,'Teleport warnings '+lang);
  assert.ok(t[5].includes('Warzone Duel'),'Season navigation '+lang);
  assert.ok(t[5].includes('Grouping'),'Grouping '+lang);
  assert.ok(h[8].includes('2025')||h[8].includes('٢٠٢٥')||h[8].includes('២០២៥'),'Author date disclaimer '+lang);
  const html=hotDealsHtml(lang,escape);
  assert.ok(html.includes('Bounty Hunter')&&html.includes('Glittering Market'),'Event names '+lang);
  assert.ok(html.includes(HOT_DEALS_SOURCE),'Source '+lang);
  assert.ok(html.includes('role="region"')&&html.includes('scope="row"'),'Table a11y '+lang);
  assert.ok(!html.includes('undefined')&&!html.includes('teleport-hive.svg'),'No stale references '+lang);
  assert.equal((html.match(/<tr>/g)||[]).length,14,'12 rows + 2 heads '+lang);
  assert.equal((teleportGuideHtml(lang,escape).match(/<img /g)||[]).length,5,'Five original screenshots '+lang);
  headings.add(hotDealsTitle(lang));
 }
 assert.equal(headings.size,localeSet.length,'translated headings must be distinct');
});
test('non-Latin locales remain native scripts, not English fallback or mojibake',()=>{
 const scripts={uk:/[\u0400-\u04ff]/,ja:/[\u3040-\u30ff\u4e00-\u9fff]/,ar:/[\u0600-\u06ff]/,ko:/[\uac00-\ud7af]/,th:/[\u0e00-\u0e7f]/,km:/[\u1780-\u17ff]/};
 for(const [lang,re] of Object.entries(scripts)){
  assert.match(hotDealsCopy(lang)[0],re,'hot '+lang);
  assert.match(teleportGuideCopy(lang)[0],re,'teleport '+lang);
  assert.ok(!hotDealsCopy(lang)[0].includes('???'),'hot mojibake '+lang);
  assert.ok(!teleportGuideCopy(lang)[0].includes('???'),'teleport mojibake '+lang);
 }
});
test('schedule sourced as 8 season + repeating 4 off-season; no removed event',()=>{
 assert.equal(HOT_DEALS_SEASON.length,8);
 assert.equal(HOT_DEALS_OFFSEASON.length,4);
 assert.deepEqual(HOT_DEALS_OFFSEASON[0],['Total Mobilisation','Energy Loot Quest']);
 assert.ok(HOT_DEALS_SEASON[2].includes('Glittering Market'));
 assert.ok(HOT_DEALS_SEASON[3].includes('Bullseye Loot + Ammo Bonanza'));
 assert.ok(HOT_DEALS_SEASON[7].includes('Drone Training Pass'));
 assert.ok(![...HOT_DEALS_SEASON.flat(),...HOT_DEALS_OFFSEASON.flat()].includes('Special Training Pass'),'retired event absent');
});
test('original source screenshots are preserved in Teleport; no stale Hot Deals illustration',async()=>{
 const hot=await readFile(new URL('../assets/hot-deals-guide.js',import.meta.url),'utf8');
 const tp=await readFile(new URL('../assets/teleport-guide.js',import.meta.url),'utf8');
 assert.ok(!hot.includes('hot-deals-dark.webp')&&!hot.includes('hot-deals-light.webp'));
 assert.ok(tp.includes('teleport-season-grouping.png'));
 assert.ok(tp.includes('teleport-vs.webp'));
});
