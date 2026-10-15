import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {LANGUAGES,LOCALES,UI,loadLanguage,translate} from '../assets/i18n.js';
import {COPY} from '../assets/content.js';
import {SEASON_COPY} from '../assets/season.js';
import {GUIDE_COPY} from '../assets/guide-text.js';
import {SEASON_LIBRARY_COPY} from '../assets/season-library.js';
import {OVERVIEW_COPY} from '../assets/overview-i18n.js';
import {HUD_COPY} from '../assets/hud-i18n.js';
import {GUIDE_NAV_TEXT} from '../assets/guide-library-nav-i18n.js';
import {PRACTICAL_LABELS,PRACTICAL_GUIDE_COPY} from '../assets/practical-guide-i18n.js';
import {SPECIAL_GUIDE_COPY} from '../assets/special-guide-i18n.js';
import {OFFICER_TEXT,OFFICER_LANGUAGES,localizeOfficerTree,translateOfficerText} from '../assets/native-admin-i18n.js';

const languages=['de','en','uk','ja','fr','it','id','ar','ko','sv','pt','nl','th','km','fil'];
const unsafe=/(?:\uFFFD|[\u0080-\u009F]|<\s*\/?\s*(?:script|iframe|svg|img)\b|\bon\w+\s*=|javascript\s*:)/iu;
const placeholders=value=>(value.match(/\{(?:\d+|[A-Za-z_]\w*)\}/gu)||[]).sort();
const flatten=(value,path='')=>{
 if(typeof value==='string')return [[path,value]];
 if(Array.isArray(value))return value.flatMap((part,index)=>flatten(part,path+'/'+index));
 if(value&&typeof value==='object')return Object.entries(value).flatMap(([key,part])=>flatten(part,path+'/'+key));
 throw Error('Unexpected translation value at '+path);
};
const assertSafe=(value,where)=>{
 assert.ok(value.trim(),where+' empty');
 assert.doesNotMatch(value,unsafe,where+' unsafe or damaged');
};

await Promise.all(languages.map(loadLanguage));

test('All 15 public, guide, overview, HUD and officer resources have safe values and matching placeholders',()=>{
 assert.deepEqual(Object.keys(LANGUAGES),languages);
 assert.deepEqual(OFFICER_LANGUAGES,languages);
 for(const [name,table] of Object.entries({UI,COPY,SEASON_COPY,GUIDE_COPY,SEASON_LIBRARY_COPY})){
  for(const key of Object.keys(table)){
   const source=translate(table,key,'de');
   for(const lang of languages){
    const value=translate(table,key,lang);
    assertSafe(value,`${name}/${lang}/${key}`);
    assert.deepEqual(placeholders(value),placeholders(source),`${name}/${lang}/${key} placeholders`);
   }
  }
 }
 for(const [name,table] of Object.entries({overview:OVERVIEW_COPY,hud:HUD_COPY,guideNav:GUIDE_NAV_TEXT,practicalLabels:PRACTICAL_LABELS,practicalGuides:PRACTICAL_GUIDE_COPY,specialGuides:SPECIAL_GUIDE_COPY})){
  const base=flatten(table.de);
  for(const lang of languages){
   const rows=flatten(table[lang]);
   assert.deepEqual(rows.map(([path])=>path),base.map(([path])=>path),`${name}/${lang} keys`);
   rows.forEach(([path,value],index)=>{
    assertSafe(value,`${name}/${lang}${path}`);
    assert.deepEqual(placeholders(value),placeholders(base[index][1]),`${name}/${lang}${path} placeholders`);
   });
  }
 }
 const keys=Object.keys(OFFICER_TEXT.en).sort();
 for(const lang of languages.filter(lang=>lang!=='de')){
  assert.deepEqual(Object.keys(OFFICER_TEXT[lang]).sort(),keys,`officer/${lang} keys`);
  for(const key of keys){
   const value=OFFICER_TEXT[lang][key];
   assertSafe(value,`officer/${lang}/${key}`);
   assert.deepEqual(placeholders(value),placeholders(key),`officer/${lang}/${key} placeholders`);
  }
 }
});

test('Dynamic and fragment dictionaries have matching interpolation markers and safe content',async()=>{
 for(const [file,constant] of [['native-admin-dynamic-i18n.js','DYNAMIC_TRANSLATIONS'],['native-admin-fragments.js','FRAGMENT_TRANSLATIONS']]){
  const source=await readFile(new URL('../assets/'+file,import.meta.url),'utf8');
  const encoded=source.match(new RegExp('^const '+constant+'=(.*);$','m'))?.[1];
  assert.ok(encoded,`${file} dictionary found`);
  const table=JSON.parse(encoded);
  const base=Object.keys(table.en);
  for(const lang of languages.filter(lang=>lang!=='de')){
   const missing=base.filter(key=>!(key in table[lang]));
   assert.deepEqual(missing,file.startsWith('native-admin-fragments')&&lang!=='en'?['No Desert-Storm']:[],`${file}/${lang} keys`);
   for(const [key,value] of Object.entries(table[lang])){
    assertSafe(value,`${file}/${lang}/${key}`);
    assert.deepEqual(placeholders(value),placeholders(key),`${file}/${lang}/${key} placeholders`);
   }
  }
 }
});

test('Actual English-authored dashboard labels localize in all non-English officer languages',async()=>{
 const source=await readFile(new URL('../assets/native-admin.js',import.meta.url),'utf8');
 const pairs=[...source.matchAll(/word\('([^']+)','([^']+)'\)/gu)]
  .map(([,german,english])=>({german,english}))
  .filter(({english})=>english!=='Daily alliance chat draft');
 assert.ok(pairs.length>=20,'dashboard source labels extracted');
 for(const lang of languages.filter(lang=>lang!=='de'&&lang!=='en')){
  const dom=new JSDOM('<!doctype html><html lang="'+lang+'"><body><main></main></body></html>');
  const root=dom.window.document.querySelector('main');
  for(const {english} of pairs){
   const label=dom.window.document.createElement('span');
   label.textContent=english;
   root.appendChild(label);
  }
  const input=dom.window.document.createElement('input');
  input.value='SYNTHETIC_MEMBER_Zugfahrer';
  input.placeholder='Spieler suchen';
  root.appendChild(input);
  localizeOfficerTree(root,lang);
  pairs.forEach(({german,english},index)=>{
   const actual=root.querySelectorAll('span')[index].textContent;
   assert.notEqual(actual,english,`${lang}: English dashboard leftover ${english}`);
   if(english!=='Members')assert.equal(actual,translateOfficerText(german,lang),`${lang}: ${english}`);
  });
  assert.equal(input.value,'SYNTHETIC_MEMBER_Zugfahrer',`${lang}: typed value changed`);
  assert.notEqual(input.placeholder,'Spieler suchen',`${lang}: placeholder untranslated`);
  dom.window.close();
 }
});

test('Named placeholders, native scripts and locale formatting survive all 15 languages',()=>{
 for(const lang of languages){
  assert.ok(LOCALES[lang],lang+' locale');
  assert.ok(new Intl.DateTimeFormat(LOCALES[lang],{dateStyle:'medium'}).format(new Date('2026-10-15T12:00:00Z')));
  assert.ok(new Intl.NumberFormat(LOCALES[lang]).format(3600000));
  assert.ok(translate(UI,'today',lang));
  assert.ok(OVERVIEW_COPY[lang].checkTask.replace('{task}','SYNTHETIC_TASK').includes('SYNTHETIC_TASK'));
 }
 assert.match(translateOfficerText('Spielerakte','uk'),/[\u0400-\u04FF]/u);
 assert.match(translateOfficerText('Spielerakte','fr'),/[A-Za-zÀ-ÿ]/u);
 assert.match(translateOfficerText('Spielerakte','km'),/[\u1780-\u17FF]/u);
 for(const lang of languages.filter(lang=>lang!=='de')){
  assert.equal(translateOfficerText('Luna Spieler',lang),'Luna Spieler',`${lang}: private name changed`);
  assert.ok(translateOfficerText('Vorschlag: Zugfahrer · R2',lang).includes('Zugfahrer'),`${lang}: interpolated private name changed`);
 }
});

test('VS weekly English-authored labels and count sentences localize without losing numbers',()=>{
 const labels=['Alliance duel weekly data','Daily minimum ·','Weekly metrics','Days below goal','Unclear','Perfect 6/6',
  'Note','How are results assessed?',
  'Only verified scores count. Missing screenshots and unclear OCR are never zero. Weekly totals are not evidence of a weekly screenshot.',
  'Saturday shield: remind manually; not automatically verified.','Week'];
 const counts=['7 members repeatedly below the daily goal.','4 members have too few active days with complete data.'];
 for(const lang of languages.filter(lang=>lang!=='de'&&lang!=='en')){
  labels.forEach(label=>assert.notEqual(translateOfficerText(label,lang),label,`${lang}: ${label}`));
  counts.forEach(sentence=>{
   const result=translateOfficerText(sentence,lang);
   assert.notEqual(result,sentence,`${lang}: ${sentence}`);
   assert.ok(result.includes(sentence[0]),`${lang}: count lost`);
  });
 }
});

test('Standalone private member names remain exact in known officer name mounts',()=>{
 const dom=new JSDOM('<!doctype html><html lang="fr"><body><main id="mount">'+
  '<div class="native-rank-members"><button data-native-member="synthetic"><strong>Zug</strong><small>Spenden</small></button></div>'+
  '<div class="native-profile-identity"><h3>Spielerakte</h3></div>'+
  '<ol class="native-train-candidates"><li><b>Zugfahrer</b></li></ol>'+
  '<div class="native-review-people"><button data-native-review-pick="synthetic"><strong>Bestätigt</strong></button></div>'+
  '<select name="member_id"><option value="synthetic">Zug</option></select>'+
  '</main></body></html>');
 const root=dom.window.document.getElementById('mount');
 localizeOfficerTree(root,'fr');
 for(const name of ['Zug','Spielerakte','Zugfahrer','Bestätigt']){
  assert.ok([...root.querySelectorAll('strong,h3,b,option')].some(node=>node.textContent===name),name+' changed');
 }
 assert.notEqual(root.querySelector('.native-rank-members small').textContent,'Spenden','UI label must still translate');
 dom.window.close();
});
