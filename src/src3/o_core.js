// ===================== data =====================
const HDR=JSON.parse(document.getElementById('odhdr').textContent);
const BB=HDR.BB, CH=HDR.CH, NCX=HDR.NCX, NCZ=HDR.NCZ;
const D={};
const SL=-28.5;
const HW=[5.0,3.5,2.6,1.4], SW=[3.2,2.6,0.9,0];
const HIST=0,MOLD=1,KHRU=2,PANEL=3,TOWER=4,BRICK=5,HOUSE=6,INDUST=7,SHOP=8;

async function inflate(bin){
  if(window.DecompressionStream){
    try{const s=new Blob([bin]).stream().pipeThrough(new DecompressionStream('deflate'));return new Uint8Array(await new Response(s).arrayBuffer())}catch(e){}
  }
  await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)});
  return pako.inflate(bin);
}
async function decodeData(){
  const b64=document.getElementById('oddata').textContent.trim();
  const bs=atob(b64);const bin=new Uint8Array(bs.length);for(let i=0;i<bs.length;i++)bin[i]=bs.charCodeAt(i);
  const raw=await inflate(bin);
  let o=0;const T={'<f4':Float32Array,'<u4':Uint32Array,'|u1':Uint8Array,'|i1':Int8Array,'<i2':Int16Array,'<u2':Uint16Array,'<i4':Int32Array};
  for(const [name,dt,n] of HDR.arrays){const C=T[dt];const by=n*C.BYTES_PER_ELEMENT;D[name]=new C(raw.buffer.slice(raw.byteOffset+o,raw.byteOffset+o+by));o+=by}
  const [tw,th]=HDR.ter;D.tw=tw;D.th=th;
  // building vertex/ring prefix sums
  const nb=HDR.nB;D.bRing0=new Uint32Array(nb+1);D.rV0=new Uint32Array(HDR.nBR+1);
  let r=0;for(let k=0;k<nb;k++){D.bRing0[k]=r;r+=D.bnr[k]}D.bRing0[nb]=r;
  let v=0;for(let k=0;k<HDR.nBR;k++){D.rV0[k]=v;v+=D.brl[k]}D.rV0[HDR.nBR]=v;
  prepRoads();prepRails();
}
// ---------- road topology
function prepRoads(){
  const nN=HDR.nNodes,nW=HDR.nWays,ws=D.wstart,wn=D.wn,P=D.nodes;
  const deg=new Uint8Array(nN);
  for(let k=0;k<nW;k++){const a=ws[k],b=ws[k+1]-1;deg[wn[a]]+=1;deg[wn[b]]+=1;for(let i=a+1;i<b;i++)deg[wn[i]]=Math.min(255,deg[wn[i]]+2)}
  D.deg=deg;
  // cumulative distance and distance to nearest junction along way
  const cum=new Float32Array(wn.length),dPrev=new Float32Array(wn.length),dNext=new Float32Array(wn.length);
  for(let k=0;k<nW;k++){
    const a=ws[k],b=ws[k+1];cum[a]=0;
    for(let i=a+1;i<b;i++){const p=wn[i-1]*2,q=wn[i]*2;cum[i]=cum[i-1]+Math.hypot(P[q]-P[p],P[q+1]-P[p+1])}
    let last=-1e9;
    for(let i=a;i<b;i++){if(deg[wn[i]]>=3)last=cum[i];dPrev[i]=Math.min(999,cum[i]-last)}
    last=1e9;
    for(let i=b-1;i>=a;i--){if(deg[wn[i]]>=3)last=cum[i];dNext[i]=Math.min(999,last-cum[i])}
  }
  D.cum=cum;D.dPrev=dPrev;D.dNext=dNext;
  // segments bucketed by chunk (CSR)
  const cnt=new Uint32Array(NCX*NCZ+1);
  const cidOf=(x,z)=>{const i=Math.floor((x-BB[0])/CH),j=Math.floor((z-BB[2])/CH);if(i<0||j<0||i>=NCX||j>=NCZ)return -1;return j*NCX+i};
  const segC=[];
  for(let k=0;k<nW;k++){for(let i=ws[k];i<ws[k+1]-1;i++){const p=wn[i]*2,q=wn[i+1]*2;const c=cidOf((P[p]+P[q])/2,(P[p+1]+P[q+1])/2);segC.push(c);if(c>=0)cnt[c+1]++}}
  for(let c=0;c<NCX*NCZ;c++)cnt[c+1]+=cnt[c];
  const fill=cnt.slice(),seg=new Uint32Array(cnt[NCX*NCZ]);let s=0;
  for(let k=0;k<nW;k++){for(let i=ws[k];i<ws[k+1]-1;i++){const c=segC[s++];if(c>=0)seg[fill[c]++]=i}}
  D.segStart=cnt;D.seg=seg;
  const wOf=new Uint32Array(wn.length);for(let k=0;k<nW;k++)for(let i=ws[k];i<ws[k+1];i++)wOf[i]=k;D.wOf=wOf;
  // node -> refs adjacency (CSR)
  const ac=new Uint32Array(nN+1);for(let i=0;i<wn.length;i++)ac[wn[i]+1]++;for(let i=0;i<nN;i++)ac[i+1]+=ac[i];
  const af=ac.slice(),adj=new Uint32Array(wn.length);for(let i=0;i<wn.length;i++)adj[af[wn[i]]++]=i;
  D.adjS=ac;D.adj=adj;
}
// ---------- terrain height (real SRTM relief + coastline from OSM)
function sdAt(x,z){
  let gx=(x-BB[0])/20-.5,gz=(z-BB[2])/20-.5;
  gx=Math.max(0,Math.min(D.tw-1.001,gx));gz=Math.max(0,Math.min(D.th-1.001,gz));
  const i=gx|0,j=gz|0,fx=gx-i,fz=gz-j,w=D.tw,T=D.ter;
  const a=T[j*w+i],b=T[j*w+i+1],c=T[(j+1)*w+i],d=T[(j+1)*w+i+1];
  return 2*((a*(1-fx)+b*fx)*(1-fz)+(c*(1-fx)+d*fx)*fz);
}
function demAt(x,z){
  let gx=(x-BB[0])/20-.5,gz=(z-BB[2])/20-.5;
  gx=Math.max(0,Math.min(D.tw-1.001,gx));gz=Math.max(0,Math.min(D.th-1.001,gz));
  const i=gx|0,j=gz|0,w=D.tw,T=D.dem;let fx=gx-i,fz=gz-j;fx=fx*fx*(3-2*fx)*.35+fx*.65;fz=fz*fz*(3-2*fz)*.35+fz*.65;
  const a=T[j*w+i],b=T[j*w+i+1],c=T[(j+1)*w+i],d=T[(j+1)*w+i+1];
  return .25*((a*(1-fx)+b*fx)*(1-fz)+(c*(1-fx)+d*fx)*fz);
}
function coastH(sd){
  if(sd<0)return SL+.25+Math.max(sd*.08,-14);
  return SL+.25+1.25*Math.min(sd,45)/45;
}
let FLAT=[];
function rawH(x,z){
  const sd=sdAt(x,z);const beach=coastH(sd);if(sd<45)return beach;
  const land=SL+Math.max(1.5,demAt(x,z));let t=(sd-45)/70;t=t>1?1:t*t*(3-2*t);
  return beach+(Math.max(land,beach)-beach)*t;
}
function groundH(x,z){let h=rawH(x,z);
  for(let i=0;i<FLAT.length;i++){const f=FLAT[i];const dx=x-f.x,dz=z-f.z;if(dx>f.R||dx<-f.R||dz>f.R||dz<-f.R)continue;
    if(f.ramp){const u=dx*f.tx+dz*f.tz,v=Math.abs(-dx*f.tz+dz*f.tx);const du=u<0?-u:(u>f.L?u-f.L:0),dv=Math.max(0,v-f.hw);const d=Math.hypot(du,dv);if(d>=f.b)continue;
      const hr=f.h0+(f.h1-f.h0)*Math.min(1,Math.max(0,u/f.L));if(f.cut&&h<hr)continue;let t=d/f.b;t=t*t*(3-2*t);h=hr+(h-hr)*t;continue}
    let d;if(f.u){const u=Math.abs(dx*f.ca+dz*f.sa)-f.u,v=Math.abs(-dx*f.sa+dz*f.ca)-f.v;d=Math.hypot(Math.max(u,0),Math.max(v,0));}else{d=Math.max(0,Math.sqrt(dx*dx+dz*dz)-f.r)}
    if(d>=f.b)continue;let t=d/f.b;t=t*t*(3-2*t);h=f.h+(h-f.h)*t}
  return h}
function addFlat(x,z,r,b,h){FLAT.push({x,z,r,b,R:r+b,h:h===undefined?rawH(x,z):h})}
function addRamp(x0,z0,x1,z1,hw,b,h0,h1,cut){const L=Math.hypot(x1-x0,z1-z0);FLAT.push({ramp:1,x:x0,z:z0,tx:(x1-x0)/L,tz:(z1-z0)/L,L,hw,b,h0,h1,cut:!!cut,R:L+hw+b})}
function addFlatRect(x,z,a,w,d,b,h){FLAT.push({x,z,u:w/2,v:d/2,ca:Math.cos(a),sa:Math.sin(a),b,R:Math.hypot(w,d)/2+b,h:h===undefined?rawH(x,z):h})}
function groundN(x,z){const e=1.5;const hx=groundH(x+e,z)-groundH(x-e,z),hz=groundH(x,z+e)-groundH(x,z-e);const l=Math.hypot(hx,2*e,hz);return [-hx/l,2*e/l,-hz/l]}
// ---------- rails network (0 tram, 1 rail, 2 funicular)
function prepRails(){
  const nW=HDR.nRWays,rs=D.rstart,rn=D.rn,P=D.rnodes;
  const cnt=new Uint32Array(NCX*NCZ+1);const segC=[];
  const cidOf=(x,z)=>{const i=Math.floor((x-BB[0])/CH),j=Math.floor((z-BB[2])/CH);if(i<0||j<0||i>=NCX||j>=NCZ)return -1;return j*NCX+i};
  for(let k=0;k<nW;k++)for(let i=rs[k];i<rs[k+1]-1;i++){const a=rn[i]*2,b=rn[i+1]*2;const c=cidOf((P[a]+P[b])/2,(P[a+1]+P[b+1])/2);segC.push(c);if(c>=0)cnt[c+1]++}
  for(let c=0;c<NCX*NCZ;c++)cnt[c+1]+=cnt[c];
  const fill=cnt.slice(),seg=new Uint32Array(cnt[NCX*NCZ]);let s=0;
  for(let k=0;k<nW;k++)for(let i=rs[k];i<rs[k+1]-1;i++){const c=segC[s++];if(c>=0)seg[fill[c]++]=i}
  D.rSegStart=cnt;D.rSeg=seg;const rOf=new Uint32Array(rn.length);for(let k=0;k<nW;k++)for(let i=rs[k];i<rs[k+1];i++)rOf[i]=k;D.rOf=rOf;
  const nN=HDR.nRNodes;const ac=new Uint32Array(nN+1);for(let i=0;i<rn.length;i++)ac[rn[i]+1]++;for(let i=0;i<nN;i++)ac[i+1]+=ac[i];
  const af=ac.slice(),adj=new Uint32Array(rn.length);for(let i=0;i<rn.length;i++)adj[af[rn[i]]++]=i;D.rAdjS=ac;D.rAdj=adj;
}
// ---------- building access
function bldRings(k,ox,oz){const out=[];const r0=D.bRing0[k],r1=D.bRing0[k+1];for(let r=r0;r<r1;r++){const v0=D.rV0[r],n=D.brl[r];const a=new Float32Array(n*2);
  for(let i=0;i<n;i++){a[i*2]=ox+D.bv[(v0+i)*2]*.1;a[i*2+1]=oz+D.bv[(v0+i)*2+1]*.1}out.push(a)}return out}
// ---------- geometry builder helper
class GB{
  constructor(attrs){this.a={};this.sz={};for(const k in attrs){this.a[k]=[];this.sz[k]=attrs[k]}this.idx=[];this.n=0}
  v(vals){for(const k in vals){const arr=this.a[k],x=vals[k];if(typeof x==='number')arr.push(x);else for(let i=0;i<x.length;i++)arr.push(x[i])}return this.n++}
  tri(a,b,c){this.idx.push(a,b,c)}
  quad(a,b,c,d){this.idx.push(a,b,c,a,c,d)}
  build(){const g=new THREE.BufferGeometry();for(const k in this.a)g.setAttribute(k,new THREE.BufferAttribute(new Float32Array(this.a[k]),this.sz[k]));
    g.setIndex(this.n>65535?new THREE.BufferAttribute(new Uint32Array(this.idx),1):new THREE.BufferAttribute(new Uint16Array(this.idx),1));g.computeBoundingSphere();return g}
}

// ---------- materials (created in initWorld)
function chunkOrigin(id){return [BB[0]+(id%NCX)*CH,BB[2]+Math.floor(id/NCX)*CH]}
function hashf(a,b){let h=(a*374761393+b*668265263)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296}
function rng(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
function insideOBB(obb,x,z,margin){
  for(let i=0;i<obb.length;i+=6){
    const dx=x-obb[i],dz=z-obb[i+1];const u=dx*obb[i+4]+dz*obb[i+5],v=-dx*obb[i+5]+dz*obb[i+4];
    if(Math.abs(u)<obb[i+2]+margin&&Math.abs(v)<obb[i+3]+margin)return true;
  }
  return false;
}
function nearRoad(id,x,z,extra){
  const P=D.nodes,wn=D.wn;const s0=D.segStart[id],s1=D.segStart[id+1];
  for(let s=s0;s<s1;s++){const i=D.seg[s],k=D.wOf[i],c=D.wcls[k];
    const a=wn[i]*2,b=wn[i+1]*2;const ax=P[a],az=P[a+1],dx=P[b]-ax,dz=P[b+1]-az;const L2=dx*dx+dz*dz;if(L2<.01)continue;
    let t=((x-ax)*dx+(z-az)*dz)/L2;t=t<0?0:t>1?1:t;const ex=ax+dx*t-x,ez=az+dz*t-z;
    const r=(D.wfl[k]===1?HW[c]+SW[c]+1.2:HW[c]+SW[c])+extra;if(ex*ex+ez*ez<r*r)return true}
  return false;
}
// tree geometry (unit) + per-chunk instancing
