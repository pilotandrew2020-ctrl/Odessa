// ===================== real city: OSM buildings, fences, rails, POIs =====================
const WK_PLAIN=0,WK_SHOP=8,WK_YARD=9,WK_STREET=10,WK_ENT=11;
function pip(a,x,z){let ins=false;const n=a.length>>1;for(let i=0,j=n-1;i<n;j=i++){const xi=a[i*2],zi=a[i*2+1],xj=a[j*2],zj=a[j*2+1];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))ins=!ins}return ins}
function ringArea(a){let s=0;const n=a.length>>1;for(let i=0;i<n;i++){const j=(i+1)%n;s+=a[i*2]*a[j*2+1]-a[j*2]*a[i*2+1]}return s/2}
function polyInside(rings,x,z){if(!pip(rings[0],x,z))return false;for(let r=1;r<rings.length;r++)if(pip(rings[r],x,z))return false;return true}
// nearest point on polygon boundary -> [dist,qx,qz]
function polyNearest(rings,x,z){let bd=1e9,bx=0,bz=0;for(const a of rings){const n=a.length>>1;for(let i=0;i<n;i++){const j=(i+1)%n;const ax=a[i*2],az=a[i*2+1],dx=a[j*2]-ax,dz=a[j*2+1]-az;const L2=dx*dx+dz*dz;let t=L2>1e-9?((x-ax)*dx+(z-az)*dz)/L2:0;t=t<0?0:t>1?1:t;
  const qx=ax+dx*t,qz=az+dz*t,d=(qx-x)*(qx-x)+(qz-z)*(qz-z);if(d<bd){bd=d;bx=qx;bz=qz}}}return [Math.sqrt(bd),bx,bz]}
function polyOBB(a){const n=a.length>>1;let cx=0,cz=0;for(let i=0;i<n;i++){cx+=a[i*2];cz+=a[i*2+1]}cx/=n;cz/=n;
  let best=null;for(let i=0;i<n;i++){const j=(i+1)%n;const dx=a[j*2]-a[i*2],dz=a[j*2+1]-a[i*2+1];const L=Math.hypot(dx,dz);if(L<.5)continue;const ca=dx/L,sa=dz/L;
    let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;for(let k=0;k<n;k++){const px=a[k*2]-cx,pz=a[k*2+1]-cz;const u=px*ca+pz*sa,v=-px*sa+pz*ca;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v)}
    const ar=(u1-u0)*(v1-v0);if(!best||ar<best.ar)best={ar,ca,sa,cx:cx+((u0+u1)/2)*ca-((v0+v1)/2)*sa,cz:cz+((u0+u1)/2)*sa+((v0+v1)/2)*ca,w:u1-u0,d:v1-v0}}
  return best}
function isConvex(a){const n=a.length>>1;let sg=0;for(let i=0;i<n;i++){const j=(i+1)%n,k=(i+2)%n;const c=(a[j*2]-a[i*2])*(a[k*2+1]-a[j*2+1])-(a[j*2+1]-a[i*2+1])*(a[k*2]-a[j*2]);if(Math.abs(c)<1e-6)continue;const s=c>0?1:-1;if(!sg)sg=s;else if(s!==sg)return false}return true}
// ---------- building ----------
function addPolyBuilding(g,rings,lv,st,sd,fl,P,S,opt){
  opt=opt||{};const outer=rings[0],n=outer.length>>1;
  let gmin=1e9,gmax=-1e9;for(const a of rings)for(let i=0;i<a.length;i+=2){const h=groundH(a[i],a[i+1]);gmin=Math.min(gmin,h);gmax=Math.max(gmax,h)}
  const y0=opt.y0!==undefined?opt.y0:Math.min(gmax-.1,gmin+2.6);const yb=Math.min(gmin,y0)-.7;
  const FH=FH2[st],GF=GF2[st];const H=GF+(GF>0?lv-1:lv)*FH;const top=y0+H+PARA2[st];
  const r=rng(sd*977+n*31+((outer[0]*7)|0));
  const resid=(st===KHRU||st===PANEL||st===BRICK||st===HOME_ST);
  const area=Math.abs(ringArea(outer));
  // walls
  const walls=[];
  for(let ri=0;ri<rings.length;ri++){const a=rings[ri],m=a.length>>1;
    // orientation: test longest edge
    let li=0,lL=0;for(let i=0;i<m;i++){const j=(i+1)%m;const L=Math.hypot(a[j*2]-a[i*2],a[j*2+1]-a[i*2+1]);if(L>lL){lL=L;li=i}}
    let sgn=1;{const j=(li+1)%m;const dx=a[j*2]-a[li*2],dz=a[j*2+1]-a[li*2+1],L=Math.hypot(dx,dz)||1;const mx=(a[li*2]+a[j*2])/2+dz/L*.05,mz=(a[li*2+1]+a[j*2+1])/2-dx/L*.05;if(polyInside(rings,mx,mz))sgn=-1}
    for(let i=0;i<m;i++){const j=(i+1)%m;const x1=a[i*2],z1=a[i*2+1],x2=a[j*2],z2=a[j*2+1];const L=Math.hypot(x2-x1,z2-z1);if(L<.15)continue;
      const tx=(x2-x1)/L,tz=(z2-z1)/L;const nx=tz*sgn,nz=-tx*sgn;walls.push({x1,z1,x2,z2,L,tx,tz,nx,nz,ri,kind:WK_PLAIN,long:L>=12})}}
  // wall kinds: home yard/street, shopfronts, entrance side
  if(fl&1&&opt.yard){for(const W of walls){const mx=(W.x1+W.x2)/2,mz=(W.z1+W.z2)/2;W.kind=((opt.yard[0]-mx)*W.nx+(opt.yard[1]-mz)*W.nz>0)?WK_YARD:WK_STREET}}
  else if(resid&&lv>=4){let best=null;for(const W of walls){if(W.L<14)continue;const mx=(W.x1+W.x2)/2,mz=(W.z1+W.z2)/2;W.dOut=distRoad(mx+W.nx*12,mz+W.nz*12);if(!best||W.dOut>best.dOut)best=W}
    for(const W of walls)if(W.L>=14&&best&&W.dOut>=best.dOut-6&&W.nx*best.nx+W.nz*best.nz>.7)W.kind=WK_ENT}
  if(opt.shopEdges)for(const k of opt.shopEdges)if(walls[k]&&walls[k].kind!==WK_ENT)walls[k].kind=WK_SHOP;
  const signPl=[];
  if(opt.signs&&opt.signs.length){for(const f of opt.signs){let bw=null,bd=1e9,bu=0;for(const W of walls){if(W.ri>0||W.L<2.6)continue;const dx=f.x-W.x1,dz=f.z-W.z1;let u=dx*W.tx+dz*W.tz;u=Math.max(1.3,Math.min(W.L-1.3,u));const d=Math.hypot(W.x1+W.tx*u-f.x,W.z1+W.tz*u-f.z);if(d<bd){bd=d;bw=W;bu=u}}
    if(bw&&!signPl.some(q=>q[0]===bw&&Math.abs(q[1]-bu)<4.5)){if(bw.kind!==WK_YARD&&bw.kind!==WK_ENT)bw.kind=WK_SHOP;signPl.push([bw,bu,f.a])}}}
  for(const W of walls){
    const A=i=>({aUV:[i===1||i===2?W.L:0,i<2?yb-y0:top-y0],aP:[st,lv,sd,W.L],aQ:W.kind,aT:[W.tx,0,W.tz]});
    quadN(g,[[W.x1,yb,W.z1],[W.x2,yb,W.z2],[W.x2,top,W.z2],[W.x1,top,W.z1]],[W.nx,0,W.nz],A)}
  if(S)for(const [W,u,code] of signPl){const len=Math.min(W.L-.6,4.6),gfe=GF>0?GF:FH;const x=W.x1+W.tx*u+W.nx*.12,z=W.z1+W.tz*u+W.nz*.12;
    addSign(S,x,y0+gfe-.74,z,W.tx,W.tz,W.nx,W.nz,len,.62,code);if(P)P.box(x-W.nx*.06,y0+gfe-.43,z-W.nz*.06,len+.1,.7,.1,Math.atan2(W.tx,W.tz)-Math.PI/2,sRGB('#2a2a2a'),1);
    const du=len/2>1.6?-len/2+.9:0;const dx=x+W.tx*du,dz=z+W.tz*du;
    if(P){const ry=Math.atan2(W.tx,W.tz)-Math.PI/2;P.box(dx-W.nx*.04,y0+1.15,dz-W.nz*.04,1.25,2.3,.08,ry,sRGB('#1d2a30'),2);P.box(dx-W.nx*.02,y0+2.36,dz-W.nz*.02,1.4,.12,.1,ry,sRGB('#6a6a66'),1);
      const gy=groundH(dx+W.nx*1.1,dz+W.nz*1.1);if(y0-gy>.12)P.box(dx+W.nx*.75,(y0+gy)/2,dz+W.nz*.75,1.8,y0-gy+.08,1.4,ry,sRGB('#9a9792'),9)}
    if(opt.doors)opt.doors.push({x:dx+W.nx*.9,z:dz+W.nz*.9,y:y0,code,yaw:Math.atan2(W.nx,W.nz)})}
  // roof
  const obb=polyOBB(outer);const rect=obb&&rings.length===1&&area/(obb.w*obb.d)>.86;
  let pitched=false;
  if(st===HOUSE&&rect&&obb.w<30&&obb.d<30&&!(fl&2)){pitched=true;
    const gable=r()<.55,long=obb.w>=obb.d,Lh=long?obb.w:obb.d,Sh=long?obb.d:obb.w;const hr=gable?Sh*.36:Sh*.28,ov=.35;
    const ax=long?[obb.ca,obb.sa]:[-obb.sa,obb.ca],ay=long?[-obb.sa,obb.ca]:[-obb.ca,-obb.sa];
    const Pt=(u,v,y)=>[obb.cx+ax[0]*u+ay[0]*v,y,obb.cz+ax[1]*u+ay[1]*v];
    const hl=Lh/2+ov,hs=Sh/2+ov,rl=gable?hl:Math.max(0,Lh/2-Sh/2);
    const c00=Pt(-hl,-hs,top),c10=Pt(hl,-hs,top),c11=Pt(hl,hs,top),c01=Pt(-hl,hs,top),R0=Pt(-rl,0,top+hr),R1=Pt(rl,0,top+hr);
    const face=(pts,q)=>{let nn=cross3([pts[1][0]-pts[0][0],pts[1][1]-pts[0][1],pts[1][2]-pts[0][2]],[pts[2][0]-pts[0][0],pts[2][1]-pts[0][1],pts[2][2]-pts[0][2]]);const l=Math.hypot(...nn)||1;nn=nn.map(x=>x/l);if(nn[1]<0)nn=nn.map(x=>-x);
      const ids=pts.map(p=>g.v({position:p,normal:nn,aQ:q,aP:[st,lv,sd,-1],aUV:[0,0],aT:[1,0,0]}));const c2=cross3([pts[1][0]-pts[0][0],pts[1][1]-pts[0][1],pts[1][2]-pts[0][2]],[pts[2][0]-pts[0][0],pts[2][1]-pts[0][1],pts[2][2]-pts[0][2]]);
      const ok=c2[0]*nn[0]+c2[1]*nn[1]+c2[2]*nn[2]>0;const o=ok?ids:ids.slice().reverse();if(o.length===3)g.tri(o[0],o[1],o[2]);else g.quad(o[0],o[1],o[2],o[3])};
    face([c00,c10,R1,R0],2);face([c11,c01,R0,R1],2);
    if(gable){for(const [pA,pB,pR,sg] of [[c01,c00,R0,-1],[c10,c11,R1,1]]){const nn=[ax[0]*sg,0,ax[1]*sg];
      const ids=[pA,pB,pR].map(p=>g.v({position:[p[0]-ax[0]*sg*ov,p[1],p[2]-ax[1]*sg*ov],normal:nn,aQ:0,aP:[st,lv,sd,Sh],aUV:[0,top-y0+5],aT:[ay[0],0,ay[1]]}));g.tri(ids[0],ids[1],ids[2]);g.tri(ids[0],ids[2],ids[1])}}
    else{face([c01,c00,R0],2);face([c10,c11,R1],2)}
    // soffit under the eaves
    quadN(g,[[c00[0],top-.02,c00[2]],[c10[0],top-.02,c10[2]],[c11[0],top-.02,c11[2]],[c01[0],top-.02,c01[2]]],[0,-1,0],()=>({aUV:[0,0],aP:[st,lv,sd,-1],aQ:6,aT:[1,0,0]}));
    if(P&&r()<.7){const ch=Pt(Lh*.22,-Sh*.12,0);P.box(ch[0],top+hr*.75,ch[2],.55,hr*1.1+.6,.55,Math.atan2(ax[0],ax[1]),sRGB(r()<.5?'#8a5a44':'#b8b0a2'),9)}
  }else{
    const contour=[],holes=[];for(let i=0;i<n;i++)contour.push(new THREE.Vector2(outer[i*2],outer[i*2+1]));
    for(let ri=1;ri<rings.length;ri++){const a=rings[ri],h=[];for(let i=0;i<a.length;i+=2)h.push(new THREE.Vector2(a[i],a[i+1]));holes.push(h)}
    let tris=[];try{tris=THREE.ShapeUtils.triangulateShape(contour,holes)}catch(e){}
    const all=contour.concat(...holes);const base=g.n;
    for(const p of all)g.v({position:[p.x,top,p.y],normal:[0,1,0],aQ:(st===INDUST&&lv<=2)?2:1,aP:[st,lv,sd,-1],aUV:[0,0],aT:[1,0,0]});
    for(const t of tris){g.tri(base+t[0],base+t[2],base+t[1]);g.tri(base+t[0],base+t[1],base+t[2])}
    // parapet lip
    if(P&&lv>=3&&area>80){for(const W of walls){if(W.L<3)continue;const mx=(W.x1+W.x2)/2,mz=(W.z1+W.z2)/2;P.box(mx-W.nx*.12,top+.18,mz-W.nz*.12,W.L,.36,.24,Math.atan2(W.tx,W.tz)-Math.PI/2,sRGB(st===HIST||st===MOLD?'#d9d0bf':'#a9a6a0'),9)}}
  }
  if(P&&opt.props!==false){
    // roof structures
    if(!pitched&&lv>=5&&area>220){const c=obb||{cx:outer[0],cz:outer[1],ca:1,sa:0};const nB=area>900?2:1;
      for(let q=0;q<nB;q++){const u=nB===2?(q?obb.w/4:-obb.w/4):0;const bx=c.cx+u*c.ca,bz=c.cz+u*c.sa;if(!polyInside(rings,bx,bz))continue;P.box(bx,top+1.3,bz,4.4,2.6,3.4,-Math.atan2(c.sa,c.ca),sRGB('#9c9a94'),9)}
      if(r()<.6&&obb)P.cyl(obb.cx+obb.ca*obb.w*.3,top,obb.cz+obb.sa*obb.w*.3,.04,.03,3.5,4,sRGB('#777'),1)}
    // church dome
    if(fl&4&&obb){const c=[obb.cx,obb.cz];const rr=Math.min(obb.w,obb.d)*.22;const gold=sRGB('#d9ab3a');
      P.cyl(c[0],top,c[1],rr,rr,rr*1.6,14,sRGB('#efe9dc'),9);P.cyl(c[0],top+rr*1.6,c[1],rr*1.12,rr*1.12,.25,14,sRGB('#c9c0b0'),9);
      for(let i=0;i<6;i++){const t0=i/6,t1=(i+1)/6;const f=t=>Math.sin(Math.PI*(t*.82+.08))*(1+.35*Math.sin(t*Math.PI))*rr*.95*(1-t*t*.7);P.cyl(c[0],top+rr*1.85+t0*rr*2.2,c[1],f(t0),f(t1),rr*2.2/6,14,gold,1)}
      P.box(c[0],top+rr*4.4,c[1],.08,1.6,.08,0,gold,1);P.box(c[0],top+rr*4.4+.35,c[1],.7,.07,.07,0,gold,1)}
    // AC units & dishes
    if(resid||st===HIST||st===MOLD||st===SHOP){const CS=CS2[st];const rows=Math.max(1,(GF>0?lv-1:lv));
      for(const W of walls){if(W.L<6)continue;const nC=Math.max(1,Math.floor(W.L/CS+.3)),cs=W.L/nC;const nAC=Math.floor(nC*rows*(resid?.06:.04));
        for(let q=0;q<nAC;q++){const ci=Math.floor(r()*nC),row=Math.floor(r()*rows);const u=(ci+.5)*cs+(r()<.5?-1:1)*cs*.36;const yy=y0+GF+row*FH+.6;if(yy>top-1)continue;
          P.box(W.x1+W.tx*u+W.nx*.18,yy,W.z1+W.tz*u+W.nz*.18,.82,.56,.3,Math.atan2(W.nx,W.nz),sRGB('#e9e9e4'),1)}}}
    if(st===HOUSE&&!pitched&&r()<.4&&obb)P.box(obb.cx,top+.5,obb.cz,.5,1,.5,0,sRGB('#8a5a44'),9);
  }
  // loggias
  if(resid&&lv>=4&&!opt.noLogg){const CS=CS2[st];
    for(const W of walls){if(!W.long||W.ri>0)continue;
      const nC=Math.max(1,Math.floor(W.L/CS+.3)),cs=W.L/nC;
      for(let ci=0;ci<nC;ci++){
        let on=false;
        if(st===PANEL)on=ci%3===1;else if(st===KHRU)on=ci%3===1&&(hjs(sd,W.nx*3+W.nz)>.4);else if(st===BRICK)on=(ci%4===1||ci%4===2)&&hjs(sd,ci)>.25;
        else on=(ci%3!==0)&&Math.abs(((ci+.5)*cs%22)-11)>2.8;
        if(W.kind===WK_ENT||W.kind===WK_YARD){const span=W.L/Math.max(1,Math.floor(W.L/18));const du=((ci+.5)*cs)%span-span/2;if(Math.abs(du)<2.2)on=false}
        if(!on)continue;
        const lw=cs*.86,dep=1.2,uc=(ci+.5)*cs;const vb=Math.max(GF,FH)+.02,vt=H+.02;if(vt-vb<2)continue;
        const bx=W.x1+W.tx*uc,bz=W.z1+W.tz*uc;const L0=[bx-W.tx*lw/2,bz-W.tz*lw/2],R0=[bx+W.tx*lw/2,bz+W.tz*lw/2];
        const L1=[L0[0]+W.nx*dep,L0[1]+W.nz*dep],R1=[R0[0]+W.nx*dep,R0[1]+W.nz*dep];const yA=y0+vb,yB=y0+vt;
        quadN(g,[[L1[0],yA,L1[1]],[R1[0],yA,R1[1]],[R1[0],yB,R1[1]],[L1[0],yB,L1[1]]],[W.nx,0,W.nz],i=>({aUV:[i===1||i===2?lw:0,i<2?vb:vt],aP:[st,lv,sd+ci,lw],aQ:4,aT:[W.tx,0,W.tz]}));
        for(const [Pa,Pb,sg] of [[L0,L1,-1],[R0,R1,1]])quadN(g,[[Pa[0],yA,Pa[1]],[Pb[0],yA,Pb[1]],[Pb[0],yB,Pb[1]],[Pa[0],yB,Pa[1]]],[W.tx*sg,0,W.tz*sg],i=>({aUV:[i===1||i===2?dep:0,i<2?vb:vt],aP:[st,lv,sd,dep],aQ:5,aT:[W.nx,0,W.nz]}));
        quadN(g,[[L0[0],yA,L0[1]],[R0[0],yA,R0[1]],[R1[0],yA,R1[1]],[L1[0],yA,L1[1]]],[0,-1,0],()=>({aUV:[0,0],aP:[st,lv,sd,-1],aQ:6,aT:[1,0,0]}));
        quadN(g,[[L0[0],yB,L0[1]],[R0[0],yB,R0[1]],[R1[0],yB,R1[1]],[L1[0],yB,L1[1]]],[0,1,0],()=>({aUV:[0,0],aP:[st,lv,sd,-1],aQ:6,aT:[1,0,0]}));
        if(P&&r()<.3){const fl2=Math.floor(r()*(lv-2))+1;const yy=y0+GF+fl2*FH+1.5;P.cyl(bx+W.nx*(dep+.2)+W.tx*lw*.3,yy,bz+W.nz*(dep+.2)+W.tz*lw*.3,.32,.05,.12,8,sRGB('#d8d8d4'),1,Math.PI/2*.8,0,Math.atan2(W.nx,W.nz))}
      }}}
  // entrances (canopy, steps, lamp, intercom, gas pipe) on entrance / yard walls
  const ents=[];
  if(P&&opt.props!==false&&!(fl&1)){for(const W of walls){if(W.kind!==WK_ENT)continue;const span=W.L/Math.max(1,Math.floor(W.L/18));
    for(let u=span/2;u<W.L-1;u+=span){const px=W.x1+W.tx*u,pz=W.z1+W.tz*u;const ry=Math.atan2(W.nx,W.nz);ents.push([px,pz,W.nx,W.nz]);
      P.box(px+W.nx*.75,y0+2.75,pz+W.nz*.75,2.4,.14,1.5,ry,sRGB('#a9a8a2'),9);
      const gy=groundH(px+W.nx*1.2,pz+W.nz*1.2);if(y0-gy>.15)P.box(px+W.nx*.9,(y0+gy)/2,pz+W.nz*.9,2.2,y0-gy+.1,1.8,ry,sRGB('#9a9792'),9);
      P.box(px+W.nx*.06,y0+2.55,pz+W.nz*.06,.3,.1,.1,ry,sRGB('#fff2cc'),3);
      if(opt.lamps)opt.lamps.push(px+W.nx*.5,y0+2.5,pz+W.nz*.5);
      if(opt.lots)opt.lots.push({x:px+W.nx*10,z:pz+W.nz*10,tx:W.tx,tz:W.tz,nx:W.nx,nz:W.nz});
      if(r()<.7){const bx=px+W.nx*3.2+W.tx*2.4,bz=pz+W.nz*3.2+W.tz*2.4;if(!polyInside(rings,bx,bz))propBench2(P,bx,groundH(bx,bz),bz,ry+Math.PI,opt.benches)}}}}
  // gas pipe along walls of residential (yellow), at ground-floor top
  if(P&&opt.props!==false&&(resid||st===HOUSE||st===SHOP)&&lv<=16&&r()<.75){const gy=y0+(GF>0?GF-.3:FH*.95);for(const W of walls){if(W.L<4||W.ri>0)continue;
    P.box((W.x1+W.x2)/2+W.nx*.12,gy,(W.z1+W.z2)/2+W.nz*.12,W.L,.09,.09,Math.atan2(W.tx,W.tz)-Math.PI/2,sRGB('#e3b81f'),1)}}
  return {top,y0,walls,ents,rings,obb};
}
// ---------- per-chunk collider polygons ----------
function makeColPoly(rings,top,y0){let minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9;const a=rings[0];for(let i=0;i<a.length;i+=2){minx=Math.min(minx,a[i]);maxx=Math.max(maxx,a[i]);minz=Math.min(minz,a[i+1]);maxz=Math.max(maxz,a[i+1])}
  return {rings,top,y0,minx,maxx,minz,maxz}}
function colPolyPush(cp,x,z,r){ // returns [x,z] pushed out (or null if no contact)
  if(x<cp.minx-r||x>cp.maxx+r||z<cp.minz-r||z>cp.maxz+r)return null;
  const ins=polyInside(cp.rings,x,z);const [d,qx,qz]=polyNearest(cp.rings,x,z);
  if(!ins&&d>=r)return null;
  if(d<1e-5)return [x,z];
  let ex=(x-qx)/d,ez=(z-qz)/d;if(ins){ex=-ex;ez=-ez}
  return [qx+ex*r,qz+ez*r];
}
function colPolyHit(cp,x,z,m){if(x<cp.minx-m||x>cp.maxx+m||z<cp.minz-m||z>cp.maxz+m)return false;if(polyInside(cp.rings,x,z))return true;return m>0&&polyNearest(cp.rings,x,z)[0]<m}
// ---------- fences / walls ----------
function buildBarriers(id,P,segsOut){
  const [ox,oz]=chunkOrigin(id);const s0=D.stab[id],s1=D.stab[id+1];
  const wallC=sRGB('#cbbd9e'),wallC2=sRGB('#b8a98a'),fenceC=sRGB('#2a3a2c'),hedgeC=sRGB('#3c6a2e');
  for(let s=s0;s<s1;s++){const k=D.sk[s];const x0=ox+D.sv[s*4]*.1,z0=oz+D.sv[s*4+1]*.1,x1=ox+D.sv[s*4+2]*.1,z1=oz+D.sv[s*4+3]*.1;
    const L=Math.hypot(x1-x0,z1-z0);if(L<.3)continue;if(blockedStatic((x0+x1)/2,(z0+z1)/2,0))continue;
    const ry=Math.atan2(x1-x0,z1-z0);const nSub=Math.max(1,Math.ceil(L/6));
    for(let q=0;q<nSub;q++){const ta=q/nSub,tb=(q+1)/nSub;const ax=x0+(x1-x0)*ta,az=z0+(z1-z0)*ta,bx=x0+(x1-x0)*tb,bz=z0+(z1-z0)*tb;const mx=(ax+bx)/2,mz=(az+bz)/2;const l=L/nSub;
      const gy=Math.min(groundH(ax,az),groundH(bx,bz));
      if(k===0){const h=2.0;P.box(mx,gy+h/2-.1,mz,.32,h+.2,l+.02,ry,(q%2?wallC:wallC2),9);P.box(mx,gy+h+.05,mz,.42,.12,l+.04,ry,sRGB('#d8cdb4'),9)}
      else if(k===1){const h=1.6;P.box(mx,gy+h-.05,mz,.05,.05,l,ry,fenceC,1);P.box(mx,gy+.25,mz,.05,.05,l,ry,fenceC,1);
        const nb=Math.max(2,Math.round(l/.16));for(let b=0;b<nb;b+=1){const t=(b+.5)/nb;const px=ax+(bx-ax)*t,pz=az+(bz-az)*t;P.box(px,gy+h/2,pz,.025,h,.025,0,fenceC,1)}
        P.box(ax,gy+h/2+.05,az,.07,h+.1,.07,0,fenceC,1)}
      else{P.box(mx,gy+.6,mz,.9,1.2,l,ry,hedgeC,0)}
    }
    if(segsOut)segsOut.push(x0,z0,x1,z1,k===0?.2:(k===1?.08:.45),k===0?2.1:(k===1?1.6:1.2));
  }
}
// ---------- rails ----------
function buildRails(id,P,catOut,inBld){
  const s0=D.rSegStart[id],s1=D.rSegStart[id+1];if(s0===s1)return;const R=D.rnodes,rn=D.rn;const steel=sRGB('#6d6f72'),dark=sRGB('#2c2a28'),pole=sRGB('#7a7c7e');
  for(let s=s0;s<s1;s++){const i=D.rSeg[s],k=D.rkind[D.rOf[i]];if(k===2)continue;const a=rn[i]*2,b=rn[i+1]*2;const ax=R[a],az=R[a+1],bx=R[b],bz=R[b+1];const L=Math.hypot(bx-ax,bz-az);if(L<.2)continue;
    if(blockedStatic((ax+bx)/2,(az+bz)/2,0))continue;
    const tx=(bx-ax)/L,tz=(bz-az)/L,nx=-tz,nz=tx;const ry=Math.atan2(tx,tz);const g=k===0?.76:.762;const nSub=Math.max(1,Math.ceil(L/5));
    for(let q=0;q<nSub;q++){const ta=q/nSub,tb=(q+1)/nSub;const px=ax+(bx-ax)*(ta+tb)/2,pz=az+(bz-az)*(ta+tb)/2;const l=L/nSub+.02;if(inBld&&inBld(px,pz))continue;const gy=groundH(px,pz)+(nearRoad(id,px,pz,0)?.13:0);
      if(k===1){P.box(px,gy+.08,pz,3.2,.2,l,ry,sRGB('#6b5f52'),9);
        const nsl=Math.max(1,Math.round(l/.6));for(let t=0;t<nsl;t++){const u=-l/2+(t+.5)*l/nsl;P.box(px+tx*u,gy+.2,pz+tz*u,2.5,.12,.22,ry,sRGB('#5a4e44'),5)}}
      else P.box(px,gy+.02,pz,2.0,.06,l,ry,sRGB('#8e8a84'),9);
      for(const sg of [-1,1])P.box(px+nx*g*sg,gy+(k===1?.33:.1),pz+nz*g*sg,.08,.12,l,ry,steel,6);
    }
    // catenary poles (tram + electrified rail) every ~30 m
    const step=k===0?32:50;const c0=D.rnodes?Math.ceil(0):0;
    for(let u=(hjs(i,7)*step)%step;u<L;u+=step){const px=ax+tx*u+nx*(k===0?4.2:3.2),pz=az+tz*u+nz*(k===0?4.2:3.2);if(nearRoad(id,px,pz,-1.5)&&k===0)continue;
      const gy=groundH(px,pz);P.cyl(px,gy,pz,.12,.09,7.6,6,pole,1);P.box(px-nx*(k===0?2.1:1.6),gy+7.1,pz-nz*(k===0?2.1:1.6),.06,.06,k===0?4.2:3.2,ry+Math.PI/2,pole,1);if(catOut)catOut.push(px,pz)}
    // contact wire
    if(L>2){const nW=Math.max(1,Math.ceil(L/12));for(let q=0;q<nW;q++){const px=ax+(bx-ax)*(q+.5)/nW,pz=az+(bz-az)*(q+.5)/nW;const gy=groundH(px,pz);P.box(px,gy+(k===0?6.4:6.9),pz,.025,.025,L/nW+.05,ry,dark,1)}}
  }
}
// ---------- features (OSM points) ----------
function chunkFeatures(id){const [ox,oz]=chunkOrigin(id);const out=[];for(let f=D.ftab[id];f<D.ftab[id+1];f++)out.push({k:D.fk[f],x:ox+D.fx[f]*.01,z:oz+D.fz[f]*.01,a:D.fa[f]});return out}
function chunkAreas(id){const [ox,oz]=chunkOrigin(id);const out=[];for(let a=D.atab[id];a<D.atab[id+1];a++){const g=D.ag;out.push({k:D.ak[a],x:ox+g[a*5],z:oz+g[a*5+1],w:g[a*5+2],d:g[a*5+3],a:g[a*5+4]})}return out}
function busShelter(P,x,y,z,ry,tram){const blue=sRGB(tram?'#c9a227':'#2f6fb0'),gl=sRGB('#9fb6c2'),fr=sRGB('#5c6166');const c=Math.cos(ry),s=Math.sin(ry);const at=(u,v)=>[x+u*c+v*s,z-u*s+v*c];
  for(const u of [-1.7,1.7])for(const v of [-.6,.6]){const p=at(u,v);P.box(p[0],y+1.2,p[1],.08,2.4,.08,0,fr,1)}
  let p=at(0,0);P.box(p[0],y+2.45,p[1],3.8,.12,1.6,ry,blue,1);p=at(0,-.62);P.box(p[0],y+1.3,p[1],3.4,1.9,.04,ry,gl,2);
  for(const u of [-1.7,1.7]){p=at(u,0);P.box(p[0],y+1.3,p[1],.04,1.9,1.1,ry,gl,2)}p=at(0,-.35);P.box(p[0],y+.48,p[1],2.4,.06,.4,ry,sRGB('#5b3d29'),5);
  p=at(2.3,.4);P.box(p[0],y+1.4,p[1],.06,2.8,.06,0,fr,1);P.box(p[0],y+2.7,p[1],.5,.5,.04,ry,blue,8)}
function fountainProp(P,x,y,z){P.cyl(x,y,z,2.6,2.5,.55,20,sRGB('#cfc8ba'),7);P.cyl(x,y+.5,z,2.3,2.3,.05,20,sRGB('#4f8fa3'),8);P.cyl(x,y,z,.45,.3,1.6,10,sRGB('#cfc8ba'),7);P.cyl(x,y+1.6,z,.9,.7,.25,12,sRGB('#cfc8ba'),7)}
// playground equipment within an OBB
function playgroundArea(P,GR,A){const ca=Math.cos(A.a),sa=Math.sin(A.a);const at=(u,v)=>[A.x+u*ca-v*sa,A.z+u*sa+v*ca];const y=groundH(A.x,A.z);
  const hw=Math.min(A.w,26)/2,hd=Math.min(A.d,26)/2;groundQuad(GR,[at(-hw,-hd),at(hw,-hd),at(hw,hd),at(-hw,hd)],9,y+.09);
  const r=rng(((A.x*13)|0)^((A.z*7)|0));const ry=-A.a;const cols=['#2f6fb0','#e8b53a','#c8372d','#3f9a46','#7a4fb0'];
  const kit=(u,v)=>{const p=at(u,v);const t=r();
    if(t<.35){const c=sRGB(cols[(r()*5)|0]),c2=sRGB(cols[(r()*5)|0]);for(const du of [-.7,.7])for(const dv of [-.7,.7]){const q=at(u+du,v+dv);P.box(q[0],y+1.25,q[1],.1,2.5,.1,0,c,1)}
      P.box(p[0],y+1.2,p[1],1.5,.08,1.5,ry,sRGB('#7a4f2e'),5);P.cyl(p[0],y+2.5,p[1],1.15,.05,.9,4,c2,1,0,0,Math.PI/4+ry);const s=at(u,v+1.9);P.box(s[0],y+.62,s[1],.6,.05,2.4,ry,c2,1,-.45);
      const tub=at(u+1.4,v);for(let i=0;i<16;i++){const tt=i/16,ang=tt*Math.PI*2.6;const q=[tub[0]+Math.cos(ang+ry)*.55,tub[1]+Math.sin(ang+ry)*.55];P.box(q[0],y+1.2-tt*1.0,q[1],.5,.06,.3,-ang-ry,c,1,-.3)}}
    else if(t<.6){const c=sRGB(cols[(r()*5)|0]);const q0=at(u-1.6,v),q1=at(u+1.6,v);for(const q of [q0,q1]){P.box(q[0],y+1.2,q[1],.08,2.4,.08,ry,c,1,.25);P.box(q[0],y+1.2,q[1],.08,2.4,.08,ry,c,1,-.25)}
      P.box(p[0],y+2.35,p[1],3.4,.08,.08,ry,c,1);for(const du of [-.6,.6]){const s=at(u+du,v);P.box(s[0],y+.55,s[1],.5,.06,.3,ry,sRGB('#222'),4);P.box(s[0],y+1.45,s[1],.02,1.8,.02,0,sRGB('#888'),1)}}
    else if(t<.8){P.cyl(p[0],y+.25,p[1],1.1,1.1,.12,12,sRGB(cols[(r()*5)|0]),1);P.cyl(p[0],y+.37,p[1],.06,.06,.8,6,sRGB('#888'),1)}
    else{P.box(p[0],y+.15,p[1],2.4,.3,2.4,ry,sRGB('#8a6a46'),5);P.box(p[0],y+.2,p[1],2.1,.2,2.1,ry,sRGB('#cdb588'),4)}
    return p};
  const out=[];const nk=Math.max(1,Math.min(4,Math.floor(hw*hd/22)));for(let i=0;i<nk;i++){const u=(r()*2-1)*(hw-2.2),v=(r()*2-1)*(hd-2.2);out.push(kit(u,v))}
  for(let i=0;i<2;i++){const sd=i?1:-1;const b=at((r()*2-1)*(hw-1),sd*(hd+.6));propBench2(P,b[0],groundH(b[0],b[1]),b[1],ry+(sd>0?Math.PI:0),null)}
  return out}
function pitchArea(P,GR,A){const ca=Math.cos(A.a),sa=Math.sin(A.a);const at=(u,v)=>[A.x+u*ca-v*sa,A.z+u*sa+v*ca];const y=groundH(A.x,A.z);const hw=A.w/2,hd=A.d/2;const ry=-A.a;
  groundQuad(GR,[at(-hw,-hd),at(hw,-hd),at(hw,hd),at(-hw,hd)],10,y+.1);
  const long=A.w>=A.d;const L=long?hw:hd;const wht=sRGB('#f2f2f0');
  for(const sg of [-1,1]){if(A.w*A.d<300){const p=long?at(sg*(L-.6),0):at(0,sg*(L-.6));P.cyl(p[0],y,p[1],.07,.07,3.05,6,sRGB('#444'),1);const b=long?at(sg*(L-1.0),0):at(0,sg*(L-1.0));P.box(b[0],y+3.2,b[1],long?.05:1.8,1.05,long?1.8:.05,ry,wht,1)}
    else{const p0=long?at(sg*(L-.3),-1.6):at(-1.6,sg*(L-.3)),p1=long?at(sg*(L-.3),1.6):at(1.6,sg*(L-.3));for(const p of [p0,p1])P.box(p[0],y+1,p[1],.1,2,.1,0,wht,1);const m=long?at(sg*(L-.3),0):at(0,sg*(L-.3));P.box(m[0],y+2,m[1],long?.1:3.3,.1,long?3.3:.1,ry,wht,1)}}
}
