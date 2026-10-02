export const HEAL_COOLDOWN=10;
export const ANTIDOTE_COOLDOWN=30;
export const ANTIDOTE_PRICE=45;
export const ANTIDOTE_CAP=3;
export const VENOM_DURATION=8;
export const VENOM_FRACTION=.5;

export const SurvivalRules={
 applyVenom(){
  const p=this.state.player;if(this.state.mode!=='playing'||this.inCamp()||p.invincible>0||p.venomGuard>0)return false;
  const fresh=!(p.venom>0);p.venom=VENOM_DURATION;p.venomDamage=Math.max(p.venomDamage||0,this.stats().maxHp*VENOM_FRACTION/VENOM_DURATION);
  if(fresh){p.venomTick=0;this.notice('VERGIFTIGD · 50% leven over 8s · J: antidotum','#b9f37c');this.emit('venom');}return true;
 },
 updateSurvival(dt){
  const p=this.state.player;
  for(const key of ['healCooldown','antidoteCooldown','venomGuard'])p[key]=Math.max(0,(p[key]||0)-dt);
  if(this.inCamp()){p.venom=0;p.venomTick=0;p.venomDamage=0;return;}
  if(p.venom>0){p.venomTick=(p.venomTick||0)+Math.min(dt,p.venom);p.venom=Math.max(0,p.venom-dt);
   while(p.venomTick>=1-1e-9){p.venomTick=Math.max(0,p.venomTick-1);this.hurtPlayer(p.venomDamage,'venom');}
   if(p.venom<=1e-9){p.venom=0;p.venomDamage=0;p.venomTick=0;}
  }
 },
 useAntidote(){
  const p=this.state.player;if(this.state.mode!=='playing'||p.antidotes<1||p.antidoteCooldown>0||(!(p.venom>0)&&!(p.poison>0)))return false;
  p.antidotes--;p.venom=0;p.poison=0;p.venomTick=0;p.venomDamage=0;p.venomGuard=5;p.antidoteCooldown=ANTIDOTE_COOLDOWN;
  this.effect('heal',p.x,p.y,{color:'#c9ee8f',radius:65,life:.7});this.number(p.x,p.y,'GIF GESTOPT','#c9ee8f',16);this.emit('antidote');return true;
 },
 buyAntidote(){
  const p=this.state.player,w=this.state.world;if(!this.canTrade()||p.scrap<ANTIDOTE_PRICE||p.antidotes>=ANTIDOTE_CAP||!(w.shop.antidoteStock>0))return false;
  p.scrap-=ANTIDOTE_PRICE;p.antidotes++;w.shop.antidoteStock--;this.emit('trade');this.checkpoint();return true;
 }
};
