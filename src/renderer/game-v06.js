// RAID QIX v0.6 patch: mouse control modes + BOSS 6.

if(!state.settings.controlMode){
  state.settings.controlMode='keyboard';
  save('raidqix.settings',state.settings);
}

const controlModeEl=document.getElementById('controlMode');
if(controlModeEl){
  controlModeEl.value=state.settings.controlMode;
  controlModeEl.onchange=e=>{
    state.settings.controlMode=e.target.value;
    save('raidqix.settings',state.settings);
    mouseDrive.targetX=null;
    mouseDrive.targetY=null;
  };
}

const mouseDrive={
  logicalX:world.x+world.w*.5,
  logicalY:world.y+world.h*.5,
  targetX:null,
  targetY:null,
  leftDown:false
};

function clientToLogical(clientX,clientY){
  const rect=canvas.getBoundingClientRect();
  const px=(clientX-rect.left)*(canvas.width/Math.max(1,rect.width));
  const py=(clientY-rect.top)*(canvas.height/Math.max(1,rect.height));
  const scale=Math.min(canvas.width/V05_LOGICAL_W,canvas.height/V05_LOGICAL_H);
  const dw=V05_LOGICAL_W*scale,dh=V05_LOGICAL_H*scale;
  const ox=(canvas.width-dw)/2,oy=(canvas.height-dh)/2;
  return {
    x:(px-ox)/scale,
    y:(py-oy)/scale
  };
}

canvas.addEventListener('mousemove',e=>{
  const p=clientToLogical(e.clientX,e.clientY);
  mouseDrive.logicalX=p.x;
  mouseDrive.logicalY=p.y;
  if(state.settings.controlMode==='click'&&mouseDrive.leftDown){
    mouseDrive.targetX=p.x;
    mouseDrive.targetY=p.y;
  }
});

canvas.addEventListener('mousedown',e=>{
  if(e.button===0){
    mouseDrive.leftDown=true;
    if(state.settings.controlMode==='click'){
      const p=clientToLogical(e.clientX,e.clientY);
      mouseDrive.targetX=p.x;
      mouseDrive.targetY=p.y;
    }
  }
  if(e.button===2&&state.mode==='raid'&&(state.settings.controlMode==='click'||state.settings.controlMode==='follow')){
    e.preventDefault();
    useSkill();
  }
});
addEventListener('mouseup',e=>{if(e.button===0)mouseDrive.leftDown=false});
canvas.addEventListener('contextmenu',e=>{
  if(state.mode==='raid'&&(state.settings.controlMode==='click'||state.settings.controlMode==='follow'))e.preventDefault();
});

const _v05MovePlayer=movePlayer;
movePlayer=function(dt){
  const mode=state.settings.controlMode||'keyboard';
  if(mode==='keyboard'){
    _v05MovePlayer(dt);
    return;
  }

  let tx,ty;
  if(mode==='follow'){
    tx=mouseDrive.logicalX;
    ty=mouseDrive.logicalY;
  }else{
    if(mouseDrive.targetX==null||mouseDrive.targetY==null){
      player.dx=0;player.dy=0;
      return;
    }
    tx=mouseDrive.targetX;
    ty=mouseDrive.targetY;
  }

  tx=Math.max(world.x,Math.min(world.x+world.w,tx));
  ty=Math.max(world.y,Math.min(world.y+world.h,ty));

  let dx=tx-player.x,dy=ty-player.y;
  const dist=Math.hypot(dx,dy);
  if(dist<4){
    player.dx=0;player.dy=0;
    if(mode==='click'){mouseDrive.targetX=null;mouseDrive.targetY=null}
    return;
  }
  dx/=dist;dy/=dist;
  player.dx=dx;player.dy=dy;

  const ox=player.x,oy=player.y;
  const step=Math.min(currentSpeed()*dt,dist);
  player.x+=dx*step;
  player.y+=dy*step;
  player.x=Math.max(world.x,Math.min(world.x+world.w,player.x));
  player.y=Math.max(world.y,Math.min(world.y+world.h,player.y));

  const safe=isSafeWorld(player.x,player.y);
  if(safe){player.lastSafeX=player.x;player.lastSafeY=player.y}
  if(!player.drawing&&!safe){
    player.drawing=true;
    player.line=[{x:ox,y:oy},{x:player.x,y:player.y}];
  }
  if(player.drawing){
    const last=player.line[player.line.length-1];
    if(Math.hypot(player.x-last.x,player.y-last.y)>3)player.line.push({x:player.x,y:player.y});
    if(safe&&player.line.length>4)finishLine();
  }
};

// BOSS 6 reuses the shared circular telegraph system from v0.5.
Object.assign(state,{boss6CastTimer:1.8,boss6Gap:0,boss6Phase:0});

const _v05ResetBoss2=resetBoss;
resetBoss=function(){
  _v05ResetBoss2();
  state.boss6CastTimer=1.8;
  state.boss6Gap=0;
  state.boss6Phase=Math.random()*Math.PI*2;
};

function spawnChoirPattern(){
  const cx=player.x,cy=player.y;
  const count=8;
  const ring=150;
  const radius=68;
  state.boss6Gap=Math.floor(Math.random()*count);
  state.boss6Phase+=Math.PI/8;

  // Eight ring positions with one intentionally missing telegraph = readable safe gap.
  for(let i=0;i<count;i++){
    if(i===state.boss6Gap)continue;
    const a=state.boss6Phase+i*Math.PI*2/count;
    spawnTelegraphCircle(
      cx+Math.cos(a)*ring,
      cy+Math.sin(a)*ring,
      radius,
      {warning:1.85,active:.2,color:'#67a8ff'}
    );
  }

  // Soft center pressure makes the player commit toward the visible gap.
  spawnTelegraphCircle(cx,cy,58,{warning:1.85,active:.2,color:'#a5c9ff'});
}

function updateHexChoir(dt){
  state.boss.angle+=dt*.18;
  state.boss6CastTimer-=dt;
  if(state.boss6CastTimer<=0){
    state.boss6CastTimer=3.7;
    spawnChoirPattern();
  }
  updateTelegraphs(dt,true);
}

const _v05BossAttack2=bossAttack;
bossAttack=function(dt){
  if(bossDef().attack==='choir'){
    updateHexChoir(dt);
    state.boss.attackTimer-=dt;
    if(state.boss.attackTimer<=0){
      state.boss.attackTimer=3.1;
      aimedBurst(3,.16,92);
    }
    return;
  }
  _v05BossAttack2(dt);
};

function drawHexChoir(c,b,d){
  c.save();
  c.translate(q(b.x),q(b.y));
  c.rotate(b.angle*.22);
  c.shadowBlur=28;c.shadowColor='#67a8ff';
  c.strokeStyle='#67a8ff';c.fillStyle='#07101f';c.lineWidth=3;

  for(let ring=0;ring<3;ring++){
    c.beginPath();
    c.arc(0,0,b.r-ring*10,0,Math.PI*2);
    c.stroke();
  }

  c.rotate(-b.angle*.8);
  c.beginPath();
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    const rr=i%2?22:43;
    const x=q(Math.cos(a)*rr),y=q(Math.sin(a)*rr);
    i?c.lineTo(x,y):c.moveTo(x,y);
  }
  c.closePath();c.fill();c.stroke();

  c.fillStyle='#dcecff';
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    c.beginPath();c.arc(Math.cos(a)*18,Math.sin(a)*18,3,0,Math.PI*2);c.fill();
  }
  c.restore();
}

const _v05DrawBoss2=drawBoss;
drawBoss=function(c){
  if(bossDef().attack==='choir'){
    drawHexChoir(c,state.boss,bossDef());
    return;
  }
  _v05DrawBoss2(c);
};

// Client-side telegraph collision also applies to BOSS 6.
const _v05Loop2=loop;
loop=function(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  if(state.mode==='raid'&&!state.gameOver){
    movePlayer(dt);
    if(!state.multiplayer||state.isHost)bossAttack(dt);
    else{
      if(bossDef().attack==='gravity')applyGravityMawField(dt,false);
      if(bossDef().attack==='telegraph'||bossDef().attack==='choir')updateTelegraphs(dt,false);
    }
    updateProjectiles(dt);
    updateEffects(dt);
    updateTimers(dt);
    networkTick(dt);
  }
  drawScene(now);
  renderPSX();
  updateHud();
  requestAnimationFrame(loop);
};
