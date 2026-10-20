import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
test('Player dossier opens every metric, VS weekday, 100k kills achievement, rides and dice winners',async t=>{
 const dom=new JSDOM('<main id="x"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const previous={window:globalThis.window,fetch:globalThis.fetch,FormData:globalThis.FormData};
 globalThis.window=dom.window;globalThis.FormData=dom.window.FormData;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();Object.assign(globalThis,previous);dom.window.close()});
 const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'testing',role:'R5',name:'Officer'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-13',history:[],calendar:[]});
  if(path==='/api/members')return Response.json([{id,name:'Player 1',rank:'R5',power:1000000,kills:200000}]);
  if(path==='/api/member/'+id)return Response.json({
   member:{id,name:'Player 1',rank:'R5',status:'active'},events:[],
   stats:[{metric:'kills',value:300000,quality:'observed',captured_at:'2026-10-13'},
    {metric:'kills',value:100000,quality:'observed',captured_at:'2026-10-06'}],
   weeks:[{week:'2026-W41',weekly_points:22000000,verified_days:6,verified_goal_days:6,uncertain_days:0}],
   days:[{week:'2026-W41',weekday:0,points:4200000,quality:'corrected'}],
   rides:[{date:'2026-10-11',type:'VS Hero',status:'completed'},{date:'2026-10-03',type:'R4',status:'completed'}],
   dice_wins:[{ride_date:'2026-10-11',roll_value:77}],
   achievements:[{kind:'kills_100k',title:'+100.000 Kills',delta:200000,date:'2026-10-13'},
    {kind:'vs_perfect',title:'6/6 VS-Zieltage',value:22000000,date:'2026-W41'}]
  });
  throw Error('Unexpected endpoint '+path);
 };
 const mount=dom.window.document.querySelector('#x'),q=s=>mount.querySelector(s);
 const until=async fn=>{for(let n=0;n<120;n++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'render did not settle')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='test';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=members]'));q('[data-officer-tab=members]').click();
 await until(()=>q('[data-native-member]'));q('[data-native-member]').click();
 await until(()=>q('.native-profile'));
 assert.equal(q('.native-profile-metric-card summary strong').textContent,'300.000');
 assert.equal(mount.querySelectorAll('.native-profile-metric-card').length,3);
 q('.native-profile-metric-card summary').click();
 assert.match(mount.textContent,/100.000/);
 assert.match(mount.textContent,/\+100.000 Kills/);
 assert.match(mount.textContent,/Dice Game/);
 assert.match(mount.textContent,/Zugfahrten/);
 q('.native-profile-week summary').click();
 assert.match(mount.textContent,/4.200.000/);
});
test('Responsive mobile rank group and Officer More menu have explicit layout rules',()=>{
 const css=readFileSync(new URL('../assets/hub.css',import.meta.url),'utf8');
 assert.match(css,/\.native-rank-group>summary>\.native-rank-count\{grid-column:2;grid-row:2/);
 assert.match(css,/\.native-more-menu\{position:absolute;right:0;left:auto/);
});

test('Alliance event attendance is labelled as officer evidence and never inferred',()=>{
 const source=readFileSync(new URL('../assets/native-admin.js',import.meta.url),'utf8');
 assert.match(source,/Teilnehmer · Offizierseintrag/);
 assert.match(source,/Teilnahme nicht belegt/);
 assert.match(source,/ohne Beleg nicht automatisch ergänzt/);
});
