import { deriveAdminKey, decryptAdminBytes } from './crypto.js';

const form=document.querySelector('#unlock-form');
const passwordInput=document.querySelector('#admin-password');
const submitButton=document.querySelector('#unlock-button');
const status=document.querySelector('#unlock-status');

async function fetchBytes(path) {
  const response=await fetch(path,{cache:'no-store'});
  if (!response.ok) throw new Error('Encrypted package is unavailable.');
  return response.arrayBuffer();
}

async function unlock(password) {
  const manifestResponse=await fetch('data/manifest.json',{cache:'no-store'});
  if (!manifestResponse.ok) throw new Error('Encrypted package is unavailable.');
  const manifest=await manifestResponse.json();
  const key=await deriveAdminKey(password,manifest);
  const encryptedWiki=await fetchBytes(manifest.files.wiki.path);
  const wikiBytes=await decryptAdminBytes(encryptedWiki,manifest.files.wiki,key);
  let html=new TextDecoder().decode(wikiBytes);
  const imageEntries=Object.entries(manifest.files.images);
  const objectUrls=await Promise.all(imageEntries.map(async([name,entry])=>{
    const encryptedImage=await fetchBytes(entry.path);
    const imageBytes=await decryptAdminBytes(encryptedImage,entry,key);
    return [name,URL.createObjectURL(new Blob([imageBytes],{type:entry.mime}))];
  }));
  for (const [name,url] of objectUrls) html=html.replaceAll(`src="images/${name}"`,`src="${url}"`);
  if (html.includes('src="images/')) throw new Error('Encrypted package is incomplete.');
  const policy="default-src 'none'; script-src 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src blob:; connect-src 'none'; base-uri 'none'; form-action 'none'";
  const environment=location.hostname==='lunas-empire.github.io'?'STAGING':'PRODUCTION';
  const runtimeBar=`<div class="admin-runtime-bar"><div class="admin-runtime-brand">Command Center</div><div class="admin-runtime-actions"><span class="admin-runtime-env">${environment}</span><a class="admin-runtime-home" href="/">← Member Hub</a></div></div>`;
  html=html.replace('<head>',`<head><meta http-equiv="Content-Security-Policy" content="${policy}">`);
  html=html.replace('</head>','<link rel="stylesheet" href="/admin/wiki-theme.css"></head>');
  html=html.replace('<body>',`<body>${runtimeBar}`);
  document.open();
  document.write(html);
  document.close();
}

form.addEventListener('submit',async event=>{
  event.preventDefault();
  status.classList.remove('error');
  status.textContent='Admin-Bereich wird entschlüsselt …';
  submitButton.disabled=true;
  const password=passwordInput.value;
  passwordInput.value='';
  try {
    await unlock(password);
  } catch {
    status.textContent='Passwort falsch oder Admin-Paket nicht verfügbar. Bitte erneut versuchen.';
    status.classList.add('error');
    submitButton.disabled=false;
    passwordInput.focus();
  }
});

if (!globalThis.crypto?.subtle) {
  status.textContent='Dieser Browser unterstützt die sichere Entschlüsselung nicht.';
  status.classList.add('error');
  submitButton.disabled=true;
}
