import * as THREE from 'three';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged,updateProfile} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getDatabase,ref,set,get,onValue,onDisconnect} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import {firebaseConfig} from './firebase-config.js';

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app);
const $=id=>document.getElementById(id),A=20,SPEED=7;
const show=id=>document.querySelectorAll('.screen').forEach(s=>s.hidden=s.id!==id);
const R=(a,b)=>a+Math.random()*(b-a);
const esc=s=>String(s).replace(/[<>&"]/g,'');
let avatar={body:'#3b82f6',head:'#fcd34d',hat:'none'};
const MUSIC=['sounds/music1.mp3','sounds/music2.mp3','sounds/music3.mp3'];
const sfx=n=>{const a=new Audio(`sounds/${n}.mp3`);a.volume=.8;a.play().catch(()=>{})};
let bg;

window.addEventListener('click', () => {
  const dummy = new Audio();
  dummy.play().catch(() => {});
}, { once: true });

function playMusic(){
  stopMusic();
  bg=new Audio(MUSIC[Math.floor(Math.random()*MUSIC.length)]);
  bg.volume=.3;
  bg.onended=playMusic; // когда песня кончилась, включится другая случайная
  bg.play().catch(()=>{});
}
const stopMusic=()=>{if(bg){bg.onended=null;bg.pause()}};
document.querySelectorAll('.back').forEach(b=>b.onclick=()=>location.reload());

/* ---------- Аккаунты ---------- */
const mail=u=>u.trim().toLowerCase()+'@mpgame.app';
async function authDo(reg){
  const u=$('u').value.trim(),p=$('p').value;
  if(!/^[a-zA-Z0-9_]{3,16}$/.test(u))return $('autherr').textContent='Ник: 3–16 символов, латиница, цифры или _';
  try{
    if(reg){const c=await createUserWithEmailAndPassword(auth,mail(u),p);await updateProfile(c.user,{displayName:u});enter(c.user)}
    else await signInWithEmailAndPassword(auth,mail(u),p);
  }catch(e){$('autherr').textContent={'auth/email-already-in-use':'Ник занят','auth/invalid-credential':'Неверный ник или пароль','auth/weak-password':'Пароль короче 6 символов'}[e.code]||e.code}
}
async function enter(u){
  const sn=await get(ref(db,`users/${u.uid}/avatar`));
  if(sn.exists())avatar=sn.val();
  $('hello').textContent='Привет, '+u.displayName+'!';
  show('menu');
}
onAuthStateChanged(auth,u=>u?(u.displayName&&enter(u)):show('auth'));
$('login').onclick=()=>authDo(false);
$('reg').onclick=()=>authDo(true);
$('bOut').onclick=()=>signOut(auth);
$('bClient').onclick=()=>show('join');
$('bHost').onclick=()=>show('hostsetup');

/* ---------- 3D-аватар ---------- */
function makeAvatar(av,name){
  const g=new THREE.Group(),M=c=>new THREE.MeshLambertMaterial({color:c});
  const B=(w,h,d,c,y,z=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c));m.position.set(0,y,z);g.add(m)};
  B(.7,.6,.4,'#334155',.3);B(.8,1,.5,av.body,1.1);B(.6,.6,.6,av.head,1.9);B(.15,.15,.15,'#222',1.9,.35);
  if(av.hat==='cone'){const h=new THREE.Mesh(new THREE.ConeGeometry(.35,.6,8),M('#ef4444'));h.position.y=2.5;g.add(h)}
  if(av.hat==='cube')B(.9,.2,.9,'#111',2.3);
  if(name){
    const c=document.createElement('canvas');c.width=256;c.height=64;
    const x=c.getContext('2d');x.font='bold 36px sans-serif';x.textAlign='center';x.lineWidth=6;x.strokeStyle='#000';x.fillStyle='#fff';
    x.strokeText(name,128,44);x.fillText(name,128,44);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));
    sp.scale.set(3,.75,1);sp.position.y=3.1;g.add(sp);
  }
  return g;
}

let pv;
function drawPrev(){
  avatar={body:$('cb').value,head:$('ch').value,hat:$('hat').value};
  if(!pv){
    pv=new THREE.WebGLRenderer({canvas:$('prev'),antialias:true,alpha:true});
    pv.sc=new THREE.Scene();pv.sc.add(new THREE.HemisphereLight('#fff','#556',2));
    pv.cam=new THREE.PerspectiveCamera(40,1,.1,50);pv.cam.position.set(0,1.8,6);pv.cam.lookAt(0,1.5,0);
  }
  if(pv.m)pv.sc.remove(pv.m);
  pv.m=makeAvatar(avatar,'');pv.m.rotation.y=.5;pv.sc.add(pv.m);pv.render(pv.sc,pv.cam);
}
$('bAv').onclick=()=>{show('avatar');$('cb').value=avatar.body;$('ch').value=avatar.head;$('hat').value=avatar.hat;drawPrev()};
['cb','ch','hat'].forEach(i=>$(i).oninput=drawPrev);
$('bSave').onclick=async()=>{drawPrev();await set(ref(db,`users/${auth.currentUser.uid}/avatar`),avatar);location.reload()};

/* ---------- 3D-сцена ---------- */
function scene3d(canvas){
  const r=new THREE.WebGLRenderer({canvas,antialias:true}),s=new THREE.Scene(),cam=new THREE.PerspectiveCamera(55,1,.1,200);
  s.background=new THREE.Color('#87ceeb');
  s.add(new THREE.HemisphereLight('#fff','#556',1.4));
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(A*2+4,A*2+4),new THREE.MeshLambertMaterial({color:'#6b8e5a'}));
  fl.rotation.x=-Math.PI/2;s.add(fl);
  const gr=new THREE.GridHelper(A*2,20,'#4d6b40','#4d6b40');gr.position.y=.02;s.add(gr);
  const rs=()=>{r.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};
  addEventListener('resize',rs);rs();
  return{r,s,cam};
}

/* ---------- ХОСТ ---------- */
$('bStart').onclick=async()=>{
  const game=$('gamesel').value;let code;
  do{code=String(Math.floor(10000+Math.random()*90000))}while((await get(ref(db,`rooms/${code}/host`))).exists());
  await set(ref(db,`rooms/${code}`),{host:auth.currentUser.uid,game});
  onDisconnect(ref(db,`rooms/${code}`)).remove();
  runHost(code,game);
};

function runHost(code,game){
  show('hostview');
  $('codeShow').textContent=`Код: ${code} — ${game==='tq'?'Treasure Quest':'MM2'}`;
  const {r,s,cam}=scene3d($('cv'));cam.position.set(0,34,24);cam.lookAt(0,0,0);
  const P={},M={},inp={},items=[],path=p=>ref(db,`rooms/${code}/${p}`);
  let phase='lobby',t=0,msg='Ждём игроков',clock=0;

  onValue(path('players'),sn=>{
    const v=sn.val()||{};
    for(const u in v)if(!P[u]){
      P[u]={name:esc(v[u].name),x:R(-8,8),z:R(-8,8),a:0,score:0,alive:true,role:'',last:0,cd:0};
      M[u]=makeAvatar(v[u].av||avatar,P[u].name);s.add(M[u]);
    }
    for(const u in P)if(!v[u]){s.remove(M[u]);delete P[u];delete M[u]}
    $('plist').textContent='Игроки: '+(Object.values(P).map(p=>p.name).join(', ')||'—');
  });
  onValue(path('input'),sn=>Object.assign(inp,sn.val()||{}));

  const gold=()=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(.5,12,12),new THREE.MeshLambertMaterial({color:'#facc15'}));
    m.position.set(R(-A+2,A-2),.8,R(-A+2,A-2));s.add(m);return m;
  };
  const top=()=>Object.values(P).sort((a,b)=>b.score-a.score)[0]?.name||'—';
  const end=m=>{phase='end';msg=m;stopMusic()};

  $('startRound').onclick=()=>{
    const ids=Object.keys(P);
    if(!ids.length){msg='Нет игроков';return}
    if(game==='mm2'&&ids.length<2){msg='Для MM2 нужно минимум 2 игрока';return}
    ids.forEach(u=>Object.assign(P[u],{x:R(-8,8),z:R(-8,8),alive:true,score:0,role:'inn'}));
    items.forEach(m=>s.remove(m));items.length=0;
    if(game==='tq'){for(let i=0;i<12;i++)items.push(gold());t=60;msg='Собирай золото!'}
    else{ids.sort(()=>Math.random()-.5);P[ids[0]].role='mur';if(ids.length>2)P[ids[1]].role='sher';t=120;msg='Раунд идёт!'}
      phase='play';playMusic();
  };

  // MM2: убийца бьёт ножом рядом, шериф стреляет вперёд
  const act=u=>{
    const p=P[u];
    if(game!=='mm2'||phase!=='play'||!p.alive||clock<p.cd)return;
    const sx=Math.sin(p.a),cz=Math.cos(p.a);
    if(p.role==='mur'){
      p.cd=clock+1;
        for(const q in P)if(q!==u&&P[q].alive&&Math.hypot(P[q].x-p.x,P[q].z-p.z)<3){P[q].alive=false;sfx('kill')}
    }
    if(p.role==='sher'){
      p.cd=clock+2;let best=null,bf=99;
      for(const q in P){
        const o=P[q];if(q===u||!o.alive)continue;
        const dx=o.x-p.x,dz=o.z-p.z,f=dx*sx+dz*cz,l=Math.abs(dx*cz-dz*sx);
        if(f>0&&f<bf&&l<1.3){best=o;bf=f}
      }
      if(best){best.alive=false;sfx('kill');
        if(best.role!=='mur')p.alive=false}
    }
  };

  let prev=performance.now(),acc=0;
  const loop=now=>{
    const dt=Math.min((now-prev)/1000,.1);prev=now;clock+=dt;
    for(const u in P){
      const p=P[u],i=inp[u]||{};
      if(phase==='play'&&p.alive){
        const l=Math.hypot(i.dx||0,i.dz||0);
        if(l>.1){
          const k=SPEED*dt/Math.max(l,1);
          p.x=Math.max(-A,Math.min(A,p.x+i.dx*k));p.z=Math.max(-A,Math.min(A,p.z+i.dz*k));
          p.a=Math.atan2(i.dx,i.dz);
        }
      }
      if((i.act||0)!==p.last){p.last=i.act||0;act(u)}
      M[u].position.set(p.x,0,p.z);M[u].rotation.y=p.a;M[u].scale.y=p.alive?1:.2;
    }
    if(phase==='play'){
      if(game==='tq'){
        items.forEach(m=>{for(const u in P){const p=P[u];
          if(P[u].alive&&Math.hypot(p.x-m.position.x,p.z-m.position.z)<1.3){p.score++;sfx('gold');m.position.set(R(-A+2,A-2),.8,R(-A+2,A-2));break}}});
      }else{
        const al=Object.values(P).filter(p=>p.alive);
        if(!al.some(p=>p.role==='mur'))end('Мирные победили!');
        else if(!al.some(p=>p.role!=='mur'))end('Убийца победил!');
      }
      t-=dt;
      if(t<=0&&phase==='play')end(game==='tq'?'Время вышло! Победитель: '+top():'Время вышло — мирные победили!');
    }
    acc+=dt;
    if(acc>.25){
      acc=0;const ps=Object.entries(P).sort((a,b)=>b[1].score-a[1].score);
      $('info').innerHTML=`<div>${msg}${phase==='play'?' · '+Math.ceil(t)+' с':''}</div>`+
        ps.map(([,p])=>`<div>${game==='tq'?p.score+' — ':p.alive?'● ':'✖ '}${p.name}</div>`).join('');
      set(path('state'),{phase,t:Math.ceil(t),msg,p:Object.fromEntries(ps.map(([u,p])=>[u,{s:p.score,al:p.alive,r:p.role}]))});
    }
    r.render(s,cam);requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ---------- КЛИЕНТ (пульт) ---------- */
$('bPlay').onclick=async()=>{
  const code=$('jc').value.trim(),u=auth.currentUser,rr=p=>ref(db,`rooms/${code}/${p}`);
  const g=await get(rr('game'));
  if(!g.exists())return $('joinerr').textContent='Комната не найдена';
  const game=g.val();
  await set(rr('players/'+u.uid),{name:u.displayName,av:avatar});
  onDisconnect(rr('players/'+u.uid)).remove();
  onDisconnect(rr('input/'+u.uid)).remove();
  show('pad');$('act').hidden=game!=='mm2';

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

  // клавиатура для проверки на ПК: WASD + пробел
  const K={},key=(e,d)=>{
    const k=e.key.toLowerCase();
    if(k===' '&&d){act++;send(true)}
    if('wasd'.includes(k)&&k.length===1){K[k]=d;dx=(K.d?1:0)-(K.a?1:0);dz=(K.s?1:0)-(K.w?1:0);send(true)}
  };
  addEventListener('keydown',e=>!e.repeat&&key(e,1));
  addEventListener('keyup',e=>key(e,0));

  onValue(rr('state'),sn=>{
    const s=sn.val();if(!s)return;const m=s.p?.[u.uid]||{};
    const role={mur:'Ты УБИЙЦА 🔪',sher:'Ты ШЕРИФ 🔫',inn:'Ты мирный'}[m.r]||'';
    $('pinfo').textContent=[
      s.msg,s.phase==='play'?s.t+' с':'',
      game==='tq'?'Золото: '+(m.s||0):(s.phase==='play'?role+(m.al===false?' (ты выбыл)':''):'')
    ].filter(Boolean).join(' · ');
  });
  onValue(rr('host'),sn=>{if(!sn.exists())location.reload()});
};
