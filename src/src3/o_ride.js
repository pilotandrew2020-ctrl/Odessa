// ===================== riding: city buses / minibuses and a seat in a friend's car =====================
let busNear=null,passNear=null;
function rideExitSpot(x,z,yaw,y,sides){
  const cs=Math.cos(yaw),sn=Math.sin(yaw);
  for(const sd of sides)for(const al of [0,2,-2,4]){const px=x+cs*sd*2.9+sn*al,pz=z-sn*sd*2.9+cs*al;if(!insideAny(px,pz,.35,y+.5)){return [px,pz]}}
  return [x+cs*sides[0]*3.2,z-sn*sides[0]*3.2]}
function initRides(){
  INTERACT.push({x:0,z:0,r:1e9,label:'Get on the bus',cond:()=>{if(RIDE.on||DRIVE.on||PORTAL.cur||player.sit)return false;busNear=null;
    for(const c of CARS){if(!c.route||c.v>2.4)continue;const fx=Math.sin(c.yaw),fz=Math.cos(c.yaw),dx=player.x-c.x,dz=player.z-c.z,a=dx*fx+dz*fz,b=dx*fz-dz*fx;
      if(Math.abs(a)<(c.type===8?6.4:3.6)&&Math.abs(b)<(c.type===8?3.8:3)&&Math.abs(player.y-c.y)<2.6){busNear=c;return true}}return false},fn:()=>boardBus(busNear)});
  INTERACT.push({x:0,z:0,r:1e9,label:'Sit in your friend\'s car',cond:()=>{if(RIDE.on||DRIVE.on||PORTAL.cur||player.sit||typeof COOP==='undefined'||!COOP.online())return false;passNear=null;
    for(const R of COOP.peers.values()){const s=R.st;if(!R.has||!s||!s.in||s.m!=='car'||(s.zn||'')!=='')continue;if(Math.hypot(R.x-player.x,R.z-player.z)<5.2&&Math.abs(R.y-player.y)<2.5){passNear=R;return true}}return false},fn:()=>boardPass(passNear)});
}
function rideStart(t,msg,sub){RIDE.on=true;RIDE.tram=t;player.vx=player.vz=0;player.scoot=false;$('bScoot').classList.remove('on');player.sit=null;cam.init=false;toast(msg,sub);if(window.AUD)AUD.beep()}
function boardBus(c){if(!c)return;c.dw=Math.max(c.dw||0,3.5);const big=c.type===8;
  rideStart({kind:'bus',car:c,x:c.x,y:c.y+1.2,z:c.z,yaw:c.yaw,v:c.v,camDist:big?15:11,camH:big?3.6:2.8,seat:big?[-1.6,.85,.95]:[-.4,.6,.8]},'You\'re on the bus','at a stop press E to get off')}
function boardPass(R){if(!R)return;rideStart({kind:'pass',R,x:R.x,y:R.y+1,z:R.z,yaw:R.yaw,v:0,px:R.x,pz:R.z,camDist:9,camH:2.4},'In the car','you\'re the passenger. Press E to get out when it stops')}
function seatPlayer(t,x,y,z,yaw,dt){player.x=x;player.y=y;player.z=z;player.yaw=yaw;player.vx=player.vz=0;PLR.root.position.set(x,y,z);PLR.root.rotation.y=yaw;animPlayer(PLR,{spd:0,mode:'sit'},dt)}
function busStep(t,dt){const c=t.car;if(!CARS.includes(c)){RIDE.on=false;RIDE.tram=null;cam.init=false;return}
  t.x=c.x;t.y=c.y+1.2;t.z=c.z;t.yaw=c.yaw;t.v=c.v;const fx=Math.sin(c.yaw),fz=Math.cos(c.yaw),lx=Math.cos(c.yaw),lz=-Math.sin(c.yaw);
  seatPlayer(t,c.x+fx*t.seat[0]+lx*t.seat[1],c.y+t.seat[2],c.z+fz*t.seat[0]+lz*t.seat[1],c.yaw,dt)}
function passStep(t,dt){const R=t.R,s=R&&R.st;
  if(!R||!R.has||!s||s.m!=='car'||(s.zn||'')!==''){RIDE.on=false;RIDE.tram=null;cam.init=false;toast('Your friend left the car','');return}
  const sp=Math.hypot(R.x-t.px,R.z-t.pz)/Math.max(dt,1e-3);t.v+=(sp-t.v)*Math.min(1,dt*4);t.px=R.x;t.pz=R.z;t.x=R.x;t.y=R.y+1;t.z=R.z;t.yaw=R.yaw;
  seatPlayer(t,R.x-Math.cos(R.yaw)*.55,R.y+.62,R.z+Math.sin(R.yaw)*.55,R.yaw,dt)}
function busLeave(t){const c=t.car;if(c.v>2.5){toast('Wait for the stop','the bus is moving');return}
  RIDE.on=false;RIDE.tram=null;const p=rideExitSpot(c.x,c.z,c.yaw,c.y,[-1,1]);player.x=p[0];player.z=p[1];player.y=groundAt(p[0],p[1],c.y+1);player.vx=player.vz=0;cam.init=false}
function passLeave(t){if(t.v>3){toast('Wait until the car stops','');return}
  const R=t.R;RIDE.on=false;RIDE.tram=null;const p=rideExitSpot(R.x,R.z,R.yaw,R.y,[-1,1]);player.x=p[0];player.z=p[1];player.y=groundAt(p[0],p[1],R.y+1);player.vx=player.vz=0;cam.init=false}
