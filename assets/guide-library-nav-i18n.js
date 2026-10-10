// Navigation-only translations. Each order: featured, browse, back, count, week, category labels, search summary.
const DATA={
de:['Gerade wichtig','Alle Themen','Alle Themen','Guides','Aktuelle Woche','Allianz & Events','Kampfkraft','VS & Punkte','Season 1','Shops & Ressourcen','Suchergebnisse'],
en:['Important now','Browse topics','All topics','guides','Current week','Alliance & Events','Squads & Power','VS & Points','Season 1','Shops & Resources','Search results'],
uk:['Зараз важливо','Усі теми','Усі теми','гайдів','Поточний тиждень','Альянс і події','Бойова сила','VS і бали','Сезон 1','Магазини й ресурси','Результати пошуку'],
ja:['今チェック','すべてのテーマ','テーマに戻る','ガイド','今週','同盟とイベント','戦力アップ','VSとポイント','シーズン1','ショップと資源','検索結果'],
fr:['À voir maintenant','Tous les sujets','Tous les sujets','guides','Semaine actuelle','Alliance & Événements','Puissance & Escouades','VS & Points','Saison 1','Boutiques & Ressources','Résultats'],
it:['Da vedere ora','Tutti gli argomenti','Tutti gli argomenti','guide','Settimana attuale','Alleanza ed eventi','Potenza e squadre','VS e punti','Stagione 1','Negozi e risorse','Risultati'],
id:['Penting sekarang','Semua topik','Semua topik','panduan','Minggu ini','Aliansi & Event','Kekuatan Tempur','VS & Poin','Season 1','Toko & Sumber Daya','Hasil pencarian'],
ar:['مهم الآن','كل المواضيع','كل المواضيع','أدلة','الأسبوع الحالي','التحالف والفعاليات','القوة والفرق','VS والنقاط','الموسم 1','المتاجر والموارد','نتائج البحث'],
ko:['지금 중요한 가이드','전체 주제','전체 주제','가이드','이번 주','동맹 및 이벤트','전투력 강화','VS 및 점수','시즌 1','상점 및 자원','검색 결과'],
sv:['Viktigt just nu','Alla ämnen','Alla ämnen','guider','Aktuell vecka','Allians & Event','Trupper & Styrka','VS & Poäng','Säsong 1','Butiker & Resurser','Sökresultat'],
pt:['Importante agora','Todos os temas','Todos os temas','guias','Semana atual','Aliança e eventos','Poder de combate','VS e pontos','Temporada 1','Lojas e recursos','Resultados'],
nl:['Nu belangrijk','Alle onderwerpen','Alle onderwerpen','gidsen','Huidige week','Alliantie & Events','Gevechtskracht','VS & Punten','Seizoen 1','Winkels & Grondstoffen','Zoekresultaten'],
th:['สำคัญตอนนี้','หัวข้อทั้งหมด','หัวข้อทั้งหมด','คู่มือ','สัปดาห์ปัจจุบัน','พันธมิตรและกิจกรรม','พลังรบ','VS และคะแนน','ซีซัน 1','ร้านค้าและทรัพยากร','ผลการค้นหา'],
km:['សំខាន់ឥឡូវនេះ','ប្រធានបទទាំងអស់','ប្រធានបទទាំងអស់','មគ្គុទ្ទេសក៍','សប្ដាហ៍បច្ចុប្បន្ន','សម្ព័ន្ធ និងព្រឹត្តិការណ៍','កម្លាំងប្រយុទ្ធ','VS និងពិន្ទុ','រដូវកាល 1','ហាង និងធនធាន','លទ្ធផលស្វែងរក'],
fil:['Mahalaga ngayon','Lahat ng paksa','Lahat ng paksa','gabay','Kasalukuyang linggo','Alliance at Events','Lakas at Squads','VS at Puntos','Season 1','Shops at Resources','Mga resulta']
};
const KEYS=['featured','browse','back','count','week','alliance','power','vs','season','economy','results'];
export const GUIDE_NAV_TEXT=Object.freeze(Object.fromEntries(Object.entries(DATA).map(([lang,values])=>{
 if(values.length!==KEYS.length)throw new Error('Missing guide category labels: '+lang);
 return [lang,Object.freeze(Object.fromEntries(KEYS.map((key,i)=>[key,values[i]])))];
})));
export function guideNavText(lang,key){
 const value=GUIDE_NAV_TEXT[lang]?.[key];
 if(!value)throw new Error('Unknown guide navigation label '+lang+'/'+key);
 return value;
}
