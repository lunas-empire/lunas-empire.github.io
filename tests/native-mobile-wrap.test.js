import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
test('narrow officer navigation retains visible labels and alerts wrap instead of clipping',async()=>{
 const css=await readFile(new URL('../assets/hub.css',import.meta.url),'utf8');
 assert.match(css,/@media\(max-width:359px\)\{[\s\S]*?\.native-admin \.native-admin-nav \.native-primary-tab span\{[^}]*overflow-wrap:anywhere/);
 assert.match(css,/\.native-admin \.native-command-alerts button\{white-space:normal\}/);
 assert.match(css,/\.native-admin \.native-command-next-row b\{[^}]*overflow-wrap:anywhere/);
});
test('mobile commander keeps navigation reachable, wraps operational rows and prevents input zoom',async()=>{
 const css=await readFile(new URL('../assets/hub.css',import.meta.url),'utf8');
 const js=await readFile(new URL('../assets/native-admin.js',import.meta.url),'utf8');
 assert.match(css,/\.native-admin \.native-operational-item>button:first-child\{[^}]*white-space:normal/);
 assert.match(css,/\.native-admin \.native-operational-item\{[^}]*min-width:0;max-width:100%/);
 assert.match(css,/\.native-admin \.native-requirement-check input\{width:24px;height:24px\}/);
 assert.match(css,/@media\(max-width:59\.99rem\)\{[\s\S]*?\.native-admin \.native-admin-nav\{position:sticky;top:0;z-index:60\}/);
 assert.match(css,/\.native-admin input:not\(\[type=checkbox\]\):not\(\[type=radio\]\),\.native-admin select,\.native-admin textarea\{font-size:16px\}/);
 assert.ok((js.match(/mount\.scrollIntoView\?\.\(\{block:'start',behavior:'auto'\}\)/g)||[]).length>=2,'tab and shortcut navigation reset scrolling');
});
