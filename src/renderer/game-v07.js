// RAID QIX v0.7 patch: territory-breaker triangle bullets + reusable attack modules + endless random raid.

Object.assign(state,{
  triangleTimer:2.4,
  randomRun:{active:false,floor:0,config:null,def:null,best:Number(localStorage.getItem('raidqix.randomBest')||0)},
  randomAttackTimer:1.0,
  randomPhase:0,
  randomLaserAngle:0,
  randomLaserSpeed:.18,
  randomGravityStrength:0
});

function destroyTerritoryAt(x,y,radius=62){
  const center=worldToGrid(x,y);
  const cells=Math.ceil(radius/GRID);
  let changed=false;
  for(let gy=Math.max(1,center.y-cells);gy<=Math.min(rows-2,center.y+cells);gy++){
    for(let gx=Math.max(1,center.x-cells);gx<=Math.min(cols-2,center.x+cells);gx++){
      const wx=world.x+gx*GRID,wy=world.y+gy*GRID;
      if(Math.hypot(wx-x,wy-y)<=radius&&grid[gy][gx]===1){grid[gy][gx]=0;changed=true}
    }
  }
  if(changed){updateArea();state.effects.push({x,y,r:18,life:1.0,color:'#ffdc55'});if(state.multiplayer&&state.isHost)sendNet({type:'grid-state',grid:cloneGrid()})}
  return changed;
}

function spawnTriangleBullet(angle,speed=105,size=10,opts={}){
  const p={x:state.boss.x,y:state.boss.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:size,shape:'triangle',territoryBreaker:true,blastRadius:opts.blastRadius??64,ricochet:false,bounces:0,maxBounces:0,life:opts.life??12,color:opts.color||'#ffdc55'};
  state.projectiles.push(p);return p;
}

const _v06UpdateProjectiles=updateProjectiles;
updateProjectiles=function(dt){
  for(let i=state.projectiles.length-1;i>=0;i--){
    const p=state.projectiles[i];if(!p.territoryBreaker)continue;p.life-=dt;
    if(p.life<=0){state.projectiles.splice(i,1);continue}
    const nx=p.x+p.vx*dt,ny=p.y+p.vy*dt;
    const inside=nx>=world.x&&nx<=world.x+world.w&&ny>=world.y&&ny<=world.y+world.h;
    if(inside&&isSafeWorld(nx,ny)){p.x=nx;p.y=ny;destroyTerritoryAt(nx,ny,p.blastRadius||64);state.projectiles.splice(i,1);continue}
    p.x=nx;p.y=ny;if(!inside){state.projectiles.splice(i,1);continue}
    if(Math.hypot(p.x-player.x,p.y-player.y)<p.r+player.r){playerHit();state.projectiles.splice(i,1);continue}
    if(player.drawing){let hit=false;for(const pt of player.line)if(Math.hypot(p.x-pt.x,p.y-pt.y)<p.r+3){hit=true;break}if(hit){playerHit();state.projectiles.splice(i,1)}}
  }
  const breakers=[];for(let i=state.projectiles.length-1;i>=0;i--)if(state.projectiles[i].territoryBreaker)breakers.unshift(state.projectiles.splice(i,1)[0]);
  _v06UpdateProjectiles(dt);state.projectiles.push(...breakers);
};

function randomRange(a,b){return a+Math.random()*(b-a)}
function randomInt(a,b){return Math.floor(randomRange(a,b+1))}

window.RAID_ATTACK_MODULES={
  radial(cfg){const count=cfg.count||10,speed=cfg.speed||90;for(let i=0;i<count;i++)spawnBullet(state.randomPhase+i*Math.PI*2/count,speed,cfg.size||6,{life:cfg.life||10,color:cfg.color})},
  aimed(cfg){const count=cfg.count||5,spread=cfg.spread||.13,speed=cfg.speed||105;const a=Math.atan2(player.y-state.boss.y,player.x-state.boss.x);for(let i=-(count-1)/2;i<=(count-1)/2;i++)spawnBullet(a+i*spread,speed,cfg.size||5,{life:cfg.life||10,color:cfg.color})},
  ricochet(cfg){const count=cfg.count||4;for(let i=0;i<count;i++)spawnBullet(state.randomPhase+i*Math.PI*2/count,cfg.speed||100,cfg.size||9,{ricochet:true,maxBounces:cfg.bounces||4,life:12,color:cfg.color})},
  triangleBreaker(cfg){const count=cfg.count||3;const base=Math.atan2(player.y-state.boss.y,player.x-state.boss.x);for(let i=0;i<count;i++)spawnTriangleBullet(base+(i-(count-1)/2)*(cfg.spread||.22),cfg.speed||105,cfg.size||10,{blastRadius:cfg.blastRadius||64,color:cfg.color||'#ffdc55'})},
  telegraph(cfg){const count=cfg.count||2;for(let i=0;i<count;i++)spawnRandomTelegraph(cfg.radius||70,cfg.warning||1.6,cfg.color||'#ff4fd8');if(cfg.targeted!==false)spawnTelegraphCircle(player.x,player.y,cfg.targetRadius||78,{warning:cfg.warning||1.6,color:cfg.color||'#ff4fd8'})},
  spiral(cfg){const count=cfg.count||6;for(let i=0;i<count;i++)spawnBullet(state.randomPhase+i*.18,cfg.speed||95,cfg.size||5,{life:10,color:cfg.color});state.randomPhase+=cfg.step||.48},
  cross(cfg){const arms=cfg.arms||4;for(let i=0;i<arms;i++)spawnBullet(state.randomPhase+i*Math.PI*2/arms,cfg.speed||125,cfg.size||6,{life:9,color:cfg.color});state.randomPhase+=cfg.step||.22},
  gapRing(cfg){const count=cfg.count||14,gap=randomInt(0,count-1);for(let i=0;i<count;i++)if(i!==gap)spawnBullet(state.randomPhase+i*Math.PI*2/count,cfg.speed||88,cfg.size||5,{life:11,color:cfg.color})},
  needle(cfg){const a=Math.atan2(player.y-state.boss.y,player.x-state.boss.x);const count=cfg.count||3;for(let i=0;i<count;i++)spawnBullet(a+randomRange(-.08,.08),cfg.speed||190,cfg.size||3,{life:7,color:cfg.color})},
  heavyOrb(cfg){const count=cfg.count||3;for(let i=0;i<count;i++)spawnBullet(state.randomPhase+i*Math.PI*2/count,cfg.speed||48,cfg.size||14,{life:15,color:cfg.color})}
};
const RANDOM_MODULE_KEYS=Object.keys(window.RAID_ATTACK_MODULES);

function makeRandomAttackConfig(key,floor,accent){
  const scale=1+Math.min(1.25,(floor-1)*.055),common={color:accent,speed:90*scale};
  switch(key){
    case 'radial': return {...common,count:randomInt(8,Math.min(22,10+floor)),speed:randomRange(72,110)*scale,size:randomInt(4,7)};
    case 'aimed': return {...common,count:randomInt(3,Math.min(7,3+Math.floor(floor/3))),spread:randomRange(.09,.18),speed:randomRange(90,135)*scale};
    case 'ricochet': return {...common,count:randomInt(3,6),speed:randomRange(75,110)*scale,size:randomInt(7,11),bounces:randomInt(3,6)};
    case 'triangleBreaker': return {...common,count:randomInt(1,Math.min(5,2+Math.floor(floor/4))),speed:randomRange(78,120)*scale,blastRadius:randomRange(48,82),spread:randomRange(.16,.3),color:'#ffdc55'};
    case 'telegraph': return {count:randomInt(1,Math.min(5,2+Math.floor(floor/4))),radius:randomRange(52,90),targetRadius:randomRange(58,94),warning:Math.max(.85,randomRange(1.35,2.0)-floor*.018),color:accent};
    case 'spiral': return {...common,count:randomInt(4,8),speed:randomRange(74,112)*scale,step:randomRange(.26,.58)};
    case 'cross': return {...common,arms:[4,6,8][randomInt(0,2)],speed:randomRange(95,145)*scale,step:randomRange(.12,.3)};
    case 'gapRing': return {...common,count:randomInt(11,19),speed:randomRange(70,105)*scale};
    case 'needle': return {...common,count:randomInt(2,5),speed:randomRange(155,220)*scale,size:randomInt(2,4)};
    case 'heavyOrb': return {...common,count:randomInt(2,5),speed:randomRange(38,62)*scale,size:randomInt(11,18)};
    default:return common;
  }
}

function generateRandomBoss(floor){
  const palettes=[['#ff526f','rgba(118,24,48,.99)'],['#55e8ff','rgba(16,82,105,.99)'],['#ffe066','rgba(112,82,14,.99)'],['#b77cff','rgba(82,42,142,.99)'],['#5dffbf','rgba(14,112,78,.99)'],['#ff4fd8','rgba(130,24,104,.99)']];
  const [accent,territory]=palettes[randomInt(0,palettes.length-1)];
  const prefixes=['NULL','VECTOR','STATIC','PHASE','BLACK','HYPER','BROKEN','VOID','SIGNAL','DELTA','GHOST','IRON'];
  const nouns=['ENGINE','WORM','ARCHON','MOUTH','CROWN','NODE','SAINT','MACHINE','SPHERE','EYE','TOWER','CHOIR'];
  const count=Math.min(6,2+Math.floor((floor-1)/3)),pool=[...RANDOM_MODULE_KEYS],modules=[];
  for(let i=0;i<count&&pool.length;i++){const pick=pool.splice(randomInt(0,pool.length-1),1)[0];modules.push({key:pick,cfg:makeRandomAttackConfig(pick,floor,accent)})}
  return {name:`${prefixes[randomInt(0,prefixes.length-1)]} ${nouns[randomInt(0,nouns.length-1)]}`,accent,territory,modules,interval:Math.max(.48,1.25-floor*.025),drift:Math.random()<Math.min(.8,.25+floor*.025),driftSpeed:randomRange(8,24)+floor*.35,gravity:Math.random()<Math.min(.55,floor*.025),laser:floor>=4&&Math.random()<Math.min(.45,floor*.018),laserSpeed:randomRange(.08,.22),floor};
}

const _v06BossDef=bossDef;
bossDef=function(){if(state.randomRun.active&&state.randomRun.def)return state.randomRun.def;return _v06BossDef()};

function setupRandomBossForFloor(floor,first=false){
  const cfg=generateRandomBoss(floor);state.randomRun.config=cfg;
  state.randomRun.def={id:'random-runtime',number:`R-${floor}`,name:cfg.name,subtitle:`RANDOM LAYER ${floor}`,hp:1110,accent:cfg.accent,territory:cfg.territory,description:'PROCEDURAL RAID BOSS',attack:'random'};state.bossId='random-runtime';
  const keepHp=playerHP,keepMax=playerMaxHP;
  state.projectiles=[];state.effects=[];state.telegraphs=[];state.remotePlayers.clear();state.area=0;state.relicCount=0;state.damage=0;state.gameOver=false;state.victory=false;
  buildGrid();resetBoss();spawnRelics();player.x=world.x+world.w*.5;player.y=world.y+world.h-5;player.lastSafeX=player.x;player.lastSafeY=player.y;player.drawing=false;player.line=[];
  if(first){const m=modifiers();playerMaxHP=3+m.maxHpAdd;playerHP=playerMaxHP;deathSaveCharges=m.deathSaveCharges}else{playerMaxHP=keepMax;playerHP=Math.max(1,Math.min(keepHp,playerMaxHP))}
  state.randomAttackTimer=.9;state.randomPhase=Math.random()*Math.PI*2;state.randomLaserAngle=Math.random()*Math.PI*2;state.randomLaserSpeed=cfg.laserSpeed;state.randomGravityStrength=cfg.gravity?randomRange(26,55):0;updateHud();
}

function startRandomRaid(){state.randomRun.active=true;state.randomRun.floor=1;state.multiplayer=false;state.isHost=false;state.mode='raid';document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));setupRandomBossForFloor(1,true)}
document.getElementById('randomRaidStart')?.addEventListener('click',startRandomRaid);

function randomBossUpdate(dt){
  const cfg=state.randomRun.config,b=state.boss;if(!cfg||!b)return;b.angle+=dt*.24;
  if(cfg.drift){if(!b.rvX){const a=Math.random()*Math.PI*2;b.rvX=Math.cos(a)*cfg.driftSpeed;b.rvY=Math.sin(a)*cfg.driftSpeed}b.x+=b.rvX*dt;b.y+=b.rvY*dt;const pad=120;if(b.x<world.x+pad||b.x>world.x+world.w-pad)b.rvX*=-1;if(b.y<world.y+pad||b.y>world.y+world.h-pad)b.rvY*=-1;b.x=Math.max(world.x+pad,Math.min(world.x+world.w-pad,b.x));b.y=Math.max(world.y+pad,Math.min(world.y+world.h-pad,b.y))}
  if(cfg.gravity&&state.iframeTimer<=0){const dx=b.x-player.x,dy=b.y-player.y,dist=Math.max(80,Math.hypot(dx,dy));if(dist<330){player.x+=dx/dist*state.randomGravityStrength*dt;player.y+=dy/dist*state.randomGravityStrength*dt}}
  if(cfg.laser){state.randomLaserAngle+=dt*state.randomLaserSpeed;for(let i=0;i<2;i++){const a=state.randomLaserAngle+i*Math.PI,ex=b.x+Math.cos(a)*1200,ey=b.y+Math.sin(a)*1200;if(state.iframeTimer<=0&&linePointDistance(player.x,player.y,b.x,b.y,ex,ey)<player.r+5)playerHit()}}
  state.randomAttackTimer-=dt;if(state.randomAttackTimer<=0){state.randomAttackTimer=cfg.interval*randomRange(.78,1.22);const useCount=Math.min(cfg.modules.length,1+(Math.random()<Math.min(.75,state.randomRun.floor*.035)?1:0));const picks=[...cfg.modules].sort(()=>Math.random()-.5).slice(0,useCount);for(const m of picks)window.RAID_ATTACK_MODULES[m.key](m.cfg)}
  updateTelegraphs(dt,true);
}

const _v06BossAttack7=bossAttack;
bossAttack=function(dt){if(state.randomRun.active){randomBossUpdate(dt);return}_v06BossAttack7(dt);if(bossDef().id==='gravity-maw'){state.triangleTimer-=dt;if(state.triangleTimer<=0){state.triangleTimer=5.6;const a=Math.atan2(player.y-state.boss.y,player.x-state.boss.x);for(let i=-1;i<=1;i++)spawnTriangleBullet(a+i*.25,92,10,{blastRadius:58})}}};

const _v06WinRaid=winRaid;
winRaid=function(broadcast=false){if(!state.randomRun.active){_v06WinRaid(broadcast);return}if(remainingCores()>0||state.victory)return;state.victory=true;const next=state.randomRun.floor+1;state.randomRun.best=Math.max(state.randomRun.best,state.randomRun.floor);localStorage.setItem('raidqix.randomBest',String(state.randomRun.best));state.effects.push({x:state.boss.x,y:state.boss.y,r:36,life:1.2,color:bossDef().accent});setTimeout(()=>{if(playerHP<=0)return;state.randomRun.floor=next;state.victory=false;setupRandomBossForFloor(next,false)},700)};

const _v06PlayerHit=playerHit;
playerHit=function(){const before=playerHP;_v06PlayerHit();if(state.randomRun.active&&before>0&&playerHP<=0){state.randomRun.best=Math.max(state.randomRun.best,state.randomRun.floor);localStorage.setItem('raidqix.randomBest',String(state.randomRun.best));state.randomRun.active=false}};

const _v06DrawProjectiles=drawProjectiles;
drawProjectiles=function(c){const breakers=[];for(let i=state.projectiles.length-1;i>=0;i--)if(state.projectiles[i].territoryBreaker)breakers.unshift(state.projectiles.splice(i,1)[0]);_v06DrawProjectiles(c);state.projectiles.push(...breakers);for(const p of breakers){c.save();c.translate(q(p.x),q(p.y));c.rotate(Math.atan2(p.vy,p.vx)+Math.PI/2);c.shadowBlur=14;c.shadowColor=p.color;c.fillStyle=p.color;c.strokeStyle='#fff4b0';c.lineWidth=2;c.beginPath();c.moveTo(0,-p.r*1.35);c.lineTo(p.r,p.r);c.lineTo(-p.r,p.r);c.closePath();c.fill();c.stroke();c.restore()}};

function drawRandomBoss(c,b,d){const cfg=state.randomRun.config;c.save();c.translate(q(b.x),q(b.y));c.rotate(b.angle);c.shadowBlur=30;c.shadowColor=d.accent;c.strokeStyle=d.accent;c.fillStyle='#08090d';c.lineWidth=3;const spikes=8+(state.randomRun.floor%7);c.beginPath();for(let i=0;i<spikes*2;i++){const a=i*Math.PI/spikes,rr=i%2?28:48,x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();c.fill();c.stroke();c.rotate(-b.angle*1.7);c.beginPath();c.arc(0,0,19,0,Math.PI*2);c.stroke();c.fillStyle=d.accent;c.fillRect(-5,-5,10,10);c.restore();if(cfg?.laser){c.save();c.strokeStyle=d.accent;c.globalAlpha=.62;c.lineWidth=3;for(let i=0;i<2;i++){const a=state.randomLaserAngle+i*Math.PI;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x+Math.cos(a)*1200,b.y+Math.sin(a)*1200);c.stroke()}c.restore()}};

const _v06DrawBoss7=drawBoss;
drawBoss=function(c){if(state.randomRun.active){drawRandomBoss(c,state.boss,bossDef());return}_v06DrawBoss7(c)};

const _v06UpdateHud7=updateHud;
updateHud=function(){_v06UpdateHud7();if(state.randomRun.active&&state.mode==='raid'){const cfg=state.randomRun.config;document.getElementById('bossName').textContent=`FLOOR ${state.randomRun.floor} · ${cfg?.name||'RANDOM BOSS'}`;document.getElementById('bossSubtitle').textContent=`ENDLESS RANDOM RAID · BEST ${state.randomRun.best}`}};
