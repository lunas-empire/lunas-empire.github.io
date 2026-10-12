// RZSN local review UI. All mutations require explicit evidence and a decision.
export function createReviewController({api,el,esc,onChange,isReadOnly=()=>false}){
  let items=[], targets=[], busy=false;
  const readable={profile:'Profile value',vs_day:'VS day',identity:'Player identity',unsupported:'Manual investigation'};
  function summary(r){
    const context=r.context||{};
    const type=readable[r.kind]||r.kind;
    return '<span class="review-meta">'+esc(type)+' · '+esc(r.source_batch||'historical')+'</span>'+
      '<strong>'+esc(r.source_name||'Unknown')+'</strong>'+
      '<span class="review-summary-note">'+esc(r.metric||'')+
        (context.date?' · '+esc(context.date):'')+'</span>';
  }
  function sourceContext(r){
    const v=r.context||{};
    const bits=[];
    if(v.captured_at)bits.push('Snapshot: '+v.captured_at);
    if(v.quality)bits.push('Original quality: '+v.quality);
    if(v.status)bits.push('OCR status: '+v.status);
    if(v.value!==undefined&&v.value!==null)bits.push('Original value: '+Number(v.value).toLocaleString('de-DE'));
    if(r.source_value!==null && r.source_value!==undefined)bits.push('OCR value: '+r.source_value);
    return bits.length?'<p class="review-evidence">'+bits.map(esc).join(' · ')+'</p>':'';
  }
  function controls(r){
    if(r.status!=='open'){
      const resolution=r.resolution||{};
      const value=resolution.corrected_value;
      const field=value!==undefined?'<p><strong>Verified value: '+Number(value).toLocaleString('de-DE')+'</strong></p>':'';
      const member=resolution.member_name?'<p><strong>Linked to: '+esc(resolution.member_name)+'</strong></p>':'';
      return '<div class="review-decision">'+field+member+'<p><strong>Decision:</strong> '+esc(r.status)+' · '+esc(r.resolved_by||'R4/R5')+
        ' · '+esc(r.resolved_at||'')+'</p><p><strong>Evidence:</strong> '+esc(resolution.reason||'Not available')+'</p></div>';
    }
    if(isReadOnly())return '<p class="review-warning">Diese öffentliche Demo ist schreibgeschützt. Echte Korrekturen werden ausschließlich im geschützten Admin-Bereich durchgeführt.</p>';
    const invalid=r.context?.warning;
    const explain=invalid?'<p class="review-warning">'+esc(invalid)+'</p>':'';
    let control='';
    if(r.kind==='identity'){
      const opts=targets.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+' ('+esc(x.rank||'?')+')</option>').join('');
      control='<label>Verified player<select class="identity-target" required><option value="">Choose confirmed player…</option>'+opts+'</select></label>';
    }else if(r.kind==='profile'||r.kind==='vs_day'){
      control='<label>Verified numeric value<input class="correct" type="text" inputmode="numeric" pattern="[0-9]+" maxlength="15" placeholder="From source screenshot"></label>';
    }
    return explain+'<div class="review-form">'+control+
      '<label>Evidence / reason<input class="reason" type="text" maxlength="500" placeholder="Checked against original screenshot…" required></label>'+
      '<div class="review-controls"><button type="button" class="approve" data-action="approve"'+(invalid||r.kind==='unsupported'?' disabled':'')+'>Confirm correction</button>'+
      '<button type="button" data-action="dismiss">Dismiss with reason</button></div>'+
      '<small class="result" role="status" aria-live="polite"></small></div>';
  }
  function card(r){
    return '<details class="review-item" data-review="'+esc(r.id)+'" data-kind="'+esc(r.kind)+'"><summary class="review-summary">'+summary(r)+'</summary>'+
      '<div class="review-body"><p>'+esc(r.note||'Source uncertain')+'</p>'+
      (r.suggested_name?'<p class="review-evidence">Suggested match only: '+esc(r.suggested_name)+'</p>':'')+
      sourceContext(r)+controls(r)+'</div></details>';
  }
  function render(){
    const filter=el('review-filter').value;
    const phrase=el('review-search').value.trim().toLocaleLowerCase();
    const shown=items.filter(r=>(filter==='all'||r.kind===filter)&&
      (r.source_name+' '+r.metric+' '+r.category+' '+r.note+' '+r.source_batch).toLocaleLowerCase().includes(phrase));
    el('review-count').textContent=shown.length+' of '+items.length+' '+el('review-status').value+' reviews';
    el('review-list').innerHTML=shown.length?shown.map(card).join(''):'<p class="footnote">No reviews match this filter.</p>';
    el('review-list').querySelectorAll('details[data-review]').forEach(cardElement=>{
      cardElement.querySelectorAll('button[data-action]').forEach(button=>button.addEventListener('click',()=>submit(cardElement,button.dataset.action)));
    });
  }
  async function submit(card,action){
    if(busy)return;
    const result=card.querySelector('.result');
    const reason=card.querySelector('.reason')?.value.trim()||'';
    if(reason.length<8){result.textContent='Please state your evidence (at least 8 characters).';return}
    const body={action,reason};
    if(action==='approve'){
      if(card.dataset.kind==='identity'){
        const member_id=card.querySelector('.identity-target').value;
        if(!member_id){result.textContent='Choose a verified member first.';return}
        body.member_id=member_id;
      }else{
        const raw=card.querySelector('.correct')?.value.trim()||'';
        if(!/^[0-9]+$/.test(raw)||raw.length>15){
          result.textContent='Enter a nonnegative whole number from the source.';return;
        }
        const value=Number(raw);
        if(!Number.isSafeInteger(value)||value>1e14){result.textContent='Value outside safe range.';return}
        body.corrected_value=value;
      }
    }
    if(!window.confirm('Confirm '+(action==='approve'?'verified correction':'dismissal')+'? The decision will be audited.'))return;
    busy=true;
    card.querySelectorAll('button').forEach(b=>b.disabled=true);
    result.textContent='Saving…';
    try{
      await api('review/'+encodeURIComponent(card.dataset.review),{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      await Promise.all([refresh(),onChange()]);
    }catch(error){
      result.textContent=error?.message||'Could not save';
      card.querySelectorAll('button').forEach(b=>b.disabled=false);
    }finally{busy=false}
  }
  async function refresh(){
    const status=el('review-status').value;
    const result=await Promise.all([
      api('reviews?status='+encodeURIComponent(status)),
      targets.length?Promise.resolve(targets):api('identity-options')
    ]);
    items=result[0];targets=result[1];
    render();
  }
  el('review-search').addEventListener('input',render);
  el('review-filter').addEventListener('change',render);
  el('review-status').addEventListener('change',()=>refresh().catch(error=>{
    el('review-count').textContent='Review loading failed: '+error.message;
  }));
  return {refresh};
}
