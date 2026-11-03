import test from 'node:test';
import assert from 'node:assert/strict';
import {translateOfficerDynamicText} from '../assets/native-admin-dynamic-i18n.js';
import {translateOfficerText} from '../assets/native-admin-i18n.js';
const corrected={"ar":{"shield":"السبت: تذكير الأعضاء بتفعيل الدرع (لا يمكن التحقق من تفعيله تلقائيًا).","review":"حالات المراجعة المعلّقة · {0}","power":"القوة","kills":"الإقصاءات","rank":"الرتبة"},"fil":{"shield":"Sabado: Paalalahanan ang mga miyembro na gumamit ng shield (hindi awtomatikong mabe-verify kung aktibo ito).","review":"Mga kasong kailangang suriin · {0}","power":"Lakas","kills":"Mga napatay","rank":"Ranggo"},"fr":{"shield":"Samedi : rappeler aux membres d'activer leur bouclier (activation non vérifiable automatiquement).","review":"Vérifications en attente · {0}","power":"Puissance","kills":"Éliminations","rank":"Rang"},"id":{"shield":"Sabtu: Ingatkan anggota untuk mengaktifkan perisai (tidak dapat diverifikasi secara otomatis).","review":"Kasus yang perlu ditinjau · {0}","power":"Kekuatan","kills":"Eliminasi","rank":"Pangkat"},"it":{"shield":"Sabato: ricorda ai membri di attivare lo scudo (non verificabile automaticamente).","review":"Casi da verificare · {0}","power":"Potenza","kills":"Uccisioni","rank":"Grado"},"ja":{"shield":"土曜日：シールドの使用を呼びかける（使用状況は自動確認できません）。","review":"未確認の案件 · {0}","power":"戦力","kills":"キル数","rank":"ランク"},"km":{"shield":"ថ្ងៃសៅរ៍៖ រំលឹកសមាជិកឱ្យបើកខែល (មិនអាចផ្ទៀងផ្ទាត់ដោយស្វ័យប្រវត្តិបានទេ)។","review":"ករណីរង់ចាំការត្រួតពិនិត្យ · {0}","power":"កម្លាំងប្រយុទ្ធ","kills":"ការកម្ចាត់","rank":"ឋានៈ"},"ko":{"shield":"토요일: 보호막 사용 알림 (활성화 여부는 자동으로 확인할 수 없음).","review":"검토 대기 건 · {0}","power":"전투력","kills":"처치 수","rank":"계급"},"nl":{"shield":"Zaterdag: herinner leden eraan hun schild te activeren (niet automatisch te controleren).","review":"Openstaande controles · {0}","power":"Kracht","kills":"Uitschakelingen","rank":"Rang"},"pt":{"shield":"Sábado: lembrar os membros de ativar o escudo (não é possível verificar automaticamente).","review":"Casos pendentes de revisão · {0}","power":"Poder","kills":"Eliminações","rank":"Patente"},"sv":{"shield":"Lördag: påminn medlemmarna om att aktivera skölden (kan inte kontrolleras automatiskt).","review":"Ärenden att granska · {0}","power":"Styrka","kills":"Elimineringar","rank":"Rang"},"th":{"shield":"วันเสาร์: เตือนสมาชิกให้เปิดโล่ป้องกัน (ไม่สามารถตรวจสอบโดยอัตโนมัติได้)","review":"รายการรอตรวจสอบ · {0}","power":"พลังรบ","kills":"จำนวนการสังหาร","rank":"ยศ"},"uk":{"shield":"Субота: нагадати гравцям активувати щит (неможливо перевірити автоматично).","review":"Справи на перевірці · {0}","power":"Сила","kills":"Знищені вороги","rank":"Ранг"}};
test('Saturday shield reminder means an activated shield, never signing an obligation, in all 15 languages',()=>{
 assert.match(translateOfficerText('Samstag: Schildpflicht erinnern (nicht automatisch überprüfbar).','de'),/Schildpflicht/);
 for(const [lang,item] of Object.entries(corrected)){
  assert.equal(translateOfficerDynamicText('Samstag: Schildpflicht erinnern (nicht automatisch überprüfbar).',lang),item.shield,lang);
 }
 assert.equal(translateOfficerDynamicText('Samstag: Schildpflicht erinnern (nicht automatisch überprüfbar).','en'),
  'Saturday: remind members to shield (cannot be verified automatically).');
});
test('Pending OCR review cases are not software test cases in any supported language',()=>{
 for(const [lang,item] of Object.entries(corrected))
  assert.equal(translateOfficerDynamicText('Offene Prüffälle · 8',lang),item.review.replace('{0}','8'),lang);
});
test('Game power, kills and officer ranks remain semantic and preserve literal R1–R5',()=>{
 for(const [lang,item] of Object.entries(corrected)){
  assert.equal(translateOfficerDynamicText('Stärke 12.000',lang),item.power+' 12.000',lang);
  const result=translateOfficerDynamicText('Stärke 12.000 · Kills 50 · Spenden 2.000',lang);
  assert.ok(result.includes(item.power+' 12.000'),lang+': power label');
  assert.ok(result.includes(item.kills+' 50'),lang+': kills label');
  assert.ok(result.includes('2.000'),lang+': private donation amount');
  assert.ok(translateOfficerText('Rang R4',lang).includes('R4'),lang+': rank code');
 }
});

test('Review counters and multi-sentence VS warnings preserve meaning in each supported language',()=>{
 const corrected={"ar":{"count":"{0} حالات مراجعة معلّقة","vs":"{0} من اللاعبين سجّلوا نقاطًا أقل من هدف VS في {1} أيام مؤكدة على الأقل. هذه ليست حالات مراجعة OCR معلّقة."},"fil":{"count":"{0} kasong kailangang suriin","vs":"{0} manlalaro ang may hindi bababa sa {1} kumpirmadong araw na mas mababa sa target ng VS. Hindi ito mga nakabinbing OCR review."},"fr":{"count":"{0} vérifications en attente","vs":"{0} joueurs ont au moins {1} journées vérifiées sous l'objectif VS. Ce ne sont pas des vérifications OCR en attente."},"id":{"count":"{0} kasus menunggu peninjauan","vs":"{0} pemain memiliki setidaknya {1} hari terverifikasi di bawah target VS. Ini bukan kasus peninjauan OCR yang tertunda."},"it":{"count":"{0} casi da verificare","vs":"{0} giocatori hanno almeno {1} giorni verificati sotto l'obiettivo VS. Non sono verifiche OCR in sospeso."},"ja":{"count":"未確認の案件 {0} 件","vs":"{0} 人のプレイヤーは、VS目標未達の日が確認済みで少なくとも {1} 日あります。未処理のOCR確認案件とは別です。"},"km":{"count":"ករណីរង់ចាំពិនិត្យ {0}","vs":"{0} អ្នកលេងមានយ៉ាងហោចណាស់ {1} ថ្ងៃដែលបានបញ្ជាក់ថាទាបជាងគោលដៅ VS។ ទាំងនេះមិនមែនជាករណី OCR កំពុងរង់ចាំត្រួតពិនិត្យទេ។"},"ko":{"count":"검토 대기 건 {0}건","vs":"{0}명의 플레이어가 확인된 VS 목표 미달일이 최소 {1}일 있습니다. 이는 미처리 OCR 검토 건과 다릅니다."},"nl":{"count":"{0} openstaande controles","vs":"{0} spelers zaten op minstens {1} bevestigde dagen onder het VS-doel. Dit zijn geen openstaande OCR-controles."},"pt":{"count":"{0} casos pendentes de revisão","vs":"{0} jogadores ficaram abaixo da meta de VS em pelo menos {1} dias confirmados. Não são casos de revisão de OCR pendentes."},"sv":{"count":"{0} ärenden att granska","vs":"{0} spelare låg under VS-målet under minst {1} bekräftade dagar. Detta är inte väntande OCR-granskningar."},"th":{"count":"รายการรอตรวจสอบ {0} รายการ","vs":"ผู้เล่น {0} คนมีคะแนนต่ำกว่าเป้าหมาย VS อย่างน้อย {1} วันที่ยืนยันแล้ว ข้อมูลนี้ไม่ใช่รายการตรวจสอบ OCR ที่รอดำเนินการ"},"uk":{"count":"{0} справ на перевірці","vs":"{0} гравців мали щонайменше {1} підтверджених днів нижче цілі VS. Це не відкриті справи перевірки OCR."}};
 const source="{0} Spieler mit mindestens {1} bestätigten Tagen unter dem VS-Ziel. Das sind keine offenen OCR-Prüffälle.";
 const shieldSentence="Samstag: Schildpflicht erinnern (nicht automatisch überprüfbar).";
 const base="{0} Spieler mit mindestens {1} Tagen unter Ziel. {2} mit weniger als {3} aktiven Tagen bei vollständiger Erfassung.";
 for(const [lang,expected] of Object.entries(corrected)){
  assert.equal(translateOfficerDynamicText('8 offene Prüffälle',lang),expected.count.replace('{0}','8'),lang);
  assert.equal(translateOfficerDynamicText('4 Spieler mit mindestens 3 bestätigten Tagen unter dem VS-Ziel. Das sind keine offenen OCR-Prüffälle.',lang),
    expected.vs.replace('{0}','4').replace('{1}','3'),lang);
  const combined=translateOfficerDynamicText('4 Spieler mit mindestens 3 Tagen unter Ziel. 2 mit weniger als 5 aktiven Tagen bei vollständiger Erfassung. '+shieldSentence,lang);
  assert.ok(combined.includes(corrected[lang].count.split(' ')[0])||combined.includes('4')||combined.includes('４'),lang+': lost count');
  assert.ok(combined.includes(translateOfficerDynamicText(shieldSentence,lang)),lang+': shield meaning lost in composed sentence');
 }
});
