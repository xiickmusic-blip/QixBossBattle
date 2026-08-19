// RAID QIX v0.5 network patch.
// Loaded after game-ui.js so its dynamic functions replace the v0.4 versions.

window.raidAPI?.onMessage(m=>{
  if(!m||m.senderId===state.localSteamId)return;
  if(m.type==='world-state'&&state.multiplayer&&!state.isHost&&state.mode==='raid'){
    if(Array.isArray(m.telegraphs))state.telegraphs=m.telegraphs.map(t=>({...t}));
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
    sendNet({type:'world-state',boss:state.boss,projectiles:state.projectiles,seraphLaserAngle:state.seraphLaserAngle,gravityPhase:state.gravityPhase,telegraphs:state.telegraphs});
  }
};

loop=function(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  if(state.mode==='raid'&&!state.gameOver){
    movePlayer(dt);
    if(!state.multiplayer||state.isHost)bossAttack(dt);
    else{
      if(bossDef().attack==='gravity')applyGravityMawField(dt,false);
      if(bossDef().attack==='telegraph')updateTelegraphs(dt,false);
    }
    updateProjectiles(dt);updateEffects(dt);updateTimers(dt);networkTick(dt);
  }
  drawScene(now);renderPSX();updateHud();requestAnimationFrame(loop);
};
