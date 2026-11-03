import test from 'node:test';import assert from 'node:assert/strict';import{translateOfficerText}from'../assets/native-admin-i18n.js';
const labels={"ar":"المرشحات","en":"Filters","uk":"Фільтри","ja":"フィルター","fr":"Filtres","it":"Filtri","id":"Filter","ko":"필터","sv":"Filter","pt":"Filtros","nl":"Filters","th":"ตัวกรอง","km":"តម្រង","fil":"Mga filter"};
test('Advanced OCR filter heading translates in every supported locale',()=>{
 assert.equal(translateOfficerText('Filter','de'),'Filter');
 for(const [lang,label] of Object.entries(labels))assert.equal(translateOfficerText('Filter',lang),label,lang);
});
