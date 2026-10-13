import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createPublicServer} from '../scripts/serve.js';

const worker='https://rzsn-command-center-staging.cynthiawong2837128.workers.dev/';

test('Lunas Empire admin entry is only a redirect; no private database or demo bundle is published',async()=>{
 const dir=new URL('../command-center/',import.meta.url);
 const names=await readdir(dir);
 assert.deepEqual(names,['index.html']);
 const html=await readFile(new URL('index.html',dir),'utf8');
 assert.ok(html.includes('http-equiv="refresh"'));
 assert.ok(html.includes(worker));
 assert.ok(html.includes('passwortgeschützten Adminbereich'));
 assert.ok(!html.includes('Demo Orion'));
 assert.ok(!html.includes('officer_credentials'));
});

test('Lunas staging opens the protected Worker while RZSN production keeps the legacy wiki',async()=>{
 const config=await readFile(new URL('../assets/config.js',import.meta.url),'utf8');
 const homepage=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(config.includes(worker));
 assert.ok(config.includes("? '/admin/' :"));
 assert.ok(homepage.includes('id="admin-link" href="#admin"'));
 assert.ok(config.includes('commandCenterEmbedUrl'));
 const hubApp=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');
 assert.ok(hubApp.includes('native-officer-root'));
 assert.ok(hubApp.includes("import('./native-admin.js')"));
 assert.ok(!homepage.includes('officer_credentials'));
 const server=createPublicServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  assert.equal((await fetch(base+'/command-center/')).status,200);
  for(const name of ['app.js','demo-api.js','review-ui.js','styles.css','tokens.css','sun.svg']){
   assert.equal((await fetch(base+'/command-center/'+name)).status,404,name);
  }
  const legacy=await (await fetch(base+'/admin/')).text();
  assert.ok(legacy.includes('id="unlock-form"'));
 }finally{await new Promise(resolve=>server.close(resolve))}
});
