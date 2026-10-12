// ===================== audio: ambience, footsteps, cars, music speaker =====================
const AUD={
  ctx:null,ok:false,indoor:null,time:'day',season:'summer',
  start(){
    if(this.ctx){this.ctx.resume();return}
    try{this.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}
    const c=this.ctx;this.ok=true;
    this.master=c.createGain();this.master.gain.value=.9;this.master.connect(c.destination);
    this.sfx=c.createGain();this.sfx.gain.value=.9;this.sfx.connect(this.master);
    this.amb=c.createGain();this.amb.gain.value=.8;this.amb.connect(this.master);
    this.mus=c.createGain();this.mus.gain.value=.8;this.mus.connect(this.master);
    // reverb
    this.rev=c.createConvolver();this.rev.buffer=this.impulse(2.8,2.2);this.revG=c.createGain();this.revG.gain.value=0;this.rev.connect(this.revG);this.revG.connect(this.master);
    this.noise=this.noiseBuf(3);
    const loop=(type,f,q,g)=>{const s=c.createBufferSource();s.buffer=this.noise;s.loop=true;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const gn=c.createGain();gn.gain.value=0;s.connect(fl);fl.connect(gn);gn.connect(this.amb);s.start();return {fl,gn}};
    this.city=loop('lowpass',320,.5);this.wind=loop('bandpass',700,.4);this.sea=loop('lowpass',900,.3);this.chat=loop('bandpass',650,2.5);this.hum=loop('lowpass',140,1);
    // car voices
    this.carV=[0,1,2].map(()=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=40;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=380;const g=c.createGain();g.gain.value=0;const p=c.createStereoPanner?c.createStereoPanner():null;
      o.connect(f);f.connect(g);if(p){g.connect(p);p.connect(this.sfx)}else g.connect(this.sfx);o.start();return {o,f,g,p}});
    // scooter whine
    this.sc={o:c.createOscillator(),g:c.createGain()};this.sc.o.type='sawtooth';const sf=c.createBiquadFilter();sf.type='lowpass';sf.frequency.value=900;this.sc.o.connect(sf);sf.connect(this.sc.g);this.sc.g.gain.value=0;this.sc.g.connect(this.sfx);this.sc.o.start();
    // opera pad
    this.pad=c.createGain();this.pad.gain.value=0;this.pad.connect(this.master);this.pad.connect(this.rev);this.padT=0;
    this.birdT=0;this.gullT=0;this.crickT=0;this.chatLvl=0;
    this.setScene(this.time,this.season);
  },
  impulse(sec,decay){const c=this.ctx,n=c.sampleRate*sec,b=c.createBuffer(2,n,c.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay)}return b},
  noiseBuf(sec){const c=this.ctx,n=c.sampleRate*sec,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=w*.6+last*2.5}return b},
  setScene(t,s){this.time=t;this.season=s},
  setIndoor(n){this.indoor=n;if(!this.ok)return;const c=this.ctx,T=c.currentTime;this.revG.gain.setTargetAtTime(n==='opera'?.55:n==='shop'?.12:0,T,.4)},
  burst(f0,f1,dur,vol,type,q,dest){if(!this.ok)return;const c=this.ctx,T=c.currentTime;const s=c.createBufferSource();s.buffer=this.noise;const fl=c.createBiquadFilter();fl.type=type||'bandpass';fl.frequency.setValueAtTime(f0,T);fl.frequency.exponentialRampToValueAtTime(Math.max(40,f1),T+dur);fl.Q.value=q||1;
    const g=c.createGain();g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(vol,T+.006);g.gain.exponentialRampToValueAtTime(.0005,T+dur);s.connect(fl);fl.connect(g);g.connect(dest||this.sfx);if(this.indoor)g.connect(this.rev);s.start(T,Math.random()*2);s.stop(T+dur+.05)},
  tone(f0,f1,dur,vol,type,dest,delay){if(!this.ok)return;const c=this.ctx,T=c.currentTime+(delay||0);const o=c.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(f0,T);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),T+dur);
    const g=c.createGain();g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(vol,T+.01);g.gain.exponentialRampToValueAtTime(.0005,T+dur);o.connect(g);g.connect(dest||this.sfx);o.start(T);o.stop(T+dur+.05)},
  step(surf,spd){if(!this.ok)return;const v=.16+Math.min(.12,spd*.02);
    const S={asphalt:[1700,600,.07,'bandpass',1.2],tile:[2400,900,.06,'bandpass',1.5],grass:[900,300,.09,'lowpass',.7],sand:[700,250,.11,'lowpass',.8],snow:[1500,500,.13,'bandpass',.6],
      stone:[2600,900,.06,'bandpass',2],marble:[3200,1200,.05,'bandpass',3],wood:[1100,250,.08,'bandpass',1.2],carpet:[500,200,.07,'lowpass',.6]}[surf]||[1600,600,.07,'bandpass',1];
    this.burst(S[0]*(.9+Math.random()*.2),S[1],S[2],v*(surf==='carpet'?.5:1),S[3],S[4]);if(surf==='wood')this.tone(140,80,.06,.05,'sine')},
  jump(){this.burst(1200,400,.08,.12,'bandpass',1)},land(){this.burst(900,150,.12,.22,'lowpass',.7)},
  beep(){this.tone(1320,1320,.12,.15,'square');this.tone(1760,1760,.12,.12,'square',null,.14)},
  scoot(on){this.scootOn=on},
  chatter(d){this.chatLvl=d<16?Math.max(0,1-d/16):0},
  update(dt){
    if(!this.ok)return;const c=this.ctx,T=c.currentTime;
    const day=this.time==='day',night=this.time==='night',win=this.season==='winter',ind=this.indoor;
    const sd=sdAt(player.x,player.z);const seaNear=Math.max(0,1-Math.max(0,sd)/260);
    const out=ind?.12:1;
    let nCars=0;for(const k of CARS)if(Math.hypot(k.x-player.x,k.z-player.z)<120)nCars++;
    this.city.gn.gain.setTargetAtTime(out*(.035+nCars*.006)*(night?.7:1),T,.5);
    this.wind.gn.gain.setTargetAtTime(out*(.012+seaNear*.02+(win?.02:0)),T,.8);
    const wave=.5+.5*Math.sin(T*.9)*Math.sin(T*.37+1);
    this.sea.gn.gain.setTargetAtTime(out*seaNear*(.05+.09*wave),T,.25);this.sea.fl.frequency.setTargetAtTime(500+700*wave,T,.3);
    this.chat.gn.gain.setTargetAtTime(this.chatLvl*.05,T,.3);this.chat.fl.frequency.setTargetAtTime(500+Math.random()*500,T,.05);
    this.hum.gn.gain.setTargetAtTime(ind==='shop'?.05:0,T,.4);
    // birds / gulls / crickets
    this.birdT-=dt;if(this.birdT<=0){this.birdT=.6+Math.random()*2.5;if(!ind&&day&&!win&&seaNear<.8){const f=2400+Math.random()*2200;for(let i=0;i<2+Math.floor(Math.random()*4);i++)this.tone(f*(1+Math.random()*.2),f*(.8+Math.random()*.6),.07+Math.random()*.05,.025,'sine',this.amb,i*.09)}}
    this.gullT-=dt;if(this.gullT<=0){this.gullT=2+Math.random()*6;if(!ind&&!night&&seaNear>.15){const f=1000+Math.random()*300;this.tone(f,f*1.35,.35,.035*seaNear,'sawtooth',this.amb);this.tone(f*1.3,f*.9,.4,.03*seaNear,'sawtooth',this.amb,.33)}}
    this.crickT-=dt;if(this.crickT<=0){this.crickT=.25+Math.random()*.4;if(!ind&&night&&!win){for(let i=0;i<3;i++)this.tone(4400,4300,.03,.008,'sine',this.amb,i*.05)}}
    // cars: three nearest
    const near=CARS.map(k=>[Math.hypot(k.x-camera.position.x,k.z-camera.position.z),k]).sort((a,b)=>a[0]-b[0]).slice(0,3);
    const fx=Math.sin(cam.yaw),fz=Math.cos(cam.yaw);
    this.carV.forEach((v,i)=>{const e=near[i];if(!e||ind){v.g.gain.setTargetAtTime(0,T,.2);return}const [d,k]=e;
      v.o.frequency.setTargetAtTime(38+k.v*4.2+(k.type===3?-6:0),T,.15);v.f.frequency.setTargetAtTime(260+k.v*25,T,.2);v.g.gain.setTargetAtTime(.07/(1+d/7)*(.4+k.v/14),T,.15);
      if(v.p){const rx=k.x-camera.position.x,rz=k.z-camera.position.z;const side=(rx*fz-rz*fx)/(d+1);v.p.pan.setTargetAtTime(Math.max(-1,Math.min(1,-side)),T,.1)}});
    this.sc.o.frequency.setTargetAtTime(180+player.spd*45,T,.1);this.sc.g.gain.setTargetAtTime(this.scootOn&&player.spd>.3?.025:0,T,.15);
    // opera pad (simple chord progression in the hall)
    const inHall=ind==='opera';this.pad.gain.setTargetAtTime(inHall?(SPK.playing&&SPK.carry?.03:.07):0,T,1);
    if(inHall){this.padT-=dt;if(this.padT<=0){this.padT=4;const prog=[[57,60,64,69],[53,57,60,65],[48,55,60,64],[55,59,62,67]];const ch=prog[Math.floor(T/4)%4];
      for(const n of ch){for(const det of [-4,4]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=440*Math.pow(2,(n-69)/12);o.detune.value=det;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=1100;
        const g=c.createGain();g.gain.setValueAtTime(0,T);g.gain.linearRampToValueAtTime(.05,T+1.2);g.gain.linearRampToValueAtTime(0,T+4.3);o.connect(f);f.connect(g);g.connect(this.pad);o.start(T);o.stop(T+4.4)}}}}
    // listener for positional speaker
    const L=c.listener;if(L.positionX){L.positionX.setTargetAtTime(camera.position.x,T,.05);L.positionY.setTargetAtTime(camera.position.y,T,.05);L.positionZ.setTargetAtTime(camera.position.z,T,.05);
      const d=new THREE.Vector3();camera.getWorldDirection(d);L.forwardX.setTargetAtTime(d.x,T,.05);L.forwardY.setTargetAtTime(d.y,T,.05);L.forwardZ.setTargetAtTime(d.z,T,.05);L.upX.value=0;L.upY.value=1;L.upZ.value=0}
  },
};
// ===================== portable speaker =====================
const TRACKS=[
  {name:'Courtyards (post-punk)',bpm:126,kind:'punk'},
  {name:'Sea & neon (synthwave)',bpm:100,kind:'synth'},
  {name:'Meme beat (8-bit)',bpm:148,kind:'chip'},
  {name:'Odesa courtyard (waltz)',bpm:150,kind:'waltz'},
];
const TRK_DB={db:null,
  open(){return new Promise(res=>{try{const r=indexedDB.open('odesa_tracks',1);r.onupgradeneeded=()=>r.result.createObjectStore('t',{keyPath:'id',autoIncrement:true});r.onsuccess=()=>{this.db=r.result;res(this.db)};r.onerror=()=>res(null)}catch(e){res(null)}})},
  async tx(mode,fn){try{const db=this.db||await this.open();if(!db)return null;return await new Promise(res=>{const q=fn(db.transaction('t',mode).objectStore('t'));q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)})}catch(e){return null}},
  async all(){return (await this.tx('readonly',st=>st.getAll()))||[]},
  add(name,blob){return this.tx('readwrite',st=>st.add({name,blob}))},
  del(id){return this.tx('readwrite',st=>st.delete(id))}};
const SPK={
  owned:false,carry:true,playing:false,idx:0,bpm:120,vol:.7,user:[],
  init(scene){
    const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.5,20),std(0x1b1d22,.6,.2));body.rotation.z=Math.PI/2;body.position.y=.17;g.add(body);
    const grill=new THREE.Mesh(new THREE.CylinderGeometry(.163,.163,.38,20,1,true),std(0x2a7fbf,.5,.3));grill.rotation.z=Math.PI/2;grill.position.y=.17;g.add(grill);
    this.ring=new THREE.Mesh(new THREE.TorusGeometry(.13,.012,6,20),new THREE.MeshStandardMaterial({color:0x66ccff,emissive:0x2299ff,emissiveIntensity:1.5}));this.ring.rotation.y=Math.PI/2;this.ring.position.set(.252,.17,0);g.add(this.ring);
    g.visible=false;scene.add(g);this.ground=g;
    INTERACT.push({x:0,z:0,r:1e9,label:'Pick up speaker',cond:()=>this.owned&&!this.carry&&Math.hypot(this.ground.position.x-player.x,this.ground.position.z-player.z)<2.2,fn:()=>this.pickUp()});
    this.buildList();
    $('spkPlay').onclick=()=>this.togglePlay();$('spkNext').onclick=()=>this.next();$('spkPrev').onclick=()=>this.prev();$('spkClose').onclick=()=>{$('spk').hidden=true};
    $('spkVol').oninput=e=>{this.vol=e.target.value/100;if(this.out)this.out.gain.value=this.vol};
    $('spkCarry').onclick=()=>{if(!this.owned)this.takeOut();else if(this.carry)this.place();else this.pickUp()};
    $('spkFile').onchange=e=>{for(const f of e.target.files){const u={name:f.name.replace(/\.[^.]+$/,''),url:URL.createObjectURL(f)};this.user.push(u);TRK_DB.add(u.name,f).then(id=>{u.id=id})}this.buildList();if(this.user.length){this.idx=TRACKS.length+this.user.length-1;this.takeOut();this.play()}};
    // your own tracks are remembered in this browser (IndexedDB), so they are there next time
    TRK_DB.all().then(list=>{for(const t of list){if(this.user.some(u=>u.id===t.id))continue;this.user.push({id:t.id,name:t.name,url:URL.createObjectURL(t.blob)})}this.buildList()});
  },
  all(){return TRACKS.concat(this.user.map(u=>Object.assign({kind:'file'},u)))},
  buildList(){const L=$('spkList');if(!L)return;L.innerHTML='';this.all().forEach((t,i)=>{const b=document.createElement('button');b.textContent=(i===this.idx&&this.playing?'▶ ':'')+t.name;b.onclick=()=>{this.idx=i;this.takeOut();this.play()};L.appendChild(b);
    if(t.kind==='file'){const x=document.createElement('button');x.className='del';x.textContent='✕';x.title='Remove track';x.onclick=()=>{const k=i-TRACKS.length;const u=this.user[k];if(!u)return;if(this.idx===i&&this.playing)this.stop();this.user.splice(k,1);if(u.id!==undefined)TRK_DB.del(u.id);try{URL.revokeObjectURL(u.url)}catch(e){}if(this.idx>=TRACKS.length+this.user.length)this.idx=0;this.buildList()};L.appendChild(x)}})},
  panel(){const p=$('spk');p.hidden=!p.hidden;if(!p.hidden){this.buildList();$('spkCarry').textContent=!this.owned?'Take out speaker':(this.carry?'Put it down':'Carry it')}},
  ensure(){if(!AUD.ok)AUD.start();if(!AUD.ok)return false;if(this.out)return true;const c=AUD.ctx;
    this.out=c.createGain();this.out.gain.value=this.vol;
    this.panner=c.createPanner();this.panner.panningModel='HRTF';this.panner.distanceModel='inverse';this.panner.refDistance=3;this.panner.rolloffFactor=1.3;
    this.direct=c.createGain();this.direct.gain.value=1;this.posG=c.createGain();this.posG.gain.value=0;
    this.out.connect(this.direct);this.direct.connect(AUD.mus);this.out.connect(this.posG);this.posG.connect(this.panner);this.panner.connect(AUD.mus);
    this.delay=c.createDelay(1);this.delay.delayTime.value=.25;this.fb=c.createGain();this.fb.gain.value=.25;this.delay.connect(this.fb);this.fb.connect(this.delay);this.delay.connect(this.out);
    return true},
  takeOut(){this.owned=true;this.carry=true;PLR.speaker.visible=true;this.ground.visible=false;this.route();$('bSpk').classList.add('on');if(!this.playing)this.play()},
  place(){this.carry=false;PLR.speaker.visible=false;this.ground.visible=true;const fx=Math.sin(player.yaw),fz=Math.cos(player.yaw);this.ground.position.set(player.x+fx*.7,groundAt(player.x+fx*.7,player.z+fz*.7,player.y),player.z+fz*.7);this.ground.rotation.y=player.yaw;this.route();toast('Speaker placed','music plays from here')},
  pickUp(){this.carry=true;PLR.speaker.visible=true;this.ground.visible=false;this.route()},
  toggleCarry(){if(!this.owned)this.takeOut();else if(this.carry)this.place();else if(Math.hypot(this.ground.position.x-player.x,this.ground.position.z-player.z)<3)this.pickUp();else{this.stop();this.owned=false;this.ground.visible=false;PLR.speaker.visible=false;$('bSpk').classList.remove('on')}},
  route(){if(!this.out)return;const T=AUD.ctx.currentTime;this.direct.gain.setTargetAtTime(this.carry?1:0,T,.05);this.posG.gain.setTargetAtTime(this.carry?0:1.6,T,.05)},
  togglePlay(){this.playing?this.stop():(this.takeOut(),this.play())},
  next(){this.idx=(this.idx+1)%this.all().length;this.play()},prev(){this.idx=(this.idx-1+this.all().length)%this.all().length;this.play()},
  play(){if(!this.ensure())return;this.stop(true);const t=this.all()[this.idx];this.playing=true;this.bpm=t.bpm||110;$('spkName').textContent=t.name;$('spkPlay').textContent='⏸';
    if(t.kind==='file'){this.el=new Audio(t.url);this.el.crossOrigin='anonymous';try{this.src=AUD.ctx.createMediaElementSource(this.el);this.src.connect(this.out)}catch(e){}this.el.onended=()=>this.next();this.el.play().catch(()=>{})}
    else{this.seq={t:AUD.ctx.currentTime+.08,step:0,kind:t.kind,bpm:t.bpm}}
    this.buildList();toast('♪ '+t.name,'speaker')},
  stop(keep){this.playing=false;this.seq=null;if(this.el){this.el.pause();this.el=null}if(!keep){$('spkPlay').textContent='▶';$('spkName').textContent='Paused'}this.buildList()},
  update(dt){
    if(this.ground.visible)this.ring.material.emissiveIntensity=this.playing?1+Math.max(0,Math.sin(UNI.uTime.value*Math.PI*2*this.bpm/60))*2:.3;
    if(this.owned&&!this.carry&&this.panner){const T=AUD.ctx.currentTime;const p=this.ground.position;if(this.panner.positionX){this.panner.positionX.setTargetAtTime(p.x,T,.05);this.panner.positionY.setTargetAtTime(p.y+.3,T,.05);this.panner.positionZ.setTargetAtTime(p.z,T,.05)}else this.panner.setPosition(p.x,p.y+.3,p.z)}
    if(!this.seq||!AUD.ok)return;const c=AUD.ctx;const s=this.seq;const spb=60/s.bpm/4;   // 16th notes
    while(s.t<c.currentTime+.15){MUSIC[s.kind](s.step,s.t,spb);s.t+=spb;s.step++}
  },
};
// ---------- synth voices ----------
function mtof(n){return 440*Math.pow(2,(n-69)/12)}
function vKick(t,v){const c=AUD.ctx;const o=c.createOscillator();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);const g=c.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(SPK.out);o.start(t);o.stop(t+.32)}
function vNoise(t,v,f,type,dur){const c=AUD.ctx;const s=c.createBufferSource();s.buffer=AUD.noise;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;const g=c.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(g);g.connect(SPK.out);s.start(t,Math.random()*2);s.stop(t+dur+.02)}
function vSnare(t,v){vNoise(t,v,1900,'bandpass',.16);vTone(t,185,.08,v*.6,'triangle')}
function vHat(t,v){vNoise(t,v,8000,'highpass',.035)}
function vTone(t,f,dur,v,type,cut,toDelay,det){const c=AUD.ctx;const o=c.createOscillator();o.type=type||'square';o.frequency.value=f;if(det)o.detune.value=det;let node=o;
  if(cut){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(cut*2.5,t);fl.frequency.exponentialRampToValueAtTime(cut*.5+60,t+dur);o.connect(fl);node=fl}
  const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.setValueAtTime(v,t+dur*.7);g.gain.exponentialRampToValueAtTime(.001,t+dur);node.connect(g);g.connect(SPK.out);if(toDelay)g.connect(SPK.delay);o.start(t);o.stop(t+dur+.02)}
const CHORD={Em:[52,55,59],C:[48,52,55],G:[55,59,62],D:[50,54,57],Am:[57,60,64],F:[53,57,60],Dm:[50,53,57],A7:[57,61,64,67],Gm:[55,58,62],E:[52,56,59],B7:[59,63,66,69]};
const MUSIC={
  punk(step,t,spb){ // 16 steps per bar, progression Em C G D
    const bar=Math.floor(step/16)%8,s=step%16;const prog=['Em','C','G','D','Em','C','D','D'];const ch=CHORD[prog[bar]];
    if(s%8===0)vKick(t,.9);if(s===4||s===12)vSnare(t,.55);if(s%2===0)vHat(t,.12);
    if(s%2===0)vTone(t,mtof(ch[0]-12),spb*1.8,.22,'sawtooth',420);
    if(s%2===0){const arp=[0,1,2,1,2,0,1,2][(s/2)|0];vTone(t,mtof(ch[arp]+12),spb*2.6,.06,'sawtooth',1600,true,s%4?7:-7)}
    const mel=[[0,71],[4,74],[6,72],[8,71],[12,67],[16,69],[20,71],[24,74],[28,76],[32,74],[36,72],[40,71],[44,69],[48,67],[52,66],[56,64]];
    const pos=(Math.floor(step/16)%4)*16+s;if(bar>=4)for(const [p,n] of mel)if(p===pos)vTone(t,mtof(n),spb*3.6,.07,'square',2200,true);
  },
  synth(step,t,spb){
    const bar=Math.floor(step/16)%8,s=step%16;const prog=['Am','F','C','G','Am','F','C','G'];const ch=CHORD[prog[bar]];
    if(s%4===0)vKick(t,.8);if(s===4||s===12){vSnare(t,.5);}if(s%2===1)vHat(t,.08);
    if(s%2===0)vTone(t,mtof(ch[0]-24),spb*1.6,.2,'sawtooth',300);
    vTone(t,mtof(ch[s%3]+12+(s%6>2?12:0)),spb*.9,.045,'square',2600,true);
    if(s===0)for(const n of ch)for(const d of [-8,8])vTone(t,mtof(n),spb*15,.03,'sawtooth',1200,false,d);
    const mel=[[0,76],[6,74],[8,72],[12,71],[16,72],[22,74],[24,76],[28,79]];const pos=(Math.floor(step/16)%2)*16+s;if(bar>=4)for(const [p,n] of mel)if(p===pos)vTone(t,mtof(n),spb*5,.06,'triangle',3000,true);
  },
  chip(step,t,spb){
    const bar=Math.floor(step/16)%4,s=step%16;const prog=[[60,64,67],[57,60,64],[53,57,60],[55,59,62]];const ch=prog[bar];
    if(s%4===0)vNoise(t,.35,200,'lowpass',.08);if(s===4||s===12)vNoise(t,.25,3000,'bandpass',.07);if(s%2===1)vNoise(t,.06,9000,'highpass',.02);
    if(s%2===0)vTone(t,mtof(ch[0]-12+(s%4?7:0)),spb*1.2,.12,'triangle');
    const mel=[72,0,76,79,0,76,72,74,0,72,69,0,67,69,72,0];const m2=[74,0,77,81,0,77,74,76,0,74,72,0,71,72,74,0];const n=(Math.floor(step/32)%2?m2:mel)[s];
    if(n)vTone(t,mtof(n),spb*.85,.06,'square');
    if(s%4===2)vTone(t,mtof(ch[1]+12),spb*.5,.03,'square');
  },
  waltz(step,t,spb){ // 3/4: 12 sixteenths per bar
    const s=step%12,bar=Math.floor(step/12)%8;const prog=['Dm','A7','Dm','Gm','Dm','A7','Gm','Dm'];const ch=CHORD[prog[bar]];
    if(s===0)vTone(t,mtof(ch[0]-12),spb*3,.22,'triangle');if(s===4||s===8){for(const n of ch.slice(0,3))vTone(t,mtof(n),spb*2,.045,'square',1400)}
    if(s===4||s===8)vNoise(t,.05,6000,'highpass',.03);
    const mel=[[0,74],[4,73],[6,74],[8,76],[12,77],[16,76],[20,74],[24,73],[28,74],[32,69],[36,70],[40,69],[44,67],[46,69],[48,70],[52,69],[56,67],[60,65],[64,64],[68,65],[72,67],[76,69],[80,74],[88,73],[92,74]];
    const pos=(Math.floor(step/12)%8)*12+s;for(const [p,n] of mel)if(p===pos){vTone(t,mtof(n),spb*3.4,.05,'square',2000,true,-6);vTone(t,mtof(n),spb*3.4,.04,'sawtooth',1800,false,6)}
  },
};

window.AUD=AUD;window.SPK=SPK;
