function q(v,step=2){return Math.round(v/step)*step}

function drawBackground(c){
  const d=bossDef();
  c.fillStyle='#010205';c.fillRect(0,0,LOGICAL_W,LOGICAL_H);
  const g=c.createRadialGradient(LOGICAL_W*.5,LOGICAL_H*.45,40,LOGICAL_W*.5,LOGICAL_H*.45,520);
  g.addColorStop(0,d.number===2?'#120906':d.number===3?'#0d0714':d.number===4?'#03100c':'#071018');
  g.addColorStop(1,'#010205');
  c.fillStyle=g;c.fillRect(0,0,LOGICAL_W,LOGICAL_H);

  c.fillStyle='#060a0f';c.fillRect(world.x,world.y,world.w,world.h);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(grid[y][x]===1){
    c.fillStyle=d.territory;c.fillRect(world.x+x*GRID,world.y+y*GRID,GRID+1,GRID+1);
  }
  c.strokeStyle=d.accent;c.lineWidth=2;c.strokeRect(world.x+.5,world.y+.5,world.w,world.h);

  c.globalAlpha=.08;c.strokeStyle='#d7e8ff';c.lineWidth=1;
  for(let x=world.x;x<=world.x+world.w;x+=24){c.beginPath();c.moveTo(x,world.y);c.lineTo(x,world.y+world.h);c.stroke()}
  for(let y=world.y;y<=world.y+world.h;y+=24){c.beginPath();c.moveTo(world.x,y);c.lineTo(world.x+world.w,y);c.stroke()}
  c.globalAlpha=1;
}

function drawRelics(now,c){
  for(const r of state.relics){
    if(r.taken)continue;
    const pulse=1+Math.sin(now*.004+r.phase)*.14;
    c.save();c.translate(q(r.x),q(r.y));c.scale(pulse,pulse);
    c.shadowBlur=12;c.shadowColor=r.type.color;
    c.fillStyle='#080a0f';c.strokeStyle=r.type.color;c.lineWidth=2;
    c.beginPath();
    for(let i=0;i<8;i++){
      const a=Math.PI/8+i*Math.PI/4,rr=i%2?9:13;
      const x=Math.cos(a)*rr,y=Math.sin(a)*rr;
      i?c.lineTo(x,y):c.moveTo(x,y);
    }
    c.closePath();c.fill();c.stroke();
    c.fillStyle=r.type.color;c.fillRect(-3,-3,6,6);
    c.restore();
  }
}

function drawVoidBeast(c,b,d){
  c.save();c.translate(q(b.x),q(b.y));c.rotate(b.angle*.18);
  c.shadowBlur=22;c.shadowColor='#ff315c';
  c.fillStyle='#160c19';c.strokeStyle='#ff315c';c.lineWidth=3;
  c.beginPath();
  for(let i=0;i<10;i++){
    const a=i*Math.PI*2/10,rr=i%2?b.r*.76:b.r*1.12;
    const x=q(Math.cos(a)*rr),y=q(Math.sin(a)*rr);
    i?c.lineTo(x,y):c.moveTo(x,y);
  }
  c.closePath();c.fill();c.stroke();
  c.rotate(-b.angle*.38);
  c.strokeStyle='#78233d';c.lineWidth=2;c.strokeRect(-19,-19,38,38);
  c.fillStyle='#ff416b';c.beginPath();c.arc(0,0,12,0,Math.PI*2);c.fill();
  c.fillStyle='#ffe8ef';c.fillRect(-3,-7,6,14);
  c.restore();
}
function drawRicochet(c,b,d){
  c.save();c.translate(q(b.x),q(b.y));c.rotate(b.angle*.35);
  c.shadowBlur=22;c.shadowColor='#ff934d';
  c.fillStyle='#24150e';c.strokeStyle='#ff934d';c.lineWidth=3;
  c.beginPath();
  for(let i=0;i<8;i++){
    const a=Math.PI/8+i*Math.PI/4,rr=i%2?b.r*.82:b.r*1.12;
    const x=q(Math.cos(a)*rr),y=q(Math.sin(a)*rr);
    i?c.lineTo(x,y):c.moveTo(x,y);
  }
  c.closePath();c.fill();c.stroke();
  c.strokeStyle='#7a3a19';c.lineWidth=4;
  c.beginPath();c.moveTo(-27,0);c.lineTo(27,0);c.moveTo(0,-27);c.lineTo(0,27);c.stroke();
  c.fillStyle='#ff934d';c.beginPath();c.arc(0,0,11,0,Math.PI*2);c.fill();
  c.fillStyle='#fff0dc';c.fillRect(-4,-4,8,8);
  c.restore();
}
function drawSeraph(c,b,d){
  c.save();c.translate(q(b.x),q(b.y));
  c.shadowBlur=25;c.shadowColor='#b77cff';
  c.rotate(-b.angle*.22);
  c.strokeStyle='#b77cff';c.lineWidth=3;
  for(let ring=0;ring<3;ring++){
    c.beginPath();c.arc(0,0,b.r+ring*9,0,Math.PI*2);c.stroke();
  }
  c.rotate(b.angle*.68);
  c.fillStyle='#120d1b';c.strokeStyle='#dec8ff';c.lineWidth=2;
  c.beginPath();
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3,rr=i%2?29:40;
    const x=q(Math.cos(a)*rr),y=q(Math.sin(a)*rr);
    i?c.lineTo(x,y):c.moveTo(x,y);
  }
  c.closePath();c.fill();c.stroke();
  c.fillStyle='#b77cff';c.beginPath();c.arc(0,0,10,0,Math.PI*2);c.fill();
  if(state.seraphPulse>0){
    c.globalAlpha=state.seraphPulse/.65;c.strokeStyle='#fff';c.lineWidth=2;
    c.beginPath();c.arc(0,0,55+(1-state.seraphPulse/.65)*55,0,Math.PI*2);c.stroke();
  }
  c.globalAlpha=1;c.restore();

  c.save();c.strokeStyle='rgba(183,124,255,.7)';c.lineWidth=3;
  for(let i=0;i<4;i++){
    const a=state.seraphLaserAngle+i*Math.PI/2;
    c.beginPath();c.moveTo(q(b.x),q(b.y));c.lineTo(q(b.x+Math.cos(a)*520),q(b.y+Math.sin(a)*520));c.stroke();
  }
  c.restore();
}
function drawGravityMaw(c,b,d){
  c.save();c.translate(q(b.x),q(b.y));c.rotate(b.angle*.16);
  c.shadowBlur=26;c.shadowColor='#5dffbf';
  c.strokeStyle='#5dffbf';c.fillStyle='#06120f';c.lineWidth=3;
  for(let ring=0;ring<3;ring++){
    c.beginPath();c.arc(0,0,b.r-ring*10,0,Math.PI*2);c.stroke();
  }
  c.rotate(-b.angle*.52);
  c.beginPath();
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,rr=i%2?24:39;
    const x=q(Math.cos(a)*rr),y=q(Math.sin(a)*rr);
    i?c.lineTo(x,y):c.moveTo(x,y);
  }
  c.closePath();c.fill();c.stroke();
  c.fillStyle='#d9fff1';c.beginPath();c.arc(0,0,7,0,Math.PI*2);c.fill();
  c.restore();

  for(const well of gravityWellPositions()){
    c.save();c.translate(q(well.x),q(well.y));
    c.globalAlpha=.85;c.strokeStyle='#5dffbf';c.fillStyle='#020906';c.lineWidth=2;c.shadowBlur=14;c.shadowColor='#5dffbf';
    c.beginPath();c.arc(0,0,17,0,Math.PI*2);c.fill();c.stroke();
    c.globalAlpha=.35;c.beginPath();c.arc(0,0,28,0,Math.PI*2);c.stroke();
    c.restore();
  }
  if(state.gravityWaveLife>0){
    c.save();c.globalAlpha=Math.min(.7,state.gravityWaveLife);c.strokeStyle='#aaffdf';c.lineWidth=3;
    c.beginPath();c.arc(q(b.x),q(b.y),state.gravityWaveRadius,0,Math.PI*2);c.stroke();c.restore();
  }
}

function drawBoss(c){if(!state.boss)return;const b=state.boss,d=bossDef();if(d.attack==='void')drawVoidBeast(c,b,d);else if(d.attack==='ricochet')drawRicochet(c,b,d);else if(d.attack==='seraph')drawSeraph(c,b,d);else drawGravityMaw(c,b,d)}

function drawProjectiles(c){
  for(const p of state.projectiles){
    c.save();c.translate(q(p.x),q(p.y));
    c.shadowBlur=p.ricochet?15:8;c.shadowColor=p.color;c.fillStyle=p.color;
    if(p.ricochet){c.rotate((p.x+p.y)*.02);c.fillRect(-p.r,-p.r,p.r*2,p.r*2)}
    else{c.beginPath();c.arc(0,0,p.r,0,Math.PI*2);c.fill()}
    c.restore();
  }
}
function drawRemotePlayers(c){
  for(const[id,p]of state.remotePlayers){
    if(performance.now()-p.updated>1500){state.remotePlayers.delete(id);continue}
    if(p.drawing&&p.line?.length>1){
      c.strokeStyle='#ffe066';c.lineWidth=3;c.beginPath();c.moveTo(q(p.line[0].x),q(p.line[0].y));
      for(let i=1;i<p.line.length;i++)c.lineTo(q(p.line[i].x),q(p.line[i].y));c.stroke();
    }
    c.fillStyle='#ffe066';c.beginPath();c.arc(q(p.x),q(p.y),7,0,Math.PI*2);c.fill();
  }
}
function drawPlayer(c){
  if(player.drawing&&player.line.length>1){
    c.save();c.strokeStyle='#5deaff';c.lineWidth=3;c.lineCap='round';c.shadowBlur=8;c.shadowColor='#5deaff';
    c.beginPath();c.moveTo(q(player.line[0].x),q(player.line[0].y));
    for(let i=1;i<player.line.length;i++)c.lineTo(q(player.line[i].x),q(player.line[i].y));c.stroke();c.restore();
  }
  c.save();c.globalAlpha=state.iframeTimer>0?.45:1;c.fillStyle='#fff';c.shadowBlur=12;c.shadowColor='#5deaff';
  c.beginPath();c.arc(q(player.x),q(player.y),player.r,0,Math.PI*2);c.fill();c.restore();
}
function drawEffects(c){
  for(const e of state.effects){
    c.save();c.globalAlpha=Math.max(0,e.life);c.strokeStyle=e.color;c.lineWidth=2;
    c.beginPath();c.arc(q(e.x),q(e.y),e.r,0,Math.PI*2);c.stroke();c.restore();
  }
}

function drawScene(now){
  drawBackground(sceneCtx);
  drawRelics(now,sceneCtx);
  drawProjectiles(sceneCtx);
  drawBoss(sceneCtx);
  drawRemotePlayers(sceneCtx);
  drawPlayer(sceneCtx);
  drawEffects(sceneCtx);

  sceneCtx.globalAlpha=.08;
  sceneCtx.fillStyle='#fff';
  for(let y=0;y<LOGICAL_H;y+=4)sceneCtx.fillRect(0,y,LOGICAL_W,1);
  sceneCtx.globalAlpha=1;
}

function renderPSX(){
  pixelCtx.setTransform(1,0,0,1,0,0);
  pixelCtx.imageSmoothingEnabled=false;
  pixelCtx.clearRect(0,0,PIXEL_W,PIXEL_H);
  pixelCtx.drawImage(sceneCanvas,0,0,PIXEL_W,PIXEL_H);

  displayCtx.setTransform(1,0,0,1,0,0);
  displayCtx.fillStyle='#000';
  displayCtx.fillRect(0,0,canvas.width,canvas.height);

  const scale=Math.min(canvas.width/LOGICAL_W,canvas.height/LOGICAL_H);
  const dw=Math.floor(LOGICAL_W*scale),dh=Math.floor(LOGICAL_H*scale);
  const dx=Math.floor((canvas.width-dw)/2),dy=Math.floor((canvas.height-dh)/2);
  displayCtx.imageSmoothingEnabled=false;

  if(state.settings.pixelMode) displayCtx.drawImage(pixelCanvas,0,0,PIXEL_W,PIXEL_H,dx,dy,dw,dh);
  else displayCtx.drawImage(sceneCanvas,0,0,LOGICAL_W,LOGICAL_H,dx,dy,dw,dh);
}

