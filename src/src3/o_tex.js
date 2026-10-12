// ===================== procedural textures =====================
const TX={};
function mkRand(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
function lattice(P,seed){const r=mkRand(seed);const a=new Float32Array(P*P);for(let i=0;i<a.length;i++)a[i]=r();return a}
// periodic value noise sampler: x,y in [0,1) texture space, P lattice cells per tile
function pnoise(L,P,x,y){
  x*=P;y*=P;const xi=Math.floor(x),yi=Math.floor(y);let fx=x-xi,fy=y-yi;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
  const x0=((xi%P)+P)%P,y0=((yi%P)+P)%P,x1=(x0+1)%P,y1=(y0+1)%P;
  const a=L[y0*P+x0],b=L[y0*P+x1],c=L[y1*P+x0],d=L[y1*P+x1];
  return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
}
function pfbm(Ls,P0,x,y,oct,gain){let v=0,a=.5,P=P0,n=0;for(let o=0;o<oct;o++){v+=a*pnoise(Ls[o],P,x,y);n+=a;a*=gain||.5;P*=2}return v/n}
function fbmSet(P0,oct,seed){const Ls=[];let P=P0;for(let o=0;o<oct;o++){Ls.push(lattice(P,seed+o*101));P*=2}return Ls}
function dataTex(N,fill,opt){
  const d=new Uint8Array(N*N*4);fill(d,N);
  const t=new THREE.DataTexture(d,N,N,THREE.RGBAFormat,THREE.UnsignedByteType);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;
  t.anisotropy=(opt&&opt.aniso)||8;t.needsUpdate=true;return t;
}
const clamp255=v=>v<0?0:v>255?255:v|0;
function genTextures(){
  const N=512;
  // ---------- asphalt (RGB albedo, A height) ----------
  TX.asphalt=dataTex(N,(d,N)=>{
    const big=fbmSet(2,4,11),mid=fbmSet(16,3,13),fine=fbmSet(128,1,12),r=mkRand(5);
    const crack=new Float32Array(N*N);
    for(let c=0;c<10;c++){let x=r()*N,y=r()*N,a=r()*6.28;const len=60+r()*200;for(let s=0;s<len;s++){a+=(r()-.5)*.5;x+=Math.cos(a);y+=Math.sin(a);
      const xi=((x|0)%N+N)%N,yi=((y|0)%N+N)%N;crack[yi*N+xi]=1;crack[yi*N+(xi+1)%N]=Math.max(crack[yi*N+(xi+1)%N],.4)}}
    const patches=[];for(let p=0;p<4;p++)patches.push([r()*N,r()*N,40+r()*120,30+r()*80,(r()-.5)*.08]);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const u=x/N,v=y/N;const b=pfbm(big,2,u,v,4),m=pfbm(mid,16,u,v,3),f=pnoise(fine[0],128,u,v);
      let g=.26+.06*(b-.5)+.035*(m-.5)+.03*(f-.5);
      const sp=r();if(sp<.03)g+=.04;else if(sp<.05)g-=.03;
      for(const [px,py,pw,ph,dv] of patches){if(Math.abs(((x-px+N*1.5)%N)-N/2)<pw/2&&Math.abs(((y-py+N*1.5)%N)-N/2)<ph/2)g+=dv}
      const cr=crack[y*N+x];g*=1-.45*cr;
      const i=(y*N+x)*4;const c=clamp255(g*255);d[i]=c;d[i+1]=c;d[i+2]=clamp255(c*1.02);d[i+3]=clamp255(255*(.55+.25*(f-.5)+.15*(m-.5)-cr*.45));
    }
  });
  // ---------- sidewalk tiles 2m tile-set (4x4 tiles of 0.5m) ----------
  TX.tiles=dataTex(N,(d,N)=>{
    const n1=fbmSet(8,4,21),r=mkRand(9);const tcol=[];for(let i=0;i<16;i++)tcol.push([.56+r()*.08,r()<.15?.9:1,(r()-.5)*.06,r()<.08]);
    const T=N/4;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const tx=(x/T)|0,ty=(y/T)|0,fx=(x%T)/T,fy=(y%T)/T;const t=tcol[ty*4+tx];
      const e=Math.min(fx,fy,1-fx,1-fy);const gap=e<.025?1:0;const bev=Math.min(1,e/.06);
      const n=pfbm(n1,8,x/N,y/N,4);
      let g=t[0]*(.88+.24*n)+t[2];if(t[3]&&n>.55)g*=.85;
      g*=gap?.45:(.9+.1*bev);
      const i=(y*N+x)*4;d[i]=clamp255(g*255*1.02);d[i+1]=clamp255(g*255);d[i+2]=clamp255(g*255*.95);d[i+3]=clamp255(255*(gap?.1:.55+.35*bev+.1*(n-.5)));
    }
  });
  // ---------- cobblestones (paving) 2m ----------
  TX.cobble=dataTex(N,(d,N)=>{
    const n1=fbmSet(16,3,31),r=mkRand(13);const rows=20,cols=10;const off=[],col=[];for(let j=0;j<rows;j++){off.push(r());for(let i=0;i<cols+1;i++)col.push([.42+r()*.18,r()])}
    for(let y=0;y<N;y++){const fy=y/N*rows,j=fy|0,vy=fy-j;for(let x=0;x<N;x++){
      const fx=(x/N*cols+off[j]*1)%cols,i=fx|0,vx=fx-i;const c=col[j*(cols+1)+i];
      const e=Math.min(vx,1-vx,(vy)*.55,(1-vy)*.55);const bev=Math.min(1,e/.09);
      const n=pfbm(n1,16,x/N,y/N,3);
      let g=c[0]*(.85+.3*n);const warm=c[1];
      g*=e<.035?.35:(.82+.18*bev);
      const k=(y*N+x)*4;d[k]=clamp255(g*255*(1+.12*warm));d[k+1]=clamp255(g*255*(1+.02*warm));d[k+2]=clamp255(g*255*(.95-.06*warm));d[k+3]=clamp255(255*(e<.035?.05:.4+.55*bev));
    }}
  });
  // ---------- grass 4m ----------
  TX.grass=dataTex(N,(d,N)=>{
    const n1=fbmSet(8,5,41),n2=fbmSet(128,1,42),r=mkRand(17);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const u=x/N,v=y/N;const a=pfbm(n1,8,u,v,5),b=pnoise(n2[0],128,u,v);const bl=r();
      let gr=.20+.12*a+.05*b,gg=.30+.14*a+.06*b,gb=.10+.05*a;
      if(a<.38){const t=(.38-a)/.38;gr+=.12*t;gg+=.02*t;gb+=.06*t} // worn patches
      if(bl<.15){gr*=1.25;gg*=1.25}
      const k=(y*N+x)*4;d[k]=clamp255(gr*255);d[k+1]=clamp255(gg*255);d[k+2]=clamp255(gb*255);d[k+3]=clamp255(255*(.4+.4*b+.2*bl));
    }
  });
  // ---------- dirt 4m ----------
  TX.dirt=dataTex(N,(d,N)=>{const n1=fbmSet(8,5,51),r=mkRand(19);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const a=pfbm(n1,8,x/N,y/N,5),s=r();let g=.32+.14*a+(s<.06?.1:0);
      const k=(y*N+x)*4;d[k]=clamp255(g*255*1.18);d[k+1]=clamp255(g*255*.98);d[k+2]=clamp255(g*255*.76);d[k+3]=clamp255(255*(.3+.5*a+(s<.06?.2:0)))}});
  // ---------- sand 4m ----------
  TX.sand=dataTex(N,(d,N)=>{const n1=fbmSet(8,5,61),r=mkRand(23);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=x/N,v=y/N;const a=pfbm(n1,8,u,v,5);const rip=.5+.5*Math.sin((v*18+a*3)*6.283);const s=r();
      let g=.62+.08*a+.04*rip+(s<.08?.06:0)-(s>.97?.12:0);const k=(y*N+x)*4;d[k]=clamp255(g*255*1.06);d[k+1]=clamp255(g*255*.93);d[k+2]=clamp255(g*255*.72);d[k+3]=clamp255(255*(.35+.3*rip+.2*a))}});
  // ---------- snow 4m ----------
  TX.snow=dataTex(N,(d,N)=>{const n1=fbmSet(8,5,71),r=mkRand(29);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const a=pfbm(n1,8,x/N,y/N,5);const s=r();let g=.86+.08*a+(s<.01?.1:0);
      const k=(y*N+x)*4;d[k]=clamp255(g*255*.97);d[k+1]=clamp255(g*255*.99);d[k+2]=clamp255(g*255*1.04);d[k+3]=clamp255(255*(.3+.6*a))}});
  // ---------- brick 2m x 2m : R lum variation, G mortar, B soot, A height ----------
  TX.brick=dataTex(N,(d,N)=>{const n1=fbmSet(16,4,81),r=mkRand(31);const rows=30,cols=8;const lum=[];for(let i=0;i<rows*(cols+1);i++)lum.push(r());
    for(let y=0;y<N;y++){const fy=y/N*rows,j=fy|0,vy=fy-j;for(let x=0;x<N;x++){const fx=(x/N*cols+(j%2)*.5)%cols,i=fx|0,vx=fx-i;
      const mort=(vy<.13||vx<.04)?1:0;const n=pfbm(n1,16,x/N,y/N,4);const k=(y*N+x)*4;
      d[k]=clamp255(255*(.35+.45*lum[j*(cols+1)+i]+.2*(n-.5)));d[k+1]=mort*255;d[k+2]=clamp255(255*n);d[k+3]=clamp255(255*(mort?.15:.6+.3*n))}}});
  // ---------- plaster 4m: R lum, A height ----------
  TX.plaster=dataTex(N,(d,N)=>{const n1=fbmSet(8,6,91),n2=fbmSet(96,1,92),r=mkRand(37);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=x/N,v=y/N;const a=pfbm(n1,8,u,v,6),b=pnoise(n2[0],96,u,v);const s=r();
      const k=(y*N+x)*4;const g=.5+.35*(a-.5)+.12*(b-.5)+(s-.5)*.02;d[k]=d[k+1]=d[k+2]=clamp255(255*g);d[k+3]=clamp255(255*(.5+.35*(a-.5)+.25*(b-.5)))}});
  // ---------- concrete panel 4m: R lum, G stain, A height ----------
  TX.concrete=dataTex(N,(d,N)=>{const n1=fbmSet(8,6,101),n2=fbmSet(4,4,102),r=mkRand(41);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=x/N,v=y/N;const a=pfbm(n1,8,u,v,6);const st=pfbm(n2,4,u*1,v*.15,4);const s=r();
      const pore=s<.025?1:0;const k=(y*N+x)*4;d[k]=clamp255(255*(.5+.3*(a-.5)-pore*.25));d[k+1]=clamp255(255*st);d[k+2]=0;d[k+3]=clamp255(255*(.5+.3*(a-.5)-pore*.4))}});
  // ---------- bitumen roof 4m ----------
  TX.roof=dataTex(N,(d,N)=>{const n1=fbmSet(8,5,111),r=mkRand(43);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const a=pfbm(n1,8,x/N,y/N,5),s=r();const seam=((y%128)<3)?1:0;let g=.20+.1*a+(s<.1?.05:0)+seam*.05;
      const k=(y*N+x)*4;d[k]=d[k+1]=clamp255(g*255);d[k+2]=clamp255(g*255*1.05);d[k+3]=clamp255(255*(.5+.3*a+seam*.3))}});
  // ---------- granite (stairs, pedestals) 2m ----------
  TX.granite=dataTex(N,(d,N)=>{const n1=fbmSet(16,4,121),r=mkRand(47);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const a=pfbm(n1,16,x/N,y/N,4),s=r();let g=.52+.12*(a-.5)+(s<.18?-.12:s>.9?.12:0);
      const k=(y*N+x)*4;d[k]=clamp255(g*255*1.03);d[k+1]=clamp255(g*255);d[k+2]=clamp255(g*255*.97);d[k+3]=clamp255(255*(.5+.2*a))}});
  // ---------- marble 4m (white with veins) ----------
  TX.marble=dataTex(N,(d,N)=>{const n1=fbmSet(4,6,131);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=x/N,v=y/N;const a=pfbm(n1,4,u,v,6);const vein=Math.pow(1-Math.abs(Math.sin((u*3+v*2+a*4)*3.1416)),18);
      const g=.88-.08*a-.35*vein;const k=(y*N+x)*4;d[k]=clamp255(g*255*1.01);d[k+1]=clamp255(g*255*.99);d[k+2]=clamp255(g*255*.96);d[k+3]=200}});
  // ---------- parquet 2m ----------
  TX.wood=dataTex(N,(d,N)=>{const n1=fbmSet(4,4,141),r=mkRand(53);const pl=[];for(let i=0;i<256;i++)pl.push(r());
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const bx=(x/64)|0,by=(y/64)|0;const her=(bx+by)%2;const f=her?(x%64)/64:(y%64)/64;const p=pl[(bx*7+by*13+((her?(y/16):(x/16))|0))%256];
      const a=pfbm(n1,4,her?x/N*8:x/N,her?y/N:y/N*8,4);const g=.38+.12*p+.08*a+.04*Math.sin(f*40+a*10);const e=(her?(y%16):(x%16))<1?.6:1;
      const k=(y*N+x)*4;d[k]=clamp255(g*255*1.35*e);d[k+1]=clamp255(g*255*.92*e);d[k+2]=clamp255(g*255*.55*e);d[k+3]=180}});
  // ---------- bark 256 ----------
  TX.bark=dataTex(256,(d,N)=>{const n1=fbmSet(4,5,151);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const a=pfbm(n1,4,x/N*4,y/N*.5,5);const s=Math.abs(Math.sin((x/N*14+a*3)*3.1416));const g=.18+.16*a+.1*s;
      const k=(y*N+x)*4;d[k]=clamp255(g*255*1.1);d[k+1]=clamp255(g*255);d[k+2]=clamp255(g*255*.85);d[k+3]=clamp255(255*(.3+.6*s))}});
  // ---------- leaves atlas 2x2 (alpha): two broadleaf clusters, two conifer sprays ----------
  {
    const N2=512,H2=256,cv=document.createElement('canvas');cv.width=cv.height=N2;const x=cv.getContext('2d');const r=mkRand(61);
    x.clearRect(0,0,N2,N2);
    for(let t=0;t<2;t++){const ox=t*H2,oy=0;x.save();x.beginPath();x.rect(ox,oy,H2,H2);x.clip();
      // twigs
      x.strokeStyle='rgba(70,52,34,.9)';x.lineWidth=2;for(let k=0;k<7;k++){x.beginPath();x.moveTo(ox+H2/2,oy+H2*.95);const a=-Math.PI/2+(r()-.5)*1.8;x.lineTo(ox+H2/2+Math.cos(a)*H2*.42,oy+H2*.95+Math.sin(a)*H2*.75);x.stroke()}
      for(let i=0;i<420;i++){const a=r()*6.283,rad=Math.pow(r(),.7)*H2*.44;const px=ox+H2/2+Math.cos(a)*rad,py=oy+H2*.5+Math.sin(a)*rad*.85;
        const sh=r()*.7+(py-oy<H2*.45?.3:0);x.fillStyle=`hsl(${84+r()*26},${42+r()*20}%,${(18+sh*30)|0}%)`;
        x.save();x.translate(px,py);x.rotate(r()*6.283);const L=7+r()*6,W2=3.4+r()*2.4;x.beginPath();x.moveTo(-L,0);x.quadraticCurveTo(0,-W2*1.4,L,0);x.quadraticCurveTo(0,W2*1.4,-L,0);x.fill();x.restore()}
      x.restore()}
    for(let t=0;t<2;t++){const ox=t*H2,oy=H2;x.save();x.beginPath();x.rect(ox,oy,H2,H2);x.clip();
      for(let b=0;b<9;b++){const bx=ox+H2*(.1+.8*r()),by=oy+H2*(.15+.7*r()),a=(r()-.5)*.8,len=H2*(.25+.25*r());
        x.strokeStyle='rgba(60,46,30,.9)';x.lineWidth=2;x.beginPath();x.moveTo(bx,by);x.lineTo(bx+Math.cos(a)*len,by+Math.sin(a)*len);x.stroke();
        for(let n=0;n<70;n++){const t2=r(),px=bx+Math.cos(a)*len*t2,py=by+Math.sin(a)*len*t2;const s2=(r()<.5?1:-1);x.strokeStyle=`hsl(${120+r()*30},${30+r()*20}%,${(14+r()*16)|0}%)`;x.lineWidth=1.6;
          x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a+s2*1.0)*9,py+Math.sin(a+s2*1.0)*9);x.stroke()}}
      x.restore()}
    const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;TX.leaves=t;
  }
}
// ---------- sign atlas (text boards) ----------
const SIGNS=['ПРОДУКТИ','СУПЕРМАРКЕТ','АПТЕКА','КАФЕ','РЕСТОРАН','БАР','ПЕРУКАРНЯ','ЗООМАГАЗИН','ХЛІБ','КВІТИ','ОДЯГ','БАНК','ПОШТА','ШАУРМА','АВТОМИЙКА','ШИНОМОНТАЖ','ОБМІН ВАЛЮТ','СТОМАТОЛОГІЯ','МЕДЦЕНТР','ГОСПТОВАРИ','ОПТИКА',"ЗВ'ЯЗОК",'КНИГИ','КАВА','М\'ЯСО','ОВОЧІ ФРУКТИ','КОСМЕТИКА','МІНІ МАРКЕТ','ЮВЕЛІР','ІГРАШКИ','ЛОМБАРД','ПІЦА','СПОРТ','МАГАЗИН','ПРОДУКТИ 24','КУРКА ГРИЛЬ','ХВИЛИНКА','ПИВО','СУВЕНІРИ','ТРАТТОРІЯ'];
const SIGN_STYLE=[['#1b5e3b','#fff'],['#c62828','#fff'],['#ffffff','#1a8d3a'],['#5a3420','#f4d9a4'],['#2a1a12','#f2c14e'],['#151515','#e8c45a'],['#7a3b8f','#fff'],['#f08a24','#fff'],['#c98a2c','#fff'],['#b0255a','#fff'],['#304b6b','#fff'],['#0d47a1','#fff'],['#f2c21b','#123c70'],['#e2b33c','#5a1e12'],['#6a3fb0','#ffb03a'],['#333','#ffcc33'],['#123c70','#ffd34a'],['#ffffff','#1e6bb8'],['#1565c0','#fff'],['#4a6b2a','#fff'],['#1f3a5f','#fff'],['#e6312e','#fff'],['#3b2a1a','#e9d8b4'],['#3a2418','#f0d9b0'],['#8d1c1c','#fff'],['#2f7d32','#fff'],['#d94f8a','#fff'],['#0f5e6e','#fff'],['#1d1d2b','#e0c46c'],['#f2c14e','#1d3b44'],['#151515','#e8c45a'],['#c0392b','#fff'],['#0b6e4f','#fff'],['#2a6f97','#fff'],['#1b5e3b','#ffd34a'],['#f4c430','#b3261e'],['#e8452f','#fff'],['#7a4a12','#ffe08a'],['#1f6f8b','#fff'],['#3a1f14','#f3dcb0']];
const SIGN_ROWS=20;
function genSignAtlas(){
  const W=1024,H=SIGN_ROWS*64,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  const cw=W/2,chh=64;
  SIGNS.forEach((s,i)=>{const cx=(i%2)*cw,cy=((i/2)|0)*chh;const [bg,fg]=SIGN_STYLE[i%SIGN_STYLE.length];
    x.fillStyle=bg;x.fillRect(cx+2,cy+2,cw-4,chh-4);x.strokeStyle=bg==='#ffffff'?'rgba(0,0,0,.2)':'rgba(255,255,255,.35)';x.lineWidth=2;x.strokeRect(cx+5,cy+5,cw-10,chh-10);
    if(i===2){x.fillStyle='#1a8d3a';const px=cx+34,py=cy+chh/2;x.fillRect(px-7,py-20,14,40);x.fillRect(px-20,py-7,40,14)}
    x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';let fs=44;x.font=`800 ${fs}px "Golos Text",Arial,sans-serif`;
    while(x.measureText(s).width>cw-90&&fs>16){fs-=2;x.font=`800 ${fs}px "Golos Text",Arial,sans-serif`}
    x.fillText(s,cx+cw/2,cy+chh/2+2)});
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;t.generateMipmaps=true;TX.signs=t;
}
function signUV(i){i=i%SIGNS.length;const cx=(i%2)*.5,cy=((i/2)|0)/SIGN_ROWS;return [cx,1-cy-1/SIGN_ROWS,cx+.5,1-cy]} // u0,v0,u1,v1
