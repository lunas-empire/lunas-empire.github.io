import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
test('narrow officer navigation retains visible labels and alerts wrap instead of clipping',async()=>{
 const css=await readFile(new URL('../assets/hub.css',import.meta.url),'utf8');
 assert.match(css,/@media\(max-width:359px\)\{[\s\S]*?\.native-admin \.native-admin-nav \.native-primary-tab span\{[^}]*overflow-wrap:anywhere/);
 assert.match(css,/\.native-admin \.native-command-alerts button\{white-space:normal\}/);
 assert.match(css,/\.native-admin \.native-command-next-row b\{[^}]*overflow-wrap:anywhere/);
});
