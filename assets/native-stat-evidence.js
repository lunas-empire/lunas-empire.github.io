/** Private proof viewer: player + metric + snapshot must be an exact source match.
 * Candidate images are NEVER described as confirmed until an officer links a row.
 */
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validKey=key=>/^([A-Za-z0-9-]{1,80})\|([A-Za-z0-9-]{1,80})\|(power|kills|donations_weekly)$/.exec(String(key));
const PATH=(id,member,metric)=>'/api/stat-evidence/'+encodeURIComponent(id)+'/'+encodeURIComponent(member)+'/'+metric;
export function createStatEvidenceViewer({request,getToken,apiBase}){
 let active=null;
 const clearBlob=()=>{
  if(active?.url){URL.revokeObjectURL(active.url);active.url=null}
 };
 const close=target=>{
  clearBlob();
  active?.host?.remove();
  active=null;
  target?.querySelector('#native-stat-evidence-viewer')?.remove();
 };
 const loadImage=async(path,expectedHash,frame,alt,sourceRow=null)=>{
  if(!active)return false;
  const state=active;
  clearBlob();
  frame.textContent='Geschütztes Originalbild wird geladen …';
  const response=await fetch(apiBase+path,{
   headers:{Authorization:'Bearer '+getToken(),Accept:'image/png,image/jpeg,image/webp'},
   credentials:'omit',mode:'cors',cache:'no-store'
  });
  if(!response.ok)throw Error('Privates Bild nicht verfügbar (HTTP '+response.status+')');
  const mime=(response.headers.get('Content-Type')||'').split(';')[0];
  if(!['image/png','image/jpeg','image/webp'].includes(mime))throw Error('Ungültiges Bildformat');
  const blob=await response.blob();
  if(blob.size<50||blob.size>950000)throw Error('Bildgröße ungültig');
  if(expectedHash){
   const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());
   const got=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
   if(got!==expectedHash)throw Error('Prüfsumme stimmt nicht mit Original überein');
  }
  if(active!==state||!state.host.isConnected)return false;
  state.url=URL.createObjectURL(blob);
  if(sourceRow&&Number.isInteger(sourceRow.row_y)&&sourceRow.row_y>=0&&sourceRow.row_y<660){
   frame.innerHTML='<p class="native-stat-row-identity"><strong>'+safe(sourceRow.source_name)+'</strong> · '+
    new Intl.NumberFormat('de-DE').format(sourceRow.source_value)+' Punkte</p>'+
    '<div class="native-stat-row-window"><img alt="'+safe(alt)+'" draggable="false" loading="eager"></div>'+
    '<details class="native-stat-full-image"><summary>Vollständigen Screenshot ansehen</summary>'+
    '<img alt="Vollständiger privater Original-Screenshot" loading="lazy"></details>';
   const wrap=frame.querySelector('.native-stat-row-window');
   const img=wrap.querySelector('img');
   img.addEventListener('load',()=>{
    if(active!==state||!img.naturalHeight||!img.naturalWidth)return;
    const width=Math.min(img.naturalWidth,Math.max(140,wrap.clientWidth));
    const scale=width/img.naturalWidth;
    const region=Math.min(160,img.naturalHeight);
    const start=Math.max(0,Math.min(img.naturalHeight-region,sourceRow.row_y-region/2));
    wrap.style.height=Math.ceil(region*scale)+'px';
    img.style.width=width+'px';
    img.style.top=(-Math.round(start*scale))+'px';
    wrap.classList.add('ready');
   },{once:true});
   img.src=state.url;
   frame.querySelector('.native-stat-full-image img').src=state.url;
  }else{
   frame.innerHTML='<img alt="'+safe(alt)+'" draggable="false" loading="eager">';
   frame.querySelector('img').src=state.url;
  }
  return true;
 };
 const displayVerified=async()=>{
  const {host,key,info,base}=active;
  const frame=host.querySelector('.native-stat-image');
  const proof=info.verified_source;
  host.querySelector('.native-stat-body').innerHTML=proof.kind==='ocr_original_row'
   ?'<p class="native-evidence-note">Quellzeile aus dem ursprünglichen OCR-Import · '+
     safe(info.captured_at.slice(0,10))+' · '+safe(proof.id)+
     '. Name und Punkte wurden mit der originalen Bildposition abgeglichen.'+
     (proof.visually_checked?' Die Zeile wurde zusätzlich visuell geprüft.':'')+'</p>'
   :'<p class="native-evidence-note">Von einem Officer geprüfter Originalbeleg · '+safe(info.captured_at.slice(0,10))+'</p>';
  frame.textContent='Originalbild wird geladen …';
  try{await loadImage(base+'/image',info.verified_source.sha256,frame,
   'Privater Original-Screenshot zum ausgewählten Spielerwert',info.verified_source)}
  catch(e){frame.textContent=e.message}
 };
 const candidate=async(index)=>{
  if(!active)return;
  const state=active,items=state.info.candidates;
  if(!items.length)return;
  state.index=Math.max(0,Math.min(index,items.length-1));
  state.verifiedPreview=false;
  const current=items[state.index];
  const host=state.host;
  host.querySelector('.native-stat-candidate-count').textContent=(state.index+1)+' / '+items.length;
  host.querySelector('[data-native-stat-prev]').disabled=state.index===0;
  host.querySelector('[data-native-stat-next]').disabled=state.index===items.length-1;
  host.querySelector('[data-native-stat-link]').disabled=true;
  const part=current.id.slice(state.info.metric.length+1);
  const url='/api/profile-captures/'+encodeURIComponent(state.info.metric)+'/'+encodeURIComponent(part)+'/image';
  try{
   const ok=await loadImage(url,current.sha256,host.querySelector('.native-stat-image'),
    'Prüfkandidat '+(state.index+1)+' (noch keinem Spieler zugeordnet)');
   if(ok&&active===state){
    state.verifiedPreview=true;
    host.querySelector('[data-native-stat-link]').disabled=false;
   }
  }catch(e){if(active===state)host.querySelector('.native-stat-image').textContent=e.message}
 };
 const open=async(target,key)=>{
  const match=validKey(key);if(!match)return;
  close(target);
  const [,snap,member,metric]=match,base=PATH(snap,member,metric);
  const host=target.ownerDocument.createElement('section');
  host.id='native-stat-evidence-viewer';
  host.className='native-vs-evidence-backdrop';
  host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');
  host.setAttribute('aria-label','Privater Screenshot zur Spielerwertung');
  host.innerHTML='<div class="native-vs-evidence-panel native-stat-evidence-panel">'+
   '<div class="native-row"><h3>Original-Screenshot zum Spielerwert</h3>'+
   '<button type="button" data-native-stat-close>Bild schließen ✕</button></div>'+
   '<p class="native-muted">Nur für angemeldete Offiziere. Bilder bleiben privat.</p>'+
   '<div class="native-stat-image" role="status">Originalquelle wird geprüft …</div>'+
   '<div class="native-stat-body"></div></div>';
  target.append(host);
  active={host,key,base,url:null,verifiedPreview:false,index:0,info:null};
  host.querySelector('[data-native-stat-close]')?.focus();
  try{
   const info=await request(base);
   if(!active||active.host!==host)return;
   active.info=info;
   if(info.verified_source)return await displayVerified();
   if(!info.candidates.length){
    host.querySelector('.native-stat-image').textContent='Für diesen Spielerwert ist noch kein verifizierter Original-Screenshot zugeordnet.';
    host.querySelector('.native-stat-body').textContent='Es wurden keine passenden Quellaufnahmen für diesen Erfassungstag gefunden.';
    return;
   }
   host.querySelector('.native-stat-body').innerHTML=
    '<p class="native-evidence-note">Noch nicht zugeordnet: '+info.candidates.length+
    ' Originalaufnahmen dieses Tages. Erst den Spielernamen und den genauen Wert im Bild abgleichen.</p>'+
    '<button type="button" data-native-stat-browse>Manuell Originalaufnahmen durchsuchen</button>'+
    '<div class="native-row"><button type="button" data-native-stat-prev disabled>← Vorheriges</button>'+
    '<span class="native-stat-candidate-count"></span>'+
    '<button type="button" data-native-stat-next>Nächstes →</button></div>'+
    '<label>Grund / überprüfte Spielerzeile<input class="native-stat-reason" minlength="8" maxlength="300" required '+
    'value="Spielername und Wochenwert im Originalbild geprüft"></label>'+
    '<button type="button" data-native-stat-link disabled>Diesen Screenshot nach Prüfung zuordnen</button>'+
    '<p class="native-stat-message" role="status"></p>';
   host.querySelector('.native-stat-image').textContent=
    'Kein eindeutig zugeordneter Spielerbeleg. Die Screenshots desselben Tages werden NICHT automatisch geöffnet.';
   host.querySelector('[data-native-stat-link]').disabled=true;
  }catch(error){if(active?.host===host)host.querySelector('.native-stat-image').textContent=
   'Originalbeleg konnte nicht geladen werden: '+error.message}
 };
 const step=async(delta)=>{if(active?.info)await candidate(active.index+delta)};
 const link=async()=>{
  const s=active;
  if(!s?.verifiedPreview||!s.info?.candidates?.[s.index])return;
  const current=s.info.candidates[s.index];
  const reason=s.host.querySelector('.native-stat-reason')?.value.trim()||'';
  const message=s.host.querySelector('.native-stat-message');
  if(reason.length<8||reason.length>300){message.textContent='Bitte begründen (8–300 Zeichen).';return}
  if(!window.confirm('Stimmen Spielername UND exakter Wert mit der sichtbaren Zeile auf diesem Bild überein?'))return;
  const btn=s.host.querySelector('[data-native-stat-link]');btn.disabled=true;
  message.textContent='Verifizierter Originalbeleg wird zugeordnet …';
  try{
   await request(s.base+'/link',{method:'POST',body:{capture_id:current.id,sha256:current.sha256,reason}});
   if(active===s)await open(s.host.parentElement,s.key);
  }catch(error){if(active===s){message.textContent='Nicht zugeordnet: '+error.message;btn.disabled=false}}
 };
 return {open,close,step,link};
}
