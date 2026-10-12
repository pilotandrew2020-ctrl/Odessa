// ===================== trees: species meshes, global instancing =====================
// species: 0 plane/chestnut (broad), 1 linden/acacia (round, smaller), 2 poplar (columnar), 3 young tree, 4 spruce/thuja (conifer)
const TREE_SP=[];
function treeLimbBuilder(g){
  return (x0,y0,z0,x1,y1,z1,r0,r1)=>{const dx=x1-x0,dy=y1-y0,dz=z1-z0,L=Math.hypot(dx,dy,dz);const ax=[dx/L,dy/L,dz/L];
    let up=Math.abs(ax[1])<.9?[0,1,0]:[1,0,0];let b1=cross3(ax,up);let l=Math.hypot(...b1);b1=b1.map(v=>v/l);const b2=cross3(ax,b1);
    const seg=r0>.14?7:4;for(let i=0;i<seg;i++){const a0=i/seg*6.283,a1=(i+1)/seg*6.283;
      const P=(a,t,rr)=>[x0+dx*t+(b1[0]*Math.cos(a)+b2[0]*Math.sin(a))*rr,y0+dy*t+(b1[1]*Math.cos(a)+b2[1]*Math.sin(a))*rr,z0+dz*t+(b1[2]*Math.cos(a)+b2[2]*Math.sin(a))*rr];
      const N=a=>[b1[0]*Math.cos(a)+b2[0]*Math.sin(a),b1[1]*Math.cos(a)+b2[1]*Math.sin(a),b1[2]*Math.cos(a)+b2[2]*Math.sin(a)];
      const ids=[g.v({position:P(a0,0,r0),normal:N(a0),uv:[i/seg,0]}),g.v({position:P(a1,0,r0),normal:N(a1),uv:[(i+1)/seg,0]}),g.v({position:P(a1,1,r1),normal:N(a1),uv:[(i+1)/seg,L/2]}),g.v({position:P(a0,1,r1),normal:N(a0),uv:[i/seg,L/2]})];
      g.quad(ids[0],ids[3],ids[2],ids[1])}}}
// leaf clump: several crossed cards around a centre, normals pointing out from the crown centre (soft round shading)
function leafClump(lg,r,cx,cy,cz,rad,cards,crown){for(let i=0;i<cards;i++){
  const u=r()*2-1,th=r()*6.283,rr=Math.sqrt(1-u*u);const px=cx+Math.cos(th)*rr*rad*.55,py=cy+u*rad*.45,pz=cz+Math.sin(th)*rr*rad*.55;
  const s=rad*(.95+r()*.6);const ry=r()*6.283,rx=(r()-.5)*1.3;const c=Math.cos(ry),sn=Math.sin(ry),cr=Math.cos(rx),sr=Math.sin(rx);
  const T=(x,y)=>{const y2=y*cr,z2=y*sr;return [px+x*c+z2*sn,py+y2,pz-x*sn+z2*c]};
  const nrm=[px-crown[0],(py-crown[1])*1.3+rad*.3,pz-crown[2]];const nl=Math.hypot(...nrm)||1;const n=nrm.map(v=>v/nl);
  const u0=((r()*2)|0)*.5,v0=.5;
  const ids=[[-s/2,-s/2,0,0],[s/2,-s/2,1,0],[s/2,s/2,1,1],[-s/2,s/2,0,1]].map(([x,y,a,b])=>lg.v({position:T(x,y),normal:n,uv:[u0+a*.5,v0+b*.5]}));
  lg.quad(ids[0],ids[1],ids[2],ids[3])}}
function makeTreeSpecies(){
  const mk=(seed,fn)=>{const g=new GB({position:3,normal:3,uv:2}),lg=new GB({position:3,normal:3,uv:2});const r=mkRand(seed);fn(treeLimbBuilder(g),lg,r);return {trunk:g.build(),leaf:lg.build()}};
  // 0 broad plane tree: trunk splits into 4-5 big limbs, clumps at limb ends
  TREE_SP[0]=mk(11,(limb,lg,r)=>{limb(0,-.3,0,0,3.4,0,.36,.26);const crown=[0,7.6,0];const ends=[];
    for(let i=0;i<5;i++){const a=i/5*6.283+r()*.6;const ex=Math.cos(a)*(2.6+r()*1.4),ez=Math.sin(a)*(2.6+r()*1.4),ey=6.4+r()*2.4;limb(0,3.2,0,ex*.55,ey-1.2,ez*.55,.2,.13);limb(ex*.55,ey-1.2,ez*.55,ex,ey,ez,.13,.06);ends.push([ex,ey,ez])}
    limb(0,3.2,0,.3,9.6,-.2,.18,.06);ends.push([.3,9.8,-.2]);
    for(const [x,y,z] of ends)leafClump(lg,r,x,y+.3,z,2.6,7,crown);for(let i=0;i<6;i++){const a=r()*6.283;leafClump(lg,r,Math.cos(a)*1.6,7+r()*2.5,Math.sin(a)*1.6,2.2,4,crown)}});
  // 1 linden / acacia: round smaller crown made of clumps
  TREE_SP[1]=mk(23,(limb,lg,r)=>{limb(0,-.3,0,0,2.6,0,.24,.17);const crown=[0,5.4,0];const ends=[];
    for(let i=0;i<4;i++){const a=i/4*6.283+r()*.8;const ex=Math.cos(a)*(1.6+r()),ez=Math.sin(a)*(1.6+r()),ey=4.8+r()*1.6;limb(0,2.4,0,ex,ey,ez,.13,.05);ends.push([ex,ey,ez])}
    ends.push([0,6.8,0]);for(const [x,y,z] of ends)leafClump(lg,r,x,y,z,2.2,7,crown);for(let i=0;i<4;i++)leafClump(lg,r,(r()-.5)*2,4.6+r()*2,(r()-.5)*2,1.8,4,crown)});
  // 2 poplar: tall columnar
  TREE_SP[2]=mk(37,(limb,lg,r)=>{limb(0,-.3,0,0,13,0,.3,.06);const crown=[0,9,0];
    for(let i=0;i<14;i++){const y=3.5+i*.75;const a=r()*6.283,rr=(1-Math.abs(i-6)/9)*1.5;leafClump(lg,r,Math.cos(a)*rr*.5,y,Math.sin(a)*rr*.5,1.7+rr*.3,3,crown)}});
  // 3 young tree / shrub-tree
  TREE_SP[3]=mk(41,(limb,lg,r)=>{limb(0,-.2,0,0,2.2,0,.09,.06);const crown=[0,3.2,0];for(let i=0;i<4;i++){const a=i*1.6;leafClump(lg,r,Math.cos(a)*.6,2.6+r()*1.2,Math.sin(a)*.6,1.2,4,crown)}});
  // 4 conifer (spruce / thuja): stacked cone of cards
  TREE_SP[4]=mk(53,(limb,lg,r)=>{limb(0,-.2,0,0,7.5,0,.2,.04);const crown=[0,3.5,0];
    for(let i=0;i<10;i++){const y=1+i*.62,rr=(1-i/10)*1.9+.25;for(let k=0;k<6;k++){const a=k/6*6.283+i*.5;const px=Math.cos(a)*rr*.5,pz=Math.sin(a)*rr*.5;
      const s=rr*1.25;const c=Math.cos(a),sn=Math.sin(a);const n=[c,.4,sn];const u0=(k&1)*.5,v0=0;
      const P=(x,y2)=>[px+c*x*.3-sn*x,y+y2,pz+sn*x*.3+c*x];const ids=[[-s/2,-.4,0,0],[s/2,-.4,1,0],[s/2,.9,1,1],[-s/2,.9,0,1]].map(([x,yy,a2,b])=>lg.v({position:P(x,yy),normal:n,uv:[u0+a2*.5,v0+b*.5]}));lg.quad(ids[0],ids[1],ids[2],ids[3])}}});
}
const TREE_COL=[[[.42,.58,.30],[.50,.64,.32],[.36,.52,.28]],[[.48,.62,.30],[.56,.68,.34],[.44,.58,.30]],[[.40,.56,.30],[.46,.60,.32]],[[.55,.70,.36],[.62,.74,.38]],[[.20,.34,.22],[.24,.38,.24],[.18,.30,.22]]];
const TREE_COL_W=[.55,.42,.36];
// global instanced manager: all trees of loaded chunks in 2 draw calls per species
const TREES={chunks:new Map(),meshes:[],dirty:false,cap:[0,0,0,0,0],
  init(scene){for(let s=0;s<5;s++){const t=new THREE.InstancedMesh(TREE_SP[s].trunk,MATS.bark,1),l=new THREE.InstancedMesh(TREE_SP[s].leaf,MATS.leaves,1);
    for(const m of [t,l]){m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;m.count=0;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(m)}
    l.setColorAt(0,new THREE.Color(1,1,1));l.customDepthMaterial=LEAF_DEPTH;this.meshes[s]={t,l}}},
  add(id,pts){this.chunks.set(id,pts);this.dirty=true},
  remove(id){if(this.chunks.delete(id))this.dirty=true},
  update(px,pz,maxD){if(!this.dirty&&(this.lastX!==undefined&&Math.hypot(px-this.lastX,pz-this.lastZ)<30))return;this.dirty=false;this.lastX=px;this.lastZ=pz;
    const lists=[[],[],[],[],[]];const md2=maxD*maxD;for(const pts of this.chunks.values())for(const p of pts){const dx=p[0]-px,dz=p[1]-pz;if(dx*dx+dz*dz<md2)lists[p[2]].push(p)}
    const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Sv=new THREE.Vector3(),T=new THREE.Vector3(),E=new THREE.Euler(),C=new THREE.Color();
    for(let s=0;s<5;s++){const L=lists[s],ms=this.meshes[s];
      if(L.length>this.cap[s]){const cap=Math.ceil(L.length*1.3)+16;for(const k of ['t','l']){const old=ms[k];const m=new THREE.InstancedMesh(old.geometry,old.material,cap);m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          if(k==='l'){m.setColorAt(0,C.setRGB(1,1,1));m.customDepthMaterial=LEAF_DEPTH}scene.remove(old);old.dispose&&old.dispose();scene.add(m);ms[k]=m}this.cap[s]=cap}
      L.forEach((p,i)=>{const [x,z,sp,sc]=p;const h=((x*12.9898+z*78.233)%1+1)%1;E.set(0,h*6.28,0);Q.setFromEuler(E);Sv.set(sc*(.9+h*.2),sc,sc*(.9+h*.2));T.set(x,p[4]!==undefined?p[4]:groundH(x,z)-.05,z);if(p[4]===undefined)p[4]=T.y;M.compose(T,Q,Sv);
        ms.t.setMatrixAt(i,M);ms.l.setMatrixAt(i,M);const cs=TREE_COL[sp];const c=cs[(h*cs.length)|0];const v=.88+h*.24;
        const W=S.season==='winter'&&sp!==4;C.setRGB(c[0]*v,c[1]*v,c[2]*v);ms.l.setColorAt(i,C)});
      ms.t.count=ms.l.count=L.length;ms.t.instanceMatrix.needsUpdate=ms.l.instanceMatrix.needsUpdate=true;if(ms.l.instanceColor)ms.l.instanceColor.needsUpdate=true}}};
const TREE_CLEAR=[];function treeClear(x,z){for(let i=0;i<TREE_CLEAR.length;i+=3){const dx=x-TREE_CLEAR[i],dz=z-TREE_CLEAR[i+1];if(dx*dx+dz*dz<TREE_CLEAR[i+2]*TREE_CLEAR[i+2])return true}return false}
function treesForChunk(id,c,pts,solid){
  const [x0,z0]=chunkOrigin(id);const R=rng(id*9781+7);const P=D.nodes,wn=D.wn;
  // street trees along roads (plane trees / acacias / poplars in rows)
  for(let s=D.segStart[id];s<D.segStart[id+1];s++){const i=D.seg[s],k=D.wOf[i],cl=D.wcls[k];if(cl>2||D.wfl[k]===2)continue;
    const a=wn[i]*2,b=wn[i+1]*2;const ax=P[a],az=P[a+1],bx=P[b],bz=P[b+1];const L=Math.hypot(bx-ax,bz-az);if(L<4)continue;if(EXCL_ROAD&&EXCL_ROAD(ax,az,bx,bz))continue;
    const tx=(bx-ax)/L,tz=(bz-az)/L,nx=-tz,nz=tx;const ped=D.wfl[k]===1;const off=ped?HW[cl]+SW[cl]+2.4:(cl<2?HW[cl]+.95:HW[cl]+1.6);
    const spc=ped?9:(cl<2?9:12);const ca=D.cum[i];const sp0=hjs(k,3)<.6?0:(hjs(k,5)<.5?1:2);
    for(let u=Math.ceil(ca/spc)*spc+R()*2;u<D.cum[i+1];u+=spc){if(D.dPrev[i]+u-ca<10&&D.dPrev[i]<999||D.dNext[i+1]+(L-(u-ca))<10)continue;
      for(const sd of [-1,1]){if(R()<(cl===2?.45:.15))continue;const x=ax+tx*(u-ca)+nx*off*sd,z=az+tz*(u-ca)+nz*off*sd;if(solid(x,z,1.4)||blockedStatic(x,z,1.5)||treeClear(x,z))continue;
        pts.push([x,z,R()<.85?sp0:(R()<.5?1:3),.85+R()*.35])}}}
  // land-use tree density (parks, yards, woods)
  const tw=D.tw;
  for(let j=0;j<CH/20;j++)for(let i=0;i<CH/20;i++){const gx=Math.floor((x0-BB[0])/20)+i,gz=Math.floor((z0-BB[2])/20)+j;if(gx<0||gz<0||gx>=tw||gz>=D.th)continue;
    const v=D.lu[(gz*tw+gx)*4+1]/255;let n=v*2.6*Qp().tdens;n=Math.floor(n)+(R()<n%1?1:0);
    for(let q=0;q<n;q++){const x=x0+(i+R())*20,z=z0+(j+R())*20;if(groundH(x,z)<SL+1)continue;if(solid(x,z,2.4)||nearRoad(id,x,z,.8)||blockedStatic(x,z,2)||treeClear(x,z))continue;
      let t=R();t=t<.34?0:t<.62?1:t<.74?2:t<.86?4:3;pts.push([x,z,t,.75+R()*.5])}}
}
