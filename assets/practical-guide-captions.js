import { PRACTICAL_GUIDE_IDS } from './practical-guide-i18n.js';

// Short factual captions for the in-game screenshot used by each guide.
const CAPTIONS={
de:['Vorder- und Hinterreihe','Die vier Drohnenchip-Slots','Legendäre Ausrüstung am Helden','Angebote im Honor-Shop','Punkte je Truppenstufe','Schwierigkeitsauswahl im General Trial','Zombie Siege: Stützpunkt auswählen','Marshall-Plattform auf der Karte','Teilnehmer einer Rally','Gebäude auf der Desert-Storm-Karte','Spenden in die Allianz-Forschung','Ministertitel im Kapitol'],
en:['Front and back rows','Four drone chip slots','Legendary hero equipment','Honor Shop offers','Points per troop tier','General Trial difficulty selection','Zombie Siege stronghold selection','Marshall platform on the map','Rally participants','Desert Storm battlefield objectives','Alliance research donations','Capitol minister assignments'],
uk:['Передній і задній ряди','Чотири слоти чипів дрона','Легендарне спорядження героя','Пропозиції Honor Shop','Бали за рівень військ','Вибір складності General Trial','Вибір бази Zombie Siege','Платформа Marshall на мапі','Учасники Rally','Об’єкти на мапі Desert Storm','Пожертви до досліджень альянсу','Міністерські посади в Капітолії'],
ja:['前列と後列の配置','ドローンチップの4枠','英雄のレジェンダリー装備','Honor Shopの商品','兵士レベル別のポイント','General Trialの難易度選択','Zombie Siegeの拠点選択','マップ上のMarshall拠点','Rallyの参加メンバー','Desert Stormの施設配置','同盟研究への寄付','Capitolの役職'],
fr:['Rang avant et rang arrière','Les quatre emplacements de Drone Chips','Équipement légendaire du héros','Offres du Honor Shop','Points par niveau de troupes','Choix de difficulté General Trial','Choix du bastion Zombie Siege','Plateforme Marshall sur la carte','Participants d’une rally','Objectifs sur la carte Desert Storm','Dons à la recherche d’alliance','Titres du Capitole'],
it:['Prima e seconda fila','I quattro slot dei Drone Chips','Equipaggiamento leggendario','Offerte dell’Honor Shop','Punti per livello delle truppe','Scelta difficoltà General Trial','Scelta della roccaforte Zombie Siege','Piattaforma Marshall sulla mappa','Partecipanti a una rally','Obiettivi della mappa Desert Storm','Donazioni alla ricerca alleanza','Ruoli ministeriali al Campidoglio'],
id:['Barisan depan dan belakang','Empat slot Drone Chip','Perlengkapan legendaris hero','Penawaran Honor Shop','Poin tiap tier pasukan','Pilihan kesulitan General Trial','Pemilihan markas Zombie Siege','Platform Marshall di peta','Peserta rally','Objektif peta Desert Storm','Donasi riset aliansi','Jabatan menteri Capitol'],
ar:['الصف الأمامي والخلفي','خانات Drone Chips الأربع','تجهيزات البطل الأسطورية','عروض Honor Shop','نقاط كل مستوى جندي','اختيار صعوبة General Trial','اختيار معقل Zombie Siege','منصة Marshall على الخريطة','المشاركون في Rally','أهداف خريطة Desert Storm','التبرع لأبحاث التحالف','المناصب الوزارية في Capitol'],
ko:['앞열과 뒷열 배치','드론 칩 4개 슬롯','영웅 전설 장비','Honor Shop 상품','병력 티어별 점수','General Trial 난이도 선택','Zombie Siege 거점 선택','지도 속 Marshall 플랫폼','Rally 참가자','Desert Storm 지도 목표','동맹 연구 기부','Capitol 장관 직책'],
sv:['Främre och bakre raden','Drönarens fyra chipplatser','Legendarisk hjälteutrustning','Erbjudanden i Honor Shop','Poäng per truppnivå','Svårighetsval i General Trial','Val av Zombie Siege-fäste','Marshall-plattformen på kartan','Deltagare i rally','Mål på Desert Storm-kartan','Donationer till alliansforskning','Ministerposter i Capitol'],
pt:['Fila da frente e de trás','Quatro slots de Drone Chips','Equipamento lendário do herói','Ofertas da Honor Shop','Pontos por nível das tropas','Escolha de dificuldade General Trial','Seleção do bastião Zombie Siege','Plataforma Marshall no mapa','Participantes da rally','Objetivos do mapa Desert Storm','Donativos para pesquisa da aliança','Cargos do Capitólio'],
nl:['Voorste en achterste rij','Vier dronechip-slots','Legendarische heldenuitrusting','Aanbiedingen in de Honor Shop','Punten per troepniveau','Moeilijkheid kiezen in General Trial','Zombie Siege-vesting kiezen','Marshall-platform op de kaart','Deelnemers aan een rally','Doelen op de Desert Storm-kaart','Donaties aan alliantieonderzoek','Ministersposten in het Capitool'],
th:['ตำแหน่งแถวหน้าและแถวหลัง','ช่อง Drone Chip ทั้งสี่','อุปกรณ์ระดับตำนานของฮีโร่','สินค้าใน Honor Shop','คะแนนตามระดับทหาร','เลือกความยาก General Trial','เลือกฐาน Zombie Siege','แท่น Marshall บนแผนที่','ผู้เข้าร่วม Rally','เป้าหมายบนแผนที่ Desert Storm','บริจาควิจัยพันธมิตร','ตำแหน่งรัฐมนตรีใน Capitol'],
km:['ជួរមុខ និងជួរក្រោយ','រន្ធ Drone Chip ទាំងបួន','ឧបករណ៍ Legendary របស់វីរបុរស','ទំនិញក្នុង Honor Shop','ពិន្ទុតាមកម្រិតទាហាន','ជ្រើសកម្រិត General Trial','ជ្រើសមូលដ្ឋាន Zombie Siege','ទីតាំង Marshall លើផែនទី','អ្នកចូលរួម Rally','គោលដៅផែនទី Desert Storm','ការបរិច្ចាគស្រាវជ្រាវសម្ព័ន្ធ','តំណែងរដ្ឋមន្ត្រី Capitol'],
fil:['Harap at likod na hanay','Apat na Drone Chip slots','Legendary na gear ng hero','Mga alok sa Honor Shop','Puntos bawat troop tier','Pagpili ng General Trial difficulty','Pagpili ng Zombie Siege stronghold','Marshall platform sa mapa','Mga kasama sa rally','Mga objective sa Desert Storm','Donasyon sa alliance research','Mga minister position sa Capitol']
};
export const PRACTICAL_IMAGE_CAPTIONS=Object.freeze(Object.fromEntries(Object.entries(CAPTIONS).map(([lang,rows])=>{
 if(rows.length!==PRACTICAL_GUIDE_IDS.length)throw new Error('Missing image captions for '+lang);
 return [lang,Object.freeze(Object.fromEntries(PRACTICAL_GUIDE_IDS.map((id,index)=>[id,rows[index]])))];
})));
export function practicalImageCaption(lang,id){
 const caption=PRACTICAL_IMAGE_CAPTIONS[lang]?.[id];
 if(!caption)throw new Error('Missing image caption '+lang+'/'+id);
 return caption;
}
