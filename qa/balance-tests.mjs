import assert from 'node:assert/strict';
import {Engine,copy,findPath,distance,canStand,seeded} from '../src/engine.js';
import {AREAS,POSITIONS,SPELLS} from '../src/data.js';
import {scaleEnemy} from '../src/balance.js';
import {makeItem,sellValue} from '../src/loot.js';
import {visibleSellItems} from '../src/shop-ui.js';
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function arena(){const g=new Engine('tide',83);g.enterArea('ring');g.state.world.enemies=[];g.state.world.hazards=[];Object.assign(g.state.player,{x:850,y:640});g.state.player.stats.crit=-.07;return g;}
function dummy(g,x=1000,y=640){const e=g.makeEnemy('raider',x,y);e.hp=e.maxHp=10000;e.stun=e.cd=99;g.state.world.enemies.push(e);return e;}
function field(g,id){g.state.player.skills.push(id);g.state.player.mana=110;assert(g.cast(id,{x:1000,y:640}));return g.state.fields.at(-1);}

test('Every learned attack can independently occupy left, right and any number slot',()=>{
 const g=arena(),p=g.state.player;p.skills=Object.keys(SPELLS);
 for(const id of p.skills){const before=copy(p.hotbar);assert(g.setMainAttack(id));assert(g.assignRight(id));assert.deepEqual(p.hotbar,before);for(let i=0;i<6;i++){const others=copy(p.hotbar);assert(g.assignSkill(id,i));assert.equal(p.mainAttack,id);assert.equal(p.rightAbility,id);others[i]=id;assert.deepEqual(p.hotbar,others);}}
 assert(!g.assignSkill('unknown',0));assert(!g.assignSkill('tide',6));assert(!g.assignSkill('tide',.5));assert(g.clearSkillSlot(4));assert.equal(p.hotbar[4],null);assert(!g.clearSkillSlot(-1));const restored=Engine.restore(g.serialize());assert.equal(restored.state.player.mainAttack,'orbital');assert.equal(restored.state.player.rightAbility,'orbital');assert.deepEqual(restored.state.player.hotbar,p.hotbar);
});
test('Duplicated bindings share cooldowns and never change the selected main attack',()=>{
 const g=arena(),p=g.state.player;g.assignRight('ember');g.assignSkill('ember',5);assert(g.castRight({x:1100,y:640}));const mana=p.mana;assert(!g.castSlot(5));assert.equal(p.mana,mana);assert.equal(p.mainAttack,'tide');assert(g.cast());assert.equal(p.rightAbility,'ember');
});
test('Enemy snapshots scale health, damage and attack pace by region and player level',()=>{
 const g=arena(),early=g.makeEnemy('raider',1000,640);g.state.player.level=9;const late=g.makeEnemy('raider',1000,640);g.state.zone=3;const regional=g.makeEnemy('raider',1000,640);assert(late.maxHp>early.maxHp*1.5);assert(regional.maxHp>late.maxHp);assert(regional.damageMultiplier>early.damageMultiplier);assert(regional.cooldownMultiplier<early.cooldownMultiplier);assert(regional.speedMultiplier>early.speedMultiplier);
 const hp=late.maxHp;late.hp*=.3;scaleEnemy(late,3,20);assert.equal(late.maxHp,hp);assert.equal(late.hp,hp*.3);
});
test('Older saved enemies retain wounds and deaths while migrating only once',()=>{
 const g=arena(),w=g.state.world,e=dummy(g),dead=dummy(g);e.hp=e.maxHp*.25;delete e.balanceVersion;dead.dead=true;dead.hp=0;delete dead.balanceVersion;g.checkpoint();const restored=Engine.restore(g.serialize()),live=restored.state.world.enemies[0];assert.equal(live.hp/live.maxHp,.25);assert.equal(restored.state.world.enemies[1].hp,0);assert.equal(restored.state.checkpoint.areas.ring.enemies[0].hp/restored.state.checkpoint.areas.ring.enemies[0].maxHp,.25);const again=Engine.restore(restored.serialize());assert.equal(again.state.world.enemies[0].maxHp,live.maxHp);assert.equal(again.state.world.enemies[0].hp,live.hp);
});
test('All transit caches can actually be walked to, including the quay terrace',()=>{
 for(const area of AREAS.filter(a=>a.kind==='route')){const g=new Engine();g.state.cores=[0,1,2];g.enterArea(area.id);const p=g.state.player,cache=g.state.world.loot.find(i=>!i.item),path=findPath(p,cache,area.id);assert(path.length);assert(canStand(cache.x,cache.y,35,area.id));for(const point of path){let moves=0;while(distance(p,point)>2&&moves++<1500){const d=Math.hypot(point.x-p.x,point.y-p.y),step=Math.min(2,d);g.moveEntity(p,(point.x-p.x)/d*step,(point.y-p.y)/d*step);}assert(distance(p,point)<=2,area.id+' blocked walk');}
  if(cache.guarded){assert.equal(g.interaction().type,'guardedLoot');assert(!g.interact());g.killEnemy(g.state.world.enemies.find(e=>e.cacheGuard));}
  assert.equal(g.interaction().type,'loot');assert(g.interact());assert.equal(g.state.pending.type,'loot');
 }
});
test('Moving old transit caches preserves opened caches and already rolled ground items',()=>{
 const g=new Engine(),item=makeItem({rng:g.rng,uid:999}),w=g.state.world;w.loot[0].x=50;w.loot[0].y=50;w.loot.push({id:998,x:800,y:600,item});const restored=Engine.restore(g.serialize());assert.equal(restored.state.world.loot[0].x,restored.routeCachePosition(AREAS[0]).x);assert.deepEqual(restored.state.world.loot[1],w.loot[1]);g.state.world.loot=[];assert.equal(Engine.restore(g.serialize()).state.world.loot.length,0);
});
test('Six story expeditions require both groups, reward once and return without a main core',()=>{
 for(const area of AREAS.filter(a=>a.side&&!a.optional)){const g=new Engine();g.state.cores=Array.from({length:area.zone},(_,i)=>i);assert(g.enterArea(area.id));const w=g.state.world;assert(w.enemies.every(e=>canStand(e.x,e.y,e.radius,area.id)));g.state.player.x=POSITIONS.exit.x;g.state.player.y=POSITIONS.exit.y;assert.equal(g.interaction(),null);
  for(const e of w.enemies.filter(e=>!e.dead))g.killEnemy(e);g.state.player.xp=0;g.update(.01);assert.equal(w.sideRound,2);assert(!g.arenaCleared());assert.equal(g.interaction(),null);assert(w.enemies.some(e=>e.guardian&&!e.dead));
  for(const e of w.enemies.filter(e=>!e.dead))g.killEnemy(e);g.state.player.xp=0;g.update(.01);assert(g.arenaCleared());assert.equal(w.loot.filter(i=>i.expeditionReward).length,1);g.update(.01);assert.equal(w.loot.filter(i=>i.expeditionReward).length,1);const cores=copy(g.state.cores);assert.equal(g.interaction().type,'portal');assert(g.interact());assert.equal(g.state.area,area.links[0]);assert.deepEqual(g.state.cores,cores);g.enterArea(area.id);assert(g.arenaCleared());assert(!w.enemies.some(e=>!e.dead));
 }
});
test('Actual normal-enemy kills produce sparse drops; crowded ground suppresses extras',()=>{
 const g=arena();let drops=0;for(let i=0;i<1000;i++){g.state.world.loot=[];g.killEnemy(g.makeEnemy('crawler',1000,640));drops+=g.state.world.loot.filter(i=>i.item).length;}assert(drops>=45&&drops<=115,'Crawler rate '+drops/10+'%');
 g.state.world.loot=Array.from({length:7},(_,i)=>({id:i,item:makeItem({rng:seeded(i),uid:i})}));for(let i=0;i<100;i++)g.killEnemy(g.makeEnemy('siege',1000,640));assert.equal(g.state.world.loot.length,7);const guardian=g.makeEnemy('sentinel',1000,640,true);guardian.guardian=true;g.killEnemy(guardian);assert.equal(g.state.world.loot.length,8);
});
test('Ice barrier hits a narrow crosswise strip rather than a circular field',()=>{
 const g=arena(),a=dummy(g),b=dummy(g,1000,710),outside=dummy(g,1130,640);b.wet=2;field(g,'glacier');g.updateFields(.01);assert(a.hp<10000&&b.hp<10000);assert(b.stun>0);assert.equal(outside.hp,10000);assert(a.slow>0);
});
test('Cyclone travels and pulls only enemies within its small moving footprint',()=>{
 const g=arena(),near=dummy(g,1080,650),outside=dummy(g,1000,810),f=field(g,'cyclone'),x=f.x,enemyX=near.x;g.updateFields(.2);assert(f.x>x);assert(near.x<enemyX);assert(near.hp<10000);assert.equal(outside.hp,10000);
});
test('Storm cloud picks three individual targets per salvo and rotates through a group',()=>{
 const g=arena(),enemies=Array.from({length:6},(_,i)=>dummy(g,940+i*24,650));field(g,'tempest');g.updateFields(.01);assert.equal(enemies.filter(e=>e.hp<10000).length,3);assert.equal(g.state.effects.filter(e=>e.type==='storm-bolt').length,3);g.updateFields(.75);assert(enemies.every(e=>e.hp<10000));
});
test('Orbital has three distinct delayed crater footprints and can miss between them',()=>{
 const g=arena(),f=field(g,'orbital'),targets=f.strikes.map(point=>dummy(g,point.x,point.y)),outside=dummy(g,860,640);g.updateFields(.4);assert(targets.every(e=>e.hp===10000));g.updateFields(.21);assert(targets[0].hp<10000);assert.equal(targets[1].hp,10000);g.updateFields(.75);assert(targets[1].hp<10000);assert.equal(targets[2].hp,10000);g.updateFields(.75);assert(targets[2].hp<10000);assert.equal(outside.hp,10000);assert.equal(g.state.effects.filter(e=>e.type==='orbital-strike').length,3);
});
test('Ultimate needs charge and forty seconds between uses, including after reload and travel',()=>{
 const g=arena(),p=g.state.player;p.ultimate=100;assert(g.ultimate());assert.equal(p.ultimateCooldown,40);g.updateFields(.6);assert.equal(p.ultimate,0);p.ultimate=100;assert(!g.ultimate());const restored=Engine.restore(g.serialize());assert.equal(restored.state.player.ultimateCooldown,40);restored.enterArea('delta');assert(!restored.ultimate());g.update(39);assert(!g.ultimate());g.update(1.01);assert(g.ultimate());
});
test('Ultimate charge is halved and uses actual damage rather than overkill',()=>{
 const g=arena(),e=dummy(g);g.hitEnemy(e,100,'physical');assert.equal(g.state.player.ultimate,3.25);g.state.player.ultimate=0;e.hp=10;g.hitEnemy(e,10000,'physical');assert(Math.abs(g.state.player.ultimate-2.325)<.001);
});
test('Walking eases in, brakes promptly and keeps diagonal speed normalized',()=>{
 const g=arena(),p=g.state.player,speed=g.stats().moveSpeed,x=p.x;g.update(1/60,{x:1});assert(p.x>x&&p.x-x<speed/60);assert(p.velocity.x>0&&p.velocity.x<speed*.4);for(let i=0;i<30;i++)g.update(1/60,{x:1});assert(p.velocity.x>speed*.99);const at=p.x;for(let i=0;i<35;i++)g.update(1/60);assert(p.x-at<20);assert.equal(p.velocity.x,0);assert(!p.moving);
 for(let i=0;i<35;i++)g.update(1/60,{x:1,y:1});assert(Math.abs(Math.hypot(p.velocity.x,p.velocity.y/.78)-speed)<.1);g.enterArea('canal');assert.deepEqual(p.velocity,{x:0,y:0});
});
test('Walking direction and leg pose are independent of aim and casting',()=>{
 const g=arena(),p=g.state.player;for(let i=0;i<12;i++)g.update(1/60,{x:-1,y:-1,shoot:true,aim:{x:1400,y:950}});assert(p.moving);assert.equal(p.facing,-1);assert.equal(p.lookUp,true);assert(p.aim.x>0&&p.aim.y>0);g.assignRight('ember');p.mana=110;g.castRight({x:1400,y:950});assert.equal(p.facing,-1);assert.equal(p.lookUp,true);
});
test('Walking response remains consistent across different frame rates',()=>{
 const a=arena(),b=arena();for(let i=0;i<60;i++)a.update(1/60,{x:1});for(let i=0;i<120;i++)b.update(1/120,{x:1});assert(Math.abs(a.state.player.x-b.state.player.x)<1.2);assert(Math.abs(a.state.player.velocity.x-b.state.player.velocity.x)<.01);
});
test('Crawler, shield and sniper alternate distinct attack shapes with locked aiming',()=>{
 for(const [type,first,second]of [['crawler','bite','charge'],['sentinel','slam','shockwave'],['sniper','snipe','crossfire']]){const g=arena(),e=g.makeEnemy(type,950,640);g.planAttack(e);assert.equal(e.windup.mode,first);g.planAttack(e);assert.equal(e.windup.mode,second);const dir=copy(e.windup.dir);g.state.player.y=800;assert.deepEqual(e.windup.dir,dir);g.executeEnemyAttack(e);if(type==='crawler'){assert(e.rush);g.state.world.enemies.push(e);for(let i=0;i<30;i++)g.updateEnemies(1/60);assert(canStand(e.x,e.y,e.radius,g.state.area));}if(type==='sentinel')assert(g.state.effects.some(e=>e.type==='tank-wave'));if(type==='sniper'){assert.equal(g.state.projectiles.length,3);assert(g.state.projectiles.every(b=>Math.hypot(b.vx,b.vy*1.15)>500));}}
});
test('Shield shockwave hits the moving rim once, leaving the centre safe',()=>{
 const g=arena(),p=g.state.player,e=g.makeEnemy('sentinel',850,640);g.planAttack(e);g.planAttack(e);g.executeEnemyAttack(e);p.invincible=0;g.update(.2);assert.equal(p.hp,100);p.x=1000;g.update(.2);assert(p.hp<100);const hp=p.hp;g.update(.1);assert.equal(p.hp,hp);
});
test('Bulk sales pay each selected item once and persist across save and retry',()=>{
 const g=new Engine(),p=g.state.player;const items=['common','uncommon','rare'].map((rarity,i)=>makeItem({rng:g.rng,uid:700+i,rarity}));p.inventory.push(...items);const cash=p.scrap,value=sellValue(items[0])+sellValue(items[1]),gear=copy(p.equipment);assert.deepEqual(g.sellItems([700,701,700]),{count:2,total:value});assert.equal(p.scrap,cash+value);assert.deepEqual(p.inventory.map(i=>i.uid),[702]);assert.deepEqual(p.equipment,gear);const restored=Engine.restore(g.serialize());restored.retry();assert.equal(restored.state.player.scrap,p.scrap);assert.deepEqual(restored.state.player.inventory.map(i=>i.uid),[702]);assert(!restored.sellItems([700,701]));
});
test('Bulk sales are atomic when a selected item is missing, worn or outside camp',()=>{
 const g=new Engine(),p=g.state.player,item=makeItem({rng:g.rng,uid:700});p.inventory.push(item);const state=copy(p);assert(!g.sellItems([700,999]));assert(!g.sellItems([700,p.equipment.boots.uid]));assert(!g.sellItems([]));assert(!g.sellItems(['700']));assert.deepEqual(p,state);g.enterArea('ring');const cash=p.scrap;assert(!g.sellItems([700]));assert.equal(p.scrap,cash);assert(p.inventory.some(i=>i.uid===700));
});
test('Sell filters narrow by gear type and rarity with low-quality items sorted first',()=>{
 const g=new Engine(),p=g.state.player;p.inventory=[makeItem({rng:g.rng,uid:701,slot:'boots',rarity:'rare'}),makeItem({rng:g.rng,uid:702,slot:'weapon',rarity:'common'}),makeItem({rng:g.rng,uid:703,slot:'boots',rarity:'common'})];assert.deepEqual(visibleSellItems(p,{slot:'boots',rarity:'common'}).map(i=>i.uid),[703]);assert.equal(visibleSellItems(p,{slot:'all',rarity:'rare'}).length,1);const all=visibleSellItems(p,{slot:'all',rarity:'all'});assert.equal(all.at(-1).rarity,'rare');assert.equal(p.inventory[0].uid,701);
});
console.log(`\n${passed} balance and controls checks passed.`);
