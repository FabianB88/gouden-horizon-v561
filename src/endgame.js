import {AREA_BY_ID,ENEMIES,POSITIONS} from './data.js?v=16';
import {SAFE_HUBS} from './hubs.js?v=16';
import {makeItem} from './loot.js?v=16';
const clone=v=>JSON.parse(JSON.stringify(v));
export const TRIALS=[
 {id:'trial-tide',name:'Dijkbreker',theme:'Water, gif en zware dijkmachines',boss:'dredger',bossName:'De Dijkwachter',roster:['eel','minecrab','toxinbeetle','shieldguard','brinebreaker'],rewardSlot:'boots'},
 {id:'trial-glass',name:'Glasstorm',theme:'Zonnevuur, schilden en artillerie',boss:'solarKnight',bossName:'De Glasregent',roster:['salamander','sniper','shieldguard','resonant','siege'],rewardSlot:'weapon'},
 {id:'trial-null',name:'Nulfront',theme:'Bliksem, precisiesalvo’s en de Gouden Wachter',boss:'boss',bossName:'De Nulwachter',roster:['stormling','stormnest','chemist','resonant','sentinel'],rewardSlot:'relic'}
];
export const TRIAL_TIERS=[{name:'Veteraan',hp:1,damage:1,scrap:70,xp:120},{name:'Expert',hp:1.32,damage:1.14,scrap:105,xp:180},{name:'Meester',hp:1.68,damage:1.28,scrap:150,xp:240}];
export function trialTime(ms){const whole=Math.floor(ms/1000);return Math.floor(whole/60)+':'+String(whole%60).padStart(2,'0')+'.'+String(Math.floor(ms%1000/10)).padStart(2,'0');}
export function recordText(record){return `Gouden Horizon v5.6.1 · ${record.arenaName} · ${TRIAL_TIERS[record.tier-1].name}\n${trialTime(record.elapsedMs)} · niveau ${record.level} · ${record.kills} vijanden\n${record.spells.join(' / ')}\n${record.gear.join(' · ')}\nPersoonlijk lokaal tijdrecord · https://gouden-horizon-rpg.fb12.chatgpt.site`;}
export const EndgameRules={
 challengeBuildLocked(){return Boolean(this.state.world?.trial&&!this.state.world.trial.done);},
 endgameUnlocked(){return Boolean(this.state.completed||this.state.cores.includes(3));},
 trialTierUnlocked(id,tier){return Boolean(TRIALS.some(t=>t.id===id)&&Number.isInteger(tier)&&tier>=1&&tier<=3&&this.endgameUnlocked()&&(tier===1||this.state.trialRecords?.[id+':'+(tier-1)]));},
 startChallenge(id,tier=1){
  if(this.state.mode!=='playing')return false;
  if(!this.trialTierUnlocked(id,tier)||!SAFE_HUBS.includes(this.state.area)||this.state.player.inventory.length>=48)return false;
  if(this.state.player.xp>=this.state.player.nextXp){this.update(.00001);return false;}
  const s=this.state;s.challengeRequest={id,tier};s.completed=true;return this.enterArea(id);
 },
 createChallengeWorld(w,area){
  const s=this.state,p=s.player,request=s.challengeRequest,tier=request?.id===area.id?request.tier:1;s.challengeRequest=null;
  const spec=TRIALS.find(t=>t.id===area.id),stats=this.stats();
  w.coreCollected=true;w.gate={...POSITIONS.exit,open:false,eliteSpawned:true};w.trial={id:area.id,tier,round:0,rounds:4,elapsed:0,countdown:3,breakTime:0,kills:0,done:false,rewardPaid:false,startingLevel:Math.max(12,p.level),build:{level:p.level,spells:[p.mainAttack,p.rightAbility,...p.hotbar.filter(Boolean)],gear:Object.values(p.equipment).map(i=>i.name+(i.enhance?' +'+i.enhance:''))}};
  // Every attempt uses the same restored body and ability resources. Consumable
  // counts are earned stock: starting a trial never refills them.
  p.hp=stats.maxHp;p.mana=stats.maxMana;p.spellCd={};p.ultimate=0;p.ultimateCooldown=0;p.healCooldown=0;p.antidoteCooldown=0;p.venom=0;p.venomDamage=0;p.venomTick=0;p.venomGuard=0;p.wet=0;p.poison=0;p.heat=0;p.dashCharges=2;p.dashRecharge=0;p.ward=0;p.wardTime=0;p.rootSlow=0;p.echoCount=0;p.effectCooldowns={};
  this.notice(spec.name+' · '+TRIAL_TIERS[tier-1].name+' · start in 3', '#ffe3a0');return w;
 },
 updateChallengeCountdown(dt){const t=this.state.world?.trial;if(!t||t.done||t.countdown<=0)return false;t.countdown=Math.max(0,t.countdown-dt);if(t.countdown===0)this.spawnChallengeWave();return true;},
 spawnChallengeWave(){
  const s=this.state,w=s.world,t=w.trial,spec=TRIALS.find(a=>a.id===t.id),tier=TRIAL_TIERS[t.tier-1];t.round++;t.breakTime=0;s.projectiles=[];s.fields=[];w.threats=[];w.hazards=[];w.enemies=w.enemies.filter(e=>!e.dead);
  const total=t.round===4?3+t.tier:4+t.round+t.tier,points=[[820,410],[1110,370],[1390,490],[1470,650],[1200,840],[950,860],[650,785],[490,635],[610,455],[1120,625]];
  for(let i=0;i<total;i++){
   const boss=t.round===4&&i===0,type=boss?spec.boss:spec.roster[(i+t.round-1)%spec.roster.length],[x,y]=points[(i+t.round*2)%points.length];
   const e=this.makeEnemy(type,x,y,!boss&&t.round===3&&i===total-1,true);e.level=t.startingLevel+(t.tier-1)*2;
   const levelFactor=1+Math.max(0,t.startingLevel-12)*.045;e.maxHp=Math.round(e.maxHp*tier.hp*levelFactor*(boss?1.12:1));e.hp=e.maxHp;e.damageMultiplier*=tier.damage*(1+Math.max(0,t.startingLevel-12)*.012);e.cooldownMultiplier*=1/(1+(t.tier-1)*.055);e.cd=.7+(i%5)*.12;e.noReward=true;e.trialEnemy=true;if(boss)e.displayName=spec.bossName;this.placeSummon(e);w.enemies.push(e);this.effect('spawn',e.x,e.y,{color:ENEMIES[type].color,radius:55,life:.7});
  }
  this.notice(spec.name+' · golf '+t.round+' / 4'+(t.round===4?' · '+spec.bossName:''),'#ffe3a0');this.emit('guardian');
 },
 updateChallenge(dt){
  const s=this.state,t=s.world.trial;if(!t||t.done||t.countdown>0||s.mode!=='playing')return;
  t.elapsed+=dt;if(s.world.enemies.some(e=>!e.dead))return;
  if(t.round===4){this.finishChallenge();return;}
  if(!t.breakTime){t.breakTime=2;this.notice('Golf vrij · volgende groep over 2 seconden','#c0e5d9');}
  t.breakTime=Math.max(.00001,t.breakTime-dt);if(t.breakTime<=.00001)this.spawnChallengeWave();
 },
 finishChallenge(){
  const s=this.state,w=s.world,t=w.trial;if(!t||t.done||t.round!==4||w.enemies.some(e=>!e.dead))return false;
  t.done=true;w.gate.open=true;w.sideDone=true;const spec=TRIALS.find(a=>a.id===t.id),key=t.id+':'+t.tier,previous=s.trialRecords?.[key],elapsedMs=Math.round(t.elapsed*1000),newBest=!previous||elapsedMs<previous.elapsedMs;
  const record={arena:t.id,arenaName:spec.name,tier:t.tier,elapsedMs,kills:t.kills,...clone(t.build)};s.trialRecords||={};if(newBest)s.trialRecords[key]=record;
  const rarityWeights=t.tier===1?[.75,.98]:t.tier===2?[.60,.96]:[.45,.94],roll=this.rng(),rarity=roll<rarityWeights[0]?'rare':roll<rarityWeights[1]?'epic':'legendary';
  const item=makeItem({rng:this.rng,level:t.startingLevel+(t.tier-1),rarity,slot:spec.rewardSlot,uid:++this.idCounter}),reward=TRIAL_TIERS[t.tier-1].scrap;
  // Reserve bag capacity at entry. If the bag somehow filled during a trial,
  // keep the earned item on the floor rather than deleting the reward.
  if(!t.rewardPaid){s.player.scrap+=reward;s.player.xp+=TRIAL_TIERS[t.tier-1].xp;if(s.player.inventory.length<48)s.player.inventory.push(item);else w.loot.push({id:++this.idCounter,x:s.player.x,y:s.player.y,item,type:'loot'});t.rewardPaid=true;}
  s.projectiles=[];s.fields=[];s.ultimateWave=null;w.hazards=[];w.threats=[];s.mode='modal';s.pending={type:'trialResult',record,newBest,previousMs:previous?.elapsedMs||null,item,reward,xp:TRIAL_TIERS[t.tier-1].xp};this.emit('trialrecord',{records:clone(s.trialRecords)});this.emit('win');this.checkpoint();return true;
 },
 restartChallenge(){
  const s=this.state,t=s.world?.trial;if(!t)return false;const {id,tier}=t;
  this.enterArea('skybridge');return this.startChallenge(id,tier);
 },
 returnFromChallenge(){if(!this.state.world?.trial)return false;this.state.completed=true;return this.enterArea('skybridge');}
};
