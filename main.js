import * as THREE from 'three';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged,updateProfile} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getDatabase,ref,set,get,remove,runTransaction,onValue,onDisconnect} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import {firebaseConfig} from './firebase-config.js';

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app);
const $=id=>document.getElementById(id),A=20,SPEED=7,N=10,CS=4;
clearTimeout(window.bootTimer);$('boot').hidden=true;try{sessionStorage.removeItem('retried')}catch(e){}
const NAMES={tq:'Treasure Quest',mm2:'MM2',rg:'Красный/зелёный свет',ed:'Побег от Девида',ch:'Кнопка судьбы',kh:'Царь горы',tg:'Догонялки',ring:'Оставайся в круге',fb:'Футбол',hp:'Картошка',ff:'Падающий пол',ctf:'Захват флага'};
const show=id=>document.querySelectorAll('.screen').forEach(s=>s.hidden=s.id!==id);
const R=(a,b)=>a+Math.random()*(b-a);
const esc=s=>String(s).replace(/[<>&"]/g,'');
const DEF={body:'#3b82f6',head:'#fcd34d',arms:'#fcd34d',legs:'#334155',hat:'none',gl:0,cape:0};
let avatar={...DEF};
document.querySelectorAll('.back').forEach(b=>b.onclick=()=>location.reload());

/* ---------- Запрос на фуллскрин ---------- */
document.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        // Включаем фуллскрин
        document.documentElement.requestFullscreen().catch((err) => {
            console.log(err);
        });
    }
});

/* ---------- Языки: русский / English / Eesti ---------- */
let lang=localStorage.getItem('lang')||'ru';
const UNIT={ru:'с',en:'s',et:'s'},MINU={ru:'мин',en:'min',et:'min'};
const L=[
['Войти','Log in','Sisene'],['Регистрация','Sign up','Registreeru'],['Клиент','Client','Klient'],['Хост','Host','Host'],
['Мой аватар','My avatar','Minu avatar'],['Магазин','Shop','Pood'],['Выйти','Log out','Logi välja'],['Выбери игру','Choose a game','Vali mäng'],
['Красный/зелёный свет','Red light / Green light','Punane/roheline tuli'],['Побег от Девида','Escape from Devid','Põgene Devidi eest'],
['Кнопка судьбы','Button of Fate','Saatusenupp'],['Царь горы','King of the Hill','Mäekuningas'],['Догонялки','Tag','Kulli'],
['Оставайся в круге','Stay in the Circle','Püsi ringis'],['Футбол','Football','Jalgpall'],['Начать','Start','Alusta'],
['← Назад','← Back','← Tagasi'],['Код комнаты','Room code','Toa kood'],['Играть','Play','Mängi'],['Аватар','Avatar','Avatar'],
['Тело','Body','Keha'],['Голова','Head','Pea'],['Руки','Arms','Käed'],['Ноги','Legs','Jalad'],['Шапка','Hat','Müts'],
['Без шапки','No hat','Ilma mütsita'],['Колпак','Cone hat','Koonusmüts'],['Цилиндр','Top hat','Silinder'],['Кепка','Cap','Nokkmüts'],
['Корона','Crown','Kroon'],['Рога','Horns','Sarved'],['Очки','Glasses','Prillid'],['Плащ','Cape','Keep'],['Сохранить','Save','Salvesta'],
['Запустить раунд','Start round','Alusta vooru'],['Закрыть','Close','Sulge'],['Пассы','Passes','Passid'],['Кастомизация','Customization','Kohandamine'],
['Ник (латиница, цифры, _)','Username (latin, digits, _)','Kasutajanimi (ladina, numbrid, _)'],
['Пароль (мин. 6 символов)','Password (min. 6 characters)','Parool (vähemalt 6 märki)'],
['Привет, ','Hi, ','Tere, '],
['Ник: 3–16 символов, латиница, цифры или _','Username: 3–16 characters, latin letters, digits or _','Nimi: 3–16 märki, ladina tähed, numbrid või _'],
['Ник занят','Username taken','Nimi on võetud'],['Неверный ник или пароль','Wrong username or password','Vale nimi või parool'],
['Пароль короче 6 символов','Password is shorter than 6 characters','Parool on lühem kui 6 märki'],
['Комната не найдена','Room not found','Tuba ei leitud'],['Код: ','Code: ','Kood: '],['Игроки: ','Players: ','Mängijad: '],['Все','All','Kõik'],
['Можно ходить, пока ждём старта','You can walk around while waiting','Saad ringi liikuda, kuni ootame algust'],
['Нет игроков','No players','Mängijaid pole'],['Для MM2 нужно минимум 2 игрока','MM2 needs at least 2 players','MM2 jaoks on vaja vähemalt 2 mängijat'],
['Собирай золото!','Collect the gold!','Korja kulda!'],['Раунд идёт!','Round in progress!','Voor käib!'],
['Беги к финишу! На красный замри','Run to the finish! Freeze on red','Jookse finišisse! Punasel seisa'],
['Выживи 90 секунд! Девид идёт...','Survive 90 seconds! Devid is coming...','Ela üle 90 sekundit! Devid tuleb...'],
['Держи круг в центре! Толкайся 💥','Hold the center circle! Push 💥','Hoia keskringi! Tõuka 💥'],
['Догонялки! Не будь водящим',"Tag! Don't be it",'Kulli! Ära ole püüdja'],
['Оставайся в круге! Толкай других 💥','Stay in the circle! Push others 💥','Püsi ringis! Tõuka teisi 💥'],
['⚽ Футбол!','⚽ Football!','⚽ Jalgpall!'],['Жми красную кнопку в центре!','Press the red button in the center!','Vajuta keskel punast nuppu!'],
['Событие закончилось. Жми кнопку!','Event over. Press the button!','Sündmus lõppes. Vajuta nuppu!'],
[' ударил ',' stabbed ',' pussitas '],[' застрелил убийцу!',' shot the murderer!',' tulistas mõrvarit!'],[' промахнулся!',' missed!',' lasi mööda!'],
[' пошевелился на красный!',' moved on red!',' liikus punasel!'],[' добежал до финиша!',' reached the finish!',' jõudis finišisse!'],
['Девид съел всех!','Devid ate everyone!','Devid sõi kõik ära!'],['Девид съел ','Devid ate ','Devid sõi '],[' убил ',' killed ',' tappis '],
[' ножом!',' with a knife!',' noaga!'],[' вылетел из круга!',' fell out of the circle!',' kukkus ringist välja!'],
[' теперь водит!'," is now it!",' on nüüd püüdja!'],['ГОЛ! ','GOAL! ','VÄRAV! '],['Красные победили!','Red win!','Punased võitsid!'],
['Синие победили!','Blue win!','Sinised võitsid!'],['Красные победили ','Red won ','Punased võitsid '],['Синие победили ','Blue won ','Sinised võitsid '],
['Красные','Red','Punased'],['Синие','Blue','Sinised'],[' забили',' scored',' lõid värava'],['Финал: ','Final: ','Finaal: '],
[' попал под удар!',' got hit!',' sai pihta!'],[' унесён торнадо!',' was swept away by the tornado!',' viis tornaado minema!'],
[' сгорел в лаве!',' burned in lava!',' põles laavas!'],[' врезался в стену!',' hit a wall!',' põrkas vastu seina!'],
[' упал в лаву!',' fell into the lava!',' kukkus laavasse!'],[' похищен НЛО!',' was abducted by a UFO!',' röövis UFO!'],
['Мирные победили!','Innocents win!','Süütud võitsid!'],['Убийца победил!','The murderer wins!','Mõrvar võitis!'],
['Победитель: ','Winner: ','Võitja: '],['Все выбыли!','Everyone is out!','Kõik langesid välja!'],['Все вылетели!','Everyone fell out!','Kõik kukkusid välja!'],
['Все погибли!','Everyone died!','Kõik hukkusid!'],['Время вышло! Победитель: ',"Time's up! Winner: ",'Aeg sai läbi! Võitja: '],
['Время вышло — мирные победили!',"Time's up — innocents win!",'Aeg sai läbi — süütud võitsid!'],
['Время вышло — ничья!',"Time's up — draw!",'Aeg sai läbi — viik!'],['Время вышло!',"Time's up!",'Aeg sai läbi!'],
['Выжившие победили!','Survivors win!','Ellujäänud võitsid!'],['Царь горы: ','King of the Hill: ','Mäekuningas: '],
['Догонялки: победил ','Tag: winner is ','Kulli: võitis '],['Ничья!','Draw!','Viik!'],
['👹 Девид охотится!','👹 Devid is hunting!','👹 Devid jahib!'],['🌙 Ночь... Убийца среди вас!','🌙 Night... A murderer is among you!','🌙 Öö... Mõrvar on teie seas!'],
['☄️ Метеориты!','☄️ Meteors!','☄️ Meteoriidid!'],['🌪 Торнадо!','🌪 Tornado!','🌪 Tornaado!'],['⛈ Гроза!','⛈ Thunderstorm!','⛈ Äike!'],
['🌋 Извержение вулкана!','🌋 Volcano eruption!','🌋 Vulkaanipurse!'],['🏃 Обби: летающие стены!','🏃 Obby: flying walls!','🏃 Obby: lendavad seinad!'],
['💰 Денежный дождь! Собирай!','💰 Money rain! Collect it!','💰 Rahavihm! Korja!'],['🧊 Лёд! Скользко!','🧊 Ice! Slippery!','🧊 Jää! Libe!'],
['🟢 Лава! Беги на платформы!','🟢 Lava! Run to the platforms!','🟢 Laava! Jookse platvormidele!'],['🛸 НЛО похищает!','🛸 UFO abduction!','🛸 UFO röövib!'],
['Золото: ','Gold: ','Kuld: '],['Монет: ','Coins: ','Münte: '],['Очки: ','Score: ','Punkte: '],
['Ты УБИЙЦА 🔪 · ','You are the MURDERER 🔪 · ','Sa oled MÕRVAR 🔪 · '],['Ты УБИЙЦА 🔪','You are the MURDERER 🔪','Sa oled MÕRVAR 🔪'],
['Ты ШЕРИФ 🔫','You are the SHERIFF 🔫','Sa oled ŠERIFF 🔫'],['Ты мирный','You are innocent','Sa oled süütu'],
[' (ты выбыл)',' (you are out)',' (sa langesid välja)'],['🟢 БЕГИ','🟢 RUN','🟢 JOOKSE'],['🔴 СТОЙ','🔴 STOP','🔴 SEISA'],
['Беги от Девида!','Run from Devid!','Jookse Devidi eest!'],['🏃 ТЫ ВОДИШЬ! ','🏃 YOU ARE IT! ','🏃 SINA OLED PÜÜDJA! '],
['Убегай! ','Run away! ','Jookse minema! '],['Не вылети из круга!',"Don't fall out of the circle!",'Ära kuku ringist välja!'],
['Ты за 🔴','You are 🔴','Sa oled 🔴'],['Ты за 🔵','You are 🔵','Sa oled 🔵'],['🏆 Ты выжил!','🏆 You survived!','🏆 Sa jäid ellu!'],
['💀 Ты проиграл','💀 You lost','💀 Sa kaotasid'],
['Купить','Buy','Osta'],['Надеть','Equip','Pane selga'],['Снять','Unequip','Võta ära'],['Куплено!','Purchased!','Ostetud!'],['Куплено','Owned','Ostetud'],
['Не хватает монет','Not enough coins','Münte ei jätku'],['×2 монет навсегда','×2 coins forever','×2 münti igaveseks'],
['Буст ×2 на 30 минут','×2 boost for 30 minutes','×2 võimendus 30 minutiks'],
['Красный ник','Red nickname','Punane nimi'],['Синий ник','Blue nickname','Sinine nimi'],['Зелёный ник','Green nickname','Roheline nimi'],
['Жёлтый ник','Yellow nickname','Kollane nimi'],['Фиолетовый ник','Purple nickname','Lilla nimi'],['Розовый ник','Pink nickname','Roosa nimi'],
['Радужный ник','Rainbow nickname','Vikerkaarenimi'],['Нимб','Halo','Halo'],['Крылья','Wings','Tiivad'],['Рюкзак','Backpack','Seljakott'],['Усы','Mustache','Vurrud'],
['Картошка','Hot Potato','Kuum kartul'],['Падающий пол','Falling Floor','Kukkuv põrand'],['Захват флага','Capture the Flag','Lipu vallutamine'],
['💣 Картошка! Передай бомбу касанием!','💣 Hot potato! Pass the bomb by touching!','💣 Kuum kartul! Anna pomm puudutusega edasi!'],
[' взорвался!',' exploded!',' plahvatas!'],[' получил бомбу!',' got the bomb!',' sai pommi!'],
['🧱 Пол рушится! Стой на плитках','🧱 The floor is collapsing! Stay on the tiles','🧱 Põrand variseb! Püsi plaatidel'],
[' упал в пропасть!',' fell into the abyss!',' kukkus kuristikku!'],
['🚩 Укради флаг врага и принеси на свою базу!','🚩 Steal the enemy flag and bring it to your base!','🚩 Varasta vaenlase lipp ja too see oma baasi!'],
[' украл флаг!',' stole the flag!',' varastas lipu!'],[' вернул флаг!',' returned the flag!',' tõi lipu tagasi!'],[' захватил флаг!',' captured the flag!',' vallutas lipu!'],
['💣 У ТЕБЯ БОМБА! Передай!','💣 YOU HAVE THE BOMB! Pass it!','💣 SINUL ON POMM! Anna edasi!'],['Убегай от бомбы!','Run from the bomb!','Jookse pommi eest!'],['Стой на плитках!','Stay on the tiles!','Püsi plaatidel!'],
['Сложность','Difficulty','Raskusaste'],['Обычный ×1','Normal ×1','Tavaline ×1'],['Хард ×2','Hard ×2','Raske ×2'],['Невозможный ×3','Impossible ×3','Võimatu ×3'],
['Девид','Devid','Devid'],['Убийца','Murderer','Mõrvar']
];
const DICT=Object.fromEntries(L.map(([a,b,c])=>[a,[b,c]])),KEYS=Object.keys(DICT).sort((a,b)=>b.length-a.length);
function T(s){
  s=String(s);if(lang==='ru')return s;const i=lang==='en'?0:1;
  for(const k of KEYS)if(s.includes(k))s=s.split(k).join(DICT[k][i]);
  return s;
}
function applyLang(){
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-t]').forEach(e=>e.textContent=T(e.dataset.t));
  document.querySelectorAll('[data-ph]').forEach(e=>e.placeholder=T(e.dataset.ph));
  $('lang').value=lang;
  if(auth.currentUser?.displayName)$('hello').textContent=T('Привет, ')+auth.currentUser.displayName+'!';
  if(!$('shop').hidden)renderShop();
}
$('lang').onchange=e=>{lang=e.target.value;localStorage.setItem('lang',lang);applyLang()};
applyLang();

/* ---------- Звук ---------- */
const MUSIC=['sounds/music1.mp3','sounds/music2.mp3','sounds/music3.mp3'];
const sfx=n=>{const a=new Audio(`sounds/${n}.mp3`);a.volume=.8;a.play().catch(()=>{})};
let bg;
const stopMusic=()=>{if(bg){bg.onended=null;bg.pause()}};
function playMusic(){stopMusic();bg=new Audio(MUSIC[Math.floor(Math.random()*MUSIC.length)]);bg.volume=.3;bg.onended=playMusic;bg.play().catch(()=>{})}

/* ---------- Аккаунты ---------- */
const mail=u=>u.trim().toLowerCase()+'@mpgame.app';
let regBusy=false;
async function authDo(reg){
  const u=$('u').value.trim(),p=$('p').value;
  if(!/^[a-zA-Z0-9_]{3,16}$/.test(u))return $('autherr').textContent=T('Ник: 3–16 символов, латиница, цифры или _');
  try{
    if(reg){regBusy=true;try{const c=await createUserWithEmailAndPassword(auth,mail(u),p);await updateProfile(c.user,{displayName:u});enter(c.user)}finally{regBusy=false}}
    else await signInWithEmailAndPassword(auth,mail(u),p);
  }catch(e){$('autherr').textContent=T({'auth/email-already-in-use':'Ник занят','auth/invalid-credential':'Неверный ник или пароль','auth/weak-password':'Пароль короче 6 символов'}[e.code]||e.code)}
}
let me={},unsub,pendingCode=((new URLSearchParams(location.search).get('code')||'').match(/^\d{5}$/)||[null])[0];
function enter(u){
  if(unsub)unsub();
  $('hello').textContent=T('Привет, ')+u.displayName+'!';
  show('menu');
  unsub=onValue(ref(db,`users/${u.uid}`),sn=>{
    me=sn.val()||{};avatar={...DEF,...(me.avatar||{})};
    $('coins').textContent='🪙 '+(me.coins||0);
    if(!$('shop').hidden)renderShop();
    if(pendingCode){const c=pendingCode;pendingCode=null;history.replaceState(null,'',location.pathname);$('jc').value=c;show('join');joinGame(c)}
  });
}
// аккаунт без имени (сбой связи во время регистрации) раньше давал пустой экран — теперь имя восстанавливается из логина
onAuthStateChanged(auth,u=>{
  if(!u)return show('auth');
  if(u.displayName)return enter(u);
  if(regBusy)return;
  updateProfile(u,{displayName:(u.email||'player@x').split('@')[0]}).then(()=>enter(u)).catch(()=>show('auth'));
});
// страховка: если за 5 секунд ни один экран так и не показался — показываем вход
setTimeout(()=>{if(![...document.querySelectorAll('.screen')].some(s=>!s.hidden))show('auth')},5000);
$('login').onclick=()=>authDo(false);
$('reg').onclick=()=>authDo(true);
$('bOut').onclick=()=>signOut(auth);
$('bClient').onclick=()=>show('join');
$('bHost').onclick=()=>show('hostsetup');
/* ---------- Монеты и магазин ---------- */
const SHOP=[
  ['Пассы',[['x2','×2 монет навсегда',5000],['boost','Буст ×2 на 30 минут',300]]],
  ['Кастомизация',[
    ['n_red','Красный ник',500,'#ef4444'],['n_blue','Синий ник',500,'#3b82f6'],['n_green','Зелёный ник',500,'#22c55e'],
    ['n_yellow','Жёлтый ник',500,'#eab308'],['n_purple','Фиолетовый ник',500,'#a855f7'],['n_pink','Розовый ник',500,'#ec4899'],
    ['n_rb','Радужный ник',10000,'rainbow'],
    ['a_halo','Нимб',800],['a_wings','Крылья',1500],['a_pack','Рюкзак',600],['a_stache','Усы',400]]]
];
const RB='linear-gradient(90deg,#f00,#fa0,#ff0,#0f0,#0af,#a0f)';
const mult=()=>(me.owned?.x2?2:1)*((me.boost||0)>Date.now()?2:1);
function renderShop(){
  $('coins2').textContent='🪙 '+(me.coins||0);
  const root=$('shopRows'),own=me.owned||{},now=Date.now();root.innerHTML='';
  SHOP.forEach(([title,items])=>{
    const row=document.createElement('div');row.className='shoprow';
    const h=document.createElement('h3');h.textContent=T(title);
    const box=document.createElement('div');box.className='items';row.append(h,box);
    items.forEach(([id,name,price,c])=>{
      const card=document.createElement('div');card.className='card';
      const b=document.createElement('b');b.textContent=T(name);
      if(c==='rainbow')b.style.cssText=`background:${RB};-webkit-background-clip:text;background-clip:text;color:transparent`;
      else if(c)b.style.color=c;
      const btn=document.createElement('button');
      const owned=!!own[id]&&id!=='boost';
      const on=id[0]==='n'?avatar.nc===c:id[0]==='a'?(avatar.ac||[]).includes(id.slice(2)):false;
      const left=id==='boost'&&(me.boost||0)>now?` (${Math.ceil((me.boost-now)/60000)} ${MINU[lang]})`:'';
      if(id==='x2'&&owned){btn.textContent=T('Куплено');btn.disabled=true}
      else if(owned){btn.textContent=T(on?'Снять':'Надеть');btn.onclick=()=>equip(id,c)}
      else{btn.textContent=`${T('Купить')} 🪙${price}`+left;btn.onclick=()=>buy(id,price)}
      card.append(b,btn);box.append(card);
    });
    root.append(row);
  });
}
async function buy(id,price){
  try{
    const r=await runTransaction(ref(db,`users/${auth.currentUser.uid}`),cur=>{
      cur=cur||{};if((cur.coins||0)<price)return;
      cur.coins-=price;cur.owned={...(cur.owned||{}),[id]:true};
      if(id==='boost')cur.boost=Math.max(Date.now(),cur.boost||0)+1800000;
      return cur;
    });
    $('shopmsg').textContent=T(r.committed?'Куплено!':'Не хватает монет');
  }catch(e){$('shopmsg').textContent=e.code||'error'}
}
async function equip(id,c){
  if(id[0]==='n')avatar.nc=avatar.nc===c?'':c;
  else{const k=id.slice(2),a=new Set(avatar.ac||[]);a.has(k)?a.delete(k):a.add(k);avatar.ac=[...a]}
  await set(ref(db,`users/${auth.currentUser.uid}/avatar`),avatar);
}
$('bShop').onclick=()=>{$('shopmsg').textContent='';show('shop');renderShop()};
$('shopBack').onclick=()=>show('menu');


/* ---------- 3D-аватар (руки, ноги, шапки, очки, плащ) ---------- */
function nickFill(x,nc){
  if(nc==='rainbow'){const g=x.createLinearGradient(20,0,236,0);['#f00','#fa0','#ff0','#0f0','#0af','#a0f'].forEach((c,i)=>g.addColorStop(i/5,c));return g}
  return nc||'#fff';
}
function makeAvatar(av,name){
  av={...DEF,...av};
  const g=new THREE.Group(),M=c=>new THREE.MeshLambertMaterial({color:c});
  const B=(p,w,h,d,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c));m.position.set(x,y,z);p.add(m);return m};
  const limb=(w,h,c,x,y)=>{const p=new THREE.Group();p.position.set(x,y,0);B(p,w,h,.3,c,0,-h/2,0);g.add(p);return p};
  const arms=[limb(.25,.8,av.arms,-.55,1.55),limb(.25,.8,av.arms,.55,1.55)];
  const legs=[limb(.32,.6,av.legs,-.2,.6),limb(.32,.6,av.legs,.2,.6)];
  B(g,.8,1,.5,av.body,0,1.1,0);B(g,.6,.6,.6,av.head,0,1.9,0);
  B(g,.12,.12,.05,'#111',-.14,1.95,.31);B(g,.12,.12,.05,'#111',.14,1.95,.31);
  const h=av.hat;
  if(h==='cone'){const c=new THREE.Mesh(new THREE.ConeGeometry(.35,.6,8),M('#ef4444'));c.position.y=2.5;g.add(c)}
  if(h==='cube'){B(g,.9,.15,.9,'#111',0,2.25,0);B(g,.55,.45,.55,'#111',0,2.5,0)}
  if(h==='cap'){B(g,.66,.15,.66,'#2563eb',0,2.28,0);B(g,.6,.06,.4,'#1d4ed8',0,2.22,.45)}
  if(h==='crown'){B(g,.66,.2,.66,'#facc15',0,2.3,0);[-.24,0,.24].forEach(x=>B(g,.12,.2,.12,'#facc15',x,2.5,0))}
  if(h==='horns')[-.25,.25].forEach(x=>{const c=new THREE.Mesh(new THREE.ConeGeometry(.12,.5,6),M('#ef4444'));c.position.set(x,2.45,0);c.rotation.z=x>0?-.4:.4;g.add(c)});
  if(+av.gl)B(g,.5,.14,.05,'#000',0,1.95,.33);
  if(+av.cape)B(g,.8,1.1,.06,'#b91c1c',0,1.1,-.3);
  const ac=Array.isArray(av.ac)?av.ac:Object.values(av.ac||{});
  if(ac.includes('halo')){const hm=new THREE.Mesh(new THREE.TorusGeometry(.35,.05,8,20),new THREE.MeshBasicMaterial({color:'#fde047'}));hm.rotation.x=Math.PI/2;hm.position.y=2.65;g.add(hm)}
  if(ac.includes('wings'))[-1,1].forEach(sx=>{const w=B(g,.08,.9,.5,'#e2e8f0',sx*.5,1.45,-.4);w.rotation.z=sx*.4});
  if(ac.includes('pack'))B(g,.6,.7,.3,'#92400e',0,1.2,-.4);
  if(ac.includes('stache'))B(g,.4,.08,.06,'#111',0,1.78,.33);
  g.userData.walk=(t,on)=>{const s=on?Math.sin(t*10)*.7:0;arms[0].rotation.x=s;arms[1].rotation.x=-s;legs[0].rotation.x=-s;legs[1].rotation.x=s};
  if(name){
    const c=document.createElement('canvas');c.width=256;c.height=64;
    const x=c.getContext('2d');x.font='bold 36px sans-serif';x.textAlign='center';x.lineWidth=6;x.strokeStyle='#000';x.fillStyle=nickFill(x,av.nc);
    x.strokeText(name,128,44);x.fillText(name,128,44);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));
    sp.scale.set(3,.75,1);sp.position.y=3.1;g.add(sp);
  }
  return g;
}

let pv;
function drawPrev(){
  avatar={...avatar,body:$('cb').value,head:$('ch').value,arms:$('ca').value,legs:$('cl').value,hat:$('hat').value,gl:+$('gl').checked,cape:+$('cp').checked};
  if(!pv){
    pv=new THREE.WebGLRenderer({canvas:$('prev'),antialias:true,alpha:true});
    pv.sc=new THREE.Scene();pv.sc.add(new THREE.HemisphereLight('#fff','#556',2));
    pv.cam=new THREE.PerspectiveCamera(40,1,.1,50);pv.cam.position.set(0,1.8,6);pv.cam.lookAt(0,1.5,0);
  }
  if(pv.m)pv.sc.remove(pv.m);
  pv.m=makeAvatar(avatar,'');pv.m.rotation.y=.5;pv.sc.add(pv.m);pv.render(pv.sc,pv.cam);
}
$('bAv').onclick=()=>{
  show('avatar');
  $('cb').value=avatar.body;$('ch').value=avatar.head;$('ca').value=avatar.arms;$('cl').value=avatar.legs;
  $('hat').value=avatar.hat;$('gl').checked=!!+avatar.gl;$('cp').checked=!!+avatar.cape;drawPrev();
};
['cb','ch','ca','cl','hat','gl','cp'].forEach(i=>$(i).oninput=drawPrev);
$('bSave').onclick=async()=>{drawPrev();await set(ref(db,`users/${auth.currentUser.uid}/avatar`),avatar);location.reload()};

/* ---------- 3D-сцена ---------- */
function scene3d(canvas,dark){
  const r=new THREE.WebGLRenderer({canvas,antialias:true}),s=new THREE.Scene(),cam=new THREE.PerspectiveCamera(55,1,.1,200);
  s.background=new THREE.Color(dark?'#000':'#87ceeb');
  const hemi=new THREE.HemisphereLight('#fff','#556',dark?.3:1.4);s.add(hemi);
  if(dark)s.fog=new THREE.Fog('#000',45,95);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(A*2+4,A*2+4),new THREE.MeshLambertMaterial({color:dark?'#1f2937':'#6b8e5a'}));
  fl.rotation.x=-Math.PI/2;s.add(fl);
  if(!dark){const gr=new THREE.GridHelper(A*2,20,'#4d6b40','#4d6b40');gr.position.y=.02;s.add(gr)}
  const rs=()=>{r.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};
  addEventListener('resize',rs);rs();
  return{r,s,cam,hemi};
}

/* ---------- Лабиринт ---------- */
const DIR=[[0,-1],[1,0],[0,1],[-1,0]];
function genMaze(){
  const open=Array.from({length:N},()=>Array.from({length:N},()=>[0,0,0,0])),seen=new Set(['0,0']),st=[[0,0]];
  while(st.length){
    const [x,z]=st[st.length-1],nb=DIR.map((d,i)=>[x+d[0],z+d[1],i]).filter(([a,b])=>a>=0&&b>=0&&a<N&&b<N&&!seen.has(a+','+b));
    if(!nb.length){st.pop();continue}
    const [a,b,i]=nb[Math.floor(Math.random()*nb.length)];
    open[x][z][i]=1;open[a][b][(i+2)%4]=1;seen.add(a+','+b);st.push([a,b]);
  }
  for(let k=0;k<14;k++){const x=Math.floor(Math.random()*(N-1)),z=Math.floor(Math.random()*N);open[x][z][1]=1;open[x+1][z][3]=1}
  return open;
}
function buildMaze(s,open){
  const walls=[],meshes=[],mat=new THREE.MeshLambertMaterial({color:'#64748b'});
  const add=(x0,z0,x1,z1)=>{walls.push({x0,z0,x1,z1});const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,3,z1-z0),mat);m.position.set((x0+x1)/2,1.5,(z0+z1)/2);s.add(m);meshes.push(m)};
  for(let x=0;x<N;x++)for(let z=0;z<N;z++){
    const X=-A+x*CS,Z=-A+z*CS;
    if(!open[x][z][0])add(X-.25,Z-.25,X+CS+.25,Z+.25);
    if(!open[x][z][3])add(X-.25,Z-.25,X+.25,Z+CS+.25);
    if(x===N-1)add(X+CS-.25,Z-.25,X+CS+.25,Z+CS+.25);
    if(z===N-1)add(X-.25,Z+CS-.25,X+CS+.25,Z+CS+.25);
  }
  return{walls,meshes};
}
function collide(o,walls,r=.5){
  for(let k=0;k<2;k++)for(const w of walls){
    const cx=Math.max(w.x0,Math.min(o.x,w.x1)),cz=Math.max(w.z0,Math.min(o.z,w.z1)),dx=o.x-cx,dz=o.z-cz,d=Math.hypot(dx,dz);
    if(d<r){if(d>1e-4){o.x+=dx/d*(r-d);o.z+=dz/d*(r-d)}else o.x+=r}
  }
}
const cell=o=>[Math.max(0,Math.min(N-1,Math.floor((o.x+A)/CS))),Math.max(0,Math.min(N-1,Math.floor((o.z+A)/CS)))];
function nextCell(open,from,to){
  const k=c=>c[0]*N+c[1],prev=new Map([[k(from),null]]),q=[from];
  while(q.length){
    const c=q.shift();if(k(c)===k(to))break;
    DIR.forEach((d,i)=>{if(!open[c[0]][c[1]][i])return;const n=[c[0]+d[0],c[1]+d[1]];if(!prev.has(k(n))){prev.set(k(n),c);q.push(n)}});
  }
  if(!prev.has(k(to)))return from;
  let c=to;while(prev.get(k(c))&&k(prev.get(k(c)))!==k(from))c=prev.get(k(c));
  return c;
}

/* ---------- ХОСТ ---------- */
$('gamesel').onchange=()=>{$('diffRow').hidden=!['ed','ch'].includes($('gamesel').value)};
$('bStart').onclick=async()=>{
  const game=$('gamesel').value;let code;
  do{code=String(Math.floor(10000+Math.random()*90000))}while((await get(ref(db,`rooms/${code}/host`))).exists());
  await set(ref(db,`rooms/${code}`),{host:auth.currentUser.uid,game});
  onDisconnect(ref(db,`rooms/${code}`)).remove();
  runHost(code,game,(game==='ed'||game==='ch')?+$('diff').value:1);
};

function runHost(code,game,lv=1){
  show('hostview');
  $('codeShow').textContent=T('Код: ')+code+' — '+T(NAMES[game])+(lv>1?' 🔥×'+lv:'');
  const dark=game==='ed',{r,s,cam,hemi}=scene3d($('cv'),dark);
  const P={},M={},inp={},items=[],path=p=>ref(db,`rooms/${code}/${p}`);
  let phase='lobby',t=0,msg='Можно ходить, пока ждём старта',clock=0,light='green',lt=0,ld=4;
  let walls=[],wm=[],open=null,dv=null,shots=[],snapQ=[],lastSnap=-9,focusI=0,zoom=1,rt;
  const look=new THREE.Vector3(),cl=v=>Math.max(-A+.5,Math.min(A-.5,v));
  cam.position.set(0,34,24);
  const roomRef=ref(db,`rooms/${code}`),hostUid=auth.currentUser.uid;
  // после обрыва связи хост заново создаёт комнату; удаление при закрытии страницы — на стороне сервера
  onValue(ref(db,'.info/connected'),sn=>{if(sn.val()){set(path('host'),hostUid);set(path('game'),game);onDisconnect(roomRef).remove()}});
  const closeRoom=()=>remove(roomRef);
  addEventListener('pagehide',closeRoom);
  document.querySelector('#hostview .back').onclick=async()=>{try{await closeRoom()}catch(e){}location.reload()};
  // компактная панель на телефонах: сворачивается кнопкой ☰, QR увеличивается по нажатию
  $('hud').classList.toggle('collapsed',matchMedia('(max-width:700px),(max-height:520px)').matches);
  $('hudToggle').onclick=()=>$('hud').classList.toggle('collapsed');
  $('qr').onclick=()=>$('qr').classList.toggle('big');
  let qrOk=false;
  try{
    const q=qrcode(0,'M');q.addData(location.origin+location.pathname+'?code='+code);q.make();
    $('qrimg').src=q.createDataURL(8,2);$('qrtxt').textContent=code;qrOk=true;
  }catch(e){console.log('QR:',e)}
  const zset=k=>zoom=Math.max(.3,Math.min(2.5,zoom*k));
  $('zin').onclick=()=>zset(.8);$('zout').onclick=()=>zset(1.25);
  $('cv').addEventListener('wheel',e=>zset(e.deltaY>0?1.1:.9));
  $('focus').onclick=()=>{focusI=(focusI+1)%(Object.keys(P).length+1)};

  if(game==='rg'){
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(2,24,24),new THREE.MeshBasicMaterial({color:'#22c55e'}));
    lamp.position.set(0,5,-A-2);lamp.name='lamp';
    const fin=new THREE.Mesh(new THREE.PlaneGeometry(A*2,2),new THREE.MeshBasicMaterial({color:'#ffffff'}));
    fin.rotation.x=-Math.PI/2;fin.position.set(0,.05,-A+2);s.add(lamp,fin);
  }
  const lampColor=c=>s.getObjectByName('lamp')?.material.color.set(c);

  onValue(path('players'),sn=>{
    const v=sn.val()||{};
    for(const u in v)if(!P[u]){
      P[u]={name:esc(v[u].name),x:R(-8,8),z:R(-8,8),a:0,score:0,alive:true,role:'',last:0,cd:0,kx:0,kz:0,ix:0,iz:0,ab:0};
      M[u]=makeAvatar(v[u].av,P[u].name);
      if(dark){const l=new THREE.PointLight('#ffe9b0',35,16,2);l.position.y=3;M[u].add(l)}
      s.add(M[u]);
    }
    for(const u in P){if(v[u])delete P[u].miss;else if(P[u].miss===undefined)P[u].miss=clock}
    $('plist').textContent=T('Игроки: ')+(Object.values(P).map(p=>p.name).join(', ')||'—');
  });
  onValue(path('input'),sn=>{const v=sn.val()||{};for(const k in inp)if(!v[k])delete inp[k];Object.assign(inp,v)});

  const gold=()=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(.5,12,12),new THREE.MeshLambertMaterial({color:'#facc15'}));
    m.position.set(R(-A+2,A-2),.8,R(-A+2,A-2));s.add(m);return m;
  };
  const top=()=>Object.values(P).sort((a,b)=>b.score-a.score)[0]?.name||'—';
  const chance=(p,m)=>Math.max(.05,Math.min(.95,1-Math.hypot(m.x-p.x,m.z-p.z)/26));
  // награды в монетах: каждый клиент сам зачисляет их себе (с учётом пассов)
  const payout=()=>{
    const mx=Math.max(0,...Object.values(P).map(o=>o.score)),sc=p=>p.score>0&&p.score===mx,wn=p=>/^Победитель/.test(msg)&&msg.includes(p.name);
    const tw=p=>msg.startsWith('Красные победили')?p.team===0:msg.startsWith('Синие победили')?p.team===1:false;
    const won=p=>({ctf:tw(p),hp:p.alive,ff:p.alive,tq:sc(p),kh:sc(p),tg:sc(p),
      mm2:/ирные победили/.test(msg)?p.role!=='mur':/^Убийца/.test(msg)?p.role==='mur':false,
      rg:wn(p),ring:wn(p),ed:p.alive,ch:p.alive,
      fb:msg.startsWith('Красные победили')?p.team===0:msg.startsWith('Синие победили')?p.team===1:false})[game];
    set(path('awards'),{id:Date.now(),p:Object.fromEntries(Object.entries(P).map(([u,p])=>[u,(10+(won(p)?40:0)+Math.floor(p.score*({tq:2,ch:3,kh:.2,tg:.2}[game]||0)))*lv]))});
  };

  /* «эпичные кадры» */
  const snap=(cap,x,z,force)=>{if(force||clock-lastSnap>2.5){lastSnap=clock;snapQ.push({cap,x,z})}};
  const recap=()=>{
    if(!shots.length)return;let i=0;
    const one=()=>{$('rimg').src=shots[i].img;$('rcap').textContent=T(shots[i].cap);i=(i+1)%shots.length};
    $('rtitle').textContent=T(msg);$('recap').hidden=false;one();clearInterval(rt);rt=setInterval(one,2200);
  };
  $('rclose').onclick=()=>{$('recap').hidden=true;clearInterval(rt)};
  const end=m=>{
    if(phase!=='play')return;
    phase='end';msg=m;stopMusic();endEv();if(mark)mark.visible=false;payout();snap('Финал: '+m,undefined,undefined,true);setTimeout(recap,1200);
  };
  const timeUp=()=>({tq:'Время вышло! Победитель: '+top(),mm2:'Время вышло — мирные победили!',rg:'Время вышло!',
    ed:Object.values(P).some(p=>p.alive)?'Выжившие победили!':'Девид съел всех!',kh:'Царь горы: '+top(),tg:'Догонялки: победил '+top(),ring:'Время вышло — ничья!',fb:gs[0]>gs[1]?'Красные победили!':gs[1]>gs[0]?'Синие победили!':'Ничья!',ch:topScore(),hp:'Время вышло — ничья!',ff:Object.values(P).some(p=>p.alive)?'Выжившие победили!':'Все выбыли!',ctf:gs[0]>gs[1]?'Красные победили!':gs[1]>gs[0]?'Синие победили!':'Ничья!'})[game];

  const tracer=(a,b)=>{
    const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x,1.5,a.z),new THREE.Vector3(b.x,1.5,b.z)]),new THREE.LineBasicMaterial({color:'#fde047'}));
    s.add(l);setTimeout(()=>s.remove(l),250);
  };
  const clearMaze=()=>{wm.forEach(m=>s.remove(m));wm=[];walls=[];open=null;dvs.forEach(d=>s.remove(d.m));dvs=[]};
  /* ---------- новые режимы ---------- */
  const mk=(rad,col,op=.5)=>{const m=new THREE.Mesh(new THREE.CircleGeometry(rad,40),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op}));m.rotation.x=-Math.PI/2;m.position.y=.05;return m};
  const disc=(...a)=>{const m=mk(...a);s.add(m);return m};
  let dvs=[],dvSfx=3,fxs=[],ev=null,evT=0,evAt=0,ex={},ice=false,mon=[],hill,btn,ball,mark,bv={x:0,z:0},gs=[0,0],ringR=15,it=null,tagCd=0;
  const addfx=(m,upd)=>{s.add(m);fxs.push({m,upd})};
  const kill=(p,why)=>{if(p.alive){p.alive=false;sfx('kill');snap(why,p.x,p.z)}};
  const rp=()=>{const al=Object.values(P).filter(p=>p.alive);return al[Math.floor(Math.random()*al.length)]||{x:0,z:0}};
  const topScore=()=>{const al=Object.values(P).filter(p=>p.alive).sort((a,b)=>b.score-a.score);return al[0]?'Победитель: '+al[0].name+' ('+Math.floor(al[0].score)+')':'Все погибли!'};
  if(game==='kh')hill=disc(4,'#22c55e');
  if(game==='ring')hill=disc(15,'#38bdf8',.35);
  if(game==='ch'){btn=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.5,.6,24),new THREE.MeshLambertMaterial({color:'#dc2626'}));btn.position.y=.3;s.add(btn)}
  if(game==='tg'){mark=new THREE.Mesh(new THREE.ConeGeometry(.4,.8,8),new THREE.MeshBasicMaterial({color:'#ef4444'}));mark.rotation.x=Math.PI;mark.visible=false;s.add(mark)}
  if(game==='fb'){
    ball=new THREE.Mesh(new THREE.SphereGeometry(.9,16,16),new THREE.MeshLambertMaterial({color:'#ffffff'}));ball.position.y=.9;s.add(ball);
    [[-A,'#3b82f6'],[A,'#ef4444']].forEach(([z,c])=>{const g=new THREE.Mesh(new THREE.BoxGeometry(8,2,.5),new THREE.MeshBasicMaterial({color:c}));g.position.set(0,1,z);s.add(g)});
  }

  // удар с неба: метка, падающий шар, урон по радиусу
  const strike=(x,z,rad,delay,col)=>{
    const g=new THREE.Group(),ring=mk(rad,col,.35),b=new THREE.Mesh(new THREE.SphereGeometry(.7,10,10),new THREE.MeshBasicMaterial({color:col}));
    g.position.set(x,0,z);g.add(ring,b);let tm=0,hit=0;
    addfx(g,dt=>{
      tm+=dt;b.position.y=Math.max(.7,25*(1-tm/delay));
      if(tm>=delay&&!hit){hit=1;ring.material.opacity=1;for(const u in P){const p=P[u];if(p.alive&&Math.hypot(p.x-x,p.z-z)<rad)kill(p,p.name+' попал под удар!')}}
      return tm>delay+.3;
    });
  };
  // монстры в открытом поле (Девид / Убийца)
  const spawnMon=(name,col,sp,burger)=>{
    const m=makeAvatar({body:col,head:'#fde68a',arms:col,legs:'#111111'},name),a=R(0,6.28);
    m.scale.setScalar(1.5);const l=new THREE.PointLight('#ff2200',40,14,2);l.position.y=2;m.add(l);s.add(m);
    mon.push({x:Math.cos(a)*A,z:Math.sin(a)*A,a:0,m,sp,burger,sfx:2,name});
  };
  const monTick=dt=>{
    const al=Object.values(P).filter(p=>p.alive);
    mon.forEach(o=>{
      let tg=null,bd=1e9;al.forEach(p=>{if(!p.alive)return;const d=Math.hypot(p.x-o.x,p.z-o.z);if(d<bd){bd=d;tg=p}});
      if(tg){
        const dx=tg.x-o.x,dz=tg.z-o.z,d=bd||1;o.x+=dx/d*o.sp*dt;o.z+=dz/d*o.sp*dt;o.a=Math.atan2(dx,dz);
        if(bd<1.6){tg.alive=false;if(o.burger)sfx('burger');sfx('kill');snap(o.name+' убил '+tg.name,tg.x,tg.z)}
      }
      o.sfx-=dt;if(o.burger&&o.sfx<=0){sfx(Math.random()<.5?'kfc':'burger');o.sfx=R(5,10)}
      o.m.position.set(o.x,0,o.z);o.m.rotation.y=o.a;o.m.userData.walk(clock,1);
    });
  };
  const lightAll=on=>{for(const u in M){[...M[u].children].filter(c=>c.isPointLight).forEach(c=>M[u].remove(c));if(on){const l=new THREE.PointLight('#ffe9b0',35,16,2);l.position.y=3;M[u].add(l)}}};

  // «Кнопка судьбы»: 11 случайных событий
  const EVS=[
    {n:'👹 Девид охотится!',d:20,go:()=>{for(let i=0;i<lv;i++)spawnMon('Девид','#dc2626',5*(1+.1*(lv-1)),1)},tk:dt=>monTick(dt)},
    {n:'🌙 Ночь... Убийца среди вас!',d:20,go:()=>{hemi.intensity=.1;s.background.set('#050510');lightAll(1);const al=Object.values(P).filter(p=>p.alive).sort(()=>Math.random()-.5),ks=al.slice(0,Math.max(1,Math.min(lv,al.length-1)));ks.forEach(k=>k.role='mur');ex={ks}},tk:()=>{},end:()=>{hemi.intensity=1.4;s.background.set('#87ceeb');lightAll(0);(ex.ks||[]).forEach(k=>k.role='inn')}},
    {n:'☄️ Метеориты!',d:12,go:()=>ex={c:0},tk:dt=>{ex.c-=dt;if(ex.c<=0){ex.c=.45/lv;const p=rp();strike(p.x+R(-4,4),p.z+R(-4,4),3+.5*(lv-1),1.2,'#f97316')}}},
    {n:'🌪 Торнадо!',d:16,
      go:()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(3,.6,10,16),new THREE.MeshLambertMaterial({color:'#9ca3af',transparent:true,opacity:.7}));const a=R(0,6.28),r=R(13,18),x=Math.cos(a)*r,z=Math.sin(a)*r;m.position.set(x,5,z);s.add(m);ex={m,x,z,vx:R(-4,4),vz:R(-4,4),c:0}},
      tk:dt=>{const o=ex;o.c-=dt;if(o.c<=0){o.c=2;o.vx=R(-4,4);o.vz=R(-4,4)}
        o.x=cl(o.x+o.vx*dt);o.z=cl(o.z+o.vz*dt);o.m.position.x=o.x;o.m.position.z=o.z;o.m.rotation.y+=dt*8;
        for(const u in P){const p=P[u];if(!p.alive)continue;const dx=o.x-p.x,dz=o.z-p.z,d=Math.hypot(dx,dz);
          if(d<9*(1+.3*(lv-1))&&d>.1){p.x+=dx/d*3.5*dt;p.z+=dz/d*3.5*dt}if(d<1.8*(1+.25*(lv-1)))kill(p,p.name+' унесён торнадо!')}},
      end:()=>s.remove(ex.m)},
    {n:'⛈ Гроза!',d:12,go:()=>ex={c:0},tk:dt=>{ex.c-=dt;if(ex.c<=0){ex.c=.5/lv;const p=rp();strike(p.x+R(-2,2),p.z+R(-2,2),2+.4*(lv-1),.7,'#fde047')}}},
    {n:'🌋 Извержение вулкана!',d:14,
      go:()=>{const x=R(-8,8),z=R(-8,8),c=new THREE.Mesh(new THREE.ConeGeometry(2.5,5,16),new THREE.MeshLambertMaterial({color:'#7c2d12'}));c.position.set(x,2.5,z);s.add(c);const l=disc(1,'#f97316',.8);l.position.set(x,.08,z);ex={x,z,c,l}},
      tk:()=>{const o=ex,r=1.5+7.5*(1+.5*(lv-1))*(evT/14);o.l.scale.setScalar(r);for(const u in P){const p=P[u];if(p.alive&&Math.hypot(p.x-o.x,p.z-o.z)<r)kill(p,p.name+' сгорел в лаве!')}},
      end:()=>{s.remove(ex.c);s.remove(ex.l)}},
    {n:'🏃 Обби: летающие стены!',d:18,
      go:()=>{ex={w:Array.from({length:7*lv},()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(7,2,1.4),new THREE.MeshLambertMaterial({color:'#f59e0b'})),an=R(0,6.28),v=R(5,8)*(1+.2*(lv-1));
        m.position.set(R(-A,A),1,R(-A,A));s.add(m);return{m,v,vx:Math.cos(an)*v,vz:Math.sin(an)*v,c:R(1.5,3.5),th:R(0,6.28),w:R(-1.2,1.2)}})}},
      tk:dt=>ex.w.forEach(o=>{const m=o.m;o.c-=dt;
        if(o.c<=0){o.c=R(1.5,3.5);const an=R(0,6.28);o.vx=Math.cos(an)*o.v;o.vz=Math.sin(an)*o.v}
        m.position.x+=o.vx*dt;m.position.z+=o.vz*dt;
        if(Math.abs(m.position.x)>A){m.position.x=Math.sign(m.position.x)*A;o.vx*=-1}
        if(Math.abs(m.position.z)>A){m.position.z=Math.sign(m.position.z)*A;o.vz*=-1}
        o.th+=o.w*dt;m.rotation.y=o.th;const c=Math.cos(o.th),sn=Math.sin(o.th);
        if(evT>1.5)for(const u in P){const p=P[u];if(!p.alive)continue;const dx=p.x-m.position.x,dz=p.z-m.position.z;
          if(Math.abs(dx*c-dz*sn)<3.8&&Math.abs(dx*sn+dz*c)<1.3)kill(p,p.name+' врезался в стену!')}}),
      end:()=>ex.w.forEach(o=>s.remove(o.m))},
    {n:'💰 Денежный дождь! Собирай!',d:15,go:()=>ex={c:0},
      tk:dt=>{ex.c-=dt;if(ex.c<=0){ex.c=.2/lv;
        const m=new THREE.Mesh(new THREE.BoxGeometry(.9,.15,.5),new THREE.MeshLambertMaterial({color:'#22c55e'}));m.position.set(R(-A+1,A-1),.4,R(-A+1,A-1));let age=0;
        addfx(m,d2=>{age+=d2;m.rotation.y+=d2*3;for(const u in P){const p=P[u];if(p.alive&&Math.hypot(p.x-m.position.x,p.z-m.position.z)<1.3){p.score++;sfx('gold');return true}}return age>6});}}},
    {n:'🧊 Лёд! Скользко!',d:15,go:()=>{ice=true;ex={l:disc(A*1.2,'#67e8f9',.35)}},tk:()=>{},end:()=>{ice=false;s.remove(ex.l)}},
    {n:'🟢 Лава! Беги на платформы!',d:9,
      go:()=>{ex={p:[0,1,2].map(()=>{const x=R(-12,12),z=R(-12,12),m=disc(4-.8*(lv-1),'#22c55e',.6);m.position.set(x,.07,z);return{x,z,m}}),l:disc(A*1.2,'#ef4444',0)}},
      tk:()=>{const f=evT>6;ex.l.material.opacity=f?.5:(evT>3&&Math.floor(evT*3)%2?.2:0);
        if(f)for(const u in P){const p=P[u];if(p.alive&&!ex.p.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<4-.8*(lv-1)))kill(p,p.name+' упал в лаву!')}},
      end:()=>{ex.p.forEach(o=>s.remove(o.m));s.remove(ex.l)}},
    {n:'🛸 НЛО похищает!',d:16,
      go:()=>{const u=new THREE.Mesh(new THREE.SphereGeometry(2,16,8),new THREE.MeshLambertMaterial({color:'#94a3b8'}));u.scale.y=.4;u.position.y=12;
        const b=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,12,16),new THREE.MeshBasicMaterial({color:'#a5f3fc',transparent:true,opacity:.3}));b.position.y=6;s.add(u,b);ex={u,b,x:0,z:0}},
      tk:dt=>{const o=ex;let tg=null,bd=1e9;
        Object.values(P).filter(p=>p.alive).forEach(p=>{const d=Math.hypot(p.x-o.x,p.z-o.z);if(d<bd){bd=d;tg=p}});
        if(tg){const sp=3.6*(1+.3*(lv-1));o.x+=(tg.x-o.x)/(bd||1)*sp*dt;o.z+=(tg.z-o.z)/(bd||1)*sp*dt}
        o.u.position.x=o.b.position.x=o.x;o.u.position.z=o.b.position.z=o.z;
        for(const q in P){const p=P[q];if(!p.alive)continue;if(Math.hypot(p.x-o.x,p.z-o.z)<2.2){p.ab=(p.ab||0)+dt;if(p.ab>1.8/lv){p.ab=0;kill(p,p.name+' похищен НЛО!')}}else p.ab=0}},
      end:()=>s.remove(ex.u,ex.b)}
  ];
  const startEv=e=>{ev=e;evT=0;msg=e.n;e.go();snap(e.n,undefined,undefined,true)};
  const endEv=()=>{if(ev&&ev.end)ev.end();ev=null;mon.forEach(o=>s.remove(o.m));mon=[];fxs.splice(0).forEach(f=>s.remove(f.m));ice=false;ex={}};
  const press=p=>{if(p.role==='mur'){p.cd=clock+1;for(const q in P){const o=P[q];if(o!==p&&o.alive&&Math.hypot(o.x-p.x,o.z-p.z)<3)kill(o,p.name+' убил '+o.name+' ножом!')}return}if(ev||clock<evAt||Math.hypot(p.x,p.z)>4)return;p.cd=clock+1;startEv(EVS[Math.floor(Math.random()*EVS.length)])};
  // толчок (царь горы, круг) и удар по мячу (футбол)
  const push=p=>{p.cd=clock+1.2;for(const q in P){const o=P[q];if(o===p||!o.alive||(game==='ctf'&&o.team===p.team))continue;const dx=o.x-p.x,dz=o.z-p.z,d=Math.hypot(dx,dz);if(d<3.2&&d>.01){o.kx=dx/d*20;o.kz=dz/d*20}}};
  const kick=p=>{const dx=ball.position.x-p.x,dz=ball.position.z-p.z,d=Math.hypot(dx,dz);p.cd=clock+.5;if(d<3.2&&d>.01){bv.x=dx/d*22;bv.z=dz/d*22}};
  /* ---------- Картошка / Падающий пол / Захват флага ---------- */
  let bombU=null,fuse=0,bombCd=0,tiles=[],holes=[],ffEl=0,ffT=2,flags=[];
  const blast=(x,z)=>{const e=mk(3,'#f97316',.8);e.position.set(x,.08,z);let tt=0;addfx(e,d=>{tt+=d;e.scale.setScalar(1+tt*2);e.material.opacity=Math.max(0,.8-tt*1.6);return tt>.5})};
  const giveBomb=u=>{bombU=u;bombCd=clock+1.2;fuse=R(8,13);for(const q in P)if(P[q].role==='bomb')P[q].role='inn';if(P[u])P[u].role='bomb'};
  if(game==='hp'){mark=new THREE.Mesh(new THREE.SphereGeometry(.5,14,14),new THREE.MeshBasicMaterial({color:'#111111'}));mark.visible=false;s.add(mark)}
  const hpTick=dt=>{
    const al=Object.entries(P).filter(([,p])=>p.alive);
    if(!P[bombU]||!P[bombU].alive){if(al.length)giveBomb(al[Math.floor(Math.random()*al.length)][0])}
    const h=P[bombU];if(!h)return;
    mark.visible=true;mark.position.set(h.x,3.9,h.z);
    fuse-=dt;mark.material.color.set(Math.floor(clock*(2+10/Math.max(fuse,.5)))%2?'#ef4444':'#111111');
    if(clock>bombCd)for(const [u,o] of al)if(u!==bombU&&Math.hypot(o.x-h.x,o.z-h.z)<1.7){h.role='inn';giveBomb(u);snap(o.name+' получил бомбу!',o.x,o.z);break}
    if(fuse<=0){
      h.alive=false;sfx('kill');blast(h.x,h.z);snap(h.name+' взорвался!',h.x,h.z);
      const rest=al.filter(([u])=>u!==bombU);
      if(rest.length)giveBomb(rest[Math.floor(Math.random()*rest.length)][0]);
    }
    const n=Object.values(P).filter(p=>p.alive).length;
    if(n===0)end('Все выбыли!');
    else if(n===1&&Object.keys(P).length>1)end('Победитель: '+Object.values(P).find(p=>p.alive).name+'!');
  };

  const TS=5,TN=8;
  const buildFloor=()=>{
    tiles.forEach(o=>s.remove(o.m));holes.forEach(h=>s.remove(h));tiles=[];holes=[];
    for(let i=0;i<TN;i++)for(let j=0;j<TN;j++){
      const base=(i+j)%2?'#475569':'#64748b',m=new THREE.Mesh(new THREE.BoxGeometry(TS-.2,.3,TS-.2),new THREE.MeshLambertMaterial({color:base}));
      const x=-A+i*TS+TS/2,z=-A+j*TS+TS/2;m.position.set(x,.15,z);s.add(m);tiles.push({m,x,z,st:0,t:0,base});
    }
  };
  if(game==='ff')buildFloor();
  const tileAt=p=>tiles[Math.max(0,Math.min(TN-1,Math.floor((p.x+A)/TS)))*TN+Math.max(0,Math.min(TN-1,Math.floor((p.z+A)/TS)))];
  const ffTick=dt=>{
    ffEl+=dt;ffT-=dt;
    if(ffT<=0){
      ffT=Math.max(.9,3-ffEl/40);
      const free=tiles.filter(o=>o.st===0),k=Math.min(free.length,1+Math.floor(ffEl/20)+(Math.random()<.5?1:0));
      for(let n=0;n<k;n++){const o=free.splice(Math.floor(Math.random()*free.length),1)[0];if(o){o.st=1;o.t=0}}
    }
    tiles.forEach(o=>{
      if(o.st===1){
        o.t+=dt;o.m.material.color.set(Math.floor(o.t*8)%2?'#ef4444':o.base);o.m.position.x=o.x+Math.sin(o.t*60)*.05;
        if(o.t>1.2){
          o.st=2;o.t=0;
          const h=new THREE.Mesh(new THREE.PlaneGeometry(TS-.2,TS-.2),new THREE.MeshBasicMaterial({color:'#020617'}));
          h.rotation.x=-Math.PI/2;h.position.set(o.x,.06,o.z);s.add(h);holes.push(h);
        }
      }else if(o.st===2){
        o.t+=dt;o.m.position.y=.15-o.t*14;o.m.rotation.x+=dt*3;if(o.t>1){s.remove(o.m);o.st=3}
      }
    });
    for(const u in P){const p=P[u];if(p.alive&&tileAt(p).st>=2){p.alive=false;sfx('kill');snap(p.name+' упал в пропасть!',p.x,p.z)}}
    const al=Object.values(P).filter(p=>p.alive);
    if(al.length<=1&&Object.keys(P).length>1)end(al[0]?'Победитель: '+al[0].name+'!':'Все выбыли!');
  };

  const mkFlag=c=>{
    const g=new THREE.Group(),pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,3,8),new THREE.MeshLambertMaterial({color:'#e5e7eb'})),
      ban=new THREE.Mesh(new THREE.BoxGeometry(1.3,.8,.08),new THREE.MeshBasicMaterial({color:c}));
    pole.position.y=1.5;ban.position.set(.65,2.5,0);g.add(pole,ban);return g;
  };
  if(game==='ctf')[[17,'#ef4444'],[-17,'#3b82f6']].forEach(([z,c],team)=>{
    const m=mkFlag(c);m.position.set(0,0,z);s.add(m);disc(3,c,.35).position.set(0,.05,z);flags[team]={home:{x:0,z},m,carrier:null};
  });
  const teamUp=ids=>ids.forEach((u,k)=>{
    const p=P[u];p.team=k%2;p.role=p.team?'b':'r';
    M[u].children.filter(c=>c.userData.disc).forEach(c=>M[u].remove(c));
    const d=mk(.9,p.team?'#3b82f6':'#ef4444',1);d.position.y=.07;d.userData.disc=1;M[u].add(d);
  });
  const ctfTick=()=>{
    for(let f=0;f<2;f++){
      const fl=flags[f],e=1-f,pl=Object.values(P);
      const home=()=>{fl.carrier=null;fl.m.position.set(fl.home.x,0,fl.home.z)};
      if(fl.carrier&&(!fl.carrier.alive||!pl.includes(fl.carrier)))home();
      if(!fl.carrier){
        for(const p of pl)if(p.alive&&p.team===e&&Math.hypot(p.x-fl.home.x,p.z-fl.home.z)<1.8){fl.carrier=p;snap(p.name+' украл флаг!',p.x,p.z);break}
      }else{
        const c=fl.carrier;fl.m.position.set(c.x,2.2,c.z);
        const tg=pl.find(q=>q.alive&&q.team===f&&Math.hypot(q.x-c.x,q.z-c.z)<1.7);
        if(tg){snap(tg.name+' вернул флаг!',c.x,c.z);c.kx=R(-15,15);c.kz=R(-15,15);home()}
        else if(!flags[e].carrier&&Math.hypot(c.x-flags[e].home.x,c.z-flags[e].home.z)<3){
          gs[e]++;snap(c.name+' захватил флаг!',c.x,c.z);home();
          if(gs[e]>=3)end((e?'Синие':'Красные')+' победили '+Math.max(...gs)+':'+Math.min(...gs));
        }
      }
    }
    if(phase==='play')msg=`🚩 Красные ${gs[0]} : ${gs[1]} Синие`;
  };



  $('startRound').onclick=()=>{
    const ids=Object.keys(P);
    if(!ids.length){msg='Нет игроков';return}
    if(game==='mm2'&&ids.length<2){msg='Для MM2 нужно минимум 2 игрока';return}
    $('rclose').onclick();shots=[];snapQ=[];
    ids.forEach(u=>Object.assign(P[u],{x:R(-8,8),z:R(-8,8),alive:true,score:0,role:'inn',cd:0,kx:0,kz:0,ix:0,iz:0,ab:0}));
    items.forEach(m=>s.remove(m));items.length=0;clearMaze();
    if(game==='tq'){for(let i=0;i<12;i++)items.push(gold());t=60;msg='Собирай золото!'}
    if(game==='mm2'){ids.sort(()=>Math.random()-.5);P[ids[0]].role='mur';P[ids[1]].role='sher';t=120;msg='Раунд идёт!'}
    if(game==='rg'){ids.forEach(u=>{P[u].x=R(-A+3,A-3);P[u].z=A-4});t=90;msg='Беги к финишу! На красный замри';light='green';lt=0;ld=R(3,6);lampColor('#22c55e')}
    if(game==='ed'){
      open=genMaze();({walls,meshes:wm}=buildMaze(s,open));
      ids.forEach(u=>{P[u].x=-A+Math.floor(Math.random()*N)*CS+CS/2;P[u].z=-A+Math.floor(Math.random()*3)*CS+CS/2});
      dvs=[0,1,2].slice(0,lv).map(i=>{
        const cx=[N-1,0,Math.floor(N/2)][i],o={x:-A+cx*CS+CS/2,z:-A+(N-1)*CS+CS/2,a:0,wait:[5,3,1.5][lv-1],sp:5.2*[1,1.12,1.25][lv-1],
          m:makeAvatar({body:'#dc2626',head:'#fde68a',arms:'#fde68a',legs:'#ffffff',hat:'cap'},'Девид')};
        o.m.scale.setScalar(1.6);const l=new THREE.PointLight('#ff2200',40,14,2);l.position.y=2;o.m.add(l);s.add(o.m);return o;
      });dvSfx=3;
      t=90;msg='Выживи 90 секунд! Девид идёт...';
    }
    endEv();
    if(game==='kh'){t=60;msg='Держи круг в центре! Толкайся 💥'}
    if(game==='tg'){it=ids[Math.floor(Math.random()*ids.length)];P[it].role='it';tagCd=clock+2;t=60;msg='Догонялки! Не будь водящим';mark.visible=true}
    if(game==='ring'){ringR=15;t=75;msg='Оставайся в круге! Толкай других 💥'}
    if(game==='fb'){
      gs=[0,0];bv={x:0,z:0};ball.position.set(0,.9,0);t=90;msg='⚽ Футбол!';
      ids.forEach((u,k)=>{
        const p=P[u];p.team=k%2;p.role=p.team?'b':'r';p.x=R(-8,8);p.z=p.team?-8:8;
        M[u].children.filter(c=>c.userData.disc).forEach(c=>M[u].remove(c));
        const d=mk(.9,p.team?'#3b82f6':'#ef4444',1);d.position.y=.07;d.userData.disc=1;M[u].add(d);
      });
    }
    if(game==='ch'){t=150;evAt=clock+3;msg='Жми красную кнопку в центре!'}
    if(game==='hp'){t=180;msg='💣 Картошка! Передай бомбу касанием!';bombCd=0;giveBomb(ids[Math.floor(Math.random()*ids.length)])}
    if(game==='ff'){t=150;msg='🧱 Пол рушится! Стой на плитках';ffEl=0;ffT=2.5;buildFloor()}
    if(game==='ctf'){
      gs=[0,0];t=150;msg='🚩 Укради флаг врага и принеси на свою базу!';teamUp(ids);
      ids.forEach(u=>{P[u].x=R(-8,8);P[u].z=P[u].team?-14:14});
      flags.forEach(f=>{f.carrier=null;f.m.position.set(f.home.x,0,f.home.z)});
    }
    if(lv>1&&(game==='ed'||game==='ch'))msg+=' 🔥×'+lv;
    phase='play';playMusic();
  };

  /* MM2: убийца бьёт ножом рядом; шериф стреляет в убийцу, шанс зависит от расстояния */
  const act=u=>{
    const p=P[u];
    if(phase!=='play'||!p.alive||clock<p.cd)return;if(game==='kh'||game==='ring'||game==='ctf')return push(p);if(game==='fb')return kick(p);if(game==='ch')return press(p);if(game!=='mm2')return;
    if(p.role==='mur'){
      p.cd=clock+1;
      for(const q in P){const o=P[q];if(q!==u&&o.alive&&Math.hypot(o.x-p.x,o.z-p.z)<3){o.alive=false;sfx('kill');snap(p.name+' ударил '+o.name,o.x,o.z)}}
    }
    if(p.role==='sher'){
      const m=Object.values(P).find(o=>o.role==='mur'&&o.alive);if(!m)return;
      p.cd=clock+3;tracer(p,m);
      if(Math.random()<chance(p,m)){m.alive=false;sfx('kill');snap(p.name+' застрелил убийцу!',m.x,m.z)}
      else snap(p.name+' промахнулся!',p.x,p.z);
    }
  };

  let prev=performance.now(),acc=0;
  const loop=now=>{
    const dt=Math.min((now-prev)/1000,.1);prev=now;clock+=dt;
    for(let q=fxs.length-1;q>=0;q--)if(fxs[q].upd(dt)){s.remove(fxs[q].m);fxs.splice(q,1)}
    for(const u in P)if(P[u].miss!==undefined&&clock-P[u].miss>20){s.remove(M[u]);delete P[u];delete M[u]}
    for(const u in P){
      const p=P[u],i=inp[u]||{},l=Math.hypot(i.dx||0,i.dz||0);let mv=0;
      if(p.alive&&l>.1){
        if(phase==='play'&&game==='rg'&&light==='red'&&lt>.8){p.alive=false;snap(p.name+' пошевелился на красный!',p.x,p.z)}
        else{
          const k=(game==='rg'?SPEED*.1:SPEED*((game==='tg'&&it===u)||(game==='hp'&&bombU===u)?1.12:1))*(ice?0:1)*dt/Math.max(l,1);
          p.x=cl(p.x+i.dx*k);p.z=cl(p.z+i.dz*k);p.a=Math.atan2(i.dx,i.dz);mv=1;
          if(walls.length)collide(p,walls);
        }
      }
      if(p.alive){
        if(ice){const f=Math.min(1,dt*1.2),tx=l>.1?i.dx/Math.max(l,1)*SPEED:0,tz=l>.1?i.dz/Math.max(l,1)*SPEED:0;p.ix+=(tx-p.ix)*f;p.iz+=(tz-p.iz)*f;p.x+=p.ix*dt;p.z+=p.iz*dt}
        if(p.kx||p.kz){const dc=Math.pow(.02,dt);p.x+=p.kx*dt;p.z+=p.kz*dt;p.kx*=dc;p.kz*=dc;if(Math.abs(p.kx)<.05&&Math.abs(p.kz)<.05)p.kx=p.kz=0}
        p.x=cl(p.x);p.z=cl(p.z);if(walls.length)collide(p,walls);
      }
      {const ia=i.act||0;if(ia<p.last)p.last=ia;else if(ia!==p.last){p.last=ia;act(u)}}
      M[u].position.set(p.x,0,p.z);M[u].rotation.y=p.a;M[u].scale.y=p.alive?1:.2;M[u].userData.walk(clock,mv);
    }
    if(phase==='play'){
      if(game==='tq')items.forEach(m=>{for(const u in P){const p=P[u];
        if(p.alive&&Math.hypot(p.x-m.position.x,p.z-m.position.z)<1.3){p.score++;sfx('gold');m.position.set(R(-A+2,A-2),.8,R(-A+2,A-2));break}}});
      if(game==='mm2'){
        const al=Object.values(P).filter(p=>p.alive);
        if(!al.some(p=>p.role==='mur'))end('Мирные победили!');
        else if(!al.some(p=>p.role!=='mur'))end('Убийца победил!');
      }
      if(game==='rg'){
        lt+=dt;
        if(lt>=ld){light=light==='green'?'red':'green';lt=0;ld=light==='green'?R(3,6):R(2,4);lampColor(light==='green'?'#22c55e':'#ef4444')}
        for(const u in P)if(phase==='play'&&P[u].alive&&P[u].z<=-A+3){snap(P[u].name+' добежал до финиша!',P[u].x,P[u].z);end('Победитель: '+P[u].name+'!')}
        if(phase==='play'&&!Object.values(P).some(p=>p.alive))end('Все выбыли!');
      }
      if(game==='ed'&&dvs.length){
        const al=Object.values(P).filter(p=>p.alive);
        dvs.forEach(dv=>{
          if(dv.wait>0)dv.wait-=dt;
          else if(al.length){
            let tg=null,bd=1e9;al.forEach(p=>{if(!p.alive)return;const d=Math.hypot(p.x-dv.x,p.z-dv.z);if(d<bd){bd=d;tg=p}});
            if(tg){
              const cm=cell(dv),ct=cell(tg);let px=tg.x,pz=tg.z;
              if(cm[0]!==ct[0]||cm[1]!==ct[1]){const n=nextCell(open,cm,ct);px=-A+n[0]*CS+CS/2;pz=-A+n[1]*CS+CS/2}
              const dx=px-dv.x,dz=pz-dv.z,d=Math.hypot(dx,dz)||1,k=dv.sp*dt;
              dv.x+=dx/d*k;dv.z+=dz/d*k;dv.a=Math.atan2(dx,dz);collide(dv,walls,.7);
              al.forEach(p=>{if(p.alive&&Math.hypot(p.x-dv.x,p.z-dv.z)<1.5){p.alive=false;sfx('burger');sfx('kill');snap('Девид съел '+p.name,p.x,p.z)}});
            }
          }
          dv.m.position.set(dv.x,0,dv.z);dv.m.rotation.y=dv.a;dv.m.userData.walk(clock,dv.wait<=0);
        });
        if(dvs[0].wait<=0){dvSfx-=dt;if(dvSfx<=0){sfx(Math.random()<.5?'kfc':'burger');dvSfx=R(5,10)/Math.sqrt(lv)}}
        if(!Object.values(P).some(p=>p.alive))end('Девид съел всех!');
      }
      if(game==='kh'){for(const u in P){const p=P[u];if(p.alive&&Math.hypot(p.x,p.z)<4)p.score+=dt}}
      if(game==='ring'){
        ringR=Math.max(5,15-10*(1-t/75));hill.scale.setScalar(ringR/15);
        for(const u in P){const p=P[u];if(p.alive&&Math.hypot(p.x,p.z)>ringR){p.alive=false;sfx('kill');snap(p.name+' вылетел из круга!',p.x,p.z)}}
        const al=Object.values(P).filter(p=>p.alive);
        if(al.length<=1&&Object.keys(P).length>1)end(al[0]?'Победитель: '+al[0].name+'!':'Все вылетели!');
      }
      if(game==='tg'&&Object.keys(P).length){
        if(!P[it])it=Object.keys(P)[0];
        const h=P[it];h.role='it';mark.position.set(h.x,4.3,h.z);
        if(clock>tagCd)for(const u in P){const o=P[u];if(u!==it&&o.alive&&Math.hypot(o.x-h.x,o.z-h.z)<1.7){h.role='inn';o.role='it';it=u;tagCd=clock+1.5;snap(o.name+' теперь водит!',o.x,o.z);break}}
        for(const u in P)if(u!==it)P[u].score+=dt;
      }
      if(game==='fb'){
        const b=ball.position;b.x+=bv.x*dt;b.z+=bv.z*dt;const fr=Math.pow(.35,dt);bv.x*=fr;bv.z*=fr;
        for(const u in P){const p=P[u];if(!p.alive)continue;const dx=b.x-p.x,dz=b.z-p.z,d=Math.hypot(dx,dz);
          if(d<1.5&&d>.01){bv.x=dx/d*10;bv.z=dz/d*10;b.x=p.x+dx/d*1.5;b.z=p.z+dz/d*1.5}}
        if(Math.abs(b.x)>A-.5){b.x=Math.sign(b.x)*(A-.5);bv.x*=-.8}
        if(Math.abs(b.z)>A-.5){
          if(Math.abs(b.x)<4){
            gs[b.z<0?0:1]++;snap('ГОЛ! '+(b.z<0?'Красные':'Синие')+' забили',b.x,b.z);b.set(0,.9,0);bv={x:0,z:0};
            if(gs[0]>=5||gs[1]>=5)end(gs[0]>gs[1]?'Красные победили '+gs[0]+':'+gs[1]:'Синие победили '+gs[1]+':'+gs[0]);
          }else{b.z=Math.sign(b.z)*(A-.5);bv.z*=-.8}
        }
        if(phase==='play')msg=`⚽ Красные ${gs[0]} : ${gs[1]} Синие`;
      }
      if(game==='ch'){
        if(ev){evT+=dt;ev.tk(dt);if(evT>=ev.d){endEv();evAt=clock+6/lv;msg='Событие закончилось. Жми кнопку!'}}
        else if(clock>evAt+25/lv)startEv(EVS[Math.floor(Math.random()*EVS.length)]);
        btn.material.color.set(ev||clock<evAt?'#6b7280':'#dc2626');
        if(!Object.values(P).some(p=>p.alive))end('Все погибли!');
      }
      if(game==='hp')hpTick(dt);
      if(game==='ff')ffTick(dt);
      if(game==='ctf')ctfTick();
      t-=dt;if(t<=0)end(timeUp());
    }

    // камера: вся арена или фокус на игроке, зум
    const f=focusI>0?Object.values(P)[focusI-1]:null,tx=f?f.x:0,tz=f?f.z:0;
    cam.position.lerp(new THREE.Vector3(tx,(f?16:34)*zoom,tz+(f?12:24)*zoom),.1);
    look.lerp(new THREE.Vector3(tx,0,tz),.1);cam.lookAt(look);
    r.render(s,cam);

    if(snapQ.length){
      const q=snapQ.shift(),op=cam.position.clone(),oq=cam.quaternion.clone();
      if(q.x!==undefined){cam.position.set(q.x,8,q.z+8);cam.lookAt(q.x,1,q.z)}
      r.render(s,cam);
      const c=document.createElement('canvas');c.width=480;c.height=Math.round(480*r.domElement.height/r.domElement.width);
      c.getContext('2d').drawImage(r.domElement,0,0,c.width,c.height);
      if(shots.length<8)shots.push({img:c.toDataURL('image/jpeg',.75),cap:q.cap});
      cam.position.copy(op);cam.quaternion.copy(oq);r.render(s,cam);
    }

    acc+=dt;
    if(acc>.25){
      acc=0;const ps=Object.entries(P).sort((a,b)=>b[1].score-a[1].score),mu=Object.values(P).find(o=>o.role==='mur'&&o.alive);
      $('focus').textContent='🎯 '+(f?f.name:T('Все'));$('qr').hidden=!qrOk||phase==='play';$('status').textContent=T(msg)+(phase==='play'?' · '+Math.ceil(t)+' '+UNIT[lang]:'');
      $('info').innerHTML=`<div>${T(msg)}${phase==='play'?' · '+Math.ceil(t)+' '+UNIT[lang]:''}</div>`+
        ps.map(([,p])=>`<div>${game==='fb'||game==='ctf'?(p.team?'🔵 ':'🔴 '):''}${['tq','kh','tg','ch'].includes(game)?Math.floor(p.score)+(p.alive?' — ':' ✖ '):p.alive?'● ':'✖ '}${p.name}</div>`).join('');
      set(path('state'),{phase,t:Math.ceil(t),msg,light,p:Object.fromEntries(ps.map(([u,p])=>[u,{s:Math.floor(p.score),al:p.alive,r:p.role,c:p.role==='sher'&&mu?Math.round(chance(p,mu)*100):0}]))});
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ---------- КЛИЕНТ (пульт) ---------- */
async function joinGame(c0){
  const code=c0||$('jc').value.trim(),u=auth.currentUser,rr=p=>ref(db,`rooms/${code}/${p}`);
  const g=await get(rr('game'));
  if(!g.exists())return $('joinerr').textContent=T('Комната не найдена');
  const game=g.val();
  const joinRoom=()=>{
    set(rr('players/'+u.uid),{name:u.displayName,av:avatar});
    onDisconnect(rr('players/'+u.uid)).remove();
    onDisconnect(rr('input/'+u.uid)).remove();
  };
  await set(rr('players/'+u.uid),{name:u.displayName,av:avatar});
  joinRoom();
  // если у телефона пропала связь — заново записываемся в комнату
  onValue(ref(db,'.info/connected'),sn=>{if(sn.val())joinRoom()});
  $('padBack').onclick=async()=>{try{await remove(rr('players/'+u.uid));await remove(rr('input/'+u.uid))}catch(e){}location.reload()};
  show('pad');$('act').hidden=true;

  let dx=0,dz=0,act=0,last=0;
  const send=f=>{
    const n=performance.now();if(!f&&n-last<90)return;last=n;
    set(rr('input/'+u.uid),{dx:+dx.toFixed(2),dz:+dz.toFixed(2),act});
  };
  const st=$('stick'),kn=$('knob');
  const mv=e=>{
    const b=st.getBoundingClientRect(),r0=b.width/2;
    let x=(e.clientX-b.left-r0)/r0,y=(e.clientY-b.top-r0)/r0;const l=Math.hypot(x,y);
    if(l>1){x/=l;y/=l}
    dx=x;dz=y;kn.style.transform=`translate(${x*50}px,${y*50}px)`;send();
  };
  st.onpointerdown=e=>{st.setPointerCapture(e.pointerId);mv(e)};
  st.onpointermove=e=>{if(e.buttons)mv(e)};
  st.onpointerup=st.onpointercancel=()=>{dx=dz=0;kn.style.transform='';send(true)};
  $('act').onpointerdown=()=>{act++;send(true)};

  const K={},key=(e,d)=>{
    const k=e.key.toLowerCase();
    if(k===' '&&d){act++;send(true)}
    if('wasd'.includes(k)&&k.length===1){K[k]=d;dx=(K.d?1:0)-(K.a?1:0);dz=(K.s?1:0)-(K.w?1:0);send(true)}
  };
  addEventListener('keydown',e=>!e.repeat&&key(e,1));
  addEventListener('keyup',e=>key(e,0));

  onValue(rr('state'),sn=>{
    const s=sn.val();if(!s)return;const m=s.p?.[u.uid]||{},play=s.phase==='play';
    const dead=m.al===false?' (ты выбыл)':'';
    const role={mur:'Ты УБИЙЦА 🔪',sher:'Ты ШЕРИФ 🔫',inn:'Ты мирный'}[m.r]||'';
    const sc=Math.floor(m.s||0),fin=s.phase==='end';
    const X={tq:'Золото: '+sc,mm2:role+dead,rg:(s.light==='green'?'🟢 БЕГИ':'🔴 СТОЙ')+dead,ed:'Беги от Девида!'+dead,ch:(m.r==='mur'?'Ты УБИЙЦА 🔪 · ':'')+'Монет: '+sc+dead,kh:'Очки: '+sc,tg:(m.r==='it'?'🏃 ТЫ ВОДИШЬ! ':'Убегай! ')+sc,ring:'Не вылети из круга!'+dead,fb:m.r==='r'?'Ты за 🔴':'Ты за 🔵',ctf:m.r==='r'?'Ты за 🔴':'Ты за 🔵',hp:(m.r==='bomb'?'💣 У ТЕБЯ БОМБА! Передай!':'Убегай от бомбы!')+dead,ff:'Стой на плитках!'+dead};
    const extra=play?X[game]:fin&&game==='ed'?(m.al?'🏆 Ты выжил!':'💀 Ты проиграл'):['tq','ch','kh','tg'].includes(game)?X[game]:'';
    document.body.style.background=game==='rg'&&play?(s.light==='green'?'#14532d':'#7f1d1d'):'#0f172a';
    const lab={mm2:m.r==='sher'?'🔫 '+(m.c||0)+'%':m.r==='mur'?'🔪':'',ch:m.r==='mur'?'🔪':'🔴',kh:'💥',ring:'💥',fb:'⚽',ctf:'💥'}[game]||'';
    $('act').hidden=!(play&&m.al!==false&&lab);$('act').textContent=lab;
    
    $('pinfo').textContent=T([s.msg,play?s.t+' '+UNIT[lang]:'',extra].filter(Boolean).join(' · '));
  });
  onValue(rr('awards'),sn=>{
    const a=sn.val();if(!a||localStorage.getItem('aw'+code)===String(a.id))return;
    localStorage.setItem('aw'+code,String(a.id));
    const base=a.p?.[u.uid];if(!base)return;
    const k=mult(),gain=base*k;
    runTransaction(ref(db,`users/${u.uid}/coins`),c=>(c||0)+gain);
    $('gain').textContent=`+${gain} 🪙`+(k>1?` (×${k})`:'');setTimeout(()=>{$('gain').textContent=''},6000);
  });
  // хост пропал: ждём 25 секунд (вдруг это обрыв связи), потом выходим
  let gone=null;
  onValue(rr('host'),sn=>{
    if(sn.exists()){clearTimeout(gone);gone=null;joinRoom()}
    else if(!gone)gone=setTimeout(()=>location.reload(),25000);
  });
}
$('bPlay').onclick=()=>joinGame();
