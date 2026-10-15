import test from 'node:test';
import assert from 'node:assert/strict';
import {translateOfficerText} from '../assets/native-admin-i18n.js';
const langs=['de','en','uk','ja','fr','it','id','ar','ko','sv','pt','nl','th','km','fil'];
test('universal Last War ranks R1 through R5 are never translated into a local alphabet',()=>{
 for(const lang of langs)for(let rank=1;rank<=5;rank++){
  const code='R'+rank;
  for(const source of [code+' · Luna','Rang '+code,code+' · Luna · Website-Eigentümerin']){
   const result=translateOfficerText(source,lang);
   assert.ok(result.includes(code),lang+': rank code changed in '+source+' -> '+result);
   assert.ok(result.includes('Luna')||!source.includes('Luna'),lang+': private name lost');
  }
 }
});
