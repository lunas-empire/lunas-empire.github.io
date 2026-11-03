import { deriveAdminKey, decryptAdminBytes } from './crypto.js';

const form=document.querySelector('#unlock-form');
const passwordInput=document.querySelector('#admin-password');
const submitButton=document.querySelector('#unlock-button');
const status=document.querySelector('#unlock-status');

// The private Worker remains the single source of the officer UI and same-origin writes.
const embeddedHost=location.hostname==='lunas-empire.github.io' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const workerUrl='https://rzsn-command-center-staging.cynthiawong2837128.workers.dev/?embed=1';
const shell=document.querySelector('#commander-shell');
const wikiPanel=document.querySelector('#wiki-panel');
const workerPanel=document.querySelector('#worker-panel');
const frame=document.querySelector('#commander-frame');
const tabs=[...document.querySelectorAll('[data-view]')];

if (embeddedHost) {
  shell.hidden=false;
  document.body.classList.add('embedded-admin');
  document.title='Commander Center - Luna';
  wikiPanel.setAttribute('role','tabpanel');
  wikiPanel.setAttribute('aria-labelledby','tab-wissen');
  shell.append(wikiPanel);
  document.querySelector('#login-title').textContent='Wissen & Guides';
  document.querySelector('.intro').textContent='Verschlüsseltes Wiki mit dem bestehenden Wiki-Passwort öffnen.';
  document.querySelector('.intro.en').textContent='Open the encrypted wiki with the existing wiki password.';
  document.querySelector('label[for="admin-password"]').textContent='Wiki-Passwort / Wiki password';
  submitButton.textContent='Wiki öffnen';
  function showView(force=false) {
    const view=['review','wissen'].includes(location.hash.slice(1))?location.hash.slice(1):'overview';
    for (const tab of tabs) {
      const selected=tab.dataset.view===view;
      tab.setAttribute('aria-selected',String(selected));
      tab.tabIndex=selected?0:-1;
    }
    wikiPanel.hidden=view!=='wissen';
    workerPanel.hidden=view==='wissen';
    workerPanel.setAttribute('aria-labelledby',`tab-${view==='review'?'review':'overview'}`);
    if (view!=='wissen') {
      const destination=workerUrl+(view==='review'?'#review':'');
      if (force || frame.getAttribute('src')!==destination) frame.src=destination;
    }
  }
  for (const tab of tabs) {
    tab.addEventListener('click',()=>{location.hash=tab.dataset.view;showView(true);});
    tab.addEventListener('keydown',event=>{
      let index=tabs.indexOf(tab);
      if (event.key==='ArrowRight') index=(index+1)%tabs.length;
      else if (event.key==='ArrowLeft') index=(index+tabs.length-1)%tabs.length;
      else if (event.key==='Home') index=0;
      else if (event.key==='End') index=tabs.length-1;
      else return;
      event.preventDefault();
      tabs[index].focus();
      tabs[index].click();
    });
  }
  addEventListener('hashchange',()=>showView());
  showView();
}

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
  const returnLinks=embeddedHost?'<a class="admin-runtime-home" href="/admin/#overview">Commander Center</a><a class="admin-runtime-home" href="/admin/#review">Manuelle Reviews</a>':'';
  const runtimeBar=`<div class="admin-runtime-bar"><div class="admin-runtime-brand">Commander Center</div><div class="admin-runtime-actions"><span class="admin-runtime-env">${environment}</span>${returnLinks}<a class="admin-runtime-home" href="/">← Member Hub</a></div></div>`;
  html=html.replace('<head>',`<head><meta http-equiv="Content-Security-Policy" content="${policy}">`);
  html=html.replace('</head>','<link rel="stylesheet" href="/admin/wiki-theme.css"></head>');
  html=html.replace('<body>',`<body>${runtimeBar}`);
  document.open();
  document.write(html);
  document.close();
  for (const link of document.querySelectorAll('.admin-runtime-home[href^="/admin/#"]')) {
    link.addEventListener('click',event=>{
      event.preventDefault();
      location.replace(link.href);
      location.reload();
    });
  }
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
