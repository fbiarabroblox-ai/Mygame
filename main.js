import * as THREE from 'three';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged,updateProfile} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getDatabase,ref,set,get,onValue,onDisconnect} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import {firebaseConfig} from './firebase-config.js';

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app);
const $=id=>document.getElementById(id),A=20,SPEED=7,N=10,CS=4;
const NAMES={tq:'Treasure Quest',mm2:'MM2',rg:'Красный/зелёный свет',ed:'Побег от Девида',ch:'Кнопка судьбы',kh:'Царь горы',tg:'Догонялки',ring:'Оставайся в круге',fb:'Футбол'};
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

/* ---------- Звук ---------- */
const MUSIC=['sounds/music1.mp3','sounds/music2.mp3','sounds/music3.mp3'];
const sfx=n=>{const a=new Audio(`sounds/${n}.mp3`);a.volume=.8;a.play().catch(()=>{})};
let bg;
const stopMusic=()=>{if(bg){bg.onended=null;bg.pause()}};
function playMusic(){stopMusic();bg=new Audio(MUSIC[Math.floor(Math.random()*MUSIC.length)]);bg.volume=.3;bg.onended=playMusic;bg.play().catch(()=>{})}

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
  avatar={...DEF,...(sn.val()||{})};
  $('hello').textContent='Привет, '+u.displayName+'!';
  show('menu');
}
onAuthStateChanged(auth,u=>u?(u.displayName&&enter(u)):show('auth'));
$('login').onclick=()=>authDo(false);
$('reg').onclick=()=>authDo(true);
$('bOut').onclick=()=>signOut(auth);
$('bClient').onclick=()=>show('join');
$('bHost').onclick=()=>show('hostsetup');

/* ---------- 3D-аватар (руки, ноги, шапки, очки, плащ) ---------- */
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
  g.userData.walk=(t,on)=>{const s=on?Math.sin(t*10)*.7:0;arms[0].rotation.x=s;arms[1].rotation.x=-s;legs[0].rotation.x=-s;legs[1].rotation.x=s};
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
  avatar={body:$('cb').value,head:$('ch').value,arms:$('ca').value,legs:$('cl').value,hat:$('hat').value,gl:+$('gl').checked,cape:+$('cp').checked};
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
$('bStart').onclick=async()=>{
  const game=$('gamesel').value;let code;
  do{code=String(Math.floor(10000+Math.random()*90000))}while((await get(ref(db,`rooms/${code}/host`))).exists());
  await set(ref(db,`rooms/${code}`),{host:auth.currentUser.uid,game});
  onDisconnect(ref(db,`rooms/${code}`)).remove();
  runHost(code,game);
};

function runHost(code,game){
  show('hostview');
  $('codeShow').textContent=`Код: ${code} — ${NAMES[game]}`;
  const dark=game==='ed',{r,s,cam,hemi}=scene3d($('cv'),dark);
  const P={},M={},inp={},items=[],path=p=>ref(db,`rooms/${code}/${p}`);
  let phase='lobby',t=0,msg='Можно ходить, пока ждём старта',clock=0,light='green',lt=0,ld=4;
  let walls=[],wm=[],open=null,dv=null,shots=[],snapQ=[],lastSnap=-9,focusI=0,zoom=1,rt;
  const look=new THREE.Vector3(),cl=v=>Math.max(-A+.5,Math.min(A-.5,v));
  cam.position.set(0,34,24);
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
    for(const u in P)if(!v[u]){s.remove(M[u]);delete P[u];delete M[u]}
    $('plist').textContent='Игроки: '+(Object.values(P).map(p=>p.name).join(', ')||'—');
  });
  onValue(path('input'),sn=>Object.assign(inp,sn.val()||{}));

  const gold=()=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(.5,12,12),new THREE.MeshLambertMaterial({color:'#facc15'}));
    m.position.set(R(-A+2,A-2),.8,R(-A+2,A-2));s.add(m);return m;
  };
  const top=()=>Object.values(P).sort((a,b)=>b.score-a.score)[0]?.name||'—';
  const chance=(p,m)=>Math.max(.05,Math.min(.95,1-Math.hypot(m.x-p.x,m.z-p.z)/26));

  /* «эпичные кадры» */
  const snap=(cap,x,z,force)=>{if(force||clock-lastSnap>2.5){lastSnap=clock;snapQ.push({cap,x,z})}};
  const recap=()=>{
    if(!shots.length)return;let i=0;
    const one=()=>{$('rimg').src=shots[i].img;$('rcap').textContent=shots[i].cap;i=(i+1)%shots.length};
    $('rtitle').textContent=msg;$('recap').hidden=false;one();clearInterval(rt);rt=setInterval(one,2200);
  };
  $('rclose').onclick=()=>{$('recap').hidden=true;clearInterval(rt)};
  const end=m=>{
    if(phase!=='play')return;
    phase='end';msg=m;stopMusic();endEv();if(mark)mark.visible=false;snap('Финал: '+m,undefined,undefined,true);setTimeout(recap,1200);
  };
  const timeUp=()=>({tq:'Время вышло! Победитель: '+top(),mm2:'Время вышло — мирные победили!',rg:'Время вышло!',
    ed:Object.values(P).some(p=>p.alive)?'Выжившие победили!':'Девид съел всех!',kh:'Царь горы: '+top(),tg:'Догонялки: победил '+top(),ring:'Время вышло — ничья!',fb:gs[0]>gs[1]?'Красные победили!':gs[1]>gs[0]?'Синие победили!':'Ничья!',ch:topScore()})[game];

  const tracer=(a,b)=>{
    const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x,1.5,a.z),new THREE.Vector3(b.x,1.5,b.z)]),new THREE.LineBasicMaterial({color:'#fde047'}));
    s.add(l);setTimeout(()=>s.remove(l),250);
  };
  const clearMaze=()=>{wm.forEach(m=>s.remove(m));wm=[];walls=[];open=null;if(dv){s.remove(dv.m);dv=null}};
  /* ---------- новые режимы ---------- */
  const mk=(rad,col,op=.5)=>{const m=new THREE.Mesh(new THREE.CircleGeometry(rad,40),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op}));m.rotation.x=-Math.PI/2;m.position.y=.05;return m};
  const disc=(...a)=>{const m=mk(...a);s.add(m);return m};
  let fxs=[],ev=null,evT=0,evAt=0,ex={},ice=false,mon=null,hill,btn,ball,mark,bv={x:0,z:0},gs=[0,0],ringR=15,it=null,tagCd=0;
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
    mon={x:Math.cos(a)*A,z:Math.sin(a)*A,a:0,m,sp,burger,sfx:2,name};
  };
  const monTick=dt=>{
    if(!mon)return;let tg=null,bd=1e9;
    Object.values(P).filter(p=>p.alive).forEach(p=>{const d=Math.hypot(p.x-mon.x,p.z-mon.z);if(d<bd){bd=d;tg=p}});
    if(tg){
      const dx=tg.x-mon.x,dz=tg.z-mon.z,d=bd||1;mon.x+=dx/d*mon.sp*dt;mon.z+=dz/d*mon.sp*dt;mon.a=Math.atan2(dx,dz);
      if(bd<1.6){tg.alive=false;if(mon.burger)sfx('burger');sfx('kill');snap(mon.name+' убил '+tg.name,tg.x,tg.z)}
    }
    mon.sfx-=dt;if(mon.burger&&mon.sfx<=0){sfx(Math.random()<.5?'kfc':'burger');mon.sfx=R(5,10)}
    mon.m.position.set(mon.x,0,mon.z);mon.m.rotation.y=mon.a;mon.m.userData.walk(clock,1);
  };
  const lightAll=on=>{for(const u in M){[...M[u].children].filter(c=>c.isPointLight).forEach(c=>M[u].remove(c));if(on){const l=new THREE.PointLight('#ffe9b0',35,16,2);l.position.y=3;M[u].add(l)}}};

  // «Кнопка судьбы»: 11 случайных событий
  const EVS=[
    {n:'👹 Девид охотится!',d:20,go:()=>spawnMon('Девид','#dc2626',5,1),tk:dt=>monTick(dt)},
    {n:'🌙 Ночь... Убийца среди вас!',d:20,go:()=>{hemi.intensity=.1;s.background.set('#050510');lightAll(1);const al=Object.values(P).filter(p=>p.alive),k=al[Math.floor(Math.random()*al.length)];if(k)k.role='mur';ex={k}},tk:()=>{},end:()=>{hemi.intensity=1.4;s.background.set('#87ceeb');lightAll(0);if(ex.k)ex.k.role='inn'}},
    {n:'☄️ Метеориты!',d:12,go:()=>ex={c:0},tk:dt=>{ex.c-=dt;if(ex.c<=0){ex.c=.45;const p=rp();strike(p.x+R(-4,4),p.z+R(-4,4),3,1.2,'#f97316')}}},
    {n:'🌪 Торнадо!',d:16,
      go:()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(3,.6,10,16),new THREE.MeshLambertMaterial({color:'#9ca3af',transparent:true,opacity:.7}));const a=R(0,6.28),r=R(13,18),x=Math.cos(a)*r,z=Math.sin(a)*r;m.position.set(x,5,z);s.add(m);ex={m,x,z,vx:R(-4,4),vz:R(-4,4),c:0}},
      tk:dt=>{const o=ex;o.c-=dt;if(o.c<=0){o.c=2;o.vx=R(-4,4);o.vz=R(-4,4)}
        o.x=cl(o.x+o.vx*dt);o.z=cl(o.z+o.vz*dt);o.m.position.x=o.x;o.m.position.z=o.z;o.m.rotation.y+=dt*8;
        for(const u in P){const p=P[u];if(!p.alive)continue;const dx=o.x-p.x,dz=o.z-p.z,d=Math.hypot(dx,dz);
          if(d<9&&d>.1){p.x+=dx/d*3.5*dt;p.z+=dz/d*3.5*dt}if(d<1.8)kill(p,p.name+' унесён торнадо!')}},
      end:()=>s.remove(ex.m)},
    {n:'⛈ Гроза!',d:12,go:()=>ex={c:0},tk:dt=>{ex.c-=dt;if(ex.c<=0){ex.c=.5;const p=rp();strike(p.x+R(-2,2),p.z+R(-2,2),2,.7,'#fde047')}}},
    {n:'🌋 Извержение вулкана!',d:14,
      go:()=>{const x=R(-8,8),z=R(-8,8),c=new THREE.Mesh(new THREE.ConeGeometry(2.5,5,16),new THREE.MeshLambertMaterial({color:'#7c2d12'}));c.position.set(x,2.5,z);s.add(c);const l=disc(1,'#f97316',.8);l.position.set(x,.08,z);ex={x,z,c,l}},
      tk:()=>{const o=ex,r=1.5+7.5*(evT/14);o.l.scale.setScalar(r);for(const u in P){const p=P[u];if(p.alive&&Math.hypot(p.x-o.x,p.z-o.z)<r)kill(p,p.name+' сгорел в лаве!')}},
      end:()=>{s.remove(ex.c);s.remove(ex.l)}},
    {n:'🏃 Обби: летающие стены!',d:18,
      go:()=>{ex={w:Array.from({length:7},()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(7,2,1.4),new THREE.MeshLambertMaterial({color:'#f59e0b'})),an=R(0,6.28),v=R(5,8);
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
      tk:dt=>{ex.c-=dt;if(ex.c<=0){ex.c=.2;
        const m=new THREE.Mesh(new THREE.BoxGeometry(.9,.15,.5),new THREE.MeshLambertMaterial({color:'#22c55e'}));m.position.set(R(-A+1,A-1),.4,R(-A+1,A-1));let age=0;
        addfx(m,d2=>{age+=d2;m.rotation.y+=d2*3;for(const u in P){const p=P[u];if(p.alive&&Math.hypot(p.x-m.position.x,p.z-m.position.z)<1.3){p.score++;sfx('gold');return true}}return age>6});}}},
    {n:'🧊 Лёд! Скользко!',d:15,go:()=>{ice=true;ex={l:disc(A*1.2,'#67e8f9',.35)}},tk:()=>{},end:()=>{ice=false;s.remove(ex.l)}},
    {n:'🟢 Лава! Беги на платформы!',d:9,
      go:()=>{ex={p:[0,1,2].map(()=>{const x=R(-12,12),z=R(-12,12),m=disc(4,'#22c55e',.6);m.position.set(x,.07,z);return{x,z,m}}),l:disc(A*1.2,'#ef4444',0)}},
      tk:()=>{const f=evT>6;ex.l.material.opacity=f?.5:(evT>3&&Math.floor(evT*3)%2?.2:0);
        if(f)for(const u in P){const p=P[u];if(p.alive&&!ex.p.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<4))kill(p,p.name+' упал в лаву!')}},
      end:()=>{ex.p.forEach(o=>s.remove(o.m));s.remove(ex.l)}},
    {n:'🛸 НЛО похищает!',d:16,
      go:()=>{const u=new THREE.Mesh(new THREE.SphereGeometry(2,16,8),new THREE.MeshLambertMaterial({color:'#94a3b8'}));u.scale.y=.4;u.position.y=12;
        const b=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,12,16),new THREE.MeshBasicMaterial({color:'#a5f3fc',transparent:true,opacity:.3}));b.position.y=6;s.add(u,b);ex={u,b,x:0,z:0}},
      tk:dt=>{const o=ex;let tg=null,bd=1e9;
        Object.values(P).filter(p=>p.alive).forEach(p=>{const d=Math.hypot(p.x-o.x,p.z-o.z);if(d<bd){bd=d;tg=p}});
        if(tg){o.x+=(tg.x-o.x)/(bd||1)*3.6*dt;o.z+=(tg.z-o.z)/(bd||1)*3.6*dt}
        o.u.position.x=o.b.position.x=o.x;o.u.position.z=o.b.position.z=o.z;
        for(const q in P){const p=P[q];if(!p.alive)continue;if(Math.hypot(p.x-o.x,p.z-o.z)<2.2){p.ab=(p.ab||0)+dt;if(p.ab>1.8){p.ab=0;kill(p,p.name+' похищен НЛО!')}}else p.ab=0}},
      end:()=>s.remove(ex.u,ex.b)}
  ];
  const startEv=e=>{ev=e;evT=0;msg=e.n;e.go();snap(e.n,undefined,undefined,true)};
  const endEv=()=>{if(ev&&ev.end)ev.end();ev=null;if(mon){s.remove(mon.m);mon=null}fxs.splice(0).forEach(f=>s.remove(f.m));ice=false;ex={}};
  const press=p=>{if(p.role==='mur'){p.cd=clock+1;for(const q in P){const o=P[q];if(o!==p&&o.alive&&Math.hypot(o.x-p.x,o.z-p.z)<3)kill(o,p.name+' убил '+o.name+' ножом!')}return}if(ev||clock<evAt||Math.hypot(p.x,p.z)>4)return;p.cd=clock+1;startEv(EVS[Math.floor(Math.random()*EVS.length)])};
  // толчок (царь горы, круг) и удар по мячу (футбол)
  const push=p=>{p.cd=clock+1.2;for(const q in P){const o=P[q];if(o===p||!o.alive)continue;const dx=o.x-p.x,dz=o.z-p.z,d=Math.hypot(dx,dz);if(d<3.2&&d>.01){o.kx=dx/d*20;o.kz=dz/d*20}}};
  const kick=p=>{const dx=ball.position.x-p.x,dz=ball.position.z-p.z,d=Math.hypot(dx,dz);p.cd=clock+.5;if(d<3.2&&d>.01){bv.x=dx/d*22;bv.z=dz/d*22}};


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
      dv={x:-A+(N-1)*CS+CS/2,z:-A+(N-1)*CS+CS/2,a:0,sfx:3,wait:5,m:makeAvatar({body:'#dc2626',head:'#fde68a',arms:'#fde68a',legs:'#ffffff',hat:'cap'},'Девид')};
      dv.m.scale.setScalar(1.6);const l=new THREE.PointLight('#ff2200',40,14,2);l.position.y=2;dv.m.add(l);s.add(dv.m);
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
    phase='play';playMusic();
  };

  /* MM2: убийца бьёт ножом рядом; шериф стреляет в убийцу, шанс зависит от расстояния */
  const act=u=>{
    const p=P[u];
    if(phase!=='play'||!p.alive||clock<p.cd)return;if(game==='kh'||game==='ring')return push(p);if(game==='fb')return kick(p);if(game==='ch')return press(p);if(game!=='mm2')return;
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
    for(const u in P){
      const p=P[u],i=inp[u]||{},l=Math.hypot(i.dx||0,i.dz||0);let mv=0;
      if(p.alive&&l>.1){
        if(phase==='play'&&game==='rg'&&light==='red'&&lt>.8){p.alive=false;snap(p.name+' пошевелился на красный!',p.x,p.z)}
        else{
          const k=(game==='rg'?SPEED*.1:SPEED*(game==='tg'&&it===u?1.12:1))*(ice?0:1)*dt/Math.max(l,1);
          p.x=cl(p.x+i.dx*k);p.z=cl(p.z+i.dz*k);p.a=Math.atan2(i.dx,i.dz);mv=1;
          if(walls.length)collide(p,walls);
        }
      }
      if(p.alive){
        if(ice){const f=Math.min(1,dt*1.2),tx=l>.1?i.dx/Math.max(l,1)*SPEED:0,tz=l>.1?i.dz/Math.max(l,1)*SPEED:0;p.ix+=(tx-p.ix)*f;p.iz+=(tz-p.iz)*f;p.x+=p.ix*dt;p.z+=p.iz*dt}
        if(p.kx||p.kz){const dc=Math.pow(.02,dt);p.x+=p.kx*dt;p.z+=p.kz*dt;p.kx*=dc;p.kz*=dc;if(Math.abs(p.kx)<.05&&Math.abs(p.kz)<.05)p.kx=p.kz=0}
        p.x=cl(p.x);p.z=cl(p.z);if(walls.length)collide(p,walls);
      }
      if((i.act||0)!==p.last){p.last=i.act||0;act(u)}
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
      if(game==='ed'&&dv){
        if(dv.wait>0)dv.wait-=dt;
        else{
          const al=Object.values(P).filter(p=>p.alive);
          if(al.length){
            let tg=al[0],bd=1e9;al.forEach(p=>{const d=Math.hypot(p.x-dv.x,p.z-dv.z);if(d<bd){bd=d;tg=p}});
            const cm=cell(dv),ct=cell(tg);let px=tg.x,pz=tg.z;
            if(cm[0]!==ct[0]||cm[1]!==ct[1]){const n=nextCell(open,cm,ct);px=-A+n[0]*CS+CS/2;pz=-A+n[1]*CS+CS/2}
            const dx=px-dv.x,dz=pz-dv.z,d=Math.hypot(dx,dz)||1,k=5.2*dt;
            dv.x+=dx/d*k;dv.z+=dz/d*k;dv.a=Math.atan2(dx,dz);collide(dv,walls,.7);
            al.forEach(p=>{if(Math.hypot(p.x-dv.x,p.z-dv.z)<1.5){p.alive=false;sfx('burger');sfx('kill');snap('Девид съел '+p.name,p.x,p.z)}});
          }
          dv.sfx-=dt;if(dv.sfx<=0){sfx(Math.random()<.5?'kfc':'burger');dv.sfx=R(5,10)}
        }
        dv.m.position.set(dv.x,0,dv.z);dv.m.rotation.y=dv.a;dv.m.userData.walk(clock,dv.wait<=0);
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
        if(ev){evT+=dt;ev.tk(dt);if(evT>=ev.d){endEv();evAt=clock+6;msg='Событие закончилось. Жми кнопку!'}}
        else if(clock>evAt+25)startEv(EVS[Math.floor(Math.random()*EVS.length)]);
        btn.material.color.set(ev||clock<evAt?'#6b7280':'#dc2626');
        if(!Object.values(P).some(p=>p.alive))end('Все погибли!');
      }
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
      $('focus').textContent='🎯 '+(f?f.name:'Все');
      $('info').innerHTML=`<div>${msg}${phase==='play'?' · '+Math.ceil(t)+' с':''}</div>`+
        ps.map(([,p])=>`<div>${game==='fb'?(p.team?'🔵 ':'🔴 '):''}${['tq','kh','tg','ch'].includes(game)?Math.floor(p.score)+(p.alive?' — ':' ✖ '):p.alive?'● ':'✖ '}${p.name}</div>`).join('');
      set(path('state'),{phase,t:Math.ceil(t),msg,light,p:Object.fromEntries(ps.map(([u,p])=>[u,{s:Math.floor(p.score),al:p.alive,r:p.role,c:p.role==='sher'&&mu?Math.round(chance(p,mu)*100):0}]))});
    }
    requestAnimationFrame(loop);
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
    const X={tq:'Золото: '+sc,mm2:role+dead,rg:(s.light==='green'?'🟢 БЕГИ':'🔴 СТОЙ')+dead,ed:'Беги от Девида!'+dead,ch:(m.r==='mur'?'Ты УБИЙЦА 🔪 · ':'')+'Монет: '+sc+dead,kh:'Очки: '+sc,tg:(m.r==='it'?'🏃 ТЫ ВОДИШЬ! ':'Убегай! ')+sc,ring:'Не вылети из круга!'+dead,fb:m.r==='r'?'Ты за 🔴':'Ты за 🔵'};
    const extra=play?X[game]:fin&&game==='ed'?(m.al?'🏆 Ты выжил!':'💀 Ты проиграл'):['tq','ch','kh','tg'].includes(game)?X[game]:'';
    document.body.style.background=game==='rg'&&play?(s.light==='green'?'#14532d':'#7f1d1d'):'#0f172a';
    const lab={mm2:m.r==='sher'?'🔫 '+(m.c||0)+'%':m.r==='mur'?'🔪':'',ch:m.r==='mur'?'🔪':'🔴',kh:'💥',ring:'💥',fb:'⚽'}[game]||'';
    $('act').hidden=!(play&&m.al!==false&&lab);$('act').textContent=lab;
    
    $('pinfo').textContent=[s.msg,play?s.t+' с':'',extra].filter(Boolean).join(' · ');
  });
  onValue(rr('host'),sn=>{if(!sn.exists())location.reload()});
};
