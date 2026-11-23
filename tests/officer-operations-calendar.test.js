import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildOperationsCalendar,renderOperationsCalendar} from '../assets/officer-operations-calendar.js';

const operations={
 events:[
  {id:'event-open',event_type:'marshall_guard',event_date:'2026-11-18',outcome:'scheduled',level:8},
  {id:'event-done',event_type:'zombie_siege',event_date:'2026-11-19',outcome:'completed',level:7}
 ],
 protocolEvents:[{event:'marshall_reserved',scheduled_server_time:'2026-11-21 17:00:00',level:8}],
 absences:[{member_id:'driver',start_date:'2026-11-18',end_date:'2026-11-20',substitute_id:null}]
};
const trains={today:'2026-11-19',calendar:[
 {date:'2026-11-18',type:'R4',entry:{driver:'Driver',status:'planned',vip_name:'VIP Member'},unavailable_driver:false},
 {date:'2026-11-19',type:'Members Day',entry:{driver:'Driver',status:'completed',vip_name:null},unavailable_driver:true},
 {date:'2026-11-20',type:'R5',entry:null}
]};

test('Operations calendar keeps planned observations and actual completions separate',()=>{
 const rows=buildOperationsCalendar(operations,trains,14);
 assert.equal(rows.length,4);
 assert.equal(rows[0].overdue,true);
 assert.equal(rows[1].overdue,false);
 assert.equal(rows[0].items.find(item=>item.kind==='train').status,'planned');
 assert.equal(rows[0].items.find(item=>item.kind==='event').outcome,'scheduled');
 assert.equal(rows[0].items.find(item=>item.kind==='event').id,'event-open');
 assert.equal(rows[1].items.find(item=>item.kind==='train').status,'completed');
 assert.equal(rows[1].absences.length,1);
 assert.equal(rows[2].items[0].kind,'train');
 assert.equal(rows[2].items[0].status,'open');
 assert.equal(rows[3].items[0].kind,'protocol');
});

test('Operations calendar links only actual train/event records and warns without inventing completion',()=>{
 const html=renderOperationsCalendar(operations,trains,{numberText:String});
 const dom=new JSDOM(html),doc=dom.window.document;
 assert.equal(doc.querySelector('[data-native-train="2026-11-18"]').textContent,'Zug öffnen');
 assert.equal(doc.querySelector('[data-native-edit="event-open"]').textContent,'Eintrag öffnen');
 assert.match(doc.body.textContent,/Nachweis fällig/);
 assert.match(doc.body.textContent,/Abwesenheit\(en\) ohne Ersatz/);
 assert.match(doc.body.textContent,/Beobachtung · kein Abschluss/);
 assert.equal(doc.querySelectorAll('[data-native-edit="event-done"]').length,1);
 assert.doesNotMatch(html,/undefined/);
 dom.window.close();
});
