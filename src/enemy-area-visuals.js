import {attackProfile,ELEMENT_COLORS} from './enemy-combat.js?v=16';
const TAU=Math.PI*2;
const clamp=n=>Math.max(0,Math.min(1,n));
const alpha=n=>Math.round(clamp(n)*255).toString(16).padStart(2,'0');
export const EnemyAreaVisuals={
 areaSprite(element,frame,x,y,height,opacity=1){
  const key=element==='solar'?'fire':element==='metal'?'fire':element,source=this.enemyAOECrop?.elements[key]?.[frame];if(!source)return;
  const c=this.ctx;c.save();if(element==='solar')c.filter='hue-rotate(17deg)';
  this.sprite(this.assets.enemyAOE,source,x,y,height,false,0,opacity);c.restore();
 },
 drawArenaObstacle(o,p){
  const c=this.ctx;c.save();c.filter='blur(4px)';this.ellipse(o.x,o.y+5,o.rx*.96,o.ry*.62,'#14282924');c.restore();
  // Fade only when the player stands behind the opaque upper silhouette.
  const behind=p.y<o.y&&p.y>o.y-o.height&&Math.abs(p.x-o.x)<o.rx+25;
  this.sprite(this.assets.arenaProps,this.arenaPropsCrop.props[o.art][o.frame],o.x,o.y,o.height,false,0,behind?.48:1);
 },
 areaWarning(x,y,r,u,element){
  const color=ELEMENT_COLORS[element]||ELEMENT_COLORS.fire,c=this.ctx;u=clamp(u);
  // The outer edge always matches the damage footprint. The bright perimeter
  // fills clockwise as the attack approaches; decorative art stays inside it.
  this.ellipse(x,y,r,r/1.15,color+alpha(.045+.075*u),color+alpha(.55+.3*u),2);
  c.save();c.translate(x,y);c.scale(1,1/1.15);
  for(let i=0;i<12;i++){const a=i*TAU/12-.08;c.beginPath();c.arc(0,0,r,a,a+.24);c.strokeStyle=color+alpha(.25+.5*u);c.lineWidth=3;c.stroke();}
  c.beginPath();c.arc(0,0,r,-Math.PI/2,-Math.PI/2+TAU*u);c.strokeStyle='#fff0c8';c.lineWidth=3;c.stroke();c.restore();
  this.areaSprite(element,0,x,y,Math.min(85,r*.8),.08+u*.19);
  if(u>.78)this.glow(x,y-8,Math.min(50,r*.5),color,(u-.78)*.5);
 },
 drawEnemyAreaWarning(e,w,u){
  const element=attackProfile(e).element;
  if(['acidPool','toxicVolley'].includes(w.mode)){
   for(const i of w.mode==='acidPool'?[0]:[-1,0,1])this.areaWarning(w.target.x-w.dir.y*i*100,w.target.y+w.dir.x*i*100/1.15,w.mode==='acidPool'?88:48,u,'toxin');return true;
  }
  if(['spores','siege','meteors','leap','burrow','cinderTrail','mines'].includes(w.mode)){
   const r={spores:65,siege:90,meteors:94,leap:95,burrow:85,cinderTrail:64,mines:75}[w.mode];
   for(const t of w.targets||[w.target])this.areaWarning(t.x,t.y,r,u,element);return true;
  }
  if(w.mode==='slam'){this.areaWarning(e.x,e.y,150,u,element);return true;}
  if(['tidalRing','shockwave'].includes(w.mode)){
   const max=w.mode==='tidalRing'?541:308;this.ellipse(e.x,e.y,max,max/1.15,null,ELEMENT_COLORS[element]+'55',1.5);
   this.areaWarning(e.x,e.y,w.mode==='tidalRing'?55:40,u,element);return true;
  }return false;
 },
 areaImpact(x,y,r,element,u,opacity=1){
  const color=ELEMENT_COLORS[element]||ELEMENT_COLORS.fire,fade=clamp((1-u)*1.7)*opacity;
  const growth=1-Math.exp(-u*14),height=Math.min(330,r*2.05)*(.65+growth*.35);
  this.glow(x,y-12,r*.8,color,fade*.17);
  this.areaSprite(element,0,x,y,height,fade*clamp(1-u*2.1));
  this.areaSprite(element,1,x,y,height*(1+u*.1),fade*clamp(u*4));
  this.ellipse(x,y,r*(.25+growth*.7),r*(.25+growth*.7)/1.15,null,color+alpha(fade*.6),2);
  // Small fragments rise and fall, instead of a static sprite simply fading.
  for(let i=0;i<7;i++){const a=i*2.399,q=.25+(i%3)*.18,px=x+Math.cos(a)*r*u*q,py=y+Math.sin(a)*r*u*q/1.15-Math.sin(u*Math.PI)*(element==='toxin'?30:48);
   this.combatSprite(element==='solar'?'solar':element,i%2,px,py,6+(1-u)*8,a+u*1.5,fade*.55);
  }
 },
 areaWave(t,shock=false){
  const element=t.element||'water',color=ELEMENT_COLORS[element],r=shock?40+Math.min(1,t.age/.9)*240:t.r+t.age*t.speed,fade=Math.min(1,t.life*4),width=shock?18:t.width||24;
  this.ellipse(t.x,t.y,r,r/1.15,null,color+alpha(fade*.65),width);
  this.ellipse(t.x,t.y,r-8,(r-8)/1.15,null,'#efffff'+alpha(fade*.6),2);
  const count=Math.min(20,Math.max(8,Math.round(r/24)));
  for(let i=0;i<count;i++){
   const a=i*TAU/count,phase=(t.age*2+i*.19)%1;
   this.combatSprite(element,phase<.5?2:3,t.x+Math.cos(a)*r,t.y+Math.sin(a)*r/1.15-5,shock?48:58,a+Math.PI/2,fade*.72);
  }
  // The ring centre remains visually quiet and safe, matching the moving rim.
 },
 drawEnemyAreaEffect(e){
  if(!e.element)return false;const u=clamp(e.age/(e.age+e.life));
  if(e.type==='tank-wave'){this.areaWave(e,true);return true;}
  if(['element-impact','eruption','nova','impact'].includes(e.type)){
   this.areaImpact(e.x,e.y,e.radius||50,e.element,u);return true;
  }return false;
 },
 drawEnemyAreaThreat(t){
  if(!t.element)return false;
  if(t.type==='ring'){this.areaWave(t);return true;}
  if(['toxicPool','eruption','burst'].includes(t.type)){
   if(t.age<t.arm){this.areaWarning(t.x,t.y,t.r,t.age/t.arm,t.element);return true;}
   if(t.type!=='toxicPool')return true;
   const fade=Math.min(1,(t.age-t.arm)*5,t.life*2),u=(t.age-t.arm)*.45;
   this.ellipse(t.x,t.y,t.r,t.r/1.15,'#80ad292a','#c9ec7c'+alpha(fade*.7),1.8);
   // Persistent vapor stays low enough to keep combat silhouettes readable.
   this.areaSprite('toxin',1,t.x,t.y,t.r*1.4,fade*(.4+Math.sin(u*4)*.05));
   for(let i=0;i<5;i++){const a=i*2.399;this.combatSprite('toxin',i%2,t.x+Math.cos(a)*t.r*.6,t.y+Math.sin(a)*t.r*.5-(u*13+i*11)%24,9,0,fade*.55);}
   return true;
  }return false;
 }
};
