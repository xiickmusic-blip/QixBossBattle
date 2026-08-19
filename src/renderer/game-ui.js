function updateHud(){
  const d=bossDef();
  document.getElementById('bossName').textContent=state.mode==='raid'?`${d.name} — BOSS ${d.number}`:'NO BOSS';
  document.getElementById('bossSubtitle').textContent=state.mode==='raid'?d.subtitle:'SELECT RAID';
  document.getElementById('bossHp').style.width=state.boss?`${Math.max(0,state.boss.hp/state.boss.maxHp*100)}%`:'0%';
  document.getElementById('bossHp').style.background=d.accent;
  document.getElementById('area').textContent=Math.floor(state.area);
  document.getElementById('relics').textContent=state.relicCount;
  document.getElementById('coreTotal').textContent=state.relics.length||8;
  document.getElementById('damage').textContent=state.damage;
  document.getElementById('hp').textContent=`${playerHP}/${playerMaxHP}`;
  const s=skillDef(),sh=document.getElementById('skillHud');
  sh.textContent=state.skillCooldown>0?`${s.name} ${state.skillCooldown.toFixed(1)}s`:`${s.name} [E]`;
  sh.className=state.skillCooldown>0?'skillCooldown':'skillReady';
  const cds=charmDefs();
  document.getElementById('charmAHud').textContent=cds[0]?.name||'-';
  document.getElementById('charmBHud').textContent=cds[1]?.name||'-';
}

function openScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  if(id!=='rewardScreen'&&id!=='settingsScreen'&&id!=='loadoutScreen'&&id!=='lobbyScreen'&&id!=='soloScreen')state.mode='menu';
  if(id==='loadoutScreen')renderLoadout();
  if(id==='lobbyScreen')refreshSteam();
}
document.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>openScreen(el.dataset.open));

function renderBossCards(targetId){
  const target=document.getElementById(targetId);target.innerHTML='';
  for(const b of DATA.bosses){
    const el=document.createElement('button');el.className='card'+(state.bossId===b.id?' selected':'');
    el.innerHTML=`<strong>BOSS ${b.number} · ${b.name}</strong><small>${b.description}</small>`;
    el.onclick=()=>{state.bossId=b.id;renderBossCards('soloBossGrid');renderBossCards('lobbyBossGrid')};
    target.appendChild(el);
  }
}
renderBossCards('soloBossGrid');renderBossCards('lobbyBossGrid');
document.getElementById('soloStart').onclick=()=>startRaid(false,false);

function startRaid(multiplayer,broadcast){
  state.multiplayer=multiplayer;state.mode='raid';
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  resetGame();
  if(multiplayer&&broadcast)sendNet({type:'raid-start',bossId:state.bossId,relics:state.relics,grid:cloneGrid()});
}
function renderLoadout(){
  const sg=document.getElementById('skillGrid');sg.innerHTML='';
  for(const s of DATA.skills){
    const el=document.createElement('button');el.className='card'+(state.equippedSkill===s.id?' selected':'');
    el.innerHTML=`<strong>${s.name}</strong><small>${s.description}<br>CD ${s.cooldown}s</small>`;
    el.onclick=()=>{state.equippedSkill=s.id;save('raidqix.skill',s.id);renderLoadout()};sg.appendChild(el);
  }
  const cg=document.getElementById('charmGrid');cg.innerHTML='';
  for(const c of DATA.charms.filter(c=>state.inventory.includes(c.id))){
    const el=document.createElement('button');el.className='card'+(state.equippedCharms.includes(c.id)?' selected':'');
    el.innerHTML=`<strong>${c.name}</strong><small>${c.rarity} · ${c.description}</small>`;
    el.onclick=()=>toggleCharm(c.id);cg.appendChild(el);
  }
  document.getElementById('inventoryText').textContent=`OWNED CHARMS: ${state.inventory.length} · DUPLICATES ARE KEPT FOR FUTURE SYSTEMS`;
}
function toggleCharm(id){
  const a=[...state.equippedCharms],i=a.indexOf(id);
  if(i>=0)a.splice(i,1);else if(a.length<2)a.push(id);else a[1]=id;
  state.equippedCharms=a;save('raidqix.charms',a);renderLoadout();updateHud();
}

const volume=document.getElementById('volume');
volume.value=state.settings.volume;
document.getElementById('screenShake').checked=state.settings.screenShake;
document.getElementById('pixelMode').checked=state.settings.pixelMode;
document.getElementById('volLabel').textContent=volume.value;
volume.oninput=()=>{state.settings.volume=+volume.value;document.getElementById('volLabel').textContent=volume.value;save('raidqix.settings',state.settings)};
document.getElementById('screenShake').onchange=e=>{state.settings.screenShake=e.target.checked;save('raidqix.settings',state.settings)};
document.getElementById('pixelMode').onchange=e=>{state.settings.pixelMode=e.target.checked;save('raidqix.settings',state.settings)};
document.getElementById('rewardContinue').onclick=()=>{renderLoadout();openScreen('titleScreen')};

async function refreshSteam(){
  if(!window.raidAPI){document.getElementById('steamStatus').textContent='Electron bridge unavailable';return}
  applySteamState(await window.raidAPI.getSteamState());
}
function applySteamState(s){
  state.members=s.members||[];state.localSteamId=s.localId||state.localSteamId;
  document.getElementById('steamStatus').textContent=s.enabled?`STEAM ONLINE${s.lobbyId?' · '+s.lobbyId:''}`:'OFFLINE FALLBACK';
  renderMembers();
}
function renderMembers(){
  const el=document.getElementById('members');
  el.innerHTML=state.members.length?state.members.map(m=>`<div class="member">${m.host?'HOST · ':''}${m.name}</div>`).join(''):'<div class="muted">No lobby members</div>';
}
function sendNet(payload){return window.raidAPI?.send(payload).catch(()=>false)}
document.getElementById('createLobby').onclick=async()=>{const s=await window.raidAPI.createLobby({maxMembers:4});state.isHost=true;applySteamState(s)};
document.getElementById('joinLobby').onclick=async()=>{
  const id=document.getElementById('lobbyIdInput').value.trim();if(!id)return;
  const s=await window.raidAPI.joinLobby(id);state.isHost=false;applySteamState(s);
};
document.getElementById('leaveLobby').onclick=async()=>{await window.raidAPI.leaveLobby();state.members=[];state.isHost=false;state.remotePlayers.clear();renderMembers();refreshSteam()};
document.getElementById('lobbyStart').onclick=()=>{if(state.isHost)startRaid(true,true)};

function onNetMessage(m){
  if(!m||m.senderId===state.localSteamId)return;
  if(m.type==='lobby-state'){applySteamState(m);return}
  if(m.type==='raid-start'&&!state.isHost){
    state.bossId=m.bossId;startRaid(true,false);
    if(m.relics)state.relics=m.relics;if(m.grid)setGrid(m.grid);return;
  }
  if(m.type==='player-state'&&state.mode==='raid'){
    state.remotePlayers.set(m.senderId,{x:m.x,y:m.y,drawing:m.drawing,line:m.line||[],hp:m.hp,maxHp:m.maxHp,name:m.name,updated:performance.now()});return;
  }
  if(m.type==='world-state'&&state.multiplayer&&!state.isHost&&state.mode==='raid'){
    if(m.boss&&state.boss)Object.assign(state.boss,m.boss);
    if(Array.isArray(m.projectiles))state.projectiles=m.projectiles;
    if(Number.isFinite(m.seraphLaserAngle))state.seraphLaserAngle=m.seraphLaserAngle;
    if(Number.isFinite(m.gravityPhase))state.gravityPhase=m.gravityPhase;
    if(Number.isFinite(m.gravityWaveRadius))state.gravityWaveRadius=m.gravityWaveRadius;
    if(Number.isFinite(m.gravityWaveLife))state.gravityWaveLife=m.gravityWaveLife;
    return;
  }
  if(m.type==='core-destroyed'&&state.isHost&&state.mode==='raid'&&state.boss){
    const core=state.relics.find(r=>r.id===Number(m.coreId));
    if(core&&!core.taken){
      core.taken=true;state.relicCount++;
      state.boss.hp=Math.max(remainingCores()>0?1:0,state.boss.hp-Math.max(0,Number(m.amount)||0));
      sendNet({type:'core-state',coreId:core.id,bossHp:state.boss.hp});
      if(remainingCores()===0){state.boss.hp=0;winRaid(true)}
    }
    return;
  }
  if(m.type==='core-state'&&!state.isHost&&state.mode==='raid'){
    const core=state.relics.find(r=>r.id===Number(m.coreId));
    if(core&&!core.taken){core.taken=true;state.relicCount++}
    if(state.boss&&Number.isFinite(m.bossHp))state.boss.hp=m.bossHp;
    return;
  }
  if(m.type==='capture-state'&&state.isHost&&state.mode==='raid'){mergeGrid(m.grid);sendNet({type:'grid-state',grid:cloneGrid()});return}
  if(m.type==='grid-state'&&!state.isHost&&state.mode==='raid'){setGrid(m.grid);return}
  if(m.type==='raid-clear'&&!state.isHost&&state.mode==='raid'){state.relics.forEach(r=>r.taken=true);winRaid(false)}
}
window.raidAPI?.onMessage(onNetMessage);

function networkTick(dt){
  if(!state.multiplayer||state.mode!=='raid')return;
  state.netPlayerTimer-=dt;state.netWorldTimer-=dt;
  if(state.netPlayerTimer<=0){
    state.netPlayerTimer=.08;
    const line=player.drawing?player.line.filter((_,i)=>i%Math.max(1,Math.ceil(player.line.length/60))===0):[];
    sendNet({type:'player-state',x:player.x,y:player.y,drawing:player.drawing,line,hp:playerHP,maxHp:playerMaxHP,name:state.members.find(m=>m.id===state.localSteamId)?.name||'Player'});
  }
  if(state.isHost&&state.netWorldTimer<=0){
    state.netWorldTimer=.10;
    sendNet({type:'world-state',boss:state.boss,projectiles:state.projectiles,seraphLaserAngle:state.seraphLaserAngle,gravityPhase:state.gravityPhase,gravityWaveRadius:state.gravityWaveRadius,gravityWaveLife:state.gravityWaveLife});
  }
}

let last=performance.now();
function loop(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  if(state.mode==='raid'&&!state.gameOver){
    movePlayer(dt);
    if(!state.multiplayer||state.isHost)bossAttack(dt);
    else if(bossDef().attack==='gravity')applyGravityMawField(dt,false);
    updateProjectiles(dt);updateEffects(dt);updateTimers(dt);networkTick(dt);
  }
  drawScene(now);renderPSX();updateHud();requestAnimationFrame(loop);
}

buildGrid();resizeDisplay();resetBoss();resetPlayer();refreshSteam();requestAnimationFrame(loop);
