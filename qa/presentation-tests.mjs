import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Engine} from '../src/engine.js';
import {heroDirection,heroFrame,HERO_DIRECTIONS,updateHeroMotion} from '../src/hero-motion.js';
import {gearFeedback} from '../src/gear-feedback.js';
import {makeItem} from '../src/loot.js';
let passed=0;
function test(name,run){run();passed++;console.log('PASS '+name);}

test('Eight painted views match actual travel, even when aiming backwards',()=>{
 const vectors=[[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1]];
 for(const [i,[x,y]] of vectors.entries()){
  const p={aim:{x:-x,y:-y},walkDistance:0,walkPhase:0};
  updateHeroMotion(p,x,y*.78,.016,200);
  assert.equal(p.poseDirection,i);assert(p.moving);assert.equal(HERO_DIRECTIONS[i],HERO_DIRECTIONS[heroDirection(x,y)]);
 }
 assert.equal(heroDirection(1,Math.tan(Math.PI/8+.03),6),6);
 assert.equal(heroDirection(1,Math.tan(Math.PI/8+.1),6),7);
});
test('A blocked hero stops the painted cycle; idle is stable and preserves aim',()=>{
 const g=new Engine(),p=g.state.player;
 for(let i=0;i<240;i++)g.update(1/60,{x:1});
 const at=p.walkDistance;
 for(let i=0;i<60;i++)g.update(1/60,{x:1});
 assert.equal(p.walkDistance,at);assert(!p.moving);assert.equal(heroFrame(p),2);
 for(let i=0;i<20;i++)g.update(1/60,{aim:{x:p.x-300,y:p.y}});
 assert.equal(p.poseDirection,2);assert.equal(heroFrame(p),2);
});
test('Animation follows speed and travelled distance, while dashes keep the walk phase',()=>{
 const slow={aim:{x:1,y:0}},fast={aim:{x:1,y:0}};
 updateHeroMotion(slow,20,0,.1,200);updateHeroMotion(fast,30,0,.1,300);
 assert.equal(fast.walkDistance,slow.walkDistance*1.5);assert.notEqual(heroFrame(slow),heroFrame(fast));
 fast.dashDir={x:0,y:-1};const before=fast.walkDistance;
 updateHeroMotion(fast,0,-70,.1,300,true);
 assert.equal(fast.walkDistance,before);assert.equal(fast.poseDirection,4);
});
test('Every source crop stays in its atlas and has a valid ground anchor and clipping path',()=>{
 const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8'));
 const hero=read('assets/painted/hero-eight-directions.json'),enemies=read('assets/expedition/v54-sprites.json');
 assert.deepEqual(Object.keys(hero.directions),HERO_DIRECTIONS);
 const check=(f,width,height)=>{const [x,y,w,h]=f.bounds;assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=width&&y+h<=height);assert(f.anchor[0]>=0&&f.anchor[0]<=1&&f.anchor[1]>.8&&f.anchor[1]<=1);assert(f.clip.length>12);};
 for(const frames of Object.values(hero.directions)){assert.equal(frames.length,6);frames.forEach(f=>check(f,1087,1447));}
 assert.equal(Object.keys(enemies.enemies).length,4);assert.equal(Object.keys(enemies.bosses).length,3);
 Object.values(enemies.enemies).forEach(f=>check(f,1254,1254));
 Object.values(enemies.bosses).forEach(b=>{assert.equal(b.frames.length,2);assert(b.scaleDenominator>0);b.frames.forEach(f=>check(f,1536,1024));});
});
test('Gear feedback explains real gains, losses, new effects and level requirements',()=>{
 const old={stats:{power:.15,crit:.05}};
 const trade=gearFeedback({rarity:'legendary',stats:{power:.2,crit:.02}},old,1);
 assert.equal(trade.kind,'tradeoff');assert(trade.summary.includes('+5%'));assert(trade.summary.includes('-3%'));
 assert.equal(gearFeedback({rarity:'legendary',stats:{power:.1}},old,1).kind,'loss');
 const locked=gearFeedback({stats:{},effect:'ward',requiredLevel:5},{stats:{}},2);
 assert.equal(locked.requiredLevel,5);assert(locked.effect);assert.equal(locked.kind,'gain');
});
test('Ground items celebrate once, stay manual and cannot be collected twice',()=>{
 const g=new Engine(),p=g.state.player,old=p.equipment.boots.uid;
 const item=makeItem({rng:g.rng,slot:'boots',rarity:'common',uid:++g.idCounter}),drop={id:++g.idCounter,item};
 g.state.world.loot.push(drop);g.takeEvents();
 assert.equal(g.collectDrop(drop),item.uid);assert.equal(p.equipment.boots.uid,old);
 assert.equal(g.takeEvents().filter(e=>e.type==='discovery'&&e.collected).length,1);
 assert(!g.collectDrop(drop));assert.equal(p.inventory.length,1);assert.equal(g.takeEvents().length,0);
});
test('Cache selections celebrate all rarities without granting extra items or ignoring a full bag',()=>{
 for(const rarity of ['common','rare','legendary']){
  const g=new Engine(),item=makeItem({rng:g.rng,slot:'weapon',rarity,uid:++g.idCounter}),cache=g.state.world.loot[0];
  g.state.mode='modal';g.state.pending={type:'loot',item:cache,choices:[item]};g.takeEvents();
  assert(g.chooseLoot(0));assert.equal(g.state.player.inventory.length,1);
  assert.equal(g.takeEvents().filter(e=>e.type==='discovery'&&e.item.rarity===rarity&&e.collected).length,1);
  assert(!g.chooseLoot(0));
  g.state.player.inventory=Array(48).fill(item);g.state.pending={type:'loot',item:cache,choices:[item]};
  assert(!g.chooseLoot(0));assert.equal(g.state.player.inventory.length,48);assert(g.state.pending);
 }
});
console.log(`\n${passed} movement, asset and loot-feedback checks passed.`);
