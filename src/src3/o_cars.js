// ===================== cars (instanced, merged per type) =====================
const CAR_T=[];      // per type {mesh, wheels, L, W, wz, wx, wr}
const CAR_VS_DECL='attribute vec3 aCol;attribute float aM;varying vec3 vCol;varying float vM;varying vec3 vIC;';
const CAR_VS_MAIN='vCol=aCol;vM=aM;\n#ifdef USE_INSTANCING_COLOR\nvIC=instanceColor;\n#else\nvIC=vec3(1.);\n#endif';
const CAR_SURF=`
 if(vM<.5){sAlb=vIC;sRough=.28;sMetal=.55;}
 else if(vM<1.5){sAlb=vec3(.01);sRough=.04;sMetal=.1;}
 else if(vM<2.5){sAlb=vCol;sEmis=vCol*(.3+uNight*5.);sRough=.2;}
 else if(vM<3.5){sAlb=vCol;sEmis=vCol*(.2+uNight*2.5);sRough=.3;}
 else if(vM<4.5){sAlb=vec3(.012);sRough=.9;}
 else if(vM<5.5){sAlb=vec3(.55,.56,.58);sRough=.25;sMetal=.9;}
 else if(vM<6.5){sAlb=vec3(.02);sRough=.6;}
 else if(vM<7.5){sAlb=vCol;sRough=.5;}
 else {sAlb=vCol;sEmis=vCol*.6;sRough=.4;}
 if(uWinter>.5&&vM<.5&&vNw.y>.7)sAlb=mix(sAlb,vec3(.9,.92,.95),.85);
`;
let CAR_MAT=null;
function carShape(pts){const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);s.closePath();return s}
// ---- lofted car body: cross-sections along the length (rounded shoulders, tumblehome, tapered nose/tail) ----
function carTopAt(top,z){if(z<=top[0][0])return top[0][1];for(let i=0;i<top.length-1;i++){if(z<=top[i+1][0]){const t=(z-top[i][0])/(top[i+1][0]-top[i][0]||1);return top[i][1]+(top[i+1][1]-top[i][1])*t}}return top[top.length-1][1]}
function carSection(def,z){
  const half=def.W/2,y0=def.y0,hb=def.hb,yt=carTopAt(def.top,z);
  const e=Math.min(z-def.rear,def.front-z),rd=def.round||.8;const wf=e>=.6?1:(rd+(1-rd)*Math.sqrt(Math.max(0,e/.6)));
  const g=Math.max(0,Math.min(1,(yt-hb)/.12)),tum=def.tum||.8,h=half*wf,yb=Math.min(yt,hb);
  const wg=t=>half*(1-(1-tum)*t)*wf;
  const deck=[[h*.9,y0],[h,y0+.1],[h,y0+(yt-y0)*.55],[h,yt-.1],[h-.05,yt-.04],[h-.15,yt-.008],[h*.6,yt],[0,yt]];
  const gh=[[h*.9,y0],[h,y0+.1],[h,yb-.12],[h-.025,yb+.01],[wg(.5),yb+(yt-yb)*.5],[wg(1)+.02,yt-.1*(yt-yb)-.02],[wg(1)-.1,yt],[0,yt]];
  const R=deck.map((p,k)=>[p[0]+(gh[k][0]-p[0])*g,p[1]+(gh[k][1]-p[1])*g,z]);
  const ring=R.map(p=>[p[0],p[1],p[2]]);for(let k=6;k>=0;k--)ring.push([-R[k][0],R[k][1],z]);
  return {ring,R,yt,g,wg,yb};
}
function buildCarType(def){
  const g=new GB({position:3,normal:3,aCol:3,aM:1});
  const W=def.W;def.y0=def.y0||.28;def.hb=def.hb||def.glass[0][1];
  const V=(p,n,col,m)=>g.v({position:p,normal:n,aCol:col,aM:m});
  // slice list
  const zs=[def.rear];for(const t of def.top){if(t[0]>def.rear+.05&&t[0]<def.front-.05)zs.push(t[0])}zs.push(def.front);
  const zz=[];for(let i=0;i<zs.length-1;i++){const n=Math.max(1,Math.round((zs[i+1]-zs[i])/.4));for(let k=0;k<n;k++)zz.push(zs[i]+(zs[i+1]-zs[i])*k/n)}zz.push(def.front);
  const S=zz.map(z=>carSection(def,z));const NR=15,NS=S.length;
  // smooth normals from the ring/length tangents
  const base=g.n;
  for(let i=0;i<NS;i++)for(let k=0;k<NR;k++){
    const p=S[i].ring[k],pk0=S[i].ring[Math.max(0,k-1)],pk1=S[i].ring[Math.min(NR-1,k+1)];
    const pn=S[Math.min(NS-1,i+1)].ring[k],pp=S[Math.max(0,i-1)].ring[k];
    const t1=[pk1[0]-pk0[0],pk1[1]-pk0[1],pk1[2]-pk0[2]],t2=[pn[0]-pp[0],pn[1]-pp[1],pn[2]-pp[2]];
    let n=[t1[1]*t2[2]-t1[2]*t2[1],t1[2]*t2[0]-t1[0]*t2[2],t1[0]*t2[1]-t1[1]*t2[0]];const l=Math.hypot(...n)||1;n=n.map(v=>v/l);
    const cy=(def.y0+S[i].yt)/2;if(n[0]*p[0]+n[1]*(p[1]-cy)<0)n=n.map(v=>-v);
    V(p,n,[1,1,1],0)}
  for(let i=0;i<NS-1;i++)for(let k=0;k<NR-1;k++){const a=base+i*NR+k,b=a+1,c=base+(i+1)*NR+k,d=c+1;
    // winding: make faces face outward (checked on the first quad)
    g.tri(a,c,b);g.tri(b,c,d)}
  // end caps
  for(const [i,sg] of [[0,-1],[NS-1,1]]){const c0=g.n;for(let k=0;k<NR;k++)V(S[i].ring[k],[0,0,sg],[1,1,1],0);for(let k=1;k<NR-1;k++){if(sg>0)g.tri(c0,c0+k,c0+k+1);else g.tri(c0,c0+k+1,c0+k)}}
  const geoSides=g.n;
  // glass: side windows (split by pillars), windshield, rear window
  const gl=def.glass;const zA=gl[0][0]+.1,zB=gl[gl.length-1][0]-.1;const pil=(def.pillars||[(zA+zB)/2]).slice().sort((a,b)=>a-b);
  const addQuad=(P4,n,m,col)=>{const b0=g.n;for(const p of P4)V(p,n,col||[0,0,0],m);g.tri(b0,b0+1,b0+2);g.tri(b0,b0+2,b0+3);g.tri(b0,b0+2,b0+1);g.tri(b0,b0+3,b0+2)};
  const segs=[];{let a=zA;for(const p of pil){segs.push([a,p-.05]);a=p+.05}segs.push([a,zB])}
  for(const [za,zb] of segs){if(zb-za<.12)continue;const n=Math.max(1,Math.round((zb-za)/.15));
    for(const sd of [-1,1])for(let i=0;i<n;i++){const z0=za+(zb-za)*i/n,z1=za+(zb-za)*(i+1)/n;const pts=[];
      for(const z of [z0,z1]){const s=carSection(def,z);const R=s.R;const lo=[R[3][0]+(R[4][0]-R[3][0])*.14,R[3][1]+(R[4][1]-R[3][1])*.14];const up=[R[5][0]+(R[6][0]-R[5][0])*.25,R[5][1]+(R[6][1]-R[5][1])*.25-.012];
        if(s.yt-s.yb<.12)continue;pts.push([lo,z],[up,z])}
      if(pts.length<4)continue;const q=[pts[0],pts[1],pts[3],pts[2]].map(([p,z])=>[sd*(p[0]+.012),p[1],z]);addQuad(q,[sd,0,0],1)}}
  const slab=(zs0,zs1,ytop)=>{const n=Math.max(2,Math.round(Math.abs(zs1-zs0)/.12));for(let i=0;i<n;i++){const z0=zs0+(zs1-zs0)*i/n,z1=zs0+(zs1-zs0)*(i+1)/n;const a=carSection(def,z0),b=carSection(def,z1);
      const w0=a.R[6][0]-.04,w1=b.R[6][0]-.04;addQuad([[-w0,a.yt+.012,z0],[w0,a.yt+.012,z0],[w1,b.yt+.012,z1],[-w1,b.yt+.012,z1]],[0,1,0],1)}};
  slab(gl[gl.length-2][0],gl[gl.length-1][0],0);                           // windshield
  if(Math.abs(gl[1][0]-gl[0][0])>.1)slab(gl[0][0],gl[1][0],0);            // sloped rear glass
  else{const s=carSection(def,def.rear);addQuad([[-W*.36,gl[0][1]+.02,def.rear-.012],[W*.36,gl[0][1]+.02,def.rear-.012],[W*.36,gl[1][1]-.04,def.rear-.012],[-W*.36,gl[1][1]-.04,def.rear-.012]],[0,0,-1],1)}  // upright rear window
  // lights / bumpers / plates / grille / wheel arches / door seams
  const box=(cx,cy,cz,sx,sy,sz,m,col)=>{const b=new THREE.BoxGeometry(sx,sy,sz);b.translate(cx,cy,cz);const G2=b.toNonIndexed();const p=G2.attributes.position,n=G2.attributes.normal;
    for(let i=0;i<p.count;i+=3){const ids=[];for(let j=0;j<3;j++)ids.push(V([p.getX(i+j),p.getY(i+j),p.getZ(i+j)],[n.getX(i+j),n.getY(i+j),n.getZ(i+j)],col,m));g.tri(...ids)}};
  const fz=def.front,rz=def.rear;
  for(const s of [-1,1]){box(s*W*.33,def.hl,fz-.02,.34,.13,.06,2,[1,.95,.82]);box(s*W*.36,def.tl,rz+.02,.3,.12,.05,3,[.75,.04,.03])}
  box(0,.42,fz+.02,W*.92,.18,.08,6,[0,0,0]);box(0,.42,rz-.02,W*.92,.18,.08,6,[0,0,0]);
  box(0,.58,fz+.035,.52,.12,.02,7,[.93,.93,.9]);box(0,.62,rz-.035,.52,.12,.02,7,[.93,.93,.9]);
  box(0,def.hl-.02,fz-.015,W*.42,.14,.05,6,[.03,.03,.03]);                       // grille
  box(0,def.y0+.06,0,W*.84,.1,(fz-rz)*.94,6,[0,0,0]);                              // underbody
  if(def.sign)box(0,def.sign[1],def.sign[0],.9,.3,.04,8,[.95,.85,.3]);
  if(def.mirror)for(const s of [-1,1])box(s*(W/2+.08),def.hb+.04,def.mirror,.16,.12,.08,0,[1,1,1]);
  for(const z of (def.doors||[def.wz[0]-.55,def.wz[1]+.55])){for(const s of [-1,1]){box(s*(W/2+.004),(def.y0+def.hb)/2+.05,z,.012,def.hb-def.y0-.2,.014,6,[0,0,0]);box(s*(W/2+.012),def.hb-.14,z+.32,.018,.025,.12,5,[.7,.7,.72])}}
  for(const wz of def.wz)for(const s of [-1,1]){const cyl=new THREE.CylinderGeometry(def.wr*1.2,def.wr*1.2,.03,16);cyl.rotateZ(Math.PI/2);cyl.translate(s*(W/2+.002),def.wr,wz);
    const G2=cyl.toNonIndexed();const p=G2.attributes.position,n=G2.attributes.normal;for(let i=0;i<p.count;i+=3){const ids=[];for(let j=0;j<3;j++)ids.push(V([p.getX(i+j),p.getY(i+j),p.getZ(i+j)],[n.getX(i+j),n.getY(i+j),n.getZ(i+j)],[0,0,0],6));g.tri(...ids)}}
  // make sure the lofted shell faces outward: compare a normal with the triangle winding
  {const A=g.a;const i0=g.idx[0],i1=g.idx[1],i2=g.idx[2];const P=i=>[A.position[i*3],A.position[i*3+1],A.position[i*3+2]],N=i=>[A.normal[i*3],A.normal[i*3+1],A.normal[i*3+2]];
   const p0=P(i0),p1=P(i1),p2=P(i2),e1=[p1[0]-p0[0],p1[1]-p0[1],p1[2]-p0[2]],e2=[p2[0]-p0[0],p2[1]-p0[1],p2[2]-p0[2]];const fn=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];const nn=N(i0);
   if(fn[0]*nn[0]+fn[1]*nn[1]+fn[2]*nn[2]<0){for(let i=0;i<geoSides;i++){}const idx=g.idx;for(let t=0;t<idx.length;t+=3){if(idx[t]<geoSides&&idx[t+1]<geoSides){const tmp=idx[t+1];idx[t+1]=idx[t+2];idx[t+2]=tmp}}}}
  const geo=g.build();
  // wheel: tyre + rim
  const wg=new GB({position:3,normal:3,aCol:3,aM:1});
  const tyre=new THREE.CylinderGeometry(def.wr,def.wr,.22,14);tyre.rotateZ(Math.PI/2);
  const rim=new THREE.CylinderGeometry(def.wr*.62,def.wr*.62,.232,10);rim.rotateZ(Math.PI/2);
  for(const [ge,m] of [[tyre,4],[rim,5]]){const G=ge.toNonIndexed();const p=G.attributes.position,n=G.attributes.normal;for(let i=0;i<p.count;i+=3){const ids=[];for(let j=0;j<3;j++)ids.push(wg.v({position:[p.getX(i+j),p.getY(i+j),p.getZ(i+j)],normal:[n.getX(i+j),n.getY(i+j),n.getZ(i+j)],aCol:[0,0,0],aM:m}));wg.tri(...ids)}}
  return {geo,wgeo:wg.build(),W,L:def.L,wz:def.wz,wx:W/2-.08,wr:def.wr};
}
// side silhouettes (z forward, y up). top = roof/hood line, glass = window outline, round = plan rounding of nose/tail, tum = roof width / body width
const CAR_DEFS=[
  {L:4.4,W:1.74,wr:.31,wz:[1.32,-1.36],front:2.2,rear:-2.2,hl:.72,tl:.8,mirror:.95,tum:.78,pillars:[-.1],
   top:[[-2.2,.82],[-2.1,.95],[-1.25,.99],[-.72,1.42],[.42,1.44],[1.02,1.0],[2.02,.86],[2.2,.62]],
   glass:[[-1.18,1.0],[-.7,1.37],[.4,1.39],[.95,1.02]]},
  {L:3.95,W:1.7,wr:.3,wz:[1.18,-1.22],front:1.98,rear:-1.97,hl:.74,tl:.95,mirror:.8,tum:.8,pillars:[-.35],
   top:[[-1.97,.9],[-1.9,1.0],[-1.75,1.4],[.3,1.47],[.92,1.0],[1.85,.86],[1.98,.6]],
   glass:[[-1.85,1.02],[-1.65,1.38],[.28,1.42],[.85,1.02]]},
  {L:4.6,W:1.9,wr:.37,wz:[1.42,-1.42],front:2.3,rear:-2.3,hl:.88,tl:1.05,mirror:.95,tum:.84,pillars:[-.3,.6],round:.86,
   top:[[-2.3,1.0],[-2.2,1.5],[-2.1,1.72],[.55,1.76],[1.2,1.15],[2.2,1.02],[2.3,.7]],
   glass:[[-2.12,1.17],[-1.95,1.66],[.5,1.7],[1.12,1.17]]},
  {L:5.8,W:2.0,wr:.36,wz:[1.95,-1.75],front:2.9,rear:-2.9,hl:.8,tl:.95,mirror:2.2,sign:[2.25,1.95],tum:.95,round:.92,pillars:[-1.3,.1,1.0],
   top:[[-2.9,2.5],[-2.88,2.55],[1.7,2.6],[2.35,1.5],[2.85,1.15],[2.92,.5]],
   glass:[[-2.6,1.45],[-2.6,2.25],[1.55,2.3],[2.25,1.48]]},
  // 4: your car — a low sporty hatch
  {L:4.25,W:1.82,wr:.34,wz:[1.36,-1.34],front:2.12,rear:-2.12,hl:.68,tl:.86,mirror:.88,tum:.76,pillars:[-.05],
   top:[[-2.12,.8],[-2.0,1.04],[-1.35,1.12],[-.5,1.38],[.32,1.4],[.98,1.0],[1.95,.8],[2.12,.58]],
   glass:[[-1.3,1.12],[-.48,1.34],[.3,1.36],[.92,1.02]]},
  // 5: Tavria (ZAZ-1102): short, tall-roofed hatch with a steep tail
  {L:3.7,W:1.56,wr:.27,wz:[1.15,-1.12],front:1.85,rear:-1.85,hl:.62,tl:.78,mirror:.62,tum:.84,y0:.26,pillars:[-.32],doors:[.62,-.95],
   top:[[-1.85,.84],[-1.7,.9],[-.85,1.38],[.35,1.37],[.95,.9],[1.65,.78],[1.85,.62]],
   glass:[[-1.7,.9],[-.85,1.34],[.35,1.33],[.92,.92]]},
  // 6: Lada "Zhiguli" sedan (VAZ-2107): boxy three-box
  {L:4.15,W:1.62,wr:.3,wz:[1.3,-1.3],front:2.07,rear:-2.07,hl:.7,tl:.86,mirror:.7,tum:.82,pillars:[-.2],y0:.3,
   top:[[-2.07,.92],[-1.95,.98],[-1.2,.99],[-.7,1.36],[.3,1.37],[.78,.98],[1.9,.92],[2.07,.74]],
   glass:[[-1.2,.99],[-.7,1.33],[.3,1.34],[.78,.99]]},
  // 7: Daewoo-Lanos-style compact sedan
  {L:4.25,W:1.7,wr:.31,wz:[1.32,-1.34],front:2.12,rear:-2.12,hl:.72,tl:.88,mirror:.9,tum:.76,pillars:[-.1],
   top:[[-2.12,.86],[-2.0,.98],[-1.3,1.0],[-.8,1.4],[.25,1.42],[.95,1.0],[1.85,.88],[2.12,.66]],
   glass:[[-1.28,1.0],[-.78,1.36],[.23,1.38],[.9,1.02]]},
  // 8: city bus
  {L:10.6,W:2.5,wr:.5,wz:[3.4,-3.7],front:5.3,rear:-5.3,hl:.85,tl:.9,mirror:4.7,tum:.97,round:.94,pillars:[-3.6,-1.2,1.2,3.6],y0:.42,
   top:[[-5.3,3.0],[-5.28,3.06],[4.9,3.06],[5.25,2.4],[5.3,.9]],
   glass:[[-5.0,1.35],[-5.0,2.78],[4.9,2.78],[5.2,1.5]]},
];
function pickCarType(r){const v=r();return v<.17?0:v<.31?1:v<.42?2:v<.58?5:v<.72?6:v<.88?7:1}
let PARKED_DIRTY=true;
const PARKED_STATIC=[];
function initCarMeshes(scene,N){
  CAR_MAT=patchMat(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.4,metalness:.3}),{key:'car',vDecl:CAR_VS_DECL,vMain:CAR_VS_MAIN,fDecl:'varying vec3 vCol;varying float vM;varying vec3 vIC;',fSurf:CAR_SURF,noLamps:false});
  CAR_MAT.envMapIntensity=1.2;
  CAR_DEFS.forEach((d,i)=>{const t=buildCarType(d);
    const cap=i===4?2:N+(i===3?40:160);
    t.mesh=new THREE.InstancedMesh(t.geo,CAR_MAT,cap);t.wheels=new THREE.InstancedMesh(t.wgeo,CAR_MAT,cap*4);
    for(const m of [t.mesh,t.wheels]){m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.setColorAt(0,new THREE.Color(1,1,1));m.count=0;scene.add(m)}
    t.cap=cap;CAR_T.push(t)});
}
const _cm=new THREE.Matrix4(),_cm2=new THREE.Matrix4(),_cq=new THREE.Quaternion(),_ce=new THREE.Euler(),_cv=new THREE.Vector3(),_cs=new THREE.Vector3(1,1,1),_cc=new THREE.Color();
function writeCar(t,k,c){
  _ce.set(c.pitch||0,c.yaw,0,'YXZ');_cq.setFromEuler(_ce);_cv.set(c.x,c.y,c.z);_cm.compose(_cv,_cq,_cs);t.mesh.setMatrixAt(k,_cm);
  _cc.setHex(c.col);_cc.convertSRGBToLinear();t.mesh.setColorAt(k,_cc);
  let q=0;for(const sx of [-1,1])for(const wz of t.wz){_ce.set(c.roll||0,0,0);_cq.setFromEuler(_ce);_cv.set(sx*t.wx,t.wr,wz);_cm2.compose(_cv,_cq,_cs);_cm2.premultiply(_cm);t.wheels.setMatrixAt(k*4+q,_cm2);q++}
}
function placeCars(list){
  const cnt=new Array(CAR_T.length).fill(0);
  const all=PARKED_CACHE.concat(list);
  for(const c of all){const t=CAR_T[c.type];if(cnt[c.type]>=t.cap)continue;writeCar(t,cnt[c.type],c);cnt[c.type]++}
  CAR_T.forEach((t,i)=>{t.mesh.count=cnt[i];t.wheels.count=cnt[i]*4;t.mesh.instanceMatrix.needsUpdate=true;t.wheels.instanceMatrix.needsUpdate=true;if(t.mesh.instanceColor)t.mesh.instanceColor.needsUpdate=true});
}
let PARKED_CACHE=[];
function refreshParked(chunksMap,px,pz){
  const out=[];for(const c of chunksMap.values()){if(!c.parked)continue;for(const p of c.parked)if(Math.abs(p.x-px)<260&&Math.abs(p.z-pz)<260)out.push(p)}
  for(const p of PARKED_STATIC)if(Math.abs(p.x-px)<300&&Math.abs(p.z-pz)<300)out.push(p);
  PARKED_CACHE=out;
}
// ===================== traffic =====================
const CARS=[],PEDS=[],TALKERS=[];
const CAR_COLS=[0xf4f4f2,0x1c1c1e,0x8c9198,0xb8bcc2,0x9b1b1e,0x1f3f73,0x2e5a3c,0xc7b28d,0x5a2d1c,0xdcdcd4,0x3c6e8f,0xe0a526];
const TOPS=[0xe9e4d8,0x2a2a2e,0x9b2d30,0x2f5d8a,0x3f7a4a,0xd9a441,0x7a4b8c,0xe07a5f,0x5c6b73,0xf2f2f2,0x1f6f8b,0xc94f6d,0x6b4f3a];
const COATS=[0x2b2b30,0x3a3530,0x4a2f2a,0x1f2a3a,0x5a5550,0x2f3a2c];
const PANTS=[0x2a3240,0x1d1d20,0x45403a,0x6b5f4e,0x31455c,0x8a8f96];
const SKIN=[0xe2b59b,0xd6a586,0xc58c6a,0xf0c8ae,0x9a6a4c];
const HAIR=[0x2a1d14,0x5a3a22,0x111111,0xb8925a,0x8a8a8a,0x6b2b1a];
function laneOff(c){return c===0?2.5:(c===1?1.75:1.15)}
function segInfo(ri,dir){const P=D.nodes,wn=D.wn;const a=dir>0?wn[ri]:wn[ri+1],b=dir>0?wn[ri+1]:wn[ri];
  const ax=P[a*2],az=P[a*2+1],bx=P[b*2],bz=P[b*2+1];const L=Math.hypot(bx-ax,bz-az)||.01;return {ax,az,bx,bz,L,tx:(bx-ax)/L,tz:(bz-az)/L,end:b}}
function nextSeg(ri,dir,forCar){
  const info=segInfo(ri,dir);const node=info.end;const opts=[];
  for(let q=D.adjS[node];q<D.adjS[node+1];q++){const r=D.adj[q],k2=D.wOf[r],c2=D.wcls[k2],f2=D.wfl[k2];
    if(forCar&&(c2>2||f2===1))continue;if(f2===2)continue;
    const s0=D.wstart[k2],s1=D.wstart[k2+1]-1;
    const P=D.nodes,nw=n=>NO_WALK.length&&insideOBB(NO_WALK,P[n*2],P[n*2+1],.5);
    if(r<s1&&!(r===ri&&dir===-1)&&!nw(D.wn[r+1]))opts.push([r,1]);if(r>s0&&!(r-1===ri&&dir===1)&&!nw(D.wn[r-1]))opts.push([r-1,-1])}
  if(!opts.length)return [ri,-dir];
  let tot=0;const w=opts.map(([nr,nd])=>{const s=segInfo(nr,nd);const dot=s.tx*info.tx+s.tz*info.tz;const c=D.wcls[D.wOf[nr]];let v=Math.pow(Math.max(.05,dot+1.05),2);if(forCar)v*=c===0?2:(c===1?1.3:.5);tot+=v;return v});
  let r=Math.random()*tot;for(let i=0;i<opts.length;i++){r-=w[i];if(r<=0)return opts[i]}return opts[0];
}
function randomSegNear(px,pz,rMin,rMax,forCar){
  for(let t=0;t<40;t++){const a=Math.random()*6.283,d=rMin+Math.random()*(rMax-rMin);const x=px+Math.cos(a)*d,z=pz+Math.sin(a)*d;
    const ci=Math.floor((x-BB[0])/CH),cj=Math.floor((z-BB[2])/CH);if(ci<0||cj<0||ci>=NCX||cj>=NCZ)continue;
    const id=cj*NCX+ci;const s0=D.segStart[id],s1=D.segStart[id+1];if(s1<=s0)continue;
    const ri=D.seg[s0+Math.floor(Math.random()*(s1-s0))];const k=D.wOf[ri],c=D.wcls[k],f=D.wfl[k];
    if(f===2)continue;if(forCar&&(c>1||f===1))continue;if(!forCar&&c===0&&Math.random()<.3)continue;
    const P=D.nodes;const n=D.wn[ri];if(EXCL_ROAD&&EXCL_ROAD(P[n*2],P[n*2+1],P[n*2],P[n*2+1]))continue;if(NO_WALK.length&&(insideOBB(NO_WALK,P[n*2],P[n*2+1],.5)||insideOBB(NO_WALK,P[D.wn[ri+1]*2],P[D.wn[ri+1]*2+1],.5)))continue;
    return ri}
  return -1;
}
function spawnCar(px,pz,near){
  const ri=randomSegNear(px,pz,near?60:150,near?260:330,true);if(ri<0)return null;
  const dir=Math.random()<.5?1:-1;const s=segInfo(ri,dir);
  const rr=Math.random();const type=rr<.04?8:rr<.16?3:pickCarType(Math.random);
  let col=CAR_COLS[Math.floor(Math.random()*CAR_COLS.length)];if(type===3)col=Math.random()<.6?0xf2c94c:0xf1f1ee;if(type===8)col=[0x2a5aa0,0xe0a526,0xc22a2a,0xf1f1ee,0x2e7d4f][Math.floor(Math.random()*5)];
  const c=D.wcls[D.wOf[ri]];
  return {ri,dir,s:Math.random()*s.L,v:0,vmax:(c===0?13:10)*(.8+Math.random()*.35),type,col,x:s.ax,y:0,z:s.az,yaw:Math.atan2(s.tx,s.tz),roll:0,pitch:0};
}
function updateCars(dt,player,maxN){
  while(CARS.length<maxN){const c=spawnCar(player.x,player.z,CARS.length<maxN/2&&!updateCars.init);if(!c)break;CARS.push(c)}
  updateCars.init=true;
  for(let i=CARS.length-1;i>=0;i--){const c=CARS[i];
    if(Math.hypot(c.x-player.x,c.z-player.z)>400){CARS.splice(i,1);continue}
    let s=segInfo(c.ri,c.dir);let tgt=c.vmax;if(s.L<14)tgt=Math.min(tgt,6.5);
    const fx=Math.sin(c.yaw),fz=Math.cos(c.yaw);
    const chk=(ox,oz,r)=>{const rx=ox-c.x,rz=oz-c.z;const ahead=rx*fx+rz*fz,lat=Math.abs(rx*fz-rz*fx);if(ahead>0&&ahead<r&&lat<2.0)tgt=Math.min(tgt,Math.max(0,(ahead-5.5)*1.2))};
    chk(player.x,player.z,15);for(const o of CARS){if(o!==c)chk(o.x,o.z,13)}
    c.v+=(tgt-c.v)*Math.min(1,dt*(tgt<c.v?3.5:1.2));c.s+=c.v*dt;
    let guard=0;while(c.s>s.L&&guard++<8){c.s-=s.L;[c.ri,c.dir]=nextSeg(c.ri,c.dir,true);s=segInfo(c.ri,c.dir)}
    const cl=D.wcls[D.wOf[c.ri]];const off=laneOff(cl);const nx=-s.tz,nz=s.tx;
    const x=s.ax+s.tx*c.s+nx*off,z=s.az+s.tz*c.s+nz*off;
    c.x=x;c.z=z;const y=groundH(x,z);const yf=groundH(x+s.tx*2,z+s.tz*2);c.y=y+.08;c.pitch=-Math.atan2(yf-y,2)*.8;
    const ty=Math.atan2(s.tx,s.tz);let dy=ty-c.yaw;while(dy>Math.PI)dy-=6.283;while(dy<-Math.PI)dy+=6.283;c.yaw+=dy*Math.min(1,dt*6);c.roll+=c.v*dt/.33;
  }
}
// ===================== pedestrians / talkers / audience =====================
const R_=a=>a[Math.floor(Math.random()*a.length)];
function randPerson(){const w=S.season==='winter';const fem=Math.random()<.5;const old=Math.random()<.15;
  return {cT:w?R_(COATS):R_(TOPS),cP:R_(PANTS),cS:R_(SKIN),cH:old&&fem?R_([0x7a2b2b,0x3b4a7a,0x5a4a3a]):R_(HAIR),cF:Math.random()<.5?0xf2f2ee:0x2a2a2a,sc:.9+Math.random()*.15,skirt:fem&&Math.random()<.55,longH:fem&&Math.random()<.75,scarf:(old&&fem)||w&&Math.random()<.3}}
function spawnPed(px,pz,near){
  const ri=randomSegNear(px,pz,near?15:70,near?140:190,false);if(ri<0)return null;
  const dir=Math.random()<.5?1:-1;const s=segInfo(ri,dir);
  return Object.assign(randPerson(),{ri,dir,s:Math.random()*s.L,side:Math.random()<.5?1:-1,jit:Math.random(),speed:1.05+Math.random()*.5,phase:Math.random()*6,x:s.ax,y:0,z:s.az,yaw:0,moving:true,wait:0,pose:'walk'});
}
function pedOffset(ri,side,jit){const k=D.wOf[ri],c=D.wcls[k],f=D.wfl[k];
  if(f===1)return side*(HW[c]+SW[c]-1.5)*jit;if(c<=1)return side*(HW[c]+SW[c]*(.35+.4*jit));if(c===2)return side*(HW[c]+.55);return side*.45*jit}
let talkT=0;
function updatePeds(dt,player,maxN){
  while(PEDS.length<maxN){const p=spawnPed(player.x,player.z,!updatePeds.init);if(!p)break;PEDS.push(p)}
  updatePeds.init=true;
  for(let i=PEDS.length-1;i>=0;i--){const p=PEDS[i];
    if(Math.hypot(p.x-player.x,p.z-player.z)>240){PEDS.splice(i,1);continue}
    let s=segInfo(p.ri,p.dir);const dpx=player.x-p.x,dpz=player.z-p.z,dp=Math.hypot(dpx,dpz);
    let spd=p.speed;if(p.wait>0){p.wait-=dt;spd=0}else if(Math.random()<dt*.01)p.wait=2+Math.random()*4;if(dp<1.1)spd=0;
    p.moving=spd>0;p.s+=spd*dt;p.phase+=spd*dt*3.3;
    let guard=0;while(p.s>s.L&&guard++<8){p.s-=s.L;const [nr,nd]=nextSeg(p.ri,p.dir,false);p.ri=nr;p.dir=nd;s=segInfo(p.ri,p.dir)}
    const off=pedOffset(p.ri,p.side,p.jit);const nx=-s.tz,nz=s.tx;
    const x=s.ax+s.tx*p.s+nx*off,z=s.az+s.tz*p.s+nz*off;
    p.x+=(x-p.x)*Math.min(1,dt*4);p.z+=(z-p.z)*Math.min(1,dt*4);
    const sp=specialGround(p.x,p.z,p.y);p.y=(sp?sp.h:groundH(p.x,p.z))+(D.wcls[D.wOf[p.ri]]<=1?.17:.07);
    const ty=p.moving?Math.atan2(s.tx,s.tz):(dp<4?Math.atan2(dpx,dpz):p.yaw);let dy=ty-p.yaw;while(dy>Math.PI)dy-=6.283;while(dy<-Math.PI)dy+=6.283;p.yaw+=dy*Math.min(1,dt*5);
  }
  // talker groups near player (standing, chatting)
  talkT-=dt;
  if(talkT<=0){talkT=1.5;
    for(let i=TALKERS.length-1;i>=0;i--)if(Math.hypot(TALKERS[i].x-player.x,TALKERS[i].z-player.z)>160)TALKERS.splice(i,1);
    let groups=new Set(TALKERS.map(t=>t.g)).size;
    let tries=0;while(groups<(S.q==='low'?2:4)&&tries++<10){const ri=randomSegNear(player.x,player.z,20,110,false);if(ri<0)continue;const s=segInfo(ri,1);
      const off=pedOffset(ri,Math.random()<.5?1:-1,.7);const cx=s.ax+s.tx*s.L*.5-s.tz*off,cz=s.az+s.tz*s.L*.5+s.tx*off;
      if(insideAny(cx,cz,1.2))continue;const n=2+(Math.random()<.4?1:0);const g=Math.random();
      for(let k=0;k<n;k++){const a=k/n*6.283+Math.random()*.4;const x=cx+Math.cos(a)*.8,z=cz+Math.sin(a)*.8;
        TALKERS.push(Object.assign(randPerson(),{g,x,z,y:groundAt(x,z,99)+.0,yaw:Math.atan2(cx-x,cz-z),phase:Math.random()*6,pose:'talk',hand:k%2,moving:false,line:R_(PHRASES),lt:Math.random()*4}))}
      groups++}
  }
  // bubbles for nearest groups
  BUBBLES.hideAll();let bi=0;
  const near=TALKERS.filter(t=>Math.hypot(t.x-player.x,t.z-player.z)<16).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z));
  const shownG=new Set();
  for(const t of near){if(shownG.has(t.g)||bi>=4)continue;t.lt-=dt*3;if(t.lt<=0){t.lt=4+Math.random()*3;t.line=R_(PHRASES);t.speak=(t.speak||0)+1}
    if((t.speak||0)%2===(t.hand||0)){BUBBLES.show(bi++,t.x,t.y+2.25,t.z,t.line);shownG.add(t.g)}}
  if(window.AUD)AUD.chatter(near.length?Math.hypot(near[0].x-player.x,near[0].z-player.z):99);
}
function crowdList(){
  const L=PEDS.concat(TALKERS);
  if(CASHIER)L.push(Object.assign(CASHIER_P||(CASHIER_P=Object.assign(randPerson(),{skirt:true,scarf:false,cT:0x1f7a4a})),{x:CASHIER.x,z:CASHIER.z,y:CASHIER.y,yaw:CASHIER.yaw,pose:'stand',moving:false,phase:0}));
  if(curIndoor&&curIndoor.name==='opera'&&OPERA){if(!OPERA.aud){OPERA.aud=[];for(let i=0;i<46;i++){const s=OPERA.seats[Math.floor(Math.random()*OPERA.seats.length)];const p=OPERA.F.P(s[0],s[1]);
    OPERA.aud.push(Object.assign(randPerson(),{x:p[0],z:p[1],y:OPERA.y0+1.25,yaw:Math.atan2(OPERA.F.ca,OPERA.F.sa),pose:'sit',moving:false,phase:Math.random()*6}))}}
    for(const a of OPERA.aud)L.push(a)}
  return L;
}
let CASHIER_P=null;
