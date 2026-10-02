import assert from 'node:assert/strict';
import {Engine,canStand,distance,copy,findPath,clearLine} from '../src/engine.js';
import {POSITIONS,EQUIPMENT,AREAS,WORLD} from '../src/data.js';
let passed=0;
const test=(name,run)=>{try{run();passed++;console.log('PASS '+name);}catch(error){console.error('FAIL '+name);throw error;}};
function quiet(seed=15){const g=new Engine('tide',seed);g.enterZone(0);g.state.world.enemies=[];g.state.world.hazards=[];g.state.player.invincible=0;g.state.player.stats.crit=-.07;return g;}
function advance(g,seconds,input={}){for(let t=0;t<seconds;t+=1/60)g.update(1/60,input);}
function target(g,type='raider',x=750,y=600){const e=g.makeEnemy(type,x,y);e.cd=99;g.state.world.enemies.push(e);return e;}
function handleLevel(g){if(g.state.pending?.type==='upgrade')g.chooseUpgrade(0);}

test('Every objective is reachable on the painted court; movement cannot leave it',()=>{
 const g=quiet();for(let zone=0;zone<4;zone++)for(const p of Object.values(POSITIONS))assert(canStand(p.x,p.y,18,zone),`Objective outside zone ${zone}`);advance(g,10,{x:-1});assert(canStand(g.state.player.x,g.state.player.y));assert(g.state.player.x>260);
});
test('Actual projectile collision, cooldown and insufficient mana',()=>{
 const g=quiet(),p=g.state.player;p.x=500;p.y=600;const e=target(g,'turret',750,600);g.aimAt(e.x,e.y);const mana=p.mana;assert(g.cast());assert.equal(p.mana,mana-4);assert(!g.cast());advance(g,.4);assert(e.hp<e.maxHp);assert(e.wet>0);p.attackCd=0;p.mana=3;assert(!g.cast());
});
test('Water → storm boosts damage and chains to a second enemy',()=>{
 const g=quiet(),a=target(g),b=target(g,'raider',850,600);a.hp=b.hp=500;a.maxHp=b.maxHp=500;g.hitEnemy(a,10,'tide');const before=a.hp;g.hitEnemy(a,20,'storm');assert.equal(before-a.hp,34);assert(b.hp<500);assert.equal(g.state.combos,1);assert(g.state.effects.some(e=>e.type==='chain'));
});
test('Water → sun consumes wet, stuns and creates area damage',()=>{
 const g=quiet(),a=target(g),b=target(g,'raider',810,600);a.hp=b.hp=500;g.hitEnemy(a,10,'tide');g.hitEnemy(a,20,'ember');assert.equal(a.wet,0);assert(a.stun>0&&a.burn>0);assert(b.hp<500);assert.equal(g.state.combos,1);
});
test('Boss cannot be permanently stunned by sustained storm bolts',()=>{
 const g=quiet(),e=target(g,'boss');e.wet=4;g.hitEnemy(e,1,'storm');assert(e.stun<.4);
});
test('Vertical dash stays vertical; it spends charges and prevents damage',()=>{
 const g=quiet(),p=g.state.player,x=p.x;p.aim={x:1,y:0};assert(g.dash(0,-1));g.hurtPlayer(30);assert.equal(p.hp,100);advance(g,.24);assert.equal(p.x,x);assert(p.y<POSITIONS.start.y);assert.equal(p.dashCharges,1);advance(g,3);assert.equal(p.dashCharges,2);
});
test('Beam warning locks its direction; moving out avoids the attack',()=>{
 const g=quiet(),p=g.state.player;p.x=700;p.y=650;const e=target(g,'turret',1000,650);g.planAttack(e);const dir=copy(e.windup.dir);p.y=480;g.executeEnemyAttack(e);assert.equal(p.hp,100);assert.deepEqual(e.windup.dir,dir);p.y=650;p.invincible=0;g.executeEnemyAttack(e);assert(p.hp<100);
});
test('Climate water wets enemies; poison deals periodic damage after leaving',()=>{
 const g=quiet(),p=g.state.player,e=target(g,'turret',p.x+30,p.y);g.state.world.hazards=[{x:p.x,y:p.y,r:90,type:'water'}];g.update(.1);assert(p.wet>0&&e.wet>0);g.state.world.hazards=[{x:p.x,y:p.y,r:90,type:'spore'}];advance(g,1.1);assert(p.hp<=96&&p.hp>=95);g.state.world.hazards=[];advance(g,1.1);assert(p.hp<=92);
});
test('A sun projectile clears spores even when there is no enemy to hit',()=>{
 const g=quiet(),p=g.state.player;p.x=550;p.y=600;g.state.world.hazards=[{x:700,y:580,r:60,type:'spore'}];g.selectSpell('ember');g.aimAt(700,600);g.cast();advance(g,1);assert(g.state.world.hazards[0].cleared);
});
test('Calibration waves spawn inside collision boundaries across 100 seeds',()=>{
 for(let seed=0;seed<100;seed++){const g=new Engine('tide',seed);g.state.cores=Array.from({length:seed%3},(_,i)=>i);assert(g.enterZone(seed%3));assert.equal(g.state.zone,seed%3);for(const r of g.state.world.relays){g.state.player.x=r.x;g.state.player.y=r.y;assert(g.interact());const spawned=g.state.world.enemies.filter(e=>e.relayId===r.id);assert(spawned.length>=3);assert(spawned.every(e=>canStand(e.x,e.y,e.radius,g.state.zone)));}}
});
test('Both calibrations and the guardian are required before travel',()=>{
 const g=quiet();for(const r of g.state.world.relays){g.state.player.x=r.x;g.state.player.y=r.y;g.interact();assert.equal(r.status,'defending');assert(!g.state.world.coreAvailable);for(let wave=0;wave<2;wave++){for(const e of g.state.world.enemies.filter(e=>e.relayId===r.id&&!e.dead))g.killEnemy(e);g.update(.01);handleLevel(g);}assert.equal(r.status,'online');}
 const guardian=g.state.world.enemies.find(e=>e.guardian);assert(guardian&&!guardian.dead);assert(!g.state.world.coreAvailable);g.killEnemy(guardian);g.update(.01);handleLevel(g);assert(g.state.world.coreAvailable);g.state.player.x=POSITIONS.exit.x;g.state.player.y=POSITIONS.exit.y;assert(g.interact());assert.equal(g.state.area,'canal');assert(g.inCamp());assert(g.state.cores.includes(0));assert(g.isUnlocked('highway'));assert(!g.isUnlocked('forest'));
});
test('Loot enters the bag; explicit equip swaps slots without farming scrap',()=>{
 const g=quiet();g.state.mode='modal';g.state.pending={type:'loot',item:{id:50},choices:[EQUIPMENT.find(i=>i.id==='tide-coat')]};g.state.player.hp=80;const uid=g.chooseLoot(0);assert.equal(g.stats().maxHp,100);assert.equal(g.state.player.inventory.length,1);assert(g.equipItem(uid));assert.equal(g.stats().maxHp,120);assert.equal(g.stats().waterproof,1);assert.equal(g.state.player.hp,96);assert.equal(g.state.player.scrap,0);assert.equal(g.state.player.inventory[0].id,'field-coat');assert.equal(g.state.mode,'playing');
});
test('Pending loot and random sequence survive save/reload',()=>{
 const g=quiet();g.state.world.loot.push({id:50,x:g.state.player.x,y:g.state.player.y});g.interact();const restored=Engine.restore(g.serialize());assert.equal(restored.state.pending.type,'loot');assert.deepEqual(restored.state.pending.choices,g.state.pending.choices);assert.equal(restored.rng(),g.rng());restored.chooseLoot(1);assert.equal(restored.state.mode,'playing');assert.equal(restored.state.world.loot.length,0);
});
test('Death retries the regional checkpoint, preserving earlier build choices',()=>{
 const g=quiet();g.state.player.stats.power=.25;g.state.cores=[0];assert(g.enterZone(1));g.state.player.stats.power=.9;g.state.player.invincible=0;g.hurtPlayer(999);assert.equal(g.state.mode,'dead');g.retry();assert.equal(g.state.zone,1);assert.equal(g.state.mode,'playing');assert.equal(g.state.player.stats.power,.25);assert.equal(g.state.player.hp,g.stats().maxHp);
});
test('Ultimate damage cannot recharge itself into an infinite loop',()=>{
 const g=quiet();g.state.player.x=900;g.state.player.y=650;for(let i=0;i<10;i++){const e=target(g,'raider',900+i*15,650);e.hp=500;}g.state.player.ultimate=100;assert(g.ultimate());assert.equal(g.state.player.ultimate,0);assert(!g.ultimate());
});
test('Boss phases summon adds and victory requires the console interaction',()=>{
 const g=new Engine('storm',304);g.state.cores=[0,1,2];g.enterZone(3);const boss=g.state.world.enemies.find(e=>e.type==='boss');boss.awake=true;boss.hp=boss.maxHp*.6;g.update(.01);assert.equal(boss.phase,2);const n=g.state.world.enemies.length;boss.hp=boss.maxHp*.3;g.update(.01);assert.equal(boss.phase,3);assert.equal(g.state.world.enemies.length,n+2);g.killEnemy(boss);assert.equal(g.arenaCleared(),false);for(const e of g.state.world.enemies.filter(e=>!e.dead))g.killEnemy(e);assert(g.state.world.coreAvailable);assert.equal(g.state.mode,'playing');g.state.player.x=POSITIONS.exit.x;g.state.player.y=POSITIONS.exit.y;g.interact();assert.equal(g.state.mode,'won');assert.equal(g.state.cores.length,4);assert(g.state.score>=1000);
});
test('All painted areas have reachable portals and side caches',()=>{
 for(const area of AREAS){const g=new Engine('tide',1);g.state.cores=[0,1,2,3];g.enterArea(area.id);const start=g.state.player;
  for(const point of [...g.state.world.portals,...g.state.world.loot]){assert(canStand(point.x,point.y,18,area.id),area.id+' marker floor');const path=findPath(start,point,area.id);assert(path.length,area.id+' reachable '+point.to);let previous=start;for(const step of path){assert(clearLine(previous,step,area.id),area.id+' continuous floor');previous=step;}}
  for(const e of g.state.world.enemies)assert(canStand(e.x,e.y,e.radius,area.id),area.id+' enemy spawn');
 }
});
test('Backtracking and save preserve defeated enemies, caches and calibrations without free healing',()=>{
 const g=new Engine('tide',20);g.enterArea('ring');const w=g.state.world;g.killEnemy(w.enemies[0]);w.loot=[];g.state.player.hp=72;g.enterArea('canal','ring');g.enterArea('ring','canal');assert.equal(g.state.world,w);assert(w.enemies[0].dead);assert.equal(w.loot.length,0);assert.equal(g.state.player.hp,72);const restored=Engine.restore(g.serialize());assert.equal(restored.state.area,'ring');assert(restored.state.areas.ring.enemies[0].dead);assert.equal(restored.state.world,restored.state.areas.ring);
});
test('Level-up gives a choice, unlocks a selected skill, and permits deferring points',()=>{
 const g=quiet(),p=g.state.player;p.xp=p.nextXp;g.update(.01);assert.equal(p.level,2);assert.equal(p.skillPoints,1);const i=g.state.pending.choices.findIndex(c=>c.id==='frost');assert(i>=0);assert(g.chooseUpgrade(i));assert(p.skills.includes('frost'));assert.equal(p.hotbar[3],'frost');assert.equal(p.skillPoints,0);assert(!g.purchaseUpgrade({id:'gravity',skill:true}));p.xp=p.nextXp;g.update(.01);g.deferUpgrade();assert.equal(p.skillPoints,1);const speed=g.stats().moveSpeed;assert(g.purchaseUpgrade({id:'move'}));assert(g.stats().moveSpeed>speed*1.11);assert.equal(p.perks.move,1);
});
test('Hotbar casts immediately, uses per-skill cooldowns and changes only the chosen slot',()=>{
 const g=quiet(),p=g.state.player;assert(g.castSlot(0,{x:900,y:650}));assert.equal(g.state.projectiles.length,3);assert(!g.castSlot(0));assert(g.castSlot(1));assert(g.state.effects.some(e=>e.type==='chain'));assert(!g.castSlot(5));assert(g.assignSkill('storm',0));assert.equal(p.hotbar[0],'storm');assert.equal(p.hotbar[1],'storm');assert(!g.assignSkill('gravity',4));
});
test('Each unlocked attack has distinct mechanics: piercing ice, returning wind and pulling core',()=>{
 const g=quiet(),p=g.state.player;p.skills.push('frost','gale','gravity');p.x=500;p.y=600;p.mana=100;const a=target(g,'turret',690,600),b=target(g,'turret',830,600);a.hp=b.hp=500;a.wet=4;g.aimAt(1100,600);assert(g.cast('frost'));advance(g,.4);assert(a.hp<500&&b.hp<500);assert(a.slow>0);g.state.projectiles=[];p.mana=100;g.aimAt(1000,600);g.cast('gale');advance(g,.7);assert(g.state.projectiles.some(b=>b.type==='gale'&&b.returning));g.state.projectiles=[];p.mana=100;g.aimAt(900,600);g.cast('gravity');const e=target(g,'raider',720,650),before=e.x;e.stun=3;advance(g,.5);assert(e.x<before);advance(g,1.2);assert(g.state.effects.some(e=>e.type==='nova'));
});
test('Aurelia is locked until all three cores; future chapters cannot bypass the story',()=>{
 const g=new Engine();assert(!g.enterArea('skybridge'));assert(!g.enterArea('aurelia'));assert.equal(g.state.area,'canal');assert(!g.selectDestination('vault'));assert.deepEqual(g.routeTo(),['canal','delta']);g.state.cores=[0,1,2];assert(g.enterArea('aurelia','skybridge'));assert.equal(g.state.zone,3);
});
test('Legacy v3 saves migrate gear and grant retrospective skill choices',()=>{
 const g=quiet(),p=g.state.player;p.level=4;const s=copy(g.state);s.version=3;delete s.area;delete s.areas;delete s.visited;delete p.skillPoints;const migrated=Engine.restore(JSON.stringify({state:s,idCounter:500,rngState:99}));assert.equal(migrated.state.version,5);assert.equal(migrated.state.area,'ring');assert.equal(migrated.state.player.skillPoints,3);assert.equal(migrated.state.player.hotbar.length,6);assert(migrated.state.world.portals.length);
});
console.log(`\n${passed} engine checks passed.`);
