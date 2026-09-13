import { LIVE_NOTICE } from './config.js';
import { DAILY_GUIDES } from './content.js';
import { seasonSynergies, seasonTasks } from './season.js';
export function todayPriorities(state, notice = LIVE_NOTICE) {
  const guide = DAILY_GUIDES[state.weekday];
  const tasks = [];
  const add = (id, priority, source) => tasks.push({id, priority, source});
  if (notice.active) add('notice',1,'call');
  if (state.weekdayIndex === 6) add('shield',2,'important');
  add(guide.focus,3,'vs');
  seasonSynergies(state).forEach(id=>add(id,4,'season'));
  if (state.seasonDay === 1) ['firstBlood','farms','vri'].forEach(id=>add(id,4,'season'));
  if (guide.arms) add('arms',5,'bestArms');
  add('save',6,'save');
  add('phone',7,'daily');
  seasonTasks(state).slice(0,1).forEach(id=>add(id,8,'season'));
  const seen = new Set();
  return tasks.sort((a,b)=>a.priority-b.priority).filter(t=>{
    if (seen.has(t.id) || (notice.active && notice.suppressTaskIds.includes(t.id))) return false;
    seen.add(t.id); return true;
  }).slice(0,5);
}
