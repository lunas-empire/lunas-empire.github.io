import {guideSearchExtra, GUIDE_TOPIC_ORDER} from './guide-library-nav.js';
const fold=(value,locale)=>String(value||'').toLocaleLowerCase(locale).normalize('NFKD').replace(/\p{M}/gu,'');
export function updateGuideLibrary(main,{topic='',query='',locale='en-US',resultText='results'}={}){
 const needle=fold(query.trim(),locale), searching=needle.length>0;
 const browsing=searching||GUIDE_TOPIC_ORDER.includes(topic);
 main.querySelector('.guide-library')?.classList.toggle('guide-library--search',searching);
 main.querySelector('[data-guide-featured]')?.toggleAttribute('hidden',browsing);
 main.querySelector('[data-guide-home]')?.toggleAttribute('hidden',browsing);
 main.querySelector('[data-guide-browse-controls]')?.toggleAttribute('hidden',!browsing);
 let matches=0,visibleGuides=0;
 for(const section of main.querySelectorAll('[data-guide-topic]')){
   const relevant=searching||section.dataset.guideTopic===topic;
   section.hidden=!relevant;
   if(!relevant)continue;
   let sectionMatches=0,sectionTitleMatches=0;
   for(const item of section.querySelectorAll('[data-filter-item]')){
     const extra=(item.dataset.searchExtra||'')+' '+guideSearchExtra(item.dataset.guideId);
     const title=item.querySelector(':scope > summary > .disclosure-title')?.textContent||item.querySelector(':scope > summary')?.textContent||item.querySelector('dt')?.textContent||'';
     const titleMatch=fold(title+' '+extra,locale).includes(needle);
     const fullMatch=!searching||titleMatch||fold(item.textContent,locale).includes(needle);
     item.hidden=!fullMatch;
     if(item.matches('.guide-disclosure')){
       item.style.order=searching&&!titleMatch?'1':'0';
       item.classList.toggle('guide-disclosure--search-match',searching&&titleMatch);
       if(searching)item.open=false;
       if(!item.hidden)visibleGuides++;
       if(searching&&titleMatch&&!item.hidden)sectionTitleMatches++;
     }
     if(!item.hidden){matches++;sectionMatches++;}
   }
   for(const group of section.querySelectorAll('[data-search-group]')){
     const hasVisible=Boolean(group.querySelector('[data-filter-item]:not([hidden])'));
     group.hidden=!hasVisible;
     if(searching&&hasVisible&&group.matches('details'))group.open=true;
   }
   if(searching){section.hidden=sectionMatches===0;section.style.order=sectionTitleMatches?'0':'1';}
   else section.style.order='';
 }
 const noResults=main.querySelector('#no-results');
 if(noResults)noResults.hidden=!searching||matches>0;
 const count=main.querySelector('#guide-results-count');
 if(count){
   count.textContent=searching?visibleGuides+' '+resultText:topic?(main.querySelectorAll('[data-guide-topic="'+topic+'"] .guide-disclosure:not([hidden])').length+' '+resultText):'';
 }
 return {searching,matches,visibleGuides};
}
