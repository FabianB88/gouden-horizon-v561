// Each footprint is the solid ground base of its painted prop, in world pixels.
// Open courts stay open elsewhere; these three chapters have distinct lanes.
export const ARENA_LAYOUTS={
 delta:[
  {id:'pump-island',art:'pump',frame:0,x:940,y:640,rx:110,ry:65,height:245},
  {id:'broken-pipe',art:'pump',frame:1,x:1180,y:545,rx:66,ry:42,height:160}
 ],
 mirrors:[
  {id:'north-mirror',art:'mirror',frame:0,x:880,y:505,rx:105,ry:65,height:235},
  {id:'south-mirror',art:'mirror',frame:1,x:1130,y:780,rx:100,ry:60,height:210}
 ],
 glass:[
  {id:'west-roots',art:'roots',frame:0,x:800,y:595,rx:95,ry:65,height:230},
  {id:'east-roots',art:'roots',frame:0,x:1170,y:620,rx:105,ry:70,height:250},
  {id:'lower-roots',art:'roots',frame:1,x:1030,y:865,rx:70,ry:45,height:150}
 ]
};
export const arenaObstacles=area=>ARENA_LAYOUTS[area]||[];
export function blockedByObstacle(x,y,radius=0,area){return arenaObstacles(area).some(o=>((x-o.x)/(o.rx+radius))**2+((y-o.y)/(o.ry+radius))**2<=1);}
// Swept ellipse collision stops fast bolts at the front face, never after
// hitting an enemy behind the cover. Lobs and overhead spells fly over it.
export function coverHit(a,b,area,radius=0){
 let hit=null,best=Infinity;
 for(const o of arenaObstacles(area)){
  const rx=o.rx+radius,ry=o.ry+radius,x=(a.x-o.x)/rx,y=(a.y-o.y)/ry,dx=(b.x-a.x)/rx,dy=(b.y-a.y)/ry;
  const c=x*x+y*y-1;if(c<=0){if(best>0){best=0;hit={x:a.x,y:a.y,obstacle:o};}continue;}
  const aa=dx*dx+dy*dy,bb=2*(x*dx+y*dy),d=bb*bb-4*aa*c;if(aa===0||d<0)continue;
  const t=(-bb-Math.sqrt(d))/(2*aa);if(t>=0&&t<=1&&t<best){best=t;hit={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,obstacle:o};}
 }return hit;
}
