// ===================== chunk geometry v2 =====================
const FH2=[4.0,3.4,2.8,2.8,3.1,3.0,3.0,4.5,4.0,2.9,5.6,4.6],GF2=[4.6,0,0,0,4.5,3.6,0,0,4.6,4.2,5.2,5.0],PARA2=[1.1,.4,.6,.8,1.5,.9,.2,.6,.8,.9,1.6,1.4];
const CS2=[3.5,3.1,3.2,3.0,2.4,3.4,3.4,6,3.6,3.3,4.2,3.8];
const HOME_ST=9,OPERA_ST=10,STATION_ST=11;
function sRGB(h){const c=new THREE.Color(h);c.convertSRGBToLinear();return [c.r,c.g,c.b]}
function cross3(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
// add quad with outward normal n: verts p0..p3 (any order around), extra = per-vertex attrs fn(i)
function quadN(g,ps,n,attr){
  const e1=[ps[1][0]-ps[0][0],ps[1][1]-ps[0][1],ps[1][2]-ps[0][2]],e2=[ps[2][0]-ps[0][0],ps[2][1]-ps[0][1],ps[2][2]-ps[0][2]];
  const c=cross3(e1,e2);const ids=ps.map((p,i)=>g.v(Object.assign({position:p,normal:n},attr(i))));
  if(c[0]*n[0]+c[1]*n[1]+c[2]*n[2]>=0)g.quad(ids[0],ids[1],ids[2],ids[3]);else g.quad(ids[0],ids[3],ids[2],ids[1]);
}
// ---------------- props builder ----------------
class PB{
  constructor(){this.g=new GB({position:3,normal:3,color:3,aM:1})}
  box(cx,cy,cz,sx,sy,sz,ry,col,m,rx){
    const c=Math.cos(ry||0),s=Math.sin(ry||0);const cr=Math.cos(rx||0),sr=Math.sin(rx||0);
    const T=(x,y,z)=>{const y2=y*cr-z*sr,z2=y*sr+z*cr;return [cx+x*c+z2*s,cy+y2,cz-x*s+z2*c]};
    const R=(x,y,z)=>{const y2=y*cr-z*sr,z2=y*sr+z*cr;return [x*c+z2*s,y2,-x*s+z2*c]};
    const hx=sx/2,hy=sy/2,hz=sz/2;const g=this.g;
    const F=[[[1,0,0],[[hx,-hy,-hz],[hx,hy,-hz],[hx,hy,hz],[hx,-hy,hz]]],[[-1,0,0],[[-hx,-hy,hz],[-hx,hy,hz],[-hx,hy,-hz],[-hx,-hy,-hz]]],
      [[0,1,0],[[-hx,hy,-hz],[-hx,hy,hz],[hx,hy,hz],[hx,hy,-hz]]],[[0,-1,0],[[-hx,-hy,hz],[-hx,-hy,-hz],[hx,-hy,-hz],[hx,-hy,hz]]],
      [[0,0,1],[[hx,-hy,hz],[hx,hy,hz],[-hx,hy,hz],[-hx,-hy,hz]]],[[0,0,-1],[[-hx,-hy,-hz],[-hx,hy,-hz],[hx,hy,-hz],[hx,-hy,-hz]]]];
    for(const [n,ps] of F){const nn=R(...n);quadN(g,ps.map(p=>T(...p)),nn,()=>({color:col,aM:m||0}))}
  }
  cyl(x,y,z,r1,r2,h,seg,col,m,rx,rz,ry){
    const g=this.g;const cr=Math.cos(rx||0),sr=Math.sin(rx||0),cz2=Math.cos(rz||0),sz2=Math.sin(rz||0),cy=Math.cos(ry||0),sy=Math.sin(ry||0);
    const R=(px,py,pz)=>{let y1=py*cr-pz*sr,z1=py*sr+pz*cr;let x1=px*cz2-y1*sz2,y2=px*sz2+y1*cz2;return [x1*cy+z1*sy,y2,-x1*sy+z1*cy]};
    const T=(px,py,pz)=>{const q=R(px,py,pz);return [x+q[0],y+q[1],z+q[2]]};
    for(let i=0;i<seg;i++){const a0=i/seg*6.283,a1=(i+1)/seg*6.283;
      const ps=[T(Math.cos(a0)*r1,0,Math.sin(a0)*r1),T(Math.cos(a1)*r1,0,Math.sin(a1)*r1),T(Math.cos(a1)*r2,h,Math.sin(a1)*r2),T(Math.cos(a0)*r2,h,Math.sin(a0)*r2)];
      const am=(a0+a1)/2;quadN(g,ps,R(Math.cos(am),0,Math.sin(am)),()=>({color:col,aM:m||0}))}
    // cap top
    const c=g.v({position:T(0,h,0),normal:R(0,1,0),color:col,aM:m||0});
    for(let i=0;i<seg;i++){const a0=i/seg*6.283,a1=(i+1)/seg*6.283;const p0=g.v({position:T(Math.cos(a0)*r2,h,Math.sin(a0)*r2),normal:R(0,1,0),color:col,aM:m||0}),p1=g.v({position:T(Math.cos(a1)*r2,h,Math.sin(a1)*r2),normal:R(0,1,0),color:col,aM:m||0});g.tri(c,p1,p0);g.tri(c,p0,p1)}
  }
  build(){return this.g.n?this.g.build():null}
}
// ---------------- parked car (static, props) ----------------
const PCAR_COLS=['#f1f1ef','#1c1c1e','#8c9198','#b8bcc2','#9b1b1e','#1f3f73','#2e5a3c','#c7b28d','#5a2d1c','#dcdcd4','#3c6e8f','#7a7f2a'];
function propCar(P,x,y,z,ry,r){
  const col=sRGB(PCAR_COLS[Math.floor(r()*PCAR_COLS.length)]);const t=r();
  const L=t<.3?3.9:4.4,W=1.72,hb=.7,hc=.6;const dk=sRGB('#151515'),gl=[.02,.025,.03];
  const c=Math.cos(ry),s=Math.sin(ry);const at=(u,v)=>[x+u*s+v*c,z+u*c-v*s]; // u forward
  let p=at(0,0);P.box(p[0],y+.3+hb/2,p[1],W,hb,L,ry,col,1);
  p=at(-.15,0);P.box(p[0],y+.3+hb+hc/2,p[1],W*.86,hc,L*.5,ry,col,1);
  P.box(p[0],y+.3+hb+hc*.45,p[1],W*.88,hc*.62,L*.52,ry,gl,2);
  for(const fu of [-L*.32,L*.32])for(const sv of [-W*.44,W*.44]){const q=at(fu,sv);P.cyl(q[0]-Math.cos(ry)*.1*Math.sign(sv),y+.31,q[1]+Math.sin(ry)*.1*Math.sign(sv),.31,.31,.2,8,dk,4,0,Math.PI/2,ry)}
  for(const sv of [-W*.32,W*.32]){let q=at(L/2,sv);P.box(q[0],y+.3+hb*.65,q[1],.24,.11,.04,ry,sRGB('#e8e4d2'),8);q=at(-L/2,sv);P.box(q[0],y+.3+hb*.7,q[1],.24,.11,.04,ry,sRGB('#8a1a14'),8)}
}
// ---------------- street lamp (Soviet concrete pole, cobra head) ----------------
function propLamp(P,x,y,z,dx,dz,kind){
  const ry=Math.atan2(dx,dz);
  if(kind===1){ // courtyard / decorative
    P.cyl(x,y,z,.08,.06,4.2,6,sRGB('#2f3133'),1);P.box(x,y+4.35,z,.42,.35,.42,0,sRGB('#fff0c8'),3);P.box(x,y+4.58,z,.5,.08,.5,0,sRGB('#2f3133'),1);return;
  }
  P.cyl(x,y,z,.15,.1,8.2,7,sRGB('#9a9892'),9);
  P.box(x+dx*.75,y+8.15,z+dz*.75,.09,.09,1.6,ry,sRGB('#6c6e70'),1,-.12);
  P.box(x+dx*1.55,y+8.0,z+dz*1.55,.32,.14,.7,ry,sRGB('#55585a'),1);
  P.box(x+dx*1.55,y+7.9,z+dz*1.55,.26,.06,.56,ry,sRGB('#ffcf88'),3);
}
// ---------------- ground ----------------
function buildGround2(id){
  const [x0,z0]=chunkOrigin(id);
  const g=new GB({position:3,normal:3,aK:2,aR:4,aU:1});
  const N=20,st=CH/N,base=g.n;const hs=[];
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++)hs.push(groundH(x0+i*st,z0+j*st));
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
    const h=hs[j*(N+1)+i];const hl=hs[j*(N+1)+Math.max(0,i-1)],hr=hs[j*(N+1)+Math.min(N,i+1)],hu=hs[Math.max(0,j-1)*(N+1)+i],hd=hs[Math.min(N,j+1)*(N+1)+i];
    const nx=(hl-hr)/(2*st),nz=(hu-hd)/(2*st);const l=Math.hypot(nx,1,nz);
    g.v({position:[x0+i*st,h,z0+j*st],normal:[nx/l,1/l,nz/l],aK:[0,0],aR:[0,0,0,0],aU:0});
  }
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=base+j*(N+1)+i,b=a+1,c=a+N+2,d=a+N+1;
    if(hs[j*(N+1)+i]<SL-6&&hs[j*(N+1)+i+1]<SL-6&&hs[(j+1)*(N+1)+i]<SL-6&&hs[(j+1)*(N+1)+i+1]<SL-6)continue;
    g.tri(a,d,c);g.tri(a,c,b)}
  const P=D.nodes,wn=D.wn,ws=D.wstart;
  const s0=D.segStart[id],s1=D.segStart[id+1];
  const lampPts=[];
  for(let s=s0;s<s1;s++){
    const i=D.seg[s],k=D.wOf[i],c=D.wcls[k],fl=D.wfl[k];
    const a=wn[i],b=wn[i+1];
    const ax=P[a*2],az=P[a*2+1],bx=P[b*2],bz=P[b*2+1];
    const L=Math.hypot(bx-ax,bz-az);if(L<.05)continue;
    if(EXCL_ROAD&&EXCL_ROAD(ax,az,bx,bz))continue;
    const tx=(bx-ax)/L,tz=(bz-az)/L;const nx=-tz,nz=tx;
    const miter=(ri,end)=>{
      let mx=nx,mz=nz;const first=ws[k],last=ws[k+1]-1;
      if(!end&&ri>first){const p=wn[ri-1];const qx=P[a*2]-P[p*2],qz=P[a*2+1]-P[p*2+1];const ql=Math.hypot(qx,qz)||1;mx=nx+(-qz/ql);mz=nz+qx/ql}
      if(end&&ri<last){const q=wn[ri+1];const qx=P[q*2]-P[b*2],qz=P[q*2+1]-P[b*2+1];const ql=Math.hypot(qx,qz)||1;mx=nx+(-qz/ql);mz=nz+qx/ql}
      const ml=Math.hypot(mx,mz)||1;mx/=ml;mz/=ml;const sc=1/Math.max(.45,mx*nx+mz*nz);return [mx*sc,mz*sc];
    };
    const [m0x,m0z]=miter(i,false),[m1x,m1z]=miter(i+1,true);
    const ped=fl===1;
    const hw=ped?HW[c]+SW[c]+1.2:HW[c];
    const kind=ped?5:(c<3?1:4);
    const yo=ped?.13:[.115,.095,.075,.055][c];   // well separated so crossings never z-fight
    const hA=groundH(ax,az),hB=groundH(bx,bz),hM=groundH((ax+bx)/2,(az+bz)/2);
    const flat=Math.abs(hA)+Math.abs(hB)+Math.abs(hM)<.01;
    const nsub=flat?1:Math.max(1,Math.ceil(L/8));
    const dP=D.dPrev[i],dN=D.dNext[i+1];
    let prevL=-1,prevR=-1;
    for(let q=0;q<=nsub;q++){
      const t=q/nsub,px=ax+(bx-ax)*t,pz=az+(bz-az)*t;
      const mx=m0x+(m1x-m0x)*t,mz=m0z+(m1z-m0z)*t;
      const lx=px-mx*hw,lz=pz-mz*hw,rx=px+mx*hw,rz=pz+mz*hw;
      const hl=flat?0:groundH(lx,lz),hr=flat?0:groundH(rx,rz);
      const slope=flat?0:Math.abs(hl-hr)/(2*hw)+Math.abs(hB-hA)/L;
      const yy=yo+slope*.6;
      const vl=g.v({position:[lx,hl+yy,lz],normal:[0,1,0],aK:[kind,c],aR:[L*t,dP,dN,L],aU:-1});
      const vr=g.v({position:[rx,hr+yy,rz],normal:[0,1,0],aK:[kind,c],aR:[L*t,dP,dN,L],aU:1});
      if(q>0)g.quad(prevR,vr,vl,prevL);
      prevL=vl;prevR=vr;
    }
    if(c<=1&&!ped){
      const sw=SW[c],cut=c===0?8.5:7;
      const ca=D.cum[i],cb=D.cum[i+1];
      const cuts=[];
      for(let r=ws[k];r<ws[k+1];r++){if(D.deg[wn[r]]>=3||(r===ws[k]||r===ws[k+1]-1)&&D.deg[wn[r]]>=2){const cp=D.cum[r];if(cp>ca-cut-1&&cp<cb+cut+1)cuts.push(cp)}}
      let iv=[[ca,cb]];
      for(const cp of cuts){const nv=[];for(const [u0,u1] of iv){if(cp+cut<=u0||cp-cut>=u1){nv.push([u0,u1]);continue}if(cp-cut>u0)nv.push([u0,cp-cut]);if(cp+cut<u1)nv.push([cp+cut,u1])}iv=nv}
      for(const [u0,u1] of iv){
        if(u1-u0<.5)continue;
        const t0=(u0-ca)/(cb-ca),t1=(u1-ca)/(cb-ca);
        const ns=flat?1:Math.max(1,Math.ceil((u1-u0)/8));
        for(const side of [-1,1]){
          let pI=-1,pO=-1,pC0=-1,pC1=-1;
          for(let q=0;q<=ns;q++){
            const t=t0+(t1-t0)*q/ns;const px=ax+(bx-ax)*t,pz=az+(bz-az)*t;
            const mx=m0x+(m1x-m0x)*t,mz=m0z+(m1z-m0z)*t;
            const ix=px+side*mx*hw,iz=pz+side*mz*hw,ox=px+side*mx*(hw+sw),oz=pz+side*mz*(hw+sw);
            const hi=flat?0:groundH(ix,iz),ho=flat?0:groundH(ox,oz);
            const top=.17;
            const vi=g.v({position:[ix,hi+top,iz],normal:[0,1,0],aK:[2,c],aR:[0,0,0,0],aU:0});
            const vo=g.v({position:[ox,ho+top,oz],normal:[0,1,0],aK:[2,c],aR:[0,0,0,0],aU:0});
            const c0=g.v({position:[ix,hi+yo-.02,iz],normal:[-side*nx,0,-side*nz],aK:[3,c],aR:[0,0,0,0],aU:0});
            const c1=g.v({position:[ix,hi+top,iz],normal:[-side*nx,0,-side*nz],aK:[3,c],aR:[0,0,0,0],aU:0});
            if(q>0){if(side>0){g.quad(pO,vo,vi,pI);g.quad(pC0,pC1,c1,c0)}else{g.quad(pI,vi,vo,pO);g.quad(c0,c1,pC1,pC0)}}
            pI=vi;pO=vo;pC0=c0;pC1=c1;
          }
        }
        const step=c===0?30:36;
        for(let u=Math.ceil(u0/step)*step;u<u1;u+=step){
          const t=(u-ca)/(cb-ca);const side=(Math.round(u/step)%2===0)?1:-1;
          const px=ax+(bx-ax)*t,pz=az+(bz-az)*t;const off=hw+sw-.45;
          lampPts.push([px+side*nx*off,pz+side*nz*off,-side*nx,-side*nz,0]);
          if(c===0)lampPts.push([px-side*nx*off,pz-side*nz*off,side*nx,side*nz,0]);
        }
      }
    }
    if(ped){
      const ca=D.cum[i],cb=D.cum[i+1];
      for(let u=Math.ceil(ca/16)*16;u<cb;u+=16){const t=(u-ca)/(cb-ca);const px=ax+(bx-ax)*t,pz=az+(bz-az)*t;
        lampPts.push([px+nx*(hw-1.2),pz+nz*(hw-1.2),-nx,-nz,1]);lampPts.push([px-nx*(hw-1.2),pz-nz*(hw-1.2),nx,nz,1])}
    }
  }
  const m=new THREE.Mesh(g.build(),MATS.ground);m.matrixAutoUpdate=false;m.receiveShadow=true;
  return {mesh:m,lampPts};
}
let EXCL_ROAD=null;
// ---------------- buildings v2 ----------------
function hjs(a,b){let h=Math.sin(a*127.1+b*311.7)*43758.5453;return h-Math.floor(h)}
function addBuilding2(g,B,obbs,P,S,opt){
  opt=opt||{};
  const {cx,cz,w,d,a,f,s}=B;let seed=Math.min(B.seed,250);if(opt.seed!==undefined)seed=opt.seed;
  const ca=Math.cos(a),sa=Math.sin(a);
  const C=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>[cx+u*ca-v*sa,cz+u*sa+v*ca]);
  let y0=1e9;for(const [x,z] of C)y0=Math.min(y0,groundH(x,z));
  if(opt.y0!==undefined)y0=opt.y0;
  const FH=FH2[s],GF=GF2[s];
  const H=GF+(GF>0?f-1:f)*FH;
  const top=y0+H+PARA2[s];
  const yb=opt.bottom!==undefined?y0+opt.bottom:y0-2.5;
  const resid=(s===KHRU||s===PANEL||s===BRICK||s===HOME_ST);
  const fp=opt.frontPt;
  const r=rng(Math.floor(cx*13.1+cz*7.7)^seed*977);
  const walls=[];
  for(let e=0;e<4;e++){
    const [x1,z1]=C[e],[x2,z2]=C[(e+1)%4];
    const L=Math.hypot(x2-x1,z2-z1);let nx=(z2-z1)/L,nz=-(x2-x1)/L;
    const mx=(x1+x2)/2-cx,mz=(z1+z2)/2-cz;if(nx*mx+nz*mz<0){nx=-nx;nz=-nz}
    const tx=(x2-x1)/L,tz=(z2-z1)/L;
    let wseed=seed;
    if(fp)wseed=((fp[0]-(x1+x2)/2)*nx+(fp[1]-(z1+z2)/2)*nz>0)?254:253;
    walls.push({x1,z1,x2,z2,L,nx,nz,tx,tz,long:(e%2===0)===(w>=d),yard:wseed===254});
    const A=i=>({aUV:[i===1||i===2?L:0,i<2?yb-y0:top-y0],aP:[s,f,wseed,L],aQ:0,aT:[tx,0,tz]});
    quadN(g,[[x1,yb,z1],[x2,yb,z2],[x2,top,z2],[x1,top,z1]],[nx,0,nz],A);
  }
  if(opt.bottom!==undefined)quadN(g,C.map(([x,z])=>[x,yb,z]),[0,-1,0],()=>({aUV:[0,0],aP:[s,f,seed,-1],aQ:6,aT:[1,0,0]}));
  // roof
  const hip=(s===HIST&&(seed*7.31%1)<.55)||s===MOLD,gable=s===HOUSE;
  quadN(g,C.map(([x,z])=>[x,top,z]),[0,1,0],()=>({aUV:[0,0],aP:[s,f,seed,-1],aQ:1,aT:[1,0,0]}));
  if(hip||gable){
    const long=w>=d,Lh=long?w:d,Sh=long?d:w;
    const hr=gable?Sh*.38:Sh*(s===MOLD?.3:.22),ov=gable?.35:.15;
    const ax=long?[ca,sa]:[-sa,ca],ay=long?[-sa,ca]:[-ca,-sa];
    const Pt=(u,v,y)=>[cx+ax[0]*u+ay[0]*v,y,cz+ax[1]*u+ay[1]*v];
    const hl=Lh/2+ov,hs=Sh/2+ov,rl=gable?hl:Math.max(0,Lh/2-Sh/2);
    const c00=Pt(-hl,-hs,top),c10=Pt(hl,-hs,top),c11=Pt(hl,hs,top),c01=Pt(-hl,hs,top),R0=Pt(-rl,0,top+hr),R1=Pt(rl,0,top+hr);
    const face=(pts,q)=>{const [A,Bp,Cp]=pts;let n=cross3([Bp[0]-A[0],Bp[1]-A[1],Bp[2]-A[2]],[Cp[0]-A[0],Cp[1]-A[1],Cp[2]-A[2]]);const l=Math.hypot(...n)||1;n=n.map(x=>x/l);if(n[1]<0)n=n.map(x=>-x);
      const ids=pts.map(p=>g.v({position:p,normal:n,aQ:q,aP:[s,f,seed,-1],aUV:[0,0],aT:[1,0,0]}));
      const c2=cross3([pts[1][0]-pts[0][0],pts[1][1]-pts[0][1],pts[1][2]-pts[0][2]],[pts[2][0]-pts[0][0],pts[2][1]-pts[0][1],pts[2][2]-pts[0][2]]);
      const ok=c2[0]*n[0]+c2[1]*n[1]+c2[2]*n[2]>0;const o=ok?ids:ids.slice().reverse();
      if(o.length===3)g.tri(o[0],o[1],o[2]);else g.quad(o[0],o[1],o[2],o[3]);};
    face([c00,c10,R1,R0],2);face([c11,c01,R0,R1],2);
    if(gable){for(const [pA,pB,pR,sg] of [[c01,c00,R0,-1],[c10,c11,R1,1]]){const n=[ax[0]*sg,0,ax[1]*sg];
      const ids=[pA,pB,pR].map(p=>g.v({position:[p[0]-ax[0]*sg*ov,p[1],p[2]-ax[1]*sg*ov],normal:n,aQ:0,aP:[s,f,seed,Sh],aUV:[0,top-y0+5],aT:[ay[0],0,ay[1]]}));g.tri(ids[0],ids[1],ids[2]);g.tri(ids[0],ids[2],ids[1])}
      if(P){const ch=Pt(Lh*.25,-Sh*.15,0);P.box(ch[0],top+hr*.7,ch[2],.6,hr*1.2+1,.6,a,sRGB('#7a4a3a'),9)}
    } else {face([c01,c00,R0],2);face([c10,c11,R1],2)}
  }
  // loggias / balconies on long walls
  if(resid&&f>=4&&!opt.noLogg){
    const CS=CS2[s];
    for(const W of walls){
      if(!W.long)continue;
      const nC=Math.max(1,Math.floor(W.L/CS+.3)),cs=W.L/nC;
      for(let ci=0;ci<nC;ci++){
        let on=false;
        if(s===PANEL)on=ci%3===1;
        else if(s===KHRU)on=ci%3===1&&(hjs(seed,W.nx*3+W.nz)>.4);
        else if(s===BRICK)on=(ci%4===1||ci%4===2)&&hjs(seed,ci)>.25;
        else on=(ci%3!==0)&&Math.abs(((ci+.5)*cs%22)-11)>2.8;
        if(!on)continue;
        const lw=cs*.86,dep=1.25,uc=(ci+.5)*cs;
        const vb=Math.max(GF,FH,opt.bottom||0)+.02,vt=H+.02;
        if(vt-vb<2)continue;
        const bx=W.x1+W.tx*uc,bz=W.z1+W.tz*uc;
        const L0=[bx-W.tx*lw/2,bz-W.tz*lw/2],R0=[bx+W.tx*lw/2,bz+W.tz*lw/2];
        const L1=[L0[0]+W.nx*dep,L0[1]+W.nz*dep],R1=[R0[0]+W.nx*dep,R0[1]+W.nz*dep];
        const yA=y0+vb,yB=y0+vt;
        quadN(g,[[L1[0],yA,L1[1]],[R1[0],yA,R1[1]],[R1[0],yB,R1[1]],[L1[0],yB,L1[1]]],[W.nx,0,W.nz],i=>({aUV:[i===1||i===2?lw:0,i<2?vb:vt],aP:[s,f,seed+ci,lw],aQ:4,aT:[W.tx,0,W.tz]}));
        for(const [Pa,Pb,sg] of [[L0,L1,-1],[R0,R1,1]])quadN(g,[[Pa[0],yA,Pa[1]],[Pb[0],yA,Pb[1]],[Pb[0],yB,Pb[1]],[Pa[0],yB,Pa[1]]],[W.tx*sg,0,W.tz*sg],i=>({aUV:[i===1||i===2?dep:0,i<2?vb:vt],aP:[s,f,seed,dep],aQ:5,aT:[W.nx,0,W.nz]}));
        quadN(g,[[L0[0],yA,L0[1]],[R0[0],yA,R0[1]],[R1[0],yA,R1[1]],[L1[0],yA,L1[1]]],[0,-1,0],()=>({aUV:[0,0],aP:[s,f,seed,-1],aQ:6,aT:[1,0,0]}));
        quadN(g,[[L0[0],yB,L0[1]],[R0[0],yB,R0[1]],[R1[0],yB,R1[1]],[L1[0],yB,L1[1]]],[0,1,0],()=>({aUV:[0,0],aP:[s,f,seed,-1],aQ:6,aT:[1,0,0]}));
        // satellite dishes
        if(P&&r()<.35){const fl2=Math.floor(r()*(f-2))+1;const yy=y0+GF+fl2*FH+1.5;const px=bx+W.nx*(dep+.2)+W.tx*(lw*.3),pz=bz+W.nz*(dep+.2)+W.tz*(lw*.3);
          P.cyl(px,yy,pz,.32,.05,.12,8,sRGB('#d8d8d4'),1,Math.PI/2*.8,0,Math.atan2(W.nx,W.nz))}
      }
    }
  }
  // AC units on facades, entrance canopies, front detection
  if(P&&(resid||s===HIST||s===MOLD||s===SHOP)){
    const CS=CS2[s];
    for(const W of walls){
      if(W.L<6)continue;
      const nC=Math.max(1,Math.floor(W.L/CS+.3)),cs=W.L/nC;
      const rows=Math.max(1,(GF>0?f-1:f));
      const nAC=Math.floor(nC*rows*(resid?.07:.05));
      for(let q=0;q<nAC;q++){const ci=Math.floor(r()*nC),row=Math.floor(r()*rows);const u=(ci+.5)*cs+(r()<.5?-1:1)*cs*.36;const yy=y0+GF+row*FH+(GF>0?0:0)+.6;
        if(yy>top-1)continue;const px=W.x1+W.tx*u+W.nx*.18,pz=W.z1+W.tz*u+W.nz*.18;P.box(px,yy,pz,.82,.56,.3,Math.atan2(W.nx,W.nz),sRGB('#e9e9e4'),1)}
    }
  }
  if(P&&resid&&f>=4&&opt.props!==false){
    const longW=walls.filter(W=>W.long);
    let front=longW[0];let best=1e9;
    if(fp)front=longW.find(W=>W.yard)||longW[0];
    else for(const W of longW){const mx=(W.x1+W.x2)/2+W.nx*14,mz=(W.z1+W.z2)/2+W.nz*14;const dd=distRoad(mx,mz);if(dd<best){best=dd;front=W}}
    const span=front.L/Math.max(1,Math.floor(front.L/18));
    for(let u=span/2;u<front.L;u+=span){
      const px=front.x1+front.tx*u,pz=front.z1+front.tz*u;const ry=Math.atan2(front.nx,front.nz);
      P.box(px+front.nx*.75,y0+2.55,pz+front.nz*.75,2.4,.14,1.5,ry,sRGB('#a9a8a2'),9);
      if(r()<.75){const bx=px+front.nx*3.2+front.tx*2.4,bz=pz+front.nz*3.2+front.tz*2.4;propBench(P,bx,groundH(bx,bz),bz,ry+Math.PI,r);}
      if(r()<.6){const tx2=px+front.nx*2.6-front.tx*2.0,tz2=pz+front.nz*2.6-front.tz*2.0;P.cyl(tx2,groundH(tx2,tz2),tz2,.28,.3,.8,8,sRGB(r()<.5?'#2f6b3a':'#5a5f63'),1)}
      if(opt.lots)opt.lots.push({x:px+front.nx*10,z:pz+front.nz*10,tx:front.tx,tz:front.tz,nx:front.nx,nz:front.nz});
    }
  }
  // shop signs
  if(S&&(s===SHOP||(s===HIST&&r()<.7)||(s===BRICK&&(seed*3.7%1)>.5)||s===TOWER)){
    for(const W of walls){
      if(W.L<8)continue;
      if(s!==SHOP&&r()<.5)continue;
      const gf=GF>0?GF:4.2;const cnt=s===SHOP?1:Math.max(1,Math.floor(W.L/10));
      for(let q=0;q<cnt;q++){
        const len=s===SHOP?Math.min(W.L-2,12):Math.min(5.5,W.L*.4);const u=s===SHOP?W.L/2:(q+.5)*W.L/cnt;
        const idx=Math.floor(r()*SIGNS.length);addSign(S,W.x1+W.tx*u+W.nx*.08,y0+gf-.62,W.z1+W.tz*u+W.nz*.08,W.tx,W.tz,W.nx,W.nz,len,.62,idx);
      }
    }
  }
  // roof structures
  if(P&&(s===PANEL||s===BRICK||s===TOWER||s===HOME_ST)&&w*d>200){
    const n=s===PANEL&&w>45?2:1;
    for(let q=0;q<n;q++){const u=n===2?(q?w/4:-w/4):0;const bx=cx+u*ca,bz=cz+u*sa;P.box(bx,top+1.3,bz,5,2.6,3.6,-a,sRGB('#9c9a94'),9);}
    if(r()<.6){const ux=(r()-.5)*w*.6;P.cyl(cx+ux*ca,top,cz+ux*sa,.04,.03,3.5,4,sRGB('#777'),1)}
  }
  if(obbs)obbs.push(cx,cz,w/2,d/2,ca,sa);
  return {top,y0,walls};
}
function propBench(P,x,y,z,ry,r){
  const c=Math.cos(ry),s=Math.sin(ry);const at=(u,v)=>[x+u*c+v*s,z-u*s+v*c];
  if(P.benches)P.benches.push({x,z,y,ry});
  for(const u of [-.75,.75]){const p=at(u,0);P.box(p[0],y+.22,p[1],.12,.44,.5,ry,sRGB('#8f8d88'),9)}
  let p=at(0,0);P.box(p[0],y+.46,p[1],1.9,.06,.5,ry,sRGB('#7a5534'),5);
  p=at(0,-.24);P.box(p[0],y+.78,p[1],1.9,.36,.05,ry,sRGB('#7a5534'),5);
}
// black metal bench with dark wooden slats (like the real yard)
function propBench2(P,x,y,z,ry,list){
  if(list)list.push({x,z,y,ry});
  const c=Math.cos(ry),s=Math.sin(ry);const at=(u,v)=>[x+u*c+v*s,z-u*s+v*c];const blk=sRGB('#1b1c1e'),wd=sRGB('#3a2a20');
  for(const u of [-.82,.82]){let p=at(u,.05);P.box(p[0],y+.22,p[1],.06,.44,.5,ry,blk,1);p=at(u,-.22);P.box(p[0],y+.62,p[1],.06,.42,.06,ry,blk,1,-.18);p=at(u,.05);P.box(p[0],y+.64,p[1],.06,.05,.46,ry,blk,1)}
  for(const v of [-.14,.0,.14]){const p=at(0,v+.05);P.box(p[0],y+.45,p[1],1.85,.04,.11,ry,wd,5)}
  for(const h of [.62,.78]){const p=at(0,-.25-(h-.62)*.18);P.box(p[0],y+h,p[1],1.85,.09,.035,ry,wd,5,-.18)}
}
// pole with two white globes
function propGlobeLamp(P,x,y,z,ry){
  const blk=sRGB('#202224');P.cyl(x,y,z,.09,.06,3.55,8,blk,1);P.box(x,y+3.55,z,.9,.05,.05,ry,blk,1);
  const c=Math.cos(ry),s=Math.sin(ry);for(const u of [-.38,.38]){const gx=x+u*c,gz=z-u*s;P.cyl(gx,y+3.48,gz,.03,.03,.08,6,blk,1);P.cyl(gx,y+3.56,gz,.12,.2,.08,8,sRGB('#f4f1e8'),3);P.cyl(gx,y+3.64,gz,.2,.12,.12,8,sRGB('#f4f1e8'),3);P.cyl(gx,y+3.76,gz,.12,.04,.08,8,sRGB('#f4f1e8'),3)}
}
function addSign(S,x,y,z,tx,tz,nx,nz,len,h,idx){
  const [u0,v0,u1,v1]=signUV(idx);tx=nz;tz=-nx;   // text runs left->right as seen from the front (no mirroring)
  const p=(a,b)=>[x+tx*a,y+b,z+tz*a];
  const ps=[p(-len/2,0),p(len/2,0),p(len/2,h),p(-len/2,h)];
  const uvs=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
  quadN(S,ps,[nx,0,nz],i=>({uv:uvs[i]}));
}
function distRoad(x,z){
  const id=chunkIdAt2(x,z);if(id<0)return 1e9;let best=1e9;
  const P=D.nodes,wn=D.wn;const i0=id%NCX,j0=Math.floor(id/NCX);
  for(let j=j0-1;j<=j0+1;j++)for(let i=i0-1;i<=i0+1;i++){if(i<0||j<0||i>=NCX||j>=NCZ)continue;const cid=j*NCX+i;
    for(let s=D.segStart[cid];s<D.segStart[cid+1];s++){const q=D.seg[s],k=D.wOf[q];if(D.wcls[k]>2)continue;const a=wn[q]*2,b=wn[q+1]*2;
      const ax=P[a],az=P[a+1],dx=P[b]-ax,dz=P[b+1]-az;const L2=dx*dx+dz*dz;if(L2<.01)continue;let t=((x-ax)*dx+(z-az)*dz)/L2;t=t<0?0:t>1?1:t;
      const d=Math.hypot(ax+dx*t-x,az+dz*t-z);if(d<best)best=d}}
  return best;
}
function chunkIdAt2(x,z){const i=Math.floor((x-BB[0])/CH),j=Math.floor((z-BB[2])/CH);if(i<0||j<0||i>=NCX||j>=NCZ)return -1;return j*NCX+i}
// ---------------- trees v2 ----------------
let TREE_TRUNK=null,TREE_LEAF=null;
function makeTreeGeos(){
  const g=new GB({position:3,normal:3,uv:2});const r=mkRand(77);
  const limb=(x0,y0,z0,x1,y1,z1,r0,r1)=>{const dx=x1-x0,dy=y1-y0,dz=z1-z0,L=Math.hypot(dx,dy,dz);const ax=[dx/L,dy/L,dz/L];
    let up=Math.abs(ax[1])<.9?[0,1,0]:[1,0,0];let b1=cross3(ax,up);let l=Math.hypot(...b1);b1=b1.map(v=>v/l);const b2=cross3(ax,b1);
    const seg=r0>.15?6:4;for(let i=0;i<seg;i++){const a0=i/seg*6.283,a1=(i+1)/seg*6.283;
      const P=(a,t,rr)=>[x0+dx*t+(b1[0]*Math.cos(a)+b2[0]*Math.sin(a))*rr,y0+dy*t+(b1[1]*Math.cos(a)+b2[1]*Math.sin(a))*rr,z0+dz*t+(b1[2]*Math.cos(a)+b2[2]*Math.sin(a))*rr];
      const N=a=>[b1[0]*Math.cos(a)+b2[0]*Math.sin(a),b1[1]*Math.cos(a)+b2[1]*Math.sin(a),b1[2]*Math.cos(a)+b2[2]*Math.sin(a)];
      const ids=[g.v({position:P(a0,0,r0),normal:N(a0),uv:[i/seg,0]}),g.v({position:P(a1,0,r0),normal:N(a1),uv:[(i+1)/seg,0]}),g.v({position:P(a1,1,r1),normal:N(a1),uv:[(i+1)/seg,L/2]}),g.v({position:P(a0,1,r1),normal:N(a0),uv:[i/seg,L/2]})];
      g.quad(ids[0],ids[3],ids[2],ids[1]);}};
  limb(0,0,0,0,3.6,0,.24,.17);
  const tips=[];
  for(let i=0;i<6;i++){const a=i/6*6.283+r()*.5,h=2.6+r()*1.2;const ex=Math.cos(a)*(1.9+r()*1.3),ez=Math.sin(a)*(1.9+r()*1.3),ey=h+2.2+r()*1.6;
    limb(0,h,0,ex,ey,ez,.12,.05);tips.push([ex,ey,ez]);
    {const tx=ex+(r()-.5)*1.8,tz=ez+(r()-.5)*1.8,ty=ey+.8+r()*1.2;limb(ex*.7,ey-.5,ez*.7,tx,ty,tz,.05,.02)}}
  limb(0,3.4,0,(r()-.5),7.6,(r()-.5),.15,.05);
  TREE_TRUNK=g.build();
  const lg=new GB({position:3,normal:3,uv:2});
  const cards=28;
  for(let i=0;i<cards;i++){
    const u=r()*2-1,th=r()*6.283,rr=Math.sqrt(1-u*u);const cxp=Math.cos(th)*rr*2.9,cyp=5.6+u*2.3,czp=Math.sin(th)*rr*2.9;
    const s=2.0+r()*1.1;const ry=r()*6.283,rx=(r()-.5)*1.2;
    const c=Math.cos(ry),sn=Math.sin(ry),cr=Math.cos(rx),sr=Math.sin(rx);
    const T=(x,y)=>{const y2=y*cr,z2=y*sr;return [cxp+x*c+z2*sn,cyp+y2,czp-x*sn+z2*c]};
    const nrm=[cxp,(cyp-5.4)*1.2,czp];const nl=Math.hypot(...nrm)||1;const n=nrm.map(v=>v/nl);
    const ids=[[-s/2,-s/2,0,0],[s/2,-s/2,1,0],[s/2,s/2,1,1],[-s/2,s/2,0,1]].map(([x,y,a,b])=>lg.v({position:T(x,y),normal:n,uv:[a,b]}));
    lg.quad(ids[0],ids[1],ids[2],ids[3]);
  }
  TREE_LEAF=lg.build();
}
const TREE_COLS2=[[.55,.75,.40],[.45,.62,.35],[.75,.82,.45],[.52,.70,.38],[.38,.52,.36]];
function buildTrees2(id,obb,dens){
  const [x0,z0]=chunkOrigin(id);const R=rng(id*9781+7);
  const pts=[];const P=D.nodes,wn=D.wn;
  const s0=D.segStart[id],s1=D.segStart[id+1];
  for(let s=s0;s<s1;s++){
    const i=D.seg[s],k=D.wOf[i],c=D.wcls[k];if(c>2||D.wfl[k]===2)continue;
    const a=wn[i]*2,b=wn[i+1]*2;const ax=P[a],az=P[a+1],bx=P[b],bz=P[b+1];const L=Math.hypot(bx-ax,bz-az);if(L<4)continue;
    if(EXCL_ROAD&&EXCL_ROAD(ax,az,bx,bz))continue;
    const tx=(bx-ax)/L,tz=(bz-az)/L,nx=-tz,nz=tx;
    const ped=D.wfl[k]===1;
    const off=ped?HW[c]+SW[c]+2.6:(c<2?HW[c]+.95:HW[c]+1.6);
    const spc=ped?9:(c<2?9.5:12);const ca=D.cum[i];
    for(let u=Math.ceil(ca/spc)*spc+R()*2;u<D.cum[i+1];u+=spc){
      if(D.dPrev[i]+u-ca<10&&D.dPrev[i]<999||D.dNext[i+1]+(L-(u-ca))<10)continue;
      for(const sd of [-1,1]){
        if(R()<(c===2?.45:.18))continue;
        const x=ax+tx*(u-ca)+nx*off*sd,z=az+tz*(u-ca)+nz*off*sd;
        if(insideOBB(obb,x,z,1.2)||blockedStatic(x,z,1.5))continue;
        pts.push([x,z,c<2?0:(R()<.5?1:2),.85+R()*.4]);
      }
    }
  }
  const gw=D.gw,Gr=D.green;
  for(let j=0;j<CH/20;j++)for(let i=0;i<CH/20;i++){
    const gx=Math.floor((x0-BB[0])/20)+i,gz=Math.floor((z0-BB[2])/20)+j;if(gx<0||gz<0||gx>=gw||gz>=D.gh)continue;
    const v=Gr[gz*gw+gx]/255;let n=v*3.0*dens;n=Math.floor(n)+(R()<n%1?1:0);
    for(let q=0;q<n;q++){
      const x=x0+(i+R())*20,z=z0+(j+R())*20;
      const h=groundH(x,z);if(h<-26.6)continue;
      if(insideOBB(obb,x,z,2.4)||nearRoad(id,x,z,.8)||blockedStatic(x,z,2))continue;
      let t=R()<.4?0:(R()<.5?1:2);if(R()<.12)t=3;
      pts.push([x,z,t,.75+R()*.5]);
    }
  }
  if(!pts.length)return null;
  const n=pts.length;
  const trunk=new THREE.InstancedMesh(TREE_TRUNK,MATS.bark,n),leaf=new THREE.InstancedMesh(TREE_LEAF,MATS.leaves,n);
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Sv=new THREE.Vector3(),T=new THREE.Vector3(),E=new THREE.Euler(),Cc=new THREE.Color();
  pts.forEach((p,k)=>{
    const [x,z,t,sc]=p;let sx=sc,sy=sc;
    if(t===0){sx*=1.2;sy*=1.25}else if(t===2){sx*=.9;sy*=.85}else if(t===3){sx*=.55;sy*=1.7}
    E.set(0,R()*6.28,0);Q.setFromEuler(E);Sv.set(sx,sy,sx);T.set(x,groundH(x,z)-.1,z);M.compose(T,Q,Sv);trunk.setMatrixAt(k,M);leaf.setMatrixAt(k,M);
    const c=TREE_COLS2[t],v=.85+R()*.3;Cc.setRGB(c[0]*v,c[1]*v,c[2]*v);leaf.setColorAt(k,Cc);
  });
  for(const m of [trunk,leaf]){m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true}
  leaf.customDepthMaterial=LEAF_DEPTH;
  const grp=new THREE.Group();grp.add(trunk);grp.add(leaf);grp.userData.leaf=leaf;
  return grp;
}
let LEAF_DEPTH=null;
const STATIC_BLOCK=[];   // cx,cz,hw,hd,ca,sa  (no trees / no generated buildings)
function blockedStatic(x,z,m){return insideOBB(STATIC_BLOCK,x,z,m)}
