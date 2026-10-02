import assert from 'node:assert/strict';
import {Engine,copy,canStand,findPath,distance} from '../src/engine.js';
import {ENEMIES,START_EQUIPMENT,WORLD,AREAS} from '../src/data.js';
import {SAFE_HUBS} from '../src/hubs.js';
import {HUB_LAYOUTS} from '../src/hub-layouts.js';
import {makeItem,dropProfile,statsText} from '../src/loot.js';
import {effectForSlot,LEGENDARY_EFFECTS} from '../src/legendary.js';
import {NEW_ROLES,REGIONAL_BOSSES,updateBossPhase} from '../src/encounters.js';
import {updateNewThreats} from '../src/enemy-variety.js';
let n=0;const test=(name,fn)=>{fn();console.log('PASS '+name);n++;};
function arena(){const g=new Engine('tide',421);g.enterArea('ring');g.state.world.enemies=[];g.state.world.hazards=[];Object.assign(g.state.player,{x:850,y:640,invincible:0});g.state.player.stats.crit=-.07;return g;}
function equip(g,slot){const item=makeItem({rng:g.rng,rarity:'legendary',slot,level:1,uid:999});item.stats={};g.state.player.equipment[slot]=item;return item;}
function dummy(g,x=1100,y=640){const e=g.makeEnemy('raider',x,y);e.hp=e.maxHp=10000;e.cd=e.stun=99;g.state.world.enemies.push(e);return e;}
function walkWithKeys(g,target){
 const p=g.state.player,id=g.state.area;
 // Plan with extra body clearance. Reach each bend before turning instead of
 // cutting it early; input remains ordinary discrete eight-direction keys.
 const path=findPath(p,target,id,35).length?findPath(p,target,id,35):findPath(p,target,id,26);assert(path.length,id+' inaccessible walking route');
 for(const point of path){let frames=0;while(distance(p,point)>6&&frames++<2400){const a=Math.round(Math.atan2((point.y-p.y)/.78,point.x-p.x)/(Math.PI/4))*Math.PI/4;g.update(1/60,{x:Math.round(Math.cos(a)),y:Math.round(Math.sin(a))});}assert(frames<2400,id+' blocked keyboard approach');}
 assert(distance(p,target)<8);
}
test('Safe hubs have fixed distinct arena and generator doors that cannot bypass progression',()=>{const g=new Engine();const before=copy(g.state.world.portals);assert.equal(g.state.world.portals.filter(p=>!p.locked).length,1);const gate=g.state.world.portals.find(p=>p.to==='ring');Object.assign(g.state.player,gate);assert.equal(g.interaction().type,'lockedPortal');assert(!g.interact());g.state.storyPassed=['canal','delta'];g.syncStoryPortals();assert(!g.state.world.portals.find(p=>p.to==='ring').locked);assert.deepEqual(g.state.world.portals.map(({x,y,to})=>({x,y,to})),before.map(({x,y,to})=>({x,y,to})));});
test('All three merchants, fixed gates and exploration caches can be walked to in each hub',()=>{for(const id of SAFE_HUBS){const g=new Engine();g.state.cores=[0,1,2];g.enterArea(id);assert.equal(g.state.world.enemies.length,0);assert.equal(g.state.world.hazards.length,0);assert.equal(g.state.world.camp.services.length,3);for(const point of [...g.state.world.camp.services,...g.state.world.portals,...g.state.world.loot]){const p=g.state.player;assert(canStand(point.x,point.y,18,id));const path=findPath(p,point,id);assert(path.length,id+' inaccessible service');for(const step of path){let i=0;while(distance(p,step)>1&&i++<3000){const d=Math.hypot(step.x-p.x,step.y-p.y),r=Math.min(2,d);g.moveEntity(p,(step.x-p.x)/d*r,(step.y-p.y)/d*r);}assert(distance(p,step)<1.1);}}}});
test('Expanded hubs provide more walking room and gates occupy separate plazas instead of a row',()=>{
 const previous={canal:409,highway:461,forest:258,skybridge:424};
 for(const id of SAFE_HUBS){const g=new Engine();g.state.cores=[0,1,2,3];g.enterArea(id);let floor=0;
  for(let y=24;y<WORLD.height;y+=24)for(let x=24;x<WORLD.width;x+=24)if(canStand(x,y,18,id))floor++;
  assert(floor>previous[id]*1.15,id+' did not grow');const gates=g.state.world.portals;let spread=0;
  for(let i=0;i<gates.length;i++)for(let j=i+1;j<gates.length;j++){assert(distance(gates[i],gates[j])>310,'crowded gates');for(let k=j+1;k<gates.length;k++){const [a,b,c]=[gates[i],gates[j],gates[k]];spread=Math.max(spread,Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)));}}
  assert(spread>100000,id+' has a portal row');
  for(const gate of gates){assert(canStand(gate.x,gate.y,35,id));for(const service of g.state.world.camp.services)assert(distance(gate,service)>165,'gate crowds a merchant');for(const loot of g.state.world.loot)assert(distance(gate,loot)>115,'loot masks portal interaction');}
 }
});
test('Every distributed gate is reachable with ordinary keyboard movement and keeps its destination',()=>{
 for(const id of SAFE_HUBS)for(const [to,[x,y]]of Object.entries(HUB_LAYOUTS[id].portals)){
  const g=new Engine();g.state.cores=[0,1,2,3];g.state.visited=AREAS.map(a=>a.id);g.enterArea(id);walkWithKeys(g,{x,y});
  assert.equal(g.interaction().type,'portal');assert.equal(g.interaction().entity.to,to);assert(g.interact());assert.equal(g.state.area,to);
 }
});
test('All hub side vendors and both crates are reachable with ordinary eight-direction keyboard movement',()=>{
 for(const id of SAFE_HUBS){const fresh=new Engine();fresh.state.cores=[0,1,2,3];fresh.enterArea(id);const targets=[...fresh.state.world.camp.services,...fresh.state.world.loot];
 for(const target of targets){const g=new Engine();g.state.cores=[0,1,2,3];g.enterArea(id);walkWithKeys(g,target);assert.equal(g.interaction().type,target.service?'shop':'loot');assert(g.interact());assert.equal(g.state.pending.type,target.service?'shop':'loot');}}
});
test('Both painted quay stair entrances accept left, centre and right approaches without pathfinding',()=>{
 // Fixed S / S+D key presses across the actual painted stairs, including the
 // eastern stairhead formerly cut off by the rectangular end of the road.
 for(const [x,y]of [[1495,325],[1525,320],[1560,315],[1040,560],[1075,545],[1110,545]]){
  const g=new Engine(),p=g.state.player;Object.assign(p,{x,y,velocity:{x:0,y:0}});assert(canStand(x,y,18,'canal'),'painted stairhead is blocked');
  for(let i=0;i<60;i++){g.update(1/60,{x:i%5<2?1:0,y:1});assert(canStand(p.x,p.y,18,'canal'));}
  assert(p.y-y>125,'stair descent is blocked');assert(p.x-x>45&&p.x-x<85,'stair descent needs an exact approach');
  for(let i=0;i<60;i++)g.update(1/60,{x:i%5<2?-1:0,y:-1});
  assert(Math.hypot(p.x-x,p.y-y)<24,'stair ascent is blocked');
 }
});
test('Getijdenkade main promenade has generous player clearance and vendors are off the lane',()=>{
 const g=new Engine();for(let t=.05;t<1;t+=.05){const point={x:(.22+.56*t)*WORLD.width,y:(.62-.39*t)*WORLD.height};assert(canStand(point.x,point.y,36,'canal'));for(const service of g.state.world.camp.services)assert(distance(service,point)>160,'merchant in main promenade');}
});
test('Old quay saves relocate remaining crates and stranded players without restoring opened loot or changing purchases',()=>{
 const g=new Engine(),p=g.state.player,w=g.state.world,normal=w.loot.find(i=>!i.hiddenSupply);Object.assign(p,normal);assert(g.interact());g.recycleLoot();g.checkpoint();
 p.hp=37;p.mana=22;p.scrap=145;p.x=.620*WORLD.width;p.y=.450*WORLD.height;assert(!canStand(p.x,p.y,18,'canal'));
 const hidden=w.loot.find(i=>i.hiddenSupply);Object.assign(hidden,{x:.85*WORLD.width,y:.419*WORLD.height});delete w.quayLayoutVersion;
 w.shop.stock.splice(0,1);const stock=copy(w.shop.stock),ids=w.loot.map(i=>i.id);const restored=Engine.restore(g.serialize()),rp=restored.state.player,rw=restored.state.world;
 assert(canStand(rp.x,rp.y,18,'canal'));assert.equal(rp.hp,37);assert.equal(rp.mana,22);assert.equal(rp.scrap,145);assert.deepEqual(rw.shop.stock,stock);assert.deepEqual(rw.loot.map(i=>i.id),ids);assert.equal(rw.loot.length,1);assert.equal(rw.loot[0].x,HUB_LAYOUTS.canal.supply[0]);assert.equal(rw.camp.services[0].x,.142*WORLD.width);
 restored.enterArea('ring');restored.enterArea('canal');assert.equal(restored.state.world.loot.length,1);
});
test('Merchant stock is split by gear type and workshop does not sell duplicate gear',()=>{const g=new Engine();for(const m of g.state.world.camp.services){g.state.pending={type:'shop',service:m.id};const items=g.serviceStock();assert.equal(g.currentService().id,m.id);assert(items.every(i=>m.slots.includes(i.slot)));if(m.id==='workshop')assert.equal(items.length,0);else assert(items.length>0);}});
test('Hidden supply caches stay opened on revisits, reload and checkpoint retry',()=>{const g=new Engine(),w=g.state.world,item=w.loot.find(i=>i.hiddenSupply);Object.assign(g.state.player,item);assert(g.interact());assert.equal(g.state.pending.type,'loot');g.recycleLoot();g.checkpoint();g.enterArea('ring');g.enterArea('canal');assert(!w.loot.some(i=>i.hiddenSupply));const r=Engine.restore(g.serialize());assert(!r.state.world.loot.some(i=>i.hiddenSupply));r.retry();assert(!r.state.world.loot.some(i=>i.hiddenSupply));});
test('Each new enemy has two different attacks and each regional boss has three',()=>{for(const type of [...NEW_ROLES,...REGIONAL_BOSSES]){const g=arena(),e=g.makeEnemy(type,1100,640),seen=new Set();for(let i=0;i<(REGIONAL_BOSSES.includes(type)?3:2);i++){g.planAttack(e);seen.add(e.windup.mode);assert(e.windup.total>=.9);const target=copy(e.windup.target);g.state.player.x+=20;assert.deepEqual(e.windup.target,target);g.executeEnemyAttack(e);}assert.equal(seen.size,REGIONAL_BOSSES.includes(type)?3:2,type);assert(g.takeEvents().some(e=>e.type==='enemyattack'));}});
test('Burrowing locks its emergence point and can be avoided during its full warning',()=>{const g=arena(),e=g.makeEnemy('salamander',1000,640);g.state.world.enemies=[e];g.planAttack(e);g.executeEnemyAttack(e);e.windup=null;g.state.player.y=900;const hp=g.state.player.hp;g.update(.2);assert(e.hidden);g.update(.4);assert(!e.hidden);assert.equal(g.state.player.hp,hp);assert(distance(e,{x:850,y:640})<2);});
test('Shield front blocks damage while the back and attack windup expose the enemy',()=>{const g=arena(),e=g.makeEnemy('shieldguard',1000,640);e.angle=Math.PI;const hp=e.hp;g.hitEnemy(e,20,'physical');const blocked=hp-e.hp;e.angle=0;const next=e.hp;g.hitEnemy(e,20,'physical');assert(next-e.hp>blocked*1.8);e.angle=Math.PI;e.windup={mode:'shieldBash'};const open=e.hp;g.hitEnemy(e,20,'physical');assert.equal(open-e.hp,20);});
test('Boss phase two occurs once and all summoned enemies spawn on valid arena floor',()=>{for(const type of [...REGIONAL_BOSSES,'boss']){const g=arena(),e=g.makeEnemy(type,1610,800);g.state.world.enemies=[e];e.hp=e.maxHp*.4;updateBossPhase(g,e);assert.equal(e.phase,2);const adds=g.state.world.enemies.slice(1);assert.equal(adds.length,2);assert(adds.every(a=>canStand(a.x,a.y,a.radius,g.state.area)));updateBossPhase(g,e);assert.equal(g.state.world.enemies.length,3);}});
test('Nest summons are capped and give no gear, XP, scrap, health or kill charge to farm',()=>{const g=arena(),e=g.makeEnemy('stormnest',1000,640);g.state.world.enemies=[e];for(let i=0;i<6;i++){e.attacks=0;g.planAttack(e);g.executeEnemyAttack(e);}const adds=g.state.world.enemies.slice(1);assert.equal(adds.length,3);const p=g.state.player;p.hp=50;p.stats.leech=10;const before=[p.xp,p.scrap,p.hp,p.ultimate,g.state.kills];for(const a of adds)g.killEnemy(a);assert.deepEqual([p.xp,p.scrap,p.hp,p.ultimate,g.state.kills],before);assert.equal(g.state.world.loot.length,0);});
test('Boss loot is at least rare and eight major drops cannot all miss a legendary',()=>{const g=arena();g.rng=()=>.7;for(let i=0;i<8;i++){const e=g.makeEnemy('dredger',1000,640);g.killEnemy(e);}const loot=g.state.world.loot.map(i=>i.item);assert.equal(loot.length,8);assert(loot.every(i=>['rare','epic','legendary'].includes(i.rarity)));assert(loot.some(i=>i.rarity==='legendary'));});
test('Every equipment slot has a unique legendary effect that survives equip and reload',()=>{const g=arena();for(const slot of Object.keys(START_EQUIPMENT)){const item=makeItem({rng:g.rng,rarity:'legendary',slot,uid:++g.idCounter});assert.equal(item.effect,effectForSlot(slot));assert(statsText(item).includes(LEGENDARY_EFFECTS[item.effect].text));g.state.player.inventory.push(item);assert(g.equipItem(item.uid));}const r=Engine.restore(g.serialize());for(const slot of Object.keys(START_EQUIPMENT))assert.equal(r.state.player.equipment[slot].effect,effectForSlot(slot));});
test('Prism echo requires four paid casts and adds a weaker real piercing projectile',()=>{const g=arena();equip(g,'weapon');const mana=g.state.player.mana;for(let i=0;i<4;i++){g.state.player.spellCd.tide=0;assert(g.cast('tide'));}const extra=g.state.projectiles.filter(p=>p.legendary);assert.equal(extra.length,1);assert.equal(extra[0].type,'frost');assert(extra[0].damage<13);assert.equal(g.state.player.mana,mana-16);});
test('Dash ward absorbs a finite amount and respects a separate cooldown',()=>{const g=arena();equip(g,'suit');assert(g.dash(1,0));const p=g.state.player;p.invincible=0;g.hurtPlayer(25);assert.equal(p.hp,91);assert.equal(p.ward,0);p.dashTimer=0;g.dash(1,0);assert.equal(p.ward,0);});
test('Conductor jumps once to a nearby enemy and cannot recursively trigger itself',()=>{const g=arena();equip(g,'relic');const a=dummy(g),b=dummy(g,1150,660);g.hitEnemy(a,20,'storm');assert.equal(b.hp,9994);g.hitEnemy(a,20,'storm');assert.equal(b.hp,9994);});
test('Legendary dash wake slows normal enemies while bosses keep their movement',()=>{const g=arena();equip(g,'boots');const e=dummy(g,900,640),b=g.makeEnemy('dredger',900,640);g.state.world.enemies.push(b);g.dash(1,0);updateNewThreats(g,.1);assert(e.slow>0);assert.equal(b.slow||0,0);});
test('Cinder kills cause one small explosion and reserve mana cannot refill on every hit',()=>{const g=arena();equip(g,'gloves');const a=dummy(g),b=dummy(g,1120,660);a.burn=1;g.killEnemy(a);assert.equal(b.hp,9978);const c=dummy(g,1140,660);c.burn=1;g.killEnemy(c);assert.equal(b.hp,9978);equip(g,'belt');const p=g.state.player;p.mana=10;p.invincible=0;g.hurtPlayer(5);assert.equal(p.mana,22);p.invincible=0;g.hurtPlayer(5);assert.equal(p.mana,22);});
console.log(`\n${n} hub, boss, reward and legendary checks passed.`);
