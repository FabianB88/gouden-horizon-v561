// Integration check: plays through using normal actions. Never grants HP, mana,
// damage or gear; never deletes enemies, unlocks gates or teleports the player.
// A defeated test player may use the game's actual checkpoint retry twice.
import {Engine,distance,normal,canStand,findPath,clearLine} from '../src/engine.js';
import {arenaObstacles,coverHit} from '../src/arena-layouts.js';
import {pathToFileURL} from 'node:url';
import {ENEMIES,AREA_BY_ID,AREAS} from '../src/data.js';
const dt=1/60;
function gearValue(item){const s=item.stats||{};return (s.leech||0)*12+(s.power||0)*90+(s.armor||0)*60+(s.hp||0)+(s.regen||0)*3+(s.storm||0)*80+(s.tide||0)*45+(s.mana||0)*.3+(s.recovery||0)*12+(s.speed||0)*20;}
export function simulate(seed=48,discipline='tide',maxSeconds=900,options={}){
 const g=new Engine(discipline,seed),history=[],traded=new Set();let buys=0,sales=0,forges=0,retries=0,lastPosition=null,stalled=0,lastZone=null,path=[],pathGoal=null,pathAge=0,attacks=0,hits=0,dashes=0,heals=0,phases=new Set(),step=0;
 for(;step<60*maxSeconds;step++){
  const s=g.state,p=s.player,w=s.world;
  if(s.area!==lastZone){history.push({area:s.area,zone:s.zone,at:Math.round(s.runTime),hp:Math.round(p.hp),level:p.level});lastZone=s.area;path=[];pathGoal=null;}
  if(s.mode==='won')break;
  if(s.mode==='dead'){if(retries>=2)break;retries++;g.retry();lastPosition=null;stalled=0;path=[];pathGoal=null;pathAge=0;continue;}
  // Standing still while firing or choosing loot is valid play. Only flag a
  // sustained navigation stall after combat and modal choices have finished.
  if(s.mode==='playing'&&!w.enemies.some(e=>!e.dead&&e.awake)&&lastPosition&&distance(p,lastPosition)<.02)stalled++;else stalled=0;lastPosition={x:p.x,y:p.y};if(stalled>300)break;
  if(s.mode==='modal'){
   const q=s.pending;
   if(q.type==='upgrade'){const sorted=q.choices.map((u,i)=>({i,value:gearValue(u)})).sort((a,b)=>b.value-a.value);g.chooseUpgrade(q.choices.findIndex(u=>u.skill)>=0?q.choices.findIndex(u=>u.skill):sorted[0].i);}
   else if(q.type==='loot'){const sorted=q.choices.map((u,i)=>({i,value:gearValue(u)-gearValue(p.equipment[u.slot])})).sort((a,b)=>b.value-a.value);if(sorted[0].value>0){const uid=g.chooseLoot(sorted[0].i);g.equipItem(uid);}else g.recycleLoot();}
   else g.closeModal();continue;
  }
  for(const item of [...p.inventory])if(p.level>=(item.requiredLevel||1)&&gearValue(item)>gearValue(p.equipment[item.slot])+1)g.equipItem(item.uid);
  if(g.canTrade()&&!traded.has(s.area+':'+g.recommendedArea())){
   traded.add(s.area+':'+g.recommendedArea());
   for(const item of [...p.inventory])if(gearValue(item)<=gearValue(p.equipment[item.slot])){if(g.sellItem(item.uid))sales++;}
   const offers=w.shop.stock.filter(item=>p.level>=item.requiredLevel&&p.scrap>=item.price&&gearValue(item)>gearValue(p.equipment[item.slot])+3).sort((a,b)=>(gearValue(b)-gearValue(p.equipment[b.slot]))-(gearValue(a)-gearValue(p.equipment[a.slot])));
   if(offers[0]){const uid=g.buyItem(offers[0].uid);if(uid){buys++;g.equipItem(uid);}}
   while(p.potions<3&&g.buySupply()){}
   while(p.antidotes<2&&g.buyAntidote()){}
   if(g.reinforce('boots'))forges++;
  }
  if(p.venom>0)g.useAntidote();
  if(p.hp<g.stats().maxHp*.52&&g.heal())heals++;
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
  }else{
   g.syncStoryPortals();const next=g.routeTo(g.recommendedArea())[1];goal=w.loot[0]||w.relays.find(r=>r.status==='dormant')||(!w.coreCollected&&g.arenaCleared()?w.gate:w.enemies.find(e=>!e.dead))||w.portals.find(portal=>portal.to===next);
   if(goal){move=normal(goal.x-p.x,(goal.y-p.y)*1.15);if(distance(p,goal)<85){const a=g.interaction();if(a&&(a.entity.id===goal.id||distance(a.entity,goal)<1))g.interact();}}
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
   // Outside combat, cross brief terrain hazards using ordinary healing rather
   // than endlessly oscillating between the route and a hazard's outer rim.
   if(!enemy&&goal)continue;
   const out=normal(p.x-h.x,(p.y-h.y)*1.15);move={x:move.x*.3+out.x,y:move.y*.3+out.y};
  }
  // Follow traced routes when scenery blocks the direct line. No teleporting or artificial stats.
  const area=AREA_BY_ID[s.area];if(area.kind==='route'||arenaObstacles(s.area).length){
   const destination=enemy&&(distance(p,enemy)>240||coverHit(p,enemy,s.area))?enemy:goal;if(!enemy&&goal)move=normal(goal.x-p.x,(goal.y-p.y)/.78);
   if(destination&&!clearLine(p,destination,s.area)){
    if(pathGoal!==destination.id||pathAge--<=0||!path.length){path=findPath(p,destination,s.area);pathGoal=destination.id;pathAge=45;}
    if(path.length){if(distance(p,path[0])<3)path.shift();const point=path[0]||destination;move=normal(point.x-p.x,(point.y-p.y)/.78);}
   }
   // The real movement routine slides along scenery; do not cancel a valid
   // path merely because its diagonal endpoint needs an axis slide.
   if(!canStand(p.x+move.x*3,p.y+move.y*2.34,18,s.area)&&!canStand(p.x+move.x*3,p.y,18,s.area)&&!canStand(p.x,p.y+move.y*2.34,18,s.area))pathAge=0;
  }else if(!canStand(p.x+move.x*45,p.y+move.y*35,18,s.area)){move=normal(960-p.x,640-p.y);}
  if(danger&&g.dash(move.x,move.y))dashes++;
  if(process.env.TRACE_RUN&&step%1000===0)console.log({step,area:s.area,position:{x:p.x,y:p.y},goal:goal&&{x:goal.x,y:goal.y},move,path,valid:canStand(p.x+move.x*3,p.y+move.y*2.34,18,s.area)});
  g.update(dt,{x:move.x,y:move.y,aim:enemy?{x:enemy.x,y:enemy.y-4}:null,shoot:Boolean(enemy)});
  for(const e of g.takeEvents()){if(e.type==='enemyattack')attacks++;if(e.type==='hurt')hits++;if(e.type==='bossphase'&&e.enemy==='boss')phases.add(e.phase);}
 }
 const s=g.state;return {...(options.includeEngine?{engine:g}:{}),scrap:s.player.scrap,equipment:Object.values(s.player.equipment).map(i=>({id:i.id,rarity:i.rarity,level:i.level})),seed,discipline,position:{x:Math.round(s.player.x),y:Math.round(s.player.y)},path,loot:s.world.loot.length,live:s.world.enemies.filter(e=>!e.dead).length,mode:s.mode,seconds:Math.round(s.runTime),kills:s.kills,combos:s.combos,level:s.player.level,hp:Math.round(s.player.hp),potions:s.player.potions,buys,sales,forges,retries,enemyAttacks:attacks,hitsTaken:hits,dashes,heals,bossPhases:[...phases],areas:s.visited.filter(id=>!AREA_BY_ID[id].optional&&!AREA_BY_ID[id].endgame).length,skills:s.player.skills,history};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const seeds=[48,209,815];const results=seeds.map((seed,i)=>simulate(seed,['tide','storm','ember'][i]));console.log(JSON.stringify(results,null,2));
 if(results.some(r=>r.mode!=='won'||r.areas!==AREAS.filter(a=>!a.optional&&!a.endgame).length||r.skills.length!==10||r.enemyAttacks<1||r.hitsTaken<1||!r.bossPhases.includes(2)||!r.bossPhases.includes(3))||results.some(r=>!r.buys||!r.sales||!r.forges))process.exitCode=1;
}
