import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { createPublicServer } from '../scripts/serve.js';
test('all public assets, including i18n, are served; private paths are not',async()=>{
  const server=createPublicServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  try {
    const assets=(await readdir(new URL('../assets/',import.meta.url),{withFileTypes:true})).filter(item=>item.isFile()).map(item=>item.name);
    for (const file of assets) assert.equal((await fetch(url+'/assets/'+file)).status,200,file);
    const images=await readdir(new URL('../assets/member/',import.meta.url));
    for (const file of images) {
      const response=await fetch(url+'/assets/member/'+file);
      assert.equal(response.status,200,file);assert.equal(response.headers.get('content-type'),'image/webp');
    }
    for (const path of ['/private/wiki.html','/.git/config','/assets/../private/wiki.html','/admin/private/wiki.html','/admin/server.mjs']) assert.equal((await fetch(url+path)).status,404,path);
    const adminShell=await (await fetch(url+'/admin/')).text();
    assert.ok(adminShell.includes('id="unlock-form"'),'admin route serves only the password shell');
    assert.ok(!adminShell.includes('Operation KABUM'),'admin content is not present in the password shell');
    const manifest=await (await fetch(url+'/admin/data/manifest.json')).json();
    assert.equal(manifest.kdf.iterations,600000,'encrypted package uses the required PBKDF2 work factor');
    assert.equal(Object.keys(manifest.files.images).length,29,'all admin images are encrypted');
    const encryptedWiki=Buffer.from(await (await fetch(url+'/'+manifest.files.wiki.path)).arrayBuffer());
    assert.ok(!encryptedWiki.includes(Buffer.from('Operation KABUM')),'encrypted wiki does not expose plaintext admin content');
    const homepage=await (await fetch(url+'/')).text();
    assert.ok(!homepage.includes('#faq'),'FAQ route is removed from the public navigation');
    assert.ok(homepage.includes('id="admin-link" href="#admin"'),'HTML keeps a safe fallback for the admin link');
    assert.ok(homepage.includes('id="language-dialog"'),'first-visit setup dialog is present');
    assert.ok(homepage.includes('id="setup-language"'),'first-visit language picker has a stable native-select mount point');
    assert.ok(!homepage.includes('id="language-options"'),'first visit no longer renders the long language-button grid');
    assert.ok(homepage.includes('id="theme-options"'),'first visit includes explicit light/dark choices');
    assert.ok(homepage.includes('id="setup-continue"'),'setup has an explicit continue action');
    assert.ok(homepage.includes('id="theme-toggle"'),'header has a theme icon toggle');
    assert.ok(!homepage.includes('id="theme"'),'old theme select is removed');
    const appSource=await (await fetch(url+'/assets/app.js')).text();
    const cssSource=await (await fetch(url+'/assets/hub.css')).text();
    const configSource=await (await fetch(url+'/assets/config.js')).text();
    assert.ok(configSource.includes("adminUrl: '/admin/'"),'static build points at the encrypted admin route');
    assert.ok(!appSource.includes("'vs-sunday-prep'"),'Sunday VS renders only the primary guide image');
    for (const id of ['season-day-one','season-virus-research','season-protein-farm','season-additional-tips']) {
      assert.ok(appSource.includes(id),`${id} is included in the public guide library`);
    }
    assert.ok(appSource.includes('data-guide-image') && appSource.includes('dataset.retried'),'guide images retry once before showing a fallback');
    assert.ok(appSource.includes('setupThemeChosen') && appSource.includes("activeTheme==='dark'?'light':'dark'"),'theme setup and icon toggle logic are shipped');
    assert.ok(appSource.includes('navigator.languages') && appSource.includes("setupLanguage.addEventListener('change'"),'first visit suggests browser language and uses the compact picker');
    assert.ok(cssSource.includes('.setup-language-select') && cssSource.includes('@media(max-width:39.99rem){.language-dialog{inset:auto 0 0'),'first-visit setup is a mobile bottom sheet with a native language picker');
    assert.ok(cssSource.includes('.theme-toggle{width:44px'),'header theme toggle keeps a mobile touch target');
    assert.ok(cssSource.includes('grid-template-columns:repeat(12,minmax(0,1fr))'),'mobile VS days use a non-scrolling grid');
    assert.ok(!cssSource.includes('.week-selector{display:flex'),'the old horizontal VS slider is removed');
  } finally {await new Promise(resolve=>server.close(resolve));}
});
