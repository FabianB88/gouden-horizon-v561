import {ENEMIES} from './data.js?v=16';
export const EncounterVisuals={
 drawEncounterWarning(e,w,progress){const color=ENEMIES[e.type].color,dir=w.dir;
  if(['toxicFan','venomFan'].includes(w.mode)){for(const off of [-.34,0,.34]){const a=Math.atan2(dir.y,dir.x)+off;this.line(e,{x:e.x+Math.cos(a)*420,y:e.y+Math.sin(a)*420/1.15},'#b7df6d70',2);}return true;}
  if(w.mode==='venomJet'){const end={x:e.x+dir.x*380,y:e.y+dir.y*380/1.15};this.line(e,end,'#b7df6d25',54);this.line(e,end,'#d6f799',2);return true;}
  if(['acidPool','toxicVolley'].includes(w.mode)){for(const i of w.mode==='acidPool'?[0]:[-1,0,1]){const x=w.target.x-dir.y*i*100,y=w.target.y+dir.x*i*100/1.15,r=w.mode==='acidPool'?88:48;this.ellipse(x,y,r,r/1.15,'#b8dc5525','#c8ed79',2);this.ellipse(x,y,r*progress,r*progress/1.15,null,'#f0ffd2',2);}return true;}
  if(['arcDash','clawRush','shieldBash','tether'].includes(w.mode)){const length=w.mode==='tether'?Math.hypot(w.target.x-e.x,(w.target.y-e.y)*1.15):w.mode==='shieldBash'?126:280,end={x:e.x+dir.x*length,y:e.y+dir.y*length/1.15};this.line(e,end,color+'25',w.mode==='tether'?46:(e.radius+24)*2);this.line(e,end,color,2);this.line(e,{x:e.x+(end.x-e.x)*progress,y:e.y+(end.y-e.y)*progress},'#fff3d1',3);return true;}
  if(w.mode==='roots'){for(const point of w.targets){const a={x:point.x-dir.x*165,y:point.y-dir.y*165/1.15},b={x:point.x+dir.x*165,y:point.y+dir.y*165/1.15};this.line(a,b,color+'25',48);this.line(a,b,color,2);}return true;}
  if(['burrow','cinderTrail'].includes(w.mode)){for(const point of w.targets||[w.target]){const r=w.mode==='burrow'?85:64;this.ellipse(point.x,point.y,r,r/1.15,color+'20',color,2);this.ellipse(point.x,point.y,r*progress,r*progress/1.15,null,'#fff3ce',2);}return true;}
  if(['cinders','shieldFan','orbs','mirrorFan','seedVolley'].includes(w.mode)){const count=w.mode==='mirrorFan'?7:w.mode==='seedVolley'?5:3,spread=w.mode==='shieldFan'?.34:w.mode==='mirrorFan'||w.mode==='seedVolley'?.24:.32;for(let i=0;i<count;i++){const a=Math.atan2(dir.y,dir.x)+(i-(count-1)/2)*spread;this.line(e,{x:e.x+Math.cos(a)*440,y:e.y+Math.sin(a)*440/1.15},color+'70',1.5);}return true;}
  if(w.mode==='hatch'){this.ellipse(e.x,e.y,110,110/1.15,color+'20',color,2);this.text('VERSTERKING',e.x,e.y-115,color,12);return true;}
  if(w.mode==='tidalRing'){this.ellipse(e.x,e.y,440,440/1.15,null,color+'77',2);this.ellipse(e.x,e.y,65+progress*40,(65+progress*40)/1.15,null,'#e6ffff',4);return true;}
  if(w.mode==='solarSweep'){for(const offset of [-.55,0,.55]){const a=Math.atan2(dir.y,dir.x)+offset;this.line(e,{x:e.x+Math.cos(a)*540,y:e.y+Math.sin(a)*540/1.15},color+'90',2);}return true;}
  if(w.mode==='sunWheel'){for(let i=0;i<8;i++){const a=e.angle+i*Math.PI/4;this.line(e,{x:e.x+Math.cos(a)*300,y:e.y+Math.sin(a)*300/1.15},color+'70',2);}return true;}
  if(w.mode==='shieldBash'){this.ellipse(e.x,e.y,155,155/1.15,color+'20',color,2);return true;}
  return false;
 },
 drawEncounterThreat(t){
  if(t.type==='toxicPool'){const active=t.age>=t.arm;this.ellipse(t.x,t.y,t.r,t.r/1.15,active?'#80bd4760':'#b2df4820','#c7e586',2);for(let i=0;i<7;i++){const a=i*2.4,r=t.r*(.2+(i%4)*.17);this.ellipse(t.x+Math.cos(a)*r,t.y+Math.sin(a)*r/1.15-((this.time*15+i*11)%30),active?3:1.5,4,'#c4ee8399');}return;}
  if(t.type==='frostwake'){const end={x:t.x+t.dir.x*t.length,y:t.y+t.dir.y*t.length/1.15};this.line(t,end,'#a9edff24',t.r*2);this.line(t,end,'#d9faff88',2);return;}
  if(t.type==='wake'){this.ellipse(t.x,t.y,t.r,t.r/1.15,'#93e8e21c','#93e8e280',2);for(let i=0;i<3;i++){const r=(t.age*40+i*24)%t.r;this.ellipse(t.x,t.y,r,r/1.15,null,'#ceffff55',1);}return;}
  if(t.type==='ring'){const r=t.r+t.age*t.speed;this.ellipse(t.x,t.y,r,r/1.15,null,t.color+'c0',14);this.ellipse(t.x,t.y,r-8,(r-8)/1.15,null,'#eefff4',2);return;}
  if(t.type==='burst'||t.type==='eruption'){const progress=Math.min(1,t.age/t.arm);if(t.age<t.arm){this.ellipse(t.x,t.y,t.r,t.r/1.15,t.color+'24',t.color,2);this.ellipse(t.x,t.y,t.r*progress,t.r/1.15*progress,null,'#fff0c2',2);}return;}
  if(t.type==='tether'){this.line(t,t.target,t.color+'40',32);this.line(t,t.target,'#d4f7eb',2+Math.sin(t.age*24));return;}
  if(t.type==='wakeLine'){const end={x:t.x+t.dir.x*t.length,y:t.y+t.dir.y*t.length/1.15};this.line(t,end,t.color+(t.age<t.arm?'25':'65'),t.width*2);this.line(t,end,t.color,2);return;}
 }
};
