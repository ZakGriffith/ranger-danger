const {createCanvas}=require('canvas');const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'out','ram-style-audit');globalThis.document={createElement:()=>createCanvas(1,1)};
function text(c,t,x,y,size=16,color='#b8bbc2'){c.font=`${size}px system-ui`;c.fillStyle=color;c.fillText(t,x,y);}
(async()=>{const {runnerImport}=await import('vite');const cfg={root:ROOT,logLevel:'error'};const load=async file=>(await runnerImport(file,cfg)).module;const {makeHD}=await load('/src/assets/art/hd.ts');const {drawPlayer}=await load('/src/assets/art/player.ts');const {drawHornedPatriarch}=await load('/scripts/sprite-tries/ram-second-mythic.ts');
const ranger=makeHD(64,drawPlayer('idle0')),ram=makeHD(128,drawHornedPatriarch,{outline:false});
const board=createCanvas(1100,700),c=board.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#191b23';c.fillRect(0,0,1100,700);text(c,'RANGER / RAM E · BORDER COMPARISON',24,39,27,'#eeeade');text(c,'Unchanged artwork, enlarged by whole pixels so the source edges can be judged fairly.',24,72);
c.fillStyle='#40513a';c.fillRect(24,96,350,340);c.fillRect(394,96,682,340);c.drawImage(ranger,79,158,192,192);c.drawImage(ram,520,86,384,384);text(c,'Ranger · 3× source pixels',44,418,16,'#eeeade');text(c,'E · 3× source pixels',414,418,16,'#eeeade');
c.fillStyle='#252932';c.fillRect(24,456,1052,224);text(c,'Outline close-ups · 8× source pixels',44,484,18,'#dec58e');
c.drawImage(ranger,15,5,32,17,45,500,256,136);c.drawImage(ram,30,22,50,17,550,500,400,136);
text(c,'Continuous dark hood edge',44,665,15);text(c,'Wool paint reaches the outer edge',550,665,15);
fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'ranger-ram-borders.png'),board.toBuffer('image/png'));console.log(path.join(OUT,'ranger-ram-borders.png'));})().catch(e=>{console.error(e);process.exitCode=1;});
