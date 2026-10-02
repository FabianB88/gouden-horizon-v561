import {effectText} from './legendary.js?v=16';

const labels={power:'spreukschade',hp:'leven',mana:'mana',regen:'mana/sec',speed:'loopsnelheid',dash:'ontwijkherstel',crit:'kritieke kans',armor:'bescherming',tide:'getijdenschade',storm:'stormschade',ember:'zonneschade',wetTime:'natduur',chain:'kettingdoelen',comboCharge:'kernpulsopbouw',recovery:'leven/sec',leech:'leven per kill',waterproof:'waterbestendig',heatGuard:'hittebescherming',burnTime:'brandduur'};
const percentages=new Set(['power','speed','dash','crit','armor','tide','storm','ember','comboCharge','heatGuard','burnTime']);

// Show the actual tradeoff against this slot. Rarity is never an upgrade score.
export function gearChanges(item,current){
 const before=current?.stats||{},after=item.stats||{};
 return [...new Set([...Object.keys(after),...Object.keys(before)])].map(key=>{
  const delta=(after[key]||0)-(before[key]||0);
  if(Math.abs(delta)<.0005)return null;
  const value=percentages.has(key)?Math.round(delta*100)+'%':Number(delta.toFixed(1));
  return {key,delta,text:key==='waterproof'?(delta>0?'Waterbestendig':'Verliest waterbestendigheid'):(delta>0?'+':'')+value+' '+(labels[key]||key)};
 }).filter(Boolean);
}

export function gearFeedback(item,current,level){
 const changes=gearChanges(item,current),gains=changes.filter(c=>c.delta>0),losses=changes.filter(c=>c.delta<0);
 const effect=effectText(item),newEffect=effect&&item.effect!==current?.effect;
 const kind=gains.length||newEffect?(losses.length?'tradeoff':'gain'):losses.length?'loss':'same';
 const title={gain:'Meer mogelijkheden',tradeoff:'Andere afstemming',loss:'Voor een andere build',same:'Vergelijkbare afstemming'}[kind];
 const summary=[...gains.slice(0,2),...losses.slice(0,1)].map(c=>c.text).join(' · ')||'Geen statverschil met je huidige slot';
 return {kind,title,summary,effect:newEffect?effect:'',requiredLevel:(item.requiredLevel||1)>level?item.requiredLevel:null};
}
