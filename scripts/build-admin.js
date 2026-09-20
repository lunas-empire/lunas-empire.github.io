import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultSource=fileURLToPath(new URL('../../admin-service/private/',import.meta.url));
const defaultOutput=fileURLToPath(new URL('../admin/data/',import.meta.url));
const iterations=600000;

const encodeBase64=value=>Buffer.from(value).toString('base64');

function encrypt(bytes,key,aad) {
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key,iv,{authTagLength:16});
  cipher.setAAD(Buffer.from(aad,'utf8'));
  const ciphertext=Buffer.concat([cipher.update(bytes),cipher.final(),cipher.getAuthTag()]);
  return {ciphertext,iv:encodeBase64(iv),aad};
}

export async function buildEncryptedAdmin({password,sourceDir=defaultSource,outputDir=defaultOutput}={}) {
  if (typeof password!=='string' || password.length<20 || password.length>128) throw new Error('ADMIN_PASSWORD must contain 20 to 128 characters.');
  if (basename(resolve(outputDir))!=='data') throw new Error('Encrypted output directory must be named data.');
  const wiki=await readFile(join(sourceDir,'wiki.html'));
  const imageDirectory=join(sourceDir,'images');
  const imageNames=(await readdir(imageDirectory)).filter(name=>/^(?:image|\d+)\.(?:png|jpg)$/.test(name)).sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
  if (!imageNames.length) throw new Error('No admin images found.');
  const salt=randomBytes(16);
  const key=pbkdf2Sync(password,salt,iterations,32,'sha256');
  await rm(outputDir,{recursive:true,force:true});
  await mkdir(join(outputDir,'images'),{recursive:true});
  const encryptedWiki=encrypt(wiki,key,'wiki.html');
  await writeFile(join(outputDir,'wiki.bin'),encryptedWiki.ciphertext);
  const images={};
  for (const name of imageNames) {
    const encrypted=encrypt(await readFile(join(imageDirectory,name)),key,`images/${name}`);
    const outputName=`${name}.bin`;
    await writeFile(join(outputDir,'images',outputName),encrypted.ciphertext);
    images[name]={path:`data/images/${outputName}`,iv:encrypted.iv,aad:encrypted.aad,mime:extname(name)==='.png'?'image/png':'image/jpeg'};
  }
  const manifest={
    version:1,
    kdf:{name:'PBKDF2',hash:'SHA-256',iterations,salt:encodeBase64(salt)},
    cipher:{name:'AES-GCM',length:256,tagLength:128},
    files:{wiki:{path:'data/wiki.bin',iv:encryptedWiki.iv,aad:encryptedWiki.aad,mime:'text/html; charset=utf-8'},images},
  };
  await writeFile(join(outputDir,'manifest.json'),`${JSON.stringify(manifest,null,2)}\n`,'utf8');
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  await buildEncryptedAdmin({password:process.env.ADMIN_PASSWORD});
  console.log('Encrypted admin package written: wiki and images only, no password stored.');
}
