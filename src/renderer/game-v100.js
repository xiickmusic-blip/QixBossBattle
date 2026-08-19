// RAID QIX v1.0.0
// Smaller player hurtbox, laser-start cleanup, loot reveal flow, and procedural hack-and-slash charms.

const PLAYER_HIT_RADIUS=4.5;

function playerHurtRadius(){return PLAYER_HIT_RADIUS}

const _v092UpdateSweepLasers100=updateSweepLasers;
updateSweepLasers=function(dt,advance=true){const old=player.r;player.r=PLAYER_HIT_RADIUS;_v092UpdateSweepLasers100(dt,advance);player.r=old;};
const _v091UpdateTelegraphs100=updateTelegraphs;
updateTelegraphs=function(dt,advance=true){const old=player.r;player.r=PLAYER_HIT_RADIUS;_v091UpdateTelegraphs100(dt,advance);player.r=old;};
const _v091UpdateExtra100=updateExtraTelegraphs;
updateExtraTelegraphs=function(dt,advance=true){const old=player.r;player.r=PLAYER_HIT_RADIUS;_v091UpdateExtra100(dt,advance);player.r=old;};
const _v08UpdateProjectiles100=updateProjectiles;
updateProjectiles=function(dt){const old=player.r;player.r=PLAYER_HIT_RADIUS;_v08UpdateProjectiles100(dt);player.r=old;};

function clearAllLaserState(){state.sweepLasers=[];state.v091BeamFx=[];state.v091LaserTimer=Math.max(1.4,v08Rand(1.4,2.1));state.v091LaserAngle=Math.random()*Math.PI*2;state.randomLaserAngle=Math.random()*Math.PI*2;}
const _v092ResetBoss100=resetBoss;
resetBoss=function(){_v092ResetBoss100();clearAllLaserState();};
const _v092SetupFloor100=setupRandomBossForFloor;
setupRandomBossForFloor=function(floor,first=false){_v092SetupFloor100(floor,first);clearAllLaserState();state.randomGimmickTimer=Math.max(state.randomGimmickTimer||0,1.15);};

const CHARM_AFFIXES=[
{key:'SPD',label:'Move Speed',unit:'%',apply:(m,v)=>m.moveSpeedMultiplier*=1+v*.02},
{key:'HP',label:'Max HP',unit:'',apply:(m,v)=>m.maxHpAdd+=Math.max(1,Math.ceil(v/2))},
{key:'CDR',label:'Skill Cooldown',unit:'%',apply:(m,v)=>m.cooldownMultiplier*=Math.max(.55,1-v*.03)},
{key:'DRAW',label:'Draw Speed',unit:'%',apply:(m,v)=>m.drawingSpeedMultiplier*=1+v*.025},
{key:'CORE',label:'Core Damage',unit:'%',apply:(m,v)=>m.relicDamageMultiplier*=1+v*.04},
{key:'SAVE',label:'Death Save',unit:'',apply:(m,v)=>m.deathSaveCharges+=v>=4?1:0},
{key:'DASH',label:'Dash Power',unit:'%',apply:(m,v)=>{}},{key:'LUCK',label:'Loot Luck',unit:'',apply:(m,v)=>{}},{key:'ARM',label:'Impact Guard',unit:'',apply:(m,v)=>{}},{key:'ARC',label:'Arc Control',unit:'',apply:(m,v)=>{}}
];
const CHARM_RARITY_LABEL={1:'COMMON',2:'UNCOMMON',3:'RARE',4:'EPIC',5:'LEGENDARY'};
const CHARM_RARITY_COLOR={1:'#a7b0bd',2:'#4bdf7a',3:'#4aa4ff',4:'#c06cff',5:'#ffbf46'};
function proceduralCharmId(){return 'pc_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function proceduralCharmName(affixes){const first=affixes[0]?.key||'VOID';const suffix=['COIL','RELIC','SIGIL','NODE','SHARD','DRIVE','GLYPH'][Math.floor(Math.random()*7)];return `${first} ${suffix}`}
function rollProceduralCharm(rarity=1){rarity=Math.max(1,Math.min(5,rarity|0));const affixes=[];for(let i=0;i<rarity;i++){const def=CHARM_AFFIXES[Math.floor(Math.random()*CHARM_AFFIXES.length)];affixes.push({key:def.key,value:1+Math.floor(Math.random()*5)});}return {uid:proceduralCharmId(),name:proceduralCharmName(affixes),rarity,affixes};}
function normalizeCharm(item){if(item&&typeof item==='object'&&item.uid&&Array.isArray(item.affixes))return item;const legacy=DATA.charms.find(c=>c.id===item);if(legacy){let key='SPD';if(legacy.modifiers?.maxHpAdd)key='HP';else if(legacy.modifiers?.cooldownMultiplier)key='CDR';else if(legacy.modifiers?.drawingSpeedMultiplier)key='DRAW';else if(legacy.modifiers?.relicDamageMultiplier)key='CORE';else if(legacy.modifiers?.deathSaveCharges)key='SAVE';return {uid:proceduralCharmId(),name:legacy.name,rarity:1,affixes:[{key,value:1}]};}return null;}
function migrateInventory(){let changed=false;state.inventory=state.inventory.map(x=>{const n=normalizeCharm(x);if(n!==x)changed=true;return n}).filter(Boolean);state.equippedCharms=state.equippedCharms.map(id=>{if(typeof id==='object')return id.uid;const match=state.inventory.find(x=>x.name===DATA.charms.find(c=>c.id===id)?.name);return match?.uid||id;}).filter(Boolean).slice(0,2);if(changed){save('raidqix.inventory',state.inventory);save('raidqix.charms',state.equippedCharms);}}
migrateInventory();
function proceduralCharmByUid(uid){return state.inventory.find(c=>c.uid===uid)}
function charmAffixText(charm){return charm.affixes.map(a=>{const d=CHARM_AFFIXES.find(x=>x.key===a.key);return `${a.key}+${a.value}${d?.unit||''}`;}).join(' · ')}
function charmDetailHtml(charm){return `<strong>${charm.name}</strong><small style="color:${CHARM_RARITY_COLOR[charm.rarity]}">${CHARM_RARITY_LABEL[charm.rarity]} · ${charm.rarity} EFFECT${charm.rarity>1?'S':''}</small><div style="margin-top:14px;line-height:1.8">${charm.affixes.map(a=>{const d=CHARM_AFFIXES.find(x=>x.key===a.key);return `<div><b>${a.key}+${a.value}</b> · ${d?.label||a.key}</div>`;}).join('')}</div>`;}
modifiers=function(){const m={moveSpeedMultiplier:1,drawingSpeedMultiplier:1,maxHpAdd:0,cooldownMultiplier:1,relicDamageMultiplier:1,deathSaveCharges:0};for(const uid of state.equippedCharms){const charm=proceduralCharmByUid(uid);if(!charm)continue;for(const a of charm.affixes){const d=CHARM_AFFIXES.find(x=>x.key===a.key);d?.apply(m,a.value);}}return m;};

Object.assign(state,{rewardQueue:[],rewardRevealIndex:0});
function queueRewards(charms){state.rewardQueue=charms;state.rewardRevealIndex=0;const cards=document.getElementById('rewardCards');cards.innerHTML='';document.getElementById('rewardProgress').textContent=`0 / ${charms.length}`;document.getElementById('rewardOpenNext').style.display=charms.length?'inline-block':'none';document.getElementById('rewardContinue').style.display=charms.length?'none':'inline-block';document.getElementById('rewardHoverDetail').innerHTML='<strong>HOVER A REWARD</strong><small>開封後、カーソルを合わせると効果を確認できます。</small>';charms.forEach((c,i)=>{const el=document.createElement('div');el.className=`card rewardCard rarity-R${c.rarity}`;el.dataset.index=i;el.innerHTML='<strong>???</strong><small>SEALED</small>';cards.appendChild(el);});openScreen('rewardScreen');}
function revealNextReward(){if(state.rewardRevealIndex>=state.rewardQueue.length)return;const i=state.rewardRevealIndex++,charm=state.rewardQueue[i];const el=document.querySelector(`.rewardCard[data-index="${i}"]`);if(el){el.classList.add('revealed');el.classList.add(`rarity-R${charm.rarity}`);el.innerHTML=`<strong>${charm.name}</strong><small>${CHARM_RARITY_LABEL[charm.rarity]}</small>`;el.onmouseenter=()=>{document.getElementById('rewardHoverDetail').innerHTML=charmDetailHtml(charm)};}document.getElementById('rewardProgress').textContent=`${state.rewardRevealIndex} / ${state.rewardQueue.length}`;if(state.rewardRevealIndex>=state.rewardQueue.length){document.getElementById('rewardOpenNext').style.display='none';document.getElementById('rewardContinue').style.display='inline-block';}}
document.getElementById('rewardOpenNext').onclick=revealNextReward;
grantReward=function(){const charm=rollProceduralCharm(1+Math.floor(Math.random()*2));state.inventory.push(charm);save('raidqix.inventory',state.inventory);queueRewards([charm]);};
v09GrantRandomRunRewards=function(count){const rewards=[];for(let i=0;i<count;i++){const depth=i+1;const maxR=Math.min(5,1+Math.floor(depth/5));const rarity=1+Math.floor(Math.random()*maxR);const charm=rollProceduralCharm(rarity);state.inventory.push(charm);rewards.push(charm);}save('raidqix.inventory',state.inventory);return rewards;};
const _v09PlayerHit100=playerHit;
playerHit=function(){const wasRandom=!!state.randomRun?.active;const before=playerHP;_v09PlayerHit100();if(wasRandom&&before>0&&playerHP<=0){const defeated=Math.max(0,(state.randomRun?.floor||1)-1);if(!state.v100DeathRewardDone){state.v100DeathRewardDone=true;const rewards=v09GrantRandomRunRewards(defeated);setTimeout(()=>queueRewards(rewards),1120);}}};
const _v092SetupRandom100=setupRandomBossForFloor;
setupRandomBossForFloor=function(floor,first=false){_v092SetupRandom100(floor,first);if(first)state.v100DeathRewardDone=false;};

Object.assign(state,{selectedInventoryCharm:null,fusionCharmUids:[null,null,null,null,null]});
function v100RenderInventory(){const grid=document.getElementById('inventoryGrid');if(!grid)return;grid.innerHTML='';const sorted=[...state.inventory].sort((a,b)=>b.rarity-a.rarity||a.name.localeCompare(b.name));for(const c of sorted){const el=document.createElement('button');el.className=`card inventoryItem rarity-R${c.rarity}${state.selectedInventoryCharm===c.uid?' selected':''}`;el.draggable=true;el.dataset.uid=c.uid;el.innerHTML=`<span class="inventoryCount">${c.affixes.length}FX</span><strong>${c.name}</strong><small>${CHARM_RARITY_LABEL[c.rarity]} · ${charmAffixText(c)}</small>`;el.onclick=()=>{state.selectedInventoryCharm=c.uid;v100RenderInventory();v100RenderDetail(c)};el.ondragstart=e=>{e.dataTransfer.setData('text/charm-uid',c.uid)};grid.appendChild(el);}document.getElementById('inventoryText').textContent=`OWNED CHARMS: ${state.inventory.length}`;}
function v100RenderDetail(c){const el=document.getElementById('itemDetail');if(!el)return;if(!c){el.innerHTML='<strong>SELECT AN ITEM</strong>';return}el.className=`card rarity-R${c.rarity}`;el.innerHTML=charmDetailHtml(c)+`<button id="detailEquip" class="btn" style="margin-top:18px;width:100%"><strong>${state.equippedCharms.includes(c.uid)?'UNEQUIP':'EQUIP'}</strong></button>`;document.getElementById('detailEquip').onclick=()=>{const i=state.equippedCharms.indexOf(c.uid);if(i>=0)state.equippedCharms.splice(i,1);else if(state.equippedCharms.length<2)state.equippedCharms.push(c.uid);else state.equippedCharms[1]=c.uid;save('raidqix.charms',state.equippedCharms);v100RenderDetail(c);updateHud();};}
function renderFusionSlots(){document.querySelectorAll('.fusionSlot').forEach((el,i)=>{const uid=state.fusionCharmUids[i],c=proceduralCharmByUid(uid);el.className=`card fusionSlot${c?' filled rarity-R'+c.rarity:''}`;el.innerHTML=c?`<strong>${c.name}</strong><small>${CHARM_RARITY_LABEL[c.rarity]} · ${charmAffixText(c)}</small>`:`<strong>DROP</strong><small>${i+1}</small>`;el.ondragover=e=>e.preventDefault();el.ondrop=e=>{e.preventDefault();const uid=e.dataTransfer.getData('text/charm-uid');if(!uid)return;const old=state.fusionCharmUids.indexOf(uid);if(old>=0)state.fusionCharmUids[old]=null;state.fusionCharmUids[i]=uid;renderFusionSlots();updateFusionStatus();};el.onclick=()=>{if(state.fusionCharmUids[i]){state.fusionCharmUids[i]=null;renderFusionSlots();updateFusionStatus();}};});}
function updateFusionStatus(){const items=state.fusionCharmUids.map(proceduralCharmByUid).filter(Boolean);let msg=`${items.length}/5 SET`;if(items.length===5){const same=items.every(c=>c.rarity===items[0].rarity);msg+=same?(items[0].rarity>=5?' · R5は最大レアリティ':' · READY'):' · 5個とも同レアリティが必要';}document.getElementById('fusionStatus').textContent=msg;}
function fuseFive(){const items=state.fusionCharmUids.map(proceduralCharmByUid);if(items.some(x=>!x)){document.getElementById('fusionStatus').textContent='5個セットしてください';return}const rarity=items[0].rarity;if(!items.every(c=>c.rarity===rarity)){document.getElementById('fusionStatus').textContent='同じレアリティ5個が必要です';return}if(rarity>=5){document.getElementById('fusionStatus').textContent='R5が最大です';return}const uids=new Set(items.map(c=>c.uid));state.inventory=state.inventory.filter(c=>!uids.has(c.uid));state.equippedCharms=state.equippedCharms.filter(uid=>!uids.has(uid));const result=rollProceduralCharm(rarity+1);state.inventory.push(result);state.fusionCharmUids=[null,null,null,null,null];state.selectedInventoryCharm=result.uid;save('raidqix.inventory',state.inventory);save('raidqix.charms',state.equippedCharms);renderLoadout();renderFusionSlots();v100RenderDetail(result);document.getElementById('fusionStatus').textContent=`FUSED → ${result.name} / ${CHARM_RARITY_LABEL[result.rarity]} / ${charmAffixText(result)}`;}
document.getElementById('fusionButton').onclick=fuseFive;
const _v09RenderLoadout100=renderLoadout;
renderLoadout=function(){_v09RenderLoadout100();const cg=document.getElementById('charmGrid');cg.innerHTML='';for(const uid of state.equippedCharms){const c=proceduralCharmByUid(uid);if(!c)continue;const el=document.createElement('button');el.className=`card rarity-R${c.rarity}`;el.innerHTML=`<strong>${c.name}</strong><small>${charmAffixText(c)}</small>`;el.onclick=()=>{state.selectedInventoryCharm=c.uid;v100RenderDetail(c)};cg.appendChild(el);}v100RenderInventory();const selected=proceduralCharmByUid(state.selectedInventoryCharm);if(selected)v100RenderDetail(selected);renderFusionSlots();updateFusionStatus();};
charmDefs=function(){return state.equippedCharms.map(proceduralCharmByUid).filter(Boolean)};
document.getElementById('rewardContinue').onclick=()=>{state.rewardQueue=[];state.rewardRevealIndex=0;renderLoadout();openScreen('titleScreen');};
