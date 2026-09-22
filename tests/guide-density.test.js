import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TECH_GUIDE_HTML } from '../assets/tech-guide.js';
import { professionGuideHtml } from '../assets/profession-guide.js';

const app=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

test('opened guides use progressive disclosure instead of exposing all content',()=>{
  assert.match(app,/guide-text__block.*<summary>/);
  assert.match(app,/guide-media-disclosure/);
  assert.doesNotMatch(app,/firstProfession\.open=true/);
});

test('Tech and Profession guides start with their inner sections collapsed',()=>{
  assert.ok((TECH_GUIDE_HTML.match(/class="tech-guide__phase/g)||[]).length>=6);
  assert.doesNotMatch(TECH_GUIDE_HTML,/<section class="tech-guide__phase/);
  const profession=professionGuideHtml('en',escape);
  assert.equal((profession.match(/class="profession-path__section"/g)||[]).length,3);
  assert.doesNotMatch(profession,/profession-path__section" open/);
  assert.match(profession,/profession-path__tips-disclosure/);
});
