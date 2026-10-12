// ===================== trams on the real OSM tram lines (ride one: E at a stop) =====================
const TRAMS=[];const TRAM_LINES=[];
const RIDE={on:false,tram:null,t:0};
function tramMesh(){const g=new THREE.Group();
  const M=(c,r,m)=>{const x=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m||0});x.color.convertSRGBToLinear();return x};
  const red=M(0xc8302a,.45,.2),cream=M(0xf1d36b,.45,.1),roof=M(0x8d9296,.5,.4),glass=M(0x1a2630,.08,.3),dark=M(0x26282b,.7),grey=M(0x5d6166,.6,.3);
  const L=15,W=2.5;
  const add=(geo,m,x,y,z)=>{const me=new THREE.Mesh(geo,m);me.position.set(x,y,z);me.castShadow=true;me.receiveShadow=true;g.add(me);return me};
  add(rbox(W,1.15,L,.25),red,0,.95,0);                       // lower body
  add(rbox(W-.02,1.25,L-.2,.3),cream,0,2.15,0);               // upper body
  add(new THREE.BoxGeometry(W+.01,.86,L-1.6),glass,0,2.2,0);   // side windows band
  for(let i=-6;i<=6;i++)add(new THREE.BoxGeometry(W+.03,.86,.1),cream,0,2.2,i*1.1);
  for(const s of [-1,1]){add(rbox(W-.25,.95,.3,.12),glass,0,2.25,s*(L/2-.05));add(new THREE.BoxGeometry(1.6,.28,.06),dark,0,2.92,s*(L/2+.03))}
  add(rbox(W-.3,.3,L-.8,.15),roof,0,2.88,0);
  // doors (right side), skirts, bogies
  for(const z of [-5,0,5])add(new THREE.BoxGeometry(.04,2.0,1.2),dark,W/2+.01,1.55,z);
  add(new THREE.BoxGeometry(W-.3,.35,L-3),dark,0,.32,0);
  for(const z of [-4.5,4.5])add(new THREE.BoxGeometry(2.2,.5,2.6),grey,0,.35,z);
  // pantograph
  const p=new THREE.Group();p.position.set(0,3.05,.5);g.add(p);
  const a1=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,1.5),grey);a1.position.set(0,.35,-.4);a1.rotation.x=.55;p.add(a1);
  const a2=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,1.5),grey);a2.position.set(0,.95,.25);a2.rotation.x=-.75;p.add(a2);
  const shoe=new THREE.Mesh(new THREE.BoxGeometry(1.3,.06,.12),grey);shoe.position.set(0,1.4,.6);p.add(shoe);
  // route boards
  for(const s of [-1,1]){const cv=txtCanvas(['ТРАМВАЙ'],{w:256,h:64,size:40,color:'#ffd34a',bg:'#111'});const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.36),new THREE.MeshBasicMaterial({map:t,toneMapped:false}));m.position.set(0,2.92,s*(L/2+.07));m.rotation.y=s>0?0:Math.PI;g.add(m)}
  g.userData.L=L;return g}
// walk the tram network from a start ref, preferring straight continuations
function tramWalk(i0,dir,maxL){const R=D.rnodes,rn=D.rn,rs=D.rstart;const pts=[];let i=i0,d=dir,L=0;const seen=new Set();
  const wayOf=i=>D.rOf[i];const P=i=>[R[rn[i]*2],R[rn[i]*2+1]];
  pts.push(P(i));let hx=0,hz=0;
  for(let guard=0;guard<20000&&L<maxL;guard++){const k=wayOf(i);let j=i+d;
    if(j<rs[k]||j>=rs[k+1]){ // end of way: find continuation at this node
      const node=rn[i];let best=null,bs=.3;
      for(let a=D.rAdjS[node];a<D.rAdjS[node+1];a++){const r=D.rAdj[a];if(r===i)continue;const k2=wayOf(r);if(D.rkind[k2]!==0)continue;
        for(const dd of [1,-1]){const n=r+dd;if(n<rs[k2]||n>=rs[k2+1])continue;if(seen.has(k2*2+(dd>0?1:0)))continue;const [x0,z0]=P(r),[x1,z1]=P(n);const l=Math.hypot(x1-x0,z1-z0)||1;const sc=((x1-x0)*hx+(z1-z0)*hz)/l;if(sc>bs){bs=sc;best=[r,dd]}}}
      if(!best)break;i=best[0];d=best[1];seen.add(wayOf(i)*2+(d>0?1:0));j=i+d}
    const [x0,z0]=P(i),[x1,z1]=P(j);const l=Math.hypot(x1-x0,z1-z0);if(l>.01){hx=(x1-x0)/l;hz=(z1-z0)/l;L+=l;pts.push([x1,z1])}i=j}
  return pts}
function buildTramLine(x,z){
  const R=D.rnodes,rn=D.rn;let bi=-1,bd=1e18;
  for(let k=0;k<HDR.nRWays;k++){if(D.rkind[k]!==0)continue;for(let i=D.rstart[k];i<D.rstart[k+1];i++){const dx=R[rn[i]*2]-x,dz=R[rn[i]*2+1]-z;const d=dx*dx+dz*dz;if(d<bd){bd=d;bi=i}}}
  if(bi<0||bd>400*400)return null;
  const k=D.rOf[bi];const canF=bi+1<D.rstart[k+1];
  const a=tramWalk(bi,canF?1:-1,6000),b=tramWalk(bi,canF?-1:1,6000);
  const pts=b.reverse().concat(a.slice(1));
  // resample to ~4 m spacing, with cumulative distance
  const out=[pts[0]];const cum=[0];
  for(let i=1;i<pts.length;i++){const [x0,z0]=out[out.length-1],[x1,z1]=pts[i];const l=Math.hypot(x1-x0,z1-z0);if(l<3.5&&i<pts.length-1)continue;out.push([x1,z1]);cum.push(cum[cum.length-1]+l)}
  const line={pts:out,cum,L:cum[cum.length-1],stops:[]};if(line.L<300)return null;
  // stops: OSM tram stops near the line, else every ~450 m
  for(let id=0;id<NCX*NCZ;id++){if(D.ftab[id]===D.ftab[id+1])continue;const [ox,oz]=chunkOrigin(id);if(ox<x-7000||ox>x+7000||oz<z-7000||oz>z+7000)continue;
    for(let f=D.ftab[id];f<D.ftab[id+1];f++){if(D.fk[f]!==4)continue;const fx=ox+D.fx[f]*.01,fz=oz+D.fz[f]*.01;const s=tramProject(line,fx,fz);if(s&&s[1]<22&&s[0]>30&&s[0]<line.L-30)line.stops.push(s[0])}}
  line.stops.sort((p,q)=>p-q);const st=[];for(const s of line.stops)if(!st.length||s-st[st.length-1]>380)st.push(s);
  if(st.length<3){st.length=0;for(let s=200;s<line.L-60;s+=450)st.push(s)}
  line.stops=st;buildLanes(line);return line}
// nearest tram-rail segment to (x,z) (any tram way), returns [px,pz,dirx,dirz,dist,way]
function tramRailNear(x,z,maxd,skipWay){const R=D.rnodes,rn=D.rn;let best=null;const ci=Math.floor((x-BB[0])/CH),cj=Math.floor((z-BB[2])/CH);
  for(let j=cj-1;j<=cj+1;j++)for(let i=ci-1;i<=ci+1;i++){if(i<0||j<0||i>=NCX||j>=NCZ)continue;const c=j*NCX+i;
    for(let q=D.rSegStart[c];q<D.rSegStart[c+1];q++){const k=D.rSeg[q];const w=D.rOf[k];if(D.rkind[w]!==0||w===skipWay)continue;const a=rn[k]*2,b=rn[k+1]*2;const ax=R[a],az=R[a+1],dx=R[b]-ax,dz=R[b+1]-az;const L2=dx*dx+dz*dz;if(L2<1e-4)continue;
      let t=((x-ax)*dx+(z-az)*dz)/L2;t=t<0?0:t>1?1:t;const px=ax+dx*t,pz=az+dz*t;const d=Math.hypot(px-x,pz-z);if(d<maxd&&(!best||d<best[4])){const l=Math.sqrt(L2);best=[px,pz,dx/l,dz/l,d,w]}}}return best}
// two lanes: trams going +s use one track, trams going -s the other (right-hand traffic). Uses the second OSM track when it exists.
function buildLanes(line){const P=line.pts,n=P.length;const right=new Array(n),left=new Array(n);let nR=0,nL=0;
  for(let i=0;i<n;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(n-1,i+1)];let tx=b[0]-a[0],tz=b[1]-a[1];const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;
    const rx=-tz,rz=tx;   // right of +s direction
    const own=tramRailNear(P[i][0],P[i][1],1.2,-1);const ownWay=own?own[5]:-1;
    for(const sd of [1,-1]){const q=tramRailNear(P[i][0]+rx*sd*3.4,P[i][1]+rz*sd*3.4,1.9,ownWay);
      if(q&&Math.abs(q[2]*tx+q[3]*tz)>.85){const off=(q[0]-P[i][0])*rx+(q[1]-P[i][1])*rz;if(sd>0&&off>1.8){right[i]=[q[0],q[1]];nR++}if(sd<0&&off<-1.8){left[i]=[q[0],q[1]];nL++}}}}
  // which side is the second track on? fill gaps with a 1.8 m offset to that side
  const side=nR>=nL?1:-1;const other=side>0?right:left;const off=(i)=>{const a=P[Math.max(0,i-1)],b=P[Math.min(n-1,i+1)];let tx=b[0]-a[0],tz=b[1]-a[1];const l=Math.hypot(tx,tz)||1;return [-tz/l,tx/l]};
  const lane2=P.map((p,i)=>{if(other[i])return other[i];const [rx,rz]=off(i);return [p[0]+rx*side*3.5,p[1]+rz*side*3.5]});
  // smooth the second lane a little (gaps vs found points)
  for(let it=0;it<2;it++)for(let i=1;i<n-1;i++){if(other[i])continue;lane2[i]=[(lane2[i-1][0]+lane2[i][0]*2+lane2[i+1][0])/4,(lane2[i-1][1]+lane2[i][1]*2+lane2[i+1][1])/4]}
  // right-hand traffic: the track on the right of +s carries the +s trams
  line.lane={};if(side>0){line.lane[1]=lane2;line.lane[-1]=P}else{line.lane[1]=P;line.lane[-1]=lane2}}
function tramProject(line,x,z){let best=null;const P=line.pts;for(let i=0;i<P.length-1;i++){const ax=P[i][0],az=P[i][1],dx=P[i+1][0]-ax,dz=P[i+1][1]-az;const L2=dx*dx+dz*dz;if(L2<1e-6)continue;let t=((x-ax)*dx+(z-az)*dz)/L2;t=t<0?0:t>1?1:t;
  const d=Math.hypot(ax+dx*t-x,az+dz*t-z);if(!best||d<best[1])best=[line.cum[i]+Math.sqrt(L2)*t,d]}return best}
function tramAt(line,s,dir){s=Math.max(0,Math.min(line.L,s));const C=line.cum;let lo=0,hi=C.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(C[m]<=s)lo=m;else hi=m}
  const PT=(dir&&line.lane)?line.lane[dir]:line.pts;const a=PT[lo],b=PT[Math.min(hi,PT.length-1)];const l=(C[hi]-C[lo])||1;const t=(s-C[lo])/l;return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]}
function railY(x,z){const id=chunkIdAt(x,z);return groundH(x,z)+(id>=0&&nearRoad(id,x,z,0)?.13:0)}
function initTrams(){
  const line=buildTramLine(70,95);if(!line)return;TRAM_LINES.push(line);
  // spawn: one waiting at the stop nearest to the home, others spread along the line
  const hs=tramProject(line,70,95)[0];let s0=line.stops.reduce((a,b)=>Math.abs(b-hs)<Math.abs(a-hs)?b:a,line.stops[0]);
  const starts=[[s0,1,8],[Math.min(line.L-40,s0+900),-1,0],[Math.max(40,s0-1500),1,0],[Math.min(line.L-40,s0+2600),1,0],[Math.max(40,s0-700),-1,0]];
  for(const [s,dir,wait] of starts){const m=tramMesh();m.traverse(o=>{if(o.isMesh)o.matrixAutoUpdate=true});scene.add(m);TRAMS.push({line,s,dir,v:0,wait,mesh:m,x:0,z:0,y:0,yaw:0,nextStop:null})}
  for(const t of TRAMS)placeTram(t);
  INTERACT.push({x:0,z:0,r:1e9,label:'Board the tram',cond:()=>{if(RIDE.on||DRIVE.on||PORTAL.cur||player.sit)return false;for(const t of TRAMS){if(t.v>.4)continue;const dx=player.x-t.x,dz=player.z-t.z;const fx=Math.sin(t.yaw),fz=Math.cos(t.yaw);const a=dx*fx+dz*fz,b=dx*fz-dz*fx;if(Math.abs(a)<7.8&&Math.abs(b)<3.6){tramNear=t;return true}}return false},fn:()=>boardTram(tramNear)});
}
let tramNear=null;
function placeTram(t){const L=t.line,h=7;const a=tramAt(L,t.s-h,t.dir),b=tramAt(L,t.s+h,t.dir);const c=tramAt(L,t.s,t.dir);
  t.x=c[0];t.z=c[1];t.yaw=Math.atan2(b[0]-a[0],b[1]-a[1])+(t.dir<0?Math.PI:0);const ya=railY(a[0],a[1]),yb=railY(b[0],b[1]);t.y=(ya+yb)/2;
  const pitch=Math.atan2(yb-ya,Math.hypot(b[0]-a[0],b[1]-a[1]))*(t.dir<0?-1:1);
  t.mesh.position.set(t.x,t.y+.08,t.z);t.mesh.rotation.set(0,0,0);t.mesh.rotation.order='YXZ';t.mesh.rotation.y=t.yaw;t.mesh.rotation.x=-pitch}
function updateTrams(dt){
  for(const t of TRAMS){const L=t.line;
    if(t.wait>0){t.wait-=dt;t.v=0;if(t.wait<=0){t.nextStop=null}placeTram(t);continue}
    // next stop ahead
    if(t.nextStop===null){let ns=null;for(const s of L.stops){if(t.dir>0&&s>t.s+3&&(ns===null||s<ns))ns=s;if(t.dir<0&&s<t.s-3&&(ns===null||s>ns))ns=s}t.nextStop=ns===null?(t.dir>0?L.L-12:12):ns}
    const dist=(t.nextStop-t.s)*t.dir;
    // keep distance to the player standing on the track and to other trams
    let block=99;const fx=Math.sin(t.yaw),fz=Math.cos(t.yaw);
    if(!RIDE.on||RIDE.tram!==t){const dx=player.x-t.x,dz=player.z-t.z;const a=dx*fx+dz*fz,b=Math.abs(dx*fz-dz*fx);if(a>0&&b<1.8)block=Math.min(block,a-8.5)}
    for(const o of TRAMS){if(o===t||o.line!==L)continue;const ahead=(o.s-t.s)*t.dir;if(ahead>0&&o.dir===t.dir)block=Math.min(block,ahead-20)}
    const target=Math.min(15,Math.sqrt(Math.max(0,2*1.6*Math.max(0,Math.min(dist,block)-.5))));
    t.v+=Math.max(-2.6*dt,Math.min(1.5*dt,target-t.v));if(t.v<0)t.v=0;
    t.s+=t.v*dt*t.dir;
    if(dist<.8&&t.v<.3){t.s=t.nextStop;t.v=0;
      if(t.nextStop<=12||t.nextStop>=L.L-12){t.dir=-t.dir;t.wait=9}else t.wait=6;
      if(RIDE.on&&RIDE.tram===t)toast('Tram stop','E — get off the tram');
      if(Math.hypot(t.x-player.x,t.z-player.z)<60&&window.AUD)AUD.tone(880,880,.18,.05,'sine')}
    placeTram(t)}
  if(RIDE.on){const t=RIDE.tram;
    if(t.kind==='cable'){player.x=t.x+.15;player.z=t.z+.78;player.y=t.y+.12;player.yaw=Math.PI;player.vx=player.vz=0;
      PLR.root.position.set(player.x,player.y,player.z);PLR.root.rotation.y=player.yaw;animPlayer(PLR,{spd:0,mode:'sit'},dt)}
    else{const fx=Math.sin(t.yaw),fz=Math.cos(t.yaw);player.x=t.x-fx*2.2+fz*.3;player.z=t.z-fz*2.2-fx*.3;player.y=t.y+.55;player.yaw=t.yaw+Math.PI/2;
    PLR.root.position.set(player.x,player.y,player.z);PLR.root.rotation.y=player.yaw;animPlayer(PLR,{spd:0,mode:'walk'},dt)}}
}
function boardTram(t){if(!t)return;RIDE.on=true;RIDE.tram=t;player.vx=player.vz=0;player.scoot=false;$('bScoot').classList.remove('on');cam.init=false;toast('You\'re on the tram','let\'s go! At a stop press E to get off');if(window.AUD)AUD.beep()}
function leaveTram(){const t=RIDE.tram;if(!t)return;if(t.kind==='cable')return cableLeave(t);if(t.v>.4){toast('Wait for the stop','the tram is moving');return}
  RIDE.on=false;RIDE.tram=null;const fx=Math.sin(t.yaw),fz=Math.cos(t.yaw);
  for(const side of [1,-1])for(const off of [0,-4,4]){const x=t.x+fz*side*2.9+fx*off,z=t.z-fx*side*2.9+fz*off;if(!insideAny(x,z,.35,t.y+.5)){player.x=x;player.z=z;player.y=groundAt(x,z,t.y+1);player.vx=player.vz=0;cam.init=false;return}}
  player.x=t.x+fz*3;player.z=t.z-fx*3;player.y=groundAt(player.x,player.z,t.y+1)}
function stepTramCamera(dt){const t=RIDE.tram;const tx=t.x,ty=t.y+(t.camH||2.4),tz=t.z;
  if(!inp.dragging&&!TOUCH_LOOK.active&&t.kind!=='cable'){let tgt=t.yaw+(t.dir>0?0:0);let dy=tgt-cam.yaw;while(dy>Math.PI)dy-=6.283;while(dy<-Math.PI)dy+=6.283;cam.yaw+=dy*Math.min(1,dt*.9)}
  const dist=t.camDist||Math.max(13,cam.dist*2.2);const pitch=Math.max(.18,cam.pitch);const cp=Math.cos(pitch),sp=Math.sin(pitch);const dx=-Math.sin(cam.yaw)*cp,dy2=sp,dz=-Math.cos(cam.yaw)*cp;
  let d=dist;for(let s=4;s<=dist;s+=.5){const px=tx+dx*s,py=ty+dy2*s,pz=tz+dz*s;if(insideAny(px,pz,.25,py)||py<groundAt(px,pz,py)+.3){d=Math.max(4,s-.5);break}}
  const wx=tx+dx*d,wy=ty+dy2*d,wz=tz+dz*d;if(!cam.init){cam.x=wx;cam.y=wy;cam.z=wz;cam.init=true}
  const k=Math.min(1,dt*6);cam.x+=(wx-cam.x)*k;cam.y+=(wy-cam.y)*k;cam.z+=(wz-cam.z)*k;camera.position.set(cam.x,cam.y,cam.z);camera.lookAt(tx,ty,tz)}
