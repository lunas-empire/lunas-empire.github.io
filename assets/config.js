export const GUIDE_CONFIG = {
  timezone: 'Europe/Berlin', serverResetHour: 4,
  serverDayAnchor: { date: '2026-09-12', day: 144 },
  seasonStart: '2026-09-21T04:00:00+02:00', server: 2261,
};
export const BUILD_VERSION_BASE = '2026-10-12.2';
const productionHost='rzsn-home.github.io';
export const BUILD_VERSION = globalThis.location?.hostname===productionHost ? BUILD_VERSION_BASE : `${BUILD_VERSION_BASE}-staging`;
export const ALLIANCE_CONFIG = {
  vsDailyMinimum: 3600000,
  // Lunas staging opens the password-protected Cloudflare Worker + private D1.
  // RZSN production retains its existing encrypted admin wiki.
  adminUrl: globalThis.location?.hostname===productionHost ? '/admin/' : 'https://rzsn-command-center-staging.cynthiawong2837128.workers.dev/',
};
export const LIVE_NOTICE = {
  active: false, priority: 'critical',
  message: { de: '', en: '', uk: '', ja: '', fr: '', it: '', id: '', ar: '', ko: '', sv: '', pt: '', nl: '', th: '', km: '', fil: '' },
  // Task IDs temporarily replaced by this call; keep normal guidance out of Today.
  suppressTaskIds: [],
};
