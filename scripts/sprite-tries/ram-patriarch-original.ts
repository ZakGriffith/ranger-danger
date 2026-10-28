import { ellipse, line, poly, rect, type HdDraw, type HdPut } from '../../src/assets/art/hd';

type Point = readonly [number, number];
type Color = `#${string}`;

const ink: Color = '#201e25';
function shape(put: HdPut, points: readonly Point[], color: Color) { poly(put, points, color); }
function hoof(put: HdPut, x: number, y: number, width: number, base: Color, light: Color) {
  shape(put, [[x,y],[x+width-3,y-1],[x+width,y+3],[x+width,y+7],[x-1,y+7],[x-1,y+3]], ink);
  rect(put,x+1,y+1,width-3,4,base); rect(put,x+1,y+1,width-4,1,light);
  rect(put,x+Math.floor(width*.52),y+2,1,5,ink);
}


function cheekCoil(put: HdPut, cx:number, cy:number, rx:number, ry:number, colors:readonly [Color,Color,Color,Color,Color], far=false) {
  for(let y=Math.floor(cy-ry-1);y<=cy+ry+1;y++) for(let x=Math.floor(cx-rx-1);x<=cx+rx+1;x++) {
    const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
    if(r>1+.012*Math.sin(angle*13)||r<.38) continue;
    const lit=-dx*.4-dy*.8;
    const rim=r>.9||r<.46;
    const ridged=Math.sin(angle*14+r*2)>.87;
    const tone=rim?(lit>.2?2:0):ridged?(lit>0?2:1):lit>.25?4:lit>-.5?3:2;
    put(x,y,colors[Math.max(0,tone-(far?1:0))]);
  }
  shape(put,[[cx+rx*.58,cy-ry*.15],[cx+rx*.76,cy+ry*.08],[cx+rx*.49,cy+ry*.44],[cx+rx*.06,cy+ry*.47],[cx-rx*.24,cy+ry*.15],[cx-rx*.12,cy-ry*.07],[cx+rx*.09,cy+ry*.08],[cx+rx*.25,cy+ry*.22],[cx+rx*.43,cy+ry*.11]],colors[1]);
  line(put,cx+rx*.47,cy+ry*.3,cx+rx*.12,cy+ry*.29,colors[3],2);
  line(put,cx+rx*.1,cy+ry*.29,cx-rx*.08,cy+ry*.06,colors[2],2);
}

function wool(put: HdPut, x:number,y:number,rx:number,ry:number,base:Color,light:Color,shade:Color) {
  ellipse(put,x,y,rx,ry,base);
  shape(put,[[x-rx+1,y],[x-rx+3,y-ry+3],[x,y-ry],[x+rx-3,y-ry+3],[x+rx-2,y-1],[x+2,y-3],[x-2,y+1]],light);
  shape(put,[[x-rx+2,y+2],[x-2,y+3],[x+4,y],[x+rx-1,y-2],[x+rx-2,y+ry-2],[x+2,y+ry],[x-5,y+ry-1]],shade);
}
export const drawOriginalPatriarch: HdDraw = put => {
  const dark:Color='#514c4b', deep:Color='#777065', shade:Color='#a69d88', woolBase:Color='#d5ccb3', woolLight:Color='#f0e8d1', white:Color='#fff7e3';
  const horn:Color='#87704d', hornShade:Color='#534536', hornLight:Color='#bd9f66';
  shape(put,[[34,70],[44,73],[43,89],[39,101],[29,101],[30,93]],ink);shape(put,[[36,76],[41,76],[38,94],[33,96]],shade);hoof(put,28,96,14,dark,deep);
  shape(put,[[77,73],[91,73],[94,94],[89,105],[78,104],[80,94]],ink);shape(put,[[81,77],[88,77],[90,93],[86,99],[82,98]],shade);hoof(put,78,99,15,dark,deep);
  shape(put,[[21,60],[24,45],[34,32],[47,25],[63,24],[78,29],[91,39],[98,54],[99,72],[90,86],[76,94],[55,96],[37,89],[25,78]],ink);
  ellipse(put,59,59,37,33,woolBase);
  shape(put,[[25,58],[38,61],[48,72],[65,75],[80,67],[95,58],[96,75],[87,85],[73,92],[53,93],[37,86],[27,76]],shade);
  for(const [x,y,rx,ry] of [[34,44,10,10],[49,35,12,9],[65,35,12,10],[80,43,12,11],[38,59,12,11],[56,51,13,12],[69,53,11,11],[31,71,7,9],[46,76,12,10],[59,69,9,9],[84,67,12,13],[61,85,11,8]])wool(put,x,y,rx,ry,woolBase,woolLight,shade);
  shape(put,[[33,39],[40,33],[47,32],[44,36],[38,38]],white);shape(put,[[52,29],[61,28],[66,30],[63,32],[55,31]],white);
  shape(put,[[32,78],[46,79],[49,91],[46,106],[48,112],[30,112],[28,107],[32,96]],ink);
  shape(put,[[35,82],[43,83],[45,92],[41,105],[43,109],[33,109],[35,96]],shade);shape(put,[[35,84],[39,84],[40,94],[37,102],[34,103]],woolLight);hoof(put,30,107,19,dark,shade);
  shape(put,[[70,83],[85,80],[90,92],[87,107],[90,114],[72,116],[67,110],[71,98]],ink);
  shape(put,[[74,86],[82,84],[86,93],[82,107],[85,112],[73,113],[71,109],[75,98]],woolBase);shape(put,[[75,88],[79,87],[80,96],[76,107],[73,109]],woolLight);hoof(put,70,109,20,dark,shade);

  cheekCoil(put,107,48,12,14,[ink,hornShade,horn,hornLight,'#ddc38d'],true);
  shape(put,[[78,49],[87,45],[98,49],[106,60],[108,75],[102,86],[91,93],[79,89],[74,81],[73,67]],ink);
  shape(put,[[81,51],[87,48],[96,52],[103,62],[105,74],[99,83],[91,90],[81,86],[77,79],[77,67]],woolBase);
  wool(put,82,56,11,11,woolBase,woolLight,shade);
  wool(put,86,71,11,12,woolBase,woolLight,shade);
  wool(put,88,84,10,8,woolBase,woolLight,shade);
  shape(put,[[101,58],[108,58],[115,64],[120,72],[122,81],[119,89],[113,94],[104,91],[100,84],[98,71]],ink);
  shape(put,[[103,61],[108,61],[113,66],[117,73],[119,80],[116,87],[112,90],[106,88],[103,82],[101,71]],dark);
  shape(put,[[104,62],[108,63],[112,67],[112,73],[108,77],[103,73]],deep);
  shape(put,[[105,65],[109,66],[111,69],[108,71],[104,70]],shade);
  shape(put,[[105,69],[110,69],[114,72],[110,75],[105,74]],ink);
  rect(put,108,72,3,1,'#cdb378');
  shape(put,[[107,80],[113,77],[119,80],[118,86],[113,90],[107,87],[105,83]],deep);
  shape(put,[[108,80],[113,79],[117,81],[115,83],[109,83]],shade);
  rect(put,116,83,3,2,dark);line(put,109,87,116,87,ink);
  shape(put,[[88,51],[81,47],[75,48],[73,52],[80,57],[89,57]],ink);
  shape(put,[[86,52],[80,49],[77,50],[80,53],[86,55]],shade);
  cheekCoil(put,90,62,20,21,[ink,hornShade,horn,hornLight,'#ddc38d']);
  shape(put,[[93,44],[99,47],[103,53],[101,57],[95,53],[91,50]],horn);
  line(put,94,45,99,50,hornLight,2);line(put,94,50,101,54,hornShade);
  shape(put,[[99,89],[106,90],[104,99],[100,104],[96,99]],deep);
  line(put,99,92,100,99,woolBase,2);

};
