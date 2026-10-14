import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {translateOfficerText,localizeOfficerTree} from '../assets/native-admin-i18n.js';
import {OFFICER_DYNAMIC_TEMPLATES} from '../assets/native-admin-dynamic-i18n.js';
const examples=[
 ['R4 · Luna · Website-Eigentümerin','R4 · Luna · Website owner'],
 ['Spieltag 2026-10-14 · Daten aus deinem privaten Allianzregister','Game day 2026-10-14 · Data from your private alliance roster'],
 ['Tagesziel: 3.600.000 Punkte · Nur bestätigte Werte','Daily target: 3.600.000 points · Verified scores only'],
 ['41 Spieler mit mindestens 2 bestätigten Tagen unter dem VS-Ziel. Das sind keine offenen OCR-Prüffälle.','41 players have at least 2 verified days below the VS target. These are not pending OCR reviews.'],
 ['41 Spieler mit mindestens 2 Tagen unter Ziel. 5 mit weniger als 5 aktiven Tagen bei vollständiger Erfassung. Samstag: Schildpflicht erinnern (nicht automatisch überprüfbar).','41 players had at least 2 days below the target. 5 had fewer than 5 active days in complete records. Saturday: remind members to shield (not automatically verifiable).'],
 ['Wochenauswertung 2026-W41','Weekly report 2026-W41'],
 ['Aufnahme: 11 Oct 2026 at 00:19 · Vollständige Mitgliederaufnahme','Captured: 11 Oct 2026 at 00:19 · Complete member snapshot'],
 ['Ziel 20.000','Target 20.000'],
 ['Von 92 bestätigten Werten','Out of 92 verified scores'],
 ['Werte gelten zum Zeitpunkt des Screenshots. 92/92 aktive Spieler mit bestätigten Wochenspenden. Bisher liegt nur eine verlässliche Wochenaufnahme vor – kein erfundener Vorwochenvergleich.','Values reflect the screenshot date. 92/92 active players have verified weekly donations. Only one reliable weekly capture is available; no previous-week comparison is inferred.'],
 ['Rang R5','Rank R5'],
 ['1 Spieler','1 player'],
 ['Stärke 80.376.261 · Kills 1.712.531 · Spenden 41.750','Power 80.376.261 · Kills 1.712.531 · Donations 41.750'],
 ['HEUTE · Members Day','TODAY · Members Day'],
 ['Vorschlag: adnane1997 · R2','Suggested driver: adnane1997 · R2'],
 ['Kandidaten vergleichen · 6','Compare candidates · 6'],
 ['Offene Aufgaben · 0','Open tasks · 0'],
 ['Abgeschlossene Aufgaben · 1','Completed tasks · 1'],
 ['6 von 6','6 out of 6'],
 ['nicht als 0 gewertet','Not treated as zero']
];
test('Every real iPhone screenshot regression string is localized into coherent English',()=>{
 assert.ok(OFFICER_DYNAMIC_TEMPLATES.length>=40);
 for(const [source,expected] of examples)assert.equal(translateOfficerText(source,'en'),expected,source);
});
test('Template localization preserves dates, player names, measurements and unknown private content',()=>{
 assert.equal(translateOfficerText('Vorschlag: ♛かぐや姫 · R4','en'),'Suggested driver: ♛かぐや姫 · R4');
 assert.equal(translateOfficerText('GeheimerName Spieler irgendwas','en'),'GeheimerName Spieler irgendwas');
 assert.equal(translateOfficerText('18.200.000','en'),'18.200.000');
 assert.equal(translateOfficerText('No driver registered yet','en'),'No driver registered yet');
});
test('Real DOM text nodes from different panels translate, but no user input is changed',()=>{
 const d=new JSDOM('<!doctype html><html lang="en"><body><section id="admin"></section></body></html>');
 const root=d.window.document.querySelector('#admin');
 for(const [german] of examples){const el=d.window.document.createElement('p');el.textContent=german;root.appendChild(el)}
 const box=d.window.document.createElement('input');box.value='Spieltag 2026-10-14';root.appendChild(box);
 assert.ok(localizeOfficerTree(root,'en')>=examples.length);
 const rendered=[...root.querySelectorAll('p')].map(p=>p.textContent);
 assert.deepEqual(rendered,examples.map(x=>x[1]));
 assert.equal(box.value,'Spieltag 2026-10-14');
 assert.equal(localizeOfficerTree(root,'en'),0);
 d.window.close();
});
test('All supported non-German locales translate screenshot templates without destroying dynamic values',()=>{
 for(const lang of ['en','uk','ja','fr','it','id','ar','ko','sv','pt','nl','th','km','fil']){
  const out=translateOfficerText('Tagesziel: 3.600.000 Punkte · Nur bestätigte Werte',lang);
  assert.notEqual(out,'Tagesziel: 3.600.000 Punkte · Nur bestätigte Werte',lang);
  assert.ok(out.includes('3.600.000'),lang);
  assert.ok(!out.includes('{0}'),lang);
 }
});
