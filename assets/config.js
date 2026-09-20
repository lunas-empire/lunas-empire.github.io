export const GUIDE_CONFIG = {
  timezone: 'Europe/Berlin', serverResetHour: 4,
  serverDayAnchor: { date: '2026-09-12', day: 144 },
  seasonStart: '2026-09-21T04:00:00+02:00', server: 2261,
};
export const BUILD_VERSION = '2026-09-20.3';
export const ALLIANCE_CONFIG = {
  vsDailyMinimum: 3600000,
  // The static route contains only an encrypted package; the password is never published.
  adminUrl: '/admin/',
};
export const LIVE_NOTICE = {
  active: false, priority: 'critical',
  message: { de: '', en: '', uk: '', ja: '', fr: '', it: '', id: '', ar: '', ko: '', sv: '', pt: '' },
  // Task IDs temporarily replaced by this call; keep normal guidance out of Today.
  suppressTaskIds: [],
};
