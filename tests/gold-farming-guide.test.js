import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GOLD_GUIDE_ID,GOLD_LANGS,GOLD_GUIDE_SEARCH,GOLD_QUICK,GOLD_SHORT_LABELS,goldGuideCopy,goldGuideTitle,goldGuideHtml} from '../assets/gold-farming-guide.js';
import {guideTopicCount,guideTopicOf} from '../assets/guide-library-nav.js';
const langs=['de','en','uk','ja','fr','it','id','ar','ko','sv','pt','nl','th','km','fil'];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('gold guide is isolated under economy with correct navigation and search',()=>{
 assert.equal(GOLD_GUIDE_ID,'gold-farming');
 assert.equal(guideTopicOf(GOLD_GUIDE_ID),'economy');
 assert.equal(guideTopicCount('economy',[],[]),4);
 for(const keyword of ['gold','monica','taylor','zombie','interior','3v3'])assert.ok(GOLD_GUIDE_SEARCH.includes(keyword));
});
test('all 15 translations have original complete content, correct group counts and no fallback',()=>{
 assert.deepEqual([...GOLD_LANGS],langs);
 const titles=new Set();
 for(const lang of langs){
  const copy=goldGuideCopy(lang);
  assert.equal(copy.length,27,'Copy slots '+lang);
  copy.forEach((value,i)=>{assert.equal(typeof value,'string',lang+' '+i);assert.ok(value.trim().length>=3,lang+' '+i);assert.ok(!value.includes('undefined')&&!value.includes('???'),lang+' '+i);});
  titles.add(goldGuideTitle(lang));
  const html=goldGuideHtml(lang,escape);
  assert.equal((html.match(/class="gold-section gold-section--quick"/g)||[]).length,1,lang);
  assert.equal((html.match(/<li>/g)||[]).length,18,lang);
  assert.ok(html.includes('gold-mine.png'),lang);
  assert.ok(html.includes('rel="noopener noreferrer"'),lang);
  assert.ok(html.includes('lastwarvault.com/plunder-calculator/'),lang);
  assert.ok(html.includes('Interior'),lang);
  assert.ok(html.includes('Replenish All'),lang);
  assert.ok(html.includes('Resource Choice'),lang);
  assert.ok(html.includes('Monica')&&html.includes('Taylor'),lang);
  assert.ok(html.includes('VIP Store')&&html.includes('Alliance Store'),lang);
  assert.ok(html.includes('Honorable Campaign Store')&&html.includes('Zombie Invasion Store'),lang);
  assert.ok(!html.includes('undefined')&&!html.includes('&lt;script'),lang);
 }
 assert.equal(titles.size,15);
});
test('non-Latin languages include native scripts and Arabic is direction safe',()=>{
 const scripts={uk:/[\u0400-\u04ff]/,ja:/[\u3040-\u30ff\u4e00-\u9fff]/,ar:/[\u0600-\u06ff]/,ko:/[\uac00-\ud7af]/,th:/[\u0e00-\u0e7f]/,km:/[\u1780-\u17ff]/};
 for(const [lang,re] of Object.entries(scripts)){
  assert.match(goldGuideCopy(lang)[0],re,lang);
  assert.match(goldGuideCopy(lang)[3],re,lang);
 }
});
test('gameplay caveats are present: 6 full raids, 5:5:1 ratio, PvE Monica, Taylor 4 stars',()=>{
 const en=goldGuideCopy('en');
 assert.ok(en[3].includes('six')&&en[3].includes('15%')&&en[3].includes('5%'));
 assert.ok(en[4].includes('1/11')&&en[4].includes('9%'));
 assert.ok(en[5].includes('five daily wins'));
 assert.ok(en[8].includes('PvP')&&en[8].includes('Treasure Hunter'));
 assert.ok(en[9].includes('Zombie Invasion')&&en[9].includes('regenerating'));
 assert.ok(en[12].includes('Secretary of the Interior')&&en[12].includes('capacity'));
 assert.ok(en[13].includes('world-map'));
 assert.ok(en[15].includes('4★')&&en[15].includes('F2P'));
 assert.ok(en[18].includes('Replenish All'));
 assert.ok(en[24].includes('diplomatically protected'));
});
test('gold image is valid PNG and guide has verified source credits',async()=>{
 const image=await readFile(new URL('../assets/member/gold-guide/gold-mine.png',import.meta.url));
 assert.ok(image.length>20000);
 assert.equal(image.subarray(1,4).toString(),'PNG');
 const source=await readFile(new URL('../docs/gold-farming-sources.md',import.meta.url),'utf8');
 assert.ok(source.includes('lastwarsurvival.com/buildings'));
});

test('compact checklist has 18 actionable bullets plus one short explanation in all locales',()=>{
 const scripts={uk:/[\u0400-\u04ff]/,ja:/[\u3040-\u30ff\u4e00-\u9fff]/,ar:/[\u0600-\u06ff]/,ko:/[\uac00-\ud7af]/,th:/[\u0e00-\u0e7f]/,km:/[\u1780-\u17ff]/};
 for(const lang of langs){
  const tips=GOLD_QUICK[lang],labels=GOLD_SHORT_LABELS[lang];
  assert.equal(tips?.length,18,'18 quick tips '+lang);
  assert.equal(labels?.length,3,'translated headings and explainer '+lang);
  assert.ok(tips.every(s=>typeof s==='string'&&s.length>=12&&s.length<=195),'short scannable tips '+lang);
  assert.ok(labels[2].length>=70&&labels[2].length<=400,'short explanation '+lang);
  assert.ok(tips.some(s=>s.includes('3v3'))&&tips.some(s=>s.includes('Zombie Invasion')),'daily steps '+lang);
  assert.ok(tips.some(s=>s.includes('Taylor'))&&tips.some(s=>s.includes('4★')),'Taylor breakpoint '+lang);
  assert.ok(tips.some(s=>s.includes('Replenish All')),'replenish warning '+lang);
  assert.ok(tips.some(s=>s.includes('Resource Choice')),'choice chest '+lang);
  const h=goldGuideHtml(lang,escape);
  assert.ok(h.includes('gold-quick-list')&&h.includes('gold-explainer'),'new layout '+lang);
  assert.equal((h.match(/<li>/g)||[]).length,18,'only 18 list entries '+lang);
  assert.ok(h.includes('<details class="gold-sources">'),'sources collapsed '+lang);
  assert.ok(h.length<4500,'less page text '+lang);
  if(scripts[lang])assert.match(labels[0],scripts[lang],'native heading '+lang);
 }
});


test('all 15 locales distinguish Campaign Store from Honor Shop and reserve Honor Points for blueprints',()=>{
 for(const lang of langs){
  const detailed=goldGuideCopy(lang)[19];
  const short=GOLD_QUICK[lang][14];
  for(const line of [detailed,short]){
   assert.match(line,/Honorable Campaign Store/,lang+' campaign');
   assert.match(line,/Honor Shop/,lang+' honor');
   assert.match(line,/Gear Blueprints/,lang+' blueprints');
   assert.match(line,/Gold/,lang+' never gold warning');
  }
  const html=goldGuideHtml(lang,escape);
  assert.match(html,/Honor Shop/);
  assert.match(html,/Gear Blueprints/);
  assert.match(html,/lastwartutorial\.com\/stores/);
  assert.equal((html.match(/<li>/g)||[]).length,18,lang+' remains concise');
 }
});
