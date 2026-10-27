const {createCanvas}=require('canvas');
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'out','spider-poison-options');
globalThis.document={createElement:()=>createCanvas(1,1)};
async function main(){
 const {runnerImport}=await import('vite');const config={root:ROOT,logLevel:'error'};
 const load=async file=>(await runnerImport(file,config)).module;
 const {makeHD}=await load('/src/assets/art/hd.ts');
 const art=await load('/scripts/sprite-tries/spider-poison-options.ts');
 const production=await load('/src/assets/art/spiderPoison.ts');
 const draws={...art,drawSpiderSmoke:production.drawSpiderSmoke};
 const specs=[{key:'billows',name:'A · Bruised billows',draw:'drawSpiderSmoke',description:'Soft, rounded purple puffs with crimson folds. Closest to the toad cloud’s fullness.'},{key:'spores',name:'B · Spore burst',draw:'drawSporeBurst',description:'Small suspended spores spread from the corpse, then drift and fade.'},{key:'mist',name:'C · Torn mist',draw:'drawTornMist',description:'Thin overlapping ribbons roll sideways, leaving ragged gaps.'}];
 fs.mkdirSync(OUT,{recursive:true});
 const board=createCanvas(1120,540),c=board.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#191b23';c.fillRect(0,0,1120,540);
 function text(s,x,y,size=16,color='#b8bbc2'){c.fillStyle=color;c.font=`${size}px system-ui`;c.fillText(s,x,y);}
 text('SPIDER DEATH POISON / THREE NEW DIRECTIONS',24,40,27,'#eeeade');text('Purple and crimson · rounded puffs, floating spores, or drifting ribbons',24,73);
 let checked=0;
 for(let i=0;i<specs.length;i++){
  const s=specs[i],atlas=createCanvas(1280,768),ac=atlas.getContext('2d');
  for(let f=0;f<60;f++){
   const frame=makeHD(128,draws[s.draw](f*50),{outline:false});const d=frame.getContext('2d').getImageData(0,0,128,128).data;
   for(let j=0;j<128;j++)if(d[j*4+3]||d[(127*128+j)*4+3]||d[(j*128)*4+3]||d[(j*128+127)*4+3])throw Error(`Clipped ${s.key} ${f}`);
   ac.drawImage(frame,f%10*128,Math.floor(f/10)*128);checked++;
  }
  fs.writeFileSync(path.join(OUT,s.key+'.png'),atlas.toBuffer('image/png'));
  const x=24+i*368;c.fillStyle='#252932';c.fillRect(x,98,336,414);text(s.name,x+16,132,21,'#dec58e');
  c.fillStyle='#393343';c.fillRect(x+12,150,312,270);
  const frame=makeHD(128,draws[s.draw](1200),{outline:false});c.drawImage(frame,x+40,151,256,256);
  text('2× native pixels',x+20,409,13);
  c.fillStyle='#35443b';c.fillRect(x+12,432,312,65);const scale=18/52;c.drawImage(frame,x+74-64*scale,471-74*scale,128*scale,128*scale);text('Game size',x+128,473,14);
 }
 fs.writeFileSync(path.join(OUT,'spider-poison-options.png'),board.toBuffer('image/png'));
 fs.writeFileSync(path.join(OUT,'spider-poison-options.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Spider death poison · New options</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{background:#191b23;color:#eeeade;margin:0;font:15px system-ui}main{max-width:1168px;margin:auto;padding:24px}h1{font-size:28px}h2{font-size:21px;color:#dec58e}p{color:#b8bbc2;line-height:1.5}.controls{display:flex;gap:18px;flex-wrap:wrap;align-items:center;margin:20px 0}button,select{font:inherit;padding:7px;border-radius:5px;background:#252932;border:1px solid #665971;color:#eeeade}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.card{padding:16px;background:#252932;border-radius:6px}.card p{min-height:64px}canvas{width:100%;height:auto;display:block;image-rendering:pixelated;border-radius:5px}#status{color:#dec58e;font-variant-numeric:tabular-nums}@media(max-width:760px){.grid{grid-template-columns:1fr}.card p{min-height:0}}</style><main><h1>Spider death poison: three new options</h1><p>Three different motions using purple and crimson. The enlarged view shows detail; the smaller view below shows the proposed 18-pixel radius in game. All fade over three seconds.</p><div class="controls"><button id="pause">Pause</button><button id="restart">Replay</button><label>Speed <select id="speed"><option value="1">Normal</option><option value="0.5">Half</option></select></label><label>Ground <select id="ground"><option value="#393343">Infected purple</option><option value="#35443b">Moss green</option><option value="#807885">Light stone</option></select></label><span id="status">Loading…</span></div><div class="grid">${specs.map(s=>`<section class="card"><h2>${s.name}</h2><p>${s.description}</p><canvas id="${s.key}" width="336" height="340" aria-label="${s.name}, animated enlarged and at game size"></canvas></section>`).join('')}</div><p>Concept previews only. Choose a direction before replacing the current spider effect.</p></main><script>
 const specs=${JSON.stringify(specs)};const load=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});
 Promise.all(specs.map(s=>load(s.key+'.png'))).then(images=>{let clock=900,last=0,paused=false;document.querySelector('#pause').onclick=e=>{paused=!paused;e.target.textContent=paused?'Play':'Pause';};document.querySelector('#restart').onclick=()=>clock=0;function tick(now){if(last&&!paused)clock+=(now-last)*Number(document.querySelector('#speed').value);last=now;const age=clock%3600,frame=Math.min(59,Math.floor(age/50));specs.forEach((s,i)=>{const c=document.getElementById(s.key).getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle=document.querySelector('#ground').value;c.fillRect(0,0,336,340);if(age<3000){const img=images[i],sx=frame%10*128,sy=Math.floor(frame/10)*128;c.drawImage(img,sx,sy,128,128,40,-5,256,256);const scale=18/52;c.drawImage(img,sx,sy,128,128,168-64*scale,303-74*scale,128*scale,128*scale);}c.fillStyle='#b8bbc2';c.font='13px system-ui';c.fillText('2× native pixels',14,247);c.fillText('Game size',135,330);});document.querySelector('#status').textContent=age<3000?((3000-age)/1000).toFixed(1)+'s remaining':'Expired';requestAnimationFrame(tick);}requestAnimationFrame(tick);}).catch(()=>document.querySelector('#status').textContent='Unable to load animation.');
 </script></html>`);
 console.log(JSON.stringify({framesChecked:checked,preview:path.join(OUT,'spider-poison-options.html')}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
