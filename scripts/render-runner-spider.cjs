const {createCanvas}=require('canvas');
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(__dirname,'out','runner-spider');
globalThis.document={createElement:()=>createCanvas(1,1)};
async function main(){
  const {runnerImport}=await import('vite');
  const config={root:ROOT,logLevel:'error',plugins:[{name:'phaser-stub',resolveId:id=>id==='phaser'?'\0phaser-stub':null,load:id=>id==='\0phaser-stub'?'export default {};':null}]};
  const load=async file=>(await runnerImport(file,config)).module;
  const {makeHD}=await load('/src/assets/art/hd.ts');
  const {drawBlisterSpider}=await load('/scripts/sprite-tries/infected-runner-spider.ts');
  const {drawSpider}=await load('/src/assets/art/spider.ts');
  const {drawPlayer}=await load('/src/assets/art/player.ts');
  const {drawToad}=await load('/src/assets/art/toad.ts');
  const candidate=makeHD(64,drawBlisterSpider,{outline:false});
  const forest=makeHD(64,drawSpider('move0'));
  const player=makeHD(64,drawPlayer('idle0'));
  const toad=makeHD(64,drawToad('idle0'),{outline:false});
  const rgba=candidate.getContext('2d').getImageData(0,0,64,64).data;
  for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(rgba[(y*64+x)*4+3]&&(x===0||y===0||x===63||y===63))throw Error('Clipped concept');
  fs.mkdirSync(OUT,{recursive:true});
  const board=createCanvas(1000,680),c=board.getContext('2d');c.imageSmoothingEnabled=false;
  function text(s,x,y,size=16,color='#b8bbc2'){c.fillStyle=color;c.font=`${size}px system-ui`;c.fillText(s,x,y);}
  function sprite(img,x,feet,scale,flip=false){c.save();c.translate(x,feet);c.fillStyle='#10121966';c.beginPath();c.ellipse(0,0,26*scale,3*scale,0,0,Math.PI*2);c.fill();c.scale(flip?-scale:scale,scale);c.drawImage(img,-32,-52);c.restore();}
  c.fillStyle='#191b23';c.fillRect(0,0,1000,680);
  text('INFECTED RUNNER / BLISTER-BACKED SPIDER',24,42,27,'#eeeade');
  text('Swollen plum abdomen · blood-crimson blisters · eight hooked legs · clustered eyes',25,73);
  c.fillStyle='#393343';c.fillRect(24,98,610,365);
  text('New infected spider · 6× detail',44,131,16,'#dec58e');
  sprite(candidate,329,435,6);
  c.fillStyle='#35443b';c.fillRect(654,98,322,365);
  text('Existing Forest spider',674,131,16,'#dec58e');
  sprite(forest,815,305,3.5);
  text('Shared anatomy, different body',674,365,15);
  text('and infection details.',674,389,15);
  c.fillStyle='#252932';c.fillRect(24,483,952,173);
  text('SIZE CHECK / RANGER + INFECTED ROSTER',44,514,14,'#dec58e');
  sprite(player,165,602,1);sprite(candidate,365,602,.85);sprite(toad,565,602,1.1);sprite(candidate,805,602,.85,true);
  text('Ranger',136,634,14);text('Runner · proposed scale',284,634,14);text('Sporeback toad',513,634,14);text('Runner · facing left',743,634,14);
  text('Relative sizes shown at 2×. Static concept for review before animation.',44,540,14);
  fs.writeFileSync(path.join(OUT,'blister-spider.png'),candidate.toBuffer('image/png'));
  fs.writeFileSync(path.join(OUT,'spider-concept.png'),board.toBuffer('image/png'));
  fs.writeFileSync(path.join(OUT,'spider-concept.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blister-backed spider · Runner concept</title><style>:root{color-scheme:dark}body{margin:0;background:#191b23;color:#eeeade;font:16px system-ui}main{max-width:1100px;padding:24px;margin:auto}h1{font-size:28px}p{color:#b8bbc2;line-height:1.5}img{display:block;width:100%;height:auto;image-rendering:pixelated}a{color:#dec58e}</style><main><h1>Blister-backed spider</h1><p>A soft infected abdomen on eight hooked legs. Blood-crimson blisters replace the mushroom caps; small clustered eyes and paired fangs keep the face distinctly spider-like.</p><a href="spider-concept.png"><img src="spider-concept.png" alt="New plum infected spider enlarged, compared with the existing brown Forest spider and the ranger at game scale"></a><p>Static concept only. Open the image for a larger view.</p></main></html>`);
  console.log(path.join(OUT,'spider-concept.html'));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
