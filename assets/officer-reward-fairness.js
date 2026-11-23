const active=members=>(members||[]).filter(member=>member.status!=='former');

export function buildRewardFairness(trains={},dice=[],members=[]){
 const roster=active(members),rows=new Map(roster.map(member=>[member.id,{id:member.id,name:member.name,rank:member.rank,vipCount:0,vipLast:null,diceCount:0,diceLast:null}]));
 const add=(id,date,kind)=>{
  const row=rows.get(id);if(!row)return;
  row[kind+'Count']++;if(!row[kind+'Last']||date>row[kind+'Last'])row[kind+'Last']=date;
 };
 for(const ride of trains.vip_passengers||[])if(ride.vip_member_id)add(ride.vip_member_id,ride.ride_date,'vip');
 for(const result of dice||[])if(result.winner_id)add(result.winner_id,result.ride_date,'dice');
 const sorted=[...rows.values()].sort((a,b)=>a.vipCount-b.vipCount||a.diceCount-b.diceCount||a.name.localeCompare(b.name));
 const vipRecords=sorted.reduce((sum,row)=>sum+row.vipCount,0),diceRecords=sorted.reduce((sum,row)=>sum+row.diceCount,0);
 return {rows:sorted,summary:{active:roster.length,vipRecords,diceRecords,vipCovered:sorted.filter(row=>row.vipCount>0).length,diceCovered:sorted.filter(row=>row.diceCount>0).length,
  completeRound:roster.length>0&&sorted.every(row=>row.vipCount>0&&row.diceCount>0)}};
}

export function renderRewardFairness(trains={},dice=[],members=[],options={}){
 const {sort='vip',language='de',esc=String,numberText=String}=options,en=language==='en',text=(de,english)=>en?english:de,e=esc,n=numberText,model=buildRewardFairness(trains,dice,members);
 const rows=[...model.rows].sort((a,b)=>sort==='dice'?a.diceCount-b.diceCount||a.vipCount-b.vipCount||a.name.localeCompare(b.name):sort==='name'?a.name.localeCompare(b.name):a.vipCount-b.vipCount||a.diceCount-b.diceCount||a.name.localeCompare(b.name));
 return '<section class="native-reward-fairness"><div class="native-reward-heading"><h3>'+text('VIP- & Dice-Fairness','VIP & dice fairness')+'</h3><label>'+text('Sortieren','Sort')+'<select id="native-reward-sort">'+[['vip',text('VIP zuerst','VIP first')],['dice',text('Dice zuerst','Dice first')],['name','Name']].map(([value,label])=>'<option value="'+value+'" '+(sort===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label></div>'+
  '<div class="native-reward-counts"><article><small>'+text('VIP-Belege / IDs','VIP records / IDs')+'</small><strong>'+n(model.summary.vipRecords)+' / '+n(model.summary.vipCovered)+'</strong></article>'+
  '<article><small>'+text('Dice-Belege / IDs','Dice records / IDs')+'</small><strong>'+n(model.summary.diceRecords)+' / '+n(model.summary.diceCovered)+'</strong></article>'+
  '<article><small>'+text('Vollständige Vergaberunde','Complete award round')+'</small><strong>'+text(model.summary.completeRound?'Belegt':'Nicht belegt',model.summary.completeRound?'Confirmed':'Not confirmed')+'</strong></article></div>'+
  '<p class="native-reward-note">'+text(model.summary.completeRound?'Eine vollständige Vergaberunde ist belegt; die Verteilung kann geprüft werden.':'Noch keine vollständig belegte Vergaberunde. Die Verteilung ist keine belastbare Fairnesswertung.',model.summary.completeRound?'A complete award round is confirmed; distribution can be reviewed.':'No complete award round yet. Distribution is not a reliable fairness assessment.')+'</p>'+
  '<details class="native-fold native-reward-members"><summary>'+text('Mitgliederübersicht','Member overview')+'</summary><div class="native-fold-body"><div class="native-reward-table" role="table" aria-label="'+text('VIP und Dice Vergaben','VIP and dice awards')+'"><div class="native-reward-row native-reward-head" role="row"><span>'+text('Mitglied','Member')+'</span><span>VIP</span><span>Dice</span></div>'+
  rows.map(row=>'<div class="native-reward-row" role="row"><span><button type="button" data-native-member="'+e(row.id)+'">'+e(row.name)+'</button><small>'+e(row.rank)+'</small></span><span>'+n(row.vipCount)+'×<small>'+(row.vipLast||'—')+'</small></span><span>'+n(row.diceCount)+'×<small>'+(row.diceLast||'—')+'</small></span></div>').join('')+'</div></div></details>'+
  '<p class="native-muted">'+text('Nur bestätigte Vergaben. Kein Beleg bedeutet nicht „kein Anspruch“; es erfolgt keine automatische Vergabe oder Sanktion.','Confirmed awards only. No record does not mean “not eligible”; no automatic award or sanction.')+'</p></section>';
}
