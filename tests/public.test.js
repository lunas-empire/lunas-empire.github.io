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
    for (const path of ['/admin/','/private/wiki.html','/.git/config','/assets/../private/wiki.html']) assert.equal((await fetch(url+path)).status,404,path);
    const homepage=await (await fetch(url+'/')).text();
    assert.ok(!homepage.includes('#faq'),'FAQ route is removed from the public navigation');
    assert.ok(homepage.includes('id="language-dialog"'),'first-visit language dialog is present');
    assert.ok(homepage.includes('id="language-options"'),'language choices have a stable mount point');
  } finally {await new Promise(resolve=>server.close(resolve));}
});
