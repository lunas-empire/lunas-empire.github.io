"""Publish a SAFE public, read-only Command Center preview to Lunas Empire.

Never copies the SQLite database, OCR exports, officer codes, login or Worker config.
The public demo uses fabricated members and scores; the encrypted wiki is untouched.
"""
from pathlib import Path
from shutil import copy2
import re

root=Path(__file__).resolve().parents[1]
source=root.parent/'command-center'/'ui'
target=root/'command-center'
target.mkdir(parents=True,exist_ok=True)
for name in ('styles.css','sun.svg','review-ui.js'):
    copy2(source/name,target/name)
# Use the CURRENT Lunas Empire design tokens, not the older local preview palette.
copy2(root/'assets'/'tokens.css',target/'tokens.css')
review=(target/'review-ui.js').read_text(encoding='utf-8')
review=review.replace('Protected staging is read-only. Corrections remain in the local review workflow until secure sync is enabled.',
    'Diese öffentliche Demo ist schreibgeschützt. Echte Korrekturen werden ausschließlich im geschützten Admin-Bereich durchgeführt.')
(target/'review-ui.js').write_text(review,encoding='utf-8')

html=(source/'index.html').read_text(encoding='utf-8')
for old,new in (
    ('/sun.svg','./sun.svg'),
    ('/styles.css','./styles.css'),
    ('/app.js','./app.js'),
    ('<title>RZSN Command Center · Staging Preview</title>','<title>RZSN Command Center · Demo auf Lunas Empire</title>'),
    ('<span class="environment">LOCAL PREVIEW</span>','<span class="environment">ÖFFENTLICHE DEMO · BEISPIELDATEN</span>'),
):
    assert old in html,old
    html=html.replace(old,new)
html=html.replace(
    '<div class="content">',
    '<div class="demo-banner" role="status"><strong>VORSCHAU · FIKTIVE BEISPIELDATEN</strong>'
    '<span>Alle Namen, Punkte und Prüfaufträge sind erfunden. Keine echten Allianz- oder Admin-Daten. '
    'Hier kannst du die Oberfläche testen; der geschützte R4/R5-Zugang folgt separat.</span>'
    '<a href="/" aria-label="Zurück zur RZSN Startseite">← Zur Startseite</a></div>\n<div class="content">',
    1,
)
html=html.replace('<div class="auth" id="auth-panel">','<div class="auth" id="auth-panel" hidden>')
html=html.replace(
    'RZSN · Rising Sun · Server 2261 · Command Center (local preview)',
    'RZSN · Rising Sun · Server 2261 · öffentliche Vorschau ohne Echtdaten',
)
(target/'index.html').write_text(html,encoding='utf-8')

js=(source/'app.js').read_text(encoding='utf-8')
assert "import { createReviewController }" in js
js=js.replace("import { createReviewController }", "import { demoApi } from './demo-api.js';\nimport { createReviewController }",1)
js=js.replace("let secret='';","let secret='demo';",1)
js=js.replace("let authMode='local';","let authMode='demo';",1)
start=js.index('async function api(endpoint,opts={}){')
end=js.index('const names=',start)
js=js[:start]+"async function api(endpoint,opts={}){return demoApi(endpoint,opts)}\n"+js[end:]
js=js.replace("isReadOnly:()=>authMode==='code'","isReadOnly:()=>true")
js=js.replace("authMode==='code'?'Code login · verified officer':'Private localhost'","'Fiktive Daten · öffentliches Demo'")
# Remove all login and remote-session code from the public build, not merely hide it.
start=js.index("el('login').addEventListener('submit'")
js=js[:start]+"""
// PUBLIC DEMO ONLY. No authentication and no network API: all data is synthetic.
el('auth-panel').hidden=true;
el('workspace').hidden=false;
document.querySelector('.environment').textContent='DEMO · BEISPIELDATEN';
document.querySelector('.site-role').textContent='R4 / R5 · DEMO';
document.querySelector('.bottom').textContent='RZSN · Server 2261 · öffentliche Demo ohne Echtdaten';
overview().then(()=>section('overview')).catch(error=>{
  document.querySelector('#snapshot-status').textContent='Demo konnte nicht geladen werden: '+error.message;
});
"""
(target/'app.js').write_text(js,encoding='utf-8')
with (target/'styles.css').open('a',encoding='utf-8') as css:
    css.write("""
.demo-banner{display:flex;align-items:center;flex-wrap:wrap;gap:.6rem 1rem;
    width:min(calc(100% - 2rem),1024px);margin:1rem auto 0;padding:.85rem 1rem;
    background:var(--color-warning-paper);border:1px solid var(--color-warning);
    border-radius:var(--radius-md);font-size:.86rem;line-height:1.45}
.demo-banner strong{color:var(--color-warning);letter-spacing:.04em}
.demo-banner span{flex:1 1 370px}
.demo-banner a{font-weight:750;white-space:nowrap}
@media(max-width:420px){.demo-banner{align-items:flex-start}}
""")
assert all((target/x).exists() for x in ('app.js','index.html','styles.css','tokens.css','sun.svg','review-ui.js'))
print('Public synthetic Command Center demo built; no private files copied.')
