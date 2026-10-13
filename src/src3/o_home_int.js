// ===================== 10-storey stairwell with real stairs, and a furnished ~60 m² two-room flat =====================
const FLOOR_H=2.9,N_FLOORS=10;
const flatNo=(floor,j)=>(floor-1)*4+j+1;
INTERIORS.stair=()=>{
  const grp=new THREE.Group();scene.add(grp);const ox=INT_X+400,oz=INT_Z;const H=FLOOR_H*N_FLOORS+.2;
  const mats={floor:new THREE.MeshStandardMaterial({color:0x8d8479,roughness:.6}),ceil:new THREE.MeshStandardMaterial({color:0xe8e4da,roughness:.9}),wall:new THREE.MeshStandardMaterial({color:0xd8d1bb,roughness:.88})};
  const X0=-4,X1=4,Z1=10.4,LZ=4.6;                              // 8 m wide shaft, landing 4.6 m deep, flights 4 m long
  room(grp,ox,oz,X0,X1,0,Z1,H,mats,{gaps:[[0,1.8,1.4]]});
  const P=new PB();const B=(x,y,z,sx,sy,sz,col,m,ry,rx)=>P.box(ox+x,INT_Y+y,oz+z,sx,sy,sz,ry||0,sRGB(col),m||0,rx);
  const signs=[];                                                // floor-number plates are plain meshes (one per level)
  for(let k=0;k<N_FLOORS;k++){const y0=k*FLOOR_H;
    // painted walls: green panel, cream above, dark line between (classic Soviet-style stairwell)
    for(const [x,z,w,d] of [[X0+.03,Z1/2,.04,Z1],[X1-.03,Z1/2,.04,Z1],[0,Z1-.03,X1-X0,.04]]){B(x,y0+.8,z,w,1.6,d,'#5f8c7a',0);B(x,y0+1.64,z,w+.01,.08,d+.01,'#2f4b40',0)}
    // slab with a lower front ceiling edge, ceiling lamp
    B(0,y0-.1,LZ/2,X1-X0,.2,LZ,'#b9b1a2',9);
    B(0,y0+FLOOR_H-.08,2.3,3.4,.08,.5,'#fff4d8',3);B(0,y0+FLOOR_H-.08,7.4,3.4,.08,.5,'#fff4d8',3);
    // flight A (left lane, rising away from the doors) and flight B (right lane, coming back to the next floor)
    const NS=9,run=4/NS,rise=1.45/NS;
    for(let i=0;i<NS;i++){const t=(i+1)*rise;
      B(-2.1,y0+t-.15,LZ+run*(i+.5),3.45,.3,run,'#a09484',9);B(-2.1,y0+t-.08,LZ+run*(i+1)-.01,3.45,rise-.01,.03,'#6f665a',9);
      B(2.1,y0+1.45+(NS-i)*rise-.15,LZ+run*(i+.5)+0,3.45,.3,run,'#a09484',9);B(2.1,y0+1.45+(NS-i-1)*rise+rise*.5+.02,LZ+run*(i)+.01,3.45,rise-.01,.03,'#6f665a',9)}
    {const sl=Math.hypot(4,1.45),ang=Math.atan2(1.45,4);B(-2.1,y0+.725-.4,LZ+2,3.45,.18,sl,'#c9c2b2',9,-ang);B(2.1,y0+1.45+.725-.4,LZ+2,3.45,.18,sl,'#c9c2b2',9,ang)}
    // mid-landing slab, window with sunlight, big painted floor number
    B(0,y0+1.45-.12,Z1-.8,X1-X0,.24,1.8,'#b9b1a2',9);
    B(0,y0+1.45+1.5,Z1-.06,2.0,1.5,.06,'#dff0ff',8);B(0,y0+1.45+1.5,Z1-.09,2.2,1.7,.05,'#f4f2ea',0);
    // railings along the open well (x = ±.35) and the landing edge
    for(const sd of [-1,1]){const a=sd>0?-1:1;B(sd*.38,y0+(sd<0?.725:2.175)+.55,LZ+2,.06,.06,4.2,'#2a2d30',6,a*0,sd<0?-Math.atan2(1.45,4):Math.atan2(1.45,4));
      for(let i=0;i<=8;i++){const t=i/8;const yy=sd<0?y0+1.45*t:y0+1.45+1.45*(1-t);B(sd*.38,yy+.5,LZ+4*t,.03,.9,.03,'#2a2d30',6)}}
    B(0,y0+1.45+.5,Z1-1.7,X1-X0-.1,.06,.06,'#2a2d30',6);
    // lift doors (steel) on the front wall, floor indicator above
    B(2.4,y0+1.1,.06,1.5,2.2,.06,'#9aa0a6',6);B(2.4,y0+1.1,.09,.04,2.2,.02,'#444',6);B(1.35,y0+1.2,.07,.12,.2,.03,'#ff4a2a',3);B(2.4,y0+2.4,.07,.5,.2,.03,'#ffb347',3);
    // flat doors: two on each side wall, padded leatherette, brass number plates
    for(let j=0;j<4;j++){const left=j<2,zz=j%2?3.5:1.3,x=left?X0+.06:X1-.06;B(x,y0+1.05,zz,.08,2.1,1.0,j%2?'#5a2f22':'#3a3a40',0);B(x,y0+2.15,zz,.1,.08,1.15,'#e8e4da',0);B(left?x+.04:x-.04,y0+1.1,zz+.38,.03,.12,.03,'#d4b24a',6)}
  }
  // top-floor cap
  B(0,FLOOR_H*N_FLOORS+.05,Z1/2,X1-X0,.1,Z1,'#e8e4da',9);
  // ground floor extras: mailboxes, doormat, notice board, bike
  for(let k=0;k<16;k++)B(X0+.14,1.0+(k%4)*.3,.6+Math.floor(k/4)*.55,.06,.24,.42,'#3a5f8a',1);
  B(X0+.1,1.75,3.1,.04,.55,.7,'#8b6a4a',5);B(X0+.08,1.75,3.1,.02,.45,.6,'#f4f1e6',0);
  B(-2.2,.01,.9,1.4,.02,.8,'#4a3a2a',0);
  // number plates as meshes (door numbers + floor numbers) — textures built once
  const plate=(txt,w,h,opt)=>{const m=plateMesh(txt,opt,w,h,0);return m};
  const doorPlates=[],floorPlates=[],liftPlates=[];
  for(let k=0;k<N_FLOORS;k++){const y0=k*FLOOR_H;
    for(let j=0;j<4;j++){const left=j<2,zz=j%2?3.5:1.3;const m=plate([String(flatNo(k+1,j))],.28,.18,{w:128,h:80,size:58,color:'#2a1f10',bg:'#d4b24a',weight:'800'});m.position.set(ox+(left?X0+.115:X1-.115),INT_Y+y0+1.45,oz+zz+.0);m.rotation.y=left?Math.PI/2:-Math.PI/2;grp.add(m);doorPlates.push(m)}
    const fp=plate(['ПОВЕРХ '+(k+1)],1.6,.45,{w:512,h:144,size:84,color:'#fff',bg:'#2a4a6a',weight:'800'});fp.position.set(ox+2.4,INT_Y+y0+2.65,oz+.07);fp.rotation.y=0;fp.rotation.y=Math.PI;fp.position.z=oz+.08;
    // plate faces +z (into the landing): plane normal +z at rotation 0
    fp.rotation.y=0;grp.add(fp);floorPlates.push(fp);
    const big=plate([String(k+1)],1.3,1.3,{w:256,h:256,size:200,color:'#f4f0e2',bg:'rgba(0,0,0,0)',weight:'900'});big.position.set(ox+0,INT_Y+y0+1.45+1.1,oz+Z1-.095);big.rotation.y=Math.PI;
    big.material.transparent=true;grp.add(big);
    const sm=plate(['ПІД\'ЇЗД'],1.2,.3,{w:384,h:96,size:50,color:'#fff',bg:'#2a4a6a',weight:'800'});sm.position.set(ox-2.4,INT_Y+y0+2.65,oz+.08);grp.add(sm);liftPlates.push(sm)}
  // ---- walking surface: ground height depends on which level you are on
  SPECIAL.push((x,z,yq)=>{const lx=x-ox,lz=z-oz;if(lx<-4.3||lx>4.3||lz<-.6||lz>Z1+.4)return null;
    const y=yq===undefined?99:yq;let best=-1e9,found=false;
    for(let k=0;k<N_FLOORS;k++){const b=INT_Y+k*FLOOR_H;let h=null;
      if(lz<LZ)h=b;
      else if(lz<LZ+4){const u=(lz-LZ)/4;if(lx>-3.85&&lx<-.38)h=b+1.45*u;else if(lx>.38&&lx<3.85)h=b+1.45+1.45*(1-u)}
      else h=b+1.45;
      if(h!==null&&h<=y+.62&&h>best){best=h;found=true}}
    if(!found)return {h:INT_Y,wall:true,pri:10,surf:'stone'};
    const wallish=(lz>=LZ&&lz<LZ+4&&Math.abs(lx)<=.38)||lx<-3.9||lx>3.9;
    return {h:best,wall:wallish,pri:10,surf:'stone'}});
  // railings as colliders on every level
  for(let k=0;k<N_FLOORS;k++){const y0=INT_Y+k*FLOOR_H;wallSeg(ox,oz+LZ+.1,ox,oz+LZ+4,.7,y0-.5,y0+FLOOR_H+1.6)}
  // ---- interactions
  const lift=$('liftUI');if(!lift.dataset.ok2){lift.dataset.ok2=1;const Bt=$('liftBtns');Bt.innerHTML='';for(let f=1;f<=N_FLOORS;f++){const b=document.createElement('button');b.textContent=f;b.onclick=()=>{lift.hidden=true;if(window.AUD)AUD.beep();PORTAL.go('stair',{ent:PORTAL.opt.ent,floor:f})};Bt.appendChild(b)}}
  const lvl=()=>Math.max(0,Math.min(N_FLOORS-1,Math.round((player.y-INT_Y)/FLOOR_H)));
  INTERACT.push({x:0,z:0,r:1e9,label:'Call the lift',cond:()=>PORTAL.cur==='stair'&&player.x-ox>.5&&player.z-oz<2.6&&Math.abs(player.y-INT_Y-lvl()*FLOOR_H)<1.2,fn:()=>{lift.hidden=false}});
  INTERACT.push({x:0,z:0,r:1e9,label:'Go out to the yard',cond:()=>PORTAL.cur==='stair'&&lvl()===0&&player.x-ox<-.6&&player.x-ox>-3.8&&player.z-oz<2.2,fn:()=>PORTAL.exit()});
  for(let j=0;j<4;j++){const left=j<2,zz=j%2?3.5:1.3;
    INTERACT.push({x:0,z:0,r:1e9,label:'Enter the flat',cond:()=>{if(PORTAL.cur!=='stair')return false;const k=lvl();if(Math.abs(player.y-INT_Y-k*FLOOR_H)>1.2)return false;const dx=(left?X0:X1)+ox-player.x,dz=oz+zz-player.z;return Math.abs(dx)<2.2&&Math.abs(dz)<1.7},
      fn:()=>{const k=lvl();PORTAL.go('flat',{ent:PORTAL.opt.ent,floor:k+1,flat:flatNo(k+1,j)})}})}
  const l=new THREE.PointLight(0xfff0d0,0,14,1.6);l.position.set(ox,INT_Y+2.5,oz+3);l.userData.i=1.3;grp.add(l);
  ANIM.push(()=>{if(PORTAL.cur==='stair'){const k=lvl();l.position.y=INT_Y+k*FLOOR_H+2.35;l.position.z=oz+(player.y-INT_Y-k*FLOOR_H>.9?7.2:3)}});
  const pg=P.build();if(pg){const m=new THREE.Mesh(pg,MATS.props);m.receiveShadow=true;grp.add(m)}
  INDOORS.push({name:'stair',title:'Stairwell',sub:'',floor:'stone',exp:.7,lights:[l],test:(x,z)=>x>ox-5&&x<ox+5&&z>oz-1&&z<oz+Z1+1,ceil:()=>Math.min(INT_Y+H-.3,player.y+2.55)});
  grp.visible=false;
  const out={grp,spawn:[ox-2.2,oz+2.4],spawnYaw:0,title:'Stairwell',sub:'stairs on both sides · the lift is by the entrance',peds:[],onEnter(o){PORTAL.peds=[];const f=Math.max(1,Math.min(N_FLOORS,o.floor||1));out.spawnY=INT_Y+(f-1)*FLOOR_H;out.spawn=[ox+(o.flat?(((o.flat-1)%4)<2?-2.6:2.6):-2.2),oz+(o.flat?((o.flat-1)%2?3.3:1.5)+0:2.4)];
      if(!o.flat){out.spawn=[ox-2.2,oz+2.4]}
      out.sub='floor '+f+(o.flat?' · flat '+o.flat:'')+' · stairs on both sides';for(const m of liftPlates){}}};
  return out};

INTERIORS.flat=()=>{
  const grp=new THREE.Group();scene.add(grp);const ox=INT_X+600,oz=INT_Z;
  const wallp=(()=>{const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d');x.fillStyle='#eadfc6';x.fillRect(0,0,128,128);x.fillStyle='rgba(150,120,80,.16)';for(let i=0;i<8;i++)for(let j=0;j<8;j++){x.beginPath();x.arc(i*16+8+(j%2)*8,j*16+8,3,0,6.283);x.fill()}const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,2);t.encoding=THREE.sRGBEncoding;return t})();
  const mats={floor:new THREE.MeshStandardMaterial({map:TX.wood,roughness:.5}),ceil:new THREE.MeshStandardMaterial({color:0xf4f2ec,roughness:.9}),wall:new THREE.MeshStandardMaterial({map:wallp,roughness:.85})};
  const X0=-4.5,X1=4.5,Z1=7,H=2.7;
  room(grp,ox,oz,X0,X1,0,Z1,H,mats,{gaps:[[0,1.5,1.0]]});
  const P=new PB();const B=(x,y,z,sx,sy,sz,col,m,ry)=>P.box(ox+x,INT_Y+y,oz+z,sx,sy,sz,ry||0,sRGB(col),m||0);
  const lowB=(x,z,hx,hz)=>LOW_OBB.push(ox+x,oz+z,hx,hz,1,0);
  // ---- inner walls with door openings
  const iw=(xa,za,xb,zb,gaps)=>{const L=Math.hypot(xb-xa,zb-za);const tx=(xb-xa)/L,tz=(zb-za)/L;const seg=(t0,t1)=>{if(t1-t0<.02)return;const a=[xa+tx*t0,za+tz*t0],b=[xa+tx*t1,za+tz*t1];const m=new THREE.Mesh(new THREE.BoxGeometry(t1-t0,H,.12),mats.wall);m.position.set(ox+(a[0]+b[0])/2,INT_Y+H/2,oz+(a[1]+b[1])/2);m.rotation.y=-Math.atan2(tz,tx);grp.add(m);wallSeg(ox+a[0],oz+a[1],ox+b[0],oz+b[1],.2,INT_Y-1,INT_Y+H+1)};
    let t=0;for(const [c,w] of (gaps||[]).slice().sort((a,b)=>a[0]-b[0])){seg(t,c-w/2);const m=new THREE.Mesh(new THREE.BoxGeometry(w,H-2.15,.12),mats.wall);const cx=xa+tx*c,cz=za+tz*c;m.position.set(ox+cx,INT_Y+2.15+(H-2.15)/2,oz+cz);m.rotation.y=-Math.atan2(tz,tx);grp.add(m);t=c+w/2}seg(t,L)};
  iw(-4.5,2.4,-1.4,2.4,[[1.6,1.9]]);              // hall | living room (wide opening)
  iw(-1.4,0,-1.4,2.4,[[1.25,.85]]);               // hall | bathroom (door)
  iw(-1.4,2.4,.8,2.4);                            // bathroom back wall
  iw(.8,0,.8,2.4);                                // bathroom | kitchen
  iw(.8,3.4,.8,7,[[1.35,.9]]);                    // living room | bedroom (door)
  iw(.8,3.4,4.5,3.4);                             // kitchen | bedroom
  // door leaves (open, flat against the wall)
  B(-1.4,1.05,1.9,.04,2.1,.8,'#c9b18a',5,0);B(.8,1.05,5.3,.04,2.1,.8,'#c9b18a',5);
  // ---- hall (x -4.5..-1.4, z 0..2.4)
  B(-4.2,1.15,1.15,.6,2.3,1.5,'#7a5538',5);B(-3.93,1.15,1.15,.02,2.1,1.3,'#8a6644',5);   // wardrobe
  B(-3.0,.01,1.2,1.1,.02,2.0,'#8a2f2a',0);                                              // runner rug
  B(-3.2,.18,.35,.9,.36,.4,'#6a4a2a',5);B(-3.2,.38,.35,.9,.04,.42,'#c4a77a',5);        // shoe bench
  for(let i=0;i<4;i++){B(-1.46,1.65,.3+i*.38,.05,.05,.05,'#2a2a2a',6);B(-1.5,1.2,.3+i*.38,.06,.8,.22,['#2f3a4a','#6a3a2a','#3a4a3a','#8a8a8a'][i],0)}
  B(-1.46,1.05,1.9,.03,.9,.02,'#2a2a2a',6);   // placeholder for coat rail
  {const m=new THREE.Mesh(new THREE.PlaneGeometry(.55,1.1),new THREE.MeshStandardMaterial({color:0xcfe0e8,roughness:.05,metalness:.9}));m.position.set(ox-2.5,INT_Y+1.5,oz+2.33);m.rotation.y=Math.PI;grp.add(m);B(-2.5,1.5,2.37,.62,1.17,.03,'#5a4a3a',5)}
  lowB(-4.2,1.15,.35,.8);lowB(-3.2,.35,.45,.2);
  // ---- bathroom (x -1.4..0.8, z 0..2.4)
  B(-.3,.005,1.2,2.2,.01,2.4,'#cfe3ea',9);
  B(-.35,.3,2.05,1.7,.55,.7,'#f4f6f6',1);B(-.35,.58,2.05,1.5,.02,.55,'#9ac4d8',2);B(.45,.82,2.25,.08,.04,.04,'#bbb',6);           // bathtub + tap
  B(-.2,.22,.45,.38,.4,.55,'#f4f6f6',1);B(-.2,.62,.28,.4,.4,.2,'#f4f6f6',1);                                                   // toilet + cistern
  B(.5,.42,1.25,.5,.84,.5,'#f4f6f6',1);B(.76,1.45,1.25,.03,.7,.5,'#cfe3ea',2);                                                // sink + mirror
  B(-.95,.42,.45,.5,.84,.55,'#e9ecef',1);B(-.95,.5,.18,.3,.3,.02,'#222',2);                                                   // washing machine
  lowB(-.35,2.05,.9,.4);lowB(-.95,.45,.3,.3);lowB(.5,1.25,.3,.3);
  // ---- kitchen (x .8..4.5, z 0..3.4)
  B(2.65,.005,1.7,3.7,.01,3.4,'#d8cdb2',9);
  B(2.35,.45,.33,2.9,.9,.6,'#d7c8a0',5);B(2.35,.92,.33,2.95,.05,.64,'#85857f',9);B(3.1,.93,.33,.6,.02,.42,'#2a2d30',6);
  B(1.55,.94,.33,.58,.03,.5,'#e8e8e8',1);for(const [a,b] of [[-.12,-.1],[.12,-.1],[-.12,.1],[.12,.1]])P.cyl(ox+1.55+a,INT_Y+.96,oz+.33+b,.07,.07,.02,10,sRGB('#222'),6);   // hob
  B(1.55,1.95,.28,.62,.18,.4,'#d0d0d0',6);B(2.4,1.9,.22,2.9,.7,.35,'#d7c8a0',5);
  B(4.15,.95,.38,.64,1.9,.66,'#eef1f3',1);B(4.15,1.28,.72,.04,.03,.02,'#999',6);
  B(3.4,.4,2.5,1.0,.04,.8,'#a8794a',5);for(const [dx,dz] of [[-.4,-.3],[.4,-.3],[-.4,.3],[.4,.3]])B(3.4+dx,.2,2.5+dz,.05,.4,.05,'#7a5a3a',5);   // table
  for(const [x,z] of [[3.4,1.8],[2.7,2.5],[4.1,2.5]]){B(x,.26,z,.4,.04,.4,'#c24a2a',5);B(x,.13,z,.05,.26,.05,'#555',6)}
  B(3.5,.5,2.5,.18,.12,.18,'#d94a2a',1);B(3.1,.44,2.45,.3,.04,.3,'#f2f2ee',1);                                                // kettle + plate
  lowB(2.35,.33,1.5,.35);lowB(4.15,.38,.35,.35);lowB(3.4,2.5,.6,.5);
  // ---- living room (x -4.5..0.8, z 2.4..7)
  {const cv=document.createElement('canvas');cv.width=256;cv.height=160;const x=cv.getContext('2d');x.fillStyle='#8a1f22';x.fillRect(0,0,256,160);x.strokeStyle='#e8c070';x.lineWidth=7;x.strokeRect(12,12,232,136);for(let i=0;i<34;i++){x.fillStyle=['#1d3b6b','#e8c070','#2f6a3a'][i%3];x.beginPath();x.arc(128+Math.cos(i*.8)*(20+i*2.2),80+Math.sin(i*.8)*(14+i*1.2),5,0,6.283);x.fill()}
    const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;const m=new THREE.Mesh(new THREE.PlaneGeometry(3.0,2.0),new THREE.MeshStandardMaterial({map:t,roughness:.95}));m.rotation.x=-Math.PI/2;m.rotation.z=Math.PI/2;m.position.set(ox-2.6,INT_Y+.012,oz+4.7);grp.add(m)}
  B(-4.23,1.1,4.7,.5,2.2,3.7,'#6b4a2e',5);B(-3.96,1.5,4.7,.03,.95,1.5,'#1a1a1c',2);B(-3.97,.32,4.7,.05,.5,1.3,'#4a3020',5);   // wall unit with a niche for the TV
  for(let i=0;i<3;i++){B(-3.98,1.2+i*.28,3.35,.04,.2,.45,['#b04a3a','#3a5a8a','#d4b24a'][i],0);B(-3.98,.5+i*.34,6.05,.04,.24,.5,['#4a6a4a','#8a5a3a','#6a6a6a'][i],0)}   // books / ornaments
  B(-1.25,.22,4.7,.95,.44,2.3,'#7a3b2a',0);B(-.72,.65,4.7,.2,.7,2.3,'#6a3122',0);B(-1.2,.55,3.65,.9,.3,.18,'#6a3122',0);B(-1.2,.55,5.75,.9,.3,.18,'#6a3122',0);   // sofa
  for(const z of [4.1,4.7,5.3])B(-1.45,.5,z,.5,.14,.5,'#a85a3a',0);
  B(-2.65,.2,4.7,.62,.4,1.15,'#4a3020',5);B(-2.65,.42,4.7,.55,.03,1.05,'#bfe0ea',2);                                         // coffee table, glass top
  B(-2.8,.22,6.5,.8,.44,.8,'#3a5a7a',0);B(-2.45,.6,6.5,.2,.55,.8,'#34506f',0);                                               // armchair
  B(-3.3,.75,6.35,.04,.75,.04,'#444',6);P.cyl(ox-3.3,INT_Y+1.35,oz+6.35,.28,.2,.3,12,sRGB('#f2dca0'),3);EXTRA_LAMPS.push([ox-3.3,INT_Y+1.45,oz+6.35,2.0]);                // floor lamp
  P.cyl(ox-.4,INT_Y,oz+6.6,.2,.16,.35,10,sRGB('#a05a3a'),1);for(let i=0;i<7;i++){const a=i/7*6.28;P.cyl(ox-.4+Math.cos(a)*.15,INT_Y+.35,oz+6.6+Math.sin(a)*.15,.01,.12,.6,5,sRGB('#2f7a3a'),0,0,Math.cos(a)*.5,0)}   // plant
  B(-4.2,.95,6.75,.55,1.9,.5,'#6b4a2e',5);for(let i=0;i<5;i++)B(-4.2,.4+i*.35,6.5,.5,.02,.02,'#999',6);                       // bookcase in the corner
  B(-.55,.05,2.6,.5,.1,.04,'#c9b18a',5);
  lowB(-4.23,4.7,.3,1.9);lowB(-1.1,4.7,.55,1.2);lowB(-2.65,4.7,.35,.6);lowB(-2.8,6.5,.45,.45);lowB(-4.2,6.75,.3,.3);
  // TV (screen = emissive plane that you can change)
  const tvCan=document.createElement('canvas');tvCan.width=256;tvCan.height=144;const tvC=tvCan.getContext('2d');const tvTex=new THREE.CanvasTexture(tvCan);tvTex.encoding=THREE.sRGBEncoding;
  const chan=['news','cartoon','football'];let ch=0;
  const drawTV=()=>{const t=chan[ch];tvC.fillStyle='#000';tvC.fillRect(0,0,256,144);
    if(t==='news'){tvC.fillStyle='#173a73';tvC.fillRect(0,0,256,144);tvC.fillStyle='#e8e8ee';tvC.beginPath();tvC.arc(80,60,26,0,6.3);tvC.fill();tvC.fillRect(52,86,56,40);tvC.fillStyle='#c22a2a';tvC.fillRect(0,118,256,26);tvC.fillStyle='#fff';tvC.font='bold 16px sans-serif';tvC.fillText('НОВИНИ · ОДЕСА · 20:00',8,136)}
    else if(t==='cartoon'){const g=tvC.createLinearGradient(0,0,0,144);g.addColorStop(0,'#7ec8ff');g.addColorStop(1,'#b6f08a');tvC.fillStyle=g;tvC.fillRect(0,0,256,144);tvC.fillStyle='#ffd84a';tvC.beginPath();tvC.arc(60,34,18,0,6.3);tvC.fill();tvC.fillStyle='#e9573f';tvC.beginPath();tvC.arc(150,100,26,0,6.3);tvC.fill();tvC.fillStyle='#fff';tvC.fillRect(138,92,10,10);tvC.fillRect(156,92,10,10)}
    else{tvC.fillStyle='#2f8a3a';tvC.fillRect(0,0,256,144);tvC.strokeStyle='#fff';tvC.lineWidth=2;tvC.strokeRect(14,14,228,116);tvC.beginPath();tvC.moveTo(128,14);tvC.lineTo(128,130);tvC.stroke();tvC.beginPath();tvC.arc(128,72,20,0,6.3);tvC.stroke();tvC.fillStyle='#fff';tvC.beginPath();tvC.arc(100+Math.random()*60,72,4,0,6.3);tvC.fill()}
    tvTex.needsUpdate=true};drawTV();
  {const m=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.675),new THREE.MeshBasicMaterial({map:tvTex,toneMapped:false}));m.position.set(ox-3.935,INT_Y+1.5,oz+4.7);m.rotation.y=Math.PI/2;grp.add(m)}
  setInterval(()=>{if(PORTAL.cur==='flat'&&chan[ch]==='football')drawTV()},900);
  INTERACT.push({x:ox-2.8,z:oz+4.7,r:2.6,label:'Change the TV channel',cond:()=>PORTAL.cur==='flat',fn:()=>{ch=(ch+1)%3;drawTV();toast('TV',['news','cartoons','football'][ch])}});
  INTERACT.push({x:ox-1.2,z:oz+4.7,r:1.6,label:'Sit on the sofa and watch TV',cond:()=>PORTAL.cur==='flat'&&!player.sit,fn:()=>{player.sit={x:ox-1.2,z:oz+4.7,y:INT_Y+.1,yaw:-Math.PI/2};cam.yaw=-Math.PI/2}});
  // dining spot by the window
  B(-2.3,.74,6.2,1.0,.04,.8,'#a8794a',5);for(const [dx,dz] of [[-.45,-.35],[.45,-.35],[-.45,.35],[.45,.35]])B(-2.3+dx,.37,6.2+dz,.05,.74,.05,'#7a5a3a',5);lowB(-2.3,6.2,.55,.45);
  // ---- bedroom (x 0.8..4.5, z 3.4..7)
  B(3.45,.28,5.2,2.1,.5,1.65,'#e6e1d6',0);B(3.45,.56,5.2,2.0,.1,1.6,'#d9c9a6',0);B(4.44,.8,5.2,.12,1.1,1.8,'#7a5a3a',5);
  B(4.1,.7,4.7,.4,.14,.55,'#ffffff',0);B(4.1,.7,5.7,.4,.14,.55,'#ffffff',0);B(3.1,.62,5.2,1.0,.04,1.6,'#2f5f7a',0);
  for(const z of [4.1,6.3]){B(4.25,.25,z,.4,.5,.4,'#7a5a3a',5);P.cyl(ox+4.25,INT_Y+.5,oz+z,.1,.1,.18,8,sRGB('#f2dca0'),3);EXTRA_LAMPS.push([ox+4.25,INT_Y+.75,oz+z,1.4])}
  B(2.2,1.1,3.7,2.4,2.2,.55,'#8a6644',5);B(2.2,1.1,3.97,.02,2.0,.02,'#2a1f10',6);lowB(2.2,3.7,1.2,.3);lowB(3.45,5.2,1.05,.9);
  B(1.3,.5,6.6,.9,1.0,.5,'#8a6644',5);lowB(1.3,6.6,.45,.25);
  // ---- windows: they show a live snapshot of the yard
  const winTex=new THREE.WebGLRenderTarget(512,256,{stencilBuffer:true});
  const win=(x,y,z,ry,w,h)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:winTex.texture,toneMapped:false}));m.position.set(ox+x,INT_Y+y,oz+z);m.rotation.y=ry;grp.add(m);
    const nx=Math.sin(ry),nz=Math.cos(ry);const ex=Math.cos(ry),ez=-Math.sin(ry);B(x-nx*.02,y,z-nz*.02,Math.abs(ex)*(w+.14)+Math.abs(nx)*.04,h+.14,Math.abs(ez)*(w+.14)+Math.abs(nz)*.04,'#f4f4f4',1);
    B(x-nx*.12-ex*(w/2+.22),y-.1,z-nz*.12-ez*(w/2+.22),Math.abs(ex)*.35+Math.abs(nx)*.18,h+.9,Math.abs(ez)*.35+Math.abs(nz)*.18,'#8a2f3a',0);B(x-nx*.12+ex*(w/2+.22),y-.1,z-nz*.12+ez*(w/2+.22),Math.abs(ex)*.35+Math.abs(nx)*.18,h+.9,Math.abs(ez)*.35+Math.abs(nz)*.18,'#8a2f3a',0);
    B(x-nx*.1,y-h/2-.06,z-nz*.1,Math.abs(ex)*(w+.3)+Math.abs(nx)*.22,.05,Math.abs(ez)*(w+.3)+Math.abs(nz)*.22,'#f0ece0',0);
    // radiator under the window
    B(x-nx*.1,y-h/2-.35,z-nz*.1,Math.abs(ex)*(w*.8)+Math.abs(nx)*.1,.5,Math.abs(ez)*(w*.8)+Math.abs(nz)*.1,'#f2f2f0',1)};
  win(-1.9,1.5,Z1-.02,Math.PI,2.4,1.5);win(2.7,1.5,Z1-.02,Math.PI,1.5,1.4);win(X1-.02,1.5,1.7,-Math.PI/2,1.3,1.3);
  // ---- lights
  const lights=[];for(const [x,z] of [[-2.6,4.7],[2.6,5.2],[2.7,1.7],[-3,1.2]]){const l=new THREE.PointLight(0xffe8c8,0,11,1.5);l.position.set(ox+x,INT_Y+2.4,oz+z);l.userData.i=1.0;grp.add(l);lights.push(l);B(x,2.65,z,.5,.05,.5,'#fff4d8',3)}
  // interactions
  INTERACT.push({x:ox+4.1,z:oz+.9,r:1.5,label:'Open the fridge',cond:()=>PORTAL.cur==='flat',fn:()=>toast('Fridge','kefir, sausage, borscht, a jar of pickles')});
  INTERACT.push({x:ox+3.5,z:oz+2.2,r:1.6,label:'Make tea',cond:()=>PORTAL.cur==='flat',fn:()=>toast('Tea','black with lemon, two sugars')});
  INTERACT.push({x:ox+3.1,z:oz+5.2,r:1.8,label:'Sit on the bed',cond:()=>PORTAL.cur==='flat'&&!player.sit,fn:()=>{player.sit={x:ox+2.5,z:oz+5.2,y:INT_Y+.5,yaw:Math.PI/2};cam.yaw=Math.PI/2}});
  INTERACT.push({x:ox+.5,z:oz+1.3,r:1.4,label:'Wash your hands',cond:()=>PORTAL.cur==='flat',fn:()=>toast('Fresh and clean','nice and cold')});
  INTERACT.push({x:ox-3,z:oz+.8,r:1.3,label:'Go to the stairwell',cond:()=>PORTAL.cur==='flat',fn:()=>PORTAL.go('stair',{ent:PORTAL.opt.ent,floor:PORTAL.opt.floor||1,flat:PORTAL.opt.flat})});
  const pg=P.build();if(pg){const m=new THREE.Mesh(pg,MATS.props);m.receiveShadow=true;grp.add(m)}
  INDOORS.push({name:'flat',title:'Flat',sub:'',floor:'wood',exp:.62,lights,test:(x,z)=>x>ox-5.5&&x<ox+5.5&&z>oz-1&&z<oz+8,ceil:()=>INT_Y+2.45});
  grp.visible=false;
  return {grp,spawn:[ox-3,oz+2.0],spawnYaw:0,title:'Flat',sub:'~60 m² · two rooms · home sweet home',peds:[],onEnter(o){PORTAL.peds=[];
    const e=HOME_ENT[(o.ent||1)-1]||HOME_ENT[0];if(e){const fl=o.floor||7;const cm=new THREE.PerspectiveCamera(60,2,.3,3000);const yy=HOME_Y0+4.2+(fl-1)*2.9+1.5;
      cm.position.set(e.x+e.tx*4+e.nx*.5,yy,e.z+e.tz*4+e.nz*.5);cm.lookAt(e.x+e.tx*4+e.nx*20,yy-5,e.z+e.tz*4+e.nz*20);
      const vis=[];for(const n in PORTAL.built)vis.push([PORTAL.built[n].grp,PORTAL.built[n].grp.visible]);vis.forEach(v=>v[0].visible=false);PORTAL.setCity(true);
      renderer.setRenderTarget(winTex);renderer.render(scene,cm);renderer.setRenderTarget(null);vis.forEach(v=>v[0].visible=v[1])}}}};
