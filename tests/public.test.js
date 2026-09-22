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
    const memberDir=new URL('../assets/member/',import.meta.url);
    const memberEntries=await readdir(memberDir,{withFileTypes:true});
    for (const item of memberEntries.filter(item=>item.isFile())) {
      const response=await fetch(url+'/assets/member/'+item.name);
      assert.equal(response.status,200,item.name);assert.equal(response.headers.get('content-type'),'image/webp');
    }
    const seasonMaster=await readdir(new URL('../assets/member/season-master/',import.meta.url));
    assert.equal(seasonMaster.length,29,'all Season 1 master images are public guide assets');
    for (const file of seasonMaster) {
      const response=await fetch(url+'/assets/member/season-master/'+file);
      assert.equal(response.status,200,file);assert.equal(response.headers.get('content-type'),'image/webp');
    }
    for (const path of ['/private/wiki.html','/.git/config','/assets/../private/wiki.html','/admin/private/wiki.html','/admin/server.mjs']) assert.equal((await fetch(url+path)).status,404,path);
    const adminShell=await (await fetch(url+'/admin/')).text();
    const adminTheme=await (await fetch(url+'/admin/wiki-theme.css')).text();
    const adminApp=await (await fetch(url+'/admin/app.js')).text();
    assert.ok(adminShell.includes('id="unlock-form"'),'admin route serves only the password shell');
    assert.ok(!adminShell.includes('Operation KABUM'),'admin content is not present in the password shell');
    assert.ok(adminTheme.includes('.admin-runtime-bar') && adminTheme.includes('.card'),'decrypted admin wiki has a robust dashboard fallback theme');
    assert.ok(adminApp.includes('wiki-theme.css') && adminApp.includes('Command Center'),'admin unlock injects the dashboard shell and fallback stylesheet');
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
    assert.ok(!homepage.includes('id="language-options"'),'first visit does not render the old language-button wall');
    assert.ok(homepage.includes('id="theme-options"'),'first visit includes explicit light/dark choices');
    assert.ok(homepage.includes('id="setup-continue"'),'setup has an explicit continue action');
    assert.ok(homepage.includes('id="theme-toggle"'),'header has a theme icon toggle');
    assert.ok(!homepage.includes('id="theme"'),'old theme select is removed');
    const appSource=await (await fetch(url+'/assets/app.js')).text();
    const cssSource=await (await fetch(url+'/assets/hub.css')).text();
    const configSource=await (await fetch(url+'/assets/config.js')).text();
    const seasonLibrarySource=await (await fetch(url+'/assets/season-library.js')).text();
    assert.ok(configSource.includes("adminUrl: '/admin/'"),'static build points at the encrypted admin route');
    assert.ok(!appSource.includes("'vs-sunday-prep'"),'Sunday VS renders only the primary guide image');
    assert.ok(appSource.includes('SEASON_LIBRARY_GUIDES') && appSource.includes('seasonLibraryDisclosure'),'app renders the complete Season guide library');
    for (const id of ['basics','virus','weather','farmsVri','purge','serum','cityClash','weapons','wishHero','mason','legion','troopBoost','outposts','warDeclaration','octagon','builder','profession','rewards']) {
      assert.ok(seasonLibrarySource.includes(`${id}:`),`${id} is included in the Season 1 guide library`);
    }
    assert.ok(appSource.includes('data-guide-image') && appSource.includes('dataset.retried'),'guide images retry once before showing a fallback');
    assert.ok(appSource.includes('setupThemeChosen') && appSource.includes("activeTheme==='dark'?'light':'dark'"),'theme setup and icon toggle logic are shipped');
    assert.ok(appSource.includes('navigator.languages'),'fresh visits detect a supported browser language');
    assert.ok(appSource.includes("navigator.serviceWorker.register('/service-worker.js')"),'PWA service worker is registered');
    assert.equal((await fetch(url+'/manifest.webmanifest')).status,200,'PWA manifest is served');
    assert.equal((await fetch(url+'/service-worker.js')).status,200,'service worker is served');
    assert.ok(homepage.includes('rel="manifest" href="/manifest.webmanifest"'),'homepage links the PWA manifest');
    assert.ok(homepage.includes('id="settings-open"') && homepage.includes('id="install-app"'),'menu exposes settings and install actions');
    assert.ok(cssSource.includes('select option{background-color:var(--color-panel);color:var(--color-ink)}'),'native language options have explicit contrast in both themes');
    assert.ok(cssSource.includes('.theme-toggle{width:44px'),'header theme toggle keeps a mobile touch target');
    assert.ok(cssSource.includes('grid-template-columns:repeat(12,minmax(0,1fr))'),'mobile VS days use a non-scrolling grid');
    assert.ok(!cssSource.includes('.week-selector{display:flex'),'the old horizontal VS slider is removed');
  } finally {await new Promise(resolve=>server.close(resolve));}
});
