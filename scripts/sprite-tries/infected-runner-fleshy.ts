import { ellipse, poly, rect, type HdDraw, type HdPut } from '../../src/assets/art/hd';

const C = {
  edge:'#332c3b', deep:'#49394d', shade:'#665068', hide:'#876981',
  light:'#ad899e', ridge:'#c6a5b4', belly:'#917d85', bellyLight:'#b29c9e',
  boilEdge:'#754b40', boilShade:'#a26a46', boil:'#ce9655', boilLight:'#eed093',
  mouth:'#302735', gum:'#935f70', bone:'#d6c7a2', tooth:'#eee0bd', eye:'#f0ba67',
} as const;

type Point = readonly [number,number];
function foot(put: HdPut,x:number,y:number,near:boolean,size=1) {
  const points: Point[] = [[-4,-9],[2,-10],[5,-6],[3,-1],[7,1],[7,3],[-3,3],[-6,0],[-4,-4]];
  poly(put,points.map(([px,py])=>[x+px*size,y+py*size]),C.edge);
  poly(put,[[-3,-8],[1,-8],[3,-5],[1,-1],[5,1],[-2,1],[-4,-1],[-2,-4]].map(([px,py]):Point=>[x+px*size,y+py*size]),near?C.hide:C.shade);
  if(near){rect(put,x-2,y-6,3,2,C.light);rect(put,x+2,y+1,3,1,C.bone);}
}
function boil(put:HdPut,x:number,y:number,r:number) {
  ellipse(put,x,y,r+1,r,C.boilEdge);
  ellipse(put,x,y-1,r,r-1,C.boilShade);
  ellipse(put,x-1,y-2,r-1,Math.max(1,r-2),C.boil);
  rect(put,x-2,y-3,2,1,C.boilLight);
}
function body(put:HdPut,points:readonly Point[],cx:number,cy:number) {
  poly(put,points,C.edge);
  const inset=(sx:number,sy:number,dx=0,dy=0):Point[]=>points.map(([x,y])=>[cx+(x-cx)*sx+dx,cy+(y-cy)*sy+dy]);
  poly(put,inset(.95,.94),C.shade);
  poly(put,inset(.86,.78,-1,-3),C.hide);
  poly(put,inset(.67,.44,-4,-7),C.light);
  poly(put,inset(.43,.17,-5,-10),C.ridge);
  poly(put,[[cx-12,cy+8],[cx-5,cy+5],[cx+3,cy+7],[cx+12,cy+4],[cx+16,cy+8],[cx+10,cy+13],[cx-2,cy+14],[cx-12,cy+11]],C.deep);
}
function face(put:HdPut,x:number,y:number,wide=false) {
  poly(put,[[x-7,y-8],[x-1,y-10],[x+6,y-8],[x+8,y-5],[x+5,y-3],[x-2,y-4]],C.shade);
  poly(put,[[x-4,y-6],[x+1,y-7],[x+5,y-5],[x+3,y-3],[x-3,y-3]],C.deep);
  rect(put,x,y-5,3,1,C.eye); put(x,y-5,C.tooth);
  const w=wide?3:0;
  poly(put,[[x-8-w,y],[x-3,y-2],[x+5+w,y-1],[x+8+w,y+2],[x+5+w,y+8],[x-3,y+9],[x-8-w,y+5]],C.edge);
  poly(put,[[x-6-w,y+1],[x-2,y],[x+5+w,y+1],[x+6+w,y+3],[x+3+w,y+7],[x-3,y+7],[x-6-w,y+4]],C.mouth);
  poly(put,[[x-4,y+6],[x+1,y+5],[x+4,y+6],[x+2,y+8],[x-3,y+8]],C.gum);
  poly(put,[[x-6-w,y+1],[x-3-w,y+1],[x-4-w,y+5]],C.tooth);
  poly(put,[[x+2+w,y+1],[x+5+w,y+1],[x+3+w,y+5]],C.bone);
  poly(put,[[x-1,y+7],[x,y+4],[x+2,y+7]],C.bone);
}

export const drawScuttlingBoil:HdDraw=put=>{
  foot(put,22,46,false,.75);foot(put,44,45,false,.75);
  body(put,[[6,31],[8,24],[13,19],[22,16],[30,16],[35,19],[41,20],[48,24],[53,30],[54,36],[50,42],[41,47],[29,48],[18,46],[10,42],[5,37]],29,32);
  poly(put,[[11,34],[17,32],[22,34],[21,38],[15,39],[10,37]],C.hide);
  poly(put,[[11,34],[15,33],[18,34],[14,35]],C.light);
  foot(put,17,51,true,.9);foot(put,43,51,true,.9);
  face(put,45,32);
  boil(put,17,23,4);boil(put,30,19,4);boil(put,10,32,3);boil(put,32,31,3);
  rect(put,23,27,3,1,C.ridge);rect(put,28,39,3,1,C.hide);
};

export const drawPotbelliedHopper:HdDraw=put=>{
  foot(put,34,49,false,1.1);
  body(put,[[15,18],[21,12],[29,10],[36,12],[41,18],[45,24],[48,31],[47,40],[42,46],[34,49],[24,48],[17,43],[12,35],[11,27]],29,29);
  poly(put,[[29,34],[35,31],[42,32],[45,36],[43,42],[36,46],[28,44],[25,40]],C.belly);
  poly(put,[[29,35],[34,33],[40,34],[41,37],[36,39],[30,39]],C.bellyLight);
  ellipse(put,23,43,9,7,C.edge);ellipse(put,23,42,7,6,C.hide);ellipse(put,21,40,4,3,C.light);
  foot(put,20,52,true,1.1);
  poly(put,[[39,30],[44,30],[46,35],[51,35],[52,38],[47,40],[42,37]],C.edge);
  poly(put,[[41,32],[43,32],[44,36],[49,36],[49,37],[46,38],[43,36]],C.hide);
  face(put,41,23);
  boil(put,21,17,4);boil(put,32,12,3);boil(put,15,29,3);
};

export const drawManyFootedBlob:HdDraw=put=>{
  for(const x of [17,30,43])foot(put,x,44,false,.6);
  body(put,[[5,33],[7,28],[12,24],[18,23],[23,19],[31,20],[36,22],[43,22],[49,26],[54,31],[56,38],[53,43],[47,46],[38,47],[30,45],[23,47],[15,46],[7,43],[4,39]],30,33);
  poly(put,[[10,34],[16,31],[22,33],[23,37],[19,40],[14,38],[9,39]],C.hide);
  poly(put,[[13,33],[17,32],[20,33],[18,35],[13,35]],C.light);
  for(const x of [12,28,45])foot(put,x,48,true,.65);
  face(put,43,34,true);
  boil(put,15,27,3);boil(put,27,22,4);boil(put,40,25,3);boil(put,7,36,2);
  poly(put,[[24,35],[27,33],[31,34],[30,37],[27,38],[24,37]],C.deep);
  rect(put,25,34,3,1,C.hide);
};
