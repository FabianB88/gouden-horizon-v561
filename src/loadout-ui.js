import {SPELLS,UPGRADES} from './data.js?v=16';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const art=id=>`<img class="painted-spell" src="assets/items/skill-${id}.webp" alt="" draggable="false">`;
export function bindingLabel(key){return key==='main'?'Linkermuisknop':key==='right'?'Rechtermuisknop / Q':'Slot '+(Number(key)+1);}
export function loadoutBody(p,target,icon){
 const slots=[{key:'main',label:'LINKS',id:p.mainAttack},{key:'right',label:'RECHTS / Q',id:p.rightAbility},...p.hotbar.map((id,i)=>({key:String(i),label:String(i+1),id}))];
 const chosen=slots.find(s=>s.key===target)||slots[0];
 const card=s=>`<button data-binding="${s.key}" class="binding-slot ${s.key===target?'selected':''}" aria-pressed="${s.key===target}" title="Aanval voor ${bindingLabel(s.key)} kiezen"><kbd>${s.label}</kbd><span>${s.id?art(s.id):icon('prism')}</span><strong>${s.id?SPELLS[s.id].name:'Leeg slot'}</strong><small>${s.key===target?'KIES HIERONDER':'Klik om te wijzigen'}</small></button>`;
 let html=`<p class="loadout-intro"><b>1. Klik een slot.</b> <b>2. Klik de aanval die je daarin wilt.</b> Je keuze wordt meteen opgeslagen.</p><div class="loadout-mouse">${slots.slice(0,2).map(card).join('')}</div><div class="loadout-numbers">${slots.slice(2).map(card).join('')}</div><div class="binding-heading" id="loadout-palette"><h3>Aanval kiezen voor <b>${bindingLabel(chosen.key)}</b></h3>${!['main','right'].includes(target)?'<button data-clear-binding="'+target+'" class="text-button">Slot leegmaken</button>':''}</div>`;
 if(chosen.id)html+='<p class="loadout-detail">'+escape(SPELLS[chosen.id].description)+'</p>';
 html+='<div class="loadout-spells">';
 html+=Object.entries(SPELLS).map(([id,spell])=>{
  const learned=p.skills.includes(id),available=p.level>=(spell.unlockLevel||1),canLearn=!spell.shopOnly&&available&&p.skillPoints>0;
  const places=slots.filter(s=>s.id===id).map(s=>s.label).join(' · ');
  return `<button data-loadout-skill="${id}" class="loadout-spell ${chosen.id===id?'selected':''} ${learned?'learned':'locked'}" ${!learned&&!canLearn?'disabled':''} aria-pressed="${chosen.id===id}" title="${escape(spell.description)}"><span>${art(id)}</span><div><strong>${spell.name}</strong><p>${spell.cost} mana · ${spell.interval}s herladen</p><small>${learned?(chosen.id===id?'GEPLAATST':places?'OOK OP '+places:'KLIK OM TE PLAATSEN'):spell.shopOnly?'TE KOOP BIJ VELDMAKERS · 650 SCHROOT':canLearn?'LEREN & PLAATSEN · 1 PUNT':!available?'VRIJ VANAF LEVEL '+spell.unlockLevel:'LEREN · 1 LEVELPUNT NODIG'}</small></div></button>`;
 }).join('')+'</div><p class="binding-note">Links, rechts en cijfers blijven afzonderlijk ingesteld. Plaats je dezelfde aanval op meerdere knoppen, dan delen die de herlaadtijd. In de veilige handelszone kun je geen aanvallen uitvoeren.</p>';
 html+=`<h3 class="perk-heading">Permanente verbeteringen <small>${p.skillPoints} punten beschikbaar</small></h3><div class="perk-grid">${UPGRADES.map(u=>`<button data-perk="${u.id}" ${p.skillPoints?'':'disabled'}><span>${icon(u.icon)}</span><strong>${u.name} ${p.perks[u.id]?'· '+p.perks[u.id]+'×':''}</strong><p>${u.text}</p></button>`).join('')}</div>`;
 return html;
}
