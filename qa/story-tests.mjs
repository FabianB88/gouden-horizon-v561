import assert from 'node:assert/strict';
import {Engine,findPath,distance,copy} from '../src/engine.js';
import {AREAS,POSITIONS,SPELLS} from '../src/data.js';
import {STORY_ORDER} from '../src/story.js';
import {hotbarTarget,assistedSkill} from '../src/aim.js';
import {heroGait} from '../src/hero-animation.js';
import {updateNewThreats} from '../src/enemy-variety.js';
import {SAFE_HUBS} from '../src/hubs.js';
import {ITEM_BASES,makeItem,DROP_TABLES} from '../src/loot.js';
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function arena(){const g=new Engine('tide',106);g.enterArea('ring');g.state.world.enemies=[];g.state.world.hazards=[];Object.assign(g.state.player,{x:850,y:640,invincible:0});return g;}
test('Sixteen chapters retain one combat return gate and fixed distinct transit destinations',()=>{
 assert.equal(STORY_ORDER.length,AREAS.filter(a=>!a.optional&&!a.endgame).length);assert.equal(new Set(STORY_ORDER).size,16);
 const g=new Engine();g.state.cores=[0,1,2];for(const a of AREAS){g.enterArea(a.id);const portals=g.portalDefinitions(a.id);if(SAFE_HUBS.includes(a.id)){assert(portals.length>=3);assert.equal(new Set(portals.map(p=>p.to)).size,portals.length);}else assert.equal(portals.length,1,a.id);}
});
test('The first camp leads to the pump chapter before the first core arena',()=>{
 const g=new Engine();assert.equal(g.recommendedArea(),'delta');assert.equal(g.portalDefinitions('canal')[0].to,'delta');assert(!g.selectDestination('ring'));assert(!g.selectDestination('mirrors'));
 g.enterArea('delta');const w=g.state.world;
 for(let round=0;round<2;round++){for(const e of w.enemies.filter(e=>!e.dead))g.killEnemy(e);g.state.player.xp=0;g.update(.01);}
 assert.equal(g.recommendedArea(),'ring');Object.assign(g.state.player,POSITIONS.exit);assert(g.interact());assert.equal(g.state.area,'canal');assert(!g.portalDefinitions('canal').find(p=>p.to==='ring').locked);assert.equal(g.portalDefinitions('canal')[0].to,'delta');
});
test('A claimed guarded protocol opens the next chapter and survives reload',()=>{
 const g=new Engine();g.state.cores=[0];g.state.storyPassed=['canal','delta','ring'];g.enterArea('rooftops');assert(!g.portalReady());const cache=g.state.world.loot.find(i=>!i.item);Object.assign(g.state.player,{x:cache.x,y:cache.y});assert.equal(g.interaction().type,'guardedLoot');g.killEnemy(g.state.world.enemies.find(e=>e.cacheGuard));assert(g.interact());g.recycleLoot();assert(g.portalReady());assert.equal(g.recommendedArea(),'highway');assert.equal(g.portalDefinitions('rooftops')[0].to,'highway');const restored=Engine.restore(g.serialize());assert(restored.chapterComplete('rooftops'));assert(restored.portalReady());
});
test('Atlas revisits completed chapters from a safe hub without repointing its arena gates',()=>{
 const g=new Engine();g.state.cores=[0];g.state.storyPassed=['canal','delta','ring','rooftops'];g.enterArea('highway');assert(g.selectDestination('canal'));assert.equal(g.state.area,'canal');assert.equal(g.portalDefinitions('highway')[0].to,'mirrors');assert(g.selectDestination('highway'));assert.equal(g.recommendedArea(),'mirrors');assert(!g.selectDestination('aurelia'));
});
test('Legacy core progress resumes at the right chapter without losing gear or wounds',()=>{
 const g=new Engine();g.state.cores=[0,1];g.enterArea('forest');const payload=JSON.parse(g.serialize());delete payload.state.campaignVersion;delete payload.state.storyPassed;payload.state.player.hp=43;payload.state.player.scrap=117;const gear=copy(payload.state.player.equipment),restored=Engine.restore(JSON.stringify(payload));assert.equal(restored.recommendedArea(),'glass');assert.equal(restored.state.player.hp,43);assert.equal(restored.state.player.scrap,117);assert.deepEqual(restored.state.player.equipment,gear);restored.retry();assert.equal(restored.recommendedArea(),'glass');
});
test('Completed older saves can revisit new chapters from the safe atlas',()=>{
 const g=new Engine();g.state.cores=[0,1,2,3];g.state.completed=true;const payload=JSON.parse(g.serialize());delete payload.state.campaignVersion;delete payload.state.storyPassed;const restored=Engine.restore(JSON.stringify(payload));
 for(const id of ['brine','clouds']){restored.enterArea('canal');assert(restored.canSelectDestination(id));assert(restored.selectDestination(id));assert.equal(restored.state.area,id);}
 restored.state.destination=null;restored.enterArea('skybridge');assert(restored.portalDefinitions('skybridge').some(p=>p.to==='aurelia'&&!p.locked));
});
test('Both painted quay stairs and terraces are traversable using actual movement',()=>{
 for(const [x,y]of [[.678,.574],[.85,.419]]){const g=new Engine(),p=g.state.player,goal={x:x*1920,y:y*1280},path=findPath(p,goal,'canal');assert(path.length);for(const point of path){let i=0;while(distance(p,point)>1&&i++<3000){const d=Math.hypot(point.x-p.x,point.y-p.y),step=Math.min(2,d);g.moveEntity(p,(point.x-p.x)/d*step,(point.y-p.y)/d*step);}assert(distance(p,point)<=1,'Blocked at painted stairs');}assert(distance(p,goal)<=1);}
});
test('Clicking direct attacks keeps manual aim even with an enemy off to the side',()=>{
 const g=arena(),p=g.state.player;g.aimAt(1300,640);const e=g.makeEnemy('raider',850,850);g.state.world.enemies=[e];
 for(const id of ['tide','storm','frost','gale','gravity']){p.skills.push(id);p.mana=110;p.spellCd[id]=0;assert.equal(assistedSkill(id),false);assert.equal(hotbarTarget(id,p,[e]),null);assert(g.cast(id,hotbarTarget(id,p,[e])));assert(Math.abs(p.aim.y)<.001);}
});
test('Sun bombs and each ground area spell retain click-to-place assistance',()=>{
 const p={x:850,y:640,aim:{x:1,y:0}},enemy={x:900,y:840,dead:false};
 for(const [id,spell]of Object.entries(SPELLS))if(id==='ember'||spell.area){assert(assistedSkill(id));assert.deepEqual(hotbarTarget(id,p,[enemy]),{x:900,y:834});}
});
test('New families alternate six distinct, locked and readable attack patterns',()=>{
 const patterns={minecrab:['mines','magnet'],resonant:['echo','sweep'],brinebreaker:['brinejet','saltwalls']};
 for(const [type,modes]of Object.entries(patterns)){const g=arena(),e=g.makeEnemy(type,950,640);for(const mode of modes){g.planAttack(e);assert.equal(e.windup.mode,mode);assert(e.windup.total>=.8);const locked=copy(e.windup.target);g.state.player.y+=25;assert.deepEqual(e.windup.target,locked);g.executeEnemyAttack(e);assert(g.takeEvents().some(event=>event.type==='enemyattack'&&event.mode===mode));}assert(DROP_TABLES[type].chance<.3);}
});
test('Mines arm before damage, trigger once and allow walking out of the footprint',()=>{
 const g=arena(),e=g.makeEnemy('minecrab',1000,640);g.planAttack(e);g.executeEnemyAttack(e);const hp=g.state.player.hp;updateNewThreats(g,.5);assert.equal(g.state.player.hp,hp);g.state.player.y+=250;updateNewThreats(g,.7);assert.equal(g.state.player.hp,hp);g.state.player.y-=250;updateNewThreats(g,.01);assert(g.state.player.hp<hp);const after=g.state.player.hp;updateNewThreats(g,.01);assert.equal(g.state.player.hp,after);
});
test('Salt walls leave a safe central corridor and sweeping beams use a narrow ray',()=>{
 const g=arena(),e=g.makeEnemy('brinebreaker',1100,640);g.planAttack(e);g.planAttack(e);g.executeEnemyAttack(e);const hp=g.state.player.hp;updateNewThreats(g,.5);assert.equal(g.state.player.hp,hp);const wall=g.state.world.threats[0];Object.assign(g.state.player,{x:wall.x,y:wall.y});updateNewThreats(g,.7);assert(g.state.player.hp<hp);
 const b=arena(),drone=b.makeEnemy('resonant',650,640);b.planAttack(drone);b.planAttack(drone);b.executeEnemyAttack(drone);assert(b.state.world.threats.some(t=>t.type==='sweep'));b.state.player.y=840;updateNewThreats(b,.1);assert.equal(b.state.player.hp,100);
});
test('Thirty-six loot templates include twelve new illustrated archetypes across six slots',()=>{
 assert.equal(ITEM_BASES.length,36);const ids=new Set(ITEM_BASES.map(i=>i.id));assert.equal(ids.size,36);const rng=new Engine().rng,seen=new Set();for(let i=0;i<2500;i++)seen.add(makeItem({rng,level:3,uid:i}).id);assert.equal(seen.size,36);
});
test('Whole-body gait counter-swings shoulders and arms, and eases to a stable pose',()=>{
 const a=heroGait(.1),b=heroGait(.1+1/3.1);assert(a.torso*b.torso<0);assert(a.arm*b.arm<0);assert(a.arm*a.torso<0);assert(a.weight*b.weight<0);assert(a.bob<0);assert.deepEqual(heroGait(.1,0),{cycle:.1*Math.PI*3.1,weight:0,bob:-0,torso:0,arm:-0});
});
console.log(`\n${passed} story, aim, animation and enemy checks passed.`);
