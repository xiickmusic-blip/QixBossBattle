// RAID QIX v1.2.9
// UI audit fix: one delegated UI kernel owns menu clicks and screen routing.
// Legacy per-element onclick handlers are bypassed for primary UI controls.

Object.assign(state,{
  uiKernelReady:false,
  uiSurface:state.uiSurface||'titleScreen'
});

const UI129_SCREENS=['titleScreen','loadoutScreen','settingsScreen','rewardScreen','soloScreen','lobbyScreen'];

function ui129Show(screenId){
  state.raidSurfaceActive=false;
  state.uiSurface=screenId;
  if(screenId==='titleScreen')state.mode='menu';

  for(const id of UI129_SCREENS){
    const el=document.getElementById(id);
    if(!el)continue;
    const show=id===screenId;
    el.classList.toggle('active',show);
    el.style.setProperty('display',show?'flex':'none','important');
    el.style.setProperty('visibility',show?'visible':'hidden','important');
    el.style.setProperty('pointer-events',show?'auto':'none','important');
  }

  if(screenId==='loadoutScreen'){
    try{
      setLoadoutTab('gear');
      renderLoadoutV122?.();
      renderLoadout?.();
    }catch(error){console.warn('[UI129] loadout render',error)}
  }

  if(screenId==='titleScreen'){
    try{
      renderTitleBosses?.();
      renderTrackList?.();
      renderTitleRoom?.();
      ui129ApplyMode();
    }catch(error){console.warn('[UI129] title render',error)}
  }
}

function ui129EnterRaid(){
  state.raidSurfaceActive=true;
  state.uiSurface=null;
  for(const id of UI129_SCREENS){
    const el=document.getElementById(id);
    if(!el)continue;
    el.classList.remove('active');
    el.style.setProperty('display','none','important');
    el.style.setProperty('visibility','hidden','important');
    el.style.setProperty('pointer-events','none','important');
  }
}

function ui129ApplyMode(){
  const boss=state.titleMode!=='random';
  const bossBtn=document.getElementById('titleBossMode');
  const randomBtn=document.getElementById('titleRandomMode');
  bossBtn?.classList.toggle('active',boss);
  randomBtn?.classList.toggle('active',!boss);

  const bossSection=document.getElementById('titleBossSection');
  if(bossSection)bossSection.style.display=boss?'block':'none';

  const name=document.getElementById('titleModeName');
  if(name)name.textContent=boss?'BOSS MODE':'RANDOM BOSS MODE';

  const info=document.getElementById('titleModeInfo');
  if(info)info.textContent=boss
    ?'固定ボスを選択してレイド。'
    :'死ぬまで階層を進行。ボス切替ごとにBOSS TRACKLISTから曲を抽選。';

  document.querySelector('#titleScreen .titleDeck')?.classList.toggle('random-mode',!boss);
}

function ui129RenderBosses(){
  const grid=document.getElementById('titleBossGrid');
  if(!grid)return;
  grid.innerHTML='';
  for(const b of DATA.bosses){
    const el=document.createElement('button');
    el.type='button';
    el.className='card'+(state.bossId===b.id?' selected':'');
    el.dataset.uiAction='select-boss';
    el.dataset.bossId=b.id;
    el.innerHTML=`<strong>B${b.number} · ${b.name}</strong><small>${b.description}</small>`;
    grid.appendChild(el);
  }
}
renderTitleBosses=ui129RenderBosses;

async function ui129CreateRoom(){
  if(!window.raidAPI?.createLobby)return;
  const s=await window.raidAPI.createLobby({maxMembers:4});
  state.isHost=true;
  applySteamState?.(s);
  renderTitleRoom?.();
}
async function ui129JoinRoom(){
  const id=document.getElementById('titleJoinCode')?.value.trim();
  if(!id||!window.raidAPI?.joinLobby)return;
  const s=await window.raidAPI.joinLobby(id);
  state.isHost=false;
  applySteamState?.(s);
  renderTitleRoom?.();
}
async function ui129Invite(){
  if(!state.titleLobbyId)await ui129CreateRoom();
  await window.raidAPI?.inviteLobby?.();
}
async function ui129CopyCode(){
  if(!state.titleLobbyId)return;
  try{await navigator.clipboard.writeText(String(state.titleLobbyId))}catch{}
}

function ui129AddTrack(){
  const input=document.getElementById('scUrlInput');
  const bpmInput=document.getElementById('scBpmInput');
  const url=input?.value.trim();
  if(!url)return;
  let valid=false;
  try{
    const u=new URL(url);
    valid=/(^|\.)soundcloud\.com$/i.test(u.hostname);
  }catch{}
  if(!valid)return;
  const bpm=Math.max(40,Math.min(240,Number(bpmInput?.value)||120));
  state.soundcloudPlaylist.push({id:'sc_'+Date.now().toString(36),url,bpm});
  save('raidqix.soundcloudPlaylist',state.soundcloudPlaylist);
  if(input)input.value='';
  renderTrackList?.();
}

async function ui129Start(){
  const btn=document.getElementById('titleStartRaid');
  if(btn?.disabled)return;
  try{
    if(state.titleMode==='random')await titleStartRandomMode();
    else await titleStartBossMode();
    if(state.mode==='raid')ui129EnterRaid();
  }catch(error){
    console.error('[UI129 START]',error);
    state.mode='menu';
    ui129Show('titleScreen');
    showRuntimeFault?.(error);
  }
}

function ui129RewardContinue(){
  try{
    state.rewardQueue=[];
    state.rewardRevealIndex=0;
    renderLoadout?.();
  }catch{}
  ui129Show('titleScreen');
}

const uiStyle=document.createElement('style');
uiStyle.id='ui129Style';
uiStyle.textContent=`
.screen[style*="display: flex"] button,
.screen.active button,
.screen[style*="display: flex"] input,
.screen.active input,
.screen[style*="display: flex"] select,
.screen.active select{pointer-events:auto!important;}
#titleScreen .titleRail,#titleScreen .titleRight,#loadoutScreen .panel,#settingsScreen .panel,#rewardScreen .panel{pointer-events:auto!important;}
button{touch-action:manipulation}
`;
document.head.appendChild(uiStyle);

document.addEventListener('click',async event=>{
  const target=event.target.closest('button,[data-open]');
  if(!target)return;
  let handled=true;

  if(target.dataset.open){
    event.preventDefault();
    event.stopImmediatePropagation();
    ui129Show(target.dataset.open);
    return;
  }

  switch(target.id){
    case 'titleBossMode': state.titleMode='boss'; ui129ApplyMode(); break;
    case 'titleRandomMode': state.titleMode='random'; ui129ApplyMode(); break;
    case 'titleStartRaid': await ui129Start(); break;
    case 'titleCreateRoom': await ui129CreateRoom(); break;
    case 'titleJoinRoom': await ui129JoinRoom(); break;
    case 'titleInvite': await ui129Invite(); break;
    case 'titleCopyCode': await ui129CopyCode(); break;
    case 'scAddTrack': ui129AddTrack(); break;
    case 'loadoutTabGear': setLoadoutTab?.('gear'); renderLoadoutV122?.(); break;
    case 'loadoutTabFusion': setLoadoutTab?.('fusion'); renderFusionInventoryV122?.(); break;
    case 'fusionButton': fuseFive?.(); break;
    case 'rewardOpenNext': revealNextReward?.(); break;
    case 'rewardContinue': ui129RewardContinue(); break;
    default:
      if(target.dataset.uiAction==='select-boss'){
        state.bossId=target.dataset.bossId;
        ui129RenderBosses();
      }else handled=false;
  }

  if(handled){
    event.preventDefault();
    event.stopImmediatePropagation();
  }
},true);

document.addEventListener('keydown',event=>{
  if(state.uiSurface!=='titleScreen'||state.raidSurfaceActive)return;
  if(event.key==='1'){state.titleMode='boss';ui129ApplyMode()}
  if(event.key==='2'){state.titleMode='random';ui129ApplyMode()}
});

try{surfaceObserver127?.disconnect()}catch{}
state.surfaceGuardEnabled=false;

setInterval(()=>{
  if(state.raidSurfaceActive||state.encounterStarting)return;
  const id=state.uiSurface||'titleScreen';
  const el=document.getElementById(id);
  if(!el)return;
  if(getComputedStyle(el).display==='none')ui129Show(id);
},1000);

state.titleMode=state.titleMode==='random'?'random':'boss';
ui129RenderBosses();
ui129ApplyMode();
ui129Show('titleScreen');
state.uiKernelReady=true;
