// ===================== people: player + NPCs (blocky "Roblox-like" style, painted faces) =====================
function std(c,r,m){return new THREE.MeshStandardMaterial({color:c,roughness:r===undefined?.8:r,metalness:m||0})}
// rounded box (vertices pushed onto rounded edges, smooth normals)
function rbox(w,h,d,r,s){s=s||4;const g=new THREE.BoxGeometry(w,h,d,s*2,s*2,s*2);const p=g.attributes.position,n=g.attributes.normal;r=Math.min(r,w/2-1e-3,h/2-1e-3,d/2-1e-3);
  const hx=w/2-r,hy=h/2-r,hz=d/2-r;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const cx=Math.max(-hx,Math.min(hx,x)),cy=Math.max(-hy,Math.min(hy,y)),cz=Math.max(-hz,Math.min(hz,z));
    let ox=x-cx,oy=y-cy,oz=z-cz;const l=Math.hypot(ox,oy,oz);if(l<1e-6)continue;ox/=l;oy/=l;oz/=l;p.setXYZ(i,cx+ox*r,cy+oy*r,cz+oz*r);n.setXYZ(i,ox,oy,oz)}
  return g}
// rounded-cylinder head (Roblox-like); uv.v = height fraction, uv.u = 0.5 at the face (+z)
function headGeo(r,h,seg){const pts=[[0,0],[r*.62,0],[r*.88,h*.03],[r*.98,h*.09]];for(let i=1;i<=8;i++)pts.push([r,h*.09+(h*.82)*i/9]);pts.push([r*.98,h*.91],[r*.88,h*.97],[r*.62,h],[0,h]);
  const g=new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(Math.max(1e-4,p[0]),p[1])),seg||28,-Math.PI,Math.PI*2);const pos=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<pos.count;i++)uv.setY(i,pos.getY(i)/h);g.computeVertexNormals();return g}
// face painted on the head's wrap-around texture (u: around, v: up). bg = skin colour or null (white, tinted by instance colour)
function faceTex(o){const W=512,H=256,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.fillStyle=o.bg||'#ffffff';x.fillRect(0,0,W,H);
  const cx=256,py=v=>(1-v)*H;const ex=29,ey=py(.5);
  // cheeks
  x.fillStyle='rgba(235,120,110,.22)';for(const s of [-1,1]){x.beginPath();x.ellipse(cx+s*44,py(.36),15,15,0,0,7);x.fill()}
  for(const s of [-1,1]){const X=cx+s*ex;
    x.fillStyle='#ffffff';x.beginPath();x.ellipse(X,ey,13,20,0,0,7);x.fill();
    x.fillStyle=o.iris||'#3a6fb8';x.beginPath();x.ellipse(X+s*-1,ey+2,9.5,14,0,0,7);x.fill();
    x.fillStyle='#14100e';x.beginPath();x.ellipse(X+s*-1,ey+3,5,7.5,0,0,7);x.fill();
    x.fillStyle='#ffffff';x.beginPath();x.ellipse(X+s*-1-3,ey-4,3,4,0,0,7);x.fill();
    x.strokeStyle='#2a1c14';x.lineWidth=3;x.beginPath();x.ellipse(X,ey,13,20,0,Math.PI*1.08,Math.PI*1.92);x.stroke();
    // brows
    x.strokeStyle=o.brow||'#6b4a2a';x.lineWidth=5.5;x.lineCap='round';x.beginPath();x.moveTo(X-s*13,py(.655)+2);x.quadraticCurveTo(X,py(.69)-1,X+s*14,py(.665));x.stroke()}
  // nose hint + smile
  x.strokeStyle='rgba(150,90,70,.35)';x.lineWidth=3;x.beginPath();x.moveTo(cx-3,py(.39));x.quadraticCurveTo(cx+2,py(.375),cx+5,py(.395));x.stroke();
  x.strokeStyle='#5a2a20';x.lineWidth=4.5;x.lineCap='round';x.beginPath();x.moveTo(cx-17,py(.285));x.quadraticCurveTo(cx,py(.215),cx+19,py(.29));x.stroke();
  if(o.grin){x.fillStyle='#ffffff';x.beginPath();x.moveTo(cx-14,py(.275));x.quadraticCurveTo(cx,py(.235),cx+16,py(.28));x.quadraticCurveTo(cx,py(.262),cx-14,py(.275));x.fill()}
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t}
function stripeTex(c1,c2,n){const cv=document.createElement('canvas');cv.width=16;cv.height=256;const x=cv.getContext('2d');x.fillStyle=c1;x.fillRect(0,0,16,256);x.fillStyle=c2;for(let i=0;i<n;i++)x.fillRect(0,i*256/n,16,256/n*.42);
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function canTex(){const cv=document.createElement('canvas');cv.width=256;cv.height=128;const x=cv.getContext('2d');const g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'#1fb5a8');g.addColorStop(1,'#0d7f8c');x.fillStyle=g;x.fillRect(0,0,256,128);
  x.fillStyle='#ffd23f';x.beginPath();x.moveTo(0,90);for(let i=0;i<=16;i++)x.lineTo(i*16,90+Math.sin(i*1.2)*8);x.lineTo(256,128);x.lineTo(0,128);x.fill();
  x.fillStyle='#fff';x.font='800 34px "Golos Text",Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('ЛИМОНАД',128,52);
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;return t}
function makePlayer(o){o=o||{};
  const SK=o.skin||'#f2c9a6';const std=(h,r,m)=>{const M=new THREE.MeshStandardMaterial({color:h,roughness:r===undefined?.8:r,metalness:m||0});M.color.convertSRGBToLinear();return M};
  const M={shirt:std(o.shirt||0xd9c9a3,.85),tee:new THREE.MeshStandardMaterial({map:stripeTex(o.tee1||'#f4f4f0',o.tee2||'#1d2f6a',22),roughness:.8}),jeans:std(o.jeans||0x7ea3cc,.9),cuff:std(o.cuff||0xb9d0e8,.9),
    shoe:std(o.shoe||0xf6f6f2,.55),sole:std(o.sole||0xf08a24,.7),skin:std(parseInt(SK.slice(1),16),.65),hair:std(o.hair||0xe6c477,.75),hair2:std(o.hair2||0xf3dc9c,.7),glass:std(0x101418,.15,.4),bag:std(0x1c1d20,.6),strap:std(0x2a2b2e,.7),
    head:new THREE.MeshStandardMaterial({map:faceTex({bg:SK,iris:o.iris||'#3b7fd4',brow:o.brow||'#b88a3e',grin:true}),roughness:.6})};
  const hipY=.70;
  const root=new THREE.Group();
  const hips=new THREE.Group();hips.position.y=hipY;root.add(hips);
  const pel=new THREE.Mesh(rbox(.36,.17,.22,.05),M.jeans);pel.position.y=.02;hips.add(pel);
  const spine=new THREE.Group();spine.position.y=.08;hips.add(spine);
  // torso: open sand overshirt over a striped "тельняшка"
  const tor=new THREE.Mesh(rbox(.42,.47,.24,.07),M.shirt);tor.position.y=.235;spine.add(tor);
  const tee=new THREE.Mesh(new THREE.PlaneGeometry(.17,.43),M.tee);tee.position.set(0,.225,.1215);spine.add(tee);
  for(const s of [-1,1]){const lap=new THREE.Mesh(new THREE.BoxGeometry(.075,.16,.012),M.shirt);lap.position.set(s*.085,.40,.125);lap.rotation.z=s*.38;spine.add(lap);
    const btn=new THREE.Mesh(new THREE.BoxGeometry(.012,.4,.012),M.shirt);btn.position.set(s*.092,.21,.126);spine.add(btn)}
  // crossbody bag
  {const strap=new THREE.Mesh(new THREE.BoxGeometry(.04,.62,.012),M.strap);strap.position.set(0,.24,.128);strap.rotation.z=.72;spine.add(strap);
   const strapB=strap.clone();strapB.position.z=-.128;spine.add(strapB);
   const bag=new THREE.Mesh(rbox(.2,.13,.07,.025),M.bag);bag.position.set(-.2,.04,.06);bag.rotation.y=-.5;spine.add(bag)}
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.055,.06,.07,10),M.skin);neck.position.y=.495;spine.add(neck);
  const head=new THREE.Group();head.position.y=.52;spine.add(head);
  const HR=.152,HH=.29;
  const hm=new THREE.Mesh(headGeo(HR,HH),M.head);head.add(hm);
  // blonde hair: cap, back, side-swept fringe, sunglasses pushed up
  {const cap=new THREE.SphereGeometry(HR*1.08,24,12,0,Math.PI*2,0,Math.PI*.5);cap.scale(1,.62,1.02);cap.translate(0,HH*.74,-.006);head.add(new THREE.Mesh(cap,M.hair));
   const back=new THREE.CylinderGeometry(HR*1.07,HR*1.04,HH*.56,22,1,true,Math.PI*.62,Math.PI*.76);back.translate(0,HH*.48,0);head.add(new THREE.Mesh(back,M.hair));
   for(const s of [-1,1]){const sb=new THREE.Mesh(rbox(.03,.09,.06,.012,2),M.hair);sb.position.set(s*HR*1.0,HH*.62,-.01);head.add(sb)}
   const fr=[[-.075,.86,.118,.075,.045,.055,.4],[.0,.9,.128,.08,.05,.055,.2],[.07,.86,.122,.07,.045,.05,-.1],[.115,.8,.1,.045,.04,.045,-.5],[-.03,.95,.1,.1,.05,.07,.3]];
   for(const [x,y,z,a,b,c,rz] of fr){const g=new THREE.SphereGeometry(1,12,8);g.scale(a,b,c);const m=new THREE.Mesh(g,x>.05?M.hair2:M.hair);m.position.set(x,HH*y,z);m.rotation.z=rz;head.add(m)}
   const gl=new THREE.Group();gl.position.set(0,HH*1.03,.07);gl.rotation.x=-.5;head.add(gl);
   for(const s of [-1,1]){const l=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),M.glass);l.scale.set(.042,.03,.012);l.position.x=s*.05;gl.add(l)}
   const br=new THREE.Mesh(new THREE.BoxGeometry(.04,.008,.008),M.glass);gl.add(br);
   for(const s of [-1,1]){const arm=new THREE.Mesh(new THREE.BoxGeometry(.006,.006,.14),M.glass);arm.position.set(s*.09,0,-.07);gl.add(arm)}}
  const arms=[],legs=[];
  for(const s of [-1,1]){
    const shg=new THREE.Group();shg.position.set(s*.272,.42,0);spine.add(shg);
    const slv=new THREE.Mesh(rbox(.15,.19,.15,.05),M.shirt);slv.position.y=-.075;shg.add(slv);
    const up=new THREE.Mesh(rbox(.112,.2,.112,.045),M.skin);up.position.y=-.2;shg.add(up);
    const el=new THREE.Group();el.position.y=-.27;shg.add(el);
    const lo=new THREE.Mesh(rbox(.108,.2,.108,.045),M.skin);lo.position.y=-.09;el.add(lo);
    const hand=new THREE.Mesh(rbox(.11,.1,.085,.04,2),M.skin);hand.position.y=-.215;el.add(hand);
    arms.push({sh:shg,el,s,hand});
    const hp=new THREE.Group();hp.position.set(s*.095,-.03,0);hips.add(hp);
    const th=new THREE.Mesh(rbox(.165,.36,.18,.05),M.jeans);th.position.y=-.17;hp.add(th);
    const kn=new THREE.Group();kn.position.y=-.33;hp.add(kn);
    const sh=new THREE.Mesh(rbox(.155,.27,.17,.05),M.jeans);sh.position.y=-.12;kn.add(sh);
    const cf=new THREE.Mesh(rbox(.165,.045,.18,.02,2),M.cuff);cf.position.y=-.245;kn.add(cf);
    const ft=new THREE.Group();ft.position.y=-.27;kn.add(ft);
    const shoe=new THREE.Mesh(rbox(.15,.1,.28,.045),M.shoe);shoe.position.set(0,-.02,.05);ft.add(shoe);
    const sole=new THREE.Mesh(rbox(.158,.035,.29,.015,2),M.sole);sole.position.set(0,-.065,.05);ft.add(sole);
    legs.push({hp,kn,ft,s});
  }
  // can of lemonade in the left hand
  const can=new THREE.Group();const cb=new THREE.Mesh(new THREE.CylinderGeometry(.033,.033,.115,16),[new THREE.MeshStandardMaterial({map:canTex(),roughness:.35,metalness:.5}),std(0xc9cdd2,.3,.8),std(0xc9cdd2,.3,.8)]);can.add(cb);
  can.position.set(.0,-.245,.045);can.rotation.y=Math.PI/2;arms[0].el.add(can);
  // scooter
  const sc=new THREE.Group();const mS=std(0x222428,.5,.4),mA=std(0x9fd8d6,.5),mW=std(0x111111,.9);
  const deck=new THREE.Mesh(new THREE.BoxGeometry(.16,.05,.78),mS);deck.position.set(0,.1,0);sc.add(deck);
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(.165,.02,.6),mA);stripe.position.set(0,.13,0);sc.add(stripe);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.86,6),mS);stem.position.set(0,.52,.4);stem.rotation.x=-.12;sc.add(stem);
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.5,6),mS);bar.rotation.z=Math.PI/2;bar.position.set(0,.94,.45);sc.add(bar);
  for(const z of [-.38,.44]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.05,12),mW);w.rotation.z=Math.PI/2;w.position.set(0,.1,z);sc.add(w)}
  sc.visible=false;root.add(sc);
  // speaker (held in right hand)
  const spk=new THREE.Group();const body=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.24,16),std(0x1b1d22,.6,.2));body.rotation.z=Math.PI/2;spk.add(body);
  const grill=new THREE.Mesh(new THREE.CylinderGeometry(.077,.077,.18,16,1,true),std(0x2a7fbf,.5,.3));grill.rotation.z=Math.PI/2;spk.add(grill);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.06,.006,6,16),new THREE.MeshStandardMaterial({color:0x66ccff,emissive:0x2299ff,emissiveIntensity:1.5}));ring.rotation.y=Math.PI/2;ring.position.x=.121;spk.add(ring);
  spk.position.set(0,-.3,.02);arms[1].el.add(spk);spk.visible=false;
  return {root,hips,spine,head,arms,legs,scooter:sc,speaker:spk,speakerRing:ring,can,phase:0,hipY,idle:0};
}
function animPlayer(P,st,dt){
  const sp=st.spd;const walkF=sp<.05?0:Math.min(1,sp/1.2);const HY=P.hipY;
  const carry=P.speaker.visible;const L=P.arms[0];
  P.head.rotation.set(0,0,0);
  if(st.mode==='sit'){
    P.scooter.visible=false;P.hips.position.y=.55;P.spine.rotation.x=-.04;
    for(const g of P.legs){g.hp.rotation.x=-1.5;g.kn.rotation.x=1.45;g.ft.rotation.x=0}
    for(const A of P.arms){A.sh.rotation.x=-.35;A.sh.rotation.z=A.s*-.08;A.el.rotation.x=-.9}
    P.idle+=dt;sipAnim(P,dt);return;
  }
  if(st.mode==='scoot'){
    P.scooter.visible=true;P.phase+=dt*(1+sp*.3);
    P.hips.position.y=HY+.12+Math.sin(P.phase*2)*.005;P.spine.rotation.x=.12;
    for(const g of P.legs){const f=g.s>0;g.hp.rotation.x=f?-.18:.25;g.kn.rotation.x=f?.18:.12;g.ft.rotation.x=0}
    for(const A of P.arms){A.sh.rotation.x=-1.05;A.sh.rotation.z=A.s*-.15;A.el.rotation.x=-.3}
    P.head.rotation.x=-.08;return;
  }
  P.scooter.visible=false;
  const run=sp>2.8;
  P.phase+=dt*sp*Math.PI*(run?.7:1.05)/Math.max(.6,sp*.35+.6);
  const ph=P.phase;const amp=run?1.0:.6*walkF;
  if(st.mode==='air'){
    for(const g of P.legs){g.hp.rotation.x=g.s>0?-.7:.25;g.kn.rotation.x=g.s>0?1.1:.5;g.ft.rotation.x=0}
    for(const A of P.arms){A.sh.rotation.x=-.6;A.sh.rotation.z=A.s*-.5;A.el.rotation.x=-.6}
    P.spine.rotation.x=.1;P.hips.position.y=HY;P.idle=0;return;
  }
  for(const g of P.legs){const q=ph+(g.s>0?0:Math.PI);
    g.hp.rotation.x=-Math.sin(q)*amp*(run?1.0:.75);g.kn.rotation.x=Math.max(0,Math.sin(q+(run?1.9:1.3)))*amp*(run?1.6:1.0)+.04;g.ft.rotation.x=-Math.max(0,-Math.sin(q))*.2*amp}
  for(const A of P.arms){const q=ph+(A.s>0?Math.PI:0);
    A.sh.rotation.x=-Math.sin(q)*amp*(run?.95:.6);A.sh.rotation.z=A.s*-.06;A.el.rotation.x=-(run?1.3:.2+.25*walkF);
    if(carry&&A.s>0){A.sh.rotation.x=-.25-Math.sin(q)*amp*.2;A.el.rotation.x=-.6}
    if(A.s<0&&!run){A.sh.rotation.x=-.15-Math.sin(q)*amp*.25;A.el.rotation.x=-.75}}   // holding the can
  const idle=1-walkF;
  P.hips.position.y=HY+Math.abs(Math.cos(ph))*.035*amp-(run?.05:0)+idle*Math.sin(performance.now()*.002)*.005;
  P.spine.rotation.x=run?.2:.03*walkF;P.head.rotation.x=run?-.12:0;
  if(sp<.15){P.idle+=dt;sipAnim(P,dt)}else P.idle=0;
  if(carry&&window.SPK&&SPK.playing){const b=Math.sin(UNI.uTime.value*Math.PI*2*(SPK.bpm/60));P.head.rotation.x+=b*.06*(1-walkF*.5);P.speakerRing.material.emissiveIntensity=1+Math.max(0,b)*2}
}
// every few seconds while standing/sitting: take a sip from the can
function sipAnim(P,dt){const t=P.idle%7;if(t<4.6)return;const k=Math.sin(Math.min(1,(t-4.6)/2.4)*Math.PI);const A=P.arms[0];
  A.sh.rotation.x=-.15-1.55*k;A.sh.rotation.z=A.s*-.06+.25*k;A.el.rotation.x=-.75-1.15*k;P.head.rotation.x=-.28*k}
// ===================== NPC people (instanced, same blocky style) =====================
const NPC_P={};
const _m=new THREE.Matrix4(),_m2=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3(1,1,1),_c=new THREE.Color();
const ND={hy:.84,legL:.80,torH:.54,shY:.48,armL:.6,headY:.58,HR:.158,HH:.3};
function initPeopleMeshes(scene,N){
  const torso=rbox(.44,ND.torH,.25,.07,2);torso.translate(0,ND.torH/2,0);
  const head=headGeo(ND.HR,ND.HH,18);
  const hair=new THREE.SphereGeometry(ND.HR*1.08,14,7,0,Math.PI*2,0,Math.PI*.5);hair.scale(1,.62,1.03);hair.translate(0,ND.HH*.74,-.008);
  const hb=new THREE.CylinderGeometry(ND.HR*1.07,ND.HR*1.04,ND.HH*.5,12,1,true,Math.PI*.62,Math.PI*.76);hb.translate(0,ND.HH*.5,0);
  const hairG=mergeG([hair,hb]);
  const longH=rbox(.33,.36,.1,.04,1);longH.translate(0,ND.HH*.42,-.13);
  const leg=rbox(.165,ND.legL,.18,.05,2);leg.translate(0,-ND.legL/2,0);
  const arm=rbox(.125,ND.armL-.08,.125,.05,2);arm.translate(0,-(ND.armL-.08)/2,0);
  const shoe=rbox(.155,.1,.27,.045,2);shoe.translate(0,-ND.legL-.03,.045);
  const hips=rbox(.37,.17,.23,.05,2);
  const skirt=new THREE.CylinderGeometry(.21,.31,.56,14,1,true);skirt.translate(0,-.22,0);
  const scarf=new THREE.SphereGeometry(ND.HR*1.14,14,10,0,Math.PI*2,0,Math.PI*.62);scarf.scale(1.02,1.0,1.08);scarf.translate(0,ND.HH*.55,-.01);
  const hand=rbox(.11,.1,.085,.04,1);hand.translate(0,-ND.armL+.02,0);
  const mk=(g,n,side,map)=>{const m=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.8,side:side||THREE.FrontSide,map:map||null}),n);m.frustumCulled=false;m.castShadow=true;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.setColorAt(0,new THREE.Color(1,1,1));m.count=0;scene.add(m);return m};
  NPC_P.torso=mk(torso,N);NPC_P.head=mk(head,N,null,faceTex({bg:null,iris:'#4a3a2a',brow:'#3a2a1e'}));NPC_P.hand=mk(hand,N*2);NPC_P.hair=mk(hairG,N);NPC_P.hairL=mk(longH,N);NPC_P.leg=mk(leg,N*2);NPC_P.arm=mk(arm,N*2);NPC_P.shoe=mk(shoe,N*2);NPC_P.hips=mk(hips,N);
  NPC_P.skirt=mk(skirt,N,THREE.DoubleSide);NPC_P.scarf=mk(scarf,N);
  BUBBLES.init(scene);
}
function placePeople(list){
  const P=NPC_P;let k=0,ks=0,kh=0,kc=0,kl=0;
  const cx=camera.position.x,cy=camera.position.y,cz=camera.position.z;const cap=P.torso.instanceMatrix.count;
  for(const n of list){
    if(k>=cap)break;   // never write past the instance buffers
    if(Math.abs(n.x-cx)<1.0&&Math.abs(n.z-cz)<1.0&&cy-n.y<2.4&&cy-n.y>-.5)continue;   // never let an NPC fill the camera
    const ph=n.phase;const pose=n.pose||'walk';const amp=(pose==='walk'&&n.moving)?.5:0;
    _e.set(0,n.yaw,0);_q.setFromEuler(_e);_v.set(n.x,n.y,n.z);_s.set(n.sc,n.sc,n.sc);_m.compose(_v,_q,_s);
    const part=(mesh,idx,ox,oy,oz,rx,col,rz)=>{_e.set(rx,0,rz||0);_q.setFromEuler(_e);_v.set(ox,oy,oz);_s.set(1,1,1);_m2.compose(_v,_q,_s);_m2.premultiply(_m);mesh.setMatrixAt(idx,_m2);if(col!==undefined)mesh.setColorAt(idx,linHex(col))};
    const sit=pose==='sit';const hy=sit?.5:ND.hy;const bob=Math.abs(Math.cos(ph))*.035*amp*2;
    part(P.hips,k,0,hy+bob,0,0,n.cP);
    part(P.torso,k,0,hy+.07+bob,0,pose==='talk'?-.03:.03,n.cT);
    const hY=hy+.07+ND.torH+.05+bob;
    part(P.head,k,0,hY,0,pose==='talk'?Math.sin(UNI.uTime.value*2+n.phase)*.08:0,n.cS);
    if(n.scarf){part(P.scarf,kc,0,hY,0,0,n.cH);kc++}else{part(P.hair,kh,0,hY,0,0,n.cH);kh++;if(n.skirt||n.longH){part(P.hairL,kl,0,hY,0,0,n.cH);kl++}}
    if(n.skirt){part(P.skirt,ks,0,hy+bob,0,0,n.cP);ks++}
    for(let s=0;s<2;s++){const sg=s?1:-1,q=ph+(s?Math.PI:0);
      if(sit){part(P.leg,k*2+s,sg*.1,hy,0,-1.5,n.cP);part(P.shoe,k*2+s,sg*.1,hy,0,-1.5,n.cF)}
      else{part(P.leg,k*2+s,sg*.1,hy-.04+bob,0,-Math.sin(q)*amp,n.skirt?n.cS:n.cP);part(P.shoe,k*2+s,sg*.1,hy-.04+bob,0,-Math.sin(q)*amp,n.cF)}
      let ax=Math.sin(q)*amp*.8,az=sg*-.05;
      if(pose==='talk'&&s===(n.hand||0)){ax=-.6-.4*Math.max(0,Math.sin(UNI.uTime.value*3+n.phase));az=sg*-.2}
      if(sit)ax=-.4;
      if(n.basket&&s===1){ax=-.25;az=.05}
      part(P.arm,k*2+s,sg*.285,hy+.07+ND.shY+bob,0,ax,n.cT,az);
      part(P.hand,k*2+s,sg*.285,hy+.07+ND.shY+bob,0,ax,n.cS,az);
    }
    k++;
  }
  const set=(m,c)=>{m.count=c;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true};
  set(P.hand,k*2);set(P.hips,k);set(P.torso,k);set(P.head,k);set(P.leg,k*2);set(P.arm,k*2);set(P.shoe,k*2);set(P.hair,kh);set(P.hairL,kl);set(P.skirt,ks);set(P.scarf,kc);
}
function mergeG(list){const g=new GB({position:3,normal:3});for(const ge of list){const G=ge.index?ge.toNonIndexed():ge;const p=G.attributes.position,n=G.attributes.normal;
  for(let i=0;i<p.count;i+=3){const ids=[];for(let j=0;j<3;j++)ids.push(g.v({position:[p.getX(i+j),p.getY(i+j),p.getZ(i+j)],normal:[n.getX(i+j),n.getY(i+j),n.getZ(i+j)]}));g.tri(...ids)}}return g.build()}
function linHex(h){_c.setHex(h);_c.convertSRGBToLinear();return _c}
// ---------- speech bubbles ----------
const PHRASES=['Whaddya say!','Oh, I beg you!','Yes, indeed.','Don\'t make me nervous!','Oh, please…','Two big differences!','Where are you rushing to?','How much are the gobies at Pryvoz today?','This is Odesa!','Listen here…','Don\'t mess with my head','The sea is warm as fresh milk today','Where\'s the stop for Arkadia?','You\'ll laugh, but…','Mum said be home by six','What, roadworks again?','Let\'s go to the beach!','What weather, eh!'];
const BUBBLES={pool:[],init(scene){for(let i=0;i<6;i++){const cv=document.createElement('canvas');cv.width=512;cv.height=128;const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:true,toneMapped:false,fog:false}));s.scale.set(3.2,.8,1);s.visible=false;scene.add(s);this.pool.push({s,cv,tex,txt:''})}},
  show(i,x,y,z,txt){const b=this.pool[i];if(!b)return;if(b.txt!==txt){b.txt=txt;const c=b.cv.getContext('2d');c.clearRect(0,0,512,128);c.fillStyle='rgba(255,255,255,.94)';
    c.beginPath();c.roundRect?c.roundRect(8,8,496,92,26):c.rect(8,8,496,92);c.fill();c.beginPath();c.moveTo(240,98);c.lineTo(256,124);c.lineTo(276,98);c.fill();
    c.fillStyle='#16222a';c.textAlign='center';c.textBaseline='middle';let fs=40;c.font=`700 ${fs}px "Golos Text",Arial,sans-serif`;while(c.measureText(txt).width>470&&fs>18){fs-=2;c.font=`700 ${fs}px "Golos Text",Arial,sans-serif`}c.fillText(txt,256,54);b.tex.needsUpdate=true}
    b.s.position.set(x,y,z);b.s.visible=true},
  hideAll(){for(const b of this.pool)b.s.visible=false}};
