// ===================== CO-OP: friends in the same Odesa (artifact `room` capability) =====================
// Each open copy of the game shares its player state as room presence (~15 Hz). Others are drawn as
// avatars with name tags, interpolated, only when they are in the same place (street / same interior).
const OUTFITS=[
  {id:'classic',label:'Classic',o:{}},
  {id:'navy',label:'Navy',o:{shirt:0x2e4a7d,tee1:'#f4f4f0',tee2:'#c8372d',jeans:0x2b2b30,cuff:0x3a3a40,hair:0x3a2618,hair2:0x553624,iris:'#4a8a3c',brow:'#3a2618',sole:0x222222}},
  {id:'red',label:'Red',o:{shirt:0xb33a3a,tee1:'#1a1a1a',tee2:'#f4f4f0',jeans:0x4b5a70,cuff:0x6a7a90,hair:0x161616,hair2:0x2a2a2a,iris:'#6b4a2a',brow:'#161616',sole:0xd0d0d0}},
  {id:'forest',label:'Forest',o:{shirt:0x4f7a3a,tee1:'#f1e3c0',tee2:'#3b2f22',jeans:0x2d3a55,cuff:0x45557a,hair:0xa0522d,hair2:0xc0703a,iris:'#2f6db0',brow:'#8a4422',sole:0x2f6db0}},
];
// fewer draw calls for remote avatars: under every limb node, merge the plain-coloured meshes into one vertex-coloured mesh
let AV_MAT=null;
function mergeAvatar(root){AV_MAT=AV_MAT||new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7});
  const nodes=[];root.traverse(o=>{if(!o.isMesh)nodes.push(o)});
  for(const nd of nodes){const ms=nd.children.filter(c=>c.isMesh&&c.visible&&!Array.isArray(c.material)&&c.material.isMeshStandardMaterial&&!c.material.map&&c.children.length===0);if(ms.length<2)continue;
    let n=0;const parts=[];for(const m of ms){m.updateMatrix();const g=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone());g.applyMatrix4(m.matrix);parts.push([g,m.material.color]);n+=g.attributes.position.count}
    const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let k=0;
    for(const [g,c] of parts){pos.set(g.attributes.position.array,k*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,k*3);for(let i=0;i<g.attributes.position.count;i++){col[(k+i)*3]=c.r;col[(k+i)*3+1]=c.g;col[(k+i)*3+2]=c.b}k+=g.attributes.position.count;g.dispose()}
    const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(pos,3));G.setAttribute('normal',new THREE.BufferAttribute(nor,3));G.setAttribute('color',new THREE.BufferAttribute(col,3));
    for(const m of ms)nd.remove(m);const M=new THREE.Mesh(G,AV_MAT);M.castShadow=true;nd.add(M)}}
// far LOD: the whole avatar baked into one static mesh (1 draw call instead of ~16)
function bakeAvatar(P){P.root.position.set(0,0,0);P.root.rotation.set(0,0,0);animPlayer(P,{spd:0,mode:'walk'},0);P.root.updateMatrixWorld(true);
  const parts=[];let n=0;P.root.traverse(o=>{if(!o.isMesh)return;let vis=true,p=o;while(p&&p!==P.root){if(!p.visible)vis=false;p=p.parent}if(!vis||Array.isArray(o.material))return;
    const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());g.applyMatrix4(o.matrixWorld);const im=o.material.map&&o.material.map.image;const c=o.material.map?((im&&im.width===512&&im.height===256)?null:new THREE.Color(.8,.8,.84)):o.material.color;
    parts.push([g,c||new THREE.Color(.82,.65,.55)]);n+=g.attributes.position.count});
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let k=0;
  for(const [g,c] of parts){pos.set(g.attributes.position.array,k*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,k*3);for(let i=0;i<g.attributes.position.count;i++){col[(k+i)*3]=c.r;col[(k+i)*3+1]=c.g;col[(k+i)*3+2]=c.b}k+=g.attributes.position.count;g.dispose()}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(pos,3));G.setAttribute('normal',new THREE.BufferAttribute(nor,3));G.setAttribute('color',new THREE.BufferAttribute(col,3));
  AV_MAT=AV_MAT||new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7});return new THREE.Mesh(G,AV_MAT)}
const COOP={room:null,peers:new Map(),me:{name:'',outfit:0},sendT:0,last:'',say:null,ok:false,listOpen:false,
  load(){try{this.me.name=localStorage.getItem('od_name')||'';this.me.outfit=+(localStorage.getItem('od_outfit')||0)||0}catch(e){}},
  save(){try{localStorage.setItem('od_name',this.me.name);localStorage.setItem('od_outfit',String(this.me.outfit))}catch(e){}},
  nameOf(){return (this.me.name||'').trim().slice(0,16)||'Player'},
  initMenu(){this.load();const ni=$('coName');ni.value=this.me.name;ni.addEventListener('input',()=>{this.me.name=ni.value.replace(/[\u0000-\u001f]/g,'').slice(0,16);this.save()});
    for(const k of ['keydown','keyup'])ni.addEventListener(k,e=>e.stopPropagation());
    const ob=$('coOutfits');OUTFITS.forEach((f,i)=>{const b=document.createElement('button');b.textContent=f.label;b.dataset.o=i;b.onclick=()=>{this.me.outfit=i;this.save();this.markOutfit()};ob.appendChild(b)});this.markOutfit();
    const ci=$('chatIn');for(const k of ['keydown','keyup'])ci.addEventListener(k,e=>{e.stopPropagation();if(k==='keydown'){if(e.key==='Enter'){this.sendChat(ci.value);this.closeChat()}else if(e.key==='Escape')this.closeChat()}});
    $('bChat').onclick=()=>this.openChat();$('chatSend').onclick=()=>{this.sendChat(ci.value);this.closeChat()};
    $('bFriends').onclick=()=>{this.listOpen=!this.listOpen;this.renderList()};
    const cin=$('netCode');for(const k of ['keydown','keyup'])cin.addEventListener(k,e=>{e.stopPropagation();if(k==='keydown'&&e.key==='Enter')NET.join(cin.value)});
    $('netCreate').onclick=()=>NET.create();$('netJoin').onclick=()=>NET.join(cin.value);
    addEventListener('keydown',e=>{if(!started||document.activeElement===ci)return;if(e.code==='KeyT'){e.preventDefault();this.openChat()}if(e.code==='KeyG')this.goTo(this.nearest())})},
  markOutfit(){document.querySelectorAll('#coOutfits button').forEach(b=>b.classList.toggle('on',+b.dataset.o===this.me.outfit))},
  status(t){const s=$('coStatus');if(s)s.textContent=t},
  online(){return !!this.room||NET.active},
  async init(){
    this.status('Co-op: connecting…');
    let room=null;try{if(window.claude&&window.claude.use)room=await window.claude.use('room')}catch(e){room=null}
    if(!room){this.status('Claude co-op is off here — use a room code below to play with a friend.');return}
    this.lobby=room;this.ok=true;await this.useRoom(room,'');
  },
  // switch the active room: the shared lobby, or a private named room made from a 4-digit code
  async useRoom(room,code){
    for(const u of this.unsubs||[])try{u()}catch(e){}this.unsubs=[];this.clearAll();this.room=room;this.code=code;
    this.unsubs.push(room.onPeers(ch=>this.onPeers(ch),e=>{this.ok=false;this.status('Co-op disconnected');this.clearAll()}));
    this.unsubs.push(room.onConnection(c=>{this.status(c?this.countText():'Co-op: reconnecting…')}));
    try{await room.presence({v:1,in:started?1:0,n:this.nameOf()})}catch(e){}
    if(code&&this.lobby&&this.lobby!==room)try{await this.lobby.presence({v:1,in:0,n:this.nameOf(),hid:1})}catch(e){}
    this.last='';this.push(true);this.status(this.countText())},
  countText(){const all=[...this.peers.values()];const n=all.filter(p=>p.st&&p.st.in).length,m=all.length-n;
    if(!all.length)return 'Co-op: on, waiting for friends — nobody else has the game open';
    return 'Co-op: '+(n?n+' playing':'')+(n&&m?', ':'')+(m?m+' in the menu':'')},
  onPeers(ch){
    const seen=new Set();
    for(const p of ch.peers){if(p.isMe){this.myId=p.peer;continue}if(p.kind!=='viewer')continue;seen.add(p.peer);
      const st=p.presence||{};let R=this.peers.get(p.peer);
      if(!R){R={peer:p.peer,st:null,P:null,tag:null,tagName:'',bub:null,bubT:0,sayT:0,x:0,y:0,z:0,yaw:0,has:false,outfit:-1};this.peers.set(p.peer,R)}
      const wasIn=R.st&&R.st.in;R.st=st;
      if(st.in&&!wasIn&&started)toast((st.n||'A friend')+' joined','co-op');
      if(!st.in&&wasIn&&started)toast((R.st.n||'A friend')+' is in the menu','co-op')}
    for(const [k,R] of this.peers)if(!k.startsWith('n:')&&!seen.has(k)){if(started&&R.st&&R.st.in)toast((R.st.n||'A friend')+' left','co-op');this.drop(R);this.peers.delete(k)}
    this.status(this.countText());this.renderList()},
  netUpsert(id,st){const key='n:'+id;let R=this.peers.get(key);
    if(!R){R={peer:key,st:null,P:null,tag:null,tagName:'',bub:null,bubT:0,sayT:0,x:0,y:0,z:0,yaw:0,has:false,outfit:-1};this.peers.set(key,R)}
    const wasIn=R.st&&R.st.in;R.st=st&&typeof st==='object'?st:{};
    if(R.st.in&&!wasIn&&started)toast((R.st.n||'A friend')+' joined','co-op');
    if(!R.st.in&&wasIn&&started)toast((R.st.n||'A friend')+' is in the menu','co-op');
    if(!wasIn!==!R.st.in)this.renderList()},
  netRemove(id){const key='n:'+id;const R=this.peers.get(key);if(!R)return;if(started&&R.st&&R.st.in)toast((R.st.n||'A friend')+' left','co-op');this.drop(R);this.peers.delete(key);this.renderList()},
  drop(R){if(R.lo){scene.remove(R.lo);R.lo.geometry.dispose();R.lo=null}if(R.P){scene.remove(R.P.root);R.P=null}if(R.tag){scene.remove(R.tag);R.tag.material.map.dispose();R.tag=null}if(R.bub){scene.remove(R.bub);R.bub.material.map.dispose();R.bub=null}},
  clearAll(){for(const R of this.peers.values())this.drop(R);this.peers.clear();this.renderList()},
  zone(){if(!PORTAL.cur)return '';const o=PORTAL.opt||{};return PORTAL.cur+(o.ent?':'+o.ent:'')+(o.floor?':'+o.floor:'')},
  mode(){if(typeof DRIVE!=='undefined'&&DRIVE.on)return 'car';if(RIDE.on)return RIDE.tram&&RIDE.tram.kind==='cable'?'sit':'tram';if(player.sit)return 'sit';if(player.air)return 'air';if(player.scoot)return 'scoot';return 'walk'},
  // ---------- local player outfit + spawn ----------
  onStart(){
    if(!this.onStart.done){this.onStart.done=true;
      if(this.me.outfit){const old=PLR;const N=makePlayer(OUTFITS[this.me.outfit].o);N.root.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.remove(old.root);scene.add(N.root);PLR=N}
      // spawn next to a friend who is already walking around outside
      const f=this.nearest(true);if(f){const s=f.st;teleportRaw(s.x+Math.sin((s.r||0)+1.6)*1.6,s.z+Math.cos((s.r||0)+1.6)*1.6,s.r||0);toast('Next to '+(s.n||'your friend'),'co-op · press G to find each other')}
      $('coHud').hidden=false}
    this.push(true)},
  nearest(outdoorOnly){let best=null,bd=1e18;const me=PORTAL.cur?(PORTAL.ret||player):player;
    for(const R of this.peers.values()){const s=R.st;if(!s||!s.in)continue;if(outdoorOnly&&s.zn)continue;const x=s.zn?s.rx:s.x,z=s.zn?s.rz:s.z;if(x===undefined)continue;const d=Math.hypot(x-me.x,z-me.z);if(d<bd){bd=d;best=R}}return best},
  goTo(R){if(!R||!R.st){toast('No friends online','share the game link with a friend');return}const s=R.st;
    if(s.zn){if(this.zone()===s.zn){teleportRawNear(s.x,s.z,s.r);return}if(s.rx===undefined)return;teleport({x:s.rx,z:s.rz,yaw:s.rr||0,name:(s.n||'Friend')+' is inside',sub:'wait at the door — they are in '+(s.zt||'a building')});return}
    teleport({x:s.x-Math.sin(s.r||0)*2,z:s.z-Math.cos(s.r||0)*2,yaw:s.r||0,name:'Next to '+(s.n||'your friend'),sub:'co-op'})},
  // ---------- presence out ----------
  push(force){if(!this.online())return;const r2=v=>Math.round(v*100)/100;
    const zn=this.zone();const ret=PORTAL.cur?PORTAL.ret:null;const ind=PORTAL.cur&&PORTAL.built[PORTAL.cur];
    const st={v:1,in:started?1:0,n:this.nameOf(),o:this.me.outfit,x:r2(player.x),y:r2(player.y),z:r2(player.z),r:r2(player.yaw),m:this.mode(),s:r2(player.spd||0),zn};
    if(ret){st.rx=r2(ret.x);st.rz=r2(ret.z);st.rr=r2(ret.yaw||0);st.zt=(ind&&ind.title)||''}
    if(typeof DRIVE!=='undefined'&&DRIVE.on&&DRIVE.car){st.x=r2(DRIVE.car.x);st.z=r2(DRIVE.car.z);st.y=r2(DRIVE.car.y);st.r=r2(DRIVE.car.yaw||0)}
    if(this.say){st.say=this.say.m;st.sayT=this.say.t}
    if(typeof HS!=='undefined'){const h=HS.pub();if(h)st.hs=h;if(HS.on&&HS.role==='H'&&HS.camo&&!HS.myFound)st.cc=parseInt(HS.camo.slice(1),16)}
    const key=JSON.stringify(st);const now=performance.now();
    if(NET.active&&(force||key!==this.lastN||now-(this.lastNT||0)>1000)){if(NET.send(st,force)){this.lastN=key;this.lastNT=now}}
    if(this.room&&(force||key!==this.last)){this.last=key;this.room.presence(st).catch(()=>{})}},
  // ---------- chat ----------
  openChat(){if(!started)return;$('chatBox').hidden=false;const ci=$('chatIn');ci.value='';setTimeout(()=>ci.focus(),30)},
  closeChat(){$('chatBox').hidden=true;$('chatIn').blur()},
  sendChat(m){m=(m||'').replace(/[\u0000-\u001f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g,'').trim().slice(0,80);if(!m)return;this.say={m,t:Date.now()};this.showBubble(this,m);this.push(true)},
  bubbleSprite(m){return labelSprite([m],{w:640,h:120,size:Math.min(52,Math.max(30,1100/(m.length+6))),color:'#0b1b22',bg:'rgba(245,241,232,.94)',round:40,depthTest:false,scale:.6})},
  showBubble(R,m){if(R.bub){scene.remove(R.bub);R.bub.material.map.dispose()}R.bub=this.bubbleSprite(m);R.bub.renderOrder=999;R.bub.material.sizeAttenuation=false;R.bub.scale.multiplyScalar(.075);scene.add(R.bub);R.bubT=6},
  // ---------- per frame ----------
  update(dt){
    if(!this.online())return;
    this.sendT-=dt;if(this.sendT<=0){this.sendT=1/15;this.push(false)}
    // my own chat bubble
    if(this.bub){this.bubT-=dt;this.bub.position.set(player.x,player.y+2.45,player.z);this.bub.visible=this.bubT>0;if(this.bubT<=0){scene.remove(this.bub);this.bub.material.map.dispose();this.bub=null}}
    const zn=this.zone();const k=1-Math.exp(-dt*12);
    for(const R of this.peers.values()){const s=R.st;
      const show=!!(s&&s.in&&(s.zn||'')===zn&&typeof s.x==='number');
      if(!show){if(R.P)R.P.root.visible=false;if(R.lo)R.lo.visible=false;if(R.tag)R.tag.visible=false;if(R.bub)R.bub.visible=false;R.has=false;continue}
      const okey=s.cc?100000+(s.cc|0):(s.o|0);if(!R.P||R.outfit!==okey){if(R.P)scene.remove(R.P.root);R.outfit=okey;if(R.lo){scene.remove(R.lo);R.lo.geometry.dispose()}R.P=makePlayer(s.cc?camoOutfit('#'+(s.cc|0).toString(16).padStart(6,'0')):(OUTFITS[s.o|0]||OUTFITS[0]).o);R.P.can.visible=false;R.P.scooter.visible=false;R.P.speaker.visible=false;R.lo=bakeAvatar(R.P);scene.add(R.lo);mergeAvatar(R.P.root);R.P.root.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(R.P.root);R.has=false}
      const nm=(s.n||'Friend').slice(0,16);
      if(!R.tag||R.tagName!==nm){if(R.tag){scene.remove(R.tag);R.tag.material.map.dispose()}R.tag=labelSprite([nm],{w:512,h:120,size:72,color:'#0b1b22',bg:'rgba(242,193,78,.95)',round:50,depthTest:false,scale:1});R.tag.material.sizeAttenuation=false;R.tag.scale.multiplyScalar(.055);R.tag.renderOrder=998;scene.add(R.tag);R.tagName=nm}
      if(s.say&&s.sayT&&s.sayT!==R.sayT){const first=R.sayT===0&&!R.fresh;R.sayT=s.sayT;if(!first)this.showBubble(R,String(s.say).slice(0,80))}R.fresh=true;
      if(!R.has||Math.hypot(s.x-R.x,s.z-R.z)>30){R.x=s.x;R.y=s.y;R.z=s.z;R.yaw=s.r||0;R.has=true}
      else{R.x+=(s.x-R.x)*k;R.y+=(s.y-R.y)*k;R.z+=(s.z-R.z)*k;let dy=(s.r||0)-R.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));R.yaw+=dy*k}
      const far=Math.hypot(R.x-player.x,R.z-player.z);
      const P=R.P;const near=far<22,m0=s.m||'walk';P.root.visible=near||m0==='car'||m0==='tram'||m0==='sit'||m0==='scoot';R.lo.visible=!P.root.visible&&far<350;R.lo.position.set(R.x,R.y,R.z);R.lo.rotation.y=R.yaw;R.lo.castShadow=false;const sh=far<35;if(R.sh!==sh){R.sh=sh;P.root.traverse(o=>{if(o.isMesh)o.castShadow=sh})}P.root.position.set(R.x,R.y,R.z);P.root.rotation.y=R.yaw;
      const m=s.m||'walk';
      if(P.root.visible){if(m==='car'||m==='tram'||m==='sit')animPlayer(P,{spd:0,mode:'sit'},dt);else animPlayer(P,{spd:s.s||0,mode:m==='air'?'air':(m==='scoot'?'scoot':'walk')},dt)}else{R.lo.position.y+=Math.abs(Math.sin(performance.now()*.008))*.04*Math.min(1,(s.s||0))}
      if(m==='car'||m==='tram')P.root.position.y+=.35;
      R.tag.visible=!(typeof HS!=='undefined'&&HS.hideTag(R));R.tag.position.set(R.x,R.y+2.15,R.z);
      if(R.bub){R.bubT-=dt;R.bub.position.set(R.x,R.y+2.6,R.z);R.bub.visible=R.bubT>0}}
    this.listT=(this.listT||0)-dt;if(this.listT<=0){this.listT=1;this.renderList()}},
  renderList(){const L=$('coList'),bf=$('bFriends');if(!L||!bf)return;
    const on=[...this.peers.values()].filter(R=>R.st&&R.st.in);const menu=[...this.peers.values()].filter(R=>!(R.st&&R.st.in));bf.textContent='👥 '+on.length+(menu.length?' (+'+menu.length+')':'');bf.hidden=!this.online();
    L.hidden=!this.listOpen||!this.online();if(L.hidden)return;L.innerHTML='';
    for(const R of menu){const d=document.createElement('div');d.className='coEmpty';d.textContent=((R.st&&R.st.n)||'A friend')+' has the game open but is still in the menu';L.appendChild(d)}
    if(!on.length&&!menu.length){const d=document.createElement('div');d.className='coEmpty';d.textContent=(NET.active?'Room code '+NET.code+' — send it to your friend. They type it in the menu and press Join.':'Nobody else is here yet.');L.appendChild(d);return}
    const me=PORTAL.cur?(PORTAL.ret||player):player;
    for(const R of on){const s=R.st;const b=document.createElement('button');const x=s.zn?s.rx:s.x,z=s.zn?s.rz:s.z;
      const nm=document.createElement('b');nm.textContent=s.n||'Friend';const sm=document.createElement('small');
      sm.textContent=(s.zn?('in '+(s.zt||'a building')+' · '):'')+(x!==undefined?fmtDist(Math.hypot(x-me.x,z-me.z)):'')+' · tap to go';b.appendChild(nm);b.appendChild(sm);
      b.onclick=()=>{this.listOpen=false;this.renderList();this.goTo(R)};L.appendChild(b)}},
};
function teleportRawNear(x,z,yaw){player.x=x-Math.sin(yaw||0)*1.5;player.z=z-Math.cos(yaw||0)*1.5;player.vx=player.vz=0;toast('Next to your friend','')}

// ===================== room codes through a public MQTT-over-WebSocket relay (no WebRTC, no Claude account needed) =====================
const MQ={
  urls:['wss://broker.hivemq.com:8884/mqtt','wss://broker.emqx.io:8084/mqtt','wss://test.mosquitto.org:8081'],
  enc:new TextEncoder(),dec:new TextDecoder(),
  str(s){const b=this.enc.encode(s);return [b.length>>8,b.length&255,...b]},
  pkt(type,flags,body){const len=[];let n=body.length;do{let d=n%128;n=Math.floor(n/128);if(n>0)d|=128;len.push(d)}while(n>0);return new Uint8Array([(type<<4)|flags,...len,...body])},
  connect(cid,wt,wp){const w=this.enc.encode(wp);return this.pkt(1,0,[...this.str('MQTT'),4,0x06,0,30,...this.str(cid),...this.str(wt),w.length>>8,w.length&255,...w])},
  sub(topic){return this.pkt(8,2,[0,1,...this.str(topic),0])},
  pub(topic,payload){return this.pkt(3,0,[...this.str(topic),...this.enc.encode(payload)])},
  ping(){return new Uint8Array([0xC0,0])},
  // split a byte stream into packets: returns [{type,body}] and the leftover bytes
  parse(buf){const out=[];let i=0;while(i+2<=buf.length){let m=1,v=0,j=i+1,b;do{if(j>=buf.length)return {out,rest:buf.slice(i)};b=buf[j++];v+=(b&127)*m;m*=128}while(b&128);
    if(j+v>buf.length)break;out.push({type:buf[i]>>4,body:buf.slice(j,j+v)});i=j+v}return {out,rest:buf.slice(i)}}
};
const NET={active:false,code:'',cid:'',ws:null,rest:new Uint8Array(0),seen:new Map(),lastSend:0,ping:0,sweep:0,gen:0,retry:0,
  st(t,ok){const e=$('netStatus');if(e){e.textContent=t;e.classList.toggle('ok',!!ok)}},
  topic(id){return 'myodesa/v2/'+this.code+'/'+id},
  stop(){this.gen++;clearInterval(this.ping);clearInterval(this.sweep);clearTimeout(this.retry);if(this.ws){try{this.ws.onclose=null;this.ws.close()}catch(e){}this.ws=null}this.active=false},
  // open a socket to the first broker that answers
  open(gen,first){return new Promise(res=>{let i=0;const next=()=>{if(gen!==this.gen)return res(false);if(i>=MQ.urls.length)return res(false);const url=MQ.urls[i++];let done=false,ok=false,ws;
      const fail=()=>{if(done)return;done=true;try{ws.close()}catch(e){}next()};
      try{ws=new WebSocket(url,'mqtt')}catch(e){return next()}
      ws.binaryType='arraybuffer';const to=setTimeout(fail,6000);
      ws.onopen=()=>ws.send(MQ.connect('od'+this.cid,this.topic(this.cid),'{"gone":1}'));
      ws.onerror=()=>{clearTimeout(to);fail()};
      ws.onclose=()=>{clearTimeout(to);if(ok)this.lost(gen,ws);else fail()};
      ws.onmessage=ev=>{const buf=new Uint8Array(ev.data);const all=new Uint8Array(this.rest.length+buf.length);all.set(this.rest);all.set(buf,this.rest.length);
        const {out,rest}=MQ.parse(all);this.rest=rest;
        for(const p of out){
          if(p.type===2&&!done){clearTimeout(to);if(p.body[1]!==0){fail();return}done=true;ok=true;this.ws=ws;ws.send(MQ.sub('myodesa/v2/'+this.code+'/+'));res(true)}
          else if(p.type===3)this.msg(p.body)}}};next()})},
  msg(b){const tl=(b[0]<<8)|b[1];const topic=MQ.dec.decode(b.slice(2,2+tl));const id=topic.split('/').pop();if(id===this.cid)return;
    let st=null;try{st=JSON.parse(MQ.dec.decode(b.slice(2+tl)))}catch(e){return}
    if(!st||typeof st!=='object')return;
    if(st.gone){this.seen.delete(id);COOP.netRemove(id);COOP.status(COOP.countText());return}
    const isNew=!this.seen.has(id);this.seen.set(id,performance.now());COOP.netUpsert(id,st);if(isNew)COOP.status(COOP.countText())},
  lost(gen,ws){if(gen!==this.gen||!this.active)return;this.ws=null;this.st('Connection lost — reconnecting…');
    this.retry=setTimeout(async()=>{if(gen!==this.gen)return;this.rest=new Uint8Array(0);const ok=await this.open(gen);if(gen!==this.gen)return;if(ok)this.st('Room code: '+this.code+' — reconnected',true);else this.lost(gen,null)},3000)},
  async enter(code){
    this.stop();const gen=this.gen;this.code=code;this.cid=Math.random().toString(36).slice(2,10);this.rest=new Uint8Array(0);this.seen.clear();
    this.st('Connecting to room '+code+'…');
    if(typeof WebSocket==='undefined'){this.st('This browser cannot connect online.');return}
    const ok=await this.open(gen,true);if(gen!==this.gen)return;
    if(!ok){this.st('Could not reach the online server (it may be blocked on this network). Try again, or use the Claude link.');return}
    // leave the shared Claude lobby: this room is private to the code
    for(const u of COOP.unsubs||[])try{u()}catch(e){}COOP.unsubs=[];COOP.room=null;COOP.clearAll();
    this.active=true;COOP.myId='n:'+this.cid;
    this.ping=setInterval(()=>{if(this.ws&&this.ws.readyState===1)this.ws.send(MQ.ping())},20000);
    this.sweep=setInterval(()=>{const now=performance.now();for(const [id,t] of this.seen)if(now-t>7000){this.seen.delete(id);COOP.netRemove(id);COOP.status(COOP.countText())}},2000);
    this.st('Room code: '+code+' — tell your friends to type it and press Join',true);$('netCode').value=code;
    COOP.status(COOP.countText());COOP.push(true)},
  create(){this.enter(String(1000+Math.floor(Math.random()*9000)))},
  join(raw){const code=String(raw||'').replace(/\D/g,'').slice(0,4);if(code.length!==4){this.st('Type the 4-digit room code');return}this.enter(code)},
  send(st,force){const now=performance.now();if(!this.ws||this.ws.readyState!==1)return false;if(!force&&now-this.lastSend<110)return false;this.lastSend=now;
    try{this.ws.send(MQ.pub(this.topic(this.cid),JSON.stringify(st)))}catch(e){return false}return true}
};
