import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Engine,copy,canStand,findPath,clearLine,distance} from '../src/engine.js';
import {WORLD,ENEMIES} from '../src/data.js';
import {NORA} from '../src/quests.js';
import {enemyMuzzle,enemyAttackMotion} from '../src/enemy-combat.js';

let passed=0;const test=(name,run)=>{run();passed++;console.log('PASS '+name);};
function arena(){const g=new Engine('tide',183);g.enterArea('ring');g.state.world.enemies=[];g.state.world.hazards=[];Object.assign(g.state.player,{x:850,y:640,invincible:0});return g;}
function nora(){const g=new Engine('tide',72);g.state.cores=[0];g.enterArea('highway');Object.assign(g.state.player,{x:NORA.x,y:NORA.y});return g;}
function walk(g,target){const p=g.state.player,path=findPath(p,target,g.state.area,26).length?findPath(p,target,g.state.area,26):findPath(p,target,g.state.area,18);assert(path.length);for(const point of path){let n=0;while(distance(p,point)>6&&n++<2400){const a=Math.round(Math.atan2((point.y-p.y)/.78,point.x-p.x)/(Math.PI/4))*Math.PI/4;g.update(1/60,{x:Math.round(Math.cos(a)),y:Math.round(Math.sin(a))});}assert(n<2400);}assert(distance(p,target)<8);}
function clearDepot(g){g.enterArea('depot');for(let round=0;round<2;round++){for(const e of g.state.world.enemies.filter(e=>!e.dead))g.killEnemy(e);g.state.player.xp=0;g.update(.01);}assert(g.state.world.sideDone);return g.state.world.loot.find(i=>i.quest);}
function flights(g,seconds){for(let i=0;i<Math.round(seconds*60);i++)g.updateProjectiles(1/60);}

test('All Transportnet walking cells connect to arrival; new plazas and Nora accept actual keyboard approaches',()=>{
 const g=nora();g.enterArea('highway');const cells=new Map();for(let y=24;y<WORLD.height;y+=24)for(let x=24;x<WORLD.width;x+=24)if(canStand(x,y,18,'highway'))cells.set(x+','+y,{x,y});
 const start=[...cells].sort((a,b)=>distance(a[1],g.state.player)-distance(b[1],g.state.player))[0][0],seen=new Set([start]),queue=[start];
 while(queue.length){const key=queue.shift(),p=cells.get(key);for(const [dx,dy]of [[24,0],[-24,0],[0,24],[0,-24],[24,24],[24,-24],[-24,24],[-24,-24]]){const k=(p.x+dx)+','+(p.y+dy);if(cells.has(k)&&!seen.has(k)&&clearLine(p,cells.get(k),'highway',18)){seen.add(k);queue.push(k);}}}
 assert.equal(seen.size,cells.size,'isolated painted floor');assert(cells.size>1200);
 for(const target of [NORA,{x:910,y:285},{x:1180,y:335},{x:1320,y:800},{x:435,y:525}]){g.enterArea('highway');walk(g,target);}
 g.enterArea('highway');walk(g,NORA);assert.equal(g.interaction().type,'quest');assert(g.interact());assert.equal(g.state.pending.type,'quest');g.closeModal();assert.equal(g.state.mode,'playing');
});
test('Nora quest is opt in, cannot be accepted remotely and never advances the story',()=>{
 const g=nora(),goal=g.recommendedArea(),story=copy(g.state.storyPassed);assert(!g.state.quests?.noodstroom);g.state.player.x-=300;assert(!g.acceptSalvageQuest());Object.assign(g.state.player,NORA);assert(g.acceptSalvageQuest());const rng=g.rng.getState();assert(!g.acceptSalvageQuest());assert.equal(g.rng.getState(),rng);assert.equal(g.recommendedArea(),goal);assert.deepEqual(g.state.storyPassed,story);assert(g.state.quests.noodstroom.choices.every(i=>i.rarity==='rare'));
});
test('Meetspoel requires both Depot groups and is collected once without consuming an inventory slot',()=>{
 const g=nora();g.acceptSalvageQuest();g.enterArea('depot');g.placeQuestRecovery();assert(!g.state.world.loot.some(i=>i.quest));for(const e of g.state.world.enemies)g.killEnemy(e);g.state.player.xp=0;g.update(.01);assert.equal(g.state.world.sideRound,2);assert(!g.state.world.loot.some(i=>i.quest));for(const e of g.state.world.enemies.filter(e=>!e.dead))g.killEnemy(e);g.state.player.xp=0;g.update(.01);
 const loot=g.state.world.loot.find(i=>i.quest);assert(loot);assert(canStand(loot.x,loot.y,18,'depot'));g.state.player.inventory=Array(48).fill(g.state.player.equipment.boots);const cash=g.state.player.scrap;Object.assign(g.state.player,{x:loot.x,y:loot.y});assert(g.interact());assert.equal(g.state.quests.noodstroom.status,'ready');assert.equal(g.state.player.inventory.length,48);assert.equal(g.state.player.scrap,cash);assert(!g.collectQuestRecovery(loot));g.placeQuestRecovery();assert(!g.state.world.loot.some(i=>i.quest));
});
test('Quest reward validates location, choice and capacity; pays once, stays manual and survives retry',()=>{
 const g=nora();g.acceptSalvageQuest();const loot=clearDepot(g);g.collectQuestRecovery(loot);assert(!g.claimSalvageReward(0));g.enterArea('highway');Object.assign(g.state.player,NORA);assert(!g.claimSalvageReward(9));const p=g.state.player,equipment=copy(p.equipment),cash=p.scrap;p.inventory=Array(48).fill(p.equipment.boots);assert(!g.claimSalvageReward(0));assert.equal(p.scrap,cash);assert.equal(g.state.quests.noodstroom.status,'ready');p.inventory=[];const uid=g.claimSalvageReward(1);assert(uid);assert.equal(p.scrap,cash+80);assert.equal(p.inventory.length,1);assert.equal(p.inventory[0].slot,'boots');assert.deepEqual(p.equipment,equipment);assert(!g.claimSalvageReward(2));const restored=Engine.restore(g.serialize());restored.retry();assert.equal(restored.state.quests.noodstroom.status,'completed');assert.equal(restored.state.player.scrap,cash+80);assert.equal(restored.state.player.inventory[0].uid,uid);Object.assign(restored.state.player,NORA);assert(!restored.claimSalvageReward(0));
});
test('Accepted quest and fixed choices reload; collected progress is retained when travelling back',()=>{
 const g=nora();g.acceptSalvageQuest();const choices=copy(g.state.quests.noodstroom.choices),r=Engine.restore(g.serialize());assert.deepEqual(r.state.quests.noodstroom.choices,choices);const loot=clearDepot(r);r.collectQuestRecovery(loot);r.enterArea('highway');const next=Engine.restore(r.serialize());next.retry();assert.equal(next.state.quests.noodstroom.status,'ready');assert.deepEqual(next.state.quests.noodstroom.choices,choices);
});
test('Six distinct projectile families use original aligned transparent effect crops',()=>{
 const atlas=JSON.parse(fs.readFileSync(new URL('../assets/expedition/combat-effects-v551.json',import.meta.url)));
 const seen=new Set();for(const [type,attacks,element]of [['drone',0,'metal'],['siege',0,'fire'],['stormling',0,'storm'],['toxinbeetle',0,'toxin'],['eel',1,'water'],['shieldguard',1,'solar']]){const g=arena(),e=g.makeEnemy(type,1100,640);e.attacks=attacks;g.planAttack(e);const muzzle=enemyMuzzle(e);g.executeEnemyAttack(e);const b=g.state.projectiles[0];assert(b,type);assert.equal(b.element,element);seen.add(b.element);assert.equal(b.source,e.id);if(type!=='stormling'){assert.equal(b.x,muzzle.x);assert.equal(b.y,muzzle.y);}assert.equal(atlas.elements[element].length,4);for(const crop of atlas.elements[element]){const [x,y,w,h]=crop.bounds;assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=1024&&y+h<=1536);assert.deepEqual(crop.anchor,[.5,.5]);}}
 assert.equal(seen.size,6);
});
test('Precision shots travel from the gun and hit the locked body target rather than applying instant damage',()=>{
 const g=arena(),e=g.makeEnemy('sniper',1120,640),p=g.state.player;g.planAttack(e);const target=copy(e.windup.target);g.executeEnemyAttack(e);assert.equal(p.hp,100);assert.equal(g.state.projectiles[0].type,'precision');assert.equal(g.state.projectiles[0].element,'metal');flights(g,.15);assert.equal(p.hp,100);flights(g,.25);assert(p.hp<100);assert.deepEqual(e.windup.target,target);
 const dodge=arena(),s=dodge.makeEnemy('sniper',1120,640);dodge.planAttack(s);dodge.state.player.y-=130;dodge.executeEnemyAttack(s);flights(dodge,.6);assert.equal(dodge.state.player.hp,100);
});
test('Artillery has visible flight and a delayed landing; moving away avoids damage and poison',()=>{
 for(const type of ['siege','sporecaster']){const g=arena(),e=g.makeEnemy(type,1100,640),p=g.state.player;g.planAttack(e);g.executeEnemyAttack(e);flights(g,.25);assert.equal(p.hp,100);assert(g.state.projectiles.every(b=>b.flightHeight>50));assert.equal(g.state.world.hazards.length,0);flights(g,.5);assert(p.hp<100);assert.equal(p.venom>0,type==='sporecaster');assert(g.state.effects.some(f=>f.type==='element-impact'));
 const miss=arena(),m=miss.makeEnemy(type,1100,640);miss.planAttack(m);miss.executeEnemyAttack(m);miss.state.player.y-=200;flights(miss,.8);assert.equal(miss.state.player.hp,100);assert(!(miss.state.player.venom>0));}
});
test('Poison pool carriers are visual flights and never duplicate the pool damage',()=>{
 const g=arena(),e=g.makeEnemy('toxinbeetle',1100,640);e.attacks=1;g.planAttack(e);g.executeEnemyAttack(e);assert.equal(g.state.projectiles.length,1);assert.equal(g.state.projectiles[0].type,'enemy-carrier');assert.equal(g.state.world.threats.length,1);flights(g,.7);assert.equal(g.state.player.hp,100);assert(!(g.state.player.venom>0));assert.equal(g.state.world.threats[0].age,0);
});
test('Water projectiles wet on a real hit; dodge protection prevents the hit and its status',()=>{
 const g=arena(),e=g.makeEnemy('eel',1100,640);e.attacks=1;g.planAttack(e);g.executeEnemyAttack(e);flights(g,.6);assert(g.state.player.hp<100);assert.equal(g.state.player.wet,1.1);
 const safe=arena(),f=safe.makeEnemy('eel',1100,640);f.attacks=1;safe.planAttack(f);safe.executeEnemyAttack(f);safe.state.player.invincible=2;flights(safe,.6);assert.equal(safe.state.player.hp,100);assert.equal(safe.state.player.wet,0);
});
test('Enemy bodies pull back during preparation and recoil or lunge toward the locked direction',()=>{
 const g=arena();for(const [type,melee]of [['sniper',false],['raider',true]]){const e=g.makeEnemy(type,1100,640);g.planAttack(e);e.windup.timer=e.windup.total*.15;const charge=enemyAttackMotion(e);assert(charge.x>0);g.executeEnemyAttack(e);e.windup=null;e.attackRelease=.16;const release=enemyAttackMotion(e);assert.equal(release.x>0,!melee);assert(Math.abs(release.x)>=7);assert(Number.isFinite(release.rotation));e.attackRelease=0;assert(Math.abs(enemyAttackMotion(e).x)<1e-9);}
});
console.log(`\n${passed} combat and quest checks passed.`);
