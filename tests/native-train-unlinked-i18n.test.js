import test from 'node:test';
import assert from 'node:assert/strict';
import {OFFICER_TEXT,translateOfficerText} from '../assets/native-admin-i18n.js';
const labels=['Noch zuordnen','Fahrerzuordnung prüfen','Zuordnung offen','Zuordnen','Nur sichere Identitäten zuordnen; Originalnamen bleiben erhalten.','Nicht angegeben'];
const supported=['en','uk','ja','fr','it','id','ar','ko','sv','pt','nl','th','km','fil'];
test('reconciliation controls are translated for all 15 supported officer languages',()=>{
 for(const lang of supported)for(const label of labels){
  assert.equal(typeof OFFICER_TEXT[lang]?.[label],'string',lang+'/'+label);
  assert.notEqual(OFFICER_TEXT[lang][label],label,lang+'/'+label);
  assert.equal(translateOfficerText(label,lang),OFFICER_TEXT[lang][label],lang+'/'+label);
 }
});
test('localized screen-reader action still preserves member name and date',()=>{
 assert.equal(translateOfficerText('Zuordnen','en'),'Assign');
 assert.equal(translateOfficerText('Zuordnen','fr'),'Attribuer');
 assert.equal(translateOfficerText('Fahrerzuordnung prüfen','en'),'Review driver matches');
});
