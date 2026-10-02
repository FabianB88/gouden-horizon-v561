import {makeItem} from './loot.js?v=16';

export const NORA={id:'nora',x:1090,y:320,name:'Nora · Bergingscoördinator',title:'Noodstroom'};
const near=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.15)<115;
export const QuestRules={
 questNPCs(){return this.state.area==='highway'?[NORA]:[];},
 nearbyQuestNPC(){return this.questNPCs().find(n=>near(this.state.player,n))||null;},
 acceptSalvageQuest(){
  const s=this.state;if(this.nearbyQuestNPC()?.id!=='nora'||s.quests?.noodstroom||!['playing','modal'].includes(s.mode))return false;
  s.quests||={};s.quests.noodstroom={status:'active',choices:['weapon','boots','relic'].map(slot=>makeItem({rng:this.rng,slot,rarity:'rare',level:s.player.level,uid:++this.idCounter}))};
  this.notice('Nora · vind de meetspoel na beide groepen in het Vergeten Depot','#f6d38c');this.checkpoint();return true;
 },
 placeQuestRecovery(){
  const s=this.state;if(s.area!=='depot'||!s.world.sideDone||s.quests?.noodstroom?.status!=='active'||s.world.loot.some(i=>i.quest==='noodstroom'))return;
  const chest=s.world.loot.find(i=>i.expeditionReward);if(!chest)return;
  s.world.loot.push({id:++this.idCounter,type:'quest',quest:'noodstroom',x:chest.x-110,y:chest.y});
  this.notice('Meetspoel gevonden · pak hem met F en breng hem naar Nora','#f6d38c');
 },
 collectQuestRecovery(loot){
  const s=this.state,q=s.quests?.noodstroom;if(loot.quest!=='noodstroom'||q?.status!=='active'||!s.world.loot.some(i=>i.id===loot.id))return false;
  q.status='ready';s.world.loot=s.world.loot.filter(i=>i.id!==loot.id);this.notice('Meetspoel geborgen · Nora wacht op het noordelijke tuinpad','#f6d38c');this.emit('loot');return true;
 },
 claimSalvageReward(index){
  const s=this.state,q=s.quests?.noodstroom,item=q?.choices?.[index];if(this.nearbyQuestNPC()?.id!=='nora'||q?.status!=='ready'||!item||s.player.inventory.length>=48||!['playing','modal'].includes(s.mode))return false;
  s.player.scrap+=80;s.player.inventory.push(item);q.status='completed';delete q.choices;this.closeModal();this.notice('Noodstroom voltooid · +80 schroot en zeldzame uitrusting','#f6d38c');this.emit('discovery',{item,collected:true});this.checkpoint();return item.uid;
 }
};
export const QuestVisuals={
 drawQuestNPC(n,s){
  this.ellipse(n.x,n.y,23,10,'#17352c55');this.sprite(this.assets.nora,this.noraCrop,n.x,n.y,121);
  const status=s.quests?.noodstroom?.status,marker=status==='ready'?'?':!status?'!':status==='active'?'…':null;
  if(marker){this.glow(n.x,n.y-142,17,'#f3d698',.25);this.text(marker,n.x,n.y-131,'#ffe3a1',23);}
  if(Math.hypot(n.x-s.player.x,n.y-s.player.y)<270){this.text(n.name,n.x,n.y-155,'#f4ddb0',14);this.text('OPTIONELE OPDRACHT',n.x,n.y+22,'#cee5db',11);}
 },
 drawQuestPickup(loot,time){
  this.ellipse(loot.x,loot.y,21,10,'#163b3e60','#e8cf8faa',1.5);this.glow(loot.x,loot.y-14,38,'#e8cf8f',.3);this.sprite(this.assets['item-nav-astrolabe'],{bounds:[0,0,256,256],anchor:[.5,.9]},loot.x,loot.y+Math.sin(time*2)*2,48);this.text('MEETSPOEL · F',loot.x,loot.y-62,'#f4dc9f',12);
 }
};
