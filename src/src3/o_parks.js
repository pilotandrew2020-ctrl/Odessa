// ===================== parks & squares: Greek park, Istanbul park, City garden, Deribasivska, Duke square, 411 battery =====================
function capsuleGeo(r,len,cs,rs){const pts=[];for(let i=0;i<=cs;i++){const a=-Math.PI/2+i/cs*Math.PI/2;pts.push(new THREE.Vector2(Math.max(1e-4,Math.cos(a)*r),-len/2+Math.sin(a)*r))}for(let i=1;i<=cs;i++){const a=i/cs*Math.PI/2;pts.push(new THREE.Vector2(Math.max(1e-4,Math.cos(a)*r),len/2+Math.sin(a)*r))}return new THREE.LatheGeometry(pts,rs)}
function isNewYear(){const d=new Date();const m=d.getMonth(),day=d.getDate();return (m===11&&day>=10)||(m===0&&day<=20)}
function downhill(x,z){const e=6;const gx=groundH(x+e,z)-groundH(x-e,z),gz=groundH(x,z+e)-groundH(x,z-e);const l=Math.hypot(gx,gz)||1;return [-gx/l,-gz/l]}
function classicLamp(P,x,y,z,heads){const blk=sRGB('#1e2124');P.cyl(x,y,z,.16,.1,.6,8,blk,1);P.cyl(x,y+.6,z,.09,.07,3.3,8,blk,1);
  const n=heads||2;for(let k=0;k<n;k++){const an=k/n*6.283;const hx=x+Math.cos(an)*(n>1?.45:0),hz=z+Math.sin(an)*(n>1?.45:0);if(n>1)P.box((x+hx)/2,y+3.75,(z+hz)/2,.5,.05,.05,-an,blk,1);
    P.cyl(hx,y+3.6,hz,.16,.2,.42,6,sRGB('#fff1c4'),3);P.cyl(hx,y+4.02,hz,.22,.04,.2,6,blk,1)}
  for(let k=0;k<n;k++){const an=k/n*6.283;EXTRA_LAMPS.push([x+Math.cos(an)*(n>1?.45:0),y+3.8,z+Math.sin(an)*(n>1?.45:0),2.2])}}
function flowerBed(GR,P,x,z,w,d,ry,cols){const c=Math.cos(ry),s=Math.sin(ry);const at=(u,v)=>[x+u*c-v*s,z+u*s+v*c];
  groundQuad(GR,[at(-w/2,-d/2),at(w/2,-d/2),at(w/2,d/2),at(-w/2,d/2)],0);const r=rng(((x*13)|0)^((z*7)|0));TREE_CLEAR.push(x,z,Math.max(w,d)*.55);
  for(let i=0;i<w*d*1.4;i++){const u=(r()-.5)*w,v=(r()-.5)*d;const wave=Math.sin(u*.5)*d*.3;const col=Math.abs(v-wave)<d*.12?cols[0]:(Math.abs(v+wave)<d*.1?cols[1]:cols[2]);if(!col)continue;const p=at(u,v);const gy=groundH(p[0],p[1]);
    P.box(p[0],gy+.06,p[1],.06,.2,.06,0,sRGB('#3d6b2e'),0);P.box(p[0],gy+.2,p[1],.26,.14,.26,r()*1.5,col,0)}}
function pipPoly(poly,x,z){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
// long park promenade along the polygon axis: paving that follows the slope, benches, lamps, flower beds
function parkWalk(GR,P,poly,cx,cz,a,len,off,o){
  const ca=Math.cos(a),sa=Math.sin(a),nx=-sa,nz=ca,st=5,hw=o.w/2;const r=rng(((cx*7)|0)^((off*131)|0));let k=0;
  const inside=(x,z)=>pipPoly(poly,x,z)&&pipPoly(poly,x+nx*(hw+2),z+nz*(hw+2))&&pipPoly(poly,x-nx*(hw+2),z-nz*(hw+2));
  for(let t=-len/2;t<len/2;t+=st,k++){
    const p0=[cx+ca*t+nx*off,cz+sa*t+nz*off],p1=[cx+ca*(t+st)+nx*off,cz+sa*(t+st)+nz*off];
    if(!inside(p0[0],p0[1])||!inside(p1[0],p1[1]))continue;
    groundQuad(GR,[[p0[0]-nx*hw,p0[1]-nz*hw],[p0[0]+nx*hw,p0[1]+nz*hw],[p1[0]+nx*hw,p1[1]+nz*hw],[p1[0]-nx*hw,p1[1]-nz*hw]],5);
    TREE_CLEAR.push(p0[0],p0[1],hw+1.6);
    if(k%5===2)for(const sd of [-1,1]){const bx=p0[0]+nx*sd*(hw+.9),bz=p0[1]+nz*sd*(hw+.9);const by=groundH(bx,bz);
      propBench2(P,bx,by,bz,Math.atan2(-sd*nx,-sd*nz),HOME_BENCHES);LOW_OBB.push(bx,bz,.95,.32,Math.cos(Math.atan2(-sd*nx,-sd*nz)),-Math.sin(Math.atan2(-sd*nx,-sd*nz)))}
    if(k%4===0){const sd=(k/4)%2?1:-1;const lx=p0[0]+nx*sd*(hw+.6),lz=p0[1]+nz*sd*(hw+.6);classicLamp(P,lx,groundH(lx,lz),lz,2)}
    if(o.beds&&k%9===4){const sd=r()<.5?-1:1;const bx=p0[0]+nx*sd*(hw+7),bz=p0[1]+nz*sd*(hw+7);
      if(pipPoly(poly,bx,bz)&&pipPoly(poly,bx+ca*10,bz+sa*10)&&pipPoly(poly,bx-ca*10,bz-sa*10))flowerBed(GR,P,bx,bz,16+r()*6,5+r()*2,a,o.beds[(r()*o.beds.length)|0])}
  }}
function parkGazebo(P,x,z,roof){const gy=groundH(x,z);for(let k=0;k<8;k++){const an=k/8*6.283;const px=x+Math.cos(an)*2.6,pz=z+Math.sin(an)*2.6;P.box(px,groundH(px,pz)+1.3,pz,.18,2.6+gy-groundH(px,pz),.18,0,sRGB('#6b3a22'),5)}
  P.cyl(x,gy-.1,z,3,3,.4,8,sRGB('#b9a88a'),7);P.cyl(x,gy+2.6,z,3.6,.3,1.6,8,sRGB(roof||'#2f6a4a'),1);STATIC_CIR.push(x,z,3)}
// bronze head fountain: a big serene face on a column, a wide flat "cap" on top, water pouring down around it like a curtain
function makeHeadFountain(x,y,z,ry){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;
  const M=new THREE.MeshStandardMaterial({color:new THREE.Color('#4f8a7c').convertSRGBToLinear(),roughness:.45,metalness:.45});
  const Md=new THREE.MeshStandardMaterial({color:new THREE.Color('#2e5a50').convertSRGBToLinear(),roughness:.6,metalness:.4});
  const add=(geo,m,px,py,pz)=>{const o=new THREE.Mesh(geo,m||M);o.position.set(px,py,pz);o.castShadow=true;g.add(o);return o};
  add(new THREE.CylinderGeometry(.45,.5,1.6,20),Md,0,.8,0);
  // face: an egg shape, flattened at the back, slightly pushed forward at the front
  const hg=new THREE.SphereGeometry(.78,40,32);const P=hg.attributes.position;
  for(let i=0;i<P.count;i++){let px=P.getX(i),py=P.getY(i),pz=P.getZ(i);py*=1.32;if(py<0)px*=1-.18*(-py/1.03);pz*=pz>0?1.0:.82;if(py<-.55)pz*=.9;P.setXYZ(i,px*.92,py,pz)}
  hg.computeVertexNormals();const H=1.6+1.0;add(hg,M,0,H,0);
  // brow ridge, eyes (heavy lids, half closed), nose, lips, chin
  for(const sx of [-1,1]){
    const brow=add(new THREE.SphereGeometry(.1,10,8),M,sx*.25,H+.3,.62);brow.scale.set(2.2,.55,.9);
    const lid=add(new THREE.SphereGeometry(.12,14,10),M,sx*.25,H+.16,.6);lid.scale.set(1.5,.75,.6);
    const eye=add(new THREE.SphereGeometry(.1,12,8),Md,sx*.25,H+.12,.6);eye.scale.set(1.35,.32,.5);
    const cheek=add(new THREE.SphereGeometry(.2,12,10),M,sx*.33,H-.18,.48);cheek.scale.set(1,1.1,.7);}
  {const n=add(new THREE.ConeGeometry(.12,.48,4),M,0,H-.02,.74);n.rotation.x=-.25;n.rotation.y=Math.PI/4;n.scale.set(1,1,.8);
   const tip=add(new THREE.SphereGeometry(.085,10,8),M,0,H-.22,.8);tip.scale.set(1.3,.9,1);}
  {const up=add(new THREE.SphereGeometry(.12,14,8),M,0,H-.47,.68);up.scale.set(1.75,.45,.7);const lo=add(new THREE.SphereGeometry(.11,14,8),M,0,H-.56,.66);lo.scale.set(1.5,.5,.7);
   const gap=add(new THREE.BoxGeometry(.32,.012,.05),Md,0,H-.515,.73);}
  {const ch=add(new THREE.SphereGeometry(.18,12,10),M,0,H-.83,.5);ch.scale.set(1.2,.8,.8)}
  for(const sx of [-1,1]){const ear=add(new THREE.SphereGeometry(.12,10,8),M,sx*.72,H+.02,-.02);ear.scale.set(.4,1.5,.8)}
  // wavy hair falling at the sides
  for(const sx of [-1,1])for(let k=0;k<5;k++){const h=add(new THREE.SphereGeometry(.17,10,8),M,sx*(.62-k*.02),H+.6-k*.32,-.2-k*.04);h.scale.set(.6,1.4,1.2)}
  // the flat stone cap on top, irregular edge
  {const cg=new THREE.CylinderGeometry(1.75,1.55,.32,40,1);const C=cg.attributes.position;for(let i=0;i<C.count;i++){const px=C.getX(i),pz=C.getZ(i),r=Math.hypot(px,pz);if(r>.2){const an=Math.atan2(pz,px);const f=1+.08*Math.sin(an*5)+.05*Math.sin(an*11+1);C.setX(i,px*f);C.setZ(i,pz*f*.85)}}
   cg.computeVertexNormals();const cap=add(cg,Md,0,H+1.1,-.1);cap.rotation.x=-.08}
  // water curtain from the cap edge down to the pool
  const wm=new THREE.MeshStandardMaterial({color:0xdff4ff,transparent:true,opacity:.32,roughness:.05,metalness:0,emissive:0x5a8aa0,emissiveIntensity:.25,side:THREE.DoubleSide,depthWrite:false});
  const wc=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.9,H+1.0,40,1,true),wm);wc.position.set(0,(H+1.0)/2+.05,-.1);wc.scale.z=.85;g.add(wc);wc.userData.dyn=true;
  ANIM.push(()=>{wm.opacity=.26+.08*Math.sin(UNI.uTime.value*7)});
  return g;
}
function buildParks(grp,G,P,Sg,GR){
  const stoneW=sRGB('#c9c3b5'),gran=sRGB('#55585c'),limestone=sRGB('#cdbd98');
  // ---------- Duke square: globe-lamp sculpture "ОДЕСА-УКРАЇНА", lanterns; New Year: star, gifts, Santa boot ----------
  {const S2=STAIRS;const d=S2.dp,gy=S2.gy;const px=d[0]-S2.nx*14-S2.tx*4,pz=d[1]-S2.nz*14-S2.tz*4;
   P.cyl(px,gy,pz,1.6,1.6,.15,16,sRGB('#6c6f72'),1);P.box(px,gy+3.2,pz,.3,6.4,.3,0,sRGB('#cfd3d6'),6);
   for(let k=0;k<7;k++){const an=-Math.PI/2+(k-3)*.32;const ex=Math.sin(an+Math.PI/2)*2.6;const p=[px+S2.tx*ex,pz+S2.tz*ex];const h=6.4+Math.cos((k-3)*.32)*1.6;
     P.box((px+p[0])/2,gy+5.6+(h-6.4)/2,(pz+p[1])/2,.07,Math.hypot(ex,h-5.4)*.9,.07,S2.ry,sRGB('#cfd3d6'),6,(k-3)*.28);
     P.cyl(p[0],gy+h,p[1],.28,.28,.56,10,sRGB('#fff6dc'),3);EXTRA_LAMPS.push([p[0],gy+h,p[1],2.6])}
   const ringM=new THREE.Mesh(new THREE.TorusGeometry(1.7,.12,8,40),new THREE.MeshStandardMaterial({color:0xcfd3d6,metalness:.8,roughness:.3}));ringM.position.set(px,gy+2.2,pz);ringM.rotation.y=-Math.atan2(S2.tz,S2.tx)+Math.PI/2;grp.add(ringM);
   const sg=plateMesh(['ОДЕСА — УКРАЇНА'],{w:512,h:96,size:54,color:'#1b3a6b',bg:'#e9edf2',weight:'800'},3.2,.6);sg.position.set(px,gy+2.2,pz);sg.rotation.y=Math.atan2(S2.nx,S2.nz);grp.add(sg);
   STATIC_CIR.push(px,pz,1.7);
   for(const s of [-1,1])for(const k of [1,2]){const p=[d[0]+S2.nx*s*9*k-S2.tx*6,d[1]+S2.nz*s*9*k-S2.tz*6];classicLamp(P,p[0],groundH(p[0],p[1]),p[1],3)}
   if(isNewYear()||S.season==='winter'){const sx=d[0]+S2.tx*12+S2.nx*9,sz=d[1]+S2.tz*12+S2.nz*9;const star=new THREE.Group();const wm=new THREE.MeshStandardMaterial({color:0xf4f6fa,emissive:0xbcd4ff,emissiveIntensity:.15,roughness:.4});
     for(let k=0;k<8;k++){const sp=new THREE.Mesh(new THREE.ConeGeometry(.5,6,6),wm);const an=k/8*Math.PI*2;sp.position.set(Math.cos(an)*2.8,Math.sin(an)*2.8,0);sp.rotation.z=an-Math.PI/2;star.add(sp)}
     for(const ax of [[0,1,0],[0,-1,0]]){const sp=new THREE.Mesh(new THREE.ConeGeometry(.5,6,6),wm);sp.position.set(0,0,ax[1]*2.8);sp.rotation.x=ax[1]*Math.PI/2;star.add(sp)}
     star.position.set(sx,groundH(sx,sz)+6.5,sz);star.userData.dyn=true;grp.add(star);LIGHT_SIGNS.push(wm);ANIM.push(()=>{star.rotation.y+=.003});
     const red=new THREE.MeshStandardMaterial({color:0xc81e24,roughness:.8}),wht=new THREE.MeshStandardMaterial({color:0xf3f3f3,roughness:.9});
     const bx=d[0]+S2.tx*18-S2.nx*6,bz=d[1]+S2.tz*18-S2.nz*6,by=groundH(bx,bz);const boot=new THREE.Group();const leg=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.2,3,16),red);leg.position.y=1.5;boot.add(leg);
     const foot=new THREE.Mesh(new THREE.BoxGeometry(3.4,1.6,2.2),red);foot.position.set(1,.8,0);boot.add(foot);const cuff=new THREE.Mesh(new THREE.TorusGeometry(1.15,.35,8,20),wht);cuff.rotation.x=Math.PI/2;cuff.position.y=3;boot.add(cuff);
     boot.position.set(bx,by,bz);boot.rotation.y=-Math.atan2(S2.tz,S2.tx);grp.add(boot);
     for(let k=0;k<4;k++){const gx=d[0]+S2.tx*(14+k*3)+S2.nx*(k%2?5:-4),gz=d[1]+S2.tz*(14+k*3)+S2.nz*(k%2?5:-4);const gy2=groundH(gx,gz);const col=[0x2c5fc0,0xe8e8f0,0xc81e24,0x2c5fc0][k];
       const box=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.6,1.6),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6,transparent:true,opacity:.55}));box.position.set(gx,gy2+.8,gz);grp.add(box);
       for(const r of [0,Math.PI/2]){const rb=new THREE.Mesh(new THREE.BoxGeometry(1.64,1.64,.3),new THREE.MeshStandardMaterial({color:col,roughness:.6}));rb.position.copy(box.position);rb.rotation.y=r;grp.add(rb)}
       const bow=new THREE.Mesh(new THREE.TorusGeometry(.35,.12,6,12),new THREE.MeshStandardMaterial({color:col}));bow.position.set(gx,gy2+1.8,gz);grp.add(bow)}}}
  // ---------- Greek park: granite amphitheatre stairs by the flag wall, the head fountain, playground ----------
  {const c=[700,-11262];const [dx,dz]=downhill(c[0],c[1]);const ry=Math.atan2(dx,dz);const nx=-dz,nz=dx;const L=34,Wd=12;
   const yTop=groundH(c[0]-dx*L/2,c[1]-dz*L/2),yBot=groundH(c[0]+dx*L/2,c[1]+dz*L/2);const nS=Math.max(10,Math.round((yTop-yBot)/.17));addRamp(c[0]-dx*L/2,c[1]-dz*L/2,c[0]+dx*L/2,c[1]+dz*L/2,Wd/2+5,8,yTop-.25,yBot-.25,true);const rise=(yTop-yBot)/nS,tread=L/nS;
   for(let i=0;i<nS;i++){const u=-L/2+(i+.5)*tread;const p=[c[0]+dx*u,c[1]+dz*u];const yy=yTop-(i+1)*rise;P.box(p[0],yy-(.6+rise)/2,p[1],Wd,.6+rise,tread+.02,ry,i%2?sRGB('#6e7175'):gran,7)}
   // seating terraces on one side
   for(let i=0;i<nS;i+=3){const u=-L/2+(i+.5)*tread;const p=[c[0]+dx*u+nx*(Wd/2+2.2),c[1]+dz*u+nz*(Wd/2+2.2)];const yy=yTop-(i+1)*rise;P.box(p[0],yy+.2,p[1],4,.8,tread*3,ry,gran,7)}
   // the long grey wall with Odesa (red/white/blue) and Ukrainian flags
   {const wx=c[0]-nx*(Wd/2+.6),wz=c[1]-nz*(Wd/2+.6);const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const x=cv.getContext('2d');x.fillStyle='#9a9c9e';x.fillRect(0,0,1024,256);
    for(let k=0;k<1024;k+=32){x.fillStyle='rgba(0,0,0,.06)';x.fillRect(k,0,2,256)}x.fillStyle='#d32a2a';x.fillRect(520,20,110,236);x.fillStyle='#f3f3f3';x.fillRect(630,20,40,236);x.fillStyle='#2a63c4';x.fillRect(700,20,60,236);x.fillStyle='#f6d11c';x.fillRect(760,20,60,236);
    const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;const m=new THREE.Mesh(new THREE.BoxGeometry(.8,9,L+10),[new THREE.MeshStandardMaterial({map:t,roughness:.8}),new THREE.MeshStandardMaterial({map:t,roughness:.8}),new THREE.MeshStandardMaterial({color:0x8e9092}),new THREE.MeshStandardMaterial({color:0x8e9092}),new THREE.MeshStandardMaterial({color:0x8e9092}),new THREE.MeshStandardMaterial({color:0x8e9092})]);
    m.position.set(wx,(yTop+yBot)/2+3,wz);m.rotation.y=ry;grp.add(m);wallSeg(wx-dx*(L/2+5),wz-dz*(L/2+5),wx+dx*(L/2+5),wz+dz*(L/2+5),.9,yBot-2,yTop+8)}
   SPECIAL.push((x,z)=>{const rx=x-c[0],rz=z-c[1];const u=rx*dx+rz*dz,v=rx*nx+rz*nz;if(Math.abs(u)>L/2||Math.abs(v)>Wd/2)return null;const i=Math.min(nS-1,Math.max(0,Math.floor((u+L/2)/tread)));return {h:yTop-(i+1)*rise,pri:2,surf:'stone'}});
   // head fountain ("Джерело")
   {const f=[604,-11318],fy=groundH(f[0],f[1]);P.cyl(f[0],fy,f[1],3.4,3.4,.5,24,stoneW,7);P.cyl(f[0],fy+.45,f[1],3.1,3.1,.05,24,sRGB('#3f8fa3'),8);
    grp.add(makeHeadFountain(f[0],fy,f[1],Math.atan2(c[0]-f[0],c[1]-f[1])));STATIC_CIR.push(f[0],f[1],3.4)}
   for(const p of [[660,-11290],[740,-11240],[640,-11300]])classicLamp(P,p[0],groundH(p[0],p[1]),p[1],2);
   playgroundArea(P,GR,{x:722,z:-11300,w:18,d:14,a:-.6});
   {const G0=LMK.greek,gp=G0.poly,beds=[[sRGB('#d12c2c'),sRGB('#f4f0e8'),sRGB('#e8b42a')],[sRGB('#e26a2c'),sRGB('#c43a8a'),sRGB('#f4f0e8')],[sRGB('#8a3ac0'),sRGB('#f4f0e8'),sRGB('#e8b42a')]];
    parkWalk(GR,P,gp,G0.x,G0.y,G0.a,G0.w*.92,0,{w:5,beds});parkWalk(GR,P,gp,G0.x,G0.y,G0.a,G0.w*.8,-34,{w:3.6,beds:null});parkWalk(GR,P,gp,G0.x,G0.y,G0.a,G0.w*.8,34,{w:3.6,beds:null});
    // more fountain pools and gazebos along the promenade
    for(const t of [-150,-70,95,170]){const q=[G0.x+Math.cos(G0.a)*t-Math.sin(G0.a)*22,G0.y+Math.sin(G0.a)*t+Math.cos(G0.a)*22];if(pipPoly(gp,q[0],q[1]))parkGazebo(P,q[0],q[1],'#2f4a8a')}
    for(const t of [-190,10,130]){const q=[G0.x+Math.cos(G0.a)*t,G0.y+Math.sin(G0.a)*t];if(!pipPoly(gp,q[0],q[1]))continue;const fy=groundH(q[0],q[1]);P.cyl(q[0],fy,q[1],4.2,4.2,.5,24,stoneW,7);P.cyl(q[0],fy+.45,q[1],3.9,3.9,.05,24,sRGB('#3f8fa3'),8);P.cyl(q[0],fy,q[1],.5,.4,2.2,10,stoneW,7);STATIC_CIR.push(q[0],q[1],4.2)}
    playgroundArea(P,GR,{x:G0.x+Math.cos(G0.a)*-120+Math.sin(G0.a)*30,z:G0.y+Math.sin(G0.a)*-120-Math.cos(G0.a)*30,w:18,d:14,a:G0.a})}
   PLACES.push({id:'greek',name:'Greek Park',sub:'stairs and fountain',x:c[0]+dx*(L/2+6),z:c[1]+dz*(L/2+6),yaw:Math.atan2(-dx,-dz)})}
  // ---------- Istanbul park: rock fountain, tulip beds, ODESA ISTANBUL letters, gazebos, statues ----------
  {const ip=LMK.istanbul;const c=[1010,-10935];const yy=groundH(c[0],c[1]);addFlat(c[0],c[1],22,10);
   const rockM=new THREE.MeshStandardMaterial({color:0x9a8b74,roughness:.95,flatShading:true});
   {const g=new THREE.IcosahedronGeometry(4,1);const pa=g.attributes.position;for(let i=0;i<pa.count;i++){const v=new THREE.Vector3().fromBufferAttribute(pa,i);const n=1+.28*Math.sin(v.x*1.7+v.y*2.3)*Math.cos(v.z*1.9);pa.setXYZ(i,v.x*n*1.1,v.y*n*1.25,v.z*n*.8)}g.computeVertexNormals();
    const rock=new THREE.Mesh(g,rockM);rock.position.set(c[0],yy+4.2,c[1]);rock.castShadow=true;grp.add(rock);const r2=rock.clone();r2.scale.setScalar(.6);r2.position.set(c[0]+3.6,yy+2.6,c[1]+1);grp.add(r2)}
   P.cyl(c[0],yy,c[1],9,9,.7,32,sRGB('#efece4'),7);P.cyl(c[0],yy+.65,c[1],8.5,8.5,.05,32,sRGB('#5ea7b4'),8);
   const fall=new THREE.Mesh(new THREE.PlaneGeometry(1.4,6),new THREE.MeshStandardMaterial({color:0xd8f2ff,transparent:true,opacity:.55,emissive:0x406070,emissiveIntensity:.2}));fall.position.set(c[0],yy+3.6,c[1]+3.3);grp.add(fall);fall.userData.dyn=true;
   ANIM.push(()=>{fall.material.opacity=.45+.15*Math.sin(UNI.uTime.value*8)});STATIC_CIR.push(c[0],c[1],8.8);
   for(let k=0;k<5;k++){const an=k/5*6.283;const p=[c[0]+Math.cos(an)*12.5,c[1]+Math.sin(an)*12.5];propBench2(P,p[0],groundH(p[0],p[1]),p[1],an+Math.PI/2,null)}
   flowerBed(GR,P,c[0]-26,c[1]+10,18,7,.9,[sRGB('#d12c2c'),sRGB('#f4f0e8'),sRGB('#e26a2c')]);flowerBed(GR,P,c[0]+24,c[1]-12,16,6,.9,[sRGB('#e23a3a'),sRGB('#8a3ac0'),null]);
   {const cv=txtCanvas(['ODESA  ♥  ISTANBUL'],{w:1024,h:160,size:120,color:'#f5f5f2',weight:'800'});const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(13,2),new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.3,side:THREE.DoubleSide}));const p=[c[0]-14,c[1]-16];m.position.set(p[0],groundH(p[0],p[1])+2.2,p[1]);m.rotation.y=.9;grp.add(m);
    P.box(p[0],groundH(p[0],p[1])+.6,p[1],14,1.2,1.2,.9,limestone,7)}
   // green-roofed wooden gazebo
   {const g=[c[0]+20,c[1]+14],gy=groundH(g[0],g[1]);for(let k=0;k<8;k++){const an=k/8*6.283;P.box(g[0]+Math.cos(an)*2.6,gy+1.3,g[1]+Math.sin(an)*2.6,.18,2.6,.18,0,sRGB('#6b3a22'),5)}P.cyl(g[0],gy+.15,g[1],3,3,.3,8,sRGB('#b9a88a'),7);P.cyl(g[0],gy+2.6,g[1],3.6,.3,1.6,8,sRGB('#2f6a4a'),1);STATIC_CIR.push(g[0],g[1],3)}
   // white rotunda with statues
   {const g=[c[0]-30,c[1]-6],gy=groundH(g[0],g[1]);const wm=sRGB('#f1ece2');P.cyl(g[0],gy,g[1],3.2,3.2,.5,16,wm,7);for(let k=0;k<6;k++){const an=k/6*6.283;P.cyl(g[0]+Math.cos(an)*2.6,gy+.5,g[1]+Math.sin(an)*2.6,.18,.18,3.4,8,wm,7)}
    P.cyl(g[0],gy+3.9,g[1],3.1,3.1,.35,16,wm,7);const dm=new THREE.Mesh(new THREE.SphereGeometry(2.9,16,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x6aa0a0,wireframe:false,roughness:.5,metalness:.4}));dm.scale.y=.6;dm.position.set(g[0],gy+4.25,g[1]);grp.add(dm);
    for(let k=0;k<4;k++){const an=k/4*6.283+.4;const p=[g[0]+Math.cos(an)*6,g[1]+Math.sin(an)*6];const py=groundH(p[0],p[1]);P.box(p[0],py+.6,p[1],.8,1.2,.8,0,wm,7);P.cyl(p[0],py+1.2,p[1],.25,.32,1.5,8,wm,7);P.cyl(p[0],py+2.7,p[1],.2,.2,.3,8,wm,7)}STATIC_CIR.push(g[0],g[1],3.3)}
   // limestone retaining walls
   for(const [u0,u1,off] of [[-40,40,-22],[-30,30,20]]){const a=.9;const p0=[c[0]+Math.cos(a)*u0-Math.sin(a)*off,c[1]+Math.sin(a)*u0+Math.cos(a)*off],p1=[c[0]+Math.cos(a)*u1-Math.sin(a)*off,c[1]+Math.sin(a)*u1+Math.cos(a)*off];
     const L=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),m=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2];P.box(m[0],groundH(m[0],m[1])+.9,m[1],L,1.8,.7,-a,limestone,7)}
   for(const p of [[c[0]-8,c[1]-12],[c[0]+10,c[1]+10],[c[0]-20,c[1]+4],[c[0]+16,c[1]-6]])classicLamp(P,p[0],groundH(p[0],p[1]),p[1],2);
   {const beds=[[sRGB('#e23a3a'),sRGB('#f4d03a'),sRGB('#e26a2c')],[sRGB('#8a3ac0'),sRGB('#f4f0e8'),sRGB('#e23a3a')],[sRGB('#f4d03a'),sRGB('#e23a3a'),sRGB('#f4f0e8')]];
    parkWalk(GR,P,ip.poly,ip.x,ip.y,ip.a,ip.w*.92,0,{w:5,beds});parkWalk(GR,P,ip.poly,ip.x,ip.y,ip.a,ip.w*.8,-22,{w:3.4,beds:null});parkWalk(GR,P,ip.poly,ip.x,ip.y,ip.a,ip.w*.8,22,{w:3.4,beds:null});
    for(const t of [-170,-100,80,150,190]){const q=[ip.x+Math.cos(ip.a)*t-Math.sin(ip.a)*14,ip.y+Math.sin(ip.a)*t+Math.cos(ip.a)*14];if(pipPoly(ip.poly,q[0],q[1]))parkGazebo(P,q[0],q[1],t%2?'#2f6a4a':'#8a2a2a')}
    for(const t of [-190,-120,110,185]){const q=[ip.x+Math.cos(ip.a)*t,ip.y+Math.sin(ip.a)*t];if(!pipPoly(ip.poly,q[0],q[1]))continue;const fy=groundH(q[0],q[1]);P.cyl(q[0],fy,q[1],5,5,.5,24,sRGB('#efece4'),7);P.cyl(q[0],fy+.45,q[1],4.7,4.7,.05,24,sRGB('#5ea7b4'),8);P.cyl(q[0],fy,q[1],.6,.45,2.6,10,sRGB('#efece4'),7);STATIC_CIR.push(q[0],q[1],5)}}
   PLACES.push({id:'istanbul',name:'Istanbul Park',sub:'rock fountain and tulips',x:c[0]-14,z:c[1]+22,yaw:Math.atan2(14,-22)})}
  // ---------- City garden + Derybasivska: music fountain, lions, souvenir stalls, cafe terraces, New Year tree ----------
  {const g=[LMK.citygarden.x,LMK.citygarden.y];const gy=groundH(g[0],g[1]);addFlat(g[0],g[1],40,20);
   groundQuad(GR,[[g[0]-55,g[1]-26],[g[0]+55,g[1]-26],[g[0]+55,g[1]+26],[g[0]-55,g[1]+26]],5,gy+.06);
   P.cyl(g[0],gy,g[1],7,7,.6,32,sRGB('#d7d2c6'),7);P.cyl(g[0],gy+.55,g[1],6.6,6.6,.05,32,sRGB('#3d8fa3'),8);STATIC_CIR.push(g[0],g[1],7);
   const jets=[];const jm=new THREE.MeshStandardMaterial({color:0xe8f8ff,transparent:true,opacity:.55,emissive:0x6fb0d0,emissiveIntensity:.3});
   for(let k=0;k<12;k++){const an=k/12*6.283;const j=new THREE.Mesh(new THREE.CylinderGeometry(.06,.18,1,6),jm);j.position.set(g[0]+Math.cos(an)*4.5,gy+.6,g[1]+Math.sin(an)*4.5);j.userData.dyn=true;grp.add(j);jets.push(j)}
   const cj=new THREE.Mesh(new THREE.CylinderGeometry(.12,.35,1,8),jm);cj.position.set(g[0],gy+.6,g[1]);cj.userData.dyn=true;grp.add(cj);jets.push(cj);LIGHT_SIGNS.push(jm);
   ANIM.push(()=>{const t=UNI.uTime.value;jets.forEach((j,i)=>{const h=i===12?4+2.5*Math.sin(t*1.3):1.5+1.2*Math.sin(t*2+i*.8);j.scale.y=h;j.position.y=gy+.6+h/2})});
   // lions
   for(const [x,z] of [[288,-10720],[307,-10718]]){const y=groundH(x,z);P.box(x,y+.5,z,1.6,1,.8,0,sRGB('#8a7f6a'),7);const lm=new THREE.MeshStandardMaterial({color:0x6c6457,roughness:.6,metalness:.3});
     const b=new THREE.Mesh(new THREE.BoxGeometry(1.5,.8,.7),lm);b.position.set(x,y+1.4,z);grp.add(b);const h=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),lm);h.position.set(x+.75,y+1.95,z);grp.add(h)}
   // souvenir stalls (two rows)
   const awn=['#c8372d','#2a62b8','#e8b53a','#3f8a46'].map(sRGB);const r=rng(777);
   for(let k=0;k<10;k++){const x=g[0]-40+k*5.2,z=g[1]+18+(k%2)*.3;const y=groundH(x,z);P.box(x,y+.5,z,2.2,1,1.2,0,sRGB('#6b4a35'),5);P.box(x,y+2.45,z,2.6,.12,1.9,0,awn[k%4],1,.15);
     for(let q=0;q<6;q++)P.box(x-.8+q*.32,y+1.12,z-.2+r()*.4,.22,.24,.18,0,[sRGB('#e8d6a8'),sRGB('#c8372d'),sRGB('#2a62b8'),sRGB('#f4f4f4')][(r()*4)|0],0);
     for(const s of [-1,1])P.box(x+s*1.2,y+1.2,z+.8,.06,2.4,.06,0,sRGB('#333'),1);LOW_OBB.push(x,z,1.2,.7,1,0)}
   for(const p of [[g[0]-20,g[1]-12],[g[0]+20,g[1]-12],[g[0]-20,g[1]+12],[g[0]+20,g[1]+12],[g[0],g[1]-20]])classicLamp(P,p[0],gy,p[1],3);
   for(let k=0;k<8;k++){const an=k/8*6.283;const p=[g[0]+Math.cos(an)*10,g[1]+Math.sin(an)*10];propBench2(P,p[0],gy,p[1],an+Math.PI/2,null)}
   PLACES.push({id:'deriba',name:'Derybasivska St',sub:'City Garden and fountain',x:g[0],z:g[1]+34,yaw:Math.PI});
   if(isNewYear()||S.season==='winter'){const tx=g[0]+30,tz=g[1]-28,ty=groundH(tx,tz);const tm=new THREE.MeshStandardMaterial({color:0x1d4a2c,roughness:.8});
     for(let k=0;k<8;k++){const cone=new THREE.Mesh(new THREE.ConeGeometry(6.5-k*.72,4.2,16),tm);cone.position.set(tx,ty+2.5+k*2.6,tz);grp.add(cone)}
     const top=new THREE.Mesh(new THREE.OctahedronGeometry(1.1),new THREE.MeshStandardMaterial({color:0xffd85a,emissive:0xffc020,emissiveIntensity:1.2}));top.position.set(tx,ty+24,tz);grp.add(top);
     const bm=['#e23a3a','#f2c21b','#3a7be2','#f4f4f4'].map(c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.6,roughness:.3}));const rr=rng(31);
     for(let k=0;k<90;k++){const h=rr()*20,rad=(6.5-h*.28)*.95,an=rr()*6.283;const b=new THREE.Mesh(new THREE.SphereGeometry(.28,8,6),bm[k%4]);b.position.set(tx+Math.cos(an)*rad,ty+2.5+h,tz+Math.sin(an)*rad);grp.add(b)}
     bm.forEach(m=>LIGHT_SIGNS.push(m));STATIC_CIR.push(tx,tz,6.6)}}
  // cafe terraces with low fences along Derybasivska
  {const d=LMK.deriba;const L=Math.hypot(d.x1-d.x0,d.y1-d.y0),tx=(d.x1-d.x0)/L,tz=(d.y1-d.y0)/L,nx=-tz,nz=tx;const fc=sRGB('#2b2b2b'),umb=['#f4f4f0','#b8322a','#2f5a3a','#e8d6a8'].map(sRGB);
   for(let u=60;u<L-40;u+=46){for(const s of [-1,1]){const cx=d.x0+tx*u+nx*s*6.2,cz=d.y0+tz*u+nz*s*6.2;const y=groundH(cx,cz)+.15;const ry=Math.atan2(tx,tz);
     for(const [du,dv,len,rot] of [[0,-1.6,10,0],[-5,0,3.2,1],[5,0,3.2,1]]){const p=[cx+tx*du+nx*s*dv,cz+tz*du+nz*s*dv];P.box(p[0],y+.45,p[1],rot?.06:len,.9,rot?len:.06,ry,fc,1)}
     for(let k=-1;k<=1;k++){const p=[cx+tx*k*3,cz+tz*k*3];P.cyl(p[0],y,p[1],.4,.4,.75,8,sRGB('#e9e4d8'),1);P.cyl(p[0],y+2.1,p[1],1.6,.05,.5,8,umb[(k+s+3)%4],1);P.cyl(p[0],y,p[1],.04,.04,2.2,4,fc,1)}
     LOW_OBB.push(cx,cz,5,1.7,tx,tz)}}}
}
// ---------- 411th battery memorial: exhibits at their real OSM positions ----------
const EX411=[ // [type,x,z,heading]
 ['truckK',-712,1496,2.45],['tank',-637,1459,2.2],['tank',-634,1464,2.2],['tankL',-641,1454,2.2],['truck',-648,1446,2.2],['kitchen',-645,1450,2.2],
 ['plane',-742,1502,2.45],['missile2',-752,1506,2.45],['missile',-737,1492,2.45],['gun',-723,1485,2.45],
 ['gunB',-675,1511,2.45],['gunB',-670,1508,2.45],['gunB',-710,1499,2.45],['gun',-708,1502,2.45],['gun',-705,1505,2.45],['gun',-703,1507,2.45],['gun',-701,1510,2.45],['gunS',-699,1513,2.45],['gun',-697,1516,2.45],
 ['wagon',-739,1535,2.45],['naval',-746,1591,.9],['naval',-751,1594,.9],['naval',-755,1598,.9],['shelter',-760,1603,.9],['range',-766,1607,.9],['torpTube',-798,1634,.9],['bomb',-787,1626,.9],
 ['mine',-834,1663,0],['mine',-842,1669,0],['mine',-850,1675,0],['mine',-805,1640,0],['mine',-813,1647,0],['mine',-859,1683,0],['gun',-860,1630,.9],['gunAA',-845,1620,.9],['pit',-863,1612,.9],
 ['gunAA',-932,1679,.9],['gun',-944,1667,.9],['stele',-798,1614,.9],
 ['gun',-690,1523,2.45],['gun',-685,1526,2.45],['gunB',-679,1530,2.45],['gunAA',-696,1535,2.45],['tank',-662,1493,2.2],['tankL',-657,1499,2.2],['truck',-668,1488,2.2],['missile',-722,1520,2.45],
 ['naval',-772,1580,.9],['naval',-776,1585,.9],['mine',-818,1633,0],['mine',-826,1641,0],['mine',-868,1692,0],['gunAA',-880,1650,.9],['gun',-900,1660,.9],['gun',-910,1672,.9],['bomb',-795,1632,.9],['torpTube',-804,1640,.9]];
function ex411(P,type,x,z,a){const c=Math.cos(a),s=Math.sin(a);const at=(u,v)=>[x+u*c-v*s,z+u*s+v*c];const ry=-a;const y=groundH(x,z);
  const ol=sRGB('#4c5737'),dk=sRGB('#2a2c28'),gr=sRGB('#6d7377'),bk=sRGB('#1b1c1d'),conc=sRGB('#bdb9b0'),wh=sRGB('#e6e6e0');
  const B=(u,v,h,w,hh,d,col,m)=>{const p=at(u,v);P.box(p[0],y+h,p[1],w,hh,d,ry,col,m===undefined?1:m)};
  const bar=(u,v,h,len,r,el,col)=>{const p=at(u,v);P.cyl(p[0],y+h,p[1],r,r*.8,len,8,col||dk,1,0,-Math.PI/2+el,ry)};
  const wheel=(u,v,r,w)=>{const p=at(u,v-w/2);P.cyl(p[0],y+r,p[1],r,r,w,12,bk,4,Math.PI/2,0,ry)};
  const R=[];
  if(type.startsWith('tank')){B(0,0,.78,6.2,.9,2.9,ol);for(const sv of [-1,1])B(0,sv*1.32,.45,6.5,.86,.6,bk,4);const t=at(-.3,0);P.cyl(t[0],y+1.22,t[1],1.25,1.0,.72,12,ol,1);bar(.6,0,1.6,type==='tankL'?2.6:4.6,.1,.05,ol);R.push(3.4)}
  else if(type==='truck'||type==='truckK'||type==='kitchen'){B(0,0,.75,6,.3,1.8,dk);B(2.2,0,1.45,1.6,1.4,2.2,ol);B(-.9,0,1.2,4,.35,2.3,ol);for(const u of [2.2,-.6,-1.9])for(const sv of [-1,1])wheel(u,sv*1.05,.5,.32);
    if(type==='truckK')for(let k=-3;k<=3;k++)bar(-3,k*.28,1.7,4.6,.05,.25,gr);if(type==='kitchen'){const p=at(-1,0);P.cyl(p[0],y+1.4,p[1],.6,.6,1,10,gr,1);P.cyl(p[0],y+2.4,p[1],.1,.1,1,6,bk,1)}R.push(3.2)}
  else if(type.startsWith('gun')){const big=type==='gunB',sm=type==='gunS';const sc=big?1.5:(sm?.7:1);for(const sv of [-1,1])wheel(0,sv*.95*sc,.55*sc,.22);B(.3,0,1.0*sc,.06,1.0*sc,1.9*sc,ol);bar(-.2,0,1.0*sc,3.4*sc,.09*sc,type==='gunAA'?.9:.14,ol);
    for(const sv of [-1,1]){const p=at(-1.7*sc,sv*.4);P.box(p[0],y+.3,p[1],3*sc,.12,.12,ry+sv*.18,ol,1)}R.push(2*sc)}
  else if(type==='naval'){const p=at(0,0);P.cyl(p[0],y,p[1],1.7,1.7,.6,14,conc,9);B(0,0,1.65,3.6,1.9,3.0,gr);bar(1.6,0,2.0,5.6,.14,.08,gr);R.push(2.4)}
  else if(type==='missile'||type==='missile2'){B(0,0,.5,3,1,3,ol);const n=type==='missile2'?2:1;for(let k=0;k<n;k++){const v=n>1?(k?.65:-.65):0;bar(-3,v,1.5,9,.3,.5,wh);bar(-3.1,v,1.45,1.2,.36,.5,gr)}R.push(3)}
  else if(type==='plane'){const p=at(-2.8,0);P.cyl(p[0],y+1.4,p[1],.55,.35,6,10,sRGB('#3d5a34'),1,0,-Math.PI/2,ry);B(.4,0,1.2,1.6,.12,9,sRGB('#3d5a34'));B(-2.6,0,1.9,.8,1.0,.08,sRGB('#3d5a34'));B(-2.6,0,1.45,.7,.08,2.8,sRGB('#3d5a34'));
    const q=at(3.25,0);P.cyl(q[0],y+1.4,q[1],.12,.12,.25,8,bk,1,0,-Math.PI/2,ry);B(3.4,0,1.4,.05,2.1,.15,bk);for(const sv of [-1,1])wheel(.8,sv*1.1,.32,.15);R.push(4.5)}
  else if(type==='wagon'){for(const sv of [-1,1])B(0,sv*.76,.15,16,.15,.08,gr);B(0,0,1.9,12.5,2.4,3,ol);for(const u of [-4.5,-2,2,4.5])B(u,1.52,2.2,.4,.25,.05,bk);R.push(6.5)}
  else if(type==='shelter'){B(0,0,1.2,5,2.4,4,conc,9);B(2.55,0,.9,.1,1.8,1.4,bk);R.push(3)}
  else if(type==='range'){B(0,0,1.3,.8,2.6,.8,gr);B(0,0,2.8,3.8,.5,.6,gr);R.push(1)}
  else if(type==='torpTube'){B(0,0,.5,1.5,1,1.5,gr);bar(-3,0,1.2,6.6,.32,0,gr);R.push(1.5)}
  else if(type==='bomb'){B(0,0,.4,1.2,.8,1.2,gr);bar(0,0,.8,1.6,.25,.7,dk);R.push(1)}
  else if(type==='mine'){const p=at(0,0);P.box(p[0],y+.25,p[1],1.1,.5,1.1,ry,conc,9);P.cyl(p[0],y+.5,p[1],.5,.5,.9,12,bk,1);for(let k=0;k<6;k++){const an=k/6*6.283;P.box(p[0]+Math.cos(an)*.45,y+1.2,p[1]+Math.sin(an)*.45,.08,.25,.08,0,bk,1)}R.push(.9)}
  else if(type==='pit'){const p=at(0,0);for(let k=0;k<16;k++){const an=k/16*6.283;P.box(p[0]+Math.cos(an)*7,y+.5,p[1]+Math.sin(an)*7,2.8,1,.8,-an+Math.PI/2,conc,9)}B(0,0,1.4,4,2.6,4.6,ol);bar(1.8,0,2.2,9,.24,.1,ol)}
  else if(type==='stele'){B(0,0,.3,3,.6,2,conc,9);B(0,0,3,1.2,5,.6,sRGB('#a9a59a'),7);R.push(1.2)}
  return R[0]||0}
function build411(grp,G,P,Sg,GR){
  // exhibit footprints in OSM are mapped as "buildings": keep them out of the generic house generator
  for(const [x,z] of [[-691,1460.7],[-689.5,1460.1],[-632.2,1475.4],[-896.1,1708.3],[-890.2,1703.1],[-829,1658.9],[-820.6,1652.6],[-684.5,1459.1],[-677.4,1453.2],[-640,1454.8]])addBlock(x,z,7,7,0);
  for(const [t,x,z,a] of EX411){const r=ex411(P,t,x,z,a);if(r)STATIC_CIR.push(x,z,r)}
  const M=(c,r,m)=>{const x=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m||0});x.color.convertSRGBToLinear();return x};
  // submarine «Малютка» (black top, red below the waterline) on concrete stands
  {const x=-689.5,z=1460.1,a=2.499;const y=groundH(x,z);const g=capsuleGeo(2.6,64,8,48);g.rotateZ(-Math.PI/2);const pos=g.attributes.position;const col=new Float32Array(pos.count*3);
   const red=new THREE.Color(0x9c2a22).convertSRGBToLinear(),blk=new THREE.Color(0x1c1d20).convertSRGBToLinear();const wht=new THREE.Color(0xe8e8e4).convertSRGBToLinear();for(let i=0;i<pos.count;i++){const yy=pos.getY(i);const c=yy<-.05?red:(yy<.12?wht:blk);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b}
   g.setAttribute('color',new THREE.BufferAttribute(col,3));const hull=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.2}));hull.position.set(x,y+3.7,z);hull.rotation.y=-a;hull.castShadow=true;grp.add(hull);
   const ca=Math.cos(a),sa=Math.sin(a);const at=(u,v)=>[x+u*ca-v*sa,z+u*sa+v*ca];
   {const p=at(4,0);P.box(p[0],y+7.6,p[1],9.5,4.2,2.5,-a,sRGB('#1c1d20'),1);P.box(p[0],y+10.1,p[1],1.6,1.6,.4,-a,sRGB('#1c1d20'),1)}
   {const p=at(0,0);P.box(p[0],y+6.3,p[1],56,.3,2.0,-a,sRGB('#2a2b2e'),1)}
   for(let k=-3;k<=3;k++){const p=at(k*9,0);P.box(p[0],y+.7,p[1],1.6,1.4,4.2,-a,sRGB('#bdb9b0'),9)}
   addOBB(x,z,68,5.6,a);
   const pl=plateMesh(['ПІДВОДНИЙ ЧОВЕН «МАЛЮТКА»'],{w:1024,h:120,size:64,color:'#fff',bg:'#1f3a5f',weight:'700'},3.6,.42);const pp=at(-8,3.6);pl.position.set(pp[0],y+1.2,pp[1]);pl.rotation.y=-a+Math.PI/2*0;pl.lookAt(pp[0]-sa*5,y+1.2,pp[1]+ca*5);grp.add(pl)}
  // armoured train wagon
  {const x=-632.2,z=1475.4,a=-.62;ex411(P,'wagon',x,z,a);addOBB(x,z,13,3.2,a);const ca=Math.cos(a),sa=Math.sin(a);const y=groundH(x,z);P.cyl(x+ca*2,y+3.1,z+sa*2,.9,.8,.6,10,sRGB('#4c5737'),1)}
  // raid minesweeper 729 on blocks
  {const x=-890.2,z=1703.1,a=2.427;const y=groundH(x,z);const sh=buildShip({L:46,W:7.6,decks:1,funnel:0x4e5458,hull:0x6d7377,stripe:0x6d7377,hullH:4.6});sh.position.set(x,y+2.6,z);sh.rotation.y=-a;sh.userData.dyn=true;grp.add(sh);
   const ca=Math.cos(a),sa=Math.sin(a);for(let k=-3;k<=3;k++)P.box(x+ca*k*6.5,y+.8,z+sa*k*6.5,1.5,1.6,4.6,-a,sRGB('#bdb9b0'),9);addOBB(x,z,47,8,a)}
  // anti-torpedo net on posts
  {const x=-820.6,z=1652.6,a=2.464,L=100;const ca=Math.cos(a),sa=Math.sin(a);for(let u=-L/2;u<=L/2;u+=7){const px=x+ca*u,pz=z+sa*u;const y=groundH(px,pz);P.cyl(px,y,pz,.1,.08,3.4,6,sRGB('#3a3c3e'),1);STATIC_CIR.push(px,pz,.2)}
   const net=new THREE.Mesh(new THREE.PlaneGeometry(L,2.6),new THREE.MeshStandardMaterial({color:0x22262a,transparent:true,opacity:.45,side:THREE.DoubleSide,roughness:.9,depthWrite:false}));net.position.set(x,groundH(x,z)+1.9,z);net.rotation.y=-a;grp.add(net)}
  // torpedoes
  for(const [x,z] of [[-684.5,1459.1],[-677.4,1453.2]]){const y=groundH(x,z);const a=2.436;P.cyl(x-Math.cos(a)*3.3,y+.75,z-Math.sin(a)*3.3,.27,.27,6.6,12,sRGB('#7b8288'),6,0,-Math.PI/2,-a);P.box(x,y+.3,z,1.2,.6,.8,-a,sRGB('#bdb9b0'),9)}
  // the yellow-red tram «Слава героям обороны Одессы!» at its real spot
  {const x=-751,z=1523,a=2.45;const y=groundH(x,z);const ca=Math.cos(a),sa=Math.sin(a);
   const tex=(()=>{const cv=txtCanvas(['СЛАВА ГЕРОЯМ ОБОРОНЫ ОДЕССЫ!'],{w:1024,h:256,size:64,color:'#fff',bg:'#c8372d',weight:'800'});const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t})();
   const yel=M(0xe9b62a,.5),side=new THREE.MeshStandardMaterial({map:tex,roughness:.5});
   const body=new THREE.Mesh(new THREE.BoxGeometry(10.5,2.6,2.4),[yel,yel,M(0xd8d4c8,.5),yel,side,side]);body.position.set(x,y+2.2,z);body.rotation.y=-a+Math.PI/2*0;body.rotation.y=-a;grp.add(body);
   P.box(x,y+3.6,z,10.2,.3,2.2,-a,sRGB('#c8c4b8'),1);P.box(x,y+.4,z,9,.4,1.6,-a,sRGB('#2a2a2a'),1);for(const sv of [-1,1])P.box(x-sa*sv*.76,y+.12,z+ca*sv*.76,14,.12,.07,-a,sRGB('#6d6f72'),6);addOBB(x,z,10.6,2.6,a)}
  // memorial plaza: granite plates, a tall obelisk with a star, flag poles, eternal flame
  {const px=-714,pz=1531,y=groundH(px,pz);const R=15;groundQuad(GR,[[px-R,pz-R],[px+R,pz-R],[px+R,pz+R],[px-R,pz+R]],5);TREE_CLEAR.push(px,pz,R+4);
   const gran2=sRGB('#4a4d52'),lim=sRGB('#cfc9ba');
   P.box(px,y+.3,pz,9,.6,9,0,gran2,7);P.box(px,y+.8,pz,6,.4,6,0,gran2,7);P.box(px,y+9,pz,2.2,16,2.2,0,lim,7);P.box(px,y+17.4,pz,1.6,1.6,1.6,.78,lim,7);
   for(let k=0;k<8;k++){const an=k/8*6.283;P.box(px+Math.cos(an)*1.6,y+19.2,pz+Math.sin(an)*1.6,.3,2.6,.1,-an,sRGB('#d8b23a'),1,0)}
   STATIC_CIR.push(px,pz,5);
   for(const sd of [-1,1]){const fx=px+sd*8,fz=pz-7,fy=groundH(fx,fz);P.cyl(fx,fy,fz,.14,.1,11,8,sRGB('#c9ccd0'),6);P.box(fx+.9,fy+10,fz,1.8,1.1,.04,0,sRGB(sd<0?'#2a63c4':'#f6d11c'),0);STATIC_CIR.push(fx,fz,.3)}
   const fl=new THREE.Mesh(new THREE.ConeGeometry(.4,1.2,8),new THREE.MeshBasicMaterial({color:0xffa030,toneMapped:false}));fl.position.set(px+4.6,y+1.5,pz+4.6);fl.userData.dyn=true;grp.add(fl);ANIM.push(()=>{fl.scale.y=1+.2*Math.sin(UNI.uTime.value*9)});EXTRA_LAMPS.push([px+4.6,y+2,pz+4.6,1.5]);
   const wall=plateMesh(['411-а БАТАРЕЯ','ПАМ’ЯТАЄМО ЗАХИСНИКІВ ОДЕСИ · 1941'],{w:1024,h:256,sizes:[100,52],color:'#f1ece0',bg:'#3a3d42',weight:'800'},9,2.25,.1);wall.position.set(px,y+2.6,pz-4.65);wall.rotation.y=0;grp.add(wall);
   for(const k of [-1,1])classicLamp(P,px+k*12,groundH(px+k*12,pz+12),pz+12,2);
   propBench2(P,px-11,groundH(px-11,pz),pz,Math.PI/2,HOME_BENCHES);propBench2(P,px+11,groundH(px+11,pz),pz,-Math.PI/2,HOME_BENCHES)}
  const sp=[-722,1548];PLACES.push({id:'b411',name:'411th Battery',sub:'Defence of Odesa memorial',x:sp[0],z:sp[1],yaw:Math.atan2(-689.5-sp[0],1460-sp[1])});
}
