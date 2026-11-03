/** Shared private proof rendering for weekly donations and VS day measurements. */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderEvidenceRow(frame,blobUrl,source,alt,alive=()=>true){
 if(!source||!Number.isInteger(source.row_y)||source.row_y<0||source.row_y>659){
  frame.innerHTML='<img alt="'+esc(alt)+'" draggable="false" loading="eager">';
  frame.querySelector('img').src=blobUrl;return;
 }
 frame.innerHTML='<p class="native-stat-row-identity"><strong>'+esc(source.member_name||source.source_name)+'</strong> · '+
  new Intl.NumberFormat('de-DE').format(source.source_value)+' Punkte</p>'+
  '<div class="native-stat-row-window"><img alt="'+esc(alt)+'" draggable="false" loading="eager"></div>'+
  '<details class="native-stat-full-image"><summary>Vollständigen Screenshot ansehen</summary>'+
  '<img alt="Vollständiger privater Original-Screenshot" loading="lazy"></details>';
 const box=frame.querySelector('.native-stat-row-window'),picture=box.querySelector('img');
 picture.addEventListener('load',()=>{
  if(!alive()||!picture.naturalWidth||!picture.naturalHeight)return;
  const width=Math.min(picture.naturalWidth,Math.max(140,box.clientWidth));
  const scale=width/picture.naturalWidth;
  const region=Math.min(160,picture.naturalHeight);
  const start=Math.max(0,Math.min(picture.naturalHeight-region,source.row_y-region/2));
  box.style.height=Math.ceil(region*scale)+'px';
  picture.style.width=width+'px';
  picture.style.top=(-Math.round(start*scale))+'px';
  box.classList.add('ready');
 },{once:true});
 picture.src=blobUrl;
 frame.querySelector('.native-stat-full-image img').src=blobUrl;
}
