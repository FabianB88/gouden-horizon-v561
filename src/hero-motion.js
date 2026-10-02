const TAU=Math.PI*2;
export const HERO_DIRECTIONS=['south','southwest','west','northwest','north','northeast','east','southeast'];
const angleFor=index=>((index+2)%8)*Math.PI/4;
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

export function heroDirection(x,y,previous=0){
 if(Math.hypot(x,y)<.0001)return previous;
 const angle=Math.atan2(y,x);
 // Small changes near a diagonal do not flicker between adjacent painted views.
 if(Math.abs(angleDelta(angle,angleFor(previous)))<Math.PI/8+.07)return previous;
 return ((Math.round((angle+TAU)/(Math.PI/4))+6)%8);
}

export function updateHeroMotion(p,dx,dy,dt,moveSpeed,dashing=false){
 const groundY=dy/.78,moved=Math.hypot(dx,groundY),moving=!dashing&&moved>dt*moveSpeed*.025;
 p.walkBlend=dashing?0:Math.min(1,moved/Math.max(.001,dt*moveSpeed));
 p.moving=moving;
 if(moving){
  p.walkPhase=(p.walkPhase||0)+moved/215;
  p.walkDistance=(p.walkDistance??(p.walkPhase*215-moved))+moved;
 }
 const x=dashing?p.dashDir.x:moving?dx:p.aim?.x||0;
 const y=dashing?p.dashDir.y:moving?groundY:p.aim?.y||0;
 const direction=heroDirection(x,y,p.poseDirection??0);
 if(direction!==p.poseDirection){p.previousPoseDirection=p.poseDirection??direction;p.poseDirection=direction;p.poseTurn=1;}
 p.poseTurn=Math.max(0,(p.poseTurn||0)-dt/.10);
 if(moving||dashing){p.moveFacing=x<-.0001?-1:x>.0001?1:p.moveFacing||1;p.moveLookUp=y<-.0001;p.facing=p.moveFacing;p.lookUp=p.moveLookUp;}
}

export function heroFrame(p){
 return p.moving?Math.floor((p.walkDistance||0)/150*6)%6:2;
}
