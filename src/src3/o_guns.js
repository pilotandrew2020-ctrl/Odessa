// ===================== Arena mode: cartoon guns for friends (2-20 players, no blood) =====================
// Everything is synced through the same presence channel as co-op (COOP.push adds st.g = GUN.pub()).
// Hits are decided by the SHOOTER (hitscan) and applied by the VICTIM, so nobody can be hurt unless they have "Armed" on.
const WEAPONS=[
  {n:'Glock 17',   k:'1',dmg:18,cd:.17,auto:false,spread:.012,col:0x2b2d31},
  {n:'Desert Eagle',k:'2',dmg:46,cd:.55,auto:false,spread:.006,col:0xb9bcc2},
  {n:'.357 Magnum',k:'3',dmg:55,cd:.85,auto:false,spread:.004,col:0x8d9298},
  {n:'Uzi',        k:'4',dmg:10,cd:.065,auto:true, spread:.04, col:0x222428},
  {n:'Bazooka',    k:'5',dmg:95,cd:2.4,auto:false,spread:0,   col:0x4d6b3a,rocket:true},
  {n:'C4',         k:'6',dmg:100,cd:.6,auto:false,spread:0,   col:0xd8cfa8,c4:true},
  {n:'Mini-nuke',  k:'7',dmg:100,cd:7,auto:false,spread:0,   col:0x5a5f52,rocket:true,nuke:true}];
const GUN={armed:false,w:0,hp:100,kills:0,deaths:0,cd:0,shots:0,seq:0,hits:[],exs:[],c4:[],kb:null,down:0,spawn:null,
  seen:new Map(),held:false,rockets:[],tracers:[],booms:[],c4m:new Map(),remoteR:[],models:[],ac:null,flash:0,last:{},ui:null,lastTag:0,
  // ---------- models ----------
  model(i){
    if(this.models[i])return this.models[i];
    const W=WEAPONS[i],g=new THREE.Group();const dark=new THREE.MeshStandardMaterial({color:W.col,roughness:.45,metalness:.55}),grip=new THREE.MeshStandardMaterial({color:0x1b1b1d,roughness:.8});
    const B=(x,y,z,sx,sy,sz,m)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m||dark);b.position.set(x,y,z);b.castShadow=true;g.add(b);return b};
    if(i<4)this.gunModel(g,i);
    else if(i===4||i===6){this.bazooka(g,i===6)}
    else this.c4Model(g);
    if(i<4)g.scale.setScalar(1.4);g.rotation.x=Math.PI/2;g.position.set(0,-.2,.04);this.models[i]=g;return g},
  // put the held weapon into a character's right hand and raise the arm (local player and remote avatars)
  hold(P,w,on){
    if(!P||!P.arms)return;const A=P.arms[1];
    if(!on){if(P._gw){A.el.remove(P._gw);P._gw=null;P._gi=-1}return}
    if(P._gi!==w){if(P._gw)A.el.remove(P._gw);P._gw=this.model(w).clone();A.el.add(P._gw);P._gi=w}
    A.sh.rotation.x=-1.42+((P===PLR&&this.rec)?this.rec*.22:0);A.sh.rotation.z=0;A.el.rotation.x=-.05;
    // two-handed hold for the bazooka
    if(w===4||w===6){const L=P.arms[0];L.sh.rotation.x=-1.2;L.sh.rotation.z=.25;L.el.rotation.x=-.4}},
  // ---------- audio ----------
  sfx(kind,vol){
    try{if(!this.ac){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ac=new C()}const ac=this.ac;if(ac.state==='suspended')ac.resume();
      const dur=kind==='boom'?.9:kind==='rocket'?.5:(kind==='deagle'||kind==='magnum')?.4:.14;const n=Math.floor(ac.sampleRate*dur),buf=ac.createBuffer(1,n,ac.sampleRate),d=buf.getChannelData(0);
      for(let i=0;i<n;i++){const t=i/n;d[i]=(Math.random()*2-1)*Math.pow(1-t,kind==='boom'?1.6:3)}
      const src=ac.createBufferSource();src.buffer=buf;const f=ac.createBiquadFilter();f.type=kind==='boom'?'lowpass':'bandpass';f.frequency.value=kind==='boom'?260:(kind==='uzi'?1500:kind==='deagle'?700:kind==='magnum'?600:1100);
      const gn=ac.createGain();gn.gain.value=(vol||1)*(kind==='boom'?1.6:.55);src.connect(f);f.connect(gn);gn.connect(ac.destination);src.start();if(kind==='shot'||kind==='deagle'||kind==='magnum'||kind==='uzi'){const o=ac.createOscillator(),og=ac.createGain(),t0=ac.currentTime;o.type='triangle';o.frequency.setValueAtTime(kind==='uzi'?210:kind==='shot'?170:120,t0);o.frequency.exponentialRampToValueAtTime(40,t0+.12);og.gain.setValueAtTime((vol||1)*(kind==='uzi'?.35:.7),t0);og.gain.exponentialRampToValueAtTime(.001,t0+.14);o.connect(og);og.connect(ac.destination);o.start(t0);o.stop(t0+.16)}}catch(e){}},
  // ---------- detailed pistols / revolver / SMG (barrel along +z) ----------
  gunModel(g,i){
    const mt=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
    const poly=mt(0x16171a,.75,.1),steel=mt(0x2c2f34,.35,.85),slide=mt(i===1?0xc9ccd2:i===2?0x9a9fa6:0x23262b,i===1?.18:.32,.9),blue=mt(0x1a1c20,.3,.9),wood=mt(0x6b3f22,.55,.05),brass=mt(0xc9a24a,.3,.9),sight=mt(0xf2f2f2,.5,0);
    const B=(x,y,z,sx,sy,sz,m,rx,rz)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m||steel);b.position.set(x,y,z);if(rx)b.rotation.x=rx;if(rz)b.rotation.z=rz;b.castShadow=true;g.add(b);return b};
    const C=(r,len,x,y,z,m,seg)=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,seg||14),m||steel);c.rotation.x=Math.PI/2;c.position.set(x,y,z);c.castShadow=true;g.add(c);return c};
    const guard=(z,y,l)=>{B(0,y,z+l/2,.012,.012,l,steel);B(0,y-.03,z+l,.012,.05,.012,steel);B(0,y-.055,z+l/2,.012,.012,l,steel)};
    if(i===0){ // Glock 17
      B(0,.03,.1,.034,.04,.3,slide);B(0,.056,.1,.026,.01,.3,slide);                               // slide + top flat
      B(0,.03,.255,.03,.03,.012,blue);for(let k=0;k<6;k++)B(.0175,.03,-.02+k*.012,.004,.032,.005,blue),B(-.0175,.03,-.02+k*.012,.004,.032,.005,blue);
      B(0,.005,.115,.032,.025,.25,poly);B(0,-.012,.17,.03,.014,.14,poly);                          // frame + dust cover
      B(0,-.07,.03,.034,.12,.055,poly,.16);                                                      // grip
      for(let k=0;k<4;k++)B(0,-.06-k*.022,.0,.036,.006,.058,blue,.16);
      B(0,-.135,.015,.032,.014,.06,poly,.16);                                                    // magwell flare
      guard(.07,-.02,.07);B(0,-.035,.075,.012,.03,.016,steel);                                    // trigger guard + trigger
      B(0,.067,.235,.008,.014,.012,sight);B(0,.065,-.03,.026,.012,.012,blue);B(-.007,.066,-.032,.006,.01,.006,sight);B(.007,.066,-.032,.006,.01,.006,sight);   // sights
      C(.008,.03,0,.03,.265,blue);g.userData.tip=[0,.03,.285];
    }else if(i===1){ // Desert Eagle
      B(0,.035,.14,.042,.055,.4,slide);B(0,.066,.17,.016,.012,.34,steel);                          // wide slide, rib
      for(let k=0;k<5;k++)B(.022,.04,-.03+k*.013,.004,.04,.006,blue),B(-.022,.04,-.03+k*.013,.004,.04,.006,blue);
      B(0,-.005,.15,.04,.045,.3,mt(0x8a8e95,.3,.9));B(0,-.02,.24,.04,.03,.14,mt(0x8a8e95,.3,.9));   // frame (triangular muzzle block)
      C(.017,.06,0,.035,.35,blue);                                                               // bore
      B(0,-.08,.04,.042,.14,.06,wood,.14);B(.023,-.08,.04,.006,.12,.05,poly,.14);B(-.023,-.08,.04,.006,.12,.05,poly,.14);
      guard(.08,-.03,.09);B(0,-.045,.085,.012,.03,.016,steel);
      B(0,.078,.34,.008,.014,.012,sight);B(0,.078,-.02,.03,.014,.012,blue);
      g.userData.tip=[0,.035,.37];
    }else if(i===2){ // .357 Magnum revolver
      C(.017,.4,0,.035,.2,steel,10);B(0,.062,.2,.014,.012,.4,steel);B(0,.015,.2,.022,.03,.38,steel);   // barrel + rib + underlug
      const cyl=C(.045,.1,0,.03,.0,slide,12);for(let k=0;k<6;k++){const a=k/6*Math.PI*2;const cc=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,.102,6),blue);cc.rotation.x=Math.PI/2;cc.position.set(Math.cos(a)*.03,.03+Math.sin(a)*.03,0);g.add(cc)}
      B(0,.03,-.07,.04,.07,.08,steel);B(0,.075,-.08,.012,.022,.07,steel);B(0,.073,.36,.01,.016,.014,sight);   // frame + hammer + front sight
      B(0,-.07,-.07,.04,.15,.07,wood,.38);B(.022,-.07,-.07,.004,.13,.06,wood,.38);
      guard(-.04,-.02,.1);B(0,-.035,-.0,.012,.03,.016,steel);
      g.userData.tip=[0,.035,.41];
    }else{ // Uzi
      B(0,.03,.05,.05,.075,.32,slide);B(0,.075,.05,.03,.012,.3,steel);                              // receiver
      for(let k=0;k<6;k++)B(0,.04,.19+k*.0,.052,.006,.006,blue),B(0,.035,.02+k*.02,.052,.008,.006,blue);
      B(0,.03,.27,.034,.034,.08,steel);C(.012,.08,0,.03,.34,blue);                                // barrel + muzzle
      B(0,-.1,.06,.034,.2,.05,steel);B(0,-.205,.06,.038,.012,.058,steel);                         // grip + magazine
      B(0,-.055,.07,.04,.15,.05,poly,.1);for(let k=0;k<3;k++)B(0,-.02-k*.03,.04,.044,.006,.05,blue);
      B(0,.0,-.14,.012,.012,.2,steel);B(0,.0,-.24,.034,.07,.012,steel);B(0,-.035,-.22,.012,.012,.1,steel);   // folding stock
      B(0,.09,.2,.01,.025,.012,sight);B(0,.085,-.03,.026,.022,.012,blue);                          // sights
      B(0,.035,.0,.056,.02,.04,steel);B(.03,.065,.15,.01,.012,.04,brass);
      guard(.0,-.03,.07);g.userData.tip=[0,.03,.38];
    }
  },
  c4Model(g){
    const mt=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
    const B=(x,y,z,sx,sy,sz,m)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);b.position.set(x,y,z);b.castShadow=true;g.add(b);return b};
    const cl=mt(0xd7ceab,.85,0),blk=mt(0x1a1a1c,.6,.3),led=new THREE.MeshBasicMaterial({color:0xff2a1a});
    for(let k=0;k<3;k++)B(0,0,-.06+k*.08,.17,.045,.07,cl);                                       // three bricks
    B(0,.0,.0,.18,.012,.02,blk);B(0,.0,.12,.18,.012,.02,blk);B(0,.0,-.12,.18,.012,.02,blk);         // straps
    B(.05,.04,.0,.08,.03,.06,blk);B(.05,.058,.0,.024,.01,.024,led);B(.03,.058,.0,.02,.01,.02,new THREE.MeshBasicMaterial({color:0x2aff4a}));
    const wire=new THREE.Mesh(new THREE.TorusGeometry(.05,.004,5,14,Math.PI),mt(0xcc2222,.6,.1));wire.position.set(.0,.03,.1);wire.rotation.x=Math.PI/2;g.add(wire);
    B(-.07,.04,-.06,.012,.03,.012,mt(0x888,.4,.8));B(-.08,.05,-.06,.012,.012,.04,mt(0x888,.4,.8))},
  muzzleFlash(x,y,z,dx,dy,dz,big){
    FX.init();for(let q=0;q<2;q++)FX.puff({x:x+dx*.1*q,y:y+dy*.1*q,z:z+dz*.1*q,vx:dx*2,vy:dy*2,vz:dz*2,s0:(big?.5:.3)+q*.1,s1:(big?1.1:.65),life:.07+q*.03,c0:[1,.85,.45],c1:[1,.5,.15],op:.95,add:true,drag:2,grow:1});
    FX.puff({x:x+dx*.25,y:y+dy*.25,z:z+dz*.25,vx:dx*1.5,vy:.5,vz:dz*1.5,s0:.12,s1:.55,life:.7,c0:[.75,.75,.72],c1:[.45,.45,.45],op:.28,add:false,drag:2,grow:1})},
  // detailed shoulder-fired tube (z = forward)
  bazooka(g,nuke){
    const mt=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
    const olive=mt(nuke?0x6b6f58:0x4f5a2c,.6,.35),steel=mt(0x2a2d30,.4,.8),rubber=mt(0x141414,.9,0),yel=mt(0xd9b82a,.5,.2),red=mt(0xb02a1c,.5,.2),lens=new THREE.MeshStandardMaterial({color:0x335577,roughness:.05,metalness:.9,emissive:0x112233});
    const C=(r1,r2,len,z,m,x,y)=>{const me=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,len,16),m);me.rotation.x=Math.PI/2;me.position.set(x||0,y||0,z);me.castShadow=true;g.add(me);return me};
    const B=(x,y,z,sx,sy,sz,m,rx)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);b.position.set(x,y,z);if(rx)b.rotation.x=rx;b.castShadow=true;g.add(b);return b};
    C(.063,.063,1.08,-.02,olive);                       // launch tube
    C(.062,.092,.14,-.62,steel);                        // rear venturi
    C(.052,.052,.02,-.69,rubber);                       // dark bore
    C(.074,.074,.1,.5,steel);                           // front collar
    C(.068,.068,.02,.3,yel);C(.068,.068,.02,-.22,yel);  // yellow bands
    if(nuke){C(.07,.07,.06,.12,red);C(.07,.07,.06,.0,red);C(.07,.07,.06,-.12,red)}
    // warhead peeking out of the muzzle
    const wr=nuke?.085:.052;C(wr,wr,.22,.62,nuke?mt(0x9aa08a,.5,.4):olive);const nose=new THREE.Mesh(new THREE.ConeGeometry(wr,.18,16),nuke?red:mt(0xb83a22,.5,.2));nose.rotation.x=Math.PI/2;nose.position.z=.82;g.add(nose);
    // grips, trigger guard, shoulder pad, sling
    B(0,-.12,.0,.035,.12,.05,rubber,.15);B(0,-.17,.05,.03,.02,.1,steel);B(0,-.09,.28,.035,.1,.05,rubber,-.1);
    B(0,-.085,-.34,.075,.07,.16,rubber);
    // optical sight on the left + iron sight on top
    B(-.085,.07,.08,.045,.05,.16,steel);C(.022,.022,.03,.17,lens,-.085,.07);B(-.05,.055,.08,.06,.012,.05,steel);
    B(0,.075,.35,.012,.03,.012,steel);B(0,.075,-.15,.05,.025,.012,steel);
    // sling ring
    const tor=new THREE.Mesh(new THREE.TorusGeometry(.03,.006,6,10),steel);tor.position.set(.07,-.02,.3);g.add(tor)},
  rocketMesh(nuke){
    const g=new THREE.Group();const mt=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
    const s=nuke?2:1;const body=new THREE.Mesh(new THREE.CylinderGeometry(.045*s,.045*s,.6*s,12),mt(nuke?0x8a9078:0x56602f,.5,.4));body.rotation.x=Math.PI/2;g.add(body);
    const nose=new THREE.Mesh(new THREE.ConeGeometry(.045*s,.16*s,12),mt(0xc03a22,.5,.2));nose.rotation.x=Math.PI/2;nose.position.z=.38*s;g.add(nose);
    for(let k=0;k<4;k++){const f=new THREE.Mesh(new THREE.BoxGeometry(.012,.09*s,.14*s),mt(0x222222,.6,.4));f.position.z=-.26*s;f.rotation.z=k*Math.PI/2;f.translateY(.065*s);g.add(f)}
    FX.init();const fm=new THREE.SpriteMaterial({map:FX.tex.spark,color:0xffc060,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});const fl=new THREE.Sprite(fm);fl.scale.set(.9*s,.9*s,1);fl.position.z=-.42*s;g.add(fl);g.userData.flame=fl;
    scene.add(g);return g},
  rocketFx(r,dt){
    const m=r.mesh;m.position.copy(r.p);m.lookAt(r.p.x+r.d.x,r.p.y+r.d.y,r.p.z+r.d.z);const fl=m.userData.flame;if(fl){const k=(r.nuke?2:1)*(.8+Math.random()*.5);fl.scale.set(.9*k,.9*k,1)}
    r.tp+=dt;const sz=r.nuke?1.6:1;while(r.tp>.028){r.tp-=.028;FX.puff({x:r.p.x-r.d.x*.5+(Math.random()-.5)*.1,y:r.p.y-r.d.y*.5,z:r.p.z-r.d.z*.5+(Math.random()-.5)*.1,vx:(Math.random()-.5)*.5,vy:.3,vz:(Math.random()-.5)*.5,s0:.22*sz,s1:1.3*sz,life:1.5,c0:[.95,.82,.55],c1:[.62,.6,.58],op:.5,add:false,drag:.8,grow:1})}},
  // ---------- visual effects ----------
  tracer(a,b){let m=this.tracers.find(t=>!t.on);if(!m){if(this.tracers.length>40)return;const mm=new THREE.Mesh(new THREE.BoxGeometry(.03,.03,1),new THREE.MeshBasicMaterial({color:0xffe28a,transparent:true,opacity:.9,depthWrite:false}));mm.frustumCulled=false;scene.add(mm);m={mesh:mm,on:false,t:0};this.tracers.push(m)}
    const L=a.distanceTo(b);m.mesh.position.copy(a).lerp(b,.5);m.mesh.scale.z=Math.max(.1,L);m.mesh.lookAt(b);m.mesh.visible=true;m.on=true;m.t=.07},
  boom(x,y,z,r){FX.explode(x,y,z,r);if(Math.hypot(x-player.x,z-player.z)<r*2.5)this.flash=Math.max(this.flash,.18)},
  // ---------- my pose / aim ----------
  aimRay(){const o=camera.position.clone(),d=new THREE.Vector3();camera.getWorldDirection(d);return {o,d}},
  muzzle(){return new THREE.Vector3(player.x+Math.sin(player.yaw)*.7,player.y+1.25,player.z+Math.cos(player.yaw)*.7)},
  canFire(){return this.armed&&!this.down&&!PORTAL.cur&&!(typeof DRIVE!=='undefined'&&DRIVE.on)&&!RIDE.on&&!player.sit},
  peersAlive(){const out=[];for(const R of COOP.peers.values()){const s=R.st,g=s&&s.g;if(!s||!s.in||!g||!g.a||(g.h!==undefined&&g.h<=0))continue;if((s.zn||'')!==COOP.zone())continue;out.push(R)}return out},
  // closest hit of a ray with any armed remote player; returns {R,t,head}
  raycast(o,d,max){let best=null;
    for(const R of this.peersAlive()){const px=R.has?R.x:R.st.x,py=R.has?R.y:R.st.y,pz=R.has?R.z:R.st.z;
      for(const [h,r,hd] of [[1.6,.26,true],[1.05,.36,false],[.45,.34,false]]){const cx=px-o.x,cy=py+h-o.y,cz=pz-o.z;const t=cx*d.x+cy*d.y+cz*d.z;if(t<0||t>max)continue;
        const qx=cx-d.x*t,qy=cy-d.y*t,qz=cz-d.z*t;if(qx*qx+qy*qy+qz*qz<r*r){if(!best||t<best.t)best={R,t,head:hd};break}}}
    return best},
  // distance along the ray to the first building / ground (so walls stop bullets)
  wallDist(o,d,max){for(let t=1;t<max;t+=1){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;if(y<groundH(x,z))return t;if(insideAny(x,z,.15,y))return t}return max},
  fire(){
    if(!this.canFire()||this.cd>0)return;const W=WEAPONS[this.w];
    if(W.c4){this.placeC4();return}
    this.cd=W.cd;this.shots++;const {o,d}=this.aimRay();
    d.x+=(Math.random()-.5)*W.spread;d.y+=(Math.random()-.5)*W.spread;d.z+=(Math.random()-.5)*W.spread;d.normalize();
    this.last.ax=d.x;this.last.az=d.z;this.last.ay2=d.y;
    const m=this.muzzle();if(W.rocket){FX.init();FX.launch()}else{this.sfx(W.auto?'uzi':this.w===1?'deagle':this.w===2?'magnum':'shot',1);this.muzzleFlash(m.x,m.y,m.z,d.x,d.y,d.z,this.w===1||this.w===2);this.rec=1}
    if(W.rocket){const nk=!!W.nuke;this.rockets.push({p:m.clone(),d:d.clone(),t:0,nuke:nk,mesh:this.rocketMesh(nk),tp:0});
      for(let q=0;q<5;q++)FX.puff({x:m.x-d.x*(.4+q*.35),y:m.y-d.y*(.4+q*.35),z:m.z-d.z*(.4+q*.35),vx:-d.x*(3+q),vy:.4,vz:-d.z*(3+q),s0:.5,s1:2.4,life:1.1,c0:[.9,.88,.82],c1:[.6,.58,.55],op:.55,add:false,drag:1.8,grow:1});
      FX.shakeT=.3;FX.shakeA=Math.max(FX.shakeA,.1);this.push();return}
    const wall=this.wallDist(o,d,90);const hit=this.raycast(o,d,Math.min(90,wall));
    const end=o.clone().addScaledVector(d,hit?hit.t:Math.min(wall,90));this.tracer(m,end);
    if(hit){const dmg=Math.round(W.dmg*(hit.head?1.8:1));this.addHit(hit.R.peer,dmg);toast(hit.head?'Headshot!':'Hit',(hit.R.st.n||'Friend')+' −'+dmg)}
    this.push()},
  placeC4(){
    if(this.c4.length>=3){this.detonate();return}
    this.cd=.6;this.c4.push([Math.round(player.x*100)/100,Math.round(player.y*100)/100,Math.round(player.z*100)/100]);toast('C4 planted',this.c4.length+'/3 · press again after 3, or Detonate');this.sfx('shot',.5);this.push()},
  detonate(){
    if(!this.c4.length)return;for(const c of this.c4)this.addBoom(c[0],c[1]+.2,c[2],7,100);this.c4=[];this.push()},
  addHit(to,dmg){this.hits.push([++this.seq,to,dmg]);if(this.hits.length>8)this.hits.shift()},
  addBoom(x,y,z,r,dmg){const id=++this.seq;this.exs.push([id,Math.round(x*10)/10,Math.round(y*10)/10,Math.round(z*10)/10,r,dmg]);if(this.exs.length>5)this.exs.shift();this.boom(x,y,z,r);this.applyBoom(x,y,z,r,dmg,null,true);this.seen.set('me:'+id,1)},
  // ---------- taking damage ----------
  applyBoom(x,y,z,r,dmg,by,mine){
    if(!this.armed||this.down)return;const d=Math.hypot(x-player.x,y-(player.y+1),z-player.z);if(d>r)return;
    // solid cover between the blast and me halves the damage
    const k=1-d/r;let v=Math.round(dmg*k*k*1.2+8);if(mine)v=Math.round(v*.5);this.damage(v,by)},
  damage(v,by){
    if(!this.armed||this.down||v<=0)return;this.hp=Math.max(0,this.hp-v);this.flash=.35;
    if(this.hp<=0){this.deaths++;this.down=3.2;this.c4=[];this.kb=[++this.seq,by?by.peer:'',by?(by.st&&by.st.n)||'Friend':'yourself'];
      toast(by?'Tagged by '+((by.st&&by.st.n)||'a friend'):'You blew yourself up','respawning…');player.vx=player.vz=0;this.push(true)}
    else this.push()},
  respawn(){const s=this.spawn||{x:27.5,z:57,yaw:3.07};this.hp=100;this.down=0;teleportRaw(s.x,s.z,s.yaw);toast('Back in the fight','HP 100')},
  // ---------- network ----------
  pub(){
    if(!this.used)return null;
    if(!this.armed)return {a:0};
    const g={a:1,w:this.w,h:this.hp,k:this.kills,d:this.deaths,s:this.shots};
    if(this.hits.length)g.hit=this.hits;if(this.exs.length)g.ex=this.exs;if(this.c4.length)g.c4=this.c4;if(this.kb)g.kb=this.kb;
    if(this.last.ax!==undefined)g.ax=[Math.round(this.last.ax*1000)/1000,Math.round(this.last.ay2*1000)/1000,Math.round(this.last.az*1000)/1000];
    return g},
  // read what the other players did since the last frame
  scan(){
    const me=COOP.myId||'me';
    for(const R of COOP.peers.values()){const s=R.st,g=s&&s.g;if(!g)continue;const key=R.peer;let L=this.seen.get(key);if(!L){let m0=-1;for(const h of g.hit||[])m0=Math.max(m0,h[0]);for(const e of g.ex||[])m0=Math.max(m0,e[0]);L={seq:m0,shots:g.s||0,kb:g.kb?g.kb[0]:0,c4:0};this.seen.set(key,L)}
      // shots: draw a tracer
      if(g.s!==undefined&&g.s!==L.shots){const n=g.s-L.shots;L.shots=g.s;if(n>0&&n<20&&R.has&&g.ax&&(s.zn||'')===COOP.zone()){if((g.w===4||g.w===6)&&n===1){const nk=g.w===6;const rp=new THREE.Vector3(R.x+Math.sin(R.yaw)*.7,R.y+1.25,R.z+Math.cos(R.yaw)*.7);FX.init();this.remoteR.push({p:rp,d:new THREE.Vector3(g.ax[0],g.ax[1],g.ax[2]),t:0,nuke:nk,mesh:this.rocketMesh(nk),tp:0});FX.launch()}const a=new THREE.Vector3(R.x+Math.sin(R.yaw)*.7,R.y+1.25,R.z+Math.cos(R.yaw)*.7),d=new THREE.Vector3(g.ax[0],g.ax[1],g.ax[2]);this.tracer(a,a.clone().addScaledVector(d,WEAPONS[g.w|0].rocket?14:40));this.sfx(WEAPONS[g.w|0].auto?'uzi':'shot',Math.max(0,1-Math.hypot(R.x-player.x,R.z-player.z)/80))}}
      // hits on me
      for(const h of g.hit||[])if(h[0]>L.seq&&h[1]===me){this.damage(h[2],R)}
      // explosions: every client draws it; I take my own damage
      for(const e of g.ex||[])if(e[0]>L.seq){this.boom(e[1],e[2],e[3],e[4]);this.applyBoom(e[1],e[2],e[3],e[4],e[5],R,false)}
      // kill feed
      if(g.kb&&g.kb[0]!==L.kb){L.kb=g.kb[0];const killer=g.kb[1];if(killer===me){this.kills++;toast('You tagged '+(s.n||'a friend'),'K '+this.kills);this.push(true)}else if(this.armed)toast((g.kb[2]||'someone')+' tagged '+(s.n||'someone'),'')}
      let mx=L.seq;for(const h of g.hit||[])mx=Math.max(mx,h[0]);for(const e of g.ex||[])mx=Math.max(mx,e[0]);L.seq=mx;
      this.drawC4(R.peer,g.c4)}
  },
  drawC4(owner,list){let a=this.c4m.get(owner);if(!a){a=[];this.c4m.set(owner,a)}list=list||[];
    while(a.length>list.length){scene.remove(a.pop())}
    while(a.length<list.length){const m=new THREE.Mesh(new THREE.BoxGeometry(.28,.1,.2),new THREE.MeshStandardMaterial({color:0xd8cfa8,emissive:0x551100,roughness:.7}));m.castShadow=true;scene.add(m);a.push(m)}
    list.forEach((c,i)=>a[i].position.set(c[0],c[1]+.06,c[2]))},
  push(force){try{COOP.push(true)}catch(e){}},
  // ---------- per frame ----------
  tick(dt){
    if(this.cd>0)this.cd-=dt;
    if(this.rec>0)this.rec=Math.max(0,this.rec-dt*9);
    if(this.flash>0){this.flash-=dt;if(this.ui)this.ui.vig.style.opacity=Math.max(0,Math.min(.6,this.flash*2.2))}
    if(this.down>0){this.down-=dt;if(this.down<=0)this.respawn()}
    for(const t of this.tracers)if(t.on){t.t-=dt;if(t.t<=0){t.on=false;t.mesh.visible=false}}
    for(const b of this.booms)if(b.on){b.t+=dt;const k=b.t/.5;b.mesh.scale.setScalar(.5+b.r*Math.min(1,k*2.2));b.mesh.material.opacity=Math.max(0,.85*(1-k));if(k>=1){b.on=false;b.mesh.visible=false}}
    // my own rockets
    for(let i=this.rockets.length-1;i>=0;i--){const r=this.rockets[i];r.t+=dt;const step=(r.nuke?30:42)*dt;let hitT=null;
      const from=r.p.clone();r.p.addScaledVector(r.d,step);this.rocketFx(r,dt);
      if(r.p.y<groundH(r.p.x,r.p.z)+.1||insideAny(r.p.x,r.p.z,.1,r.p.y))hitT='wall';
      else{const h=this.raycast(from,r.d,step+.5);if(h)hitT='player'}
      if(hitT||r.t>(r.nuke?5:3)){this.rockets.splice(i,1);scene.remove(r.mesh);const W=WEAPONS[r.nuke?6:4];this.addBoom(r.p.x,r.p.y,r.p.z,r.nuke?24:7,W.dmg);this.push();continue}}
    // rockets fired by other players (only drawn)
    for(let i=this.remoteR.length-1;i>=0;i--){const r=this.remoteR[i];r.t+=dt;r.p.addScaledVector(r.d,(r.nuke?30:42)*dt);this.rocketFx(r,dt);
      if(r.t>5||r.p.y<groundH(r.p.x,r.p.z)+.1||insideAny(r.p.x,r.p.z,.1,r.p.y)){this.remoteR.splice(i,1);scene.remove(r.mesh)}}
    FX.update(dt);
    // weapon in hand, local player + everybody else
    this.hold(PLR,this.w,this.armed&&!this.down&&!PORTAL.cur);
    if(this.armed&&this.held&&WEAPONS[this.w].auto)this.fire();
    for(const R of COOP.peers.values()){const g=R.st&&R.st.g;if(R.P)this.hold(R.P,g?(g.w|0):0,!!(g&&g.a&&R.P.root.visible))}
    this.scan();
    if(this.armed)this.hud()},
  hud(){const u=this.ui;if(!u)return;
    u.hp.style.width=this.hp+'%';u.hp.style.background=this.hp>50?'#4ec27a':this.hp>25?'#e0b53a':'#d8453a';
    u.kd.textContent='K '+this.kills+' · D '+this.deaths;
    u.det.hidden=!(WEAPONS[this.w].c4&&this.c4.length);u.det.textContent='Detonate ('+this.c4.length+')';
    u.down.hidden=!(this.down>0);
    const rows=[{n:COOP.nameOf?COOP.nameOf():'Me',k:this.kills,d:this.deaths,me:1}];for(const R of COOP.peers.values()){const g=R.st&&R.st.g;if(g&&g.a)rows.push({n:(R.st.n||'Friend').slice(0,12),k:g.k|0,d:g.d|0})}
    rows.sort((a,b)=>b.k-a.k||a.d-b.d);const key=JSON.stringify(rows);if(key!==this.boardKey){this.boardKey=key;u.board.innerHTML=rows.slice(0,10).map(r=>'<div'+(r.me?' class="me"':'')+'><span>'+r.n.replace(/[<>&]/g,'')+'</span><b>'+r.k+'/'+r.d+'</b></div>').join('')}},
  // ---------- UI ----------
  setArmed(on){
    this.armed=!!on;this.used=true;if(on){this.spawn={x:player.x,z:player.z,yaw:player.yaw};this.hp=100;this.down=0;this.kills=0;this.deaths=0;toast('Armed','1–6 pick a weapon · F or the Fire button shoots')}
    else{this.c4=[];this.hits=[];this.exs=[];this.kb=null}
    this.sync();this.push()},
  sync(){const u=this.ui;if(!u)return;u.btn.classList.toggle('on',this.armed);u.btn.textContent=this.armed?'Armed ✓':'Armed';u.bar.hidden=!this.armed;u.fire.hidden=!this.armed;u.hudw.hidden=!this.armed;
    [...u.bar.children].forEach((b,i)=>b.classList.toggle('on',i===this.w));u.wn.textContent=WEAPONS[this.w].n;if(!this.armed)u.vig.style.opacity=0},
  pick(i){if(i<0||i>=WEAPONS.length)return;this.w=i;this.sync();this.push()},
  build(){
    const css=document.createElement('style');css.textContent=`
#gunBar{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom,0px));display:flex;gap:6px;z-index:6}
#gunBar button{min-width:46px;height:42px;border-radius:12px;font-size:12px;padding:0 8px;opacity:.9}
#gunBar button.on{background:#f2c14e;color:#0b1b22;font-weight:800}
#gunFire{position:absolute;right:max(278px,calc(env(safe-area-inset-right) + 278px));bottom:calc(46px + env(safe-area-inset-bottom,0px));width:84px;height:84px;border-radius:50%;background:rgba(216,69,58,.85);color:#fff;font-weight:800;font-size:15px;z-index:6;border:2px solid rgba(255,255,255,.5)}
#gunDet{position:absolute;right:max(278px,calc(env(safe-area-inset-right) + 278px));bottom:calc(142px + env(safe-area-inset-bottom,0px));height:44px;border-radius:14px;background:#f2c14e;color:#0b1b22;font-weight:800;padding:0 14px;z-index:6}
#gunHud{position:absolute;left:50%;transform:translateX(-50%);top:calc(14px + env(safe-area-inset-top,0px));min-width:170px;text-align:center;z-index:6;pointer-events:none;color:#fff;font:600 13px system-ui}
#gunHud .hpb{height:9px;border-radius:5px;background:rgba(0,0,0,.45);overflow:hidden;margin:4px 0}#gunHud .hpb i{display:block;height:100%;width:100%}
#gunBoard{position:absolute;right:max(14px,env(safe-area-inset-right));top:calc(200px + env(safe-area-inset-top,0px));min-width:130px;background:rgba(11,27,34,.6);border-radius:10px;padding:6px 8px;color:#fff;font:600 12px system-ui;z-index:5;pointer-events:none}
#gunBoard div{display:flex;justify-content:space-between;gap:10px}#gunBoard .me{color:#f2c14e}
#gunVig{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(216,69,58,0) 45%,rgba(216,69,58,.85) 100%);opacity:0;pointer-events:none;z-index:5;transition:opacity .08s}
#gunDown{position:absolute;left:50%;top:40%;transform:translateX(-50%);color:#fff;font:800 22px system-ui;text-shadow:0 2px 8px #000;z-index:7;pointer-events:none}`;document.head.appendChild(css);
    const ui={};const mk=(t,id,p)=>{const e=document.createElement(t);e.id=id;(p||document.body).appendChild(e);return e};
    ui.vig=mk('div','gunVig');
    ui.bar=mk('div','gunBar');WEAPONS.forEach((W,i)=>{const b=document.createElement('button');b.textContent=W.k+' '+W.n.replace('Desert Eagle','Deagle').replace('.357 Magnum','.357');b.onclick=()=>this.pick(i);ui.bar.appendChild(b)});
    ui.fire=mk('button','gunFire');ui.fire.textContent='FIRE';
    const dn=e=>{e.preventDefault();this.held=true;this.fire()},up=e=>{e.preventDefault();this.held=false};
    ui.fire.addEventListener('touchstart',dn,{passive:false});ui.fire.addEventListener('touchend',up);ui.fire.addEventListener('touchcancel',up);ui.fire.addEventListener('mousedown',dn);addEventListener('mouseup',()=>{this.held=false});
    ui.det=mk('button','gunDet');ui.det.onclick=()=>this.detonate();ui.det.hidden=true;
    ui.hudw=mk('div','gunHud');ui.wn=document.createElement('div');ui.hp=document.createElement('i');const hb=document.createElement('div');hb.className='hpb';hb.appendChild(ui.hp);ui.kd=document.createElement('div');ui.hudw.append(ui.wn,hb,ui.kd);
    ui.board=mk('div','gunBoard');ui.down=mk('div','gunDown');ui.down.textContent='You were tagged — respawning…';ui.down.hidden=true;
    ui.btn=document.createElement('button');ui.btn.id='bGun';ui.btn.textContent='Armed';ui.btn.onclick=()=>this.setArmed(!this.armed);$('topBtns').appendChild(ui.btn);
    this.ui=ui;this.sync();
    addEventListener('keydown',e=>{if(!started||!this.armed)return;const t=e.target&&e.target.tagName;if(t==='INPUT'||t==='TEXTAREA')return;
      if(e.code==='KeyF'){if(!e.repeat){this.held=true;this.fire()}}else if(/^Digit[1-7]$/.test(e.code))this.pick(+e.code.slice(5)-1);else if(e.code==='KeyE')this.detonate()});
    addEventListener('keyup',e=>{if(e.code==='KeyF')this.held=false});
    ANIM.push(dt=>GUN.tick(dt))}
};
