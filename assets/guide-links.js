export function memberRoute(hash = '') {
  const raw=String(hash).replace(/^#/,'');
  const [viewRaw='',guideRaw='',sectionRaw='']=raw.split('/');
  const view=viewRaw || 'today';
  let guideId='';
  let sectionId='';
  if (view==='guides' && guideRaw) {
    try { guideId=decodeURIComponent(guideRaw); } catch { guideId=''; }
    try { sectionId=sectionRaw?decodeURIComponent(sectionRaw):''; } catch { sectionId=''; }
  }
  return {view,guideId,sectionId};
}

export function guideHash(id,sectionId='') {
  const base=`#guides/${encodeURIComponent(String(id))}`;
  return sectionId ? `${base}/${encodeURIComponent(String(sectionId))}` : base;
}

export function guideUrl(id, href = globalThis.location?.href || 'https://example.invalid/', sectionId='') {
  const url=new URL(href);
  url.hash=guideHash(id,sectionId);
  return url.href;
}
