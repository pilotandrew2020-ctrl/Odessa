// ===================== Одеса-Головна: railway station, square, platforms, trains =====================
// classical facade bay painted on a canvas (pilasters, arched / framed windows, cornices, balustrade)
function classicBayTex(o){
  const W=256,H=Math.round(256*o.h/o.w),cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');const s=W/o.w;
  const wall=o.wall||'#e7dabf',light=o.light||'#f4ecdc',shade=o.shade||'#cbb995',glass=o.glass||'#2b3b48';
  x.fillStyle=wall;x.fillRect(0,0,W,H);const Y=m=>H-m*s;   // metres from bottom
  // rusticated ground floor
  const gf=o.gf||5.2;x.fillStyle=shade;for(let yy=0;yy<gf;yy+=.55){x.fillRect(0,Y(yy)-1,W,2)}
  // pilasters
  x.fillStyle=light;x.fillRect(0,Y(o.h-1.6),W*.07,(o.h-1.6)*s);x.fillRect(W*.93,Y(o.h-1.6),W*.07,(o.h-1.6)*s);
  // cornices
  const band=(m,h,c)=>{x.fillStyle=c||light;x.fillRect(0,Y(m+h),W,h*s)};
  band(gf,.35);band(o.h-2.2,.55);x.fillStyle=shade;x.fillRect(0,Y(o.h-2.2)-2,W,3);
  // windows
  const win=(cx,y0,w,h,arch)=>{x.fillStyle=light;x.beginPath();x.rect((cx-w/2-.18)*s,Y(y0+h+.18),(w+.36)*s,(h+.18)*s);if(arch)x.arc(cx*s,Y(y0+h),(w/2+.18)*s,Math.PI,0);x.fill();
    const g=x.createLinearGradient(0,Y(y0+h),0,Y(y0));g.addColorStop(0,'#6d8597');g.addColorStop(.5,glass);g.addColorStop(1,'#1d2a33');x.fillStyle=g;x.beginPath();x.rect((cx-w/2)*s,Y(y0+h),w*s,h*s);if(arch)x.arc(cx*s,Y(y0+h),w/2*s,Math.PI,0);x.fill();
    x.strokeStyle='rgba(235,228,210,.95)';x.lineWidth=Math.max(1.5,.07*s);x.beginPath();x.moveTo(cx*s,Y(y0));x.lineTo(cx*s,Y(y0+h+(arch?w/2:0)));for(let k=1;k<4;k++){const yy=y0+h*k/4;x.moveTo((cx-w/2)*s,Y(yy));x.lineTo((cx+w/2)*s,Y(yy))}x.stroke()};
  const mid=o.w/2;
  win(mid,1.0,o.gw||2.0,gf-2.4,true);
  if(o.upper!==false){const uw=o.uw||1.6,uh=o.uh||2.6,uy=gf+1.0;win(mid,uy,uw,uh,o.uarch);x.fillStyle=light;x.beginPath();x.moveTo((mid-uw/2-.4)*s,Y(uy+uh+.35));x.lineTo(mid*s,Y(uy+uh+1.0));x.lineTo((mid+uw/2+.4)*s,Y(uy+uh+.35));x.fill();
    if(o.round){x.fillStyle=light;x.beginPath();x.arc(mid*s,Y(o.h-3.1),.75*s,0,6.283);x.fill();x.fillStyle=glass;x.beginPath();x.arc(mid*s,Y(o.h-3.1),.55*s,0,6.283);x.fill()}}
  // balustrade
  if(o.bal!==false){band(o.h-1.6,.25);band(o.h-.25,.25);x.fillStyle=light;for(let k=0;k<6;k++){const bx=(k+.5)*o.w/6;x.fillRect((bx-.13)*s,Y(o.h-.25),.26*s,1.35*s)}x.fillStyle=wall;for(let k=0;k<6;k++){const bx=(k+.5)*o.w/6;x.fillRect((bx-.05)*s,Y(o.h-.6),.1*s,.6*s)}}
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.wrapS=THREE.RepeatWrapping;t.anisotropy=8;return t;
}
// box with a facade texture on the long sides (u repeats every bay)
function facadeBox(grp,F,y0,u0,u1,v0,v1,h,tex,bayW,plain,ry0){
  const geo=new THREE.BoxGeometry(u1-u0,h,v1-v0);const uv=geo.attributes.uv;const pos=geo.attributes.position;const nrm=geo.attributes.normal;
  for(let i=0;i<uv.count;i++){const nx=nrm.getX(i),nz=nrm.getZ(i);const px=pos.getX(i),pz=pos.getZ(i),py=pos.getY(i);
    let u=Math.abs(nz)>.5?(px+(u1-u0)/2)/bayW:(pz+(v1-v0)/2)/bayW;if(nz<0||nx>0)u=-u;uv.setXY(i,u,(py+h/2)/h)}
  const mats=[];for(let k=0;k<6;k++)mats.push(k===2||k===3?plain:new THREE.MeshStandardMaterial({map:tex,roughness:.82}));
  const m=new THREE.Mesh(geo,mats);const c=F.P((u0+u1)/2,(v0+v1)/2);m.position.set(c[0],y0+h/2,c[1]);m.rotation.y=-Math.atan2(F.sa,F.ca);m.castShadow=m.receiveShadow=true;grp.add(m);return m}
let STATION=null;
function buildStation(grp,G,P,Sg,GR){
  const poly=LMK.station.poly;const a=Math.atan2(-8839+8851,825-721);const F=frame(721,-8851,a);   // u: east along the front, v: south towards the tracks
  const y0=groundH(...F.P(52,15));STATION={F,y0};
  addBlock(...F.P(52,10),120,48,a);addBlock(...F.P(-1,60),36,100,a);
  const cream='#e8dbbf';const plain=new THREE.MeshStandardMaterial({color:0xcfc2a6,roughness:.85});
  const roofM=new THREE.MeshStandardMaterial({color:0x8d9396,roughness:.5,metalness:.35});
  const texW=classicBayTex({w:5,h:15,gf:6.2,wall:cream});const texR=classicBayTex({w:7.5,h:19.5,gf:9,gw:3.6,uw:2.2,uh:3.8,uarch:true,round:true,wall:cream});
  // side wings (2 storeys + balustrade)
  facadeBox(grp,F,y0,0,23,2,34,15,texW,5,plain);facadeBox(grp,F,y0,82,105,2,34,15,texW,5,plain);
  // risalits next to the centre
  facadeBox(grp,F,y0,23,37,0,35,19.5,texR,7,plain);facadeBox(grp,F,y0,68,82,0,35,19.5,texR,7,plain);
  // centre block: three huge arches between paired columns, hall behind
  const C0=37,C1=68,CH=23.5;
  {const hall=new THREE.MeshStandardMaterial({color:0xe2d4b6,roughness:.85,side:THREE.DoubleSide});
   const wall=(ua,ub,va,vb,ya,yb,m)=>{const g=new THREE.BoxGeometry(Math.max(.05,ub-ua),yb-ya,Math.max(.05,vb-va));const mm=new THREE.Mesh(g,m||hall);const c=F.P((ua+ub)/2,(va+vb)/2);mm.position.set(c[0],y0+(ya+yb)/2,c[1]);mm.rotation.y=-a;mm.castShadow=mm.receiveShadow=true;grp.add(mm);return mm};
   // front & back walls with 3 arches each (arch openings glazed; centre arch has doors at ground)
   const archTex=(()=>{const cv=document.createElement('canvas');cv.width=512;cv.height=512;const x=cv.getContext('2d');x.fillStyle=cream;x.fillRect(0,0,512,512);
     const s=512/31;const Y=m=>512-m*s;const arch=(cx)=>{const w=6.6,y0b=2.2,h=10.5;x.fillStyle='#f3ead8';x.beginPath();x.rect((cx-w/2-.5)*s,Y(y0b+h),(w+1)*s,h*s);x.arc(cx*s,Y(y0b+h),(w/2+.5)*s,Math.PI,0);x.fill();
       const g=x.createLinearGradient(0,Y(y0b+h+w/2),0,Y(y0b));g.addColorStop(0,'#7b93a4');g.addColorStop(.6,'#2a3a46');g.addColorStop(1,'#161f26');x.fillStyle=g;x.beginPath();x.rect((cx-w/2)*s,Y(y0b+h),w*s,h*s);x.arc(cx*s,Y(y0b+h),w/2*s,Math.PI,0);x.fill();
       x.strokeStyle='#e9e1cf';x.lineWidth=3;x.beginPath();for(let k=1;k<6;k++){const xx=cx-w/2+w*k/6;x.moveTo(xx*s,Y(y0b));x.lineTo(xx*s,Y(y0b+h+Math.sqrt(Math.max(0,(w/2)**2-(xx-cx)**2))))}for(let k=1;k<7;k++){const yy=y0b+h*k/7;x.moveTo((cx-w/2)*s,Y(yy));x.lineTo((cx+w/2)*s,Y(yy))}x.stroke();
       x.fillStyle='#5b3a22';x.fillRect((cx-1.4)*s,Y(y0b+.0+3.6),2.8*s,3.6*s);x.fillStyle='#c79c4c';x.fillRect((cx-.05)*s,Y(3.6+2.2),.1*s,3.6*s)};
     arch(5.2);arch(15.5);arch(25.8);x.fillStyle='#f3ead8';x.fillRect(0,Y(19),512,.8*s);x.fillRect(0,Y(23.5),512,.5*s);
     x.fillStyle='#fff';x.beginPath();x.arc(15.5*s,Y(20.6),.9*s,0,6.283);x.fill();x.strokeStyle='#333';x.lineWidth=3;x.beginPath();x.moveTo(15.5*s,Y(20.6));x.lineTo(15.5*s,Y(21.2));x.moveTo(15.5*s,Y(20.6));x.lineTo(15.9*s,Y(20.6));x.stroke();
     x.fillStyle='#9a8f78';x.font=`700 ${(.7*s)|0}px Georgia,serif`;x.textAlign='center';x.fillText('1905',5.2*s,Y(17.6));x.fillText('1917',15.5*s,Y(17.6));x.fillText('1944',25.8*s,Y(17.6));
     const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t})();
   const front=new THREE.Mesh(new THREE.PlaneGeometry(C1-C0,CH),new THREE.MeshStandardMaterial({map:archTex,roughness:.8}));
   for(const [vv,rot] of [[-.02,Math.PI],[33.02,0]]){const m=front.clone();const c=F.P((C0+C1)/2,vv);m.position.set(c[0],y0+CH/2,c[1]);m.rotation.y=-a+rot;grp.add(m)}
   for(const uu of [C0,C1])wall(uu-.4,uu+.4,0,33,0,CH,plain);
   wall(C0,C1,0,33,CH-.4,CH,plain);   // flat roof under the drum
   // paired corinthian columns on the front (4 pairs) + entablature
   const colM=new THREE.MeshStandardMaterial({color:0xefe6d2,roughness:.7});
   for(const uu of [C0+.4,C0+10.6,C0+20.9,C1-.4]){for(const dv of [-.9,.9]){const p=F.P(uu+dv*.6,-1.3);const c=new THREE.Mesh(new THREE.CylinderGeometry(.55,.62,17,14),colM);c.position.set(p[0],y0+1.2+8.5,p[1]);c.castShadow=true;grp.add(c);
     const cap=new THREE.Mesh(new THREE.BoxGeometry(1.5,.9,1.5),colM);cap.position.set(p[0],y0+18.6,p[1]);cap.rotation.y=-a;grp.add(cap);const base=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.2,1.5),colM);base.position.set(p[0],y0+.6,p[1]);base.rotation.y=-a;grp.add(base)}}
   wall(C0-1,C1+1,-2.6,0,19,20.6,colM);wall(C0-1,C1+1,-2.8,0,20.6,21.2,colM);
   // steps to the square
   for(let k=0;k<5;k++)wall(C0-2,C1+2,-4.2-k*.4,-2.6,0,.2*(5-k),new THREE.MeshStandardMaterial({color:0xb7b0a2,roughness:.8}));
   // drum + dome + lantern + flag
   const dc=F.P((C0+C1)/2,16.5);
   {const drumTex=(()=>{const cv=document.createElement('canvas');cv.width=1024;cv.height=128;const x=cv.getContext('2d');x.fillStyle='#ece2cb';x.fillRect(0,0,1024,128);for(let k=0;k<24;k++){const cx=(k+.5)*1024/24;x.fillStyle='#f6efe0';x.fillRect(cx-16,10,32,108);x.fillStyle='#2c3a44';x.beginPath();x.rect(cx-11,40,22,62);x.arc(cx,40,11,Math.PI,0);x.fill()}x.fillStyle='#d9ccb0';x.fillRect(0,0,1024,8);x.fillRect(0,118,1024,10);const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t})();
    const drum=new THREE.Mesh(new THREE.CylinderGeometry(9.6,9.6,6.5,48,1,true),new THREE.MeshStandardMaterial({map:drumTex,roughness:.8,side:THREE.DoubleSide}));drum.position.set(dc[0],y0+CH+3.25,dc[1]);grp.add(drum);
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(10.3,10.3,.9,48),plain);ring.position.set(dc[0],y0+CH+6.9,dc[1]);grp.add(ring);
    const dome=new THREE.Mesh(new THREE.SphereGeometry(9.8,48,18,0,Math.PI*2,0,Math.PI/2),roofM);dome.scale.y=.62;dome.position.set(dc[0],y0+CH+7.3,dc[1]);dome.castShadow=true;grp.add(dome);
    for(let k=0;k<24;k++){const an=k/24*Math.PI*2;const rib=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,9.6),new THREE.MeshStandardMaterial({color:0xc9ced0,roughness:.4,metalness:.5}));rib.position.set(dc[0]+Math.cos(an)*4.8,y0+CH+7.3+4.2,dc[1]+Math.sin(an)*4.8);rib.rotation.y=-an+Math.PI/2;rib.rotation.x=0;rib.lookAt(dc[0],y0+CH+7.3+6.1,dc[1]);grp.add(rib)}
    const lan=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.6,2.6,16),plain);lan.position.set(dc[0],y0+CH+14.6,dc[1]);grp.add(lan);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(1.5,16,8,0,Math.PI*2,0,Math.PI/2),roofM);cap.position.set(dc[0],y0+CH+15.9,dc[1]);grp.add(cap);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,9,8),new THREE.MeshStandardMaterial({color:0xcccccc,metalness:.6,roughness:.3}));pole.position.set(dc[0],y0+CH+21,dc[1]);grp.add(pole);
    const fl=(()=>{const cv=document.createElement('canvas');cv.width=64;cv.height=44;const x=cv.getContext('2d');x.fillStyle='#1f5fbf';x.fillRect(0,0,64,22);x.fillStyle='#ffd21f';x.fillRect(0,22,64,22);const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t})();
    const flag=new THREE.Mesh(new THREE.PlaneGeometry(4.2,2.8,12,1),new THREE.MeshStandardMaterial({map:fl,side:THREE.DoubleSide,roughness:.8}));flag.position.set(dc[0]+2.2,y0+CH+24,dc[1]);grp.add(flag);flag.userData.dyn=true;
    const fp=flag.geometry.attributes.position,fx0=Float32Array.from(fp.array);ANIM.push(()=>{const t=UNI.uTime.value;for(let i=0;i<fp.count;i++){const xx=fx0[i*3];fp.setZ(i,Math.sin(xx*1.6-t*4)*.25*(xx+2.1)/4.2)}fp.needsUpdate=true})}
   // sculpture group on the front attic (stylised: worker, soldier, woman with banner)
   {const st=new THREE.MeshStandardMaterial({color:0x9a9a94,roughness:.7});const ped=F.P((C0+C1)/2,-.4);const base=new THREE.Mesh(new THREE.BoxGeometry(9,2.2,3),st);base.position.set(ped[0],y0+CH+1.1,ped[1]);base.rotation.y=-a;grp.add(base);
    for(const [du,h,arm] of [[-2.6,3.6,.3],[0,4.2,1],[2.6,3.6,.3]]){const p=F.P((C0+C1)/2+du,-.4);const body=new THREE.Mesh(new THREE.CylinderGeometry(.45,.7,h,8),st);body.position.set(p[0],y0+CH+2.2+h/2,p[1]);grp.add(body);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.38,10,8),st);head.position.set(p[0],y0+CH+2.2+h+.35,p[1]);grp.add(head);const a2=new THREE.Mesh(new THREE.BoxGeometry(.25,1.8,.25),st);a2.position.set(p[0],y0+CH+2.2+h-.2+arm*.6,p[1]);a2.rotation.z=du*.12;grp.add(a2)}}
   // "ВОКЗАЛ" letters on both risalits (front) and the greeting on the back
   const letters=(txt,u,v,y,w,h,rot,col)=>{const cv=txtCanvas([txt],{w:1024,h:180,size:150,color:col||'#2a54c8',weight:'800'});const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;
     const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.3,roughness:.5,emissive:0x3a6cff,emissiveMap:t,emissiveIntensity:.0}));const c=F.P(u,v);m.position.set(c[0],y0+y,c[1]);m.rotation.y=-a+rot;grp.add(m);LIGHT_SIGNS.push(m.material);return m};
   letters('ВОКЗАЛ',30,-.3,21.2,11,1.9,Math.PI);letters('ВОКЗАЛ',75,-.3,21.2,11,1.9,Math.PI);
   letters('ЛАСКАВО ПРОСИМО В МІСТО-ГЕРОЙ ОДЕСУ!',52.5,35.4,20.6,52,2.2,0);
   // hall interior: marble floor, chandeliers, benches, ticket windows, departures board
   groundQuad(GR,[F.P(C0+.4,0),F.P(C1-.4,0),F.P(C1-.4,33),F.P(C0+.4,33)],6,y0+.12);
   wall(C0+.4,C1-.4,.3,.35,0,CH-.5,hall);wall(C0+.4,C1-.4,32.65,32.7,0,CH-.5,hall);wall(C0+.4,C1-.4,0,33,CH-.6,CH-.45,new THREE.MeshStandardMaterial({color:0xf0e6cf,roughness:.8,side:THREE.DoubleSide}));
   for(const vv of [10,22])for(const uu of [C0+8,C1-8]){const p=F.P(uu,vv);miniChandelier(grp,{gold:new THREE.MeshStandardMaterial({color:0xd0a645,roughness:.32,metalness:.85}),crystal:new THREE.MeshStandardMaterial({color:0xfff4d8,emissive:0xffd890,emissiveIntensity:2.2})},p[0],y0+CH-4,p[1])}
   for(const vv of [12,16,20])for(const uu of [C0+6,C0+12,C1-12,C1-6]){const p=F.P(uu,vv);propBench2(P,p[0],y0+.12,p[1],-a+Math.PI/2,null)}
   {const b=(()=>{const cv=document.createElement('canvas');cv.width=1024;cv.height=512;const x=cv.getContext('2d');x.fillStyle='#0b0e13';x.fillRect(0,0,1024,512);x.fillStyle='#ffd14a';x.font='700 44px "Golos Text",Arial';x.fillText('ВІДПРАВЛЕННЯ',40,64);
     const rows=[['086','КИЇВ','22:15','5'],['146','ЛЬВІВ','23:40','3'],['6311','ПОДІЛЬСЬК','07:12','8'],['6403','ЧОРНОМОРСЬК','07:48','6'],['105','ХАРКІВ','17:25','2'],['6011','ВИЛКОВЕ','09:30','7']];
     x.font='600 36px "Golos Text",Arial';rows.forEach((r2,i)=>{x.fillStyle=i%2?'#e9edf2':'#ffffff';x.fillText(r2[0],40,130+i*60);x.fillText(r2[1],180,130+i*60);x.fillStyle='#7ee08a';x.fillText(r2[2],700,130+i*60);x.fillStyle='#ffd14a';x.fillText(r2[3],900,130+i*60)});
     const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t})();
    const m=new THREE.Mesh(new THREE.PlaneGeometry(9,4.5),new THREE.MeshBasicMaterial({map:b,toneMapped:false}));const p=F.P((C0+C1)/2,32.5);m.position.set(p[0],y0+9,p[1]);m.rotation.y=-a+Math.PI;grp.add(m)}
   for(let k=0;k<6;k++){const p=F.P(C0+3+k*5,2.2);P.box(p[0],y0+1.3,p[1],3,2.6,.9,-a,sRGB('#6b4a35'),5);const q=F.P(C0+3+k*5,1.75);P.box(q[0],y0+1.6,q[1],1.6,1.0,.05,-a,sRGB('#c6d8e4'),2)}
   // colliders: walls with door gaps in the arches
   const seg=(ua,va,ub,vb,y1)=>{const p=F.P(ua,va),q=F.P(ub,vb);wallSeg(p[0],p[1],q[0],q[1],.6,y0-2,y0+(y1||30))};
   for(const vv of [0,33]){seg(C0,vv,(C0+C1)/2-1.6,vv);seg((C0+C1)/2+1.6,vv,C1,vv)}
   seg(C0,0,C0,33);seg(C1,0,C1,33);
   const lights=[];const pl=(u,v,yy,c,i,d)=>{const l=new THREE.PointLight(c,0,d,1.5);const p=F.P(u,v);l.position.set(p[0],y0+yy,p[1]);l.userData.i=i;grp.add(l);lights.push(l)};
   pl((C0+C1)/2,16,CH-5,0xffe7c4,2.2,40);
   INDOORS.push({name:'station',title:'Railway Station',sub:'main hall',floor:'marble',exp:1.0,lights,test:(x,z,y)=>{const [u,v]=F.inv(x,z);return u>C0&&u<C1&&v>0&&v<33&&y<y0+10},ceil:()=>y0+CH-1});
   SPECIAL.push((x,z)=>{const [u,v]=F.inv(x,z);if(u>C0-2&&u<C1+2&&v>-4.2&&v<-2.6){const k=Math.min(4,Math.max(0,Math.floor((-2.6-v)/.4)));return {h:y0+.2*(5-k),pri:2,surf:'stone'}}if(u>C0&&u<C1&&v>=-2.6&&v<33)return {h:y0+(v<0?1:.12),pri:2,surf:v<0?'stone':'marble'};return null});
  }
  // other wing buildings colliders
  for(const [ua,ub,va,vb] of [[0,23,2,34],[82,105,2,34],[23,37,0,35],[68,82,0,35]]){const c=F.P((ua+ub)/2,(va+vb)/2);addOBB(c[0],c[1],ub-ua,vb-va,a)}
  // west wing along platform 1 (from the OSM footprint)
  {const ww=frame(708,-8820,Math.atan2(-8737+8820,726-718)-Math.PI/2);const c=F.P(-2,74);addBuilding2(G,{cx:c[0],cz:c[1],w:28,d:80,a,f:2,s:STATION_ST,seed:12,fl:0},null,P,null,{y0,props:false});addOBB(c[0],c[1],28,80,a)}
  // square in front (cobbles) + taxis
  groundQuad(GR,[F.P(-10,-55),F.P(118,-55),F.P(118,-4),F.P(-10,-4)],5,y0+.07);
  // platforms between the station tracks
  buildPlatforms(grp,P,GR,F,y0);
  PLACES.push({id:'station',name:'Railway Station',sub:'Odesa-Holovna',x:F.P(52,-30)[0],z:F.P(52,-30)[1],yaw:Math.atan2(F.P(52,10)[0]-F.P(52,-30)[0],F.P(52,10)[1]-F.P(52,-30)[1])});
  {const lb=labelSprite(['Railway Station'],{w:512,h:110,size:58,color:'#fff',bg:'rgba(10,30,40,.55)',round:30,scale:4});const p=F.P(52,-8);lb.position.set(p[0],y0+42,p[1]);grp.add(lb)}
}
function buildPlatforms(grp,P,GR,F,y0){
  // collect station rail segments (kind 1) inside the track field south of the building
  const R=D.rnodes,rn=D.rn;const tracks=[];
  for(let k=0;k<HDR.nRWays;k++){if(D.rkind[k]!==1)continue;const pts=[];for(let i=D.rstart[k];i<D.rstart[k+1];i++){const x=R[rn[i]*2],z=R[rn[i]*2+1];const [u,v]=F.inv(x,z);if(u>15&&u<115&&v>30&&v<330)pts.push([u,v])}if(pts.length>=2)tracks.push(pts)}
  // sample track u positions at a few v
  const PH=1.1,platC=sRGB('#9c968c'),edgeY=sRGB('#e8c21a');
  for(let v=46;v<300;v+=24){const us=[];for(const t of tracks){for(let i=0;i<t.length-1;i++){const [u0,v0]=t[i],[u1,v1]=t[i+1];if((v0-v)*(v1-v)<=0&&Math.abs(v1-v0)>.01){us.push(u0+(u1-u0)*(v-v0)/(v1-v0))}}}
    us.sort((a,b)=>a-b);const uq=[];for(const u of us)if(!uq.length||u-uq[uq.length-1]>2)uq.push(u);
    for(let i=0;i<uq.length-1;i++){const gap=uq[i+1]-uq[i];if(gap<7.5||gap>16)continue;const uc=(uq[i]+uq[i+1])/2,w=gap-3.4;const c=F.P(uc,v);const gy=groundH(c[0],c[1]);
      P.box(c[0],gy+PH/2,c[1],w,PH,24.2,-Math.atan2(F.sa,F.ca),platC,9);for(const s of [-1,1]){const e=F.P(uc+s*(w/2-.25),v);P.box(e[0],gy+PH+.005,e[1],.5,.02,24.2,-Math.atan2(F.sa,F.ca),edgeY,9)}
            SPECIAL.push((x,z)=>{const [u,vv]=F.inv(x,z);if(Math.abs(u-uc)<w/2&&Math.abs(vv-v)<12.1)return {h:gy+PH,pri:1,surf:'stone',wall:false};return null});
      if(v<120){for(let q=-10;q<=10;q+=10){const p=F.P(uc,v+q);P.box(p[0],gy+PH+2.2,p[1],.25,4.4,.25,0,sRGB('#5d6166'),1)}const roof=F.P(uc,v);P.box(roof[0],gy+PH+4.5,roof[1],w+1.2,.25,24.4,-Math.atan2(F.sa,F.ca),sRGB('#7b8288'),1)}}
  }
  // standing trains (blue suburban EMU + long-distance coaches) on some tracks
  const trainM=new THREE.MeshStandardMaterial({color:0x2a5aa8,roughness:.45,metalness:.25}),stripeM=new THREE.MeshStandardMaterial({color:0xe8ecf0,roughness:.5}),winM=new THREE.MeshStandardMaterial({color:0x162029,roughness:.05}),roofM2=new THREE.MeshStandardMaterial({color:0x7d8489,roughness:.5,metalness:.3});
  let n=0;for(const t of tracks){if(n>=4)break;const pts=t.slice().sort((a,b)=>a[1]-b[1]);if(pts.length<2||pts[0][1]>60)continue;const [u0,v0]=pts[0];const L=Math.min(150,pts[pts.length-1][1]-v0);if(L<60)continue;
    const nCar=Math.floor(L/24);const grpT=new THREE.Group();
    for(let k=0;k<nCar;k++){const vc=v0+8+k*24.5+12;let uc=u0;for(let i=0;i<pts.length-1;i++){if(pts[i][1]<=vc&&pts[i+1][1]>=vc){uc=pts[i][0]+(pts[i+1][0]-pts[i][0])*(vc-pts[i][1])/(pts[i+1][1]-pts[i][1]);break}}
      const c=F.P(uc,vc);const gy=groundH(c[0],c[1]);const body=new THREE.Mesh(new THREE.BoxGeometry(3.3,3.5,23.8),trainM);body.position.set(c[0],gy+.5+1.75+.6,c[1]);body.rotation.y=-Math.atan2(F.sa,F.ca);grpT.add(body);
      const st=new THREE.Mesh(new THREE.BoxGeometry(3.32,.35,23.82),stripeM);st.position.copy(body.position);st.position.y-=.6;st.rotation.copy(body.rotation);grpT.add(st);
      const w=new THREE.Mesh(new THREE.BoxGeometry(3.34,.9,22),winM);w.position.copy(body.position);w.position.y+=.55;w.rotation.copy(body.rotation);grpT.add(w);
      const rf=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.7,23.6,12,1,false,0,Math.PI),roofM2);rf.rotation.set(Math.PI/2,0,-Math.PI/2);rf.scale.set(1,1,.3);rf.position.copy(body.position);rf.position.y+=1.75;rf.rotation.y=0;rf.rotateOnWorldAxis(new THREE.Vector3(0,1,0),-Math.atan2(F.sa,F.ca)+Math.PI/2);grpT.add(rf);
      const oc=F.inv(c[0],c[1]);addOBB(c[0],c[1],3.4,24,Math.atan2(F.sa,F.ca))}
    grp.add(grpT);n++}
}
