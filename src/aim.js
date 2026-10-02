import {SPELLS} from './data.js?v=16';
export function assistedSkill(id){return Boolean(SPELLS[id]?.area||id==='ember');}
export function assistedTarget(p,enemies){
 const distance=e=>Math.hypot(e.x-p.x,(e.y-p.y)*1.15);
 const enemy=enemies.filter(e=>!e.dead&&distance(e)<650).sort((a,b)=>distance(a)-distance(b))[0];
 return enemy?{x:enemy.x,y:enemy.y-6}:{x:p.x+p.aim.x*250,y:p.y+p.aim.y*180};
}
// Clicking a projectile's icon keeps the last direction chosen on the field.
// Ground-targeted magic can retain the convenient nearest-enemy placement.
export function hotbarTarget(id,p,enemies){return assistedSkill(id)?assistedTarget(p,enemies):null;}
