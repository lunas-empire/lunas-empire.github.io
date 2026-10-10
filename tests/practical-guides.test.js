import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { LANGUAGES } from '../assets/i18n.js';
import { guideHash, memberRoute } from '../assets/guide-links.js';
import { PRACTICAL_GUIDE_COPY, PRACTICAL_GUIDE_IDS, PRACTICAL_LABELS } from '../assets/practical-guide-i18n.js';
import { PRACTICAL_GUIDES, PRACTICAL_GUIDE_GROUPS, practicalGuideHtml } from '../assets/practical-guides.js';
import { PRACTICAL_GUIDE_IMAGES } from '../assets/practical-guide-images.js';
import { PRACTICAL_IMAGE_CAPTIONS } from '../assets/practical-guide-captions.js';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

test('12 practical guides have complete standalone copy in all 15 languages',()=>{
  assert.equal(PRACTICAL_GUIDE_IDS.length,12);
  assert.equal(Object.keys(LANGUAGES).length,15);
  assert.deepEqual(Object.keys(PRACTICAL_GUIDE_COPY).sort(),Object.keys(LANGUAGES).sort());
  assert.deepEqual(PRACTICAL_GUIDE_GROUPS,['squads','alliance','economy']);
  for(const lang of Object.keys(LANGUAGES)) {
    assert.deepEqual(Object.keys(PRACTICAL_GUIDE_COPY[lang]),PRACTICAL_GUIDE_IDS,`${lang}: guide IDs`);
    for(const id of PRACTICAL_GUIDE_IDS) {
      const copy=PRACTICAL_GUIDE_COPY[lang][id];
      for(const field of ['title','overview','decision','check','caution']) {
        assert.equal(typeof copy[field],'string',`${lang}/${id}/${field}`);
        assert.ok(copy[field].trim().length>(field==='title'?2:10),`${lang}/${id}/${field}: substantive copy`);
        assert.doesNotMatch(copy[field],/\b(?:TBD|placeholder|undefined)\b/i,`${lang}/${id}/${field}`);
      }
      if(lang!=='en') assert.notEqual(copy.overview,PRACTICAL_GUIDE_COPY.en[id].overview,`${lang}/${id}: no English body fallback`);
    }
    for(const key of ['overview','decision','check','caution','sources','related','squads','alliance','economy','front','back','type','job','shop','currency','priority']) {
      assert.ok(PRACTICAL_LABELS[lang][key]?.trim(),`${lang}: ${key}`);
    }
  }
});

test('practical guide HTML is semantic, sourced and safe for narrow tables',()=>{
  for(const lang of Object.keys(LANGUAGES)) {
    for(const id of PRACTICAL_GUIDE_IDS) {
      const html=practicalGuideHtml(id,lang,escape,{guideHref:guideHash,relatedTitle:related=>related});
      const fragment=JSDOM.fragment(html);
      assert.equal(fragment.querySelectorAll('section').length,0,`${lang}/${id}: no boilerplate sections`);
      assert.ok(fragment.querySelector('figure.practical-photo img[loading="lazy"][width][height]'),`${lang}/${id}: screenshot`);
      if(id==='desert-storm') {
        assert.equal(fragment.querySelectorAll('.rzsn-strategy__photo img').length,5,`${lang}/${id}: five original RZSN images`);
        assert.ok(fragment.querySelector('.rzsn-strategy .practical-note'),`${lang}/${id}: historical disclaimer`);
      } else {
        assert.ok(fragment.querySelector('figure.practical-photo figcaption a[target="_blank"]'),`${lang}/${id}: credit`);
        assert.ok(fragment.querySelector('p.practical-lead'),`${lang}/${id}: short lead`);
        assert.ok(fragment.querySelector('p.practical-advice'),`${lang}/${id}: action`);
        assert.ok(fragment.querySelector('p.practical-note'),`${lang}/${id}: subtle note`);
      }
      assert.ok(!fragment.querySelector('.practical-caution,.practical-related strong'),`${lang}/${id}: no attention-grabbing callouts`);
      assert.ok(fragment.querySelector('footer.practical-sources a[target="_blank"][rel="noopener noreferrer"]'),`${lang}/${id}: source link`);
      assert.equal(fragment.querySelectorAll('[data-section-id]').length,0,`${lang}/${id}: no nested section anchors`);
      assert.ok(PRACTICAL_GUIDES[id].sources.length,`${id}: sources`);
    }
  }
  for(const id of ['hero-squad-formations','drone-chips-components','store-buy-priorities']) {
    const table=JSDOM.fragment(practicalGuideHtml(id,'en',escape)).querySelector('table');
    assert.ok(table,`${id}: comparison table`);
    assert.ok(table.querySelectorAll('thead th').length>=2,`${id}: table headers`);
    assert.ok(table.querySelectorAll('tbody tr').length>=3,`${id}: table rows`);
  }
});

test('all practical guide IDs use direct hash routing and approved filters',()=>{
  for(const id of PRACTICAL_GUIDE_IDS) {
    assert.equal(guideHash(id),`#guides/${id}`);
    assert.deepEqual(memberRoute(guideHash(id)),{view:'guides',guideId:id,sectionId:''});
    assert.ok(['account','tech'].includes(PRACTICAL_GUIDES[id].category),`${id}: existing filter category`);
  }
});

test('practical expansion contains no excluded campaign content',async()=>{
  const urls=['../assets/practical-guide-i18n.js','../assets/practical-guides.js','../docs/guide-expansion-audit.md'];
  const source=(await Promise.all(urls.map(url=>readFile(new URL(url,import.meta.url),'utf8')))).join('\n');
  assert.doesNotMatch(source,/Season\s*2|Polar\s+Storm|Age\s+of\s+Oil/i);
});

test('jsdom route smoke opens every practical guide disclosure',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{url:'https://lunas-empire.github.io/#guides/hero-squad-formations',pretendToBeVisual:true});
  const win=dom.window;
  win.matchMedia=()=>({matches:false});
  win.scrollTo=()=>{};
  win.HTMLElement.prototype.scrollIntoView=()=>{};
  const saved=new Map();
  const expose=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});};
  for(const key of ['window','document','navigator','location','HTMLImageElement']) expose(key,key==='window'?win:win[key]);
  expose('requestAnimationFrame',callback=>win.requestAnimationFrame(callback));
  expose('ResizeObserver',class {observe(){} disconnect(){}});
  expose('IntersectionObserver',class {observe(){} disconnect(){}});
  expose('setInterval',()=>0);
  try {
    win.localStorage.setItem('rzsn-language',JSON.stringify('en'));
    await import(`../assets/app.js?practical-route-smoke=${Date.now()}`);
    for(const id of PRACTICAL_GUIDE_IDS) {
      const target=win.document.querySelector(`[data-guide-id="${id}"]`);
      assert.ok(target,`${id}: rendered`);
      assert.equal(target.dataset.guideCategory,PRACTICAL_GUIDES[id].category,`${id}: filter`);
    }
    const first=win.document.querySelector('[data-guide-id="hero-squad-formations"]');
    assert.ok(first.open,'direct route opens the requested guide');
    assert.ok(first.querySelector('[data-share-guide="hero-squad-formations"]'),'share action');
  } finally {
    dom.window.close();
    for(const [key,descriptor] of saved) {
      if(descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key];
    }
  }
});


test('RZSN General Trial recommends highest difficulty and alliance chat rally support',()=>{
  const en=PRACTICAL_GUIDE_COPY.en['generals-trial'];
  const de=PRACTICAL_GUIDE_COPY.de['generals-trial'];
  assert.match(en.overview,/highest unlocked difficulty/i);
  assert.match(en.decision,/alliance chat/i);
  assert.match(en.decision,/rally/i);
  assert.match(de.overview,/höchste freigeschaltete Schwierigkeit/i);
  assert.match(de.decision,/Allianzchat/i);
  assert.match(de.decision,/Rally/i);
  for(const lang of Object.keys(LANGUAGES)){
    const g=PRACTICAL_GUIDE_COPY[lang]['generals-trial'];
    assert.ok(g.overview.length>30 && g.decision.length>50,lang);
    assert.ok(!/choose a difficulty you can advance through|wähle realistisch/i.test(g.overview),lang);
  }
});


test('Drone chip guide correctly maps each of the four slots in every language',()=>{
  const html=practicalGuideHtml('drone-chips-components','de',escape);
  const rows=[...JSDOM.fragment(html).querySelectorAll('tbody tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent));
  assert.deepEqual(rows,[
    ['Interference','Memory Ultra Fission'],
    ['Defense','Gravitational Resonance Armor'],
    ['Initial Move','Absolute Quantum Field'],
    ['Attack','Lethal Firestorm']
  ]);
  for(const lang of Object.keys(LANGUAGES)){
    const decision=PRACTICAL_GUIDE_COPY[lang]['drone-chips-components'].decision;
    for(const chip of ['Memory Ultra Fission','Gravitational Resonance Armor','Absolute Quantum Field','Lethal Firestorm'])assert.ok(decision.includes(chip),lang+' '+chip);
  }
});


test('12 local gameplay screenshots are optimized, credited and free of top-up-provider images',async()=>{
  assert.deepEqual(Object.keys(PRACTICAL_GUIDE_IMAGES),PRACTICAL_GUIDE_IDS);
  assert.deepEqual(Object.keys(PRACTICAL_IMAGE_CAPTIONS).sort(),Object.keys(LANGUAGES).sort());
  for(const id of PRACTICAL_GUIDE_IDS){
    const photo=PRACTICAL_GUIDE_IMAGES[id];
    assert.match(photo.src,/^\/assets\/member\/practical-guides\/[a-z-]+\.webp$/);
    assert.ok(photo.width>=400&&photo.height>=200,id+' useful original dimensions');
    assert.doesNotMatch(photo.sourceUrl+' '+photo.sourceName,/lootbar|ldshop|packsify|midasbuy|top[\s-]?up/i,id);
    const file=await readFile(new URL('..'+photo.src,import.meta.url));
    assert.equal(file.subarray(0,4).toString(),'RIFF',id);
    assert.equal(file.subarray(8,12).toString(),'WEBP',id);
    assert.ok(file.byteLength>8000&&file.byteLength<250000,id);
    for(const lang of Object.keys(LANGUAGES)){
      if(id==='desert-storm')continue; // RZSN uses the five directly supplied alliance screenshots.
      const caption=PRACTICAL_IMAGE_CAPTIONS[lang]?.[id];
      assert.ok(typeof caption==='string'&&caption.trim().length>=6,lang+'/'+id);
      assert.ok(practicalGuideHtml(id,lang,escape).includes(escape(caption)),lang+'/'+id);
    }
  }
});


test('all 12 guide screenshots are included in the offline release shell',async()=>{
 const worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
 for(const id of PRACTICAL_GUIDE_IDS){
   assert.ok(worker.includes(PRACTICAL_GUIDE_IMAGES[id].src),id+' missing offline image');
 }
});
