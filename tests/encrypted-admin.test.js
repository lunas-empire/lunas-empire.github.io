import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildEncryptedAdmin } from '../scripts/build-admin.js';
import { deriveAdminKey, decryptAdminBytes } from '../admin/crypto.js';

test('encrypted admin package interoperates with browser crypto and rejects a wrong password',async()=>{
  const temporary=await mkdtemp(join(tmpdir(),'rzsn-admin-'));
  const source=join(temporary,'source');
  const output=join(temporary,'data');
  const password='0123456789';
  try {
    await mkdir(join(source,'images'),{recursive:true});
    await writeFile(join(source,'wiki.html'),'<h1>private admin fixture</h1>');
    await writeFile(join(source,'images','image.png'),Buffer.from([137,80,78,71]));
    const manifest=await buildEncryptedAdmin({password,sourceDir:source,outputDir:output});
    const ciphertext=await readFile(join(temporary,manifest.files.wiki.path));
    assert.ok(!ciphertext.includes(Buffer.from('private admin fixture')),'plaintext is absent from encrypted output');
    const key=await deriveAdminKey(password,manifest);
    const plaintext=await decryptAdminBytes(ciphertext,manifest.files.wiki,key);
    assert.equal(new TextDecoder().decode(plaintext),'<h1>private admin fixture</h1>');
    const wrongKey=await deriveAdminKey('this password is definitely wrong',manifest);
    await assert.rejects(decryptAdminBytes(ciphertext,manifest.files.wiki,wrongKey));
    assert.ok(!JSON.stringify(manifest).includes(password),'manifest never contains the password');
  } finally {
    await rm(temporary,{recursive:true,force:true});
  }
});

// Exercise the real shell controller without private data or Worker requests.
import { JSDOM } from 'jsdom';
const shellHtml=await readFile(new URL('../admin/index.html',import.meta.url),'utf8');
const shellApp=(await readFile(new URL('../admin/app.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/,'');
function shellAt(url) {
  const dom=new JSDOM(shellHtml,{url,runScripts:'outside-only'});
  dom.window.__nativeCalls={init:0,render:0};
  dom.window.__loadNative=()=>Promise.resolve({
    initNativeAdmin(mount){dom.window.__nativeCalls.init++;mount.dataset.nativeReady='1';},
    async renderNativeAdmin(mount){dom.window.__nativeCalls.render++;mount.innerHTML='<form id="native-officer-login"><input type="password" name="code"></form>';}
  });
  dom.window.eval(shellApp.replace("import('/assets/native-admin.js')","window.__loadNative()"));
  return dom;
}
test('single staging frame, constrained CSP/sandbox, deep links and keyboard tabs',async()=>{
  const dom=shellAt('https://lunas-empire.github.io/admin/#review');
  try {
    const {document}=dom.window;
    const frame=document.querySelector('iframe');
    assert.equal(document.querySelectorAll('iframe').length,1);
    assert.equal(frame.src,'https://rzsn-command-center-staging.cynthiawong2837128.workers.dev/?embed=1#review');
    assert.equal(frame.getAttribute('referrerpolicy'),'no-referrer');
    assert.equal(frame.getAttribute('sandbox'),'allow-scripts allow-forms allow-same-origin allow-downloads');
    const csp=document.querySelector('[http-equiv="Content-Security-Policy"]').content;
    assert.match(csp,/script-src 'self';/);
    assert.match(csp,/frame-src https:\/\/rzsn-command-center-staging\.cynthiawong2837128\.workers\.dev$/);
    const review=document.querySelector('#tab-review');
    assert.equal(review.getAttribute('aria-selected'),'true');
    review.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    await new Promise(resolve=>setTimeout(resolve,10));
    assert.equal(document.activeElement.id,'tab-wissen');
    assert.equal(document.querySelector('#wiki-panel').hidden,false);
    assert.equal(document.querySelector('#worker-panel').hidden,true);
    assert.equal(dom.window.location.pathname,'/admin/');
    document.querySelector('#tab-overview').click();
    await new Promise(resolve=>setTimeout(resolve,10));
    assert.equal(frame.src,'https://rzsn-command-center-staging.cynthiawong2837128.workers.dev/?embed=1#review');
    assert.equal(document.querySelector('#native-panel').hidden,false);
    assert.equal(document.querySelector('#worker-panel').hidden,true);
    assert.equal(dom.window.__nativeCalls.init,1);
  } finally {dom.window.close();}
});
test('wiki deep link is lazy; production and unknown hosts retain encrypted entry',()=>{
  for (const host of ['lunas-empire.github.io','localhost','127.0.0.1']) {
    const dom=shellAt(`https://${host}/admin/#wissen`);
    assert.equal(dom.window.document.querySelector('#wiki-panel').hidden,false);
    assert.equal(dom.window.document.querySelector('iframe').hasAttribute('src'),false);
    dom.window.close();
  }
  for (const host of ['rzsn-home.github.io','example.org','lunas-empire.github.io.example.org']) {
    const dom=shellAt(`https://${host}/admin/#review`);
    const doc=dom.window.document;
    assert.equal(doc.querySelector('#commander-shell').hidden,true);
    assert.equal(doc.querySelector('iframe').hasAttribute('src'),false);
    assert.equal(doc.querySelector('#wiki-panel').hidden,false);
    assert.equal(doc.querySelector('#login-title').textContent,'R4/R5 Admin');
    dom.window.close();
  }
});
test('wiki runtime preserves decryption and provides same-route return links',()=>{
  assert.match(shellApp,/deriveAdminKey\(password,manifest\)/);
  assert.match(shellApp,/decryptAdminBytes\(encryptedWiki,manifest.files.wiki,key\)/);
  assert.match(shellApp,/href="\/admin\/#overview"/);
  assert.match(shellApp,/href="\/admin\/#review"/);
  assert.match(shellApp,/document\.open\(\);\s*document\.write\(html\);\s*document\.close\(\)/);
});

test('hub menu and legacy admin hash resolve to the sole Commander Center route',async()=>{
  const config=await readFile(new URL('../assets/config.js',import.meta.url),'utf8');
  const app=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');
  assert.ok(config.includes("'lunas-empire.github.io',productionHost"));
  assert.ok(config.includes("? '/admin/' : '#admin'"));
  assert.ok(app.includes("if (route.view==='admin' && ['lunas-empire.github.io','localhost','127.0.0.1','[::1]'].includes(location.hostname)) { location.replace('/admin/'); return; }"));
});

test('native overview is initialized once and keeps its mount while reviews load once',async()=>{
  const dom=shellAt('https://lunas-empire.github.io/admin/#overview');
  const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
  try {
    await tick();
    const doc=dom.window.document,frame=doc.querySelector('iframe');
    assert.equal(frame.hasAttribute('src'),false,'overview must not load Worker');
    assert.deepEqual({...dom.window.__nativeCalls},{init:1,render:1});
    const login=doc.querySelector('#native-officer-login');
    login.querySelector('input').value='unsent-local-test';
    let loads=0;
    const observer=new dom.window.MutationObserver(records=>{loads+=records.filter(r=>r.attributeName==='src').length;});
    observer.observe(frame,{attributes:true});
    for (const id of ['review','wissen','overview','review','overview']) {
      doc.querySelector('#tab-'+id).click();
      await tick();
    }
    assert.equal(loads,1,'review iframe is retained, never navigated on tab return');
    assert.equal(doc.querySelector('#native-officer-login'),login,'native mount is never replaced');
    assert.equal(login.querySelector('input').value,'unsent-local-test');
    assert.deepEqual({...dom.window.__nativeCalls},{init:1,render:1});
    observer.disconnect();
    assert.ok(shellHtml.indexOf('/assets/hub.css')<shellHtml.indexOf('href="styles.css"'));
    assert.match(shellApp,/import\('\/assets\/native-admin\.js'\)/);
    const csp=doc.querySelector('[http-equiv="Content-Security-Policy"]').content;
    assert.match(csp,/connect-src 'self' https:\/\/rzsn-staging-api-bridge\.pages\.dev;/);
    assert.match(csp,/img-src 'self' blob:/);
  } finally {dom.window.close();}
});
