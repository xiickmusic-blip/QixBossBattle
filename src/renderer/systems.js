// RAID QIX v2 systems: inventory, rewards, audio, SoundCloud, Steam P2P.

function rollRewardRarity(depth=1){
  const bonus=Math.min(.16,Math.max(0,depth-1)*.006),r=Math.random();
  if(r<.58-bonus)return 1;if(r<.82-bonus*.45)return 2;if(r<.94-bonus*.18)return 3;if(r<.989)return 4;return 5;
}
function giveReward(depth=1){const c=rollProceduralCharm(rollRewardRarity(depth));state.inventory.push(c);save('raidqix.inventory',state.inventory);return c}

grantReward=function(depth=1){
  const charm=giveReward(depth);
  setTimeout(()=>{
    if(typeof UI!=='undefined')UI.queueRewards([charm]);
  },320);
  return charm;
};

function fuseFiveCharms(uids){
  const items=uids.map(proceduralCharmByUid);if(items.some(x=>!x))return {ok:false,msg:'5 items required'};
  const rarity=items[0].rarity;if(!items.every(c=>c.rarity===rarity))return {ok:false,msg:'Same rarity only'};if(rarity>=5)return {ok:false,msg:'R5 is max'};
  const set=new Set(uids);state.inventory=state.inventory.filter(c=>!set.has(c.uid));state.equippedCharms=state.equippedCharms.filter(uid=>!set.has(uid));
  const result=rollProceduralCharm(rarity+1);state.inventory.push(result);save('raidqix.inventory',state.inventory);save('raidqix.charms',state.equippedCharms);return {ok:true,item:result}
}
function equipCharm(uid,slot){
  if(!proceduralCharmByUid(uid))return;
  const arr=[state.equippedCharms[0]||null,state.equippedCharms[1]||null].map(x=>x===uid?null:x);arr[slot]=uid;state.equippedCharms=arr.filter(Boolean);save('raidqix.charms',state.equippedCharms)
}
function unequipCharm(uid){state.equippedCharms=state.equippedCharms.filter(x=>x!==uid);save('raidqix.charms',state.equippedCharms)}

const AudioSystem={
  ctx:null,master:null,lastAoe:0,
  ensure(){if(this.ctx)return this.ctx;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;this.ctx=new AC();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);return this.ctx},
  vol(){return Math.max(0,Math.min(1,(state.seVolume/100)*(state.settings.volume/100)))},
  tone(freq=440,dur=.1,type='square',gain=.18,endFreq=null,delay=0){const ctx=this.ensure();if(!ctx)return;this.master.gain.value=this.vol()*.3;const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+dur);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.02)},
  se(name){if(name==='aoe'){const n=performance.now();if(n-this.lastAoe<90)return;this.lastAoe=n}
    if(name==='laser'){this.tone(760,.2,'sawtooth',.17,250);this.tone(1180,.12,'square',.08,520,.025)}
    else if(name==='aoe'){this.tone(150,.18,'square',.22,60)}
    else if(name==='hurt'){this.tone(310,.16,'square',.24,75)}
    else if(name==='capture'){[440,660,880].forEach((f,i)=>this.tone(f,.08,'square',.16,null,i*.065))}
    else if(name==='skill'){this.tone(520,.13,'square',.16,980)}
    else if(name==='bosskill'){[330,440,660,880,1100].forEach((f,i)=>this.tone(f,.13,i<3?'square':'triangle',.16,null,i*.075))}
  }
};

const MusicSystem={
  widget:null,track:null,ready:false,
  volume(){return Math.round(state.bgmVolume*(state.settings.volume/100))},
  bind(){if(this.widget||!window.SC?.Widget)return this.widget;const iframe=document.getElementById('soundcloudWidget');if(!iframe)return null;this.widget=SC.Widget(iframe);this.widget.bind(SC.Widget.Events.READY,()=>{this.ready=true;this.widget.setVolume(this.volume())});this.widget.bind(SC.Widget.Events.FINISH,()=>{if(state.mode==='raid'){this.widget.seekTo(0);setTimeout(()=>this.widget.play(),40)}});return this.widget},
  async prepare(track){if(!track)return null;this.track=track;state.music.bpm=track.bpm||120;const iframe=document.getElementById('soundcloudWidget');if(!iframe)return null;
    if(!window.SC?.Widget){await new Promise(resolve=>{let n=0;const id=setInterval(()=>{if(window.SC?.Widget||n++>100){clearInterval(id);resolve()}},50)})}
    let w=this.bind();
    if(!w){iframe.src=`https://w.soundcloud.com/player/?url=${encodeURIComponent(track.url)}&auto_play=false`;await new Promise(r=>setTimeout(r,500));w=this.bind()}
    if(!w)return null;
    await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;try{w.pause();w.seekTo(0);w.setVolume(this.volume())}catch{}resolve()};try{w.load(track.url,{auto_play:false,callback:()=>setTimeout(finish,40)});setTimeout(finish,2500)}catch{finish()}});
    return track;
  },
  play(){const w=this.bind();if(!w||!this.track)return;w.seekTo(0);w.setVolume(this.volume());w.play()},
  stop(){const w=this.bind();if(!w)return;try{w.pause();w.seekTo(0)}catch{}},
  pick(){const a=state.soundcloudPlaylist;if(!a.length)return null;return a[Math.floor(Math.random()*a.length)]}
};

function sendNet(msg){if(state.multiplayer)window.raidAPI?.send({...msg,senderId:state.localSteamId})}
async function refreshSteam(){const s=await window.raidAPI?.getSteamState?.();if(s)applySteamState(s)}
function applySteamState(s){state.localSteamId=s.localId||'local';state.members=s.members||[];state.titleLobbyId=s.lobbyId||null;state.isHost=state.members.some(m=>String(m.id)===String(state.localSteamId)&&m.host)}
async function createRoom(){const s=await window.raidAPI.createLobby({maxMembers:4});applySteamState(s);return s}
async function joinRoom(id){const s=await window.raidAPI.joinLobby(id);applySteamState(s);return s}

function onNetMessage(m){
  if(!m||m.senderId===state.localSteamId)return;
  if(m.type==='raid-start'){state.bossId=m.bossId;state.multiplayer=true;state.isHost=false;state.mode='raid';resetGame();if(m.relics)state.relics=m.relics;if(m.grid)setGrid(m.grid);UI.showGame()}
  if(m.type==='random-start'||m.type==='random-floor'){state.multiplayer=true;state.isHost=false;state.mode='raid';state.randomRun.active=true;state.randomRun.floor=m.floor;setupRandomBossForFloor(m.floor,m.floor===1);if(m.config)state.randomRun.config=m.config;if(m.def)state.randomRun.def=m.def;if(m.relics)state.relics=m.relics;if(m.grid)setGrid(m.grid);UI.showGame()}
  if(m.type==='player-state'){state.remotePlayers.set(String(m.senderId),m)}
  if(m.type==='world-state'&&!state.isHost){if(m.boss)state.boss={...state.boss,...m.boss};if(m.projectiles)state.projectiles=m.projectiles;if(m.telegraphs)state.telegraphs=m.telegraphs;if(m.lineTelegraphs)state.lineTelegraphs=m.lineTelegraphs;if(m.coneTelegraphs)state.coneTelegraphs=m.coneTelegraphs;if(m.donutTelegraphs)state.donutTelegraphs=m.donutTelegraphs;if(m.chaseTelegraphs)state.chaseTelegraphs=m.chaseTelegraphs;if(m.sweepLasers)state.sweepLasers=m.sweepLasers}
  if(m.type==='bgm-sync'){MusicSystem.prepare(m.track).then(()=>MusicSystem.play())}
}
window.raidAPI?.onMessage(onNetMessage);

function networkTick(dt){
  if(!state.multiplayer||state.mode!=='raid')return;
  state.netPlayerTimer-=dt;state.netWorldTimer-=dt;
  if(state.netPlayerTimer<=0){state.netPlayerTimer=.08;sendNet({type:'player-state',x:player.x,y:player.y,drawing:player.drawing,line:player.drawing?player.line.filter((_,i)=>i%3===0):[],hp:playerHP,maxHp:playerMaxHP,name:state.members.find(m=>String(m.id)===String(state.localSteamId))?.name||'Player'})}
  if(state.isHost&&state.netWorldTimer<=0){state.netWorldTimer=.10;sendNet({type:'world-state',boss:state.boss,projectiles:state.projectiles,telegraphs:state.telegraphs,lineTelegraphs:state.lineTelegraphs,coneTelegraphs:state.coneTelegraphs,donutTelegraphs:state.donutTelegraphs,chaseTelegraphs:state.chaseTelegraphs,sweepLasers:state.sweepLasers})}
}
