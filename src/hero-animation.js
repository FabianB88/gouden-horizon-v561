import {drawRiggedHero,heroRigPose,heroBodyMotion} from './hero-rig.js?v=16';

export function heroFocus(renderer,p,time=0){
 const atlas=renderer.heroDirectionalCrop;
 if(!atlas)return null;
 const point=index=>{
  const {mirrored,rig,frame,index:bindIndex}=heroRigPose(renderer,index),motion=heroBodyMotion(p,bindIndex),dx=frame.focus[0]-rig.h[0]*frame.bounds[2],dy=frame.focus[1]-rig.h[1]*frame.bounds[3],a=motion.rotation;
  return {x:p.x+((dx*Math.cos(a)-dy*Math.sin(a))*atlas.scale+motion.x)*(mirrored?-1:1),y:p.y+(rig.h[1]-frame.anchor[1])*frame.bounds[3]*atlas.scale+(dx*Math.sin(a)+dy*Math.cos(a))*atlas.scale+motion.y};
 };
 const current=point(p.poseDirection??0);
 if(p.poseTurn>0&&p.previousPoseDirection!==p.poseDirection){const previous=point(p.previousPoseDirection);return {x:current.x+(previous.x-current.x)*p.poseTurn,y:current.y+(previous.y-current.y)*p.poseTurn};}
 return current;
}

export function drawDirectionalHero(renderer,p,time=0){
 const art=renderer.assets.heroDirectional,atlas=renderer.heroDirectionalCrop;
 if(!art||!atlas)return false;
 const direction=p.poseDirection??0;
 const draw=(index,alpha=1)=>{
  drawRiggedHero(renderer,p,index,alpha);
 };
 for(const trail of p.trail||[]){
  drawRiggedHero(renderer,{...p,x:trail.x,y:trail.y,moving:false,cast:0},trail.direction??direction,trail.life*.7);
 }
 if(p.poseTurn>0&&p.previousPoseDirection!==direction){draw(p.previousPoseDirection,p.poseTurn);draw(direction,1-p.poseTurn);}
 else draw(direction);
 return true;
}

// Older painted rig remains available if a custom renderer lacks the new atlas.
// Articulated painted gait: planted legs, weight shift through the pelvis,
// counter-rotating shoulders and independent free/staff arms. No pose flipping.
const rigs={
 front:{frame:0,legs:[
  {hip:[210,267],knee:[170,344],outline:[[199,264],[218,278],[207,315],[189,350],[179,386],[178,425],[132,425],[133,370],[149,330],[174,284]],thigh:[[199,264],[218,278],[207,315],[190,350],[144,350],[149,330],[174,284]],calf:[[146,341],[189,341],[178,385],[178,425],[130,425],[133,370]]},
  {hip:[235,265],knee:[232,330],outline:[[220,265],[251,265],[255,326],[258,355],[279,374],[279,399],[232,397],[207,375],[210,334],[214,295]],thigh:[[220,265],[251,265],[255,336],[210,336],[214,295]],calf:[[210,327],[255,327],[258,355],[279,374],[279,399],[232,397],[207,375]]}
 ]},
 back:{frame:4,legs:[
  {hip:[133,308],knee:[127,343],outline:[[115,309],[150,315],[144,339],[153,355],[153,378],[108,382],[105,353]],thigh:[[115,309],[150,315],[144,349],[107,349]],calf:[[107,340],[145,340],[153,355],[153,378],[108,382],[105,353]]},
  {hip:[194,331],knee:[191,360],outline:[[176,332],[217,331],[216,356],[241,362],[251,383],[245,401],[168,401],[164,375]],thigh:[[176,332],[217,331],[218,366],[167,366]],calf:[[167,357],[217,357],[241,362],[251,383],[245,401],[168,401],[164,375]]}
 ]}
};
function path(c,points){c.moveTo(...points[0]);for(const point of points.slice(1))c.lineTo(...point);c.closePath();}
function at(c,point,angle){c.translate(...point);c.rotate(angle);c.translate(-point[0],-point[1]);}
const upper={
 front:{pivot:[223,265],arms:[
  {shoulder:[152,149],outline:[[138,135],[164,142],[168,179],[154,204],[154,243],[150,267],[132,278],[125,256],[131,224],[130,191],[130,158]],swing:1},
  {shoulder:[263,150],outline:[[248,139],[277,146],[305,175],[318,194],[327,159],[302,154],[283,132],[291,102],[311,81],[333,66],[356,68],[376,91],[389,125],[379,149],[349,162],[328,236],[367,250],[378,282],[350,298],[332,278],[306,368],[302,394],[282,396],[283,369],[299,267],[301,221],[279,204],[257,181]],swing:-.35}
 ]},
 back:{pivot:[167,302],arms:[
  {shoulder:[104,163],outline:[[86,160],[111,157],[119,186],[112,210],[99,228],[82,222],[78,203],[86,183]],swing:1},
  {shoulder:[227,151],outline:[[207,135],[240,141],[259,163],[281,187],[288,152],[269,144],[259,119],[268,88],[293,60],[324,47],[344,68],[354,101],[340,130],[309,143],[295,202],[328,240],[337,277],[315,298],[294,279],[263,383],[243,389],[241,370],[266,269],[273,219],[246,208],[224,185]],swing:-.35}
 ]}
};
export function heroGait(phase,blend=1){
 const cycle=phase*Math.PI*3.1;
 return {cycle,weight:Math.sin(cycle)*1.8*blend,bob:-Math.abs(Math.sin(cycle))*2.4*blend,torso:Math.sin(cycle)*.035*blend,arm:-Math.sin(cycle)*.11*blend};
}
export function drawWalkingHero(renderer,p){
 const c=renderer.ctx,rig=rigs[p.lookUp?'back':'front'],source=renderer.crop.heroFrames[rig.frame],image=renderer.assets.heroAnimation;
 const [sx,sy,w,h]=source.bounds,scale=123/h,blend=p.walkBlend??1,gait=heroGait(p.walkPhase||0,blend),phase=gait.cycle,body=upper[p.lookUp?'back':'front'];
 c.save();c.translate(p.x,p.y);if(p.facing<0)c.scale(-1,1);c.scale(scale,scale);c.translate(-source.anchor[0]*w,-source.anchor[1]*h);
 const texture=()=>c.drawImage(image,sx,sy,w,h,0,0,w,h);
 // Back leg first, then the nearer leg; overlapping knee slices hide seams.
 for(const [i,leg]of rig.legs.entries()){
  const angle=phase+i*Math.PI,swing=Math.sin(angle)*.145*blend,bend=Math.max(0,Math.cos(angle))*.19*blend;
  c.save();at(c,leg.hip,swing);c.beginPath();path(c,leg.thigh);c.clip();texture();c.restore();
  c.save();at(c,leg.hip,swing);at(c,leg.knee,bend);c.beginPath();path(c,leg.calf);c.clip();texture();c.restore();
 }
 // The upper body carries the weight of a step; feet stay at the ground anchor.
 c.save();c.translate(gait.weight/scale,gait.bob/scale);at(c,body.pivot,gait.torso);
 // Arms are excluded from the torso and drawn with a small counter-swing.
 c.save();c.beginPath();c.rect(0,0,w,h);for(const leg of rig.legs)path(c,leg.outline);for(const arm of body.arms)path(c,arm.outline);c.clip('evenodd');texture();c.restore();
 for(const arm of body.arms){c.save();at(c,arm.shoulder,gait.arm*arm.swing);c.beginPath();path(c,arm.outline);c.clip();texture();c.restore();}
 c.restore();c.restore();
}
