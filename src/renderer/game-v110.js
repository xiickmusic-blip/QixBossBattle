// RAID QIX v1.1.0
// Title-room flow, SoundCloud BGM sync, beat visuals, and removal of legacy ghost laser lines.

Object.assign(state,{
  titleMode:'boss',
  soundcloudPlaylist:load('raidqix.soundcloudPlaylist',[]),
  bgmVolume:Number(load('raidqix.bgmVolume',70)),
  seVolume:Number(load('raidqix.seVolume',80)),
  music:{url:null,bpm:120,widget:null,ready:false,positionMs:0,lastProgressAt:0,scheduled:null,lastTrackId:null},
  beatPulse:0,
  lastMusicSyncAt:0
});

drawRandomBoss=function(c,b,d){
  const cfg=state.randomRun.config;
  c.save();c.translate(q(b.x),q(b.y));c.rotate(b.angle);
  c.shadowBlur=30;c.shadowColor=d.accent;c.strokeStyle=d.accent;c.fillStyle='#08090d';c.lineWidth=3;
  const spikes=8+(state.randomRun.floor%7);
  c.beginPath();
  for(let i=0;i<spikes*2;i++){
    const a=i*Math.PI/spikes,rr=i%2?28:48;
    const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?c.lineTo(x,y):c.moveTo(x,y);
  }
  c.closePath();c.fill();c.stroke();
  c.rotate(-b.angle*1.7);c.beginPath();c.arc(0,0,19,0,Math.PI*2);c.stroke();
  c.fillStyle=d.accent;c.fillRect(-5,-5,10,10);c.restore();
};

function renderTitleBosses(){
  const grid=document.getElementById('titleBossGrid');if(!grid)return;
  grid.innerHTML='';
  for(const b of DATA.bosses){
    const el=document.createElement('button');
    el.className='card'+(state.bossId===b.id?' selected':'');
    el.innerHTML=`<strong>B${b.number} · ${b.name}</strong><small>${b.description}</small>`;
    el.onclick=()=>{state.bossId=b.id;renderTitleBosses();renderBossCards('lobbyBossGrid');renderBossCards('soloBossGrid')};
    grid.appendChild(el);
  }
}
function setTitleMode(mode){
  state.titleMode=mode;
  document.getElementById('titleBossMode').classList.toggle('active',mode==='boss');
  document.getElementById('titleRandomMode').classList.toggle('active',mode==='random');
  document.getElementById('titleBossSection').style.display=mode==='boss'?'block':'none';
  document.getElementById('titleModeName').textContent=mode==='boss'?'BOSS MODE':'RANDOM BOSS MODE';
  document.getElementById('titleModeInfo').textContent=mode==='boss'
    ?'固定ボスを選択してレイド。1人でもルームを作成すれば開始できます。'
    :'死ぬまで階層を進行。ボスが変わるたびBOSS TRACKLISTから1曲抽選し、ルーム全員へ同期します。';
}
document.getElementById('titleBossMode').onclick=()=>setTitleMode('boss');
document.getElementById('titleRandomMode').onclick=()=>setTitleMode('random');

function renderTitleRoom(){
  const code=document.getElementById('titleLobbyCode');
  const members=document.getElementById('titleMembers');
  const lobbyId=state.titleLobbyId||null;
  code.textContent=lobbyId||'NO ROOM';
  const ms=state.members||[];
  members.innerHTML=ms.length?ms.map(m=>`<div class="roomMember"><span>${m.host?'HOST · ':''}${m.name}</span><span>${m.id===state.localSteamId?'YOU':''}</span></div>`).join(''):'<div class="muted">ROOM NOT CREATED</div>';
  document.getElementById('titleStartRaid').querySelector('small').textContent=state.isHost?'HOST · READY':'WAITING FOR HOST';
}
const _v10ApplySteamState=applySteamState;
applySteamState=function(s){
  _v10ApplySteamState(s);
  state.titleLobbyId=s.lobbyId||null;
  state.isHost=(s.members||[]).some(m=>m.id===s.localId&&m.host);
  renderTitleRoom();
};

document.getElementById('titleCreateRoom').onclick=async()=>{
  const s=await window.raidAPI.createLobby({maxMembers:4});
  state.isHost=true;applySteamState(s);
};
document.getElementById('titleJoinRoom').onclick=async()=>{
  const id=document.getElementById('titleJoinCode').value.trim();if(!id)return;
  const s=await window.raidAPI.joinLobby(id);applySteamState(s);
};
document.getElementById('titleInvite').onclick=async()=>{
  if(!state.titleLobbyId){const s=await window.raidAPI.createLobby({maxMembers:4});state.isHost=true;applySteamState(s)}
  await window.raidAPI.inviteLobby?.();
};
document.getElementById('titleCopyCode').onclick=async()=>{
  if(!state.titleLobbyId)return;
  try{await navigator.clipboard.writeText(state.titleLobbyId)}catch{}
};

function titleStartBossMode(){
  if(!state.isHost||!state.titleLobbyId)return;
  state.multiplayer=true;
  startRaid(true,true);
}
function titleStartRandomMode(){
  if(!state.isHost||!state.titleLobbyId)return;
  state.multiplayer=true;state.isHost=true;state.mode='raid';
  state.randomRun.active=true;state.randomRun.floor=1;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  setupRandomBossForFloor(1,true);
  sendNet({type:'random-start',floor:1,config:state.randomRun.config,def:state.randomRun.def,relics:state.relics,grid:cloneGrid()});
}
document.getElementById('titleStartRaid').onclick=()=>state.titleMode==='random'?titleStartRandomMode():titleStartBossMode();

function validSoundCloudUrl(url){
  try{const u=new URL(url);return /(^|\.)soundcloud\.com$/i.test(u.hostname)}catch{return false}
}
function renderTrackList(){
  const list=document.getElementById('scTrackList');if(!list)return;
  list.innerHTML='';
  state.soundcloudPlaylist.forEach((t,i)=>{
    const row=document.createElement('div');row.className='trackRow';
    row.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span><span class="trackUrl" title="${t.url}">${t.url}</span><span>${t.bpm||120} BPM</span><button class="trackDel">×</button>`;
    row.querySelector('.trackDel').onclick=()=>{state.soundcloudPlaylist.splice(i,1);save('raidqix.soundcloudPlaylist',state.soundcloudPlaylist);renderTrackList()};
    row.querySelector('.trackUrl').onclick=()=>playSoundCloudTrack(t,{delayMs:0,broadcast:false});
    list.appendChild(row);
  });
  if(!state.soundcloudPlaylist.length)list.innerHTML='<div class="muted" style="padding:12px 0">ADD SOUNDCLOUD URLS</div>';
}
document.getElementById('scAddTrack').onclick=()=>{
  const url=document.getElementById('scUrlInput').value.trim();
  const bpm=Math.max(40,Math.min(240,Number(document.getElementById('scBpmInput').value)||120));
  if(!validSoundCloudUrl(url))return;
  state.soundcloudPlaylist.push({id:'sc_'+Date.now().toString(36),url,bpm});
  save('raidqix.soundcloudPlaylist',state.soundcloudPlaylist);
  document.getElementById('scUrlInput').value='';
  renderTrackList();
};

function bindSoundCloudWidget(widget){
  if(!widget||widget.__raidBound)return widget;
  widget.__raidBound=true;
  widget.bind(SC.Widget.Events.READY,()=>{
    state.music.ready=true;
    widget.setVolume(state.bgmVolume);
    const pending=state.music.pendingTrack;
    if(pending){
      state.music.pendingTrack=null;
      clearTimeout(state.music.scheduled);
      state.music.scheduled=setTimeout(()=>{
        widget.setVolume(state.bgmVolume);
        widget.play();
        state.music.positionMs=0;state.music.lastProgressAt=performance.now();
        document.getElementById('scNowPlaying').textContent=`NOW PLAYING · ${state.music.bpm} BPM · ${pending.track.url}`;
      },Math.max(0,pending.delayMs));
    }
  });
  widget.bind(SC.Widget.Events.PLAY_PROGRESS,e=>{
    state.music.positionMs=e.currentPosition||0;
    state.music.lastProgressAt=performance.now();
    const bpm=state.music.bpm||120,beatMs=60000/bpm;
    const phase=(state.music.positionMs%beatMs)/beatMs;
    if(phase<.13)state.beatPulse=Math.max(state.beatPulse,1-phase/.13);
  });
  widget.bind(SC.Widget.Events.PLAY,()=>{
    widget.getCurrentSound?.(sound=>{
      const bpm=Number(sound?.bpm);
      if(Number.isFinite(bpm)&&bpm>=40&&bpm<=240)state.music.bpm=bpm;
    });
  });
  return widget;
}
function ensureSoundCloudWidget(){
  if(state.music.widget)return state.music.widget;
  if(!window.SC?.Widget)return null;
  const iframe=document.getElementById('soundcloudWidget');
  if(!iframe||!/^https:\/\/w\.soundcloud\.com\/player\//.test(iframe.src))return null;
  state.music.widget=bindSoundCloudWidget(SC.Widget(iframe));
  return state.music.widget;
}
function loadSoundCloudUrl(track,delayMs=700){
  const iframe=document.getElementById('soundcloudWidget');
  if(!iframe)return;
  state.music.url=track.url;state.music.bpm=track.bpm||120;
  state.music.pendingTrack={track,delayMs};
  document.getElementById('scNowPlaying').textContent=`QUEUED · ${track.bpm||120} BPM · ${track.url}`;

  let widget=ensureSoundCloudWidget();
  if(!widget){
    iframe.onload=()=>{
      if(!window.SC?.Widget)return;
      state.music.widget=bindSoundCloudWidget(SC.Widget(iframe));
    };
    iframe.src=`https://w.soundcloud.com/player/?url=${encodeURIComponent(track.url)}&auto_play=false&show_artwork=false&show_comments=false&buying=false&sharing=false&download=false`;
    return;
  }

  state.music.pendingTrack=null;
  widget.load(track.url,{
    auto_play:false,show_artwork:false,show_comments:false,buying:false,sharing:false,download:false,
    callback:()=>{
      widget.setVolume(state.bgmVolume);
      clearTimeout(state.music.scheduled);
      state.music.scheduled=setTimeout(()=>{
        widget.play();
        state.music.positionMs=0;state.music.lastProgressAt=performance.now();
        document.getElementById('scNowPlaying').textContent=`NOW PLAYING · ${state.music.bpm} BPM · ${track.url}`;
      },Math.max(0,delayMs));
    }
  });
}
function playSoundCloudTrack(track,{delayMs=800,broadcast=true}={}){
  if(!track)return;
  loadSoundCloudUrl(track,delayMs);
  if(broadcast&&state.isHost&&state.multiplayer)sendNet({type:'bgm-sync',track,delayMs});
}
function chooseBossTrack(){
  const arr=state.soundcloudPlaylist;if(!arr.length)return null;
  let pool=arr;
  if(arr.length>1&&state.music.lastTrackId)pool=arr.filter(t=>t.id!==state.music.lastTrackId);
  const t=pool[Math.floor(Math.random()*pool.length)];
  state.music.lastTrackId=t.id;return t;
}

const _v10SetupFloor110=setupRandomBossForFloor;
setupRandomBossForFloor=function(floor,first=false){
  _v10SetupFloor110(floor,first);
  if(state.randomRun.active&&state.isHost){
    const track=chooseBossTrack();
    if(track)playSoundCloudTrack(track,{delayMs:850,broadcast:true});
    if(state.multiplayer)sendNet({type:'random-floor',floor,config:state.randomRun.config,def:state.randomRun.def,relics:state.relics,grid:cloneGrid()});
  }
};

const bgmSlider=document.getElementById('bgmVolume'),seSlider=document.getElementById('seVolume');
bgmSlider.value=state.bgmVolume;seSlider.value=state.seVolume;
document.getElementById('bgmVolLabel').textContent=state.bgmVolume;
document.getElementById('seVolLabel').textContent=state.seVolume;
bgmSlider.oninput=()=>{
  state.bgmVolume=Number(bgmSlider.value);save('raidqix.bgmVolume',state.bgmVolume);
  document.getElementById('bgmVolLabel').textContent=state.bgmVolume;
  ensureSoundCloudWidget()?.setVolume(state.bgmVolume);
};
seSlider.oninput=()=>{
  state.seVolume=Number(seSlider.value);save('raidqix.seVolume',state.seVolume);
  document.getElementById('seVolLabel').textContent=state.seVolume;
};
window.raidSeVolume=()=>state.seVolume/100;

function applyRemoteRandomFloor(m){
  state.multiplayer=true;state.isHost=false;state.mode='raid';state.randomRun.active=true;state.randomRun.floor=m.floor;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  setupRandomBossForFloor(m.floor,m.floor===1);
  state.randomRun.config=m.config;state.randomRun.def=m.def;
  if(m.relics)state.relics=m.relics;
  if(m.grid)setGrid(m.grid);
}
window.raidAPI?.onMessage(m=>{
  if(!m||m.senderId===state.localSteamId)return;
  if(m.type==='random-start'){applyRemoteRandomFloor(m);return}
  if(m.type==='random-floor'&&!state.isHost){applyRemoteRandomFloor(m);return}
  if(m.type==='bgm-sync'){playSoundCloudTrack(m.track,{delayMs:m.delayMs??800,broadcast:false});return}
  if(m.type==='world-state'&&!state.isHost&&state.randomRun.active){
    if(Array.isArray(m.lineTelegraphs))state.lineTelegraphs=m.lineTelegraphs.map(x=>({...x}));
    if(Array.isArray(m.coneTelegraphs))state.coneTelegraphs=m.coneTelegraphs.map(x=>({...x}));
    if(Array.isArray(m.donutTelegraphs))state.donutTelegraphs=m.donutTelegraphs.map(x=>({...x}));
    if(Array.isArray(m.chaseTelegraphs))state.chaseTelegraphs=m.chaseTelegraphs.map(x=>({...x}));
    if(Array.isArray(m.sweepLasers))state.sweepLasers=m.sweepLasers.map(x=>({...x}));
  }
});

networkTick=function(dt){
  if(!state.multiplayer||state.mode!=='raid')return;
  state.netPlayerTimer-=dt;state.netWorldTimer-=dt;
  if(state.netPlayerTimer<=0){
    state.netPlayerTimer=.08;
    const line=player.drawing?player.line.filter((_,i)=>i%Math.max(1,Math.ceil(player.line.length/60))===0):[];
    sendNet({type:'player-state',x:player.x,y:player.y,drawing:player.drawing,line,hp:playerHP,maxHp:playerMaxHP,name:state.members.find(m=>m.id===state.localSteamId)?.name||'Player'});
  }
  if(state.isHost&&state.netWorldTimer<=0){
    state.netWorldTimer=.10;
    sendNet({
      type:'world-state',boss:state.boss,projectiles:state.projectiles,
      seraphLaserAngle:state.seraphLaserAngle,gravityPhase:state.gravityPhase,
      telegraphs:state.telegraphs,lineTelegraphs:state.lineTelegraphs,coneTelegraphs:state.coneTelegraphs,
      donutTelegraphs:state.donutTelegraphs,chaseTelegraphs:state.chaseTelegraphs,sweepLasers:state.sweepLasers
    });
  }
};

loop=function(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  state.beatPulse=Math.max(0,state.beatPulse-dt*5.5);
  if(state.mode==='raid'&&!state.gameOver){
    movePlayer(dt);
    if(!state.multiplayer||state.isHost)bossAttack(dt);
    else{
      if(bossDef().attack==='gravity')applyGravityMawField(dt,false);
      updateTelegraphs(dt,false);
      updateExtraTelegraphs(dt,false);
      updateSweepLasers(dt,false);
    }
    updateProjectiles(dt);updateEffects(dt);updateTimers(dt);networkTick(dt);
  }
  drawScene(now);renderPSX();updateHud();requestAnimationFrame(loop);
};

const _v10DrawBoss110=drawBoss;
drawBoss=function(c){
  const p=state.beatPulse||0;
  if(p<=.01){_v10DrawBoss110(c);return}
  const j=1.8*p;
  c.save();c.translate(Math.sin(performance.now()*.09)*j,Math.cos(performance.now()*.11)*j);_v10DrawBoss110(c);c.restore();
};
const _v10DrawProjectiles110=drawProjectiles;
drawProjectiles=function(c){
  const p=state.beatPulse||0;
  if(p<=.01){_v10DrawProjectiles110(c);return}
  const j=1.2*p;
  c.save();c.translate(Math.sin(performance.now()*.12)*j,Math.cos(performance.now()*.10)*j);_v10DrawProjectiles110(c);c.restore();
};

renderTitleBosses();renderTrackList();setTitleMode('boss');refreshSteam();
