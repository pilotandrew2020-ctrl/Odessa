// ======================= Potemkin Stairs v3 (terrain graded to the stairs, Duke on the axis, colonnades, funicular) =======================
let STAIRS=null;
const FUNI={cabs:[],info:null};
function buildStairs(grp,P,GR){
  const S0=LMK.stairs,dk=LMK.duke;
  // axis runs through the Duke statue and (roughly) the old bottom point, so the monument stands exactly in front of the flight
  const ax=S0.x1-dk.x,az=S0.y1-dk.y,al=Math.hypot(ax,az),tx=ax/al,tz=az/al,nx=-tz,nz=tx;
  const DBACK=21,L=136,nSteps=192,flights=10,land=3.6;
  const x0=dk.x+tx*DBACK,z0=dk.y+tz*DBACK;
  LMK.stairs={x0,y0:z0,x1:x0+tx*L,y1:z0+tz*L};const S=LMK.stairs;
  const W=(u,v)=>[x0+tx*u+nx*v,z0+tz*u+nz*v];
  const yT=rawH(...W(-8,0)),yB=rawH(...W(L+8,0));const slope=(yT-yB)/L;
  const sm=t=>{t=t<0?0:t>1?1:t;return t*t*(3-2*t)};
  // ---- terrain: one graded corridor (plaza on top, plane under the stairs and the parks beside them, square at the bottom). No hill, no gaps.
  const HW=38,BL=30,PU=72,PB=26;const cen=W(L/2,0);
  FLAT.push({x:cen[0],z:cen[1],R:190,fn:(x,z,h)=>{const rx=x-x0,rz=z-z0,u=rx*tx+rz*tz,v=rx*nx+rz*nz;
    let w=1-sm((Math.abs(v)-HW)/BL);if(u<-PU)w*=1-sm((-PU-u)/BL);else if(u>L+PB)w*=1-sm((u-L-PB)/BL);if(w<=0)return h;
    const tgt=u<=0?yT:u>=L?yB:yT-slope*u-.45*sm(u/3)*(1-sm((u-L+3)/3));return h+(tgt-h)*w}});
  const tread=(L-(flights-1)*land)/nSteps,rise=(yT-yB)/nSteps;
  const prof=[];let u=0,y=yT;
  for(let f=0;f<flights;f++){const n=f<2?20:19;for(let i=0;i<n;i++){y-=rise;prof.push([u,y,tread,0]);u+=tread}if(f<flights-1){prof.push([u,y,land,1]);u+=land}}
  const wAt=uu=>12.5+(21.7-12.5)*Math.min(1,Math.max(0,uu/L));
  const ry=Math.atan2(tx,tz),ryN=ry+Math.PI/2;
  const gcol=sRGB('#8f897d'),gcol2=sRGB('#9d978a'),riser=sRGB('#4a4742'),wallc=sRGB('#c4bba8');
  for(const [u0,yy,len,isLand] of prof){
    const w=wAt(u0+len/2);const c=W(u0+len/2,0);
    P.box(c[0],yy-(isLand?.3:rise/2+.1),c[1],w,isLand?.6:rise+.2,len+.02,ry,isLand?gcol2:gcol,7);
    {const cr=W(u0+len+.03,0);P.box(cr[0],yy-rise/2+.01,cr[1],w-.02,rise-.03,.05,ry,riser,7)}
  }
  // solid body under the flights (so the stairs read as massive from the sides)
  for(let k=0;k<prof.length;k+=4){const [u0,yy]=prof[k];const w=wAt(u0);const c=W(u0+tread*2,0);const gy=yT-slope*(u0+tread*2)-1.2;
    if(yy-.4>gy)P.box(c[0],(yy-.4+gy)/2,c[1],w-.2,yy-.4-gy,tread*4.2,ry,gcol2,7)}
  // side parapets + lanterns on the landings
  for(const sd of [-1,1]){
    for(let k=0;k<prof.length;k++){const [u0,yy,len,isLand]=prof[k];const w=wAt(u0+len/2)/2+.35;const c=W(u0+len/2,sd*w);
      P.box(c[0],yy+.55,c[1],.7,1.1,len+.02,ry,wallc,7);
      const gy=yT-slope*(u0+len/2)-.6;if(yy-gy>.2)P.box(c[0],(yy+gy)/2-.1,c[1],.7,yy-gy+.2,len+.02,ry,wallc,7);
      if(isLand){const lp=W(u0+len/2,sd*(w));P.cyl(lp[0],yy+1.1,lp[1],.09,.07,2.6,6,sRGB('#26292b'),6);P.box(lp[0],yy+3.85,lp[1],.42,.6,.42,0,sRGB('#ffe0a0'),3);
        P.box(lp[0],yy+4.2,lp[1],.55,.1,.55,0,sRGB('#26292b'),6);EXTRA_LAMPS.push([lp[0],yy+3.85,lp[1],2.6])}}
  }
  // ---- paving: top plaza (Duke square) and bottom square
  groundQuad(GR,[W(-60,-30),W(0,-30),W(0,30),W(-60,30)],5,yT+.09);
  groundQuad(GR,[W(L,-22),W(L+24,-26),W(L+24,26),W(L,22)],5,yB+.09);
  SPECIAL.push((x,z,yq)=>{const rx=x-x0,rz=z-z0;const uu=rx*tx+rz*tz,v=rx*nx+rz*nz;if(uu<0||uu>L)return null;const w=wAt(uu)/2;if(Math.abs(v)>w+.75)return null;
    let yy=yB;for(let i=prof.length-1;i>=0;i--){if(prof[i][0]<=uu){yy=prof[i][1];break}}if(uu<prof[0][0]+.01)yy=yT;return {h:yy,wall:Math.abs(v)>w-.25,pri:2,surf:'stone'}});
  // plaza is flat; make sure nothing from the old OSM buildings stands where the two colonnades go
  addBlock(...W(-40,0),70,96,Math.atan2(tz,tx));addBlock(...W(L/2,0),L+30,66,Math.atan2(tz,tx));
  // ---- Duke, exactly on the axis, a little ahead of the colonnades
  const dp=W(-DBACK,0),gy=yT;
  for(let k=0;k<3;k++)P.box(dp[0],gy+.2+k*.4,dp[1],6.4-k*1.2,.4,6.4-k*1.2,ry,sRGB('#8f897e'),7);
  P.box(dp[0],gy+3.1,dp[1],2.4,3.6,2.4,ry,sRGB('#857f74'),7);P.box(dp[0],gy+4.95,dp[1],2.9,.3,2.9,ry,sRGB('#8f897e'),7);
  {const fx=Math.sin(ry),fz=Math.cos(ry);const pm=plateMesh(['ДЮК ДЕ','РІШЕЛЬЄ','1828'],{w:512,h:512,sizes:[84,84,70],color:'#3a2a10',bg:'#c9a24a',weight:'800'},1.9,1.9,.05);
    pm.position.set(dp[0]+fx*1.23,gy+3.1,dp[1]+fz*1.23);pm.rotation.y=ry;grp.add(pm)}
  for(let k=0;k<12;k++){const an=k/12*6.283;P.box(dp[0]+Math.cos(an)*4.2,gy+.45,dp[1]+Math.sin(an)*4.2,.25,.9,.25,0,sRGB('#1e1e1e'),1)}
  grp.add(makeDuke(dp[0],gy+5.1,dp[1],ry));
  STATIC_CIR.push(dp[0],dp[1],3.4);TREE_CLEAR.push(dp[0],dp[1],13);
  // ---- the star in the paving between the Duke and the first step
  {const sc=W(-10,0),cl=[sRGB('#b9a26a'),sRGB('#6c6a64')];
    for(let k=0;k<8;k++){const a=k*Math.PI/8;const lenR=k%2?3.6:5.4;P.box(sc[0],yT+.1,sc[1],.5,.03,lenR,a+ry,cl[k%2],9)}
    P.cyl(sc[0],yT+.09,sc[1],1.0,1.0,.04,20,cl[0],9);P.cyl(sc[0],yT+.12,sc[1],.5,.5,.03,16,cl[1],9)}
  // ---- two identical yellow semicircular colonnade buildings behind the Duke
  {const C=dp,Rin=25,dep=11,H=17,nSeg=15,a0=26*Math.PI/180,a1=88*Math.PI/180;
    const yel=sRGB('#e6c261'),yel2=sRGB('#d8b04e'),white=sRGB('#f2ecdc'),roof=sRGB('#7a4a34'),glassC=sRGB('#2b3844');
    for(const sd of [-1,1])for(let i=0;i<nSeg;i++){
      const an=a0+(a1-a0)*(i+.5)/nSeg;const rx=-tx*Math.cos(an)+nx*sd*Math.sin(an),rz=-tz*Math.cos(an)+nz*sd*Math.sin(an);   // radial (outwards from the Duke)
      const rr=Math.atan2(rx,rz);const segW=(a1-a0)/nSeg*(Rin+dep/2)*1.03;
      const cx=C[0]+rx*(Rin+dep/2),cz=C[1]+rz*(Rin+dep/2);
      P.box(cx,gy+H/2,cz,segW,H,dep,rr,i%2?yel2:yel,0);
      P.box(cx,gy+H+.3,cz,segW+.15,.6,dep+.9,rr,white,0);P.box(cx,gy+H+.85,cz,segW,.5,dep+.3,rr,roof,0);
      P.box(cx,gy+4.7,cz,segW+.1,.35,dep+.1,rr,white,0);   // string course over the arcade
      // windows on the inner face (3 upper floors)
      const fx=C[0]+rx*(Rin-.02),fz=C[1]+rz*(Rin-.02);
      for(let fl=0;fl<3;fl++){P.box(fx,gy+6.7+fl*3.5,fz,1.15,1.9,.12,rr,glassC,2);P.box(fx,gy+7.9+fl*3.5,fz,1.5,.25,.2,rr,white,0)}
      // arcade columns on the ground floor
      const colx=C[0]+rx*(Rin-1.2),colz=C[1]+rz*(Rin-1.2);P.cyl(colx,gy,colz,.36,.3,4.4,10,white,0);P.box(colx,gy+4.45,colz,.9,.2,.9,rr,white,0);
      P.box(fx,gy+1.7,fz,segW*.8,2.6,.12,rr,glassC,2);
      addOBB(cx,cz,dep,segW*.95,Math.atan2(rz,rx));
    }
    // centre-line check: the two blocks mirror each other about the stair axis
  }
  PLACES.push({id:'stairs',name:'Potemkin Stairs',sub:'Primorsky Blvd, Duke statue',x:dp[0]+tx*9,z:dp[1]+tz*9,yaw:Math.atan2(tx,tz)});
  // ---- funicular, on the left going down: concrete bed, two tracks, two stations, two stepped green cars
  const vF=24,gauge=2.2,lineY=uu=>yT-slope*uu;
  {const tA=W(1,vF),tB=W(L+1,vF);const ang=Math.atan(slope);const len=Math.hypot(L,yT-yB);
    P.box((tA[0]+tB[0])/2,(lineY(1)+lineY(L+1))/2-.25,(tA[1]+tB[1])/2,8.6,.5,len,ry,sRGB('#8f8c84'),7,ang);
    for(const k of [-1,1]){const rails=[-.72,.72];
      for(const o of rails){const a=W(1,vF+k*gauge/2+o),b=W(L+1,vF+k*gauge/2+o);P.box((a[0]+b[0])/2,(lineY(1)+lineY(L+1))/2+.1,(a[1]+b[1])/2,.12,.14,len,ry,sRGB('#6b6f74'),6,ang)}
      const c0=W(1,vF+k*gauge/2),c1=W(L+1,vF+k*gauge/2);P.box((c0[0]+c1[0])/2,(lineY(1)+lineY(L+1))/2+.04,(c0[1]+c1[1])/2,.07,.07,len,ry,sRGB('#2a2b2d'),6,ang)}
    for(let uu=2;uu<L;uu+=1.3){const c=W(uu,vF);P.box(c[0],lineY(uu)+.01,c[1],5.2,.1,.32,ry,sRGB('#5b4a3a'),5,ang)}
    // low walls along both edges of the bed
    for(const s of [1]){const a=W(1,vF+s*4.5),b=W(L+1,vF+s*4.5);P.box((a[0]+b[0])/2,(lineY(1)+lineY(L+1))/2+.2,(a[1]+b[1])/2,.35,.7,len,ry,wallc,7,ang)}
    for(let uu=0;uu<=L;uu+=10){TREE_CLEAR.push(...W(uu,vF),13);TREE_CLEAR.push(...W(uu,0),14)}
  }
  // station building (stone, arched windows, green roof)
  const stationBox=(uc,vc,lu,lv,hh,label)=>{const c=W(uc,vc),gh=groundH(c[0],c[1]);const stone=sRGB('#e2d3a8'),trim=sRGB('#f1ead6'),green=sRGB('#2f7a4f'),dark=sRGB('#2a333b');
    P.box(c[0],gh+hh/2,c[1],lv,hh,lu,ry,stone,0);P.box(c[0],gh+hh+.2,c[1],lv+.8,.4,lu+.8,ry,trim,0);
    P.box(c[0],gh+hh+.95,c[1],lv+.4,1.3,lu+.4,ry,green,1,0);P.box(c[0],gh+hh+1.9,c[1],lv-2,.6,lu-2,ry,green,1);
    for(const sd of [-1,1])for(let k=-2;k<=2;k++){if(k===0&&sd===-1)continue;const p=W(uc+k*lu/5.4,vc+sd*(lv/2+.04));P.box(p[0],gh+2.6,p[1],1.1,2.3,.1,ryN,dark,2);P.cyl(p[0],gh+3.75,p[1],.55,.55,.1,12,dark,2,Math.PI/2,0,ryN)}
    addOBB(c[0],c[1],lu,lv,Math.atan2(tz,tx));return {c,gh}};
  stationBox(-6.5,vF,11,10,5,'top');
  const lowS=stationBox(L+8,vF,13,10.5,5.6,'bottom');
  {const sg=plateMesh(['ФУНІКУЛЕР'],{w:512,h:128,size:86,color:'#fff',bg:'#2f7a4f',weight:'800'},4.4,1.1,.4);const p=W(L+8,vF-5.4);sg.position.set(p[0],lowS.gh+4.4,p[1]);sg.rotation.y=ryN;grp.add(sg)}
  {const sg=plateMesh(['ФУНІКУЛЕР'],{w:512,h:128,size:86,color:'#fff',bg:'#2f7a4f',weight:'800'},4.4,1.1,.4);const p=W(-6.5,vF-5.4);sg.position.set(p[0],yT+4.2,p[1]);sg.rotation.y=ryN;grp.add(sg)}
  {const dd=W(L+8,vF-5.3);const dn=[-nx,-nz];
    INTERACT.push({x:dd[0]+dn[0]*1.6,z:dd[1]+dn[1]*1.6,y:lowS.gh,r:2.6,label:'Enter the funicular station',cond:()=>!PORTAL.cur&&!RIDE.on,
      fn:()=>PORTAL.enter('funi',{x:dd[0]+dn[0]*2.6,z:dd[1]+dn[1]*2.6,yaw:Math.atan2(dn[0],dn[1])})});
    const door=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.6,.12),new THREE.MeshStandardMaterial({color:new THREE.Color('#3b2a1e').convertSRGBToLinear(),roughness:.6}));door.position.set(dd[0]-dn[0]*.02,lowS.gh+1.3,dd[1]-dn[1]*.02);door.rotation.y=ryN;grp.add(door)}
  // ---- stepped green cars (shared clock => every player sees them in the same place)
  const lin=h=>{const c=new THREE.Color(h);c.convertSRGBToLinear();return c};
  const gM=new THREE.MeshStandardMaterial({color:lin('#1f7a46'),roughness:.4,metalness:.3}),cM=new THREE.MeshStandardMaterial({color:lin('#efe6cc'),roughness:.5}),
    glM=new THREE.MeshStandardMaterial({color:lin('#10202c'),roughness:.08,metalness:.35,transparent:true,opacity:.7}),fM=new THREE.MeshStandardMaterial({color:lin('#34373a'),roughness:.6,metalness:.5}),
    sM=new THREE.MeshStandardMaterial({color:lin('#7a4a2a'),roughness:.7});
  const carMesh=()=>{const g=new THREE.Group();const add=(geo,m,x,y,z,rx)=>{const me=new THREE.Mesh(geo,m);me.position.set(x,y,z);if(rx)me.rotation.x=rx;me.castShadow=true;g.add(me);return me};
    const ang=Math.atan(slope);add(new THREE.BoxGeometry(2.3,.32,10.4),fM,0,.38,0,ang);
    for(let i=0;i<3;i++){const d=(i-1)*3.1,f=.62-d*slope;
      add(new THREE.BoxGeometry(2.7,.85,3.0),gM,0,f+.42,d);add(new THREE.BoxGeometry(2.74,.16,3.02),cM,0,f+.88,d);
      add(new THREE.BoxGeometry(2.76,1.0,2.7),glM,0,f+1.45,d);add(new THREE.BoxGeometry(2.9,.14,3.2),cM,0,f+2.02,d);
      for(const sx of [-1,1])for(const sz of [-1,1])add(new THREE.BoxGeometry(.14,1.1,.14),gM,sx*1.36,f+1.45,d+sz*1.45);
      for(const sx of [-1,1])add(new THREE.BoxGeometry(.5,.12,2.4),sM,sx*.95,f+.55,d);
      add(new THREE.BoxGeometry(2.7,.1,3.0),sM,0,f+.05,d);
      for(const sx of [-1,1])for(const sz of [-1,1]){const w=add(new THREE.CylinderGeometry(.3,.3,.14,12),fM,sx*1.0,.2,sz*3.9*0+d*0+(i-1)*3.1+sz*1.0,0);w.rotation.z=Math.PI/2}}
    g.userData.dyn=true;return g};
  const cabs=[];for(let i=0;i<2;i++){const m=carMesh();grp.add(m);cabs.push({i,mesh:m,x:0,y:0,z:0,yaw:ry,v:0,dock:null,kind:'funi',camDist:10,camH:2.6,sx:0,sy:0,sz:0,u:0})}
  FUNI.cabs=cabs;
  const U0=6,U1=L-6,TC=150;
  const cyc=(now,off)=>{let p=(now+off)%TC;if(p<0)p+=TC;if(p<20)return {s:0,v:0};if(p<75){const t=(p-20)/55;return {s:sm(t),v:Math.sin(t*Math.PI)};}
    if(p<95)return {s:1,v:0};const t=(p-95)/55;return {s:1-sm(t),v:Math.sin(t*Math.PI)}};
  const place=(c,s,vel)=>{const u=U0+(U1-U0)*s;const k=c.i?1:-1;const p=W(u,vF+k*gauge/2);c.u=u;c.x=p[0];c.z=p[1];c.y=lineY(u)+.1;c.v=vel;c.dock=vel===0?(s<.5?'top':'bottom'):null;
    c.mesh.position.set(c.x,c.y,c.z);c.mesh.rotation.set(0,ry,0);
    // seat in the middle compartment
    const lz=-.15;c.sx=c.x+tx*lz;c.sz=c.z+tz*lz;c.sy=c.y+.62+.5;};
  ANIM.push(dt=>{const now=Date.now()/1000;const a=cyc(now,0);place(cabs[0],a.s,a.v);place(cabs[1],1-a.s,a.v);
    for(const c of cabs){if(RIDE.on&&RIDE.tram===c){player.x=c.sx;player.z=c.sz;player.y=c.sy;player.yaw=ry;player.vx=player.vz=0;PLR.root.position.set(player.x,player.y,player.z);PLR.root.rotation.y=player.yaw;animPlayer(PLR,{spd:0,mode:'sit'},dt)}}});
  FUNI.info={W,vF,U0,U1,ry};
  INTERACT.push({x:0,z:0,r:1e9,label:'Board the funicular',cond:()=>{if(RIDE.on||DRIVE.on||PORTAL.cur||player.sit)return false;
    for(const c of cabs){if(!c.dock)continue;const dx=player.x-c.x,dz=player.z-c.z;if(Math.hypot(dx,dz)<7.5&&Math.abs(player.y-c.y)<3.4){funiNear=c;return true}}return false},fn:()=>boardFuni(funiNear)});
  PLACES.push({id:'stairs_b',name:'Sea Terminal',sub:'bottom of the Potemkin Stairs',x:S.x1+tx*20,z:S.y1+tz*20,yaw:Math.atan2(-tx,-tz)});
  PLACES.push({id:'funi',name:'Funicular',sub:'lower station',x:W(L+2,vF-9)[0],z:W(L+2,vF-9)[1],yaw:Math.atan2(nx,nz)});
  // ---- side parks: path along each flight, lamps, benches, trees
  const rnd=rng(77);
  for(const sd of [-1,1]){
    {const a=W(0,sd*(wAt(0)/2+5.5)),b=W(L,sd*(wAt(L)/2+5.5)),c=W(L,sd*(wAt(L)/2+8.5)),d=W(0,sd*(wAt(0)/2+8.5));groundQuad(GR,[a,b,c,d],5)}
    for(let uu=6;uu<L;uu+=14){const p=W(uu,sd*(wAt(uu)/2+9.5));classicLamp(P,p[0],groundH(p[0],p[1]),p[1],1);EXTRA_LAMPS.push([p[0],groundH(p[0],p[1])+4,p[1],2.4]);
      if(((uu/14)|0)%2===0){const q=W(uu+3,sd*(wAt(uu)/2+11.6));propBench2(P,q[0],groundH(q[0],q[1])+.02,q[1],ry+(sd>0?-1:1)*Math.PI/2,null)}}
    for(let uu=4;uu<L-4;uu+=7+rnd()*4){const v=sd*(wAt(uu)/2+13+rnd()*14);if(sd>0&&v>vF-8)continue;const p=W(uu,v);EXTRA_TREES.push([p[0],p[1],rnd()<.35?2:(rnd()<.5?0:1),.9+rnd()*.5])}
  }
  for(const s of [-1,1])for(const t of [-4,0,4]){const p=W(t*0+(-DBACK)-6,s*14+t);EXTRA_TREES.push([p[0],p[1],0,1.1])}
  STAIRS={W,tx,tz,nx,nz,L,yT,yB,ry,dp,gy};
}
let funiNear=null;
function boardFuni(c){if(!c)return;RIDE.on=true;RIDE.tram=c;player.vx=player.vz=0;player.scoot=false;$('bScoot').classList.remove('on');cam.init=false;
  toast('Funicular','sit back, it goes by itself. At the station press E to get off');if(window.AUD)AUD.beep()}
function funiLeave(c){
  if(!c.dock){toast('Wait for the station','the funicular is moving');return}
  const I=FUNI.info;RIDE.on=false;RIDE.tram=null;player.vx=player.vz=0;cam.init=false;
  const p=I.W(c.u,I.vF-5.4);player.x=p[0];player.z=p[1];player.y=groundAt(p[0],p[1],c.y+1);player.yaw=Math.atan2(-STAIRS.nx,-STAIRS.nz);cam.yaw=player.yaw}
