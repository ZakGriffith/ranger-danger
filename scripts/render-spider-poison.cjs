const {createCanvas}=require('canvas');
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'out','spider-poison');
globalThis.document={createElement:()=>createCanvas(1,1)};
async function main(){
 const {runnerImport}=await import('vite');const config={root:ROOT,logLevel:'error'};
 const load=async file=>(await runnerImport(file,config)).module;
 const {makeHD}=await load('/src/assets/art/hd.ts');
 const {drawInfectedSpider}=await load('/src/assets/art/infectedSpider.ts');
 const {drawSpiderSmoke,SPIDER_SMOKE_FRAMES}=await load('/src/assets/art/spiderPoison.ts');
 const {CFG}=await load('/src/config.ts');
 const spider=makeHD(64,drawInfectedSpider('move0'),{outline:false});
 const smoke=SPIDER_SMOKE_FRAMES.map(f=>makeHD(128,drawSpiderSmoke(f*50),{outline:false}));
 fs.mkdirSync(OUT,{recursive:true});
 const board=createCanvas(960,340),c=board.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#191b23';c.fillRect(0,0,960,340);
 c.fillStyle='#eeeade';c.font='24px system-ui';c.fillText('CRIMSON SPIDER / DEATH POISON',24,36);
 [250,1200,2700].forEach((age,i)=>{const x=24+i*312;c.fillStyle='#393343';c.fillRect(x,58,296,234);c.drawImage(smoke[Math.floor(age/50)],x+148-64*1.5,180-74*1.5,192,192);c.fillStyle='#b8bbc2';c.font='15px system-ui';c.fillText((age/1000).toFixed(2)+' seconds after death',x+32,276);});
 c.fillStyle='#b8bbc2';c.font='14px system-ui';c.fillText('18 px radius / 3 seconds / 1 HP every 500 ms / player + tower damage',24,320);
 fs.writeFileSync(path.join(OUT,'spider-poison.png'),board.toBuffer('image/png'));
 fs.writeFileSync(path.join(OUT,'spider-poison.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Crimson spider · Death poison</title><style>:root{color-scheme:dark}body{background:#191b23;color:#eeeade;font:16px system-ui;margin:0}main{max-width:1000px;margin:auto;padding:24px}h1{font-size:28px}p{color:#b8bbc2;line-height:1.5}canvas{display:block;width:100%;background:#393343;image-rendering:pixelated;border-radius:6px}button{font:inherit;background:#252932;color:#eeeade;border:1px solid #66616d;border-radius:5px;padding:8px}#status{margin-left:16px;color:#dec58e}h2{font-size:17px}</style><main><h1>Crimson spider · Death poison</h1><p>A small purple cloud with crimson curls lingers at the death position for three seconds. Elliptical footprint; 1 HP every 500 ms to the player and overlapping towers.</p><button id="restart">Replay death</button><span id="status">Loading…</span><h2>Enlarged view · 5× world scale</h2><canvas id="detail" width="960" height="320"></canvas><h2>Game size</h2><canvas id="game" width="960" height="120"></canvas></main><script>
 const sources=${JSON.stringify(smoke.map(s=>s.toDataURL()))},spiderSource=${JSON.stringify(spider.toDataURL())};
 const load=src=>new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=rej;img.src=src;});
 Promise.all([spiderSource,...sources].map(load)).then(images=>{const spider=images.shift();let start=performance.now();document.querySelector('#restart').onclick=()=>start=performance.now()-800;
 function draw(id,zoom,age){const canvas=document.querySelector(id),c=canvas.getContext('2d'),x=canvas.width/2,y=canvas.height*.62;c.imageSmoothingEnabled=false;c.fillStyle='#393343';c.fillRect(0,0,canvas.width,canvas.height);if(age<200){c.globalAlpha=age<0?1:1-age/200;const scale=.425*zoom;c.drawImage(spider,x-32*scale,y-32*scale,64*scale,64*scale);c.globalAlpha=1;}if(age>=0&&age<3000){const scale=${CFG.infected.spiderPoisonRadius}/52*zoom;c.drawImage(images[Math.floor(age/50)],x-64*scale,y-74*scale,128*scale,128*scale);}}
 function tick(now){const age=(now-start)%4500-800;draw('#detail',5,age);draw('#game',1,age);document.querySelector('#status').textContent=age<0?'Spider alive':age<3000?'Poison active · '+((3000-age)/1000).toFixed(1)+'s remaining':'Cloud expired';requestAnimationFrame(tick);}requestAnimationFrame(tick);});
 </script></html>`);
 console.log(path.join(OUT,'spider-poison.html'));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
