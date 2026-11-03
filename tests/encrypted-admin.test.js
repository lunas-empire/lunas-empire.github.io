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
  dom.window.eval(shellApp);
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
    assert.equal(frame.src,'https://rzsn-command-center-staging.cynthiawong2837128.workers.dev/?embed=1');
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
