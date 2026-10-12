// ===================== near home: gas station, marshrutka stop, garages, enterable shops =====================
// door cut on a building footprint (ring = Float32Array xz pairs or [[x,z],..]); picks the edge facing (wx,wz)
function ringDoor(ring,wx,wz,frac){
  const pts=[];if(ring[0].length){for(const p of ring)pts.push(p)}else{for(let i=0;i<ring.length;i+=2)pts.push([ring[i],ring[i+1]])}
  const n=pts.length;let A=0;for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n];A+=a[0]*b[1]-b[0]*a[1]}
  const s=A>0?1:-1;let best=null,bs=-1;
  for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n];const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<3)continue;
    const nx=s*dz/L,nz=-s*dx/L;const d=nx*wx+nz*wz;if(d<.25)continue;const sc=L*d;if(sc>bs){bs=sc;best={a,b,L,nx,nz,tx:dx/L,tz:dz/L}}}
  if(!best)return null;const f=frac===undefined?.5:frac;
  return {x:best.a[0]+(best.b[0]-best.a[0])*f,z:best.a[1]+(best.b[1]-best.a[1])*f,nx:best.nx,nz:best.nz,tx:best.tx,tz:best.tz,L:best.L};
}
// glass door + canopy + sign + "Enter" prompt on a wall
function shopDoor(grp,P,d,y0,opt){
  const ry=Math.atan2(d.nx,d.nz);const {nx,nz,tx,tz}=d;
  const frameM=new THREE.MeshStandardMaterial({color:opt.frame||0x2a2d31,roughness:.5,metalness:.4});
  const glass=new THREE.MeshStandardMaterial({color:0x10161c,roughness:.05,metalness:.2,transparent:true,opacity:.62});
  const w=opt.w||1.8,h=2.35;
  const g=new THREE.Mesh(new THREE.BoxGeometry(w,h,.06),glass);g.position.set(d.x+nx*.05,y0+h/2,d.z+nz*.05);g.rotation.y=ry;grp.add(g);
  const f=new THREE.Mesh(new THREE.BoxGeometry(w+.2,h+.1,.05),frameM);f.position.set(d.x+nx*.02,y0+h/2+.04,d.z+nz*.02);f.rotation.y=ry;grp.add(f);
  P.box(d.x+nx*.8,y0+h+.25,d.z+nz*.8,w+1.4,.1,1.6,ry,sRGB(opt.awn||'#5a2a18'),5,-.12);
  P.box(d.x+nx*1.5,y0+h+.12,d.z+nz*1.5,w+1.4,.28,.06,ry,sRGB(opt.awn||'#5a2a18'),5);
  P.box(d.x+nx*.7,y0+.06,d.z+nz*.7,w+1.2,.12,1.5,ry,sRGB('#9a9a96'),9);
  if(opt.sign){const m=plateMesh([opt.sign],{w:512,h:128,size:opt.ssize||58,color:opt.fg||'#fff',bg:opt.bg||'#2a5aa0',weight:'800'},opt.sw||3.4,(opt.sw||3.4)*.25,.4);
    m.position.set(d.x+nx*.12+tx*0,y0+h+.95,d.z+nz*.12);m.rotation.y=ry;grp.add(m)}
  INTERACT.push({x:d.x+nx*1.4,z:d.z+nz*1.4,y:y0,r:2.3,label:opt.label,cond:()=>!PORTAL.cur&&!RIDE.on,
    fn:()=>PORTAL.enter(opt.interior,{x:d.x+nx*2.3,z:d.z+nz*2.3,yaw:ry})});
}
function buildNeighbourhood(grp,G,P,Sg,GR){
  const A=-1.22,C=[116,-30],F=frame(C[0],C[1],A),{ca,sa}=F;const q=(u,v)=>F.P(u,v);
  const hA=rawH(C[0],C[1]);
  const pc=q(14,0);addFlatRect(pc[0],pc[1],A,56,38,10,hA);
  addBlock(pc[0],pc[1],60,42,A);TREE_CLEAR.push(pc[0],pc[1],34);
  const y0=hA;const ry=-A;   // ry for P.box along frame u axis
  const conc=sRGB('#9a9a96'),conc2=sRGB('#6e6e6a'),white=sRGB('#f2f2ee'),steel=sRGB('#6b7076'),dark=sRGB('#202428');
  // forecourt asphalt + painted kerb
  groundQuad(GR,[q(-10,-11),q(38,-11),q(38,12),q(-10,12)],4,y0+.05);
  groundQuad(GR,[q(-10,12),q(38,12),q(38,13.2),q(-10,13.2)],5,y0+.06);
  // ---- station shop (enterable)
  const sx0=3,sx1=17,sv0=-9,sv1=-2,H=3.8;
  const cen=q((sx0+sx1)/2,(sv0+sv1)/2);
  P.box(cen[0],y0+H/2,cen[1],sx1-sx0,H,sv1-sv0,ry,sRGB('#e8e2d2'),0);
  P.box(cen[0],y0+H+.15,cen[1],sx1-sx0+.6,.3,sv1-sv0+.6,ry,sRGB('#2e8b45'),1);
  P.box(cen[0],y0+H+.4,cen[1],sx1-sx0+.62,.14,sv1-sv0+.62,ry,sRGB('#f2c418'),1);
  // glass front (towards the pumps)
  {const m=q((sx0+sx1)/2,sv1+.04);P.box(m[0],y0+1.5,m[1],sx1-sx0-1.2,1.9,.08,ry,sRGB('#27323a'),2)}
  wallSeg(...q(sx0,sv0),...q(sx1,sv0),.4,y0,y0+H);wallSeg(...q(sx1,sv0),...q(sx1,sv1),.4,y0,y0+H);wallSeg(...q(sx1,sv1),...q(sx0,sv1),.4,y0,y0+H);wallSeg(...q(sx0,sv1),...q(sx0,sv0),.4,y0,y0+H);
  {const dp=q(6.5,sv1);const dn=[ca*0+(-sa)*1, ca*1];  // normal = +v direction
    shopDoor(grp,P,{x:dp[0],z:dp[1],nx:-sa,nz:ca,tx:ca,tz:sa},y0,{label:'Enter the gas station shop',interior:'azsshop',sign:'МАГАЗИН · КАВА',bg:'#2e8b45',sw:3.6,awn:'#2e8b45'})}
  {const m=plateMesh(['АЗС'],{w:512,h:160,size:100,color:'#fff',bg:'#2e8b45',weight:'900'},3.2,1.0,.45);const p=q(13,sv1+.1);m.position.set(p[0],y0+H-.2,p[1]);m.rotation.y=Math.atan2(-sa,ca);grp.add(m)}
  // ---- canopy over the pumps
  const cu0=14,cu1=32,cv0=2,cv1=9,cy=5.3;const cc=q((cu0+cu1)/2,(cv0+cv1)/2);
  P.box(cc[0],y0+cy,cc[1],cu1-cu0,.5,cv1-cv0,ry,white,1);P.box(cc[0],y0+cy+.05,cc[1],cu1-cu0+.05,.16,cv1-cv0+.05,ry,sRGB('#2e8b45'),1);
  P.box(cc[0],y0+cy-.3,cc[1],cu1-cu0-.3,.1,cv1-cv0-.3,ry,sRGB('#fffbe8'),3);
  for(const u of [cu0+1.5,cu1-1.5])for(const v of [cv0+1.2,cv1-1.2]){const p=q(u,v);P.box(p[0],y0+cy/2,p[1],.45,cy,.45,ry,steel,6);STATIC_CIR.push(p[0],p[1],.4)}
  for(const u of [(cu0+cu1)/2-4,(cu0+cu1)/2+4]){const p=q(u,(cv0+cv1)/2);EXTRA_LAMPS.push([p[0],y0+cy-.6,p[1],2.2])}
  // pump islands: two islands, two pumps each
  for(const u of [19,27]){const p=q(u,(cv0+cv1)/2);P.box(p[0],y0+.1,p[1],5.2,.2,1.1,ry,conc,9);
    for(const k of [-1.2,1.2]){const pp=q(u+k,(cv0+cv1)/2);
      P.box(pp[0],y0+.85,pp[1],.55,1.5,.38,ry,sRGB('#c22a2a'),1);P.box(pp[0],y0+1.3,pp[1],.5,.4,.4,ry,sRGB('#1a2228'),2);P.box(pp[0],y0+1.62,pp[1],.58,.1,.42,ry,white,1);
      LOW_OBB.push(pp[0],pp[1],.3,.25,ca,sa)}
    for(const k of [-1.2,1.2]){const pp=q(u+k,(cv0+cv1)/2-.35);P.cyl(pp[0],y0+.75,pp[1],.025,.025,.5,5,dark,1)}}
  // ---- price pylon at the road
  {const p=q(36,11);P.box(p[0],y0+3,p[1],.5,6,.5,ry,steel,6);STATIC_CIR.push(p[0],p[1],.5);
    const m=plateMesh(['АЗС','А-95   57.90','ДТ   54.90','ГАЗ   31.90'],{w:512,h:512,sizes:[110,64,64,64],color:'#fff',bg:'#1c5e30',weight:'800'},3.0,3.0,.5);
    m.position.set(p[0]-sa*.3,y0+7.3,p[1]+ca*.3);m.rotation.y=Math.atan2(-sa,ca);grp.add(m);
    const m2=m.clone();m2.position.set(p[0]+sa*.3,y0+7.3,p[1]-ca*.3);m2.rotation.y=Math.atan2(-sa,ca)+Math.PI;grp.add(m2);EXTRA_LAMPS.push([p[0],y0+5,p[1],1.2])}
  // ---- marshrutka bay: shelter, sign pole, two vans
  {const bay=q(-4,5);
    P.box(bay[0],y0+.05,bay[1],14,.1,5,ry,conc2,9);
    const sh=q(-8.5,9.3);P.box(sh[0],y0+2.6,sh[1],4.4,.12,1.5,ry,sRGB('#2a5aa0'),1,.06);
    for(const du of [-2,2]){const p=q(-8.5+du,9.9);P.box(p[0],y0+1.3,p[1],.08,2.6,.08,ry,steel,6)}
    {const p=q(-8.5,9.95);P.box(p[0],y0+1.5,p[1],4.2,1.4,.05,ry,sRGB('#cfe6f2'),2)}
    {const p=q(-8.5,8.5);P.box(p[0],y0+.5,p[1],3.4,.07,.4,ry,sRGB('#7a5a3a'),5);LOW_OBB.push(p[0],p[1],.25,1.7,ca,sa)}
    const sp=q(-1.2,10);P.cyl(sp[0],y0,sp[1],.04,.04,3.2,6,steel,6);
    {const m=plateMesh(['МАРШРУТКИ','№ 185 · № 220 · № 175'],{w:1024,h:256,sizes:[100,60],color:'#111',bg:'#f2c418',weight:'800'},3.2,.8,.35);
      m.position.set(sp[0],y0+3.3,sp[1]);m.rotation.y=Math.atan2(-sa,ca);grp.add(m)}
    for(const [u,v,col,flip] of [[-3.5,3.6,CAR_COLS[0],0],[3.5,3.2,CAR_COLS[11],1]]){const p=q(u,v);
      const yaw=Math.atan2(ca,sa)+(flip?Math.PI:0);   // along the frame u axis
      PARKED_STATIC.push({x:p[0],y:y0+.1,z:p[1],yaw,type:3,col,pitch:0,roll:0});
      LOW_OBB.push(p[0],p[1],1.1,2.9,Math.cos(yaw),-Math.sin(yaw))}
    PARKED_DIRTY=true}
  // ---- garages behind: row of 6 with coloured sheet doors, lamp posts
  {const cols=['#8a3a2a','#3a5a8a','#4a7a4a','#a89a3a','#6a6a6e','#7a4a7a'];
    for(let i=0;i<6;i++){const u=-4+i*5.6,v=-17;const p=q(u,v);
      P.box(p[0],y0+1.35,p[1],5.4,2.7,6.2,ry,sRGB('#a89c88'),0);P.box(p[0],y0+2.78,p[1],5.5,.12,6.3,ry,dark,1);
      const d=q(u,v+3.12);P.box(d[0],y0+1.05,d[1],3.0,2.1,.08,ry,sRGB(cols[i]),1);P.box(d[0],y0+.55,d[1],3.02,.05,.1,ry,sRGB('#222'),1)}
    wallSeg(...q(-6.8,-14),...q(26.8,-14),.4,y0,y0+2.8);wallSeg(...q(-6.8,-20),...q(26.8,-20),.4,y0,y0+2.8);wallSeg(...q(-6.8,-20),...q(-6.8,-14),.4,y0,y0+2.8);wallSeg(...q(26.8,-20),...q(26.8,-14),.4,y0,y0+2.8);
    // one open garage with a Tavria nose sticking out
    const t=q(-4+5*5.6,-12.3);PARKED_STATIC.push({x:t[0],y:y0+.1,z:t[1],yaw:Math.atan2(-sa,ca)+Math.PI,type:5,col:0xc7b28d,pitch:0,roll:0});LOW_OBB.push(t[0],t[1],.8,1.9,ca,sa)}
  // ---- a row of poplars along the tram side (right of the tram in the real layout) and a few birches by the garages
  for(let k=0;k<7;k++){const p=q(-8+k*7.2,19.5);TREE_CLEAR.push(p[0],p[1],0);}
  // pad lights
  for(const [u,v] of [[0,-4],[10,12],[34,2]]){const p=q(u,v);propGlobeLamp(P,p[0],y0,p[1],ry);const p2=q(u+.38,v);EXTRA_LAMPS.push([p2[0],y0+3.75,p2[1],2.2])}
  PLACES.push({id:'azs',name:'Gas station',sub:'next to the tram',x:q(10,5)[0],z:q(10,5)[1],yaw:A});

  // ---- OSM garages west of the pad: enterable
  const garages=[[[112,-79],[120,-77],[118,-67],[110,-69]],[[78,-76],[80,-84],[89,-82],[87,-73]],[[60,-88],[73,-85],[71,-78],[58,-81]]];
  garages.forEach((r,i)=>{const d=ringDoor(r,0,1);if(!d)return;const gy=groundH(d.x,d.z);
    shopDoor(grp,P,d,gy,{label:'Enter the garage',interior:'garage',w:2.4,sign:'ГАРАЖ №'+(14+i*7),bg:'#46484c',sw:2.4,ssize:70,awn:'#46484c'})});

  // ---- car wash and Ryaba: enterable
  {const d=ringDoor(lmPoly(LMK.carwash),1,0,.55);if(d){const gy=groundH(d.x,d.z);
      shopDoor(grp,P,d,gy,{label:'Enter the car wash',interior:'carwash',w:3.2,sign:'АВТОМИЙКА',bg:'#7a4fb0',sw:4.2,awn:'#7a4fb0'})}}
  {const d=ringDoor(lmPoly(LMK.ryaba),1,0,.5);if(d){const gy=groundH(d.x,d.z);
      shopDoor(grp,P,d,gy,{label:'Enter the shop',interior:'ryaba',w:1.9,sign:'РЯБА · ПРОДУКТИ',bg:'#d9731a',sw:3.8,awn:'#d9731a'})}}
}

// ===================== interiors =====================
function simpleInterior(key,idx,o){
  const grp=new THREE.Group();scene.add(grp);const ox=INT_X+800+idx*200,oz=INT_Z;
  const mats={floor:new THREE.MeshStandardMaterial({color:o.floor,roughness:o.fr||.6}),ceil:new THREE.MeshStandardMaterial({color:o.ceil||0xf2f0ea,roughness:.9}),wall:new THREE.MeshStandardMaterial({color:o.wall,roughness:.85})};
  const hw=o.w/2,D=o.d;room(grp,ox,oz,-hw,hw,0,D,o.h,mats,{gaps:[[0,hw,o.door||1.8]],surf:o.surf});
  const P=new PB();const fn=o.furnish(P,grp,ox,oz,hw,D);
  INTERACT.push({x:ox,z:oz+.8,r:1.6,label:'Go outside',fn:()=>PORTAL.exit()});
  const pg=P.build();if(pg)grp.add(new THREE.Mesh(pg,MATS.props));
  const ls=[];for(const lz of o.lights||[D/2]){const l=new THREE.PointLight(o.lcol||0xfff0d8,0,18,1.4);l.position.set(ox,INT_Y+o.h-.5,oz+lz);l.userData.i=o.li||1.6;grp.add(l);ls.push(l)}
  INDOORS.push({name:key,title:o.title,sub:'',floor:o.fl||'tile',exp:.6,lights:ls,test:(x,z)=>x>ox-hw-1&&x<ox+hw+1&&z>oz-1&&z<oz+D+1,ceil:()=>INT_Y+o.h-.3});
  grp.visible=false;return {grp,spawn:[ox,oz+2.4],spawnYaw:0,title:o.title,sub:o.sub||'',peds:[],onEnter(){PORTAL.peds=[]}};
}
function simpleCar(P,x,z,ry,col,y){const c=sRGB(col),g=sRGB('#1c2a34');
  P.box(x,y+.62,z,1.7,.55,3.9,ry,c,1);P.box(x,y+1.12,z,1.5,.5,2.0,ry,g,2);P.box(x,y+1.4,z,1.5,.06,1.9,ry,c,1);
  const cs=Math.cos(ry),sn=Math.sin(ry);for(const a of [-1,1])for(const b of [-1.3,1.25]){P.cyl(x+a*.85*cs+b*sn,y+.32,z-a*.85*sn+b*cs,.3,.3,.2,10,sRGB('#111'),1,0,Math.PI/2*a*0,ry)}}
INTERIORS.azsshop=()=>simpleInterior('azsshop',0,{w:11,d:7,h:3.2,floor:0xd9d6cc,wall:0xece6d4,title:'Gas station shop',sub:'coffee, hot dogs and everything for the road',lights:[3.5],
  furnish(P,grp,ox,oz,hw,D){
    P.box(ox+2.4,INT_Y+.55,oz+1.8,4,1.1,.8,0,sRGB('#2e8b45'),1);P.box(ox+2.4,INT_Y+1.12,oz+1.8,4.1,.06,.9,0,sRGB('#ddd'),1);wallSeg(ox+.4,oz+1.8,ox+4.4,oz+1.8,.8,INT_Y-1,INT_Y+1.2);
    P.box(ox+3.8,INT_Y+1.35,oz+1.6,.45,.5,.4,0,sRGB('#222'),1);P.box(ox+2.6,INT_Y+1.3,oz+1.6,.9,.4,.5,0,sRGB('#c9a13a'),1);   // coffee machine, hot-dog roller
    for(const x of [-4,-2.2,-.4]){P.box(ox+x,INT_Y+1.0,oz+D-.5,1.5,2.0,.6,0,sRGB('#c9ccd0'),1);for(let l=0;l<5;l++)P.box(ox+x,INT_Y+.3+l*.38,oz+D-.5,1.4,.03,.55,0,sRGB('#888'),1)}
    for(const [x,z] of [[-4,3.6],[-2.5,3.6]]){P.box(ox+x,INT_Y+.7,oz+z,1.2,1.4,.5,0,sRGB('#d83a2a'),1);LOW_OBB.push(ox+x,oz+z,.6,.25,1,0)}
    P.box(ox+4.2,INT_Y+1.0,oz+D-.5,1.8,2,.6,0,sRGB('#e8eef2'),1);   // drinks fridge
    neonSign(grp,'КАВА · ХОТ-ДОГИ',ox,INT_Y+2.55,oz+D-.12,Math.PI,3.6,'#ffd84a');
    INTERACT.push({x:ox+2.4,z:oz+3.0,r:1.8,label:'Buy a coffee',fn:()=>toast('Coffee ₴45','hot and strong')});
    INTERACT.push({x:ox+1,z:oz+3.0,r:1.2,label:'Buy a hot dog',fn:()=>toast('Hot dog ₴55','with mustard')})}});
INTERIORS.ryaba=()=>simpleInterior('ryaba',1,{w:12,d:9,h:3.2,floor:0xcfcbc0,wall:0xf3ecd8,title:'Ряба',sub:'groceries near home',lights:[2.5,6.5],
  furnish(P,grp,ox,oz,hw,D){
    for(const x of [-3.5,-.5,2.5]){P.box(ox+x,INT_Y+.9,oz+5.2,1.0,1.8,5.0,0,sRGB('#d6d9dc'),1);for(let l=0;l<5;l++){P.box(ox+x,INT_Y+.25+l*.38,oz+5.2,1.05,.03,5.05,0,sRGB('#888'),1)}
      for(let k=0;k<20;k++)P.box(ox+x+(k%2?.34:-.34),INT_Y+.45+(k%5)*.38,oz+3.1+k*.2,.2,.24,.16,0,sRGB(['#d9731a','#2a7a3a','#c22a2a','#e8c84a','#2a5aa0'][k%5]),0);LOW_OBB.push(ox+x,oz+5.2,.55,2.5,1,0)}
    P.box(ox+hw-.7,INT_Y+1.0,oz+5.5,.8,2,7,0,sRGB('#e6eef2'),1);P.box(ox+hw-.7,INT_Y+.5,oz+5.5,.85,.05,7,0,sRGB('#9ac'),2);   // wall fridges
    P.box(ox-4.2,INT_Y+.55,oz+1.9,2.4,1.1,.8,0,sRGB('#d9731a'),1);P.box(ox-4.2,INT_Y+1.12,oz+1.9,2.5,.05,.9,0,sRGB('#ddd'),1);LOW_OBB.push(ox-4.2,oz+1.9,1.2,.45,1,0);
    neonSign(grp,'РЯБА',ox,INT_Y+2.6,oz+D-.12,Math.PI,3.0,'#ffb347');
    INTERACT.push({x:ox-1,z:oz+2.2,r:1.8,label:'Buy bread',fn:()=>toast('Bread ₴28','still warm')});
    INTERACT.push({x:ox+hw-2,z:oz+5.5,r:1.9,label:'Buy kefir',fn:()=>toast('Kefir ₴42','1 litre')})}});
INTERIORS.carwash=()=>simpleInterior('carwash',2,{w:9,d:14,h:4.6,floor:0x8a8e92,fr:.25,wall:0xcfd4d8,ceil:0xdadde0,title:'Автомийка',sub:'hand wash — 250 ₴',lights:[3.5,10],lcol:0xe6f4ff,li:2.0,door:3.2,surf:'wet',
  furnish(P,grp,ox,oz,hw,D){
    simpleCar(P,ox,oz+7.5,0,'#9b1b1e',0);LOW_OBB.push(ox,oz+7.5,.95,2.0,1,0);
    for(const s of [-1,1]){P.box(ox+s*3.8,INT_Y+1.2,oz+7.5,.25,2.4,.25,0,sRGB('#b0b4b8'),1);P.cyl(ox+s*3.3,INT_Y+.8,oz+7.5,.04,.04,1.8,6,sRGB('#c22a2a'),1,0,Math.PI/2*0,0)}
    for(const z of [4,11])P.box(ox+hw-.4,INT_Y+1.1,oz+z,.5,2.2,.6,0,sRGB('#2a5aa0'),1);    // pressure washer cabinets
    P.box(ox-hw+.5,INT_Y+1.0,oz+11.5,.6,2,3.2,0,sRGB('#5a4a8a'),1);
    for(let i=0;i<6;i++)P.box(ox,INT_Y+.03,oz+5.5+i*1.5,.04,.02,.5,0,sRGB('#ddd'),0);
    neonSign(grp,'АВТОМИЙКА',ox,INT_Y+3.6,oz+D-.12,Math.PI,5,'#c9a7ff');
    INTERACT.push({x:ox+hw-1.4,z:oz+4,r:1.8,label:'Wash your hands',fn:()=>toast('Fresh and clean','nice and cold')})}});
INTERIORS.garage=()=>simpleInterior('garage',3,{w:5.4,d:8,h:2.8,floor:0x77746e,fr:.8,wall:0xa8a190,ceil:0x8d8a82,title:'Garage',sub:'tools, jars and a Tavria',lights:[4],lcol:0xffe0b0,li:1.3,door:1.4,fl:'concrete',
  furnish(P,grp,ox,oz,hw,D){
    P.box(ox+.2,INT_Y+.62,oz+5.4,1.5,.6,3.6,0.15,sRGB('#c7b28d'),1);P.box(ox+.2,INT_Y+1.1,oz+5.2,1.35,.45,1.9,0.15,sRGB('#1c2a34'),2);
    LOW_OBB.push(ox+.2,oz+5.4,.85,1.9,1,0);
    P.box(ox-hw+.4,INT_Y+1.0,oz+4,.5,.06,5,0,sRGB('#6b4a2e'),5);P.box(ox-hw+.4,INT_Y+1.7,oz+4,.5,.06,5,0,sRGB('#6b4a2e'),5);
    for(let k=0;k<9;k++)P.cyl(ox-hw+.5,INT_Y+1.03+(k%2)*.7,oz+1.8+k*.55,.1,.1,.3,8,sRGB(['#8a6a2a','#6a8a3a','#8a3a2a'][k%3]),0);
    P.box(ox+hw-.5,INT_Y+.5,oz+2.2,.6,1.0,1.4,0,sRGB('#5a6a7a'),1);   // workbench
    for(let k=0;k<4;k++)P.cyl(ox+hw-.6+k*0,INT_Y+.02,oz+6.8,.3,.3,.2+k*.04,10,sRGB('#111'),1);
    INTERACT.push({x:ox+hw-1.2,z:oz+2.2,r:1.6,label:'Look at the workbench',fn:()=>toast('Garage','a vice, a kettle and an old radio')})}});
