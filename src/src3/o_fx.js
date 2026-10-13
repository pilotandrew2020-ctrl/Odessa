// ===================== realistic explosions (fireball, smoke column, shockwave, debris, sparks, scorch, flying wall chunks that come back) =====================
const FX={ready:false,sp:[],free:[],act:[],deb:[],chunks:[],scorch:[],sparks:null,sN:0,shakeT:0,shakeA:0,rings:[],tex:{},sh:new THREE.Vector3(),ac:null,
  mkTex(kind){
    const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
    if(kind==='puff'){
      const rr=(()=>{let s=7;return()=>{s=(s*16807)%2147483647;return s/2147483647}})();
      for(let i=0;i<26;i++){const a=rr()*6.283,d=rr()*34,cx=64+Math.cos(a)*d,cy=64+Math.sin(a)*d,r=22+rr()*26;const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(.6,'rgba(255,255,255,.22)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
      // soft vignette so the sprite edge never shows
      const g=x.createRadialGradient(64,64,30,64,64,64);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');x.globalCompositeOperation='destination-out';x.fillStyle=g;x.fillRect(0,0,128,128)}
    else if(kind==='spark'){const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,220,140,.9)');g.addColorStop(1,'rgba(255,120,20,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
    else if(kind==='ring'){const g=x.createRadialGradient(64,64,40,64,64,64);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.7,'rgba(255,255,255,.9)');g.addColorStop(.85,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
    else if(kind==='scorch'){const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(10,8,6,.95)');g.addColorStop(.55,'rgba(14,11,8,.7)');g.addColorStop(1,'rgba(14,11,8,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t},
  init(){
    if(this.ready)return;this.ready=true;
    for(const k of ['puff','spark','ring','scorch'])this.tex[k]=this.mkTex(k);
    for(let i=0;i<150;i++){const m=new THREE.SpriteMaterial({map:this.tex.puff,transparent:true,depthWrite:false,fog:true});const s=new THREE.Sprite(m);s.visible=false;s.renderOrder=3;scene.add(s);this.sp.push(s);this.free.push(s)}
    // sparks: one Points object for everything
    const N=420;const geo=new THREE.BufferGeometry();this.sPos=new Float32Array(N*3);this.sCol=new Float32Array(N*3);this.sVel=new Float32Array(N*3);this.sLife=new Float32Array(N);
    geo.setAttribute('position',new THREE.BufferAttribute(this.sPos,3));geo.setAttribute('color',new THREE.BufferAttribute(this.sCol,3));
    this.sparks=new THREE.Points(geo,new THREE.PointsMaterial({size:.32,map:this.tex.spark,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true,fog:false}));this.sparks.frustumCulled=false;this.sparks.renderOrder=4;scene.add(this.sparks);this.sN=N;
    for(let i=0;i<N;i++)this.sPos[i*3+1]=-9999;
    const dm=[0x3a3631,0x6a5a48,0x8b8272].map(c=>new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),roughness:.9}));
    const bg=new THREE.BoxGeometry(1,1,1);
    for(let i=0;i<34;i++){const m=new THREE.Mesh(bg,dm[i%3]);m.visible=false;m.castShadow=true;scene.add(m);this.deb.push({m,on:false,v:new THREE.Vector3(),w:new THREE.Vector3(),t:0})}
    const cm=[0xd2c8a8,0xdad2bd,0xbfae8e,0xa59985].map(c=>new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),roughness:.95}));
    const dk=new THREE.MeshStandardMaterial({color:new THREE.Color(0x2a2520).convertSRGBToLinear(),roughness:1});
    for(let i=0;i<40;i++){const m=new THREE.Mesh(bg,[cm[i%4],cm[(i+1)%4],cm[i%4],dk,cm[(i+2)%4],cm[i%4]]);m.visible=false;m.castShadow=true;scene.add(m);this.chunks.push({m,on:false,v:new THREE.Vector3(),w:new THREE.Vector3(),o:new THREE.Vector3(),t:0,ph:0})}
    const rg=new THREE.PlaneGeometry(1,1);rg.rotateX(-Math.PI/2);
    for(let i=0;i<4;i++){const m=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({map:this.tex.ring,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,color:0xffe9c0}));m.visible=false;m.renderOrder=2;scene.add(m);this.rings.push({m,on:false,t:0,r:1})}
    for(let i=0;i<6;i++){const m=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({map:this.tex.scorch,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));m.visible=false;m.renderOrder=1;scene.add(m);this.scorch.push({m,on:false,t:0})}
  },
  puff(o){// o: {x,y,z,vx,vy,vz,s0,s1,life,c0,c1,op,add,delay,drag,grow}
    let sp=this.free.pop();if(!sp)return;sp.visible=false;this.act.push(Object.assign({s:sp,t:-(o.delay||0)},o));},
  explode(x,y,z,r){
    this.init();const k=Math.max(.5,r/7);const R=Math.random;const gy=groundH(x,z);const air=Math.max(0,y-gy);
    const near=Math.hypot(x-player.x,z-player.z);
    // flash
    this.puff({x,y,z,vx:0,vy:0,vz:0,s0:r*.8,s1:r*3.2,life:.16,c0:[1,.97,.82],c1:[1,.8,.4],op:1,add:true,drag:0});
    // fireball
    for(let i=0;i<9+((k*5)|0);i++){const a=R()*6.283,e=R()*1.2-.2,sp=(2+R()*5)*k;
      this.puff({x:x+Math.cos(a)*.6*k,y:y+.3+R()*.6*k,z:z+Math.sin(a)*.6*k,vx:Math.cos(a)*Math.cos(e)*sp,vy:Math.abs(Math.sin(e))*sp*.8+2.5*k,vz:Math.sin(a)*Math.cos(e)*sp,s0:r*(.6+R()*.4),s1:r*(2.1+R()*1.1),life:.9+R()*.6,c0:[1,.92,.55],c1:[.55,.12,.03],op:.95,add:true,drag:2.2,grow:1})}
    // hot dark core + rising black smoke column
    for(let i=0;i<14+((k*8)|0);i++){const a=R()*6.283,sp=(.8+R()*2.5)*k;const lift=2.5+R()*4.5;
      this.puff({x:x+Math.cos(a)*.8*k,y:y+.5*k,z:z+Math.sin(a)*.8*k,vx:Math.cos(a)*sp,vy:lift*k*.9,vz:Math.sin(a)*sp,s0:r*(.5+R()*.4),s1:r*(2.2+R()*1.4),life:4.2+R()*3.2,c0:[.16,.14,.12],c1:[.46,.45,.44],op:.8,add:false,drag:.45,delay:.12+R()*.5,grow:1,riseDecay:1})}
    // pale dust + ground cloud rolling outwards
    if(air<r){for(let i=0;i<12;i++){const a=i/12*6.283+R()*.4,sp=(8+R()*6)*k;
      this.puff({x:x+Math.cos(a)*1.2,y:gy+.6,z:z+Math.sin(a)*1.2,vx:Math.cos(a)*sp,vy:.5+R()*.9,vz:Math.sin(a)*sp,s0:r*.45,s1:r*1.5,life:1.5+R()*.8,c0:[.62,.55,.45],c1:[.5,.46,.4],op:.62,add:false,drag:3,delay:.04,grow:1})}}
    // shockwave ring
    {const rg=this.rings.find(q=>!q.on)||this.rings[0];rg.on=true;rg.t=0;rg.r=r;rg.m.position.set(x,Math.max(gy,y-1)+.12,z);rg.m.visible=true;rg.m.scale.set(1,1,1)}
    // sparks / embers
    for(let n=0,i=0;n<70+((k*50)|0);n++){let q=-1;for(let j=0;j<this.sN;j++){const idx=(this.sCur=(this.sCur+1)%this.sN);if(this.sLife[idx]<=0){q=idx;break}}if(q<0)break;
      const a=R()*6.283,e=R()*1.4,sp=(8+R()*20)*k;this.sPos[q*3]=x;this.sPos[q*3+1]=y+.4;this.sPos[q*3+2]=z;this.sVel[q*3]=Math.cos(a)*Math.cos(e)*sp;this.sVel[q*3+1]=Math.sin(e)*sp*.9+3;this.sVel[q*3+2]=Math.sin(a)*Math.cos(e)*sp;this.sLife[q]=.7+R()*1.5}
    // debris chunks (ground / rubble)
    for(let n=0;n<14+((k*10)|0);n++){const d=this.deb.find(q=>!q.on);if(!d)break;const a=R()*6.283,sp=(5+R()*11)*k;d.on=true;d.t=0;const sc=.08+R()*.28*k;d.m.scale.set(sc*(.6+R()),sc*(.5+R()),sc*(.6+R()));
      d.m.position.set(x+Math.cos(a)*.5,y+.4,z+Math.sin(a)*.5);d.v.set(Math.cos(a)*sp,6+R()*12*k,Math.sin(a)*sp);d.w.set(R()*14-7,R()*14-7,R()*14-7);d.m.visible=true}
    // scorch mark on the ground
    if(air<2.5){const s=this.scorch.find(q=>!q.on)||this.scorch[0];s.on=true;s.t=0;s.m.position.set(x,gy+.07,z);s.m.scale.set(r*1.9,1,r*1.9);s.m.rotation.y=R()*6.28;s.m.material.opacity=.8;s.m.visible=true}
    if(r>=18)this.mushroom(x,y,z,r);
    this.wallChunks(x,y,z,r);
    // camera shake + sound
    const sh=Math.max(0,1-near/(r*10));if(sh>0){this.shakeT=Math.max(this.shakeT,.5+sh*.7);this.shakeA=Math.max(this.shakeA,sh*(r/7)*.55)}
    this.sound(near,r)},
  mushroom(x,y,z,r){const R=Math.random;
    for(let i=0;i<26;i++){const a=R()*6.283,d=R()*r*.12;this.puff({x:x+Math.cos(a)*d,y:y+i*r*.07,z:z+Math.sin(a)*d,vx:0,vy:r*(.28+R()*.08),vz:0,s0:r*.5,s1:r*1.1,life:9,c0:[.78,.32,.08],c1:[.24,.23,.22],op:.85,add:false,drag:.2,delay:i*.09,grow:1})}
    for(let i=0;i<40;i++){const a=i/40*6.283+R()*.3,sp=r*(.2+R()*.18);this.puff({x:x,y:y+r*.9,z:z,vx:Math.cos(a)*sp,vy:r*(.42+R()*.1),vz:Math.sin(a)*sp,s0:r*.7,s1:r*(1.9+R()*.6),life:10,c0:[.85,.4,.1],c1:[.3,.29,.28],op:.85,add:false,drag:.45,delay:.9+R()*.8,grow:1,riseDecay:1})}
    for(let i=0;i<12;i++){const a=R()*6.283,sp=r*.3;this.puff({x,y:y+1,z,vx:Math.cos(a)*sp,vy:r*.15,vz:Math.sin(a)*sp,s0:r*.9,s1:r*3.2,life:1.4,c0:[1,.8,.4],c1:[.6,.15,.04],op:.9,add:true,drag:1.2,grow:1})}},
  // pieces of whatever solid building is near the blast fly off, tumble, then fly back (purely visual: the real buildings never break)
  wallChunks(x,y,z,r){
    if(typeof insideAny!=='function')return;const R=Math.random;let spawned=0;const want=r>12?30:12;
    for(let t=0;t<90&&spawned<want;t++){const a=R()*6.283,d=1.5+R()*Math.min(r*1.4,18),py=y+(R()-.4)*Math.min(8,r);const px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;
      if(py<groundH(px,pz)+.6||!insideAny(px,pz,.1,py))continue;
      const c=this.chunks.find(q=>!q.on);if(!c)break;spawned++;c.on=true;c.t=0;c.ph=0;c.o.set(px,py,pz);const sz=.5+R()*1.3*Math.max(1,r/10);c.m.scale.set(sz,sz*(.6+R()*.6),sz*(.6+R()*.8));c.m.position.copy(c.o);c.m.rotation.set(0,0,0);
      const dx=px-x,dz=pz-z,dl=Math.hypot(dx,dz)||1,sp=(3+R()*8)*Math.max(1,r/8);c.v.set(dx/dl*sp,3+R()*8,dz/dl*sp);c.w.set(R()*6-3,R()*6-3,R()*6-3);c.m.visible=true;
      // dust where it left the wall
      this.puff({x:px,y:py,z:pz,vx:dx/dl*2,vy:1.2,vz:dz/dl*2,s0:1.2,s1:3.6,life:1.4,c0:[.7,.65,.55],c1:[.55,.5,.45],op:.55,add:false,drag:1.5,grow:1})}},
  // ---------- sound: thump + crack + rumbling tail, delayed by distance ----------
  sound(dist,r){
    try{if(!this.ac){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ac=(typeof GUN!=='undefined'&&GUN.ac)||new C()}const ac=this.ac;if(ac.state==='suspended')ac.resume();
      const vol=Math.min(1,.25+r/10)/(1+dist/45),delay=Math.min(.9,dist/343);if(vol<.02)return;
      const T=ac.currentTime+delay,out=ac.createGain();out.gain.value=vol;
      const comp=ac.createDynamicsCompressor();out.connect(comp);comp.connect(ac.destination);
      // sub thump
      const o=ac.createOscillator(),og=ac.createGain();o.type='sine';o.frequency.setValueAtTime(95,T);o.frequency.exponentialRampToValueAtTime(26,T+.55);og.gain.setValueAtTime(1.6,T);og.gain.exponentialRampToValueAtTime(.001,T+.9);o.connect(og);og.connect(out);o.start(T);o.stop(T+1);
      // body: low-passed noise whose cutoff falls
      const dur=Math.min(4.5,2.2+r*.12),n=Math.floor(ac.sampleRate*dur),buf=ac.createBuffer(1,n,ac.sampleRate),d=buf.getChannelData(0);let b0=0;
      for(let i=0;i<n;i++){const t=i/n;b0=b0*.985+(Math.random()*2-1)*.1;d[i]=(b0*3+(Math.random()*2-1)*.35*Math.pow(1-t,3))*Math.pow(1-t,1.4)}
      const s=ac.createBufferSource();s.buffer=buf;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(1800,T);f.frequency.exponentialRampToValueAtTime(110,T+dur);const g=ac.createGain();g.gain.setValueAtTime(1.3,T);g.gain.exponentialRampToValueAtTime(.002,T+dur);s.connect(f);f.connect(g);g.connect(out);s.start(T);
      // crack
      const n2=Math.floor(ac.sampleRate*.22),b2=ac.createBuffer(1,n2,ac.sampleRate),d2=b2.getChannelData(0);for(let i=0;i<n2;i++)d2[i]=(Math.random()*2-1)*Math.pow(1-i/n2,4);
      const s2=ac.createBufferSource();s2.buffer=b2;const f2=ac.createBiquadFilter();f2.type='highpass';f2.frequency.value=900;const g2=ac.createGain();g2.gain.value=.9;s2.connect(f2);f2.connect(g2);g2.connect(out);s2.start(T)
    }catch(e){}},
  launch(){try{if(!this.ac){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ac=(typeof GUN!=='undefined'&&GUN.ac)||new C()}const ac=this.ac;if(ac.state==='suspended')ac.resume();
      const dur=.9,n=Math.floor(ac.sampleRate*dur),buf=ac.createBuffer(1,n,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++){const t=i/n;d[i]=(Math.random()*2-1)*Math.min(1,t*12)*Math.pow(1-t,1.5)}
      const s=ac.createBufferSource();s.buffer=buf;const f=ac.createBiquadFilter();f.type='bandpass';f.Q.value=.8;f.frequency.setValueAtTime(500,ac.currentTime);f.frequency.exponentialRampToValueAtTime(2600,ac.currentTime+.5);
      const g=ac.createGain();g.gain.value=.7;s.connect(f);f.connect(g);g.connect(ac.destination);s.start()}catch(e){}},
  shakeOff(dt){if(this.shakeT<=0)return null;this.shakeT-=dt;const k=Math.min(1,this.shakeT/.6)*this.shakeA;this.sh.set((Math.random()-.5)*k,(Math.random()-.5)*k,(Math.random()-.5)*k);return this.sh},
  update(dt){
    if(!this.ready)return;
    for(let i=this.act.length-1;i>=0;i--){const a=this.act[i];a.t+=dt;if(a.t<0)continue;const sp=a.s;const u=a.t/a.life;
      if(u>=1){sp.visible=false;this.free.push(sp);this.act.splice(i,1);continue}
      sp.visible=true;const dr=Math.exp(-(a.drag||0)*dt);a.vx*=dr;a.vz*=dr;a.vy*=a.riseDecay?Math.exp(-.35*dt):dr;a.x+=a.vx*dt;a.y+=a.vy*dt;a.z+=a.vz*dt;
      const e=a.grow?1-Math.pow(1-Math.min(1,u*1.4),2.2):u;const s=a.s0+(a.s1-a.s0)*e;sp.position.set(a.x,a.y,a.z);sp.scale.set(s,s,1);
      const m=sp.material;m.color.setRGB(a.c0[0]+(a.c1[0]-a.c0[0])*Math.min(1,u*1.6),a.c0[1]+(a.c1[1]-a.c0[1])*Math.min(1,u*1.6),a.c0[2]+(a.c1[2]-a.c0[2])*Math.min(1,u*1.6));
      m.opacity=a.op*(a.add?Math.pow(1-u,1.6):(u<.12?u/.12:Math.pow(1-u,1.2)))}
    // sparks
    if(this.sparks){let any=false;for(let i=0;i<this.sN;i++){let L=this.sLife[i];if(L<=0)continue;any=true;L-=dt;this.sLife[i]=L;const j=i*3;
        this.sVel[j+1]-=16*dt;this.sPos[j]+=this.sVel[j]*dt;this.sPos[j+1]+=this.sVel[j+1]*dt;this.sPos[j+2]+=this.sVel[j+2]*dt;
        const g=groundH(this.sPos[j],this.sPos[j+2]);if(this.sPos[j+1]<g){this.sPos[j+1]=g+.02;this.sVel[j+1]*=-.35;this.sVel[j]*=.6;this.sVel[j+2]*=.6}
        const k=Math.max(0,Math.min(1,L*1.4));this.sCol[j]=1*k;this.sCol[j+1]=(.55+.3*k)*k;this.sCol[j+2]=.18*k;if(L<=0){this.sPos[j+1]=-9999}}
      if(any||this._sw){this.sparks.geometry.attributes.position.needsUpdate=true;this.sparks.geometry.attributes.color.needsUpdate=true;this._sw=any}}
    for(const d of this.deb){if(!d.on)continue;d.t+=dt;d.v.y-=22*dt;d.m.position.addScaledVector(d.v,dt);d.m.rotation.x+=d.w.x*dt;d.m.rotation.y+=d.w.y*dt;d.m.rotation.z+=d.w.z*dt;
      const g=groundH(d.m.position.x,d.m.position.z);if(d.m.position.y<g+.05){d.m.position.y=g+.05;d.v.y*=-.32;d.v.x*=.6;d.v.z*=.6;d.w.multiplyScalar(.6)}
      if(d.t>3.2){d.on=false;d.m.visible=false}}
    // wall chunks: fly, tumble, wait, then glide home
    for(const c of this.chunks){if(!c.on)continue;c.t+=dt;const m=c.m;
      if(c.t<4.6){c.v.y-=18*dt;m.position.addScaledVector(c.v,dt);m.rotation.x+=c.w.x*dt;m.rotation.y+=c.w.y*dt;m.rotation.z+=c.w.z*dt;
        const g=groundH(m.position.x,m.position.z)+m.scale.y*.4;if(m.position.y<g){m.position.y=g;c.v.y*=-.25;c.v.x*=.5;c.v.z*=.5;c.w.multiplyScalar(.5)}
        c.back=m.position.clone()}
      else if(c.t<6.4){const k=(c.t-4.6)/1.8,e=k*k*(3-2*k);m.position.lerpVectors(c.back,c.o,e);m.rotation.x*=1-e*.2;m.rotation.y*=1-e*.2;m.rotation.z*=1-e*.2;m.scale.multiplyScalar(1-.02*e)}
      else{c.on=false;m.visible=false;this.puff({x:c.o.x,y:c.o.y,z:c.o.z,vx:0,vy:.4,vz:0,s0:1.2,s1:3.2,life:1.1,c0:[.75,.7,.62],c1:[.6,.56,.5],op:.5,add:false,drag:1,grow:1})}}
    for(const q of this.rings){if(!q.on)continue;q.t+=dt;const u=q.t/.55;if(u>=1){q.on=false;q.m.visible=false;continue}const s=q.r*(.4+u*3.2);q.m.scale.set(s,1,s);q.m.material.opacity=.7*(1-u)*(1-u)}
    for(const s of this.scorch){if(!s.on)continue;s.t+=dt;const u=s.t/26;if(u>=1){s.on=false;s.m.visible=false;continue}s.m.material.opacity=.8*(1-u*u)}
  },
  sCur:0
};
