import {WORLD,SPELLS,AREAS,AREA_BY_ID,ENEMIES,START_EQUIPMENT,RARITIES} from './data.js?v=16';
import {marketStock} from './markets.js?v=16';
import {HUB_LAYOUTS} from './hub-layouts.js?v=16';
import {scaleEnemy} from './balance.js?v=16';
import {makeItem,normalizePlayer,normalizeItem,DROP_TABLES,dropProfile,sellValue,salvageValue} from './loot.js?v=16';
const dist=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.15);
const clone=value=>JSON.parse(JSON.stringify(value));
const unit=(x,y)=>{const n=Math.hypot(x,y)||1;return {x:x/n,y:y/n};};
export const REGION_CAMPS=['canal','highway','forest','skybridge'];
export const ExpeditionRules={
 isUnlocked(id){const area=AREA_BY_ID[id];if(area?.endgame)return this.endgameUnlocked();return Boolean(area&&(this.state.completed||this.state.visited.includes(id)||this.state.cores.filter(c=>c<3).length>=(area.unlockCore||0)));},
 arenaCleared(){const w=this.state.world;if(w.trial)return w.trial.done;if(AREA_BY_ID[this.state.area]?.side)return Boolean(w.sideDone&&!w.enemies.some(e=>!e.dead));return !w.enemies.some(e=>!e.dead)&&w.relays.every(r=>r.status==='online')&&(this.state.zone===3?w.bossDefeated:w.gate?.eliteSpawned);},
 inCamp(point=this.state.player){const camp=this.state.world?.camp;return Boolean(camp&&dist(camp,point)<camp.radius);},
 canTrade(){return this.inCamp()&&['playing','modal'].includes(this.state.mode)&&(!this.state.pending||this.state.pending.type==='shop');},
 routeCachePosition(area){const layout=HUB_LAYOUTS[area.id];if(layout)return {x:layout.cache[0],y:layout.cache[1]};if(REGION_CAMPS.includes(area.id))return {x:area.pocket[0]*WORLD.width,y:area.pocket[1]*WORLD.height};return {x:(area.spawn[0]+(area.exit[0]-area.spawn[0])*.52)*WORLD.width,y:(area.spawn[1]+(area.exit[1]-area.spawn[1])*.52)*WORLD.height};},
 campFor(area){if(area.kind!=='route')return null;return {x:area.spawn[0]*WORLD.width+55,y:area.spawn[1]*WORLD.height-37,radius:180,merchant:{x:area.spawn[0]*WORLD.width+190,y:area.spawn[1]*WORLD.height-110},name:['Waterlijnhandel','Schrootstation','Veldmakers','Horizonpost'][area.zone]};},
 makeStock(zone,areaId){return marketStock(this,zone,areaId);},
 buyItem(uid){if(!this.canTrade())return false;const w=this.state.world,p=this.state.player,index=w.shop.stock.findIndex(i=>i.uid===uid);if(index<0)return false;const item=w.shop.stock[index];if(p.scrap<item.price||p.inventory.length>=48)return false;
  p.scrap-=item.price;w.shop.stock.splice(index,1);p.inventory.push(item);this.notice(item.name+' gekocht · in rugzak');this.emit('loot');this.checkpoint();return item.uid;
 },
 sellItem(uid){return Boolean(this.sellItems([uid]));},
 sellItems(uids){
  if(!this.canTrade()||!Array.isArray(uids)||!uids.length||uids.length>48)return false;
  const p=this.state.player,ids=new Set(uids);if([...ids].some(id=>!Number.isInteger(id)))return false;
  const items=p.inventory.filter(i=>ids.has(i.uid));if(items.length!==ids.size)return false;
  const total=items.reduce((sum,item)=>sum+sellValue(item),0);p.inventory=p.inventory.filter(i=>!ids.has(i.uid));p.scrap+=total;
  this.notice((items.length===1?items[0].name:items.length+' onderdelen')+' verkocht · +'+total+' schroot');this.emit('trade');this.checkpoint();return {count:items.length,total};
 },
 forgeCost(item){return 18+(item.level||1)*5+(item.enhance||0)*17;},
 reinforce(slot){if(!this.canTrade())return false;const p=this.state.player,item=p.equipment[slot],cost=item&&this.forgeCost(item);if(!item||item.enhance>=3||p.scrap<cost)return false;
  const before=this.stats(),hp=p.hp/before.maxHp,mana=p.mana/before.maxMana;p.scrap-=cost;item.enhance=(item.enhance||0)+1;
  const bonus={weapon:{power:.06},suit:{hp:10},relic:{regen:1.4},boots:{speed:.045},gloves:{crit:.03},belt:{armor:.035}}[slot];
  for(const [key,value]of Object.entries(bonus))item.stats[key]=Number(((item.stats[key]||0)+value).toFixed(3));
  p.hp=this.stats().maxHp*hp;p.mana=this.stats().maxMana*mana;this.notice(item.name+' versterkt · +'+item.enhance);this.emit('level');this.checkpoint();return true;
 },
 buySupply(){if(!this.canTrade()||this.state.player.scrap<15||this.state.player.potions>=8)return false;this.state.player.scrap-=15;this.state.player.potions++;this.checkpoint();return true;},
 collectDrop(loot){const p=this.state.player;if(!loot.item)return false;if(!this.state.world.loot.some(i=>i.id===loot.id))return false;if(p.inventory.length>=48){this.notice('Rugzak vol · verkoop of recycle uitrusting');return false;}p.inventory.push(loot.item);this.state.world.loot=this.state.world.loot.filter(i=>i.id!==loot.id);this.notice(RARITIES[loot.item.rarity].name+' · '+loot.item.name+' → rugzak',RARITIES[loot.item.rarity].color);this.emit('loot');this.emit('discovery',{item:loot.item,collected:true});return loot.item.uid;},
 setMainAttack(id){if(!SPELLS[id]||!this.state.player.skills.includes(id))return false;this.state.player.mainAttack=id;this.state.player.spell=id;this.emit('switch',{spell:id});return true;},
 assignRight(id){if(this.challengeBuildLocked())return false;if(!SPELLS[id]||!this.state.player.skills.includes(id))return false;this.state.player.rightAbility=id;this.notice(SPELLS[id].name+' op rechts');return true;},
 castRight(target){const p=this.state.player;return this.cast(p.rightAbility,target);},
 castArea(id,target){const s=this.state,p=s.player,spell=SPELLS[id],point=target||{x:p.x+p.aim.x*300,y:p.y+p.aim.y*220},range=dist(p,point),t=Math.min(1,520/Math.max(1,range));
  const x=p.x+(point.x-p.x)*t,y=p.y+(point.y-p.y)*t,dir=range<1?{...p.aim}:unit(x-p.x,(y-p.y)*1.15);
  const stats=this.stats(),f={id:++this.idCounter,type:id,x,y,r:spell.radius,dir,damage:spell.damage*(1+stats.power+(stats[spell.element]||0)),life:spell.duration,age:0,pulse:0,salvo:0,vx:id==='cyclone'?dir.x*105:0,vy:id==='cyclone'?dir.y*82:0};
  if(id==='orbital')f.strikes=[{x,y,at:.6},{x:x-dir.y*140+dir.x*55,y:y+(dir.x*140+dir.y*55)/1.15,at:1.35},{x:x+dir.y*140+dir.x*55,y:y+(-dir.x*140+dir.y*55)/1.15,at:2.1}].map(point=>({...point,r:100,done:false}));
  s.fields.push(f);return true;
 },
 updateFields(dt){const s=this.state;
  for(const f of s.fields){f.age+=dt;f.life-=dt;f.x+=(f.vx||0)*dt;f.y+=(f.vy||0)*dt;f.pulse-=dt;
   if(f.type==='cyclone')for(const e of s.world.enemies.filter(e=>!e.dead&&!ENEMIES[e.type].boss&&dist(e,f)<f.r)){const n=unit(f.x-e.x,f.y-e.y);this.moveEntity(e,n.x*130*dt,n.y*100*dt);}
   const spell=SPELLS[f.type];
   if(f.type==='orbital'){
    for(const impact of f.strikes.filter(point=>!point.done&&f.age>=point.at)){impact.done=true;this.effect('orbital-strike',impact.x,impact.y,{ability:f.type,color:spell.color,radius:impact.r,life:.7});
     for(const e of s.world.enemies.filter(e=>!e.dead&&dist(e,impact)<impact.r+e.radius))this.hitEnemy(e,f.damage,'ember',true);
     for(const h of s.world.hazards)if(h.type==='spore'&&dist(h,impact)<h.r+impact.r)h.cleared=true;
    }
   }else if(f.pulse<=0){f.pulse+=f.type==='tempest'?.75:f.type==='glacier'?.6:.5;
    let targets=s.world.enemies.filter(e=>!e.dead&&dist(e,f)<f.r+e.radius);
    if(f.type==='glacier')targets=targets.filter(e=>{const dx=e.x-f.x,dy=(e.y-f.y)*1.15;return Math.abs(dx*f.dir.x+dy*f.dir.y)<48+e.radius&&Math.abs(-dx*f.dir.y+dy*f.dir.x)<f.r+e.radius;});
    if(f.type==='tempest'){
     targets.sort((a,b)=>a.id-b.id);const start=targets.length?f.salvo*3%targets.length:0;targets=targets.slice(start).concat(targets.slice(0,start)).slice(0,3);f.salvo++;
     for(const e of targets){this.effect('storm-bolt',e.x,e.y,{ability:'tempest',radius:40,life:.35});this.hitEnemy(e,f.damage,'storm');}
    }else for(const e of targets)this.hitEnemy(e,f.damage,spell.element,true);
   }
  }s.fields=s.fields.filter(f=>f.life>0);
  if(s.ultimateWave){const wave=s.ultimateWave;wave.delay-=dt;if(wave.delay<=0){
    this.executingUltimate=true;for(const e of s.world.enemies.filter(e=>!e.dead&&dist(e,wave)<520)){e.wet=4;this.hitEnemy(e,150*(1+this.stats().power),'storm',true);e.stun=ENEMIES[e.type].boss?.3:1.6;}
    this.executingUltimate=false;this.effect('ultimate-wave',wave.x,wave.y,{color:'#f6df91',radius:520,life:1.8});this.emit('ultimpact');s.ultimateWave=null;
  }}
 },
 relocateRouteCaches(w,area){if(area.kind!=='route')return;const point=this.routeCachePosition(area);for(const loot of w.loot.filter(i=>!i.item&&!i.hiddenSupply&&!i.exploration))Object.assign(loot,point);for(const e of w.enemies.filter(e=>e.cacheGuard&&!e.dead)){Object.assign(e,point);e.home={...point};}},
 migrateExpedition(){
  const s=this.state;normalizePlayer(s.player,()=>++this.idCounter);s.fields=s.fields||[];s.ultimateWave=s.ultimateWave||null;
  for(const [id,w]of Object.entries(s.areas)){const area=AREA_BY_ID[id];if(!area)continue;w.portals=this.portalDefinitions(id);w.camp=this.campFor(area);if(w.camp&&!w.shop)w.shop={stock:this.makeStock(area.zone,area.id),marketVersion:1};w.enemies.forEach(e=>scaleEnemy(e,area.zone,s.player.level));this.relocateRouteCaches(w,area);}
  if(s.checkpoint?.player){normalizePlayer(s.checkpoint.player,()=>++this.idCounter);for(const [id,w]of Object.entries(s.checkpoint.areas||{})){const area=AREA_BY_ID[id];if(!area)continue;w.enemies.forEach(e=>scaleEnemy(e,area.zone,s.checkpoint.player.level));this.relocateRouteCaches(w,area);w.portals=this.portalDefinitions(id);w.camp=this.campFor(area);if(w.camp&&!w.shop)w.shop=clone(s.areas[id]?.shop||{stock:this.makeStock(area.zone,area.id),marketVersion:1});}}
  if(s.pending?.type==='camp'){s.pending=null;s.mode='playing';this.enterArea(REGION_CAMPS[Math.min(3,s.zone+1)]);}
  for(const [id,w]of Object.entries(s.areas)){if(AREA_BY_ID[id]){w.threats||=[];this.prepareHub(w,AREA_BY_ID[id]);}}
  for(const [id,w]of Object.entries(s.checkpoint?.areas||{})){if(AREA_BY_ID[id]){w.threats||=[];this.prepareHub(w,AREA_BY_ID[id]);}}
  s.version=5;
 }
};
