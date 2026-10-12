// ===================== materials (patched MeshStandardMaterial) =====================
const UNI={
  uL:{value:Array.from({length:16},()=>new THREE.Vector4(0,-999,0,0))},
  uNight:{value:0},uTime:{value:0},uWinter:{value:0},uWet:{value:0},uIndoor:{value:0},
  uSD:{value:null},uLU:{value:null},uSDT:{value:new THREE.Vector4()},
  tAsph:{value:null},tTiles:{value:null},tCob:{value:null},tGrass:{value:null},tDirt:{value:null},tSand:{value:null},tSnow:{value:null},
  tBrick:{value:null},tPlaster:{value:null},tConc:{value:null},tRoof:{value:null},tGran:{value:null},tMarble:{value:null},tWood:{value:null},
};
const GLSL_LIB=`
uniform vec4 uL[16]; uniform float uNight; uniform float uTime; uniform float uWinter; uniform float uWet; uniform float uIndoor;
varying vec3 vW; varying vec3 vNw;
float h12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float h13(vec3 p3){p3=fract(p3*.1031);p3+=dot(p3,p3.zyx+31.32);return fract((p3.x+p3.y)*p3.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h12(i),h12(i+vec2(1,0)),f.x),mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x),f.y);}
float fbm3(vec2 p){return .5*vn(p)+.3*vn(p*2.07+7.1)+.2*vn(p*4.13+3.3);}
vec3 toLin(vec3 c){return c*c*(c*.305+.682)+c*.0125;}
vec3 bumpN(vec3 sp,vec3 sn,vec2 dH,float fd){vec3 sx=dFdx(sp),sy=dFdy(sp);vec3 r1=cross(sy,sn),r2=cross(sn,sx);float det=dot(sx,r1)*fd;vec3 g=sign(det)*(dH.x*r1+dH.y*r2);return normalize(abs(det)*sn-g);}
void lampLight(vec3 wp,vec3 wn,vec3 V,float rough,inout vec3 dif,inout vec3 spc){
  if(uNight<.02)return;
  float sh=max(1.-rough,0.);float pw=2.+300.*sh*sh*sh;
  for(int i=0;i<16;i++){
    vec3 d=uL[i].xyz-wp;float l2=dot(d,d);vec3 L=d*inversesqrt(l2+1e-3);
    float down=smoothstep(-.1,.6,-L.y*-1.);           // lamps shine downward
    float at=uL[i].w/(1.+l2*.018)*down;
    vec3 c=vec3(1.,.58,.25);
    dif+=c*at*(.25+.75*max(dot(wn,L),0.));
    vec3 H=normalize(L+V);spc+=c*at*pow(max(dot(wn,H),0.),pw)*sh*1.5;
  }
  dif*=uNight;spc*=uNight;
}
`;
const PATCH_VS_DECL=`varying vec3 vW; varying vec3 vNw;`;
const PATCH_VS_MAIN=`{vec4 _wp=vec4(transformed,1.);
#ifdef USE_INSTANCING
_wp=instanceMatrix*_wp;
#endif
_wp=modelMatrix*_wp;vW=_wp.xyz;
vec3 _n=objectNormal;
#ifdef USE_INSTANCING
_n=mat3(instanceMatrix)*_n;
#endif
vNw=normalize(mat3(modelMatrix)*_n);}`;
// generic patcher: opts: {vDecl,vBegin,vMain,fDecl,fSurf,uniforms,key,noLamps}
function patchMat(mat,o){
  mat.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,UNI,o.uniforms||{});
    let vs=sh.vertexShader,fs=sh.fragmentShader;
    vs=vs.replace('#include <common>','#include <common>\n'+PATCH_VS_DECL+'\n'+(o.vDecl||''));
    if(o.vBegin)vs=vs.replace('#include <begin_vertex>','#include <begin_vertex>\n'+o.vBegin);
    vs=vs.replace('#include <project_vertex>','#include <project_vertex>\n'+PATCH_VS_MAIN+'\n'+(o.vMain||''));
    fs=fs.replace('#include <common>','#include <common>\n#define tx2(s,uv) texture2D(s,uv,1.15)\n'+GLSL_LIB+'\nuniform sampler2D tAsph,tTiles,tCob,tGrass,tDirt,tSand,tSnow,tBrick,tPlaster,tConc,tRoof,tGran,tMarble,tWood,uSD,uLU;uniform vec4 uSDT;\n'+(o.fDecl||''));
    fs=fs.replace('#include <color_fragment>','#include <color_fragment>\nvec3 sAlb=diffuseColor.rgb;float sRough=roughness;float sMetal=metalness;vec3 sEmis=vec3(0.);float sH=0.;float sBump=0.;float sAO=1.;\n'+(o.fSurf||'')+'\ndiffuseColor.rgb=sAlb;');
    fs=fs.replace(/texture2D\((t[A-Z][A-Za-z]*),/g,'tx2($1,');
    fs=fs.replace('#include <roughnessmap_fragment>','float roughnessFactor=sRough;');
    fs=fs.replace('#include <metalnessmap_fragment>','float metalnessFactor=sMetal;');
    fs=fs.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nsBump*=.55*(1.-smoothstep(3.,15.,length(vViewPosition)));if(sBump>.01)normal=bumpN(-vViewPosition,normal,clamp(vec2(dFdx(sH),dFdy(sH)),-.06,.06)*sBump,faceDirection);');
    fs=fs.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=sEmis;');
    fs=fs.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nreflectedLight.indirectDiffuse*=sAO;reflectedLight.indirectSpecular*=mix(1.,sAO,.5);'+
      (o.noLamps?'':'{vec3 _wn=inverseTransformDirection(normal,viewMatrix);vec3 _V=normalize(cameraPosition-vW);vec3 _d=vec3(0.),_s=vec3(0.);lampLight(vW,_wn,_V,roughnessFactor,_d,_s);reflectedLight.directDiffuse+=diffuseColor.rgb*_d*sAO;reflectedLight.directSpecular+=_s;}'));
    sh.vertexShader=vs;sh.fragmentShader=fs;
  };
  mat.customProgramCacheKey=()=>o.key;
  return mat;
}
// ---------------- ground ----------------
const GROUND_SURF=`
 vec2 p=vW.xz; float k=vK.x, cl=vK.y;
 float sdv=(texture2D(uSD,(p-uSDT.xy)/uSDT.zw).r*255.-128.)*2.;
 vec3 snowC=toLin(texture2D(tSnow,p/4.).rgb);float snowH=texture2D(tSnow,p/4.).a;
 float snowAmt=0.;
 if(k<.5){
   vec4 g=texture2D(tGrass,p/4.),dt=texture2D(tDirt,p/4.);
   vec2 wp=p+vec2(fbm3(p*.031),fbm3(p*.029+7.))*14.-7.;
   vec4 lu=texture2D(uLU,(wp-uSDT.xy)/uSDT.zw);
   float nz=fbm3(p*.045);
   float grass=smoothstep(.18,.62,lu.r+(nz-.5)*.45);
   float m=1.-grass;m=max(m,smoothstep(.62,.8,fbm3(p*.035))*.5);
   sAlb=mix(toLin(g.rgb)*vec3(.95,.85,.8),toLin(dt.rgb),m);sH=mix(g.a,dt.a,m);sRough=.95;sBump=.3;
   sAlb*=1.-.16*lu.g*smoothstep(.3,.7,vn(p*.25));
   float hard=smoothstep(.35,.7,lu.a+(nz-.5)*.3);
   if(hard>.01){vec4 a=texture2D(tAsph,p/3.);vec4 cc=texture2D(tConc,p/3.);vec3 hc=mix(toLin(a.rgb)*1.05,toLin(vec3(.6,.59,.57))*(.8+.4*cc.r),step(.5,vn(p*.02)));
     sAlb=mix(sAlb,hc,hard);sRough=mix(sRough,.85,hard);sH=mix(sH,a.a,hard);}
   float sand=max(1.-smoothstep(38.,62.,sdv),smoothstep(.3,.6,lu.b));
   vec4 sa=texture2D(tSand,p/4.);sAlb=mix(sAlb,toLin(sa.rgb)*.92,sand);sH=mix(sH,sa.a,sand);
   if(vW.y<-28.35){sAlb*=.62;sRough=.35;}
   snowAmt=uWinter*(1.-sand*.6);
 } else if(k<1.5){
   vec4 a=texture2D(tAsph,p/3.5);sAlb=toLin(a.rgb)*.95;sH=a.a;sRough=.88;sBump=.12;
   float hw=cl<.5?5.:(cl<1.5?3.5:2.6);float x=vU*hw;
   float dI=min(vR.y+vR.x,vR.z+(vR.w-vR.x));float mk=0.;
   if(dI>9.){
     if(cl<.5){mk+=step(abs(abs(x)-.18),.07);mk+=step(abs(abs(x)-2.5),.06)*step(.5,fract(vR.x/6.));mk+=step(abs(abs(x)-4.6),.07);}
     else if(cl<1.5){mk+=step(abs(x),.07)*step(.45,fract(vR.x/7.));}
   }
   if(cl<1.5&&dI>2.5&&dI<6.5)mk+=step(.5,fract(x/1.1))*step(abs(x),hw-.4);
   mk=clamp(mk,0.,1.)*smoothstep(.25,.6,vn(p*3.1)+.35);
   sAlb=mix(sAlb,vec3(.62,.62,.58),mk);sRough=mix(sRough,.6,mk);
   sAlb*=1.-.1*smoothstep(.75,1.,abs(vU));
   float tr=exp(-pow((abs(x)-hw*.5)*1.6,2.))*.08;sAlb*=1.-tr;          // tyre tracks
   float pud=smoothstep(.62,.72,fbm3(p*.06+3.))*max(uWet,.15+uWinter*.4);
   sAlb*=1.-.45*pud;sRough=mix(sRough,.05,pud);sH=mix(sH,.5,pud);
   snowAmt=uWinter*(.25+.6*smoothstep(.55,1.,abs(vU)))*(.7+.3*vn(p*.5));
 } else if(k<2.5){
   vec4 t=texture2D(tTiles,p/2.);sAlb=toLin(t.rgb)*.85;sH=t.a;sRough=.8;sBump=.5;
   sAlb*=.85+.2*vn(p*.15);
   snowAmt=uWinter*smoothstep(.3,.6,vn(p*.4))*.9;
 } else if(k<3.5){
   vec4 t=texture2D(tGran,p/1.5+vW.y);sAlb=toLin(t.rgb)*1.1;sH=t.a;sRough=.7;sBump=.3;snowAmt=uWinter*.5;
 } else if(k<4.5){
   vec4 a=texture2D(tAsph,p/2.5);sAlb=toLin(a.rgb)*1.3+vec3(.012,.01,0.);sH=a.a;sRough=.9;sBump=.4;
   sAlb*=1.-.15*smoothstep(.6,1.,abs(vU));snowAmt=uWinter*.85;
 } else if(k<5.5){
   vec4 c=texture2D(tCob,p/2.2);sAlb=toLin(c.rgb);sH=c.a;sRough=.65;sBump=1.;
   float pud=smoothstep(.66,.74,fbm3(p*.08+1.))*max(uWet,.1);sRough=mix(sRough,.08,pud);sAlb*=1.-.3*pud;
   snowAmt=uWinter*smoothstep(.2,.7,vn(p*.3))*.8;
 } else if(k<6.5){
   vec4 c=texture2D(tMarble,p/4.);sAlb=toLin(c.rgb)*.9;float ch=step(.5,fract(floor(p.x/1.2)*.5+floor(p.y/1.2)*.5));sAlb*=mix(.72,1.,ch);sRough=.2;sH=0.;
   snowAmt=0.;
 } else if(k<7.5){
   vec4 d=texture2D(tDirt,p/4.);sAlb=toLin(d.rgb);sH=d.a;sRough=.95;sBump=.6;snowAmt=uWinter;
 } else if(k<8.5){ // concrete pavers, stretcher bond, mixed grey/sand colours (courtyard)
   float ca=cos(cl),sa=sin(cl);vec2 q=vec2(ca*p.x+sa*p.y,-sa*p.x+ca*p.y)*vec2(5.,10.);
   float row=floor(q.y);q.x+=mod(row,2.)*.5;vec2 id=vec2(floor(q.x),row),f=fract(q);
   float h=h12(id*1.37+.5);vec3 pc=h<.62?vec3(.56,.56,.54):(h<.82?vec3(.62,.58,.50):(h<.94?vec3(.46,.46,.45):vec3(.60,.52,.46)));
   pc*=.94+.12*h12(id+3.1);vec4 cn=texture2D(tConc,p/1.7);pc*=.88+.24*cn.r;
   float fw=max(fwidth(q.x),fwidth(q.y));float e=min(min(f.x,1.-f.x)*2.,min(f.y,1.-f.y));pc=mix(pc,vec3(.56,.55,.52)*(.88+.24*cn.r),smoothstep(.03,.12,fw));
   float joint=(1.-smoothstep(.06,.14+fw,e))*(1.-smoothstep(.03,.11,fw))*.85;sAlb*=1.;
   sAlb=toLin(pc)*(1.-.55*joint);sH=1.-joint;sBump=.5;sRough=.85;
   float pud=smoothstep(.7,.78,fbm3(p*.07+5.))*uWet;sAlb*=1.-.3*pud;sRough=mix(sRough,.1,pud);
   snowAmt=uWinter*(.75+.25*vn(p*.4));
 } else if(k>9.5){ // sports court: green/terracotta with white lines
   vec4 a=texture2D(tAsph,p/2.);sAlb=mix(vec3(.10,.24,.14),vec3(.33,.12,.08),step(.5,fract(floor(p.x/40.)*.37+floor(p.y/40.)*.61)))*(.85+.3*a.r);sRough=.7;
   snowAmt=uWinter*.85;
 } else { // rubber safety mat
   float fr=smoothstep(.3,1.,max(fwidth(p.x),fwidth(p.y))*7.);sAlb=mix(vec3(.05,.10,.07),vec3(.20,.07,.05),step(.55,vn(p*.18)))*(.9+.2*mix(vn(p*7.),.5,fr));sRough=.95;sH=0.;sBump=0.;snowAmt=uWinter*.8;
 }
 snowAmt=clamp(snowAmt,0.,1.);
 sAlb=mix(sAlb,snowC,snowAmt);sH=mix(sH,snowH,snowAmt);sRough=mix(sRough,.75,snowAmt);
`;
// ---------------- buildings ----------------
const BLD_DECL=`
varying vec2 vUV; varying vec4 vP; varying float vQ; varying vec3 vT;
vec3 palette(float s,float h){
 if(s<.5){ if(h<.16)return vec3(.80,.64,.40); if(h<.30)return vec3(.86,.78,.62); if(h<.44)return vec3(.84,.64,.52);
   if(h<.58)return vec3(.88,.78,.50); if(h<.70)return vec3(.76,.62,.58); if(h<.80)return vec3(.66,.70,.58); if(h<.9)return vec3(.70,.74,.76); return vec3(.90,.87,.80);}
 if(s<1.5){ if(h<.4)return vec3(.88,.86,.78); if(h<.7)return vec3(.84,.74,.52); return vec3(.75,.77,.80);}
 if(s<2.5){ if(h<.4)return vec3(.80,.78,.74); if(h<.6)return vec3(.62,.36,.28); if(h<.8)return vec3(.74,.72,.68); return vec3(.82,.76,.62);}
 if(s<3.5){ if(h<.5)return vec3(.78,.77,.74); if(h<.75)return vec3(.72,.73,.74); return vec3(.80,.76,.68);}
 if(s<4.5){ if(h<.3)return vec3(.82,.50,.32); if(h<.55)return vec3(.40,.52,.66); if(h<.8)return vec3(.84,.82,.78); return vec3(.60,.64,.56);}
 if(s<5.5){ if(h<.4)return vec3(.60,.30,.22); if(h<.7)return vec3(.78,.64,.46); return vec3(.68,.40,.30);}
 if(s<6.5){ if(h<.2)return vec3(.90,.86,.72); if(h<.4)return vec3(.84,.70,.50); if(h<.55)return vec3(.72,.78,.68); if(h<.7)return vec3(.86,.84,.82); if(h<.85)return vec3(.78,.62,.52); return vec3(.68,.74,.82);}
 if(s<7.5){ if(h<.5)return vec3(.58,.60,.62); return vec3(.50,.56,.62);}
 if(s<8.5) return vec3(.86,.84,.80);
 if(s<9.5) return vec3(.87,.80,.69);
 if(s<10.5) return vec3(.90,.84,.70);
 return vec3(.88,.80,.56);
}
vec3 roomColor(vec2 c,vec2 ws,float sill,vec3 rd,float sd,float lit){
 float RW=max(ws.x*1.7,2.8),RH=2.75,RD=4.5;
 vec3 ro=vec3(RW*.5+(c.x-.5)*ws.x,sill+c.y*ws.y,0.);
 vec3 tm=(step(0.,rd)*vec3(RW,RH,RD)-ro)/rd;
 float t=min(min(tm.x,tm.y),tm.z);vec3 hp=ro+rd*t;
 float a=h12(vec2(sd,7.3)),b=h12(vec2(sd,1.1)),e=h12(vec2(sd,4.7));
 vec3 wallC=a<.25?vec3(.78,.72,.58):a<.5?vec3(.62,.70,.66):a<.75?vec3(.80,.66,.62):vec3(.70,.70,.76);
 vec3 col;
 if(t==tm.z){col=wallC;
   if(b<.5&&hp.x>RW*.15&&hp.x<RW*.55&&hp.y<1.95)col=b<.25?vec3(.30,.22,.16):vec3(.55,.45,.35);   // wardrobe
   else if(b>=.5&&hp.x>RW*.3&&hp.x<RW*.75&&hp.y<.85)col=vec3(.42,.26,.22);                       // sofa
   if(e<.3&&hp.x>RW*.6&&hp.x<RW*.9&&hp.y>1.2&&hp.y<1.9)col=vec3(.15,.13,.12);                   // picture
 } else if(t==tm.y){col=rd.y<0.?(e<.5?vec3(.42,.28,.18):vec3(.55,.45,.36)):vec3(.88,.87,.85);}
 else col=wallC*.82;
 col*=.55+.45*(1.-hp.z/RD);
 float light=mix(.16,1.,uIndoor);
 if(lit>.5){float lamp=exp(-length(hp.xz-vec2(RW*.5,RD*.5))*.6)*step(RH-.05,hp.y+.001);col*=1.+lamp*2.;}
 return col;
}
`;
const BLD_SURF=`
 float st=vP.x, fl=vP.y, sd=vP.z/255., L=vP.w;
 vec3 n=normalize(vNw);
 float u=vUV.x, v=vUV.y;
 bool home=st>8.5&&st<9.5;bool homeYard=vQ>8.5&&vQ<9.5;bool homeStreet=vQ>9.5&&vQ<10.5;bool shopW=(vQ>7.5&&vQ<8.5)||homeStreet;bool entW=vQ>10.5||homeYard;
 vec3 base=palette(st,fract(sd*13.7+.11));
 if(vP.z>253.5)base=vec3(.92,.66,.70);   // pink one-storey shops (Chikalenka)
 if(vQ>.5&&vQ<3.5){
   if(vQ<1.5){vec4 r=texture2D(tRoof,vW.xz/4.);sAlb=toLin(r.rgb);sH=r.a;sRough=.85;sBump=.4;}
   else if(vQ<2.5){float h=fract(sd*7.31);vec3 rc=h<.35?vec3(.50,.22,.15):(h<.6?vec3(.30,.38,.36):(h<.8?vec3(.52,.52,.54):vec3(.42,.28,.20)));
     float rib=smoothstep(.8,.95,fract((vW.x*.73+vW.z*.68)*2.));sAlb=rc*(.85+.2*vn(vW.xz*1.5));sH=rib;sBump=.6;sRough=.5;sMetal=.3;}
   else {vec4 c=texture2D(tConc,vec2(u,v)/4.);sAlb=vec3(.62,.61,.59)*(.8+.4*c.r);sRough=.9;}
   float snow=uWinter*smoothstep(.3,.6,n.y);sAlb=mix(sAlb,vec3(.9,.92,.95),snow);sRough=mix(sRough,.8,snow);
 } else if(vQ>5.5&&vQ<6.5){ // concrete slab (canopy)
   vec4 c=texture2D(tConc,vW.xz/3.+vW.y);sAlb=vec3(.6,.6,.58)*(.8+.4*c.r);sRough=.9;
   sAlb=mix(sAlb,vec3(.9,.92,.95),uWinter*step(.5,n.y));
 } else if(vQ>4.5&&vQ<5.5){ // loggia side
   vec4 c=texture2D(tConc,vec2(u,v)/3.);sAlb=(st>8.5&&st<9.5?vec3(.9,.88,.84):vec3(.80,.80,.78))*(.85+.3*c.r);sRough=.85;
 } else if(vQ>6.5&&vQ<7.5){ // trims / white stone
   vec4 c=texture2D(tPlaster,vec2(u,v)/3.);sAlb=vec3(.86,.84,.78)*(.9+.2*c.r);sRough=.7;
 } else {
 // ---------- facade (wall or loggia front) ----------
 float FH=2.8,GF=0.,CS=3.2,WW=1.45,WH=1.45,SILL=.85;
 if(st<.5){FH=4.;GF=4.6;CS=3.5;WW=1.3;WH=2.35;}
 else if(st<1.5){FH=3.4;CS=3.1;WW=1.1;WH=1.6;SILL=.9;}
 else if(st<2.5){FH=2.8;CS=3.2;}
 else if(st<3.5){FH=2.8;CS=3.0;WW=1.5;}
 else if(st<4.5){FH=3.1;CS=2.4;WW=2.1;WH=2.0;SILL=.55;GF=4.5;}
 else if(st<5.5){FH=3.0;CS=3.4;WW=1.5;WH=1.6;GF=3.6;}
 else if(st<6.5){FH=3.0;CS=3.4;WW=1.2;WH=1.35;SILL=.9;}
 else if(st<7.5){FH=4.5;CS=6.;WW=4.;WH=1.1;SILL=2.6;}
 else if(st<8.5){FH=4.;GF=4.6;CS=3.6;WW=1.4;WH=1.5;SILL=1.;}
 else if(st<9.5){FH=2.9;GF=4.2;CS=3.3;WW=1.55;WH=1.55;SILL=.8;}
 else if(st<10.5){FH=5.6;GF=5.2;CS=4.2;WW=1.7;WH=3.2;SILL=.9;}
 else {FH=4.6;GF=5.;CS=3.8;WW=1.5;WH=2.6;SILL=.9;}
 bool logg=vQ>3.5&&vQ<4.5;bool nowin=L<WW+.75&&!logg;
 float H=GF+(GF>0.?fl-1.:fl)*FH;
 float nC=max(1.,floor(L/CS+.3));float cs=L/nC;
 if(logg){nC=1.;cs=L;}
 float ci=floor(u/cs),fu=fract(u/cs);
 float vv=v-GF,row=floor(vv/FH),fv=fract(vv/FH);
 // wall material
 vec2 wuv=vec2(u,v);
 if(st>4.5&&st<5.5||(st>1.5&&st<2.5&&fract(sd*5.1)>.55)){
   vec4 b=texture2D(tBrick,wuv/2.);vec3 bc=st<2.5?(fract(sd*9.)<.5?vec3(.82,.80,.76):vec3(.66,.36,.26)):base;
   sAlb=toLin(mix(bc*(.72+.5*b.r),vec3(.72,.70,.66),b.g*.85));sH=b.a;sBump=1.2;sRough=.85;
 } else if(st>2.5&&st<3.5||st>1.5&&st<2.5){
   vec4 c=texture2D(tConc,wuv/4.);float pu=fract(u/(cs*(st<2.5?1.:2.))),pv=fract(v/FH);
   float seam=max(1.-smoothstep(0.,.012,min(pu,1.-pu)),1.-smoothstep(0.,.02,min(pv,1.-pv)));
   float tone=.92+.12*h12(vec2(floor(u/(cs*2.)),floor(v/FH))+sd*9.);
   sAlb=toLin(base*tone*(.8+.4*c.r))*(1.-.35*seam);sH=c.a*.5+(1.-seam)*.5;sBump=1.;sRough=.9;
   sAlb*=1.-.18*c.g*smoothstep(.0,.6,fbm3(vec2(u*.6,v*.08+sd*20.)));
 } else if(st>6.5&&st<7.5){
   sAlb=toLin(base)*(.85+.15*sin(u*9.42));sH=.5+.5*sin(u*9.42);sBump=.3;sRough=.5;sMetal=.4;
 } else {
   vec4 pl=texture2D(tPlaster,wuv/4.);
   sAlb=toLin(base)*(.9+.2*pl.r);sH=pl.a;sBump=.08;sRough=.9;
   sAlb*=1.-.22*smoothstep(.45,.9,fbm3(vec2(u*.35,v*.06+sd*30.)))*(1.-smoothstep(0.,H,v)*.4);   // weathering streaks
 }
 if(home&&v<1.0){ // tiled plinth
   vec4 c=texture2D(tConc,wuv/2.);sAlb=toLin(vec3(.62,.55,.50))*(.85+.3*c.r);float jt=step(.94,fract(u/.6))+step(.92,fract(v/.3));sAlb*=1.-.25*min(jt,1.);sRough=.6;
 } else if(home){ // lighter vertical stair-well bands
   float band=step(abs(fract(u/22.)-.5)*22.,1.6);sAlb=mix(sAlb,toLin(vec3(.93,.90,.84))*(.9+.2*texture2D(tPlaster,wuv/4.).r),band);
 }
 vec3 wallA=sAlb;
 vec3 trim=toLin(vec3(.92,.91,.87));
 float inWin=0.,frame=0.;float glassSill=SILL;vec2 wsz=vec2(WW,WH);
 bool ground=(GF>0.&&v<GF);
 if(v>0.&&v<H){
  if(!ground&&row>=0.){
   float hw=WW/cs*.5,dx=abs(fu-.5);
   float y0=SILL/FH,y1=(SILL+WH)/FH;
   bool arch=(st<.5||st>9.5)&&fract(sd*5.3)>.45;
   if(arch&&fv>y1-.1&&fv<y1+.07){float ex=dx/hw,ey=(fv-(y1-.1))/.17;if(ex*ex+ey*ey<1.)inWin=1.;}
   if(dx<hw&&fv>y0&&fv<y1)inWin=1.;
   if(st>3.5&&st<4.5)inWin=step(fv,.78)*step(.22,fv);
   float fw=.075/cs,fh=.075/FH;
   if(inWin<.5&&dx<hw+fw&&fv>y0-fh&&fv<y1+fh)frame=1.;
   if(inWin<.5&&(st<.5||st>9.5||home||st>4.5&&st<5.5)&&dx<hw+.09/cs*2.&&fv>y0-.05&&fv<y0)frame=2.;   // sill
   if(st<.5||st>9.5){
     if(fv<.05){sAlb=mix(sAlb,trim*.95,.85);sH=.9;sBump=1.;}
     if(abs(dx-.5)<.045){sAlb*=1.06;sH=.8;sBump=.8;}
     if(dx<hw+.06&&fv>y1+fh&&fv<y1+fh+.07){sAlb=trim;sH=1.;sBump=1.;}
     if(row<.5&&mod(ci,2.)<.5&&fract(sd*3.1)>.4&&dx<hw*1.7&&fv>y0-.02&&fv<y0+.21){float r=step(.5,fract(u*8.));sAlb=mix(sAlb,vec3(.03),.5+.45*r*step(fv,y0+.19));sMetal=.5;}
   }
   // AC streak under some windows
   if(h12(vec2(ci,row)+sd*11.)<.18&&dx<hw&&fv<y0&&fv>y0-.5)sAlb*=.86;
   glassSill=SILL;
  }
  if(ground){
   float dx=abs(fu-.5);
   bool shopCol=h12(vec2(ci,floor(sd*91.)))>.42;
   if((st<.5&&shopCol)||st>7.5&&st<8.5||(st>3.5&&st<4.5)||shopW||st>9.5){
     if(dx<.37&&v>.45&&v<GF-.9){inWin=2.;wsz=vec2(cs*.74,GF-1.35);glassSill=.45;}
     else if(dx<.4&&v>.35&&v<GF-.75)frame=1.;
   } else {
     float hw=WW/cs*.5;
     if(dx<hw&&v>1.2&&v<GF-1.)inWin=1.;else if(dx<hw+.07/cs&&v>1.13&&v<GF-.93)frame=1.;
     if(homeYard){float span=L/max(1.,floor(L/18.));float du=mod(u,span)-span*.5;if(abs(du)<.75&&v<2.75&&v>.45){inWin=3.;frame=0.;}else if(abs(du)<1.15)frame=0.;}
   }
   if((st<.5||st>9.5)&&inWin<.5&&frame<.5){float r=1.-smoothstep(0.,.05,abs(fract(v/.46)-.5)-.44);sAlb*=1.-.2*r;sH=1.-r;sBump=.8;sAlb*=.94;}
  }
  // entrance doors
  if(!ground&&entW&&!home&&row<.5&&L>14.&&!logg){
   float span=L/max(1.,floor(L/18.));float du=mod(u,span)-span*.5;
   if(abs(du)<.8&&v<2.3&&v>.0){inWin=3.;frame=0.;}else if(abs(du)<1.)frame=0.;
  }
  // shop fronts in the ground floor of ordinary blocks (GF=0 styles)
  if(shopW&&GF<.5&&row<.5&&!logg&&v>0.){float dx=abs(fu-.5);if(dx<.42&&v>.35&&v<FH-.75){inWin=2.;wsz=vec2(cs*.84,FH-1.1);glassSill=.35;frame=0.;}else if(dx<.45&&v>.3&&v<FH-.7){frame=1.;inWin=0.;}}
  if(nowin){inWin=0.;frame=0.;}
 }
 if(v>H){sAlb=(st<.5||st>9.5)?trim*.95:sAlb*.92;if(v<H+.35&&(st<.5||st>9.5)){sAO=.7;sH=1.;sBump=1.;}}
 if(v<.4){sAlb=mix(sAlb,toLin(vec3(.45,.44,.42)),.6);}
 sAO*=.72+.28*smoothstep(0.,2.,v);
 // loggia faces
 if(logg){
   float fr=fract((v-GF)/FH);float rr=floor((v-GF)/FH);
   float g=h12(vec2(rr,floor(sd*255.)+ci*3.1));
   if(v<GF||v>H){sAlb=toLin(vec3(.8,.8,.78));}
   else if(fr<.36){ // parapet
     vec3 pc=g<.5?vec3(.86,.86,.84):(g<.75?vec3(.62,.66,.70):vec3(.72,.64,.55));sAlb=toLin(pc)*(.85+.25*texture2D(tConc,vec2(u,v)/3.).r);
     if(g>.86){float r=step(.5,fract(u*7.));sAlb=mix(sAlb*.5,vec3(.02),r*.8);}
   } else if(fr<.97){
     float fx=fract(u/(cs/3.));float mull=step(fx,.04)+step(.96,fx)+step(fr,.4)+step(.93,fr);
     if(g<.82){inWin=4.;frame=0.;if(mull>.5){inWin=0.;frame=1.;}}
     else {inWin=5.;}
   } else {sAlb=toLin(vec3(.78));}
 }
 // compose windows
 if(inWin>.5){
   vec3 tng=normalize(vT);vec3 V=normalize(vW-cameraPosition);
   vec3 rd=vec3(dot(V,tng),V.y,dot(V,-n));rd.z=max(rd.z,.05);
   float cell=ci+row*37.+floor(sd*255.)*.731;
   float lit=step(h12(vec2(cell,3.7)),.30+.25*h12(vec2(row,sd*7.)));
   if(inWin>1.5&&inWin<2.5)lit=step(.25,h12(vec2(ci,sd*5.)));
   vec2 cuv;
   if(inWin>1.5&&inWin<2.5){cuv=vec2((fu-.5)/.84+.5,(v-.4)/wsz.y);}
   else if(inWin>3.5){cuv=vec2(fract(u/(cs/3.)),(fract((v-GF)/FH)*FH-1.)/1.6);wsz=vec2(cs/3.,1.6);glassSill=1.;}
   else if(!ground){float hw=WW/cs*.5;cuv=vec2((fu-.5+hw)/(2.*hw),(fv*FH-SILL)/WH);}
   else {float hw=WW/cs*.5;cuv=vec2((fu-.5+hw)/(2.*hw),(v-1.2)/(GF-2.2));wsz=vec2(WW,GF-2.2);glassSill=1.2;}
   vec3 room=roomColor(clamp(cuv,0.,1.),wsz,glassSill,rd,cell,lit);
   float cur=h12(vec2(cell,9.1));
   if(inWin<1.5||inWin>3.5){ // curtains / tulle
     if(cur<.35){room=mix(room,vec3(.86,.84,.78),.55);}
     else if(cur<.6&&(cuv.x<.22||cuv.x>.78)){room=cur<.47?vec3(.45,.16,.14):vec3(.62,.55,.38);}
     if(inWin<1.5){float mul=step(abs(cuv.x-.5),.02)+step(abs(cuv.y-.72),.025);if(mul>.5){inWin=0.;frame=1.;}}
   }
   if(inWin>2.5&&inWin<3.5){room=vec3(.20,.14,.10)*(.8+.3*vn(vec2(u,v)*6.));lit=0.;}
   if(inWin>4.5){room=vec3(.05,.05,.06);lit=0.;}
   if(inWin>.5){
     float dayL=.22*(1.-uNight)+.02;
     vec3 lightC=mix(vec3(1.,.82,.58),vec3(.75,.85,1.),step(.86,h12(vec2(cell,1.9))));
     sEmis=room*(dayL+lit*uNight*1.6*lightC);
     if(inWin>1.5&&inWin<2.5)sEmis=room*(dayL+lit*max(uNight,.0)*2.2)*vec3(1.,.92,.8);
     sAlb=vec3(.01);sRough=.04;sMetal=0.;sBump=0.;sAO=1.;
     if(inWin>2.5&&inWin<3.5){sAlb=toLin(vec3(.30,.22,.16));sEmis=vec3(0.);sRough=.6;}
     if(home&&ground&&inWin<1.5&&step(.5,h12(vec2(ci,sd*3.)))>.5){float bx=step(fract(cuv.x*6.+.5),.13)+step(fract(cuv.y*3.),.07);if(bx>.5){sAlb=vec3(.03);sEmis=vec3(0.);sRough=.5;sMetal=.6;}}
   }
 }
 if(frame>.5&&inWin<.5){sAlb=frame>1.5?trim*.9:((st<.5||st>9.5)?toLin(vec3(.86,.84,.80)):(h12(vec2(ci,row+sd*3.))<.75?toLin(vec3(.94)):toLin(vec3(.42,.30,.22))));sRough=.45;sH=1.;sBump=.6;}
 // winter: snow on sills
 if(uWinter>.5&&frame>1.5)sAlb=vec3(.9,.92,.95);
 // distance LOD: once a window cell spans only a few pixels, replace the per-window pattern with its average.
 // This removes the shimmering/crawling of windows (worst at night, when lit windows are bright and bloom amplifies them).
 if(v>0.&&v<H&&!nowin){
   float px=max(length(vec2(dFdx(u),dFdy(u))),length(vec2(dFdx(v),dFdy(v))));
   float lod=smoothstep(.035,.14,px/min(cs,FH));
   if(lod>0.){
     float cov=logg?.55:clamp(WW*WH/(cs*FH),.08,.6);
     float pl=.30+.25*h12(vec2(row,sd*7.))*.5+.06;
     vec3 avgE=vec3(.30,.25,.20)*((.22*(1.-uNight)+.02)+pl*uNight*1.6*vec3(1.,.82,.58))*cov;
     vec3 avgA=mix(wallA,vec3(.05),cov*.7);
     sEmis=mix(sEmis,avgE,lod);sAlb=mix(sAlb,avgA,lod);sRough=mix(sRough,.6,lod);sMetal*=1.-lod;sBump*=1.-lod;sH=mix(sH,.5,lod);
   }
 }
 }
`;
const BLD_VS_DECL=`attribute vec2 aUV;attribute vec4 aP;attribute float aQ;attribute vec3 aT;varying vec2 vUV;varying vec4 vP;varying float vQ;varying vec3 vT;`;
const BLD_VS_MAIN=`vUV=aUV;vP=aP;vQ=aQ;vT=aT;`;
// ---------------- props (vertex colour + material code) ----------------
const PROP_SURF=`
 float m=vM;
 if(m<.5){sRough=.8;}
 else if(m<1.5){sRough=.45;sMetal=.3;}
 else if(m<2.5){sAlb=vec3(.01);sRough=.05;sMetal=.0;}
 else if(m<3.5){sRough=.4;sEmis=sAlb*(.15+uNight*7.);}
 else if(m<4.5){sRough=.95;}
 else if(m<5.5){vec4 w=texture2D(tWood,vW.xz+vW.y);sAlb*=.7+.6*w.r;sRough=.75;}
 else if(m<6.5){sRough=.25;sMetal=.9;}
 else if(m<7.5){vec4 g=texture2D(tGran,(vW.xz+vW.y)/2.);sAlb*=.7+.6*g.r;sH=g.a;sBump=.3;sRough=.7;}
 else if(m<8.5){sEmis=sAlb*(.6+uNight*1.6);sRough=.3;}
 else {vec4 c=texture2D(tConc,(vW.xz+vW.y*vec2(.7,1.3))/3.);sAlb*=.8+.4*c.r;sRough=.9;}
 if(uWinter>.5&&vNw.y>.6&&m!=3.&&m!=8.)sAlb=mix(sAlb,vec3(.9,.92,.95),.85);
`;
let MATS={};
function initMats(){
  UNI.tAsph.value=TX.asphalt;UNI.tTiles.value=TX.tiles;UNI.tCob.value=TX.cobble;UNI.tGrass.value=TX.grass;UNI.tDirt.value=TX.dirt;UNI.tSand.value=TX.sand;UNI.tSnow.value=TX.snow;
  UNI.tBrick.value=TX.brick;UNI.tPlaster.value=TX.plaster;UNI.tConc.value=TX.concrete;UNI.tRoof.value=TX.roof;UNI.tGran.value=TX.granite;UNI.tMarble.value=TX.marble;UNI.tWood.value=TX.wood;
  const tw=D.tw,th=D.th,data=new Uint8Array(tw*th);for(let i=0;i<tw*th;i++)data[i]=D.ter[i]+128;
  const sdt=new THREE.DataTexture(data,tw,th,THREE.LuminanceFormat,THREE.UnsignedByteType);sdt.magFilter=sdt.minFilter=THREE.LinearFilter;sdt.needsUpdate=true;
  UNI.uSD.value=sdt;{const lt=new THREE.DataTexture(D.lu,tw,th,THREE.RGBAFormat,THREE.UnsignedByteType);lt.magFilter=lt.minFilter=THREE.LinearFilter;lt.needsUpdate=true;UNI.uLU.value=lt}UNI.uSDT.value.set(BB[0],BB[2],tw*20,th*20);
  MATS.ground=patchMat(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9,metalness:0}),{key:'ground',
    vDecl:'attribute vec2 aK;attribute vec4 aR;attribute float aU;varying vec2 vK;varying vec4 vR;varying float vU;',vMain:'vK=aK;vR=aR;vU=aU;',
    fDecl:'varying vec2 vK;varying vec4 vR;varying float vU;',fSurf:GROUND_SURF});
  MATS.ground.envMapIntensity=.45;
  MATS.bld=patchMat(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85,metalness:0}),{key:'bld',vDecl:BLD_VS_DECL,vMain:BLD_VS_MAIN,fDecl:BLD_DECL,fSurf:BLD_SURF});
  MATS.bld.envMapIntensity=.7;
  MATS.props=patchMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:0}),{key:'props',
    vDecl:'attribute float aM;varying float vM;',vMain:'vM=aM;',fDecl:'varying float vM;',fSurf:PROP_SURF});
  MATS.signs=patchMat(new THREE.MeshStandardMaterial({map:TX.signs,roughness:.5,metalness:0}),{key:'signs',fSurf:'sEmis=sAlb*(.05+uNight*1.8);'});
  MATS.leaves=patchMat(new THREE.MeshStandardMaterial({map:TX.leaves,alphaTest:.45,side:THREE.DoubleSide,roughness:.8,metalness:0}),{key:'leaves',vDecl:'uniform float uTime;',
    vBegin:'{float sw=sin(uTime*1.4+instanceMatrix[3].x*.3+instanceMatrix[3].z*.21)*.06*max(position.y-2.,0.)*.12;transformed.x+=sw;transformed.z+=sw*.7;}',
    fSurf:'if(uWinter>.5){if(vUv.y>.5)discard;sAlb=mix(sAlb,vec3(.55,.58,.62),.45);}sAlb*=1.45;sEmis=sAlb*.05;sAO=.85;'});
  MATS.leaves.vertexColors=false;
  MATS.bark=patchMat(new THREE.MeshStandardMaterial({map:TX.bark,roughness:.95,metalness:0}),{key:'bark',fSurf:'if(uWinter>.5&&vNw.y>.35)sAlb=mix(sAlb,vec3(.85,.87,.9),.7);'});
  TX.bark.encoding=THREE.sRGBEncoding;
}
