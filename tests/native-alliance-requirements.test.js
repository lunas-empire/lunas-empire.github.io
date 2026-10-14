import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
test('Settings in mobile Mehr: R4 edits minimums, saves revision, and sees audit confirmation',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const prevWindow=globalThis.window,prevFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=prevWindow;globalThis.fetch=prevFetch;dom.window.close()});
 let cfg={vs_daily_minimum:3600000,donation_weekly_minimum:20000,min_active_vs_days:5,
  low_vs_day_warning_count:2,shield_reminder_saturday:true,revision:1,updated_at:'2026-10-14'};
 const requests=[];
 globalThis.fetch=async (url,opts={})=>{
  const path=new URL(url).pathname;requests.push(path);
  if(path==='/api/native-login')return Response.json({token:'fake',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:94,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-14',history:[],calendar:[],counts:{}});
  if(path==='/api/alliance-requirements'){
   if(opts.method==='POST'){
    const change=JSON.parse(opts.body);
    assert.equal(change.revision,1);assert.equal(change.vs_daily_minimum,4100000);
    assert.equal(change.donation_weekly_minimum,25000);
    assert.equal(change.min_active_vs_days,6);assert.equal(change.low_vs_day_warning_count,3);
    assert.equal(change.shield_reminder_saturday,false);
    assert.equal(change.reason,'Allianz testet neue Vorgaben');
    cfg={...cfg,...change,revision:2};return Response.json(cfg);
   }
   return Response.json(cfg);
  }
  throw Error('unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const until=async fn=>{for(let i=0;i<120;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'UI timeout')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='fake';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=requirements]'));
 q('[data-officer-tab=requirements]').click();
 await until(()=>q('#native-requirements-save'));
 assert.equal(q('[name=vs_daily_minimum]').value,'3600000');
 assert.equal(q('[name=donation_weekly_minimum]').value,'20000');
 assert.match(q('.native-requirements-intro').textContent,/Allianzregeln/);
 q('[name=vs_daily_minimum]').value='4100000';
 q('[name=donation_weekly_minimum]').value='25000';
 q('[name=min_active_vs_days]').value='6';
 q('[name=low_vs_day_warning_count]').value='3';
 q('[name=shield_reminder_saturday]').checked=false;
 q('[name=reason]').value='Allianz testet neue Vorgaben';
 q('#native-requirements-save').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-revision="2"]'));
 assert.match(q('#native-requirements-message').textContent,/gespeichert/);
 assert.equal(q('[name=vs_daily_minimum]').value,'4100000');
 assert.ok(requests.filter(x=>x==='/api/alliance-requirements').length>=2);
});
