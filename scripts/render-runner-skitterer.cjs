const {createCanvas} = require('canvas');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname,'..');
const OUT = path.join(__dirname,'out','runner-skitterer');
globalThis.document = {createElement:()=>createCanvas(1,1)};
async function main(){
  const {runnerImport}=await import('vite');
  const config={root:ROOT,logLevel:'error',plugins:[{name:'phaser-stub',resolveId:id=>id==='phaser'?'\0phaser-stub':null,load:id=>id==='\0phaser-stub'?'export default {};':null}]};
  const load=async file=>(await runnerImport(file,config)).module;
  const {makeHD}=await load('/src/assets/art/hd.ts');
  const art=await load('/scripts/sprite-tries/infected-runner-skitterer.ts');
  const old=await load('/scripts/sprite-tries/infected-runner-options.ts');
  const player=await load('/src/assets/art/player.ts');
  const frames=[];
  for(let i=0;i<art.SKITTERER_FRAME_COUNT;i++){
    const canvas=makeHD(64,art.drawBeetleSkitterer(i),{outline:false});
    const pixels=canvas.getContext('2d').getImageData(0,0,64,64).data;
    let count=0;
    for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(pixels[(y*64+x)*4+3]){
      if(x===0||y===0||x===63||y===63)throw Error('Clipped frame '+i);
      count++;
    }
    if(!count)throw Error('Empty frame');
    frames.push(canvas);
  }
  if(new Set(frames.map(f=>f.toDataURL())).size!==frames.length)throw Error('Duplicate gait frames');
  const ranger=makeHD(64,player.drawPlayer('idle0'));
  const original=makeHD(64,old.drawSporeSkitterer,{outline:false});
  fs.mkdirSync(OUT,{recursive:true});
  const atlas=createCanvas(64*frames.length,64);const ac=atlas.getContext('2d');frames.forEach((f,i)=>ac.drawImage(f,i*64,0));
  fs.writeFileSync(path.join(OUT,'scuttle-sheet.png'),atlas.toBuffer('image/png'));
  const board=createCanvas(1040,530),c=board.getContext('2d');c.imageSmoothingEnabled=false;
  const text=(s,x,y,size=16,color='#b8bbc2')=>{c.fillStyle=color;c.font=`${size}px system-ui`;c.fillText(s,x,y);};
  c.fillStyle='#191b23';c.fillRect(0,0,1040,530);
  text('SPORE SKITTERER / BEETLE STANCE',24,42,27,'#eeeade');
  text('Short bent legs · alternating tripod gait · 16 pixel-art frames',24,74);
  c.fillStyle='#393343';c.fillRect(24,98,310,290);c.fillRect(354,98,662,290);
  c.drawImage(original,0,0,64,64,51,104,256,256); text('Original long legs',44,378);
  c.drawImage(frames[0],0,0,64,64,380,104,256,256);c.drawImage(frames[5],0,0,64,64,704,104,256,256);
  text('Short legs / planted tripod',374,378);text('Short legs / recovering tripod',704,378);
  c.fillStyle='#35443b';c.fillRect(24,406,992,100);
  c.drawImage(ranger,160,424,32,32);c.drawImage(frames[0],240,429,64*.425,64*.425);
  text('Ranger + proposed game size',310,449,14);
  text('Static comparison above; open the animation preview for motion.',310,477,14);
  fs.writeFileSync(path.join(OUT,'skitterer-preview.png'),board.toBuffer('image/png'));
  const sources=frames.map(f=>f.toDataURL());
  fs.writeFileSync(path.join(OUT,'skitterer-preview.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Skitterer · beetle scuttle</title><style>
  :root{color-scheme:dark}*{box-sizing:border-box}body{background:#191b23;color:#eeeade;font:15px system-ui;margin:0}main{max-width:1080px;margin:auto;padding:24px}h1{margin:7px 0;font-size:29px}p{color:#b8bbc2;line-height:1.5}.eyebrow{color:#dec58e;font-size:12px;letter-spacing:2px}.controls{display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin:20px 0}button,select{font:inherit;background:#252932;color:#eeeade;border:1px solid #66616d;border-radius:5px;padding:7px}label{display:flex;gap:7px;align-items:center}.views{display:grid;grid-template-columns:1fr 1fr;gap:16px}canvas{display:block;width:100%;image-rendering:pixelated;background:#393343;border:1px solid #49414f;border-radius:6px}h2{font-size:17px}#status{font-variant-numeric:tabular-nums;color:#dec58e}img{width:100%;image-rendering:pixelated}a{color:#dec58e}@media(max-width:700px){.views{grid-template-columns:1fr}}
  </style><main><div class="eyebrow">INFECTED RUNNER / MOTION STUDY</div><h1>A beetle-like skitterer</h1><p>Short, bent legs keep the shell close to the ground. Two alternating tripods give it a quick scuttle, with a small body bob and a stable fungal shell.</p><div class="controls"><button id="play">Pause</button><button id="step">Step frame</button><label>Speed <select id="speed"><option value="1">Normal</option><option value="0.5">Half</option><option value="0.25">Quarter</option></select></label><label><input id="travel" type="checkbox" checked>Travel</label><label>Ground <select id="ground"><option value="#393343">Infected purple</option><option value="#35443b">Moss green</option><option value="#807885">Light stone</option></select></label><span id="status" role="status">Loading frames…</span></div>
  <div class="views"><section><h2>Facing right · 5× detail</h2><canvas id="right" width="480" height="330"></canvas></section><section><h2>Facing left · 5× detail</h2><canvas id="left" width="480" height="330"></canvas></section></div>
  <h2>Game size · ranger for scale</h2><canvas id="lane" width="980" height="130"></canvas><p>The lane uses the runner’s existing 140 px/s speed and 0.425 scale. This is an art preview; gameplay integration comes after approval.</p>
  <details><summary>Compare old and shorter legs</summary><img src="skitterer-preview.png" alt="Original long-legged concept compared with two short-legged poses"></details></main><script>
  const sources=${JSON.stringify(sources)},rangerSource=${JSON.stringify(ranger.toDataURL())};
  const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Unable to load frame'));img.src=src;});
  Promise.all([...sources,rangerSource].map(load)).then(images=>{
    const ranger=images.pop(),frames=images;let paused=false,clock=0,last=0;
    const status=document.querySelector('#status'),play=document.querySelector('#play');
    play.onclick=()=>{paused=!paused;play.textContent=paused?'Play':'Pause';};
    document.querySelector('#step').onclick=()=>{paused=true;play.textContent='Play';clock+=1000/${art.SKITTERER_FPS};draw();};
    function sprite(c,img,x,feet,scale,flip=false){c.save();c.translate(Math.round(x),Math.round(feet));c.imageSmoothingEnabled=false;c.fillStyle='#10121955';c.beginPath();c.ellipse(0,0,24*scale,3*scale,0,0,Math.PI*2);c.fill();c.scale(flip?-scale:scale,scale);c.drawImage(img,-32,-50);c.restore();}
    function clear(id){const canvas=document.querySelector(id),c=canvas.getContext('2d');c.fillStyle=document.querySelector('#ground').value;c.fillRect(0,0,canvas.width,canvas.height);return c;}
    function draw(){const index=Math.floor(clock*${art.SKITTERER_FPS}/1000)%frames.length;const frame=frames[index];sprite(clear('#right'),frame,240,285,5);sprite(clear('#left'),frame,240,285,5,true);const c=clear('#lane');sprite(c,ranger,65,85,.5);const moving=document.querySelector('#travel').checked;const x=moving?150+(clock*.14)%760:490;sprite(c,frame,x,85,.425);status.textContent='Frame '+(index+1)+' / '+frames.length;}
    function tick(now){if(last&&!paused)clock+=(now-last)*Number(document.querySelector('#speed').value);last=now;draw();requestAnimationFrame(tick);}requestAnimationFrame(tick);
  }).catch(error=>document.querySelector('#status').textContent=error.message);
  </script></html>`);
  console.log(JSON.stringify({frames:frames.length,unique:frames.length,fps:art.SKITTERER_FPS,preview:path.join(OUT,'skitterer-preview.html')}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
