import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createPublicServer} from '../scripts/serve.js';
import {demoApi,demoMembers,demoOverview} from '../command-center/demo-api.js';

test('public preview uses only synthetic members and never allows writes',async()=>{
 assert.equal(demoOverview.active,demoMembers.length);
 assert.ok(demoMembers.length>=10);
 assert.ok(demoMembers.every(m=>m.name.startsWith('Demo ')));
 assert.ok(demoMembers.every(m=>m.id.startsWith('demo-')));
 assert.equal((await demoApi('members?search=orion')).length,1);
 assert.equal((await demoApi('member/demo-02')).member.name,'Demo Orion');
 assert.equal((await demoApi('reviews?status=open')).length,5);
 assert.equal((await demoApi('reviews?status=approved')).length,1);
 assert.equal((await demoApi('trains')).length,7);
 await assert.rejects(demoApi('review/demo-r01',{method:'POST'}),/schreibgeschützt/);
 await assert.rejects(demoApi('member/not-found'),/nicht gefunden/);
});
test('demo static bundle never copies the live database, officer codes or login',async()=>{
 const base=new URL('../command-center/',import.meta.url);
 const names=await readdir(base);
 assert.deepEqual(names.sort(),['app.js','demo-api.js','index.html','review-ui.js','styles.css','sun.svg','tokens.css'].sort());
 const app=await readFile(new URL('app.js',base),'utf8');
 const html=await readFile(new URL('index.html',base),'utf8');
 assert.ok(html.includes('FIKTIVE BEISPIELDATEN'));
 assert.ok(html.includes('./app.js')&&html.includes('./styles.css'));
 assert.ok(!app.includes('tryRemoteSession()'));
 assert.ok(!app.includes("fetch('/api/"));
 assert.ok(app.includes("let secret='demo'"));
 assert.ok(!app.includes("isReadOnly:()=>false"));
 assert.ok(!html.includes('cynthiawong2837128'));
});
test('Lunas Empire serves the complete public demo and keeps legacy encrypted wiki intact',async()=>{
 const server=createPublicServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  for(const name of ['','index.html','app.js','demo-api.js','review-ui.js','styles.css','tokens.css','sun.svg']){
   const r=await fetch(base+'/command-center/'+name);
   assert.equal(r.status,200,'Demo asset '+name);
  }
  const home=await (await fetch(base+'/')).text();
  assert.ok(home.includes('href="/command-center/"'));
  const legacy=await (await fetch(base+'/admin/')).text();
  assert.ok(legacy.includes('id="unlock-form"'));
  assert.ok(!legacy.includes('FIKTIVE BEISPIELDATEN'));
 }finally{await new Promise(resolve=>server.close(resolve))}
});
