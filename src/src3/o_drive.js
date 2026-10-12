// ===================== your own car (C / «Машина») =====================
// Arcade handling: throttle/brake, speed-dependent steering, handbrake slides, bumps off walls and traffic.
// The car is drawn through the instanced car meshes (type 4 = sporty hatch), so it costs no extra draw calls.
const DRIVE={on:false,car:null,v:0,steer:0,vy:0,slip:0,eng:null,crashT:0,hornT:0,lightOn:false};
const PCAR_COL=0xc0262d;
function carAhead(c,d){return [c.x+Math.sin(c.yaw)*d,c.z+Math.cos(c.yaw)*d]}
function toggleCar(){
  if(!started)return;
  if(DRIVE.on){exitCar();return}
  if(curIndoor){toast('Can\'t drive here','go outside first');return}
  if(RIDE.on||PORTAL.cur)return;
  if(player.sit)player.sit=null;
  if(player.scoot){player.scoot=false;$('bScoot').classList.remove('on');if(typeof AUD!=='undefined'&&AUD)AUD.scoot(false)}
  let c=DRIVE.car;
  if(!c||Math.hypot(c.x-player.x,c.z-player.z)>8){ // bring the car to you: park it right beside you, facing where you look
    const yaw=cam.yaw;let best=null;
    for(const side of [1,-1,0]){for(const back of [0,2,-2,4]){const x=player.x-Math.cos(yaw)*2.6*side+Math.sin(yaw)*back,z=player.z+Math.sin(yaw)*2.6*side+Math.cos(yaw)*back;
      if(!carFits(x,z,yaw))continue;best=[x,z];break}if(best)break}
    if(!best){toast('No room for the car','move to an open spot');return}
    c=DRIVE.car={x:best[0],z:best[1],y:groundAt(best[0],best[1],player.y+1),yaw,pitch:0,roll:0,type:4,col:PCAR_COL};
  }
  DRIVE.on=true;DRIVE.v=0;DRIVE.steer=0;DRIVE.vy=0;
  player.x=c.x;player.z=c.z;player.y=c.y;PLR.root.visible=false;
  cam.yaw=c.yaw;cam.dist=Math.max(cam.dist,6.5);
  $('bCar').classList.add('on');$('spd').hidden=false;
  toast('Driving','W/S — gas & brake · A/D — steer · Space — handbrake · H — horn');
  engineOn(true);
}
function exitCar(){
  const c=DRIVE.car;DRIVE.on=false;DRIVE.v=0;$('bCar').classList.remove('on');$('spd').hidden=true;engineOn(false);
  // step out on the driver's (left) side, or wherever there is room
  for(const side of [1,-1]){for(const along of [0,1.5,-1.5]){const x=c.x+Math.cos(c.yaw)*1.7*side+Math.sin(c.yaw)*along,z=c.z-Math.sin(c.yaw)*1.7*side+Math.cos(c.yaw)*along;
    if(!insideAny(x,z,.35,c.y+.5)&&!carAt(x,z,c.y+.5,.1)){player.x=x;player.z=z;player.y=groundAt(x,z,c.y+1);PLR.root.visible=true;player.vx=player.vz=0;return}}}
  player.x=c.x+Math.cos(c.yaw)*1.8;player.z=c.z-Math.sin(c.yaw)*1.8;player.y=groundAt(player.x,player.z,c.y+1);PLR.root.visible=true;
}
function carFits(x,z,yaw){
  for(const d of [-1.6,0,1.6]){const px=x+Math.sin(yaw)*d,pz=z+Math.cos(yaw)*d;if(insideAny(px,pz,.95,player.y+.5)||carAt(px,pz,player.y+.5,.6))return false;
    const g=groundAt(px,pz,player.y+1);if(Math.abs(g-player.y)>.8||g<SL-1)return false}
  for(const r of INDOORS)if(r.test(x,z,player.y))return false;
  return true;
}
function stepDrive(dt){
  const c=DRIVE.car;
  let thr=0,str=0;
  if(inp.k.KeyW||inp.k.ArrowUp)thr+=1;if(inp.k.KeyS||inp.k.ArrowDown)thr-=1;if(inp.k.KeyA||inp.k.ArrowLeft)str+=1;if(inp.k.KeyD||inp.k.ArrowRight)str-=1;
  thr+=inp.jy;str-=inp.jx;thr=Math.max(-1,Math.min(1,thr));str=Math.max(-1,Math.min(1,str));
  const hb=!!(inp.k.Space||inp.hb);inp.jump=false;
  const vmax=33,acc=8.2,brk=17,rev=-8;let v=DRIVE.v;
  if(thr>0){if(v<-.3)v+=brk*thr*dt;else v+=acc*thr*dt*Math.max(.12,1-Math.max(0,v)/vmax)}
  else if(thr<0){if(v>.3)v+=brk*thr*dt;else v=Math.max(rev,v+acc*.7*thr*dt)}
  else{const dec=(1.1+Math.abs(v)*.035)*dt;v=Math.abs(v)<dec?0:v-Math.sign(v)*dec}
  if(hb){const dec=11*dt;v=Math.abs(v)<dec?0:v-Math.sign(v)*dec}
  const maxSt=.62/(1+Math.abs(v)*.055);DRIVE.steer+=(str*maxSt-DRIVE.steer)*Math.min(1,dt*7);
  let yr=v/2.6*Math.tan(DRIVE.steer);if(hb&&Math.abs(v)>6)yr*=1.65;
  DRIVE.slip+=((hb&&Math.abs(v)>6?Math.abs(DRIVE.steer)*1.2:0)-DRIVE.slip)*Math.min(1,dt*4);
  c.yaw+=yr*dt;
  // move + collide (three sample circles along the body)
  const ox=c.x,oz=c.z;let nx=c.x+Math.sin(c.yaw)*v*dt,nz=c.z+Math.cos(c.yaw)*v*dt;
  let hit=0;
  for(let it=0;it<2;it++){for(const d of [1.55,0,-1.55]){const px=nx+Math.sin(c.yaw)*d,pz=nz+Math.cos(c.yaw)*d;const [qx,qz]=collide(px,pz,.92,c.y+.6);const ex=qx-px,ez=qz-pz;
    if(ex*ex+ez*ez>1e-6){nx+=ex;nz+=ez;const along=-(ex*Math.sin(c.yaw)+ez*Math.cos(c.yaw))*Math.sign(d||v||1);if(along>.004)hit=Math.max(hit,Math.abs(v))}}}
  // terrain, water and buildings' doors: never drive into the sea or inside
  const gF=groundAt(nx+Math.sin(c.yaw)*1.4,nz+Math.cos(c.yaw)*1.4,c.y+1),gB=groundAt(nx-Math.sin(c.yaw)*1.4,nz-Math.cos(c.yaw)*1.4,c.y+1);
  const sp=specialGround(nx,nz,c.y+1);const gN=sp?sp.h:groundAt(nx,nz,c.y+1);
  let blocked=(!sp&&groundH(nx,nz)<SL-.8)||(sp&&sp.wall)||gN>c.y+.65||Math.max(gF,gB)>c.y+.9;
  for(const r of INDOORS)if(r.test(nx,nz,c.y))blocked=true;
  if(blocked){nx=ox;nz=oz;hit=Math.max(hit,Math.abs(v))}
  if(hit>.5){DRIVE.v=-v*.22;if(hit>5&&DRIVE.crashT<=0){crashSound(hit);DRIVE.crashT=.5}}else DRIVE.v=v;
  DRIVE.crashT-=dt;
  c.x=nx;c.z=nz;
  // ground follow with a little air when cresting
  if(gN<c.y-.35){DRIVE.vy-=15*dt;c.y+=DRIVE.vy*dt;if(c.y<gN){c.y=gN;DRIVE.vy=0}}else{c.y+=(gN-c.y)*Math.min(1,dt*18);DRIVE.vy=0}
  c.pitch+=(-Math.atan2(gF-gB,2.8)-c.pitch)*Math.min(1,dt*10);c.roll+=DRIVE.v*dt/.33;
  player.x=c.x;player.z=c.z;player.y=c.y;player.vx=Math.sin(c.yaw)*DRIVE.v;player.vz=Math.cos(c.yaw)*DRIVE.v;player.spd=Math.abs(DRIVE.v);
  PLR.root.position.set(c.x,c.y,c.z);
  // horn
  DRIVE.hornT-=dt;if(inp.k.KeyH&&DRIVE.hornT<=0){DRIVE.hornT=.55;horn()}
  engineUpdate(thr,dt);
  const kmh=Math.round(Math.abs(DRIVE.v)*3.6);const el=$('spdN');if(el&&el.textContent!==String(kmh))el.textContent=kmh;
}
// people step aside when you drive at them
function dodgeCar(list){
  if(!DRIVE.car)return;const c=DRIVE.car;const fx=Math.sin(c.yaw),fz=Math.cos(c.yaw);const moving=DRIVE.on&&Math.abs(DRIVE.v)>1;
  for(const p of list){const dx=p.x-c.x,dz=p.z-c.z;if(dx*dx+dz*dz>30)continue;const a=dx*fx+dz*fz,b=dx*fz-dz*fx;
    const reach=moving?2.6+Math.min(3,Math.abs(DRIVE.v)*.15):2.45;if(Math.abs(a)<reach&&Math.abs(b)<1.35){const nb=(b>=0?1:-1)*1.4;p.x+=(nb-b)*fz;p.z-=(nb-b)*fx;if(moving)p.wait=Math.max(p.wait||0,1.2)}}
}
// ---------- sound ----------
function engineOn(on){
  if(typeof AUD==='undefined'||!AUD||!AUD.ok)return;const a=AUD.ctx,T=a.currentTime;
  if(!DRIVE.eng){const o1=a.createOscillator(),o2=a.createOscillator(),f=a.createBiquadFilter(),g=a.createGain();o1.type='sawtooth';o2.type='square';f.type='lowpass';f.frequency.value=600;f.Q.value=3;g.gain.value=0;
    const o2g=a.createGain();o2g.gain.value=.35;o1.connect(f);o2.connect(o2g);o2g.connect(f);f.connect(g);g.connect(AUD.sfx);o1.start();o2.start();
    const ns=a.createBufferSource();ns.buffer=AUD.noise;ns.loop=true;const nf=a.createBiquadFilter();nf.type='bandpass';nf.frequency.value=500;nf.Q.value=.6;const ng=a.createGain();ng.gain.value=0;ns.connect(nf);nf.connect(ng);ng.connect(AUD.sfx);ns.start();
    DRIVE.eng={o1,o2,f,g,ng,nf}}
  const e=DRIVE.eng;e.g.gain.setTargetAtTime(on?.05:0,T,.15);if(!on)e.ng.gain.setTargetAtTime(0,T,.2);
  if(on){AUD.tone(80,160,.35,.12,'sawtooth');AUD.burst(400,200,.3,.15,'lowpass',.7)}
}
function engineUpdate(thr,dt){
  const e=DRIVE.eng;if(!e)return;const a=AUD.ctx,T=a.currentTime;const sp=Math.abs(DRIVE.v);
  const gear=Math.min(5,Math.floor(sp/7.5)),fr=(sp-gear*7.5)/7.5;const rpm=sp<.5?.12:Math.min(1,.25+fr*.75);
  const f0=38+rpm*95+gear*4;e.o1.frequency.setTargetAtTime(f0,T,.05);e.o2.frequency.setTargetAtTime(f0*.5,T,.05);
  e.f.frequency.setTargetAtTime(380+rpm*1300*(thr>0?1:.6),T,.08);e.g.gain.setTargetAtTime(.035+Math.abs(thr)*.045+rpm*.02,T,.08);
  e.ng.gain.setTargetAtTime(Math.min(.09,sp*.0028)+DRIVE.slip*.12,T,.1);e.nf.frequency.setTargetAtTime(300+sp*22+DRIVE.slip*900,T,.1);
}
function horn(){if(typeof AUD==='undefined'||!AUD)return;AUD.tone(415,415,.45,.09,'square');AUD.tone(523,523,.45,.07,'square')}
function crashSound(s){if(typeof AUD==='undefined'||!AUD)return;const k=Math.min(1,s/20);AUD.burst(900,120,.35,.25+.3*k,'lowpass',.8);AUD.tone(160,60,.25,.12*k,'triangle')}
