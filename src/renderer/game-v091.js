// RAID QIX v0.9.1 combat-system audit fix.
// Fixes random-mode circle AoEs, lasers, and boss movement by unifying telegraph lifecycles.

Object.assign(state,{
  v091BeamFx:[],
  v091ShapeFx:[],
  v091RandomMoveSpeed:0,
  v091RandomMoveAngle:0,
  v091RandomVx:0,
  v091RandomVy:0,
  v091LaserAngle:Math.random()*Math.PI*2,
  v091LaserTimer:.9
});

function v091Impact(type,t){
  if(type==='circle'){
    state.v09ImpactFx.push({x:t.x,y:t.y,r:t.r,life:.34,color:t.color||'#ff4fd8'});
  }else{
    state.v091ShapeFx.push({type,data:{...t},life:.30,color:t.color||'#fff'});
  }
}

function v091ResolveLine(t){
  if(t.hitResolved)return;
  t.hitResolved=true;
  if(state.iframeTimer<=0&&pointSegmentDistance(player.x,player.y,t.x1,t.y1,t.x2,t.y2)<=t.width*.5+player.r)playerHit();
  state.v091BeamFx.push({...t,life:.26});
}
function v091ResolveCone(t){
  if(t.hitResolved)return;
  t.hitResolved=true;
  const dx=player.x-t.x,dy=player.y-t.y,dist=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
  if(state.iframeTimer<=0&&dist<=t.range+player.r&&angleDelta(a,t.angle)<=t.halfAngle)playerHit();
  v091Impact('cone',t);
}
function v091ResolveDonut(t){
  if(t.hitResolved)return;
  t.hitResolved=true;
  const dist=Math.hypot(player.x-t.x,player.y-t.y);
  if(state.iframeTimer<=0&&dist+player.r>=t.inner&&dist-player.r<=t.outer)playerHit();
  v091Impact('donut',t);
}
function v091ResolveChase(t){
  if(t.hitResolved)return;
  t.hitResolved=true;
  if(state.iframeTimer<=0&&Math.hypot(player.x-t.x,player.y-t.y)<=t.r+player.r)playerHit();
  v091Impact('circle',t);
}

updateTelegraphs=function(dt,advance=true){
  for(let i=state.telegraphs.length-1;i>=0;i--){
    const t=state.telegraphs[i];
    if(t.warning==null)t.warning=1.4;
    if(t.active==null)t.active=.24;
    const before=t.warning;
    if(advance)t.warning-=dt;
    if(before>0&&t.warning<=0&&!t.impactResolved){
      t.impactResolved=true;
      t.active=Math.max(t.active,.24);
      v091Impact('circle',t);
      if(state.iframeTimer<=0&&Math.hypot(player.x-t.x,player.y-t.y)<=t.r+player.r)playerHit();
    }
    if(t.warning<=0){
      if(advance)t.active-=dt;
      if(t.active<=0&&advance)state.telegraphs.splice(i,1);
    }
  }
};

updateExtraTelegraphs=function(dt,advance=true){
  const groups=[
    [state.lineTelegraphs,'line',v091ResolveLine],
    [state.coneTelegraphs,'cone',v091ResolveCone],
    [state.donutTelegraphs,'donut',v091ResolveDonut],
    [state.chaseTelegraphs,'chase',v091ResolveChase]
  ];
  for(const [arr,type,resolver] of groups){
    for(let i=arr.length-1;i>=0;i--){
      const t=arr[i];
      if(t.active==null)t.active=.24;
      if(type==='chase'&&t.follow>0&&t.warning>0){
        t.follow-=dt;
        const k=Math.min(1,dt*3.0);
        t.x+=(player.x-t.x)*k;
        t.y+=(player.y-t.y)*k;
      }
      const before=t.warning;
      if(advance)t.warning-=dt;
      if(before>0&&t.warning<=0){
        t.active=Math.max(t.active,type==='line'?.28:.24);
        resolver(t);
      }
      if(t.warning<=0){
        if(advance)t.active-=dt;
        if(t.active<=0&&advance)arr.splice(i,1);
      }
    }
  }
};

attackRotatingLasers=function(cfg={}){
  const count=cfg.count??4;
  const length=cfg.length??1300;
  const offset=cfg.offset??0;
  const angle=cfg.angle??state.v091LaserAngle??state.seraphLaserAngle??0;
  for(let i=0;i<count;i++){
    const a=angle+offset+i*Math.PI*2/count;
    spawnLineTelegraph(
      state.boss.x,state.boss.y,
      state.boss.x+Math.cos(a)*length,state.boss.y+Math.sin(a)*length,
      cfg.width??28,
      {warning:cfg.warning??.75,active:cfg.active??.28,color:cfg.color||bossDef().accent||'#b77cff'}
    );
  }
};

if(window.ATTACK_LIBRARY||typeof ATTACK_LIBRARY!=='undefined'){
  ATTACK_LIBRARY.rotatingLasers={weight:12,run:attackRotatingLasers};
  ATTACK_LIBRARY.rotatingWall={weight:9,run:cfg=>{
    const count=cfg.count??3;
    attackRotatingLasers({
      count,
      angle:state.v091LaserAngle,
      width:cfg.width??34,
      warning:cfg.warning??.85,
      active:.30,
      color:cfg.color||bossDef().accent
    });
  }};
}

function v091SetupRandomMotion(){
  state.v091RandomMoveSpeed=v08Rand(5,14);
  state.v091RandomMoveAngle=Math.random()*Math.PI*2;
  state.v091RandomVx=Math.cos(state.v091RandomMoveAngle)*state.v091RandomMoveSpeed;
  state.v091RandomVy=Math.sin(state.v091RandomMoveAngle)*state.v091RandomMoveSpeed;
  state.v091LaserAngle=Math.random()*Math.PI*2;
  state.v091LaserTimer=v08Rand(.7,1.4);
}

const _v09SetupRandomBossForFloor091=setupRandomBossForFloor;
setupRandomBossForFloor=function(floor,first=false){
  _v09SetupRandomBossForFloor091(floor,first);
  v091SetupRandomMotion();
  state.v08RandomPattern=v08RandomBossPattern(floor);
  if(!state.v08RandomPattern.some(x=>x.key==='rotatingLasers')&&Math.random()<.72){
    state.v08RandomPattern.push({key:'rotatingLasers',cfg:randomizeAttackConfig('rotatingLasers',floor)});
  }
  if(!state.v08RandomPattern.some(x=>x.key==='triplePrediction')&&Math.random()<.5){
    state.v08RandomPattern.push({key:'triplePrediction',cfg:randomizeAttackConfig('triplePrediction',floor)});
  }
};

function v091MoveRandomBoss(dt){
  const b=state.boss;if(!b)return;
  b.x+=state.v091RandomVx*dt;
  b.y+=state.v091RandomVy*dt;
  const pad=155;
  if(b.x<world.x+pad){b.x=world.x+pad;state.v091RandomVx=Math.abs(state.v091RandomVx)}
  if(b.x>world.x+world.w-pad){b.x=world.x+world.w-pad;state.v091RandomVx=-Math.abs(state.v091RandomVx)}
  if(b.y<world.y+pad){b.y=world.y+pad;state.v091RandomVy=Math.abs(state.v091RandomVy)}
  if(b.y>world.y+world.h-pad){b.y=world.y+world.h-pad;state.v091RandomVy=-Math.abs(state.v091RandomVy)}
  b.angle=(b.angle||0)+dt*(state.bossSpinSpeed||.075);
}

function v091RandomBossUpdate(dt){
  const cfg=state.randomRun.config,b=state.boss;
  if(!cfg||!b)return;
  v091MoveRandomBoss(dt);
  if(cfg.gravity&&state.iframeTimer<=0){
    const dx=b.x-player.x,dy=b.y-player.y,dist=Math.max(80,Math.hypot(dx,dy));
    if(dist<330){
      const pull=Math.min(48,state.randomGravityStrength||28);
      player.x+=dx/dist*pull*dt;
      player.y+=dy/dist*pull*dt;
    }
  }
  state.v091LaserAngle+=dt*(cfg.laserSpeed||.07);
  if(cfg.laser||state.v08RandomPattern.some(x=>x.key==='rotatingLasers')){
    state.v091LaserTimer-=dt;
    if(state.v091LaserTimer<=0){
      state.v091LaserTimer=v08Rand(1.0,1.8);
      attackRotatingLasers({
        count:Math.random()<.55?2:4,
        angle:state.v091LaserAngle,
        width:v08Rand(24,38),
        warning:v08Rand(.65,1.0),
        active:.30,
        color:bossDef().accent
      });
    }
  }
  state.v08RandomTimer-=dt;
  if(state.v08RandomTimer<=0){
    const floor=state.randomRun.floor||1;
    state.v08RandomTimer=Math.max(.62,v08Rand(.9,1.75)-Math.min(.35,floor*.01));
    if(!state.v08RandomPattern.length)state.v08RandomPattern=v08RandomBossPattern(floor);
    const entry=v08Pick(state.v08RandomPattern);
    ATTACK_LIBRARY[entry.key]?.run(entry.cfg);
  }
  updateTelegraphs(dt,true);
  updateExtraTelegraphs(dt,true);
}

const _v09BossAttack091=bossAttack;
bossAttack=function(dt){
  if(state.randomRun?.active){
    v091RandomBossUpdate(dt);
    return;
  }
  _v09BossAttack091(dt);
};

const _v09DrawScene091=drawScene;
drawScene=function(now){
  _v09DrawScene091(now);
  for(let i=state.v091BeamFx.length-1;i>=0;i--){
    const fx=state.v091BeamFx[i];
    fx.life-=.016;
    sceneCtx.save();
    sceneCtx.globalAlpha=Math.max(0,fx.life/.26);
    sceneCtx.strokeStyle='#fff';
    sceneCtx.shadowBlur=18;
    sceneCtx.shadowColor=fx.color||'#fff';
    sceneCtx.lineWidth=Math.max(5,(fx.width||28)*.42);
    sceneCtx.beginPath();
    sceneCtx.moveTo(q(fx.x1),q(fx.y1));
    sceneCtx.lineTo(q(fx.x2),q(fx.y2));
    sceneCtx.stroke();
    sceneCtx.restore();
    if(fx.life<=0)state.v091BeamFx.splice(i,1);
  }
  for(let i=state.v091ShapeFx.length-1;i>=0;i--){
    const fx=state.v091ShapeFx[i];
    fx.life-=.016;
    const t=fx.data;
    sceneCtx.save();
    sceneCtx.globalAlpha=Math.max(0,fx.life/.30)*.65;
    sceneCtx.fillStyle=fx.color||'#fff';
    sceneCtx.strokeStyle='#fff';
    sceneCtx.lineWidth=4;
    if(fx.type==='cone'){
      sceneCtx.translate(q(t.x),q(t.y));
      sceneCtx.beginPath();
      sceneCtx.moveTo(0,0);
      sceneCtx.arc(0,0,t.range,t.angle-t.halfAngle,t.angle+t.halfAngle);
      sceneCtx.closePath();
      sceneCtx.fill();
      sceneCtx.stroke();
    }else if(fx.type==='donut'){
      sceneCtx.lineWidth=Math.max(6,t.outer-t.inner);
      sceneCtx.beginPath();
      sceneCtx.arc(q(t.x),q(t.y),(t.outer+t.inner)/2,0,Math.PI*2);
      sceneCtx.stroke();
    }
    sceneCtx.restore();
    if(fx.life<=0)state.v091ShapeFx.splice(i,1);
  }
};
