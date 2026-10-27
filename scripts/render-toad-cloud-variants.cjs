const {createCanvas}=require('canvas');
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'out','toad-cloud-variants');
globalThis.document={createElement:()=>createCanvas(1,1)};
async function main(){
 const {runnerImport}=await import('vite');const config={root:ROOT,logLevel:'error'};
 const load=async file=>(await runnerImport(file,config)).module;
 const {makeHD}=await load('/src/assets/art/hd.ts');
 const smoke=await load('/src/assets/art/poisonSmoke.ts');
 const toad=await load('/src/assets/art/toadPoison.ts');
 const spider=await load('/src/assets/art/spiderPoison.ts');
 const {CFG}=await load('/src/config.ts');
 const specs=[{key:'toad',title:'Toad / rounded clouds in six greens',life:CFG.infected.toadPoisonLifetime,radius:CFG.infected.toadPoisonRadius,draw:(age,v)=>toad.drawToadSmoke(age,CFG.infected.toadPoisonLifetime,v)}];
 fs.mkdirSync(OUT,{recursive:true});let checked=0;
 const board=createCanvas(1248,380),c=board.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#191b23';c.fillRect(0,0,1248,380);
 function text(s,x,y,size=16,color='#b8bbc2'){c.fillStyle=color;c.font=`${size}px system-ui`;c.fillText(s,x,y);}
 text('TOAD POISON / ORIGINAL BILLOWS, SUBTLE VARIETY',24,36,26,'#eeeade');text('Full rounded billows restored, with small shape changes and six closely related green palettes.',24,66);
 for(const [row,spec] of specs.entries()){
  text(spec.title,24,105+row*250,20,'#dec58e');const hashes=new Set();
  for(let v=0;v<smoke.POISON_SMOKE_VARIANTS;v++){
   const frameCount=Math.ceil(spec.life/smoke.POISON_SMOKE_FRAME_MS),atlas=createCanvas(1280,Math.ceil(frameCount/10)*128),ac=atlas.getContext('2d');
   for(let f=0;f<frameCount;f++){
    const frame=makeHD(128,spec.draw(f*smoke.POISON_SMOKE_FRAME_MS,v),{outline:false});
    const data=frame.getContext('2d').getImageData(0,0,128,128).data;
    for(let i=0;i<128;i++)if(data[i*4+3]||data[(127*128+i)*4+3]||data[(i*128)*4+3]||data[(i*128+127)*4+3])throw Error(`Clipping ${spec.key} variant ${v} frame ${f}`);
    ac.drawImage(frame,(f%10)*128,Math.floor(f/10)*128);checked++;
   }
   fs.writeFileSync(path.join(OUT,`${spec.key}-${v}.png`),atlas.toBuffer('image/png'));
   const frame=makeHD(128,spec.draw(1200,v),{outline:false});hashes.add(frame.toDataURL());
   const x=24+v*204,y=120+row*250;c.fillStyle='#393343';c.fillRect(x,y,192,216);c.drawImage(frame,x,y-6,192,192);text('Shape '+(v+1),x+62,y+197,14);
  }
  if(hashes.size!==smoke.POISON_SMOKE_VARIANTS)throw Error('Duplicate variant shapes');
 }
 text('Six gentle variations of the original cloud. New clouds choose a shape, green palette and facing.',24,363,14);
 fs.writeFileSync(path.join(OUT,'toad-cloud-variants.png'),board.toBuffer('image/png'));
 const data=specs.map(({draw,...s})=>s);
 fs.writeFileSync(path.join(OUT,'toad-cloud-variants.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Toad poison · Original style, six variations</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#191b23;color:#eeeade;font:15px system-ui}main{max-width:1280px;margin:auto;padding:24px}h1{font-size:28px}h2{font-size:21px;color:#dec58e}p{color:#b8bbc2;line-height:1.5}.controls{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin:20px 0}button,select{font:inherit;background:#252932;color:#eeeade;border:1px solid #665971;padding:7px;border-radius:5px}.grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}canvas{width:100%;height:auto;image-rendering:pixelated;background:#393343;border-radius:6px}.label{color:#b8bbc2;margin:8px 0 16px;text-align:center}@media(max-width:1000px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:520px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><main><h1>Rounded toad clouds, with subtle variety</h1><p>The original full, rounded billows are back. Shape 1 preserves the original green; the others gently vary puff positions, proportions and shades of green.</p><div class="controls"><button id="pause">Pause</button><label>Speed <select id="speed"><option value="1">Normal</option><option value="0.5">Half</option></select></label><label><input id="stagger" type="checkbox">Stagger ages</label><label>Ground <select id="ground"><option value="#393343">Infected purple</option><option value="#35443b">Moss green</option><option value="#807885">Light stone</option></select></label></div>${specs.map(s=>`<h2>${s.title}</h2><div class="grid">${Array.from({length:6},(_,i)=>`<div><canvas id="${s.key}-${i}" width="192" height="240" aria-label="${s.key} poison shape ${i+1}, enlarged and game size"></canvas><div class="label">Shape ${i+1}</div></div>`).join('')}</div>`).join('')}<p>Large views use the same detail scale. The smaller image in each card shows game size. Runtime clouds can also face either direction. Radius, lifetime and poison damage are unchanged.</p><p id="status">Loading…</p></main><script>
 const specs=${JSON.stringify(data)},count=${smoke.POISON_SMOKE_VARIANTS};
 const load=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(Error('Unable to load '+src));i.src=src;});
 Promise.all(specs.flatMap(s=>Array.from({length:count},(_,v)=>load(s.key+'-'+v+'.png')))).then(images=>{let time=1200,last=0,paused=false;document.querySelector('#status').textContent='';document.querySelector('#pause').onclick=e=>{paused=!paused;e.target.textContent=paused?'Play':'Pause';};function tick(now){if(last&&!paused)time+=(now-last)*Number(document.querySelector('#speed').value);last=now;specs.forEach((s,r)=>{for(let v=0;v<count;v++){const age=(time+(document.querySelector('#stagger').checked?v*317:0))%s.life,f=Math.floor(age/${smoke.POISON_SMOKE_FRAME_MS}),img=images[r*count+v],canvas=document.getElementById(s.key+'-'+v),c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle=document.querySelector('#ground').value;c.fillRect(0,0,192,240);c.drawImage(img,(f%10)*128,Math.floor(f/10)*128,128,128,0,0,192,192);const scale=s.radius/52;c.drawImage(img,(f%10)*128,Math.floor(f/10)*128,128,128,96-64*scale,214-74*scale,128*scale,128*scale);}});requestAnimationFrame(tick);}requestAnimationFrame(tick);}).catch(e=>document.querySelector('#status').textContent=e.message);
 </script></html>`);
 console.log(JSON.stringify({framesChecked:checked,variantsPerSource:smoke.POISON_SMOKE_VARIANTS,preview:path.join(OUT,'toad-cloud-variants.html')}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
