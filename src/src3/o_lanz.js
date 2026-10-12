// ===================== Lanzheron: cable car (2 cabins, ridable) + station with shops underneath =====================
const CABLE={cabs:[],T:62,D:14,L:1,xd0:0,xd1:0,z0:0,deckT:0,deckB:0,lift:9,info:null};
let cableNear=null;
function lzFloorY(u){const c=CABLE;return c.deckT+(c.deckB-c.deckT)*u+c.lift*Math.pow(Math.max(0,Math.sin(Math.PI*u)),.85)}
function lzU(x){return Math.max(0,Math.min(1,(x-CABLE.xd0)/(CABLE.xd1-CABLE.xd0)))}
function cabState(i,now){
  const T=CABLE.T,D=CABLE.D,Pd=2*(T+D);let t=(now+i*(T+D))%Pd;
  if(t<D)return {u:0,v:0,dock:'top'};t-=D;
  if(t<T){const s=t/T;return {u:s*s*(3-2*s),v:6*s*(1-s)/T*CABLE.L,dock:null}}
  t-=T;if(t<D)return {u:1,v:0,dock:'bottom'};t-=D;
  const s=t/T;return {u:1-s*s*(3-2*s),v:6*s*(1-s)/T*CABLE.L,dock:null}
}
function lzCabinMesh(){
  const g=new THREE.Group();
  const mat=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.15},o||{}));
  const red=mat(0xc2262c,{metalness:.25}),white=mat(0xf1f1ee),dark=mat(0x2a2d31,{metalness:.55,roughness:.4}),glass=mat(0x9fd0ee,{transparent:true,opacity:.26,roughness:.05,metalness:0,depthWrite:false}),wood=mat(0x8a5a32,{roughness:.8}),steel=mat(0x9aa0a6,{metalness:.8,roughness:.3});
  const bx=(w,h,d,m,x,y,z,sh)=>{const me=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);me.position.set(x,y,z);me.castShadow=sh!==false;g.add(me);return me};
  bx(2.5,.14,5.0,dark,0,.07,0);
  for(const s of [-1,1]){bx(.07,.9,5.0,red,s*1.215,.59,0);bx(.07,.2,5.0,white,s*1.215,1.14,0)}
  for(const s of [-1,1]){bx(2.5,.9,.07,red,0,.59,s*2.465);bx(2.5,.2,.07,white,0,1.14,s*2.465)}
  for(const sx of [-1,1])for(const sz of [-1,1])bx(.1,1.25,.1,white,sx*1.215,1.85,sz*2.465);
  for(const s of [-1,1])bx(.1,1.25,.1,white,s*1.215,1.85,0);
  for(const s of [-1,1]){bx(.03,1.15,4.75,glass,s*1.22,1.85,0,false)}
  for(const s of [-1,1])bx(2.35,1.15,.03,glass,0,1.85,s*2.47,false);
  bx(2.7,.12,5.2,white,0,2.5,0);bx(2.72,.05,5.22,red,0,2.43,0);
  for(const s of [-1,1])bx(.5,.38,3.0,wood,s*.78,.46,0);          // benches along the sides
  for(const s of [-1,1])bx(.06,.45,3.0,wood,s*1.0,.8,0);          // backrests
  bx(.04,.04,4.4,steel,0,2.15,0);                                 // grab rail
  for(const s of [-1,1]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,1.3,6),steel);r.position.set(0,3.15,s*1.5);g.add(r)}
  bx(.5,.34,3.4,dark,0,3.78,0);
  for(const s of [-1,1])for(const sz of [-1,1]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.7,10),steel);w.rotation.z=Math.PI/2;w.position.set(0,4.04,s*1.5*sz*.9);g.add(w)}
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(1.6,.05,3.6),new THREE.MeshStandardMaterial({color:0xfff2cc,emissive:0xffe8b0,emissiveIntensity:.35,roughness:.5}));lamp.position.set(0,2.4,0);g.add(lamp);g.userData.lamp=lamp;
  g.userData.dyn=true;return g;
}
function buildLanzheron(grp,G,P,Sg,GR){
  const Z0=-9322,XT=2306,XB=2646,C=CABLE;C.z0=Z0;
  const conc=sRGB('#b7b3a9'),conc2=sRGB('#8f8c85'),steel=sRGB('#8b9096'),red=sRGB('#c2262c'),white=sRGB('#eeeeea'),dgl=sRGB('#1b2630'),warm=sRGB('#f4e6c4');
  // ---- terrain: flat pads under both stations, buildings removed on the beach strip
  const hT=rawH(XT,Z0),hB=Math.max(rawH(XB+4,Z0),SL+1.9);
  addFlatRect(XT-6,Z0,0,40,46,26,hT);addFlatRect(XB+4,Z0,0,50,74,18,hB);
  addBlock(XT-4,Z0,46,50,0);addBlock(XB+4,Z0,62,94,0);addBlock(2595,-9335,26,66,0);
  const deckT=hT+.9,deckB=hB+4.7;C.deckT=deckT;C.deckB=deckB;C.xd0=XT+8.6;C.xd1=XB-10.6;C.L=C.xd1-C.xd0;
  const lines=[Z0-3.6,Z0+3.6];
  const ropeY=x=>lzFloorY(lzU(x))+3.95;
  // ---- ropes (two per line) + portal pylons
  for(const lz of lines)for(const off of [-.9,.9]){const xa=XT+3.2,xb=XB-5.2;const st=6;
    for(let x=xa;x<xb;x+=st){const x2=Math.min(xb,x+st);const y1=ropeY(x),y2=ropeY(x2);const L=Math.hypot(x2-x,y2-y1);const pitch=Math.atan2(y2-y1,x2-x);
      P.box((x+x2)/2,(y1+y2)/2+.05,lz+off,.1,.1,L+.3,Math.PI/2,sRGB('#4a4f55'),6,pitch)}}
  const pylonX=[XT+88,XT+168,XT+246,XT+302];
  for(const px of pylonX){const ry=ropeY(px)+.9,gy=groundH(px,Z0);addBlock(px,Z0,7,18,0);
    for(const s of [-1,1]){P.box(px,(gy+ry)/2-.2,Z0+s*7,.55,ry-gy+.4,.55,0,steel,6);P.box(px,gy+.6,Z0+s*7,1.4,1.2,1.4,0,conc2,9)}
    P.box(px,ry,Z0,.5,.5,15.2,0,red,1);P.box(px,ry-3.2,Z0,.35,.35,15,0,steel,6);
    for(const s of [-1,1]){P.box(px,ry-1.6,Z0+s*3.6,.2,3.3,.2,0,steel,6)}
    for(const lz of lines)for(const off of [-.9,.9])P.cyl(px,ry-.55,lz+off,.28,.28,.3,10,sRGB('#2a2d31'),6,Math.PI/2,0,0);
    STATIC_CIR.push(px,Z0-7,.6,px,Z0+7,.6)}
  // ================= top station =================
  {const x0=XT-12,x1=XT+6,zA=Z0-7,zB=Z0+7;
   P.box((x0+x1)/2,hT+.45,Z0,x1-x0,.9,zB-zA,0,conc,9);                       // plinth/deck
   groundQuad(GR,[[XT-40,Z0-7],[XT-12,Z0-7],[XT-12,Z0+7],[XT-40,Z0+7]],5,hT+.08);groundQuad(GR,[[x0-14,Z0-14],[x0,Z0-14],[x0,Z0+14],[x0-14,Z0+14]],5,hT+.08);
   // steps up from the square
   for(let k=0;k<2;k++)P.box(x0-1.1+k*.55,hT+.3*(k+1)/2,Z0,.55,.3*(k+1),8,0,conc2,7);
   // back wall of glass with steel frame + doors, side walls, roof canopy
   const bw=x0+.6;P.box(bw,hT+.9+2.2,Z0-3.7,.2,4.4,6.2,0,steel,6);P.box(bw,hT+.9+2.2,Z0+3.7,.2,4.4,6.2,0,steel,6);
   for(const zz of [Z0-3.7,Z0+3.7])P.box(bw+.12,hT+.9+2.0,zz,.08,3.5,5.6,0,warm,3);
   P.box(bw,hT+.9+3.8,Z0,.25,1.2,2.2,0,steel,6);
   P.box((x0+x1)/2-.4,hT+.9+4.65,Z0,x1-x0+2.4,.28,zB-zA+2,0,white,1);P.box((x0+x1)/2-.4,hT+.9+4.4,Z0,x1-x0+2.5,.18,zB-zA+2.1,0,red,1);
   for(const [cx,cz] of [[x0+1,zA+.2],[x0+1,zB-.2],[x1-.4,zA+.2],[x1-.4,zB-.2]])P.box(cx,hT+.9+2.2,cz,.3,4.4,.3,0,steel,6);
   // rope mast (portal) at the east end of the deck
   for(const s of [-1,1])P.box(XT+3,hT+.9+3.1,Z0+s*7.2,.4,6.2,.4,0,steel,6);P.box(XT+3,hT+.9+5.3,Z0,.5,.5,14.8,0,red,1);
   // benches + railings
   for(const zz of [-4.5,4.5])propBench2(P,x0+4.5,deckT,Z0+zz,Math.PI/2,null);
   for(const s of [-1,1]){P.box((x0+x1)/2,deckT+.55,Z0+s*6.9,x1-x0,.06,.06,0,steel,6);P.box((x0+x1)/2,deckT+1.05,Z0+s*6.9,x1-x0,.06,.06,0,steel,6)}
   P.box(x1-.05,deckT+.55,Z0,.06,.06,14,0,steel,6);P.box(x1-.05,deckT+1.05,Z0,.06,.06,14,0,steel,6);
   wallSeg(x0,zA+.1,x1,zA+.1,.2,deckT,deckT+1.2);wallSeg(x0,zB-.1,x1,zB-.1,.2,deckT,deckT+1.2);wallSeg(x1-.05,zA,x1-.05,zB,.2,deckT,deckT+1.2);
   // glass walls are solid, doors in the middle
   wallSeg(bw,zA,bw,Z0-1.2,.4,hT,hT+6);wallSeg(bw,Z0+1.2,bw,zB,.4,hT,hT+6);
   // signs
   {const m=plateMesh(['КАНАТНА ДОРОГА','Ланжерон ↓'],{w:1024,h:256,sizes:[96,64],color:'#fff',bg:'#c2262c',weight:'800'},7,1.75,.35);m.position.set(x0-1.17,hT+.9+3.6,Z0);m.rotation.y=-Math.PI/2;grp.add(m)}
   {const m=plateMesh(['КАНАТНА ДОРОГА'],{w:1024,h:160,size:100,color:'#fff',bg:'#c2262c',weight:'800'},9,1.4,.35);m.position.set((x0+x1)/2-.4,hT+.9+4.5,zA-1.12);m.rotation.y=Math.PI;grp.add(m)}
   for(const [lx,lz] of [[x0+2,zA+.8],[x0+2,zB-.8],[x1-1.5,zA+.8],[x1-1.5,zB-.8]]){EXTRA_LAMPS.push([lx,hT+.9+4.1,lz,3.2])}
   SPECIAL.push((x,z,y)=>{if(x<x0-1.6||x>x1||Math.abs(z-Z0)>zB-Z0)return null;
     if(x<x0){const t=(x-(x0-1.6))/1.6;return {h:hT+.9*t*t*(3-2*t),pri:2,surf:'stone'}}
     const edge=x>x1-.35||Math.abs(z-Z0)>zB-Z0-.25;return {h:deckT,wall:edge,pri:2,surf:'tile'}});
   STATIC_OBB.push(XT+3,Z0-7.2,.25,.25,1,0,XT+3,Z0+7.2,.25,.25,1,0);
   PLACES.push({id:'cable_top',name:'Cable car · upper station',sub:'Lanzheron cliff, press E to board',x:XT-26,z:Z0,yaw:Math.PI/2});
  }
  // ================= bottom station: shops on the ground floor, deck + dock above =================
  const bx0=XB-2,bx1=XB+10,bz0=Z0-24,bz1=Z0+24,roofY=hB+4.4;
  {const shops=[
    {n:'МОРОЗИВО',c:'#e8478b'},{n:'СУВЕНІРИ',c:'#2a7fba',door:1},{n:'КАВА · ЧАЙ',c:'#7a4a2a'},{n:'КАСА · КАНАТКА',c:'#c2262c',ticket:1},
    {n:'ПЛЯЖНІ ТОВАРИ',c:'#f2a21b',door:1},{n:'ПРОДУКТИ',c:'#2f8a4a',door:1},{n:'ПІЦА',c:'#d8432c'}];
   const sw=(bz1-bz0)/shops.length;
   // slab + roof deck
   P.box((bx0+bx1)/2,hB+.1,Z0,bx1-bx0+.6,.2,bz1-bz0+.6,0,conc2,9);
   P.box((bx0+bx1)/2,roofY+.15,Z0,bx1-bx0+.9,.3,bz1-bz0+.9,0,conc,9);
   // back (west) wall, dividers, side walls
   P.box(bx0,hB+2.2,Z0,.3,4.4,bz1-bz0,0,sRGB('#d8cdb5'),9);
   for(let i=0;i<=shops.length;i++){const z=bz0+i*sw;P.box((bx0+bx1)/2,hB+2.2,z,bx1-bx0,4.4,.25,0,sRGB('#d8cdb5'),9)}
   for(let i=0;i<shops.length;i++){const s=shops[i],zc=bz0+(i+.5)*sw,col=sRGB(s.c);const fx=bx1;
     // front: sill + big lit window + door gap for enterable shops
     P.box(fx-.1,hB+.5,zc,.25,1.0,sw-.3,0,sRGB('#6e6a62'),9);
     const winW=s.door?sw*.5:sw-.8;const wz=s.door?zc-sw*.2:zc;
     P.box(fx-.05,hB+2.15,wz,.12,2.0,winW,0,warm,3);
     for(let k=0;k<4;k++)P.box(fx-.16,hB+1.15+k*.45,wz,.1,.07,winW-.2,0,steel,6);              // shelves
     for(let k=0;k<6;k++){const gc=[col,white,sRGB('#f2c21b'),sRGB('#2a62b8'),sRGB('#d8432c')][k%5];P.box(fx-.22,hB+1.45+(k%3)*.45,wz-winW/2+.4+k*(winW-.8)/6,.1,.22,.28,0,gc,0)}
     for(let k=0;k<=3;k++)P.box(fx-.04,hB+2.15,wz-winW/2+k*winW/3,.2,2.05,.07,0,steel,6);
     if(s.door){const dz=zc+sw*.26;P.box(fx-.05,hB+3.4,dz,.3,1.5,sw*.34,0,steel,6);P.box(fx-.04,hB+1.2,dz,.1,2.3,.9,0,dgl,2);P.box(fx-.04,hB+1.2,dz+sw*.17,.3,2.4,.12,0,steel,6);P.box(fx-.04,hB+1.2,dz-sw*.17,.3,2.4,.12,0,steel,6);
       const rx=fx+2.0,rz=dz;INTERACT.push({x:fx+.9,z:dz,y:hB,r:1.9,label:'Enter '+s.n.toLowerCase(),cond:()=>!PORTAL.cur&&!RIDE.on,fn:()=>PORTAL.enter('market',{x:rx,z:rz,yaw:Math.PI/2},{sign:0})})}
     // awning + sign + colour band
     P.box(fx+.7,hB+3.55,zc,1.8,.07,sw-.2,0,col,5,-.0);P.box(fx+1.55,hB+3.35,zc,.08,.35,sw-.2,0,white,1);
     P.box(fx+.7,hB+4.0,zc,1.3,.8,.18,0,col,9,0);
     {const m=plateMesh([s.n],{w:512,h:128,size:60,color:'#fff',bg:s.c,weight:'800'},sw-.6,.86,.4);m.position.set(fx+.4,hB+3.98,zc);m.rotation.y=Math.PI/2;grp.add(m)}
     // back doors on the west face (service)
     P.box(bx0-.05,hB+1.1,zc,.1,2.2,1.0,0,sRGB('#5a5d60'),6);
   }
   wallSeg(bx0,bz0,bx0,bz1,.35,hB,roofY);wallSeg(bx0,bz0,bx1,bz0,.35,hB,roofY);wallSeg(bx0,bz1,bx1,bz1,.35,hB,roofY);wallSeg(bx1,bz0,bx1,bz1,.5,hB,roofY);
   // roof-deck railings (gap at the stair ends)
   const stairX=bx1-1.8;
   const railSeg=(ax,az,ex,ez)=>{const L=Math.hypot(ex-ax,ez-az);if(L<.2)return;const ry=Math.atan2(ex-ax,ez-az);
     P.box((ax+ex)/2,roofY+.3+.55,(az+ez)/2,.06,.06,L,ry,steel,6);P.box((ax+ex)/2,roofY+.3+1.05,(az+ez)/2,.06,.06,L,ry,steel,6);
     for(let t=0;t<=L+.01;t+=2.2)P.box(ax+(ex-ax)*t/L,roofY+.3+.55,az+(ez-az)*t/L,.05,1.1,.05,0,steel,6);wallSeg(ax,az,ex,ez,.15,roofY+.3,roofY+1.5)};
   for(const zz of [bz0-.4,bz1+.4]){railSeg(bx0-.4,zz,stairX-1.5,zz);railSeg(stairX+1.5,zz,bx1+.4,zz)}
   railSeg(bx1+.4,bz0-.4,bx1+.4,bz1+.4);
   // west side: dock platform with two bays, supported on columns
   const px0=XB-8.2,px1=bx0-.4;
   P.box((px0+px1)/2,deckB-.15,Z0,px1-px0,.3,14.4,0,conc,9);
   for(const zz of [-6.5,-1.5,1.5,6.5])for(const xx of [px0+.8,px1-.8]){const gy=groundH(xx,Z0+zz);P.box(xx,(gy+deckB)/2-.2,Z0+zz,.45,deckB-gy,.45,0,conc2,9)}
   for(const s of [-1,1]){P.box((px0+px1)/2,deckB+.55,Z0+s*7.1,px1-px0,.06,.06,0,steel,6);P.box((px0+px1)/2,deckB+1.05,Z0+s*7.1,px1-px0,.06,.06,0,steel,6)}
   P.box(px0+.05,deckB+.55,Z0,.06,.06,14.2,0,steel,6);P.box(px0+.05,deckB+1.05,Z0,.06,.06,14.2,0,steel,6);
   wallSeg(px0,Z0-7.1,px1,Z0-7.1,.15,deckB,deckB+1.2);wallSeg(px0,Z0+7.1,px1,Z0+7.1,.15,deckB,deckB+1.2);wallSeg(px0+.05,Z0-7.1,px0+.05,Z0+7.1,.15,deckB,deckB+1.2);
   // portal mast for the ropes
   for(const s of [-1,1])P.box(XB-5.2,deckB+3.2,Z0+s*7.4,.4,6.4,.4,0,steel,6);P.box(XB-5.2,deckB+5.45,Z0,.5,.5,15.2,0,red,1);
   P.box((px0+px1)/2,deckB+4.1,Z0,px1-px0+.4,.18,14.8,0,white,1);
   for(const [cx,cz] of [[px0+.6,Z0-7],[px0+.6,Z0+7]])P.box(cx,deckB+2.05,cz,.25,4.1,.25,0,steel,6);
   {const m=plateMesh(['КАНАТНА ДОРОГА','↑ Верхня станція'],{w:1024,h:256,sizes:[96,60],color:'#fff',bg:'#c2262c',weight:'800'},6,1.5,.35);m.position.set(px0-.15,deckB+3.3,Z0);m.rotation.y=-Math.PI/2;grp.add(m)}
   // stairs to the roof deck (north and south ends)
   const stairs=[];
   for(const sgn of [-1,1]){const zS=sgn<0?bz0-.4:bz1+.4;const run=9.2,rise=roofY+.3-hB;const n=30;const x=stairX;
     for(let k=0;k<n;k++){const t=(k+.5)/n;const zz=zS+sgn*(run*(1-t));P.box(x,hB+rise*t-.1,zz,2.8,rise/n+.2,run/n+.04,0,conc,7)}
     for(const sd of [-1,1])P.box(x+sd*1.5,hB+rise/2+.6,zS+sgn*run/2,.1,.1,Math.hypot(run,rise),0,steel,6,Math.atan2(rise,run)*sgn);
     wallSeg(x-1.5,zS+sgn*.3,x-1.5,zS+sgn*run,.15,hB,roofY+2);wallSeg(x+1.5,zS+sgn*.3,x+1.5,zS+sgn*run,.15,hB,roofY+2);
     stairs.push({x,zS,sgn,run,rise})}
   for(const s of stairs)SPECIAL.push((x,z,y)=>{if(Math.abs(x-s.x)>1.4)return null;const d=s.sgn<0?(s.zS-z):(z-s.zS);if(d<-.3||d>s.run+.3)return null;
     const t=Math.max(0,Math.min(1,1-d/s.run));return {h:hB+s.rise*t,pri:4,surf:'stone'}});
   // roof-level deck + dock platform (only when the player is up there)
   SPECIAL.push((x,z,y)=>{if(y<deckB-.8)return null;
     const inRoof=x>bx0-.4&&x<bx1+.5&&z>bz0-.5&&z<bz1+.5,inPlat=x>px0&&x<=bx0-.4&&Math.abs(z-Z0)<7.2;if(!inRoof&&!inPlat)return null;
     let edge=false;
     if(inRoof){if(x>bx1-.15)edge=true;if((z<bz0+.15||z>bz1-.15)&&!stairs.some(s=>Math.abs(x-s.x)<1.5))edge=true}
     else edge=x<px0+.3||Math.abs(z-Z0)>6.9;
     return {h:deckB,wall:edge,pri:3,surf:'tile'}});
   PLACES.push({id:'cable_bottom',name:'Cable car · beach station',sub:'Lanzheron shops under the station',x:bx1+14,z:Z0,yaw:-Math.PI/2});
   // promenade in front of the shops
   groundQuad(GR,[[bx1,bz0-4],[bx1+15,bz0-4],[bx1+15,bz1+4],[bx1,bz1+4]],5,hB+.08);
   groundQuad(GR,[[bx0-26,Z0-5],[bx0,Z0-5],[bx0,Z0+5],[bx0-26,Z0+5]],5,hB+.06);
   // cafe tables with umbrellas
   {const zc=bz0+2.5*sw;const cols=[sRGB('#7a4a2a'),sRGB('#e8478b'),sRGB('#2a7fba'),sRGB('#f2a21b')];
    [[bx1+4.4,zc-2.2],[bx1+6.4,zc-.6],[bx1+4.4,zc+1.6],[bx1+6.6,zc+2.8]].forEach(([tx,zz],k)=>{
      P.cyl(tx,hB+.1,zz,.04,.04,2.3,5,sRGB('#ddd'),1);P.cyl(tx,hB+2.15,zz,1.45,.05,.55,8,cols[k],0);P.cyl(tx,hB+.1,zz,.5,.5,.06,10,sRGB('#f4f1ea'),1);
      for(const a of [0,1.6,3.2,4.8])P.box(tx+Math.cos(a)*.85,hB+.3,zz+Math.sin(a)*.85,.34,.05,.34,0,sRGB('#6b4a2a'),5);STATIC_CIR.push(tx,zz,.9)})}
   for(let k=0;k<6;k++){const zz=bz0+4+k*(bz1-bz0-8)/5;propGlobeLamp(P,bx1+9.5,hB+.08,zz,0);EXTRA_LAMPS.push([bx1+9.5,hB+3.9,zz,2.4]);STATIC_CIR.push(bx1+9.5,zz,.15);if(k%2===0)propBench2(P,bx1+11.6,hB+.08,zz+2,-Math.PI/2,null)}
   TREE_CLEAR.push(bx1+6,Z0,38);
  }
  // ================= cabins (shared clock: every player sees them in the same place) =================
  for(let i=0;i<2;i++){const m=lzCabinMesh();grp.add(m);CABLE.cabs.push({i,mesh:m,x:0,y:0,z:lines[i],yaw:Math.PI/2,v:0,dock:null,kind:'cable',camDist:9,camH:1.9,u:0})}
  CABLE.info={XT,XB,Z0,hT,hB,deckT,deckB,lines};
  ANIM.push(dt=>{const now=Date.now()/1000;const nightN=UNI.uNight?UNI.uNight.value:0;
    for(const c of CABLE.cabs){const st=cabState(c.i,now);c.u=st.u;c.v=st.v;c.dock=st.dock;c.x=CABLE.xd0+(CABLE.xd1-CABLE.xd0)*st.u;c.y=lzFloorY(st.u);
      c.mesh.position.set(c.x,c.y,c.z);c.mesh.rotation.set(0,Math.PI/2,Math.sin(now*1.1+c.i)*.012*Math.min(1,c.v));
      if(c.mesh.userData.lamp)c.mesh.userData.lamp.material.emissiveIntensity=.25+nightN*2.5;
      if(RIDE.on&&RIDE.tram===c){player.x=c.x+.15;player.z=c.z+.78;player.y=c.y+.12;PLR.root.position.set(player.x,player.y,player.z)}}});
  INTERACT.push({x:0,z:0,r:1e9,label:'Board the cable car',cond:()=>{if(RIDE.on||DRIVE.on||PORTAL.cur||player.sit)return false;
    for(const c of CABLE.cabs){if(!c.dock)continue;const dx=player.x-c.x,dz=player.z-c.z;if(Math.abs(dx)<12&&Math.abs(dz)<8.5&&Math.abs(player.y-c.y)<3.2){cableNear=c;return true}}return false},fn:()=>boardCable(cableNear)});
  // lamps along the line
  PLACES.push({id:'lanz_shops',name:'Lanzheron promenade',sub:'shops under the cable car',x:bx1+8,z:Z0+10,yaw:-Math.PI/2});
}
function boardCable(c){if(!c)return;RIDE.on=true;RIDE.tram=c;player.vx=player.vz=0;player.scoot=false;$('bScoot').classList.remove('on');cam.init=false;
  toast('You\'re in the cable car','sit back — it goes by itself. At the station press E to get off');if(window.AUD)AUD.beep()}
function cableLeave(c){
  if(!c.dock){toast('Wait for the station','the cable car is moving');return}
  const I=CABLE.info;RIDE.on=false;RIDE.tram=null;player.vx=player.vz=0;cam.init=false;
  if(c.dock==='top'){player.x=I.XT+1.5;player.z=c.z;player.y=I.deckT;player.yaw=-Math.PI/2}
  else{player.x=I.XB-5.4;player.z=c.z;player.y=I.deckB;player.yaw=-Math.PI/2}
  cam.yaw=player.yaw;
}
