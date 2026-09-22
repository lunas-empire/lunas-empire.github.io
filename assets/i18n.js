// Seven core languages stay in the main bundle; the remaining translations load on demand.
export const LANGUAGES = {de:'Deutsch',en:'English',uk:'Українська',ja:'日本語',fr:'Français',it:'Italiano',id:'Bahasa Indonesia',ar:'العربية',ko:'한국어',sv:'Svenska',pt:'Português',nl:'Nederlands',th:'ไทย',km:'ខ្មែរ',fil:'Filipino'};
export const LOCALES = {de:'de-DE',en:'en-GB',uk:'uk-UA',ja:'ja-JP',fr:'fr-FR',it:'it-IT',id:'id-ID',ar:'ar-SA-u-ca-gregory',ko:'ko-KR',sv:'sv-SE',pt:'pt-PT',nl:'nl-NL',th:'th-TH-u-ca-gregory',km:'km-KH-u-ca-gregory',fil:'fil-PH'};
const EXTRA_TRANSLATIONS = {};
const EXTRA_LOADERS = {
  ar:()=>import('./i18n-ar.js'),ko:()=>import('./i18n-ko.js'),sv:()=>import('./i18n-sv.js'),pt:()=>import('./i18n-pt.js'),
  nl:()=>import('./i18n-nl.js'),th:()=>import('./i18n-th.js'),km:()=>import('./i18n-km.js'),fil:()=>import('./i18n-fil.js')
};
export async function loadLanguage(lang) {
  const loader=EXTRA_LOADERS[lang];
  if (!loader || EXTRA_TRANSLATIONS[lang]) return;
  EXTRA_TRANSLATIONS[lang]=(await loader()).default;
}
export const UI = {
  today:['Heute','Today','Сьогодні','今日','Aujourd’hui','Oggi','Hari ini'],
  daily:['Täglich','Daily','Щодня','日課','Quotidien','Routine','Harian'],
  vs:['VS Duel','VS Duel','VS Duel','VS Duel','VS Duel','VS Duel','VS Duel'],
  season:['Season 1','Season 1','Сезон 1','シーズン1','Saison 1','Stagione 1','Season 1'],
  guides:['Guides','Guides','Поради','ガイド','Guides','Guide','Panduan'],
  guidesIntro:['Alle Guides als übersetzter Text mit ergänzender Originalgrafik. Antippen öffnet das Bild groß.','All guides as localized text with the original graphic as a visual aid. Tap an image to open it full size.','Усі гайди подано перекладеним текстом, а оригінальна схема слугує візуальною підказкою. Натисніть зображення, щоб відкрити його повністю.','すべてのガイドを翻訳テキストで掲載し、元画像は視覚的な補助として表示します。画像をタップすると原寸で開きます。','Tous les guides sont disponibles en texte traduit, avec l’image originale comme aide visuelle. Appuie sur une image pour l’ouvrir en grand.','Tutte le guide sono disponibili come testo tradotto, con la grafica originale come aiuto visivo. Tocca un’immagine per aprirla a grandezza intera.','Semua panduan tersedia sebagai teks terjemahan, dengan gambar asli sebagai bantuan visual. Ketuk gambar untuk membukanya penuh.'],
  quickReference:['Kurzreferenz','Quick reference','Коротка довідка','クイックリファレンス','Référence rapide','Riferimento rapido','Referensi cepat'],
  guideRules:['Regeln & Timing','Rules & timing','Правила й час','ルール・タイミング','Règles et timing','Regole e tempismo','Aturan & timing'],
  guideGrowth:['Account-Ausbau','Account growth','Розвиток акаунта','アカウント育成','Progression du compte','Crescita account','Pengembangan akun'],
  guidePlanning:['Sparen & Planen','Saving & planning','Збереження й планування','温存・計画','Épargne et planification','Risparmio e pianificazione','Simpan & rencanakan'],
  more:['Mehr','More','Ще','その他','Plus','Altro','Lainnya'],
  menu:['Menü','Menu','Меню','メニュー','Menu','Menu','Menu'],
  language:['Sprache','Language','Мова','言語','Langue','Lingua','Bahasa'],
  chooseLanguage:['Wähle deine Sprache','Choose your language','Оберіть мову','言語を選択','Choisis ta langue','Scegli la lingua','Pilih bahasa'],
  languagePrompt:['Du kannst die Sprache später jederzeit im Kopfbereich ändern.','You can change the language later from the header.','Мову завжди можна змінити пізніше у верхній частині сторінки.','言語は後からヘッダーでいつでも変更できます。','Tu pourras changer de langue plus tard dans l’en-tête.','Puoi cambiare lingua in seguito dall’intestazione.','Bahasa dapat diubah nanti dari bagian atas halaman.'],
  chooseSetup:['Sprache & Darstellung wählen','Choose language & appearance','Оберіть мову й оформлення','言語と表示を選択','Choisis la langue et l’apparence','Scegli lingua e aspetto','Pilih bahasa & tampilan'],
  setupPrompt:['Wähle beides jetzt aus. Du kannst Sprache und Darstellung später oben jederzeit ändern.','Choose both now. You can change language and appearance later from the header.','Оберіть обидва параметри зараз. Мову й оформлення можна змінити пізніше у верхній частині сторінки.','最初に言語と表示を選んでください。どちらも後からヘッダーで変更できます。','Choisis les deux maintenant. Tu pourras modifier la langue et l’apparence plus tard dans l’en-tête.','Scegli entrambi ora. Potrai cambiare lingua e aspetto in seguito dall’intestazione.','Pilih keduanya sekarang. Bahasa dan tampilan dapat diubah lagi nanti dari bagian atas halaman.'],
  continue:['Weiter','Continue','Продовжити','続ける','Continuer','Continua','Lanjutkan'],
  theme:['Darstellung','Appearance','Оформлення','表示設定','Apparence','Aspetto','Tampilan'],
  light:['Hell','Light','Світла','ライト','Clair','Chiaro','Terang'],
  dark:['Dunkel','Dark','Темна','ダーク','Sombre','Scuro','Gelap'],
  system:['System','System','Системна','端末に合わせる','Système','Sistema','Sistem'],
  admin:['R4/R5 Admin','R4/R5 Admin','R4/R5 Адмін','R4/R5 管理','R4/R5 Admin','R4/R5 Admin','Admin R4/R5'],
  adminPending:['Der geschützte Admin-Zugang wird eingerichtet. Bitte R4/R5 nach dem Zugang fragen.','Protected admin access is being set up. Ask R4/R5 for access.','Захищений доступ для керівництва налаштовується. Зверніться до R4/R5.','管理者用の保護されたページは準備中です。アクセスについてはR4/R5に確認してください。','L’accès administrateur protégé est en préparation. Demandez l’accès aux R4/R5.','L’accesso protetto per gli amministratori è in preparazione. Chiedi a R4/R5.','Akses admin yang terlindungi sedang disiapkan. Hubungi R4/R5 untuk akses.'],
  skip:['Zum Inhalt','Skip to content','До вмісту','本文へ','Aller au contenu','Vai al contenuto','Lewati ke konten'],
  serverDay:['Server-Tag','Server day','День сервера','サーバー日数','Jour du serveur','Giorno del server','Hari server'],
  seasonDay:['Season-Tag','Season day','День сезону','シーズン日数','Jour de saison','Giorno di stagione','Hari Season'],
  week:['Woche','Week','Тиждень','週','Semaine','Settimana','Minggu'],
  day:['Tag','Day','День','日目','Jour','Giorno','Hari'],
  pre:['Vor der Season','Pre-season','До початку сезону','シーズン開始前','Avant-saison','Pre-stagione','Pra-Season'],
  post:['Season abgeschlossen','Season complete','Сезон завершено','シーズン終了','Saison terminée','Stagione conclusa','Season selesai'],
  starts:['Season 1 startet in','Season 1 starts in','До початку сезону 1','シーズン1開始まで','La saison 1 commence dans','La stagione 1 inizia tra','Season 1 dimulai dalam'],
  countdown:['{d} Tage · {h} Std. · {m} Min.','{d} days · {h} hours · {m} min','{d} дн. · {h} год. · {m} хв.','{d}日 {h}時間 {m}分','{d} j · {h} h · {m} min','{d} giorni · {h} ore · {m} min','{d} hari · {h} jam · {m} mnt'],
  reset:['Reset 00:00 · Server Time (ST)','Reset 00:00 · Server Time (ST)','Скидання о 00:00 · Server Time (ST)','リセット 00:00 · Server Time (ST)','Réinitialisation à 00:00 · Server Time (ST)','Reset alle 00:00 · Server Time (ST)','Reset 00:00 · Server Time (ST)'],
  focus:['Dein Fokus heute','Your focus today','Твій фокус сьогодні','今日の優先事項','Tes priorités du jour','Le priorità di oggi','Prioritas hari ini'],
  starterTitle:['Unsicher, was heute zu tun ist?','Not sure what to do today?','Не впевнений, що робити сьогодні?','今日やることに迷ったら','Tu ne sais pas quoi faire aujourd’hui ?','Non sai cosa fare oggi?','Bingung harus melakukan apa hari ini?'],
  starterIntro:['Folge einfach dieser Reihenfolge:','Simply follow this order:','Просто дій у такому порядку:','この順番で確認しましょう。','Suis simplement cet ordre :','Segui semplicemente questo ordine:','Ikuti urutan ini:'],
  starterToday:['Sieh, was jetzt wichtig ist.','See what matters now.','Подивись, що важливо зараз.','今やるべきことを確認。','Vois ce qui compte maintenant.','Guarda cosa conta adesso.','Lihat apa yang penting sekarang.'],
  starterDaily:['Hake deine Grundaufgaben ab.','Check off your basic tasks.','Відміть основні щоденні справи.','基本の日課をチェック。','Coche tes tâches de base.','Spunta le attività di base.','Centang tugas dasarmu.'],
  starterVs:['Prüfe vor Ausgaben: heute nutzen oder für morgen sparen?','Check before spending: use today or save for tomorrow?','Перед витратами перевір: використати сьогодні чи зберегти на завтра?','使う前に確認：今日使う？明日に残す？','Avant de dépenser : utiliser aujourd’hui ou garder pour demain ?','Prima di spendere: usare oggi o conservare per domani?','Sebelum memakai: gunakan hari ini atau simpan untuk besok?'],
  dailyIntro:['Hier stehen deine wiederkehrenden Grundlagen. Beginne bei „Gratis & Shop“ und arbeite dich von oben nach unten durch.','These are your recurring basics. Start with “Freebies & shop” and work from top to bottom.','Тут зібрані основні регулярні справи. Почни з «Безкоштовне й магазин» і рухайся зверху вниз.','毎日の基本項目です。「無料報酬・ショップ」から始め、上から順に進めましょう。','Voici tes tâches de base récurrentes. Commence par « Cadeaux et boutique », puis avance de haut en bas.','Queste sono le attività di base ricorrenti. Inizia da “Omaggi e negozio” e procedi dall’alto verso il basso.','Ini adalah tugas dasar yang berulang. Mulai dari “Gratis & toko”, lalu kerjakan dari atas ke bawah.'],
  vsIntro:['VS Duel ist der wöchentliche Allianz-Wettbewerb. An jedem Wochentag geben andere Aktionen Punkte. Prüfe hier vor dem Einsatz von Ressourcen, was heute zählt.','VS Duel is the weekly alliance competition. Different actions score on each weekday. Check here before using resources to see what counts today.','VS Duel — це щотижневе змагання альянсів. Щодня очки дають різні дії. Перед витратами перевір тут, що зараховується сьогодні.','VS Duelは毎週の同盟対抗戦です。曜日ごとにポイント対象が変わります。資源を使う前に、今日の対象をここで確認しましょう。','Le VS Duel est la compétition hebdomadaire de l’alliance. Les actions qui rapportent changent chaque jour. Vérifie ici avant d’utiliser tes ressources.','VS Duel è la competizione settimanale dell’alleanza. Ogni giorno danno punti azioni diverse. Controlla qui prima di usare risorse.','VS Duel adalah kompetisi aliansi mingguan. Aktivitas yang memberi poin berbeda setiap hari. Cek di sini sebelum memakai sumber daya.'],
  important:['Wichtig','Important','Важливо','重要','Important','Importante','Penting'],
  call:['R4/R5-Call','R4/R5 call','Наказ R4/R5','R4/R5の指示','Consigne R4/R5','Indicazione R4/R5','Arahan R4/R5'],
  override:['Wenn eine aktuelle R4/R5-Anweisung vom Guide abweicht, gilt immer der neueste R4/R5-Call.','If a current R4/R5 instruction conflicts with this guide, follow the newest R4/R5 call.','Якщо цей гайд суперечить актуальній вказівці R4/R5, виконуйте найновішу вказівку R4/R5.','ガイドとR4/R5の最新の指示が異なる場合は、最新の指示に従ってください。','Si ce guide contredit une consigne actuelle de R4/R5, suivez toujours la plus récente.','Se una disposizione di R4/R5 contraddice questa guida, segui sempre quella più recente.','Jika panduan ini berbeda dengan arahan terbaru R4/R5, ikuti arahan terbaru tersebut.'],
  honest:['Deine Häkchen bleiben auf diesem Gerät. Spielstände, Schilde und Cooldowns werden nicht aus dem Spiel ausgelesen.','Your checkmarks stay on this device. Game progress, shields and cooldowns are not read from the game.','Позначки зберігаються на цьому пристрої. Прогрес, щити й таймери з гри не зчитуються.','チェックはこの端末に保存されます。ゲーム内の進捗、シールド、クールダウンとは連動していません。','Tes coches restent sur cet appareil. La progression, les boucliers et les délais ne sont pas lus dans le jeu.','Le spunte restano su questo dispositivo. Progressi, scudi e tempi di attesa non vengono letti dal gioco.','Centang tersimpan di perangkat ini. Progres, shield, dan cooldown tidak dibaca dari game.'],
  unavailableStorage:['Speichern blockiert. Häkchen bleiben nur bis zum Neuladen erhalten.','Storage is blocked. Checkmarks last only until you reload.','Сховище заблоковано. Позначки зникнуть після перезавантаження.','保存がブロックされています。再読み込みするとチェックが消えます。','Le stockage est bloqué. Les coches seront perdues au rechargement.','Salvataggio bloccato. Le spunte si perdono ricaricando la pagina.','Penyimpanan diblokir. Centang akan hilang saat halaman dimuat ulang.'],
  bestArms:['Bestes Arms Race Fenster','Best Arms Race window','Найкраще вікно Arms Race','おすすめのArms Race時間帯','Meilleur créneau Arms Race','Finestra Arms Race migliore','Waktu Arms Race terbaik'],
  later:['Heute später','Later today','Пізніше сьогодні','本日このあと','Plus tard aujourd’hui','Più tardi oggi','Nanti hari ini'],
  active:['Jetzt im Zeitfenster','In the window now','Вікно активне','現在この時間帯です','Créneau en cours','Finestra attiva','Sedang berlangsung'],
  ended:['Zeitfenster beendet','Window ended','Вікно завершено','時間帯終了','Créneau terminé','Finestra terminata','Waktunya sudah lewat'],
  unconfirmed:['Keine bestätigte Uhrzeit. Aktuellen Arms Race Plan im Spiel prüfen.','No confirmed time. Check the current Arms Race schedule in-game.','Час не підтверджено. Перевірте розклад Arms Race у грі.','確定した時間情報はありません。ゲーム内のArms Race予定を確認してください。','Aucun horaire confirmé. Vérifie le planning Arms Race dans le jeu.','Nessun orario confermato. Controlla Arms Race nel gioco.','Belum ada waktu yang dikonfirmasi. Periksa jadwal Arms Race di game.'],
  armsNote:['Alle Zeiten: Server Time (ST). Aktive Phase vor dem Einsatz im Spiel prüfen.','All times: Server Time (ST). Verify the active phase in-game before spending.','Увесь час: Server Time (ST). Перед витратами перевірте активну фазу в грі.','時刻はすべてServer Time (ST)です。使う前にゲーム内の開催項目を確認してください。','Horaires : Server Time (ST). Vérifie la phase active avant de dépenser.','Orari: Server Time (ST). Verifica la fase attiva prima di spendere.','Semua waktu: Server Time (ST). Cek fase aktif di game sebelum memakai sumber daya.'],
  save:['Für morgen sparen','Save for tomorrow','Зберегти на завтра','明日のために温存','À garder pour demain','Conserva per domani','Simpan untuk besok'],
  avoid:['Vermeiden','Avoid','Уникай','避けること','À éviter','Da evitare','Hindari'],
  tomorrow:['Morgen','Tomorrow','Завтра','明日','Demain','Domani','Besok'],
  next:['Als Nächstes','Next up','Далі','次の予定','À venir','In arrivo','Berikutnya'],
  thisWeek:['Diese Woche','This week','Цього тижня','今週','Cette semaine','Questa settimana','Minggu ini'],
  routine:['Tagesroutine','Daily routine','Щоденні справи','日課の進捗','Routine quotidienne','Routine giornaliera','Rutinitas harian'],
  progress:['{done} / {total} erledigt','{done} / {total} done','Виконано {done} / {total}','{done} / {total} 完了','{done} / {total} terminées','{done} / {total} completate','{done} / {total} selesai'],
  checklist:['Checkliste öffnen','Open checklist','Відкрити список','チェックリストへ','Ouvrir la liste','Apri la lista','Buka daftar'],
  minimum:['{points} VS-Punkte: tägliches Minimum. Das ist nicht automatisch der Punkt, an dem du aufhören solltest.','{points} VS points: daily minimum. This is not necessarily where you should stop.','{points} очок VS — щоденний мінімум, а не обов’язкова точка зупинки.','VSの1日の最低目標は{points}ポイント。達成後も状況に応じて続けましょう。','{points} points VS : minimum quotidien, pas forcément le moment de s’arrêter.','{points} punti VS: minimo giornaliero, non necessariamente il punto in cui fermarti.','{points} poin VS: minimum harian, bukan berarti harus berhenti setelah tercapai.'],
  freebies:['Gratis & Shop','Freebies & shop','Безкоштовне й магазин','無料報酬・ショップ','Cadeaux et boutique','Omaggi e negozio','Gratis & toko'],
  alliance:['Allianz','Alliance','Альянс','同盟','Alliance','Alleanza','Aliansi'],
  action:['Kämpfe & Events','Battles & events','Бої та події','戦闘・イベント','Combats et événements','Battaglie ed eventi','Pertempuran & event'],
  map:['Karte & Missionen','Map & missions','Карта та місії','マップ・ミッション','Carte et missions','Mappa e missioni','Peta & misi'],
  timing:['Cleveres Timing','Smart timing','Вдалий час','タイミングのコツ','Bon timing','Tempismo intelligente','Waktu yang tepat'],
  dailyFreq:['Täglich','Daily','Щодня','毎日','Chaque jour','Ogni giorno','Setiap hari'],
  twice:['Morgens & abends','Morning & evening','Вранці та ввечері','朝と夜','Matin et soir','Mattina e sera','Pagi & malam'],
  available:['Prüfen, ob heute verfügbar','Check if available today','Перевірте доступність сьогодні','本日利用できるか確認','Vérifie si disponible aujourd’hui','Controlla se disponibile oggi','Cek apakah tersedia hari ini'],
  every2:['Etwa alle 2 Tage; persönliche Verfügbarkeit prüfen.','About every 2 days; check your own availability.','Приблизно раз на 2 дні; перевірте власний таймер.','目安は約2日ごと。自分の利用状況を確認してください。','Environ tous les 2 jours ; vérifie ton propre délai.','Circa ogni 2 giorni; controlla la disponibilità personale.','Sekitar 2 hari sekali; cek ketersediaan di akunmu.'],
  first24:['Deine ersten 24 Stunden','Your first 24 hours','Твої перші 24 години','最初の24時間','Tes premières 24 heures','Le prime 24 ore','24 jam pertamamu'],
  details:['Details','Details','Докладніше','詳細','Détails','Dettagli','Detail'],
  timeline:['Season-Zeitplan','Season timeline','Розклад сезону','シーズンの流れ','Calendrier de saison','Calendario della stagione','Jadwal Season'],
  prep:['Vorbereitung','Preparation','Підготовка','準備','Préparation','Preparazione','Persiapan'],
  unlock:['Freischaltung','Unlock','Відкриття','解放条件','Déblocage','Sblocco','Buka'],
  immediate:['Sofort verfügbar','Available immediately','Доступна одразу','最初から利用可能','Disponible immédiatement','Disponibile subito','Langsung tersedia'],
  level:['Level','Level','Рівень','レベル','Niveau','Livello','Level'],
  resistance:['Virus-Resistenz','Virus resistance','Стійкість до вірусу','ウイルス耐性','Résistance au virus','Resistenza al virus','Resistensi virus'],
  max:['Maximum','Maximum','Максимум','上限','Maximum','Massimo','Maksimum'],
  search:['Guides durchsuchen','Search guides','Пошук порад','ガイドを検索','Rechercher un guide','Cerca nelle guide','Cari panduan'],
  shareGuide:['Guide teilen','Share guide','Поділитися гайдом','ガイドを共有','Partager le guide','Condividi guida','Bagikan panduan'],
  linkCopied:['Link kopiert','Link copied','Посилання скопійовано','リンクをコピーしました','Lien copié','Link copiato','Tautan disalin'],
  noResults:['Keine Treffer. Versuche einen anderen Begriff.','No matches. Try another term.','Нічого не знайдено. Спробуйте інше слово.','該当する内容がありません。別の言葉で検索してください。','Aucun résultat. Essaie un autre terme.','Nessun risultato. Prova un altro termine.','Tidak ditemukan. Coba kata lain.'],
  allDone:['Alles auf deiner Liste erledigt.','Everything on your list is done.','Усе зі списку виконано.','リストの項目はすべて完了しました。','Tout est coché sur ta liste.','Hai completato tutta la lista.','Semua tugas dalam daftar sudah selesai.'],
  settings:['Einstellungen','Settings','Налаштування','設定','Réglages','Impostazioni','Pengaturan'],
  installApp:['App installieren','Install app','Встановити застосунок','アプリをインストール','Installer l’app','Installa app','Instal aplikasi'],
  detectedSetup:['Sprache und Darstellung wurden automatisch erkannt.','Language and appearance were detected automatically.','Мову й оформлення визначено автоматично.','言語と表示設定を自動検出しました。','La langue et l’apparence ont été détectées automatiquement.','Lingua e aspetto sono stati rilevati automaticamente.','Bahasa dan tampilan terdeteksi otomatis.'],
  change:['Ändern','Change','Змінити','変更','Modifier','Modifica','Ubah'],
  filterAll:['Alle','All','Усі','すべて','Tous','Tutti','Semua'],
  filterCurrent:['Aktuell','Current','Актуальне','現在','Actuel','Attuali','Saat ini'],
  filterSeason:['Season','Season','Сезон','シーズン','Saison','Season','Season'],
  filterVs:['VS','VS','VS','VS','VS','VS','VS'],
  filterTech:['Tech','Tech','Технології','研究','Tech','Tech','Tech'],
  filterAccount:['Account','Account','Акаунт','アカウント','Compte','Account','Akun'],
  resultsCount:['{count} Treffer','{count} results','{count} результатів','{count}件','{count} résultats','{count} risultati','{count} hasil'],
  backToGuides:['Zurück zu Guides','Back to guides','Назад до гайдів','ガイド一覧へ','Retour aux guides','Torna alle guide','Kembali ke panduan'],
  backToTop:['Nach oben','Back to top','Вгору','トップへ','Haut de page','Torna su','Ke atas'],
  shareSection:['Abschnitt teilen','Share section','Поділитися розділом','セクションを共有','Partager la section','Condividi sezione','Bagikan bagian'],
  seasonNow:['Jetzt','Now','Зараз','現在','Maintenant','Ora','Sekarang'],
  seasonWeekFocus:['Diese Woche','This week','Цього тижня','今週','Cette semaine','Questa settimana','Minggu ini'],
  nextMilestone:['Nächster Meilenstein','Next milestone','Наступний етап','次の節目','Prochaine étape','Prossimo traguardo','Target berikutnya'],
  philosophy:['Wichtige Upgrades möglichst mit Rewards und Punkten kombinieren.','Time important upgrades to earn rewards and points together.','Поєднуйте важливі покращення з нагородами й очками.','大きな強化は、報酬とポイントを同時に得られるタイミングで。','Fais coïncider les améliorations importantes avec des récompenses et des points.','Combina gli upgrade importanti con ricompense e punti.','Lakukan upgrade penting saat bisa mendapat hadiah sekaligus poin.'],
};
export function resolveLanguagePreference(stored, legacy, browserLanguages = []) {
  const saved = [stored,legacy].find(value=>Object.hasOwn(LANGUAGES,value));
  if (saved) return {lang:saved,needsSelection:false,detected:false};
  const detected=[...browserLanguages].map(value=>String(value).toLowerCase().split('-')[0]).find(value=>Object.hasOwn(LANGUAGES,value));
  return {lang:detected || 'en',needsSelection:false,detected:true};
}
export function translate(table, key, lang, values = {}) {
  const row = table[key];
  if (!row) throw new Error(`Missing translation: ${key}`);
  const baseLanguages = ['de','en','uk','ja','fr','it','id'];
  const baseIndex = baseLanguages.indexOf(lang);
  const value = baseIndex >= 0 ? row[baseIndex] : EXTRA_TRANSLATIONS[lang]?.[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing translation: ${key} [${lang}]`);
  return value.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? `{${k}}`);
}
