import { ellipse, line, poly, rect, type HdDraw, type HdPut, type Paint } from '../../src/assets/art/hd';

type Point = readonly [number, number];
type Color = `#${string}`;
type Matrix = readonly [number, number, number, number, number, number];
type LegPose = { x: number; lift: number };
type Pose = {
  lean: number;
  bodyY: number;
  pitch: number;
  head: number;
  nearFront: LegPose;
  farFront: LegPose;
  nearRear: LegPose;
  farRear: LegPose;
  scrape: number;
};

export const RAM_WINDUP_FRAME_MS = 100;
export const RAM_WINDUP_FRAMES = Array.from({ length: 12 }, (_, i) => i);
export const RAM_CHARGE_FRAME_MS = 75;
export const RAM_CHARGE_FRAMES = Array.from({ length: 6 }, (_, i) => i);

function shape(put: HdPut, points: readonly Point[], color: Color) { poly(put, points, color); }

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

function legMatrix(pose: Pose, foot: LegPose, hipX: number, top: number, sole: number): Matrix {
  const topY = pose.bodyY + (hipX - 58) * pose.pitch;
  const span = sole - top;
  const shear = (foot.x - pose.lean) / span;
  const stretch = 1 - (foot.lift + topY) / span;
  return [1, 0, shear, stretch, pose.lean - shear * top, topY + (1 - stretch) * top];
}

function headMatrix(pose: Pose): Matrix {
  const angle = pose.head * 0.23;
  const a = Math.cos(angle), b = Math.sin(angle), c = -b, d = a;
  const x = 78, y = 65;
  return [a, b, c, d,
    x - a*x - c*y + pose.lean + pose.head,
    y - b*x - d*y + pose.bodyY + (x - 58)*pose.pitch + pose.head*3];
}

function drawPose(pose: Pose): HdDraw {
  return (targetPut, raw) => {
    const pixels: (Paint | null)[] = new Array(160*160).fill(null);
    const layer = (matrix: Matrix, draw: (put: HdPut) => void) => {
      const source: (Paint | null)[] = new Array(128*128).fill(null);
      draw((x,y,color) => { source[Math.floor(y)*128+Math.floor(x)] = color; });
      const [a,b,c,d,e,f] = matrix;
      const determinant = a*d-b*c;
      // Inverse sampling keeps rotated horns and compressed legs solid at native pixel resolution.
      for (let y=0; y<160; y++) for (let x=0; x<160; x++) {
        const tx=x-16+0.5-e, ty=y-24+0.5-f;
        const sx=Math.floor((d*tx-c*ty)/determinant), sy=Math.floor((-b*tx+a*ty)/determinant);
        if (sx<0 || sy<0 || sx>=128 || sy>=128) continue;
        const color=source[sy*128+sx];
        if (color!==null) pixels[y*160+x]=color;
      }
    };
    const edge:Color='#0b0f1a';
    const dark:Color='#514c4b', deep:Color='#777065', shade:Color='#a69d88', woolBase:Color='#d5ccb3', woolLight:Color='#f0e8d1', white:Color='#fff7e3';
    const horn:Color='#87704d', hornShade:Color='#534536', hornLight:Color='#bd9f66';
    layer(legMatrix(pose,pose.farRear,39,70,103), put => {
      patriarchContour(put, legPut => {
        shape(legPut,[[34,70],[44,73],[43,89],[39,101],[29,101],[30,93]],deep);
        shape(legPut,[[35,74],[42,75],[41,89],[37,97],[31,97],[32,93]],shade);
        patriarchHoof(legPut,28,96,14,dark,deep);
      },false);
    });
    layer(legMatrix(pose,pose.farFront,84,73,106), put => {
      patriarchContour(put, legPut => {
        shape(legPut,[[77,73],[91,73],[94,94],[89,105],[78,104],[80,94]],deep);
        shape(legPut,[[79,76],[89,76],[92,94],[87,101],[80,101],[82,94]],shade);
        patriarchHoof(legPut,78,99,15,dark,deep);
      },false);
    });
    layer([1,pose.pitch,0,1,pose.lean,pose.bodyY-58*pose.pitch], put => {
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
    });
    layer(legMatrix(pose,pose.nearRear,39,78,114), put => {
      patriarchContour(put, legPut => {
        shape(legPut,[[32,78],[46,79],[49,91],[46,106],[48,112],[30,112],[28,107],[32,96]],shade);
        shape(legPut,[[34,81],[44,82],[47,91],[43,106],[46,110],[31,110],[30,107],[34,96]],woolBase);
        shape(legPut,[[35,82],[39,83],[41,92],[37,101],[34,103],[36,94]],woolLight);
        shape(legPut,[[44,86],[47,91],[44,102],[42,106],[40,105],[43,94]],shade);
        patriarchHoof(legPut,30,107,19,dark,shade);
      },false);
    });
    layer(legMatrix(pose,pose.nearFront,78,80,116), put => {
      patriarchContour(put, legPut => {
        shape(legPut,[[70,83],[85,80],[90,92],[87,107],[90,114],[72,116],[67,110],[71,98]],shade);
        shape(legPut,[[72,85],[84,82],[88,92],[84,107],[87,113],[72,114],[69,110],[73,98]],woolBase);
        shape(legPut,[[74,86],[79,85],[81,94],[77,104],[73,109],[72,107],[76,96]],woolLight);
        shape(legPut,[[84,86],[88,92],[85,105],[82,109],[80,108],[83,98]],shade);
        patriarchHoof(legPut,70,109,20,dark,shade);
      },false);
    });
    layer(headMatrix(pose), put => {
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
    });

    for (let y=1; y<159; y++) for (let x=1; x<159; x++) {
      const i=y*160+x, color=pixels[i];
      if (color===null) continue;
      const exposed=pixels[i-1]===null || pixels[i+1]===null || pixels[i-160]===null || pixels[i+160]===null;
      targetPut(x,y,exposed?edge:color);
    }
    if (pose.scrape>0) {
      const phase=pose.scrape-1;
      for (let i=0; i<9; i++) {
        const x=16+73-i*2-phase*3;
        const y=24+112-((i*3+phase*2)%7);
        raw(x,y,i%3===0?'#d5bd8b':'#97815d',Math.max(0.15,0.7-phase*0.2));
        if (i%3===0) raw(x-1,y,'#b39c72',0.5-phase*0.12);
      }
      raw(16+69,24+115,'#b39c72',0.5-phase*0.12);
    }
  };
}

export function drawPatriarchWindup(frame: number): HdDraw {
  const head=[0,0.4,0.8,1,1,1,1,1,1,1,1,1][frame];
  const lean=[0,-1,-2,-3,-4,-4,-3,-4,-4,-4,-4,-4][frame];
  const nearFront={
    x:[0,1,7,10,0,-7,10,-1,-8,-3,-3,-3][frame],
    lift:[0,0,5,7,1,0,7,1,0,0,0,0][frame],
  };
  return drawPose({
    head,lean,bodyY:head,pitch:head*0.06,nearFront,
    farFront:{x:head*3,lift:0},
    nearRear:{x:-head*2,lift:0},farRear:{x:-head*2,lift:0},
    scrape:[0,0,0,0,1,2,0,1,2,3,0,0][frame],
  });
}

export function drawPatriarchCharge(frame: number): HdDraw {
  const frontX=[8,4,-4,-8,-3,5],frontLift=[3,0,0,4,8,7];
  const rearX=[-6,-4,4,7,3,-4],rearLift=[0,4,7,4,0,0];
  const opposite=(frame+3)%6;
  return drawPose({
    head:1,lean:2,bodyY:[1,2,1,0,0,1][frame],pitch:0.08,
    nearFront:{x:frontX[frame],lift:frontLift[frame]},
    farFront:{x:frontX[opposite],lift:frontLift[opposite]},
    nearRear:{x:rearX[frame],lift:rearLift[frame]},
    farRear:{x:rearX[opposite],lift:rearLift[opposite]},
    scrape:0,
  });
}
