const DATA = window.RAID_DATA;
const canvas = document.getElementById('game');
const displayCtx = canvas.getContext('2d', { alpha:false });
const sceneCanvas = document.createElement('canvas');
const sceneCtx = sceneCanvas.getContext('2d', { alpha:false });
const pixelCanvas = document.createElement('canvas');
const pixelCtx = pixelCanvas.getContext('2d', { alpha:false });

const LOGICAL_W = 1440;
const LOGICAL_H = 810;
const PIXEL_W = 480;
const PIXEL_H = 270;
const GRID = 6;

sceneCanvas.width = LOGICAL_W;
sceneCanvas.height = LOGICAL_H;
pixelCanvas.width = PIXEL_W;
pixelCanvas.height = PIXEL_H;
sceneCtx.imageSmoothingEnabled = false;
pixelCtx.imageSmoothingEnabled = false;
displayCtx.imageSmoothingEnabled = false;

const world = { x:60, y:70, w:1320, h:670 };
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
  gravityWaveLife:0,
  telegraphs:[],lineTelegraphs:[],coneTelegraphs:[],donutTelegraphs:[],chaseTelegraphs:[],sweepLasers:[],
  sweepLaserSeq:0,telegraphSeq:0,attackSeq:0,
  randomRun:{active:false,floor:0,config:null,def:null,best:Number(localStorage.getItem('raidqix.randomBest')||0)},
  randomGimmickTimer:1.2,randomAreaStreak:0,randomLastCategory:null,
  bossSpinSpeed:.075,bossMoveSpeed:9,bossMoveAngle:0,
  soundcloudPlaylist:load('raidqix.soundcloudPlaylist',[]),
  bgmVolume:Number(load('raidqix.bgmVolume',70)),seVolume:Number(load('raidqix.seVolume',80)),
  music:{url:null,bpm:120,widget:null,ready:false,preparedTrack:null,preparedUrl:null,positionMs:0},
  rewardQueue:[],rewardRevealIndex:0,selectedInventoryCharm:null,fusionCharmUids:[null,null,null,null,null],
  titleMode:'boss',screen:'title',
  boss5CastTimer:1.4,boss6CastTimer:1.8,boss6Gap:0,boss6Phase:0,
  v08Timers:{},triangleTimer:2.8,randomPhase:0,randomGravityStrength:0
};

const player = {
  x:0,y:0,r:7,baseSpeed:180,drawing:false,line:[],
  lastSafeX:0,lastSafeY:0,dx:0,dy:0
};
const PLAYER_HIT_RADIUS=4.5;
let playerHP=3, playerMaxHP=3, deathSaveCharges=0;

function load(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch{return d}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function bossDef(){return state.randomRun?.active&&state.randomRun.def?state.randomRun.def:(DATA.bosses.find(b=>b.id===state.bossId)||DATA.bosses[0])}
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
function updateHud(){}

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
  const len=Math.hypot(dx,dy);if(len){dx/=len;dy/=len}
  player.dx=dx;player.dy=dy;
  const ox=player.x,oy=player.y,speed=currentSpeed();
  player.x+=dx*speed*dt;player.y+=dy*speed*dt;
  player.x=Math.max(world.x,Math.min(world.x+world.w,player.x));
  player.y=Math.max(world.y,Math.min(world.y+world.h,player.y));
  const safe=isSafeWorld(player.x,player.y);
  if(safe){player.lastSafeX=player.x;player.lastSafeY=player.y}
  if(!player.drawing&&!safe){player.drawing=true;player.line=[{x:ox,y:oy},{x:player.x,y:player.y}]}
  if(player.drawing){
    const last=player.line[player.line.length-1];
    if(Math.hypot(player.x-last.x,player.y-last.y)>3)player.line.push({x:player.x,y:player.y});
    if(safe&&player.line.length>4)finishLine();
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
    state.gameOver=true;setTimeout(()=>{state.mode='menu';UI?.show('title');MusicSystem?.stop()},1000);
  }
}



const CHARM_AFFIXES=[
  {key:'SPD',label:'Move Speed',unit:'%',apply:(m,v)=>m.moveSpeedMultiplier*=1+v*.02},
  {key:'HP',label:'Max HP',unit:'',apply:(m,v)=>m.maxHpAdd+=Math.max(1,Math.ceil(v/2))},
  {key:'CDR',label:'Skill Cooldown',unit:'%',apply:(m,v)=>m.cooldownMultiplier*=Math.max(.55,1-v*.03)},
  {key:'DRAW',label:'Draw Speed',unit:'%',apply:(m,v)=>m.drawingSpeedMultiplier*=1+v*.025},
  {key:'CORE',label:'Core Damage',unit:'%',apply:(m,v)=>m.relicDamageMultiplier*=1+v*.04},
  {key:'SAVE',label:'Death Save',unit:'',apply:(m,v)=>m.deathSaveCharges+=v>=4?1:0},
  {key:'DASH',label:'Dash Power',unit:'%',apply:(m,v)=>{}},
  {key:'LUCK',label:'Loot Luck',unit:'',apply:(m,v)=>{}},
  {key:'ARM',label:'Impact Guard',unit:'',apply:(m,v)=>{}},
  {key:'ARC',label:'Arc Control',unit:'',apply:(m,v)=>{}}
];
const CHARM_RARITY_LABEL={1:'COMMON',2:'UNCOMMON',3:'RARE',4:'EPIC',5:'LEGENDARY'};
const CHARM_RARITY_COLOR={1:'#a7b0bd',2:'#4bdf7a',3:'#4aa4ff',4:'#c06cff',5:'#ffbf46'};
function proceduralCharmId(){return 'pc_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}function proceduralCharmName(affixes){
  const first=affixes[0]?.key||'VOID';
  const suffix=['COIL','RELIC','SIGIL','NODE','SHARD','DRIVE','GLYPH'][Math.floor(Math.random()*7)];
  return `${first} ${suffix}`;
}function rollProceduralCharm(rarity=1){
  rarity=Math.max(1,Math.min(5,rarity|0));
  const affixes=[];
  for(let i=0;i<rarity;i++){
    const def=CHARM_AFFIXES[Math.floor(Math.random()*CHARM_AFFIXES.length)];
    affixes.push({key:def.key,value:1+Math.floor(Math.random()*5)});
  }
  return {uid:proceduralCharmId(),name:proceduralCharmName(affixes),rarity,affixes};
}function normalizeCharm(item){
  if(item&&typeof item==='object'&&item.uid&&Array.isArray(item.affixes))return item;
  const legacy=DATA.charms.find(c=>c.id===item);
  if(legacy){
    let key='SPD';
    if(legacy.modifiers?.maxHpAdd)key='HP';
    else if(legacy.modifiers?.cooldownMultiplier)key='CDR';
    else if(legacy.modifiers?.drawingSpeedMultiplier)key='DRAW';
    else if(legacy.modifiers?.relicDamageMultiplier)key='CORE';
    else if(legacy.modifiers?.deathSaveCharges)key='SAVE';
    return {uid:proceduralCharmId(),name:legacy.name,rarity:1,affixes:[{key,value:1}]};
  }
  return null;
}function migrateInventory(){
  let changed=false;
  state.inventory=state.inventory.map(x=>{const n=normalizeCharm(x);if(n!==x)changed=true;return n}).filter(Boolean);
  state.equippedCharms=state.equippedCharms.map(id=>{
    if(typeof id==='object')return id.uid;
    const match=state.inventory.find(x=>x.name===DATA.charms.find(c=>c.id===id)?.name);
    return match?.uid||id;
  }).filter(Boolean).slice(0,2);
  if(changed){
    save('raidqix.inventory',state.inventory);
    save('raidqix.charms',state.equippedCharms);
  }
}function proceduralCharmByUid(uid){return state.inventory.find(c=>c.uid===uid)}function charmAffixText(charm){
  return charm.affixes.map(a=>{
    const d=CHARM_AFFIXES.find(x=>x.key===a.key);
    return `${a.key}+${a.value}${d?.unit||''}`;
  }).join(' · ');
}function charmDetailHtml(charm){
  return `<strong>${charm.name}</strong>
    <small style="color:${CHARM_RARITY_COLOR[charm.rarity]}">${CHARM_RARITY_LABEL[charm.rarity]} · ${charm.rarity} EFFECT${charm.rarity>1?'S':''}</small>
    <div style="margin-top:14px;line-height:1.8">${charm.affixes.map(a=>{
      const d=CHARM_AFFIXES.find(x=>x.key===a.key);
      return `<div><b>${a.key}+${a.value}</b> · ${d?.label||a.key}</div>`;
    }).join('')}</div>`;
}

function charmDefs(){ return state.equippedCharms.map(proceduralCharmByUid).filter(Boolean); }
function modifiers(){
  const m={moveSpeedMultiplier:1,drawingSpeedMultiplier:1,maxHpAdd:0,cooldownMultiplier:1,relicDamageMultiplier:1,deathSaveCharges:0};
  for(const uid of state.equippedCharms){
    const charm=proceduralCharmByUid(uid); if(!charm) continue;
    for(const a of charm.affixes){ const d=CHARM_AFFIXES.find(x=>x.key===a.key); d?.apply(m,a.value); }
  }
  return m;
}

migrateInventory();
