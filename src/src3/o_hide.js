// ===================== Hide & Seek (2–10 players): presence-only, no extra network =====================
// Every player publishes st.hs = {rd,sk,z:[x,z,r],t0,hT,sT,f,fd,end}; the player who presses Start is the host of the round.
const CAMO=[['House pink','#c9a090'],['Beige wall','#d8c9a8'],['Grey wall','#a8a8a2'],['Brick','#9a5a44'],['Leaves','#3f6b34'],['Dark green','#2c4a28'],['Sand','#d8c49a'],['Asphalt','#4a4a4c']];
function camoOutfit(hex){const h=parseInt(hex.slice(1),16);return {shirt:h,tee1:hex,tee2:hex,jeans:h,cuff:h,shoe:h,sole:h,hair:h,hair2:h,skin:hex,iris:hex,brow:hex}}
const HS={on:false,rd:0,role:'',sk:'',zone:null,t0:0,hT:60,sT:300,fd:[],myFound:false,camo:null,host:false,ring:null,out:0,msgT:0,fin:'',
  now(){return Date.now()},
  phase(){if(!this.on)return '';const t=(this.now()-this.t0)/1000;return t<this.hT?'hide':(t<this.hT+this.sT?'seek':'over')},
  left(){const t=(this.now()-this.t0)/1000;return this.phase()==='hide'?this.hT-t:this.hT+this.sT-t},
  me(){return COOP.myId||'me'},
  pub(){if(!this.rd)return null;const o={rd:this.rd,sk:this.sk,z:this.zone,t0:this.t0,hT:this.hT,sT:this.sT,f:this.myFound?1:0};if(this.fd.length)o.fd=this.fd.slice(0,12);if(!this.on)o.end=1;return o},
  hiders(){const a=[];for(const R of COOP.peers.values()){const h=R.st&&R.st.hs;if(h&&h.rd===this.rd&&R.peer!==this.sk&&R.st.in&&!h.end)a.push(R)}return a},
  start(radius){if(!started)return;const all=[COOP.myId||'me'];for(const R of COOP.peers.values())if(R.st&&R.st.in&&R.peer)all.push(R.peer);
    const sk=all[Math.floor(Math.random()*all.length)];this.begin({rd:Math.floor(this.now()/1000),sk,z:[Math.round(player.x),Math.round(player.z),radius],t0:this.now()+1500,hT:60,sT:300},true);COOP.push(true)},
  begin(h,host){this.on=true;this.host=!!host;this.rd=h.rd;this.sk=h.sk;this.zone=h.z;this.t0=h.t0;this.hT=h.hT;this.sT=h.sT;this.fd=[];this.myFound=false;this.fin='';this.out=0;
    this.role=(this.sk===this.me())?'S':'H';this.makeRing();
    if(PORTAL.cur)PORTAL.exit();
    if(this.role==='H'){toast('Hide!','60 seconds — pick a colour and stand still');this.setCamo(this.camo||CAMO[0][1])}else toast('You are the seeker','wait while they hide, then find everyone');
    this.ui()},
  stop(msg){if(!this.on)return;this.on=false;this.removeRing();this.setCamo(null);if(msg)toast(msg,'hide & seek');this.ui();COOP.push(true)},
  makeRing(){this.removeRing();const [x,z,r]=this.zone;const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,60,72,1,true),new THREE.MeshBasicMaterial({color:0x44ff99,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false,fog:false}));
    m.position.set(x,groundH(x,z)+20,z);m.userData.dyn=true;m.renderOrder=5;scene.add(m);this.ring=m},
  removeRing(){if(this.ring){scene.remove(this.ring);this.ring.geometry.dispose();this.ring=null}},
  setCamo(hex){if(this.camo===hex&&PLR.camoSet===hex)return;this.camo=hex||this.camo;
    const o=hex?camoOutfit(hex):(OUTFITS[COOP.me.outfit]||OUTFITS[0]).o;const old=PLR;const N=makePlayer(o);N.root.traverse(m=>{if(m.isMesh)m.castShadow=true});scene.remove(old.root);scene.add(N.root);PLR=N;PLR.camoSet=hex||null;COOP.push(true)},
  catchTarget(){if(!this.on||this.role!=='S'||this.phase()!=='seek')return null;let best=null,bd=3.2;for(const R of this.hiders()){if(this.fd.includes(R.peer)||R.st.hs.f)continue;const d=Math.hypot(R.x-player.x,R.z-player.z);if(d<bd&&Math.abs(R.y-player.y)<2.5){bd=d;best=R}}return best},
  hideTag(R){const h=R.st&&R.st.hs;return !!(this.on&&h&&h.rd===this.rd&&R.peer!==this.sk&&!h.f)},
  tick(dt){
    // adopt a round started by someone else
    if(!this.on||this.rd){for(const R of COOP.peers.values()){const h=R.st&&R.st.hs;if(!h||!R.st.in)continue;
      if(h.rd>this.rd&&!h.end&&started&&(this.now()-h.t0)/1000<h.hT+h.sT)this.begin(h,false)}}
    if(!this.on){this.bar();return}
    for(const R of COOP.peers.values()){const h=R.st&&R.st.hs;if(h&&h.rd===this.rd&&h.end&&R.peer===this.sk&&!this.host){this.stop('Round ended');return}}
    const ph=this.phase();
    // found?
    if(this.role==='H'&&!this.myFound){for(const R of COOP.peers.values()){const h=R.st&&R.st.hs;if(h&&h.rd===this.rd&&R.peer===this.sk&&h.fd&&h.fd.includes(this.me())){this.myFound=true;this.setCamo(null);toast('You were found!','spectate and wait for the round to end');COOP.push(true)}}}
    // finish conditions
    if(ph==='over'){this.fin=this.fin||'time';this.stop(this.role==='S'?'Time is up — the hiders win':(this.myFound?'Round over':'Time is up — you survived!'));return}
    if(ph==='seek'){const hs=this.hiders();const tot=hs.length+(this.role==='H'?1:0);const foundN=this.role==='S'?this.fd.length:(()=>{const R=[...COOP.peers.values()].find(r=>r.peer===this.sk);return R&&R.st.hs&&R.st.hs.fd?R.st.hs.fd.length:0})();
      if(tot>0&&foundN>=tot&&(this.role==='S'||foundN>=tot)){this.stop(this.role==='S'?'You found everyone!':'Everyone was found — seeker wins');return}}
    // zone
    if(this.zone){const d=Math.hypot(player.x-this.zone[0],player.z-this.zone[1]);if(d>this.zone[2]){this.out+=dt;this.msgT-=dt;if(this.msgT<=0){this.msgT=2.5;toast('Back into the green zone!','you are outside the hide & seek area')}
      if(this.out>10){teleportRaw(this.zone[0]+(player.x-this.zone[0])*.5,this.zone[1]+(player.z-this.zone[1])*.5,player.yaw);this.out=0}}else this.out=0}
    // seeker is blindfolded during the hiding time
    const v=$('hsVeil');if(v){const blind=this.role==='S'&&ph==='hide';v.style.display=blind?'flex':'none';if(blind)v.firstElementChild.textContent='Counting… '+Math.max(0,Math.ceil(this.left()))+' s — they are hiding'}
    this.bar()},
  bar(){const b=$('hsBar');if(!b)return;if(!this.on){b.style.display='none';return}const ph=this.phase(),l=Math.max(0,Math.ceil(this.left()));const m=Math.floor(l/60),s=String(l%60).padStart(2,'0');
    const hs=this.hiders();const tot=hs.length+(this.role==='H'?1:0);const fo=this.role==='S'?this.fd.length:(this.myFound?1:0);
    b.style.display='block';b.textContent=(this.role==='S'?'🔍 SEEKER':'🙈 HIDER')+' · '+(ph==='hide'?'hiding ':'seeking ')+m+':'+s+(this.role==='S'?' · found '+fo+'/'+tot:(this.myFound?' · you are found':''))},
  ui(){const p=$('hsUI');if(!p)return;const on=this.on;$('hsIdle').style.display=on?'none':'block';$('hsRun').style.display=on?'block':'none';
    $('hsSw').style.display=(on&&this.role==='H')?'flex':'none';$('hsRole').textContent=on?(this.role==='S'?'You are the seeker. Get close to a hider and press Catch.':'You are hiding. Choose your colour and stand still near matching walls or trees.'):''},
  build(){
    const css=document.createElement('style');css.textContent='#hsBar{position:absolute;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translateX(-50%);background:var(--glass2);border:1px solid var(--line);border-radius:999px;padding:7px 16px;font-weight:700;font-size:14px;pointer-events:none;display:none;white-space:nowrap}'+
      '#hsUI{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(360px,calc(100vw - 32px));background:var(--glass2);border:1px solid var(--line);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}'+
      '#hsUI .row button{padding:9px 12px}#hsSw{flex-wrap:wrap;gap:6px}#hsSw button{width:44px;height:44px;border-radius:12px;padding:0}#hsVeil{position:absolute;inset:0;background:#05090c;display:none;align-items:center;justify-content:center;font-family:var(--f-disp);font-size:clamp(20px,5vw,34px);text-align:center;padding:24px;z-index:5}';
    document.head.appendChild(css);const hud=$('hud');
    const bar=document.createElement('div');bar.id='hsBar';hud.appendChild(bar);
    const veil=document.createElement('div');veil.id='hsVeil';veil.appendChild(document.createElement('div'));hud.appendChild(veil);
    const ui=document.createElement('div');ui.id='hsUI';ui.hidden=true;
    ui.innerHTML='<div class="spkTop"><b>Hide &amp; Seek</b><button id="hsClose" aria-label="Close">×</button></div>'+
      '<div id="hsIdle"><small style="color:var(--muted);font-size:12px;line-height:1.45">2–10 players. Everyone near you in the room joins automatically. One random player seeks; the others hide inside the green zone. The zone is centred where you stand now.</small>'+
      '<div class="row" style="margin-top:8px"><label>Zone</label><button data-r="80">Small</button><button data-r="150" class="on">Medium</button><button data-r="300">Large</button></div>'+
      '<button id="hsStart" style="margin-top:10px;width:100%;background:var(--sun);color:var(--ink);border-color:var(--sun)">Start round</button></div>'+
      '<div id="hsRun" style="display:none"><div id="hsRole" style="font-size:14px;line-height:1.45"></div><div id="hsSw" class="row" style="margin-top:8px"></div><button id="hsEnd" style="margin-top:10px;width:100%">End round</button></div>';
    hud.appendChild(ui);let rad=150;
    ui.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{rad=+b.dataset.r;ui.querySelectorAll('[data-r]').forEach(x=>x.classList.toggle('on',x===b))});
    const sw=ui.querySelector('#hsSw');CAMO.forEach(([n,hex])=>{const b=document.createElement('button');b.title=n;b.style.background=hex;b.setAttribute('aria-label',n);b.onclick=()=>{if(this.on&&this.role==='H'&&!this.myFound)this.setCamo(hex)};sw.appendChild(b)});
    $('hsClose').onclick=()=>{ui.hidden=true};$('hsStart').onclick=()=>{ui.hidden=true;this.start(rad)};$('hsEnd').onclick=()=>{ui.hidden=true;this.stop('Round ended')};
    const tb=$('topBtns');const hb=document.createElement('button');hb.id='bHS';hb.textContent='Hide & Seek';hb.onclick=()=>{ui.hidden=!ui.hidden;this.ui()};tb.appendChild(hb);
    for(const k of ['keydown','keyup'])addEventListener(k,e=>{if(started&&k==='keydown'&&e.code==='KeyH'&&document.activeElement.tagName!=='INPUT'){ui.hidden=!ui.hidden;this.ui()}});
    INTERACT.push({x:0,z:0,r:1e9,label:'Catch!',cond:()=>!!this.catchTarget(),fn:()=>{const R=this.catchTarget();if(!R)return;this.fd.push(R.peer);toast('Found '+((R.st&&R.st.n)||'a hider')+'!',this.fd.length+' found');COOP.push(true);if(window.AUD)AUD.beep()}});
    // no hiding indoors during a round
    const pe=PORTAL.enter.bind(PORTAL);PORTAL.enter=function(...a){if(HS.on){toast('Not now','no hiding indoors during hide & seek');return}return pe(...a)};
    ANIM.push(dt=>HS.tick(dt));this.ui()}
};
