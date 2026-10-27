import { poly, rect, ellipse, type HdDraw, type HdPut } from '../../src/assets/art/hd';

const C = {
  edge: '#292933', deep: '#3e3846', shade: '#5c505f', hide: '#82717d',
  light: '#aa949d', rim: '#c9b1ad', boneShade: '#9b997e', bone: '#ccc5a0',
  ivory: '#e8ddba', rustShade: '#754b3e', rust: '#b47b4e', rustLight: '#d5aa70',
  greenShade: '#576842', green: '#91a65b', greenLight: '#c0ce7e', eye: '#f1c575',
} as const;

export const SKITTERER_FRAME_COUNT = 16;
export const SKITTERER_FPS = 32;

function leg(put: HdPut, hipX: number, hipY: number, footX: number, footY: number, near: boolean) {
  const kneeX = hipX + (footX - hipX) * .55 - 2;
  const kneeY = hipY + 3;
  poly(put, [[hipX-2,hipY],[hipX+2,hipY],[kneeX+2,kneeY],[footX+1,footY-2],
    [footX+3,footY],[footX+2,footY+1],[footX-2,footY+1],[footX-2,footY-2],
    [kneeX-2,kneeY+1]], C.edge);
  poly(put, [[hipX-1,hipY],[hipX+1,hipY],[kneeX+1,kneeY],[footX,footY-1],
    [footX-1,footY-1],[kneeX-1,kneeY]], near ? C.hide : C.shade);
  if (near) rect(put,footX,footY,2,1,C.boneShade);
}

function shelf(put: HdPut, x: number, y: number, width: number) {
  poly(put, [[x-width,y],[x-width+2,y-3],[x,y-5],[x+width-2,y-3],[x+width,y],[x+width-2,y+3],[x-width+1,y+2]], C.edge);
  poly(put, [[x-width+1,y],[x-width+3,y-2],[x,y-4],[x+width-2,y-2],[x+width-1,y],[x+width-3,y+1],[x-width+2,y+1]], C.rust);
  poly(put, [[x-width+2,y-1],[x,y-4],[x+width-3,y-2],[x+1,y-2],[x-width+3,y]], C.rustLight);
  rect(put, x-width+3,y+1,width*2-6,1,C.boneShade);
}

export function drawBeetleSkitterer(frame: number): HdDraw {
  return output => {
    const phase = frame / SKITTERER_FRAME_COUNT * Math.PI * 2;
    const bob = Math.round(Math.cos(phase * 2) * .55);
    const put: HdPut = (x,y,color) => output(x,y+5+bob,color);
    const feet = (index: number, near: boolean) => {
      // Opposite tripods alternate support; planted feet sweep backward while lifted feet recover.
      const cycle = phase + (index % 2 === 0 ? 0 : Math.PI) + (near ? 0 : Math.PI);
      const sweep = Math.cos(cycle) * 4;
      const lift = Math.max(0, Math.sin(cycle)) * 3;
      const hipX = [16,29,41][index];
      leg(output,hipX, (near ? 39 : 35)+bob,hipX+[-5,0,7][index]+sweep,
        (near ? 49 : 44)-lift,near);
    };
    for (let i=0;i<3;i++) feet(i,false);
  poly(put, [[8,30],[12,22],[20,18],[30,17],[41,21],[46,27],[45,34],[39,39],[27,41],[16,38],[10,35]], C.edge);
  poly(put, [[10,29],[14,24],[21,20],[30,19],[39,23],[44,28],[43,33],[38,37],[27,39],[17,36],[12,33]], C.greenShade);
  poly(put, [[14,25],[21,21],[29,20],[34,22],[28,25],[20,27],[13,29]], C.greenLight);
  poly(put, [[12,31],[22,29],[34,26],[42,28],[42,33],[36,36],[26,37],[17,35]], C.green);
  poly(put, [[23,20],[25,20],[28,28],[27,37],[25,37],[26,28]], C.deep);
  poly(put, [[35,23],[37,24],[37,31],[34,37],[32,37],[35,30]], C.deep);
  shelf(put,18,21,7); shelf(put,29,17,7); shelf(put,39,22,5);
  poly(put, [[40,27],[46,25],[53,27],[57,31],[58,37],[54,41],[46,40],[41,36]], C.edge);
  poly(put, [[43,28],[47,27],[52,29],[55,32],[55,36],[52,38],[47,38],[43,35]], C.shade);
  poly(put, [[44,29],[48,28],[52,30],[53,32],[47,33],[44,32]], C.light);
  rect(put,49,32,2,1,C.eye); rect(put,54,33,2,1,C.eye);
  poly(put, [[47,37],[50,39],[48,43],[44,44],[45,41]], C.bone);
  poly(put, [[54,37],[57,38],[60,42],[57,44],[54,41]], C.bone);

    for (let i=0;i<3;i++) feet(i,true);
  };
}
