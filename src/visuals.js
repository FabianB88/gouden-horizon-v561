import {SPELLS,AREA_BY_ID,RARITIES} from './data.js?v=16';
import {EncounterVisuals} from './encounter-visuals.js?v=16';
const centered=source=>({...source,anchor:[.5,.5]});
const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.15);
export const ExpeditionVisuals={
 drawNewTelegraph(e,w,progress){
  if(this.drawEncounterWarning(e,w,progress))return true;
  const c=this.ctx,color='#e7b572';
  if(w.mode==='mines'){for(const point of w.targets){this.ellipse(point.x,point.y,75,75/1.15,'#db8c5c25',color,2);this.ellipse(point.x,point.y,75*progress,75*progress/1.15,null,'#fff0ba',2);}return true;}
  if(w.mode==='magnet'){this.ellipse(e.x,e.y,220,220/1.15,null,'#e7b57299',2);for(let i=0;i<3;i++){const r=220*(1-((progress+i/3)%1));this.ellipse(e.x,e.y,r,r/1.15,null,'#d6aeee77',2);}return true;}
  if(w.mode==='echo'||w.mode==='sweep'){for(const offset of w.mode==='echo'?[-.28,0,.28]:[-.6,0,.6]){const a=Math.atan2(w.dir.y,w.dir.x)+offset;this.line(e,{x:e.x+Math.cos(a)*540,y:e.y+Math.sin(a)*540/1.15},'#98eaf58a',2);}return true;}
  if(w.mode==='saltwalls'){for(const t of w.targets){const a={x:t.x-w.dir.x*130,y:t.y-w.dir.y*130/1.15},b={x:t.x+w.dir.x*130,y:t.y+w.dir.y*130/1.15};this.line(a,b,'#e2d4b030',54);this.line(a,b,color,2);}return true;}
  if(w.mode==='brinejet'){c.save();c.translate(e.x,e.y);c.scale(1,1/1.15);c.rotate(Math.atan2(w.dir.y,w.dir.x));c.beginPath();c.moveTo(0,0);c.arc(0,0,280,-.515,.515);c.closePath();c.fillStyle='#e2d4b030';c.fill();c.strokeStyle=color;c.lineWidth=2;c.stroke();c.restore();return true;}
  return false;
 },
 drawNewThreats(s){
  for(const t of s.world.threats||[]){
   if(this.drawEnemyAreaThreat(t))continue;
   if(this.drawEnemyThreat(t))continue;this.drawEncounterThreat(t);
   if(t.type==='mine'){const armed=t.age>=t.arm;this.ellipse(t.x,t.y,t.r,t.r/1.15,armed?'#f0a46a20':'#d6b47b0a',armed?'#ffc49e':'#d5c19f66',1.5);this.sprite(this.assets.mineArt,{bounds:[0,0,this.assets.mineArt.width,this.assets.mineArt.height],anchor:[.5,.9]},t.x,t.y,25);if(armed)this.glow(t.x,t.y-8,14,'#ffc49e',.5);}
   if(t.type==='magnet'){for(let i=0;i<4;i++){const r=t.r*(1-((t.age*.8+i/4)%1));this.ellipse(t.x,t.y,r,r/1.15,null,'#c6a1f777',2);}}
   if(t.type==='sweep'){const a=t.angle+t.age*1.1,end={x:t.x+Math.cos(a)*t.length,y:t.y+Math.sin(a)*t.length/1.15},color=t.color||'#8adeec';this.line(t,end,color+'38',40);this.line(t,end,color,4);}
   if(t.type==='saltwall'){const a={x:t.x-t.dir.x*t.length/2,y:t.y-t.dir.y*t.length/2/1.15},b={x:t.x+t.dir.x*t.length/2,y:t.y+t.dir.y*t.length/2/1.15},color=t.color||'#e2d4b0';this.line(a,b,color+(t.age<t.arm?'55':'99'),t.width*2);this.line(a,b,'#fff2ca',2);}
  }
 },
 drawTravel(portal,s){
  const locked=Boolean(portal.locked);
  const kind=['arena','bonus'].includes(portal.category)?'maritime':portal.category==='generator'?'industrial':AREA_BY_ID[portal.to].zone===2?'grove':'brass';
  this.ellipse(portal.x,portal.y+3,44,16,'#16353155');
  this.sprite(this.assets.travel,this.expedition.travel[kind],portal.x,portal.y,130,false,0,locked?.48:1);
  if(portal.category)this.text(portal.category==='bonus'?'OPTIONELE BERGING':portal.category==='arena'?'ARENA':portal.category==='generator'?'MEETSTATIONS':'DOORREIS',portal.x,portal.y-144,locked?'#c9ccb9':portal.category==='arena'?'#a5efed':'#f8d991',13);
  const hub=Boolean(s.world.safeHub);
  if(hub||distance(s.player,portal)<235){
   const label=AREA_BY_ID[s.area].kind==='hub'?'TERUG NAAR HANDELSKAMP':AREA_BY_ID[portal.to].name;
   this.text(label,portal.x,portal.y-164,locked?'#c9ccb9':'#f7e4ae',14);
   if(distance(s.player,portal)<235)this.text(locked?'GEBLOKKEERD':'F · VOLG DE ROUTE',portal.x,portal.y+26,locked?'#d3b19a':'#d9ead5',11);
  }
 },
 drawCampFloor(camp,s){
  this.ellipse(camp.x,camp.y,camp.radius,camp.radius/1.15,null,'#dbc69155',1.4);
  if(!camp.services)this.ellipse(camp.merchant.x,camp.merchant.y,125,125/1.15,null,'#dbc69155',1.4);
  if(distance(s.player,camp)<camp.radius+100)this.text('VEILIGE HANDELSPOST',camp.x,camp.y+camp.radius/1.15+18,'#f1ddb0',12);
 },
 drawMerchant(camp,s){
  const m=camp.merchant;this.ellipse(m.x,m.y,75,25,'#102a3655');
  this.sprite(this.assets.travel,this.expedition.travel.merchant,m.x,m.y,154);
  if(distance(s.player,m)<200)this.text(camp.name,m.x,m.y-164,'#f2dda5',14);
 },
 drawService(m,s){const c=this.ctx;this.ellipse(m.x,m.y,33,14,'#14322f50');c.save();c.filter=m.id==='outfitter'?'hue-rotate(155deg)':'none';this.sprite(this.assets.travel,this.expedition.travel[m.id==='workshop'?'forge':'merchant'],m.x,m.y,118);c.restore();const art=m.id==='smith'?'tidal-fork':m.id==='outfitter'?'ranger-coat':'copper-gauntlets';this.sprite(this.assets['item-'+art],{bounds:[0,0,256,256],anchor:[.5,.9]},m.x+36,m.y-55,35);if(distance(s.player,m)<240){this.text(m.name,m.x,m.y-129,'#f8e2ab',14);this.text(m.title,m.x,m.y+22,'#dce8ce',12);}},
 drawItemDrop(loot,time){
  const item=loot.item,color={common:'#b4bcba',uncommon:'#91d99c',rare:'#87d9fa',epic:'#d3a4ff',legendary:'#ffd58a'}[item.rarity];
  this.ellipse(loot.x,loot.y,22,10,color+'33',color+'c0',1.4);this.glow(loot.x,loot.y-15,42,color,.35);
  const image=this.assets['item-'+(item.art||item.id)];
  this.sprite(image,{bounds:[0,0,256,256],anchor:[.5,.90]},loot.x,loot.y+Math.sin(time*2)*2,54);
  if(['legendary','epic','rare'].includes(item.rarity)){const height=item.rarity==='legendary'?140:item.rarity==='epic'?110:78;this.line({x:loot.x,y:loot.y-5},{x:loot.x,y:loot.y-height},color+'55',item.rarity==='legendary'?8:4);this.line({x:loot.x,y:loot.y-5},{x:loot.x,y:loot.y-height},color+'b0',1.5);for(let i=0;i<4;i++)this.ellipse(loot.x+Math.sin(time*2+i*2)*14,loot.y-12-((time*22+i*28)%height),1.5,3,color+'b0');}
  if(distance(this.renderPlayer||{x:0,y:0},loot)<180)this.text(item.name,loot.x,loot.y-70,color,13);
 },
 drawAreaField(f){
  const c=this.ctx,spell=SPELLS[f.type],fade=Math.min(1,f.life*2,f.age*4+.25);
  c.save();c.globalAlpha=fade;
  if(f.type==='glacier'){
   // A crosswise strip of crystals matches the narrow collision footprint.
   const side={x:-f.dir.y,y:f.dir.x/1.15};
   for(let i=-3;i<=3;i++){const x=f.x+side.x*i*48,y=f.y+side.y*i*48;
    this.ellipse(x,y,48,27,'#73d5eb24','#ade9ef55',1);
    this.sprite(this.assets.abilities,this.expedition.abilities.glacier,x,y,75+(3-Math.abs(i))*9,false,0,fade*.9);
   }
  }else if(f.type==='cyclone'){
   this.ellipse(f.x,f.y,95,45,'#213f3738');
   this.sprite(this.assets.abilities,this.expedition.abilities.cyclone,f.x,f.y,275,false,Math.sin(f.age*7)*.035,fade*.85);
   for(let i=0;i<4;i++){const a=f.age*5+i*Math.PI/2;this.ellipse(f.x+Math.cos(a)*70,f.y-35+Math.sin(a)*30,4,2,'#cdf1d7bb');}
  }else if(f.type==='tempest'){
   const source=this.expedition.abilities.tempest,[x,y,w,h]=source.bounds;
   this.ellipse(f.x,f.y,150,60,'#3d315f22');
   // Fade the cloud texture's lower edge; no rectangular crop edge appears.
   const height=Math.round(h*.62),scale=130/height;
   for(let row=0;row<height;row+=8){const band=Math.min(8,height-row),opacity=Math.min(1,(height-row)/(height*.35));c.save();c.globalAlpha=fade*.88*opacity;c.drawImage(this.assets.abilities,x,y+row,w,band,f.x-w*scale/2,f.y-218+row*scale,w*scale,band*scale+.2);c.restore();}
   this.glow(f.x,f.y-120,65,'#b89bef',.16);
  }else if(f.type==='orbital'){
   for(const impact of f.strikes){if(impact.done)continue;
    const remaining=Math.max(0,impact.at-f.age),pulse=1+Math.sin(f.age*9)*.04;
    this.ellipse(impact.x,impact.y,impact.r,impact.r/1.15,'#de8b2820','#ffd387a0',1.5);
    this.ellipse(impact.x,impact.y,impact.r*Math.max(.08,1-remaining/impact.at),impact.r/1.15*Math.max(.08,1-remaining/impact.at),null,'#ffe6afcc',2);
    this.glow(impact.x,impact.y-100-remaining*80,19*pulse,'#ffbd65',.65);
   }
  }
  c.restore();
 },
 drawExpeditionEffect(e){
  if(e.type==='toxic-jet'){const end={x:e.x+e.dir.x*e.radius,y:e.y+e.dir.y*e.radius/1.15};this.line(e,end,'#b8e96b45',35*e.life/.45);this.line(e,end,'#ddffb2',4);for(let i=0;i<8;i++){const t=(e.age*3+i/8)%1;this.ellipse(e.x+(end.x-e.x)*t,e.y+(end.y-e.y)*t-20,4+t*5,3+t*4,'#b5e57480');}return true;}
  if(e.type==='loot-reveal'){const color={rare:'#87d9fa',epic:'#d3a4ff',legendary:'#ffd58a'}[e.rarity]||'#f7ddaa',progress=e.age/(e.age+e.life);this.glow(e.x,e.y-25,75,color,(1-progress)*.7);this.ellipse(e.x,e.y,18+progress*55,10+progress*30,null,color+'90',2);return true;}
  if(e.type==='brine-jet'){const angle=Math.atan2(e.dir.y,e.dir.x),reach=e.radius*Math.min(1,e.age*5+.25);for(let i=-3;i<=3;i++){const a=angle+i*.15;this.line(e,{x:e.x+Math.cos(a)*reach,y:e.y+Math.sin(a)*reach/1.15},'#f6edcd70',9);}return true;}
  const c=this.ctx,total=e.age+e.life,progress=e.age/total;
  if(e.type==='level-burst'){
   e.renderBorn??=this.time;const t=Math.min(1,(this.time-e.renderBorn)/1.6),alpha=1-t;
   this.glow(e.x,e.y-50,170,'#ffdf89',alpha*.5);this.ellipse(e.x,e.y,35+t*120,(35+t*120)*.55,null,'#ffe6aa'+Math.round(alpha*220).toString(16).padStart(2,'0'),3);
   for(let i=0;i<14;i++){const angle=i*Math.PI*2/14;this.ellipse(e.x+Math.cos(angle)*(25+t*80),e.y-30-t*140+Math.sin(angle)*30,2.5,5,'#fff1b8'+Math.round(alpha*230).toString(16).padStart(2,'0'));}
   if(t<.7)this.text('LEVEL '+e.level,e.x,e.y-145-t*30,'#fff0bb',25);return true;
  }
  if(e.type==='tank-wave'){
   const r=40+Math.min(1,e.age/.9)*240,alpha=Math.round((1-progress)*230).toString(16).padStart(2,'0');
   this.ellipse(e.x,e.y,r,r/1.15,null,'#ecba7d'+alpha,8*(1-progress)+2);
   this.ellipse(e.x,e.y,r-12,(r-12)/1.15,null,'#fff1c4'+alpha,2);return true;
  }
  if(e.type==='ultimate-charge'){
   const r=140*(1-progress)+40;
   this.glow(e.x,e.y-65,230,'#f5d582',.28+progress*.38);
   for(const [i,color]of ['#73e2e5','#ceb2ff','#ffbc66'].entries()){
    const a=this.time*5+i*Math.PI*2/3;this.glow(e.x+Math.cos(a)*r,e.y-70+Math.sin(a)*r*.45,30,color,.7);
   }
   this.sprite(this.assets.abilities,centered(this.expedition.abilities.ultimate),e.x,e.y-100,100+progress*95,false,progress*.25);
   return true;
  }
  if(e.type==='ultimate-wave'){
   const r=90+e.radius*Math.min(1,progress*1.8),alpha=Math.max(0,1-progress);
   this.sprite(this.assets.abilities,centered(this.expedition.abilities['ult-impact']),e.x,e.y-8,r*1.7,false,0,alpha);
   this.ellipse(e.x,e.y,r,r*.66,null,'#ffe5a8'+Math.round(alpha*200).toString(16).padStart(2,'0'),5*(1-progress)+1);
   this.ellipse(e.x,e.y,r*.82,r*.54,null,'#9fe9e2'+Math.round(alpha*160).toString(16).padStart(2,'0'),3);
   if(progress<.25)this.sprite(this.assets.abilities,centered(this.expedition.abilities.ultimate),e.x,e.y-100,130,false,0,1-progress*4);
   return true;
  }
  if(e.type==='storm-bolt'){
   const alpha=Math.max(0,1-progress),hex=Math.round(alpha*230).toString(16).padStart(2,'0');
   let point={x:e.x,y:e.y-160};
   for(let i=1;i<=5;i++){const end={x:e.x+(i===5?0:Math.sin(i*7+e.age*22)*15),y:e.y-160+i*30};this.line(point,end,'#d6baff'+hex,4*alpha+1);point=end;}
   this.glow(e.x,e.y-18,45,'#d9c8ff',alpha*.6);return true;
  }
  if(e.type==='orbital-strike'){
   this.sprite(this.assets.abilities,this.expedition.abilities.orbital,e.x,e.y,e.radius*2.1,false,0,1-progress);
   this.ellipse(e.x,e.y,e.radius*(.3+progress),e.radius/1.15*(.3+progress),null,'#ffd89d'+Math.round((1-progress)*180).toString(16).padStart(2,'0'),3);
   return true;
  }
  if(['field-open','field-pulse','orbital-strike'].includes(e.type)){
   const source=this.expedition.abilities[e.ability];
   this.sprite(this.assets.abilities,centered(source),e.x,e.y-22,e.radius*(1+progress*.5),false,0,1-progress);
   if(e.type==='orbital-strike')for(let i=0;i<3;i++){const x=e.x+(i-1)*70;this.line({x,y:e.y-240*(1-progress)},{x,y:e.y},'#ffe0a5'+Math.round((1-progress)*190).toString(16).padStart(2,'0'),9*(1-progress)+1);}
   return true;
  }
  return false;
 }
};

Object.assign(ExpeditionVisuals,EncounterVisuals);
