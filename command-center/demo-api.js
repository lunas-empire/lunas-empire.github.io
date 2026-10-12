// PUBLIC, READ-ONLY, SYNTHETIC DATA. None of these names or numbers come from RZSN.
const rows=[
 ['demo-01','Demo Aurora','R5',23500000,1060000,112000,790000],
 ['demo-02','Demo Orion','R4',21800000,945000,95000,680000],
 ['demo-03','Demo Ember','R4',20300000,821000,84000,585000],
 ['demo-04','Demo Vesper','R3',19600000,730000,91000,640000],
 ['demo-05','Demo Nova','R3',18400000,660000,72000,510000],
 ['demo-06','Demo Atlas','R3',17700000,608000,68000,480000],
 ['demo-07','Demo Solstice','R3',16900000,551000,66000,460000],
 ['demo-08','Demo Comet','R3',15800000,489000,null,425000],
 ['demo-09','Demo Mirage','R2',15100000,453000,58000,410000],
 ['demo-10','Demo Echo','R2',14300000,397000,49000,360000],
 ['demo-11','Demo Pixel','R2',13600000,322000,44000,310000],
 ['demo-12','Demo Lynx','R2',12800000,281000,39000,275000],
 ['demo-13','Demo Starling','R2',11900000,243000,null,240000],
 ['demo-14','Demo Drift','R2',10500000,196000,27000,185000],
];
export const demoMembers=rows.map(([id,name,rank,power,kills,donations_daily,donations_weekly])=>
 ({id,name,rank,power,kills,donations_daily,donations_weekly}));
const weeks=[
 {week:'2026-W39',state:'final',under_count:22,perfect_count:7,note:'Demo-Werte, nicht aus dem Spiel'},
 {week:'2026-W40',state:'final',under_count:19,perfect_count:9,note:''},
 {week:'2026-W41',state:'preliminary',under_count:25,perfect_count:6,note:'Beispiel einer vorläufigen Auswertung'}
];
const openReviews=[
 {id:'demo-r01',kind:'profile',source_name:'Demo Comet',source_batch:'DEMO-W41',metric:'donations_daily',source_value:'?',note:'Daily donation figure is not legible. Compare with original capture.',status:'open',context:{captured_at:'2026-10-12 09:00',quality:'uncertain'}},
 {id:'demo-r02',kind:'vs_day',source_name:'Demo Orion',source_batch:'DEMO-W41',metric:'vs_thursday',source_value:'3?89000',note:'Ambiguous digit in VS score.',status:'open',context:{date:'2026-10-08',quality:'uncertain',value:3989000}},
 {id:'demo-r03',kind:'vs_day',source_name:'Demo Echo',source_batch:'DEMO-W41',metric:'vs_saturday',source_value:'1?34000',note:'Part of the row was covered by a scrolling overlay.',status:'open',context:{date:'2026-10-10',quality:'uncertain'}},
 {id:'demo-r04',kind:'identity',source_name:'Demo OldNova',source_batch:'DEMO-W39',metric:'historical_identity',source_value:null,note:'Historical alias needs a verified link to an active player.',status:'open',suggested_name:'Demo Nova',context:{status:'unresolved'}},
 {id:'demo-r05',kind:'profile',source_name:'Demo Starling',source_batch:'DEMO-W41',metric:'donations_daily',source_value:null,note:'Value absent from example screenshot; keep as unknown.',status:'open',context:{quality:'unknown'}},
];
const closedReviews=[
 {id:'demo-r06',kind:'profile',source_name:'Demo Ember',source_batch:'DEMO-W40',metric:'power',source_value:'20200000',note:'Example of a completed audit.',status:'approved',resolved_by:'Demo Officer',resolved_at:'2026-10-10',resolution:{corrected_value:20300000,reason:'Synthetic source rechecked against sample capture'},context:{quality:'corrected'}},
 {id:'demo-r07',kind:'identity',source_name:'Demo Unknown',source_batch:'DEMO-W39',metric:'historical_identity',source_value:null,note:'Example of a dismissed match.',status:'dismissed',resolved_by:'Demo Officer',resolved_at:'2026-10-10',resolution:{reason:'Synthetic example has no verified matching identity'},context:{status:'dismissed'}}
];
const trainRides=[
 {ride_date:'2026-10-05',source_name:'Demo Aurora',status:'unresolved'},
 {ride_date:'2026-10-06',source_name:'Demo Orion',status:'unresolved'},
 {ride_date:'2026-10-07',source_name:'Demo Lynx',status:'unresolved'},
 {ride_date:'2026-10-08',source_name:'Demo Ember',status:'unresolved'},
 {ride_date:'2026-10-09',source_name:'Demo Vesper',status:'unresolved'},
 {ride_date:'2026-10-10',source_name:'Demo Pixel',status:'planned'},
 {ride_date:'2026-10-11',source_name:'Demo Nova',status:'planned'}
];
const roles=Object.fromEntries(['R1','R2','R3','R4','R5'].map(rank=>[rank,demoMembers.filter(m=>m.rank===rank).length]));
export const demoOverview={
 snapshot:{captured_at:'2026-10-12T12:00:00Z'},active:demoMembers.length,roles,
 stats:{
  power:{total:demoMembers.reduce((s,m)=>s+m.power,0),count:demoMembers.length},
  kills:{total:demoMembers.reduce((s,m)=>s+m.kills,0),count:demoMembers.length}
 },
 reviews:openReviews.length,unverified:1,queued:0,weeks
};
export async function demoApi(endpoint,options={}){
 if(options.method&&options.method!=='GET')throw Error('Öffentliche Demo ist schreibgeschützt.');
 if(endpoint==='overview')return demoOverview;
 if(endpoint.startsWith('members')){
  const search=new URLSearchParams(endpoint.split('?')[1]||'').get('search')?.toLocaleLowerCase()||'';
  return demoMembers.filter(m=>m.name.toLocaleLowerCase().includes(search));
 }
 if(endpoint.startsWith('member/')){
  const id=decodeURIComponent(endpoint.slice('member/'.length));
  const member=demoMembers.find(m=>m.id===id);
  if(!member)throw Error('Demo-Mitglied nicht gefunden');
  return {member,stats:[
   {metric:'power',value:member.power,quality:'observed'},
   {metric:'kills',value:member.kills,quality:'observed'},
   {metric:'donations_daily',value:member.donations_daily,quality:member.donations_daily==null?'unknown':'observed'},
   {metric:'donations_weekly',value:member.donations_weekly,quality:'observed'}
  ],weeks:weeks.map((w,i)=>({
   week:w.week,state:w.state,verified_goal_days:Math.max(1,6-i-(rows.findIndex(r=>r[0]===id)%3)),
   verified_days:i===2?5:6,uncertain_days:i===2?1:0,
   weekly_points:32000000-i*2100000+rows.findIndex(r=>r[0]===id)*100000
  }))};
 }
 if(endpoint.startsWith('reviews')){
  const status=new URLSearchParams(endpoint.split('?')[1]||'').get('status')||'open';
  return [...openReviews,...closedReviews].filter(r=>r.status===status);
 }
 if(endpoint==='identity-options')return demoMembers.map(m=>({id:m.id,name:m.name,rank:m.rank}));
 if(endpoint==='trains')return trainRides;
 throw Error('Unbekannter Demo-Endpunkt');
}
