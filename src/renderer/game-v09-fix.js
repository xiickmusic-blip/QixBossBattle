// v0.9 hotfix: keep shared boss rotation slow, guarantee random laser availability,
// and restore the Random Raid reward screen after the legacy death transition.

v09CommonBossMotion=function(dt){
  const b=state.boss;if(!b)return;
  if(state.randomRun?.active)return;
  if(state.bossMoveEnabled){
    b.v09vx=b.v09vx??Math.cos(state.bossMoveAngle)*state.bossMoveSpeed;
    b.v09vy=b.v09vy??Math.sin(state.bossMoveAngle)*state.bossMoveSpeed;
    b.x+=b.v09vx*dt;b.y+=b.v09vy*dt;
    const pad=150;
    if(b.x<world.x+pad){b.x=world.x+pad;b.v09vx=Math.abs(b.v09vx)}
    if(b.x>world.x+world.w-pad){b.x=world.x+world.w-pad;b.v09vx=-Math.abs(b.v09vx)}
    if(b.y<world.y+pad){b.y=world.y+pad;b.v09vy=Math.abs(b.v09vy)}
    if(b.y>world.y+world.h-pad){b.y=world.y+world.h-pad;b.v09vy=-Math.abs(b.v09vy)}
  }
};

const _v09SetupFloorFix=setupRandomBossForFloor;
setupRandomBossForFloor=function(floor,first=false){
  _v09SetupFloorFix(floor,first);
  if(Math.random()<.68&&!state.v08RandomPattern.some(x=>x.key==='rotatingLasers')){
    state.v08RandomPattern.push({key:'rotatingLasers',cfg:randomizeAttackConfig('rotatingLasers',floor)});
  }
};

const _v09PlayerHitFix=playerHit;
playerHit=function(){
  const wasRandom=!!state.randomRun?.active;
  const before=playerHP;
  _v09PlayerHitFix();
  if(wasRandom&&before>0&&playerHP<=0){
    setTimeout(()=>openScreen('rewardScreen'),1150);
  }
};

// GitHub branch loader for post-v1.1 runtime patches.
// index.html in older branch snapshots does not reference these files directly,
// so load them after every static script has finished.
window.addEventListener('load',()=>{
  const v120=document.createElement('script');
  v120.src='game-v120.js';
  v120.async=false;
  v120.onload=()=>{
    const v121=document.createElement('script');
    v121.src='game-v121.js';
    v121.async=false;
    document.body.appendChild(v121);
  };
  document.body.appendChild(v120);
});
