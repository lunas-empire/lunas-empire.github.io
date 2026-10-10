const PATHS=Object.freeze({
  today:'<path d="M7 3.5h10v2H7zM6 5.5h12v15H6z"/><path d="M9 9h6M9 13h6M9 17h4"/>',
  tasks:'<path d="M9 6h10M9 12h10M9 18h10"/><path d="m4.5 6 1.2 1.2L8 4.8M4.5 12l1.2 1.2L8 10.8M4.5 18l1.2 1.2L8 16.8"/>',
  vs:'<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  season:'<path d="M5 21V4m1 1h11l-2.2 3L17 11H6"/><path d="M4 21h5"/>',
  guides:'<path d="M4 5.5c3-1.2 5.7-.7 8 1.2v13c-2.3-1.9-5-2.4-8-1.2zM20 5.5c-3-1.2-5.7-.7-8 1.2v13c2.3-1.9 5-2.4 8-1.2z"/>',
  alliance:'<path d="M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M2.5 19c.3-3.3 1.8-5 4.5-5s4.2 1.7 4.5 5m1-2.5c.8-1.7 2.3-2.5 4.5-2.5 2.7 0 4.2 1.7 4.5 5"/>',
  power:'<path d="m13 2-8 12h6l-1 8 9-13h-6z"/>',
  economy:'<path d="M4 7h16v12H4zM7 7V4h10v3M8 11h8M8 15h5"/>',
  research:'<path d="M9 3h6M10 3v5l-5 9a2.5 2.5 0 0 0 2.2 4h9.6a2.5 2.5 0 0 0 2.2-4l-5-9V3"/><path d="M7.5 16h9"/>',
  build:'<path d="M4 21V9l8-5 8 5v12M8 21v-7h8v7"/>',
  hero:'<path d="m12 3 7 3v5c0 4.7-2.8 8.1-7 10-4.2-1.9-7-5.3-7-10V6z"/><path d="m9 12 2 2 4-4"/>',
  zombie:'<circle cx="12" cy="10" r="6"/><path d="M9.5 9h.01M14.5 9h.01M10 13h4M7 16v5m10-5v5M7 19h10"/>',
  standard:'<path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4"/>',
  complete:'<path d="m5 12 4 4L19 6"/>',
  light:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  dark:'<path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
});

export const NAV_ICONS=Object.freeze({today:'today',daily:'tasks',vs:'vs',season:'season',guides:'guides'});
export const GUIDE_ICONS=Object.freeze({alliance:'alliance',power:'power',vs:'vs',season:'season',economy:'economy'});

export function icon(name,className='ui-icon') {
  const paths=PATHS[name] || PATHS.standard;
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter">${paths}</svg>`;
}

export function missionIconType(task={}) {
  const value=`${task.id||''} ${task.text||''} ${task.category||''}`.toLowerCase();
  if (/research|tech|vri|serum|genetic/.test(value)) return 'research';
  if (/build|construction|farm|tower|city/.test(value)) return 'build';
  if (/hero|mason|kim|dva|tesla|squad/.test(value)) return 'hero';
  if (/zombie|doom|monster|buster/.test(value)) return 'zombie';
  return 'standard';
}
