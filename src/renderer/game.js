const DATA = window.RAID_DATA;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const keys = {};

const state = {
  mode: 'menu',
  bossId: DATA.bosses[0].id,
  boss: null,
  projectiles: [],
  effects: [],
  relics: [],
  area: 0,
  relicCount: 0,
  damage: 0,
  gameOver: false,
  victory: false,
  skillCooldown: 0,
  buffTimer: 0,
  iframeTimer: 0,
  inventory: load('raidqix.inventory', ['runner-coil','spare-heart','cold-clock']),
  equippedSkill: load('raidqix.skill', 'phase-dash'),
  equippedCharms: load('raidqix.charms', ['runner-coil','spare-heart']),
  settings: load('raidqix.settings', { volume:80, screenShake:true, pixelMode:true }),
  multiplayer: false,
  isHost: false,
  members: []
};

const world = {x:0,y:0,w:0,h:0};
const GRID = 6;
let cols=0, rows=0, grid=[];

const player={x:0,y:0,r:7,baseSpeed:180,drawing:false,line:[],lastSafeX:0,lastSafeY:0,dx:0,dy:0};
let playerHP=3, playerMaxHP=3, deathSaveCharges=0;

function load(key, fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
function save(key, value){localStorage.setItem(key,JSON.stringify(value))}
function bossDef(){return DATA.bosses.find(b=>b.id===state.bossId) || DATA.bosses[0]}
function skillDef(){return DATA.skills.find(s=>s.id===state.equippedSkill) || DATA.skills[0]}
function charmDefs(){return state.equippedCharms.map(id=>DATA.charms.find(c=>c.id===id)).filter(Boolean)}

function modifiers(){
  const m={moveSpeedMultiplier:1,drawingSpeedMultiplier:1,maxHpAdd:0,cooldownMultiplier:1,relicDamageMultiplier:1,deathSaveCharges:0};
  for(const charm of charmDefs()) for(const [k,v] of Object.entries(charm.modifiers||{})) {
    if(k.endsWith('Multiplier')) m[k]*=v; else m[k]+=v;
  }
  return m;
}

function resize(){
  canvas.width=innerWidth; canvas.height=innerHeight;
  world.x=innerWidth*.08; world.y=innerHeight*.10; world.w=innerWidth*.84; world.h=innerHeight*.78;
  buildGrid();
}
addEventListener('resize',resize);

function buildGrid(){
  cols=Math.floor(world.w/GRID)+1; rows=Math.floor(world.h/GRID)+1; grid=[];
  for(let y=0;y<rows;y++){grid[y]=[];for(let x=0;x<cols;x++)grid[y][x]=(x===0||y===0||x===cols-1||y===rows-1)?1:0}
}
function worldToGrid(x,y){return{x:Math.round((x-world.x)/GRID),y:Math.round((y-world.y)/GRID)}}
function insideGrid(x,y){return x>=0&&y>=0&&x<cols&&y<rows}
function isSafeWorld(x,y){const p=worldToGrid(x,y);return !insideGrid(p.x,p.y)||grid[p.y][p.x]===1}

function resetPlayer(){
  const mod=modifiers(); player.x=world.x+world.w*.5; player.y=world.y+world.h-5; player.lastSafeX=player.x; player.lastSafeY=player.y; player.drawing=false; player.line=[];
  playerMaxHP=3+mod.maxHpAdd; playerHP=playerMaxHP; deathSaveCharges=mod.deathSaveCharges; state.skillCooldown=0;state.buffTimer=0;state.iframeTimer=0;
}
function resetBoss(){
  const d=bossDef(); state.boss={x:world.x+world.w*.5,y:world.y+world.h*.42,r:d.number===3?40:34,hp:d.hp,maxHp:d.hp,angle:0,attackTimer:d.number===2?1.5:1};
}

const relicTypes=[
{name:'ORB',color:'#55e8ff',damage:70},{name:'CROWN',color:'#ffe066',damage:120},{name:'CORE',color:'#ff64d5',damage:200},{name:'SHARD',color:'#9e8cff',damage:50},{name:'SUN',color:'#ff934d',damage:150},{name:'VOID',color:'#69ff8d',damage:90},{name:'STAR',color:'#fff',damage:180},{name:'REACTOR',color:'#ff527c',damage:250}
];
function spawnRelics(){
 state.relics=[]; for(const type of relicTypes){let x,y;do{x=world.x+40+Math.random()*(world.w-80);y=world.y+40+Math.random()*(world.h-80)}while(Math.hypot(x-state.boss.x,y-state.boss.y)<100);state.relics.push({x,y,r:8,type,taken:false,phase:Math.random()*Math.PI*2})}
}

function resetGame(){
  state.projectiles=[];state.effects=[];state.area=0;state.relicCount=0;state.damage=0;state.gameOver=false;state.victory=false;buildGrid();resetPlayer();resetBoss();spawnRelics();updateHud();
}

addEventListener('keydown',e=>{
 keys[e.key.toLowerCase()]=true;
 if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault();
 if(e.key.toLowerCase()==='e') useSkill();
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

function currentSpeed(){const mod=modifiers();return player.baseSpeed*mod.moveSpeedMultiplier*(player.drawing?mod.drawingSpeedMultiplier:1)*(state.buffTimer>0?1.45:1)}
function movePlayer(dt){
 let dx=0,dy=0;if(keys.w||keys.arrowup)dy--;if(keys.s||keys.arrowdown)dy++;if(keys.a||keys.arrowleft)dx--;if(keys.d||keys.arrowright)dx++;
 if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l} player.dx=dx;player.dy=dy;
 const oldX=player.x,oldY=player.y,s=currentSpeed();player.x+=dx*s*dt;player.y+=dy*s*dt;player.x=Math.max(world.x,Math.min(world.x+world.w,player.x));player.y=Math.max(world.y,Math.min(world.y+world.h,player.y));
 const safe=isSafeWorld(player.x,player.y);if(safe){player.lastSafeX=player.x;player.lastSafeY=player.y}
 if(!player.drawing&&!safe){player.drawing=true;player.line=[{x:oldX,y:oldY},{x:player.x,y:player.y}]}
 if(player.drawing){const last=player.line[player.line.length-1];if(Math.hypot(player.x-last.x,player.y-last.y)>3)player.line.push({x:player.x,y:player.y});if(safe&&player.line.length>4)finishLine()}
 if(state.multiplayer) window.raidAPI?.send({type:'player-state',x:player.x,y:player.y,drawing:player.drawing}).catch(()=>{});
}

function useSkill(){
 if(state.mode!=='raid'||state.gameOver||state.skillCooldown>0)return;const s=skillDef();const mod=modifiers();
 if(s.type==='dash'){let dx=player.dx,dy=player.dy;if(!dx&&!dy)dy=-1;player.x=Math.max(world.x,Math.min(world.x+world.w,player.x+dx*90));player.y=Math.max(world.y,Math.min(world.y+world.h,player.y+dy*90));state.iframeTimer=.6}
 if(s.type==='heal')playerHP=Math.min(playerMaxHP,playerHP+1);
 if(s.type==='speed')state.buffTimer=5;
 state.skillCooldown=s.cooldown*mod.cooldownMultiplier;
 state.effects.push({x:player.x,y:player.y,r:14,life:.8,color:'#69ff8d'});
}

function finishLine(){if(!player.drawing)return;player.line.push({x:player.x,y:player.y});captureArea();player.drawing=false;player.line=[]}
function captureArea(){
 for(let i=1;i<player.line.length;i++){const a=worldToGrid(player.line[i-1].x,player.line[i-1].y),b=worldToGrid(player.line[i].x,player.line[i].y),steps=Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y),1);for(let s=0;s<=steps;s++){const t=s/steps,gx=Math.round(a.x+(b.x-a.x)*t),gy=Math.round(a.y+(b.y-a.y)*t);if(insideGrid(gx,gy))grid[gy][gx]=1}}
 const start=worldToGrid(state.boss.x,state.boss.y),visited=new Uint8Array(cols*rows),q=[];if(insideGrid(start.x,start.y)){q.push([start.x,start.y]);visited[start.y*cols+start.x]=1}let h=0;while(h<q.length){const[x,y]=q[h++];for(const[dX,dY]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dX,ny=y+dY;if(!insideGrid(nx,ny))continue;const idx=ny*cols+nx;if(visited[idx]||grid[ny][nx]!==0)continue;visited[idx]=1;q.push([nx,ny])}}
 for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++)if(grid[y][x]===0&&!visited[y*cols+x])grid[y][x]=1;
 collectRelics();updateArea();state.effects.push({x:player.x,y:player.y,r:15,life:.8,color:'#55e8ff'});
}
function collectRelics(){
 const mod=modifiers();for(const r of state.relics){if(r.taken)continue;if(isSafeWorld(r.x,r.y)){r.taken=true;state.relicCount++;const dmg=Math.round(r.type.damage*mod.relicDamageMultiplier);state.boss.hp-=dmg;state.damage+=dmg;state.effects.push({x:r.x,y:r.y,r:18,life:1,color:r.type.color});if(state.boss.hp<=0){state.boss.hp=0;winRaid();return}}}
}
function updateArea(){let safe=0,total=0;for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){total++;if(grid[y][x]===1)safe++}state.area=total?safe/total*100:0}
function playerHit(){if(state.gameOver||state.iframeTimer>0)return;playerHP--;if(playerHP<=0&&deathSaveCharges>0){deathSaveCharges--;playerHP=1}state.effects.push({x:player.x,y:player.y,r:10,life:.7,color:'#ff315c'});player.x=player.lastSafeX;player.y=player.lastSafeY;player.drawing=false;player.line=[];state.iframeTimer=.8;if(playerHP<=0){playerHP=0;state.gameOver=true;setTimeout(()=>openScreen('titleScreen'),1000)}}

function spawnBullet(angle,speed,size,opts={}){state.projectiles.push({x:state.boss.x,y:state.boss.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:size,ricochet:!!opts.ricochet,bounces:0,maxBounces:opts.maxBounces||5,life:opts.life??12,color:opts.color||'#ff587a'})}
function radialBurst(count,speed=70){for(let i=0;i<count;i++)spawnBullet(state.boss.angle+i*Math.PI*2/count,speed,6)}
function aimedBurst(count=5,spread=.12,speed=95){const a=Math.atan2(player.y-state.boss.y,player.x-state.boss.x);for(let i=-(count-1)/2;i<=(count-1)/2;i++)spawnBullet(a+i*spread,speed,5)}
function bossAttack(dt){
 const b=state.boss,d=bossDef();b.angle+=dt*(d.attack==='ricochet'?.25:.45);b.attackTimer-=dt;if(b.attackTimer>0)return;
 if(d.attack==='void'){b.attackTimer=b.hp<b.maxHp*.5?.6:1.05;Math.random()<.6?radialBurst(b.hp<b.maxHp*.5?20:12):aimedBurst()}
 else if(d.attack==='ricochet'){b.attackTimer=2.5;for(let i=0;i<5;i++)spawnBullet(b.angle+i*Math.PI*2/5,105,10,{ricochet:true,maxBounces:5,color:'#ff934d'})}
 else {b.attackTimer=b.hp<b.maxHp*.5?.75:1.2;radialBurst(8,92);aimedBurst(3,.2,120);for(let i=0;i<4;i++)spawnBullet(b.angle+i*Math.PI/2,145,7,{life:5,color:'#b77cff'})}
 if(player.drawing)for(const p of player.line)if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+4){playerHit();break}
}
function updateProjectiles(dt){
 for(let i=state.projectiles.length-1;i>=0;i--){const p=state.projectiles[i];p.life-=dt;if(p.life<=0){state.projectiles.splice(i,1);continue}const nx=p.x+p.vx*dt,ny=p.y+p.vy*dt;if(p.ricochet){let bounced=false;if(nx-p.r<=world.x||nx+p.r>=world.x+world.w){p.vx*=-1;bounced=true}if(ny-p.r<=world.y||ny+p.r>=world.y+world.h){p.vy*=-1;bounced=true}if(isSafeWorld(nx,ny)){p.vx*=-1;p.vy*=-1;bounced=true}p.x+=p.vx*dt;p.y+=p.vy*dt;if(bounced&&++p.bounces>=p.maxBounces){state.projectiles.splice(i,1);continue}}else{p.x=nx;p.y=ny;if(isSafeWorld(p.x,p.y)||p.x<world.x-120||p.x>world.x+world.w+120||p.y<world.y-120||p.y>world.y+world.h+120){state.projectiles.splice(i,1);continue}}
 if(Math.hypot(p.x-player.x,p.y-player.y)<p.r+player.r){playerHit();state.projectiles.splice(i,1);continue}if(player.drawing){let hit=false;for(const pt of player.line)if(Math.hypot(p.x-pt.x,p.y-pt.y)<p.r+3){hit=true;break}if(hit){playerHit();state.projectiles.splice(i,1)}}}
}

function winRaid(){state.victory=true;state.gameOver=true;const charm=rollCharm();state.inventory.push(charm.id);save('raidqix.inventory',state.inventory);document.getElementById('rewardName').textContent=charm.name;document.getElementById('rewardDesc').textContent=`${charm.rarity} · ${charm.description}`;setTimeout(()=>openScreen('rewardScreen'),500)}
function rollCharm(){return DATA.charms[Math.floor(Math.random()*DATA.charms.length)]}

function updateEffects(dt){for(let i=state.effects.length-1;i>=0;i--){const e=state.effects[i];e.life-=dt;e.r+=30*dt;if(e.life<=0)state.effects.splice(i,1)}}
function updateTimers(dt){state.skillCooldown=Math.max(0,state.skillCooldown-dt);state.buffTimer=Math.max(0,state.buffTimer-dt);state.iframeTimer=Math.max(0,state.iframeTimer-dt)}

function draw(){
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#05070c';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#101722';ctx.fillRect(world.x,world.y,world.w,world.h);
 const d=bossDef();for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(grid[y][x]===1){ctx.fillStyle=d.territory;ctx.fillRect(world.x+x*GRID,world.y+y*GRID,GRID+1,GRID+1)}ctx.strokeStyle=d.accent;ctx.lineWidth=2;ctx.strokeRect(world.x,world.y,world.w,world.h);
 for(const r of state.relics){if(r.taken)continue;ctx.fillStyle=r.type.color;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.fill()}
 for(const p of state.projectiles){ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}
 if(state.boss){ctx.save();ctx.translate(state.boss.x,state.boss.y);ctx.rotate(state.boss.angle*.2);ctx.strokeStyle=d.accent;ctx.fillStyle='#17101b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,state.boss.r,0,Math.PI*2);ctx.fill();ctx.stroke();if(d.attack==='seraph'){ctx.strokeStyle='#b77cff';for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(state.boss.r*.4,0);ctx.lineTo(state.boss.r*1.5,0);ctx.stroke()}}ctx.restore()}
 if(player.drawing&&player.line.length>1){ctx.strokeStyle='#5deaff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(player.line[0].x,player.line[0].y);for(let i=1;i<player.line.length;i++)ctx.lineTo(player.line[i].x,player.line[i].y);ctx.stroke()}
 ctx.globalAlpha=state.iframeTimer>0?.45:1;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 for(const e of state.effects){ctx.globalAlpha=Math.max(0,e.life);ctx.strokeStyle=e.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
}

function updateHud(){
 const d=bossDef();document.getElementById('bossName').textContent=state.mode==='raid'?`${d.name} — BOSS ${d.number}`:'NO BOSS';document.getElementById('bossSubtitle').textContent=state.mode==='raid'?d.subtitle:'SELECT RAID';document.getElementById('bossHp').style.width=state.boss?`${Math.max(0,state.boss.hp/state.boss.maxHp*100)}%`:'0%';document.getElementById('bossHp').style.background=d.accent;document.getElementById('area').textContent=Math.floor(state.area);document.getElementById('relics').textContent=state.relicCount;document.getElementById('damage').textContent=state.damage;document.getElementById('hp').textContent=`${playerHP}/${playerMaxHP}`;
 const s=skillDef();const skillHud=document.getElementById('skillHud');skillHud.textContent=state.skillCooldown>0?`${s.name} ${state.skillCooldown.toFixed(1)}s`:`${s.name} [E]`;skillHud.className=state.skillCooldown>0?'skillCooldown':'skillReady';const cds=charmDefs();document.getElementById('charmAHud').textContent=cds[0]?.name||'-';document.getElementById('charmBHud').textContent=cds[1]?.name||'-';
}

function openScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id)?.classList.add('active');if(id!=='rewardScreen'&&id!=='settingsScreen'&&id!=='loadoutScreen'&&id!=='lobbyScreen'&&id!=='soloScreen')state.mode='menu';if(id==='loadoutScreen')renderLoadout();if(id==='lobbyScreen')refreshSteam()}
document.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>openScreen(el.dataset.open));

function renderBossCards(targetId){const target=document.getElementById(targetId);target.innerHTML='';for(const b of DATA.bosses){const el=document.createElement('button');el.className='card'+(state.bossId===b.id?' selected':'');el.innerHTML=`<strong>BOSS ${b.number} · ${b.name}</strong><small>${b.description}</small>`;el.onclick=()=>{state.bossId=b.id;renderBossCards(targetId)};target.appendChild(el)}}
renderBossCards('soloBossGrid');renderBossCards('lobbyBossGrid');

document.getElementById('soloStart').onclick=()=>startRaid(false);
function startRaid(multiplayer){state.multiplayer=multiplayer;state.mode='raid';document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));resetGame();if(multiplayer)window.raidAPI?.send({type:'raid-start',bossId:state.bossId}).catch(()=>{})}

function renderLoadout(){
 const sg=document.getElementById('skillGrid');sg.innerHTML='';for(const s of DATA.skills){const el=document.createElement('button');el.className='card'+(state.equippedSkill===s.id?' selected':'');el.innerHTML=`<strong>${s.name}</strong><small>${s.description}<br>CD ${s.cooldown}s</small>`;el.onclick=()=>{state.equippedSkill=s.id;save('raidqix.skill',s.id);renderLoadout()};sg.appendChild(el)}
 const cg=document.getElementById('charmGrid');cg.innerHTML='';for(const c of DATA.charms.filter(c=>state.inventory.includes(c.id))){const el=document.createElement('button');el.className='card'+(state.equippedCharms.includes(c.id)?' selected':'');el.innerHTML=`<strong>${c.name}</strong><small>${c.rarity} · ${c.description}</small>`;el.onclick=()=>toggleCharm(c.id);cg.appendChild(el)}document.getElementById('inventoryText').textContent=`OWNED CHARMS: ${state.inventory.length} · DUPLICATES ARE KEPT FOR FUTURE SYSTEMS`;
}
function toggleCharm(id){const arr=[...state.equippedCharms];const idx=arr.indexOf(id);if(idx>=0)arr.splice(idx,1);else if(arr.length<2)arr.push(id);else arr[1]=id;state.equippedCharms=arr;save('raidqix.charms',arr);renderLoadout();updateHud()}

const volume=document.getElementById('volume');volume.value=state.settings.volume;document.getElementById('screenShake').checked=state.settings.screenShake;document.getElementById('pixelMode').checked=state.settings.pixelMode;document.getElementById('volLabel').textContent=volume.value;volume.oninput=()=>{state.settings.volume=+volume.value;document.getElementById('volLabel').textContent=volume.value;save('raidqix.settings',state.settings)};document.getElementById('screenShake').onchange=e=>{state.settings.screenShake=e.target.checked;save('raidqix.settings',state.settings)};document.getElementById('pixelMode').onchange=e=>{state.settings.pixelMode=e.target.checked;save('raidqix.settings',state.settings)};

document.getElementById('rewardContinue').onclick=()=>{renderLoadout();openScreen('titleScreen')};

async function refreshSteam(){if(!window.raidAPI){document.getElementById('steamStatus').textContent='Electron bridge unavailable';return}const s=await window.raidAPI.getSteamState();state.members=s.members||[];document.getElementById('steamStatus').textContent=s.enabled?`STEAM ONLINE${s.lobbyId?' · '+s.lobbyId:''}`:'OFFLINE FALLBACK';renderMembers()}
function renderMembers(){const el=document.getElementById('members');el.innerHTML=state.members.length?state.members.map(m=>`<div class="member">${m.host?'HOST · ':''}${m.name}</div>`).join(''):'<div class="muted">No lobby members</div>'}
document.getElementById('createLobby').onclick=async()=>{const s=await window.raidAPI.createLobby({maxMembers:4});state.isHost=true;state.members=s.members||[];renderMembers();refreshSteam()};document.getElementById('joinLobby').onclick=async()=>{const id=document.getElementById('lobbyIdInput').value.trim();if(!id)return;const s=await window.raidAPI.joinLobby(id);state.isHost=false;state.members=s.members||[];renderMembers();refreshSteam()};document.getElementById('leaveLobby').onclick=async()=>{await window.raidAPI.leaveLobby();state.members=[];state.isHost=false;renderMembers();refreshSteam()};document.getElementById('lobbyStart').onclick=()=>startRaid(true);
window.raidAPI?.onMessage(msg=>{if(msg.type==='raid-start'&&!state.isHost){state.bossId=msg.bossId;startRaid(true)}});

let last=performance.now();function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(state.mode==='raid'&&!state.gameOver){movePlayer(dt);bossAttack(dt);updateProjectiles(dt);updateEffects(dt);updateTimers(dt)}draw();updateHud();requestAnimationFrame(loop)}
resize();resetBoss();resetPlayer();requestAnimationFrame(loop);
