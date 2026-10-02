import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Engine,copy,canStand} from '../src/engine.js';
import {AREAS,POSITIONS,START_EQUIPMENT} from '../src/data.js';
import {makeItem} from '../src/loot.js';
import {updateHeroMotion} from '../src/hero-motion.js';
import {footCycle,WALK_CYCLE_DISTANCE,WALK_STRIDE,FOOT_STANCE} from '../src/hero-rig.js';
import {enemyPose,updateEnemyMotion} from '../src/enemy-motion.js';

let passed=0;
function test(name,run){try{run();passed++;console.log('PASS '+name);}catch(e){console.error('FAIL '+name);throw e;}}
function arena(seed=31){const g=new Engine('tide',seed);g.enterArea('ring');g.state.world.enemies=[];g.state.world.hazards=[];Object.assign(g.state.player,{x:850,y:640,invincible:0});return g;}
function step(g,seconds){for(let n=0;n<Math.round(seconds*60);n++){g.update(1/60);if(g.state.pending?.type==='upgrade')g.deferUpgrade();}}
function ticks(g,seconds){for(let n=0;n<Math.round(seconds*60);n++)g.updateSurvival(1/60);}
function trader(seed=61){const g=new Engine('tide',seed),m=g.hubMerchants().find(m=>m.id==='outfitter');Object.assign(g.state.player,{x:m.x,y:m.y,scrap:2000});return g;}
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('Bandage heals once and repeated input cannot bypass the ten second cooldown',()=>{
 const g=arena(),p=g.state.player;p.hp=10;assert(g.heal());assert.equal(p.hp,55);assert.equal(p.potions,2);for(let n=0;n<100;n++)assert(!g.heal());step(g,9.9);assert(!g.heal());step(g,.12);assert(g.heal());assert.equal(p.potions,1);assert.equal(p.hp,100);assert(!g.heal());
});
test('Consumable cooldowns survive travel and save; paused time cannot shorten them',()=>{
 const g=arena(),p=g.state.player;p.hp=25;g.heal();g.state.mode='modal';g.update(20);assert.equal(p.healCooldown,10);g.state.mode='playing';g.enterArea('canal');near(p.healCooldown,10);const restored=Engine.restore(g.serialize());near(restored.state.player.healCooldown,10);step(restored,3);near(restored.state.player.healCooldown,7);
});
test('One poison infection delivers exactly fifty percent max HP in eight delayed ticks',()=>{
 const g=arena(),p=g.state.player,max=g.stats().maxHp;assert(g.applyVenom());assert.equal(p.hp,max);ticks(g,.9);assert.equal(p.hp,max);ticks(g,7.1);near(p.hp,max*.5);assert.equal(p.venom,0);assert.equal(g.state.mode,'playing');ticks(g,3);near(p.hp,max*.5);
});
test('Poison remains fifty percent with heavy armor, shields and dodge after infection',()=>{
 const g=arena(),p=g.state.player;p.stats.armor=.55;p.ward=999;p.wardTime=20;const hp=p.hp;g.applyVenom();p.invincible=10;ticks(g,8);near(p.hp,hp-g.stats().maxHp*.5);assert.equal(p.ward,999);
});
test('Poison refreshes duration without multiplying damage or resetting a partial tick',()=>{
 const g=arena(),p=g.state.player;g.applyVenom();ticks(g,.5);const rate=p.venomDamage;assert(g.applyVenom());near(p.venomTick,.5);near(p.venomDamage,rate);near(p.venom,8);ticks(g,.5);near(p.hp,100-rate);
});
test('Bandage restores HP while poison continues; immunity blocks new infections',()=>{
 const g=arena(),p=g.state.player;g.applyVenom();ticks(g,3);const before=p.hp;assert(g.heal());assert(p.hp>before);assert(p.venom>0);const after=p.hp;ticks(g,1);assert(p.hp<after);const safe=arena();safe.state.player.invincible=1;assert(!safe.applyVenom());safe.state.player.invincible=0;safe.state.player.venomGuard=1;assert(!safe.applyVenom());
});
test('Antidote costs a dose, clears both poisons and gives five seconds guard with thirty seconds cooldown',()=>{
 const g=arena(),p=g.state.player;p.antidotes=2;g.applyVenom();p.poison=2;const hp=p.hp;assert(g.useAntidote());assert.equal(p.hp,hp);assert.equal(p.antidotes,1);assert.equal(p.venom,0);assert.equal(p.poison,0);assert.equal(p.venomGuard,5);assert.equal(p.antidoteCooldown,30);assert(!g.applyVenom());ticks(g,5.1);assert(g.applyVenom());assert(!g.useAntidote());ticks(g,25);assert(g.applyVenom());assert(g.useAntidote());assert.equal(p.antidotes,0);
});
test('Antidote stock is expensive, limited and cannot be restored by reload or checkpoint retry',()=>{
 const g=trader(),p=g.state.player;p.scrap=44;assert(!g.buyAntidote());p.scrap=100;assert(g.buyAntidote());assert.equal(p.scrap,55);assert(g.buyAntidote());assert.equal(p.scrap,10);assert.equal(p.antidotes,3);p.scrap=200;assert(!g.buyAntidote());const restored=Engine.restore(g.serialize());assert.equal(restored.state.world.shop.antidoteStock,0);restored.retry();assert.equal(restored.state.world.shop.antidoteStock,0);assert.equal(restored.state.player.antidotes,3);assert(!restored.buyAntidote());
});
test('Spuitkever alternates a projectile fan and an armed pool; Gifmeester alternates a jet and three pools',()=>{
 for(const [type,modes]of [['toxinbeetle',['venomFan','acidPool']],['chemist',['venomJet','toxicVolley']]]){
  const g=arena(),e=g.makeEnemy(type,1000,640);for(const mode of modes){g.planAttack(e);assert.equal(e.windup.mode,mode);assert(e.windup.total>=1.15);g.executeEnemyAttack(e);}
  if(type==='toxinbeetle'){assert.equal(g.state.projectiles.filter(b=>b.type!=='enemy-carrier').length,3);assert(g.state.projectiles.filter(b=>b.type!=='enemy-carrier').every(b=>b.venom));assert.equal(g.state.world.threats.length,1);}else assert.equal(g.state.world.threats.length,3);
 }
});
test('A poison jet locks its direction and can be avoided before release',()=>{
 const g=arena(),p=g.state.player,e=g.makeEnemy('chemist',1000,640);g.planAttack(e);const dir=copy(e.windup.dir);p.y-=130;g.executeEnemyAttack(e);assert.equal(p.hp,100);assert.equal(p.venom,0);assert.deepEqual(e.windup.dir,dir);p.y+=130;g.executeEnemyAttack(e);assert(p.hp<100&&p.hp>80);assert.equal(p.venom,8);assert.equal(e.attackRelease,.32);
});
test('Poison projectiles infect on real collision; armed pools allow a warning before damage',()=>{
 const g=arena(),p=g.state.player,e=g.makeEnemy('toxinbeetle',1040,660);g.planAttack(e);g.executeEnemyAttack(e);for(let i=0;i<90&&p.venom===0;i++)g.updateProjectiles(1/60);assert.equal(p.venom,8);const pool=arena(),q=pool.state.player,a=pool.makeEnemy('toxinbeetle',1040,660);pool.planAttack(a);pool.planAttack(a);pool.executeEnemyAttack(a);step(pool,.6);assert.equal(q.hp,100);step(pool,.1);assert(q.venom>0);q.x+=200;const hp=q.hp;step(pool,.7);assert.equal(q.hp,hp);
});
test('Six painted enemy families have complete unique walk, anticipation and release frames',()=>{
 const atlas=JSON.parse(fs.readFileSync(new URL('../assets/expedition/enemy-animation-v55.json',import.meta.url)));assert.equal(Object.keys(atlas.enemies).length,6);
 for(const [type,a]of Object.entries(atlas.enemies)){assert.equal(a.frames.length,6,type);assert.equal(new Set(a.frames.map(f=>f.bounds.join(','))).size,6);for(const f of a.frames){assert(f.bounds[2]>30&&f.bounds[3]>30);assert(f.anchor.every(v=>v>=0&&v<=1));}assert(a.scaleDenominator>60);}
});
test('Enemy walk follows actual distance, freezes when blocked and yields to attack poses',()=>{
 const e={type:'chemist'};updateEnemyMotion(e,-40,0,.2);assert.equal(e.travelFacing,-1);assert(e.walkDistance>0);const phase=e.walkDistance;for(let n=0;n<60;n++)updateEnemyMotion(e,0,0,1/60);assert.equal(e.walkDistance,phase);assert.equal(enemyPose(e).frame,0);e.windup={};assert.equal(enemyPose(e).frame,4);delete e.windup;e.attackRelease=.2;assert.equal(enemyPose(e).frame,5);
});
test('Hero feet alternate contact and lift; blocked movement does not run the gait',()=>{
 for(const phase of [0,.1,.25,.5,.75]){const [a,b]=footCycle(phase);assert(!(a.planted&&b.planted));}assert(footCycle((1+FOOT_STANCE)/2)[0].lift>.99);assert(footCycle((1+FOOT_STANCE)/2-.5)[1].lift>.99);
 // A planted boot stays at the same world position as the hips move forward.
 for(const phase of [.05,.15,.3]){const next=phase+.03;near(phase*WALK_CYCLE_DISTANCE+footCycle(phase)[0].advance*WALK_STRIDE,next*WALK_CYCLE_DISTANCE+footCycle(next)[0].advance*WALK_STRIDE);}
 const p=arena().state.player;updateHeroMotion(p,20,0,.1,200);const distance=p.walkDistance;assert(p.moving);updateHeroMotion(p,0,0,.1,200);assert.equal(p.walkDistance,distance);assert(!p.moving);p.dashDir={x:1,y:0};updateHeroMotion(p,80,0,.1,200,true);assert.equal(p.walkDistance,distance);
});
test('Two optional regions unlock after a core and never change the sixteen chapter story',()=>{
 const g=new Engine();for(const area of AREAS.filter(a=>a.optional)){assert(!g.canSelectDestination(area.id));}g.state.cores=[0];const goal=g.recommendedArea();for(const area of AREAS.filter(a=>a.optional)){assert(g.canSelectDestination(area.id));assert(g.enterArea(area.id));assert.equal(g.recommendedArea(),goal);assert.equal(g.state.world.portals.length,1);assert.equal(g.interaction(),null);assert(g.state.world.enemies.every(e=>canStand(e.x,e.y,e.radius,area.id)));}assert.equal(AREAS.filter(a=>!a.optional&&!a.endgame).length,16);
});
test('Optional expeditions require two groups, pay once and replay scaled without free healing',()=>{
 for(const area of AREAS.filter(a=>a.optional)){const g=new Engine('tide',99);g.state.cores=[0];g.enterArea(area.id);const w=g.state.world;for(let round=0;round<2;round++){for(const e of w.enemies.filter(e=>!e.dead))g.killEnemy(e);g.state.player.xp=0;g.update(.01);if(round===0)assert(!g.arenaCleared());}assert(g.arenaCleared());const reward=g.state.player.scrap;g.update(.01);assert.equal(g.state.player.scrap,reward);assert.equal(w.loot.filter(i=>i.expeditionReward).length,1);const hp=w.enemies[0].maxHp;g.enterArea(area.links[0]);g.state.player.hp=55;g.state.player.level=12;g.enterArea(area.id);assert.notEqual(g.state.world,w);assert(g.state.world.enemies.some(e=>!e.dead));assert(g.state.world.enemies[0].maxHp>hp);assert.equal(g.state.player.hp,55);assert.deepEqual(g.state.cores,[0]);}
});
test('Gambling gives the selected slot, charges once and leaves equipment untouched',()=>{
 const g=trader(),p=g.state.player,equipment=copy(p.equipment),cost=g.gambleCost(),money=p.scrap;const uid=g.gambleLoot('boots');assert(uid);assert.equal(p.scrap,money-cost);assert.equal(p.inventory.length,1);assert.equal(p.inventory[0].slot,'boots');assert.deepEqual(p.equipment,equipment);assert.equal(g.state.world.shop.lastRoll.uid,uid);const restored=Engine.restore(g.serialize());restored.retry();assert.equal(restored.state.player.scrap,money-cost);assert(restored.state.player.inventory.some(i=>i.uid===uid));assert.equal(restored.rng(),g.rng());
});
test('Invalid, full or unaffordable gambles consume neither money nor random sequence',()=>{
 const g=trader(),p=g.state.player,check=slot=>{const cash=p.scrap,rng=g.rng.getState(),bag=p.inventory.length;assert(!g.gambleLoot(slot));assert.equal(p.scrap,cash);assert.equal(g.rng.getState(),rng);assert.equal(p.inventory.length,bag);};check('invalid');p.scrap=0;check('boots');p.scrap=1000;p.inventory=Array(48).fill(makeItem({rng:g.rng,slot:'boots'}));check('boots');p.inventory=[];g.enterArea('ring');check('boots');
});
test('The loot lottery uses exact forty/thirty-six/eighteen/five/one percent rarity intervals',()=>{
 for(const [roll,rarity]of [[0,'common'],[.3999,'common'],[.4,'uncommon'],[.7599,'uncommon'],[.76,'rare'],[.9399,'rare'],[.94,'epic'],[.9899,'epic'],[.99,'legendary'],[.9999,'legendary']]){const g=trader();let first=true;const original=g.rng;g.rng=()=>{if(first){first=false;return roll;}return original();};g.rng.getState=original.getState;assert(g.gambleLoot('weapon'));assert.equal(g.state.player.inventory[0].rarity,rarity);}
});
console.log(`\n${passed} survival and adventure checks passed.`);
