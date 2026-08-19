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

// Load the v0.9.2 combat scheduler/laser patch on GitHub snapshots.
// The downloadable ZIP references it directly from index.html; this keeps the Git branch in sync.
const v092Script=document.createElement('script');
v092Script.src='game-v092.js';
v092Script.async=false;
document.body.appendChild(v092Script);
