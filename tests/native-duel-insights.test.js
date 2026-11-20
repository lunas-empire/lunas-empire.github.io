import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createDuelLeagueController,normalizeDuelLeague} from '../assets/native-duel-league.js';

test('Duel history keeps empty state and opens the existing capture workflow',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://lunas-empire.github.io/#admin',pretendToBeVisual:true}),root=dom.window.document.querySelector('#root');
 const controller=createDuelLeagueController({root,language:'de',api:{read:async()=>({matches:[]})}});await controller.load();
 assert.ok(root.querySelector('.native-duel-insights [data-native-dl-scroll-entry]'));
 root.querySelector('[data-native-dl-scroll-entry]').click();assert.equal(root.querySelector('.native-dl-match-form').closest('details').open,true);
 controller.destroy();dom.window.close();
});

test('Duel normalization preserves day verification for history analysis',()=>{
 const data=normalizeDuelLeague({matches:[{days:[{day_index:1,result:'win',verification_status:'evidence_confirmed'}]}]});
 assert.equal(data.matches[0].days[0].verification_status,'evidence_confirmed');
});
