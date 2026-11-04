const CACHE='rzsn-shell-2026.11.04-lw-import';
const SHELL=["/","/index.html","/assets/app.js?v=2026.11.04-lw-import","/assets/black-market-guide.js?v=2026.11.04-lw-import","/assets/config.js?v=2026.11.04-lw-import","/assets/content.js?v=2026.11.04-lw-import","/assets/desert-storm-rzsn.js?v=2026.11.04-lw-import","/assets/dice-winners.js?v=2026.11.04-lw-import","/assets/engine.js?v=2026.11.04-lw-import","/assets/former-train-archive.js?v=2026.11.04-lw-import","/assets/gold-farming-guide.js?v=2026.11.04-lw-import","/assets/guide-factcheck-copy.js?v=2026.11.04-lw-import","/assets/guide-library-filter.js?v=2026.11.04-lw-import","/assets/guide-library-nav-i18n.js?v=2026.11.04-lw-import","/assets/guide-library-nav.js?v=2026.11.04-lw-import","/assets/guide-library-ui.js?v=2026.11.04-lw-import","/assets/guide-links.js?v=2026.11.04-lw-import","/assets/guide-text.js?v=2026.11.04-lw-import","/assets/hot-deals-guide.js?v=2026.11.04-lw-import","/assets/hud-i18n.js?v=2026.11.04-lw-import","/assets/i18n-ar.js?v=2026.11.04-lw-import","/assets/i18n-fil.js?v=2026.11.04-lw-import","/assets/i18n-km.js?v=2026.11.04-lw-import","/assets/i18n-ko.js?v=2026.11.04-lw-import","/assets/i18n-nl.js?v=2026.11.04-lw-import","/assets/i18n-pt.js?v=2026.11.04-lw-import","/assets/i18n-sv.js?v=2026.11.04-lw-import","/assets/i18n-th.js?v=2026.11.04-lw-import","/assets/i18n.js?v=2026.11.04-lw-import","/assets/icons.js?v=2026.11.04-lw-import","/assets/native-admin-dynamic-i18n.js?v=2026.11.04-lw-import","/assets/native-admin-fragments.js?v=2026.11.04-lw-import","/assets/native-admin-i18n.js?v=2026.11.04-lw-import","/assets/native-admin.js?v=2026.11.04-lw-import","/assets/native-duel-league-i18n.js?v=2026.11.04-lw-import","/assets/native-duel-league.js?v=2026.11.04-lw-import","/assets/native-evidence-row.js?v=2026.11.04-lw-import","/assets/native-impact-warnings.js?v=2026.11.04-lw-import","/assets/native-stat-evidence.js?v=2026.11.04-lw-import","/assets/native-vs-overview.js?v=2026.11.04-lw-import","/assets/officer-cockpit.js?v=2026.11.04-lw-import","/assets/officer-reports.js?v=2026.11.04-lw-import","/assets/overview-i18n.js?v=2026.11.04-lw-import","/assets/overview.js?v=2026.11.04-lw-import","/assets/practical-guide-captions.js?v=2026.11.04-lw-import","/assets/practical-guide-i18n.js?v=2026.11.04-lw-import","/assets/practical-guide-images.js?v=2026.11.04-lw-import","/assets/practical-guides.js?v=2026.11.04-lw-import","/assets/priority.js?v=2026.11.04-lw-import","/assets/profession-guide.js?v=2026.11.04-lw-import","/assets/season-library.js?v=2026.11.04-lw-import","/assets/season.js?v=2026.11.04-lw-import","/assets/special-guide-i18n.js?v=2026.11.04-lw-import","/assets/storage.js?v=2026.11.04-lw-import","/assets/tech-guide.js?v=2026.11.04-lw-import","/assets/teleport-guide.js?v=2026.11.04-lw-import","/assets/terminology-copy.js?v=2026.11.04-lw-import","/assets/terminology.js?v=2026.11.04-lw-import","/assets/train-guide.js?v=2026.11.04-lw-import","/assets/vs-support-report.js?v=2026.11.04-lw-import","/assets/hub.css?v=2026.11.04-lw-import","/assets/overview.css?v=2026.11.04-lw-import","/assets/tokens.css?v=2026.11.04-lw-import","/assets/member/train-guide-ui.webp","/assets/member/t10-research-guide.webp?v=2026.11.04-lw-import","/assets/member/practical-guides/alliance-tech-donations.webp","/assets/member/practical-guides/desert-storm.webp","/assets/member/practical-guides/drone-chips-components.webp","/assets/member/practical-guides/generals-trial.webp","/assets/member/practical-guides/hero-squad-formations.webp","/assets/member/practical-guides/marshals-guard.webp","/assets/member/practical-guides/minister-capitol-buffs.webp","/assets/member/practical-guides/rally-combat-fundamentals.webp","/assets/member/practical-guides/store-buy-priorities.webp","/assets/member/practical-guides/ur-gear-blueprints.webp","/assets/member/practical-guides/waterfall-troop-training.webp","/assets/member/practical-guides/zombie-siege.webp","/assets/member/rzsn-desert-storm/battlefield-positions.webp","/assets/member/rzsn-desert-storm/buildings.webp","/assets/member/rzsn-desert-storm/fixed-position.webp","/assets/member/rzsn-desert-storm/friday-announcement.webp","/assets/member/rzsn-desert-storm/jumper.webp","/assets/member/teleport/teleport-vs.webp","/assets/member/teleport/teleport-place.webp","/assets/member/teleport/teleport-return.webp","/assets/member/teleport/teleport-season-grouping.png","/assets/member/teleport/teleport-season-server.png","/assets/member/gold-guide/gold-mine.png","/assets/sun.svg","/manifest.webmanifest"];
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
