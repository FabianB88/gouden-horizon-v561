import {WORLD,ZONES,AREAS,AREA_BY_ID,SPELLS,ENEMIES,POSITIONS,START_EQUIPMENT} from './data.js?v=16';
import {clamp,distance} from './engine.js?v=16';
import {ITEM_BASES} from './loot.js?v=16';
import {ExpeditionVisuals} from './visuals.js?v=16';
import {drawAnimatedEnemy} from './enemy-motion.js?v=16';
import {drawWalkingHero,drawDirectionalHero,heroFocus} from './hero-animation.js?v=16';
import {EnemyCombatVisuals,enemyAttackMotion} from './enemy-combat.js?v=16';
import {QuestVisuals,NORA} from './quests.js?v=16';
import {arenaObstacles} from './arena-layouts.js?v=16';
import {EnemyAreaVisuals} from './enemy-area-visuals.js?v=16';
const TAU=Math.PI*2;
export class Renderer {
  constructor(canvas,minimap){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.minimap=minimap;this.mctx=minimap.getContext('2d');this.assets={};this.camera={x:0,y:0};this.shake=0;this.flash=0;this.ready=false;this.crop=null;this.time=0;this.quality=1;}
  async load(){
    const files={...Object.fromEntries(AREAS.map(z=>[z.id,'assets/painted/'+z.file])),items:'assets/items/item-atlas.webp',travel:'assets/expedition/travel-camp-atlas.webp',mineArt:'assets/expedition/magnet-mine.webp',combatEffects:'assets/expedition/combat-effects-v551.webp',nora:'assets/expedition/nora-v551.webp',enemyAnimation:'assets/expedition/enemy-animation-v55.webp',rolesV54:'assets/expedition/enemy-v54.webp',bossesV54:'assets/expedition/boss-v54.webp',newEnemies:'assets/expedition/enemy-v52.webp',extraEnemies:'assets/expedition/enemy-atlas.webp',abilities:'assets/expedition/ability-atlas.webp',...Object.fromEntries([...new Set([...ITEM_BASES,...Object.values(START_EQUIPMENT)].map(i=>i.art||i.id))].map(id=>['item-'+id,'assets/items/'+id+'.webp'])),heroDirectional:'assets/painted/hero-eight-directions.webp',heroAnimation:'assets/painted/hero-animation.webp',atlas:'assets/painted/enemy-atlas.webp'};
    files.enemyAOE='assets/expedition/enemy-aoe-v561.webp';files.arenaProps='assets/expedition/arena-obstacles-v561.webp';
    await Promise.all(Object.entries(files).map(async([id,file])=>{this.assets[id]=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Asset ontbreekt: '+file));image.src=file;});}));
    [this.enemyAOECrop,this.arenaPropsCrop]=await Promise.all(['enemy-aoe-v561','arena-obstacles-v561'].map(name=>fetch('assets/expedition/'+name+'.json').then(r=>r.json())));
    this.combatEffectsCrop=await fetch('assets/expedition/combat-effects-v551.json').then(r=>r.json());this.noraCrop=await fetch('assets/expedition/nora-v551.json').then(r=>r.json());this.enemyAnimationCrop=await fetch('assets/expedition/enemy-animation-v55.json').then(r=>r.json());this.v54Crop=await fetch('assets/expedition/v54-sprites.json').then(r=>r.json());this.newEnemyCrop=await fetch('assets/expedition/enemy-v52.json').then(r=>r.json());this.expedition=await fetch('assets/expedition/sprites.json').then(r=>r.json());this.itemCrop=await fetch('assets/items/items.json').then(r=>r.json());this.crop=await fetch('assets/painted/sprites.json').then(r=>r.json());this.heroDirectionalCrop=await fetch('assets/painted/hero-eight-directions.json').then(r=>r.json());this.ready=true;
  }
  resize(){const rect=this.canvas.getBoundingClientRect(),ratio=Math.min(1.5,window.devicePixelRatio||1);this.canvas.width=Math.round(rect.width*ratio);this.canvas.height=Math.round(rect.height*ratio);this.width=rect.width;this.height=rect.height;this.pixelRatio=ratio;this.zoom=Math.max(rect.width<=720?.78:1,rect.width/WORLD.width,rect.height/WORLD.height);this.viewWidth=this.width/this.zoom;this.viewHeight=this.height/this.zoom;this.ctx.imageSmoothingEnabled=true;this.ctx.imageSmoothingQuality='high';}
  reset(player){this.camera.x=clamp(player.x-this.viewWidth/2,0,Math.max(0,WORLD.width-this.viewWidth));this.camera.y=clamp(player.y-this.viewHeight*.57,0,Math.max(0,WORLD.height-this.viewHeight));}
  screenToWorld(x,y){return {x:x/this.zoom+this.camera.x,y:y/this.zoom+this.camera.y};}
  kick(amount=5){this.shake=Math.max(this.shake,amount);}
  ellipse(x,y,rx,ry,color,stroke=null,width=1){const c=this.ctx;c.beginPath();c.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,TAU);if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  line(a,b,color,width=2){const c=this.ctx;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
  text(text,x,y,color='#fff3d5',size=15){const c=this.ctx;c.font=`600 ${size}px Georgia,serif`;c.textAlign='center';c.fillStyle='#081820';c.shadowColor='#071522';c.shadowBlur=6;c.fillText(text,x+1,y+1);c.fillStyle=color;c.fillText(text,x,y);c.shadowBlur=0;}
  render(engine,time,delta){if(!this.ready)return;const s=engine.state,p=s.player,zone=AREA_BY_ID[s.area],c=this.ctx;this.time=time;this.renderPlayer=p;this.renderArea=s.area;
    const targetX=clamp(p.x-this.viewWidth*.5,0,Math.max(0,WORLD.width-this.viewWidth));const targetY=clamp(p.y-this.viewHeight*.57,0,Math.max(0,WORLD.height-this.viewHeight));
    const smooth=1-Math.exp(-delta*6);this.camera.x+=(targetX-this.camera.x)*smooth;this.camera.y+=(targetY-this.camera.y)*smooth;
    const shakeX=(Math.sin(time*67)*this.shake),shakeY=(Math.cos(time*83)*this.shake*.6);this.shake=Math.max(0,this.shake-delta*24);
    c.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);c.clearRect(0,0,this.width,this.height);c.save();c.scale(this.zoom,this.zoom);c.translate(-this.camera.x+shakeX,-this.camera.y+shakeY);
    c.drawImage(this.assets[zone.id],0,0,WORLD.width,WORLD.height);
    // Keep the painted environment bright; only a gentle cool atmospheric veil.
    c.fillStyle='rgba(9,26,36,.035)';c.fillRect(0,0,WORLD.width,WORLD.height);
    this.drawHazards(s);this.drawNewThreats(s);for(const field of s.fields)this.drawAreaField(field);if(s.world.camp)this.drawCampFloor(s.world.camp,s);this.drawTelegraphs(s);this.drawEnemyLanding(s);
    for(const relay of s.world.relays)this.drawRelay(relay,s);
    engine.syncStoryPortals();this.drawGate(s);this.drawArchive(s);this.visiblePortals=engine.portalReady()?s.world.portals:[];
    for(const pickup of s.world.pickups){this.ellipse(pickup.x,pickup.y,20,11,'#71ca9870');this.ellipse(pickup.x,pickup.y-12,8,8,'#b7f5bf','#fff4c7',2);}
    const ordered=[...this.visiblePortals.map(entity=>({kind:'portal',entity})),...(s.world.camp?.services?s.world.camp.services.map(entity=>({kind:'service',entity})):s.world.camp?[{kind:'merchant',entity:s.world.camp.merchant}]:[]),...s.world.loot.map(entity=>({kind:'loot',entity})),...s.world.enemies.filter(e=>!e.dead).map(entity=>({kind:'enemy',entity})),{kind:'player',entity:p}].sort((a,b)=>a.entity.y-b.entity.y);
    for(const obstacle of arenaObstacles(s.area))ordered.push({kind:'obstacle',entity:obstacle});
    for(const npc of engine.questNPCs())ordered.push({kind:'quest',entity:npc});ordered.sort((a,b)=>a.entity.y-b.entity.y);
    for(const entry of ordered){if(entry.kind==='obstacle')this.drawArenaObstacle(entry.entity,p);else if(entry.kind==='player')this.drawPlayer(p,time);else if(entry.kind==='quest')this.drawQuestNPC(entry.entity,s);else if(entry.kind==='portal')this.drawTravel(entry.entity,s);else if(entry.kind==='service')this.drawService(entry.entity,s);else if(entry.kind==='merchant')this.drawMerchant(s.world.camp,s);else if(entry.kind==='loot')this.drawLoot(entry.entity,time,s);else this.drawEnemy(entry.entity,time);}
    for(const bolt of s.projectiles)this.drawProjectile(bolt);
    for(const effect of s.effects)this.drawEffect(effect);
    for(const number of s.numbers){c.globalAlpha=Math.min(1,number.life*3);this.text(number.text,number.x,number.y,number.color,number.size);}c.globalAlpha=1;
    this.drawWaypoint(engine);c.restore();this.drawAtmosphere(s,time);this.drawMinimap(s);
  }
  sprite(image,source,x,y,height,flip=false,rotation=0,alpha=1){const c=this.ctx;if(!source)return;const [sx,sy,sw,sh]=source.bounds;const width=height*sw/sh;const anchorX=(source.anchor?.[0]??.5)*width;const anchorY=(source.anchor?.[1]??1)*height;c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.rotate(rotation);c.globalAlpha=alpha;if(source.clip?.length){const scale=height/sh;c.beginPath();source.clip.forEach(([px,py],i)=>i?c.lineTo(px*scale-anchorX,py*scale-anchorY):c.moveTo(px*scale-anchorX,py*scale-anchorY));c.closePath();c.clip();}c.drawImage(image,sx,sy,sw,sh,-anchorX,-anchorY,width,height);c.restore();}
  drawPlayer(p,time){const c=this.ctx,movement=p.moving?Math.sin((p.walkPhase||0)*Math.PI*10)*(p.walkBlend??1)*2:Math.sin(time*2.4)*.3;this.ellipse(p.x,p.y+2,24,11,'rgba(14,35,39,.45)');
    const pose=(p.lookUp?4:0)+(p.moving?1+Math.floor((p.walkPhase||0)*5)%2:p.cast>0?3:0),frame=this.crop.heroFrames[pose];
    if(!this.assets.heroDirectional)for(const trail of p.trail)this.sprite(this.assets.heroAnimation,frame,trail.x,trail.y,123,p.facing<0,0,trail.life*.7);
    this.ellipse(p.x,p.y,29,13,null,p.dashTimer>0?'#c4f9f3':'#dbe6c695',1.4);
    if(p.invincible>0&&p.dashTimer>0){this.ellipse(p.x,p.y-30,40,54,'#b7efea20','#c2f7e977',1.5);}
    if(!drawDirectionalHero(this,p,time)){if(p.moving&&p.dashTimer<=0)drawWalkingHero(this,p);else this.sprite(this.assets.heroAnimation,frame,p.x,p.y+movement,123,p.facing<0,0);}
    if(p.hurt>0){c.globalCompositeOperation='screen';this.ellipse(p.x,p.y-43,25,40,'#ffe5cb70');c.globalCompositeOperation='source-over';}
    const spell=SPELLS[p.lastAbility||p.spell],focus=heroFocus(this,p,time),staffX=focus?.x??p.x+p.aim.x*30,staffY=focus?.y??p.y-38+p.aim.y*16;this.glow(staffX,staffY,p.cast>0?30:12,spell.color,.6);this.ellipse(staffX,staffY,3.5,3.5,'#fff4d5');
    if(p.venom>0){this.glow(p.x,p.y-35,38,'#a6d74f',.3);for(let i=0;i<4;i++)this.ellipse(p.x+Math.sin(time*3+i*1.8)*23,p.y-((time*20+i*17)%65),2.5,4,'#c3ed7ba0');}
    if(p.wet>0)this.ellipse(p.x,p.y+5,25,10,null,'#80e2ec',2);
  }
  drawEnemy(e,time){const base=ENEMIES[e.type],c=this.ctx;if(e.hidden){this.ellipse(e.x,e.y,25,12,'#a3765740',base.color,1);return;}this.ellipse(e.x,e.y+3,base.boss?52:base.radius+2,base.radius*.43,'rgba(20,27,25,.45)');
    if(e.elite){this.ellipse(e.x,e.y,base.radius+12,(base.radius+12)*.55,null,'#f6d899',2);this.glow(e.x,e.y-25,50,'#ecc365',.15);}
    const bob=(e.type==='drone'?Math.sin(time*3+e.anim)*5:e.move?Math.abs(Math.sin(time*8+e.anim))*-2:0)-(e.jumpHeight||0);
    const lean=e.move?Math.sin(e.anim*9)*.025:0;
    c.save();const motion=enemyAttackMotion(e);c.translate(e.x+motion.x,e.y+motion.y);c.rotate(motion.rotation);c.scale(1+motion.squash,1-motion.squash);c.translate(-e.x,-e.y);const painted=this.v54Crop?.enemies[e.type],boss=this.v54Crop?.bosses[e.type],faceLeft=e.angle>Math.PI/2||e.angle<-Math.PI/2;if(drawAnimatedEnemy(this,e,base,time)){}else if(painted){this.sprite(this.assets.rolesV54,painted,e.x,e.y+bob,base.size*(e.elite?1.18:1),faceLeft!==Boolean(painted.facesLeft),lean);}else if(boss){const frame=boss.frames[e.windup?1:0];this.sprite(this.assets.bossesV54,frame,e.x,e.y+bob,base.size*frame.bounds[3]/boss.scaleDenominator,faceLeft!==Boolean(boss.facesLeft),lean);}else{
    this.sprite(base.atlas==='v52'?this.assets.newEnemies:base.atlas==='expedition'?this.assets.extraEnemies:this.assets.atlas,base.atlas==='v52'?this.newEnemyCrop[base.sprite][e.windup?1:0]:base.atlas==='expedition'?this.expedition.enemies[base.sprite]:this.crop.enemies[base.sprite],e.x,e.y+bob,base.size*(e.elite?1.18:1),faceLeft,lean);}
    this.drawEnemyCharge(e);c.restore();if(e.type==='stormnest'&&!painted)for(const sign of [-1,1])this.sprite(this.assets.extraEnemies,this.expedition.enemies.stormling,e.x+sign*29,e.y-52+Math.sin(time*2+sign)*5,40,sign<0,sign*.18);
    if(e.wet>0){for(let i=0;i<3;i++){const x=e.x+Math.sin(time*3+i*2)*20,y=e.y-26+Math.cos(time*3+i*2)*14;this.ellipse(x,y,3,6,'#97f0f4c0');}}
    if(e.burn>0){this.glow(e.x,e.y-22,40,'#ffb376',.4);for(let i=0;i<3;i++)this.ellipse(e.x-16+i*14,e.y-20-(time*40+i*17)%45,4,10,'#ffb76bb0');}
    if(e.stun>0)this.ellipse(e.x,e.y-base.size-10,13,7,null,'#bdc7ff',2);
    if(e.hurt>0){c.globalCompositeOperation='screen';this.glow(e.x,e.y-base.size*.45,base.size*.5,'#fff0c2',.5);c.globalCompositeOperation='source-over';}
    if(['sporecaster','toxinbeetle','chemist','seedheart'].includes(e.type)&&e.awake)this.text('GIFTIG',e.x,e.y-base.size-(base.boss?47:e.elite?40:27),'#c3ec87',12);
    if(e.awake||e.hp<e.maxHp){const w=base.boss?120:e.elite?70:48,y=e.y-base.size-12;c.fillStyle='#132225dd';c.fillRect(e.x-w/2-1,y-1,w+2,6);c.fillStyle=base.boss||e.elite?'#f1d590':'#d97c60';c.fillRect(e.x-w/2,y,w*clamp(e.hp/e.maxHp,0,1),4);if(base.boss)this.text((e.displayName||base.name)+' · '+e.phase,e.x,y-10,base.color,15);else if(e.elite)this.text('◆',e.x,y-5,'#f4db9a',14);}
  }
  glow(x,y,r,color,opacity=.4){const c=this.ctx,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+'cc');g.addColorStop(.3,color+'66');g.addColorStop(1,color+'00');c.save();c.globalAlpha=opacity;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
  drawRelay(relay,s){const online=relay.status==='online',defending=relay.status==='defending',color=online?'#93edcf':defending?'#efb477':'#83d5dc';this.ellipse(relay.x,relay.y,50,25,'#07232a44',color+'b0',2);this.glow(relay.x,relay.y-36,70,color,.3);
    this.sprite(this.assets.atlas,this.crop.enemies[5],relay.x,relay.y,116,false);this.text(online?'STATION '+relay.id+' · ONLINE':defending?'STATION '+relay.id+' · GOLF '+relay.wave+'/2':'MEETSTATION '+relay.id,relay.x,relay.y-125,color,13);
    if(online){for(let i=0;i<5;i++){const a=this.time*.8+i*TAU/5;this.ellipse(relay.x+Math.cos(a)*42,relay.y-18+Math.sin(a)*19,2.5,2.5,'#c8ffdd');}}
  }
  drawGate(s){if(AREA_BY_ID[s.area].side||s.zone!==3||!s.world.bossDefeated)return;const gate=s.world.gate;this.sprite(this.assets.atlas,this.crop.enemies[5],gate.x,gate.y,120);this.glow(gate.x,gate.y-45,75,'#f2d997',.4);}
  drawArchive(s){const a=s.world.archive;if(!a||a.read)return;this.ellipse(a.x,a.y,16,8,'#052c3055','#b6ded1',1);const c=this.ctx;c.save();c.translate(a.x,a.y-16);c.rotate(-.15);c.fillStyle='#173b3d';c.strokeStyle='#f4d496';c.lineWidth=1.5;c.beginPath();c.roundRect(-12,-15,24,25,3);c.fill();c.stroke();c.fillStyle='#85d3c1';c.fillRect(-7,-9,14,2);c.fillRect(-7,-3,10,2);c.restore();}
  drawLoot(loot,time,s){if(loot.quest){this.drawQuestPickup(loot,time);return;}if(loot.item){this.drawItemDrop(loot,time);return;}const color=loot.prototype?'#edc67d':'#8cdecf';this.ellipse(loot.x,loot.y,32,15,'#172f3255',color+'99',1.5);this.glow(loot.x,loot.y-18,57,color,.28);this.sprite(this.assets.items,this.itemCrop['loot-chest'],loot.x,loot.y+Math.sin(time*2)*2,65);
    if(loot.guarded&&s.world.enemies.some(e=>e.cacheGuard&&!e.dead))this.text('BEWAAKT',loot.x,loot.y-83,'#edb797',12);
    for(let i=0;i<3;i++){const a=time*.9+i*TAU/3;this.ellipse(loot.x+Math.cos(a)*23,loot.y-28+Math.sin(a)*13,1.8,1.8,'#ffe6a8');}
  }
  drawHazards(s){const c=this.ctx;for(const h of s.world.hazards){if(h.cleared)continue;const colors={water:'#51cee0',heat:'#e47742',spore:'#93c477',polarity:'#edcd72',friendlyFire:'#f7a450'};const color=colors[h.type]||'#dadcaf';const hot=h.type==='polarity'&&Math.floor(s.time/3+h.phase)%2===1;const alpha=h.type==='friendlyFire'?.16:.1;this.ellipse(h.x,h.y,h.r,h.r*.63,color+Math.round(alpha*255).toString(16).padStart(2,'0'),color+'55',1);
      if(h.type==='water'){for(let i=0;i<4;i++){const r=(this.time*14+i*23)%h.r;this.ellipse(h.x,h.y,r,r*.55,null,color+'55',1);}}
      else if(h.type==='spore'){this.areaSprite('toxin',1,h.x,h.y,Math.min(150,h.r*1.5),Math.min(.3,(h.life??1)*.4));for(let i=0;i<7;i++){const a=i*2.4;const r=20+(i*13)%h.r;this.combatSprite('toxin',i%2,h.x+Math.cos(a)*r,h.y+Math.sin(a)*r*.5-((this.time*12+i*7)%35),8,0,.45);}}
      else if(h.type==='heat'||h.type==='friendlyFire'){for(let i=0;i<6;i++){const a=i*2.8;const r=i*13;this.glow(h.x+Math.cos(a)*r,h.y+Math.sin(a)*r*.6-14,25,color,.18);}}
      else if(h.type==='polarity'){this.ellipse(h.x,h.y,h.r*.7,h.r*.42,null,hot?'#ffeab5b0':'#8cbbba77',hot?2:1);this.text(hot?'−':'+',h.x,h.y+6,hot?'#f7d682':'#b2e8de',22);}
    }}
  drawTelegraphs(s){const c=this.ctx;for(const e of s.world.enemies){if(e.dead||!e.windup)continue;const w=e.windup,progress=1-w.timer/w.total,color='#ef805f';c.save();
    if(this.drawEnemyAreaWarning(e,w,progress)){c.restore();continue;}
    if(this.drawNewTelegraph(e,w,progress)){c.restore();continue;}
    if(w.mode==='charge'||w.mode==='crossfire'){const angles=w.mode==='crossfire'?[-.12,0,.12]:[0];for(const offset of angles){const angle=Math.atan2(w.dir.y,w.dir.x)+offset,length=w.mode==='charge'?238:650,end={x:e.x+Math.cos(angle)*length,y:e.y+Math.sin(angle)*length/1.15};this.line(e,end,color+'30',w.mode==='charge'?44:12);this.line(e,end,'#ffe0a1bb',2);this.line(e,{x:e.x+(end.x-e.x)*progress,y:e.y+(end.y-e.y)*progress},'#fff1bb',3);}}
    else if(w.mode==='shockwave'){this.ellipse(e.x,e.y,280,280/1.15,null,color+'80',2);this.ellipse(e.x,e.y,40+progress*40,(40+progress*40)/1.15,color+'25','#ffe4a0',3);}
    else if(w.mode==='beam'||w.mode==='snipe'){const length=e.type==='boss'?740:640;const end={x:e.x+w.dir.x*length,y:e.y+w.dir.y*length/1.15};this.line(e,end,color+'38',58);this.line(e,end,'#ffe0a1a0',2);this.line(e,{x:e.x+(end.x-e.x)*progress,y:e.y+(end.y-e.y)*progress},'#fff1bb',4);}
    else if(['leap','meteors','spores','siege'].includes(w.mode)){for(const point of w.targets||[w.target]){this.ellipse(point.x,point.y,94,59,color+'35',color+'da',2);this.ellipse(point.x,point.y,94*progress,59*progress,null,'#ffe4a0',2);this.text('!',point.x,point.y-8,'#fff1be',22);}}
    else if(w.mode==='swing'||w.mode==='bite'){c.translate(e.x,e.y);c.scale(1,.75);c.rotate(Math.atan2(w.dir.y,w.dir.x));c.beginPath();c.moveTo(0,0);c.arc(0,0,125,-1.15,1.15);c.closePath();c.fillStyle=color+'38';c.fill();c.strokeStyle='#ffc88d';c.lineWidth=2;c.stroke();}
    else{this.ellipse(e.x,e.y,e.type==='boss'?125:w.mode==='slam'?150:47,e.type==='boss'?76:w.mode==='slam'?95:28,color+'25','#f7b88d',2);this.ellipse(e.x,e.y,(e.type==='boss'?125:w.mode==='slam'?150:47)*progress,(e.type==='boss'?76:w.mode==='slam'?95:28)*progress,null,'#ffe8a8',2);}
    c.restore();}}
  drawProjectile(bolt){if(this.drawEnemyProjectile(bolt))return;if(bolt.type==='prism'){for(let i=1;i<bolt.trail.length;i++)this.line(bolt.trail[i-1],bolt.trail[i],i%2?'#8ef2ec90':'#ffe4a990',3);this.combatSprite('solar',Math.floor(bolt.age*16)%2,bolt.x,bolt.y,48,Math.atan2(bolt.vy,bolt.vx));return;}const c=this.ctx,color=bolt.team==='enemy'?(bolt.color||'#ffc092'):SPELLS[bolt.type].color,y=bolt.y-(bolt.flightHeight||0);
    if(bolt.trail.length)for(let i=1;i<bolt.trail.length;i++)this.line(bolt.trail[i-1],bolt.trail[i],color+Math.round(i/bolt.trail.length*150).toString(16).padStart(2,'0'),bolt.type==='frost'?4:bolt.radius*.65*i/bolt.trail.length);
    this.glow(bolt.x,y,bolt.type==='gravity'?65:bolt.radius*3,color,.55);c.save();c.translate(bolt.x,y);
    if(bolt.type==='tide'){c.rotate(Math.atan2(bolt.vy,bolt.vx));c.beginPath();c.arc(-9,0,23,-1.2,1.2);c.strokeStyle='#c5ffff';c.lineWidth=5;c.stroke();c.beginPath();c.arc(-13,0,28,-1.3,1.3);c.strokeStyle=color+'aa';c.lineWidth=8;c.stroke();}
    else if(bolt.type==='frost'){c.rotate(Math.atan2(bolt.vy,bolt.vx));c.beginPath();c.moveTo(25,0);c.lineTo(-15,-9);c.lineTo(-8,0);c.lineTo(-15,9);c.closePath();c.fillStyle='#e2fbff';c.fill();c.strokeStyle=color;c.lineWidth=2;c.stroke();}
    else if(bolt.type==='gale'){c.rotate(bolt.age*17);for(let i=0;i<3;i++){c.rotate(TAU/3);c.beginPath();c.arc(0,0,23,-1,1);c.strokeStyle=i?'#8ce5c1':'#e0ffdb';c.lineWidth=5;c.stroke();}this.ellipse(0,0,9,7,'#eeffe199');}
    else if(bolt.type==='gravity'){c.rotate(bolt.age*4);this.ellipse(0,0,18,18,'#251936','#f2c1ff',3);for(let i=0;i<3;i++){c.rotate(TAU/3);c.beginPath();c.ellipse(0,0,38,12,0,0,TAU);c.strokeStyle=color+'bb';c.lineWidth=2;c.stroke();}this.ellipse(0,0,6,6,'#fff6ff');}
    else{this.ellipse(0,0,bolt.radius*.8,bolt.radius*.8,bolt.type==='ember'?'#fff1a1':'#fff7dc',color,3);if(bolt.type==='ember'){for(let i=0;i<5;i++){const a=bolt.age*8+i*1.3;this.ellipse(Math.cos(a)*16,Math.sin(a)*16,4,7,'#ff9c48');}}}
    c.restore();if(bolt.flightHeight)this.ellipse(bolt.x,bolt.y+18,17,8,'#13222170');
  }
  drawEffect(e){if(this.drawEnemyAreaEffect(e)||this.drawEnemyCombatEffect(e)||this.drawExpeditionEffect(e))return;const c=this.ctx,progress=e.age/(e.age+e.life),r=e.radius||50,color=e.color||'#e5d4a4';c.save();c.globalAlpha=clamp(e.life*3,0,1);
    if(e.type==='chain'||e.type==='beam'){
      const end=e.end;if(e.type==='beam'){this.line(e,end,color+'44',38);this.line(e,end,'#fff5d4',8);}
      else{let last={x:e.x,y:e.y};for(let i=1;i<=8;i++){const point={x:e.x+(end.x-e.x)*i/8+(i<8?Math.sin(i*13+this.time*75)*9:0),y:e.y+(end.y-e.y)*i/8+(i<8?Math.cos(i*11+this.time*91)*9:0)};this.line(last,point,color,4);last=point;}this.line(e,end,'#fff9ec',1);}
    }else if(e.type==='slash'){c.translate(e.x,e.y);c.scale(1,.7);c.rotate(Math.atan2(e.dir.y,e.dir.x));c.beginPath();c.arc(0,0,r*(.7+progress*.3),-1.1,1.1);c.strokeStyle=color;c.lineWidth=12*(1-progress);c.stroke();}
    else{
      if(['nova','relay','ultimate','heal','storm'].includes(e.type)){this.ellipse(e.x,e.y,r*progress,r*progress*.65,color+'12',color,3*(1-progress)+1);this.ellipse(e.x,e.y,r*progress*.7,r*progress*.46,null,color+'88',2);}
      this.glow(e.x,e.y-20,r*(.4+progress*.4),color,.4*(1-progress));
      for(let i=0;i<(e.type==='ultimate'?36:14);i++){const a=i*2.399;const radius=r*progress*(.5+(i%5)*.13);const x=e.x+Math.cos(a)*radius,y=e.y+Math.sin(a)*radius*.65-(e.type==='eruption'?Math.sin(progress*Math.PI)*50:0);this.ellipse(x,y,3+(1-progress)*4,3+(1-progress)*7,color+(e.type==='steam'?'60':'bb'));}
    }c.restore();}
  drawWaypoint(engine){const s=engine.state,p=s.player,target=engine.nextWaypoint();if(!target)return;
    const d=distance(p,target);if(d<100)return;const x=target.x-this.camera.x,y=target.y-this.camera.y;
    if(x>60&&x<this.viewWidth-60&&y>90&&y<this.viewHeight-160)return;
    const dir=Math.atan2(target.y-p.y,target.x-p.x),cx=clamp(x,70,this.viewWidth-70)+this.camera.x,cy=clamp(y,95,this.viewHeight-155)+this.camera.y,c=this.ctx;c.save();c.translate(cx,cy);c.rotate(dir);c.beginPath();c.moveTo(16,0);c.lineTo(-8,-9);c.lineTo(-8,9);c.closePath();c.fillStyle='#f9d98e';c.shadowColor='#132a30';c.shadowBlur=10;c.fill();c.restore();}
  drawAtmosphere(s,time){const c=this.ctx;c.save();const gradient=c.createRadialGradient(this.width*.5,this.height*.45,this.height*.25,this.width*.5,this.height*.45,this.height*.85);gradient.addColorStop(0,'#06192700');gradient.addColorStop(1,s.player.hp<30?'#70140e88':'#071b294f');c.fillStyle=gradient;c.fillRect(0,0,this.width,this.height);
    for(let i=0;i<22;i++){const x=(i*137.3+Math.sin(time*.1+i)*45)%this.width,y=(i*79.1-time*8)%this.height;c.globalAlpha=.12+(i%3)*.04;this.ellipse(x,y,1.8,2,s.zone===0?'#d3edf0':s.zone===1?'#ffd9a1':s.zone===2?'#d6efaf':'#f8e8bd');}c.restore();}
  drawMinimap(s){const c=this.mctx,w=this.minimap.width,h=this.minimap.height,scaleX=w/WORLD.width,scaleY=h/WORLD.height;c.clearRect(0,0,w,h);c.drawImage(this.assets[s.area],0,0,w,h);c.fillStyle='#071b3077';c.fillRect(0,0,w,h);
    for(const o of arenaObstacles(s.area)){c.beginPath();c.ellipse(o.x*scaleX,o.y*scaleY,o.rx*scaleX,o.ry*scaleY,0,0,TAU);c.fillStyle='#1c3028cc';c.fill();c.strokeStyle='#e4ca9580';c.lineWidth=.8;c.stroke();}
    const marker=(point,color,r=3)=>{c.beginPath();c.arc(point.x*scaleX,point.y*scaleY,r,0,TAU);c.fillStyle=color;c.fill();c.strokeStyle='#071b25';c.lineWidth=1;c.stroke();};
    for(const r of s.world.relays)marker(r,r.status==='online'?'#b9e8c2':'#e8c682',4);for(const e of s.world.enemies.filter(e=>!e.dead&&e.awake))marker(e,ENEMIES[e.type].boss?'#ffdb82':'#ed8a72',ENEMIES[e.type].boss?5:2);if(s.world.gate)marker(s.world.gate,s.world.gate.open?'#ffedba':'#8b9ca2',4);if(s.world.camp)marker(s.world.camp,'#9ddec6',5);for(const m of s.world.camp?.services||[])marker(m,'#eccc92',3);for(const portal of this.visiblePortals||[])marker(portal,'#f1d08c',4);for(const loot of s.world.loot)marker(loot,'#d8b2ef',3);if(s.area==='highway')marker(NORA,s.quests?.noodstroom?.status==='ready'?'#fff1ab':'#e7c783',4);marker(s.player,'#e4fbfa',4);
    c.strokeStyle='#ecedbc66';c.lineWidth=1;c.strokeRect(this.camera.x*scaleX,this.camera.y*scaleY,this.viewWidth*scaleX,this.viewHeight*scaleY);
  }
}

Object.assign(Renderer.prototype,ExpeditionVisuals,EnemyCombatVisuals,QuestVisuals,EnemyAreaVisuals);
