// funicular lower station interior
INTERIORS.funi=()=>simpleInterior('funi',4,{w:12,d:9,h:4.2,floor:0x6e5a40,fr:.45,wall:0xb9a982,title:'Funicular station',sub:'Odesa, since 1902',lights:[2.5,6.5],lcol:0xffe6b8,li:1.0,door:1.9,
  furnish(P,grp,ox,oz,hw,D){
    const wood=sRGB('#7a5030'),dark=sRGB('#3a2a1e'),green=sRGB('#2f7a4f');
    // wooden benches along the side walls and one in the middle
    const bench=(x,z,w,d,ry2)=>{P.box(x,INT_Y+.45,z,w,.08,d,ry2||0,wood,5);P.box(x,INT_Y+.82,z-(d>.6?0:.25),w,.45,.08,ry2||0,wood,5);P.box(x-w/2+.15,INT_Y+.22,z,.1,.44,d,0,dark,5);P.box(x+w/2-.15,INT_Y+.22,z,.1,.44,d,0,dark,5);
      LOW_OBB.push(x,z,w/2,d/2,1,0);INTERACT.push({x,z:z+.0,r:1.5,label:'Sit on the bench',cond:()=>!player.sit,fn:()=>{player.sit={x,z:z+.1,y:INT_Y+.1,yaw:Math.PI};cam.yaw=Math.PI}})};
    bench(-hw+1.1,3.2,.6,2.6);bench(-hw+1.1,6.2,.6,2.6);bench(hw-1.1,3.2,.6,2.6);bench(hw-1.1,6.2,.6,2.6);bench(0,5.6,3.2,.7);
    // ticket window
    P.box(ox+3,INT_Y+.6,oz+D-1.2,4.2,1.2,.8,0,green,1);P.box(ox+3,INT_Y+1.22,oz+D-1.2,4.3,.06,.9,0,sRGB('#ddd'),1);P.box(ox+3,INT_Y+2.0,oz+D-.5,3.6,1.2,.06,0,sRGB('#27323a'),2);
    LOW_OBB.push(ox+3,oz+D-1.2,2.1,.4,1,0);
    // turnstiles
    for(const x of [-1.6,-.2]){P.box(ox+x,INT_Y+.5,oz+D-2.6,.12,1.0,.12,0,sRGB('#a0a4a8'),6);P.box(ox+x+.45,INT_Y+.95,oz+D-2.6,.9,.06,.06,0,sRGB('#a0a4a8'),6)}
    // old tram-style stove? no. Large framed photos and timetable
    for(let k=0;k<4;k++){P.box(ox-hw+.12,INT_Y+2.0,oz+1.5+k*1.9,.08,1.0,1.4,0,dark,5);P.box(ox-hw+.17,INT_Y+2.0,oz+1.5+k*1.9,.04,.84,1.24,0,sRGB(['#b8a888','#9aa7a0','#c2b48e','#8d98a2'][k]),0)}
    const tb=plateMesh(['РОЗКЛАД','щодня 8:00 — 22:00','квиток ₴10'],{w:512,h:256,sizes:[70,40,50],color:'#2a2a2a',bg:'#f3ecd6',weight:'800'},1.9,.95,0);tb.position.set(ox+hw-.06,INT_Y+2.2,oz+4.5);tb.rotation.y=-Math.PI/2;grp.add(tb);
    for(const [x,z] of [[hw-.9,1.2],[-hw+.9,8.0]]){P.cyl(ox+x,INT_Y,oz+z,.25,.2,.5,10,sRGB('#a05a3a'),1);P.cyl(ox+x,INT_Y+.5,oz+z,.02,.02,.9,5,sRGB('#2f6a2a'),1);P.cyl(ox+x,INT_Y+1.0,oz+z,.4,.1,.5,8,sRGB('#3a8a3a'),0)}
    neonSign(grp,'ФУНІКУЛЕР · FUNICULAR',ox,INT_Y+3.3,oz+D-.12,Math.PI,4.6,'#9be3b0');
    INTERACT.push({x:ox+3,z:oz+D-2.4,r:2,label:'Buy a ticket',fn:()=>toast('Ticket ₴10','the funicular leaves from the platform outside')})}});
