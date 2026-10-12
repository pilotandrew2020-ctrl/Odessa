// ===================== Odesa Opera: exterior + enterable interior =====================
let OPERA=null;
function buildOpera(grp,G,P,Sg,GR){
  const o0=LMK.opera;const o={x:o0.x,y:o0.y,a:o0.a+Math.PI};const F=frame(o.x,o.y,o.a);const y0=groundH(o.x,o.y);
  const C=[4,0],R0=13.8,R1=17.2;              // horseshoe hall centre + tier radii
  const ry=-o.a;const from0=grp.children.length;
  OPERA={F,y0};
  const CEIL_F=9.6,MEZ=6.0,FLR=1.2;
  // ---------- materials ----------
  const M={
    cream:new THREE.MeshStandardMaterial({color:0xdccdab,roughness:.75}),
    gold:new THREE.MeshStandardMaterial({color:0xd0a645,roughness:.32,metalness:.85}),
    velvet:new THREE.MeshStandardMaterial({color:0x6e0d16,roughness:.92,emissive:0x140204}),
    curtain:new THREE.MeshStandardMaterial({color:0x8a0f1c,roughness:.9,side:THREE.DoubleSide}),
    dark:new THREE.MeshStandardMaterial({color:0x3a2416,roughness:.6}),
    marble:new THREE.MeshStandardMaterial({color:0xe2d8c8,roughness:.3}),
    carpet:new THREE.MeshStandardMaterial({color:0x8e1520,roughness:.95}),
    copper:new THREE.MeshStandardMaterial({color:0x4f7d6c,roughness:.45,metalness:.45}),
    stone:new THREE.MeshStandardMaterial({color:0xe2d6bc,roughness:.8}),
    crystal:new THREE.MeshStandardMaterial({color:0xfff4d8,emissive:0xffd890,emissiveIntensity:2.2,roughness:.1}),
  };
  const parqM=[];
  ANIM.push(()=>{const k=1-.9*UNI.uIndoor.value;for(const m of Object.values(M))m.envMapIntensity=k;for(const m of parqM)m.envMapIntensity=k;
    const ins=curIndoor&&curIndoor.name==='opera';if(ins&&OPERA.lights){const sit=!!player.sit;OPERA.lights[0].userData.i=sit?1.1:2.6;OPERA.lights[2].userData.i=sit?.5:1.4;const fu=F.inv(player.x,player.z)[0];OPERA.ind.exp=sit?.8:(fu<-14?.78:.95)}});
  const add=(geo,mat,x,y,z,rotY,cast)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.y=rotY===undefined?ry:rotY;if(cast!==false){m.castShadow=true;m.receiveShadow=true}grp.add(m);return m};
  const boxAt=(u,v,yy,su,sy,sv,mat,cast)=>{const p=F.P(u,v);return add(new THREE.BoxGeometry(su,sy,sv),mat,p[0],y0+yy,p[1],ry,cast)};
  // ---------- exterior: round front rotunda + body + stage house (facade shader) ----------
  const RF=34,CF=-14,NS=25;
  const outer=[];for(let i=0;i<=NS;i++){const t=Math.PI/2+i/NS*Math.PI;outer.push(F.P(CF+Math.cos(t)*RF,Math.sin(t)*RF))}
  outer.push(F.P(14,-RF));outer.push(F.P(14,-26));outer.push(F.P(46,-26));outer.push(F.P(46,26));outer.push(F.P(14,26));outer.push(F.P(14,RF));
  const apexL=2*RF*Math.sin(Math.PI/NS/2);
  wallStrip2(G,outer,y0,y0+19.6,OPERA_ST,3,40,{edge:Math.floor(NS/2),a:0,b:apexL,top:7.2});
  wallStrip2(G,[F.P(14,-26),F.P(46,-26),F.P(46,26),F.P(14,26)],y0+19.6,y0+30,OPERA_ST,3,41);
  // roofs: flat over the body (so nothing is see-through from above), stage house roof, metal dome over the hall, lantern
  {const roofM=new THREE.MeshStandardMaterial({color:0x8a8f90,roughness:.6,metalness:.2,side:THREE.DoubleSide});const c=outer.map(p=>new THREE.Vector2(p[0],p[1]));
   const tr=THREE.ShapeUtils.triangulateShape(c,[]);const pos=[];for(const t of tr)for(const k of t)pos.push(c[k].x,y0+19.6,c[k].y);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();
   const m=new THREE.Mesh(g,roofM);m.receiveShadow=true;grp.add(m);
   const sh=new THREE.Mesh(new THREE.BoxGeometry(32,.4,52.4),roofM);const sc=F.P(30,0);sh.position.set(sc[0],y0+30.2,sc[1]);sh.rotation.y=ry;grp.add(sh)}
  M.copper.color.set(0x6d7f86);M.copper.metalness=.55;M.copper.roughness=.4;
  {const c=F.P(4,0);const dome=new THREE.SphereGeometry(1,48,16,0,Math.PI*2,0,Math.PI/2);dome.scale(19.5,10.5,19);add(dome,M.copper,c[0],y0+19.6,c[1]);
   add(new THREE.CylinderGeometry(1.8,2.3,3.4,16),M.stone,c[0],y0+31.4,c[1]);add(new THREE.SphereGeometry(2.0,16,8,0,Math.PI*2,0,Math.PI/2),M.copper,c[0],y0+33.1,c[1]);
   for(let k=0;k<16;k++){const an=k/16*Math.PI*2;const p=[c[0]+Math.cos(an)*19.3,c[1]+Math.sin(an)*18.8];add(new THREE.BoxGeometry(.9,1.6,.9),M.stone,p[0],y0+20.4,p[1],an)}
   // rotunda roof ring + balustrade with small statues along the front
   for(let i=0;i<NS;i++){const t=Math.PI/2+(i+.5)/NS*Math.PI;const p=F.P(CF+Math.cos(t)*(RF-.3),Math.sin(t)*(RF-.3));add(new THREE.BoxGeometry(.5,1.1,apexL),M.stone,p[0],y0+20.15,p[1],-o.a-t);
     if(i%3===1){const q=F.P(CF+Math.cos(t)*(RF-.4),Math.sin(t)*(RF-.4));add(new THREE.CylinderGeometry(.32,.45,1.7,8),M.stone,q[0],y0+21.6,q[1]);add(new THREE.SphereGeometry(.3,8,6),M.stone,q[0],y0+22.7,q[1])}}}
  // the main portal (loggia) at the apex: piers, paired columns, two-tier arch, attic with sculpture group
  {const ux=CF-RF;const pier=(v)=>{boxAt(ux-3,v,13,6,26,5,M.stone);for(const dv of [-1.6,1.6]){const p=F.P(ux-6.3,v+dv);add(new THREE.CylinderGeometry(.6,.68,11,14),M.stone,p[0],y0+1.2+5.5,p[1]);add(new THREE.CylinderGeometry(.5,.56,8,14),M.stone,p[0],y0+13.5+4,p[1]);STATIC_CIR.push(p[0],p[1],.7)}};
   pier(-7.5);pier(7.5);
   boxAt(ux-3.2,0,24.6,6.4,5.2,20,M.stone);boxAt(ux-3.4,0,12.9,6.8,1.6,20.4,M.stone);boxAt(ux-3.6,0,27.5,7.2,.8,20.8,M.stone);
   for(const [yc,r] of [[9.2,5.0],[19.6,4.8]]){const arch=new THREE.TorusGeometry(r,.55,8,24,Math.PI);const p=F.P(ux-6.1,0);const m=add(arch,M.stone,p[0],y0+yc,p[1],ry+Math.PI/2)}
   boxAt(ux-.2,0,10.2,.4,4.6,10,M.stone);boxAt(ux-.2,0,20.9,.4,1.6,9.6,M.stone);
   // balcony rail on the upper loggia
   boxAt(ux-5.6,0,14.4,.4,1.1,10,M.gold);
   // sculpture group: Melpomene on a chariot with four panthers
   const st=new THREE.MeshStandardMaterial({color:0xb7ad98,roughness:.7});const base=F.P(ux-3.2,0);
   add(new THREE.BoxGeometry(5,1.4,3),st,base[0],y0+28.6,base[1]);
   const fig=F.P(ux-2.2,0);add(new THREE.CylinderGeometry(.55,.9,3.4,10),st,fig[0],y0+31,fig[1]);add(new THREE.SphereGeometry(.45,10,8),st,fig[0],y0+33,fig[1]);
   const arm=add(new THREE.BoxGeometry(.25,2.2,.25),st,fig[0],y0+33.2,fig[1]);arm.rotation.z=.5;
   for(const dv of [-2.4,-.8,.8,2.4]){const p=F.P(ux-5.4,dv);const body=add(new THREE.BoxGeometry(2.2,.9,.8),st,p[0],y0+30.2,p[1]);const h=F.P(ux-6.6,dv);add(new THREE.SphereGeometry(.42,8,6),st,h[0],y0+30.7,h[1])}
   // entrance steps up to the floor level
   for(let k=0;k<4;k++){const u=ux-4-k*.45;boxAt(u+.22,0,FLR*(4-k)/4/2,.45+(k===0?7:0),FLR*(4-k)/4,9+k*1.2,M.stone)}
   for(const v of [-3,3])EXTRA_LAMPS.push([F.P(ux-7,v)[0],y0+5,F.P(ux-7,v)[1],7])}
  // side porches (arcades) on both flanks
  for(const sg of [-1,1]){boxAt(0,sg*(RF+3),4.6,18,9.2,6,M.stone);for(let k=-3;k<=3;k++){const p=F.P(k*2.6,sg*(RF+5.8));add(new THREE.CylinderGeometry(.38,.42,8,10),M.stone,p[0],y0+4,p[1])}boxAt(0,sg*(RF+5.8),8.6,18,.8,1.2,M.stone)}
  // night floodlights on the facade
  for(const v of [-20,-8,8,20])EXTRA_LAMPS.push([F.P(-60,v)[0],y0+4,F.P(-60,v)[1],7]);
  // ---------- interior ----------
  // foyer floor (marble) + hall floor (parquet-like) + stage floor
  groundQuad(GR,[F.P(-31,-25),F.P(-14,-25),F.P(-14,25),F.P(-31,25)],6,y0+FLR+.01);
  const parq=new THREE.MeshStandardMaterial({map:TX.wood,roughness:.45});parqM.push(parq);TX.wood.encoding=THREE.sRGBEncoding;
  {const g=new THREE.PlaneGeometry(36,36);g.rotateX(-Math.PI/2);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*12,uv.getY(i)*12);TX.wood.wrapS=TX.wood.wrapT=THREE.RepeatWrapping;
   const c=F.P(4,0);add(g,parq,c[0],y0+FLR+.012,c[1],ry,false).receiveShadow=true}
  {const g=new THREE.BoxGeometry(13,1.4,26);const c=F.P(20.5,0);const m=add(g,parq,c[0],y0+FLR+.7+.01,c[1])}
  // carpet aisles
  boxAt(1,0,FLR+.03,20,.02,1.8,M.carpet,false);
  // inner walls: foyer/hall separation at u=-14 (with doors at v=±6, upper doors too)
  const wallH=(u,va,vb,ya,yb,mat)=>{boxAt(u,(va+vb)/2,(ya+yb)/2,.6,yb-ya,Math.abs(vb-va),mat||M.cream)};
  wallH(-14,-24,-7.5,FLR,CEIL_F);wallH(-14,-4.5,4.5,FLR,CEIL_F);wallH(-14,7.5,24,FLR,CEIL_F);
  for(const v of [-6,6]){wallH(-14,v-1.5,v+1.5,FLR+3.4,MEZ);wallH(-14,v-1.5,v+1.5,MEZ+2.6,CEIL_F);
    const f=F.P(-14.2,v);for(const yy of [FLR+3.5,MEZ+2.7])add(new THREE.BoxGeometry(.2,.3,3.4),M.gold,f[0],y0+yy,f[1])}
  // outer lining of the shell (so the inside is not see-through)
  {const pts=[];pts.push([-30.6,-25.6]);pts.push([5,-25.6]);for(let i=1;i<28;i++){const t=-Math.PI/2+i/28*Math.PI;pts.push([5+Math.cos(t)*25.6,Math.sin(t)*25.6])}pts.push([5,25.6]);pts.push([-30.6,25.6]);
   const g=new GB({position:3,normal:3,uv:2});
   for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];
     if(i===pts.length-1){ // front wall with door gap v in [-1.8,1.8]
       for(const [va,vb] of [[a[1],1.8],[-1.8,b[1]]]){const pa=F.P(a[0],va),pb=F.P(a[0],vb);liningQuad(g,pa,pb,y0+FLR,y0+CEIL_F+8,[F.ca,F.sa])}
       const pa=F.P(a[0],-1.8),pb=F.P(a[0],1.8);liningQuad(g,pa,pb,y0+FLR+4.2,y0+CEIL_F+8,[F.ca,F.sa]);continue}
     const pa=F.P(a[0],a[1]),pb=F.P(b[0],b[1]);const mx=(a[0]+b[0])/2-4,mv=(a[1]+b[1])/2;const l=Math.hypot(mx,mv)||1;
     const n=F.P(4-mx/l,-mv/l);liningQuad(g,pa,pb,y0+FLR,y0+19,[n[0]-F.P(4,0)[0],n[1]-F.P(4,0)[1]])}
   const m=new THREE.Mesh(g.build(),M.cream);m.receiveShadow=true;grp.add(m)}
  // foyer ceiling + mezzanine slab + hall ceiling
  boxAt(-22.5,0,CEIL_F+.15,17,.3,50,M.cream,false);
  boxAt(-16.5,-12,MEZ-.15,5,.3,15,M.cream,false);boxAt(-16.5,12,MEZ-.15,5,.3,15,M.cream,false);boxAt(-16.5,0,MEZ-.15,5,.3,9,M.cream,false);
  boxAt(-19,0,MEZ+.6,.25,1.1,0.01,M.gold,false);
  // mezzanine balustrade (gold rail) at u=-19 except stair opening
  for(const [va,vb] of [[-20,-4.2],[4.2,20]]){boxAt(-19,(va+vb)/2,MEZ+1.0,.2,.12,vb-va,M.gold);boxAt(-19,(va+vb)/2,MEZ+.5,.12,1,vb-va,M.cream)}
  // grand staircase: steps with red carpet
  {const n=30;for(let i=0;i<n;i++){const u=-27+i*(8/n),h=FLR+(i+1)*(MEZ-FLR)/n;boxAt(u+.135,0,h-.09,.28,.18,8.2,M.marble);boxAt(u+.135,0,h+.005,.29,.01,4.2,M.carpet,false)}
   for(const sv of [-4.25,4.25]){const g=new THREE.BoxGeometry(8.4,.14,.24);const c=F.P(-23,sv);const m=add(g,M.gold,c[0],y0+(FLR+MEZ)/2+1.05,c[1]);m.rotateZ(Math.atan2(MEZ-FLR,8));
     const g2=new THREE.BoxGeometry(8.4,.9,.2);const m2=add(g2,M.marble,c[0],y0+(FLR+MEZ)/2+.5,c[1]);m2.rotateZ(Math.atan2(MEZ-FLR,8))}}
  // foyer columns + small chandeliers
  for(const u of [-28,-22,-16.5])for(const v of [-12,12]){const p=F.P(u,v);add(new THREE.CylinderGeometry(.42,.48,CEIL_F-FLR,14),M.marble,p[0],y0+(FLR+CEIL_F)/2,p[1]);STATIC_CIR.push(p[0],p[1],.55)}
  for(const v of [-12,12]){const p=F.P(-24,v);miniChandelier(grp,M,p[0],y0+CEIL_F-1.2,p[1])}
  // ---------- auditorium ----------
  // tier fronts (horseshoe) at several levels, loge partitions, outer hall wall
  const tierY=[MEZ,9.6,13.2,16.2];
  const arcPts=(r,n)=>{const a=[];for(let i=0;i<=n;i++){const t=Math.PI*.5+i/n*Math.PI;a.push([C[0]+Math.cos(t)*r,C[1]+Math.sin(t)*r])}return a};
  const ring=arcPts(R0,26),ringO=arcPts(R1+.4,26);
  const straight=(r,sgn)=>[[C[0],sgn*r],[12.5,sgn*r]];
  for(let li=0;li<tierY.length;li++){const ty=tierY[li];
    const segs=[];for(let i=0;i<ring.length-1;i++)segs.push([ring[i],ring[i+1]]);
    for(const s of [-1,1]){const st=straight(R0,s);segs.push([st[0],st[1]])}
    for(const [a,b] of segs){const pa=F.P(a[0],a[1]),pb=F.P(b[0],b[1]);const L=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]);const ang=Math.atan2(pb[0]-pa[0],pb[1]-pa[1]);
      const mx=(pa[0]+pb[0])/2,mz=(pa[1]+pb[1])/2;
      const front=new THREE.Mesh(new THREE.BoxGeometry(.25,1.1,L+.05),M.cream);front.position.set(mx,y0+ty+.55,mz);front.rotation.y=ang;grp.add(front);
      const rail=new THREE.Mesh(new THREE.BoxGeometry(.32,.12,L+.05),M.velvet);rail.position.set(mx,y0+ty+1.12,mz);rail.rotation.y=ang;grp.add(rail);
      const band=new THREE.Mesh(new THREE.BoxGeometry(.27,.14,L+.05),M.gold);band.position.set(mx,y0+ty+.25,mz);band.rotation.y=ang;grp.add(band);
      const slab=new THREE.Mesh(new THREE.BoxGeometry(R1-R0+.4,.3,L+.05),M.cream);
      const nrm=[(a[0]+b[0])/2-C[0],(a[1]+b[1])/2-C[1]];const nl=Math.hypot(...nrm)||1;const sc=F.P((a[0]+b[0])/2+nrm[0]/nl*(R1-R0)/2,(a[1]+b[1])/2+nrm[1]/nl*(R1-R0)/2);
      if(Math.abs(a[1])===R0&&Math.abs(b[1])===R0){const sp=F.P((a[0]+b[0])/2,a[1]+Math.sign(a[1])*(R1-R0)/2);slab.position.set(sp[0],y0+ty-.15,sp[1])}else slab.position.set(sc[0],y0+ty-.15,sc[1]);
      slab.rotation.y=ang;grp.add(slab);
      if(li===0)STATIC_WALLS.push({cx:mx,cz:mz,hw:.2,hd:L/2+.05,ca:Math.cos(-ang+Math.PI/2*0),sa:Math.sin(-ang),y0:y0+ty-.5,y1:y0+ty+1.4,_ang:ang});
    }
    // loge partitions
    for(let i=3;i<ring.length-1;i+=3){const a=ring[i];const nr=[a[0]-C[0],a[1]-C[1]];const nl=Math.hypot(...nr);const pp=F.P(a[0]+nr[0]/nl*1.1,a[1]+nr[1]/nl*1.1);
      const wd=[nr[0]/nl*F.ca-nr[1]/nl*F.sa,nr[0]/nl*F.sa+nr[1]/nl*F.ca];const part=new THREE.Mesh(new THREE.BoxGeometry(.12,2.4,2.2),M.cream);part.position.set(pp[0],y0+ty+1.2,pp[1]);part.rotation.y=Math.atan2(wd[0],wd[1]);grp.add(part);
      if(li===0)STATIC_WALLS.push({cx:pp[0],cz:pp[1],hw:.1,hd:1.1,ca:wd[1],sa:-wd[0],y0:y0+ty,y1:y0+ty+2.4})}
  }
  // fix tier-front collider orientation (box along segment)
  for(const w of STATIC_WALLS)if(w._ang!==undefined){const ang=w._ang;const dx=Math.sin(ang),dz=Math.cos(ang);w.ca=-dz;w.sa=dx;w.hw=.2;delete w._ang}
  // hall wall (behind loges) and ceiling with painting
  {const g=new GB({position:3,normal:3,uv:2});for(let i=0;i<ringO.length-1;i++){const a=ringO[i],b=ringO[i+1];const pa=F.P(a[0],a[1]),pb=F.P(b[0],b[1]);const c=F.P(C[0],C[1]);
     const mx=(pa[0]+pb[0])/2,mz=(pa[1]+pb[1])/2;const door=(i===10||i===15);
     const spans=door?[[FLR+3.4,MEZ],[MEZ+2.6,19]]:[[FLR,19]];
     for(const [ya,yb] of spans){liningQuad(g,pa,pb,y0+ya,y0+yb,[c[0]-mx,c[1]-mz]);wallSeg(pa[0],pa[1],pb[0],pb[1],.5,y0+ya,y0+(door&&yb===MEZ?MEZ-.5:yb))}}
   for(const sg of [-1,1]){const pa=F.P(C[0],sg*(R1+.4)),pb=F.P(14,sg*(R1+.4));wallSeg(pa[0],pa[1],pb[0],pb[1],.5,y0,y0+20)}
   for(const s of [-1,1]){const pa=F.P(C[0],s*(R1+.4)),pb=F.P(14,s*(R1+.4));liningQuad(g,pa,pb,y0+FLR,y0+19,[-F.sa*s*-1*0+(s>0?F.sa:-F.sa),s>0?-F.ca:F.ca])}
   const m=new THREE.Mesh(g.build(),M.velvet);grp.add(m)}
  {const tex=new THREE.CanvasTexture(ceilingCanvas());tex.encoding=THREE.sRGBEncoding;tex.anisotropy=8;
   const dome=new THREE.SphereGeometry(1,48,12,0,Math.PI*2,0,Math.PI*.5);dome.scale(R1+.4,3.2,R1+.4);
   const mat=new THREE.MeshStandardMaterial({map:tex,roughness:.8,side:THREE.BackSide,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.18});
   const c=F.P(C[0],C[1]);const m=add(dome,mat,c[0],y0+18.6,c[1],0,false);m.rotation.y=ry}
  boxAt(13,0,18.9,2.2,.6,36,M.cream,false);
  // the big chandelier
  {const c=F.P(C[0],C[1]);bigChandelier(grp,M,c[0],y0+15.2,c[1])}
  // seats (instanced)
  const seatG=mergeGeos2([[new THREE.BoxGeometry(.52,.12,.5),0,.42,0],[new THREE.BoxGeometry(.52,.62,.1),0,.78,-.22],[new THREE.BoxGeometry(.06,.3,.45),-.27,.55,0],[new THREE.BoxGeometry(.06,.3,.45),.27,.55,0]]);
  const seats=[];
  for(let u=-8.4;u<=9.6;u+=1.0){const half=Math.sqrt(Math.max(0,R0*R0-(u-C[0])**2))-1.2;const vmax=Math.min(half,R0-1.2);
    for(let v=-vmax;v<=vmax+.01;v+=.6){if(Math.abs(v)<.9)continue;if(Math.abs(Math.abs(v)-vmax)<.25&&vmax>6)continue;seats.push([u,v])}
    // row collider (two halves)
    for(const s of [-1,1]){if(vmax<1.4)continue;const c=F.P(u,s*(vmax+.9)/2);STATIC_WALLS.push({cx:c[0],cz:c[1],hw:.28,hd:(vmax-.9)/2+.3,ca:F.ca,sa:F.sa,y0:y0,y1:y0+FLR+.9})}}
  const sim=new THREE.InstancedMesh(seatG,M.velvet,seats.length);sim.frustumCulled=false;const Mx=new THREE.Matrix4(),Q=new THREE.Quaternion(),Sv=new THREE.Vector3(1,1,1),T=new THREE.Vector3();
  Q.setFromAxisAngle(new THREE.Vector3(0,1,0),ry+Math.PI/2);
  seats.forEach(([u,v],k)=>{const p=F.P(u,v);T.set(p[0],y0+FLR,p[1]);Mx.compose(T,Q,Sv);sim.setMatrixAt(k,Mx)});sim.receiveShadow=true;grp.add(sim);
  OPERA.seats=seats;
  INTERACT.push({x:0,z:0,r:1e9,label:'Sit',cond:()=>{if(!curIndoor||curIndoor.name!=='opera'||player.sit||player.y>y0+3)return false;const [u,v]=F.inv(player.x,player.z);
      let b=null,bd=1.1;for(const s of seats){const d=Math.hypot(s[0]-u,s[1]-v);if(d<bd){bd=d;b=s}}OPERA.near=b;return !!b},
    fn:()=>{const s=OPERA.near;if(!s)return;const p=F.P(s[0],s[1]);player.sit={x:p[0],z:p[1],y:y0+FLR+.05,yaw:Math.atan2(F.ca,F.sa)};cam.yaw=player.sit.yaw;cam.pitch=-.3;toast('The show has started','watch the stage')}});
  // stage: proscenium arch, curtains, screen with the film
  {const pa=(v,yy,sv,sy)=>boxAt(13.6,v,yy,1.2,sy,sv,M.gold);pa(-11.6,FLR+7.5,1.4,13.2);pa(11.6,FLR+7.5,1.4,13.2);pa(0,FLR+14.6,24.6,1.6);
   boxAt(13.6,0,FLR+16.5,1,2.4,27,M.cream);
   for(const s of [-1,1]){for(let i=0;i<7;i++){const v=s*(8.2+i*.45);const p=F.P(14.6,v);add(new THREE.CylinderGeometry(.32,.38,12.4,8),M.curtain,p[0],y0+FLR+1.4+6.2,p[1])}}
   const val=new THREE.BoxGeometry(.5,2,22);const vp=F.P(14.3,0);add(val,M.curtain,vp[0],y0+FLR+13.1,vp[1]);
   STATIC_WALLS.push({cx:F.P(13.2,-12)[0],cz:F.P(13.2,-12)[1],hw:.6,hd:1.2,ca:F.ca,sa:F.sa,y0:y0,y1:y0+20});STATIC_WALLS.push({cx:F.P(13.2,12)[0],cz:F.P(13.2,12)[1],hw:.6,hd:1.2,ca:F.ca,sa:F.sa,y0:y0,y1:y0+20})}
  // film screen = live render of the city from a camera flying over Odesa
  const filmRT=new THREE.WebGLRenderTarget(512,256);filmRT.texture.encoding=THREE.LinearEncoding;
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(17,8.5),new THREE.MeshBasicMaterial({map:filmRT.texture,toneMapped:false}));
  {const p=F.P(26.6,0);scr.position.set(p[0],y0+FLR+1.4+5.6,p[1]);scr.rotation.y=Math.atan2(-F.ca,-F.sa);grp.add(scr)}
  boxAt(26.9,0,FLR+1.4+5.6,.3,9.3,17.8,M.dark,false);
  const filmCam=new THREE.PerspectiveCamera(50,2,1,3000);let ft=0,frameN=0;
  ANIM.push(dt=>{if(!curIndoor||curIndoor.name!=='opera')return;const [u]=F.inv(player.x,player.z);if(u<-14&&!player.sit)return;
    ft+=dt;if((frameN++)%2)return;const a=ft*.05;const c=F.P(4,0);
    filmCam.position.set(c[0]+Math.cos(a)*260,y0+110+Math.sin(ft*.13)*30,c[1]+Math.sin(a)*260);filmCam.lookAt(c[0]+Math.cos(a+.6)*80,y0+20,c[1]+Math.sin(a+.6)*80);
    const was=[HOME_MARK&&HOME_MARK.visible];if(HOME_MARK)HOME_MARK.visible=false;
    const fog=scene.fog.density;scene.fog.density=fog*.5;renderer.setRenderTarget(filmRT);renderer.render(scene,filmCam);renderer.setRenderTarget(null);scene.fog.density=fog;
    if(HOME_MARK)HOME_MARK.visible=was[0]});
  // stage floor access steps
  for(const s of [-1,1])for(let i=0;i<4;i++)boxAt(12.6+i*.35,s*11.4,FLR+.18+i*.35,.36,.36+i*.7,2.2,M.dark);
  // ---------- lights ----------
  const lights=[];
  const pl=(u,v,yy,c,i,d)=>{const l=new THREE.PointLight(c,0,d,1.5);const p=F.P(u,v);l.position.set(p[0],y0+yy,p[1]);l.userData.i=i;grp.add(l);lights.push(l);return l};
  pl(C[0],C[1],14.5,0xffd9a0,3.2,46);pl(-23,0,CEIL_F-2.2,0xffe2b0,1.1,26);pl(20,0,10,0xfff0dd,1.6,24);
  // ---------- colliders: outer shell with door gap ----------
  const shellPts=[[-31,-26],[5,-26]];for(let i=1;i<28;i++){const t=-Math.PI/2+i/28*Math.PI;shellPts.push([5+Math.cos(t)*26,Math.sin(t)*26])}shellPts.push([5,26]);shellPts.push([-31,26]);
  for(let i=0;i<shellPts.length;i++){const a=shellPts[i],b=shellPts[(i+1)%shellPts.length];
    if(i===shellPts.length-1){for(const [va,vb] of [[a[1],1.8],[-1.8,b[1]]]){const pa=F.P(a[0],va),pb=F.P(a[0],vb);wallSeg(pa[0],pa[1],pb[0],pb[1],1.2,y0-3,y0+30)}continue}
    const pa=F.P(a[0],a[1]),pb=F.P(b[0],b[1]);wallSeg(pa[0],pa[1],pb[0],pb[1],1.2,y0-3,y0+30)}
  // inner wall u=-14 colliders (doors at v=±6)
  for(const [va,vb] of [[-24,-7.5],[-4.5,4.5],[7.5,24]]){const pa=F.P(-14,va),pb=F.P(-14,vb);wallSeg(pa[0],pa[1],pb[0],pb[1],.7,y0,y0+20)}
  // mezzanine balustrade + stair balustrades
  for(const [va,vb] of [[-20,-4.2],[4.2,20]]){const pa=F.P(-19,va),pb=F.P(-19,vb);wallSeg(pa[0],pa[1],pb[0],pb[1],.3,y0+MEZ-.4,y0+MEZ+1.2)}
  for(const s of [-4.3,4.3]){const pa=F.P(-27,s),pb=F.P(-19,s);wallSeg(pa[0],pa[1],pb[0],pb[1],.3,y0+FLR+.6,y0+MEZ+1.2)}
  // vestibule inside the rotunda (between the portal door and the foyer wall)
  {const g=new GB({position:3,normal:3,uv:2});const R2=33.4;const n=40;let prev=null;
   for(let i=0;i<=n;i++){const t=Math.PI/2+i/n*Math.PI;const u=-14+Math.cos(t)*R2,v=Math.sin(t)*R2;if(u>-31){prev=null;continue}const p=[u,v];
     if(prev){const pa=F.P(prev[0],prev[1]),pb=F.P(p[0],p[1]);const nn=F.P(-14,0);const mx=(pa[0]+pb[0])/2,mz=(pa[1]+pb[1])/2;const door=Math.abs((prev[1]+p[1])/2)<2.3;
       if(!door){liningQuad(g,pa,pb,y0+FLR,y0+7.6,[nn[0]-mx,nn[1]-mz]);wallSeg(pa[0],pa[1],pb[0],pb[1],.8,y0-2,y0+20)}else{liningQuad(g,pa,pb,y0+7.2,y0+7.6,[nn[0]-mx,nn[1]-mz])}}prev=p}
   const m=new THREE.Mesh(g.build(),M.cream);grp.add(m);
   const cvh=[];for(let i=0;i<=n;i++){const t=Math.PI/2+i/n*Math.PI;const u=Math.max(-31,-14+Math.cos(t)*R2),v=Math.sin(t)*R2;cvh.push(new THREE.Vector2(...F.P(u,v)))}
   const tr=THREE.ShapeUtils.triangulateShape(cvh,[]);const pos=[];for(const t of tr)for(const k of t)pos.push(cvh[k].x,y0+7.6,cvh[k].y);const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));cg.computeVertexNormals();
   grp.add(new THREE.Mesh(cg,new THREE.MeshStandardMaterial({color:0xf2e9d6,roughness:.8,side:THREE.DoubleSide})));
   const fl=[];for(let i=0;i<=n;i++){const t=Math.PI/2+i/n*Math.PI;const u=Math.max(-31,-14+Math.cos(t)*R2),v=Math.sin(t)*R2;fl.push(F.P(u,v))}
   groundPoly(GR,new Float32Array(fl.flat()),6,y0+FLR+.012);
   for(const v of [-12,12]){const p=F.P(-37,v);miniChandelier(grp,M,p[0],y0+6.3,p[1])}}
  // ---------- floors (multi level) ----------
  const inShell=(u,v)=>(u>-31&&u<5&&Math.abs(v)<26)||(u>=5&&(u-5)**2+v*v<26*26)||(u<=-31&&(u+14)**2+v*v<33.4*33.4);
  SPECIAL.push((x,z,yq)=>{const [u,v]=F.inv(x,z);
    if(!inShell(u,v)){
      const ux=-48;if(u>ux-6&&u<=ux+.6&&Math.abs(v)<4.5){if(u>ux-4)return {h:y0+FLR,pri:3,surf:'stone'};const k=Math.floor((u-(ux-6))/.45);return {h:y0+FLR*Math.min(4,k+1)/4,pri:3,surf:'stone'}}
      return null}
    if(u<=-31)return {h:y0+FLR,pri:3,surf:'marble'};
    const upper=yq>y0+FLR+2.6;
    if(u>-27&&u<-19&&Math.abs(v)<4.1){const i=Math.min(29,Math.max(0,Math.floor((u+27)/(8/30))));return {h:y0+FLR+(i+1)*(MEZ-FLR)/30,pri:3,surf:'carpet'}}
    if(upper){
      if(u>-19.2&&u<-13.4&&Math.abs(v)<24)return {h:y0+MEZ,pri:3,surf:'marble'};
      const d=Math.hypot(u-C[0],v-C[1]);
      if(u<=C[0]&&d>R0-.2&&d<R1+2.3)return {h:y0+MEZ,pri:3,surf:'carpet'};
      if(u>C[0]&&u<12.6&&Math.abs(v)>R0-.2&&Math.abs(v)<R1+.5)return {h:y0+MEZ,pri:3,surf:'carpet'};
    }
    if(u>14&&u<27.2&&Math.abs(v)<13)return {h:y0+FLR+1.4,pri:3,surf:'wood'};
    if(u>12.4&&u<=14&&Math.abs(Math.abs(v)-11.4)<1.1){const i=Math.max(0,Math.min(3,Math.floor((u-12.45)/.35)));return {h:y0+FLR+.35*(i+1),pri:3,surf:'wood'}}
    return {h:y0+FLR,pri:3,surf:u<-14?'marble':'wood'}});
  OPERA.lights=lights;OPERA.ind={name:'opera',title:'Opera House',sub:'inside',floor:'marble',exp:1.0,lights,
    test:(x,z,y)=>{const [u,v]=F.inv(x,z);return inShell(u,v)&&y<y0+20},
    ceil:(x,z,y)=>{const [u,v]=F.inv(x,z);if(u<-14){if(u>-19.2&&y<y0+MEZ-.4)return y0+MEZ-.5;return y0+CEIL_F-.3}if(y>y0+3){const d=Math.hypot(u-C[0],v-C[1]);if((u<=C[0]&&d>R0-.3)||(u>C[0]&&Math.abs(v)>R0-.3))return y0+9.6-.4}else{const d=Math.hypot(u-C[0],v-C[1]);if((u<=C[0]&&d>R0+.2)||(u>C[0]&&Math.abs(v)>R0+.2))return y0+MEZ-.5}return y0+18.2},
    enter:()=>toast('Odesa Opera House','foyer · grand staircase · hall')};INDOORS.push(OPERA.ind);
  {const c=F.P(-2,0);addBlock(c[0],c[1],112,88,o.a)}
  {const c=F.P(-2,0);NO_WALK.push(c[0],c[1],50,38,Math.cos(o.a),Math.sin(o.a))}
  // theatre square paving
  groundQuad(GR,[F.P(-95,-46),F.P(-95,46),F.P(56,46),F.P(56,-46)],5,y0+.07);
  const sp=F.P(-64,0);PLACES.push({id:'opera',name:'Opera House',sub:'you can go inside',x:sp[0],z:sp[1],yaw:Math.atan2(F.ca,F.sa)});
  const lb=labelSprite(['Opera House'],{w:640,h:120,size:60,color:'#fff',bg:'rgba(10,30,40,.55)',round:30,scale:4.4});const lp=F.P(-50,0);lb.position.set(lp[0],y0+38,lp[1]);grp.add(lb);
  bakeStatic(grp,from0);
}
// merge static child meshes (by material) into one mesh each -> far fewer draw calls
function bakeStatic(root,from){
  root.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets=new Map(),rm=[];
  const visit=o=>{if(o.userData.dyn||o.isInstancedMesh||o.isSprite||o.isPoints||o.isLight||Array.isArray(o.material))return;
    if(o.isMesh&&o.visible){const g=o.geometry;if(g.attributes.position&&g.attributes.normal&&!g.morphAttributes.position){const sig=Object.keys(g.attributes).sort().map(k=>k+g.attributes[k].itemSize).join(',');const key=o.material.uuid+'|'+(o.castShadow?1:0)+(o.receiveShadow?1:0)+'|'+sig+'|'+o.renderOrder;
      if(!buckets.has(key))buckets.set(key,{mat:o.material,cast:o.castShadow,recv:o.receiveShadow,ro:o.renderOrder,list:[]});buckets.get(key).list.push(o);rm.push(o);return}}
    for(const c of o.children.slice())visit(c)};
  for(const k of root.children.slice(from))visit(k);
  for(const b of buckets.values()){let n=0;const parts=[];
    for(const o of b.list){const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));parts.push(g);n+=g.attributes.position.count}
    const G=new THREE.BufferGeometry();
    for(const name of Object.keys(parts[0].attributes)){const sz=parts[0].attributes[name].itemSize;const arr=new Float32Array(n*sz);let k=0;for(const g of parts){const A=g.attributes[name];arr.set(A.array,k*sz);k+=A.count}G.setAttribute(name,new THREE.BufferAttribute(arr,sz))}
    for(const g of parts)g.dispose();
    G.computeBoundingSphere();const m=new THREE.Mesh(G,b.mat);m.castShadow=b.cast;m.receiveShadow=b.recv;m.renderOrder=b.ro;m.matrixAutoUpdate=false;root.add(m)}
  for(const o of rm){o.parent.remove(o);o.geometry.dispose()}
}
function liningQuad(g,pa,pb,ya,yb,n){const l=Math.hypot(n[0],n[1])||1;const nn=[n[0]/l,0,n[1]/l];
  quadN(g,[[pa[0],ya,pa[1]],[pb[0],ya,pb[1]],[pb[0],yb,pb[1]],[pa[0],yb,pa[1]]],nn,i=>({uv:[i===1||i===2?1:0,i<2?0:1]}))}
// facade strip around polygon with the building shader (outward normals from centroid)
function wallStrip2(g,pts,y0,y1,s,f,seed,door){
  let cx=0,cz=0;for(const p of pts){cx+=p[0];cz+=p[1]}cx/=pts.length;cz/=pts.length;
  for(let e=0;e<pts.length;e++){const [x1,z1]=pts[e],[x2,z2]=pts[(e+1)%pts.length];const L=Math.hypot(x2-x1,z2-z1);if(L<.01)continue;
    let nx=(z2-z1)/L,nz=-(x2-x1)/L;const mx=(x1+x2)/2-cx,mz=(z1+z2)/2-cz;if(nx*mx+nz*mz<0){nx=-nx;nz=-nz}
    const tx=(x2-x1)/L,tz=(z2-z1)/L;
    const piece=(ua,ub,ya,yb)=>{const pa=[x1+tx*ua,z1+tz*ua],pb=[x1+tx*ub,z1+tz*ub];
      quadN(g,[[pa[0],y0+ya,pa[1]],[pb[0],y0+ya,pb[1]],[pb[0],y0+yb,pb[1]],[pa[0],y0+yb,pa[1]]],[nx,0,nz],i=>({aUV:[i===1||i===2?ub:ua,i<2?ya:yb],aP:[s,f,seed,L],aQ:0,aT:[tx,0,tz]}))};
    if(door&&e===door.edge){piece(0,door.a,-2,y1-y0);piece(door.b,L,-2,y1-y0);piece(door.a,door.b,door.top,y1-y0);}
    else piece(0,L,-2,y1-y0);}
}
function mergeGeos2(list){const g=new GB({position:3,normal:3});
  for(const [ge,ox,oy,oz] of list){const G=ge.index?ge.toNonIndexed():ge;const p=G.attributes.position,n=G.attributes.normal;
    for(let i=0;i<p.count;i+=3){const ids=[];for(let j=0;j<3;j++)ids.push(g.v({position:[p.getX(i+j)+ox,p.getY(i+j)+oy,p.getZ(i+j)+oz],normal:[n.getX(i+j),n.getY(i+j),n.getZ(i+j)]}));g.tri(...ids)}}
  return g.build()}
function bigChandelier(grp,M,x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);grp.add(g);
  {const st=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,3.6,6),M.gold);st.position.set(0,2.2,0);g.add(st)}
  const rings=[[3.4,0],[2.6,-.9],[1.7,-1.7],[.9,-2.4]];
  const cr=new THREE.OctahedronGeometry(.11,0);const cnt=rings.reduce((a,[r])=>a+Math.round(r*14)*3,0)+60;
  const im=new THREE.InstancedMesh(cr,M.crystal,cnt);im.frustumCulled=false;let k=0;const Mx=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=new THREE.Vector3(1,1.6,1),T=new THREE.Vector3();
  for(const [r,yy] of rings){const tor=new THREE.Mesh(new THREE.TorusGeometry(r,.07,6,40),M.gold);tor.rotation.x=Math.PI/2;tor.position.y=yy;g.add(tor);
    const n=Math.round(r*14);for(let i=0;i<n;i++){const a=i/n*6.283;for(let d=0;d<3;d++){T.set(Math.cos(a)*r,yy-.25-d*.28,Math.sin(a)*r);Mx.compose(T,Q,S);im.setMatrixAt(k++,Mx)}}
    for(let i=0;i<Math.round(r*4);i++){const a=i/Math.round(r*4)*6.283;const b=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),M.crystal);b.position.set(Math.cos(a)*r,yy+.18,Math.sin(a)*r);g.add(b)}}
  for(let i=0;i<60;i++){const a=i*2.4,rr=Math.sqrt(i/60)*.8;T.set(Math.cos(a)*rr,-2.8-i*.012,Math.sin(a)*rr);Mx.compose(T,Q,S);im.setMatrixAt(k++,Mx)}
  im.count=k;g.add(im);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:0xffd59a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));glow.scale.set(11,9,1);glow.position.y=-1;g.add(glow);
}
function miniChandelier(grp,M,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);grp.add(g);
  const tor=new THREE.Mesh(new THREE.TorusGeometry(.9,.05,6,24),M.gold);tor.rotation.x=Math.PI/2;g.add(tor);{const st=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.2,5),M.gold);st.position.set(0,.6,0);g.add(st)}
  for(let i=0;i<8;i++){const a=i/8*6.283;const b=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),M.crystal);b.position.set(Math.cos(a)*.9,.12,Math.sin(a)*.9);g.add(b)}}
function ceilingCanvas(){
  const W=2048,H=512,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  // y: 0 = top centre of dome, H = rim
  const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#f4e3b8');sky.addColorStop(.35,'#9fc3d6');sky.addColorStop(.62,'#7aa6c0');sky.addColorStop(.8,'#c7a35a');sky.addColorStop(1,'#8a6a2a');x.fillStyle=sky;x.fillRect(0,0,W,H);
  const r=mkRand(1817);
  for(let i=0;i<60;i++){x.fillStyle=`rgba(255,255,255,${.12+r()*.2})`;x.beginPath();x.ellipse(r()*W,90+r()*170,60+r()*120,18+r()*30,0,0,6.283);x.fill()}
  for(let m=0;m<8;m++){const cx=(m+.5)*W/8,cy=300;x.save();x.translate(cx,cy);
    x.fillStyle='#d8b45c';x.beginPath();x.ellipse(0,0,98,70,0,0,6.283);x.fill();x.fillStyle='#e9d9b0';x.beginPath();x.ellipse(0,0,86,58,0,0,6.283);x.fill();
    const hues=['#b34a3c','#3c6e8f','#6a8f3c','#8f5a3c'];
    for(let f=0;f<5;f++){x.fillStyle=hues[(m+f)%4];x.beginPath();x.ellipse(-50+f*25,8-((f*37)%20),9,24,(f-2)*.2,0,6.283);x.fill();x.fillStyle='#e7c9a8';x.beginPath();x.arc(-50+f*25,-20-((f*37)%20),7,0,6.283);x.fill()}
    x.restore()}
  x.fillStyle='#b8913f';x.fillRect(0,H-70,W,70);x.fillStyle='#e0c070';for(let i=0;i<W;i+=32){x.beginPath();x.arc(i+16,H-40,10,0,6.283);x.fill()}
  x.fillStyle='#7a5a24';x.fillRect(0,H-74,W,6);x.fillRect(0,H-12,W,12);
  return cv;
}
