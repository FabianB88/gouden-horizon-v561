// Full campaign and timed trials using only ordinary actions and earned gear.
// No grants, forced kills, HP changes, unlock edits, teleports or invincibility.
import assert from 'node:assert/strict';
import {simulate} from './simulate-run.mjs';
import {distance,normal,canStand} from '../src/engine.js';
import {ENEMIES} from '../src/data.js';
import {TRIALS,trialTime} from '../src/endgame.js';
const dt=1/60;
const value=i=>Object.entries(i.stats).reduce((sum,[k,v])=>sum+v*({hp:1,power:100,storm:70,tide:35,regen:4,leech:14,recovery:15,mana:.3,speed:30,armor:80,crit:30}[k]||1),0);
function prepare(g){
 g.enterArea('skybridge');g.update(.00001);if(g.state.pending?.type==='upgrade')g.chooseUpgrade(g.state.pending.choices.map((c,i)=>({i,value:Object.entries(c.stats||{}).reduce((sum,[k,v])=>sum+v*({power:100,hp:1,armor:50,regen:4}[k]||1),0)})).sort((a,b)=>b.value-a.value)[0].i);if(g.state.mode==='modal')g.deferUpgrade();const p=g.state.player;
 for(const item of [...p.inventory])if(p.level>=item.requiredLevel&&value(item)>value(p.equipment[item.slot])+2)g.equipItem(item.uid);
 for(const item of [...p.inventory])g.sellItem(item.uid);
 while(p.potions<5&&g.buySupply()){}while(p.antidotes<2&&g.buyAntidote()){}
 for(const slot of ['weapon','suit','boots'])while(p.equipment[slot].enhance<2&&g.reinforce(slot)){}
}
export function simulateTrial(g,id,tier,maxSeconds=360){
 prepare(g);assert(g.startChallenge(id,tier));let heals=0,dashes=0,attacks=0,hits=0,step=0;
 for(;step<maxSeconds*60;step++){
  const s=g.state,p=s.player,w=s.world;if(w.trial.done||s.mode==='dead')break;
  if(p.venom>0)g.useAntidote();if(p.hp<g.stats().maxHp*.52&&g.heal())heals++;
  const nearby=w.enemies.filter(e=>!e.dead&&e.awake).sort((a,b)=>distance(p,a)-distance(p,b));
  const enemy=nearby[0];let goal=null,move={x:0,y:0};
  if(enemy){
   const d=distance(p,enemy),to=normal(enemy.x-p.x,(enemy.y-p.y)*1.15),orbit=Math.floor(step/300)%2?1:-1;
   if(d>330)move=to;else if(d<180)move={x:-to.x,y:-to.y};else move={x:-to.y*.85*orbit,y:to.x*.85*orbit};
   g.selectSpell(enemy.wet>.4&&p.mana>12?'storm':'tide');
   const aim={x:enemy.x,y:enemy.y};
   if(p.skills.includes('frost')&&enemy.wet>.4&&(p.spellCd.storm||0)>.05&&p.mana>30)g.cast('frost',aim);
   for(const id of ['orbital','tempest','glacier','cyclone','gravity'])if(p.skills.includes(id)&&nearby.length>1&&p.mana>65&&(p.spellCd[id]||0)<=0){g.cast(id,aim);break;}
   if(p.skills.includes('gale')&&d<180&&p.mana>30)g.cast('gale',aim);
   if(p.mana>45)g.castRight({x:enemy.x,y:enemy.y});
   if(p.ultimate>=100&&(nearby.filter(e=>distance(p,e)<410).length>2||ENEMIES[enemy.type].boss))g.ultimate();
  }
  // Read the same warnings a human sees, then step out before impact.
  let danger=false;
  for(const e of nearby){const a=e.windup;if(!a)continue;
   if(['beam','snipe','charge','crossfire','echo','sweep','solarSweep','clawRush','arcDash','tether'].includes(a.mode)){const dx=p.x-e.x,dy=(p.y-e.y)*1.15,along=dx*a.dir.x+dy*a.dir.y,cross=dx*a.dir.y-dy*a.dir.x;if(along>0&&along<750&&Math.abs(cross)<85){const sign=cross<0?-1:1;move={x:a.dir.y*sign,y:-a.dir.x*sign};danger=a.timer<.35;}}
   if(['swing','slam','bite','brinejet','shieldBash'].includes(a.mode)&&distance(p,e)<175){move=normal(p.x-e.x,(p.y-e.y)*1.15);danger=a.timer<.3;}
   for(const target of a.targets||((a.mode==='leap')?[a.target]:[]))if(distance(p,target)<145){move=normal(p.x-target.x||.1,(p.y-target.y)*1.15||-1);danger=a.timer<.35;}
  }
  for(const t of w.threats||[]){
   if(t.type==='ring'){const r=t.r+t.age*t.speed,d=distance(p,t);if(Math.abs(d-r)<85){move=normal(p.x-t.x,(p.y-t.y)*1.15);danger=Math.abs(d-r)<45;}}
   if(t.type==='eruption'&&distance(p,t)<t.r+25){move=normal(p.x-t.x||1,(p.y-t.y)*1.15||-1);danger=t.age>t.arm-.3;}
   if(t.type==='mine'&&distance(p,t)<t.r+35){move=normal(p.x-t.x||1,(p.y-t.y)*1.15||-1);danger=t.age>=t.arm-.3;}
   if(t.type==='sweep'){const a=t.angle+t.age*1.1,dx=p.x-t.x,dy=(p.y-t.y)*1.15,along=dx*Math.cos(a)+dy*Math.sin(a),cross=dx*Math.sin(a)-dy*Math.cos(a);if(along>0&&along<t.length&&Math.abs(cross)<85){move={x:Math.sin(a)*(cross<0?-1:1),y:-Math.cos(a)*(cross<0?-1:1)};danger=true;}}
   if(t.type==='saltwall'){const dx=p.x-t.x,dy=(p.y-t.y)*1.15,cross=dx*t.dir.y-dy*t.dir.x;if(Math.abs(dx*t.dir.x+dy*t.dir.y)<t.length/2+25&&Math.abs(cross)<t.width+25){move={x:t.dir.y*(cross<0?-1:1),y:-t.dir.x*(cross<0?-1:1)};danger=t.age>=t.arm-.1;}}
  }
  for(const b of s.projectiles.filter(b=>b.team==='enemy')){
   if(b.type==='enemy-lob'){if(distance(p,b.end)<b.impactRadius+30){move=normal(p.x-b.end.x||1,(p.y-b.end.y)*1.15||-1);danger=b.duration-b.age<.3;}continue;}if(b.type==='enemy-carrier')continue;
   const future={x:b.x+b.vx*.3,y:b.y+b.vy*.3};if(distance(p,future)<65){const dir=normal(b.vx,b.vy*1.15),cross=(p.x-b.x)*dir.y-(p.y-b.y)*1.15*dir.x;move={x:dir.y*(cross<0?-1:1),y:-dir.x*(cross<0?-1:1)};danger=true;}
  }
  for(const h of w.hazards.filter(h=>!h.cleared&&h.type!=='water'&&h.type!=='friendlyFire'))if(distance(p,h)<h.r+18){
   // A real dropped item can land in persistent poison. Once combat ends,
   // collect it by accepting the normal terrain damage rather than endlessly
   // oscillating between approaching the item and fleeing its position.
   
   const out=normal(p.x-h.x,(p.y-h.y)*1.15);move={x:move.x*.3+out.x,y:move.y*.3+out.y};
  }

  if(!canStand(p.x+move.x*45,p.y+move.y*35,18,s.area))move=normal(960-p.x,640-p.y);
  if(danger&&g.dash(move.x,move.y))dashes++;
  g.update(dt,{x:move.x,y:move.y,aim:enemy?{x:enemy.x,y:enemy.y-4}:null,shoot:Boolean(enemy)});
  for(const e of g.takeEvents()){if(e.type==='enemyattack')attacks++;if(e.type==='hurt')hits++;}
 }
 const t=g.state.world.trial;return {id,tier,mode:g.state.mode,done:t.done,waves:t.round,time:trialTime(Math.round(t.elapsed*1000)),elapsedMs:Math.round(t.elapsed*1000),hp:Math.round(g.state.player.hp),kills:t.kills,heals,dashes,attacks,hits,loot:g.state.world.loot.length,potions:g.state.player.potions,antidotes:g.state.player.antidotes,reward:t.rewardPaid};
}
const campaign=simulate(48,'tide',900,{includeEngine:true}),g=campaign.engine;assert.equal(campaign.mode,'won');console.log(JSON.stringify({campaign:{mode:campaign.mode,seconds:campaign.seconds,level:campaign.level,scrap:campaign.scrap,retries:campaign.retries}},null,2));
const results=[];for(const spec of TRIALS){const result=simulateTrial(g,spec.id,1);results.push(result);console.log(JSON.stringify(result));assert(result.done,spec.name+' did not complete');assert(result.attacks>0&&result.loot===0);}
for(const tier of [2,3]){const result=simulateTrial(g,TRIALS[0].id,tier);results.push(result);console.log(JSON.stringify(result));if(!result.done)break;}
assert(results.filter(r=>r.done).length===5,'all five tested arena/tier combinations must clear');assert(results.reduce((sum,r)=>sum+r.hits,0)>0,'trial attacks must actually be able to hit');
console.log(JSON.stringify({records:Object.keys(g.state.trialRecords),wallet:g.state.player.scrap,results},null,2));
