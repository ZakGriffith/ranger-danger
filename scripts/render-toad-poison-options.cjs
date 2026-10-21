const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out', 'toad-poison-options');
globalThis.document = { createElement: () => createCanvas(1, 1) };
const C = { page:'#1d1b27', card:'#302b3b', ground:'#3a3146', text:'#eee9dc', muted:'#bdb6c5', accent:'#d5bd84' };
const SPECS = [
  { key:'a', title:'A · Blight bomb', description:'Cracked dark husk · green smoke', tradeoff:'Strongest poison warning; clearest bomb shape.' },
  { key:'b', title:'B · Spore capsule', description:'Rust plates · dusky spore cloud', tradeoff:'Closest match to the Sporeback’s growths.' },
  { key:'c', title:'C · Venom sac', description:'Luminous membrane · pale venom mist', tradeoff:'Brightest effect; more fluid and organic.' },
];
const T = { release:700, impact:1700, cloudLife:4000, cycle:6400, radius:52, tick:500, targetX:212, feet:230 };

function label(ctx,s,x,y,size=13,color=C.muted,bold=false){ctx.font=`${bold?'bold ':''}${size}px sans-serif`;ctx.fillStyle=color;ctx.fillText(s,x,y);}
function imageAt(ctx,image,x,feet,scale,groundY=56){ctx.drawImage(image,x-image.width*scale/2,feet-groundY*scale,image.width*scale,image.height*scale);}
function groundShadow(ctx,x,y,width,alpha=.25){ctx.fillStyle=`rgba(16,17,21,${alpha})`;ctx.beginPath();ctx.ellipse(x,y,width,width*.14,0,0,Math.PI*2);ctx.fill();}
function autoPosition(age){
  if(age<750)return 286;
  if(age<1100)return 286-(age-750)/350*74;
  if(age<2400)return 212;
  if(age<2750)return 212+(age-2400)/350*74;
  return 286;
}
function stateAt(time){
  const phase=time%T.cycle,age=phase-T.impact,x=autoPosition(age);
  const active=age>=0&&age<T.cloudLife,inside=active&&Math.abs(x-T.targetX)<T.radius;
  const ticks=age<1354?0:age<1854?1:age<2354?2:3;
  return {time:phase,age,x,inside,damage:ticks,flash:inside&&age>=1354&&((age-1354)%500)<130};
}
function drawScene(ctx,assets,style,state,ground=C.ground){
  const {time,age,x}=state;
  ctx.imageSmoothingEnabled=false;ctx.fillStyle=ground;ctx.fillRect(0,0,340,290);
  ctx.fillStyle='#99869d22';for(let i=0;i<19;i++){const px=(i*67+19)%324;const py=237+(i*13)%43;ctx.fillRect(px,py,3,2);}
  const attackTime=time-500;
  const toad=attackTime>=0&&attackTime<1000/3?assets.toadAttack[Math.min(9,Math.floor(attackTime*30/1000))]:assets.toadIdle[Math.floor(time/125)%8];
  groundShadow(ctx,65,T.feet,28);imageAt(ctx,toad,65,T.feet,1.1);
  groundShadow(ctx,x,T.feet,13);imageAt(ctx,assets.player,x,T.feet,1,56);
  if(time>=T.release&&time<T.impact){
    const p=(time-T.release)/(T.impact-T.release),sx=96.9,sy=T.feet-19.8;
    const bx=sx+(T.targetX-sx)*p,by=sy+(T.feet-sy)*p-Math.sin(Math.PI*p)*120;
    groundShadow(ctx,sx+(T.targetX-sx)*p,T.feet,8+3*p,.19);
    for(let i=3;i>=1;i--){const tail=Math.max(0,p-i*.045);const tx=sx+(T.targetX-sx)*tail,ty=sy+(T.feet-sy)*tail-Math.sin(Math.PI*tail)*120;ctx.fillStyle=['#a8bd6b44','#83a16366','#bdd48588'][i-1];ctx.fillRect(Math.round(tx)-i,Math.round(ty)-i,i+1,i+1);}
    const bomb=assets.bombs[style][Math.floor(time/75)%8];ctx.drawImage(bomb,bx-25.6,by-25.6,51.2,51.2);
  }
  if(age>=0&&age<T.cloudLife){const smoke=assets.smoke[style][Math.min(79,Math.floor(age/50))];ctx.drawImage(smoke,T.targetX-64,T.feet-74);}
  if(state.flash){label(ctx,'−1',x-8,T.feet-64,18,'#ebcc8d',true);}
  label(ctx,age<0?'Aimed landing spot':age<T.cloudLife?'Lingering poison':'Smoke cleared',16,25,12);
  if(age>=0&&age<T.cloudLife)label(ctx,`${((T.cloudLife-age)/1000).toFixed(1)}s`,290,25,13,C.accent,true);
  if(time<T.impact){ctx.fillStyle='#b6ae7766';ctx.fillRect(T.targetX-5,T.feet+3,4,1);ctx.fillRect(T.targetX+2,T.feet+3,4,1);}
  label(ctx,state.inside?'IN SMOKE · poison ticking':'OUTSIDE · no damage',16,274,12,state.inside?'#d7de9c':C.muted);
}
function board(assets,time){
  const board=createCanvas(1152,615),ctx=board.getContext('2d');ctx.fillStyle=C.page;ctx.fillRect(0,0,1152,615);
  label(ctx,'SPOREBACK / POISON-BOMB OPTIONS',24,39,27,C.text,true);
  label(ctx,'No impact damage · 4-second smoke · slow poison only while standing inside',24,69,16);
  SPECS.forEach((spec,i)=>{const x=24+i*376;ctx.fillStyle=C.card;ctx.fillRect(x,92,352,485);label(ctx,spec.title,x+14,124,21,C.accent,true);label(ctx,spec.description,x+14,151,13);ctx.save();ctx.translate(x+6,166);drawScene(ctx,assets,spec.key,stateAt(time));ctx.restore();label(ctx,spec.tradeoff,x+13,480,12);ctx.imageSmoothingEnabled=false;ctx.drawImage(assets.bombs[spec.key][Math.floor(time/75)%8],x+14,488,80,80);label(ctx,'Tumbling poison bomb',x+109,530,13);});
  label(ctx,'Proposed tuning: 1 HP every 0.5 seconds · damage stops on exit · overlapping smoke does not multiply damage',24,600,14);
  return board;
}
function html(assets){
  const encode=xs=>xs.map(x=>x.toDataURL());
  const sources={toadIdle:encode(assets.toadIdle),toadAttack:encode(assets.toadAttack),player:assets.player.toDataURL(),bombs:Object.fromEntries(SPECS.map(s=>[s.key,encode(assets.bombs[s.key])])),smoke:Object.fromEntries(SPECS.map(s=>[s.key,encode(assets.smoke[s.key])]))};
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sporeback poison bombs — visual options</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:${C.page};color:${C.text};font:15px system-ui}main{max-width:1184px;margin:auto;padding:26px 24px}h1{margin:0 0 10px;font-size:28px}p{color:${C.muted};line-height:1.5}.controls{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:21px 0}button,select{background:${C.card};color:${C.text};border:1px solid #75677b;border-radius:5px;padding:8px 11px;font:inherit;cursor:pointer}button:focus-visible,select:focus-visible{outline:2px solid ${C.accent};outline-offset:3px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.card{background:${C.card};padding:8px;border-radius:7px;min-width:0}h2{font-size:20px;color:${C.accent};margin:12px 8px}.card p{font-size:13px;margin:9px 8px}.card canvas{width:100%;height:auto;image-rendering:pixelated;display:block}.sample{display:flex;align-items:center;gap:15px;margin:8px}.sample canvas{width:64px;height:64px;flex-shrink:0}.sample span{font-size:12px;color:${C.muted}}.status{display:flex;gap:24px;flex-wrap:wrap;padding:16px;background:${C.card};margin-top:22px;border-radius:7px;font-variant-numeric:tabular-nums}.status strong{color:${C.accent}}.notes{font-size:13px}a{color:${C.accent}}@media(max-width:800px){main{max-width:440px}.grid{grid-template-columns:1fr}}</style></head>
<body><main><h1>Sporeback / poison-bomb options</h1><p>Three ways to turn the glob into an organic poison bomb. Each lands in a puff, hangs in the air, and dissipates. Compare the look before choosing one for the game.</p>
<div class="controls"><button id="pause" aria-pressed="false">Pause</button><button id="restart">Replay throw</button><button id="enter">Walk into smoke</button><button id="leave">Walk out</button><button id="auto">Auto demo</button><label>Speed <select id="speed"><option value="1">Normal</option><option value="0.5">½ speed</option></select></label><label>Ground <select id="ground"><option value="${C.ground}">Infected purple</option><option value="#394530">Moss</option><option value="#746c78">Light contrast</option></select></label></div>
<section class="grid">${SPECS.map(s=>`<article class="card"><h2>${s.title}</h2><p>${s.description}</p><canvas width="340" height="290" data-style="${s.key}" aria-label="${s.title} landing and lingering smoke comparison"></canvas><div class="sample"><canvas width="64" height="64" data-bomb="${s.key}" aria-label="${s.title} enlarged projectile"></canvas><span>${s.tradeoff}</span></div></article>`).join('')}</section>
<div class="status" aria-live="polite"><span id="phase">Loading pixel art…</span><span>Impact damage: <strong>0</strong></span><span>Poison damage taken: <strong id="damage">0 HP</strong></span></div>
<p class="notes"><strong>Proposed behavior:</strong> lands at the aimed spot, with no direct hit damage. Smoke lasts 4 seconds within a 26-pixel radius and deals 1 HP every half-second spent inside. Leaving stops the damage; overlapping clouds share the same damage tick. These are preview settings, ready to adjust.</p>
<p class="notes">Choose A, B, or C for the look. <a href="toad-poison-options.png">Still comparison</a> · <a href="toad-poison-options.gif">Animated comparison</a>. This is a standalone prototype; the game’s projectile has not been changed yet.</p></main>
<script>const C=${JSON.stringify(C)},T=${JSON.stringify(T)},SPECS=${JSON.stringify(SPECS)},sources=${JSON.stringify(sources)};
${label.toString()}
${imageAt.toString()}
${groundShadow.toString()}
${autoPosition.toString()}
${drawScene.toString()}
const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
async function start(){const assets={toadIdle:await Promise.all(sources.toadIdle.map(load)),toadAttack:await Promise.all(sources.toadAttack.map(load)),player:await load(sources.player),bombs:{},smoke:{}};for(const s of SPECS){assets.bombs[s.key]=await Promise.all(sources.bombs[s.key].map(load));assets.smoke[s.key]=await Promise.all(sources.smoke[s.key].map(load));}
let time=0,last,paused=false,rate=1,ground=C.ground,manual=null,x=286,damage=0,exposure=0,flashUntil=0;
const reset=()=>{time=0;x=manual===true?212:286;damage=0;exposure=0;flashUntil=0;};
const pause=document.querySelector('#pause');pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Play':'Pause';pause.setAttribute('aria-pressed',String(paused));};document.querySelector('#restart').onclick=reset;document.querySelector('#enter').onclick=()=>manual=true;document.querySelector('#leave').onclick=()=>manual=false;document.querySelector('#auto').onclick=()=>{manual=null;reset();};document.querySelector('#speed').onchange=e=>rate=Number(e.target.value);document.querySelector('#ground').onchange=e=>ground=e.target.value;
const canvases=[...document.querySelectorAll('[data-style]')],bombCanvases=[...document.querySelectorAll('[data-bomb]')];
function tick(now){const dt=last===undefined||paused?0:Math.min(50,now-last)*rate;last=now;time+=dt;if(time>=T.cycle)reset();const age=time-T.impact;const target=manual===null?autoPosition(age):manual?212:286;const travel=dt*.25;x+=Math.max(-travel,Math.min(travel,target-x));const inside=age>=0&&age<T.cloudLife&&Math.abs(x-T.targetX)<T.radius;if(inside){exposure+=dt;if(exposure>=T.tick){damage++;exposure-=T.tick;flashUntil=time+160;}}else exposure=0;const state={time,age,x,inside,damage,flash:inside&&time<flashUntil};for(const canvas of canvases)drawScene(canvas.getContext('2d'),assets,canvas.dataset.style,state,ground);for(const canvas of bombCanvases){const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,64,64);ctx.drawImage(assets.bombs[canvas.dataset.bomb][Math.floor(time/75)%8],0,0,64,64);}document.querySelector('#damage').textContent=damage+' HP';document.querySelector('#phase').textContent=time<T.release?'Preparing throw':time<T.impact?'Airborne · no damage':age<T.cloudLife?(inside?'Inside smoke · poison ticking':'Outside smoke · safe'):'Smoke cleared · safe';requestAnimationFrame(tick);}requestAnimationFrame(tick);}
start().catch(error=>{document.querySelector('#phase').textContent='Preview failed: '+error.message;console.error(error);});</script></body></html>`;
}
async function main(){
  const {runnerImport}=await import('vite');const config={root:ROOT,logLevel:'error',plugins:[{name:'phaser-stub',resolveId:id=>id==='phaser'?'\0phaser-stub':null,load:id=>id==='\0phaser-stub'?'export default {};':null}]};const load=async file=>(await runnerImport(file,config)).module;
  const hd=await load('/src/assets/art/hd.ts'),toad=await load('/src/assets/art/toad.ts'),player=await load('/src/assets/art/player.ts'),bombs=await load('/scripts/sprite-tries/toad-poison-bombs.ts'),smoke=await load('/scripts/sprite-tries/toad-poison-smoke.ts');
  const assets={toadIdle:toad.TOAD_IDLE_FRAMES.map(f=>hd.makeHD(64,toad.drawToad(f),{outline:false})),toadAttack:toad.TOAD_ATTACK_FRAMES.map(f=>hd.makeHD(64,toad.drawToad(f),{outline:false})),player:hd.makeHD(64,player.drawPlayer('idle0','level')),bombs:{},smoke:{}};
  fs.mkdirSync(OUT,{recursive:true});
  for(const s of SPECS){assets.bombs[s.key]=Array.from({length:8},(_,i)=>hd.makeHD(32,bombs.drawPoisonBomb(s.key,i),{outline:false}));assets.smoke[s.key]=Array.from({length:80},(_,i)=>hd.makeHD(128,smoke.drawPoisonSmoke(s.key,i*50),{outline:false}));}
  fs.writeFileSync(path.join(OUT,'toad-poison-options.html'),html(assets));fs.writeFileSync(path.join(OUT,'toad-poison-options.png'),board(assets,3200).toBuffer('image/png'));
  if(process.argv.includes('--gif')){const framesPath=path.join(OUT,'frames');fs.mkdirSync(framesPath,{recursive:true});for(let i=0;i<128;i++)fs.writeFileSync(path.join(framesPath,String(i).padStart(3,'0')+'.png'),board(assets,i*50).toBuffer('image/png'));const python=process.env.TOAD_PREVIEW_PYTHON||'python';const result=spawnSync(python,['-c','from PIL import Image\nfrom pathlib import Path\nimport sys\np=Path(sys.argv[1]); frames=[Image.open(f).convert("RGB") for f in sorted((p/"frames").glob("*.png"))]\nframes[0].save(p/"toad-poison-options.gif",save_all=True,append_images=frames[1:],duration=50,loop=0,optimize=True)',OUT],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr||String(result.error));}
  console.log(path.join(OUT,'toad-poison-options.html'));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
