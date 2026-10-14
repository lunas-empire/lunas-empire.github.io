import test from 'node:test';
import assert from 'node:assert/strict';
import {ALLIANCE_MAIL_LIMIT,dailyOfficerBrief,vsWeeklyMail,donationsWeeklyMail,safeMailText} from '../assets/officer-reports.js';
test('English reports use verified data, never convert unknown inputs to zero or final status',()=>{
 const daily=dailyOfficerBrief({date:'2026-10-14',overview:{},operations:{tasks:[{status:'done',due_date:'2026-10-13'}]},trains:{}});
 assert.match(daily,/OCR reviews: unknown/);
 assert.match(daily,/Open tasks: 0 \(0 due\)/);
 assert.match(daily,/train calendar unavailable/);
 const interim=vsWeeklyMail({week:'2026-W41',state:'preliminary',failedDays:12,unknownDays:44,perfect:2,threshold:3600000});
 assert.match(interim,/provisional, not final/);
 assert.match(interim,/Unknown day entries: 44/);
 assert.match(interim,/Repeated low-day alerts: unknown/);
 const donation=donationsWeeklyMail({week:'2026-W41',captured_at:'2026-10-11T00:00:00Z',is_complete:false,verified:45,active:92,met:30,below:15,unknown:47},20000);
 assert.match(donation,/partial capture/);
 assert.match(donation,/Unknown: 47/);
 assert.match(donation,/not proof of final weekly totals/);
});
test('Reports fit 500-character mail limit; long input never silently gets truncated',()=>{
 const report=vsWeeklyMail({week:'2026-W41',state:'final',failedDays:4,unknownDays:0,perfect:71,priority:1,threshold:3600000});
 assert.ok(report.length<=ALLIANCE_MAIL_LIMIT);
 assert.equal(safeMailText(report),report);
 assert.equal(safeMailText('x'.repeat(ALLIANCE_MAIL_LIMIT+1)),null);
 assert.equal(safeMailText(' x '),'x');
 assert.equal(safeMailText(''), '');
 const verified=donationsWeeklyMail({week:'2026-W41',is_complete:true,verified:92,active:92,met:76,below:16,unknown:0},20000);
 assert.equal(safeMailText(verified),verified);
});
