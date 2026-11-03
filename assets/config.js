export const GUIDE_CONFIG = {
  timezone: 'Europe/Berlin', serverResetHour: 4,
  serverDayAnchor: { date: '2026-09-12', day: 144 },
  seasonStart: '2026-09-21T04:00:00+02:00', server: 2261,
};
export const BUILD_VERSION_BASE = '2026.11.01-no-vs-trends';
const productionHost='rzsn-home.github.io';
export const BUILD_VERSION = globalThis.location?.hostname===productionHost ? BUILD_VERSION_BASE : `${BUILD_VERSION_BASE}-staging`;
export const ALLIANCE_CONFIG = {
  vsDailyMinimum: 3600000,
  // Commander Center has one entry on every host; /admin/ gates staging embedding.
  // RZSN production retains its existing encrypted admin wiki.
  adminUrl: ['lunas-empire.github.io',productionHost,'localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname) ? '/admin/' : '#admin',
  commandCenterEmbedUrl: 'https://rzsn-staging-api-bridge.pages.dev/?embed=1',
};
export const LIVE_NOTICE = {
  active: false, priority: 'critical',
  message: { de: '', en: '', uk: '', ja: '', fr: '', it: '', id: '', ar: '', ko: '', sv: '', pt: '', nl: '', th: '', km: '', fil: '' },
  // Task IDs temporarily replaced by this call; keep normal guidance out of Today.
  suppressTaskIds: [],
};
