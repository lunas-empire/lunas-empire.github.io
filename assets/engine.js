import { GUIDE_CONFIG } from './config.js';
export const DAY_MS = 86400000;
export const WEEKDAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const ordinal = date => Date.parse(`${date}T12:00:00Z`) / DAY_MS;
const civilDate = (date,days=0) => new Date(Date.parse(`${date}T12:00:00Z`)+days*DAY_MS).toISOString().slice(0,10);
export function getGuideDate() {
  return globalThis.__GUIDE_TEST_DATE__ ? new Date(globalThis.__GUIDE_TEST_DATE__) : new Date();
}
export function berlinParts(now) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: GUIDE_CONFIG.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).filter(p => p.type !== 'literal').map(p => [p.type,p.value]));
}
export function guideState(now = getGuideDate()) {
  const p = berlinParts(now);
  let date = `${p.year}-${p.month}-${p.day}`;
  // Civil-date arithmetic, not elapsed 24h subtraction: correct across DST changes.
  if (+p.hour < GUIDE_CONFIG.serverResetHour) date = new Date(Date.parse(`${date}T12:00:00Z`) - DAY_MS).toISOString().slice(0,10);
  const start = berlinParts(new Date(GUIDE_CONFIG.seasonStart));
  const seasonDate = `${start.year}-${start.month}-${start.day}`;
  const delta = Math.round(ordinal(date) - ordinal(seasonDate));
  const seasonDay = now < new Date(GUIDE_CONFIG.seasonStart) ? 0 : delta + 1;
  const week = seasonDay > 0 ? Math.ceil(seasonDay / 7) : 0;
  const weekdayIndex = new Date(`${date}T12:00:00Z`).getUTCDay();
  return {
    date, now, weekdayIndex, weekday: WEEKDAYS[weekdayIndex],
    serverDay: GUIDE_CONFIG.serverDayAnchor.day + Math.round(ordinal(date)-ordinal(GUIDE_CONFIG.serverDayAnchor.date)),
    seasonDay, week, phase: !seasonDay ? 'PRE_SEASON' : week > 8 ? 'POST_SEASON' : `SEASON_WEEK_${week}`,
    countdown: Math.max(0, new Date(GUIDE_CONFIG.seasonStart) - now),
    minute: +p.hour * 60 + +p.minute,
  };
}
export function selectedDate(state, weekdayIndex) {
  return new Date(Date.parse(`${state.date}T12:00:00Z`) + (weekdayIndex-state.weekdayIndex)*DAY_MS).toISOString().slice(0,10);
}
export function checklistKey(kind, state, date = state.date) {
  return kind === 'season' ? `rzsn-season-${GUIDE_CONFIG.seasonStart.slice(0,10)}-${state.phase}` : `rzsn-${kind}-${date}`;
}
export function armsWindow(state, guide) {
  if (!guide.arms) return 'unconfirmed';
  const minutes = state.minute < GUIDE_CONFIG.serverResetHour * 60 ? state.minute + 1440 : state.minute;
  return minutes < guide.arms.start * 60 ? 'later' : minutes < guide.arms.end * 60 ? 'active' : 'ended';
}
export function availableTask(task, state) {
  if (task.weekdays && !task.weekdays.includes(state.weekdayIndex)) return false;
  if (task.minDay && state.seasonDay < task.minDay) return false;
  if (task.maxDay && state.seasonDay > task.maxDay) return false;
  return true;
}
export function resetInstant(date) {
  let candidate=Date.parse(`${date}T${String(GUIDE_CONFIG.serverResetHour).padStart(2,'0')}:00:00Z`);
  // Resolve a Berlin civil time without relying on the machine's own timezone.
  for (let pass=0;pass<2;pass++) {
    const parts=berlinParts(new Date(candidate));
    const actualDate=`${parts.year}-${parts.month}-${parts.day}`;
    candidate+=(Math.round(ordinal(date)-ordinal(actualDate))*1440+GUIDE_CONFIG.serverResetHour*60-(+parts.hour*60 + +parts.minute))*60000;
  }
  return new Date(candidate);
}
export function seasonEventInstant(day) {
  if (!Number.isInteger(day) || day<1) throw new RangeError('Season day must be a positive integer.');
  const start=berlinParts(new Date(GUIDE_CONFIG.seasonStart));
  return resetInstant(civilDate(`${start.year}-${start.month}-${start.day}`,day-1));
}
