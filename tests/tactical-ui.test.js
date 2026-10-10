import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LANGUAGES} from '../assets/i18n.js';
import {HUD_COPY} from '../assets/hud-i18n.js';
import {NAV_ICONS,GUIDE_ICONS,icon,missionIconType} from '../assets/icons.js';
import {guideHash} from '../assets/guide-links.js';
import {guideState,checklistKey} from '../assets/engine.js';

test('new HUD and chapter captions are complete in all 15 languages',()=>{
  const keys=Object.keys(HUD_COPY.en).sort();
  assert.equal(Object.keys(HUD_COPY).length,15);
  for(const lang of Object.keys(LANGUAGES)){
    assert.deepEqual(Object.keys(HUD_COPY[lang]).sort(),keys,lang);
    for(const key of keys)assert.ok(HUD_COPY[lang][key]?.trim(),`${lang}: ${key}`);
  }
});

test('five navigation and five guide categories use fixed inline SVG icons',()=>{
  assert.deepEqual(Object.keys(NAV_ICONS),['today','daily','vs','season','guides']);
  assert.deepEqual(Object.keys(GUIDE_ICONS),['alliance','power','vs','season','economy']);
  for(const name of [...Object.values(NAV_ICONS),...Object.values(GUIDE_ICONS)]){
    const svg=icon(name);
    assert.match(svg,/^<svg/);assert.match(svg,/aria-hidden="true"/);assert.doesNotMatch(svg,/<script|https?:/i);
  }
});

test('mission icon types are deterministic without changing task identity',()=>{
  assert.equal(missionIconType({id:'research'}),'research');
  assert.equal(missionIconType({id:'construction'}),'build');
  assert.equal(missionIconType({id:'hero'}),'hero');
  assert.equal(missionIconType({id:'zombieSiege'}),'zombie');
  assert.equal(missionIconType({id:'radarClaim'}),'standard');
});

test('stable checklist keys and direct guide hashes remain unchanged',()=>{
  const state=guideState(new Date('2026-09-30T19:30:00Z'));
  assert.equal(checklistKey('daily',state),'rzsn-daily-2026-09-30');
  assert.equal(checklistKey('season',state),'rzsn-season-2026-09-21-SEASON_WEEK_2');
  assert.equal(guideHash('tech','mastery'),'#guides/tech/mastery');
});

test('dark and light tactical tokens expose gold, cyan and crimson roles',async()=>{
  const css=await readFile(new URL('../assets/tokens.css',import.meta.url),'utf8');
  for(const token of ['--color-accent:#edb75c','--color-action:#70cde3','--color-identity:#c94b47'])assert.ok(css.includes(token),token);
  assert.match(css,/:root\[data-theme='light'\][\s\S]*--color-action:#066d86/);
  assert.match(css,/@media\(prefers-color-scheme:light\)[\s\S]*--color-identity:#a93431/);
});
