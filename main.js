import * as THREE from 'three';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged,updateProfile} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {getDatabase,ref,set,get,onValue,onDisconnect} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import {firebaseConfig} from './firebase-config.js';

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app);
const $=id=>document.getElementById(id),A=20,SPEED=7,N=10,CS=4;
const NAMES={tq:'Treasure Quest',mm2:'MM2',rg:'Красный/зелёный свет',ed:'Побег от Давида'};
const show=id=>document.querySelectorAll('.screen').forEach(s=>s.hidden=s.id!==id);
const R=(a,b)=>a+Math.random()*(b-a);
const esc=s=>String(s).replace(/[<>&"]/g,'');
const DEF={body:'#3b82f6',head:'#fcd34d',arms:'#fcd34d',legs:'#334155',hat:'none',gl:0,cape:0};
let avatar={...DEF};
document.querySelectorAll('.back').forEach(b=>b.onclick=()=>location.reload());

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
  s.add(new THREE.HemisphereLight('#fff','#556',dark?.3:1.4));
  if(dark)s.fog=new THREE.Fog('#000',45,95);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(A*2+4,A*2+4),new THREE.MeshLambertMaterial({color:dark?'#1f2937':'#6b8e5a'}));
  fl.rotation.x=-Math.PI/2;s.add(fl);
  if(!dark){const gr=new THREE.GridHelper(A*2,20,'#4d6b40','#4d6b40');gr.position.y=.02;s.add(gr)}
  const rs=()=>{r.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};
  addEventListener('resize',rs);rs();
  return{r,s,cam};
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
  const dark=game==='ed',{r,s,cam}=scene3d($('cv'),dark);
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
      P[u]={name:esc(v[u].name),x:R(-8,8),z:R(-8,8),a:0,score:0,alive:true,role:'',last:0,cd:0};
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
    phase='end';msg=m;stopMusic();snap('Финал: '+m,undefined,undefined,true);setTimeout(recap,1200);
  };
  const timeUp=()=>({tq:'Время вышло! Победитель: '+top(),mm2:'Время вышло — мирные победили!',rg:'Время вышло!',
    ed:Object.values(P).some(p=>p.alive)?'Выжившие победили!':'Давид съел всех!'})[game];

  const tracer=(a,b)=>{
    const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x,1.5,a.z),new THREE.Vector3(b.x,1.5,b.z)]),new THREE.LineBasicMaterial({color:'#fde047'}));
    s.add(l);setTimeout(()=>s.remove(l),250);
  };
  const clearMaze=()=>{wm.forEach(m=>s.remove(m));wm=[];walls=[];open=null;if(dv){s.remove(dv.m);dv=null}};

  $('startRound').onclick=()=>{
    const ids=Object.keys(P);
    if(!ids.length){msg='Нет игроков';return}
    if(game==='mm2'&&ids.length<2){msg='Для MM2 нужно минимум 2 игрока';return}
    $('rclose').onclick();shots=[];snapQ=[];
    ids.forEach(u=>Object.assign(P[u],{x:R(-8,8),z:R(-8,8),alive:true,score:0,role:'inn',cd:0}));
    items.forEach(m=>s.remove(m));items.length=0;clearMaze();
    if(game==='tq'){for(let i=0;i<12;i++)items.push(gold());t=60;msg='Собирай золото!'}
    if(game==='mm2'){ids.sort(()=>Math.random()-.5);P[ids[0]].role='mur';P[ids[1]].role='sher';t=120;msg='Раунд идёт!'}
    if(game==='rg'){ids.forEach(u=>{P[u].x=R(-A+3,A-3);P[u].z=A-4});t=90;msg='Беги к финишу! На красный замри';light='green';lt=0;ld=R(3,6);lampColor('#22c55e')}
    if(game==='ed'){
      open=genMaze();({walls,meshes:wm}=buildMaze(s,open));
      ids.forEach(u=>{P[u].x=-A+Math.floor(Math.random()*N)*CS+CS/2;P[u].z=-A+Math.floor(Math.random()*3)*CS+CS/2});
      dv={x:-A+(N-1)*CS+CS/2,z:-A+(N-1)*CS+CS/2,a:0,sfx:3,wait:5,m:makeAvatar({body:'#dc2626',head:'#fde68a',arms:'#fde68a',legs:'#ffffff',hat:'cap'},'Давид')};
      dv.m.scale.setScalar(1.6);const l=new THREE.PointLight('#ff2200',40,14,2);l.position.y=2;dv.m.add(l);s.add(dv.m);
      t=90;msg='Выживи 90 секунд! Давид идёт...';
    }
    phase='play';playMusic();
  };

  /* MM2: убийца бьёт ножом рядом; шериф стреляет в убийцу, шанс зависит от расстояния */
  const act=u=>{
    const p=P[u];
    if(game!=='mm2'||phase!=='play'||!p.alive||clock<p.cd)return;
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
    for(const u in P){
      const p=P[u],i=inp[u]||{},l=Math.hypot(i.dx||0,i.dz||0);let mv=0;
      if(p.alive&&l>.1){
        if(phase==='play'&&game==='rg'&&light==='red'&&lt>.8){p.alive=false;snap(p.name+' пошевелился на красный!',p.x,p.z)}
        else{
          const k=SPEED*dt/Math.max(l,1);
          p.x=cl(p.x+i.dx*k);p.z=cl(p.z+i.dz*k);p.a=Math.atan2(i.dx,i.dz);mv=1;
          if(walls.length)collide(p,walls);
        }
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
            al.forEach(p=>{if(Math.hypot(p.x-dv.x,p.z-dv.z)<1.5){p.alive=false;sfx('burger');sfx('kill');snap('Давид съел '+p.name,p.x,p.z)}});
          }
          dv.sfx-=dt;if(dv.sfx<=0){sfx(Math.random()<.5?'kfc':'burger');dv.sfx=R(5,10)}
        }
        dv.m.position.set(dv.x,0,dv.z);dv.m.rotation.y=dv.a;dv.m.userData.walk(clock,dv.wait<=0);
        if(!Object.values(P).some(p=>p.alive))end('Давид съел всех!');
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
        ps.map(([,p])=>`<div>${game==='tq'?p.score+' — ':p.alive?'● ':'✖ '}${p.name}</div>`).join('');
      set(path('state'),{phase,t:Math.ceil(t),msg,light,p:Object.fromEntries(ps.map(([u,p])=>[u,{s:p.score,al:p.alive,r:p.role,c:p.role==='sher'&&mu?Math.round(chance(p,mu)*100):0}]))});
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
    const extra=play?({tq:'Золото: '+(m.s||0),mm2:role+dead,rg:(s.light==='green'?'🟢 БЕГИ':'🔴 СТОЙ')+dead,ed:'Беги от Давида!'+dead})[game]
      :s.phase==='end'&&game==='ed'?(m.al?'🏆 Ты выжил!':'💀 Ты проиграл'):game==='tq'?'Золото: '+(m.s||0):'';
    document.body.style.background=game==='rg'&&play?(s.light==='green'?'#14532d':'#7f1d1d'):'#0f172a';
    $('act').hidden=!(game==='mm2'&&play&&m.al!==false&&(m.r==='mur'||m.r==='sher'));
    $('act').textContent=m.r==='sher'?'🔫 '+(m.c||0)+'%':'🔪';
    $('pinfo').textContent=[s.msg,play?s.t+' с':'',extra].filter(Boolean).join(' · ');
  });
  onValue(rr('host'),sn=>{if(!sn.exists())location.reload()});
};
