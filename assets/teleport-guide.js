// Free cross-server teleport guide, intentionally kept independent of the member tracker.
export const TELEPORT_GUIDE_ID='free-teleport';
// Fields: title, lead, VS title/steps, Season title/steps, hive title/steps,
// warnings title/bullets, diagram captions (all visible guide copy is localized).
const COPY={
 de:[
 'Kostenlos teleportieren – VS, Season & Hive umziehen',
 'Mit dem kostenlosen Cross-Server-Teleport kannst du deinen Standort wechseln, ohne einen Allianz- oder Erweiterten Teleport aus dem Inventar zu verbrauchen. Der Weg hängt vom freigeschalteten Event ab.',
 'Samstag: kostenlos über das VS-Duell',
 'Öffne Duell VS → Allianzangriffe (Alliance Assaults) → Angreifen (Attack). Das funktioniert nur, wenn der Cross-Server-Kampf freigeschaltet ist.||Du kommst in die gegnerische Warzone. Prüfe deinen Standort und den Schutzstatus, bevor du angreifst oder dich neu platzierst.||Zum Heimkehren auf die Serverleiste mit Rückkehr-Pfeil tippen. Der Rücksprung erfolgt am aktuellen Allianz-Sammelpunkt. Anschließend kann für einen erneuten Sprung eine Abklingzeit von etwa 5 Minuten gelten.',
 'In der Season: Grouping / Gruppierung',
 'Ab der entsprechenden Season-Freischaltung (in Season 1 typischerweise Woche 3) Season-Menü → Grouping / Gruppierung öffnen.||Wähle die freigegebene Warzone deiner Season-Gruppe und nutze die dort angebotene Teleport-Option. Erst Ziel und Schutz prüfen, dann bestätigen.||Für die Rückkehr die Rückreise-Funktion im Spiel verwenden. Event- und Season-Regeln können den Teleport einschränken; wenn Grouping nicht verfügbar ist, nicht mit einem kostenlosen Sprung rechnen.',
 'R4/R5: den Hive ohne persönliche Teleporter versetzen',
 'R4/R5 legt zuerst den neuen Allianz-Sammelpunkt am Zielort fest und teilt die Position im Chat.||Mitglieder nutzen einen gerade verfügbaren Cross-Server-Sprung und kehren über die Rückreise-Funktion zum aktuellen Sammelpunkt zurück. Erst mit wenigen Freiwilligen testen, dann die gesamte Allianz koordinieren.',
 'Vorher unbedingt prüfen',
 'Samstag/Season kann PvP auch in fremden Warzones aktiv sein. Ohne sicheren Schild nicht ungeschützt offline gehen. Auf kontaminiertem Gebiet gelten besondere Schildregeln.||In Season 2 kann eine eingefrorene Basis nicht teleportieren. Auch laufende Märsche, belegte Plätze und Eventfenster können einen Sprung verhindern.||Der kostenlose Rückweg und die Wiederholungs-Abklingzeit sind nicht dasselbe: Nach einer Rückkehr kann ein erneuter Hinflug zunächst gesperrt sein. Menübezeichnungen unterscheiden sich je nach Spielversion.',
 'Schematischer Ablauf: über VS oder Season in die andere Warzone und zurück',
 'Schematischer Hive-Umzug: R4/R5 verschiebt zuerst den Sammelpunkt; Rückkehrer landen am neuen Sammelpunkt'
 ],
 en:[
 'Free Teleport – VS, Season & Relocating Your Hive',
 'Use an eligible cross-server event to travel and return without spending a personal Alliance or Advanced Teleport item. The available route depends on the event and your season unlock.',
 'Saturday: Free Travel via VS Duel',
 'Open Duel VS → Alliance Assaults → Attack when cross-server combat is open.||You arrive in the opposing Warzone. Check your location and shield before attacking or relocating.||Tap the server bar and its return arrow to go home to your alliance’s current Assembly Point. A repeat outbound jump may then have an approximately five-minute cooldown.',
 'During Seasons: Grouping Teleport',
 'After your season unlocks Grouping (usually Week 3 in Season 1), open Season → Grouping.||Select an eligible Warzone in your season group and use the offered teleport option. Verify the destination and protection first.||Use the in-game return control to travel home. Season and event rules vary; an unavailable Grouping button does not mean a free teleport is available.',
 'R4/R5: Move the Hive Without Personal Teleports',
 'R4/R5 first moves the Alliance Assembly Point to the agreed destination and shares the location.||Members travel out using an available cross-server route and then return to the current Assembly Point. Test with a few volunteers before relocating the alliance.',
 'Safety & Restrictions',
 'Saturday and season combat can expose bases on foreign servers. Stay shielded when needed; contaminated soil has special shield restrictions.||A Frozen base in Season 2 cannot teleport. Marches, placement limits and event windows can also block moves.||An immediate return is not the same as an instant repeat departure: a new outbound jump may require waiting about five minutes. In-game labels vary by version.',
 'Illustrated route: travel via VS or Season Grouping and return home',
 'Illustrated hive move: officers change the assembly point first; returning members arrive at the new point'
 ],
 uk:[
 'Безкоштовний телепорт: VS, Season та перенесення баз',
 'Під час доступних міжсерверних подій можна переміщатися без особистого Alliance або Advanced Teleport.',
 'Субота: через VS Duel',
 'Відкрийте Duel VS → Alliance Assaults → Attack під час активної міжсерверної битви.||Перевірте місце появи й щит у ворожій Warzone.||Натисніть стрілку повернення біля назви сервера, щоб повернутися до поточного пункту збору альянсу. Повторний виліт може мати затримку близько 5 хвилин.',
 'У сезоні: Grouping',
 'Після відкриття функції (у Season 1 зазвичай із третього тижня) зайдіть у Season → Grouping.||Оберіть доступну Warzone й підтвердьте телепорт після перевірки місця та захисту.||Поверніться через ігрову кнопку повернення. Правила сезону й події можуть обмежувати перехід.',
 'R4/R5: перенесення вулика',
 'Спочатку R4/R5 переносить пункт збору альянсу та повідомляє координати.||Учасники переходять на інший сервер через доступну подію і повертаються до нового пункту. Спочатку перевірте спосіб із кількома добровольцями.',
 'Обережно',
 'У суботу та під час сезону можливі PvP-атаки. Перевірте щит; на зараженій землі діють особливі правила.||У Season 2 заморожена база не може телепортуватися. Марші та обмеження подій також можуть завадити.||Швидке повернення не скасовує затримку перед наступним вильотом.',
 'Схема переходу через VS або Grouping і повернення', 'Схема перенесення пункту збору та вулика'
 ],
 ja:[
 '無料テレポート：VS・Season・ハイブ移動',
 '対象のサーバー間イベントでは、個人のAlliance / Advanced Teleportを消費せず移動できます。',
 '土曜日：VS Duelから',
 'サーバー間戦闘中にDuel VS → Alliance Assaults → Attackを開く。||敵Warzoneで位置とシールドを確認する。||サーバー名の横の帰還矢印で同盟の現在の集合地点へ戻る。再出発には約5分のクールダウンがある場合があります。',
 'Season中：Grouping',
 'Season 1では通常第3週ごろの解放後、Season → Groupingを開く。||移動可能なWarzoneを選び、着地点と保護を確認して確定する。||ゲーム内の帰還操作で戻る。Seasonやイベントの条件によって使えない場合があります。',
 'R4/R5：ハイブを無料移転',
 'R4/R5が先に同盟集合地点を移し、場所を共有する。||メンバーが利用可能なサーバー間移動で出発し、新しい集合地点へ帰還する。まず少人数で試してください。',
 '注意事項',
 '土曜やSeason戦闘ではPvPに注意。汚染地には特別なシールド制限があります。||Season 2で基地が凍結するとテレポート不可。行軍中やイベント制限も確認してください。||即時帰還できても次の出発には待ち時間が発生する場合があります。',
 'VS・Groupingで移動し帰還する流れ', '新しい同盟集合地点へのハイブ移動'
 ],
 fr:[
 'Téléportation gratuite : VS, saison et déplacement du groupe',
 'Pendant certains événements interserveurs, déplacez-vous sans consommer de téléportation Alliance ou Avancée personnelle.',
 'Samedi : via le duel VS',
 'Ouvrez Duel VS → Alliance Assaults → Attack pendant le combat interserveurs.||Vérifiez votre emplacement et votre bouclier dans la Warzone adverse.||Utilisez la flèche de retour près du nom du serveur pour revenir au point de rassemblement actuel. Un nouveau départ peut imposer environ 5 minutes de délai.',
 'Pendant la saison : Grouping',
 'Après le déblocage (généralement semaine 3 en saison 1), ouvrez Season → Grouping.||Choisissez une Warzone autorisée et vérifiez votre protection avant de confirmer.||Revenez par le bouton de retour du jeu. Les restrictions varient selon la saison et l’événement.',
 'R4/R5 : déplacer la ruche',
 'R4/R5 déplace d’abord le point de rassemblement et partage sa position.||Les membres passent sur un serveur étranger puis reviennent au nouveau point. Faites d’abord un essai avec quelques volontaires.',
 'Risques et limites',
 'Attention au PvP du samedi et de saison. Les zones contaminées imposent des restrictions de bouclier.||En saison 2, une base gelée ne peut pas se téléporter. Les marches et conditions d’événement peuvent bloquer le mouvement.||Un retour immédiat n’annule pas le délai avant un nouveau départ.',
 'Schéma du trajet via VS ou Grouping et du retour', 'Schéma du déplacement du point de rassemblement'
 ],
 it:[
 'Teletrasporto gratis: VS, Season e trasferimento Hive',
 'Durante gli eventi tra server disponibili puoi viaggiare senza usare teletrasporti personali Alliance o Advanced.',
 'Sabato: tramite VS Duel',
 'Apri Duel VS → Alliance Assaults → Attack durante la battaglia tra server.||Controlla posizione e scudo nella Warzone nemica.||Usa la freccia di ritorno accanto al nome del server per tornare al punto di raccolta attuale. Un nuovo salto può richiedere circa 5 minuti.',
 'Durante la Season: Grouping',
 'Dopo lo sblocco (di solito settimana 3 in Season 1), apri Season → Grouping.||Seleziona una Warzone disponibile e verifica protezione e destinazione prima di confermare.||Torna usando il comando di ritorno nel gioco. Le restrizioni dipendono dalla stagione.',
 'R4/R5: spostare l’Hive',
 'R4/R5 sposta prima il punto di raccolta alleanza e comunica la posizione.||I membri visitano un altro server con un evento disponibile e tornano al nuovo punto. Fai prima una prova con pochi volontari.',
 'Rischi e limiti',
 'Attenzione al PvP del sabato e della Season; il terreno contaminato limita gli scudi.||In Season 2 una base congelata non può teletrasportarsi; anche marce ed eventi possono bloccare i salti.||Il ritorno immediato non elimina il tempo di attesa per la partenza successiva.',
 'Percorso illustrato via VS o Grouping e ritorno', 'Spostamento illustrato del punto di raccolta'
 ],
 id:[
 'Teleport Gratis: VS, Season, dan Pindah Hive',
 'Gunakan event lintas-server yang aktif tanpa menghabiskan Alliance atau Advanced Teleport pribadi.',
 'Sabtu: melalui VS Duel',
 'Buka Duel VS → Alliance Assaults → Attack saat pertempuran lintas-server tersedia.||Periksa posisi dan shield di Warzone lawan.||Tekan panah kembali di dekat nama server untuk kembali ke Assembly Point aliansi saat ini. Lompatan berikutnya mungkin perlu cooldown sekitar 5 menit.',
 'Saat Season: Grouping',
 'Setelah terbuka (umumnya minggu 3 Season 1), buka Season → Grouping.||Pilih Warzone yang tersedia dan periksa tujuan serta perlindungan sebelum konfirmasi.||Kembali lewat kontrol dalam game. Aturan season dan event bisa membatasi teleport.',
 'R4/R5: pindahkan Hive',
 'R4/R5 lebih dulu memindahkan Assembly Point aliansi dan membagikan lokasi.||Anggota keluar melalui event lintas-server lalu kembali ke titik baru. Uji dengan beberapa relawan dulu.',
 'Risiko dan batasan',
 'PvP pada Sabtu dan Season berbahaya; tanah terkontaminasi memiliki aturan shield khusus.||Di Season 2, base yang Frozen tidak bisa teleport. March dan batas event juga bisa menghalangi.||Kembali cepat tidak berarti bisa langsung berangkat lagi.',
 'Alur teleport lewat VS atau Grouping dan kembali', 'Diagram pemindahan Hive ke titik baru'
 ],
 ar:[
 'الانتقال المجاني: VS والموسم ونقل تجمع التحالف',
 'في أحداث الانتقال بين الخوادم المتاحة يمكنك السفر دون استهلاك أدوات Alliance أو Advanced Teleport الشخصية.',
 'السبت: عبر VS Duel',
 'افتح Duel VS ثم Alliance Assaults ثم Attack أثناء تفعيل القتال بين الخوادم.||تحقق من الموقع والدرع في منطقة الخصم.||استخدم سهم العودة بجانب اسم الخادم للرجوع إلى نقطة تجمع التحالف الحالية. قد يلزم انتظار نحو 5 دقائق قبل رحلة جديدة.',
 'أثناء الموسم: Grouping',
 'بعد فتح الميزة (عادةً الأسبوع الثالث في Season 1) افتح Season ثم Grouping.||اختر منطقة حرب مسموحة وتحقق من المكان والحماية قبل التأكيد.||عد باستخدام خيار العودة داخل اللعبة. قد تختلف القيود حسب الموسم والحدث.',
 'R4/R5: نقل تجمع القواعد',
 'ينقل R4/R5 نقطة التجمع أولاً ويشارك موقعها.||يسافر الأعضاء عبر حدث متاح ثم يعودون إلى النقطة الجديدة. جرّبوا مع مجموعة صغيرة أولاً.',
 'تنبيهات مهمة',
 'قد تنشط معارك PvP يوم السبت وخلال الموسم؛ للأرض الملوثة قيود خاصة على الدروع.||في Season 2 لا تستطيع القاعدة المتجمدة الانتقال، وقد تمنع المسيرات وقيود الأحداث ذلك أيضاً.||العودة الفورية لا تلغي انتظار الرحلة التالية.',
 'رسم توضيحي للسفر عبر VS أو Grouping والعودة', 'رسم توضيحي لنقل نقطة تجمع التحالف'
 ],
 ko:[
 '무료 텔레포트: VS · Season · 하이브 이동',
 '서버 간 이벤트가 열리면 개인 Alliance 또는 Advanced Teleport 아이템을 쓰지 않고 이동할 수 있습니다.',
 '토요일: VS Duel 이용',
 '서버 간 전투 중 Duel VS → Alliance Assaults → Attack을 누릅니다.||상대 Warzone에서 위치와 보호막을 확인하세요.||서버 이름 옆 귀환 화살표로 현재 동맹 집결지로 돌아갑니다. 다시 출발하려면 약 5분 대기가 필요할 수 있습니다.',
 'Season 중: Grouping',
 '기능 해금 후(Season 1은 보통 3주 차) Season → Grouping을 엽니다.||이동 가능한 Warzone을 고르고 위치와 보호 상태를 확인한 뒤 확정합니다.||게임 내 귀환 기능으로 돌아옵니다. Season 및 이벤트 제한을 확인하세요.',
 'R4/R5: 하이브 이동',
 'R4/R5가 먼저 동맹 집결지를 새 위치로 옮기고 좌표를 공유합니다.||멤버들은 가능한 서버 간 이벤트로 이동했다가 새 집결지로 귀환합니다. 소수 인원으로 먼저 시험하세요.',
 '주의 및 제한',
 '토요일과 Season의 PvP에 주의하고 오염된 땅의 보호막 제한을 확인하세요.||Season 2에서 기지가 Frozen 상태면 텔레포트할 수 없습니다. 행군과 이벤트 제한도 확인하세요.||즉시 귀환해도 재출발에는 대기시간이 있을 수 있습니다.',
 'VS 또는 Grouping 이동 및 귀환 경로', '새 동맹 집결지로 하이브 이동'
 ],
 sv:[
 'Gratis teleport: VS, Season och flytta basgruppen',
 'Under tillgängliga serverevent kan du resa utan att använda egna Alliance- eller Advanced Teleport-föremål.',
 'Lördag: via VS Duel',
 'Öppna Duel VS → Alliance Assaults → Attack när serverstriden är öppen.||Kontrollera position och sköld i motståndarens Warzone.||Använd returpilen vid servernamnet för att komma till alliansens aktuella samlingspunkt. Ny avresa kan kräva cirka 5 minuters väntan.',
 'Under Season: Grouping',
 'Efter upplåsning (vanligen vecka 3 i Season 1), öppna Season → Grouping.||Välj en tillgänglig Warzone och kontrollera mål och skydd innan du bekräftar.||Använd spelets returfunktion. Regler kan skilja mellan säsonger och event.',
 'R4/R5: flytta Hive',
 'R4/R5 flyttar först alliansens samlingspunkt och delar positionen.||Medlemmarna reser till en annan server via ett tillgängligt event och återvänder till den nya punkten. Testa med några frivilliga först.',
 'Risker och begränsningar',
 'PvP på lördagar och under Season kan vara farligt; kontaminerad mark har särskilda sköldregler.||I Season 2 kan en Frozen bas inte teleportera. Marscher och eventbegränsningar kan också stoppa flytten.||Omedelbar återresa betyder inte att ny avresa saknar väntetid.',
 'Illustration av resa via VS eller Grouping och retur', 'Illustration av flyttad samlingspunkt'
 ],
 pt:[
 'Teleporte grátis: VS, Season e mudança da Hive',
 'Durante eventos entre servidores disponíveis, você pode viajar sem gastar Alliance ou Advanced Teleport pessoal.',
 'Sábado: pelo VS Duel',
 'Abra Duel VS → Alliance Assaults → Attack durante o combate entre servidores.||Confira a posição e o escudo na Warzone inimiga.||Use a seta de retorno ao lado do servidor para voltar ao ponto de reunião atual da aliança. Outra saída pode exigir cerca de 5 minutos.',
 'Na Season: Grouping',
 'Após o desbloqueio (normalmente semana 3 da Season 1), abra Season → Grouping.||Escolha uma Warzone permitida e confira destino e proteção antes de confirmar.||Volte pelo comando do jogo. As regras variam conforme a Season e o evento.',
 'R4/R5: mudar a Hive',
 'R4/R5 move primeiro o ponto de reunião da aliança e compartilha o local.||Membros vão para outro servidor por um evento disponível e retornam ao novo ponto. Teste primeiro com alguns voluntários.',
 'Riscos e limites',
 'Cuidado com PvP no sábado e na Season; áreas contaminadas têm regras especiais de escudo.||Na Season 2 uma base Frozen não pode teleportar. Marchas e eventos também podem impedir a viagem.||Retorno imediato não significa nova saída sem espera.',
 'Rota ilustrada via VS ou Grouping e retorno', 'Mudança ilustrada do ponto de reunião'
 ],
 nl:[
 'Gratis teleporteren: VS, Season en de Hive verplaatsen',
 'Tijdens geschikte serverevents kun je reizen zonder eigen Alliance- of Advanced Teleport-items te gebruiken.',
 'Zaterdag: via VS Duel',
 'Open Duel VS → Alliance Assaults → Attack zodra het servergevecht open is.||Controleer je positie en schild in de vijandelijke Warzone.||Tik op de terugpijl bij de servernaam om terug te keren naar het huidige verzamelpunt. Voor een nieuwe reis geldt mogelijk circa 5 minuten wachttijd.',
 'Tijdens Season: Grouping',
 'Na ontgrendeling (meestal week 3 in Season 1), open Season → Grouping.||Kies een toegestane Warzone en controleer bestemming en bescherming voor bevestiging.||Keer terug via de knop in het spel. Regels verschillen per seizoen en event.',
 'R4/R5: de Hive verplaatsen',
 'R4/R5 verplaatst eerst het verzamelpunt van de alliantie en deelt de locatie.||Leden reizen via een beschikbaar serverevent en keren terug naar het nieuwe punt. Test eerst met enkele vrijwilligers.',
 'Risico’s en beperkingen',
 'Let op PvP op zaterdag en tijdens Season; besmet gebied heeft bijzondere schildregels.||In Season 2 kan een Frozen basis niet teleporteren. Ook marsen en eventvoorwaarden kunnen dit blokkeren.||Direct terugkeren betekent niet dat je direct opnieuw kunt vertrekken.',
 'Route via VS of Grouping en terugkeer', 'Verplaatsing van het verzamelpunt en de Hive'
 ],
 th:[
 'เทเลพอร์ตฟรี: VS, Season และย้าย Hive',
 'ช่วงกิจกรรมข้ามเซิร์ฟเวอร์ที่เปิดอยู่ สามารถย้ายโดยไม่ใช้ไอเทม Alliance หรือ Advanced Teleport ส่วนตัว',
 'วันเสาร์: ผ่าน VS Duel',
 'เปิด Duel VS → Alliance Assaults → Attack เมื่อกิจกรรมข้ามเซิร์ฟเวอร์เปิด||ตรวจสอบตำแหน่งและโล่ใน Warzone ของฝ่ายตรงข้าม||แตะลูกศรกลับข้างชื่อเซิร์ฟเวอร์เพื่อกลับจุดรวมพลพันธมิตรปัจจุบัน การเดินทางใหม่อาจต้องรอประมาณ 5 นาที',
 'ระหว่าง Season: Grouping',
 'เมื่อปลดล็อกแล้ว (Season 1 มักเป็นสัปดาห์ที่ 3) เปิด Season → Grouping||เลือก Warzone ที่เข้าได้ ตรวจสอบตำแหน่งและการป้องกันก่อนยืนยัน||ใช้ปุ่มกลับในเกม กฎของ Season และกิจกรรมอาจจำกัดการย้าย',
 'R4/R5: ย้าย Hive',
 'R4/R5 ย้ายจุดรวมพลพันธมิตรไปจุดใหม่ก่อน แล้วแจ้งตำแหน่ง||สมาชิกเดินทางไปอีกเซิร์ฟเวอร์ผ่านกิจกรรมที่เปิด แล้วกลับมายังจุดใหม่ ทดลองกับอาสาสมัครไม่กี่คนก่อน',
 'ข้อควรระวัง',
 'วันเสาร์และ Season อาจมี PvP พื้นที่ปนเปื้อนมีกฎโล่พิเศษ||ใน Season 2 ฐานที่ Frozen ไม่สามารถเทเลพอร์ตได้ การเดินทัพและเงื่อนไขกิจกรรมก็อาจขัดขวาง||กลับได้ทันทีไม่ได้หมายความว่าออกเดินทางใหม่ได้ทันที',
 'แผนภาพการเดินทางผ่าน VS หรือ Grouping แล้วกลับ', 'แผนภาพการย้ายจุดรวมพลของ Hive'
 ],
 km:[
 'Teleport ឥតគិតថ្លៃ៖ VS, Season និងផ្លាស់ទី Hive',
 'ពេលព្រឹត្តិការណ៍ឆ្លង Server បើក អ្នកអាចផ្លាស់ទីដោយមិនចំណាយ Alliance ឬ Advanced Teleport ផ្ទាល់ខ្លួន។',
 'ថ្ងៃសៅរ៍៖ តាម VS Duel',
 'បើក Duel VS → Alliance Assaults → Attack នៅពេលប្រយុទ្ធឆ្លង Server។||ពិនិត្យទីតាំង និង Shield នៅ Warzone គូប្រកួត។||ចុចព្រួញត្រឡប់ក្បែរឈ្មោះ Server ដើម្បីត្រឡប់ទៅកន្លែងប្រមូលផ្តុំបច្ចុប្បន្ន។ ការធ្វើដំណើរថ្មីអាចរង់ចាំប្រហែល 5 នាទី។',
 'ក្នុង Season៖ Grouping',
 'ក្រោយពេលបើកមុខងារ (Season 1 ជាទូទៅសប្តាហ៍ទី 3) ចូល Season → Grouping។||ជ្រើស Warzone ដែលអនុញ្ញាត និងពិនិត្យការការពារមុនបញ្ជាក់។||ប្រើប៊ូតុងត្រឡប់ក្នុងហ្គេម។ ច្បាប់អាចខុសគ្នាតាម Season។',
 'R4/R5៖ ផ្លាស់ទី Hive',
 'R4/R5 ផ្លាស់ទីកន្លែងប្រមូលផ្តុំសម្ព័ន្ធជាមុន ហើយចែករំលែកទីតាំង។||សមាជិកចេញទៅ Server ផ្សេងតាមព្រឹត្តិការណ៍ ហើយត្រឡប់មកកន្លែងថ្មី។ សាកល្បងជាមួយមនុស្សតិចមុន។',
 'ការប្រុងប្រយ័ត្ន',
 'PvP ថ្ងៃសៅរ៍ និង Season អាចមានគ្រោះថ្នាក់។ ដីកខ្វក់មានច្បាប់ Shield ពិសេស។||ក្នុង Season 2 មូលដ្ឋាន Frozen មិនអាច Teleport។ កងទ័ពកំពុងដើរ និងព្រឹត្តិការណ៍ក៏អាចរារាំងបាន។||ការត្រឡប់ភ្លាមៗមិនមានន័យថាអាចចេញភ្លាមៗទៀតទេ។',
 'គំនូសផ្លូវតាម VS ឬ Grouping និងត្រឡប់', 'គំនូសបង្ហាញការផ្លាស់ទី Hive'
 ],
 fil:[
 'Libreng Teleport: VS, Season at Paglipat ng Hive',
 'Kapag bukas ang cross-server event, makakalipat nang hindi gumagamit ng sariling Alliance o Advanced Teleport.',
 'Sabado: sa VS Duel',
 'Buksan ang Duel VS → Alliance Assaults → Attack kapag aktibo ang cross-server battle.||Suriin ang lokasyon at shield sa Warzone ng kalaban.||Pindutin ang return arrow sa tabi ng server name para bumalik sa kasalukuyang Alliance Assembly Point. Maaaring may humigit-kumulang 5 minutong cooldown bago umalis muli.',
 'Sa Season: Grouping',
 'Pag na-unlock (karaniwan linggo 3 ng Season 1), buksan ang Season → Grouping.||Piliin ang puwedeng Warzone at tingnan ang lokasyon at proteksyon bago kumpirmahin.||Gamitin ang return control sa laro. Maaaring mag-iba ang tuntunin ng Season at event.',
 'R4/R5: ilipat ang Hive',
 'Ilipat muna ng R4/R5 ang Alliance Assembly Point at ibahagi ang lokasyon.||Pumunta ang members sa ibang server gamit ang aktibong event at bumalik sa bagong point. Subukan muna sa ilang boluntaryo.',
 'Mga babala',
 'May PvP tuwing Sabado at sa Season; may espesyal na shield rules sa contaminated land.||Sa Season 2, hindi puwedeng mag-teleport ang Frozen base. Maaari ring humarang ang marches at event rules.||Ang agarang pagbalik ay hindi nangangahulugang walang cooldown ang susunod na biyahe.',
 'Daloy ng VS o Grouping teleport at pagbalik', 'Paglipat ng Assembly Point at Hive'
 ]
};
const SRC=[
 ['Last War Game – Free Cross-Server Teleport','https://www.lastwargame.online/en/teleport-guide/'],
 ['LastWar FAQ – Warzone Grouping Screenshots','https://www.tkw.world/lastwar-faq'],
 ['Last War Guide – Attacking Players / Grouping','https://lastwarguide.net/en/conseils-de-jeu/the-guide-to-attacking-players'],
 ['Last War Survival – Season 1 Warzone rules','https://lastwarsurvival.com/guides/ultimate-war-rules-guide-for-season-1'],
 ['R5Tools – Season 2 Polar Storm','https://r5tools.io/seasons/s2-polar-storm.html']
];
export function teleportGuideTitle(lang){return (COPY[lang]||COPY.en)[0];}
export function teleportGuideHtml(lang,escape){
 const c=COPY[lang]||COPY.en;const e=escape;
 const steps=(value)=>'<ol class="teleport-steps">'+value.split('||').map(s=>'<li>'+e(s)+'</li>').join('')+'</ol>';
 const warnings=(value)=>'<ul class="teleport-warnings">'+value.split('||').map(s=>'<li>'+e(s)+'</li>').join('')+'</ul>';
 const photo=(name,description,source)=> {
  const src='/assets/member/teleport/'+name;
  return '<figure class="teleport-photo"><a href="'+src+'" target="_blank" rel="noopener noreferrer"><img src="'+src+'" loading="lazy" decoding="async" alt="'+e(description)+'"></a><figcaption><a href="'+source+'" target="_blank" rel="noopener noreferrer">'+e(description)+'</a></figcaption></figure>';
 };
 const vs=c[3].split('||'),season=c[5].split('||');
 const vsGallery='<div class="teleport-photos teleport-photos--vs">'+
  photo('teleport-vs.webp',vs[0],'https://www.lastwargame.online/en/teleport-guide/')+
  photo('teleport-place.webp',vs[1],'https://www.lastwargame.online/en/teleport-guide/')+
  photo('teleport-return.webp',vs[2],'https://www.lastwargame.online/en/teleport-guide/')+'</div>';
 const seasonGallery='<div class="teleport-photos teleport-photos--season">'+
  photo('teleport-season-grouping.png',season[0],'https://www.tkw.world/lastwar-faq')+
  photo('teleport-season-server.png',season[1],'https://www.tkw.world/lastwar-faq')+'</div>';
 return '<div class="practical-guide teleport-guide">'+
 '<p class="practical-lead">'+e(c[1])+'</p>'+
 '<h3>'+e(c[2])+'</h3>'+steps(c[3])+vsGallery+
 '<h3>'+e(c[4])+'</h3>'+steps(c[5])+seasonGallery+
 '<h3>'+e(c[6])+'</h3>'+steps(c[7])+
 '<h3>'+e(c[8])+'</h3>'+warnings(c[9])+
 '<footer class="practical-sources">'+SRC.map(([title,url])=>'<a href="'+e(url)+'" rel="noopener noreferrer" target="_blank">'+e(title)+'</a>').join(' · ')+'</footer></div>';
}
export const TELEPORT_GUIDE_SEARCH='teleport free kostenlos umziehen hive rally assembly point warzone grouping saison season enemy buster vs server jum';
