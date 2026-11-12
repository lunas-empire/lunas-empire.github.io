export const GUIDE_CONFIG = {
  timezone: 'Europe/Berlin', serverResetUtcHour: 2, // 00:00 ST = 02:00 UTC; Berlin 04:00 CEST / 03:00 CET
  serverDayAnchor: { date: '2026-09-12', day: 144 },
  seasonStart: '2026-09-21T04:00:00+02:00', server: 2261,
};
export const BUILD_VERSION_BASE = '2026.11.12-manual-archive';
const productionHost='rzsn-home.github.io';
export const BUILD_VERSION = globalThis.location?.hostname===productionHost ? BUILD_VERSION_BASE : `${BUILD_VERSION_BASE}-staging`;
export const ALLIANCE_CONFIG = {
  vsDailyMinimum: 3600000,
  // Both sites use the native Commander Center with host-specific API backends.
  adminUrl: '#admin',
  commandCenterEmbedUrl: globalThis.location?.hostname===productionHost
    ? 'https://rzsn-command-center.cynthiawong2837128.workers.dev'
    : 'https://rzsn-staging-api-bridge.pages.dev/?embed=1',
};
export const LIVE_NOTICE = {
  active: false, priority: 'critical',
  message: { de: '', en: '', uk: '', ja: '', fr: '', it: '', id: '', ar: '', ko: '', sv: '', pt: '', nl: '', th: '', km: '', fil: '' },
  // Task IDs temporarily replaced by this call; keep normal guidance out of Today.
  suppressTaskIds: [],
};
