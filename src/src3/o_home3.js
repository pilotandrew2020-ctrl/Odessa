// ===================== HOME: ЖК «Молодіжний», вул. Євгена Чикаленка 59к (real OSM footprints) =====================
const HOME={cx:36,cz:6,a:0};let HOME_Y0=0;
const STATIC_POLYS=[];
function lmPoly(arr){let a=arr.slice();if(a.length>1&&Math.hypot(a[0][0]-a[a.length-1][0],a[0][1]-a[a.length-1][1])<.01)a.pop();const f=new Float32Array(a.length*2);a.forEach((p,i)=>{f[i*2]=p[0];f[i*2+1]=p[1]});return f}
function polyCentroid(a){const n=a.length>>1;let x=0,z=0;for(let i=0;i<n;i++){x+=a[i*2];z+=a[i*2+1]}return [x/n,z/n]}
function offsetPoly(a,d){ // convex-ish: positive d = inward
  const n=a.length>>1,[cx,cz]=polyCentroid(a);const L=[];
  for(let i=0;i<n;i++){const j=(i+1)%n;const dx=a[j*2]-a[i*2],dz=a[j*2+1]-a[i*2+1],l=Math.hypot(dx,dz)||1;let nx=dz/l,nz=-dx/l;
    if(nx*((a[i*2]+a[j*2])/2-cx)+nz*((a[i*2+1]+a[j*2+1])/2-cz)>0){nx=-nx;nz=-nz}L.push([a[i*2]+nx*d,a[i*2+1]+nz*d,dx/l,dz/l])}
  const out=new Float32Array(n*2);
  for(let i=0;i<n;i++){const A=L[(i-1+n)%n],B=L[i];const den=A[2]*B[3]-A[3]*B[2];
    if(Math.abs(den)<1e-4){out[i*2]=B[0];out[i*2+1]=B[1];continue}const t=((B[0]-A[0])*B[3]-(B[1]-A[1])*B[2])/den;out[i*2]=A[0]+A[2]*t;out[i*2+1]=A[1]+A[3]*t}
  return out}
function groundPoly(G,a,kind,y,rot){const n=a.length>>1;const c=[];for(let i=0;i<n;i++)c.push(new THREE.Vector2(a[i*2],a[i*2+1]));let tr=[];try{tr=THREE.ShapeUtils.triangulateShape(c,[])}catch(e){}
  const b=G.n;for(const p of c)G.v({position:[p.x,y,p.y],normal:[0,1,0],aK:[kind,rot||0],aR:[0,0,0,0],aU:0});for(const t of tr){G.tri(b+t[0],b+t[2],b+t[1]);G.tri(b+t[0],b+t[1],b+t[2])}}
function buildHome(grp,G,P,Sg,GR){
  HOME_C={x:HOME.cx,z:HOME.cz};const y0=HOME_Y0=groundH(HOME.cx,HOME.cz);
  const loop=new Float32Array([4,11,11,-18,61,-6,68,-4,61,25,32,18]);       // the yard driveway loop (OSM)
  const yardC=[36,6];
  EXCL_ROAD=(ax,az,bx,bz)=>{const mx=(ax+bx)/2,mz=(az+bz)/2;return mx>-6&&mx<80&&mz>-30&&mz<44&&!(mx<4&&mz>35)};
  addBlock(36,8,104,92,0);
  // the two residential buildings (10 floors)
  const ents=[];
  for(const key of ['U','L']){const ring=lmPoly(LMK.homepolys[key]);
    const res=addPolyBuilding(G,[ring],10,HOME_ST,key==='U'?141:97,1,P,Sg,{y0,yard:yardC,props:true});
    STATIC_POLYS.push(makeColPoly([ring],res.top,res.y0));
    for(const W of res.walls){if(W.kind!==WK_YARD||W.L<14||W.ri>0)continue;const span=W.L/Math.max(1,Math.floor(W.L/18));for(let u=span/2;u<W.L-1;u+=span)ents.push({x:W.x1+W.tx*u,z:W.z1+W.tz*u,tx:W.tx,tz:W.tz,nx:W.nx,nz:W.nz})}}
  // yard paving: asphalt everywhere, raised island in the middle
  groundPoly(GR,offsetPoly(loop,-9),4,y0+.08);
  const island=offsetPoly(loop,3.3);const IH=.45;
  groundPoly(GR,island,8,y0+IH,.4);
  {const n=island.length>>1;for(let i=0;i<n;i++){const j=(i+1)%n;const ax=island[i*2],az=island[i*2+1],bx=island[j*2],bz=island[j*2+1];const L=Math.hypot(bx-ax,bz-az);const ry=Math.atan2(bx-ax,bz-az);
    P.box((ax+bx)/2,y0+IH/2+.04,(az+bz)/2,.3,IH+.04,L+.3,ry,sRGB('#a9a59c'),7)}}
  SPECIAL.push((x,z)=>{if(Math.abs(x-36)>60||Math.abs(z-6)>50)return null;if(pip(island,x,z))return {h:y0+IH,pri:1,surf:'tile'};if(pip(offsetPoly(loop,-9),x,z))return {h:y0+.08,pri:0,surf:'asphalt'};return null});
  // island frame: long axis
  const [ix,iz]=polyCentroid(island);const ob=polyOBB(island);const ca=ob.ca,sa=ob.sa;const at=(u,v)=>[ob.cx+u*ca-v*sa,ob.cz+u*sa+v*ca];const ry=-Math.atan2(sa,ca);
  const hw=ob.w/2,hd=ob.d/2;const yi=y0+IH;
  // steps up onto the island (3 places)
  for(const [u,v,dir] of [[0,-hd,-1],[0,hd,1],[-hw,0,0]]){const p=at(u,v);const ang=dir===0?Math.atan2(-ca,-sa):Math.atan2(-sa*dir,ca*dir)+0;
    for(let s=0;s<3;s++){const o=(s+.5)*.32;const q=dir===0?at(u-o,v):at(u,v+dir*o);P.box(q[0],y0+IH-(s+1)*.15+.075,q[1],dir===0?.32:2.4,.15,dir===0?2.4:.32,ry,sRGB('#b9b4aa'),7)}}
  // playground (west half): rubber, wooden towers, blue spiral slide, swings, sandbox
  {const pu=-hw*.45,pv=0;const pw=Math.min(18,hw*.85),pd=Math.min(13,hd*1.6);const q=(u,v)=>at(pu+u,pv+v);
   groundQuad(GR,[q(-pw/2,-pd/2),q(pw/2,-pd/2),q(pw/2,pd/2),q(-pw/2,pd/2)],9,yi+.03);
   const wood=sRGB('#7a4f2e'),yel=sRGB('#f2c21b'),blu=sRGB('#2a62b8'),red=sRGB('#d8432c');
   const tower=(tu,tv,h,roof)=>{for(const [du,dv] of [[-.65,-.65],[.65,-.65],[.65,.65],[-.65,.65]]){const p=q(tu+du,tv+dv);P.box(p[0],yi+(h+1.7)/2,p[1],.12,h+1.7,.12,0,yel,1)}
     const c=q(tu,tv);P.box(c[0],yi+h,c[1],1.45,.08,1.45,ry,wood,5);P.cyl(c[0],yi+h+1.7,c[1],1.05,.02,.95,4,roof,1,0,0,Math.PI/4+ry);
     for(const [du,dv,lu,lv] of [[0,-.68,1.3,.05],[.68,0,.05,1.3]]){const p=q(tu+du,tv+dv);P.box(p[0],yi+h+.45,p[1],lu,.6,lv,ry,blu,1)}};
   tower(-2.4,0,1.3,blu);tower(1.8,0,1.6,yel);
   {const a=q(-.3,0);P.box(a[0],yi+1.45,a[1],2.6,.06,.9,ry,wood,5)}
   {const a=q(-2.4,-2.1);P.box(a[0],yi+.7,a[1],.62,.05,2.7,ry,blu,1,-.45)}
   {const cu=4.2,cv=1.2,pole=q(cu,cv);P.cyl(pole[0],yi,pole[1],.07,.07,2.8,6,blu,1);for(let i=0;i<36;i++){const t=i/36,a=t*Math.PI*3.4,h=2.4-t*2.1;const p=q(cu+Math.cos(a)*.6,cv+Math.sin(a)*.6);P.box(p[0],yi+h,p[1],.55,.05,.3,-ry-a+Math.PI/2,blu,1,-.32);if(i%2===0){const r2=q(cu+Math.cos(a)*.9,cv+Math.sin(a)*.9);P.box(r2[0],yi+h+.2,r2[1],.04,.3,.04,0,blu,1)}}}
   {for(const s of [-1,1]){const a=q(-6.2,s*1.6);P.box(a[0],yi+1.2,a[1],.08,2.4,.08,ry,red,1,.25);P.box(a[0],yi+1.2,a[1],.08,2.4,.08,ry,red,1,-.25)}const m=q(-6.2,0);P.box(m[0],yi+2.35,m[1],.08,.08,3.4,ry,red,1);for(const s of [-.6,.6]){const a=q(-6.2,s);P.box(a[0],yi+.55,a[1],.3,.06,.5,ry,sRGB('#222'),4);P.box(a[0],yi+1.45,a[1],.02,1.8,.02,0,sRGB('#888'),1)}}
   {const a=q(1.5,4.2);P.box(a[0],yi+.15,a[1],2.4,.3,2.4,ry,wood,5);P.box(a[0],yi+.2,a[1],2.1,.2,2.1,ry,sRGB('#d6c08e'),4)}
   for(const [u,v,r] of [[-2.4,0,1.1],[1.8,0,1.1],[4.2,1.2,.9],[1.5,4.2,1.3],[-6.2,0,.6]]){const p=q(u,v);STATIC_CIR.push(p[0],p[1],r)}
   // low fence round the playground
   const fc=sRGB('#2e6a3a');const corners=[q(-pw/2,-pd/2),q(pw/2,-pd/2),q(pw/2,pd/2),q(-pw/2,pd/2)];
   for(let i=0;i<4;i++){const A=corners[i],B=corners[(i+1)%4];const L=Math.hypot(B[0]-A[0],B[1]-A[1]);const n=Math.round(L/1.2);for(let k=0;k<=n;k++){const t=k/n;if(i===1&&Math.abs(t-.5)<.12)continue;P.box(A[0]+(B[0]-A[0])*t,yi+.45,A[1]+(B[1]-A[1])*t,.05,.9,.05,0,fc,1)}
     P.box((A[0]+B[0])/2,yi+.85,(A[1]+B[1])/2,.04,.05,L,Math.atan2(B[0]-A[0],B[1]-A[1]),fc,1)}}
  // basketball court (east half)
  {const cu=hw*.5,cw=Math.min(15,hw*.8),cd=Math.min(11,hd*1.5);const q=(u,v)=>at(cu+u,v);groundQuad(GR,[q(-cw/2,-cd/2),q(cw/2,-cd/2),q(cw/2,cd/2),q(-cw/2,cd/2)],10,yi+.03);
   for(const s of [-1,1]){const p=q(s*(cw/2-.4),0);P.cyl(p[0],yi,p[1],.08,.08,3.1,6,sRGB('#2a62b8'),1);const b=q(s*(cw/2-.8),0);P.box(b[0],yi+3.25,b[1],.06,1.05,1.8,ry,sRGB('#f2f2f0'),1);
     const rim=q(s*(cw/2-1.15),0);P.cyl(rim[0],yi+3.0,rim[1],.24,.24,.03,10,sRGB('#d8432c'),1)}}
  // benches, globe lamps, young trees, fitness bars along the island
  for(let k=-2;k<=2;k++){for(const s of [-1,1]){const p=at(k*hw*.36,s*(hd-1.1));if(Math.abs(k*hw*.36)<1.6)continue;const b=propBench2(P,p[0],yi,p[1],ry+(s>0?Math.PI:0),HOME_BENCHES);LOW_OBB.push(p[0],p[1],.95,.32,ca,sa)}}
  for(const [u,v] of [[-hw+1.2,-hd+1.2],[-hw+1.2,hd-1.2],[hw-1.2,-hd+1.2],[hw-1.2,hd-1.2],[0,-hd+1],[0,hd-1]]){const p=at(u,v);propGlobeLamp(P,p[0],yi,p[1],ry);for(const s of [-.38,.38]){const q2=at(u+s,v);EXTRA_LAMPS.push([q2[0],yi+3.75,q2[1],2.4])}STATIC_CIR.push(p[0],p[1],.14)}
  for(const [u,v] of [[-hw+3,-hd+2.4],[hw-3,hd-2.4],[-hw+3,hd-2.4],[hw-3,-hd+2.4],[-1.5,0],[1.5,0]]){const p=at(u,v);EXTRA_TREES.push([p[0],p[1],3,.9])}
  // parked cars round the island (nose to the curb) and along the walls
  const r=rng(5959);const isl=island,n=isl.length>>1;
  for(let i=0;i<n;i++){const j=(i+1)%n;const ax=isl[i*2],az=isl[i*2+1],bx=isl[j*2],bz=isl[j*2+1];const L=Math.hypot(bx-ax,bz-az);if(L<6)continue;const tx=(bx-ax)/L,tz=(bz-az)/L;let nx=tz,nz=-tx;
    if(nx*((ax+bx)/2-ix)+nz*((az+bz)/2-iz)<0){nx=-nx;nz=-nz}
    for(let u=3;u<L-3;u+=2.7){if(r()<.28)continue;const x=ax+tx*u+nx*2.6,z=az+tz*u+nz*2.6;let skip=false;for(const [su,sv] of [[0,-hd],[0,hd],[-hw,0]]){const s=at(su,sv);if(Math.hypot(s[0]-x,s[1]-z)<3.5)skip=true}if(skip)continue;
      PARKED_STATIC.push({x,y:y0+.1,z,yaw:Math.atan2(nx,nz)+(r()<.5?0:Math.PI),type:r()<.15?2:(r()<.5?1:0),col:CAR_COLS[Math.floor(r()*CAR_COLS.length)],pitch:0,roll:0});LOW_OBB.push(x,z,1.0,2.3,tx,tz)}}
  // entrances: platform, steps, ramp + railings, canopy, light, intercom, number plate
  HOME_ENT=ents;const grey=sRGB('#9a9792'),rail=sRGB('#8a8e92');
  ents.forEach((e,idx)=>{const ry2=Math.atan2(e.nx,e.nz);const W2=(dt,dn)=>[e.x+e.tx*dt+e.nx*dn,e.z+e.tz*dt+e.nz*dn];
    let p=W2(0,.9);P.box(p[0],y0+.3,p[1],2.8,.45,1.8,ry2,grey,9);p=W2(0,1.95);P.box(p[0],y0+.2,p[1],1.8,.3,.3,ry2,grey,9);p=W2(0,2.25);P.box(p[0],y0+.12,p[1],1.8,.15,.3,ry2,grey,9);
    const rs=idx%2?1:-1;for(let i=0;i<=5;i++){const tt=1.4+i;const hh=.45*(6.4-tt)/5;p=W2(rs*tt,1.4);P.box(p[0],y0+hh+.5,p[1],.05,.9,.05,0,rail,1)}
    for(let i=0;i<5;i++){const t0=1.4+i;const h0=.45*(6.4-t0-.5)/5;p=W2(rs*(t0+.5),.75);P.box(p[0],y0+.08+h0/2,p[1],1,h0+.04,1.3,ry2,grey,9)}
    p=W2(0,.75);P.box(p[0],y0+2.95,p[1],2.6,.12,1.5,ry2,sRGB('#a9a8a2'),9);p=W2(0,.06);P.box(p[0],y0+2.82,p[1],.3,.1,.1,ry2,sRGB('#fff2cc'),3);{const q2=W2(0,.5);EXTRA_LAMPS.push([q2[0],y0+2.75,q2[1],1.6])}
    p=W2(.95,.05);P.box(p[0],y0+1.65,p[1],.18,.28,.06,ry2,sRGB('#2b2d30'),1);
    {const pl=W2(1.0,.04);const m=plateMesh([String(idx+1)],{w:128,h:128,sizes:[80],color:'#fff',bg:'#1b4f8c',weight:'700'},.32,.32);m.position.set(pl[0],y0+2.25,pl[1]);m.rotation.y=ry2;grp.add(m)}
    LOW_OBB.push(...W2(0,.9),1.4,.9,e.tx,e.tz);
    {const d=W2(0,.9);const rp=W2(0,3.2);INTERACT.push({x:d[0],z:d[1],y:y0+.5,r:1.7,label:'Enter entrance '+(idx+1),cond:()=>!PORTAL.cur,fn:()=>PORTAL.enter('stair',{x:rp[0],z:rp[1],yaw:ry2},{ent:idx+1})})}
    SPECIAL.push((x,z)=>{const dx=x-e.x,dz=z-e.z;const tt=dx*e.tx+dz*e.tz,nn=dx*e.nx+dz*e.nz;if(nn<0||nn>2.45||Math.abs(tt)>6.6)return null;
      if(Math.abs(tt)<1.4&&nn<1.8)return {h:y0+.52,pri:2,surf:'stone'};if(Math.abs(tt)<.9&&nn<2.4)return {h:y0+(nn<2.1?.35:.2),pri:2,surf:'stone'};
      const rt=tt*rs;if(rt>=1.4&&rt<6.4&&nn<1.3)return {h:y0+.1+.42*(6.4-rt)/5,pri:2,surf:'stone'};return null})});
  // barrier gates at both openings
  const barriers=[];
  for(const [x,z,dx,dz] of [[24.5,44,1,-.15],[64,-17,1,.25]]){const l=Math.hypot(dx,dz);const tx=dx/l,tz=dz/l;const post=[x-tx*3.1,z-tz*3.1];
    P.box(post[0],y0+.55,post[1],.35,1.1,.35,0,sRGB('#c9c4b8'),1);
    const arm=new THREE.Mesh(new THREE.BoxGeometry(6,.09,.09),new THREE.MeshStandardMaterial({color:0xf0f0ee,roughness:.5}));const stripes=new THREE.Mesh(new THREE.BoxGeometry(.6,.095,.095),new THREE.MeshStandardMaterial({color:0xc0261d,roughness:.5}));
    const pivot=new THREE.Group();pivot.position.set(post[0],y0+1.05,post[1]);pivot.rotation.y=-Math.atan2(tz,tx);arm.position.x=3;pivot.add(arm);for(let i=0;i<5;i++){const s=stripes.clone();s.position.x=.6+i*1.2;pivot.add(s)}
    pivot.userData.dyn=true;grp.add(pivot);barriers.push({pivot,x,z,open:0})}
  ANIM.push(dt=>{for(const b of barriers){const near=Math.hypot(player.x-b.x,player.z-b.z)<9||(DRIVE.car&&Math.hypot(DRIVE.car.x-b.x,DRIVE.car.z-b.z)<11);b.open+=((near?1:0)-b.open)*Math.min(1,dt*2.5);b.pivot.rotation.z=b.open*1.35}});
  // house number plates on the street side + the complex name on the roof
  const plate=()=>plateMesh(['вул. Євгена Чикаленка','59к'],{w:512,h:256,sizes:[33,112],color:'#ffffff',bg:'#1b4f8c',weight:'700'},1.6,.8);
  {const m=plate();m.position.set(17.6,y0+3,47.5);m.rotation.y=Math.atan2(-.25,.97)+0;grp.add(m)}
  {const m=plate();m.position.set(31,y0+3,57.3);m.rotation.y=.25;grp.add(m)}
  {const cv=txtCanvas(['МОЛОДІЖНИЙ'],{w:1024,h:160,size:120,color:'#e8262a',weight:'800'});const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;
   const mat=new THREE.MeshStandardMaterial({map:tex,transparent:true,emissive:0xff2a2a,emissiveMap:tex,emissiveIntensity:.6,roughness:.5});const m=new THREE.Mesh(new THREE.PlaneGeometry(14,2.2),mat);
   m.position.set(84.3,y0+32.4,26);m.rotation.y=Math.PI/2-.26;grp.add(m);LIGHT_SIGNS.push(mat)}
  // HOME marker (visible from afar)
  HOME_MARK=labelSprite(['HOME','Chykalenka St, 59k'],{w:512,h:220,sizes:[96,46],color:'#fff',bg:'rgba(242,193,78,.92)',round:40,depthTest:false,scale:7,dy:-4});
  HOME_MARK.position.set(36,y0+50,6);HOME_MARK.renderOrder=10;grp.add(HOME_MARK);
  ANIM.push(()=>{const d=Math.hypot(HOME_MARK.position.x-camera.position.x,HOME_MARK.position.z-camera.position.z);HOME_MARK.visible=d>110&&!PORTAL.cur;const k=Math.max(7,Math.min(60,d*.045));HOME_MARK.scale.set(k*512/220,k,1)});
  // spawn: outside the south-west opening, looking into the yard
  PLACES.unshift({id:'home',name:'Home',sub:'Chykalenka St (formerly Williams), 59k',x:27.5,z:57,yaw:Math.atan2(30-27.5,20-57)});
  buildSupermarket(grp,G,P,Sg,GR,y0);buildCarwash(grp,G,P,Sg);buildRyaba(grp,G,P,Sg);
}
const LIGHT_SIGNS=[];
// ---------- corner supermarket (2 floors, glass corner) with the door to the big interior ----------
function buildSupermarket(grp,G,P,Sg,GR,y0){
  const ring=lmPoly(LMK.tavria);
  const res=addPolyBuilding(G,[ring],2,SHOP,33,2,P,Sg,{y0,props:false,shopEdges:[...Array(40).keys()]});STATIC_POLYS.push(makeColPoly([ring],res.top,res.y0));
  // dark glass rounded corner (restaurant) with awnings
  const n=ring.length>>1;for(let i=0;i<n;i++){const x=ring[i*2],z=ring[i*2+1];if(z<71)continue;}
  for(const [x,z,ry] of [[60,72.8,-1.1],[64.5,76.6,-.3],[70.2,74.2,.6]]){P.box(x,y0+3.2,z,2.6,.08,1.1,ry,sRGB('#5a2a18'),5,-.35);P.box(x,y0+3.45,z,2.6,.3,.06,ry,sRGB('#5a2a18'),5)}
  addSign(Sg,64.6,y0+5.0,78.3,0,0,.22,.97,6,.8,39);
  // entrance on the street (east) side
  const dx=72.15,dz=63.5,nx=.97,nz=.24;const ry=Math.atan2(nx,nz);
  P.box(dx+nx*.9,y0+3.3,dz+nz*.9,4.6,.15,2,ry,sRGB('#2a2a2a'),1);
  addSign(Sg,dx+nx*.3,y0+5.4,dz+nz*.3,0,0,nx,nz,10,1.1,1);
  const door=new THREE.Mesh(new THREE.BoxGeometry(.08,2.6,2.8),new THREE.MeshStandardMaterial({color:0x10161c,roughness:.05,metalness:.2,transparent:true,opacity:.6}));door.position.set(dx+nx*.06,y0+1.35,dz+nz*.06);door.rotation.y=ry+Math.PI/2;grp.add(door);
  INTERACT.push({x:dx+nx*1.3,z:dz+nz*1.3,r:2.4,label:'Enter the supermarket',fn:()=>PORTAL.enter('market',{x:dx+nx*2.2,z:dz+nz*2.2,yaw:ry})});
  P.box(dx+nx*3.5,y0+.4,dz+nz*3.5,2,.8,.7,ry,sRGB('#3b6d3f'),1); // trolleys shelter
}
function buildCarwash(grp,G,P,Sg){const ring=lmPoly(LMK.carwash);const y0=HOME_Y0;
  const res=addPolyBuilding(G,[ring],1,INDUST,9,0,P,null,{y0,props:false});STATIC_POLYS.push(makeColPoly([ring],res.top,res.y0));
  // purple walls with orange top band (painted panels over the industrial wall)
  for(const W of res.walls){if(W.L<2)continue;const mx=(W.x1+W.x2)/2+W.nx*.06,mz=(W.z1+W.z2)/2+W.nz*.06;const ry=Math.atan2(W.tx,W.tz)-Math.PI/2;
    P.box(mx,y0+1.9,mz,W.L,3.8,.05,ry,sRGB('#7a4fb0'),9);P.box(mx+W.nx*.02,y0+4.1,mz+W.nz*.02,W.L+.05,.9,.06,ry,sRGB('#f07a1a'),1)}
  const c=polyCentroid(ring);const W=res.walls.reduce((a,b)=>b.L>a.L?b:a);addSign(Sg,(W.x1+W.x2)/2+W.nx*.1,y0+3.75,(W.z1+W.z2)/2+W.nz*.1,0,0,W.nx,W.nz,Math.min(W.L-1,9),.8,14)}
function buildRyaba(grp,G,P,Sg){const ring=lmPoly(LMK.ryaba);const c=polyCentroid(ring);const y0=groundH(c[0],c[1]);
  const res=addPolyBuilding(G,[ring],1,SHOP,61,2,P,null,{y0,props:false,shopEdges:[0,1,2,3,4,5]});STATIC_POLYS.push(makeColPoly([ring],res.top,res.y0));
  for(const W of res.walls){if(W.L<4)continue;addSign(Sg,(W.x1+W.x2)/2+W.nx*.12,y0+res.top-y0-.95,(W.z1+W.z2)/2+W.nz*.12,0,0,W.nx,W.nz,Math.min(W.L-.8,6),.75,35)}}
