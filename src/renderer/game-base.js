const DATA = window.RAID_DATA;
const canvas = document.getElementById('game');
const displayCtx = canvas.getContext('2d', { alpha:false });
const sceneCanvas = document.createElement('canvas');
const sceneCtx = sceneCanvas.getContext('2d', { alpha:false });
const pixelCanvas = document.createElement('canvas');
const pixelCtx = pixelCanvas.getContext('2d', { alpha:false });

const LOGICAL_W = 960;
const LOGICAL_H = 540;
const PIXEL_W = 320;
const PIXEL_H = 180;
const GRID = 6;

sceneCanvas.width = LOGICAL_W;
sceneCanvas.height = LOGICAL_H;
pixelCanvas.width = PIXEL_W;
pixelCanvas.height = PIXEL_H;
sceneCtx.imageSmoothingEnabled = false;
pixelCtx.imageSmoothingEnabled = false;
displayCtx.imageSmoothingEnabled = false;

const world = { x:42, y:54, w:876, h:432 };
let cols = 0, rows = 0, grid = [];
const keys = {};

const state = {
  mode:'menu',
  bossId:DATA.bosses[0].id,
  boss:null,
  projectiles:[],
  effects:[],
  relics:[],
  area:0,
  relicCount:0,
  damage:0,
  gameOver:false,
  victory:false,
  skillCooldown:0,
  buffTimer:0,
  iframeTimer:0,
  inventory:load('raidqix.inventory',['runner-coil','spare-heart','cold-clock']),
  equippedSkill:load('raidqix.skill','phase-dash'),
  equippedCharms:load('raidqix.charms',['runner-coil','spare-heart']),
  settings:load('raidqix.settings',{volume:80,screenShake:true,pixelMode:true}),
  multiplayer:false,
  isHost:false,
  members:[],
  localSteamId:'local',
  remotePlayers:new Map(),
  netPlayerTimer:0,
  netWorldTimer:0,
  seraphLaserAngle:0,
  seraphTeleportTimer:5,
  seraphPulse:0,
  gravityPhase:0,
  gravityPulseTimer:3.8,
  gravityWaveRadius:0,
  gravityWaveLife:0
};

const player = {
  x:0,y:0,r:7,baseSpeed:180,drawing:false,line:[],
  lastSafeX:0,lastSafeY:0,dx:0,dy:0
};
let playerHP=3, playerMaxHP=3, deathSaveCharges=0;

function load(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
function save(key,value){localStorage.setItem(key,JSON.stringify(value))}
function bossDef(){return DATA.bosses.find(b=>b.id===state.bossId)||DATA.bosses[0]}
function skillDef(){return DATA.skills.find(s=>s.id===state.equippedSkill)||DATA.skills[0]}
function charmDefs(){return state.equippedCharms.map(id=>DATA.charms.find(c=>c.id===id)).filter(Boolean)}
function modifiers(){
  const m={moveSpeedMultiplier:1,drawingSpeedMultiplier:1,maxHpAdd:0,cooldownMultiplier:1,relicDamageMultiplier:1,deathSaveCharges:0};
  for(const c of charmDefs()) for(const [k,v] of Object.entries(c.modifiers||{})){
    if(k.endsWith('Multiplier')) m[k]*=v; else m[k]+=v;
  }
  return m;
}

function resizeDisplay(){
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.max(1,Math.floor(innerWidth*dpr));
  canvas.height=Math.max(1,Math.floor(innerHeight*dpr));
  canvas.style.width='100vw';
  canvas.style.height='100vh';
  displayCtx.imageSmoothingEnabled=false;
}
addEventListener('resize',resizeDisplay);

function buildGrid(){
  cols=Math.floor(world.w/GRID)+1;
  rows=Math.floor(world.h/GRID)+1;
  grid=[];
  for(let y=0;y<rows;y++){
    grid[y]=[];
    for(let x=0;x<cols;x++) grid[y][x]=(x===0||y===0||x===cols-1||y===rows-1)?1:0;
  }
}
function worldToGrid(x,y){return{x:Math.round((x-world.x)/GRID),y:Math.round((y-world.y)/GRID)}}
function insideGrid(x,y){return x>=0&&y>=0&&x<cols&&y<rows}
function isSafeWorld(x,y){const p=worldToGrid(x,y);return !insideGrid(p.x,p.y)||grid[p.y][p.x]===1}
function cloneGrid(){return grid.map(row=>row.slice())}
function setGrid(next){
  if(!Array.isArray(next)||!next.length||!Array.isArray(next[0])) return;
  grid=next.map(r=>r.map(v=>v?1:0)); rows=grid.length; cols=grid[0].length; updateArea();
}
function mergeGrid(incoming){
  if(!Array.isArray(incoming)||incoming.length!==rows) return;
  for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) if(incoming[y]?.[x]) grid[y][x]=1;
  updateArea();
}

function resetPlayer(){
  const m=modifiers();
  player.x=world.x+world.w*.5;
  player.y=world.y+world.h-5;
  player.lastSafeX=player.x; player.lastSafeY=player.y;
  player.drawing=false; player.line=[];
  playerMaxHP=3+m.maxHpAdd; playerHP=playerMaxHP;
  deathSaveCharges=m.deathSaveCharges;
  state.skillCooldown=0; state.buffTimer=0; state.iframeTimer=0;
}
function resetBoss(){
  const d=bossDef();
  const integrity=coreTypes.reduce((a,c)=>a+c.damage,0);
  state.boss={
    x:world.x+world.w*.5,
    y:world.y+world.h*.42,
    r:d.number===3?44:d.number===4?48:34,
    hp:integrity,
    maxHp:integrity,
    angle:0,
    attackTimer:d.number===2?1.5:1
  };
  state.seraphLaserAngle=0;
  state.seraphTeleportTimer=5;
  state.seraphPulse=0;
  state.gravityPhase=0;
  state.gravityPulseTimer=3.8;
  state.gravityWaveRadius=0;
  state.gravityWaveLife=0;
}

const coreTypes=[
  {name:'ORB',color:'#55e8ff',damage:70},
  {name:'CROWN',color:'#ffe066',damage:120},
  {name:'CORE',color:'#ff64d5',damage:200},
  {name:'SHARD',color:'#9e8cff',damage:50},
  {name:'SUN',color:'#ff934d',damage:150},
  {name:'VOID',color:'#69ff8d',damage:90},
  {name:'STAR',color:'#ffffff',damage:180},
  {name:'REACTOR',color:'#ff527c',damage:250}
];

function spawnRelics(){
  state.relics=[];
  const placed=[];
  const marginX=world.w*.17, marginY=world.h*.15;
  const minX=world.x+marginX, maxX=world.x+world.w-marginX;
  const minY=world.y+marginY, maxY=world.y+world.h-marginY;
  const minSpacing=84;

  for(const type of coreTypes){
    let x,y,tries=0;
    do{
      x=minX+Math.random()*(maxX-minX);
      y=minY+Math.random()*(maxY-minY);
      tries++;
    }while(
      tries<250 && (
        Math.hypot(x-state.boss.x,y-state.boss.y)<105 ||
        placed.some(p=>Math.hypot(x-p.x,y-p.y)<minSpacing)
      )
    );
    placed.push({x,y});
    state.relics.push({id:state.relics.length,x,y,r:9,type:{...type},taken:false,phase:Math.random()*Math.PI*2});
  }
}

function remainingCores(){return state.relics.filter(r=>!r.taken).length}

function resetGame(){
  state.projectiles=[]; state.effects=[]; state.remotePlayers.clear();
  state.area=0; state.relicCount=0; state.damage=0;
  state.gameOver=false; state.victory=false;
  buildGrid(); resetPlayer(); resetBoss(); spawnRelics(); updateHud();
}

addEventListener('keydown',e=>{
  keys[e.key.toLowerCase()]=true;
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
  if(e.key.toLowerCase()==='e') useSkill();
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

function currentSpeed(){
  const m=modifiers();
  return player.baseSpeed*m.moveSpeedMultiplier*(player.drawing?m.drawingSpeedMultiplier:1)*(state.buffTimer>0?1.45:1);
}
function movePlayer(dt){
  let dx=0,dy=0;
  if(keys.w||keys.arrowup)dy--;
  if(keys.s||keys.arrowdown)dy++;
  if(keys.a||keys.arrowleft)dx--;
  if(keys.d||keys.arrowright)dx++;
  if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l}
  player.dx=dx; player.dy=dy;
  const ox=player.x,oy=player.y,s=currentSpeed();
  player.x+=dx*s*dt; player.y+=dy*s*dt;
  player.x=Math.max(world.x,Math.min(world.x+world.w,player.x));
  player.y=Math.max(world.y,Math.min(world.y+world.h,player.y));
  const safe=isSafeWorld(player.x,player.y);
  if(safe){player.lastSafeX=player.x;player.lastSafeY=player.y}
  if(!player.drawing&&!safe){player.drawing=true;player.line=[{x:ox,y:oy},{x:player.x,y:player.y}]}
  if(player.drawing){
    const last=player.line[player.line.length-1];
    if(Math.hypot(player.x-last.x,player.y-last.y)>3) player.line.push({x:player.x,y:player.y});
    if(safe&&player.line.length>4) finishLine();
  }
}
function useSkill(){
  if(state.mode!=='raid'||state.gameOver||state.skillCooldown>0)return;
  const s=skillDef(),m=modifiers();
  if(s.type==='dash'){
    let dx=player.dx,dy=player.dy;if(!dx&&!dy)dy=-1;
    player.x=Math.max(world.x,Math.min(world.x+world.w,player.x+dx*90));
    player.y=Math.max(world.y,Math.min(world.y+world.h,player.y+dy*90));
    state.iframeTimer=.6;
  }
  if(s.type==='heal')playerHP=Math.min(playerMaxHP,playerHP+1);
  if(s.type==='speed')state.buffTimer=5;
  state.skillCooldown=s.cooldown*m.cooldownMultiplier;
  state.effects.push({x:player.x,y:player.y,r:14,life:.8,color:'#69ff8d'});
}

function finishLine(){
  if(!player.drawing)return;
  player.line.push({x:player.x,y:player.y});
  captureArea(); player.drawing=false; player.line=[];
}
function captureArea(){
  for(let i=1;i<player.line.length;i++){
    const a=worldToGrid(player.line[i-1].x,player.line[i-1].y);
    const b=worldToGrid(player.line[i].x,player.line[i].y);
    const steps=Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y),1);
    for(let s=0;s<=steps;s++){
      const t=s/steps,gx=Math.round(a.x+(b.x-a.x)*t),gy=Math.round(a.y+(b.y-a.y)*t);
      if(insideGrid(gx,gy))grid[gy][gx]=1;
    }
  }

  const start=worldToGrid(state.boss.x,state.boss.y),visited=new Uint8Array(cols*rows),q=[];
  if(insideGrid(start.x,start.y)){q.push([start.x,start.y]);visited[start.y*cols+start.x]=1}
  let h=0;
  while(h<q.length){
    const[x,y]=q[h++];
    for(const[dX,dY]of[[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dX,ny=y+dY;if(!insideGrid(nx,ny))continue;
      const idx=ny*cols+nx;if(visited[idx]||grid[ny][nx]!==0)continue;
      visited[idx]=1;q.push([nx,ny]);
    }
  }
  for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++)if(grid[y][x]===0&&!visited[y*cols+x])grid[y][x]=1;
  collectRelics(); updateArea();
  state.effects.push({x:player.x,y:player.y,r:15,life:.8,color:'#55e8ff'});
  if(state.multiplayer){
    if(state.isHost)sendNet({type:'grid-state',grid:cloneGrid()});
    else sendNet({type:'capture-state',grid:cloneGrid()});
  }
}

function collectRelics(){
  const m=modifiers();
  for(const r of state.relics){
    if(r.taken)continue;
    if(isSafeWorld(r.x,r.y)){
      r.taken=true;
      state.relicCount++;
      const dmg=Math.round(r.type.damage*m.relicDamageMultiplier);
      state.damage+=dmg;
      const left=remainingCores();

      if(state.multiplayer&&!state.isHost){
        sendNet({type:'core-destroyed',coreId:r.id,amount:dmg});
      }else{
        state.boss.hp=Math.max(left>0?1:0,state.boss.hp-dmg);
      }

      state.effects.push({x:r.x,y:r.y,r:20,life:1,color:r.type.color});
      if(left===0){
        state.boss.hp=0;
        winRaid(true);
        return;
      }
    }
  }
}

function updateArea(){
  let safe=0,total=0;
  for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){total++;if(grid[y][x]===1)safe++}
  state.area=total?safe/total*100:0;
}
function playerHit(){
  if(state.gameOver||state.iframeTimer>0)return;
  playerHP--;
  if(playerHP<=0&&deathSaveCharges>0){deathSaveCharges--;playerHP=1}
  state.effects.push({x:player.x,y:player.y,r:10,life:.7,color:'#ff315c'});
  player.x=player.lastSafeX;player.y=player.lastSafeY;
  player.drawing=false;player.line=[];state.iframeTimer=.8;
  if(playerHP<=0){
    playerHP=0;if(state.multiplayer)sendNet({type:'player-dead'});
    state.gameOver=true;setTimeout(()=>openScreen('titleScreen'),1000);
  }
}

