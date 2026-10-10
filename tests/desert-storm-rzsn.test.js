import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { LANGUAGES } from '../assets/i18n.js';
import { practicalGuideHtml } from '../assets/practical-guides.js';
import { RZSN_DESERT_STORM_COPY, RZSN_DESERT_STORM_IMAGE_PATHS, desertStormRzsnHtml } from '../assets/desert-storm-rzsn.js';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

test('RZSN Desert Storm strategy has complete localized copy in all 15 languages',()=>{
  assert.deepEqual(Object.keys(RZSN_DESERT_STORM_COPY).sort(),Object.keys(LANGUAGES).sort());
  for(const [lang,copy] of Object.entries(RZSN_DESERT_STORM_COPY)) {
    for(const key of ['strategyTitle','scope','mapTitle','fixedTitle','jumperTitle','jumperStart','adkPriority','jumperFlow','infoRule','unlockNote','buildingsTitle','verify','fridayTitle','historyDisclaimer','latestWins']) {
      assert.ok(copy[key]?.trim().length>1,`${lang}: ${key}`);
      if(lang!=='en' && !['jumperTitle'].includes(key)) assert.notEqual(copy[key],RZSN_DESERT_STORM_COPY.en[key],`${lang}: English fallback in ${key}`);
    }
    assert.equal(copy.fixedRules.length,3,`${lang}: fixed directives`);
    assert.equal(copy.captions.length,5,`${lang}: image captions`);
    assert.equal(copy.buildings.length,7,`${lang}: building reference`);
  }
});

test('RZSN strategy uses exactly the five supplied image paths as responsive linked figures',()=>{
  assert.deepEqual(RZSN_DESERT_STORM_IMAGE_PATHS,[
    '/assets/member/rzsn-desert-storm/friday-announcement.webp',
    '/assets/member/rzsn-desert-storm/battlefield-positions.webp',
    '/assets/member/rzsn-desert-storm/buildings.webp',
    '/assets/member/rzsn-desert-storm/fixed-position.webp',
    '/assets/member/rzsn-desert-storm/jumper.webp'
  ]);
  const fragment=JSDOM.fragment(desertStormRzsnHtml('en',escape));
  const images=[...fragment.querySelectorAll('figure.rzsn-strategy__photo img')];
  assert.equal(images.length,5);
  assert.deepEqual(images.map(image=>image.getAttribute('src')).sort(),[...RZSN_DESERT_STORM_IMAGE_PATHS].sort());
  for(const image of images) {
    assert.equal(image.getAttribute('loading'),'lazy');
    assert.equal(image.getAttribute('decoding'),'async');
    assert.ok(image.getAttribute('sizes'));
    assert.equal(image.parentElement.getAttribute('href'),image.getAttribute('src'));
    assert.match(image.closest('figure').querySelector('figcaption').textContent,/RZSN alliance · 9 Oct 2026/);
  }
});

test('RZSN assignments keep A and B positions distinct and preserve player names',()=>{
  const fragment=JSDOM.fragment(desertStormRzsnHtml('en',escape));
  const rows=[...fragment.querySelectorAll('.practical-table')].at(-1).querySelectorAll('tbody tr');
  const assignmentRows=[...rows].map(row=>[...row.cells].map(cell=>cell.textContent));
  assert.deepEqual(assignmentRows,[
    ['3','6','Theo, Lulu, Mari'],
    ['4','5','Kaba, Bay, Drage'],
    ['5','4','Hiochi, Beharzt, GOM'],
    ['8','8','Turbo, hima · Science Hub']
  ]);
  const text=fragment.textContent;
  for(const name of ['Loki','Dr O','Juan','Adk','Nevu','Bram','Flat','Bubbzy','Char']) assert.ok(text.includes(name),name);
});

test('RZSN jumper order, ten-minute unlock and historical disclaimer are explicit',()=>{
  const text=JSDOM.fragment(desertStormRzsnHtml('en',escape)).textContent;
  assert.match(text,/Start at 2 and 7/);
  assert.match(text,/From minute 10, Adk goes ALONE to 10/);
  assert.match(text,/highest priority/);
  assert.match(text,/favor 11/);
  assert.match(text,/Never prioritize 1/);
  assert.match(text,/10 unlocks only after ten minutes/);
  assert.match(text,/not permanent player assignments or an attendance promise/);
  assert.match(text,/latest announcement always overrides this old roster/);
});

test('Desert Storm extension remains escaped, scoped and free of excluded campaign copy',async()=>{
  for(const lang of Object.keys(LANGUAGES)) {
    const fragment=JSDOM.fragment(practicalGuideHtml('desert-storm',lang,escape));
    assert.equal(fragment.querySelectorAll('.rzsn-strategy').length,1,lang);
    assert.equal(fragment.querySelectorAll('script,[onload],[onclick],a[href^="javascript:"]').length,0,lang);
    assert.ok(fragment.querySelector('footer.practical-sources a[href="https://www.lastwars.net/desert-storm"]'),lang);
  }
  const source=await readFile(new URL('../assets/desert-storm-rzsn.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/Season\s*2|Polar\s+Storm|Age\s+of\s+Oil/i);
  assert.throws(()=>desertStormRzsnHtml('<img onerror=alert(1)>',escape),RangeError);
});

test('release asset script discovers staged Desert Storm images and safely permits a missing directory',async()=>{
  const source=await readFile(new URL('../scripts/release-assets.js',import.meta.url),'utf8');
  assert.match(source,/optionalWebpImages\('assets\/member\/rzsn-desert-storm\/'\)/);
  assert.match(source,/error\?\.code==='ENOENT'/);
  assert.match(source,/\.\.\.desertStormImages/);
  for(const path of RZSN_DESERT_STORM_IMAGE_PATHS) {
    try {
      await access(new URL('..'+path,import.meta.url));
      const worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
      assert.ok(worker.includes(path),`${path}: staged image missing from offline shell`);
    } catch (error) {
      if(error?.code!=='ENOENT') throw error;
    }
  }
});
