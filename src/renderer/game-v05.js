// RAID QIX v0.5 gameplay/render patch.
// Loaded after game-render.js and before game-ui.js.

world.x=60; world.y=70; world.w=1320; world.h=670;
sceneCanvas.width=1440; sceneCanvas.height=810;
pixelCanvas.width=480; pixelCanvas.height=270;
sceneCtx.imageSmoothingEnabled=false;
pixelCtx.imageSmoothingEnabled=false;

Object.assign(state,{
  seraphVx:18,
  seraphVy:12,
  gravityBurstTimer:3.5,
  telegraphs:[],
  telegraphSeq:0,
  telegraphHits:new Set(),
  boss5CastTimer:1.6
});

const V05_LOGICAL_W=1440,V05_LOGICAL_H=810,V05_PIXEL_W=480,V05_PIXEL_H=270;

const _v04ResetBoss=resetBoss;
resetBoss=function(){
  _v04ResetBoss();
  const d=bossDef();
  state.boss.r=d.number===3?44:d.number===4?48:d.number===5?46:34;
  state.seraphVx=18; state.seraphVy=12;
  state.gravityBurstTimer=3.5;
  state.telegraphs=[];
  state.telegraphHits.clear();
  state.boss5CastTimer=1.6;
};

spawnRelics=function(){
  state.relics=[];
  const placed=[];
  const marginX=world.w*.17,marginY=world.h*.15;
  const minX=world.x+marginX,maxX=world.x+world.w-marginX;
  const minY=world.y+marginY,maxY=world.y+world.h-marginY;
  const minSpacing=130;
  for(const type of coreTypes){
    let x,y,tries=0;
    do{
      x=minX+Math.random()*(maxX-minX);
      y=minY+Math.random()*(maxY-minY);
      tries++;
    }while(tries<300&&(Math.hypot(x-state.boss.x,y-state.boss.y)<150||placed.some(p=>Math.hypot(x-p.x,y-p.y)<minSpacing)));
    placed.push({x,y});
    state.relics.push({id:state.relics.length,x,y,r:9,type:{...type},taken:false,phase:Math.random()*Math.PI*2});
  }
};

updateSeraph=function(dt){
  const b=state.boss;
  state.seraphLaserAngle+=dt*.24;
  b.x+=state.seraphVx*dt;
  b.y+=state.seraphVy*dt;
  const pad=145;
  if(b.x<world.x+pad){b.x=world.x+pad;state.seraphVx=Math.abs(state.seraphVx)}
  if(b.x>world.x+world.w-pad){b.x=world.x+world.w-pad;state.seraphVx=-Math.abs(state.seraphVx)}
  if(b.y<world.y+pad){b.y=world.y+pad;state.seraphVy=Math.abs(state.seraphVy)}
  if(b.y>world.y+world.h-pad){b.y=world.y+world.h-pad;state.seraphVy=-Math.abs(state.seraphVy)}
  if(state.iframeTimer<=0){
    for(let i=0;i<4;i++){
      const a=state.seraphLaserAngle+i*Math.PI/2;
      const ex=b.x+Math.cos(a)*1100,ey=b.y+Math.sin(a)*1100;
      if(linePointDistance(player.x,player.y,b.x,b.y,ex,ey)<player.r+5){playerHit();break}
      if(player.drawing){for(const p of player.line){if(linePointDistance(p.x,p.y,b.x,b.y,ex,ey)<5){playerHit();return}}}
    }
  }
};

applyGravityMawField=function(dt,advance){
  if(advance){
    state.gravityPhase+=dt*.34;
    state.gravityBurstTimer-=dt;
    if(state.gravityBurstTimer<=0){
      state.gravityBurstTimer=4.2;
      for(let i=0;i<18;i++)spawnBullet(state.gravityPhase+i*Math.PI*2/18,112,6,{life:10,color:'#5dffbf'});
    }
  }
  for(const well of gravityWellPositions()){
    const dx=well.x-player.x,dy=well.y-player.y;
    const dist=Math.max(26,Math.hypot(dx,dy));
    if(dist<230){
      const strength=(1-dist/230)*(player.drawing?122:82);
      player.x+=dx/dist*strength*dt;
      player.y+=dy/dist*strength*dt;
      player.x=Math.max(world.x,Math.min(world.x+world.w,player.x));
      player.y=Math.max(world.y,Math.min(world.y+world.h,player.y));
    }
    if(dist<22)playerHit();
  }
};

function spawnTelegraphCircle(x,y,radius,opts={}){
  const t={id:++state.telegraphSeq,x,y,r:radius,warning:opts.warning??1.6,active:opts.active??.18,color:opts.color||'#ff4fd8',damage:opts.damage??1};
  state.telegraphs.push(t);
  return t;
}
function spawnRandomTelegraph(radius=68,warning=1.6,color='#ff4fd8'){
  const margin=radius+28;
  return spawnTelegraphCircle(world.x+margin+Math.random()*(world.w-margin*2),world.y+margin+Math.random()*(world.h-margin*2),radius,{warning,color});
}
function updateTelegraphs(dt,advance){
  for(let i=state.telegraphs.length-1;i>=0;i--){
    const t=state.telegraphs[i];
    if(advance)t.warning-=dt;
    if(t.warning<=0){
      if(advance)t.active-=dt;
      if(!state.telegraphHits.has(t.id)&&state.iframeTimer<=0&&Math.hypot(player.x-t.x,player.y-t.y)<=t.r+player.r){state.telegraphHits.add(t.id);playerHit()}
      if(t.active<=0&&advance)state.telegraphs.splice(i,1);
    }
  }
  const alive=new Set(state.telegraphs.map(t=>t.id));
  for(const id of [...state.telegraphHits])if(!alive.has(id))state.telegraphHits.delete(id);
}
function updateOracleEngine(dt){
  state.boss.angle+=dt*.22;
  state.boss5CastTimer-=dt;
  if(state.boss5CastTimer<=0){
    state.boss5CastTimer=2.8;
    spawnTelegraphCircle(player.x,player.y,86,{warning:1.55,color:'#ff4fd8'});
    spawnRandomTelegraph(72,1.75,'#ff73df');
    spawnRandomTelegraph(62,1.35,'#d836ff');
  }
  updateTelegraphs(dt,true);
}

const _v04BossAttack=bossAttack;
bossAttack=function(dt){
  const d=bossDef(),b=state.boss;
  if(d.attack==='gravity'){
    b.angle+=dt*.45;
    applyGravityMawField(dt,true);
    b.attackTimer-=dt;
    if(b.attackTimer<=0){b.attackTimer=2.8;aimedBurst(4,.15,105)}
    return;
  }
  if(d.attack==='telegraph'){
    updateOracleEngine(dt);
    b.attackTimer-=dt;
    if(b.attackTimer<=0){b.attackTimer=3.4;radialBurst(10,78)}
    return;
  }
  _v04BossAttack(dt);
};

drawBackground=function(c){
  const d=bossDef();
  c.fillStyle='#010103';c.fillRect(0,0,V05_LOGICAL_W,V05_LOGICAL_H);
  const g=c.createRadialGradient(V05_LOGICAL_W*.5,V05_LOGICAL_H*.45,70,V05_LOGICAL_W*.5,V05_LOGICAL_H*.45,820);
  g.addColorStop(0,d.number===2?'#0e0603':d.number===3?'#09050f':d.number===4?'#020b08':d.number===5?'#10030c':'#040a0f');
  g.addColorStop(1,'#010103');c.fillStyle=g;c.fillRect(0,0,V05_LOGICAL_W,V05_LOGICAL_H);
  c.fillStyle='#030509';c.fillRect(world.x,world.y,world.w,world.h);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(grid[y][x]===1){c.fillStyle=d.territory;c.fillRect(world.x+x*GRID,world.y+y*GRID,GRID+1,GRID+1)}
  c.strokeStyle=d.accent;c.lineWidth=2;c.strokeRect(world.x+.5,world.y+.5,world.w,world.h);
  c.globalAlpha=.055;c.strokeStyle='#d7e8ff';c.lineWidth=1;
  for(let x=world.x;x<=world.x+world.w;x+=30){c.beginPath();c.moveTo(x,world.y);c.lineTo(x,world.y+world.h);c.stroke()}
  for(let y=world.y;y<=world.y+world.h;y+=30){c.beginPath();c.moveTo(world.x,y);c.lineTo(world.x+world.w,y);c.stroke()}
  c.globalAlpha=1;
};

drawSeraph=function(c,b,d){
  c.save();c.translate(q(b.x),q(b.y));c.shadowBlur=25;c.shadowColor='#b77cff';c.rotate(-b.angle*.22);c.strokeStyle='#b77cff';c.lineWidth=3;
  for(let ring=0;ring<3;ring++){c.beginPath();c.arc(0,0,b.r+ring*9,0,Math.PI*2);c.stroke()}
  c.rotate(b.angle*.68);c.fillStyle='#120d1b';c.strokeStyle='#dec8ff';c.lineWidth=2;c.beginPath();
  for(let i=0;i<6;i++){const a=i*Math.PI/3,rr=i%2?29:40,x=q(Math.cos(a)*rr),y=q(Math.sin(a)*rr);i?c.lineTo(x,y):c.moveTo(x,y)}
  c.closePath();c.fill();c.stroke();c.fillStyle='#b77cff';c.beginPath();c.arc(0,0,10,0,Math.PI*2);c.fill();c.restore();
  c.save();c.strokeStyle='rgba(183,124,255,.7)';c.lineWidth=3;
  for(let i=0;i<4;i++){const a=state.seraphLaserAngle+i*Math.PI/2;c.beginPath();c.moveTo(q(b.x),q(b.y));c.lineTo(q(b.x+Math.cos(a)*1100),q(b.y+Math.sin(a)*1100));c.stroke()}
  c.restore();
};

drawGravityMaw=function(c,b,d){
  c.save();c.translate(q(b.x),q(b.y));c.rotate(b.angle*.16);c.shadowBlur=26;c.shadowColor='#5dffbf';c.strokeStyle='#5dffbf';c.fillStyle='#06120f';c.lineWidth=3;
  for(let ring=0;ring<3;ring++){c.beginPath();c.arc(0,0,b.r-ring*10,0,Math.PI*2);c.stroke()}
  c.rotate(-b.angle*.52);c.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6,rr=i%2?24:39,x=q(Math.cos(a)*rr),y=q(Math.sin(a)*rr);i?c.lineTo(x,y):c.moveTo(x,y)}
  c.closePath();c.fill();c.stroke();c.fillStyle='#d9fff1';c.beginPath();c.arc(0,0,7,0,Math.PI*2);c.fill();c.restore();
  for(const well of gravityWellPositions()){c.save();c.translate(q(well.x),q(well.y));c.globalAlpha=.85;c.strokeStyle='#5dffbf';c.fillStyle='#020906';c.lineWidth=2;c.shadowBlur=14;c.shadowColor='#5dffbf';c.beginPath();c.arc(0,0,17,0,Math.PI*2);c.fill();c.stroke();c.globalAlpha=.35;c.beginPath();c.arc(0,0,28,0,Math.PI*2);c.stroke();c.restore()}
};

function drawOracleEngine(c,b,d){
  c.save();c.translate(q(b.x),q(b.y));c.rotate(b.angle*.18);c.shadowBlur=26;c.shadowColor='#ff4fd8';c.fillStyle='#170514';c.strokeStyle='#ff4fd8';c.lineWidth=3;
  for(let ring=0;ring<3;ring++){c.beginPath();c.arc(0,0,b.r-ring*9,0,Math.PI*2);c.stroke()}
  c.rotate(-b.angle*.72);c.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4,rr=i%2?25:43,x=q(Math.cos(a)*rr),y=q(Math.sin(a)*rr);i?c.lineTo(x,y):c.moveTo(x,y)}
  c.closePath();c.fill();c.stroke();c.fillStyle='#fff0fb';c.beginPath();c.arc(0,0,8,0,Math.PI*2);c.fill();c.restore();
}
function drawTelegraphs(c){
  for(const t of state.telegraphs){
    c.save();
    if(t.warning>0){
      const pulse=.5+.5*Math.sin(performance.now()*.012);c.globalAlpha=.58;c.fillStyle='rgba(255,40,110,.10)';c.strokeStyle=t.color;c.lineWidth=3;c.beginPath();c.arc(q(t.x),q(t.y),t.r,0,Math.PI*2);c.fill();c.stroke();c.globalAlpha=.25+.25*pulse;c.lineWidth=5;c.beginPath();c.arc(q(t.x),q(t.y),Math.max(5,t.r*(1-Math.min(1,t.warning/1.8))),0,Math.PI*2);c.stroke();
    }else{c.globalAlpha=.88;c.fillStyle='rgba(255,30,100,.36)';c.strokeStyle='#fff';c.lineWidth=4;c.beginPath();c.arc(q(t.x),q(t.y),t.r,0,Math.PI*2);c.fill();c.stroke()}
    c.restore();
  }
}

drawBoss=function(c){
  if(!state.boss)return;const b=state.boss,d=bossDef();
  if(d.attack==='void')drawVoidBeast(c,b,d);else if(d.attack==='ricochet')drawRicochet(c,b,d);else if(d.attack==='seraph')drawSeraph(c,b,d);else if(d.attack==='gravity')drawGravityMaw(c,b,d);else drawOracleEngine(c,b,d);
};

drawScene=function(now){
  drawBackground(sceneCtx);drawRelics(now,sceneCtx);drawTelegraphs(sceneCtx);drawProjectiles(sceneCtx);drawBoss(sceneCtx);drawRemotePlayers(sceneCtx);drawPlayer(sceneCtx);drawEffects(sceneCtx);
  sceneCtx.globalAlpha=.08;sceneCtx.fillStyle='#fff';for(let y=0;y<V05_LOGICAL_H;y+=4)sceneCtx.fillRect(0,y,V05_LOGICAL_W,1);sceneCtx.globalAlpha=1;
};

renderPSX=function(){
  pixelCtx.setTransform(1,0,0,1,0,0);pixelCtx.imageSmoothingEnabled=false;pixelCtx.clearRect(0,0,V05_PIXEL_W,V05_PIXEL_H);pixelCtx.drawImage(sceneCanvas,0,0,V05_PIXEL_W,V05_PIXEL_H);
  displayCtx.setTransform(1,0,0,1,0,0);displayCtx.fillStyle='#000';displayCtx.fillRect(0,0,canvas.width,canvas.height);
  const scale=Math.min(canvas.width/V05_LOGICAL_W,canvas.height/V05_LOGICAL_H),dw=Math.floor(V05_LOGICAL_W*scale),dh=Math.floor(V05_LOGICAL_H*scale),dx=Math.floor((canvas.width-dw)/2),dy=Math.floor((canvas.height-dh)/2);displayCtx.imageSmoothingEnabled=false;
  if(state.settings.pixelMode)displayCtx.drawImage(pixelCanvas,0,0,V05_PIXEL_W,V05_PIXEL_H,dx,dy,dw,dh);else displayCtx.drawImage(sceneCanvas,0,0,V05_LOGICAL_W,V05_LOGICAL_H,dx,dy,dw,dh);
};

buildGrid();resetBoss();resetPlayer();
