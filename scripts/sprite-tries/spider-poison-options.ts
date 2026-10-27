import { ellipse, poly, rect, type HdDraw, type HdPut, type RawPut } from '../../src/assets/art/hd';

type Point = readonly [number, number];
const C = { deep: '#48324f', shade: '#705071', mist: '#a080a0', light: '#ccb0c5', red: '#b65674', coral: '#e18b9d' } as const;
const ROUND: readonly Point[] = [
  [-17,4],[-18,-2],[-14,-7],[-9,-7],[-7,-12],[-1,-15],[5,-13],[7,-8],
  [13,-8],[17,-3],[16,2],[19,6],[14,11],[7,10],[2,14],[-5,12],[-9,8],[-14,9],
];
function pen(raw:RawPut,alpha:number):HdPut {
  return (x,y,color)=>{if(color!==null)raw(Math.round(x),Math.round(y),color,alpha);};
}
function shape(put:HdPut,points:readonly Point[],x:number,y:number,sx:number,sy:number,color:`#${string}`) {
  poly(put,points.map(([px,py])=>[x+px*sx,y+py*sy]),color);
}
function life(age:number) {
  const spread=1-(1-Math.min(1,age/280))**3;
  return {spread,alpha:Math.min(1,age/90)*Math.min(1,(3000-age)/650),time:age/1000};
}
function haze(raw:RawPut,alpha:number,spread:number,color:`#${string}`) {
  for(let ring=0;ring<3;ring++) ellipse(pen(raw,alpha*(.12+ring*.025)),64,74,(52-ring*5)*spread,(31-ring*3)*spread,color);
}


export function drawSporeBurst(age:number):HdDraw {
  return (_put,raw)=>{
    if(age<=0||age>=3000)return;
    const {spread,alpha,time}=life(age);haze(raw,alpha,spread,C.red);
    for(let i=0;i<18;i++){
      const angle=i*2.39996;
      const distance=(15+(i%5)*7)*spread;
      const float=(time*.3+i*.137)%1;
      const x=64+Math.cos(angle)*distance+Math.sin(time*1.2+i)*2;
      const y=74+Math.sin(angle)*distance*.55-float*10;
      const radius=(4+(i%3)*2)*(0.4+.6*spread)*(1-float*.23);
      const opacity=alpha*(.6-float*.18);
      ellipse(pen(raw,opacity*.62),x,y,radius+1,radius*.8,C.deep);
      ellipse(pen(raw,opacity*.8),x,y-1,radius,radius*.7,i%3===0?C.red:C.mist);
      ellipse(pen(raw,opacity*.65),x-1,y-2,Math.max(1,radius*.52),radius*.28,i%3===0?C.coral:C.light);
    }
    for(let i=0;i<9;i++){
      const angle=i*2.4+time*.12;
      const distance=(27+i*2)*spread;
      rect(pen(raw,alpha*.5),64+Math.cos(angle)*distance,74+Math.sin(angle)*distance*.5-9,2,2,i%2?C.coral:C.light);
    }
  };
}

export function drawTornMist(age:number):HdDraw {
  return (_put,raw)=>{
    if(age<=0||age>=3000)return;
    const {spread,alpha,time}=life(age);haze(raw,alpha,spread,C.shade);
    const ribbon:readonly Point[]=[[-24,3],[-19,-1],[-11,-3],[-5,-2],[2,-5],[11,-4],[16,-7],[25,-5],[18,-2],[12,0],[3,-1],[-4,2],[-13,1],[-18,4],[-25,6]];
    for(let i=0;i<7;i++){
      const phase=time*1.4+i*1.8;
      const x=64+Math.sin(i*2.2)*14*spread+Math.sin(phase)*4;
      const y=74+(i-3)*6*spread-Math.sin(phase*.7)*2;
      const sx=(1.1+(i%3)*.25)*spread,sy=(.85+(i%2)*.4)*spread;
      shape(pen(raw,alpha*.36),ribbon,x,y+2,sx,sy,C.deep);
      shape(pen(raw,alpha*.5),ribbon,x,y,sx,sy,i%3===1?C.red:C.mist);
      shape(pen(raw,alpha*.3),ribbon,x-1,y-2,sx*.7,sy*.5,i%3===1?C.coral:C.light);
    }
  };
}
