import { ellipse, poly, rect, type HdDraw, type HdPut } from '../../src/assets/art/hd';

type Point = readonly [number, number];
type Palette = { edge: `#${string}`; deep: `#${string}`; shade: `#${string}`; coat: `#${string}`; light: `#${string}`; glint: `#${string}`; hornShade: `#${string}`; horn: `#${string}`; hornLight: `#${string}`; eye: `#${string}` };
type Model = { palette: Palette; back: number; belly: number; rump: number; neck: number; headY: number; hornRadius: number; hornWidth: number; shaggy: boolean; feature: 'elder' | 'briar' | 'stone' | 'black' | 'bone' | 'red' };
const MODELS: readonly Model[] = [
  { feature:'elder',back:43,belly:88,rump:17,neck:72,headY:67,hornRadius:24,hornWidth:10,shaggy:true,palette:{edge:'#302c32',deep:'#50464b',shade:'#82736b',coat:'#b3a58d',light:'#d6c8a9',glint:'#eee0be',hornShade:'#665343',horn:'#a0855d',hornLight:'#d1b783',eye:'#d7a44e'} },
  { feature:'briar',back:48,belly:85,rump:14,neck:75,headY:66,hornRadius:22,hornWidth:8,shaggy:true,palette:{edge:'#292e29',deep:'#3b4436',shade:'#59664b',coat:'#798363',light:'#a0a883',glint:'#c1c29a',hornShade:'#4c3b30',horn:'#826447',hornLight:'#b69767',eye:'#e4bd72'} },
  { feature:'stone',back:40,belly:92,rump:15,neck:70,headY:72,hornRadius:24,hornWidth:13,shaggy:false,palette:{edge:'#2b2c34',deep:'#41434c',shade:'#636771',coat:'#888d94',light:'#b0b3b1',glint:'#d4d2c2',hornShade:'#515052',horn:'#89867c',hornLight:'#c4bda5',eye:'#dca34e'} },
  { feature:'black',back:45,belly:83,rump:23,neck:73,headY:63,hornRadius:25,hornWidth:8,shaggy:true,palette:{edge:'#252730',deep:'#35343f',shade:'#514853',coat:'#6f5e6a',light:'#95808a',glint:'#b19aa0',hornShade:'#77614d',horn:'#ad9573',hornLight:'#dfc79a',eye:'#edbd6e'} },
  { feature:'bone',back:47,belly:82,rump:20,neck:74,headY:66,hornRadius:24,hornWidth:9,shaggy:true,palette:{edge:'#313038',deep:'#4c4750',shade:'#746c76',coat:'#a49a9a',light:'#c7bcaf',glint:'#e5dbc2',hornShade:'#777261',horn:'#aaa48a',hornLight:'#dcd6b4',eye:'#caaa66'} },
  { feature:'red',back:42,belly:91,rump:12,neck:68,headY:75,hornRadius:26,hornWidth:12,shaggy:false,palette:{edge:'#332a31',deep:'#51363c',shade:'#79474a',coat:'#a06759',light:'#c18e73',glint:'#dcb493',hornShade:'#393039',horn:'#62505a',hornLight:'#947b7c',eye:'#f0c278'} },
];

function stroke(put:HdPut,a:Point,b:Point,width:number,color:`#${string}`) {
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=(b[1]-a[1])/length*width/2,ny=(a[0]-b[0])/length*width/2;
  poly(put,[[a[0]-nx,a[1]-ny],[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny]],color);
}
function horn(put:HdPut,cx:number,cy:number,radius:number,width:number,c:Palette,far=false) {
  const points:Point[]=Array.from({length:25},(_,i)=>{
    const t=i/24,angle=-.22*Math.PI-t*1.68*Math.PI,r=radius*(1-t*.77);
    return [cx+Math.cos(angle)*r,cy+Math.sin(angle)*r];
  });
  for(let i=0;i<24;i++)stroke(put,points[i],points[i+1],width*(1-i/36)+2,c.edge);
  for(let i=0;i<24;i++){
    const w=width*(1-i/36);
    stroke(put,points[i],points[i+1],w,far?c.hornShade:c.horn);
    stroke(put,[points[i][0]-1,points[i][1]-1],[points[i+1][0]-1,points[i+1][1]-1],Math.max(1,w*.32),far?c.horn:c.hornLight);
    if(i%3===1){const [x,y]=points[i];rect(put,x-2,y-1,3,2,c.hornShade);}
  }
}
function leg(put:HdPut,x:number,y:number,near:boolean,c:Palette,heavy:boolean) {
  const w=heavy?10:7;
  poly(put,[[x-w,y],[x+w,y+1],[x+w-2,y+12],[x+2,y+21],[x+6,y+29],[x+7,y+35],[x-w,y+35],[x-w-1,y+30],[x-4,y+21],[x-w+1,y+12]],c.edge);
  poly(put,[[x-w+2,y+2],[x+w-2,y+3],[x+w-4,y+12],[x,y+21],[x+3,y+29],[x-w+2,y+30],[x-2,y+20],[x-w+3,y+11]],near?c.coat:c.shade);
  if(near)poly(put,[[x-w+3,y+3],[x-1,y+4],[x,y+10],[x-4,y+17],[x-5,y+11]],c.light);
  poly(put,[[x-w+1,y+28],[x+3,y+28],[x+5,y+33],[x-w+1,y+33]],c.deep);
  rect(put,x-w+2,y+28,w+1,1,c.hornShade);rect(put,x-1,y+29,1,5,c.edge);
}

export function drawAncientRamOption(index:number):HdDraw {
  const m=MODELS[index],c=m.palette;
  return put=>{
    const heavy=m.feature==='stone'||m.feature==='red';
    leg(put,45,73,false,c,heavy);leg(put,94,75,false,c,heavy);
    horn(put,99,m.headY-23,m.hornRadius*.8,m.hornWidth*.75,c,true);
    poly(put,[[m.rump+4,58],[m.rump-5,62],[m.rump-8,70],[m.rump-4,76],[m.rump+5,73],[m.rump+8,65]],c.edge);
    poly(put,[[m.rump+3,61],[m.rump-3,65],[m.rump-5,70],[m.rump,72],[m.rump+5,68]],c.shade);
    const outline:Point[]=[[m.rump,62],[m.rump+4,m.back+7],[m.rump+13,m.back],[40,m.back-3],[57,m.back-1],[67,m.back-5],[78,m.back],[88,m.back+12],[92,69],[87,81],[76,m.belly],[57,m.belly+3],[37,m.belly],[m.rump+7,m.belly-7],[m.rump,73]];
    poly(put,outline,c.edge);
    poly(put,outline.map(([x,y]):Point=>[53+(x-53)*.94,65+(y-65)*.9]),c.coat);
    poly(put,[[m.rump+3,67],[31,69],[44,73],[58,70],[71,73],[87,65],[85,79],[74,m.belly-2],[56,m.belly],[37,m.belly-2],[m.rump+9,m.belly-8]],c.shade);
    poly(put,[[m.rump+7,m.back+9],[m.rump+14,m.back+2],[40,m.back],[56,m.back+2],[64,m.back-1],[73,m.back+2],[74,m.back+7],[58,m.back+12],[43,m.back+10],[29,m.back+14]],c.light);
    poly(put,[[m.rump+14,m.back+3],[37,m.back+1],[51,m.back+3],[43,m.back+5],[31,m.back+5]],c.glint);
    for(let i=0;i<13;i++){
      const x=m.rump+11+(i%5)*10,y=m.back+13+Math.floor(i/5)*11;
      if(m.shaggy){poly(put,[[x-4,y],[x,y-3],[x+5,y],[x+7,y+5],[x+3,y+9],[x,y+5],[x-4,y+7]],i%3===0?c.shade:c.coat);poly(put,[[x-2,y],[x,y-2],[x+4,y],[x+3,y+2],[x,y+1]],c.light);}
      else {poly(put,[[x-3,y],[x+3,y-1],[x+5,y+3],[x+2,y+5],[x-3,y+3]],i%2?c.shade:c.coat);rect(put,x-2,y,3,1,c.light);}
    }
    leg(put,31,77,true,c,heavy);leg(put,79,78,true,c,heavy);
    poly(put,[[m.neck,52],[83,46],[96,51],[102,63],[98,76],[94,88],[87,95],[84,89],[78,92],[77,84],[71,87],[72,77],[68,73]],c.edge);
    poly(put,[[m.neck+2,54],[83,49],[93,53],[99,64],[95,75],[91,85],[88,90],[85,84],[80,88],[80,80],[74,83],[75,74],[71,70]],c.shade);
    poly(put,[[76,55],[83,51],[90,54],[94,63],[88,70],[88,79],[84,82],[83,75],[78,79],[78,71],[74,72]],c.coat);
    poly(put,[[79,55],[84,53],[89,55],[91,60],[86,62],[83,67],[80,64]],c.light);
    poly(put,[[93,m.headY-14],[102,m.headY-11],[106,m.headY-3],[114,m.headY+1],[121,m.headY+3],[123,m.headY+9],[118,m.headY+14],[105,m.headY+13],[99,m.headY+8],[94,m.headY+4],[90,m.headY-4]],c.edge);
    poly(put,[[95,m.headY-11],[101,m.headY-9],[104,m.headY-1],[113,m.headY+3],[120,m.headY+5],[120,m.headY+9],[116,m.headY+11],[106,m.headY+10],[101,m.headY+5],[95,m.headY+2],[93,m.headY-4]],c.coat);
    poly(put,[[98,m.headY-8],[101,m.headY-7],[104,m.headY],[111,m.headY+3],[107,m.headY+5],[101,m.headY+2],[97,m.headY]],c.light);
    poly(put,[[105,m.headY+7],[112,m.headY+6],[119,m.headY+7],[117,m.headY+10],[108,m.headY+10]],c.shade);
    rect(put,118,m.headY+4,3,2,c.deep);rect(put,112,m.headY+10,7,1,c.deep);
    poly(put,[[100,m.headY-4],[106,m.headY-3],[109,m.headY],[104,m.headY+1],[100,m.headY-1]],c.deep);
    rect(put,103,m.headY-2,3,1,c.eye);
    poly(put,[[93,m.headY-10],[87,m.headY-13],[83,m.headY-10],[88,m.headY-4],[94,m.headY-3]],c.edge);
    poly(put,[[91,m.headY-9],[87,m.headY-11],[86,m.headY-9],[90,m.headY-6]],c.light);
    horn(put,85,m.headY-16,m.hornRadius,m.hornWidth,c);
    rect(put,103,m.headY-2,3,1,c.eye);

    if(m.feature==='elder'){
      for(const [x,y] of [[58,82],[65,83],[72,79]])poly(put,[[x-3,y],[x+5,y-1],[x+2,y+13],[x-1,y+10],[x-4,y+14]],c.light);
      poly(put,[[105,79],[112,81],[109,94],[104,99],[103,88]],c.shade);
      poly(put,[[106,82],[109,83],[107,94],[105,95]],c.light);
    }
    if(m.feature==='briar'){
      for(const [x,y] of [[24,49],[42,45],[62,44]]){
        poly(put,[[x-7,y+6],[x-10,y-3],[x-8,y-11],[x-3,y-1],[x+1,y-5],[x+5,y+5]],c.edge);
        poly(put,[[x-6,y+3],[x-8,y-5],[x-3,y+2],[x+1,y-2],[x+2,y+4]],c.horn);
        ellipse(put,x+2,y+8,7,3,c.deep);poly(put,[[x-4,y+7],[x+2,y+5],[x+8,y+7],[x+3,y+9]],c.light);
      }
      stroke(put,[72,29],[63,21],3,c.horn);stroke(put,[66,23],[66,16],2,c.hornLight);
    }
    if(m.feature==='stone'){
      for(const [x,y] of [[29,45],[50,42],[71,40]]){
        poly(put,[[x-11,y+1],[x-7,y-5],[x+4,y-6],[x+12,y],[x+10,y+9],[x-2,y+12],[x-11,y+7]],c.edge);
        poly(put,[[x-9,y+1],[x-5,y-3],[x+3,y-4],[x+9,y+1],[x+5,y+4],[x-4,y+5]],c.glint);
        poly(put,[[x-9,y+3],[x-3,y+6],[x+9,y+2],[x+8,y+7],[x,y+10],[x-8,y+7]],c.shade);
      }
      poly(put,[[101,57],[107,60],[111,67],[109,74],[103,72],[100,65]],c.hornLight);
    }
    if(m.feature==='black'){
      for(let i=0;i<6;i++){const x=67+i*4,y=39+i*3;poly(put,[[x-4,y+6],[x-3,y-5],[x+1,y-10],[x+3,y-3],[x+6,y+5]],c.edge);poly(put,[[x-2,y+3],[x,y-5],[x+3,y+1]],c.shade);}
      poly(put,[[102,74],[111,77],[108,91],[104,102],[100,95],[101,84]],c.deep);
      stroke(put,[104,80],[104,95],2,c.light);
    }
    if(m.feature==='bone'){
      poly(put,[[97,53],[103,56],[108,66],[116,71],[120,75],[117,79],[110,80],[106,76],[100,72],[96,63]],c.hornShade);
      poly(put,[[98,55],[102,58],[106,67],[114,72],[118,75],[116,77],[110,77],[107,73],[101,70],[98,62]],c.hornLight);
      poly(put,[[101,62],[106,63],[109,67],[106,70],[102,68]],c.deep);put(105,65,c.eye);
      for(let i=0;i<4;i++)stroke(put,[46+i*6,65],[43+i*6,77],2,c.light);
      rect(put,114,76,1,4,c.deep);rect(put,117,75,1,3,c.deep);
    }
    if(m.feature==='red'){
      for(let i=0;i<4;i++)poly(put,[[65+i*4,59],[67+i*4,57],[65+i*4,71],[63+i*4,73]],c.deep);
      poly(put,[[96,65],[103,68],[107,74],[111,78],[108,81],[103,77],[98,72]],c.shade);
      rect(put,104,73,4,1,c.glint);
      poly(put,[[22,58],[29,54],[38,54],[34,58],[25,61]],c.light);
    }
  };
}
