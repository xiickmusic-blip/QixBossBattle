// RAID QIX v1.2.8
// Performance hotfix: stop self-triggering UI observer and suspend heavy canvas work in menus.

try{surfaceObserver127?.disconnect()}catch{}
state.surfaceGuardEnabled=false;

Object.assign(state,{
  menuFrameInterval:100,
  lastMenuRenderAt:0,
  v128LoopActive:true
});

function scheduleNextV128(){
  if(state.mode==='raid'&&!state.gameOver){
    requestAnimationFrame(loop);
  }else{
    setTimeout(()=>requestAnimationFrame(loop),state.menuFrameInterval);
  }
}

loop=function(now){
  if(state.runtimeLastFrame===now)return;
  state.runtimeLastFrame=now;

  const previous=last;
  last=now;
  const dt=Math.min(.033,Math.max(0,(now-previous)/1000));

  try{
    if(state.mode==='raid'&&!state.gameOver){
      movePlayer(dt);

      if(!state.multiplayer||state.isHost){
        bossAttack(dt);
      }else{
        if(bossDef().attack==='gravity')applyGravityMawField(dt,false);
        updateTelegraphs(dt,false);
        updateExtraTelegraphs(dt,false);
        updateSweepLasers(dt,false);
      }

      updateProjectiles(dt);
      updateEffects(dt);
      updateTimers(dt);
      networkTick(dt);

      state.beatPulse=Math.max(0,(state.beatPulse||0)-dt*5.5);

      drawScene(now);
      renderPSX();
      updateHud();
      state.runtimeFrameCount++;
    }else{
      if(now-state.lastMenuRenderAt>=state.menuFrameInterval){
        state.lastMenuRenderAt=now;
        displayCtx.setTransform(1,0,0,1,0,0);
        displayCtx.fillStyle='#000';
        displayCtx.fillRect(0,0,canvas.width,canvas.height);
      }
    }
  }catch(error){
    showRuntimeFault(error);
    state.gameOver=true;
    state.mode='menu';
    setTimeout(()=>openScreen('titleScreen'),50);
  }

  scheduleNextV128();
};

if(state.mode!=='raid'){
  state.runtimeLastFrame=-1;
  state.lastMenuRenderAt=0;
}
