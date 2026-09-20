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
  const password='correct horse battery staple 2261';
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
