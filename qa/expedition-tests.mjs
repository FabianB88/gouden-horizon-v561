import assert from 'node:assert/strict';
import {Engine,copy,seeded,canStand} from '../src/engine.js';
import {AREAS,POSITIONS,RARITIES} from '../src/data.js';
import {makeItem,sellValue,DROP_TABLES} from '../src/loot.js';
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function arena(){const g=new Engine('tide',31);g.enterArea('ring');g.state.world.enemies=[];g.state.world.hazards=[];g.state.player.x=850;g.state.player.y=640;g.state.player.stats.crit=-.07;return g;}
function step(g,seconds){for(let t=0;t<seconds;t+=1/60){g.update(1/60);if(g.state.pending?.type==='upgrade')g.deferUpgrade();}}
function dummy(g,type='raider',x=1000,y=640){const e=g.makeEnemy(type,x,y);e.hp=e.maxHp=10000;e.cd=99;e.stun=99;g.state.world.enemies.push(e);return e;}

test('Safe arrival prevents damage, casts and enemy invasion in every transit camp',()=>{
 for(const a of AREAS.filter(a=>a.kind==='route')){const g=new Engine();g.state.cores=[0,1,2];g.enterArea(a.id);const p=g.state.player,c=g.state.world.camp;assert(g.inCamp());assert(canStand(p.x,p.y,18,a.id));const hp=p.hp;p.invincible=0;g.hurtPlayer(999);assert.equal(p.hp,hp);assert(!g.cast());assert(!g.castRight());p.ultimate=100;assert(!g.ultimate());assert.equal(p.ultimate,100);const e=g.makeEnemy('crawler',c.x+c.radius+60,c.y);const before={x:e.x,y:e.y};g.moveEntity(e,-200,0);assert.equal(e.x,before.x);assert.equal(e.y,before.y);}
});
test('Live arenas have no usable return portal, including after killing only the guardian',()=>{
 const g=arena(),w=g.state.world;w.relays.forEach(r=>r.status='online');w.gate.eliteSpawned=true;const guardian=dummy(g,'turret',900,640);guardian.guardian=true;const last=dummy(g,'crawler',1100,640);g.killEnemy(guardian);g.state.player.x=POSITIONS.exit.x;g.state.player.y=POSITIONS.exit.y;assert(!g.arenaCleared());assert.equal(g.interaction(),null);g.killEnemy(last);assert(g.arenaCleared());assert.equal(g.interaction().type,'travel');assert(g.interact());assert.equal(g.state.area,'canal');assert(g.inCamp());assert(g.isUnlocked('rooftops'));assert(g.isUnlocked('highway'));assert(!g.isUnlocked('forest'));assert(g.enterArea('ring'));assert(g.arenaCleared());assert.equal(g.state.world.enemies.filter(e=>!e.dead).length,0);
});
test('Each core unlocks the next region, old areas stay accessible, visits preserve HP',()=>{
 const g=new Engine();assert(!g.enterArea('rooftops'));assert(!g.enterArea('forest'));g.state.cores=[0];assert(g.enterArea('highway'));assert(!g.enterArea('vault'));g.state.cores.push(1);assert(g.enterArea('vault'));assert(!g.enterArea('aurelia'));g.state.cores.push(2);assert(g.enterArea('aurelia'));g.state.player.hp=54;assert(g.enterArea('canal'));assert.equal(g.state.player.hp,54);assert(g.enterArea('ring'));assert.equal(g.state.player.hp,54);
});
test('Buying validates funds and capacity; sold stock stays gone across reload and retry',()=>{
 const g=new Engine('tide',19),p=g.state.player,item=g.state.world.shop.stock[0];const stock=copy(g.state.world.shop.stock);assert(!g.buyItem(item.uid));assert.deepEqual(g.state.world.shop.stock,stock);p.scrap=200;const money=p.scrap;assert.equal(g.buyItem(item.uid),item.uid);assert.equal(p.scrap,money-item.price);assert(!g.buyItem(item.uid));assert.equal(p.inventory.length,1);assert.notEqual(p.equipment[item.slot].uid,item.uid);const restored=Engine.restore(g.serialize());assert(!restored.state.world.shop.stock.some(i=>i.uid===item.uid));restored.retry();assert(!restored.state.world.shop.stock.some(i=>i.uid===item.uid));assert(restored.state.player.inventory.some(i=>i.uid===item.uid));g.state.player.inventory=Array.from({length:48},(_,i)=>makeItem({rng:g.rng,uid:10000+i}));assert(!g.buyItem(g.state.world.shop.stock[0].uid));
});
test('Selling is explicit, pays once, cannot sell worn gear or operate outside camp',()=>{
 const g=new Engine(),p=g.state.player;p.scrap=200;const item=g.state.world.shop.stock[3];g.buyItem(item.uid);const cash=p.scrap;assert(g.sellItem(item.uid));assert.equal(p.scrap,cash+sellValue(item));assert(!g.sellItem(item.uid));assert(!g.sellItem(p.equipment.weapon.uid));g.enterArea('ring');assert(!g.buySupply());assert(!g.reinforce('boots'));assert(!g.sellItem(0));
});
test('Forge preserves health and mana fractions, increases speed, caps enhancement at three',()=>{
 const g=new Engine(),p=g.state.player;p.scrap=1000;p.hp=g.stats().maxHp*.4;p.mana=g.stats().maxMana*.5;const speed=g.stats().moveSpeed;assert(g.reinforce('suit'));assert.equal(p.hp/g.stats().maxHp,.4);assert(g.reinforce('relic'));assert.equal(p.mana/g.stats().maxMana,.5);for(let i=0;i<3;i++)assert(g.reinforce('boots'));assert(g.stats().moveSpeed>speed*1.13);const money=p.scrap;assert(!g.reinforce('boots'));assert.equal(p.scrap,money);const restored=Engine.restore(g.serialize());assert.equal(restored.state.player.equipment.boots.enhance,3);assert.equal(restored.stats().moveSpeed,g.stats().moveSpeed);
});
test('Supply purchases have a price and an eight-charge cap',()=>{
 const g=new Engine(),p=g.state.player;assert(!g.buySupply());p.scrap=100;for(let i=0;i<5;i++)assert(g.buySupply());assert.equal(p.potions,8);assert.equal(p.scrap,25);assert(!g.buySupply());assert.equal(p.scrap,25);
});
test('Enemy loot profiles produce stronger loot and distinct favored equipment',()=>{
 const ranks={};for(const profile of ['crawler','sniper','siege','guardian','boss']){const rng=seeded(119);ranks[profile]=0;const slots={};for(let i=0;i<1500;i++){const item=makeItem({rng,profile,uid:i});ranks[profile]+=RARITIES[item.rarity].rank;slots[item.slot]=(slots[item.slot]||0)+1;}ranks[profile]/=1500;if(profile==='crawler')assert((slots.boots+slots.belt+slots.weapon)/1500>.80);if(profile==='guardian')assert(ranks[profile]>=2);}assert(ranks.crawler<ranks.sniper);assert(ranks.sniper<ranks.siege);assert(ranks.siege<ranks.boss);assert(DROP_TABLES.crawler.chance<DROP_TABLES.siege.chance);
});
test('Level and rarity scale real stats; randomized affixes vary within a gear type',()=>{
 const common=makeItem({rng:seeded(1),slot:'weapon',rarity:'common',level:1}),legend=makeItem({rng:seeded(1),slot:'weapon',rarity:'legendary',level:7});assert(legend.stats.power>common.stats.power);assert.equal(common.affixes.length,0);assert.equal(legend.affixes.length,2);assert.equal(legend.requiredLevel,5);const rng=seeded(20),names=new Set(Array.from({length:50},()=>makeItem({rng,slot:'boots',rarity:'rare'}).name));assert(names.size>3);
});
test('Ground loot uses its rolled item and capacity limit; equipping is a separate action',()=>{
 const g=arena(),p=g.state.player,item=makeItem({rng:g.rng,slot:'boots',rarity:'rare',uid:++g.idCounter}),drop={id:++g.idCounter,x:p.x,y:p.y,item};g.state.world.loot=[drop];assert.equal(g.interact(),item.uid);assert(p.inventory.some(i=>i.uid===item.uid));assert.notEqual(p.equipment.boots.uid,item.uid);assert.equal(g.state.world.loot.length,0);assert(g.equipItem(item.uid));assert.equal(p.equipment.boots.uid,item.uid);p.inventory=Array(48).fill(item);g.state.world.loot=[drop];assert(!g.collectDrop(drop));assert.equal(g.state.world.loot.length,1);
});
test('Number slots and assigned right cast independently of the fixed main attack',()=>{
 const g=arena(),p=g.state.player;p.skills.push('frost','glacier');g.assignSkill('frost',3);g.assignRight('glacier');assert(g.castSlot(3,{x:1100,y:640}));assert.equal(p.mainAttack,'tide');assert.equal(p.spell,'tide');assert(g.castRight({x:1100,y:640}));assert.equal(g.state.fields[0].type,'glacier');assert(g.cast());assert(g.state.projectiles.some(b=>b.type==='tide'));assert.equal(p.mainAttack,'tide');assert(g.setMainAttack('frost'));assert(!g.setMainAttack('orbital'));
});
test('Late area spells lock by level and produce frost, pull, storm and timed orbital impacts',()=>{
 const g=arena(),p=g.state.player;p.skillPoints=10;assert(!g.purchaseUpgrade({id:'orbital',skill:true}));p.level=6;for(const id of ['glacier','cyclone','tempest','orbital'])assert(g.purchaseUpgrade({id,skill:true}));
 const a=dummy(g,'raider',1000,640),b=dummy(g,'raider',1000,700);assert(g.cast('glacier',{x:1000,y:640}));step(g,.6);assert(a.hp<10000&&b.hp<10000&&a.slow>0);g.state.fields=[];p.mana=110;b.x=1080;b.y=650;const before=b.x;assert(g.cast('cyclone',{x:1000,y:640}));step(g,.2);assert(b.x<before);g.state.fields=[];p.mana=110;assert(g.cast('tempest',{x:1000,y:640}));step(g,.1);assert(g.state.effects.some(e=>e.ability==='tempest'));g.state.fields=[];g.state.effects=[];p.mana=110;assert(g.cast('orbital',{x:1000,y:640}));const hp=a.hp;step(g,.4);assert.equal(a.hp,hp);step(g,.3);assert(a.hp<hp);const strikes=g.state.effects.filter(e=>e.type==='orbital-strike').length;assert(strikes);step(g,2);assert.equal(g.state.fields.length,0);
});
test('Ultimate has a visible charge, delayed multi-target impact and no self recharge',()=>{
 const g=arena(),p=g.state.player,a=dummy(g),b=dummy(g,'sentinel',1120,640);p.ultimate=100;assert(g.ultimate());assert(g.state.effects.some(e=>e.type==='ultimate-charge'));assert.equal(a.hp,10000);step(g,.3);assert.equal(a.hp,10000);step(g,.3);assert(a.hp<10000&&b.hp<10000);assert(g.state.effects.some(e=>e.type==='ultimate-wave'));assert.equal(p.ultimate,0);assert.equal(g.state.ultimateWave,null);
});
test('Six new enemy families execute distinct readable attacks',()=>{
 const modes=[];for(const type of ['crawler','sniper','sentinel','sporecaster','stormling','siege']){const g=arena(),e=g.makeEnemy(type,900,640);g.state.world.enemies=[e];g.state.player.invincible=0;g.planAttack(e);modes.push(e.windup.mode);assert(e.windup.total>=.4);g.executeEnemyAttack(e);assert(g.takeEvents().some(e=>e.type==='enemyattack'));if(type==='sporecaster'){assert.equal(g.state.world.hazards.length,0);assert.equal(g.state.projectiles.filter(b=>b.type==='enemy-lob').length,3);for(let i=0;i<50;i++)g.updateProjectiles(1/60);assert.equal(g.state.world.hazards.filter(h=>h.type==='spore').length,3);}if(type==='stormling')assert.equal(g.state.projectiles.filter(b=>b.team==='enemy').length,6);}assert.equal(new Set(modes).size,6);
});
test('V4 saves retain equipment, wallet, visited areas and checkpoint while gaining new slots',()=>{
 const g=new Engine('storm',12),s=copy(g.state);s.version=4;s.player.scrap=91;s.player.level=4;s.player.spell='frost';delete s.player.mainAttack;delete s.player.rightAbility;for(const slot of ['boots','gloves','belt']){delete s.player.equipment[slot];delete s.checkpoint.player.equipment[slot];}delete s.world.shop;delete s.areas.canal.shop;const restored=Engine.restore(JSON.stringify({state:s,idCounter:600,rngState:99}));assert.equal(restored.state.version,5);assert.equal(restored.state.player.scrap,91);assert.equal(restored.state.player.equipment.weapon.id,s.player.equipment.weapon.id);assert.equal(restored.state.player.mainAttack,'storm');assert.equal(restored.state.player.rightAbility,'ember');assert.equal(Object.keys(restored.state.player.equipment).length,6);assert.equal(Object.keys(restored.state.checkpoint.player.equipment).length,6);assert.equal(restored.state.world.shop.stock.length,8);assert.deepEqual(restored.state.visited,s.visited);
});
console.log(`\n${passed} expedition checks passed.`);
