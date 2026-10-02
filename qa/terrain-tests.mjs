import assert from 'node:assert/strict';
import {Engine,canStand,findPath,distance,clearLine} from '../src/engine.js';
import {SAFE_HUBS} from '../src/hubs.js';
import {ARENA_LAYOUTS,arenaObstacles,coverHit} from '../src/arena-layouts.js';
let n=0;const test=(name,fn)=>{fn();n++;console.log('PASS '+name);};
function walk(g,points){for(const point of points){let frames=0;while(distance(g.state.player,point)>5&&frames++<1200){const p=g.state.player,a=Math.round(Math.atan2((point.y-p.y)/.78,point.x-p.x)/(Math.PI/4))*Math.PI/4;g.update(1/60,{x:Math.round(Math.cos(a)),y:Math.round(Math.sin(a))});}assert(frames<1200,g.state.area+' blocked keyboard lane');}}
test('Every hub service, gate, crate and quest NPC has a route with extra body clearance',()=>{
 for(const id of SAFE_HUBS){const g=new Engine();g.state.cores=[0,1,2,3];g.enterArea(id);for(const t of [...g.state.world.portals,...g.state.world.camp.services,...g.state.world.loot,...g.questNPCs()])assert(findPath(g.state.player,t,id,35).length,id+' narrow access '+(t.to||t.id));}
});
test('Depot fork accepts three ordinary approaches across the visible road, in both directions',()=>{
 for(const offset of [-18,0,18]){const g=new Engine();g.state.cores=[0,1,2,3];g.enterArea('highway');const p=g.state.player;Object.assign(p,{x:1250,y:510+offset,velocity:{x:0,y:0}});assert(canStand(p.x,p.y,35,'highway'));
  const route=[{x:1400,y:570+offset},{x:1560,y:650+offset},{x:1715,y:700}];walk(g,route);assert.equal(g.interaction().entity.to,'depot');walk(g,[...route.slice(0,-1).reverse(),{x:1250,y:510+offset}]);assert(distance(p,{x:1250,y:510+offset})<8);
 }
});
test('Arena obstacles leave a connected floor and all wave spawns and return gates reachable',()=>{
 for(const id of Object.keys(ARENA_LAYOUTS)){const g=new Engine();g.state.cores=[0,1,2,3];g.enterArea(id);const p=g.state.player;
  const cells=new Map();for(let y=240;y<1040;y+=48)for(let x=240;x<1740;x+=48)if(canStand(x,y,35,id))cells.set(x+','+y,{x,y});
  const first=cells.keys().next().value,seen=new Set([first]),queue=[first];while(queue.length){const key=queue.shift(),a=cells.get(key);for(const [dx,dy]of [[48,0],[-48,0],[0,48],[0,-48]]){const next=(a.x+dx)+','+(a.y+dy);if(cells.has(next)&&!seen.has(next)&&clearLine(a,cells.get(next),id,35)){seen.add(next);queue.push(next);}}}
  assert.equal(seen.size,cells.size,id+' has disconnected combat floor');
  for(const e of g.state.world.enemies){assert(canStand(e.x,e.y,e.radius,id),id+' invalid spawn');assert(findPath(p,e,id).length);}
  assert(findPath(p,g.state.world.portals[0],id,35).length,id+' blocked return');
  for(const o of arenaObstacles(id)){assert(!canStand(o.x,o.y,18,id));const left={x:o.x-o.rx-60,y:o.y},right={x:o.x+o.rx+60,y:o.y};assert(!clearLine(left,right,id));const path=findPath(left,right,id,26);assert(path.length,id+' no detour');}
  g.state.world.enemies=[];walk(g,findPath(p,{x:1500,y:400},id,35));
 }
});
test('Fast projectiles hit cover before damaging targets behind it; airborne bombs land beyond it',()=>{
 const g=new Engine();g.enterArea('delta');g.state.world.enemies=[];g.state.world.hazards=[];const p=g.state.player;Object.assign(p,{x:740,y:640});const target=g.makeEnemy('raider',1170,660);target.cd=99;g.state.world.enemies=[target];const hp=target.hp;
 g.state.projectiles=[{team:'player',type:'frost',x:740,y:620,vx:1800,vy:0,radius:10,damage:30,age:0,life:2,trail:[],hitIds:[]}];g.updateProjectiles(.3);assert.equal(target.hp,hp);assert.equal(g.state.projectiles.length,0);
 const hit=coverHit({x:740,y:640},{x:1200,y:640},'delta',10);assert(hit&&hit.x<940);
 assert(g.cast('ember',{x:target.x,y:target.y}));for(let i=0;i<100;i++)g.updateProjectiles(1/60);assert(target.hp<hp);
 const turret=g.makeEnemy('turret',740,640);Object.assign(p,{x:1170,y:640,invincible:0});const health=p.hp;g.planAttack(turret);g.executeEnemyAttack(turret);assert.equal(p.hp,health);assert(g.state.effects.findLast(f=>f.type==='beam').end.x<940);
 Object.assign(turret,{x:740,y:820});Object.assign(p,{x:1170,y:820,invincible:0});g.planAttack(turret);g.executeEnemyAttack(turret);assert(p.hp<health,'uncovered beam must still deal damage');
});
test('Enemies detour around arena props instead of walking into them or shooting through them',()=>{
 const g=new Engine();g.enterArea('delta');g.state.world.hazards=[];Object.assign(g.state.player,{x:1150,y:700});const e=g.makeEnemy('crawler',720,640,false,true);e.cd=0;g.state.world.enemies=[e];const start=distance(e,g.state.player);
 for(let i=0;i<600;i++){g.updateEnemies(1/60);assert(canStand(e.x,e.y,e.radius,'delta'));}
 assert(distance(e,g.state.player)<start*.5,'enemy stayed stuck');
});
test('A jumping enemy killed above a prop drops its loot on reachable ground',()=>{
 const g=new Engine();g.enterArea('delta');g.state.world.enemies=[];g.state.world.hazards=[];g.rng=()=>0;const e=g.makeEnemy('beast',750,640,false,true);g.state.world.enemies=[e];Object.assign(g.state.player,{x:1120,y:640});g.planAttack(e);g.executeEnemyAttack(e);e.windup=null;g.updateEnemies(.15);assert(!canStand(e.x,e.y,18,'delta'));g.hitEnemy(e,e.hp+1,'physical');assert(e.dead);const loot=g.state.world.loot.find(i=>i.item);assert(loot);assert(canStand(loot.x,loot.y,22,'delta'));assert(findPath(g.state.player,loot,'delta',22).length);assert(g.state.world.pickups.every(i=>canStand(i.x,i.y,22,'delta')));
});
test('An older save inside new cover resumes on walkable ground without changing health or gear',()=>{
 const g=new Engine();g.enterArea('delta');const p=g.state.player;Object.assign(p,{x:940,y:640,hp:41,scrap:110});g.state.world.loot.push({id:999,x:940,y:640,item:{uid:999}});const equipment=JSON.stringify(p.equipment),r=Engine.restore(g.serialize());assert(canStand(r.state.player.x,r.state.player.y,18,'delta'));assert.equal(r.state.player.hp,41);assert.equal(r.state.player.scrap,110);assert.equal(JSON.stringify(r.state.player.equipment),equipment);const drop=r.state.world.loot.find(i=>i.id===999);assert(canStand(drop.x,drop.y,22,'delta'));
});
console.log(`\n${n} passage, arena navigation and cover checks passed.`);
