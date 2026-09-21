export function memberRoute(hash = '') {
  const raw=String(hash).replace(/^#/,'');
  const [viewRaw='',guideRaw='']=raw.split('/');
  const view=viewRaw || 'today';
  let guideId='';
  if (view==='guides' && guideRaw) {
    try { guideId=decodeURIComponent(guideRaw); } catch { guideId=''; }
  }
  return {view,guideId};
}

export function guideHash(id) {
  return `#guides/${encodeURIComponent(String(id))}`;
}

export function guideUrl(id, href = globalThis.location?.href || 'https://example.invalid/') {
  const url=new URL(href);
  url.hash=guideHash(id);
  return url.href;
}
