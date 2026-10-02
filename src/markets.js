import {SPELLS,AREA_BY_ID} from './data.js?v=16';
import {makeItem} from './loot.js?v=16';
export const MARKET_REGIONS=[
 {name:'Waterlijnhandel',specialty:'Getijdenfoci, waterbestendige veldpakken en snelle laarzen.',level:1,bases:['tidal-fork','tide-coat','reservoir','runner-boots','field-gloves','field-belt','storm-staff','cobalt-coat'],qualities:['common','common','uncommon','uncommon','uncommon','uncommon','rare','rare']},
 {name:'Schrootstation',specialty:'Zonnefoci, hittewerende kleding en condensortechniek.',level:4,bases:['amber-prism','cinder-coat','sun-compass','ash-boots','copper-gauntlets','solar-belt','prism','brass-jacket'],qualities:['uncommon','uncommon','uncommon','uncommon','uncommon','uncommon','rare','rare']},
 {name:'Veldmakers',specialty:'Levende foci, hersteluitrusting en een exclusieve prismaspreuk.',level:7,bases:['fork-focus','bloom-coat','seed-heart','quickstep-boots','thorn-gloves','medtech-belt','nav-astrolabe','storm-gloves'],qualities:['uncommon','uncommon','rare','uncommon','uncommon','rare','rare','epic']},
 {name:'Horizonpost',specialty:'Precisiefoci, stormuitrusting en één legendarische spaarvondst.',level:10,bases:['storm-staff','brass-coat','vector','runner-boots','storm-gloves','condenser-belt','prism','cobalt-coat'],qualities:['rare','rare','rare','rare','rare','rare','legendary','epic']}
];
const routeBases={rooftops:['tide-staff','utility-coat','field-compass','field-boots','copper-gauntlets','field-belt','tidal-fork','runner-boots'],vault:['fork-focus','ranger-coat','seed-heart','quickstep-boots','thorn-gloves','medtech-belt','seed','bloom-coat']};
export const SPELL_OFFERS={prism:{id:'prism',price:650,minZone:2,level:7,location:'Focusmaker bij Veldmakers / Horizonpost'}};
export function marketStock(g,zone,areaId){
 const region=MARKET_REGIONS[zone],bases=routeBases[areaId]||region.bases,level=region.level+(routeBases[areaId]?2:0);
 return bases.map((baseId,i)=>{const item=makeItem({rng:g.rng,baseId,level:level+(i>=6?1:0),rarity:region.qualities[i],uid:++g.idCounter});
  if(item.rarity==='legendary')item.price=950;
  if(i>=6)item.signature=true;return item;});
}
export function regionalService(areaId,service){const area=AREA_BY_ID[areaId],r=MARKET_REGIONS[area.zone];return {region:r.name,text:r.specialty+' '+service.text};}
export const MarketRules={
 spellOffers(){const service=this.currentService();return service?.id==='smith'?Object.values(SPELL_OFFERS).filter(o=>this.state.zone>=o.minZone):[];},
 buySpell(id){const offer=this.spellOffers().find(o=>o.id===id),p=this.state.player;if(!this.canTrade()||!offer||p.skills.includes(id)||p.level<offer.level||p.scrap<offer.price)return false;
  p.scrap-=offer.price;p.skills.push(id);this.notice(SPELLS[id].name+' geleerd · plaats zelf via K',SPELLS[id].color);this.emit('level');this.checkpoint();return true;
 }
};
