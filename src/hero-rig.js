// Painted bind poses retain the eight camera directions. Both legs are driven
// by opposite foot contacts. Traced cloth masks remove the bind-pose legs,
// while preserving the coat. Short, forward knee paths avoid lateral IK bends.
const spec={
 south:{h:[.45,.65],k:[.45,.81],f:[.46,.98],leg:[[.32,.60],[.54,.63],[.54,.79],[.53,1],[.34,1],[.32,.80]],other:[[.53,.63],[.68,.65],[.68,.86],[.53,.87],[.50,.77]]},
 southwest:{h:[.48,.64],k:[.41,.80],f:[.30,.97],leg:[[.32,.61],[.54,.65],[.50,.82],[.44,.92],[.38,1],[.18,1],[.16,.91],[.30,.82]],other:[[.53,.64],[.72,.68],[.75,.89],[.58,.90],[.53,.79]]},
 west:{h:[.48,.65],k:[.45,.81],f:[.34,.97],leg:[[.36,.61],[.56,.65],[.52,.83],[.46,.94],[.42,1],[.27,1],[.24,.93],[.36,.82]],other:[[.55,.64],[.74,.68],[.78,.89],[.59,.90],[.53,.80]]},
 northwest:{h:[.42,.70],k:[.44,.83],f:[.48,.98],leg:[[.32,.67],[.53,.71],[.57,1],[.38,1],[.29,.91],[.30,.78]],other:[[.57,.72],[.75,.75],[.77,.92],[.61,.94],[.54,.82]]},
 north:{h:[.49,.73],k:[.49,.86],f:[.50,.98],leg:[[.38,.69],[.62,.73],[.63,1],[.39,1],[.34,.87]],other:[[.28,.69],[.43,.70],[.46,.87],[.35,.90],[.26,.81]]}
};
const directions=['south','southwest','west','northwest','north','northeast','east','southeast'];
const rasterCache=new WeakMap();
function inside(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function rasterParts(r,name,frame,leg,other){
 let cache=rasterCache.get(r.assets.heroDirectional);if(!cache){cache=new Map();rasterCache.set(r.assets.heroDirectional,cache);}if(cache.has(name))return cache.get(name);
 const [sx,sy,w,h]=frame.bounds,make=()=>{const c=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):document.createElement('canvas');c.width=w;c.height=h;return c.backing||c;},body=make(),lower=make(),c=body.getContext('2d');
 if(frame.clip?.length){c.beginPath();polygon(c,frame.clip);c.clip();}c.drawImage(r.assets.heroDirectional,sx,sy,w,h,0,0,w,h);
 const pixels=c.getImageData(0,0,w,h),isCoat=(x,y)=>{const at=(y*w+x)*4;return pixels.data[at+3]>0&&pixels.data[at+1]>pixels.data[at]*1.15&&pixels.data[at+2]>pixels.data[at]*1.08;},coatMask=new Uint8Array(w*h),boots=lower.getContext('2d').createImageData(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&isCoat(x+dx,y+dy))coatMask[y*w+x]=1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,cloth=!coatMask[y*w+x];
  if(cloth&&inside(x,y,leg)){boots.data.set(pixels.data.subarray(i,i+4),i);pixels.data[i+3]=0;}else if(cloth&&(inside(x,y,other)||y>h*.83))pixels.data[i+3]=0;
 }
 c.putImageData(pixels,0,0);lower.getContext('2d').putImageData(boots,0,0);const result={body,lower};cache.set(name,result);return result;
}
const polygon=(c,points)=>{c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();};
export const WALK_CYCLE_DISTANCE=96;
export const WALK_STRIDE=18;
export const FOOT_STANCE=.375;
export function footCycle(phase){return [0,1].map(i=>{const t=((phase+i*.5)%1+1)%1;if(t<FOOT_STANCE)return {advance:1-t*2/FOOT_STANCE,lift:0,planted:true};const u=(t-FOOT_STANCE)/(1-FOOT_STANCE),s=u*u*(3-2*u);return {advance:-1+2*s,lift:Math.sin(u*Math.PI),planted:false};});}
export function heroRigPose(r,direction){const mirrored=direction>=5,index=mirrored?8-direction:direction,name=directions[index],rig=spec[name],frame=r.heroDirectionalCrop.directions[name][2];return {mirrored,index,name,rig,frame};}
export function heroBodyMotion(p,index){const phase=(p.walkDistance||0)/WALK_CYCLE_DISTANCE,blend=p.moving?(p.walkBlend??1):0,dirX=Math.cos(index*Math.PI/4+Math.PI/2);return {x:(Math.sin(phase*Math.PI*2)*.8+dirX*1.4)*blend,y:-Math.abs(Math.sin(phase*Math.PI*2))*1.2*blend,rotation:blend*(.04*dirX+Math.sin(phase*Math.PI*2)*.025)+Math.sin(Math.min(1,(p.cast||0)/.18)*Math.PI)*.035};}
export function drawRiggedHero(r,p,direction,alpha=1){
 const {mirrored,index,name,rig,frame}=heroRigPose(r,direction),c=r.ctx,[sx,sy,w,h]=frame.bounds,scale=r.heroDirectionalCrop.scale,px=q=>[q[0]*w,q[1]*h],H=px(rig.h),K=px(rig.k),F=px(rig.f),leg=rig.leg.map(px),other=rig.other.map(px),parts=rasterParts(r,name,frame,leg,other);
 const phase=(p.walkDistance||0)/WALK_CYCLE_DISTANCE,cycle=footCycle(phase),angle=index*Math.PI/4+Math.PI/2,dir=[Math.cos(angle),Math.sin(angle)*.78],blend=p.moving?(p.walkBlend??1):0,bodyMotion=heroBodyMotion(p,index),bob=bodyMotion.y;
 const texture=()=>c.drawImage(parts.lower,0,0);
 const segment=(a,b,A,B,clip)=>{c.save();c.translate(...A);c.rotate(Math.atan2(B[1]-A[1],B[0]-A[0]));c.scale(Math.hypot(B[0]-A[0],B[1]-A[1])/Math.hypot(b[0]-a[0],b[1]-a[1]),1);c.rotate(-Math.atan2(b[1]-a[1],b[0]-a[0]));c.translate(-a[0],-a[1]);c.beginPath();polygon(c,leg);c.clip();c.beginPath();c.rect(...clip);c.clip();texture();c.restore();};
 c.save();c.globalAlpha=alpha;c.translate(p.x,p.y);c.scale(mirrored?-scale:scale,scale);c.translate(-H[0],-frame.anchor[1]*h);
 for(const i of [1,0]){const side=(i?-1:1)*5/scale,contact=cycle[i],hip=[H[0]+side,H[1]+bob/scale],foot=[H[0]+side+(F[0]-H[0])*.28+dir[0]*contact.advance*WALK_STRIDE/scale*blend,frame.anchor[1]*h+dir[1]*contact.advance*WALK_STRIDE/scale*blend-contact.lift*4/scale*blend],joint=[hip[0]+(foot[0]-hip[0])*.48+dir[0]*contact.lift*3/scale*blend,hip[1]+(foot[1]-hip[1])*.48-contact.lift*1.5/scale*blend];c.save();if(i)c.globalAlpha*=.88;segment(H,K,hip,joint,[0,0,w,K[1]+5]);segment(K,F,joint,foot,[0,K[1]-5,w,h]);c.restore();}
 c.save();c.translate(bodyMotion.x/scale,bodyMotion.y/scale);c.translate(...H);c.rotate(bodyMotion.rotation);c.translate(-H[0],-H[1]);c.drawImage(parts.body,0,0);c.restore();c.restore();
}
