import {ENEMIES} from './data.js?v=16';
import {coverHit} from './arena-layouts.js?v=16';

export const ELEMENT_COLORS={water:'#6be6ee',fire:'#ff994c',storm:'#c5a0ff',toxin:'#bbdf49',solar:'#ffd371',metal:'#e9b77d'};
const elements={drone:'metal',raider:'fire',beast:'toxin',turret:'storm',boss:'solar',crawler:'metal',sniper:'metal',sentinel:'fire',sporecaster:'toxin',stormling:'storm',siege:'fire',minecrab:'metal',resonant:'storm',brinebreaker:'water',eel:'water',salamander:'fire',shieldguard:'solar',stormnest:'storm',dredger:'water',solarKnight:'solar',seedheart:'toxin',toxinbeetle:'toxin',chemist:'toxin'};
const melee=new Set(['bite','swing','slam','charge','shockwave','arcDash','clawRush','shieldBash','burrow','leap']);
const radial=new Set(['radial','chainburst','sunWheel']);
export function attackProfile(e,mode=e.windup?.mode||e.lastAttack){const element=elements[e.type]||'metal';return {element,color:ELEMENT_COLORS[element],melee:melee.has(mode),radial:radial.has(mode),mode};}
export function enemyMuzzle(e,dir=e.windup?.dir||e.attackDirection||{x:Math.cos(e.angle||0),y:Math.sin(e.angle||0)}){
 const base=ENEMIES[e.type],mount=['sniper','chemist','shieldguard','raider'].includes(e.type)?.46:['stormnest','stormling'].includes(e.type)?.58:.36,reach=e.type==='stormnest'?0:base.radius*.95;
 return {x:e.x+dir.x*reach,y:e.y-base.size*mount+dir.y*reach/1.15};
}
export function enemyAttackMotion(e){
 const profile=attackProfile(e),dir=e.windup?.dir||e.attackDirection||{x:0,y:0};let push=0,rotation=0,squash=0;
 if(e.windup){const u=1-e.windup.timer/e.windup.total;push=-(profile.melee?7:4)*u;rotation=-dir.x*(profile.melee?.07:.025)*u;squash=Math.sin(u*Math.PI)*.035;}
 else if(e.attackRelease>0){const pulse=Math.sin((1-e.attackRelease/.32)*Math.PI);push=(profile.melee?12:-7)*pulse;rotation=dir.x*(profile.melee?.11:-.045)*pulse;squash=pulse*.025;}
 return {x:dir.x*push,y:dir.y*push/1.15,rotation,squash};
}
export function launchEnemyLob(g,e,target,{duration=.55,damage=0,radius=70,poison=false,carrier=false,element=attackProfile(e).element}={}){
 const origin=enemyMuzzle(e);g.state.projectiles.push({id:++g.idCounter,team:'enemy',type:carrier?'enemy-carrier':'enemy-lob',source:e.id,element,color:ELEMENT_COLORS[element],x:origin.x,y:origin.y,origin,end:{...target},duration,age:0,life:duration+.1,flightHeight:0,radius:10,impactRadius:radius,damage,venom:poison,trail:[]});
}
export function presentEnemyAttack(g,e,firstProjectile,firstThreat,firstEffect){
 if(g.inCamp()||!e.windup)return;const w=e.windup,profile=attackProfile(e),muzzle=enemyMuzzle(e);e.attackDirection={...w.dir};
 for(const b of g.state.projectiles.slice(firstProjectile)){
  if(b.team!=='enemy')continue;b.source=e.id;b.element=profile.element;b.color=profile.color;b.damageType=b.venom?'venomHit':profile.element==='storm'?'electric':'physical';
  if(['enemy-lob','enemy-carrier'].includes(b.type))continue;
  const speed=Math.hypot(b.vx,b.vy*1.15),spread=Math.atan2(b.vy*1.15,b.vx)-Math.atan2(w.dir.y,w.dir.x),a=profile.radial?Math.atan2(b.vy*1.15,b.vx):Math.atan2((w.target.y-20-muzzle.y)*1.15,w.target.x-muzzle.x)+spread;
  b.x=profile.radial?e.x:muzzle.x;b.y=profile.radial?e.y-ENEMIES[e.type].size*.45:muzzle.y;b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed/1.15;
 }
 for(const t of g.state.world.threats.slice(firstThreat)){
  t.element=profile.element;if(['toxicPool','mine','eruption'].includes(t.type))launchEnemyLob(g,e,t,{duration:t.arm||.5,radius:t.r,carrier:true,element:profile.element});
 }
 for(const fx of g.state.effects.slice(firstEffect)){fx.element=profile.element;if(['beam','toxic-jet','brine-jet'].includes(fx.type)){fx.x=muzzle.x;fx.y=muzzle.y;}}
 g.effect('weapon-flash',muzzle.x,muzzle.y,{element:profile.element,color:profile.color,dir:w.dir,melee:profile.melee,radius:profile.melee?35:29,life:.22});
}
export function updateEnemyLob(g,b){
 if(!['enemy-lob','enemy-carrier'].includes(b.type))return false;
 const t=Math.min(1,b.age/b.duration);b.x=b.origin.x+(b.end.x-b.origin.x)*t;b.y=b.origin.y+(b.end.y-b.origin.y)*t;b.flightHeight=Math.sin(t*Math.PI)*95;
 if(t>=1){b.life=0;if(b.type==='enemy-lob'){
   if(Math.hypot(g.state.player.x-b.end.x,(g.state.player.y-b.end.y)*1.15)<b.impactRadius)g.hurtPlayer(b.damage,b.venom?'venomHit':b.element==='storm'?'electric':'physical');
   if(b.venom)g.state.world.hazards.push({id:'spores-'+ ++g.idCounter,x:b.end.x,y:b.end.y,r:63,type:'spore',life:4});
  }g.effect('element-impact',b.end.x,b.end.y,{element:b.element,color:b.color,radius:b.impactRadius,life:.55});
 }return true;
}

export const EnemyCombatVisuals={
 combatSprite(element,frame,x,y,size,rotation=0,alpha=1){const crop=this.combatEffectsCrop?.elements[element]?.[frame];if(!crop)return;this.sprite(this.assets.combatEffects,crop,x,y,size,false,rotation,alpha);},
 drawEnemyCharge(e){if(!e.windup)return;const {element,color,melee}=attackProfile(e),u=1-e.windup.timer/e.windup.total,m=enemyMuzzle(e),angle=Math.atan2(e.windup.dir.y/1.15,e.windup.dir.x);this.glow(m.x,m.y,18+u*20,color,.15+u*.35);this.combatSprite(element,0,m.x,m.y,(melee?10:14)+u*12,angle,.4+u*.6);},
 drawEnemyLanding(s){for(const b of s.projectiles){if(b.type!=='enemy-lob')continue;this.areaWarning(b.end.x,b.end.y,b.impactRadius,Math.min(1,b.age/b.duration),b.element);}},
 drawEnemyProjectile(b){
  if(b.team!=='enemy')return false;const element=b.element||(b.venom?'toxin':'metal'),color=ELEMENT_COLORS[element],y=b.y-(b.flightHeight||0),angle=b.origin?Math.atan2(b.end.y-b.origin.y,b.end.x-b.origin.x):Math.atan2(b.vy,b.vx),size=element==='metal'?19:element==='solar'?23:31;
  for(let i=1;i<b.trail.length;i++)this.line(b.trail[i-1],b.trail[i],color+Math.round(i/b.trail.length*100).toString(16).padStart(2,'0'),element==='metal'?2:4);
  if(b.flightHeight)this.ellipse(b.x,b.y,9,4,'#0c202650');this.glow(b.x,y,18,color,.22);this.combatSprite(element,Math.floor(b.age*12)%2,b.x,y,size,angle);return true;
 },
 drawEnemyThreat(t){
  if(!t.element)return false;const color=ELEMENT_COLORS[t.element];
  if(t.type==='ring'){const r=t.r+t.age*t.speed;this.ellipse(t.x,t.y,r,r/1.15,null,color+'bb',10);for(let i=0;i<16;i++){const a=i*Math.PI/8+t.age*.45;this.combatSprite(t.element,3,t.x+Math.cos(a)*r,t.y+Math.sin(a)*r/1.15,34,a+Math.PI/2,Math.min(1,t.life*3));}return true;}
  if(t.type==='sweep'){const a=t.angle+t.age*1.1,full={x:t.x+Math.cos(a)*t.length,y:t.y+Math.sin(a)*t.length/1.15},end=coverHit(t,full,this.renderArea)||full;this.drawEnemyCombatEffect({...t,type:'beam',y:t.y-25,end:{x:end.x,y:end.y-25}});return true;}
  if(t.type==='tether'){const active=t.age>=t.arm;this.line(t,t.target,color+(active?'b0':'55'),active?4:2);if(active){const a=Math.atan2(t.target.y-t.y,t.target.x-t.x);for(let i=0;i<7;i++){const u=(i/7+t.age*1.2)%1;this.combatSprite(t.element,i%2,t.x+(t.target.x-t.x)*u,t.y-20+(t.target.y-t.y)*u,24,a,Math.min(1,t.life*3));}}return true;}
  return false;
 },
 drawEnemyCombatEffect(e){
  if(!e.element)return false;const element=e.element,color=ELEMENT_COLORS[element],u=e.age/(e.age+e.life),alpha=Math.min(1,e.life*4),r=e.radius||50;
  if(e.type==='element-impact'){this.glow(e.x,e.y,Math.max(20,r),color,alpha*.25);this.combatSprite(element,u<.42?2:3,e.x,e.y-7,r*(.8+.8*u),0,alpha);return true;}
  if(e.type==='weapon-flash'){this.combatSprite(element,e.melee?2:0,e.x,e.y,r*(.7+u*.9),Math.atan2(e.dir.y/1.15,e.dir.x),alpha);return true;}
  if(['toxic-jet','brine-jet'].includes(e.type)){const a=Math.atan2(e.dir.y/1.15,e.dir.x);for(const off of element==='water'?[-.16,0,.16]:[0])for(let i=0;i<8;i++){const f=((i/8+e.age*2)%1),x=e.x+Math.cos(a+off)*r*f,y=e.y+Math.sin(a+off)*r*f;this.combatSprite(element,i%2,x,y,22+f*9,a+off,alpha*(1-f*.45));}return true;}
  if(e.type==='beam'){this.line(e,e.end,color+'70',14);this.line(e,e.end,'#f5f1de',3);const a=Math.atan2(e.end.y-e.y,e.end.x-e.x);for(let i=0;i<9;i++){const t=((i/9+e.age*4)%1);this.combatSprite(element,i%2,e.x+(e.end.x-e.x)*t,e.y+(e.end.y-e.y)*t,27,a,alpha);}this.combatSprite(element,2,e.end.x,e.end.y,50,0,alpha);return true;}
  if(e.type==='slash'&&e.dir){const a=Math.atan2(e.dir.y/1.15,e.dir.x)+(u-.5)*1.8;this.combatSprite(element,u<.4?2:3,e.x+Math.cos(a)*r*.62,e.y-17+Math.sin(a)*r*.48,50,a,alpha);return false;}
  if(e.type==='eruption'){this.combatSprite(element,u<.4?2:3,e.x,e.y-10,r*(.7+u),0,alpha);return true;}
  return false;
 }
};
