export const GUIDE_CONFIG = {
  timezone: 'Europe/Berlin', serverResetHour: 4,
  serverDayAnchor: { date: '2026-09-12', day: 144 },
  seasonStart: '2026-09-21T04:00:00+02:00', server: 2261,
};
export const BUILD_VERSION_BASE = '2026-10-15.47';
const productionHost='rzsn-home.github.io';
export const BUILD_VERSION = globalThis.location?.hostname===productionHost ? BUILD_VERSION_BASE : `${BUILD_VERSION_BASE}-staging`;
export const ALLIANCE_CONFIG = {
  vsDailyMinimum: 3600000,
  // Staging renders a native admin view. Cloudflare D1 remains private behind officer bearer auth.
  // RZSN production retains its existing encrypted admin wiki.
  adminUrl: globalThis.location?.hostname===productionHost ? '/admin/' : '#admin',
  commandCenterEmbedUrl: 'https://rzsn-command-center-staging.cynthiawong2837128.workers.dev/?embed=1',
};
export const LIVE_NOTICE = {
  active: false, priority: 'critical',
  message: { de: '', en: '', uk: '', ja: '', fr: '', it: '', id: '', ar: '', ko: '', sv: '', pt: '', nl: '', th: '', km: '', fil: '' },
  // Task IDs temporarily replaced by this call; keep normal guidance out of Today.
  suppressTaskIds: [],
};
