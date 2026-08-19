function spawnBullet(angle,speed,size,opts={}){
  state.projectiles.push({
    x:state.boss.x,y:state.boss.y,
    vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
    r:size,ricochet:!!opts.ricochet,bounces:0,maxBounces:opts.maxBounces||5,
    life:opts.life??12,color:opts.color||'#ff587a'
  });
}
function radialBurst(count,speed=70){for(let i=0;i<count;i++)spawnBullet(state.boss.angle+i*Math.PI*2/count,speed,6)}
function aimedBurst(count=5,spread=.12,speed=95){
  const a=Math.atan2(player.y-state.boss.y,player.x-state.boss.x);
  for(let i=-(count-1)/2;i<=(count-1)/2;i++)spawnBullet(a+i*spread,speed,5);
}

function linePointDistance(px,py,x1,y1,x2,y2){
  const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;
  if(!l2)return Math.hypot(px-x1,py-y1);
  const t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/l2));
  return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));
}

function updateSeraph(dt){
  const b=state.boss;
  state.seraphLaserAngle+=dt*.24;
  state.seraphTeleportTimer-=dt;
  state.seraphPulse=Math.max(0,state.seraphPulse-dt);

  if(state.seraphTeleportTimer<=0){
    state.seraphTeleportTimer=5.2;
    state.seraphPulse=.65;
    const spots=[
      [.38,.35],[.62,.35],[.38,.57],[.62,.57],[.50,.46]
    ];
    const s=spots[Math.floor(Math.random()*spots.length)];
    b.x=world.x+world.w*s[0];
    b.y=world.y+world.h*s[1];
    state.effects.push({x:b.x,y:b.y,r:28,life:.9,color:'#b77cff'});
  }

  if(state.iframeTimer<=0){
    for(let i=0;i<4;i++){
      const a=state.seraphLaserAngle+i*Math.PI/2;
      const ex=b.x+Math.cos(a)*520,ey=b.y+Math.sin(a)*520;
      if(linePointDistance(player.x,player.y,b.x,b.y,ex,ey)<player.r+5){
        playerHit();break;
      }
      if(player.drawing){
        for(const p of player.line){
          if(linePointDistance(p.x,p.y,b.x,b.y,ex,ey)<5){playerHit();return}
        }
      }
    }
  }
}

function gravityWellPositions(){
  const b=state.boss;
  return [0,1,2].map(i=>{
    const a=state.gravityPhase+i*Math.PI*2/3;
    const radius=118;
    return {x:b.x+Math.cos(a)*radius,y:b.y+Math.sin(a)*radius};
  });
}

function applyGravityMawField(dt, advance){
  const b=state.boss;
  if(advance){
    state.gravityPhase+=dt*.34;
    state.gravityPulseTimer-=dt;
    if(state.gravityPulseTimer<=0){
      state.gravityPulseTimer=4.6;
      state.gravityWaveRadius=22;
      state.gravityWaveLife=1.85;
      state.effects.push({x:b.x,y:b.y,r:24,life:1.1,color:'#5dffbf'});
    }
    if(state.gravityWaveLife>0){
      state.gravityWaveLife=Math.max(0,state.gravityWaveLife-dt);
      state.gravityWaveRadius+=dt*245;
    }
  }

  for(const well of gravityWellPositions()){
    const dx=well.x-player.x,dy=well.y-player.y;
    const dist=Math.max(26,Math.hypot(dx,dy));
    if(dist<205){
      const strength=(1-dist/205)*(player.drawing?122:82);
      player.x+=dx/dist*strength*dt;
      player.y+=dy/dist*strength*dt;
      player.x=Math.max(world.x,Math.min(world.x+world.w,player.x));
      player.y=Math.max(world.y,Math.min(world.y+world.h,player.y));
    }
    if(dist<22)playerHit();
  }

  if(state.gravityWaveLife>0&&state.iframeTimer<=0){
    const d=Math.hypot(player.x-b.x,player.y-b.y);
    if(Math.abs(d-state.gravityWaveRadius)<10)playerHit();
  }
}

function bossAttack(dt){
  const b=state.boss,d=bossDef();
  b.angle+=dt*(d.attack==='ricochet'?.25:.45);

  if(d.attack==='seraph'){
    updateSeraph(dt);
    b.attackTimer-=dt;
    if(b.attackTimer<=0){
      b.attackTimer=2.2;
      for(let i=0;i<6;i++)spawnBullet(b.angle+i*Math.PI/3,82,5,{life:7,color:'#b77cff'});
    }
    return;
  }
  if(d.attack==='gravity'){
    applyGravityMawField(dt,true);
    b.attackTimer-=dt;
    if(b.attackTimer<=0){
      b.attackTimer=2.8;
      for(let i=0;i<8;i++)spawnBullet(b.angle+i*Math.PI/4,68,5,{life:9,color:'#5dffbf'});
    }
    return;
  }

  b.attackTimer-=dt;if(b.attackTimer>0)return;
  if(d.attack==='void'){
    b.attackTimer=remainingCores()<=4?.6:1.05;
    Math.random()<.6?radialBurst(remainingCores()<=4?20:12):aimedBurst();
  }else if(d.attack==='ricochet'){
    b.attackTimer=2.5;
    for(let i=0;i<5;i++)spawnBullet(b.angle+i*Math.PI*2/5,105,10,{ricochet:true,maxBounces:5,color:'#ff934d'});
  }
  if(player.drawing)for(const p of player.line)if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+4){playerHit();break}
}

function updateProjectiles(dt){
  for(let i=state.projectiles.length-1;i>=0;i--){
    const p=state.projectiles[i];p.life-=dt;
    if(p.life<=0){state.projectiles.splice(i,1);continue}
    const nx=p.x+p.vx*dt,ny=p.y+p.vy*dt;
    if(p.ricochet){
      let bounced=false;
      if(nx-p.r<=world.x||nx+p.r>=world.x+world.w){p.vx*=-1;bounced=true}
      if(ny-p.r<=world.y||ny+p.r>=world.y+world.h){p.vy*=-1;bounced=true}
      if(isSafeWorld(nx,ny)){p.vx*=-1;p.vy*=-1;bounced=true}
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(bounced&&++p.bounces>=p.maxBounces){state.projectiles.splice(i,1);continue}
    }else{
      p.x=nx;p.y=ny;
      if(isSafeWorld(p.x,p.y)||p.x<world.x-120||p.x>world.x+world.w+120||p.y<world.y-120||p.y>world.y+world.h+120){
        state.projectiles.splice(i,1);continue;
      }
    }
    if(Math.hypot(p.x-player.x,p.y-player.y)<p.r+player.r){playerHit();state.projectiles.splice(i,1);continue}
    if(player.drawing){
      let hit=false;
      for(const pt of player.line)if(Math.hypot(p.x-pt.x,p.y-pt.y)<p.r+3){hit=true;break}
      if(hit){playerHit();state.projectiles.splice(i,1)}
    }
  }
}

function rollCharm(){return DATA.charms[Math.floor(Math.random()*DATA.charms.length)]}
function grantReward(charmId=null){
  const charm=DATA.charms.find(c=>c.id===charmId)||rollCharm();
  state.inventory.push(charm.id);save('raidqix.inventory',state.inventory);
  document.getElementById('rewardName').textContent=charm.name;
  document.getElementById('rewardDesc').textContent=`${charm.rarity} · ${charm.description}`;
  setTimeout(()=>openScreen('rewardScreen'),500);
}
function winRaid(broadcast=false){
  if(state.victory||remainingCores()>0)return;
  state.victory=true;state.gameOver=true;
  if(state.multiplayer&&state.isHost&&broadcast)sendNet({type:'raid-clear'});
  grantReward();
}
function updateEffects(dt){
  for(let i=state.effects.length-1;i>=0;i--){
    const e=state.effects[i];e.life-=dt;e.r+=30*dt;if(e.life<=0)state.effects.splice(i,1);
  }
}
function updateTimers(dt){
  state.skillCooldown=Math.max(0,state.skillCooldown-dt);
  state.buffTimer=Math.max(0,state.buffTimer-dt);
  state.iframeTimer=Math.max(0,state.iframeTimer-dt);
}

