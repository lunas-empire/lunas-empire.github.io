import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Single-shell officer navigation never hides ordinary RZSN pages',()=>{
 const document=new JSDOM(read('index.html')).window.document;
 assert.equal(document.querySelectorAll('header.site-header').length,1);
 assert.equal(document.querySelectorAll('nav.main-nav').length,1);
 assert.equal(document.querySelectorAll('#admin-link[href="#admin"]').length,1);
 const app=read('assets/app.js'),css=read('assets/hub.css');
 assert.match(app,/dataset\.officerMode=String\(currentView==='admin'&&location\.hostname!=='rzsn-home\.github\.io'\)/);
 assert.match(css,/html\[data-officer-mode='true'\] \.main-nav\{display:none!important\}/);
 assert.doesNotMatch(css,/html\[data-officer-mode='false'\] \.main-nav\{display:none/);
 assert.match(css,/\.native-officer-strip\{/);
 assert.match(css,/html\[data-officer-mode='true'\] body\{/);
});
