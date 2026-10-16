import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {isIsoTrainDate,berlinTrainToday,trainTimelineGroups,initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
import {translateOfficerText} from '../assets/native-admin-i18n.js';

const ride=(date,status='completed',driver='Sample Driver')=>({date,status,driver});
const wait=async predicate=>{
 for(let i=0;i<180;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,6))}
 assert.ok(predicate(),'train UI did not settle');
};

test('real ISO dates, Berlin today and stable merged pagination',()=>{
 for(const value of ['2026-02-29','2026-04-31','2026-1-01','2026-10-16T00:00:00Z','not-a-date'])assert.equal(isIsoTrainDate(value),false,value);
 assert.equal(isIsoTrainDate('2024-02-29'),true);
 assert.equal(berlinTrainToday(new Date('2026-10-16T22:30:00Z')),'2026-10-17');
 const history=Array.from({length:25},(_,i)=>ride(`2026-10-${String(i+1).padStart(2,'0')}`));
 const page=trainTimelineGroups({history,dice:[{ride_date:'2026-10-14',winner_name:'Dice Winner'}],today:'2026-10-16',limit:20});
 assert.equal(page.past.length,20);
 assert.equal(page.pastCount,26,'sixteen completed rides plus nine static and one live Dice event');
 assert.equal(page.hasMore,true);
 assert.equal(page.past[0].date,'2026-10-16');
 const full=trainTimelineGroups({history,dice:[{ride_date:'2026-10-14',winner_name:'Dice Winner'}],today:'2026-10-16',limit:40});
 assert.equal(full.past.length,26);
 assert.equal(full.hasMore,false);
 const sameDay=full.past.filter(x=>x.date==='2026-10-14');
 assert.deepEqual(sameDay.map(x=>x.kind),['train','dice']);
});

test('completed past, future plans and unresolved rows stay separate without inventing rides',()=>{
 const history=[ride('2026-10-14'),ride('2026-10-15','planned'),ride('2026-10-13','cancelled'),ride('2026-10-20','planned'),ride('2026-11-20','planned'),ride('2026-10-21','cancelled'),ride('2026-10-22','completed'),ride('2026-02-30','planned')];
 const groups=trainTimelineGroups({history,dice:[{ride_date:'2026-10-14',winner_name:'Wednesday Winner'},{ride_date:'2026-10-30',winner_name:'Future Winner'}],today:'2026-10-16',visibleCalendarDates:['2026-10-20']});
 assert.equal(groups.past.filter(x=>x.kind==='train').length,1);
 assert.ok(groups.past.some(x=>x.kind==='dice'&&x.date==='2026-10-14'&&x.entry.winner_name==='Wednesday Winner'));
 assert.ok(!groups.past.some(x=>x.date>'2026-10-16'));
 assert.deepEqual(groups.future.map(x=>x.date),['2026-11-20','2026-10-30']);
 assert.deepEqual(groups.unresolved.map(x=>x.date),['2026-10-22','2026-10-21','2026-10-15','2026-10-13','2026-02-30']);
 assert.equal(history.length,8,'source is untouched');
 const zero=trainTimelineGroups({history:[],dice:[],today:'2026-01-01'});
 assert.equal(zero.pastCount,0);
 assert.equal(zero.past.filter(x=>x.kind==='train').length,0);
 assert.throws(()=>trainTimelineGroups({today:'2026-02-30'}),RangeError);
});

test('logged-in train DOM shows Wednesday Dice beside train, keeps other states editable and stats unchanged',async t=>{
 const dom=new JSDOM('<!doctype html><html lang="de"><body><main id="mount"></main></body></html>',{url:'https://lunas-empire.github.io/#admin'});
 const previous={window:globalThis.window,fetch:globalThis.fetch};
 globalThis.window=dom.window;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 let writes=0;
 const train={today:'2026-10-16',calendar:[{date:'2026-10-16',type:'Members Day'},{date:'2026-10-20',type:'Train',entry:ride('2026-10-20','planned')},{date:'2026-10-21',type:'Train',entry:ride('2026-10-21','cancelled')}],history:[ride('2026-10-14'),ride('2026-10-15','planned'),ride('2026-10-13','cancelled'),ride('2026-10-20','planned'),ride('2026-10-21','cancelled'),ride('2026-11-20','planned')],counts:{completed:1,planned:3},members:[],absences:[]};
 globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname;
  if(options.method==='POST'&&path!=='/api/native-login')writes++;
  const data={
   '/api/native-login':{token:'synthetic',role:'R4',name:'Sample Officer'},
   '/api/overview':{active:1,reviews:0},
   '/api/operations':{tasks:[],events:[],absences:[],members:[]},
   '/api/train-manager':train,
   '/api/train-dice':[{ride_date:'2026-10-14',winner_name:'Wednesday Winner',winner_id:'p1',revision:1}],
   '/api/members':[{id:'p1',name:'Wednesday Winner',rank:'R4',status:'active'}],
   '/api/train-rotation':{revision:1,types:[],coordinators:[],auto_suggest:true},
   '/api/officer-alerts':{}
  };
  if(!(path in data))throw Error('Unexpected endpoint '+path);
  return Response.json(data[path]);
 };
 t.after(()=>{clearOfficer();globalThis.window=previous.window;globalThis.fetch=previous.fetch;dom.window.close()});
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';
 q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>q('[data-officer-tab=train]'));
 q('[data-officer-tab=train]').click();
 await wait(()=>q('.native-train-history'));
 const past=q('.native-train-history');
 assert.equal(past.open,true);
 assert.match(past.querySelector('summary').textContent,/Vergangene Züge & Dice Game/);
 assert.equal(past.querySelectorAll('[data-native-train="2026-10-14"]').length,1);
 const dice=past.querySelector('[data-native-dice-date="2026-10-14"]');
 assert.ok(dice);
 assert.match(dice.textContent,/Mittwoch.*Dice Game.*Wednesday Winner/s);
 assert.equal(past.querySelector('[data-native-train="2026-10-20"]'),null);
 assert.equal(past.querySelector('[data-native-train="2026-10-15"]'),null);
 assert.ok(q('.native-train-week [data-native-train="2026-10-20"]'));
 assert.ok(q('.native-train-future [data-native-train="2026-11-20"]'));
 assert.ok(q('.native-train-unresolved [data-native-train="2026-10-15"]'));
 assert.ok(q('.native-train-unresolved [data-native-train="2026-10-13"]'));
 assert.ok(q('.native-train-unresolved [data-native-train="2026-10-21"]'));
 assert.equal(q('.native-train-week [data-native-train="2026-10-21"]'),null);
 assert.match(q('.native-train-highlights').textContent,/Gefahren \(Historie\).*1.*Geplant.*3/s);
 dice.click();
 assert.match(q('#native-dice-save h3').textContent,/2026-10-14/);
 assert.equal(writes,0);
});

test('new timeline copy translates to English and remains safe in all officer locales',()=>{
 const labels=['Heute & nächste Züge','Vergangene Züge & Dice Game','Weitere geplante Züge','Offene / abgesagte Einträge','Dice-Gewinn ist keine bestätigte Zugfahrt – Fahrtenstatistik/Fairness zählen nur tatsächlich gefahrene Züge.','Noch keine vergangenen Einträge.','Weitere 20 Einträge'];
 for(const label of labels)assert.notEqual(translateOfficerText(label,'en'),label,label);
 for(const lang of ['de','en','uk','ja','fr','it','id','ar','ko','sv','pt','nl','th','km','fil'])for(const label of labels){
  const translated=translateOfficerText(label,lang);
  assert.ok(translated.trim(),lang+' '+label);
  if(lang!=='de')assert.notEqual(translated,label,lang+' must not show German source copy: '+label);
  assert.doesNotMatch(translated,/\uFFFD|undefined/,lang+' '+label);
 }
});
