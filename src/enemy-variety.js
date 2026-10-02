import {ENEMIES} from './data.js?v=16';
import {planEncounterAttack,executeEncounterAttack,updateEncounterThreat} from './encounters.js?v=16';
import {planToxicAttack,executeToxicAttack,updateToxicPool} from './toxic-enemies.js?v=16';
import {coverHit} from './arena-layouts.js?v=16';
const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.15);
const direction=(x,y)=>{const d=Math.hypot(x,y)||1;return {x:x/d,y:y/d};};
export function planNewAttack(g,e){
 if(planToxicAttack(g,e))return true;
 if(planEncounterAttack(g,e))return true;
 if(!['minecrab','resonant','brinebreaker'].includes(e.type))return false;
 const p=g.state.player,dir=direction(p.x-e.x,(p.y-e.y)*1.15);
 e.attacks=(e.attacks||0)+1;
 const modes={minecrab:['mines','magnet'],resonant:['echo','sweep'],brinebreaker:['brinejet','saltwalls']};
 const mode=modes[e.type][(e.attacks-1)%2],duration={mines:1.1,magnet:1.2,echo:.85,sweep:1.25,brinejet:1,saltwalls:1.3}[mode];
 const w=e.windup={mode,timer:duration,total:duration,dir,target:{x:p.x,y:p.y}};
 if(mode==='mines')w.targets=[w.target,{x:p.x-dir.y*105,y:p.y+dir.x*105/1.15},{x:p.x+dir.y*105,y:p.y-dir.x*105/1.15}];
 if(mode==='saltwalls')w.targets=[-1,1].map(sign=>({x:p.x-dir.y*85*sign,y:p.y+dir.x*85*sign/1.15}));
 g.emit('windup',{type:e.type});return true;
}
export function executeNewAttack(g,e){
 if(executeToxicAttack(g,e))return true;
 if(executeEncounterAttack(g,e))return true;
 const w=e.windup;if(!w||!['minecrab','resonant','brinebreaker'].includes(e.type))return false;
 const s=g.state,p=s.player,base=ENEMIES[e.type],damage=base.damage*(e.damageMultiplier||1)*(e.elite?1.18:1);
 if(g.inCamp())return true;
 const threats=s.world.threats||(s.world.threats=[]),add=t=>threats.push({id:++g.idCounter,source:e.id,damage,color:base.color,age:0,...t});
 if(w.mode==='mines')for(const point of w.targets)add({...point,type:'mine',r:75,arm:1.1,life:7,triggered:false});
 if(w.mode==='magnet')add({x:e.x,y:e.y,type:'magnet',r:220,life:1.2,hit:false});
 if(w.mode==='sweep')add({x:e.x,y:e.y,type:'sweep',angle:Math.atan2(w.dir.y,w.dir.x)-.6,length:540,life:1.1,tick:0});
 if(w.mode==='echo')for(let i=0;i<3;i++){
  const angle=Math.atan2(w.dir.y,w.dir.x)+(i-1)*.28;
  s.projectiles.push({id:++g.idCounter,team:'enemy',type:'echo',x:e.x+Math.cos(angle)*32,y:e.y-20+Math.sin(angle)*24,vx:Math.cos(angle)*330,vy:Math.sin(angle)*330/1.15,damage,radius:9,life:3,age:0,trail:[],color:base.color});
 }
 if(w.mode==='brinejet'){
  const dx=p.x-e.x,dy=(p.y-e.y)*1.15,d=Math.hypot(dx,dy),dot=(dx*w.dir.x+dy*w.dir.y)/Math.max(1,d);
  if(d<280&&dot>.87){g.hurtPlayer(damage);g.moveEntity(p,w.dir.x*34,w.dir.y*25);}
  g.effect('brine-jet',e.x,e.y,{dir:w.dir,radius:280,color:base.color,life:.5});
 }
 if(w.mode==='saltwalls')for(const point of w.targets)add({...point,type:'saltwall',dir:w.dir,length:260,width:27,arm:.4,life:3,tick:0});
 g.emit('enemyattack',{enemy:e.type,mode:w.mode});return true;
}
export function updateNewThreats(g,dt){
 const s=g.state,p=s.player,threats=s.world.threats||[];
 for(const t of threats){t.age+=dt;t.life-=dt;if(g.inCamp())continue;
  updateEncounterThreat(g,t,dt);
  updateToxicPool(g,t,dt);
  if(t.type==='mine'&&t.age>=t.arm&&distance(t,p)<t.r&&!t.triggered){t.triggered=true;t.life=0;g.hurtPlayer(t.damage);g.effect('eruption',t.x,t.y,{radius:t.r,color:t.color,element:t.element,life:.5});}
  if(t.type==='magnet'&&distance(t,p)<t.r){const n=direction(t.x-p.x,t.y-p.y);g.moveEntity(p,n.x*65*dt,n.y*50*dt);if(!t.hit&&t.age>.7&&distance(t,p)<65){t.hit=true;g.hurtPlayer(t.damage*.7,'electric');}}
  if(t.type==='sweep'){
   const angle=t.angle+t.age*1.1,dx=p.x-t.x,dy=(p.y-t.y)*1.15,along=dx*Math.cos(angle)+dy*Math.sin(angle),cross=Math.abs(dx*Math.sin(angle)-dy*Math.cos(angle));
   t.tick-=dt;if(t.tick<=0){t.tick=.24;if(along>0&&along<t.length&&cross<21&&!coverHit(t,p,s.area))g.hurtPlayer(t.damage,'electric');}
  }
  if(t.type==='saltwall'&&t.age>=t.arm){const dx=p.x-t.x,dy=(p.y-t.y)*1.15,along=dx*t.dir.x+dy*t.dir.y,cross=Math.abs(dx*t.dir.y-dy*t.dir.x);t.tick-=dt;if(t.tick<=0){t.tick=.65;if(Math.abs(along)<t.length/2&&cross<t.width)g.hurtPlayer(t.damage*.75);}}
 }
 s.world.threats=threats.filter(t=>t.life>0);
}
