// RAID QIX v0.8 attack library expansion.
// Reusable attack primitives inspired by MMO raid telegraphs, predictive attacks,
// bullet-hell patterns, and Undertale-like lane pressure.

Object.assign(state,{
  attackSeq:0,
  lineTelegraphs:[],
  donutTelegraphs:[],
  coneTelegraphs:[],
  chaseTelegraphs:[],
  walls:[],
  v08Timers:{},
  randomAttackHistory:[]
});

function v08Rand(min,max){return min+Math.random()*(max-min)}
function v08Pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function v08Timer(key,dt,period){
  state.v08Timers[key]=(state.v08Timers[key]??period)-dt;
  if(state.v08Timers[key]<=0){state.v08Timers[key]=period;return true}
  return false;
}
function angleDelta(a,b){
  let d=(a-b)%(Math.PI*2);
  if(d>Math.PI)d-=Math.PI*2;
  if(d<-Math.PI)d+=Math.PI*2;
  return Math.abs(d);
}

function spawnLineTelegraph(x1,y1,x2,y2,width=44,opts={}){
  const t={id:++state.attackSeq,x1,y1,x2,y2,width,warning:opts.warning??1.6,active:opts.active??.2,color:opts.color||'#ff5252'};
  state.lineTelegraphs.push(t);return t;
}
function spawnConeTelegraph(x,y,angle,range=260,halfAngle=.38,opts={}){
  const t={id:++state.attackSeq,x,y,angle,range,halfAngle,warning:opts.warning??1.6,active:opts.active??.2,color:opts.color||'#ffb14d'};
  state.coneTelegraphs.push(t);return t;
}
function spawnDonutTelegraph(x,y,inner=80,outer=190,opts={}){
  const t={id:++state.attackSeq,x,y,inner,outer,warning:opts.warning??1.7,active:opts.active??.2,color:opts.color||'#ffea63'};
  state.donutTelegraphs.push(t);return t;
}
function spawnChasingCircle(x,y,r=72,opts={}){
  const t={id:++state.attackSeq,x,y,r,warning:opts.warning??2.2,active:opts.active??.18,color:opts.color||'#ff66aa',follow:opts.follow??1.2};
  state.chaseTelegraphs.push(t);return t;
}
function pointSegmentDistance(px,py,x1,y1,x2,y2){
  const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;
  if(!l2)return Math.hypot(px-x1,py-y1);
  const t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/l2));
  return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));
}
function updateExtraTelegraphs(dt,advance=true){
  for(let i=state.lineTelegraphs.length-1;i>=0;i--){
    const t=state.lineTelegraphs[i];if(advance)t.warning-=dt;
    if(t.warning<=0){if(advance)t.active-=dt;if(state.iframeTimer<=0&&pointSegmentDistance(player.x,player.y,t.x1,t.y1,t.x2,t.y2)<=t.width*.5)playerHit();if(t.active<=0&&advance)state.lineTelegraphs.splice(i,1)}
  }
  for(let i=state.coneTelegraphs.length-1;i>=0;i--){
    const t=state.coneTelegraphs[i];if(advance)t.warning-=dt;
    if(t.warning<=0){if(advance)t.active-=dt;const dx=player.x-t.x,dy=player.y-t.y,dist=Math.hypot(dx,dy),a=Math.atan2(dy,dx);if(state.iframeTimer<=0&&dist<=t.range&&angleDelta(a,t.angle)<=t.halfAngle)playerHit();if(t.active<=0&&advance)state.coneTelegraphs.splice(i,1)}
  }
  for(let i=state.donutTelegraphs.length-1;i>=0;i--){
    const t=state.donutTelegraphs[i];if(advance)t.warning-=dt;
    if(t.warning<=0){if(advance)t.active-=dt;const dist=Math.hypot(player.x-t.x,player.y-t.y);if(state.iframeTimer<=0&&dist>=t.inner&&dist<=t.outer)playerHit();if(t.active<=0&&advance)state.donutTelegraphs.splice(i,1)}
  }
  for(let i=state.chaseTelegraphs.length-1;i>=0;i--){
    const t=state.chaseTelegraphs[i];if(t.follow>0){t.follow-=dt;const k=Math.min(1,dt*3.2);t.x+=(player.x-t.x)*k;t.y+=(player.y-t.y)*k}if(advance)t.warning-=dt;
    if(t.warning<=0){if(advance)t.active-=dt;if(state.iframeTimer<=0&&Math.hypot(player.x-t.x,player.y-t.y)<=t.r+player.r)playerHit();if(t.active<=0&&advance)state.chaseTelegraphs.splice(i,1)}
  }
}

function predictiveAimPoint(leadSeconds=.55){return{x:player.x+player.dx*currentSpeed()*leadSeconds,y:player.y+player.dy*currentSpeed()*leadSeconds}}
function attackPredictiveShot(cfg={}){const p=predictiveAimPoint(cfg.lead??.55),a=Math.atan2(p.y-state.boss.y,p.x-state.boss.x),count=cfg.count??3,spread=cfg.spread??.08,speed=cfg.speed??128;for(let i=-(count-1)/2;i<=(count-1)/2;i++)spawnBullet(a+i*spread,speed,5,{life:9,color:cfg.color||'#ff6262'})}
function attackPredictiveLine(cfg={}){const p=predictiveAimPoint(cfg.lead??.75),a=Math.atan2(p.y-state.boss.y,p.x-state.boss.x),len=cfg.length??1000;spawnLineTelegraph(state.boss.x,state.boss.y,state.boss.x+Math.cos(a)*len,state.boss.y+Math.sin(a)*len,cfg.width??46,{warning:cfg.warning??1.35,color:cfg.color||'#ff4d67'})}
function attackCone(cfg={}){const a=Math.atan2(player.y-state.boss.y,player.x-state.boss.x);spawnConeTelegraph(state.boss.x,state.boss.y,a,cfg.range??320,cfg.halfAngle??.42,{warning:cfg.warning??1.55,color:cfg.color||'#ff9b4b'})}
function attackDonut(cfg={}){spawnDonutTelegraph(state.boss.x,state.boss.y,cfg.inner??95,cfg.outer??230,{warning:cfg.warning??1.7,color:cfg.color||'#ffe85a'})}
function attackPointBlank(cfg={}){spawnTelegraphCircle(state.boss.x,state.boss.y,cfg.radius??155,{warning:cfg.warning??1.45,color:cfg.color||'#ff7a58'})}
function attackChasingAoE(cfg={}){spawnChasingCircle(player.x,player.y,cfg.radius??75,{warning:cfg.warning??2.3,follow:cfg.follow??1.25,color:cfg.color||'#f05cff'})}
function attackCheckerboard(cfg={}){const cell=cfg.cell??100,warning=cfg.warning??1.8,parity=Math.random()<.5?0:1;for(let y=world.y+cell*.5,gy=0;y<world.y+world.h;y+=cell,gy++)for(let x=world.x+cell*.5,gx=0;x<world.x+world.w;x+=cell,gx++)if((gx+gy)%2===parity)spawnTelegraphCircle(x,y,cell*.42,{warning,color:cfg.color||'#61a8ff'})}
function attackCrossLines(cfg={}){const w=cfg.width??56,warning=cfg.warning??1.5;spawnLineTelegraph(world.x,player.y,world.x+world.w,player.y,w,{warning,color:cfg.color||'#ff5a88'});spawnLineTelegraph(player.x,world.y,player.x,world.y+world.h,w,{warning,color:cfg.color||'#ff5a88'})}
function attackSequentialLines(cfg={}){const count=cfg.count??5,vertical=Math.random()<.5,gap=(vertical?world.w:world.h)/(count+1);for(let i=1;i<=count;i++){const warning=(cfg.warning??1.1)+i*(cfg.step??.18);if(vertical){const x=world.x+gap*i;spawnLineTelegraph(x,world.y,x,world.y+world.h,cfg.width??42,{warning,color:cfg.color||'#ff765c'})}else{const y=world.y+gap*i;spawnLineTelegraph(world.x,y,world.x+world.w,y,cfg.width??42,{warning,color:cfg.color||'#ff765c'})}}}
function attackCurtain(cfg={}){const fromTop=Math.random()<.5,count=cfg.count??14;for(let i=0;i<count;i++){const x=world.x+(i+.5)*world.w/count,y=fromTop?world.y+4:world.y+world.h-4,a=fromTop?Math.PI/2:-Math.PI/2;state.projectiles.push({x,y,vx:Math.cos(a)*(cfg.speed??78),vy:Math.sin(a)*(cfg.speed??78),r:cfg.size??5,life:14,color:cfg.color||'#87d7ff'})}}
function attackSineCurtain(cfg={}){const count=cfg.count??12;for(let i=0;i<count;i++){const y=world.y+(i+.5)*world.h/count;state.projectiles.push({x:world.x+4,y,vx:cfg.speed??86,vy:0,r:cfg.size??5,life:16,color:cfg.color||'#e88cff',sine:true,sineBaseY:y,sinePhase:i*.65,sineAmp:cfg.amp??34,sineFreq:cfg.freq??.045})}}
function attackSpiral(cfg={}){const arms=cfg.arms??3,count=cfg.count??5;for(let arm=0;arm<arms;arm++)for(let i=0;i<count;i++){const a=(state.boss.angle||0)+arm*Math.PI*2/arms+i*(cfg.step??.18);spawnBullet(a,cfg.speed??92,5,{life:11,color:cfg.color||'#c982ff'})}}
function attackSafeLane(cfg={}){const lanes=cfg.lanes??7,safe=Math.floor(Math.random()*lanes),laneW=world.w/lanes;for(let i=0;i<lanes;i++){if(i===safe)continue;const x=world.x+laneW*(i+.5);spawnLineTelegraph(x,world.y,x,world.y+world.h,laneW*.72,{warning:cfg.warning??1.65,color:cfg.color||'#5ba8ff'})}}
function attackRotatingLasers(cfg={}){const count=cfg.count??4,length=cfg.length??1100,offset=cfg.offset??0;for(let i=0;i<count;i++){const a=(state.seraphLaserAngle||0)+offset+i*Math.PI*2/count;spawnLineTelegraph(state.boss.x,state.boss.y,state.boss.x+Math.cos(a)*length,state.boss.y+Math.sin(a)*length,cfg.width??22,{warning:cfg.warning??.45,active:cfg.active??.12,color:cfg.color||'#b77cff'})}}

const _v07UpdateProjectiles=updateProjectiles;
updateProjectiles=function(dt){for(const p of state.projectiles){if(p.sine){p.sinePhase=(p.sinePhase||0)+dt;p.y=p.sineBaseY+Math.sin((p.x||0)*(p.sineFreq||.04)+p.sinePhase*3)*(p.sineAmp||30)}}_v07UpdateProjectiles(dt)};

const ATTACK_LIBRARY={
  radial:{weight:10,run:cfg=>radialBurst(cfg.count??12,cfg.speed??90)},aimed:{weight:10,run:cfg=>aimedBurst(cfg.count??5,cfg.spread??.12,cfg.speed??105)},predictiveShot:{weight:9,run:attackPredictiveShot},predictiveLine:{weight:8,run:attackPredictiveLine},cone:{weight:8,run:attackCone},donut:{weight:8,run:attackDonut},pointBlank:{weight:7,run:attackPointBlank},chasingAoE:{weight:8,run:attackChasingAoE},checkerboard:{weight:5,run:attackCheckerboard},crossLines:{weight:7,run:attackCrossLines},sequentialLines:{weight:7,run:attackSequentialLines},curtain:{weight:7,run:attackCurtain},sineCurtain:{weight:6,run:attackSineCurtain},spiral:{weight:8,run:attackSpiral},safeLane:{weight:7,run:attackSafeLane},rotatingLasers:{weight:6,run:attackRotatingLasers},triangleBreak:{weight:8,run:cfg=>{const count=cfg.count??4;for(let i=0;i<count;i++){const a=Math.atan2(player.y-state.boss.y,player.x-state.boss.x)+(i-(count-1)/2)*(cfg.spread??.14);if(typeof spawnTriangleBullet==='function')spawnTriangleBullet(a,cfg.speed??105,cfg.radius??42);else spawnBullet(a,cfg.speed??105,7,{life:10,color:'#ffcc55'})}}}
};
function weightedAttackKey(){const entries=Object.entries(ATTACK_LIBRARY);let total=entries.reduce((s,[,v])=>s+v.weight,0),r=Math.random()*total;for(const[k,v]of entries){r-=v.weight;if(r<=0)return k}return entries[0][0]}
function randomizeAttackConfig(key,floor=1){const scale=1+Math.min(1.5,(floor-1)*.035),common={speed:v08Rand(72,132)*scale,warning:v08Rand(1.05,2.1),count:Math.floor(v08Rand(3,15)),width:v08Rand(34,68)};if(key==='donut')Object.assign(common,{inner:v08Rand(65,120),outer:v08Rand(180,280)});if(key==='cone')Object.assign(common,{range:v08Rand(240,380),halfAngle:v08Rand(.26,.55)});if(key==='chasingAoE')Object.assign(common,{radius:v08Rand(55,95),follow:v08Rand(.7,1.5)});if(key==='spiral')Object.assign(common,{arms:Math.floor(v08Rand(2,5)),step:v08Rand(.11,.27)});if(key==='safeLane')Object.assign(common,{lanes:Math.floor(v08Rand(5,10))});if(key==='rotatingLasers')Object.assign(common,{count:Math.floor(v08Rand(2,6)),width:v08Rand(16,34)});return common}
function v08RandomBossPattern(floor=1){const desired=Math.min(5,2+Math.floor(floor/4)),picked=[];while(picked.length<desired){const k=weightedAttackKey();if(!picked.includes(k))picked.push(k)}return picked.map(k=>({key:k,cfg:randomizeAttackConfig(k,floor)}))}
state.v08RandomPattern=state.v08RandomPattern||[];state.v08RandomTimer=state.v08RandomTimer||1.2;
function v08EnsureRandomPattern(){if(!state.v08RandomPattern.length){const floor=state.randomFloor||state.floor||1;state.v08RandomPattern=v08RandomBossPattern(floor)}}
function v08RunRandomBoss(dt){v08EnsureRandomPattern();state.v08RandomTimer-=dt;if(state.v08RandomTimer<=0){const floor=state.randomFloor||state.floor||1;state.v08RandomTimer=Math.max(.55,v08Rand(.85,1.9)-Math.min(.45,floor*.012));const entry=v08Pick(state.v08RandomPattern);ATTACK_LIBRARY[entry.key]?.run(entry.cfg);state.randomAttackHistory.push(entry.key);if(state.randomAttackHistory.length>10)state.randomAttackHistory.shift()}updateExtraTelegraphs(dt,true)}

const _v07BossAttack=bossAttack;
bossAttack=function(dt){const d=bossDef();if(d.attack==='gravity'){state.seraphLaserAngle=(state.seraphLaserAngle||0)+dt*.16;if(v08Timer('gravityLaser',dt,3.4))attackRotatingLasers({count:2,width:20,warning:.65,color:'#5dffbf'})}if(d.attack==='random'||d.id==='random-boss'||state.randomMode===true||state.mode==='randomRaid'){v08RunRandomBoss(dt);return}_v07BossAttack(dt);updateExtraTelegraphs(dt,true)};
const _v07ResetBoss=resetBoss;
resetBoss=function(){_v07ResetBoss();state.v08RandomPattern=[];state.v08RandomTimer=1.1;state.lineTelegraphs=[];state.coneTelegraphs=[];state.donutTelegraphs=[];state.chaseTelegraphs=[]};

function drawLineTelegraphs(c){for(const t of state.lineTelegraphs){c.save();c.strokeStyle=t.color;c.lineWidth=t.width;c.globalAlpha=t.warning>0?.22:.62;c.beginPath();c.moveTo(q(t.x1),q(t.y1));c.lineTo(q(t.x2),q(t.y2));c.stroke();c.globalAlpha=1;c.strokeStyle=t.warning>0?'rgba(255,255,255,.35)':'#fff';c.lineWidth=2;c.beginPath();c.moveTo(q(t.x1),q(t.y1));c.lineTo(q(t.x2),q(t.y2));c.stroke();c.restore()}}
function drawConeTelegraphs(c){for(const t of state.coneTelegraphs){c.save();c.translate(q(t.x),q(t.y));c.fillStyle=t.color;c.globalAlpha=t.warning>0?.16:.48;c.strokeStyle=t.color;c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.arc(0,0,t.range,t.angle-t.halfAngle,t.angle+t.halfAngle);c.closePath();c.fill();c.stroke();c.restore()}}
function drawDonutTelegraphs(c){for(const t of state.donutTelegraphs){c.save();c.strokeStyle=t.color;c.globalAlpha=t.warning>0?.35:.72;c.lineWidth=Math.max(4,t.outer-t.inner);c.beginPath();c.arc(q(t.x),q(t.y),(t.outer+t.inner)/2,0,Math.PI*2);c.stroke();c.restore()}}
function drawChaseTelegraphs(c){for(const t of state.chaseTelegraphs){c.save();c.strokeStyle=t.color;c.fillStyle='rgba(255,60,140,.10)';c.globalAlpha=t.warning>0?.72:1;c.lineWidth=3;c.beginPath();c.arc(q(t.x),q(t.y),t.r,0,Math.PI*2);c.fill();c.stroke();c.restore()}}
const _v07DrawScene=drawScene;
drawScene=function(now){_v07DrawScene(now);drawLineTelegraphs(sceneCtx);drawConeTelegraphs(sceneCtx);drawDonutTelegraphs(sceneCtx);drawChaseTelegraphs(sceneCtx)};
