import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';
import { BUILD_VERSION_BASE } from '../assets/config.js';

test('new HTML avoids cached pre-update modules throughout the module graph',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const mapText=html.match(/<script type="importmap" id="release-imports">(.*?)<\/script>/s)?.[1];
  const imports=JSON.parse(mapText).imports;
  const modules=(await readdir(new URL('../assets/',import.meta.url))).filter(name=>name.endsWith('.js'));
  const entry=html.match(/<script type="module" src="(.*?)"/)[1];
  assert.ok(html.indexOf('release-imports')<html.indexOf('type="module"'));
  assert.equal(entry,imports['/assets/app.js']);
  const stale=new Map(modules.map(name=>[`https://lunas-empire.github.io/assets/${name}`,new Response('OLD MODULE')]));
  // The previous worker served cache first while refreshing in the background.
  const handlers={};
  vm.runInNewContext(`self.addEventListener('fetch',event=>event.respondWith(caches.match(event.request).then(cached=>{const network=fetch(event.request);return cached || network;})));`,{
    self:{addEventListener:(name,handler)=>handlers[name]=handler},
    caches:{match:async request=>stale.get(request.url)},fetch:async()=>new Response('CURRENT MODULE')
  });
  async function throughOldWorker(path) {
    let result;handlers.fetch({request:{url:new URL(path,'https://lunas-empire.github.io').href},respondWith:response=>result=response});
    return (await result).text();
  }
  assert.equal(await throughOldWorker('/assets/app.js'),'OLD MODULE','control reproduces the old cache failure');
  assert.equal(await throughOldWorker(entry),'CURRENT MODULE');
  for(const name of modules) {
    const path=imports[`/assets/${name}`];
    assert.equal(new URL(path,'https://lunas-empire.github.io').searchParams.get('v'),BUILD_VERSION_BASE);
    assert.equal(await throughOldWorker(path),'CURRENT MODULE',name);
  }
  const worker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
  for(const path of Object.values(imports)) assert.ok(worker.includes(path),`offline shell: ${path}`);
  const css=await readFile(new URL('../assets/hub.css',import.meta.url),'utf8');
  assert.ok(css.includes(`tokens.css?v=${BUILD_VERSION_BASE}`),'transitive stylesheet also misses old cache');
});
