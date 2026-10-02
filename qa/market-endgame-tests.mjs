import assert from 'node:assert/strict';
import {Engine,copy,canStand,findPath,distance,clearLine} from '../src/engine.js';
import {AREAS,WORLD,SPELLS} from '../src/data.js';
import {TRIALS,TRIAL_TIERS,trialTime,recordText} from '../src/endgame.js';
import {MARKET_REGIONS} from '../src/markets.js';
import {DROP_TABLES,makeItem} from '../src/loot.js';
let n=0;function test(name,run){run();n++;console.log('PASS '+name);}
function trader(id='forest'){const g=new Engine('tide',74);g.state.cores=[0,1,2,3];g.enterArea(id);const m=g.hubMerchants().find(m=>m.id==='smith');Object.assign(g.state.player,{x:m.x,y:m.y,level:12,scrap:1000});g.interact();return g;}
function trial(id=TRIALS[0].id,tier=1){const g=new Engine('storm',90);g.state.completed=true;g.state.player.level=12;g.enterArea('skybridge');if(tier>1)g.state.trialRecords={[id+':'+(tier-1)]:{elapsedMs:123456}};assert(g.startChallenge(id,tier));return g;}
function begin(g){for(let i=0;i<181;i++)g.update(1/60);assert.equal(g.state.world.trial.countdown,0);}
function finish(g){begin(g);for(let wave=0;wave<4;wave++){for(const e of g.state.world.enemies.filter(e=>!e.dead))g.killEnemy(e);g.update(.02);if(wave<3)for(let i=0;i<121;i++)g.update(1/60);}assert.equal(g.state.pending?.type,'trialResult');}
function keyboardWalk(g,target){const p=g.state.player,path=findPath(p,target,g.state.area,26);assert(path.length);for(const pt of path){let steps=0;while(distance(p,pt)>6&&steps++<2200){const a=Math.round(Math.atan2((pt.y-p.y)/.78,pt.x-p.x)/(Math.PI/4))*Math.PI/4;g.update(1/60,{x:Math.round(Math.cos(a)),y:Math.round(Math.sin(a))});}assert(steps<2200,'keyboard approach stalled');}assert(distance(p,target)<8);}
test('Waterlijn and Zaadkluis merchant apron accepts F outside the former camp circle and closes safely',()=>{
 for(const id of ['rooftops','vault']){const g=trader(id),p=g.state.player;g.closeModal();Object.assign(p,{x:702.4,y:id==='rooftops'?658:683.6});assert(canStand(p.x,p.y,18,id));assert.equal(g.interaction().type,'shop');assert(g.canTrade());assert(g.interact());assert.equal(g.state.pending.type,'shop');assert(g.currentService());assert.equal(g.state.world.shop.antidoteStock,2);g.closeModal();assert.equal(g.state.mode,'playing');const x=p.x;g.update(.05,{x:1});assert(p.x>x);}
});
test('Zonnetuinen north terrace, full southeast plaza and southern stairs accept keyboard walking',()=>{
 for(const target of [{x:425,y:250},{x:1420,y:845},{x:635,y:1170}]){const g=new Engine();g.state.cores=[0];g.enterArea('rooftops');g.state.world.enemies=[];g.state.world.hazards=[];keyboardWalk(g,target);}
 const g=trader('rooftops');g.closeModal();const cache=g.state.world.loot.find(i=>i.exploration);assert(cache);Object.assign(g.state.player,cache);assert(g.interact());g.chooseLoot(0);assert(!g.state.world.storyCacheClaimed);g.enterArea('canal');g.enterArea('rooftops');assert(!g.state.world.loot.some(i=>i.exploration));assert(!Engine.restore(g.serialize()).state.world.loot.some(i=>i.exploration));
});
test('All Zonnetuinen walking cells connect without isolated scenery pockets',()=>{
 const cells=new Map();for(let y=24;y<WORLD.height;y+=24)for(let x=24;x<WORLD.width;x+=24)if(canStand(x,y,18,'rooftops'))cells.set(x+','+y,{x,y});const start=[...cells.keys()][0],seen=new Set([start]),queue=[start];while(queue.length){const k=queue.shift(),p=cells.get(k);for(const [dx,dy]of [[24,0],[-24,0],[0,24],[0,-24],[24,24],[24,-24],[-24,24],[-24,-24]]){const key=(p.x+dx)+','+(p.y+dy);if(cells.has(key)&&!seen.has(key)&&clearLine(p,cells.get(key),'rooftops',18)){seen.add(key);queue.push(key);}}}assert.equal(seen.size,cells.size);
});
test('Regional stores curate distinct bases and progressively stronger fixed stock',()=>{
 let previous=0;const signatures=new Set();for(const [zone,id]of ['canal','highway','forest','skybridge'].entries()){const g=trader(id),stock=g.state.world.shop.stock;assert.equal(stock.length,8);assert(stock.every(i=>i.level>=MARKET_REGIONS[zone].level));assert(stock[0].level>previous);previous=stock[0].level;signatures.add(stock.map(i=>i.id).join('|'));assert(g.hubMerchants().every(m=>m.text.includes(MARKET_REGIONS[zone].specialty)));}assert.equal(signatures.size,4);const a=trader('rooftops'),b=trader('canal');assert.notDeepEqual(a.state.world.shop.stock.map(i=>i.id),b.state.world.shop.stock.map(i=>i.id));
});
test('Prismaboog is a paid late-region skill, cannot bypass via level points or early shops',()=>{
 const g=trader(),p=g.state.player;p.skillPoints=20;assert(!g.purchaseUpgrade({id:'prism',skill:true}));assert(!g.upgradeChoices().some(u=>u.id==='prism'));const cash=p.scrap,bar=copy(p.hotbar);p.level=6;assert(!g.buySpell('prism'));assert.equal(p.scrap,cash);p.level=7;assert(g.buySpell('prism'));assert.equal(p.scrap,cash-650);assert.deepEqual(p.hotbar,bar);assert(!g.buySpell('prism'));assert(Engine.restore(g.serialize()).state.player.skills.includes('prism'));const early=trader('canal');assert.equal(early.spellOffers().length,0);assert(!early.buySpell('prism'));
});
test('Prism requires initial aiming, flies and bounces exactly twice with declining damage',()=>{
 const g=new Engine(),s=g.state,p=s.player;g.enterArea('ring');s.world.enemies=[];s.world.hazards=[];Object.assign(p,{x:700,y:640,mana:110});p.skills.push('prism');for(const x of [900,1080,1250]){const e=g.makeEnemy('turret',x,640);e.hp=e.maxHp=1000;s.world.enemies.push(e);}g.aimAt(1300,640);assert(g.cast('prism'));assert.equal(p.mana,82);assert(s.world.enemies.every(e=>e.hp===1000));for(let i=0;i<90;i++)g.updateProjectiles(1/60);assert(s.world.enemies.every(e=>e.hp<1000));assert.equal(s.projectiles.length,0);const loss=s.world.enemies.map(e=>1000-e.hp);assert(loss[0]>loss[1]&&loss[1]>loss[2]);
});
test('The expensive legendary store piece is single stock and never refills on retry or revisit',()=>{
 const g=trader('skybridge'),p=g.state.player,item=g.state.world.shop.stock.find(i=>i.rarity==='legendary');assert.equal(item.price,950);p.scrap=949;assert(!g.buyItem(item.uid));p.scrap=950;assert(g.buyItem(item.uid));assert.equal(p.scrap,0);g.closeModal();g.enterArea('canal');g.enterArea('skybridge');assert(!g.state.world.shop.stock.some(i=>i.rarity==='legendary'));const r=Engine.restore(g.serialize());r.retry();assert(!r.state.world.shop.stock.some(i=>i.rarity==='legendary'));
});
test('Special drops stay rare while major bosses guarantee at least rare equipment',()=>{
 assert.equal(DROP_TABLES.boss.weights[4],8);assert.equal(DROP_TABLES.guardian.weights[4],3);assert.equal(DROP_TABLES.elite.weights[4],1);let legendary=0;const g=new Engine('tide',123);for(let i=0;i<10000;i++){const item=makeItem({rng:g.rng,profile:'boss',level:12,uid:i});assert(['rare','epic','legendary'].includes(item.rarity));if(item.rarity==='legendary')legendary++;}assert(legendary>650&&legendary<950,legendary+' of 10000');
});
test('Endgame is locked through three regional cores, separate from the sixteen story chapters',()=>{
 const g=new Engine();g.state.cores=[0,1,2];for(const t of TRIALS){assert(!g.isUnlocked(t.id));assert(!g.startChallenge(t.id));}g.state.cores.push(3);assert(g.endgameUnlocked());assert.equal(AREAS.filter(a=>!a.optional&&!a.endgame).length,16);assert.equal(AREAS.filter(a=>a.endgame).length,3);assert(!g.trialTierUnlocked(TRIALS[0].id,2));assert(!g.startChallenge(TRIALS[0].id,4));
});
test('Trials start fair body resources without granting scarce consumable stock',()=>{
 const g=trader('skybridge');g.closeModal();g.state.completed=true;const p=g.state.player;Object.assign(p,{hp:15,mana:1,potions:1,antidotes:0,ultimate:100,ultimateCooldown:5,venom:8});assert(g.startChallenge(TRIALS[0].id));assert.equal(p.hp,g.stats().maxHp);assert.equal(p.mana,g.stats().maxMana);assert.equal(p.potions,1);assert.equal(p.antidotes,0);assert.equal(p.ultimate,0);assert.equal(p.venom,0);assert.equal(g.state.world.enemies.length,0);
});
test('Countdown does not count as timed play, modes pause time, and return gate waits for all four waves',()=>{
 const g=trial(),t=g.state.world.trial;g.update(1);assert.equal(t.elapsed,0);assert.equal(t.countdown,2);g.state.mode='modal';g.update(1);assert.equal(t.countdown,2);g.state.mode='playing';g.update(2);assert.equal(t.round,1);assert(!g.portalReady());assert(g.state.world.enemies.every(e=>canStand(e.x,e.y,e.radius,g.state.area)));g.update(.05);assert.equal(t.elapsed,.05);const time=t.elapsed;g.state.mode='modal';g.update(1);assert.equal(t.elapsed,time);
});
test('Four waves have different rosters, named final bosses, and no per-kill loot, scrap or XP',()=>{
 const sets=[];for(const spec of TRIALS){const g=trial(spec.id);begin(g);sets.push(g.state.world.enemies.map(e=>e.type).join('|'));const p=g.state.player,cash=p.scrap,xp=p.xp;for(const e of g.state.world.enemies)g.killEnemy(e);assert.equal(p.scrap,cash);assert.equal(p.xp,xp);assert.equal(g.state.world.loot.length,0);g.state.world.trial.round=3;g.spawnChallengeWave();assert(g.state.world.enemies.some(e=>e.type===spec.boss&&e.displayName===spec.bossName));}assert.equal(new Set(sets).size,3);
});
test('Completion pays one manual item once, records the build and unlocks the next tier',()=>{
 const g=trial(),p=g.state.player,equipment=copy(p.equipment),cash=p.scrap,xp=p.xp;finish(g);const result=g.state.pending;assert(result.newBest);assert.equal(p.scrap,cash+70);assert.equal(p.xp,xp+120);assert.equal(p.inventory.length,1);assert.deepEqual(p.equipment,equipment);assert(g.portalReady());assert(g.trialTierUnlocked(TRIALS[0].id,2));assert(!g.finishChallenge());assert.equal(p.scrap,cash+70);assert.equal(result.record.kills,25);assert.equal(result.record.gear.length,6);assert(recordText(result.record).includes('Dijkbreker'));assert.equal(trialTime(123456),'2:03.45');
});
test('Higher tiers increase HP and damage; records and paid rewards survive reload',()=>{
 const values=[];for(let tier=1;tier<=3;tier++){const g=trial(TRIALS[1].id,tier);begin(g);values.push({hp:g.state.world.enemies.find(e=>e.type==='salamander')?.maxHp||g.state.world.enemies[0].maxHp,dmg:g.state.world.enemies[0].damageMultiplier});}assert(values[1].hp>values[0].hp&&values[2].hp>values[1].hp);assert(values[1].dmg>values[0].dmg&&values[2].dmg>values[1].dmg);const g=trial();finish(g);const cash=g.state.player.scrap,records=copy(g.state.trialRecords),r=Engine.restore(g.serialize());assert.deepEqual(r.state.trialRecords,records);assert.equal(r.state.player.scrap,cash);assert.equal(r.state.player.inventory.length,1);assert.equal(r.state.pending.type,'trialResult');r.restartChallenge();assert.equal(r.state.player.scrap,cash);assert.equal(r.state.player.inventory.length,1);
});
test('Reloading or dying during a trial restarts the whole attempt and never restores consumed antidotes',()=>{
 const g=trial();begin(g);g.state.player.antidotes=0;g.state.player.potions=0;g.state.world.enemies[0].hp=1;g.state.world.trial.elapsed=60;const r=Engine.restore(g.serialize());assert.equal(r.state.world.trial.elapsed,0);assert.equal(r.state.world.trial.round,0);assert.equal(r.state.player.antidotes,0);assert.equal(r.state.player.potions,0);r.state.mode='dead';r.retry();assert.equal(r.state.player.antidotes,0);assert.equal(r.state.player.potions,0);assert.equal(r.state.world.trial.countdown,3);
});
test('Completion XP waits for the camp level-up; restarting cannot trap an unspendable upgrade in combat',()=>{const g=trial();finish(g);const reward=g.state.player.scrap;assert(g.state.player.xp>=g.state.player.nextXp);assert(!g.restartChallenge());assert.equal(g.state.area,'skybridge');assert.equal(g.state.pending.type,'upgrade');assert(g.chooseUpgrade(0));assert.equal(g.state.mode,'playing');assert.equal(g.state.player.scrap,reward);assert(g.startChallenge(TRIALS[0].id,1));});
test('Leech gear works on real trial opponents while summoned enemies cannot farm it',()=>{const g=trial();begin(g);const p=g.state.player;p.equipment.relic.stats.leech=3;p.hp=50;g.killEnemy(g.state.world.enemies[0]);assert.equal(p.hp,53);const add=g.makeEnemy('eel',900,600);add.noReward=true;g.killEnemy(add);assert.equal(p.hp,53);});
console.log(`\n${n} merchant, exploration, economy and timed-arena checks passed.`);
