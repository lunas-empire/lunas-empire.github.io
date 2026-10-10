import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LANGUAGES } from '../assets/i18n.js';
import { blackMarketGuideHtml, blackMarketGuideTitle } from '../assets/black-market-guide.js';
import { guideHash } from '../assets/guide-links.js';

const escaped=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const app=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');

test('Black Market guide is discoverable under Season, searchable and shareable',()=>{
  assert.match(app,/blackMarketGuideDisclosure\(\)/);
  assert.match(app,/data-guide-id="black-market"/);
  assert.match(app,/data-guide-category="season"/);
  assert.match(app,/guideShareButton\('black-market'\)/);
  assert.equal(guideHash('black-market'),'#guides/black-market');
});

test('Black Market guide renders for all 15 site languages without untranslated fallback',()=>{
  assert.equal(Object.keys(LANGUAGES).length,15);
  const titles=new Set();
  for(const lang of Object.keys(LANGUAGES)){
    const title=blackMarketGuideTitle(lang);
    const html=blackMarketGuideHtml(lang,escaped);
    assert.ok(title.length>7,lang);
    assert.match(html,/bm-shopline/);
    assert.match(html,/bm-table/);
    assert.match(html,/50/);
    assert.match(html,/600/);
    assert.match(html,/Kimberly/);
    assert.match(html,/DVA/);
    assert.match(html,/Tesla/);
    assert.match(html,/Tower of Victory/);
    assert.match(html,/noopener noreferrer/);
    assert.equal((html.match(/<tr>/g)||[]).length,11,lang);
    titles.add(title);
  }
  assert.equal(titles.size,15);
});

test('cash rollover and all pricing instructions remain present',()=>{
  const html=blackMarketGuideHtml('en',escaped);
  assert.match(html,/carries over/);
  assert.match(html,/600 Cash per day/);
  assert.match(html,/first is free/);
  assert.match(html,/60 Cash/);
  assert.match(html,/regular 5-pack costs 500/);
});
