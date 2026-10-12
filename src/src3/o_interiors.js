// ===================== portal interiors: supermarket, pharmacy, stairwell + lift, apartment =====================
const INT_X=30000,INT_Z=0,INT_Y=0;
const PRODUCTS=['МОЛОКО','КЕФІР','ЙОГУРТ','СМЕТАНА','СИР','МАСЛО','ХЛІБ','БАТОН','СІК ЯБЛУЧНИЙ','СІК АПЕЛЬСИН','ВОДА','ЛИМОНАД','КАВА','ЧАЙ','ЦУКОР','СІЛЬ',
  'ГРЕЧКА','РИС','МАКАРОНИ','ОЛІЯ','КЕТЧУП','МАЙОНЕЗ','ЧІПСИ','СУХАРИКИ','ПЕЧИВО','ЦУКЕРКИ','ШОКОЛАД','ВАФЛІ','ШПРОТИ','ГОРОШОК','КУКУРУДЗА','ПЕЛЬМЕНІ',
  'МОРОЗИВО','ЯЙЦЯ','ПЛАСТІВЦІ','ВЕРМІШЕЛЬ','ПОРОШОК','МИЛО','ШАМПУНЬ','СЕРВЕТКИ','ГЕМАТОГЕН','АСКОРБІНКА','ВІТАМІНИ','ПЛАСТИР','КВАС','ТОМАТИ','КОВБАСА','ПАШТЕТ'];
const PCOL=['#2f6fc9','#3aa0d8','#e86a9a','#f1efe6','#f2c21b','#f6e27a','#a8743a','#d9a35b','#4caf50','#ff9a1f','#7fc8f0','#e8452f','#5a3a24','#2f8a4a','#f4f4f4','#9ec9e8',
  '#8a5a2a','#f0ece0','#e2b43c','#f2c21b','#d0281f','#f5f2e3','#ffcf33','#c88a2c','#c45a2a','#c2185b','#5d2e14','#e0b066','#2a5a8a','#3f8a46','#f2c21b','#e8eef6',
  '#9fd3f0','#f2e6cf','#e0582a','#d9b25a','#2f6fc9','#ff7fb0','#7a3fb0','#f7f7f7','#8a1c1c','#ffd23a','#ff8a1f','#e8e8e8','#7a4a1a','#d0281f','#b0283a','#c8a070'];
let PROD_TEX=null;
function genProductAtlas(){const T=256,cv=document.createElement('canvas');cv.width=T*8;cv.height=T*6;const x=cv.getContext('2d');
  PRODUCTS.forEach((nm,i)=>{const cx=(i%8)*T,cy=(5-Math.floor(i/8))*T;const bg=PCOL[i];x.fillStyle=bg;x.fillRect(cx,cy,T,T);
    const light=['#f1efe6','#f4f4f4','#f0ece0','#f5f2e3','#f6e27a','#e8eef6','#f2e6cf','#e8e8e8','#f7f7f7','#9fd3f0','#7fc8f0','#9ec9e8'].includes(bg);
    x.fillStyle=light?'rgba(0,0,0,.08)':'rgba(255,255,255,.14)';x.fillRect(cx,cy+T*.62,T,T*.12);
    x.fillStyle='rgba(255,255,255,.85)';x.beginPath();x.ellipse(cx+T/2,cy+T*.36,T*.3,T*.2,0,0,6.283);x.fill();
    x.fillStyle=light?'#1d3b6b':'#ffffff';x.textAlign='center';x.textBaseline='middle';let fs=46;x.font=`900 ${fs}px "Golos Text",Arial,sans-serif`;while(x.measureText(nm).width>T-26&&fs>18){fs-=2;x.font=`900 ${fs}px "Golos Text",Arial,sans-serif`}
    x.fillText(nm,cx+T/2,cy+T*.8);x.fillStyle=bg;x.font=`800 ${Math.min(40,fs)}px "Golos Text",Arial`;x.fillText(['★','●','◆','▲','♥','✿'][i%6],cx+T/2,cy+T*.36);
    x.fillStyle='rgba(0,0,0,.18)';x.fillRect(cx,cy,4,T);x.fillRect(cx+T-4,cy,4,T)});
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;PROD_TEX=t}
function productMat(){const m=new THREE.MeshStandardMaterial({map:PROD_TEX,roughness:.55});m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aTile;')
  .replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_UV\n vUv=(uv*vec2(.96,.96)+vec2(.02)+vec2(mod(aTile,8.),floor(aTile/8.)))/vec2(8.,6.);\n#endif')};m.customProgramCacheKey=()=>'prod';return m}
// shelf filler: returns instanced boxes / cylinders
class ProdFill{constructor(){this.b=[];this.c=[]}
  box(x,y,z,w,h,d,ry,tile){this.b.push([x,y,z,w,h,d,ry,tile])}cyl(x,y,z,r,h,tile){this.c.push([x,y,z,r,h,tile])}
  build(grp){const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),S=new THREE.Vector3(),T=new THREE.Vector3();
    const mk=(geo,list,fn)=>{if(!list.length)return;const im=new THREE.InstancedMesh(geo,productMat(),list.length);im.frustumCulled=false;const tiles=new Float32Array(list.length);
      list.forEach((p,i)=>{fn(p);M.compose(T,Q,S);im.setMatrixAt(i,M);tiles[i]=p[p.length-1]});geo.setAttribute('aTile',new THREE.InstancedBufferAttribute(tiles,1));im.receiveShadow=true;grp.add(im)};
    mk(new THREE.BoxGeometry(1,1,1),this.b,p=>{T.set(p[0],p[1]+p[4]/2,p[2]);E.set(0,p[6],0);Q.setFromEuler(E);S.set(p[3],p[4],p[5])});
    mk(new THREE.CylinderGeometry(1,1,1,12),this.c,p=>{T.set(p[0],p[1]+p[4]/2,p[2]);E.set(0,0,0);Q.setFromEuler(E);S.set(p[3],p[4],p[3])})}}
const PORTAL={cur:null,built:{},ret:null,peds:[],
  setCity(v){for(const c of chunks.values())for(const m of [c.ground,c.bld,c.props,c.signs,c.grx])if(m)m.visible=v;if(LANDMARK_GRP)LANDMARK_GRP.visible=v;seaMesh.visible=v;
    for(const t of TREES.meshes){t.t.visible=v;t.l.visible=v}for(const t of CAR_T){t.mesh.visible=v;t.wheels.visible=v}for(const t of TRAMS)t.mesh.visible=v;if(snowPts)snowPts.visible=v&&S.season==='winter';
    for(const n in this.built)this.built[n].grp.visible=!v&&this.cur===n},
  enter(name,ret,opt){const f=$('fade');f.style.opacity=1;setTimeout(()=>{
      if(!this.cur)this.ret=ret;this.opt=opt||{};
      if(!this.built[name])this.built[name]=INTERIORS[name]();const B=this.built[name];
      if(B.onEnter)B.onEnter(this.opt);this.cur=name;this.setCity(false);
      player.x=B.spawn[0];player.z=B.spawn[1];player.y=B.spawnY||INT_Y;player.yaw=B.spawnYaw||0;cam.yaw=player.yaw;cam.init=false;player.vx=player.vz=0;player.sit=null;
      if(DRIVE.on)exitCar();player.scoot=false;
      toast(B.title,B.sub||'');f.style.opacity=0},380)},
  exit(){const f=$('fade');f.style.opacity=1;setTimeout(()=>{const r=this.ret;this.cur=null;this.setCity(true);for(const n in this.built)this.built[n].grp.visible=false;
      teleportRaw(r.x,r.z,r.yaw);f.style.opacity=0},380)},
  go(name,opt){const f=$('fade');f.style.opacity=1;setTimeout(()=>{for(const n in this.built)this.built[n].grp.visible=false;
      if(!this.built[name])this.built[name]=INTERIORS[name]();const B=this.built[name];this.opt=opt||{};if(B.onEnter)B.onEnter(this.opt);this.cur=name;this.setCity(false);
      player.x=B.spawn[0];player.z=B.spawn[1];player.y=B.spawnY||INT_Y;player.yaw=B.spawnYaw||0;cam.yaw=player.yaw;cam.init=false;toast(B.title,B.sub||'');f.style.opacity=0},380)}};
const INVENTORY={},BAG={};const PRICE={sausage:120,bread:28,juice:52,milk:38,apples:35,crisps:45,'ice cream':30,hematogen:22,'vitamin C':15};
function unpaid(){return Object.values(INVENTORY).reduce((a,b)=>a+b,0)}
function addItem(n,paid){const T=paid?BAG:INVENTORY;T[n]=(T[n]||0)+1;if(paid){toast('Bought: '+n,'₴'+(PRICE[n]||20)+' · in your bag');if(window.AUD)AUD.beep();return}
  const s=Object.entries(INVENTORY).map(([k,v])=>k+(v>1?' ×'+v:'')).join(', ');toast('In the basket: '+n,(s.length>60?s.slice(0,60)+'…':s)+' · pay at the checkout');if(window.AUD)AUD.beep()}
function payCheckout(){const n=unpaid();if(!n){toast('Basket is empty','grab something from the shelves');return}let sum=0;for(const [k,v] of Object.entries(INVENTORY)){sum+=(PRICE[k]||20)*v;BAG[k]=(BAG[k]||0)+v;delete INVENTORY[k]}
  toast('Paid ₴'+sum,n+' item'+(n>1?'s':'')+' · thank you, come again!');if(window.AUD)AUD.beep()}
function leaveShop(){if(unpaid()){toast('Pay first!','the security guard stops you — go to the checkout (КАСИ)');if(window.AUD){AUD.beep();setTimeout(()=>AUD.beep(),180)}return}PORTAL.exit()}
// helpers for interior rooms (local coords relative to an origin)
let DOOR_MAT=null;
function room(grp,ox,oz,x0,x1,z0,z1,h,mats,opt){opt=opt||{};const add=(g,m,x,y,z)=>{const me=new THREE.Mesh(g,m);me.position.set(ox+x,INT_Y+y,oz+z);me.receiveShadow=true;grp.add(me);return me};
  add(new THREE.BoxGeometry(x1-x0,.1,z1-z0),mats.floor,(x0+x1)/2,-.05,(z0+z1)/2);add(new THREE.BoxGeometry(x1-x0,.1,z1-z0),mats.ceil,(x0+x1)/2,h+.05,(z0+z1)/2);
  const wall=(xa,za,xb,zb)=>{const L=Math.hypot(xb-xa,zb-za);const m=add(new THREE.BoxGeometry(L,h,.2),mats.wall,(xa+xb)/2,h/2,(za+zb)/2);m.rotation.y=-Math.atan2(zb-za,xb-xa);wallSeg(ox+xa,oz+za,ox+xb,oz+zb,.3,INT_Y-1,INT_Y+h+1);return m};
  const gaps=opt.gaps||[];const edges=[[x0,z0,x1,z0],[x1,z0,x1,z1],[x1,z1,x0,z1],[x0,z1,x0,z0]];
  edges.forEach(([xa,za,xb,zb],ei)=>{const gs=gaps.filter(g=>g[0]===ei).sort((a,b)=>a[1]-b[1]);let t=0;const L=Math.hypot(xb-xa,zb-za);
    for(const g of gs){const t0=(g[1]-g[2]/2)/L,t1=(g[1]+g[2]/2)/L;if(t0>t)wall(xa+(xb-xa)*t,za+(zb-za)*t,xa+(xb-xa)*t0,za+(zb-za)*t0);
      const lint=add(new THREE.BoxGeometry(g[2],h-2.4,.2),mats.wall,(xa+(xb-xa)*(t0+t1)/2),2.4+(h-2.4)/2,(za+(zb-za)*(t0+t1)/2));lint.rotation.y=-Math.atan2(zb-za,xb-xa);
      // closed door in the opening (you leave with E): keeps the camera inside the room
      const dr=add(new THREE.BoxGeometry(g[2],2.4,.12),DOOR_MAT||(DOOR_MAT=new THREE.MeshStandardMaterial({color:0x5a3a24,roughness:.6})),(xa+(xb-xa)*(t0+t1)/2),1.2,(za+(zb-za)*(t0+t1)/2));dr.rotation.y=-Math.atan2(zb-za,xb-xa);
      wallSeg(ox+xa+(xb-xa)*t0,oz+za+(zb-za)*t0,ox+xa+(xb-xa)*t1,oz+za+(zb-za)*t1,.3,INT_Y-1,INT_Y+h+1);t=t1}
    if(t<1)wall(xa+(xb-xa)*t,za+(zb-za)*t,xb,zb)});
  SPECIAL.push((x,z)=>{const lx=x-ox,lz=z-oz;if(lx>x0-.5&&lx<x1+.5&&lz>z0-.5&&lz<z1+.5)return {h:INT_Y,pri:9,surf:opt.surf||'tile'};return null});
}
function neonSign(grp,txt,x,y,z,ry,w,col){const cv=txtCanvas([txt],{w:1024,h:160,size:110,color:col||'#ffffff',weight:'800'});const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.156),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false}));m.position.set(x,y,z);m.rotation.y=ry;grp.add(m);return m}
function intPed(x,z,yaw,route){const p=Object.assign(randPerson(),{x,z,y:INT_Y,yaw,phase:Math.random()*6,pose:route?'walk':'stand',moving:!!route,route,ri:0,wait:0,basket:true});return p}
function stepIntPeds(dt){for(const p of PORTAL.peds){if(!p.route)continue;if(p.wait>0){p.wait-=dt;p.moving=false;continue}const t=p.route[p.ri];const dx=t[0]-p.x,dz=t[1]-p.z,d=Math.hypot(dx,dz);
  if(d<.3){p.ri=(p.ri+1)%p.route.length;p.wait=Math.random()<.4?1+Math.random()*3:0;continue}p.moving=true;const sp=1.1;p.x+=dx/d*sp*dt;p.z+=dz/d*sp*dt;p.phase+=sp*dt*3.3;
  let dy=Math.atan2(dx,dz)-p.yaw;while(dy>Math.PI)dy-=6.283;while(dy<-Math.PI)dy+=6.283;p.yaw+=dy*Math.min(1,dt*6)}}
const INTERIORS={
  market(){const grp=new THREE.Group();scene.add(grp);const ox=INT_X,oz=INT_Z;
    const floorT=(()=>{const cv=document.createElement('canvas');cv.width=cv.height=256;const x=cv.getContext('2d');x.fillStyle='#a7a6a2';x.fillRect(0,0,256,256);for(let i=0;i<4000;i++){x.fillStyle=`rgba(${Math.random()<.5?255:0},${Math.random()<.5?255:0},255,.03)`;x.fillRect(Math.random()*256,Math.random()*256,2,2)}x.strokeStyle='#8d8c88';x.lineWidth=3;x.strokeRect(0,0,256,256);const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(30,22);t.encoding=THREE.sRGBEncoding;return t})();
    const mats={floor:new THREE.MeshStandardMaterial({map:floorT,roughness:.35,metalness:.05}),ceil:new THREE.MeshStandardMaterial({color:0x1c1c1e,roughness:.9}),wall:new THREE.MeshStandardMaterial({color:0x2b2c2e,roughness:.8})};
    const X0=-18,X1=18,Z0=0,Z1=26,H=5.4;room(grp,ox,oz,X0,X1,Z0,Z1,H,mats,{gaps:[[0,18,4]]});
    const P=new PB(),pf=new ProdFill();const r=rng(2024);
    // wooden slat ceiling clusters and lights
    for(const [cx,cz] of [[-9,8],[0,8],[9,8],[-9,17],[0,17],[9,17]]){for(let k=0;k<18;k++)P.box(ox+cx-4.5+k*.5,INT_Y+H-.35-(k%3)*.12,oz+cz,.12,.3,6,0,sRGB('#8b5a32'),5);
      for(const dz of [-2,2])P.box(ox+cx,INT_Y+H-.9,oz+cz+dz,5,.06,.12,0,sRGB('#fff8e8'),3)}
    // green neon band + department signs
    P.box(ox,INT_Y+H-.7,oz+Z1-.15,35.6,.12,.05,0,sRGB('#38ff6a'),8);P.box(ox+X0+.15,INT_Y+H-.7,oz+13,.05,.12,25.6,0,sRGB('#38ff6a'),8);P.box(ox+X1-.15,INT_Y+H-.7,oz+13,.05,.12,25.6,0,sRGB('#38ff6a'),8);
    neonSign(grp,'МОЛОКО',ox-10,INT_Y+H-1.3,oz+Z1-.2,Math.PI,5.2);neonSign(grp,'КОВБАСИ',ox,INT_Y+H-1.3,oz+Z1-.2,Math.PI,5.6);neonSign(grp,'СИР',ox+10,INT_Y+H-1.3,oz+Z1-.2,Math.PI,3.2);
    neonSign(grp,'ХЛІБ',ox+X0+.2,INT_Y+H-1.3,oz+16,Math.PI/2,3.6);neonSign(grp,'ОВОЧІ ТА ФРУКТИ',ox+X1-.2,INT_Y+H-1.3,oz+6,-Math.PI/2,7.5,'#7dff8a');
    neonSign(grp,'СОКИ · ВОДА',ox+X1-.2,INT_Y+H-1.3,oz+18,-Math.PI/2,6);neonSign(grp,'КАСИ',ox-10,INT_Y+H-1.3,oz+.25,0,3.2,'#ffd84a');
    // brick columns
    const brick=(()=>{const cv=document.createElement('canvas');cv.width=128;cv.height=256;const x=cv.getContext('2d');x.fillStyle='#d8cfc2';x.fillRect(0,0,128,256);for(let row=0;row<16;row++)for(let c=0;c<4;c++){x.fillStyle=`hsl(${12+Math.random()*10},${45+Math.random()*15}%,${30+Math.random()*10}%)`;x.fillRect((c+(row%2)*.5)*32-14,row*16+1,30,14)}const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,3);return t})();
    for(const cx of [-11,1,13]){const m=new THREE.Mesh(new THREE.BoxGeometry(.9,H,.9),new THREE.MeshStandardMaterial({map:brick,roughness:.9}));m.position.set(ox+cx,INT_Y+H/2,oz+9.6);grp.add(m);STATIC_CIR.push(ox+cx,oz+9.6,.7)}
    // aisles of gondola shelves filled with labelled products
    const sec=[[22,23,24,25,26,27],[16,17,18,35,19,14],[28,29,30,31,47,20],[8,9,10,11,44,12],[36,37,38,39,13,15]];
    [-14,-8,-2,4,10].forEach((ax,ai)=>{const z0=11.5,z1=22.5;P.box(ox+ax,INT_Y+.9,oz+(z0+z1)/2,1.15,1.8,z1-z0,0,sRGB('#2e2f31'),1);P.box(ox+ax,INT_Y+2.05,oz+(z0+z1)/2,.08,.5,z1-z0,0,sRGB('#2e2f31'),1);
      wallSeg(ox+ax,oz+z0,ox+ax,oz+z1,1.3,INT_Y-1,INT_Y+2.2);
      for(let lvl=0;lvl<4;lvl++){const y=.15+lvl*.45;for(const sd of [-1,1]){P.box(ox+ax+sd*.77,INT_Y+y,oz+(z0+z1)/2,.4,.03,z1-z0,0,sRGB('#c9cbcd'),1);P.box(ox+ax+sd*.975,INT_Y+y-.05,oz+(z0+z1)/2,.02,.06,z1-z0,0,sRGB('#f2d22a'),3);
        let z=z0+.12;const tset=sec[ai];while(z<z1-.15){const tile=tset[(r()*tset.length)|0];const w=.1+r()*.1,h=.16+r()*.2;const n=3+(r()*4|0);
          for(let k=0;k<n&&z<z1-.15;k++){if(tile===29||tile===28||tile===31||tile===10||tile===11)pf.cyl(ox+ax+sd*.75,INT_Y+y+.02,oz+z+.05,.045,h*.9,tile);else pf.box(ox+ax+sd*.74,INT_Y+y+.02,oz+z+w/2,.26,h,w,sd>0?Math.PI/2:-Math.PI/2,tile);z+=w+.015}z+=.06}}}});
    // every aisle side can be shopped: walk along a shelf and press E
    {const names=[['crisps','croutons','cookies','sweets','chocolate','wafers'],['buckwheat','rice','pasta','noodles','sunflower oil','sugar'],['sprats','green peas','sweetcorn','dumplings','pâté','ketchup'],['apple juice','orange juice','water','lemonade','coffee','kvass'],['washing powder','soap','shampoo','napkins','tea','salt']];
     const prices=[[45,40,35,60,55,30],[42,48,30,25,75,32],[55,28,30,95,40,35],[52,52,18,30,140,35],[160,25,90,20,60,12]];
     [-14,-8,-2,4,10].forEach((ax,ai)=>{for(const sd of [-1,1])for(let q=0;q<3;q++){const k=(q*2+(sd>0?1:0))%6;const nm=names[ai][k];PRICE[nm]=prices[ai][k];
       INTERACT.push({x:ox+ax+sd*1.35,z:oz+13.5+q*3.6,r:1.7,label:'Take '+nm,fn:()=>addItem(nm)})}})}
    // dairy / sausage fridges along the back wall
    for(let x=X0+1;x<X1-1;x+=2.05){P.box(ox+x,INT_Y+1.1,oz+Z1-.18,2,2.2,.16,0,sRGB('#e9ecef'),1);P.box(ox+x-.98,INT_Y+1.1,oz+Z1-.55,.06,2.2,.9,0,sRGB('#e9ecef'),1);P.box(ox+x,INT_Y+2.17,oz+Z1-.55,2,.08,.9,0,sRGB('#dff0ff'),8);P.box(ox+x,INT_Y+.1,oz+Z1-.55,2,.2,.9,0,sRGB('#e9ecef'),1);
      for(let lvl=0;lvl<4;lvl++){P.box(ox+x,INT_Y+.28+lvl*.48,oz+Z1-.55,1.95,.03,.85,0,sRGB('#cfd3d6'),1);for(let k=0;k<7;k++){const tile=x<-6?[0,1,2,3,5][(r()*5)|0]:x<6?[46,47,31,32][(r()*4)|0]:[4,5,33][(r()*3)|0];pf.box(ox+x-.8+k*.27,INT_Y+.3+lvl*.48,oz+Z1-.6,.18,.22+r()*.06,.15,0,tile);pf.box(ox+x-.8+k*.27,INT_Y+.3+lvl*.48,oz+Z1-.8,.18,.22,.15,0,tile)}}}
    wallSeg(ox+X0,oz+Z1-1,ox+X1,oz+Z1-1,.3,INT_Y-1,INT_Y+2.5);
    // bread racks on the left wall
    for(let z=12;z<23;z+=2.4){P.box(ox+X0+.6,INT_Y+.9,oz+z,1,1.8,2.2,0,sRGB('#7a5232'),5);for(let lvl=0;lvl<3;lvl++)for(let k=0;k<6;k++){const loaf=r()<.5;P.box(ox+X0+.55,INT_Y+.35+lvl*.55,oz+z-.85+k*.34,loaf?.32:.5,.14,.22,0,sRGB(loaf?'#b9783a':'#d9a35b'),5)}}
    wallSeg(ox+X0+1.1,oz+11,ox+X0+1.1,oz+23.5,.3,INT_Y-1,INT_Y+2);
    // fruit and veg crates
    const fruit=[];const fcol=['#c62828','#7cb342','#ff9800','#fdd835','#8d6e63','#e53935','#43a047'];
    for(let i=0;i<4;i++)for(let j=0;j<2;j++){const cx=6+i*2.6,cz=4+j*2.4;P.box(ox+cx,INT_Y+.45,oz+cz,2.2,.9,1.8,0,sRGB('#a87b4f'),5);const col=fcol[(i*2+j)%fcol.length];
      for(let k=0;k<70;k++)fruit.push([ox+cx-.95+r()*1.9,INT_Y+.95+r()*.12,oz+cz-.75+r()*1.5,col])}
    wallSeg(ox+4.6,oz+2.8,ox+15.6,oz+2.8,.3,INT_Y-1,INT_Y+1);wallSeg(ox+4.6,oz+5.6,ox+15.6,oz+5.6,.3,INT_Y-1,INT_Y+1);
    {const im=new THREE.InstancedMesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshStandardMaterial({roughness:.5}),fruit.length);im.frustumCulled=false;const M=new THREE.Matrix4(),C=new THREE.Color();fruit.forEach((f,i)=>{M.makeTranslation(f[0],f[1],f[2]);im.setMatrixAt(i,M);C.set(f[3]);C.convertSRGBToLinear();im.setColorAt(i,C)});grp.add(im)}
    // deli counter
    {const cx=14.5,cz=17;P.box(ox+cx,INT_Y+.5,oz+cz,2.2,1,8,0,sRGB('#e8e4dc'),1);P.box(ox+cx-.4,INT_Y+1.25,oz+cz,1.2,.5,7.8,0,sRGB('#d7ecf8'),2);for(let k=0;k<30;k++)pf.cyl(ox+cx-.3+(r()-.5)*.6,INT_Y+1.02,oz+cz-3.6+k*.25,.06,.28,46);wallSeg(ox+cx-1.2,oz+cz-4,ox+cx-1.2,oz+cz+4,.4,INT_Y-1,INT_Y+1.5);
     INTERACT.push({x:ox+cx-1.9,z:oz+cz,r:2.2,label:'Buy sausage',fn:()=>addItem('sausage')})}
    // cash desks with cashiers
    const peds=[];
    for(const cx of [-15,-11,-7,-3]){P.box(ox+cx,INT_Y+.45,oz+4.5,1,.9,3.2,0,sRGB('#3a3a3c'),1);P.box(ox+cx,INT_Y+.92,oz+4.5,.6,.04,2.6,0,sRGB('#202020'),4);P.box(ox+cx+.25,INT_Y+1.2,oz+5.8,.35,.3,.3,0,sRGB('#1c1c1c'),1);
      peds.push(Object.assign(intPed(ox+cx+.9,oz+5.6,-Math.PI/2),{cT:0x2f8a4a}));wallSeg(ox+cx,oz+2.9,ox+cx,oz+6.1,1.1,INT_Y-1,INT_Y+1.2)}
    for(const cx of [-15,-11,-7,-3])INTERACT.push({x:ox+cx-.9,z:oz+4.2,r:1.8,label:'Pay at the checkout',cond:()=>unpaid()>0,fn:payCheckout});
    INTERACT.push({x:ox+X0+1.8,z:oz+17,r:3,label:'Buy bread',fn:()=>addItem('bread')});
    INTERACT.push({x:ox+X1-1.8,z:oz+18,r:2.4,label:'Take juice',fn:()=>addItem('juice')});
    INTERACT.push({x:ox,z:oz+Z1-2,r:3.5,label:'Take milk',fn:()=>addItem('milk')});
    INTERACT.push({x:ox+10,z:oz+4,r:2.5,label:'Take apples',fn:()=>addItem('apples')});
    INTERACT.push({x:ox-14,z:oz+17,r:2.2,label:'Take crisps',fn:()=>addItem('crisps')});
    INTERACT.push({x:ox+4,z:oz+17,r:2.2,label:'Take ice cream',fn:()=>addItem('ice cream')});
    INTERACT.push({x:ox,z:oz+.8,r:2,label:'Go outside',fn:leaveShop});
    // red balloons
    const bm=new THREE.MeshStandardMaterial({color:0xe5231e,roughness:.3,emissive:0x400000});for(const [cx,cz] of [[-6,9],[6,9],[0,14],[-12,20],[12,20]])for(let k=0;k<5;k++){const b=new THREE.Mesh(new THREE.SphereGeometry(.3,12,10),bm);b.scale.y=1.2;b.position.set(ox+cx+(k-2)*.35,INT_Y+3.6+(k%2)*.3,oz+cz+(k%3-1)*.25);grp.add(b)}
    // shoppers walking around the aisles
    for(let k=0;k<9;k++){const ax=[-11,-5,1,7,13][k%5];peds.push(intPed(ox+ax,oz+12+k,0,[[ox+ax,oz+11],[ox+ax,oz+23],[ox+ax+(k%2?3:-3),oz+23.3],[ox+ax+(k%2?3:-3),oz+10.5]]))}
    pf.build(grp);const pg=P.build();if(pg){const m=new THREE.Mesh(pg,MATS.props);m.receiveShadow=true;grp.add(m)}
    const lights=[];for(const [x,z] of [[-9,8],[9,8],[-9,18],[9,18],[0,13]]){const l=new THREE.PointLight(0xfff4e0,0,30,1.4);l.position.set(ox+x,INT_Y+H-1,oz+z);l.userData.i=1.6;grp.add(l);lights.push(l)}
    INDOORS.push({name:'market',title:'Supermarket',sub:'',floor:'tile',exp:.62,lights,test:(x,z)=>x>ox+X0-1&&x<ox+X1+1&&z>oz+Z0-1&&z<oz+Z1+1,ceil:()=>INT_Y+H-1.2});
    grp.visible=false;return {grp,spawn:[ox,oz+3.2],spawnYaw:0,title:'Supermarket',sub:'bread, milk, juice — press E at the shelves',peds,onEnter(){PORTAL.peds=peds}}},
  pharmacy(){const grp=new THREE.Group();scene.add(grp);const ox=INT_X+200,oz=INT_Z;
    const mats={floor:new THREE.MeshStandardMaterial({color:0xe9ecea,roughness:.35}),ceil:new THREE.MeshStandardMaterial({color:0xf6f6f4,roughness:.9}),wall:new THREE.MeshStandardMaterial({color:0xeef3ef,roughness:.8})};
    room(grp,ox,oz,-5,5,0,8,3.2,mats,{gaps:[[0,5,1.6]]});const P=new PB(),pf=new ProdFill();const r=rng(55);
    P.box(ox,INT_Y+.55,oz+5.2,7.5,1.1,.7,0,sRGB('#ffffff'),1);P.box(ox,INT_Y+1.15,oz+5.0,7.3,.1,.3,0,sRGB('#bfe3cf'),2);wallSeg(ox-3.8,oz+5.2,ox+3.8,oz+5.2,.8,INT_Y-1,INT_Y+1.2);
    for(let x=-4.4;x<4.6;x+=1.1)for(let lvl=0;lvl<5;lvl++){P.box(ox+x,INT_Y+.3+lvl*.5,oz+7.6,1,.03,.5,0,sRGB('#dfe6e2'),1);for(let k=0;k<5;k++)pf.box(ox+x-.4+k*.2,INT_Y+.33+lvl*.5,oz+7.55,.15,.18,.1,0,[40,41,42,43,13,37][(r()*6)|0])}
    neonSign(grp,'АПТЕКА',ox,INT_Y+2.6,oz+7.85,Math.PI,3.2,'#1a9a4a');
    {const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d');x.fillStyle='#1a9a4a';x.fillRect(44,10,40,108);x.fillRect(10,44,108,40);const t=new THREE.CanvasTexture(cv);const m=new THREE.Mesh(new THREE.PlaneGeometry(.9,.9),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false}));m.position.set(ox+3.6,INT_Y+2.4,oz+7.85);m.rotation.y=Math.PI;grp.add(m)}
    const peds=[Object.assign(intPed(ox,oz+6.2,Math.PI),{cT:0xf4f4f4,skirt:true})];
    INTERACT.push({x:ox-1.4,z:oz+4.2,r:1.8,label:'Buy hematogen',fn:()=>addItem('hematogen',true)});
    INTERACT.push({x:ox+1.4,z:oz+4.2,r:1.8,label:'Buy vitamin C',fn:()=>addItem('vitamin C',true)});
    INTERACT.push({x:ox,z:oz+.8,r:1.6,label:'Go outside',fn:()=>PORTAL.exit()});
    pf.build(grp);const pg=P.build();if(pg)grp.add(new THREE.Mesh(pg,MATS.props));
    const l=new THREE.PointLight(0xffffff,0,16,1.4);l.position.set(ox,INT_Y+2.8,oz+4);l.userData.i=1.6;grp.add(l);
    INDOORS.push({name:'pharmacy',title:'Pharmacy',sub:'',floor:'tile',exp:.55,lights:[l],test:(x,z)=>x>ox-6&&x<ox+6&&z>oz-1&&z<oz+9,ceil:()=>INT_Y+2.6});
    grp.visible=false;return {grp,spawn:[ox,oz+2.6],spawnYaw:0,title:'Pharmacy',sub:'hematogen and vitamin C at the counter',peds,onEnter(){PORTAL.peds=peds}}},
  stair(){const grp=new THREE.Group();scene.add(grp);const ox=INT_X+400,oz=INT_Z;
    const mats={floor:new THREE.MeshStandardMaterial({color:0x9a8a78,roughness:.6}),ceil:new THREE.MeshStandardMaterial({color:0xe8e4da,roughness:.9}),wall:new THREE.MeshStandardMaterial({color:0x7fa38f,roughness:.85})};
    room(grp,ox,oz,-3,3,0,7,3,mats,{gaps:[[0,3,1.4]]});const P=new PB();
    // two-tone painted walls (Soviet style): light upper band
    for(const [x,z,w,d] of [[-2.88,3.5,.02,7],[2.88,3.5,.02,7],[0,6.88,6,.02]])P.box(ox+x,INT_Y+2.5,oz+z,w,1,d,0,sRGB('#efeee6'),9);
    // mailboxes, lift doors, stairs going up
    P.box(ox-2.75,INT_Y+1.4,oz+2,.3,1,2.4,0,sRGB('#3a5f8a'),1);for(let k=0;k<12;k++)P.box(ox-2.58,INT_Y+1.05+(k%3)*.32,oz+1.05+Math.floor(k/3)*.6,.02,.22,.5,0,sRGB('#2a4a6a'),1);
    P.box(ox+2.85,INT_Y+1.05,oz+5.2,.1,2.1,1.2,0,sRGB('#8a8f94'),6);P.box(ox+2.8,INT_Y+1.05,oz+5.2,.02,2.05,.02,0,sRGB('#222'),1);P.box(ox+2.75,INT_Y+1.2,oz+4.4,.05,.12,.08,0,sRGB('#ff4a2a'),3);
    for(let s=0;s<8;s++)P.box(ox-1.2,INT_Y+.08+s*.16,oz+3.4+s*.3,2.4,.16,.3,0,sRGB('#8f8478'),9);
    const sign=plateMesh(['ПОВЕРХ 1'],{w:256,h:96,size:54,color:'#fff',bg:'#2a4a6a'},.8,.3);sign.position.set(ox+2.84,INT_Y+2.2,oz+5.2);sign.rotation.y=-Math.PI/2;grp.add(sign);
    const lift=$('liftUI');if(!lift.dataset.ok){lift.dataset.ok=1;const B=$('liftBtns');for(let f=1;f<=10;f++){const b=document.createElement('button');b.textContent=f;b.onclick=()=>{lift.hidden=true;if(f===1){toast('You\'re already on floor 1','');return}if(window.AUD)AUD.beep();PORTAL.go('flat',{ent:PORTAL.opt.ent,floor:f})};B.appendChild(b)}$('liftClose').onclick=()=>{lift.hidden=true}}
    INTERACT.push({x:ox+2.1,z:oz+5.2,r:1.5,label:'Call the lift',fn:()=>{lift.hidden=false}});
    INTERACT.push({x:ox,z:oz+.8,r:1.4,label:'Go out to the yard',fn:()=>PORTAL.exit()});
    const pg=P.build();if(pg)grp.add(new THREE.Mesh(pg,MATS.props));
    const l=new THREE.PointLight(0xfff0d0,0,12,1.6);l.position.set(ox,INT_Y+2.7,oz+3.5);l.userData.i=1.1;grp.add(l);
    INDOORS.push({name:'stair',title:'Stairwell',sub:'',floor:'stone',exp:.7,lights:[l],test:(x,z)=>x>ox-4&&x<ox+4&&z>oz-1&&z<oz+8,ceil:()=>INT_Y+2.6});
    grp.visible=false;return {grp,spawn:[ox,oz+3.2],spawnYaw:0,title:'Stairwell',sub:'lift on the right',peds:[],onEnter(o){PORTAL.peds=[];sign.material.map.dispose();const cv=txtCanvas(['ПІД\'ЇЗД '+(o.ent||1)],{w:256,h:96,size:44,color:'#fff',bg:'#2a4a6a'});sign.material.map=new THREE.CanvasTexture(cv);sign.material.map.encoding=THREE.sRGBEncoding;sign.material.needsUpdate=true}}},
  flat(){const grp=new THREE.Group();scene.add(grp);const ox=INT_X+600,oz=INT_Z;
    const wallp=(()=>{const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d');x.fillStyle='#e9dfc8';x.fillRect(0,0,128,128);x.fillStyle='rgba(160,120,80,.18)';for(let i=0;i<8;i++)for(let j=0;j<8;j++){x.beginPath();x.arc(i*16+8+(j%2)*8,j*16+8,3,0,6.283);x.fill()}const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(6,2);t.encoding=THREE.sRGBEncoding;return t})();
    const mats={floor:new THREE.MeshStandardMaterial({map:TX.wood,roughness:.5}),ceil:new THREE.MeshStandardMaterial({color:0xf4f2ec,roughness:.9}),wall:new THREE.MeshStandardMaterial({map:wallp,roughness:.85})};
    room(grp,ox,oz,-6,6,0,9,2.75,mats,{gaps:[[0,6,1]]});const P=new PB();
    // inner walls: hallway / kitchen / living room / bedroom
    for(const [xa,za,xb,zb] of [[-6,3,-1.5,3],[1.5,3,6,3],[0,3,0,9]]){const L=Math.hypot(xb-xa,zb-za);const m=new THREE.Mesh(new THREE.BoxGeometry(L,2.75,.12),mats.wall);m.position.set(ox+(xa+xb)/2,INT_Y+1.375,oz+(za+zb)/2);m.rotation.y=-Math.atan2(zb-za,xb-xa);grp.add(m);wallSeg(ox+xa,oz+za,ox+xb,oz+zb,.2,INT_Y-1,INT_Y+3)}
    // living room (left): sofa, carpet on the wall, TV, wall unit
    P.box(ox-3,INT_Y+.4,oz+8.4,3,.8,.9,0,sRGB('#7a3b2a'),0);P.box(ox-3,INT_Y+.85,oz+8.8,3,.9,.2,0,sRGB('#6a3122'),0);
    const carpet=(()=>{const cv=document.createElement('canvas');cv.width=256;cv.height=160;const x=cv.getContext('2d');x.fillStyle='#8a1f22';x.fillRect(0,0,256,160);x.strokeStyle='#e8c070';x.lineWidth=6;x.strokeRect(10,10,236,140);for(let i=0;i<30;i++){x.fillStyle=['#1d3b6b','#e8c070','#2f6a3a'][i%3];x.beginPath();x.arc(128+Math.cos(i)*60,80+Math.sin(i*1.3)*40,8,0,6.283);x.fill()}const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t})();
    {const m=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.6),new THREE.MeshStandardMaterial({map:carpet,roughness:.95}));m.position.set(ox-3,INT_Y+1.75,oz+8.93);m.rotation.y=Math.PI;grp.add(m)}
    P.box(ox-5.6,INT_Y+1.1,oz+6,.6,2.2,3,0,sRGB('#6b4a2e'),5);P.box(ox-3,INT_Y+.3,oz+4.2,1.2,.6,.5,0,sRGB('#4a3020'),5);P.box(ox-3,INT_Y+.95,oz+4.2,1.1,.65,.08,0,sRGB('#111'),2);
    // bedroom (right) + kitchen (front right) + hallway
    P.box(ox+3.5,INT_Y+.3,oz+7.4,2,.6,2.8,0,sRGB('#e6e1d6'),0);P.box(ox+5.6,INT_Y+1.1,oz+4.5,.7,2.2,2,0,sRGB('#7a5a3a'),5);
    P.box(ox+5.6,INT_Y+.45,oz+1.4,.65,.9,2.4,0,sRGB('#efefef'),1);P.box(ox+5.6,INT_Y+.95,oz+.6,.6,1.9,.65,0,sRGB('#f4f4f4'),1);P.box(ox+3.4,INT_Y+.38,oz+1.6,1.2,.76,.8,0,sRGB('#c8a06a'),5);
    INTERACT.push({x:ox+5,z:oz+.9,r:1.4,label:'Open the fridge',fn:()=>toast('Fridge','kefir, sausages, a pot of borscht')});
    INTERACT.push({x:ox-3,z:oz+7.5,r:1.6,label:'Sit on the sofa',fn:()=>{player.sit={x:ox-3,z:oz+8.2,y:INT_Y+.1,yaw:Math.PI};cam.yaw=Math.PI}});
    INTERACT.push({x:ox,z:oz+.7,r:1.2,label:'Go to the stairwell',fn:()=>PORTAL.go('stair',{ent:PORTAL.opt.ent})});
    // windows with the real view of the yard (rendered from the building when you come home)
    const winTex=new THREE.WebGLRenderTarget(512,256,{stencilBuffer:true});const view=[];
    for(const [x,z,ry] of [[-3,8.98,Math.PI],[3.5,8.98,Math.PI]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.3),new THREE.MeshBasicMaterial({map:winTex.texture,toneMapped:false}));m.position.set(ox+x,INT_Y+1.55,oz+z+0*.01);m.rotation.y=ry;grp.add(m);view.push(m);
      P.box(ox+x,INT_Y+1.55,oz+z-.02,1.95,1.45,.03,0,sRGB('#f4f4f4'),1)}
    const pg=P.build();if(pg)grp.add(new THREE.Mesh(pg,MATS.props));
    const l=new THREE.PointLight(0xffe8c8,0,14,1.4);l.position.set(ox,INT_Y+2.5,oz+5);l.userData.i=1.4;grp.add(l);
    INDOORS.push({name:'flat',title:'Flat',sub:'',floor:'wood',exp:.62,lights:[l],test:(x,z)=>x>ox-7&&x<ox+7&&z>oz-1&&z<oz+10,ceil:()=>INT_Y+2.4});
    grp.visible=false;return {grp,spawn:[ox,oz+2.3],spawnYaw:0,title:'Flat',sub:'home sweet home',peds:[],onEnter(o){PORTAL.peds=[];
      // snapshot of the yard from the flat's window (city is still loaded at this moment)
      const e=HOME_ENT[(o.ent||1)-1]||HOME_ENT[0];if(e){const fl=o.floor||7;const cm=new THREE.PerspectiveCamera(60,2,.3,3000);const yy=HOME_Y0+4.2+(fl-1)*2.9+1.5;
        cm.position.set(e.x+e.tx*4+e.nx*.5,yy,e.z+e.tz*4+e.nz*.5);cm.lookAt(e.x+e.tx*4+e.nx*20,yy-5,e.z+e.tz*4+e.nz*20);
        const vis=[];for(const n in PORTAL.built)vis.push([PORTAL.built[n].grp,PORTAL.built[n].grp.visible]);vis.forEach(v=>v[0].visible=false);PORTAL.setCity(true);
        renderer.setRenderTarget(winTex);renderer.render(scene,cm);renderer.setRenderTarget(null);vis.forEach(v=>v[0].visible=v[1])}}}}};
