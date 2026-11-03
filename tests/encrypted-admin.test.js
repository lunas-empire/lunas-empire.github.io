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
    async openNativeReviews(){},
    initNativeAdmin(mount){dom.window.__nativeCalls.init++;mount.dataset.nativeReady='1';},
    async renderNativeAdmin(mount){dom.window.__nativeCalls.render++;mount.innerHTML='<form id="native-officer-login"><input type="password" name="code"></form>';}
  });
  dom.window.__redirects=[];
  dom.window.eval(shellApp.replaceAll('location.replace(', 'window.__redirects.push(').replace("import('/assets/native-admin.js')","window.__loadNative()"));
  return dom;
}
test('Luna legacy links alias the root native view and wiki stays archival',async()=>{
 for(const hash of ['overview','review','wissen']){
  const dom=shellAt('https://lunas-empire.github.io/admin/#'+hash);
  const doc=dom.window.document;
  assert.equal(doc.querySelector('iframe'),null);
  assert.equal(doc.querySelector('[data-view]'),null);
  assert.equal(dom.window.__nativeCalls.init,0);
  assert.deepEqual([...dom.window.__redirects],hash==='wissen'?[]:[hash==='review'?'/#admin-review':'/#admin']);
  assert.match(doc.querySelector('[http-equiv="Content-Security-Policy"]').content,/frame-src 'none'/);
  const csp=doc.querySelector('[http-equiv="Content-Security-Policy"]').content;
  assert.match(csp,/script-src 'self';/);
  assert.match(csp,/connect-src 'self' https:\/\/rzsn-staging-api-bridge\.pages\.dev;/);
  assert.match(csp,/img-src 'self' blob:/);
  if(hash==='wissen')assert.equal(doc.querySelector('#wiki-panel').hidden,false);
  dom.window.close();
 }
 for(const host of ['rzsn-home.github.io','example.org','lunas-empire.github.io.example.org']){
  const dom=shellAt(`https://${host}/admin/#review`);
  assert.equal(dom.window.document.querySelector('#commander-shell').hidden,true);
  assert.equal(dom.window.document.querySelector('#wiki-panel').hidden,false);
  assert.equal(dom.window.document.querySelector('#login-title').textContent,'R4/R5 Admin');
  assert.equal(dom.window.document.querySelector('iframe'),null);
  dom.window.close();
 }
});

test('wiki runtime preserves decryption and provides same-route return links',()=>{
  assert.match(shellApp,/deriveAdminKey\(password,manifest\)/);
  assert.match(shellApp,/decryptAdminBytes\(encryptedWiki,manifest.files.wiki,key\)/);
  assert.match(shellApp,/href="\/#admin"/);
  assert.match(shellApp,/href="\/#admin-review"/);
  assert.match(shellApp,/document\.open\(\);\s*document\.write\(html\);\s*document\.close\(\)/);
});

test('hub uses its native route while production retains the encrypted archive',async()=>{
 const config=await readFile(new URL('../assets/config.js',import.meta.url),'utf8');
 const app=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');
 assert.ok(config.includes("globalThis.location?.hostname===productionHost ? '/admin/' : '#admin'"));
 assert.ok(!app.includes("location.replace('/admin/')"));
 assert.match(app,/nativeReview\?'#admin':location.hash/);
 assert.match(app,/if\(nativeReview&&\(!retainedMount\|\|!preserve\)\)\{\s*await mod.openNativeReviews\(mount\)/);
 assert.match(app,/if\(!retainedMount\) main.innerHTML/);
});
