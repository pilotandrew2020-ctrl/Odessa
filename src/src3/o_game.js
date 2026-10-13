// ===================== main =====================
const $=id=>document.getElementById(id);
const TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;
const S={time:'day',season:'summer',q:TOUCH?'low':'mid'};
try{const o=JSON.parse(localStorage.getItem('odesa2')||'{}');Object.assign(S,o)}catch(e){}
function saveS(){try{localStorage.setItem('odesa2',JSON.stringify(S))}catch(e){}}
let renderer,scene,camera,composer=null,bloomPass=null,fxaaPass=null,sunL,hemiL,sky,nightSky,seaMesh,pmrem,envRT=null,snowPts=null,PLR,started=false;
const chunks=new Map();
const player={x:0,z:0,y:0,vy:0,vx:0,vz:0,yaw:0,spd:0,air:false,run:false,scoot:false,sit:null};
const cam={yaw:0,pitch:.3,dist:(innerHeight>innerWidth?5.6:4.6),x:0,y:0,z:0,init:false};
const inp={k:{},jx:0,jy:0,jump:false};
const INTERACT=[];   // {x,z,y,r,label,fn}
// sit on any bench: city benches (per chunk) + the yard benches
let benchNear=null;
function nearBench(maxd){let best=null,bd=maxd;const chk=b=>{const d=Math.hypot(b.x-player.x,b.z-player.z);if(d<bd&&Math.abs(b.y-player.y)<1.2){bd=d;best=b}};
  for(const b of HOME_BENCHES)chk(b);const id0=chunkIdAt(player.x,player.z);
  if(id0>=0){const i0=id0%NCX,j0=Math.floor(id0/NCX);for(let j=j0-1;j<=j0+1;j++)for(let i=i0-1;i<=i0+1;i++){const c=chunks.get(j*NCX+i);if(c&&c.benches)for(const b of c.benches)chk(b)}}
  return best}
INTERACT.push({x:0,z:0,r:1e9,label:'Get in the car',cond:()=>!!(DRIVE.car&&!DRIVE.on&&!player.sit&&Math.hypot(DRIVE.car.x-player.x,DRIVE.car.z-player.z)<3.4),fn:toggleCar});
INTERACT.push({x:0,z:0,r:1e9,label:'Sit on the bench',cond:()=>{if(player.sit||player.scoot||(typeof DRIVE!=='undefined'&&DRIVE.on)||(curIndoor&&curIndoor.name!=='station'))return false;benchNear=nearBench(1.6);return !!benchNear},
  fn:()=>{const b=benchNear;if(!b)return;player.sit={x:b.x+Math.sin(b.ry)*.04,z:b.z+Math.cos(b.ry)*.04,y:b.y+.03,yaw:b.ry};player.vx=player.vz=0;cam.yaw=b.ry;cam.pitch=Math.max(cam.pitch,.25);toast('Taking a rest','move to stand up')}});
const DOOR_KIND={2:'pharmacy',0:'market',1:'market',27:'market',34:'market',8:'market',33:'market',25:'market'};
const DOOR_LBL={pharmacy:'Enter the pharmacy',market:'Enter the shop'};
let doorNear=null;
INTERACT.push({x:0,z:0,r:1e9,label:'Enter',cond:function(){if(PORTAL.cur||DRIVE.on||player.sit)return false;doorNear=null;let bd=1.9;for(const c of nearChunks(player.x,player.z))for(const d of c.doors){const dd=Math.hypot(d.x-player.x,d.z-player.z);if(dd<bd&&Math.abs(d.y-player.y)<1.6){bd=dd;doorNear=d}}
  if(doorNear)this.label=DOOR_LBL[DOOR_KIND[doorNear.code]];return !!doorNear},
  fn:()=>{const d=doorNear;if(!d)return;PORTAL.enter(DOOR_KIND[d.code],{x:d.x+Math.sin(d.yaw)*1.2,z:d.z+Math.cos(d.yaw)*1.2,yaw:d.yaw},{sign:d.code})}});
const INDOORS=[];    // {test(x,z,y)->bool, name, light}
let indoorAmt=0,curIndoor=null,lastDistrict='';

// ---------- presets ----------
const TOD={
  day:{el:48,az:140,sun:[1.0,.95,.86],si:2.8,sky:[.50,.62,.85],gnd:[.36,.32,.26],hi:.62,fog:[.70,.78,.88],fd:.0022,exp:.58,night:0,lbl:'Day',turb:5,ray:1.6},
  dusk:{el:4.5,az:262,sun:[1.0,.52,.26],si:2.2,sky:[.42,.40,.55],gnd:[.30,.22,.18],hi:.55,fog:[.80,.56,.44],fd:.0026,exp:.7,night:.45,lbl:'Sunset',turb:9,ray:2.6},
  night:{el:36,az:120,sun:[.55,.65,.95],si:.32,sky:[.10,.12,.22],gnd:[.09,.07,.06],hi:.55,fog:[.16,.12,.10],fd:.0036,exp:1.25,night:1,lbl:'Night',turb:1,ray:.5},
};
const QUAL={low:{pr:.8,shadow:0,bloom:false,R:380,trees:230,tdens:.6,cars:8,peds:12},mid:{pr:1,shadow:1024,sr:55,bloom:true,R:480,trees:320,tdens:1,cars:14,peds:22},high:{pr:1.5,shadow:2048,sr:85,bloom:true,R:560,trees:380,tdens:1,cars:18,peds:28}};
function Qp(){return QUAL[S.q]||QUAL.mid}

// ---------- renderer / post ----------
function setupRenderer(){
  renderer=new THREE.WebGLRenderer({canvas:$('c'),antialias:false,powerPreference:'high-performance',stencil:true,depth:true});renderer.info.autoReset=false;
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  pmrem=new THREE.PMREMGenerator(renderer);
}
let pixelScale=1;const _SL=new THREE.Vector3(),_SU=new THREE.Vector3(),_SR=new THREE.Vector3(),_SV=new THREE.Vector3(),_ST=new THREE.Vector3();
function applyQuality(){
  const q=Qp();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,q.pr)*pixelScale);
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=q.shadow>0;
  sunL.castShadow=q.shadow>0;
  if(q.shadow){sunL.shadow.mapSize.set(q.shadow,q.shadow);const c=sunL.shadow.camera;c.left=c.bottom=-q.sr;c.right=c.top=q.sr;c.near=1;c.far=700;c.updateProjectionMatrix();
    sunL.shadow.bias=-.0005;sunL.shadow.normalBias=.35;if(sunL.shadow.map){sunL.shadow.map.dispose();sunL.shadow.map=null}}
  if(q.bloom&&THREE.EffectComposer){
    const w=innerWidth,h=innerHeight,pr=renderer.getPixelRatio();
    const rt=new THREE.WebGLRenderTarget(w*pr,h*pr,{type:THREE.HalfFloatType,format:THREE.RGBAFormat,depthBuffer:true,stencilBuffer:true,samples:renderer.capabilities.isWebGL2?(pr>1.2?2:4):0}); // 24-bit depth (16-bit made textures shimmer)
    composer=new THREE.EffectComposer(renderer,rt);composer.setPixelRatio(pr);composer.setSize(w,h);
    composer.addPass(new THREE.RenderPass(scene,camera));
    bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(w/2,h/2),.5,.55,.86);composer.addPass(bloomPass);
    composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
    fxaaPass=new THREE.ShaderPass(THREE.FXAAShader);fxaaPass.uniforms.resolution.value.set(1/(w*pr),1/(h*pr));composer.addPass(fxaaPass);
  } else composer=null;
  rebuildAllChunks();
}
function onResize(){
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  if(composer){const pr=renderer.getPixelRatio();composer.setPixelRatio(pr);composer.setSize(innerWidth,innerHeight);if(fxaaPass)fxaaPass.uniforms.resolution.value.set(1/(innerWidth*pr),1/(innerHeight*pr))}
  if(!$('mapUI').hidden)drawBigMap();
}
// ---------- sky ----------
function patchSky(sk){sk.material.fragmentShader=sk.material.fragmentShader.replace('const vec3 cameraPos = vec3( 0.0, 0.0, 0.0 );','').replace(/cameraPos\b/g,'cameraPosition');sk.material.needsUpdate=true;return sk}
const NIGHT_FS=`uniform vec3 uMoon;varying vec3 vD;
float h21(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec3 d=normalize(vD);float h=clamp(d.y,-.2,1.);
 vec3 c=mix(vec3(.050,.040,.035),vec3(.004,.007,.018),smoothstep(0.,.5,h));
 c+=vec3(.06,.035,.015)*exp(-max(h,0.)*9.);                 // city glow
 float m=max(dot(d,normalize(uMoon)),0.);c+=vec3(.55,.6,.7)*smoothstep(.9995,.99975,m)*2.+vec3(.05,.06,.08)*pow(m,40.);
 vec2 sp=d.xz/(d.y+.3)*110.;float st=step(.9972,h21(floor(sp)))*smoothstep(.15,.5,d.y);c+=vec3(st)*.5;
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <encodings_fragment>
}`;
function makeSkies(){
  sky=patchSky(new THREE.Sky());sky.scale.setScalar(2600);sky.material.depthWrite=false;sky.renderOrder=-10;sky.frustumCulled=false;scene.add(sky);
  nightSky=new THREE.Mesh(new THREE.SphereGeometry(2500,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uMoon:{value:new THREE.Vector3(.4,.6,.5)}},
    vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.);}',fragmentShader:NIGHT_FS}));
  nightSky.renderOrder=-10;nightSky.frustumCulled=false;scene.add(nightSky);
}
const SEA_FS2=`uniform vec3 uSunD;uniform vec3 uSunC;uniform vec3 uSkyC;uniform vec3 uFogC;uniform float uFogD;uniform float uTime;uniform float uNight;uniform sampler2D uSD;uniform vec4 uSDT;varying vec3 vW;
float h12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h12(i),h12(i+vec2(1,0)),f.x),mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x),f.y);}
void main(){
 vec2 p=vW.xz;float t=uTime;
 vec2 g=vec2(cos(p.x*.21+p.y*.07+t*1.3),cos(p.y*.19-p.x*.05+t*1.1))*.16;
 g+=(vec2(vn(p*.6+t*.5),vn(p*.6-t*.45+7.))-.5)*.45;g+=(vec2(vn(p*2.1-t*.9),vn(p*2.3+t*.8+3.))-.5)*.22;
 vec3 n=normalize(vec3(g.x,1.,g.y));vec3 V=normalize(cameraPosition-vW);
 float fr=.02+.98*pow(1.-max(dot(V,n),0.),5.);
 vec3 R=reflect(-V,n);vec3 sky=mix(uFogC,uSkyC,clamp(R.y*1.6,0.,1.));
 float depth=-(texture2D(uSD,(p-uSDT.xy)/uSDT.zw).r*255.-128.)*2.;
 vec3 deep=vec3(.010,.045,.065),shal=vec3(.045,.13,.13);
 vec3 wc=mix(shal,deep,smoothstep(0.,90.,depth))*(uSkyC*1.4+uSunC*.12*max(uSunD.y,0.));
 vec3 c=mix(wc,sky,fr);
 c+=uSunC*pow(max(dot(R,uSunD),0.),260.)*4.;
 float foam=(1.-smoothstep(0.,9.,depth))*(.5+.5*sin(depth*1.3-t*2.2+vn(p*.3)*4.));
 c=mix(c,(uSkyC*1.6+uSunC*.25),clamp(foam*.5,0.,.55));
 float a=clamp(.6+depth*.06,.6,.97);
 float d=length(vW-cameraPosition);c=mix(c,uFogC,1.-exp(-uFogD*uFogD*d*d));
 gl_FragColor=vec4(c,a);
 #include <tonemapping_fragment>
 #include <encodings_fragment>
}`;
function makeSea(){
  const sg=new THREE.PlaneGeometry(9000,9000,1,1);sg.rotateX(-Math.PI/2);
  seaMesh=new THREE.Mesh(sg,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uSunD:{value:new THREE.Vector3()},uSunC:{value:new THREE.Color()},uSkyC:{value:new THREE.Color()},uFogC:{value:new THREE.Color()},uFogD:{value:.002},uTime:UNI.uTime,uNight:UNI.uNight,uSD:UNI.uSD,uSDT:UNI.uSDT},
    vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:SEA_FS2}));
  seaMesh.position.y=SL;seaMesh.renderOrder=2;scene.add(seaMesh);
}
function makeSnow(){
  const n=5000,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=(Math.random()-.5)*80;pos[i*3+1]=Math.random()*40;pos[i*3+2]=(Math.random()-.5)*80}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const cv=document.createElement('canvas');cv.width=cv.height=32;const x=cv.getContext('2d');const gr=x.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,32,32);
  snowPts=new THREE.Points(g,new THREE.PointsMaterial({size:.12,map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false,color:0xffffff}));snowPts.frustumCulled=false;snowPts.visible=false;scene.add(snowPts);
}
function updateSnow(dt){
  if(!snowPts.visible)return;const p=snowPts.geometry.attributes.position;const a=p.array;
  for(let i=0;i<a.length;i+=3){a[i+1]-=dt*(1.2+(i%7)*.08);a[i]+=Math.sin(UNI.uTime.value*.7+i)*dt*.3;if(a[i+1]<0)a[i+1]+=40}
  p.needsUpdate=true;snowPts.position.set(Math.round(camera.position.x),camera.position.y-20,Math.round(camera.position.z));
}
// ---------- time / season ----------
let sunDir=new THREE.Vector3();
function expBase(){const T=TOD[S.time],W=S.season==='winter';return T.exp*(W?(S.time==='day'?.9:(S.time==='night'?.78:.92)):1)}
function applyTime(){
  const T=TOD[S.time];const W=S.season==='winter';
  const el=T.el*Math.PI/180,az=T.az*Math.PI/180;
  sunDir.set(Math.cos(el)*Math.sin(az),Math.sin(el),-Math.cos(el)*Math.cos(az)).normalize();
  sunL.color.setRGB(...T.sun);sunL.intensity=T.si*(W&&S.time==='day'?.55:1);
  hemiL.color.setRGB(...T.sky);hemiL.groundColor.setRGB(...(W?[.55,.57,.62].map(v=>v*T.hi*.9):T.gnd));hemiL.intensity=T.hi*(W&&S.time==='day'?1.25:1);
  const fog=W?(S.time==='night'?[.20,.15,.12]:S.time==='dusk'?[.62,.52,.50]:[.78,.80,.84]):T.fog;
  scene.fog.color.setRGB(...fog);scene.fog.density=T.fd*(W?1.45:1)*(S.q==='low'?1.15:1);
  renderer.toneMappingExposure=expBase();
  UNI.uNight.value=T.night;UNI.uWinter.value=W?1:0;UNI.uWet.value=W?.35:(S.time==='night'?.25:.08);
  const su=sky.material.uniforms;su.sunPosition.value.copy(sunDir);su.turbidity.value=W?(S.time==='day'?7:T.turb+3):T.turb;su.rayleigh.value=W&&S.time==='day'?.9:T.ray;su.mieCoefficient.value=.005;su.mieDirectionalG.value=.8;
  sky.visible=S.time!=='night';nightSky.visible=S.time==='night';nightSky.material.uniforms.uMoon.value.copy(sunDir);
  const sm=seaMesh.material.uniforms;sm.uSunD.value.copy(sunDir);sm.uSunC.value.setRGB(T.sun[0]*T.si*.4,T.sun[1]*T.si*.4,T.sun[2]*T.si*.4);sm.uSkyC.value.setRGB(...T.sky);sm.uFogC.value.copy(scene.fog.color);sm.uFogD.value=scene.fog.density;
  snowPts.visible=W&&!PORTAL.cur;
  const ei=S.time==='night'?1.7:(S.time==='dusk'?.8:0);for(const m of LIGHT_SIGNS){if(m.emissiveIntensity!==undefined)m.emissiveIntensity=ei*(m.userData.ei||1)}
  TREES.dirty=true;
  updateEnv();
  $('bTime').textContent=T.lbl;
  document.querySelectorAll('[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===S.time));
  document.querySelectorAll('[data-s]').forEach(b=>b.classList.toggle('on',b.dataset.s===S.season));
  if((typeof AUD!=='undefined')&&AUD)AUD.setScene(S.time,S.season);
}
function updateEnv(){
  const es=new THREE.Scene();
  if(S.time==='night'){const n=nightSky.clone();n.scale.setScalar(.04);es.add(n);es.background=null}
  else{const sk=patchSky(new THREE.Sky());sk.scale.setScalar(100);const su=sk.material.uniforms,s0=sky.material.uniforms;for(const k of ['turbidity','rayleigh','mieCoefficient','mieDirectionalG'])su[k].value=s0[k].value;su.sunPosition.value.copy(sunDir);es.add(sk)}
  const g=new THREE.Mesh(new THREE.CircleGeometry(80,24),new THREE.MeshBasicMaterial({color:new THREE.Color().copy(hemiL.groundColor).multiplyScalar(.6)}));g.rotation.x=-Math.PI/2;g.position.y=-3;es.add(g);
  const old=envRT;envRT=pmrem.fromScene(es,.03);scene.environment=envRT.texture;if(old)old.dispose();
}
// ---------- chunks ----------
function chunkIdAt(x,z){return chunkIdAt2(x,z)}
let CHUNK_JOB=null;
function buildChunk(id){if(chunks.has(id))return;if(CHUNK_JOB&&CHUNK_JOB.id===id){while(!CHUNK_JOB.gen.next().done);CHUNK_JOB=null;return}const g=buildChunkGen(id);while(!g.next().done);}
// chunk construction is sliced into small steps so walking/driving never hitches
function* buildChunkGen(id){
  const [x0,z0]=chunkOrigin(id);
  const gr=buildGround2(id);yield;
  const g=new GB({position:3,normal:3,aUV:2,aP:4,aQ:1,aT:3}),P=new PB(),Sg=new GB({position:3,normal:3,uv:2}),GRX=new GB({position:3,normal:3,aK:2,aR:4,aU:1});
  const cols=[],lots=[],benches=[],lampPos=[],segs=[],obb=[],lobb=[],cirs=[],treePts=[],doors=[];
  const feats=chunkFeatures(id);
  // buildings (real OSM footprints)
  const blds=[];
  for(let k=D.bctab[id];k<D.bctab[id+1];k++){const fl=D.bfl[k];if(fl&1)continue;const rings=bldRings(k,x0,z0);const a=rings[0];
    let cx=0,cz=0;const n=a.length>>1;for(let i=0;i<n;i++){cx+=a[i*2];cz+=a[i*2+1]}cx/=n;cz/=n;
    if(blockedStatic(cx,cz,0))continue;blds.push({k,rings,fl,cx,cz,signs:[]})}
  for(const f of feats){if(f.k!==2)continue;let best=null,bd=12;for(const b of blds){const a=b.rings[0];if(Math.abs(b.cx-f.x)>120||Math.abs(b.cz-f.z)>120)continue;const d=polyInside(b.rings,f.x,f.z)?0:polyNearest(b.rings,f.x,f.z)[0];if(d<bd){bd=d;best=b}}if(best)best.signs.push(f)}
  let nb=0;
  for(const b of blds){const k=b.k;
    let sd=D.bsd[k];if(D.bst[k]===HIST&&Math.hypot(b.cx-LMK.duke.x,b.cz-LMK.duke.y)<150)sd=YELLOW_SD;if(D.blv[k]<=2&&Math.hypot(b.cx-88,b.cz-143)<32)sd=254;
    const res=addPolyBuilding(g,b.rings,D.blv[k],D.bst[k],sd,b.fl,P,Sg,{lots,benches,lamps:lampPos,signs:b.signs,doors});
    cols.push(makeColPoly(b.rings,res.top,res.y0));
    if(++nb%8===0)yield}
  for(const [x,z,dx,dz,kind] of gr.lampPts){if(blockedStatic(x,z,.5))continue;let hit=false;for(const c of cols)if(colPolyHit(c,x,z,.6)){hit=true;break}if(hit)continue;const y=groundH(x,z)+.17;propLamp(P,x,y,z,dx,dz,kind);
    lampPos.push(kind===1?x:x+dx*1.55,kind===1?y+4.3:y+7.85,kind===1?z:z+dz*1.55)}
  yield;
  const solid=(x,z,m)=>{for(const c of cols)if(colPolyHit(c,x,z,m))return true;return insideOBB(obb,x,z,m)};
  // parked cars along yard sides
  const r=rng(id*31+5);const parked=[];
  for(const L of lots){for(let q=-2;q<=2;q++){if(r()<.45)continue;const x=L.x+L.tx*q*2.8,z=L.z+L.tz*q*2.8;
    if(solid(x,z,1.6)||nearRoad(id,x,z,1.2)||blockedStatic(x,z,2))continue;
    parked.push({x,y:groundH(x,z)+.02,z,yaw:Math.atan2(L.nx,L.nz)+(r()<.5?0:Math.PI),type:pickCarType(r),col:CAR_COLS[Math.floor(r()*CAR_COLS.length)],pitch:0,roll:0});lobb.push(x,z,1.0,2.25,L.tx,L.tz)}}
  // OSM point features
  for(const f of feats){const y=groundH(f.x,f.z);
    if(f.k===0){if(!solid(f.x,f.z,.8))treePts.push([f.x,f.z,f.a?3:(r()<.5?0:1),.8+r()*.5])}
    else if(f.k===1){if(solid(f.x,f.z,.4))continue;const ry=roadYaw(id,f.x,f.z)+(r()<.5?0:Math.PI);propBench2(P,f.x,y,f.z,ry,benches);lobb.push(f.x,f.z,.95,.32,Math.cos(ry),-Math.sin(ry))}
    else if(f.k===3||f.k===4){let fx=f.x,fz=f.z;
      // tram/bus stop mapped on the rails: move the shelter beside the track
      if(D.rSegStart){const q=tramRailNear(fx,fz,4.5,-1);if(q){let nx=-q[3],nz=q[2];if((fx-q[0])*nx+(fz-q[1])*nz<0){nx=-nx;nz=-nz}const o2=tramRailNear(q[0]+nx*3.4,q[1]+nz*3.4,1.6,q[5]);const push=o2?5.6:3.4;fx=q[0]+nx*push;fz=q[1]+nz*push}}
      let rail=false;if(D.rSegStart){rail=!!tramRailNear(f.x,f.z,4.5,-1)}
      if(f.k===3&&!rail){const q=nearRoadPt(id,fx,fz);if(q&&q.d<14&&q.c<=2){const want=q.side||1;const dd=HW[q.c]+SW[q.c]*.55+1.1;fx=q.px+q.nx*want*dd;fz=q.pz+q.nz*want*dd;addBusStop(q.px,q.pz,q.nx*want,q.nz*want)}}
      if(solid(fx,fz,1.5))continue;const ry=roadYaw(id,fx,fz);busShelter(P,fx,groundH(fx,fz),fz,ry,f.k===4);obb.push(fx,fz,1.9,.75,Math.cos(ry),-Math.sin(ry))}
    else if(f.k===5){if(solid(f.x,f.z,2.6)||nearRoad(id,f.x,f.z,1))continue;fountainProp(P,f.x,y,f.z);cirs.push(f.x,f.z,2.6)}}
  // playgrounds, sports courts
  for(const A of chunkAreas(id)){if(blockedStatic(A.x,A.z,0))continue;
    if(A.k===0){const kits=playgroundArea(P,GRX,A);for(const p of kits)cirs.push(p[0],p[1],.9)}
    else if(A.k===1&&A.w*A.d<2500)pitchArea(P,GRX,A)}
  yield;
  buildBarriers(id,P,segs);buildRails(id,P,null,(x,z)=>{for(const c of cols)if(colPolyHit(c,x,z,-.01))return true;return false});
  yield;
  const c={id,ground:gr.mesh,bld:null,props:null,signs:null,grx:null,parked,benches,cols,doors:doors.filter(d=>DOOR_KIND[d.code]),segs:new Float32Array(segs),cirs:new Float32Array(cirs),lampPos:new Float32Array(lampPos),obb:new Float32Array(obb),lobb:new Float32Array(lobb)};
  if(g.n){c.bld=new THREE.Mesh(g.build(),MATS.bld);c.bld.castShadow=c.bld.receiveShadow=true;c.bld.matrixAutoUpdate=false}
  const pg=P.build();if(pg){c.props=new THREE.Mesh(pg,MATS.props);c.props.castShadow=c.props.receiveShadow=true;c.props.matrixAutoUpdate=false}
  if(Sg.n){c.signs=new THREE.Mesh(Sg.build(),MATS.signs);c.signs.matrixAutoUpdate=false}
  if(GRX.n){c.grx=new THREE.Mesh(GRX.build(),MATS.ground);c.grx.receiveShadow=true;c.grx.matrixAutoUpdate=false}
  yield;
  // trees: OSM trees + roadside + land-use density
  treesForChunk(id,c,treePts,solid);
  for(const m of [c.ground,c.bld,c.props,c.signs,c.grx])if(m){scene.add(m);if(PORTAL.cur)m.visible=false}
  chunks.set(id,c);PARKED_DIRTY=true;TREES.add(id,treePts);
}
const YELLOW_SD=(()=>{for(let s=0;s<256;s++){const h=(s/255*13.7+.11)%1;if(h>.49&&h<.55)return s}return 0})();
function nearRoadPt(id,x,z){const P=D.nodes,wn=D.wn;let best=1e9,r=null;for(let s=D.segStart[id];s<D.segStart[id+1];s++){const i=D.seg[s];const c=D.wcls[D.wOf[i]];if(c>2||D.wfl[D.wOf[i]]===1)continue;const a=wn[i]*2,b=wn[i+1]*2;const ax=P[a],az=P[a+1],dx=P[b]-ax,dz=P[b+1]-az;const L2=dx*dx+dz*dz;if(L2<.01)continue;
  let t=((x-ax)*dx+(z-az)*dz)/L2;t=t<0?0:t>1?1:t;const px=ax+dx*t,pz=az+dz*t;const d=Math.hypot(px-x,pz-z);if(d<best){best=d;const L=Math.sqrt(L2);const nx=-dz/L,nz=dx/L;r={px,pz,nx,nz,d,c,side:((x-px)*nx+(z-pz)*nz)>=0?1:-1}}}return r}
function roadYaw(id,x,z){const P=D.nodes,wn=D.wn;let best=1e9,ang=0;for(let s=D.segStart[id];s<D.segStart[id+1];s++){const i=D.seg[s];const a=wn[i]*2,b=wn[i+1]*2;const ax=P[a],az=P[a+1],dx=P[b]-ax,dz=P[b+1]-az;const L2=dx*dx+dz*dz;if(L2<.01)continue;
  let t=((x-ax)*dx+(z-az)*dz)/L2;t=t<0?0:t>1?1:t;const d=Math.hypot(ax+dx*t-x,az+dz*t-z);if(d<best){best=d;const sx=(dx*(z-az)-dz*(x-ax))>0?1:-1;ang=Math.atan2(dx,dz)+Math.PI/2*sx}}return ang}
function buildPlayground(P,x,y,z,ry,r){
  const red=sRGB('#c8372d'),yel=sRGB('#e8b53a'),blu=sRGB('#2f66b0'),grn=sRGB('#3f8a46'),met=sRGB('#7b8186');
  const c=Math.cos(ry),s=Math.sin(ry);const at=(u,v)=>[x+u*c+v*s,z-u*s+v*c];
  // swings
  for(const u of [-1.6,1.6]){const p=at(u,-2);P.box(p[0],y+1.2,p[1],.08,2.4,.08,ry,met,1,.25);P.box(p[0],y+1.2,p[1],.08,2.4,.08,ry,met,1,-.25)}
  let p=at(0,-2);P.box(p[0],y+2.35,p[1],3.4,.09,.09,ry,met,1);
  for(const u of [-.6,.6]){const q=at(u,-2);P.box(q[0],y+.55,q[1],.5,.06,.3,ry,u<0?red:blu,1);P.box(q[0],y+1.45,q[1],.02,1.8,.02,ry,met,1)}
  // slide
  p=at(-2.2,1.5);P.box(p[0],y+.75,p[1],1.2,1.5,1.2,ry,yel,1);const q=at(-2.2,3.2);P.box(q[0],y+.75,q[1],.7,.06,2.6,ry,met,6,-.55);
  // sandbox
  p=at(2,1.8);P.box(p[0],y+.15,p[1],2.4,.3,2.4,ry,sRGB('#8a6a46'),5);P.box(p[0],y+.2,p[1],2.1,.2,2.1,ry,sRGB('#cdb588'),4);
  // carousel
  p=at(.2,2.6);P.cyl(p[0],y+.25,p[1],1.1,1.1,.12,10,grn,1);P.cyl(p[0],y+.37,p[1],.06,.06,.8,5,met,1);
}
function disposeChunk(c){
  for(const m of [c.ground,c.bld,c.props,c.signs,c.grx]){if(!m)continue;scene.remove(m);m.geometry.dispose()}
  TREES.remove(c.id);chunks.delete(c.id);PARKED_DIRTY=true;
}
function rebuildAllChunks(){for(const c of [...chunks.values()])disposeChunk(c);if(started||renderer)updateChunks(0,260)}
function updateChunks(budget,sync){
  if(PORTAL.cur)return;
  const q=Qp(),R=q.R;const t0=performance.now();
  const ci=Math.floor((player.x-BB[0])/CH),cj=Math.floor((player.z-BB[2])/CH);const n=Math.ceil(R/CH)+1;
  const want=[];
  for(let j=cj-n;j<=cj+n;j++)for(let i=ci-n;i<=ci+n;i++){if(i<0||j<0||i>=NCX||j>=NCZ)continue;
    const cx=BB[0]+(i+.5)*CH,cz=BB[2]+(j+.5)*CH;const d=Math.hypot(cx-player.x,cz-player.z);if(d<R+CH*.6)want.push([d,j*NCX+i])}
  want.sort((a,b)=>a[0]-b[0]);
  if(sync){for(const [d,id] of want){if(chunks.has(id))continue;if(d>sync)break;buildChunk(id)}}
  else{let wi=0;while(performance.now()-t0<budget){
    if(!CHUNK_JOB){while(wi<want.length&&chunks.has(want[wi][1]))wi++;if(wi>=want.length)break;const id=want[wi][1];wi++;CHUNK_JOB={id,gen:buildChunkGen(id)}}
    if(CHUNK_JOB.gen.next().done)CHUNK_JOB=null}}
  for(const c of [...chunks.values()]){const cx=BB[0]+(c.id%NCX+.5)*CH,cz=BB[2]+(Math.floor(c.id/NCX)+.5)*CH;const d=Math.hypot(cx-player.x,cz-player.z);
    if(d>R+CH*1.6){disposeChunk(c);continue}
  }
}
function teleportRaw(x,z,yaw){
  if(RIDE.on){RIDE.on=false;RIDE.tram=null}
  if(PORTAL.cur){PORTAL.cur=null;PORTAL.setCity(true);for(const n in PORTAL.built)PORTAL.built[n].grp.visible=false}
  if(typeof DRIVE!=='undefined'&&DRIVE.on){DRIVE.on=false;DRIVE.v=0;$('bCar').classList.remove('on');$('spd').hidden=true;engineOn(false);PLR.root.visible=true}
  player.x=x;player.z=z;player.vx=player.vz=0;player.vy=0;player.air=false;player.sit=null;player.yaw=yaw||0;cam.yaw=player.yaw;cam.init=false;
  updateChunks(0,280);player.y=groundAt(x,z,99);
  if(typeof CARS!=='undefined'){CARS.length=0;PEDS.length=0;updateCars.init=false;updatePeds.init=false}
}
function teleport(p){const f=$('fade');f.style.opacity=1;setTimeout(()=>{teleportRaw(p.x,p.z,p.yaw);toast(p.name,p.sub||'');f.style.opacity=0},380)}
// ---------- ground & collisions ----------
function sidewalkLift(x,z){
  const id=chunkIdAt(x,z);if(id<0)return 0;const P=D.nodes,wn=D.wn;
  for(let s=D.segStart[id];s<D.segStart[id+1];s++){const i=D.seg[s],k=D.wOf[i],c=D.wcls[k];if(c>1||D.wfl[k])continue;
    const a=wn[i]*2,b=wn[i+1]*2;const ax=P[a],az=P[a+1],dx=P[b]-ax,dz=P[b+1]-az;const L2=dx*dx+dz*dz;if(L2<.01)continue;
    let t=((x-ax)*dx+(z-az)*dz)/L2;if(t<0||t>1)continue;const d=Math.hypot(ax+dx*t-x,az+dz*t-z);
    if(d>HW[c]&&d<HW[c]+SW[c]){const cp=D.cum[i]+Math.sqrt(L2)*t;if(D.dPrev[i]+(cp-D.cum[i])>(c?7:8.5)&&D.dNext[i+1]+(D.cum[i+1]-cp)>(c?7:8.5))return .17}}
  return 0;
}
function groundAt(x,z,y){const sp=specialGround(x,z,y);if(sp)return sp.h;return groundH(x,z)+sidewalkLift(x,z)}
function nearChunks(x,z){const out=[];const id0=chunkIdAt(x,z);if(id0<0)return out;const i0=id0%NCX,j0=Math.floor(id0/NCX);
  for(let j=j0-1;j<=j0+1;j++)for(let i=i0-1;i<=i0+1;i++){if(i<0||j<0||i>=NCX||j>=NCZ)continue;const c=chunks.get(j*NCX+i);if(c)out.push(c)}return out}
function collide(x,z,r,y){
  const near=nearChunks(x,z);
  for(let it=0;it<2;it++){
    const lists=[STATIC_OBB,LOW_OBB,CAR_OBB];
    for(const c of near){if(c.obb.length)lists.push(c.obb);if(c.lobb.length)lists.push(c.lobb)}
    for(const o of lists){for(let q=0;q<o.length;q+=6){
      const dx=x-o[q],dz=z-o[q+1];if(Math.abs(dx)>o[q+2]+o[q+3]+r&&Math.abs(dz)>o[q+2]+o[q+3]+r)continue;
      const ca=o[q+4],sa=o[q+5];const u=dx*ca+dz*sa,v=-dx*sa+dz*ca;const pu=o[q+2]+r-Math.abs(u),pv=o[q+3]+r-Math.abs(v);
      if(pu>0&&pv>0){if(pu<pv){const s=Math.sign(u)||1;x+=ca*pu*s;z+=sa*pu*s}else{const s=Math.sign(v)||1;x+=-sa*pv*s;z+=ca*pv*s}}
    }}
    // real building footprints (polygons)
    const pp=cp=>{if(y!==undefined&&(y>cp.top+.1||y<cp.y0-4))return;const q=colPolyPush(cp,x,z,r);if(q){x=q[0];z=q[1]}};
    for(const cp of STATIC_POLYS)pp(cp);
    for(const c of near)for(const cp of c.cols)pp(cp);
    // fences / walls / hedges (capsules) and round props
    const gy=y!==undefined?groundH(x,z):0;
    for(const c of near){const sg=c.segs;for(let q=0;q<sg.length;q+=6){if(y!==undefined&&y-gy>sg[q+5]-.05)continue;
        const ax=sg[q],az=sg[q+1],dx=sg[q+2]-ax,dz=sg[q+3]-az;const L2=dx*dx+dz*dz;let t=L2>1e-6?((x-ax)*dx+(z-az)*dz)/L2:0;t=t<0?0:t>1?1:t;
        const qx=ax+dx*t,qz=az+dz*t,ex=x-qx,ez=z-qz,rr=sg[q+4]+r,d2=ex*ex+ez*ez;if(d2<rr*rr){const d=Math.sqrt(d2)||1e-3;x=qx+ex/d*rr;z=qz+ez/d*rr}}
      const ci=c.cirs;for(let q=0;q<ci.length;q+=3){const dx=x-ci[q],dz=z-ci[q+1],rr=ci[q+2]+r;const d2=dx*dx+dz*dz;if(d2<rr*rr&&d2>1e-6){const d=Math.sqrt(d2);x=ci[q]+dx/d*rr;z=ci[q+1]+dz/d*rr}}}
    for(const o of STATIC_WALLS){if(y!==undefined&&(y<o.y0-.3||y>o.y1))continue;const dx=x-o.cx,dz=z-o.cz;const u=dx*o.ca+dz*o.sa,v=-dx*o.sa+dz*o.ca;const pu=o.hw+r-Math.abs(u),pv=o.hd+r-Math.abs(v);
      if(pu>0&&pv>0){if(pu<pv){const s=Math.sign(u)||1;x+=o.ca*pu*s;z+=o.sa*pu*s}else{const s=Math.sign(v)||1;x+=-o.sa*pv*s;z+=o.ca*pv*s}}}
    for(let q=0;q<STATIC_CIR.length;q+=3){const dx=x-STATIC_CIR[q],dz=z-STATIC_CIR[q+1],rr=STATIC_CIR[q+2]+r;const d2=dx*dx+dz*dz;if(d2<rr*rr&&d2>1e-6){const d=Math.sqrt(d2);x=STATIC_CIR[q]+dx/d*rr;z=STATIC_CIR[q+1]+dz/d*rr}}
  }
  return [x,z];
}
const CAR_OBB=[];const CAR_HL=CAR_DEFS.map(d=>d.front+.15),CAR_HH=CAR_DEFS.map(d=>d.top.reduce((a,t)=>Math.max(a,t[1]),0)+.1);
function refreshCarObb(){CAR_OBB.length=0;for(const t of TRAMS){if(Math.abs(t.x-player.x)>14||Math.abs(t.z-player.z)>14)continue;CAR_OBB.push(t.x,t.z,1.3,7.6,Math.cos(t.yaw),-Math.sin(t.yaw))}if(DRIVE.car&&!DRIVE.on){const c=DRIVE.car;CAR_OBB.push(c.x,c.z,.95,2.15,Math.cos(c.yaw),-Math.sin(c.yaw))}for(const c of CARS){if(Math.abs(c.x-player.x)>12||Math.abs(c.z-player.z)>12)continue;const ca=Math.cos(c.yaw),sa=Math.sin(c.yaw);CAR_OBB.push(c.x,c.z,.95,CAR_HL[c.type]||2.3,ca,-sa)}}
function carAt(x,z,y,m){if(typeof CARS==='undefined')return false;const L=DRIVE.car&&!DRIVE.on?CARS.concat([DRIVE.car]):CARS;for(const c of L){const dx=x-c.x,dz=z-c.z;if(Math.abs(dx)>4||Math.abs(dz)>4)continue;if(y>c.y+(CAR_HH[c.type]||1.6)+.2)continue;
  const fx=Math.sin(c.yaw),fz=Math.cos(c.yaw);const a=dx*fx+dz*fz,b=dx*fz-dz*fx;if(Math.abs(a)<(CAR_HL[c.type]||2.3)+m&&Math.abs(b)<1+m)return true}return false}
function insideAny(x,z,m,y){
  if(insideOBB(STATIC_OBB,x,z,m))return true;
  for(const o of STATIC_WALLS){if(y!==undefined&&(y<o.y0||y>o.y1+1))continue;const dx=x-o.cx,dz=z-o.cz;const u=dx*o.ca+dz*o.sa,v=-dx*o.sa+dz*o.ca;if(Math.abs(u)<o.hw+m&&Math.abs(v)<o.hd+m)return true}
  for(const cp of STATIC_POLYS){if(y!==undefined&&(y>cp.top||y<cp.y0-4))continue;if(colPolyHit(cp,x,z,m))return true}
  const near=nearChunks(x,z);if(!near.length)return false;
  const low=y===undefined||y<groundH(x,z)+1.75;
  if(low&&insideOBB(LOW_OBB,x,z,m))return true;
  for(const c of near){if(insideOBB(c.obb,x,z,m)||low&&insideOBB(c.lobb,x,z,m))return true;
    for(const cp of c.cols){if(y!==undefined&&(y>cp.top||y<cp.y0-4))continue;if(colPolyHit(cp,x,z,m))return true}}
  return false;
}
// ---------- player ----------
let stepPhase=0;
function stepPlayer(dt){
  if(player.sit){const s=player.sit;player.x=s.x;player.z=s.z;player.y=s.y;player.yaw=s.yaw;PLR.root.position.set(s.x,s.y,s.z);PLR.root.rotation.y=s.yaw;animPlayer(PLR,{spd:0,mode:'sit'},dt);
    if(inp.jx||inp.jy||inp.k.KeyW||inp.k.KeyS||inp.k.KeyA||inp.k.KeyD){player.sit=null;}return}
  let ix=0,iz=0;
  if(inp.k.KeyW||inp.k.ArrowUp)iz+=1;if(inp.k.KeyS||inp.k.ArrowDown)iz-=1;if(inp.k.KeyA||inp.k.ArrowLeft)ix-=1;if(inp.k.KeyD||inp.k.ArrowRight)ix+=1;
  ix+=inp.jx;iz+=inp.jy;let im=Math.hypot(ix,iz);if(im>1){ix/=im;iz/=im;im=1}
  const fx=Math.sin(cam.yaw),fz=Math.cos(cam.yaw),rx=-Math.cos(cam.yaw),rz=Math.sin(cam.yaw);
  let mx=fx*iz+rx*ix,mz=fz*iz+rz*ix;
  const running=player.run||inp.k.ShiftLeft||inp.k.ShiftRight;
  const vmax=player.scoot?9.5:(running?5.4:1.8);
  const acc=player.scoot?(im>0?2.2:1.6):(player.air?2:10);
  player.vx+=(mx*vmax-player.vx)*Math.min(1,dt*acc);player.vz+=(mz*vmax-player.vz)*Math.min(1,dt*acc);
  let nx=player.x+player.vx*dt,nz=player.z+player.vz*dt;
  [nx,nz]=collide(nx,nz,player.scoot?.45:.33,player.y);
  const sp=specialGround(nx,nz,player.y);
  const gN=sp?sp.h:groundH(nx,nz);
  const block=(sp&&sp.wall)||(!sp&&gN<SL-1.0)||(gN>player.y+.75&&!player.air);
  if(block){nx=player.x;nz=player.z;player.vx*=.3;player.vz*=.3}
  const realV=Math.hypot(nx-player.x,nz-player.z)/Math.max(dt,1e-4);
  player.x=nx;player.z=nz;player.spd+=(Math.min(realV,vmax)-player.spd)*Math.min(1,dt*8);
  if(Math.hypot(player.vx,player.vz)>.3){const ty=Math.atan2(player.vx,player.vz);let dy=ty-player.yaw;while(dy>Math.PI)dy-=6.283;while(dy<-Math.PI)dy+=6.283;player.yaw+=dy*Math.min(1,dt*(player.scoot?5:10))}
  const g=groundAt(player.x,player.z,player.y);
  if(inp.jump&&!player.air){player.vy=player.scoot?4.2:4.8;player.air=true;if((typeof AUD!=='undefined')&&AUD)AUD.jump()}
  inp.jump=false;
  if(player.air){player.vy-=13*dt;player.y+=player.vy*dt;if(player.y<=g){player.y=g;player.air=false;player.vy=0;if((typeof AUD!=='undefined')&&AUD)AUD.land()}}
  else{if(g<player.y-.6){player.air=true;player.vy=0}else player.y+=(g-player.y)*Math.min(1,dt*(Math.abs(g-player.y)>.3?12:20))}
  if(player.y<SL-.7)player.y=Math.max(player.y,SL-.75);
  PLR.root.position.set(player.x,player.y,player.z);PLR.root.rotation.y=player.yaw;
  const ph0=PLR.phase;
  animPlayer(PLR,{spd:player.spd,mode:player.air?'air':(player.scoot?'scoot':'walk')},dt);
  if(!player.air&&!player.scoot&&player.spd>.4){const a=Math.floor(ph0/Math.PI),b=Math.floor(PLR.phase/Math.PI);if(a!==b&&(typeof AUD!=='undefined')&&AUD)AUD.step(surfaceAt(player.x,player.z,player.y),player.spd)}
}
function surfaceAt(x,z,y){
  if(curIndoor)return curIndoor.floor||'stone';
  const sp=specialGround(x,z,y);if(sp)return sp.surf||'stone';
  if(S.season==='winter')return 'snow';
  const sd=sdAt(x,z);if(sd<55)return 'sand';
  if(sidewalkLift(x,z)>0)return 'tile';
  const id=chunkIdAt(x,z);if(id>=0&&nearRoad(id,x,z,-SW[0]))return 'asphalt';
  return 'grass';
}
function stepCamera(dt){
  if(window.DBGCAM){const c=window.DBGCAM;camera.position.set(c[0],c[1],c[2]);camera.lookAt(c[3],c[4],c[5]);return}
  if(DRIVE.on&&started)return stepCarCamera(dt);
  if(RIDE.on&&started)return stepTramCamera(dt);
  const tx=player.x,ty=player.y+(player.scoot?1.5:(player.sit?1.0:1.35)),tz=player.z;
  if(started&&!inp.dragging&&!TOUCH_LOOK.active&&Math.hypot(player.vx,player.vz)>1.2){let dy=player.yaw-cam.yaw;while(dy>Math.PI)dy-=6.283;while(dy<-Math.PI)dy+=6.283;cam.yaw+=dy*Math.min(1,dt*(player.scoot?1.6:.7))}
  const indoor=curIndoor?Math.min(cam.dist,3.4):cam.dist;
  const dist=started?indoor*(player.scoot?1.18:1):34;const pitch=started?cam.pitch:.42;
  const cp=Math.cos(pitch),sp=Math.sin(pitch);
  const dx=-Math.sin(cam.yaw)*cp,dy=sp,dz=-Math.cos(cam.yaw)*cp;
  let d=dist;
  for(let s=.6;s<=dist;s+=.3){const px=tx+dx*s,py=ty+dy*s,pz=tz+dz*s;if(insideAny(px,pz,.25,py)||carAt(px,pz,py,.35)||py<groundAt(px,pz,py)+.3||(curIndoor&&curIndoor.ceil&&py>curIndoor.ceil(px,pz,ty))){d=Math.max(.6,s-.35);break}}
  if(player.sit&&started&&curIndoor&&curIndoor.name==='opera'){ // seated in the opera: first-person view
    const ex=player.x+Math.sin(player.yaw)*.12,ey=player.y+1.12,ez=player.z+Math.cos(player.yaw)*.12;
    cam.x=ex;cam.y=ey;cam.z=ez;camera.position.set(ex,ey,ez);const lp=-cam.pitch*.6;
    camera.lookAt(ex+Math.sin(cam.yaw)*Math.cos(lp),ey+Math.sin(lp),ez+Math.cos(cam.yaw)*Math.cos(lp));PLR.root.visible=false;return}
  PLR.root.visible=true;
  const wx=tx+dx*d,wy=ty+dy*d,wz=tz+dz*d;
  if(!cam.init){cam.x=wx;cam.y=wy;cam.z=wz;cam.init=true}
  const k=Math.min(1,dt*12);cam.x+=(wx-cam.x)*k;cam.y+=(wy-cam.y)*k;cam.z+=(wz-cam.z)*k;
  camera.position.set(cam.x,cam.y,cam.z);camera.lookAt(tx,ty,tz);
}
function stepCarCamera(dt){
  const c=DRIVE.car;const tx=c.x,ty=c.y+1.45,tz=c.z;
  if(!inp.dragging&&!TOUCH_LOOK.active){let tgt=c.yaw;if(DRIVE.v<-1)tgt=c.yaw;let dy=tgt-cam.yaw;while(dy>Math.PI)dy-=6.283;while(dy<-Math.PI)dy+=6.283;cam.yaw+=dy*Math.min(1,dt*(Math.abs(DRIVE.v)>2?2.6:.8))}
  const dist=Math.max(6.2,cam.dist)*(1+Math.min(.35,Math.abs(DRIVE.v)*.011));const pitch=Math.max(.1,cam.pitch);
  const cp=Math.cos(pitch),sp=Math.sin(pitch);const dx=-Math.sin(cam.yaw)*cp,dy2=sp,dz=-Math.cos(cam.yaw)*cp;
  let d=dist;for(let s=1.5;s<=dist;s+=.4){const px=tx+dx*s,py=ty+dy2*s,pz=tz+dz*s;if(insideAny(px,pz,.25,py)||py<groundAt(px,pz,py)+.3){d=Math.max(1.5,s-.4);break}}
  const wx=tx+dx*d,wy=ty+dy2*d,wz=tz+dz*d;if(!cam.init){cam.x=wx;cam.y=wy;cam.z=wz;cam.init=true}
  const k=Math.min(1,dt*10);cam.x+=(wx-cam.x)*k;cam.y+=(wy-cam.y)*k;cam.z+=(wz-cam.z)*k;
  camera.position.set(cam.x,cam.y,cam.z);camera.lookAt(tx+Math.sin(c.yaw)*2,ty,tz+Math.cos(c.yaw)*2);
}
// ---------- lights / indoor ----------
let lightTick=0;
function updateLampUniforms(){
  const L=UNI.uL.value;const cand=[];const px=camera.position.x*.4+player.x*.6,pz=camera.position.z*.4+player.z*.6;
  const id0=chunkIdAt(px,pz);
  if(id0>=0){const i0=id0%NCX,j0=Math.floor(id0/NCX);
    for(let j=j0-1;j<=j0+1;j++)for(let i=i0-1;i<=i0+1;i++){const c=chunks.get(j*NCX+i);if(!c)continue;const p=c.lampPos;
      for(let q=0;q<p.length;q+=3){const d=(p[q]-px)**2+(p[q+2]-pz)**2;if(d<170*170)cand.push([d,p[q],p[q+1],p[q+2],3.2])}}}
  for(const e of EXTRA_LAMPS){const d=(e[0]-px)**2+(e[2]-pz)**2;if(d<170*170)cand.push([d,e[0],e[1],e[2],e[3]])}
  cand.sort((a,b)=>a[0]-b[0]);
  const nL=(DRIVE.on&&UNI.uNight.value>.3)?15:16;
  for(let k=0;k<nL;k++){if(k<cand.length)L[k].set(cand[k][1],cand[k][2]-.3,cand[k][3],cand[k][4]);else L[k].set(0,-999,0,0)}
}
const EXTRA_LAMPS=[];
function updateIndoor(dt){
  let cur=null;for(const r of INDOORS){if(r.test(player.x,player.z,player.y)){cur=r;break}}
  if(cur!==curIndoor){curIndoor=cur;if((typeof AUD!=='undefined')&&AUD)AUD.setIndoor(cur?cur.name:null);if(cur&&cur.enter)cur.enter();if(!cur)toast('','')}
  indoorAmt+=((cur?1:0)-indoorAmt)*Math.min(1,dt*3);
  UNI.uIndoor.value=indoorAmt;
  const T=TOD[S.time],W=S.season==='winter';
  sunL.intensity=T.si*(W&&S.time==='day'?.55:1)*(1-indoorAmt*.97);
  hemiL.intensity=T.hi*(W&&S.time==='day'?1.25:1)*(1-indoorAmt*.85);
  for(const r of INDOORS)if(r.lights)r.lights.forEach(l=>l.intensity=l.userData.i*(r===cur?indoorAmt:0));
  renderer.toneMappingExposure=(cur&&cur.exp)?THREE.MathUtils.lerp(expBase(),cur.exp,indoorAmt):expBase();
  if(bloomPass)bloomPass.strength=.5-.32*indoorAmt;
}
// ---------- HUD ----------
function districtOf(x,z){
  const lat=HDR.LAT0-z/HDR.KZ,lon=HDR.LON0+x/HDR.KX;
  if(HOME_C&&Math.hypot(x-HOME_C.x,z-HOME_C.z)<90)return ['Chykalenka St, 59k','Tairove'];
  for(const p of PLACES){if(p.id==='home'||p.id==='stairs_b')continue;if(Math.hypot(x-p.x,z-p.z)<(p.r||110))return [p.name,'Odesa']}
  if(x>1150&&z<-11350&&z>-12600)return ['Port','Odesa'];
  if(46.462<lat&&lat<46.493&&30.718<lon&&lon<30.762)return ['City Centre','Odesa'];
  if(46.455<lat&&lat<46.481&&30.700<lon&&lon<=30.718)return ['Moldavanka','Odesa'];
  if(46.493<=lat&&lat<46.545&&lon>30.69)return ['Peresyp','Odesa'];
  if(lat>=46.565)return ['Kotovsky','Odesa'];
  if(46.545<=lat&&lat<46.565)return ['Luzanivka','Odesa'];
  if(46.430<lat&&lat<=46.462&&30.700<lon&&lon<30.745)return ['Cheryomushky','Odesa'];
  if(46.418<lat&&lat<46.438&&lon>=30.750)return ['Arkadia','Odesa'];
  if(46.438<=lat&&lat<=46.462&&lon>=30.745)return ['French Boulevard','Odesa'];
  if(46.372<lat&&lat<=46.420&&30.690<lon&&lon<30.748)return ['Tairove','Odesa'];
  if(46.350<lat&&lat<=46.418&&lon>=30.748)return ['Velykyi Fontan','Odesa'];
  if(lat<=46.350)return ['Chornomorka','Odesa'];
  if(46.462<lat&&lat<46.500&&30.675<lon&&lon<=30.700)return ['Slobidka','Odesa'];
  if(46.420<lat&&lat<46.470&&30.640<lon&&lon<=30.700)return ['Malynovskyi District','Odesa'];
  return ['Odesa',''];
}
let toastT=0;
function toast(a,b){if(!a){return}$('tB').textContent=a;$('tS').textContent=b;$('toast').style.opacity=1;toastT=3.2}
let hudT=0,miniT=0;
function fmtDist(d){return d<1000?Math.round(d/10)*10+' m':(d/1000).toFixed(1)+' km'}
function updateHUD(dt){
  hudT-=dt;miniT-=dt;
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').style.opacity=0}
  if(hudT<=0){hudT=.3;
    const [n,s]=curIndoor?[curIndoor.title||curIndoor.name,curIndoor.sub||'']:districtOf(player.x,player.z);
    if(n!==lastDistrict){if(lastDistrict&&n!=='Chykalenka St, 59k')toast(n,s);lastDistrict=n;$('dName').textContent=n;$('dSub').textContent=s}
    const h=PLACES[0];const me=PORTAL.cur?PORTAL.ret||h:player;$('homeDir').textContent='Home · '+fmtDist(Math.hypot(h.x-me.x,h.z-me.z));
  }
  // interaction prompt
  let best=null,bd=1e9;for(const it of INTERACT){if(it.cond&&!it.cond())continue;const d=Math.hypot(it.x-player.x,it.z-player.z);if(d<it.r&&Math.abs((it.y||player.y)-player.y)<2.5&&d<bd){bd=d;best=it}}
  if(player.sit)best={label:'Stand up',fn:()=>{player.sit=null}};
  if(DRIVE.on)best={label:'Get out of the car',fn:exitCar};
  if(RIDE.on)best={label:RIDE.tram&&RIDE.tram.kind==='cable'?'Get off the cable car':'Get off the tram',fn:leaveTram};
  curAct=best;const ab=$('bAct');if(best){ab.hidden=false;ab.textContent=(TOUCH?'':'E · ')+best.label}else ab.hidden=true;
  if(miniT<=0){miniT=.1;drawMini()}
}
let curAct=null;
function doAction(){if(curAct)curAct.fn()}
function drawMini(){
  const cv=$('mini'),x=cv.getContext('2d'),W=cv.width,R=W/2,scale=R/170;
  x.save();x.clearRect(0,0,W,W);x.beginPath();x.arc(R,R,R,0,7);x.clip();
  const night=UNI.uNight.value>.5;
  x.fillStyle=night?'#13232a':'#d9d2c0';x.fillRect(0,0,W,W);
  if(PORTAL.cur){x.restore();x.save();x.translate(R,R);x.fillStyle='#0e4a5c';x.strokeStyle='#fff';x.lineWidth=3;x.rotate(-(player.yaw-cam.yaw));x.beginPath();x.moveTo(0,-14);x.lineTo(10,10);x.lineTo(0,5);x.lineTo(-10,10);x.closePath();x.fill();x.stroke();x.restore();return}
  x.translate(R,R);x.rotate(cam.yaw+Math.PI);
  x.fillStyle=night?'#0d3646':'#5d9db3';
  for(let j=-9;j<=9;j++)for(let i=-9;i<=9;i++){const wx=player.x+i*20,wz=player.z+j*20;if(sdAt(wx,wz)<0)x.fillRect(i*20*scale-10*scale,j*20*scale-10*scale,20.5*scale,20.5*scale)}
  const P=D.nodes,wn=D.wn;const id0=chunkIdAt(player.x,player.z);
  if(id0>=0){const i0=id0%NCX,j0=Math.floor(id0/NCX);
    x.fillStyle=night?'#2a3b42':'#b9b09c';
    const lim=R*1.5/scale;const drawP=cp=>{if(cp.maxx<player.x-lim||cp.minx>player.x+lim||cp.maxz<player.z-lim||cp.minz>player.z+lim)return;x.beginPath();for(const a of cp.rings){for(let i=0;i<a.length;i+=2){const px=(a[i]-player.x)*scale,pz=(a[i+1]-player.z)*scale;if(i)x.lineTo(px,pz);else x.moveTo(px,pz)}x.closePath()}x.fill('evenodd')};
    for(let j=j0-1;j<=j0+1;j++)for(let i=i0-1;i<=i0+1;i++){const c=chunks.get(j*NCX+i);if(!c)continue;for(const cp of c.cols)drawP(cp)}
    x.fillStyle=night?'#4a5258':'#a39983';for(const cp of STATIC_POLYS)drawP(cp);
    for(let q=0;q<STATIC_OBB.length;q+=6){const cx=(STATIC_OBB[q]-player.x)*scale,cz=(STATIC_OBB[q+1]-player.z)*scale;if(Math.abs(cx)>R*1.5||Math.abs(cz)>R*1.5)continue;
      x.save();x.translate(cx,cz);x.rotate(Math.atan2(STATIC_OBB[q+5],STATIC_OBB[q+4]));x.fillStyle=night?'#4a5258':'#a39983';x.fillRect(-STATIC_OBB[q+2]*scale,-STATIC_OBB[q+3]*scale,STATIC_OBB[q+2]*2*scale,STATIC_OBB[q+3]*2*scale);x.restore()}
    for(const pass of [3,2,1,0]){
      x.strokeStyle=night?(pass<2?'#c9b98a':'#6f7d80'):(pass<2?'#ffffff':'#f4efe4');x.lineWidth=[4.2,3.2,2.2,1.2][pass]*1.4;x.lineCap='round';x.beginPath();
      for(let j=j0-1;j<=j0+1;j++)for(let i=i0-1;i<=i0+1;i++){const id=j*NCX+i;if(id<0||id>=NCX*NCZ)continue;
        for(let s=D.segStart[id];s<D.segStart[id+1];s++){const r=D.seg[s],k=D.wOf[r];if(D.wcls[k]!==pass)continue;
          const a=wn[r]*2,b=wn[r+1]*2;x.moveTo((P[a]-player.x)*scale,(P[a+1]-player.z)*scale);x.lineTo((P[b]-player.x)*scale,(P[b+1]-player.z)*scale)}}
      x.stroke()}
  }
  const h=PLACES[0];let hx=(h.x-player.x)*scale,hz=(h.z-player.z)*scale;const hl=Math.hypot(hx,hz);if(hl>R-10){hx*=(R-10)/hl;hz*=(R-10)/hl}
  x.fillStyle='#f2c14e';x.strokeStyle='#0b1b22';x.lineWidth=3;x.beginPath();x.arc(hx,hz,9,0,7);x.fill();x.stroke();
  x.restore();
  x.save();x.translate(R,R);x.fillStyle='#0e4a5c';x.strokeStyle='#fff';x.lineWidth=3;x.rotate(-(player.yaw-cam.yaw));
  x.beginPath();x.moveTo(0,-14);x.lineTo(10,10);x.lineTo(0,5);x.lineTo(-10,10);x.closePath();x.fill();x.stroke();x.restore();
}
// ---------- big map ----------
const MAPV={cx:0,cz:0,s:.05,sel:null};
function mapFit(){const w=$('bigmap').clientWidth,h=$('bigmap').clientHeight;const xs=[-8000,6200],zs=[-24500,5000];MAPV.cx=(xs[0]+xs[1])/2;MAPV.cz=(zs[0]+zs[1])/2;MAPV.s=Math.min(w/(xs[1]-xs[0]),h/(zs[1]-zs[0]))*.95}
let mapSea=null;
function seaImage(){if(mapSea)return mapSea;const tw=D.tw,th=D.th;const c=document.createElement('canvas');c.width=tw;c.height=th;const x=c.getContext('2d');const im=x.createImageData(tw,th);
  for(let i=0;i<tw*th;i++){const sea=D.ter[i]<0;im.data[i*4]=sea?18:30;im.data[i*4+1]=sea?72:44;im.data[i*4+2]=sea?92:46;im.data[i*4+3]=255}x.putImageData(im,0,0);mapSea=c;return c}
function drawBigMap(){
  const cv=$('bigmap');const dpr=Math.min(2,window.devicePixelRatio||1);const W=cv.clientWidth,H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;
  const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);
  const s=MAPV.s,ox=W/2-MAPV.cx*s,oz=H/2-MAPV.cz*s;
  x.fillStyle='#1e2c2e';x.fillRect(0,0,W,H);
  const im=seaImage(),ix=ox+BB[0]*s,iz=oz+BB[2]*s,iw=D.tw*20*s,ih=D.th*20*s;
  x.fillStyle='#12485c';x.fillRect(ix+iw-1,0,W,H);
  x.imageSmoothingEnabled=true;x.drawImage(im,ix,iz,iw,ih);
  if(iz>0)x.drawImage(im,0,0,D.tw,1,ix,0,iw,iz+1);
  if(iz+ih<H)x.drawImage(im,0,D.th-1,D.tw,1,ix,iz+ih-1,iw,H-(iz+ih)+1);
  const P=D.nodes,ws=D.wstart,wn=D.wn;
  for(const pass of [3,2,1,0]){
    if(pass===3&&s<.12)continue;
    x.strokeStyle=['#f2c14e','#e8e2d0','#a8b3b0','#5d6b6b'][pass];x.lineWidth=Math.max(.6,[2.6,1.6,1,.8][pass]*Math.min(3,s*14));x.beginPath();
    for(let k=0;k<HDR.nWays;k++){if(D.wcls[k]!==pass)continue;const a=ws[k];x.moveTo(ox+P[wn[a]*2]*s,oz+P[wn[a]*2+1]*s);for(let i=a+1;i<ws[k+1];i++)x.lineTo(ox+P[wn[i]*2]*s,oz+P[wn[i]*2+1]*s)}
    x.stroke();
  }
  x.font='600 12px "Golos Text",sans-serif';x.textBaseline='middle';
  for(const p of PLACES){const px=ox+p.x*s,pz=oz+p.z*s;x.fillStyle=p.id==='home'?'#f2c14e':'#fff';x.strokeStyle='#0b1b22';x.lineWidth=3;x.beginPath();x.arc(px,pz,p.id==='home'?7:5,0,7);x.fill();x.stroke();
    x.lineWidth=4;x.strokeText(p.name,px+9,pz);x.fillText(p.name,px+9,pz)}
  const px=ox+player.x*s,pz=oz+player.z*s;x.save();x.translate(px,pz);x.rotate(-player.yaw+Math.PI);x.fillStyle='#4ad0e6';x.strokeStyle='#0b1b22';x.lineWidth=2.5;
  x.beginPath();x.moveTo(0,-11);x.lineTo(8,8);x.lineTo(0,4);x.lineTo(-8,8);x.closePath();x.fill();x.stroke();x.restore();
  if(MAPV.sel){const qx=ox+MAPV.sel[0]*s,qz=oz+MAPV.sel[1]*s;x.strokeStyle='#f2c14e';x.lineWidth=3;x.beginPath();x.arc(qx,qz,10,0,7);x.stroke();x.beginPath();x.moveTo(qx,qz-16);x.lineTo(qx,qz+16);x.moveTo(qx-16,qz);x.lineTo(qx+16,qz);x.stroke()}
}
function nearestRoadPoint(x,z){
  let best=null,bd=1e18;const P=D.nodes;const id0=chunkIdAt(x,z);if(id0<0)return null;const i0=id0%NCX,j0=Math.floor(id0/NCX);
  for(let r=0;r<4&&!best;r++)for(let j=j0-r;j<=j0+r;j++)for(let i=i0-r;i<=i0+r;i++){if(i<0||j<0||i>=NCX||j>=NCZ)continue;const id=j*NCX+i;
    for(let s=D.segStart[id];s<D.segStart[id+1];s++){const q=D.seg[s];const k=D.wOf[q];if(D.wcls[k]>2)continue;const n=D.wn[q];const d=(P[n*2]-x)**2+(P[n*2+1]-z)**2;if(d<bd){bd=d;best=[P[n*2],P[n*2+1]]}}}
  return best;
}
function openMap(){$('mapUI').hidden=false;MAPV.sel=null;$('goHere').hidden=true;if(!MAPV.inited){mapFit();MAPV.inited=true}drawBigMap()}
function closeMap(){$('mapUI').hidden=true}
function buildPlaceList(){const L=$('placeList');L.innerHTML='';
  for(const p of PLACES){const b=document.createElement('button');b.className='place';const t=document.createElement('span');t.textContent=p.name;const s=document.createElement('small');s.textContent=p.sub||'';b.append(t,s);b.onclick=()=>{closeMap();teleport(p)};L.appendChild(b)}}
// ---------- input ----------
const TOUCH_LOOK={active:false,id:null,x:0,y:0};
function setupInput(){
  addEventListener('keydown',e=>{if(!started)return;inp.k[e.code]=true;
    if(e.code==='Space'){inp.jump=true;e.preventDefault()}
    if(e.code==='KeyE')doAction();
    if(e.code==='KeyF')toggleScoot();
    if(e.code==='KeyC')toggleCar();
    if(e.code==='KeyQ'&&(typeof SPK!=='undefined')&&SPK)SPK.toggleCarry();
    if(e.code==='KeyN'&&(typeof SPK!=='undefined')&&SPK)SPK.next();
    if(e.code==='KeyP'&&(typeof SPK!=='undefined')&&SPK)SPK.togglePlay();
    if(e.code==='KeyM'){$('mapUI').hidden?openMap():closeMap()}
    if(e.code==='KeyT')cycleTime();
    if(e.code==='Escape')closeMap();});
  addEventListener('keyup',e=>{inp.k[e.code]=false});
  addEventListener('blur',()=>{inp.k={}});
  const cv=$('c');
  cv.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;inp.dragging=true;inp.mx=e.clientX;inp.my=e.clientY;cv.setPointerCapture(e.pointerId)});
  cv.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!inp.dragging)return;cam.yaw-=(e.clientX-inp.mx)*.006;cam.pitch=Math.max(-.3,Math.min(1.25,cam.pitch+(e.clientY-inp.my)*.005));inp.mx=e.clientX;inp.my=e.clientY});
  cv.addEventListener('pointerup',()=>{inp.dragging=false});
  cv.addEventListener('wheel',e=>{cam.dist=Math.max(2.2,Math.min(14,cam.dist*(1+Math.sign(e.deltaY)*.1)));e.preventDefault()},{passive:false});
  const jz=$('joy'),jb=$('joyBase'),jk=$('joyKnob');let jid=null,jx0=0,jy0=0;
  jz.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;jid=e.pointerId;jx0=e.clientX;jy0=e.clientY;jb.style.display='block';jb.style.left=jx0+'px';jb.style.top=jy0+'px';jz.setPointerCapture(e.pointerId);$('joyHint').hidden=true;e.preventDefault()});
  jz.addEventListener('pointermove',e=>{if(e.pointerId!==jid)return;let dx=e.clientX-jx0,dy=e.clientY-jy0;const l=Math.hypot(dx,dy),m=52;if(l>m){dx*=m/l;dy*=m/l}jk.style.transform=`translate(${dx}px,${dy}px)`;inp.jx=dx/m;inp.jy=-dy/m});
  const jend=e=>{if(e.pointerId!==jid)return;jid=null;inp.jx=inp.jy=0;jb.style.display='none';jk.style.transform=''};
  jz.addEventListener('pointerup',jend);jz.addEventListener('pointercancel',jend);
  cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||TOUCH_LOOK.active)return;TOUCH_LOOK.active=true;TOUCH_LOOK.id=e.pointerId;TOUCH_LOOK.x=e.clientX;TOUCH_LOOK.y=e.clientY;cv.setPointerCapture(e.pointerId)});
  cv.addEventListener('pointermove',e=>{if(!TOUCH_LOOK.active||e.pointerId!==TOUCH_LOOK.id)return;cam.yaw-=(e.clientX-TOUCH_LOOK.x)*.008;cam.pitch=Math.max(-.3,Math.min(1.25,cam.pitch+(e.clientY-TOUCH_LOOK.y)*.006));TOUCH_LOOK.x=e.clientX;TOUCH_LOOK.y=e.clientY});
  const tend=e=>{if(e.pointerId===TOUCH_LOOK.id){TOUCH_LOOK.active=false;TOUCH_LOOK.id=null}};
  cv.addEventListener('pointerup',tend);cv.addEventListener('pointercancel',tend);
  $('bRun').onclick=()=>{player.run=!player.run;$('bRun').classList.toggle('on',player.run)};
  $('bJump').addEventListener('pointerdown',e=>{inp.jump=true;if(DRIVE.on)inp.hb=true;e.preventDefault()});
  for(const ev of ['pointerup','pointercancel','pointerleave'])$('bJump').addEventListener(ev,()=>{inp.hb=false});
  $('bCar').onclick=toggleCar;
  $('bScoot').onclick=toggleScoot;$('bAct').onclick=doAction;
  $('bSpk').onclick=()=>{if((typeof SPK!=='undefined')&&SPK)SPK.panel()};
  $('bMap').onclick=openMap;$('mapClose').onclick=closeMap;
  $('bTime').onclick=cycleTime;
  $('bMenu').onclick=()=>{started=false;COOP.push(true);$('menu').hidden=false;$('hud').hidden=true;$('bStart').textContent='Continue'};
  $('mapMe').onclick=()=>{MAPV.cx=player.x;MAPV.cz=player.z;MAPV.s=.6;drawBigMap()};
  $('mapFit').onclick=()=>{mapFit();drawBigMap()};
  const bm=$('bigmap');const pts=new Map();let moved=0,pinch0=null;
  bm.addEventListener('pointerdown',e=>{pts.set(e.pointerId,[e.clientX,e.clientY]);moved=0;bm.setPointerCapture(e.pointerId);if(pts.size===2){const [a,b]=[...pts.values()];pinch0={d:Math.hypot(a[0]-b[0],a[1]-b[1]),s:MAPV.s}}});
  bm.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const p=pts.get(e.pointerId);const dx=e.clientX-p[0],dy=e.clientY-p[1];
    if(pts.size===1){MAPV.cx-=dx/MAPV.s;MAPV.cz-=dy/MAPV.s;moved+=Math.abs(dx)+Math.abs(dy)}pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===2&&pinch0){const [a,b]=[...pts.values()];MAPV.s=Math.max(.02,Math.min(3,pinch0.s*Math.hypot(a[0]-b[0],a[1]-b[1])/pinch0.d));moved=99}drawBigMap()});
  const up=e=>{if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);if(pts.size<2)pinch0=null;
    if(moved<6&&pts.size===0){const r=bm.getBoundingClientRect();const wx=(e.clientX-r.left-r.width/2)/MAPV.s+MAPV.cx,wz=(e.clientY-r.top-r.height/2)/MAPV.s+MAPV.cz;const np=nearestRoadPoint(wx,wz);if(np){MAPV.sel=np;$('goHere').hidden=false;drawBigMap()}}};
  bm.addEventListener('pointerup',up);bm.addEventListener('pointercancel',up);
  bm.addEventListener('wheel',e=>{MAPV.s=Math.max(.02,Math.min(3,MAPV.s*(e.deltaY<0?1.15:1/1.15)));drawBigMap();e.preventDefault()},{passive:false});
  $('goHere').onclick=()=>{if(!MAPV.sel)return;const [x,z]=MAPV.sel;closeMap();teleport({x,z,yaw:cam.yaw,name:districtOf(x,z)[0],sub:'from the map'})};
}
function toggleScoot(){if(player.sit||DRIVE.on||PORTAL.cur||RIDE.on)return;player.scoot=!player.scoot;$('bScoot').classList.toggle('on',player.scoot);if((typeof AUD!=='undefined')&&AUD)AUD.scoot(player.scoot)}
function cycleTime(){const o=['day','dusk','night'];S.time=o[(o.indexOf(S.time)+1)%3];saveS();applyTime()}
// ---------- adaptive resolution ----------
let ftAcc=0,ftN=0,ftT=0;
function adaptRes(dt){ftAcc+=dt;ftN++;ftT+=dt;if(ftT<2.5)return;const avg=ftAcc/ftN;ftAcc=ftN=ftT=0;
  if(pixelScale<=.56&&avg>.05&&S.q!=='low'){adaptRes.slow=(adaptRes.slow||0)+1;if(adaptRes.slow>=2){adaptRes.slow=0;S.q=S.q==='high'?'mid':'low';saveS();document.querySelectorAll('[data-g]').forEach(q=>q.classList.toggle('on',q.dataset.g===S.q));pixelScale=1;applyQuality();applyTime();toast('Graphics lowered','to keep the game smooth');return}}else adaptRes.slow=0;
  let ns=pixelScale;if(avg>.045)ns=Math.max(.55,pixelScale-.1);else if(avg<.022)ns=Math.min(1,pixelScale+.05);
  if(Math.abs(ns-pixelScale)>.01){pixelScale=ns;const pr=Math.min(window.devicePixelRatio||1,Qp().pr)*pixelScale;renderer.setPixelRatio(pr);renderer.setSize(innerWidth,innerHeight);
    if(composer){composer.setPixelRatio(pr);composer.setSize(innerWidth,innerHeight);if(fxaaPass)fxaaPass.uniforms.resolution.value.set(1/(innerWidth*pr),1/(innerHeight*pr))}}}
// ---------- init ----------
async function boot(){
  try{COOP.initMenu()}catch(e){console.error('coop menu',e)}
  try{GUN.build()}catch(e){console.error('guns build',e)}
  try{HS.build()}catch(e){console.error('hs build',e)}
  try{await decodeData()}catch(e){$('bStart').textContent='Couldn\'t load the map';console.error(e);return}
  $('bStart').textContent='Painting textures…';await new Promise(r=>setTimeout(r,30));
  genTextures();try{await document.fonts.ready}catch(e){}genSignAtlas();genProductAtlas();
  setupRenderer();
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0xbcd0dc,.0026);
  camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.3,5000);
  sunL=new THREE.DirectionalLight(0xffffff,3);scene.add(sunL);scene.add(sunL.target);
  hemiL=new THREE.HemisphereLight(0xbcd0ff,0x6b5b4b,1);scene.add(hemiL);
  initMats();LEAF_DEPTH=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:TX.leaves,alphaTest:.45});
  makeTreeSpecies();TREES.init(scene);makeSkies();makeSea();makeSnow();
  $('bStart').textContent='Building the city…';await new Promise(r=>setTimeout(r,30));
  buildAllLandmarks(scene);try{initTrams()}catch(e){console.error('trams',e)}
  PLR=makePlayer();PLR.root.traverse(o=>{if(o.isMesh){o.castShadow=true}});scene.add(PLR.root);
  initPeopleMeshes(scene,100);initCarMeshes(scene,20);
  applyQuality();applyTime();
  const h=PLACES[0];teleportRaw(h.x,h.z,h.yaw);
  buildPlaceList();
  window.addEventListener('resize',onResize);
  setupInput();
  if((typeof SPK!=='undefined')&&SPK)SPK.init(scene);
  $('bStart').disabled=false;$('bStart').textContent='Play';
  requestAnimationFrame(loop);
  COOP.init();
}
let last=performance.now();
function loop(t){
  requestAnimationFrame(loop);
  let dt=Math.min(.05,(t-last)/1000);last=t;
  UNI.uTime.value+=dt;
  if(started&&$('mapUI').hidden){
    refreshCarObb();if(DRIVE.on)stepDrive(dt);else if(!RIDE.on)stepPlayer(dt);
    if(PORTAL.cur){stepIntPeds(dt);placePeople(PORTAL.peds)}
    else{updateCars(dt,player,Qp().cars);updatePeds(dt,player,Qp().peds);if(typeof updateTrams!=='undefined')updateTrams(dt);if(PARKED_DIRTY||(lightTick%60===0)){refreshParked(chunks,player.x,player.z);PARKED_DIRTY=false}dodgeCar(PEDS);dodgeCar(TALKERS);placeCars(DRIVE.car?CARS.concat([DRIVE.car]):CARS);updateRoutePlates(scene,player);placePeople(crowdList());
      TREES.update(player.x,player.z,Qp().trees)}
    updateIndoor(dt);updateHUD(dt);COOP.update(dt);
    if((typeof SPK!=='undefined')&&SPK)SPK.update(dt);
    if((typeof AUD!=='undefined')&&AUD)AUD.update(dt);
    adaptRes(dt);
  } else if(!started)cam.yaw+=dt*.06;
  if(typeof LAND_UPDATE!=='undefined')LAND_UPDATE(dt);
  updateChunks(started?7:4);
  stepCamera(dt);
  if((lightTick++)%10===0)updateLampUniforms();
  if(DRIVE.on&&UNI.uNight.value>.3){const c=DRIVE.car,[hx,hz]=carAhead(c,7.5);UNI.uL.value[15].set(hx,c.y+2.6,hz,3.6);DRIVE.hl=true}else if(DRIVE.hl){DRIVE.hl=false;updateLampUniforms()}
  sky.position.copy(camera.position);nightSky.position.copy(camera.position);
  seaMesh.position.x=Math.round(camera.position.x/100)*100;seaMesh.position.z=Math.round(camera.position.z/100)*100;
  if(sunL.castShadow){const q=Qp(),tx=2*q.sr/q.shadow;_SL.copy(sunDir).normalize();_SU.set(0,1,0);if(Math.abs(_SL.y)>.99)_SU.set(1,0,0);
    _SR.crossVectors(_SU,_SL).normalize();_SV.crossVectors(_SL,_SR);_ST.set(player.x,player.y,player.z);const a=_ST.dot(_SR),b=_ST.dot(_SV);
    _ST.addScaledVector(_SR,Math.round(a/tx)*tx-a).addScaledVector(_SV,Math.round(b/tx)*tx-b);   // snap to shadow texels: no crawling shadows
    sunL.target.position.copy(_ST);sunL.position.copy(_ST).addScaledVector(_SL,300);}
  else sunL.position.copy(sunDir).multiplyScalar(300).add(camera.position);
  updateSnow(dt);
  renderer.info.reset();if(composer)composer.render();else renderer.render(scene,camera);
}
document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{S.time=b.dataset.t;saveS();if(renderer)applyTime()});
document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{S.season=b.dataset.s;saveS();if(renderer)applyTime()});
document.querySelectorAll('[data-g]').forEach(b=>{b.classList.toggle('on',b.dataset.g===S.q);b.onclick=()=>{S.q=b.dataset.g;saveS();document.querySelectorAll('[data-g]').forEach(q=>q.classList.toggle('on',q.dataset.g===S.q));if(renderer){pixelScale=1;applyQuality();applyTime()}}});
if(TOUCH)$('keysTxt').textContent='Left half of the screen — walk, right half — turn the camera. The yellow button enters buildings and shops, sits on benches or boards the tram. In the car, “Jump” is the handbrake.';
$('bStart').onclick=()=>{if(!renderer)return;started=true;$('menu').hidden=true;$('hud').hidden=false;
  if((typeof AUD!=='undefined')&&AUD)AUD.start();
  if(!boot.greeted){boot.greeted=true;cam.yaw=player.yaw;toast('Chykalenka St, 59k','formerly Williams St · Tairove')}
  COOP.onStart()};
