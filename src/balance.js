import {ENEMIES} from './data.js?v=16';

// Snapshot strength when an enemy enters the encounter. Equipment changes and
// later level-ups never refill or repeatedly enlarge a living enemy's health.
export function scaleEnemy(enemy,zone,playerLevel){
 if(enemy.balanceVersion===1)return enemy;
 const base=ENEMIES[enemy.type],level=Math.max(1,1+zone*2,playerLevel||1),growth=Math.min(10,level-1);
 const fraction=enemy.maxHp?Math.max(0,Math.min(1,enemy.hp/enemy.maxHp)):1;
 enemy.level=level+(enemy.elite?2:0);
 enemy.maxHp=Math.round(base.hp*1.10*(1+zone*.30)*(1+growth*.075)*(enemy.elite?1.7:1));
 enemy.hp=enemy.dead?0:enemy.maxHp*fraction;
 enemy.damageMultiplier=1+zone*.12+growth*.02;
 enemy.speedMultiplier=1+Math.min(.10,growth*.008+zone*.012);
 enemy.cooldownMultiplier=1/(1+zone*.03+growth*.008);
 enemy.balanceVersion=1;
 return enemy;
}
