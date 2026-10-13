// ===================== landmarks v2 =====================
const LMK=HDR.LM;
const STATIC_OBB=[];   // cx,cz,hw,hd,ca,sa (full height colliders)
const STATIC_CIR=[];   // x,z,r
const STATIC_WALLS=[]; // {cx,cz,hw,hd,ca,sa,y0,y1}
const PLACES=[];
const SPECIAL=[];      // (x,z,y)->{h,wall,surf}|null
const ANIM=[];const NO_WALK=[];   // obb list: NPC/traffic routes may not enter
const LOW_OBB=[];   // low obstacles (parked cars): block walking, not the camera above them
         // per-frame callbacks
let HOME_MARK=null,HOME_C=null,LIGHT_GLOW=null;
function addOBB(cx,cz,w,d,a){STATIC_OBB.push(cx,cz,w/2,d/2,Math.cos(a),Math.sin(a))}
function addBlock(cx,cz,w,d,a){STATIC_BLOCK.push(cx,cz,w/2,d/2,Math.cos(a),Math.sin(a))}
function addWall(cx,cz,w,d,a,y0,y1){STATIC_WALLS.push({cx,cz,hw:w/2,hd:d/2,ca:Math.cos(a),sa:Math.sin(a),y0,y1})}
// wall segment between two points (thickness t)
function wallSeg(x0,z0,x1,z1,t,y0,y1){const L=Math.hypot(x1-x0,z1-z0);addWall((x0+x1)/2,(z0+z1)/2,L,t,Math.atan2(z1-z0,x1-x0),y0,y1)}
function specialGround(x,z,y){let best=null;for(const f of SPECIAL){const r=f(x,z,y===undefined?99:y);if(r&&(!best||r.pri>best.pri))best=r}return best}
function LAND_UPDATE(dt){for(const f of ANIM)f(dt)}
function frame(cx,cz,a){const ca=Math.cos(a),sa=Math.sin(a);return {P:(u,v)=>[cx+u*ca-v*sa,cz+u*sa+v*ca],ca,sa,inv:(x,z)=>{const dx=x-cx,dz=z-cz;return [dx*ca+dz*sa,-dx*sa+dz*ca]}}}
function txtCanvas(lines,opt){
  opt=opt||{};const W=opt.w||512,H=opt.h||128;const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  if(opt.bg){x.fillStyle=opt.bg;if(opt.round){const r=opt.round;x.beginPath();x.moveTo(r,0);x.arcTo(W,0,W,H,r);x.arcTo(W,H,0,H,r);x.arcTo(0,H,0,0,r);x.arcTo(0,0,W,0,r);x.fill()}else x.fillRect(0,0,W,H)}
  if(opt.border){x.strokeStyle=opt.border;x.lineWidth=opt.bw||6;x.strokeRect(x.lineWidth/2,x.lineWidth/2,W-x.lineWidth,H-x.lineWidth)}
  x.fillStyle=opt.color||'#fff';x.textAlign='center';x.textBaseline='middle';const n=lines.length;
  lines.forEach((l,i)=>{const sz=(opt.sizes&&opt.sizes[i])||opt.size||56;let fs=sz;const fam=(opt.font||'"Golos Text",Arial,sans-serif'),wt=(opt.weight||'700');x.font=wt+' '+fs+'px '+fam;const mw=W*.94;let tw=x.measureText(l).width;if(tw>mw){fs=Math.floor(fs*mw/tw);x.font=wt+' '+fs+'px '+fam}x.fillText(l,W/2,H*(i+1)/(n+1)+(opt.dy||0))});
  return cv;
}
function labelSprite(lines,opt){const cv=txtCanvas(lines,opt);const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;
  const m=new THREE.SpriteMaterial({map:tex,depthTest:opt&&opt.depthTest===false?false:true,transparent:true,fog:false,toneMapped:false});
  const s=new THREE.Sprite(m);const k=(opt&&opt.scale)||1;s.scale.set(k*cv.width/cv.height,k,1);return s}
function plateMesh(lines,opt,w,h,emis){const cv=txtCanvas(lines,opt);const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=4;
  const mat=new THREE.MeshStandardMaterial({map:tex,roughness:.5});if(emis){mat.emissive=new THREE.Color(1,1,1);mat.emissiveMap=tex;mat.emissiveIntensity=emis}
  return new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat)}
function geo2xz(lat,lon){return [(lon-HDR.LON0)*HDR.KX,-(lat-HDR.LAT0)*HDR.KZ]}
let _glow=null;
function glowTex(){if(_glow)return _glow;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,240,200,.6)');g.addColorStop(1,'rgba(255,220,150,0)');x.fillStyle=g;x.fillRect(0,0,64,64);_glow=new THREE.CanvasTexture(c);return _glow}
// ground-material quad (paving etc.)
function groundQuad(G,ps,kind,y,rot){
  const at=()=>({aK:[kind,rot||0],aR:[0,0,0,0],aU:0});
  if(y!==undefined||ps.length!==4){quadN(G,ps.map(p=>[p[0],y!==undefined?y:groundH(p[0],p[1])+.06,p[1]]),[0,1,0],at);return}
  // follow the terrain: split long quads into ~3.5 m cells with a per-vertex lift that grows on slopes (no z-fight shimmer)
  const L1=Math.hypot(ps[1][0]-ps[0][0],ps[1][1]-ps[0][1]),L2=Math.hypot(ps[3][0]-ps[0][0],ps[3][1]-ps[0][1]);
  const nu=Math.max(1,Math.min(40,Math.ceil(L1/3.5))),nv=Math.max(1,Math.min(40,Math.ceil(L2/3.5)));
  const P=(a,b)=>{const t=a/nu,u=b/nv;const x0=ps[0][0]+(ps[1][0]-ps[0][0])*t,z0=ps[0][1]+(ps[1][1]-ps[0][1])*t,x1=ps[3][0]+(ps[2][0]-ps[3][0])*t,z1=ps[3][1]+(ps[2][1]-ps[3][1])*t;
    const x=x0+(x1-x0)*u,z=z0+(z1-z0)*u;const h=groundH(x,z),e=2.2;const sl=Math.hypot(groundH(x+e,z)-groundH(x-e,z),groundH(x,z+e)-groundH(x,z-e))/(2*e);return [x,h+.06+Math.min(.16,sl*.3),z]};
  for(let a=0;a<nu;a++)for(let b=0;b<nv;b++)quadN(G,[P(a,b),P(a+1,b),P(a+1,b+1),P(a,b+1)],[0,1,0],at)}

let CASHIER=null;
const EXTRA_TREES=[];const HOME_BENCHES=[];let HOME_ENT=[];

// ======================= Duke de Richelieu (bronze, toga, right arm pointing to the sea, scroll in the left hand) =======================
function makeDuke(x,y,z,ry){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;
  const M=new THREE.MeshStandardMaterial({color:new THREE.Color('#4a6c5a').convertSRGBToLinear(),roughness:.6,metalness:.35});
  const M2=new THREE.MeshStandardMaterial({color:new THREE.Color('#3a584a').convertSRGBToLinear(),roughness:.62,metalness:.32});
  const add=(geo,m,px,py,pz,rx,rY,rz)=>{const o=new THREE.Mesh(geo,m||M);o.position.set(px||0,py||0,pz||0);o.rotation.set(rx||0,rY||0,rz||0);o.castShadow=true;g.add(o);return o};
  const limb=(a,b,r0,r1,m)=>{const A=new THREE.Vector3(...a),Bv=new THREE.Vector3(...b),d=Bv.clone().sub(A);const geo=new THREE.CylinderGeometry(r1,r0,d.length(),12);const o=new THREE.Mesh(geo,m||M);
    o.position.copy(A).add(Bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());o.castShadow=true;g.add(o);return o};
  // long toga: lathe body with vertical folds, slightly flattened front-to-back
  const prof=[[0,0],[.56,0],[.6,.08],[.55,.5],[.49,1.1],[.43,1.6],[.42,1.95],[.44,2.2],[.40,2.4],[.24,2.52],[0,2.55]].map(p=>new THREE.Vector2(p[0],p[1]));
  const body=new THREE.LatheGeometry(prof,40);const P=body.attributes.position;
  for(let i=0;i<P.count;i++){const px=P.getX(i),py=P.getY(i),pz=P.getZ(i);const an=Math.atan2(pz,px);const fold=1+.07*Math.sin(an*9+py*1.3)*(1-Math.min(1,py/2.3))+.03*Math.sin(an*17);P.setXYZ(i,px*fold*1.05,py,pz*fold*.78)}
  body.computeVertexNormals();add(body);
  // toga swag over the left shoulder, diagonally across the chest
  {const s=new THREE.TorusGeometry(.52,.11,10,24,Math.PI*1.1);const o=add(s,M2,.02,1.85,.06,0,0,.0);o.rotation.set(1.25,.0,-.85);o.scale.set(1,1,.8)}
  // shoulders & chest
  add(new THREE.SphereGeometry(.47,20,14),M,0,2.32,0).scale.set(1.1,.55,.68);
  limb([0,2.45,0],[0,2.66,.02],.12,.11);
  // head with laurel wreath
  const head=add(new THREE.SphereGeometry(.19,20,16),M,0,2.86,.03);head.scale.set(.92,1.12,1);
  add(new THREE.SphereGeometry(.05,8,6),M,0,2.84,.21);                    // nose
  {const w=add(new THREE.TorusGeometry(.19,.035,6,20),M2,0,2.95,.0,Math.PI/2-.15,0,0);w.scale.set(.95,1.05,1)}
  add(new THREE.SphereGeometry(.2,14,10,0,Math.PI*2,0,Math.PI*.55),M2,0,2.93,-.01).scale.set(.95,.7,1); // hair
  // right arm raised forward, pointing toward the sea, with the toga sleeve hanging under it
  limb([-.42,2.38,0],[-.66,2.36,.48],.1,.085);limb([-.66,2.36,.48],[-.84,2.45,.98],.085,.07);
  add(new THREE.SphereGeometry(.075,10,8),M,-.88,2.47,1.08);limb([-.88,2.47,1.08],[-.93,2.49,1.24],.03,.022);   // hand + pointing finger
  {const d=new THREE.ConeGeometry(.22,.75,10,1,true);add(d,M2,-.62,2.02,.5,.25,0,.1).scale.set(1,1,.35)}
  // left arm down along the body, holding a scroll
  limb([.44,2.35,0],[.55,1.85,.06],.1,.085);limb([.55,1.85,.06],[.5,1.45,.24],.085,.07);
  add(new THREE.SphereGeometry(.075,10,8),M,.5,1.4,.28);
  limb([.5,1.4,.05],[.5,1.4,.55],.06,.06,M2);
  // feet in sandals peeking under the hem
  add(new THREE.BoxGeometry(.16,.09,.3),M,-.17,.05,.42);add(new THREE.BoxGeometry(.16,.09,.3),M,.17,.05,.38);
  add(new THREE.CylinderGeometry(.7,.75,.12,24),M2,0,-.04,0);   // bronze plinth
  return g;
}
// ======================= other landmarks =======================
function buildLighthouse(grp,P){
  const o=LMK.lighthouse;const dx=o.x-o.bx,dz=o.y-o.by,L=Math.hypot(dx,dz),tx=dx/L,tz=dz/L;const top=SL+2.2;
  const ry=Math.atan2(tx,tz);P.box((o.x+o.bx)/2+tx*6,top-3,(o.y+o.by)/2+tz*6,9,6,L+24,ry,sRGB('#77746c'),9);
  const r=rng(9);for(let i=0;i<40;i++){const u=i/39*(L+10);for(const sd of [-1,1]){P.box(o.bx+tx*u+(-tz)*sd*5.6,top-.9,o.by+tz*u+tx*sd*5.6,2.2,1.6,2.2,r()*3,sRGB('#8a867c'),9,r())}}
  SPECIAL.push((x,z)=>{const rx=x-o.bx,rz=z-o.by;const u=rx*tx+rz*tz,v=rx*(-tz)+rz*tx;if(u<-6||u>L+18||Math.abs(v)>4.5)return null;return {h:top,wall:Math.abs(v)>4.1,pri:1,surf:'stone'}});
  P.cyl(o.x,top,o.y,4,4.4,1.2,20,sRGB('#8e8a80'),9);P.cyl(o.x,top+1.2,o.y,2.4,1.8,24,20,sRGB('#f1efe8'),0);P.cyl(o.x,top+25.2,o.y,2.7,2.7,.4,20,sRGB('#b42a22'),1);
  P.cyl(o.x,top+25.6,o.y,1.4,1.4,2.4,16,sRGB('#fff2c0'),3);P.cyl(o.x,top+28,o.y,1.8,.1,2,16,sRGB('#b42a22'),1);
  STATIC_CIR.push(o.x,o.y,2.6);
  const gm=new THREE.SpriteMaterial({map:glowTex(),color:0xfff0c0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false});
  LIGHT_GLOW=new THREE.Sprite(gm);LIGHT_GLOW.position.set(o.x,top+26.8,o.y);LIGHT_GLOW.scale.set(14,14,1);grp.add(LIGHT_GLOW);
  ANIM.push(()=>{const n=UNI.uNight.value;LIGHT_GLOW.visible=n>.2;const ph=(UNI.uTime.value%4)/4;LIGHT_GLOW.material.opacity=ph<.15?1:.25;LIGHT_GLOW.scale.setScalar(ph<.15?24:12)});
  PLACES.push({id:'lighthouse',name:'Vorontsov Lighthouse',sub:'breakwater in the port',x:o.x-tx*22,z:o.y-tz*22,yaw:Math.atan2(tx,tz)});
}
function beachUmbrellas(P,cx,cz,R){
  const cols=['#e94f37','#f2c14e','#2a9d8f','#ffffff','#3d5a80'].map(sRGB);let n=0;const rr=rng(Math.floor(cx*7+cz));
  for(let t=0;t<500&&n<30;t++){const x=cx+(rr()*2-1)*R,z=cz+(rr()*2-1)*R;const h=groundH(x,z);const sd=sdAt(x,z);if(sd<8||sd>40||h>-26.6)continue;
    P.cyl(x,h,z,.04,.04,2.4,5,sRGB('#dddddd'),1);P.cyl(x,h+2.1,z,1.5,.05,.6,8,cols[n%5],0);P.box(x+1.2,h+.2,z+.3,.7,.25,1.9,rr()*.6,sRGB('#f4f1ea'),0);n++}
}
let GRX=null;
function buildAllLandmarks(scene){
  // flat pads under places that must be level (the real relief blends into them)
  addFlat(HOME.cx,HOME.cz,72,40);
  {const o=LMK.opera;addFlatRect(o.x,o.y,o.a,o.w+60,o.d+40,30)}
  {const o=LMK.station;const a=Math.atan2(12,104);addFlatRect(721+52*Math.cos(a)-15*Math.sin(a),-8851+52*Math.sin(a)+15*Math.cos(a),a,150,110,40)}
  const grp=new THREE.Group();scene.add(grp);LANDMARK_GRP=grp;
  const G=new GB({position:3,normal:3,aUV:2,aP:4,aQ:1,aT:3}),P=new PB(),Sg=new GB({position:3,normal:3,uv:2});GRX=new GB({position:3,normal:3,aK:2,aR:4,aU:1});
  const steps=[['home',()=>buildHome(grp,G,P,Sg,GRX)],['stairs',()=>buildStairs(grp,P,GRX)],['station',()=>buildStation(grp,G,P,Sg,GRX)],['lighthouse',()=>buildLighthouse(grp,P)],
    ['opera',()=>buildOpera(grp,G,P,Sg,GRX)],['port',()=>buildPort(grp,G,P,Sg,GRX)],['parks',()=>buildParks(grp,G,P,Sg,GRX)],['b411',()=>build411(grp,G,P,Sg,GRX)],['lanz',()=>buildLanzheron(grp,G,P,Sg,GRX)],['azs',()=>buildNeighbourhood(grp,G,P,Sg,GRX)]];
  for(const [nm,f] of steps){try{f()}catch(e){console.error('landmark '+nm+' failed',e)}}
  {const z=LMK.lanzheron;PLACES.push({id:'lanzheron',name:'Lanzheron',sub:'beach',x:z.x-12,z:z.y,yaw:Math.PI/2});beachUmbrellas(P,z.x,z.y,60);
   const a=LMK.arcadia;PLACES.push({id:'arcadia',name:'Arkadia',sub:'beach',x:a.x-30,z:a.y,yaw:Math.PI/2});beachUmbrellas(P,a.x,a.y,90);
   const p=LMK.shevpark;PLACES.push({id:'shevpark',name:'Shevchenko Park',sub:'seaside alleys',x:p.x,z:p.y,yaw:Math.PI/2});}
  if(G.n){const m=new THREE.Mesh(G.build(),MATS.bld);m.castShadow=m.receiveShadow=true;grp.add(m)}
  const pg=P.build();if(pg){const m=new THREE.Mesh(pg,MATS.props);m.castShadow=m.receiveShadow=true;grp.add(m)}
  if(Sg.n)grp.add(new THREE.Mesh(Sg.build(),MATS.signs));
  if(GRX.n){const m=new THREE.Mesh(GRX.build(),MATS.ground);m.receiveShadow=true;grp.add(m)}
  TREES.add('static',EXTRA_TREES.map(([x,z,t,sc])=>[x,z,t===0?0:t===1?1:t===2?2:3,sc]));
  bakeStatic(grp,0);
  return grp;
}
let LANDMARK_GRP=null;
