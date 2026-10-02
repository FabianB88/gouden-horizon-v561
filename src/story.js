import {AREAS,AREA_BY_ID,WORLD,POSITIONS} from './data.js?v=16';
import {SAFE_HUBS,hubPortals} from './hubs.js?v=16';

// Chronological journey with fixed arena/generator gates in regional hubs.
export const STORY_ORDER=['canal','delta','ring','rooftops','highway','mirrors','brine','kilometer','forest','glass','saltwood','vault','skybridge','harbor','clouds','aurelia'];
export const STORY_BEATS={
 canal:'Volg de kade. De Rietdelta bewaart de pomp waarmee de meetstations weer kunnen werken.',
 delta:'Bevrijd de getijdenpomp van de schrootbewakers. Daarmee kun je de Verdronken Ring kalibreren.',
 ring:'Kalibreer de twee meetstations en berg de Atmosferische lens.',
 rooftops:'Berg de bewaakte routekaart in de Zonnetuinen. Die wijst een droge weg naar Brabant.',
 highway:'Het zonnepark voedt de koeling. Bereid je bij de handelaar voor op de Spiegelvelden.',
 mirrors:'Maak de zonnecollectoren vrij. Hun energie opent de weg naar de Zoutcentrale.',
 brine:'Schakel de pekelmachines uit en herstel de watervoorraad voor de Rode Kilometer.',
 kilometer:'Herstel beide koelstations en berg de Oceaanverdeler.',
 forest:'De Groene Corridor leidt naar het levende netwerk. Het Kasfront moet eerst vrij.',
 glass:'Bevrijd de biokoepel: de kiemculturen zijn nodig om het Zoutwoud te kalibreren.',
 saltwood:'Kalibreer de bioarchieven en berg de Biosfeersleutel.',
 vault:'Versla de kluisbewaker en berg het Aurelia-protocol uit de voorraadkist.',
 skybridge:'Drie kernen zijn gekoppeld. Bevoorrading in de Stormhaven maakt de laatste oversteek mogelijk.',
 harbor:'Bevrijd het stormplatform en berg de uplink voor het Wolkenarchief.',
 clouds:'Herstel de laatste weermeting. Daarna kan Aurelia de correctie veilig toetsen.',
 aurelia:'Versla de Gouden Wachter en activeer de omkeerbare klimaatcorrectie.'
};
const camps=['canal','highway','forest','skybridge'];
const cacheChapters=new Set(['rooftops','vault']);
export const StoryRules={
 chapterComplete(id){
  const s=this.state,a=AREA_BY_ID[id],w=s.areas[id];
  if(s.storyPassed?.includes(id))return true;
  if(camps.includes(id))return s.visited.includes(id);
  if(cacheChapters.has(id))return Boolean(w?.storyCacheClaimed);
  if(a?.side)return Boolean(w?.sideDone&&!w.enemies.some(e=>!e.dead));
  if(id==='aurelia')return Boolean(s.completed||s.cores.includes(3));
  return Boolean(s.cores.includes(a?.zone));
 },
 recommendedArea(){return STORY_ORDER.find(id=>!this.chapterComplete(id))||'aurelia';},
 canSelectDestination(id){return this.isUnlocked(id)&&(AREA_BY_ID[id]?.endgame||AREA_BY_ID[id]?.optional||this.state.visited.includes(id)||this.state.storyPassed?.includes(id)||id===this.recommendedArea());},
 selectDestination(id){if(!this.canSelectDestination(id))return false;if(SAFE_HUBS.includes(this.state.area)&&this.chapterComplete(id)&&id!==this.state.area)return this.enterArea(id);this.state.destination=id===this.state.area?null:id;this.syncStoryPortals();return true;},
 portalDefinitions(id){
  const a=AREA_BY_ID[id];if(!a)return [];
  if(SAFE_HUBS.includes(id))return hubPortals(this,id);
  if(a.endgame)return [{id:'trial-return',to:'skybridge',x:POSITIONS.exit.x,y:POSITIONS.exit.y,story:true}];
  let to;
  if(a.kind==='hub')to=camps[a.zone];
  else{
   const chosen=this.state.destination;
   to=chosen&&chosen!==id&&this.canSelectDestination(chosen)?chosen:this.recommendedArea();
   if(to===id)to=camps[a.zone];
   if(to===id)return [];
  }
  const point=a.kind==='hub'?[POSITIONS.exit.x/WORLD.width,POSITIONS.exit.y/WORLD.height]:a.exit;
  return [{id:'story-gateway',to,x:point[0]*WORLD.width,y:point[1]*WORLD.height,story:true}];
 },
 syncStoryPortals(){if(this.state.world)this.state.world.portals=this.portalDefinitions(this.state.area);},
 routeTo(goal=this.state.destination||this.recommendedArea()){
  const current=this.state.area;if(goal===current)return [current];
  if(!this.canSelectDestination(goal))return [];
  const a=AREA_BY_ID[current],camp=camps[a.zone];
  return a.kind==='hub'&&goal!==camp?[current,camp,goal]:[current,goal];
 },
 portalReady(){const a=AREA_BY_ID[this.state.area];if(a.endgame)return this.arenaCleared();return a.kind==='hub'?this.arenaCleared():!cacheChapters.has(a.id)||this.chapterComplete(a.id);},
 nextWaypoint(){
  this.syncStoryPortals();const s=this.state,w=s.world,a=AREA_BY_ID[s.area];if(a.endgame)return w.enemies.find(e=>!e.dead)|| (w.trial.done?w.portals[0]:null);
  if(a.kind==='hub'&&!this.arenaCleared())return w.relays.find(r=>r.status==='dormant')||w.enemies.find(e=>!e.dead&&(e.guardian||e.type==='boss'))||w.enemies.find(e=>!e.dead);
  if(a.kind==='hub'&&!w.coreCollected)return w.gate;
  if(cacheChapters.has(a.id)&&!this.chapterComplete(a.id))return w.enemies.find(e=>!e.dead&&e.cacheGuard)||w.loot.find(i=>!i.item);
  return w.portals.find(p=>!p.locked&&p.to===(s.destination||this.recommendedArea()))||w.portals.find(p=>!p.locked);
 },
 storyText(){if(this.state.world?.trial)return 'Tijdproef · versla vier golven. De terugpoort opent na de eindbaas.';if(this.state.completed||this.state.cores.includes(3))return 'Aurelia is verbonden. Via M kun je bij een handelspost drie endgame-tijdproeven starten, of terugreizen naar eerdere hoofdstukken.';const id=this.recommendedArea();return STORY_BEATS[id]||AREA_BY_ID[id].story;},
 markStoryCache(loot){if(cacheChapters.has(this.state.area)&&!loot.item&&!loot.exploration){this.state.world.storyCacheClaimed=true;this.notice('Protocol geborgen · de volgende verhaalroute is open');}},
 migrateStory(){
  const s=this.state;if(s.campaignVersion===1)return;
  // Existing saves resume after their earned core, without replaying old acts.
  const through=s.completed||s.cores.includes(3)?15:s.cores.includes(2)?10:s.cores.includes(1)?7:s.cores.includes(0)?2:-1;
  s.storyPassed=STORY_ORDER.slice(0,through+1);s.campaignVersion=1;
  if(s.checkpoint){s.checkpoint.storyPassed=[...s.storyPassed];s.checkpoint.campaignVersion=1;}
  if(s.destination&&!this.canSelectDestination(s.destination))s.destination=null;
  this.syncStoryPortals();
 }
};
