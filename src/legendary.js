// Effects have separate cooldowns, use the original cast's damage, and never
// trigger themselves. A legendary changes a build without an unlimited chain.
export const LEGENDARY_EFFECTS={
 echo:{name:'Prismatische echo',slot:'weapon',title:'Echo van de Waterlijn',text:'Elke vierde directe spreuk vuurt een extra doorborende ijsstraal af voor 35% spreukschade.'},
 ward:{name:'Noodmantel',slot:'suit',title:'Mantel van de Laatste Wacht',text:'Na ontwijken absorbeer je tot 16 schade gedurende 2 seconden. Herlaadt in 9 seconden.'},
 conductor:{name:'Stormlus',slot:'relic',title:'Hart van de Stormlus',text:'Een stormtreffer springt naar één extra doel voor 30% schade. Herlaadt in 3 seconden.'},
 wake:{name:'Vorstspoor',slot:'boots',title:'Laarzen van het Stille Getij',text:'Ontwijken laat 2 seconden een ijsspoor achter dat gewone vijanden vertraagt. Herlaadt in 6 seconden.'},
 cinder:{name:'Kiemvlam',slot:'gloves',title:'Handschoenen van de Kiemvlam',text:'Een brandende vijand verslaan veroorzaakt een kleine explosie van 22 zonneschade. Herlaadt in 3 seconden.'},
 reserve:{name:'Noodcondensator',slot:'belt',title:'Gordel van de Laatste Reserve',text:'Wanneer je schade ontvangt krijg je 12 mana terug. Herlaadt in 8 seconden.'}
};
export const effectForSlot=slot=>Object.keys(LEGENDARY_EFFECTS).find(id=>LEGENDARY_EFFECTS[id].slot===slot);
export function legendaryText(item){return item?.effect?LEGENDARY_EFFECTS[item.effect]?.text||'':'';}
export const effectText=legendaryText;
export const legendaryCast=(g,id,damage)=>triggerLegendary(g,'cast',{damage});
export const legendaryDash=g=>triggerLegendary(g,'dash');
export const legendaryHit=(g,enemy,damage,element,secondary)=>triggerLegendary(g,'hit',{enemy,damage,element,secondary});
export const legendaryKill=(g,enemy)=>triggerLegendary(g,'kill',{enemy});
const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.15);
export function triggerLegendary(g,trigger,data={}){
 const s=g.state,p=s.player,cool=p.effectCooldowns||(p.effectCooldowns={});
 for(const item of Object.values(p.equipment)){
  const id=item.effect;if(!id||(cool[id]||0)>0)continue;
  let fired=false;
  if(id==='echo'&&trigger==='cast'&&!data.area){p.echoCount=(p.echoCount||0)+1;if(p.echoCount%4===0){const dir=p.aim;s.projectiles.push({id:++g.idCounter,group:++g.idCounter,team:'player',type:'frost',x:p.x+dir.x*32,y:p.y-18+dir.y*24,vx:dir.x*900,vy:dir.y*900/1.15,damage:data.damage*.35,radius:8,life:.8,age:0,trail:[],hitIds:[],legendary:true});cool[id]=1;fired=true;}}
  if(id==='ward'&&trigger==='dash'){p.ward=16;p.wardTime=2;cool[id]=9;fired=true;}
  if(id==='wake'&&trigger==='dash'){(s.world.threats||=[]).push({id:++g.idCounter,type:'frostwake',x:p.x,y:p.y,dir:p.dashDir,length:185,r:45,age:0,life:2,color:'#a9edff'});cool[id]=6;fired=true;}
  if(id==='reserve'&&trigger==='hurt'){p.mana=Math.min(g.stats().maxMana,p.mana+12);cool[id]=8;fired=true;}
  if(id==='conductor'&&trigger==='hit'&&data.element==='storm'&&!data.secondary){const near=s.world.enemies.filter(e=>!e.dead&&e!==data.enemy&&distance(e,data.enemy)<245).sort((a,b)=>distance(a,data.enemy)-distance(b,data.enemy))[0];if(near){cool[id]=3;g.effect('chain',data.enemy.x,data.enemy.y-20,{end:{x:near.x,y:near.y-20},color:'#ffe2a0',life:.4});g.hitEnemy(near,data.damage*.3,'storm',true);fired=true;}}
  if(id==='cinder'&&trigger==='kill'&&data.enemy.burn>0){cool[id]=3;const point=data.enemy;g.effect('eruption',point.x,point.y,{radius:115,color:'#ffd089',life:.65});for(const e of s.world.enemies.filter(e=>!e.dead&&distance(e,point)<115))g.hitEnemy(e,22,'ember',true);fired=true;}
  if(fired)g.emit('legendaryproc',{effect:id});
 }
}
export function updateLegendary(p,dt){for(const id of Object.keys(p.effectCooldowns||{}))p.effectCooldowns[id]=Math.max(0,p.effectCooldowns[id]-dt);p.wardTime=Math.max(0,(p.wardTime||0)-dt);if(!p.wardTime)p.ward=0;}
