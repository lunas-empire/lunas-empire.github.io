import {GUIDE_TOPIC_ORDER,guideTopicCount} from './guide-library-nav.js';
import {guideNavText} from './guide-library-nav-i18n.js';

export function guideLanding({lang,escape,t,guideHash,shortTitle,weekday,week,seasonGroups,weekdays}){
 const label=key=>escape(guideNavText(lang,key));
 const categories=GUIDE_TOPIC_ORDER.map(topic=>'<button type="button" class="guide-category-choice" data-guide-topic-select="'+topic+'"><strong>'+label(topic)+'</strong><span>'+guideTopicCount(topic,seasonGroups,weekdays)+' '+label('count')+'</span></button>').join('');
 const seasonGroup=seasonGroups.find(group=>typeof group.week==='number'?group.week===week:String(group.week).split('-').map(Number).some(n=>week>=n&&week<=Math.max(...String(group.week).split('-').map(Number))));
 const currentSeason=seasonGroup?.guides?.[0];
 const vs='vs-'+weekday;
 const featured='<section class="guide-featured" data-guide-featured><h2>'+label('featured')+'</h2><div class="guide-featured-links"><a href="'+guideHash(vs)+'"><span>'+escape(t('today'))+' · VS</span><strong>'+escape(shortTitle(vs))+'</strong></a>'+
  (currentSeason?'<a href="'+guideHash(currentSeason)+'"><span>'+label('week')+' · '+escape(t('week'))+' '+week+'</span><strong>'+escape(shortTitle(currentSeason))+'</strong></a>':'')+'</div></section>';
 const topics='<section class="guide-home-topics" data-guide-home><h2>'+label('browse')+'</h2><div class="guide-category-grid">'+categories+'</div></section>';
 const controls='<div class="guide-browse-controls" data-guide-browse-controls hidden><button type="button" data-guide-browse-back>← '+label('back')+'</button><span id="guide-results-count" class="guide-results-count"></span></div>';
 return featured+topics+controls;
}
export function guideTopicSection(topic,lang,escape,html){
 return '<section class="section guide-topic-section" data-guide-topic="'+topic+'" hidden><h2>'+escape(guideNavText(lang,topic))+'</h2>'+html+'</section>';
}
