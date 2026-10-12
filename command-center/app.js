import { demoApi } from './demo-api.js';
import { createReviewController } from './review-ui.js';
let secret='demo';
let authMode='demo';
const el=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>v==null?'—':Number(v).toLocaleString('de-DE');
const compact=v=>v==null?'—':Number(v)>1000000?(Number(v)/1000000).toFixed(1)+' M':n(v);
async function api(endpoint,opts={}){return demoApi(endpoint,opts)}
const names={overview:'Alliance Overview',members:'Member Intelligence',vs:'VS Intelligence',review:'OCR Review Center',train:'Train Manager'};
function section(which){
 if(!secret)return;
 document.querySelectorAll('[data-tab]').forEach(b=>{
   const selected=b.dataset.tab===which;
   b.classList.toggle('active',selected);
   if(selected)b.setAttribute('aria-current','page');
   else b.removeAttribute('aria-current');
 });
 document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==which);
 el('page-title').textContent=names[which];
 if(which==='members')members();
 if(which==='review')reviews();
 if(which==='train')trains();
}
const field=(label,value)=>'<div class="integrity-row"><b>'+esc(label)+'</b><span>'+esc(value)+'</span></div>';
function tiles(weeks){
 if(!weeks.length)return '<p class="footnote">No imported VS data yet. Awaiting verified tracker export.</p>';
 return weeks.map(w=>'<div class="week"><div class="week-title"><span>'+esc(w.week)+'</span><small class="'+(w.state==='preliminary'?'warning':'good')+'">'+esc(w.state)+'</small></div><b class="negative">'+n(w.under_count)+'</b><p>Daily failures to reach 3.6M</p><b class="good">'+n(w.perfect_count)+'</b><p>6/6 target days</p>'+(w.note?'<p class="warning">'+esc(w.note)+'</p>':'')+'</div>').join('');
}
async function overview(){
 const data=await api('overview');
 el('active').textContent=data.snapshot?n(data.active):'—';
 el('roster-status').textContent=data.snapshot?'Snapshot '+data.snapshot.captured_at:'No roster imported';
 el('power').textContent=compact(data.stats.power?.total);
 el('power-note').textContent=data.stats.power?data.stats.power.count+'/'+data.active+' confirmed':'No verified values';
 el('kills').textContent=compact(data.stats.kills?.total);
 el('kills-note').textContent=data.stats.kills?data.stats.kills.count+'/'+data.active+' confirmed':'No verified values';
 el('reviews').textContent=n(data.reviews);
 el('review-badge').textContent=data.reviews?String(data.reviews):'';
 el('snapshot-status').textContent=data.snapshot?'Snapshot '+data.snapshot.captured_at.slice(0,16).replace('T',' '):'No snapshot';
 el('ranks').innerHTML=['R5','R4','R3','R2','R1'].map(role=>{
   const count=data.roles[role]||0;
   return '<div class="rank-row"><b>'+role+'</b><progress class="rank-progress" max="'+Math.max(1,data.active)+'" value="'+count+'" aria-label="'+role+' '+count+' members"></progress><strong>'+(data.snapshot?n(count):'—')+'</strong></div>';
 }).join('');
 el('integrity').innerHTML=field('Verified active players',data.active)+field('Historical identities to review',data.unverified)+field('OCR review queue',data.reviews)+field('Local upload batches',data.queued)+field('Access','Fiktive Daten · öffentliches Demo');
 el('summary-weeks').innerHTML=tiles(data.weeks);
 el('vs-weeks').innerHTML=tiles(data.weeks);
}
async function members(){
 const list=await api('members?search='+encodeURIComponent(el('member-search').value));
 el('member-rows').innerHTML=list.length?list.map(m=>'<tr><td><button class="member-link" data-member="'+esc(m.id)+'">'+esc(m.name)+'</button></td><td><span class="pill">'+esc(m.rank||'?')+'</span></td><td>'+n(m.power)+'</td><td>'+n(m.kills)+'</td><td>'+n(m.donations_daily)+'</td><td>'+n(m.donations_weekly)+'</td></tr>').join(''):'<tr><td colspan="6">No matching members.</td></tr>';
 document.querySelectorAll('[data-member]').forEach(b=>b.addEventListener('click',()=>person(b.dataset.member)));
}
async function person(id){
 const p=await api('member/'+encodeURIComponent(id));
 const panel=el('member-detail');
 const stats=p.stats.filter((v,i,a)=>a.findIndex(x=>x.metric===v.metric)===i);
 panel.hidden=false;
 panel.innerHTML='<div class="detail-title"><h2>'+esc(p.member.name)+'</h2><span class="tag">'+esc(p.member.rank||'UNVERIFIED')+'</span></div><div class="mini-grid">'+stats.map(s=>'<div class="mini"><small>'+esc(s.metric.replaceAll('_',' '))+'</small><strong>'+((s.quality==='observed'||s.quality==='corrected')?n(s.value):'—')+'</strong><small>'+esc(s.quality)+'</small></div>').join('')+'</div><h3>VS Trends</h3><div class="mini-grid">'+p.weeks.map(w=>'<div class="mini"><small>'+esc(w.week)+' '+(w.state==='preliminary'?'(preliminary)':'')+'</small><strong>'+n(w.verified_goal_days)+' / '+n(w.verified_days)+'</strong><small>Verified goal days / known days · '+n(w.uncertain_days)+' unknown</small><small>Weekly source: '+n(w.weekly_points)+' points</small></div>').join('')+'</div><p class="footnote">Unknown values are not counted as zero. Renames require manual verification.</p>';
 panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}
const reviewController=createReviewController({api,el,esc,onChange:overview,isReadOnly:()=>true});
async function reviews(){await reviewController.refresh()}
async function trains(){
 const rides=await api('trains');
 el('train-list').innerHTML=rides.length?'<h3>Historical rides</h3><div class="mini-grid">'+rides.map(t=>'<div class="mini"><small>'+esc(t.ride_date)+'</small><strong>'+esc(t.source_name||'Unassigned')+'</strong><small>'+esc(t.status)+'</small></div>').join('')+'</div>':
 '<p class="footnote">Train history import pending. No automatic assignments will be made.</p>';
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>section(b.dataset.tab)));
function setTheme(theme,persist=false){
 const mode=theme==='light'?'light':'dark';
 document.documentElement.dataset.theme=mode;
 const toggle=el('theme');
 toggle.textContent=mode==='dark'?'☀️':'🌙';
 toggle.setAttribute('aria-label',mode==='dark'?'Switch to light appearance':'Switch to dark appearance');
 document.querySelector('meta[name="theme-color"]').content=mode==='dark'?'#101821':'#d4dbe4';
 if(persist){try{localStorage.setItem('rzsn-theme',JSON.stringify(mode))}catch{}}
}
let saved=null;
try{saved=JSON.parse(localStorage.getItem('rzsn-theme'))}catch{}
setTheme(saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));
el('theme').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark',true));
el('member-search').addEventListener('input',()=>{if(secret)members().catch(console.error)});

// PUBLIC DEMO ONLY. No authentication and no network API: all data is synthetic.
el('auth-panel').hidden=true;
el('workspace').hidden=false;
document.querySelector('.environment').textContent='DEMO · BEISPIELDATEN';
document.querySelector('.site-role').textContent='R4 / R5 · DEMO';
document.querySelector('.bottom').textContent='RZSN · Server 2261 · öffentliche Demo ohne Echtdaten';
overview().then(()=>section('overview')).catch(error=>{
  document.querySelector('#snapshot-status').textContent='Demo konnte nicht geladen werden: '+error.message;
});
