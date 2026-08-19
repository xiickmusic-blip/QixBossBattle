// RAID QIX v1.2.2
// Clean one-screen loadout + separate fusion tab + slightly improved rarity drop rates.

function setLoadoutTab(tab){
  const gear=tab==='gear';
  document.getElementById('loadoutTabGear').classList.toggle('active',gear);
  document.getElementById('loadoutTabFusion').classList.toggle('active',!gear);
  document.getElementById('loadoutGearView').classList.toggle('active',gear);
  document.getElementById('loadoutFusionView').classList.toggle('active',!gear);
  if(gear)renderLoadoutV122();
  else renderFusionInventoryV122();
}
document.getElementById('loadoutTabGear').onclick=()=>setLoadoutTab('gear');
document.getElementById('loadoutTabFusion').onclick=()=>setLoadoutTab('fusion');

function renderSkillCompactV122(){
  const sg=document.getElementById('skillGrid');if(!sg)return;
  sg.innerHTML='';
  for(const s of DATA.skills){
    const el=document.createElement('button');
    el.className='card'+(state.equippedSkill===s.id?' selected':'');
    el.innerHTML=`<strong>${s.name}</strong><small>${s.description}<br>CD ${s.cooldown}s</small>`;
    el.onclick=()=>{state.equippedSkill=s.id;save('raidqix.skill',s.id);renderSkillCompactV122()};
    sg.appendChild(el);
  }
}

function renderLoadoutV122(){
  renderSkillCompactV122();
  renderEquipSlots();
  v121RenderInventory();
  const selected=proceduralCharmByUid(state.selectedInventoryCharm);
  v121RenderDetail(selected||null);
}

function renderFusionInventoryV122(){
  const grid=document.getElementById('fusionInventoryGrid');if(!grid)return;
  grid.innerHTML='';
  const sorted=[...state.inventory].sort((a,b)=>b.rarity-a.rarity||a.name.localeCompare(b.name));
  const slotCount=Math.max(45,Math.ceil(sorted.length/9)*9);
  for(let i=0;i<slotCount;i++){
    const c=sorted[i];
    const el=document.createElement('button');
    if(!c){
      el.className='mcSlot empty';el.disabled=true;grid.appendChild(el);continue;
    }
    el.className=`mcSlot rarity-R${c.rarity}`;
    el.draggable=true;
    el.title=`${c.name}\n${CHARM_RARITY_LABEL[c.rarity]} · ${charmAffixText(c)}`;
    el.innerHTML=`<span class="slotFx">${c.affixes.length}FX</span><span class="slotGlyph">${charmGlyph(c)}</span><span class="slotRank">R${c.rarity}</span>`;
    el.ondragstart=e=>e.dataTransfer.setData('text/charm-uid',c.uid);
    grid.appendChild(el);
  }
  renderFusionSlots();
  updateFusionStatus();
}

renderLoadout=renderLoadoutV122;

const _v121FuseFive122=fuseFive;
fuseFive=function(){
  _v121FuseFive122();
  renderLoadoutV122();
  renderFusionInventoryV122();
};
document.getElementById('fusionButton').onclick=fuseFive;

function rollRewardRarityV122(depth=1){
  const bonus=Math.min(.16,Math.max(0,depth-1)*.006);
  const r=Math.random();
  if(r < .58-bonus) return 1;
  if(r < .82-bonus*.45) return 2;
  if(r < .94-bonus*.18) return 3;
  if(r < .989) return 4;
  return 5;
}

grantReward=function(){
  const rarity=rollRewardRarityV122(1);
  const charm=rollProceduralCharm(rarity);
  state.inventory.push(charm);
  save('raidqix.inventory',state.inventory);
  queueRewards([charm]);
};

v09GrantRandomRunRewards=function(count){
  const rewards=[];
  for(let i=0;i<count;i++){
    const depth=i+1;
    const rarity=rollRewardRarityV122(depth);
    const charm=rollProceduralCharm(rarity);
    state.inventory.push(charm);rewards.push(charm);
  }
  save('raidqix.inventory',state.inventory);
  return rewards;
};

const _v12OpenScreen122=openScreen;
openScreen=function(id){
  _v12OpenScreen122(id);
  if(id==='loadoutScreen'){
    setLoadoutTab('gear');
    renderLoadoutV122();
  }
};

setLoadoutTab('gear');
