const dist=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.15);
export function planToxicAttack(g,e){
 if(!['toxinbeetle','chemist'].includes(e.type))return false;
 const p=g.state.player,dx=p.x-e.x,dy=(p.y-e.y)*1.15,d=Math.hypot(dx,dy)||1;e.attacks=(e.attacks||0)+1;
 const mode=e.type==='toxinbeetle'?(e.attacks%2?'venomFan':'acidPool'):(e.attacks%2?'venomJet':'toxicVolley'),duration=mode==='venomJet'?1.3:1.15;
 e.windup={mode,dir:{x:dx/d,y:dy/d},target:{x:p.x,y:p.y},timer:duration,total:duration};g.emit('windup',{type:e.type});return true;
}
export function executeToxicAttack(g,e){
 if(!['toxinbeetle','chemist'].includes(e.type)||!e.windup)return false;if(g.inCamp())return true;
 const w=e.windup,s=g.state,damage=10*(e.damageMultiplier||1),color='#b7db62';
 if(w.mode==='venomFan')for(const off of [-.34,0,.34]){const a=Math.atan2(w.dir.y,w.dir.x)+off;s.projectiles.push({id:++g.idCounter,team:'enemy',type:'venom',venom:true,color,x:e.x,y:e.y-20,vx:Math.cos(a)*245,vy:Math.sin(a)*245/1.15,radius:9,damage,age:0,life:3,trail:[]});}
 if(w.mode==='venomJet'){const p=s.player,dx=p.x-e.x,dy=(p.y-e.y)*1.15,along=dx*w.dir.x+dy*w.dir.y,cross=Math.abs(dx*w.dir.y-dy*w.dir.x);if(along>0&&along<380&&cross<27)g.hurtPlayer(damage,'venomHit');g.effect('toxic-jet',e.x,e.y,{dir:w.dir,radius:380,color,life:.45});}
 if(['acidPool','toxicVolley'].includes(w.mode)){const points=w.mode==='acidPool'?[w.target]:[-1,0,1].map(i=>({x:w.target.x-w.dir.y*i*100,y:w.target.y+w.dir.x*i*100/1.15}));for(const p of points)s.world.threats.push({id:++g.idCounter,source:e.id,type:'toxicPool',...p,arm:.65,age:0,life:3.65,r:w.mode==='acidPool'?88:48,tick:0,damage:6,color});}
 g.emit('enemyattack',{enemy:e.type,mode:w.mode});return true;
}
export function updateToxicPool(g,t,dt){if(t.type!=='toxicPool')return;t.tick-=dt;if(t.age>=t.arm&&t.tick<=0&&dist(g.state.player,t)<t.r){t.tick=.8;g.hurtPlayer(t.damage,'venomHit');}}
