/** Read-only absence and scheduling warnings for existing officer operations. */
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderImpactWarnings(warnings=[],language="de"){
 const rows=Array.isArray(warnings)?warnings:[];
 const de=language==='de';
 const title=de?'Auswirkungen prüfen':'Review impacts';
 const help=de?'Nur Hinweise. Aufgaben und Planungen werden nicht automatisch geändert.':'Advisory only. Tasks and plans are never changed automatically.';
 const empty=de?'Keine bekannten Terminkonflikte.':'No known scheduling conflicts.';
 return '<section class="native-impact-warnings" aria-label="'+escapeHtml(title)+'"><h3>'+escapeHtml(title)+'</h3><p class="native-muted">'+escapeHtml(help)+'</p>'+(rows.length?'<ul>'+rows.map(item=>'<li><strong>'+escapeHtml(item.member_name||'Unbekannt')+'</strong> · '+escapeHtml(item.date||'')+' · '+escapeHtml(item.related_title||item.kind||'')+' · '+escapeHtml(item.role||'')+'</li>').join('')+'</ul>':'<p>'+escapeHtml(empty)+'</p>')+'</section>';
}