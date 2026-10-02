import {ENEMIES} from './data.js?v=16';
const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.15);
const normal=(x,y)=>{const n=Math.hypot(x,y)||1;return {x:x/n,y:y/n};};
export const NEW_ROLES=['eel','salamander','shieldguard','stormnest'];
export const REGIONAL_BOSSES=['dredger','solarKnight','seedheart'];
export function bossEnemy(e){return Boolean(ENEMIES[e.type]?.boss);}
export function planEncounterAttack(g,e){
 const sets={eel:['arcDash','cinders'],salamander:['burrow','cinderTrail'],shieldguard:['shieldBash','shieldFan'],stormnest:['hatch','orbs'],dredger:['tidalRing','clawRush','tether'],solarKnight:['sunWheel','solarSweep','mirrorFan'],seedheart:['roots','seedVolley','hatch']};
 const modes=sets[e.type];if(!modes)return false;
 const p=g.state.player,dir=normal(p.x-e.x,(p.y-e.y)*1.15);e.attacks=(e.attacks||0)+1;
 let mode=modes[(e.attacks-1)%modes.length];if(mode==='hatch'&&(e.hatches||0)>=3)mode=e.type==='seedheart'?'seedVolley':'orbs';const duration=['burrow','roots','solarSweep','seedVolley','tidalRing'].includes(mode)?1.25:mode==='hatch'?1.4:.95;
 const w=e.windup={mode,dir,target:{x:p.x,y:p.y},timer:duration,total:duration};
 if(mode==='roots')w.targets=[-1,1].map(i=>({x:p.x+dir.y*110*i,y:p.y-dir.x*110*i/1.15}));
 if(mode==='cinderTrail')w.targets=[.4,.7,1].map(t=>({x:e.x+(p.x-e.x)*t,y:e.y+(p.y-e.y)*t}));
 if(mode==='tether')w.targets=[w.target];
 g.emit('windup',{type:e.type});return true;
}
export function executeEncounterAttack(g,e){
 if(![...NEW_ROLES,...REGIONAL_BOSSES].includes(e.type)||!e.windup)return false;
 if(g.inCamp())return true;
 const s=g.state,p=s.player,w=e.windup,base=ENEMIES[e.type],damage=base.damage*(e.damageMultiplier||1)*(e.phase===2?1.08:1);
 const threats=s.world.threats||(s.world.threats=[]),add=t=>threats.push({id:++g.idCounter,source:e.id,damage,color:base.color,age:0,...t});
 const fan=(count,spread,speed=300)=>{for(let i=0;i<count;i++){const a=Math.atan2(w.dir.y,w.dir.x)+(i-(count-1)/2)*spread;s.projectiles.push({id:++g.idCounter,team:'enemy',type:e.type,x:e.x,y:e.y-24,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed/1.15,radius:9,damage,life:3,age:0,trail:[],color:base.color,venom:w.mode==='seedVolley'});}};
 if(['arcDash','clawRush','shieldBash'].includes(w.mode)){e.rush={dir:w.dir,life:w.mode==='shieldBash'?.18:.4,damage,hit:false};g.effect('slash',e.x,e.y,{dir:w.dir,radius:130,color:base.color,life:.35});}
 if(['cinders','orbs','mirrorFan'].includes(w.mode))fan(w.mode==='mirrorFan'?7:3,w.mode==='mirrorFan'?.24:.32,w.mode==='cinders'?420:280);
 if(w.mode==='burrow'){e.burrow={from:{x:e.x,y:e.y},to:w.target,age:0,damage};}
 if(w.mode==='cinderTrail')for(const point of w.targets)add({...point,type:'eruption',r:64,arm:.5,life:1.1,hit:false});
 if(w.mode==='shieldFan')fan(3,.34,320);
 if(w.mode==='tidalRing')add({x:e.x,y:e.y,type:'ring',r:55,speed:280,width:24,life:1.65,hit:false});
 if(w.mode==='tether')add({x:e.x,y:e.y,type:'tether',target:w.target,dir:w.dir,arm:.45,life:1.35,hit:false});
 if(w.mode==='sunWheel')for(let i=0;i<8;i++){const a=e.angle+i*Math.PI/4;s.projectiles.push({id:++g.idCounter,team:'enemy',type:'sunWheel',x:e.x,y:e.y-24,vx:Math.cos(a)*240,vy:Math.sin(a)*240/1.15,damage,radius:12,life:3,age:0,trail:[],color:base.color});}
 if(w.mode==='solarSweep')add({x:e.x,y:e.y,type:'sweep',angle:Math.atan2(w.dir.y,w.dir.x)-.55,length:540,life:1,tick:0,color:'#ffc46c'});
 if(w.mode==='roots')for(const point of w.targets)add({...point,type:'saltwall',dir:w.dir,length:330,width:24,arm:.45,life:2.4,tick:0});
 if(w.mode==='seedVolley')fan(5,.24,290);
 if(w.mode==='hatch'){
  e.hatches=(e.hatches||0)+1;
  const own=s.world.enemies.filter(a=>!a.dead&&a.summoner===e.id).length,total=bossEnemy(e)?2:1;
  for(let i=0;i<Math.min(total,3-own);i++){const add=g.makeEnemy(e.type==='seedheart'?'salamander':'stormling',e.x+(i?110:-110),e.y+80,false,true);add.summoner=e.id;add.noReward=true;g.placeSummon(add);s.world.enemies.push(add);g.effect('spawn',add.x,add.y,{color:base.color,radius:55,life:.65});}
 }
 g.emit('enemyattack',{enemy:e.type,mode:w.mode});return true;
}
export function updateEncounterState(g,e,dt){
 if(e.burrow){const b=e.burrow;b.age+=dt;e.hidden=b.age<.55;if(b.age>=.55){e.hidden=false;g.moveEntity(e,b.to.x-e.x,b.to.y-e.y);if(distance(g.state.player,e)<85)g.hurtPlayer(b.damage);g.effect('eruption',e.x,e.y,{radius:85,color:ENEMIES[e.type].color,element:'fire',life:.65});e.burrow=null;}return true;}
 if(!REGIONAL_BOSSES.includes(e.type))return false;
 const phase=e.hp<e.maxHp*.5?2:1;if(phase>(e.phase||1)){e.phase=2;e.cd=.4;g.notice(ENEMIES[e.type].name+' · fase 2',ENEMIES[e.type].color);g.emit('bossphase',{enemy:e.type,phase:2});e.cooldownMultiplier*=.88;e.speedMultiplier*=1.08;const types={dredger:['eel','minecrab'],solarKnight:['shieldguard','salamander'],seedheart:['stormnest','sporecaster']}[e.type];for(let i=0;i<2;i++){const add=g.makeEnemy(types[i],e.x+(i?140:-140),e.y+100,false,true);add.summoner=e.id;add.noReward=true;safelySpawn(g,add);g.state.world.enemies.push(add);}}
 return false;
}
function safelySpawn(g,e){g.placeSummon(e);}
// Threat age and lifetime are advanced centrally by enemy-variety.
export function updateEncounterThreat(g,t,dt){
 const p=g.state.player;
 if(t.type==='frostwake'){
  for(const e of g.state.world.enemies.filter(e=>!e.dead&&!bossEnemy(e))){const dx=e.x-t.x,dy=(e.y-t.y)*1.15,along=dx*t.dir.x+dy*t.dir.y,cross=Math.abs(dx*t.dir.y-dy*t.dir.x);if(along>=-20&&along<t.length&&cross<t.r)e.slow=Math.max(e.slow||0,.4);}return;
 }
 if(g.inCamp())return;
 if(t.type==='ring'&&!t.hit&&Math.abs(distance(p,t)-(t.r+t.age*t.speed))<t.width){t.hit=true;g.hurtPlayer(t.damage);}
 if(t.type==='eruption'&&!t.hit&&t.age>=t.arm){t.hit=true;if(distance(p,t)<t.r)g.hurtPlayer(t.damage);g.effect('eruption',t.x,t.y,{radius:t.r,color:t.color,element:t.element,life:.5});}
 if(t.type==='tether'&&t.age>=t.arm&&!t.hit){const dx=p.x-t.x,dy=(p.y-t.y)*1.15,length=distance(t,t.target),along=dx*t.dir.x+dy*t.dir.y,cross=Math.abs(dx*t.dir.y-dy*t.dir.x);if(along>0&&along<length+40&&cross<23){t.hit=true;g.hurtPlayer(t.damage);g.moveEntity(p,-t.dir.x*75,-t.dir.y*60);}}
}
export function updateBossPhase(g,e){
 if(REGIONAL_BOSSES.includes(e.type)){updateEncounterState(g,e,0);return;}
 if(e.type!=='boss')return;
 const phase=e.hp>e.maxHp*.67?1:e.hp>e.maxHp*.33?2:3;e.phase=phase;
 if(phase>e.prevPhase){e.prevPhase=phase;g.notice('Wachter · fase '+phase,'#f6d585');g.effect('nova',e.x,e.y,{color:'#f3cd75',radius:260,life:1});for(let i=0;i<2;i++){const add=g.makeEnemy(i?'stormnest':'eel',e.x+(i?160:-160),e.y+120,false,true);add.noReward=true;g.placeSummon(add);g.state.world.enemies.push(add);}g.emit('bossphase',{enemy:e.type,phase});}
}
