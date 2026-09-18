export const GUIDE_CONFIG = {
  timezone: 'Europe/Berlin', serverResetHour: 4,
  serverDayAnchor: { date: '2026-09-12', day: 144 },
  seasonStart: '2026-09-21T04:00:00+02:00', server: 2261,
};
export const BUILD_VERSION = '2026-09-18.1';
export const ALLIANCE_CONFIG = {
  vsDailyMinimum: 2600000,
  // Same-origin route. It only exists on the combined server with real server-side auth.
  adminUrl: '/admin/',
};
export const LIVE_NOTICE = {
  active: false, priority: 'critical',
  message: { de: '', en: '', uk: '', ja: '', fr: '', it: '', id: '' },
  // Task IDs temporarily replaced by this call; keep normal guidance out of Today.
  suppressTaskIds: [],
};
