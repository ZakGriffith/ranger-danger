import { ellipse, line, poly, rect, type HdDraw, type HdPut } from '../../src/assets/art/hd';

type Point = readonly [number, number];
type Color = `#${string}`;

const ink: Color = '#201e25';
function shape(put: HdPut, points: readonly Point[], color: Color) { poly(put, points, color); }
function patch(put: HdPut, x: number, y: number, points: readonly Point[], color: Color) {
  shape(put, points.map(([dx, dy]): Point => [x + dx, y + dy]), color);
}
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

export const drawRamWarlord: HdDraw = put => {
  const deep: Color='#2e2d36', shade: Color='#44454e', coat: Color='#60616b', light: Color='#85848b', glint: Color='#aaa2a2';
  const horn: Color='#9c8061', hornDark: Color='#544537', hornLight: Color='#c7aa7c';

  shape(put,[[45,67],[54,71],[51,86],[47,97],[49,102],[39,104],[36,99],[40,87]],ink);
  shape(put,[[46,72],[51,73],[47,88],[44,97],[40,98],[43,86]],shade); hoof(put,38,99,12,deep,shade);
  shape(put,[[77,69],[85,70],[87,88],[82,99],[83,104],[73,105],[72,99],[77,88]],ink);
  shape(put,[[79,74],[83,74],[84,87],[79,99],[75,99],[80,87]],shade); hoof(put,72,101,12,deep,shade);

  shape(put,[[22,51],[25,44],[38,36],[54,34],[69,38],[78,43],[86,53],[86,72],[79,84],[61,90],[40,87],[25,77],[18,62]],ink);
  shape(put,[[24,51],[28,45],[40,39],[54,37],[67,41],[77,46],[82,55],[83,70],[76,80],[60,86],[41,84],[28,75],[22,62]],coat);
  shape(put,[[26,60],[39,64],[48,61],[58,66],[70,61],[81,62],[81,74],[75,82],[60,86],[41,83],[27,74]],shade);
  shape(put,[[28,48],[41,40],[53,39],[64,42],[64,47],[50,50],[41,54],[29,55]],light);
  shape(put,[[31,47],[42,41],[52,41],[56,43],[42,46]],glint);
  shape(put,[[58,48],[69,42],[77,47],[81,57],[77,68],[68,73],[62,66],[66,56]],deep);
  shape(put,[[62,49],[69,45],[74,48],[77,57],[72,63],[68,61],[69,52]],light);
  shape(put,[[23,57],[27,58],[26,65],[31,70],[29,76],[23,71],[20,64]],deep);
  shape(put,[[36,66],[44,67],[49,73],[47,82],[41,82],[42,74]],deep);

  shape(put,[[27,74],[41,75],[43,86],[37,98],[38,108],[25,111],[22,106],[25,97],[22,86]],ink);
  shape(put,[[28,78],[38,78],[40,85],[33,97],[34,106],[26,107],[29,97],[25,87]],coat);
  shape(put,[[28,79],[33,80],[33,88],[28,95],[26,87]],light);
  shape(put,[[34,94],[38,90],[33,101],[34,107],[29,107]],shade); hoof(put,24,106,15,deep,light);
  shape(put,[[65,75],[79,73],[83,87],[79,98],[81,109],[67,113],[62,108],[65,96],[62,86]],ink);
  shape(put,[[68,79],[77,77],[80,87],[74,98],[77,109],[67,110],[69,97],[65,86]],coat);
  shape(put,[[68,81],[73,80],[74,89],[70,99],[68,104],[67,97]],light); hoof(put,65,108,17,deep,light);

  shape(put,[[68,45],[79,42],[90,47],[98,58],[99,76],[91,88],[82,94],[73,90],[66,83],[65,72],[62,64]],ink);
  shape(put,[[71,48],[79,45],[88,49],[94,59],[95,74],[88,84],[81,89],[75,86],[69,79],[69,68],[66,63]],shade);
  shape(put,[[73,49],[81,48],[87,52],[90,62],[86,72],[80,78],[74,74],[73,63],[69,59]],coat);
  shape(put,[[74,51],[80,50],[85,53],[85,58],[79,62],[74,59]],light);
  for(const [x,y] of [[71,66],[73,76],[78,82],[66,57]])patch(put,x,y,[[0,0],[4,-2],[6,1],[3,1],[1,6],[-1,3]],deep);
  cheekCoil(put,107,44,11,13,[ink,hornDark,horn,hornLight,'#dfc696'],true);
  shape(put,[[83,46],[93,43],[103,48],[109,57],[109,69],[104,78],[94,82],[85,75],[79,62]],ink);
  shape(put,[[86,48],[93,46],[101,50],[106,58],[106,68],[101,75],[94,78],[87,73],[83,62]],coat);
  shape(put,[[87,49],[93,48],[99,51],[102,57],[99,62],[92,64],[86,58]],light);
  shape(put,[[87,65],[96,64],[104,67],[103,76],[95,79],[89,74]],shade);
  shape(put,[[103,56],[110,57],[116,61],[120,68],[122,73],[121,80],[115,85],[105,83],[100,77],[99,65]],ink);
  shape(put,[[104,59],[109,59],[114,63],[117,69],[119,74],[118,79],[113,82],[106,80],[103,75],[102,66]],coat);
  shape(put,[[105,60],[109,61],[113,65],[113,69],[110,73],[105,72],[103,66]],light);
  shape(put,[[106,75],[112,72],[119,74],[119,79],[114,82],[107,80]],shade);
  shape(put,[[105,62],[110,62],[113,65],[110,68],[105,67]],deep);
  line(put,104,62,110,63,ink,2);rect(put,107,65,3,1,'#e3b976');
  rect(put,116,75,3,2,deep);line(put,109,80,116,80,ink);
  line(put,113,67,115,72,'#b5a09a');line(put,114,67,116,72,shade);
  shape(put,[[88,49],[81,45],[74,46],[73,50],[80,56],[88,56]],ink);
  shape(put,[[85,50],[80,48],[77,48],[78,51],[83,54],[87,54]],light);
  cheekCoil(put,89,58,17,19,[ink,hornDark,horn,hornLight,'#dfc696']);
  shape(put,[[91,42],[96,43],[101,48],[100,53],[95,51],[91,48]],horn);
  line(put,93,43,98,48,hornLight,2);line(put,94,48,99,50,hornDark);
  shape(put,[[88,75],[96,76],[97,84],[92,90],[87,87]],deep);
  line(put,91,79,92,85,light,2);
  rect(put,75,50,2,2,ink);rect(put,78,46,2,1,hornLight);

};

function patriarchWool(put: HdPut, x:number,y:number,rx:number,ry:number,base:Color,light:Color,shade:Color) {
  ellipse(put,x,y,rx,ry,base);
  shape(put,[[x-rx+1,y-1],[x-rx+3,y-ry+3],[x-3,y-ry+1],[x+2,y-ry+1],[x+rx-3,y-ry+4],[x+rx-3,y-3],[x+4,y-3],[x+4,y-1],[x-1,y-1],[x-1,y+1],[x-rx+3,y+1],[x-rx+3,y-1]],light);
  shape(put,[[x-rx+3,y+ry-3],[x-3,y+ry-2],[x-3,y+ry-4],[x+3,y+ry-4],[x+3,y+ry-6],[x+rx-2,y+ry-8],[x+rx-3,y+ry-2],[x+3,y+ry],[x-4,y+ry-1]],shade);
  line(put,x-rx+3,y+2,x-rx+5,y+4,shade);
}

function patriarchHoof(put: HdPut, x:number,y:number,width:number,base:Color,light:Color) {
  patriarchContour(put, hoofPut => {
    shape(hoofPut,[[x,y],[x+width-3,y-1],[x+width,y+3],[x+width,y+7],[x-1,y+7],[x-1,y+3]],base);
    rect(hoofPut,x,y+1,width-2,2,light);
    rect(hoofPut,x+Math.floor(width*.52),y+3,1,4,'#0b0f1a');
    line(hoofPut,x,y+5,x+width-2,y+5,base);
  },true);
}

function patriarchContour(put: HdPut, draw: (put: HdPut) => void, outlineTop: boolean) {
  const mask = new Set<number>();
  draw((x,y,color) => {
    put(x,y,color);
    mask.add(Math.floor(y)*128+Math.floor(x));
  });
  // Leg joins stay open; hoof contours close without expanding either mask.
  for (const i of mask) {
    if (!mask.has(i-1) || !mask.has(i+1) || !mask.has(i+128) || (outlineTop && !mask.has(i-128))) {
      put(i%128,Math.floor(i/128),'#0b0f1a');
    }
  }
}

export const drawHornedPatriarch: HdDraw = targetPut => {
  const pixels: Parameters<HdPut>[2][] = new Array(128*128).fill(null);
  const put: HdPut = (x,y,color) => { pixels[Math.floor(y)*128+Math.floor(x)]=color; };
  const edge:Color='#0b0f1a';
  const dark:Color='#514c4b', deep:Color='#777065', shade:Color='#a69d88', woolBase:Color='#d5ccb3', woolLight:Color='#f0e8d1', white:Color='#fff7e3';
  const horn:Color='#87704d', hornShade:Color='#534536', hornLight:Color='#bd9f66';
  patriarchContour(put, legPut => {
    shape(legPut,[[34,70],[44,73],[43,89],[39,101],[29,101],[30,93]],deep);
    shape(legPut,[[35,74],[42,75],[41,89],[37,97],[31,97],[32,93]],shade);
    patriarchHoof(legPut,28,96,14,dark,deep);
  },false);
  patriarchContour(put, legPut => {
    shape(legPut,[[77,73],[91,73],[94,94],[89,105],[78,104],[80,94]],deep);
    shape(legPut,[[79,76],[89,76],[92,94],[87,101],[80,101],[82,94]],shade);
    patriarchHoof(legPut,78,99,15,dark,deep);
  },false);

  shape(put,[[21,60],[24,45],[34,32],[47,25],[63,24],[78,29],[91,39],[98,54],[99,72],[90,86],[76,94],[55,96],[37,89],[25,78]],shade);
  ellipse(put,59,59,37,33,woolBase);
  shape(put,[[25,58],[38,61],[48,72],[65,75],[80,67],[95,58],[96,75],[87,85],[73,92],[53,93],[37,86],[27,76]],shade);
  for(const [x,y,rx,ry] of [[34,44,10,10],[49,35,12,9],[65,35,12,10],[80,43,12,11],[38,59,12,11],[56,51,13,12],[69,53,11,11],[31,71,7,9],[46,76,12,10],[59,69,9,9],[84,67,12,13],[61,85,11,8]]) {
    patriarchWool(put,x,y,rx,ry,woolBase,woolLight,shade);
  }
  shape(put,[[33,39],[37,35],[40,35],[40,33],[47,32],[45,34],[42,35],[42,37],[38,38]],white);
  shape(put,[[52,29],[57,28],[61,28],[64,29],[64,31],[60,31],[57,30],[54,30]],white);
  shape(put,[[24,54],[26,50],[28,50],[28,54],[26,57],[24,58]],woolLight);
  shape(put,[[73,39],[77,38],[81,41],[80,43],[76,42]],white);
  line(put,49,52,53,50,white);line(put,37,59,42,57,woolLight);

  patriarchContour(put, legPut => {
    shape(legPut,[[32,78],[46,79],[49,91],[46,106],[48,112],[30,112],[28,107],[32,96]],shade);
    shape(legPut,[[34,81],[44,82],[47,91],[43,106],[46,110],[31,110],[30,107],[34,96]],woolBase);
    shape(legPut,[[35,82],[39,83],[41,92],[37,101],[34,103],[36,94]],woolLight);
    shape(legPut,[[44,86],[47,91],[44,102],[42,106],[40,105],[43,94]],shade);
    patriarchHoof(legPut,30,107,19,dark,shade);
  },false);
  patriarchContour(put, legPut => {
    shape(legPut,[[70,83],[85,80],[90,92],[87,107],[90,114],[72,116],[67,110],[71,98]],shade);
    shape(legPut,[[72,85],[84,82],[88,92],[84,107],[87,113],[72,114],[69,110],[73,98]],woolBase);
    shape(legPut,[[74,86],[79,85],[81,94],[77,104],[73,109],[72,107],[76,96]],woolLight);
    shape(legPut,[[84,86],[88,92],[85,105],[82,109],[80,108],[83,98]],shade);
    patriarchHoof(legPut,70,109,20,dark,shade);
  },false);

  cheekCoil(put,107,48,12,14,[hornShade,hornShade,horn,hornLight,'#ddc38d'],true);
  shape(put,[[78,49],[87,45],[98,49],[106,60],[108,75],[102,86],[91,93],[79,89],[74,81],[73,67]],shade);
  shape(put,[[80,50],[87,47],[97,50],[104,61],[106,75],[100,84],[91,91],[80,87],[76,80],[75,67]],woolBase);
  patriarchWool(put,82,56,11,11,woolBase,woolLight,shade);
  patriarchWool(put,86,71,11,12,woolBase,woolLight,shade);
  patriarchWool(put,88,84,10,8,woolBase,woolLight,shade);
  shape(put,[[101,58],[108,58],[115,64],[120,72],[122,81],[119,89],[113,94],[104,91],[100,84],[98,71]],dark);
  shape(put,[[102,60],[108,60],[114,65],[118,72],[120,81],[117,88],[113,92],[105,89],[102,83],[100,71]],deep);
  shape(put,[[117,73],[120,80],[118,87],[113,92],[105,88],[103,82],[106,84],[113,87],[116,84]],dark);
  shape(put,[[104,62],[108,63],[112,67],[112,73],[108,77],[103,73]],shade);
  shape(put,[[105,63],[108,64],[110,67],[108,69],[105,68]],woolBase);
  shape(put,[[105,69],[110,69],[114,72],[110,75],[105,74]],dark);
  line(put,106,70,110,70,edge);
  rect(put,108,72,3,1,'#cdb378');
  shape(put,[[107,80],[113,77],[119,80],[118,86],[113,90],[107,87],[105,83]],deep);
  shape(put,[[108,80],[113,79],[117,81],[115,83],[109,83]],shade);
  rect(put,116,83,3,1,edge);line(put,109,87,116,87,edge);
  shape(put,[[88,51],[81,47],[75,48],[73,52],[80,57],[89,57]],deep);
  shape(put,[[86,52],[80,49],[77,50],[80,53],[86,55]],shade);
  cheekCoil(put,90,62,20,21,[hornShade,hornShade,horn,hornLight,'#ddc38d']);
  shape(put,[[93,44],[99,47],[103,53],[101,57],[95,53],[91,50]],horn);
  line(put,94,45,99,50,hornLight,2);line(put,94,50,101,54,hornShade);
  shape(put,[[99,89],[106,90],[104,99],[100,104],[96,99]],deep);
  line(put,99,92,100,99,woolBase,2);

  // Keep the approved silhouette while limiting its contour to one source pixel.
  for(let y=0;y<128;y++) for(let x=0;x<128;x++) {
    const i=y*128+x,color=pixels[i];
    if(color===null) continue;
    const exposed=pixels[i-1]===null||pixels[i+1]===null||pixels[i-128]===null||pixels[i+128]===null;
    targetPut(x,y,exposed?edge:color);
  }
};

export const drawDemonicRam: HdDraw = put => {
  const deep:Color='#28232a', shade:Color='#423239', coat:Color='#624246', light:Color='#876056';
  const rust:Color='#9d6548', copper:Color='#c08a5b', horn:Color='#665c51', hornLight:Color='#9e8a6b', hornShade:Color='#3f3937';
  shape(put,[[39,66],[49,68],[47,82],[40,96],[42,103],[29,105],[29,99],[35,86]],ink);shape(put,[[40,72],[45,74],[42,85],[36,98],[32,99],[38,85]],shade);hoof(put,28,99,15,deep,shade);
  shape(put,[[79,65],[89,68],[93,85],[88,98],[91,105],[78,107],[75,101],[81,85]],ink);shape(put,[[82,72],[87,74],[89,85],[83,99],[79,100],[84,85]],shade);hoof(put,77,101,16,deep,shade);
  shape(put,[[17,57],[23,44],[35,36],[50,35],[60,39],[73,36],[85,42],[95,53],[95,70],[84,85],[63,91],[40,87],[23,76]],ink);
  shape(put,[[21,57],[26,46],[36,40],[50,38],[60,43],[73,40],[83,46],[91,56],[90,69],[82,81],[62,87],[41,83],[27,73]],shade);
  shape(put,[[25,50],[36,41],[48,41],[55,44],[49,49],[37,50],[30,56]],coat);
  shape(put,[[28,49],[36,43],[45,43],[43,46],[34,48]],light);
  shape(put,[[22,59],[29,61],[35,57],[45,60],[54,55],[62,62],[60,76],[52,83],[39,82],[27,74]],deep);
  shape(put,[[58,44],[66,37],[77,40],[87,48],[92,59],[87,73],[78,82],[67,80],[61,70],[55,61]],ink);
  shape(put,[[60,44],[67,39],[75,42],[84,48],[88,59],[84,70],[77,77],[69,75],[64,66],[58,59]],rust);
  for(const [x,y,w,h] of [[61,45,7,12],[70,43,7,15],[79,48,7,16],[85,55,5,14],[64,56,8,17],[73,60,8,18]]) {
    shape(put,[[x-w,y],[x-1,y-3],[x+w-1,y+2],[x+w,y+h-5],[x+2,y+h],[x-1,y+h-5],[x-4,y+h+2],[x-5,y+5]],shade);
    shape(put,[[x-w+2,y+1],[x-1,y-1],[x+w-3,y+3],[x+2,y+h-4],[x,y+6],[x-3,y+10]],rust);
    shape(put,[[x-3,y],[x,y-1],[x+3,y+2],[x+1,y+5],[x-2,y+4]],copper);
  }
  shape(put,[[23,73],[37,73],[39,84],[33,96],[32,110],[18,111],[16,106],[23,92],[20,83]],ink);
  shape(put,[[26,77],[34,77],[35,83],[29,95],[28,107],[20,108],[24,95],[24,85]],coat);
  shape(put,[[26,78],[31,79],[30,88],[26,93],[25,86]],light);hoof(put,17,106,17,deep,shade);
  shape(put,[[66,76],[82,74],[87,86],[82,98],[85,110],[70,115],[64,111],[67,97],[61,88]],ink);
  shape(put,[[69,80],[79,78],[83,87],[77,99],[81,110],[71,112],[68,109],[72,97],[65,88]],coat);
  shape(put,[[69,82],[75,81],[76,88],[72,98],[70,106],[69,96],[66,88]],light);hoof(put,68,109,19,deep,light);
  cheekCoil(put,108,45,11,14,[ink,hornShade,horn,hornLight,'#bca47b'],true);
  shape(put,[[80,50],[89,45],[99,48],[107,58],[108,72],[101,82],[91,87],[80,80],[75,66]],ink);
  shape(put,[[83,52],[89,48],[97,51],[104,59],[105,70],[98,79],[91,83],[83,77],[79,65]],deep);
  shape(put,[[84,52],[90,50],[96,53],[99,58],[95,63],[87,64],[81,58]],coat);
  shape(put,[[87,52],[91,51],[96,54],[95,57],[89,59]],light);
  shape(put,[[103,56],[110,58],[116,64],[120,71],[123,76],[122,83],[116,88],[107,85],[102,79],[100,65]],ink);
  shape(put,[[105,59],[109,61],[113,66],[117,72],[120,77],[119,81],[114,85],[108,82],[105,77],[103,66]],deep);
  shape(put,[[106,61],[110,63],[113,67],[112,71],[108,73],[105,69]],coat);
  shape(put,[[106,63],[111,65],[115,68],[112,71],[107,70]],ink);
  rect(put,109,67,4,1,'#db6452');put(110,67,'#f6ad72');
  shape(put,[[108,77],[114,74],[121,77],[120,82],[115,86],[108,83],[106,80]],shade);
  shape(put,[[110,77],[114,76],[119,78],[116,80],[111,79]],light);
  rect(put,117,79,3,2,ink);line(put,110,83,117,83,ink);rect(put,113,83,2,1,'#cfb995');
  shape(put,[[88,51],[81,47],[75,48],[73,52],[80,57],[88,57]],ink);
  shape(put,[[85,52],[80,49],[76,50],[79,53],[85,55]],rust);
  cheekCoil(put,90,60,18,21,[ink,hornShade,horn,hornLight,'#bca47b']);
  shape(put,[[93,42],[99,46],[103,51],[102,56],[96,52],[91,48]],horn);
  line(put,94,43,99,48,hornLight,2);line(put,96,49,101,53,hornShade);
  line(put,100,54,101,59,'#a54d41');line(put,101,59,99,61,'#a54d41');put(100,58,'#d47650');
  shape(put,[[93,81],[101,82],[102,90],[98,95],[94,91]],deep);
  line(put,96,85,98,91,rust,2);
  shape(put,[[46,75],[50,74],[52,78],[48,80],[46,79]],shade);rect(put,31,60,4,1,coat);

};
