import {AREAS,AREA_BY_ID,WORLD} from './data.js?v=16';
import {regionalService} from './markets.js?v=16';
import {HUB_LAYOUTS} from './hub-layouts.js?v=16';
export const SAFE_HUBS=['canal','highway','forest','skybridge'];
export const SERVICE_INFO={
 smith:{name:'Mara · Focusmaker',title:'Focusmaker',slots:['weapon','relic','gloves'],text:'Precisie of elementkracht? Kies een focus die bij je spreuken past.',file:'smith'},
 outfitter:{name:'Jules · Veldhandel',title:'Veldhandel',slots:['suit','boots','belt'],text:'Snel bewegen helpt. Bescherming geeft je tijd om een fout te herstellen.',file:'outfitter'},
 workshop:{name:'Inez · Werkplaats',title:'Werkplaats',slots:[],text:'Ik versterk wat je al draagt. Een vertrouwde vondst hoeft niet meteen vervangen te worden.',file:'workshop'}
};
const routeCache=new Map();
function inside(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function valid(point,id){return [[0,0],[22,0],[-22,0],[0,22],[0,-22]].every(([dx,dy])=>AREA_BY_ID[id].nav.some(poly=>inside((point.x+dx)/WORLD.width,(point.y+dy)/WORLD.height,poly)));}
// Placement stays on traced floors; integration QA walks every service and gate.
export function hubPoint(id,t){
 const key=id+':'+t;if(routeCache.has(key))return {...routeCache.get(key)};
 const a=AREA_BY_ID[id],start={x:a.spawn[0]*WORLD.width,y:a.spawn[1]*WORLD.height},wanted={x:(a.spawn[0]+(a.exit[0]-a.spawn[0])*t)*WORLD.width,y:(a.spawn[1]+(a.exit[1]-a.spawn[1])*t)*WORLD.height};
 const candidates=[];for(let dy=-144;dy<=144;dy+=24)for(let dx=-144;dx<=144;dx+=24){const p={x:wanted.x+dx,y:wanted.y+dy};if(valid(p,id))candidates.push(p);}
 candidates.sort((a,b)=>Math.hypot(a.x-wanted.x,a.y-wanted.y)-Math.hypot(b.x-wanted.x,b.y-wanted.y));
 const p=candidates[0]||start;routeCache.set(key,p);return {...p};
}
export const QUAY_SUPPLY=HUB_LAYOUTS.canal.supply.map((v,i)=>v/(i?WORLD.height:WORLD.width));
export function hubMerchants(id){return Object.entries(HUB_LAYOUTS[id].services).map(([service,[x,y]])=>({id:service,service,x,y,...SERVICE_INFO[service],...regionalService(id,SERVICE_INFO[service])}));}
export function fixedHubPortals(g,id){
 const layout=HUB_LAYOUTS[id];if(!layout)return null;
 return Object.entries(layout.portals).map(([to,[x,y]])=>{const a=AREA_BY_ID[to],category=a.optional?'bonus':a.side?'arena':a.kind==='hub'?'generator':'route';return {id:'gate-'+to,to,x,y,category,story:true,locked:!g.canSelectDestination(to),reason:'Voltooi eerst '+AREA_BY_ID[g.recommendedArea()].name};});
}
export const hubPortals=fixedHubPortals;
export const HubRules={
 prepareHub(w,area){
  if(area.id==='rooftops'&&!w.roofExplorationVersion){w.roofExplorationVersion=1;if(!w.loot.some(i=>i.exploration))w.loot.push({id:++this.idCounter,x:425,y:250,type:'loot',exploration:true,profile:'cache'});}
  if(w.shop&&w.shop.marketVersion!==1){w.shop.stock=this.makeStock(area.zone,area.id);w.shop.marketVersion=1;}
  if(w.shop&&w.shop.antidoteStock===undefined)w.shop.antidoteStock=2;
  if(!SAFE_HUBS.includes(area.id))return;
  w.safeHub=true;w.enemies=w.enemies.filter(e=>e.dead);w.hazards=[];w.threats=[];w.camp.services=hubMerchants(area.id);
  const layout=HUB_LAYOUTS[area.id];
  if(w.shop.antidoteStock===undefined)w.shop.antidoteStock=2;
  if(!w.hubVersion){w.hubVersion=1;w.loot.push({id:++this.idCounter,x:layout.supply[0],y:layout.supply[1],type:'loot',hiddenSupply:true,profile:'expedition'});}
  for(const loot of w.loot.filter(i=>!i.item)){const [x,y]=loot.hiddenSupply?layout.supply:layout.cache;Object.assign(loot,{x,y});}
  if(area.id==='canal'){
   const oldLayout=w.quayLayoutVersion!==2;
   // A save in the former stair corridor must never resume outside the new floor.
   if(oldLayout&&this.state.area==='canal'&&this.state.world===w&&!valid(this.state.player,'canal')){
    const p=this.state.player,candidates=[];
    for(let dy=-240;dy<=240;dy+=12)for(let dx=-240;dx<=240;dx+=12){const point={x:p.x+dx,y:p.y+dy};if(valid(point,'canal'))candidates.push(point);}
    candidates.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
    const point=candidates[0]||{x:area.spawn[0]*WORLD.width,y:area.spawn[1]*WORLD.height};Object.assign(p,point,{velocity:{x:0,y:0},moving:false,walkBlend:0});
   }
   w.quayLayoutVersion=2;
  }
 },
 inCamp(point=this.state.player){if(SAFE_HUBS.includes(this.state.area))return true;const camp=this.state.world?.camp;return Boolean(camp&&(Math.hypot(camp.x-point.x,(camp.y-point.y)*1.15)<camp.radius||Math.hypot(camp.merchant.x-point.x,(camp.merchant.y-point.y)*1.15)<125));},
 hubMerchants(id=this.state.area){return SAFE_HUBS.includes(id)?hubMerchants(id):this.state.world?.camp?[{id:'smith',service:'smith',...this.state.world.camp.merchant,...SERVICE_INFO.smith,...regionalService(id,SERVICE_INFO.smith),name:(id==='rooftops'?'Noor':'Bo')+' · '+this.state.world.camp.name,title:'Veldkaravaan',slots:['weapon','suit','relic','boots','gloves','belt'],supplies:true,forge:true}]:[];},
 nearbyMerchant(){return this.hubMerchants().filter(m=>Math.hypot(m.x-this.state.player.x,(m.y-this.state.player.y)*1.15)<115).sort((a,b)=>Math.hypot(a.x-this.state.player.x,a.y-this.state.player.y)-Math.hypot(b.x-this.state.player.x,b.y-this.state.player.y))[0]||null;},
 service(){return this.state.pending?.service||this.nearbyMerchant()?.service||'smith';},
 shopItems(service=this.service()){const slots=this.hubMerchants().find(m=>m.id===service)?.slots||SERVICE_INFO[service].slots;return this.state.world.shop.stock.filter(i=>slots.includes(i.slot));},
 nearbyService(){return this.nearbyMerchant();},
 currentService(){return this.hubMerchants().find(m=>m.id===this.state.pending?.service)||this.nearbyService()||null;},
 serviceStock(){const service=this.currentService();return service?this.shopItems(service.id):this.state.world.shop.stock;},
 migrateHubs(){
  const s=this.state;for(const worlds of [s.areas,s.checkpoint?.areas])for(const [id,w]of Object.entries(worlds||{})){if(!SAFE_HUBS.includes(id))continue;w.safeHub=true;w.enemies=w.enemies.filter(e=>e.dead);w.hazards=[];w.threats=[];w.merchants=hubMerchants(id);}
 }
};
