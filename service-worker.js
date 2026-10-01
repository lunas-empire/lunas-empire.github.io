const CACHE='rzsn-shell-2026-10-01.4';
const SHELL=["/","/index.html","/assets/app.js?v=2026-10-01.4","/assets/config.js?v=2026-10-01.4","/assets/content.js?v=2026-10-01.4","/assets/engine.js?v=2026-10-01.4","/assets/guide-links.js?v=2026-10-01.4","/assets/guide-text.js?v=2026-10-01.4","/assets/i18n-ar.js?v=2026-10-01.4","/assets/i18n-fil.js?v=2026-10-01.4","/assets/i18n-km.js?v=2026-10-01.4","/assets/i18n-ko.js?v=2026-10-01.4","/assets/i18n-nl.js?v=2026-10-01.4","/assets/i18n-pt.js?v=2026-10-01.4","/assets/i18n-sv.js?v=2026-10-01.4","/assets/i18n-th.js?v=2026-10-01.4","/assets/i18n.js?v=2026-10-01.4","/assets/overview-i18n.js?v=2026-10-01.4","/assets/overview.js?v=2026-10-01.4","/assets/priority.js?v=2026-10-01.4","/assets/profession-guide.js?v=2026-10-01.4","/assets/season-library.js?v=2026-10-01.4","/assets/season.js?v=2026-10-01.4","/assets/special-guide-i18n.js?v=2026-10-01.4","/assets/storage.js?v=2026-10-01.4","/assets/tech-guide.js?v=2026-10-01.4","/assets/terminology-copy.js?v=2026-10-01.4","/assets/terminology.js?v=2026-10-01.4","/assets/train-guide.js?v=2026-10-01.4","/assets/hub.css?v=2026-10-01.4","/assets/overview.css?v=2026-10-01.4","/assets/tokens.css?v=2026-10-01.4","/assets/member/train-guide-ui.webp","/assets/member/t10-path.svg","/assets/sun.svg","/manifest.webmanifest"];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin) return;
  if(event.request.mode==='navigate'){
    if (!['/','/index.html','/s1/','/s1/index.html'].includes(url.pathname)) return;
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put('/index.html',copy));
      return response;
    }).catch(()=>caches.match('/index.html')));
    return;
  }
  if(url.pathname.startsWith('/assets/')){
    // Versioned module URLs avoid mixed old/new code during worker upgrades.
    // Guide images can remain stale-while-revalidate; source files are network-first.
    if (/\.(?:js|css)$/.test(url.pathname)) {
      event.respondWith(fetch(event.request).then(response=>{
        if (response.ok) caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
        return response;
      }).catch(()=>caches.match(event.request)));
      return;
    }
    event.respondWith(caches.match(event.request).then(cached=>{
      const network=fetch(event.request).then(response=>{
        if(response.ok) caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));
        return response;
      }).catch(()=>cached);
      return cached || network;
    }));
  }
});
