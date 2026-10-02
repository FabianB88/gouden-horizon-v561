export function updateEnemyMotion(e,dx,dy,dt){
 const moved=Math.hypot(dx,dy/.78),walking=moved>dt*3&&!e.leap&&!e.rush&&!e.burrow;
 if(walking){e.walkDistance=(e.walkDistance||0)+moved;e.travelFacing=dx<-.1?-1:dx>.1?1:e.travelFacing||1;}
 const target=walking?1:0;e.motionBlend=(e.motionBlend||0)+(target-(e.motionBlend||0))*(1-Math.exp(-dt*12));
 e.attackRelease=Math.max(0,(e.attackRelease||0)-dt);
}
export function enemyPose(e,time=0){
 if(e.windup)return {frame:4,blend:0};
 if(e.attackRelease>0)return {frame:5,blend:0};
 const phase=e.type==='stormnest'?time*1.2:(e.walkDistance||0)/155*4;
 if(!(e.motionBlend>.05)&&e.type!=='stormnest')return {frame:0,blend:0};
 return {frame:Math.floor(phase)%4,blend:phase%1};
}
export function drawAnimatedEnemy(r,e,base,time){
 const spec=r.enemyAnimationCrop?.enemies[e.type];if(!spec)return false;
 const {frame,blend}=enemyPose(e,time),face=e.windup?e.windup.dir.x<0:e.motionBlend>.05?e.travelFacing<0:Math.cos(e.angle)<0;
 const scale=base.size/spec.scaleDenominator*(e.elite?1.18:1),jump=e.jumpHeight||0;
 const draw=(i,a)=>{const crop=spec.frames[i];r.sprite(r.assets.enemyAnimation,crop,e.x,e.y-jump,crop.bounds[3]*scale,face,0,a);};
 if(blend>.001&&frame<4){
  // Add premultiplied poses offscreen: normal source-over crossfades make
  // overlapping opaque sprites translucent against the ground.
  if(!r.enemyBlendCanvas){const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(768,512):document.createElement('canvas');canvas.width=768;canvas.height=512;r.enemyBlendCanvas=canvas.backing||canvas;}
  const canvas=r.enemyBlendCanvas,c=canvas.getContext('2d');c.clearRect(0,0,768,512);
  const pose=(i,a)=>{const crop=spec.frames[i],[sx,sy,w,h]=crop.bounds;c.globalAlpha=a;c.drawImage(r.assets.enemyAnimation,sx,sy,w,h,384-crop.anchor[0]*w,490-crop.anchor[1]*h,w,h);};
  c.globalCompositeOperation='source-over';pose(frame,1-blend);c.globalCompositeOperation='lighter';pose((frame+1)%4,blend);c.globalCompositeOperation='source-over';c.globalAlpha=1;
  const target=r.ctx;target.save();target.translate(e.x,e.y-jump);target.scale(face?-scale:scale,scale);target.drawImage(canvas,-384,-490);target.restore();
 }else draw(frame,1);
 return true;
}
