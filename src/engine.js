import { WORLD, SPELLS, ZONES, ENEMIES, EQUIPMENT, START_EQUIPMENT, UPGRADES, DISCIPLINES, POSITIONS, AREAS, AREA_BY_ID, HUB_IDS } from './data.js?v=16';
import {StoryRules} from './story.js?v=16';
import {planNewAttack,executeNewAttack,updateNewThreats} from './enemy-variety.js?v=16';
import {scaleEnemy} from './balance.js?v=16';
import {ExpeditionRules,REGION_CAMPS} from './expedition.js?v=16';
import {makeItem,normalizePlayer,DROP_TABLES,dropProfile,salvageValue} from './loot.js?v=16';
import {HubRules,SAFE_HUBS} from './hubs.js?v=16';
import {REGIONAL_BOSSES,updateBossPhase,updateEncounterState} from './encounters.js?v=16';
import {legendaryCast,legendaryDash,legendaryHit,legendaryKill,triggerLegendary,updateLegendary} from './legendary.js?v=16';
import {updateHeroMotion,heroDirection,heroFrame} from './hero-motion.js?v=16';
import {SurvivalRules,HEAL_COOLDOWN} from './survival.js?v=16';
import {updateEnemyMotion} from './enemy-motion.js?v=16';
import {GambleRules} from './gamble.js?v=16';
import {presentEnemyAttack,launchEnemyLob,updateEnemyLob} from './enemy-combat.js?v=16';
import {EndgameRules} from './endgame.js?v=16';
import {MarketRules} from './markets.js?v=16';
import {QuestRules} from './quests.js?v=16';
import {arenaObstacles,blockedByObstacle,coverHit} from './arena-layouts.js?v=16';
export const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
export const distance = (a,b) => Math.hypot(a.x-b.x,(a.y-b.y)*1.15);
export const normal = (x,y) => { const d=Math.hypot(x,y)||1;return {x:x/d,y:y/d}; };
export const copy = value => JSON.parse(JSON.stringify(value));
export function seeded(seed) { let n=seed>>>0;const random=()=>{n=(n+0x6D2B79F5)>>>0;let t=Math.imul(n^n>>>15,n|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};random.getState=()=>n;return random; }
// Match the open stone court; painted buildings and waterfront are outside this boundary.
const court=points=>points.map(([x,y])=>({x:x*WORLD.width,y:y*WORLD.height}));
export const NAV_ZONES=[
  court([[.22,.24],[.68,.18],[.84,.25],[.88,.47],[.87,.55],[.76,.69],[.61,.72],[.52,.76],[.30,.72],[.20,.65],[.15,.50]]),
  court([[.21,.25],[.40,.16],[.73,.20],[.84,.23],[.89,.34],[.87,.66],[.72,.80],[.50,.76],[.28,.82],[.15,.66],[.10,.47]]),
  court([[.23,.27],[.41,.23],[.55,.20],[.76,.23],[.83,.23],[.89,.40],[.88,.57],[.80,.69],[.68,.76],[.39,.74],[.24,.68],[.13,.50],[.17,.37]]),
  court(Array.from({length:24},(_,i)=>[.51+Math.cos(i*Math.PI/12)*.40,.48+Math.sin(i*Math.PI/12)*.365]))
];
export const NAV=NAV_ZONES[0];
export function inPolygon(x,y,polygon=NAV) {
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
const AREA_FLOORS=Object.fromEntries(AREAS.map(a=>[a.id,a.nav?a.nav.map(court):[NAV_ZONES[a.zone]]]));
export function floors(area=0) {return typeof area==='number'?[NAV_ZONES[area]]:AREA_FLOORS[area]||[NAV];}
export function canStand(x,y,radius=18,area=0) {if(blockedByObstacle(x,y,radius,area))return false;const polygons=floors(area);return [[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]].every(([dx,dy])=>polygons.some(poly=>inPolygon(x+dx,y+dy,poly)));}
const walkGrid=new Map(),CELL=24;
export function clearLine(a,b,area,radius=18){const steps=Math.ceil(distance(a,b)/2);for(let i=0;i<=steps;i++)if(!canStand(a.x+(b.x-a.x)*i/Math.max(1,steps),a.y+(b.y-a.y)*i/Math.max(1,steps),radius,area))return false;return true;}
// Cached navigation lattice. Both the player guide and enemies use the painted floor, including side branches.
export function findPath(a,b,area=0,radius=18){if(clearLine(a,b,area,radius))return [{x:b.x,y:b.y}];const gridKey=area+':'+radius;let grid=walkGrid.get(gridKey);if(!grid){grid=new Map();for(let y=1;y<WORLD.height/CELL;y++)for(let x=1;x<WORLD.width/CELL;x++)if(canStand(x*CELL,y*CELL,radius+2,area))grid.set(x+','+y,{x:x*CELL,y:y*CELL});walkGrid.set(gridKey,grid);}
 const nearest=p=>{let best=null,d=Infinity;for(const [key,v]of grid){const n=Math.hypot(p.x-v.x,p.y-v.y);if(n<d&&clearLine(p,v,area,radius)){d=n;best=key;}}return best;},start=nearest(a),goal=nearest(b);if(!start||!goal)return [];
 const open=[start],g=new Map([[start,0]]),prev=new Map(),done=new Set(),h=k=>distance(grid.get(k),grid.get(goal));let limit=10000;
 while(open.length&&limit--){open.sort((a,b)=>(g.get(a)+h(a))-(g.get(b)+h(b)));const key=open.shift();if(key===goal){const path=[{x:b.x,y:b.y}];let k=goal;while(k!==start){path.unshift(grid.get(k));k=prev.get(k);if(!k)return [];}path.unshift(grid.get(start));let compact=[],anchor=a;for(let i=0;i<path.length;i++){if(i===path.length-1||!clearLine(anchor,path[i+1],area,radius)){compact.push(path[i]);anchor=path[i];}}return compact;}
 done.add(key);const [x,y]=key.split(',').map(Number);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const next=(x+dx)+','+(y+dy);if(!grid.has(next)||done.has(next)||!clearLine(grid.get(key),grid.get(next),area,radius+2))continue;const score=g.get(key)+Math.hypot(dx,dy)*CELL;if(score<(g.get(next)??Infinity)){g.set(next,score);prev.set(next,key);if(!open.includes(next))open.push(next);}}}return [];
}

export class Engine {
  constructor(discipline='tide',seed=Date.now()%1000000) {
    this.rng=seeded(seed);this.idCounter=0;this.events=[];
    this.state={version:5,campaignVersion:1,storyPassed:[],fields:[],ultimateWave:null,seed,zone:0,area:'canal',areas:{},visited:[],destination:null,time:0,runTime:0,mode:'playing',kills:0,combos:0,cores:[],codex:[],score:0,notices:[],player:{...copy(POSITIONS.start),hp:100,mana:110,level:1,xp:0,nextXp:85,spell:discipline,discipline,stats:copy(DISCIPLINES.find(d=>d.id===discipline)?.stats||{}),equipment:copy(START_EQUIPMENT),inventory:[],skills:['tide','storm','ember'],hotbar:['tide','storm','ember',null,null,null],spellCd:{},skillPoints:0,perks:{},potions:3,scrap:0,ultimate:0,attackCd:0,skillCd:0,dashTimer:0,dashCd:0,dashCharges:2,dashRecharge:0,invincible:0,hurt:0,lastHurt:-99,cast:0,wet:0,heat:0,poison:0,facing:1,moving:false,aim:{x:1,y:0},trail:[]},world:null,projectiles:[],effects:[],numbers:[],pending:null,checkpoint:null};
    normalizePlayer(this.state.player,()=>++this.idCounter);this.enterArea('canal');this.state.player.hp=this.stats().maxHp;this.state.player.mana=this.stats().maxMana;
  }
  emit(type,data={}) { this.events.push({type,...data}); }
  takeEvents() { const events=this.events;this.events=[];return events; }
  stats() {
    const p=this.state.player,out={power:0,hp:0,mana:0,regen:0,speed:0,dash:0,crit:.07,armor:0,tide:0,storm:0,ember:0,wetTime:0,chain:0,comboCharge:0,recovery:0,leech:0,waterproof:0,heatGuard:0};
    for(const source of [p.stats,...Object.values(p.equipment).map(i=>i.stats)])for(const [key,value]of Object.entries(source||{}))out[key]=(out[key]||0)+value;
    out.maxHp=100+out.hp;out.maxMana=110+out.mana;out.moveSpeed=215*(1+out.speed);out.manaRegen=13+out.regen;out.dashTime=Math.max(.9,2.5*(1-Math.min(.65,out.dash)));
    return out;
  }
  makeEnemy(type,x,y,elite=false,awake=false) {
    const base=ENEMIES[type],scale=1+this.state.zone*.16;
    const hp=Math.round(base.hp*scale*(elite?1.7:1));
    return scaleEnemy({id:++this.idCounter,level:1+this.state.zone*2+(elite?2:0),home:{x,y},type,x,y,hp,maxHp:hp,radius:base.radius,elite,awake,dead:false,cd:1.1+this.rng(),windup:null,wet:0,burn:0,stun:0,hurt:0,poison:0,phase:1,prevPhase:1,angle:0,anim:this.rng()*6,move:false},this.state.zone,this.state.player.level);
  }
  placeSummon(e){if(canStand(e.x,e.y,e.radius,this.state.area))return e;const wanted={x:e.x,y:e.y};for(let r=24;r<700;r+=24)for(let i=0;i<16;i++){const x=wanted.x+Math.cos(i*Math.PI/8)*r,y=wanted.y+Math.sin(i*Math.PI/8)*r;if(canStand(x,y,e.radius,this.state.area)){Object.assign(e,{x,y,home:{x,y}});return e;}}Object.assign(e,{x:960,y:640,home:{x:960,y:640}});return e;}
  createWorld(area) {
    const s=this.state,w={relays:[],enemies:[],loot:[],pickups:[],threats:[],gate:null,archive:null,hazards:[],portals:this.portalDefinitions(area.id),bossDefeated:false,coreAvailable:false,coreCollected:s.cores.includes(area.zone)};
    const z=ZONES[area.zone];w.camp=this.campFor(area);if(w.camp)w.shop={stock:this.makeStock(area.zone,area.id),marketVersion:1};
    if(area.endgame){this.createChallengeWorld(w,area);
    }else if(area.side){w.sideRound=1;w.sideDone=false;w.coreCollected=true;w.gate={...copy(POSITIONS.exit),open:false,eliteSpawned:false};this.spawnExpeditionWave(w,area);
    }else if(area.kind==='hub'){
      w.relays=[{id:'A',...copy(POSITIONS.relayA),status:'dormant',wave:0},{id:'B',...copy(POSITIONS.relayB),status:'dormant',wave:0}];
      w.gate={...copy(POSITIONS.exit),open:false,eliteSpawned:false};w.archive={...copy(POSITIONS.archive),read:false};
      const packs=area.zone===3?[{x:830,y:790},{x:1330,y:420}]:[{x:660,y:470},{x:1230,y:760},{x:1170,y:440}];
      for(const [i,pack]of packs.entries())for(let j=0;j<2+(area.zone>0?1:0);j++){const angle=j*2.4;w.enemies.push(this.makeEnemy(z.enemies[(i+j)%z.enemies.length],pack.x+Math.cos(angle)*65,pack.y+Math.sin(angle)*55));}
      w.hazards=[{x:730,y:680,r:82},{x:1100,y:905,r:92},{x:1470,y:550,r:76}].map((point,i)=>({...point,id:'terrain-'+i,type:z.hazard,phase:i,cleared:false}));
      if(area.zone===3){w.enemies.push(this.makeEnemy('boss',POSITIONS.boss.x,POSITIONS.boss.y));w.relays.forEach(r=>r.status='online');}
      else if(w.coreCollected){w.relays.forEach(r=>r.status='online');w.enemies=[];w.gate.open=true;w.gate.eliteSpawned=true;w.coreAvailable=true;}
    }else{
      const a=area.spawn,b=area.exit;
      for(let i=0;i<4+(area.zone>0?1:0);i++){const t=.25+i*.115,point={x:(a[0]+(b[0]-a[0])*t)*WORLD.width,y:(a[1]+(b[1]-a[1])*t)*WORLD.height};const type=z.enemies[i%z.enemies.length];if(canStand(point.x,point.y,ENEMIES[type].radius,area.id))w.enemies.push(this.makeEnemy(type,point.x,point.y));}
      const pocket=this.routeCachePosition(area);
      if(['rooftops','vault'].includes(area.id)){const e=this.makeEnemy(area.id==='vault'?'beast':'turret',pocket.x,pocket.y,true);e.cacheGuard=true;w.enemies.push(e);w.loot.push({id:++this.idCounter,...pocket,type:'loot',guarded:true,prototype:true});}
      else w.loot.push({id:++this.idCounter,...pocket,type:'loot'});
      if(area.id==='rooftops'){w.loot.push({id:++this.idCounter,x:425,y:250,type:'loot',exploration:true,profile:'cache'});w.roofExplorationVersion=1;}
      // Hazards sit along the route rather than decorating unreachable scenery.
      w.hazards=[.48,.72].map((t,i)=>({id:'terrain-'+i,x:(a[0]+(b[0]-a[0])*t)*WORLD.width,y:(a[1]+(b[1]-a[1])*t)*WORLD.height,r:46,type:z.hazard,phase:i,cleared:false}));
    }
    this.prepareHub(w,area);return w;
  }
  checkpoint() {const s=this.state;s.checkpoint={area:s.area,zone:s.zone,player:copy(s.player),areas:copy(s.areas),visited:copy(s.visited),kills:s.kills,combos:s.combos,cores:copy(s.cores),codex:copy(s.codex),storyPassed:copy(s.storyPassed||[]),quests:copy(s.quests||{}),campaignVersion:s.campaignVersion};}
  enterZone(zone) {return this.enterArea(HUB_IDS[zone]);}
  enterArea(id,from=null) {
    const area=AREA_BY_ID[id];if(!area)return false;if(!this.isUnlocked(id)){this.notice('Deze route komt vrij na de volgende kalibratiekern');return false;}
    const s=this.state,p=s.player;if(s.world)s.areas[s.area]=s.world;if(area.endgame||area.optional&&s.areas[id]?.sideDone)delete s.areas[id];s.area=id;s.zone=area.zone;s.mode='playing';s.pending=null;s.projectiles=[];s.fields=[];s.ultimateWave=null;s.effects=[];s.numbers=[];
    s.world=s.areas[id]||this.createWorld(area);s.world.portals=this.portalDefinitions(id);s.world.camp=this.campFor(area);if(s.world.camp&&!s.world.shop)s.world.shop={stock:this.makeStock(area.zone,area.id),marketVersion:1};s.areas[id]=s.world;if(!s.visited.includes(id))s.visited.push(id);
    this.prepareHub(s.world,area);s.world.threats||=[];this.syncStoryPortals();
    const spawn=area.kind==='route'?s.world.camp:POSITIONS.start;
    p.x=spawn.x;p.y=spawn.y;p.velocity={x:0,y:0};p.walkBlend=0;p.moving=false;p.poseTurn=0;p.dashTimer=0;p.invincible=1.2;p.trail=[];p.lastHurt=s.time;
    this.reconcileArena();
    if(s.destination===id)s.destination=null;
    this.checkpoint();this.notice(area.name+(s.world.camp?' · veilige handelspost':''),ZONES[area.zone].accent);this.emit('zone',{zone:area.zone,area:id});return true;
  }
  notice(text,color='#ead8a5') {this.state.notices.unshift({text,color,life:4.5});this.state.notices=this.state.notices.slice(0,4);}
  selectSpell(spell) {return this.setMainAttack(spell);}
  aimAt(x,y) {const p=this.state.player;p.aimRange=distance(p,{x,y});p.aim=normal(x-p.x,(y-p.y)*1.15);if(!p.moving)p.facing=p.aim.x<0?-1:1;}
  castSlot(slot,target){const spell=this.state.player.hotbar[slot];return spell?this.cast(spell,target):false;}
  assignSkill(spell,slot){if(this.challengeBuildLocked())return false;const p=this.state.player;if(!SPELLS[spell]||!p.skills.includes(spell)||!Number.isInteger(slot)||slot<0||slot>5)return false;p.hotbar[slot]=spell;return true;}
  clearSkillSlot(slot){if(this.challengeBuildLocked())return false;if(!Number.isInteger(slot)||slot<0||slot>5)return false;this.state.player.hotbar[slot]=null;return true;}
  cast(id=this.state.player.mainAttack,target=null) {
    const s=this.state,p=s.player,spell=SPELLS[id];
    if(!spell||s.mode!=='playing'||this.inCamp()||!p.skills.includes(id)||(p.spellCd[id]||0)>0||p.mana<spell.cost||p.dashTimer>0)return false;
    if(target)this.aimAt(target.x,target.y);p.lastAbility=id;p.spellCd[id]=spell.interval;p.attackCd=spell.interval;p.mana-=spell.cost;p.cast=.18;
    if(spell.area){this.castArea(id,target);this.emit('cast',{spell:id});return true;}
    const dir=p.aim,stats=this.stats(),damage=spell.damage*(1+stats.power+(stats[id]||0)),origin={x:p.x,y:p.y-18},group=++this.idCounter;
    const bolt=(type,dx,dy)=>({id:++this.idCounter,group,team:'player',type,x:p.x+dx*32,y:p.y+dy*24-18,origin,dir:{x:dx,y:dy},vx:dx*spell.speed,vy:dy*spell.speed/1.15,damage,radius:spell.radius,life:1.45,trail:[],age:0,hitIds:[]});
    if(id==='storm'){
      const end={x:origin.x+dir.x*650,y:origin.y+dir.y*650/1.15},hits=s.world.enemies.filter(e=>!e.dead&&segmentDistance(origin,end,{x:e.x,y:e.y-22})<e.radius+16).sort((a,b)=>distance(p,a)-distance(p,b));
      const hit=hits[0];this.effect('chain',origin.x,origin.y,{end:hit?{x:hit.x,y:hit.y-22}:end,color:spell.color,life:.28});if(hit)this.hitEnemy(hit,damage,'storm');
    }else if(id==='prism'){s.projectiles.push({...bolt(id,dir.x,dir.y),bounces:2,life:1.4});
    }else if(id==='tide'){
      const angle=Math.atan2(dir.y,dir.x);for(const offset of [-.19,0,.19])s.projectiles.push({...bolt('tide',Math.cos(angle+offset),Math.sin(angle+offset)),pierce:2});p.heat=Math.max(0,p.heat-.55);
    }else if(id==='ember'){
      const length=clamp(p.aimRange||350,90,590),end={x:p.x+dir.x*length,y:p.y+dir.y*length/1.15-18};s.projectiles.push({...bolt('ember',dir.x,dir.y),origin,end,duration:.48+length/1600,life:1.2,flightHeight:0});
    }else s.projectiles.push({...bolt(id,dir.x,dir.y),life:id==='gravity'?1.65:id==='gale'?1.6:1.1});
    legendaryCast(this,id,damage);this.emit('cast',{spell:id});return true;
  }
  special(target) {
    const s=this.state,p=s.player;if(s.mode!=='playing'||this.inCamp()||p.skillCd>0||p.mana<28)return false;
    p.mana-=28;p.skillCd=6;p.cast=.35;
    const point=target||{x:p.x+p.aim.x*200,y:p.y+p.aim.y*150};
    const range=distance(p,point);const multiplier=Math.min(1,450/Math.max(1,range));
    const x=p.x+(point.x-p.x)*multiplier,y=p.y+(point.y-p.y)*multiplier;
    if(p.spell==='tide'){
      this.effect('nova',p.x,p.y,{color:SPELLS.tide.color,radius:210,life:.65});
      for(const e of s.world.enemies.filter(e=>!e.dead&&distance(e,p)<210)){this.hitEnemy(e,28,'tide');e.stun=ENEMIES[e.type].boss?.2:.8;const n=normal(e.x-p.x,e.y-p.y);this.moveEntity(e,n.x*50,n.y*40);}
      p.wet=0;p.heat=0;p.poison=0;
    }else if(p.spell==='storm'){
      this.effect('storm',x,y,{color:SPELLS.storm.color,radius:135,life:.9});
      for(const e of s.world.enemies.filter(e=>!e.dead&&distance(e,{x,y})<145)){this.hitEnemy(e,42,'storm');e.stun=ENEMIES[e.type].boss?.35:1.2;}
    }else if(p.spell==='ember'){
      this.effect('eruption',x,y,{color:SPELLS.ember.color,radius:145,life:.7});
      s.world.hazards.push({id:'fire-'+ ++this.idCounter,x,y,r:135,type:'friendlyFire',life:4,cleared:false});
      for(const h of s.world.hazards)if(h.type==='spore'&&distance(h,{x,y})<h.r+120)h.cleared=true;
      for(const e of s.world.enemies.filter(e=>!e.dead&&distance(e,{x,y})<150))this.hitEnemy(e,40,'ember');
    }
    if(p.spell==='frost'){this.effect('nova',x,y,{color:SPELLS.frost.color,radius:175,life:.8});for(const e of s.world.enemies.filter(e=>!e.dead&&distance(e,{x,y})<175)){this.hitEnemy(e,30,'frost');e.stun=ENEMIES[e.type].boss?.2:1.4;}}
    if(p.spell==='gale'){this.effect('nova',p.x,p.y,{color:SPELLS.gale.color,radius:230,life:.6});for(const e of s.world.enemies.filter(e=>!e.dead&&distance(e,p)<230)){this.hitEnemy(e,32,'gale');const n=normal(e.x-p.x,e.y-p.y);this.moveEntity(e,n.x*100,n.y*75);}p.invincible=.6;}
    if(p.spell==='gravity'){s.projectiles.push({id:++this.idCounter,team:'player',type:'gravity',x,y,vx:0,vy:0,damage:60,radius:30,life:2,age:0,trail:[],hitIds:[]});this.effect('nova',x,y,{color:SPELLS.gravity.color,radius:180,life:1});}
    this.emit('special',{spell:p.spell});return true;
  }
  ultimate() {
    const s=this.state,p=s.player;if(s.mode!=='playing'||this.inCamp()||p.ultimate<100||p.ultimateCooldown>0)return false;
    p.ultimate=0;p.ultimateCooldown=40;p.invincible=1.5;p.cast=.7;p.hp=Math.min(this.stats().maxHp,p.hp+20);p.mana=Math.min(this.stats().maxMana,p.mana+35);
    s.ultimateWave={x:p.x,y:p.y,delay:.5};this.effect('ultimate-charge',p.x,p.y,{color:'#f6df91',radius:180,life:.6});
    this.notice('AURELIA · KERNPULS','#ffe4a0');this.emit('ultimate');return true;
  }
  dash(dx,dy) {
    const s=this.state,p=s.player;if(s.mode!=='playing'||p.dashCharges<1||p.dashTimer>0)return false;
    const dir=dx||dy?normal(dx,dy):normal(p.aim.x,p.aim.y);p.velocity={x:0,y:0};p.dashDir=dir;p.dashTimer=.23;p.invincible=.36;p.dashCharges--;p.dashRecharge=p.dashRecharge||this.stats().dashTime;if(!this.inCamp())legendaryDash(this);this.emit('dash');return true;
  }
  heal() {
    const s=this.state,p=s.player;if(s.mode!=='playing'||p.potions<1||p.healCooldown>0||p.hp>=this.stats().maxHp)return false;
    const healed=Math.min(45,this.stats().maxHp-p.hp);p.potions--;p.healCooldown=HEAL_COOLDOWN;p.hp+=healed;p.heat=0;this.effect('heal',p.x,p.y,{color:'#a8e9b0',radius:75,life:.7});this.number(p.x,p.y,'+'+Math.round(healed),'#b4efbc');this.emit('heal');return true;
  }
  moveEntity(entity,dx,dy) {
    const nx=entity.x+dx,ny=entity.y+dy;if(entity.type&&this.inCamp({x:nx,y:ny}))return;
    if(canStand(nx,ny,entity.radius||18,this.state.area)){entity.x=nx;entity.y=ny;return;}
    if(canStand(nx,entity.y,entity.radius||18,this.state.area))entity.x=nx;
    if(canStand(entity.x,ny,entity.radius||18,this.state.area))entity.y=ny;
  }
  interaction() {
    const s=this.state,p=s.player,w=s.world;
    if(s.mode!=='playing')return null;this.syncStoryPortals();
    const npc=this.nearbyQuestNPC();if(npc)return {type:'quest',entity:npc,label:npc.name+' · Noodstroom',key:'F'};
    const service=this.nearbyService(),nearLoot=w.loot.find(item=>distance(p,item)<100&&(!item.guarded||!w.enemies.some(e=>!e.dead&&e.cacheGuard)));if(service&&(!nearLoot||distance(p,service)<distance(p,nearLoot)))return {type:'shop',entity:service,label:service.name+' · '+service.title,key:'F'};
    if(w.camp&&!w.camp.services&&distance(p,w.camp.merchant)<115)return {type:'shop',entity:w.camp,label:'Handelen & versterken',key:'F'};
    const loot=w.loot.find(item=>distance(p,item)<100&&(!item.guarded||!w.enemies.some(e=>!e.dead&&e.cacheGuard)));if(loot)return {type:'loot',entity:loot,label:loot.quest?'Berg Nora’s meetspoel':loot.item?'Pak '+loot.item.name:loot.prototype?'Open prototypekist':'Open veldkist',key:'F'};
    const relay=w.relays.find(r=>r.status==='dormant'&&distance(p,r)<105);if(relay&&s.zone<3)return {type:'relay',entity:relay,label:'Start kalibratie '+relay.id,key:'F'};
    const guarded=w.loot.find(i=>i.guarded&&distance(p,i)<100&&w.enemies.some(e=>!e.dead&&e.cacheGuard));if(guarded)return {type:'guardedLoot',entity:guarded,label:'Versla eerst de kistbewaker',key:'F'};
    const ready=w.relays.find(r=>r.status==='online'&&distance(p,r)<100);if(ready&&p.hp<this.stats().maxHp&&!ready.used)return {type:'restore',entity:ready,label:'Herstel bij de bron',key:'F'};
    if(w.gate&&this.arenaCleared()&&!w.coreCollected&&distance(p,w.gate)<115)return {type:s.zone===3?'win':'travel',entity:w.gate,label:s.zone===3?'Activeer Aurelia':'Berg kern & terug naar handelskamp',key:'F'};
    const portal=(this.portalReady()?w.portals:[]).find(portal=>distance(p,portal)<85);if(portal)return {type:portal.locked?'lockedPortal':'portal',entity:portal,label:portal.locked?portal.reason:'Reis naar '+AREA_BY_ID[portal.to].name,key:'F'};
    if(w.archive&&distance(p,w.archive)<90&&!w.archive.read)return {type:'archive',entity:w.archive,label:'Lees veldarchief',key:'F'};
    return null;
  }
  interact() {
    const s=this.state,action=this.interaction();if(!action)return false;
    if(action.type==='guardedLoot'){this.notice('Deze kist is bewaakt · versla de elite ernaast');return false;}
    if(action.type==='lockedPortal'){this.notice(action.entity.reason);return false;}
    if(action.type==='quest'){s.mode='modal';s.pending={type:'quest',npc:action.entity.id};}else if(action.type==='shop'){if(!this.canTrade())return false;s.mode='modal';s.pending={type:'shop',service:action.entity.id||'smith'};}else if(action.type==='relay'){
      action.entity.status='defending';action.entity.wave=1;this.spawnRelayWave(action.entity);this.emit('relay');
    }else if(action.type==='restore'){
      action.entity.used=true;s.player.hp=Math.min(this.stats().maxHp,s.player.hp+35);s.player.mana=this.stats().maxMana;s.player.heat=0;s.player.poison=0;this.number(s.player.x,s.player.y,'+35','#bcf2c7');this.emit('heal');
    }else if(action.type==='archive'){
      action.entity.read=true;const z=ZONES[s.zone];s.codex.push({zone:s.zone,title:z.core,body:z.log});s.mode='modal';s.pending={type:'archive',title:z.core,body:z.log};
    }else if(action.type==='portal'){return this.enterArea(action.entity.to,s.area);
    }else if(action.type==='loot'){
      if(action.entity.quest)return this.collectQuestRecovery(action.entity);
      if(action.entity.item)return this.collectDrop(action.entity);s.mode='modal';s.pending={type:'loot',item:action.entity,choices:this.lootChoices(action.entity.prototype,action.entity.profile)};
    }else if(action.type==='travel'){
      if(!s.cores.includes(s.zone))s.cores.push(s.zone);s.world.coreCollected=true;const camp=REGION_CAMPS[s.zone];this.enterArea(camp);this.notice('Kern geborgen · volgende hoofdstuk: '+AREA_BY_ID[this.recommendedArea()].name);
    }else if(action.type==='win'){
      s.cores=[0,1,2,3];s.world.coreCollected=true;s.mode='won';s.score=Math.max(1000,5000-Math.round(s.runTime)*2+s.kills*30+s.combos*45+s.codex.length*100+s.player.scrap*5);this.emit('win');
    }
    return true;
  }
  spawnExpeditionWave(w,area){
    const types=area.enemies||ZONES[area.zone].enemies,total=5+area.zone;
    for(let i=0;i<total;i++){const angle=i*Math.PI*2/total+(.25*w.sideRound),point={x:990+Math.cos(angle)*360,y:660+Math.sin(angle)*220};const type=types[(i+w.sideRound-1)%types.length];w.enemies.push(this.placeSummon(this.makeEnemy(type,point.x,point.y,false,w.sideRound>1)));}
    if(w.sideRound===2){const guard=this.placeSummon(this.makeEnemy(area.guardian||['sentinel','siege','sporecaster','siege'][area.zone],1330,570,true,true));guard.guardian=!area.optional;w.enemies.push(guard);}
  }
  spawnRelayWave(relay) {
    const s=this.state,r=relay,total=3+s.zone;
    for(let i=0;i<total;i++){let point;for(let attempt=0;attempt<30;attempt++){const angle=this.rng()*Math.PI*2;point={x:r.x+Math.cos(angle)*240,y:r.y+Math.sin(angle)*185};if(canStand(point.x,point.y,30,s.area))break;}if(!canStand(point.x,point.y,30,s.area))point={x:960+i*45,y:640};const e=this.makeEnemy(ZONES[s.zone].enemies[(i+r.wave-1)%ZONES[s.zone].enemies.length],point.x,point.y,i===total-1&&r.wave===2&&s.zone>0,true);e.relayId=r.id;e.cd=.75+this.rng()*.4;s.world.enemies.push(e);this.effect('spawn',e.x,e.y,{color:'#e39b7b',radius:50,life:.7});}
    this.notice('Station '+r.id+' · kalibratiegolf '+r.wave+' / 2');
  }
  lootChoices(prototype=false,profile='cache') {return Array.from({length:3},()=>makeItem({rng:this.rng,level:1+this.state.zone*2,profile:prototype?'prototype':profile||'cache',uid:++this.idCounter}));}
  chooseLoot(index) {
    const s=this.state,choice=s.pending?.type==='loot'&&s.pending.choices?.[index];if(!choice)return null;if(s.player.inventory.length>=48){this.notice('Rugzak vol · recycle de vondst of maak eerst ruimte');return null;}
    const item={...copy(choice),uid:++this.idCounter};s.player.inventory.push(item);this.markStoryCache(s.pending.item);s.world.loot=s.world.loot.filter(item=>item.id!==s.pending.item.id);this.notice(choice.name+' → rugzak');s.pending=null;s.mode='playing';this.emit('loot');this.emit('discovery',{item,collected:true});return item.uid;
  }
  equipItem(uid){if(this.challengeBuildLocked())return false;const p=this.state.player,index=p.inventory.findIndex(i=>i.uid===uid);if(index<0)return false;const item=p.inventory[index];if(p.level<(item.requiredLevel||1))return false;const old=p.equipment[item.slot],stats=this.stats(),hpFraction=p.hp/stats.maxHp,manaFraction=p.mana/stats.maxMana;p.inventory.splice(index,1);p.inventory.push({...old,uid:old.uid||++this.idCounter});p.equipment[item.slot]=item;p.hp=Math.min(this.stats().maxHp,this.stats().maxHp*hpFraction);p.mana=Math.min(this.stats().maxMana,this.stats().maxMana*manaFraction);this.notice(item.name+' uitgerust');return true;}
  recycleItem(uid){const p=this.state.player,index=p.inventory.findIndex(i=>i.uid===uid);if(index<0)return false;const item=p.inventory.splice(index,1)[0];p.scrap+=salvageValue(item);return true;}
  recycleLoot() {const s=this.state;if(s.pending?.type!=='loot')return;s.player.scrap+=14;this.markStoryCache(s.pending.item);s.world.loot=s.world.loot.filter(item=>item.id!==s.pending.item.id);s.pending=null;s.mode='playing';this.notice('+14 schroot');}
  upgradeChoices(){const p=this.state.player;return [...Object.entries(SPELLS).filter(([id,spell])=>!p.skills.includes(id)&&!spell.shopOnly&&p.level>=spell.unlockLevel).map(([id,spell])=>({id,skill:true,name:spell.name,icon:id,text:spell.description})),...copy(UPGRADES)];}
  purchaseUpgrade(upgrade){if(this.challengeBuildLocked())return false;const p=this.state.player;if(!upgrade||p.skillPoints<1)return false;
    if(upgrade.skill){const spell=SPELLS[upgrade.id];if(!spell||spell.shopOnly||p.skills.includes(upgrade.id)||p.level<spell.unlockLevel)return false;p.skills.push(upgrade.id);const slot=p.hotbar.indexOf(null);if(slot>=0)p.hotbar[slot]=upgrade.id;this.notice(spell.name+' geleerd'+(slot>=0?' · slot '+(slot+1):' · plaats via K'),spell.color);}
    else{const entry=UPGRADES.find(u=>u.id===upgrade.id);if(!entry)return false;for(const [key,val]of Object.entries(entry.stats))p.stats[key]=(p.stats[key]||0)+val;p.perks[entry.id]=(p.perks[entry.id]||0)+1;p.hp=Math.min(this.stats().maxHp,p.hp+(entry.heal||10));}
    p.skillPoints--;p.mana=this.stats().maxMana;this.emit('level');return true;
  }
  chooseUpgrade(index) {const s=this.state,upgrade=s.pending?.type==='upgrade'&&s.pending.choices?.[index];if(!this.purchaseUpgrade(upgrade))return false;s.pending=null;s.mode='playing';return true;}
  deferUpgrade(){if(this.state.pending?.type==='upgrade'){this.state.pending=null;this.state.mode='playing';}}
  closeModal() {if(this.state.mode==='modal'&&['archive','shop','quest','trialResult'].includes(this.state.pending?.type)){this.state.pending=null;this.state.mode='playing';}}
  retry() {
    const s=this.state;if(s.world?.trial)return this.restartChallenge();const c=s.checkpoint;if(!c)return;
    s.player=copy(c.player);s.kills=c.kills;s.combos=c.combos;s.cores=copy(c.cores);s.codex=copy(c.codex);s.areas=copy(c.areas);s.visited=copy(c.visited);s.storyPassed=copy(c.storyPassed||[]);s.quests=copy(c.quests||{});s.campaignVersion=c.campaignVersion;s.area=c.area;s.world=null;s.player.hp=this.stats().maxHp;s.player.potions=Math.max(2,s.player.potions);this.enterArea(c.area);this.emit('checkpoint');
  }
  number(x,y,text,color='#fff1c1',size=18) {this.state.numbers.push({x,y:y-38,text:String(text),color,size,life:.85});}
  effect(type,x,y,props={}) {this.state.effects.push({type,x,y,age:0,life:props.life||.6,...props});}
  hitEnemy(enemy,damage,element,secondary=false) {
    if(enemy.dead||enemy.hidden)return;
    const s=this.state,p=s.player,stats=this.stats();let multiplier=1,combo=null;
    if(element==='storm'&&enemy.wet>0){multiplier=1.7;if(!enemy.resolve){enemy.stun=ENEMIES[enemy.type].boss?.12:.25;enemy.resolve=1.6;}if(!secondary&&!enemy.comboCd)combo='GELEIDING';}
    if(element==='ember'&&enemy.wet>0){multiplier=1.35;enemy.wet=0;enemy.stun=ENEMIES[enemy.type].boss?.18:.65;if(!secondary&&!enemy.comboCd)combo='STOOMGOLF';this.effect('steam',enemy.x,enemy.y,{radius:100,color:'#e1f3eb',life:.8});if(!secondary)for(const nearby of s.world.enemies.filter(e=>e!==enemy&&!e.dead&&distance(e,enemy)<110))this.hitEnemy(nearby,12,'physical',true);}
    if(element==='frost'&&enemy.wet>0)multiplier=1.2;
    if(enemy.type==='sentinel'&&!enemy.windup){const n=normal(p.x-enemy.x,(p.y-enemy.y)*1.15);if(n.x*Math.cos(enemy.angle)+n.y*Math.sin(enemy.angle)>.35)multiplier*=.7;}
    if(enemy.type==='shieldguard'&&!enemy.windup){const n=normal(p.x-enemy.x,(p.y-enemy.y)*1.15);if(n.x*Math.cos(enemy.angle)+n.y*Math.sin(enemy.angle)>.35)multiplier*=.48;}
    const crit=this.rng()<stats.crit;const dealt=damage*multiplier*(crit?1.6:1);enemy.hp-=dealt;enemy.hurt=.13;enemy.awake=true;
    if(element==='tide'){enemy.wet=4+stats.wetTime;enemy.burn=0;}
    if(element==='frost'){enemy.slow=2.5;if(enemy.wet>0){enemy.stun=ENEMIES[enemy.type].boss?.18:.65;}}
    if(element==='gale'&&!secondary&&enemy.type!=='boss'){const n=normal(enemy.x-p.x,enemy.y-p.y);this.moveEntity(enemy,n.x*32,n.y*24);}
    if(element==='ember')enemy.burn=3*(1+(stats.burnTime||0));
    if(combo){enemy.comboCd=1.6;s.combos++;if(!this.executingUltimate)p.ultimate=Math.min(100,p.ultimate+4*(1+stats.comboCharge));this.number(enemy.x,enemy.y-15,combo,SPELLS[element].color,14);this.emit('combo',{element});}
    if(!this.executingUltimate)p.ultimate=Math.min(100,p.ultimate+Math.min(dealt,Math.max(0,enemy.hp+dealt))*.0325);this.number(enemy.x+(this.rng()-.5)*20,enemy.y,crit?Math.round(dealt)+'!':Math.round(dealt),crit?'#fff0a8':SPELLS[element]?.color||'#e6ecd4',crit?25:18);
    this.effect('impact',enemy.x,enemy.y-25,{color:SPELLS[element]?.color||'#e8d7a1',radius:35,life:.26});this.emit('hit',{crit});
    if(element==='storm'&&!secondary&&multiplier>1){const near=s.world.enemies.filter(e=>e!==enemy&&!e.dead&&distance(e,enemy)<210).sort((a,b)=>distance(a,enemy)-distance(b,enemy)).slice(0,2+stats.chain);for(const e of near){this.effect('chain',enemy.x,enemy.y-20,{end:{x:e.x,y:e.y-25},color:SPELLS.storm.color,life:.2});this.hitEnemy(e,damage*.55,'storm',true);}}
    legendaryHit(this,enemy,damage,element,secondary);if(enemy.hp<=0)this.killEnemy(enemy);
  }
  killEnemy(enemy) {
    if(enemy.dead)return;enemy.dead=true;const s=this.state,p=s.player,base=ENEMIES[enemy.type];if(!enemy.noReward){s.kills++;p.xp+=base.xp*(enemy.elite?2:1);p.scrap+=base.boss?22:enemy.elite?9:2;if(!this.executingUltimate)p.ultimate=Math.min(100,p.ultimate+2);p.hp=Math.min(this.stats().maxHp,p.hp+this.stats().leech);}this.effect('death',enemy.x,enemy.y,{color:base.color,radius:75,life:.65});
    legendaryKill(this,enemy);if(enemy.noReward){if(s.world.trial){s.world.trial.kills++;if(enemy.trialEnemy)p.hp=Math.min(this.stats().maxHp,p.hp+this.stats().leech);}this.emit('kill');return;}
    const drop=this.dropGround(enemy);
    if(this.rng()<.10)s.world.pickups.push({id:++this.idCounter,x:drop.x,y:drop.y,type:'health',amount:15});
    const profile=dropProfile(enemy),table=DROP_TABLES[profile]||DROP_TABLES.raider;const loose=s.world.loot.filter(i=>i.item).length,major=['guardian','boss'].includes(profile),chance=major?table.chance:loose>=7?0:table.chance*Math.max(.35,1-loose*.1);if(this.rng()<chance){const item=makeItem({rng:this.rng,level:enemy.level||1+s.zone*2,profile,rarity:major&&(p.majorDryStreak||0)>=7?'legendary':null,uid:++this.idCounter});if(major)p.majorDryStreak=item.rarity==='legendary'?0:(p.majorDryStreak||0)+1;s.world.loot.push({id:++this.idCounter,x:drop.x,y:drop.y,type:'loot',item,source:enemy.type});if(['rare','epic','legendary'].includes(item.rarity)){this.effect('loot-reveal',drop.x,drop.y,{rarity:item.rarity,radius:85,life:1.1});this.emit('discovery',{item,found:true});}}
    if(base.boss&&enemy.type!=='boss'){this.notice(base.name+' verslagen · de kern ligt klaar','#ffe4a0');this.emit('bossdead');}
    if(enemy.type==='boss'){s.world.bossDefeated=true;s.world.gate.open=true;s.world.coreAvailable=true;this.notice('De Gouden Kern is vrij · activeer de hoofdconsole','#ffe4a0');this.emit('bossdead');}
    this.emit('kill');
  }
  dropGround(point){
    const area=this.state.area;if(canStand(point.x,point.y,22,area))return {x:point.x,y:point.y};
    // A jumping enemy can die over solid cover. Keep the earned drop nearby,
    // with enough clearance to reach it, without changing reward probabilities.
    for(let r=8;r<720;r+=8)for(let i=0;i<24;i++){const x=point.x+Math.cos(i*Math.PI/12)*r,y=point.y+Math.sin(i*Math.PI/12)*r;if(canStand(x,y,22,area))return {x,y};}
    return {x:this.state.player.x,y:this.state.player.y};
  }
  reconcileArena(){
    const s=this.state;if(!arenaObstacles(s.area).length)return;
    if(blockedByObstacle(s.player.x,s.player.y,18,s.area))Object.assign(s.player,this.dropGround(s.player),{velocity:{x:0,y:0}});
    for(const e of s.world.enemies)if(!e.dead&&!e.leap&&blockedByObstacle(e.x,e.y,e.radius,s.area))this.placeSummon(e);
    for(const item of [...s.world.loot,...s.world.pickups])if(blockedByObstacle(item.x,item.y,22,s.area))Object.assign(item,this.dropGround(item));
  }
  hurtPlayer(amount,type='physical') {
    const s=this.state,p=s.player,ongoing=type==='venom';if(this.inCamp()||(!ongoing&&p.invincible>0)||s.mode!=='playing')return;
    if(type==='venomHit')this.applyVenom();
    let damage=ongoing?amount:Math.max(1,amount*(1-Math.min(.55,this.stats().armor))*(type==='electric'&&p.wet>0?1.35:1));if(!ongoing&&p.wardTime>0&&p.ward>0){const absorb=Math.min(p.ward,damage);p.ward-=absorb;damage-=absorb;this.number(p.x,p.y,'SCHILD −'+Math.round(absorb),'#ffe0a0',14);}p.hp-=damage;if(!ongoing)p.invincible=.35;p.hurt=.25;p.lastHurt=s.time;
    if(damage>0)triggerLegendary(this,'hurt');
    this.number(p.x,p.y,Math.round(damage),ongoing?'#b4ef75':'#ff958b',23);this.emit('hurt');if(p.hp<=0){p.hp=0;s.mode='dead';this.emit('dead');}
  }
  update(dt,input={}) {
    const s=this.state;if(s.mode!=='playing')return;if(this.updateChallengeCountdown(dt))return;s.time+=dt;s.runTime+=dt;
    const p=s.player,stats=this.stats();
    this.updateSurvival(dt);if(s.mode!=='playing')return;
    updateLegendary(p,dt);p.rootSlow=Math.max(0,(p.rootSlow||0)-dt);
    for(const key of Object.keys(p.spellCd))p.spellCd[key]=Math.max(0,p.spellCd[key]-dt);
    for(const key of ['attackCd','skillCd','ultimateCooldown','invincible','hurt','cast','wet','poison'])p[key]=Math.max(0,(p[key]||0)-dt);
    if(p.dashCharges<2){p.dashRecharge-=dt;if(p.dashRecharge<=0){p.dashCharges++;p.dashRecharge=p.dashCharges<2?stats.dashTime:0;}}
    p.mana=Math.min(stats.maxMana,p.mana+dt*stats.manaRegen);
    if(stats.recovery&&s.time-p.lastHurt>5)p.hp=Math.min(stats.maxHp,p.hp+dt*stats.recovery);
    const dir=normal(input.x||0,input.y||0),wantsMove=Boolean(input.x||input.y);
    let speed=stats.moveSpeed*Math.min(1,Math.hypot(input.x||0,input.y||0));if(p.wet&&!stats.waterproof)speed*=.8;if(p.rootSlow>0)speed*=.65;
    const velocity=p.velocity||(p.velocity={x:0,y:0}),response=1-Math.exp(-dt/(wantsMove?.055:.07));
    velocity.x+=(dir.x*speed-velocity.x)*response;velocity.y+=(dir.y*speed*.78-velocity.y)*response;
    if(!wantsMove&&Math.hypot(velocity.x,velocity.y)<2)velocity.x=velocity.y=0;
    p.walkBlend=Math.min(1,Math.hypot(velocity.x,velocity.y/.78)/stats.moveSpeed);p.moving=p.walkBlend>.025;
    const walkFrom={x:p.x,y:p.y},wasDashing=p.dashTimer>0;
    if(p.moving){p.moveLookUp=velocity.y<-12;p.moveFacing=velocity.x<-12?-1:velocity.x>12?1:p.moveFacing||1;p.lookUp=p.moveLookUp;}
    else if(input.shoot&&input.aim)p.lookUp=input.aim.y<p.y-35;
    if(p.dashTimer>0){p.dashTimer=Math.max(0,p.dashTimer-dt);this.moveEntity(p,p.dashDir.x*880*dt,p.dashDir.y*710*dt);p.trail.push({x:p.x,y:p.y,life:.22,direction:heroDirection(p.dashDir.x,p.dashDir.y,p.poseDirection??0),frame:heroFrame(p)});}
    else if(p.moving){const old={x:p.x,y:p.y};this.moveEntity(p,velocity.x*dt,velocity.y*dt);if(p.x===old.x)velocity.x=0;if(p.y===old.y)velocity.y=0;if(!input.shoot)p.facing=velocity.x<-10?-1:velocity.x>10?1:p.facing;}
    p.trail.forEach(t=>t.life-=dt);p.trail=p.trail.filter(t=>t.life>0);
    if(input.aim)this.aimAt(input.aim.x,input.aim.y);
    updateHeroMotion(p,p.x-walkFrom.x,p.y-walkFrom.y,dt,stats.moveSpeed,wasDashing);
    if(input.shoot)this.cast();for(const slot of input.slots||[])this.castSlot(slot,input.aim);if(input.right)this.castRight(input.aim);
    this.updateFields(dt);updateNewThreats(this,dt);this.updateHazards(dt);
    const enemyPositions=new Map(s.world.enemies.map(e=>[e.id,{x:e.x,y:e.y}]));this.updateEnemies(dt);
    for(const e of s.world.enemies){const old=enemyPositions.get(e.id)||e;updateEnemyMotion(e,e.x-old.x,e.y-old.y,dt);}
    this.updateProjectiles(dt);
    for(const pickup of s.world.pickups){const d=distance(p,pickup);if(d<120){const v=normal(p.x-pickup.x,p.y-pickup.y);pickup.x+=v.x*210*dt;pickup.y+=v.y*170*dt;}if(d<30){pickup.collected=true;p.hp=Math.min(stats.maxHp,p.hp+pickup.amount);this.number(p.x,p.y,'+'+pickup.amount,'#b3edaa');}}
    s.world.pickups=s.world.pickups.filter(item=>!item.collected);
    for(const r of s.world.relays){if(r.status==='defending'&&!s.world.enemies.some(e=>!e.dead&&e.relayId===r.id)){if(r.wave<2){r.wave++;this.spawnRelayWave(r);continue;}r.status='online';this.effect('relay',r.x,r.y,{color:'#96eedc',radius:180,life:1.4});this.notice('Station '+r.id+' online · bron hersteld','#a2ebd9');this.emit('relaydone');s.world.loot.push({id:++this.idCounter,x:r.x+75,y:r.y+65,type:'loot',profile:'station'});
      const local=s.world.hazards.filter(h=>h.life===undefined&&!h.cleared).sort((a,b)=>distance(a,r)-distance(b,r))[0];if(local){local.cleared=true;this.effect('relay',local.x,local.y,{color:'#96eedc',radius:local.r,life:1.2});}
    }}
    if(AREA_BY_ID[s.area].side&&!s.world.sideDone&&!s.world.enemies.some(e=>!e.dead)){
      if(s.world.sideRound<2){s.world.sideRound=2;this.spawnExpeditionWave(s.world,AREA_BY_ID[s.area]);this.notice('Expeditie · groep 2 / 2 · elitebewaker ontwaakt');}
      else{s.world.sideDone=true;s.world.gate.eliteSpawned=true;s.world.gate.open=true;s.world.loot.push({id:++this.idCounter,x:POSITIONS.exit.x-110,y:POSITIONS.exit.y+65,type:'loot',profile:AREA_BY_ID[s.area].optional?'cache':'expedition',expeditionReward:true});if(AREA_BY_ID[s.area].optional){const reward=35+s.zone*20;p.scrap+=reward;this.notice('Berging voltooid · +'+reward+' schroot');}else this.notice('Expeditie voltooid · beloning en terugportal vrij');this.emit('relaydone');}
    }
    this.placeQuestRecovery();this.updateChallenge(dt);
    if(s.world.gate&&s.world.relays.length&&s.zone<3&&s.world.relays.every(r=>r.status==='online')&&!s.world.gate.eliteSpawned){s.world.gate.eliteSpawned=true;const e=this.makeEnemy(REGIONAL_BOSSES[s.zone],s.world.gate.x-120,s.world.gate.y+110,false,true);e.guardian=true;s.world.enemies.push(e);this.notice(ENEMIES[e.type].name+' ontwaakt · laatste kalibratie');this.emit('guardian');}
    if(s.world.gate?.eliteSpawned&&this.arenaCleared()){s.world.gate.open=true;s.world.coreAvailable=true;}
    if(p.xp>=p.nextXp&&!this.challengeBuildLocked()&&!s.pending&&!s.ultimateWave&&!s.effects.some(e=>e.type==='ultimate-wave'&&e.life>.5)&&s.mode==='playing'){p.xp-=p.nextXp;p.level++;p.nextXp=Math.round(p.nextXp*1.28);p.skillPoints++;s.mode='modal';s.pending={type:'upgrade',choices:this.upgradeChoices()};this.notice('NIVEAU '+p.level+' BEREIKT · +1 vaardigheidspunt','#ffe3a0');this.effect('level-burst',p.x,p.y,{level:p.level,life:1.6});this.emit('levelready',{level:p.level});}
    for(const e of s.effects){e.life-=dt;e.age+=dt;if(e.type==='tank-wave'&&!e.hit&&Math.abs(distance(p,e)-(40+Math.min(1,e.age/.9)*240))<26){e.hit=true;this.hurtPlayer(e.damage);}}s.effects=s.effects.filter(e=>e.life>0);
    for(const n of s.numbers){n.life-=dt;n.y-=dt*32;}s.numbers=s.numbers.filter(n=>n.life>0);
    for(const n of s.notices)n.life-=dt;s.notices=s.notices.filter(n=>n.life>0);
  }
  updateHazards(dt) {
    const s=this.state,p=s.player,stats=this.stats();if(this.inCamp()){p.wet=0;p.heat=0;p.poison=0;return;}let terrainDamage=0,terrainType='poison';
    for(const h of s.world.hazards){if(h.cleared)continue;if(h.life!==undefined){h.life-=dt;if(h.life<=0){h.cleared=true;continue;}}
      if(h.type==='friendlyFire'){for(const e of s.world.enemies.filter(e=>!e.dead&&distance(e,h)<h.r)){e.burn=Math.max(e.burn,.3);e.hp-=dt*14;if(e.hp<=0)this.killEnemy(e);}continue;}
      for(const e of s.world.enemies.filter(e=>!e.dead&&distance(e,h)<h.r)){if(h.type==='water')e.wet=Math.max(e.wet,2);}
      if(distance(p,h)>h.r)continue;
      if(h.type==='water')p.wet=Math.max(p.wet,1.5);
      if(h.type==='heat'){p.heat=Math.min(5,p.heat+dt*(1-Math.min(.8,stats.heatGuard)));if(p.heat>3.3){terrainDamage=5;terrainType='heat';}}
      if(h.type==='spore'&&!(p.venomGuard>0))p.poison=2;
      if(h.type==='polarity'&&Math.floor(s.time/3+h.phase)%2===1){terrainDamage=6;terrainType='electric';}
    }
    if(p.poison>0)terrainDamage=Math.max(terrainDamage,4);
    if(terrainDamage){p.terrainTick=(p.terrainTick||0)+dt;if(p.terrainTick>=1){p.terrainTick-=1;this.hurtPlayer(terrainDamage,terrainType);}}else p.terrainTick=0;
    p.heat=Math.max(0,p.heat-dt*.15);s.world.hazards=s.world.hazards.filter(h=>!h.cleared||h.life===undefined);
  }
  updateEnemies(dt) {
    const s=this.state,p=s.player;
    for(const e of s.world.enemies){if(e.dead)continue;const base=ENEMIES[e.type];if(this.inCamp(e)&&e.home){e.x=e.home.x;e.y=e.home.y;}if(this.inCamp()){e.windup=null;e.leap=null;e.rush=null;e.jumpHeight=0;e.move=false;e.awake=false;continue;}e.anim+=dt;e.hurt=Math.max(0,e.hurt-dt);e.wet=Math.max(0,e.wet-dt);e.stun=Math.max(0,e.stun-dt);e.resolve=Math.max(0,(e.resolve||0)-dt);e.comboCd=Math.max(0,(e.comboCd||0)-dt);e.slow=Math.max(0,(e.slow||0)-dt);
      if(e.burn>0){e.burn=Math.max(0,e.burn-dt);e.hp-=dt*7;if(e.hp<=0){this.killEnemy(e);continue;}}
      if(e.leap){const leap=e.leap;leap.age+=dt;const t=clamp(leap.age/.32,0,1);e.x=leap.from.x+(leap.to.x-leap.from.x)*t;e.y=leap.from.y+(leap.to.y-leap.from.y)*t;e.jumpHeight=Math.sin(t*Math.PI)*68;
        if(t>=1){e.jumpHeight=0;e.leap=null;if(!this.inCamp(e)&&distance(e,p)<95)this.hurtPlayer(leap.damage);this.effect('impact',e.x,e.y,{color:'#bad88d',element:'toxin',radius:95,life:.45});s.world.hazards.push({id:'poison-'+ ++this.idCounter,x:e.x,y:e.y,r:62,type:'spore',life:4,cleared:false});}continue;}
      if(e.rush){const rush=e.rush;rush.life-=dt;if(e.stun<=0)this.moveEntity(e,rush.dir.x*700*dt,rush.dir.y*700/1.15*dt);if(!rush.hit&&distance(e,p)<e.radius+24){rush.hit=true;this.hurtPlayer(rush.damage);}if(rush.life<=0||e.stun>0)e.rush=null;continue;}
      const dist=distance(e,p);if(!e.awake&&(dist<(e.type==='boss'?570:Math.max(330,Math.min(540,base.range))))){e.awake=true;this.effect('alert',e.x,e.y-90,{color:'#edd99c',radius:20,life:.55});}
      if(!e.awake||e.stun>0)continue;e.cd-=dt;e.move=false;
      if(e.burrow&&updateEncounterState(this,e,dt))continue;updateBossPhase(this,e);
      if(e.windup){e.windup.timer-=dt;if(e.windup.timer<=0){this.executeEnemyAttack(e);e.windup=null;e.cd=(base.boss?(e.phase===3?1.15:1.7):e.type==='raider'?1.4:e.type==='beast'?1.8:2.2)*(e.cooldownMultiplier||1);}continue;}
      const obstructed=(AREA_BY_ID[s.area].kind==='route'||arenaObstacles(s.area).length)&&!clearLine(e,p,s.area,e.radius);
      let goal=p;if(obstructed){e.pathCd=(e.pathCd||0)-dt;if(e.pathCd<=0){e.path=findPath(e,p,s.area,e.radius);e.pathCd=.7;}if(e.path?.length){if(distance(e,e.path[0])<12)e.path.shift();goal=e.path[0]||p;}}
      const dir=normal(goal.x-e.x,(goal.y-e.y)*(AREA_BY_ID[s.area].kind==='route'?1/.78:1.15));e.angle=Math.atan2(dir.y,dir.x);
      const attackRange=e.type==='crawler'&&(e.attacks||0)%2===1?280:e.type==='sentinel'&&(e.attacks||0)%2===1?360:e.type==='minecrab'&&(e.attacks||0)%2===1?220:base.range;
      if(e.cd<=0&&dist<attackRange&&(!arenaObstacles(s.area).length||!coverHit(e,p,s.area))){this.planAttack(e);continue;}
      let mx=0,my=0;
      if(e.type==='minecrab'&&(e.attacks||0)%2===1){if(dist>180){mx=dir.x;my=dir.y;}}
      else if(e.type==='sniper'){if(dist>510){mx=dir.x;my=dir.y;}else if(dist<340){mx=-dir.x;my=-dir.y;}}
      else if(e.type==='drone'||base.role==='orbit'||base.role==='ranged'){const orbit=(e.id%2?1:-1)*(e.type==='drone'&&Math.floor(e.anim/2)%2?-1:1);if(dist>(base.role==='ranged'?440:290)){mx=dir.x;my=dir.y;}else if(dist<(base.role==='ranged'?260:160)){mx=-dir.x;my=-dir.y;}else{mx=-dir.y*.7*orbit;my=dir.x*.7*orbit;}}
      else if(e.type==='siege'){if(dist>380){mx=dir.x;my=dir.y;}}
      else if(e.type!=='turret'&&dist>(e.type==='boss'?280:75)){mx=dir.x;my=dir.y;}
      if(obstructed&&goal!==p){mx=dir.x;my=dir.y;}
      if(mx||my){this.moveEntity(e,mx*base.speed*(e.speedMultiplier||1)*(e.slow?.45:1)*dt,my*base.speed*(e.speedMultiplier||1)*(e.slow?.45:1)*.78*dt);e.move=true;}
      for(const other of s.world.enemies){if(other===e||other.dead)continue;const dd=distance(e,other),min=e.radius+other.radius;if(dd>0&&dd<min){const push=normal(e.x-other.x,e.y-other.y);this.moveEntity(e,push.x*25*dt,push.y*20*dt);}}
    }
  }
  planAttack(enemy) {
    if(planNewAttack(this,enemy))return;
    const e=enemy,p=this.state.player,base=ENEMIES[e.type];
    const target={x:p.x,y:p.y},dir=normal(target.x-e.x,(target.y-e.y)*1.15);
    let mode=base.attack||(e.type==='raider'?'swing':e.type==='beast'?'leap':e.type==='turret'?'beam':'volley');
    e.attacks=(e.attacks||0)+1;
    if(e.attacks%2===0){if(e.type==='crawler')mode='charge';if(e.type==='sentinel')mode='shockwave';if(e.type==='sniper')mode='crossfire';}
    if(e.type==='sporecaster'&&e.attacks%2===0)mode='toxicFan';
    if(e.type==='boss')mode=e.phase===1?'radial':e.phase===2?(Math.floor(this.state.time)%2?'beam':'meteors'):(Math.floor(this.state.time)%2?'meteors':'radial');
    const duration=mode==='toxicFan'?1.2:mode==='charge'?.8:mode==='shockwave'?1.15:mode==='crossfire'?.9:mode==='bite'?.42:mode==='snipe'?1.2:mode==='slam'?1.1:mode==='spores'?1.1:mode==='siege'?1.35:mode==='chainburst'?.85:mode==='beam'?1.15:mode==='meteors'?1.2:mode==='swing'?.65:mode==='leap'?.95:.8;
    e.windup={mode,timer:duration,total:duration,target,dir};
    if(['meteors','spores','siege'].includes(mode))e.windup.targets=[target,{x:target.x+110,y:target.y+35},{x:target.x-85,y:target.y-65}];
    if(mode==='siege'&&e.attacks%2===0){const side={x:-dir.y*150,y:dir.x*150/1.15};e.windup.targets=[target,{x:target.x+side.x,y:target.y+side.y},{x:target.x-side.x,y:target.y-side.y}];}
    this.emit('windup',{type:e.type});
  }
  executeEnemyAttack(enemy) {
    enemy.attackRelease=.32;enemy.lastAttack=enemy.windup?.mode;
    const s=this.state,firstProjectile=s.projectiles.length,firstThreat=s.world.threats.length,firstEffect=s.effects.length;
    this.executeEnemyAttackPattern(enemy);presentEnemyAttack(this,enemy,firstProjectile,firstThreat,firstEffect);
  }
  executeEnemyAttackPattern(enemy) {
    if(executeNewAttack(this,enemy))return;
    const s=this.state,p=s.player,e=enemy,attack=e.windup,base=ENEMIES[e.type],damage=base.damage*(e.damageMultiplier||1+s.zone*.09)*(e.elite?1.18:1);
    if(this.inCamp())return;
    if(attack.mode==='charge'){e.rush={dir:{...attack.dir},life:.34,damage,hit:false};this.effect('slash',e.x,e.y,{dir:attack.dir,color:base.color,radius:100,life:.3});}
    else if(attack.mode==='shockwave'){this.effect('tank-wave',e.x,e.y,{damage,radius:280,hit:false,life:.9,color:base.color});}
    else if(attack.mode==='bite'){if(distance(p,e)<100)this.hurtPlayer(damage);this.effect('slash',e.x,e.y,{dir:attack.dir,color:base.color,radius:78,life:.25});}
    else if(attack.mode==='slam'){if(distance(p,e)<150)this.hurtPlayer(damage);this.effect('nova',e.x,e.y,{color:base.color,radius:150,life:.5});}
    else if(attack.mode==='spores'||attack.mode==='siege'){attack.targets.forEach((target,i)=>launchEnemyLob(this,e,target,{duration:.5+i*.09,damage,radius:attack.mode==='siege'?90:65,poison:attack.mode==='spores'}));}
    else if(attack.mode==='swing'){if(distance(p,e)<130){const to=normal(p.x-e.x,(p.y-e.y)*1.15);if(to.x*attack.dir.x+to.y*attack.dir.y>.35)this.hurtPlayer(damage);}this.effect('slash',e.x,e.y,{dir:attack.dir,color:'#f78e68',radius:125,life:.35});}
    else if(attack.mode==='leap'){const to=copy(attack.target);if(!canStand(to.x,to.y,e.radius,s.area)){let found=false;for(let r=12;r<=100&&!found;r+=12)for(let i=0;i<12;i++){const x=attack.target.x+Math.cos(i*Math.PI/6)*r,y=attack.target.y+Math.sin(i*Math.PI/6)*r;if(canStand(x,y,e.radius,s.area)){to.x=x;to.y=y;found=true;break;}}if(!found){to.x=e.x;to.y=e.y;}}e.leap={from:{x:e.x,y:e.y},to,damage,age:0};}
    else if(attack.mode==='snipe'){s.projectiles.push({id:++this.idCounter,team:'enemy',type:'precision',x:e.x,y:e.y-25,vx:attack.dir.x*850,vy:attack.dir.y*850/1.15,damage,radius:7,life:1.2,age:0,trail:[]});}
    else if(attack.mode==='beam'){
      let length=e.type==='boss'?740:640,end={x:e.x+attack.dir.x*length,y:e.y+attack.dir.y*length/1.15};
      const cover=coverHit(e,end,s.area);if(cover){end={x:cover.x,y:cover.y};length=distance(e,end);}
      const vx=p.x-e.x,vy=(p.y-e.y)*1.15,along=vx*attack.dir.x+vy*attack.dir.y,cross=Math.abs(vx*attack.dir.y-vy*attack.dir.x);
      if(along>0&&along<length&&cross<(attack.mode==='snipe'?15:35))this.hurtPlayer(damage,'electric');this.effect('beam',e.x,e.y-25,{end:{x:end.x,y:end.y-25},color:'#ffb397',life:.3});
    }else if(attack.mode==='meteors'){attack.targets.forEach((target,i)=>launchEnemyLob(this,e,target,{duration:.5+i*.08,damage,radius:94}));}
    else{
      const count=attack.mode==='chainburst'?6:attack.mode==='radial'?(e.phase===3?14:10):3;
      for(let i=0;i<count;i++){const a=['radial','chainburst'].includes(attack.mode)?i*Math.PI*2/count:Math.atan2(attack.dir.y,attack.dir.x)+(i-1)*(attack.mode==='crossfire'?.12:attack.mode==='toxicFan'?.3:.18);const speed=attack.mode==='crossfire'?510:attack.mode==='radial'?225:attack.mode==='toxicFan'?245:275;s.projectiles.push({id:++this.idCounter,team:'enemy',type:'danger',venom:attack.mode==='toxicFan',color:attack.mode==='toxicFan'?'#aedc62':undefined,x:e.x+Math.cos(a)*35,y:e.y-20+Math.sin(a)*25,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed/1.15,damage,radius:attack.mode==='crossfire'?7:11,life:3.6,age:0,trail:[]});}
      this.effect('impact',e.x,e.y-20,{color:'#f7ba6c',radius:60,life:.35});
    }
    this.emit('enemyattack',{enemy:e.type,mode:attack.mode});
  }
  detonate(bolt,radius=125){const s=this.state;this.effect(bolt.type==='gravity'?'nova':'eruption',bolt.x,bolt.y+18,{color:SPELLS[bolt.type].color,radius,life:.65});for(const e of s.world.enemies.filter(e=>!e.dead&&distance(e,{x:bolt.x,y:bolt.y+18})<radius+e.radius))this.hitEnemy(e,bolt.damage,bolt.type);if(bolt.type==='ember'){for(const h of s.world.hazards)if(h.type==='spore'&&distance(h,bolt)<h.r+radius){h.cleared=true;this.emit('clearspore');}s.world.hazards.push({id:'fire-'+ ++this.idCounter,x:bolt.x,y:bolt.y+18,r:75,type:'friendlyFire',life:1.5});}bolt.life=0;}
  updateProjectiles(dt) {
    const s=this.state,p=s.player;
    for(const bolt of s.projectiles){bolt.life-=dt;bolt.age+=dt;bolt.trail.push({x:bolt.x,y:bolt.y-(bolt.flightHeight||0)});if(bolt.trail.length>10)bolt.trail.shift();const old={x:bolt.x,y:bolt.y};
      if(bolt.team==='enemy'&&updateEnemyLob(this,bolt))continue;
      if(bolt.type==='ember'&&bolt.team==='player'){const t=clamp(bolt.age/bolt.duration,0,1);bolt.x=bolt.origin.x+(bolt.end.x-bolt.origin.x)*t;bolt.y=bolt.origin.y+(bolt.end.y-bolt.origin.y)*t;bolt.flightHeight=Math.sin(t*Math.PI)*115;if(t>=1)this.detonate(bolt);continue;}
      if(bolt.type==='gale'&&bolt.age>.65){if(!bolt.returning){bolt.returning=true;bolt.hitIds=[];}const dir=normal(p.x-bolt.x,p.y-18-bolt.y);bolt.vx=dir.x*750;bolt.vy=dir.y*750;if(distance(bolt,{x:p.x,y:p.y-18})<28)bolt.life=0;}
      bolt.x+=bolt.vx*dt;bolt.y+=bolt.vy*dt;
      // Projectile coordinates are chest-height; collide on their ground trace.
      const impact=coverHit({x:old.x,y:old.y+20},{x:bolt.x,y:bolt.y+20},s.area,bolt.radius);
      if(impact){bolt.life=0;this.effect('impact',impact.x,impact.y-20,{element:bolt.team==='enemy'?bolt.element:undefined,color:bolt.color||SPELLS[bolt.type]?.color,radius:26,life:.25});continue;}
      if(bolt.team==='player'&&bolt.type==='gravity'){for(const e of s.world.enemies.filter(e=>!e.dead&&!ENEMIES[e.type].boss&&distance(e,bolt)<180)){const dir=normal(bolt.x-e.x,bolt.y+18-e.y);this.moveEntity(e,dir.x*145*dt,dir.y*110*dt);e.awake=true;}if(bolt.life<=0)this.detonate(bolt,180);continue;}
      if(bolt.x<30||bolt.x>WORLD.width-30||bolt.y<30||bolt.y>WORLD.height-30)bolt.life=0;
      if(bolt.team==='player'){
        for(const hit of s.world.enemies.filter(e=>!e.dead&&!bolt.hitIds.includes(e.id)&&segmentDistance(old,bolt,{x:e.x,y:e.y-22})<e.radius+bolt.radius)){
          bolt.hitIds.push(hit.id);if(bolt.type==='tide'&&hit.tideGroup===bolt.group)continue;if(bolt.type==='tide')hit.tideGroup=bolt.group;this.hitEnemy(hit,bolt.damage,bolt.type);
          if(bolt.type==='prism'){const next=s.world.enemies.filter(e=>!e.dead&&!bolt.hitIds.includes(e.id)&&distance(e,hit)<360).sort((a,b)=>distance(a,hit)-distance(b,hit))[0];if(bolt.bounces>0&&next){bolt.bounces--;bolt.damage*=.75;bolt.x=hit.x;bolt.y=hit.y-22;const dir=normal(next.x-bolt.x,(next.y-22-bolt.y)*1.15);bolt.vx=dir.x*960;bolt.vy=dir.y*960/1.15;bolt.life=.65;this.effect('element-impact',hit.x,hit.y-22,{element:'solar',radius:45,life:.35});}else bolt.life=0;break;}
          if(bolt.type==='tide'){bolt.pierce--;if(bolt.pierce<=0){bolt.life=0;break;}}else if(!['frost','gale'].includes(bolt.type)){bolt.life=0;break;}
        }
      }else if(segmentDistance(old,bolt,{x:p.x,y:p.y-20})<22+bolt.radius){const canHit=!this.inCamp()&&p.invincible<=0;this.hurtPlayer(bolt.damage,bolt.damageType||(bolt.venom?'venomHit':'electric'));if(canHit){if(bolt.element==='water')p.wet=Math.max(p.wet,1.1);if(bolt.element==='fire')p.heat=Math.min(5,p.heat+.6);}bolt.life=0;this.effect(bolt.element?'element-impact':'impact',p.x,p.y-20,{element:bolt.element,color:bolt.color||'#ffb38d',radius:40,life:.4});}
    }
    s.projectiles=s.projectiles.filter(b=>b.life>0);
  }
  serialize() {const s=copy(this.state);s.areas[s.area]=s.world;delete s.world;s.projectiles=[];s.fields=[];s.ultimateWave=null;s.effects=[];s.numbers=[];s.notices=[];if(s.mode==='dead'||s.mode==='won')return null;return JSON.stringify({state:s,idCounter:this.idCounter,rngState:this.rng.getState()});}
  static restore(json) {
    const payload=JSON.parse(json),s=payload.state;if(![3,4,5].includes(s?.version)||!s.player)throw new Error('save-version');const engine=new Engine(s.player.discipline,s.seed);engine.state=s;engine.idCounter=payload.idCounter||1000;engine.rng=seeded(payload.rngState??s.seed);engine.events=[];
    if(s.version===3){s.version=4;s.area=HUB_IDS[s.zone];s.areas={};s.visited=[s.area];s.destination=null;const p=s.player;p.inventory=[];p.skills=['tide','storm','ember'];p.hotbar=['tide','storm','ember',null,null,null];p.spellCd={};p.skillPoints=Math.max(0,p.level-1);p.perks={};s.world.portals=engine.portalDefinitions(s.area);s.world.coreCollected=s.cores.includes(s.zone);s.areas[s.area]=s.world;if(s.pending?.type==='upgrade')s.pending.choices=engine.upgradeChoices();engine.checkpoint();}
    else s.world=s.areas[s.area];engine.migrateExpedition();engine.migrateStory();if(!s.world)throw new Error('save-area');engine.reconcileArena();if(s.world.trial&&!s.world.trial.done){engine.restartChallenge();engine.notice('Tijdproef opnieuw gestart · herladen bewaart geen halve poging');}s.player.invincible=1;return engine;
  }

}
Object.assign(Engine.prototype,ExpeditionRules,StoryRules,HubRules,SurvivalRules,GambleRules,QuestRules,MarketRules,EndgameRules);
function segmentDistance(a,b,p) {const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;const t=clamp(length?((p.x-a.x)*dx+(p.y-a.y)*dy)/length:0,0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
