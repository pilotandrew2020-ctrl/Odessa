// ===================== Морвокзал: sea terminal, Hotel «Одеса», pier, ships, Golden Child =====================
function windowRowsTex(o){const W=512,H=512,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.fillStyle=o.bg;x.fillRect(0,0,W,H);
  const rows=o.rows,cols=o.cols;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const lit=Math.random()<(o.lit||0);x.fillStyle=lit?'#ffe2a8':(o.win||'#22313c');const w=W/cols,h=H/rows;x.fillRect(c*w+w*(o.mx||.12),r*h+h*(o.my||.25),w*(1-2*(o.mx||.12)),h*(1-(o.my||.25)*1.6))}
  if(o.band){x.fillStyle=o.band;for(let r=0;r<rows;r++)x.fillRect(0,r*H/rows,W,2)}
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t}
function texBox(grp,x,y,z,w,h,d,ry,tex,repU,repV,plain,emis){const g=new THREE.BoxGeometry(w,h,d);const uv=g.attributes.uv,n=g.attributes.normal;
  for(let i=0;i<uv.count;i++){const sx=Math.abs(n.getX(i))>.5?d:w;uv.setXY(i,uv.getX(i)*sx/repU,uv.getY(i)*h/repV)}
  const m=new THREE.MeshStandardMaterial({map:tex,roughness:.35,metalness:.1});if(emis){m.emissive=new THREE.Color(1,1,1);m.emissiveMap=tex;m.emissiveIntensity=0;LIGHT_SIGNS.push(m)}
  const mats=[m,m,plain,plain,m,m];const mesh=new THREE.Mesh(g,mats);mesh.position.set(x,y+h/2,z);mesh.rotation.y=ry;mesh.castShadow=mesh.receiveShadow=true;grp.add(mesh);return mesh}
function buildShip(o){ // o: L,W,decks,col,hull
  const g=new THREE.Group();const L=o.L,W=o.W;
  const sh=new THREE.Shape();sh.moveTo(-L/2,-W/2);sh.lineTo(L/2-L*.12,-W/2);sh.quadraticCurveTo(L/2,-W*.2,L/2+L*.02,0);sh.quadraticCurveTo(L/2,W*.2,L/2-L*.12,W/2);sh.lineTo(-L/2,W/2);sh.lineTo(-L/2,-W/2);
  const hull=new THREE.ExtrudeGeometry(sh,{depth:o.hullH||7,bevelEnabled:false});hull.rotateX(-Math.PI/2);hull.translate(0,-2.5,0);
  const hm=new THREE.Mesh(hull,new THREE.MeshStandardMaterial({color:o.hull||0xf4f4f2,roughness:.4}));hm.castShadow=true;g.add(hm);
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(L*.86,.5,W+.05),new THREE.MeshStandardMaterial({color:o.stripe||0x1d4f91,roughness:.4}));stripe.position.set(-L*.04,(o.hullH||7)-3.3,0);g.add(stripe);
  const dt=windowRowsTex({bg:'#f2f2ef',rows:1,cols:24,win:'#1a2630',lit:.35,my:.3});
  let y=(o.hullH||7)-2.5;for(let k=0;k<o.decks;k++){const dl=L*(.78-k*.08),dw=W*(.9-k*.05),h=2.7;const plain=new THREE.MeshStandardMaterial({color:0xf2f2ef,roughness:.5});
    const m=texBox(g,-L*.05-k*1.5,y,0,dl,h,dw,0,dt,8,h,plain,true);y+=h}
  const fun=new THREE.Mesh(new THREE.CylinderGeometry(1.6,2,5,14),new THREE.MeshStandardMaterial({color:o.funnel||0x1d4f91,roughness:.4}));fun.scale.z=.6;fun.position.set(-L*.22,y+2.4,0);g.add(fun);
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,7,6),new THREE.MeshStandardMaterial({color:0xdddddd}));mast.position.set(L*.18,y+3,0);g.add(mast);
  return g}
let PORT=null;
function buildPort(grp,G,P,Sg,GR){
  const mv=LMK.morvokzal,ht=LMK.hotel;const a=mv.a;const F=frame(mv.x,mv.y,a);   // +u towards the shore (SW), -u towards the sea
  const yP=SL+2.6;PORT={F,yP};
  // flat pier deck with quay walls
  addFlatRect(...F.P(-90,0),a,320,92,1.2,yP);
  for(const s of [-1,1]){const c=F.P(-90,s*46);P.box(c[0],SL-1,c[1],320,7.2,1.2,-a,sRGB('#8f8a7e'),9);for(let u=-245;u<60;u+=12){const b=F.P(u,s*46.4);P.cyl(b[0],yP,b[1],.28,.22,.6,8,sRGB('#2b2b2b'),1)}}
  {const c=F.P(-250,0);P.box(c[0],SL-1,c[1],1.2,7.2,93,-a,sRGB('#8f8a7e'),9)}
  groundQuad(GR,[F.P(-250,-46),F.P(66,-46),F.P(66,46),F.P(-250,46)],8,yP+.05,a);
  addBlock(...F.P(-90,0),320,94,a);
  // sea terminal: glazed hall, cream panels, rooftop pavilions and the name
  {const plain=new THREE.MeshStandardMaterial({color:0xd9cdb3,roughness:.7});
   const glass=windowRowsTex({bg:'#9fb0b8',rows:4,cols:16,win:'#3c4f5c',lit:.15,mx:.04,my:.06,band:'#e6e2d6'});
   const c=F.P(0,0);texBox(grp,c[0],yP,c[1],110,15,38,-a,glass,7,15,plain,true);
   const t2=F.P(0,0);P.box(t2[0],yP+15.6,t2[1],100,1.2,34,-a,sRGB('#d8ccb2'),9);
   for(const du of [-34,0,34]){const p=F.P(du,0);P.box(p[0],yP+18.5,p[1],16,5,14,-a,sRGB('#cbb98f'),9)}
   const cv=txtCanvas(['МОРСЬКИЙ ВОКЗАЛ'],{w:2048,h:220,size:170,color:'#e0322a',weight:'800'});const tx=new THREE.CanvasTexture(cv);tx.encoding=THREE.sRGBEncoding;
   const nm=new THREE.Mesh(new THREE.PlaneGeometry(22,3.2),new THREE.MeshStandardMaterial({map:tx,transparent:true,alphaTest:.3,emissive:0xff3020,emissiveMap:tx,emissiveIntensity:0}));LIGHT_SIGNS.push(nm.material);
   const np=F.P(56.2,0);nm.position.set(np[0],yP+19,np[1]);nm.rotation.y=-a+Math.PI/2;grp.add(nm);
   addOBB(c[0],c[1],110,38,a);
   for(const s of [-1,1]){const p=F.P(56,s*14);const fp=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,10,6),new THREE.MeshStandardMaterial({color:0xcccccc}));fp.position.set(p[0],yP+20,p[1]);grp.add(fp)}}
  // Hotel «Одеса»: blue glass tower between two white slabs, podium with glass pyramids
  {const H=frame(ht.x,ht.y,a);const plainW=new THREE.MeshStandardMaterial({color:0xf0efea,roughness:.5});
   const blue=windowRowsTex({bg:'#1f4f9c',rows:24,cols:8,win:'#2d63c4',lit:.2,mx:.02,my:.06,band:'#183f80'});
   const white=windowRowsTex({bg:'#efeee8',rows:20,cols:3,win:'#3a4a58',lit:.25,mx:.3,my:.25});
   const c=H.P(-4,0);texBox(grp,c[0],yP,c[1],20,82,20,-a,blue,10,14,new THREE.MeshStandardMaterial({color:0x1f4f9c,roughness:.2,metalness:.3}),true);
   const sA=H.P(-4,-15),sB=H.P(-4,15);texBox(grp,sA[0],yP,sA[1],26,70,9,-a,white,13,17,plainW,true);texBox(grp,sB[0],yP,sB[1],22,62,9,-a,white,11,15,plainW,true);
   const pod=H.P(8,0);P.box(pod[0],yP+6,pod[1],30,12,44,-a,sRGB('#e7e3d8'),9);
   for(const dv of [-12,12]){const q=H.P(18,dv);const pyr=new THREE.Mesh(new THREE.ConeGeometry(7,6,4),new THREE.MeshStandardMaterial({color:0x9ec3d6,roughness:.05,metalness:.3,transparent:true,opacity:.75}));pyr.position.set(q[0],yP+12+3,q[1]);pyr.rotation.y=-a+Math.PI/4;grp.add(pyr)}
   const letter=(txt,v,y,w)=>{const cv=txtCanvas([txt],{w:1024,h:180,size:150,color:'#ff3b2f',weight:'800'});const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;
     const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.18),new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.3,emissive:0xff3020,emissiveMap:t,emissiveIntensity:0}));LIGHT_SIGNS.push(m.material);
     const p=H.P(9.1,v);m.position.set(p[0],yP+y,p[1]);m.rotation.y=-a+Math.PI/2;grp.add(m)};
   letter('HOTEL',-15,66,14);letter('ODESSA',15,58,14);
   const cn=H.P(26,0);P.box(cn[0],yP+5.5,cn[1],14,.4,16,-a,sRGB('#2a4f8c'),1);
   addOBB(...H.P(4,0),36,46,a);
   {const sp=F.P(63,-34),hc=H.P(-4,0);PLACES.push({id:'morvokzal',name:'Sea Terminal',sub:'Hotel “Odesa” and the piers',x:sp[0],z:sp[1],yaw:Math.atan2(hc[0]-sp[0],hc[1]-sp[1]),r:200})}}
  // ships moored along the pier
  const ships=[{L:132,W:18,decks:6,funnel:0x1d4f91,hull:0xf5f5f2,u:-70,s:1},{L:105,W:15,decks:4,funnel:0xc8372d,hull:0xf2f2ef,u:-60,s:-1},{L:68,W:12,decks:3,funnel:0x2a7a5a,hull:0x2a3a4a,stripe:0xf2f2f2,u:20,s:-1}];
  for(const o of ships){const sh=buildShip(o);const c=F.P(o.u,o.s*(46+o.W/2+2.5));sh.position.set(c[0],SL,c[1]);sh.rotation.y=-a;sh.userData.dyn=true;grp.add(sh);
    const ph=Math.random()*6;ANIM.push(()=>{const t=UNI.uTime.value;sh.position.y=SL+Math.sin(t*.6+ph)*.12;sh.rotation.z=Math.sin(t*.45+ph)*.006});addOBB(c[0],c[1],o.L,o.W,a)}
  // Golden Child: a golden ring with a child figure on a globe
  {const gc=[LMK.goldchild.x,LMK.goldchild.y];const gy=Math.max(groundH(gc[0],gc[1]),yP);const gold=new THREE.MeshStandardMaterial({color:0xd8ac3e,roughness:.25,metalness:.9});
   P.cyl(gc[0],gy,gc[1],1.6,1.4,2.2,16,sRGB('#9c968a'),7);const ball=new THREE.Mesh(new THREE.SphereGeometry(1.0,20,14),gold);ball.position.set(gc[0],gy+3.2,gc[1]);grp.add(ball);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(3.4,.22,10,48),gold);ring.position.set(gc[0],gy+6.3,gc[1]);ring.rotation.y=-a+Math.PI/2;grp.add(ring);
   const kid=new THREE.Mesh(new THREE.CylinderGeometry(.35,.45,1.6,10),gold);kid.position.set(gc[0],gy+5.0,gc[1]);grp.add(kid);const head=new THREE.Mesh(new THREE.SphereGeometry(.32,12,10),gold);head.position.set(gc[0],gy+6.1,gc[1]);grp.add(head);
   for(const s of [-1,1]){const arm=new THREE.Mesh(new THREE.BoxGeometry(.14,1.2,.14),gold);arm.position.set(gc[0]+Math.cos(-a)*s*.5,gy+6.3,gc[1]+Math.sin(-a)*s*.5);arm.rotation.z=s*.9;grp.add(arm)}
   STATIC_CIR.push(gc[0],gc[1],1.8)}
  // port cranes along the quay to the south-east
  const craneM=new THREE.MeshStandardMaterial({color:0xc8372d,roughness:.6}),craneB=new THREE.MeshStandardMaterial({color:0x2b5aa8,roughness:.6});
  for(let k=0;k<6;k++){const c=F.P(40-k*28,-140);const gy=groundH(c[0],c[1]);if(gy<SL+.5)continue;const g=new THREE.Group();const m=k%2?craneM:craneB;
    for(const [dx,dz] of [[-4,-4],[4,-4],[-4,4],[4,4]]){const l=new THREE.Mesh(new THREE.BoxGeometry(.6,22,.6),m);l.position.set(dx,11,dz);g.add(l)}
    const top=new THREE.Mesh(new THREE.BoxGeometry(10,4,10),m);top.position.y=24;g.add(top);const boom=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,36),m);boom.position.set(0,26,-12);boom.rotation.x=-.35;g.add(boom);
    g.position.set(c[0],gy,c[1]);g.rotation.y=-a;grp.add(g)}
}
