import { poly, type HdDraw, type HdPut, type Paint } from '../../src/assets/art/hd';

export type PoisonStyle = 'a' | 'b' | 'c';

type Point = readonly [number, number];
type Pen = { put: HdPut; angle: number };

const C = {
  edge: '#322c3b',
  huskDark: '#443f4d', husk: '#61586b', huskLight: '#82738a',
  plumDark: '#665169', plum: '#836c86', plumLight: '#a38ca1',
  rustDark: '#734b40', rust: '#a46b4d', rustLight: '#c59061', rustRidge: '#d5ae79',
  venomDark: '#465743', venom: '#729257', venomLight: '#adc976', core: '#d9e994',
  membraneDark: '#516f51', membrane: '#84aa66', membraneLight: '#bbd48c',
} as const;

function polygon(pen: Pen, points: readonly Point[], color: Paint) {
  const c = Math.cos(pen.angle), s = Math.sin(pen.angle);
  poly(pen.put, points.map(([x, y]) => {
    const dx = x - 16, dy = y - 16;
    return [16 + dx * c - dy * s, 16 + dx * s + dy * c] as Point;
  }), color);
}

function oval(pen: Pen, x: number, y: number, rx: number, ry: number, color: Paint) {
  polygon(pen, Array.from({ length: 16 }, (_, i) => {
    const a = i * Math.PI / 8;
    return [x + Math.cos(a) * rx, y + Math.sin(a) * ry] as Point;
  }), color);
}

function blightBomb(pen: Pen) {
  polygon(pen, [[12,9],[11,7],[14,8],[15,7],[16,10],[20,9],[23,12],[24,17],[22,21],[18,24],[13,23],[9,20],[8,16],[9,12]], C.edge);
  polygon(pen, [[12,10],[16,10],[19,10],[22,12],[23,16],[21,20],[17,23],[13,22],[10,19],[9,15],[10,12]], C.venomDark);
  polygon(pen, [[11,12],[16,11],[20,12],[22,15],[21,19],[17,22],[13,20],[10,17]], C.venom);
  polygon(pen, [[14,12],[17,12],[18,16],[21,17],[20,19],[16,18],[14,21],[12,20],[15,16]], C.venomLight);
  polygon(pen, [[15,13],[17,13],[17,16],[19,17],[18,18],[16,17],[15,19],[14,19],[15,16]], C.core);
  polygon(pen, [[10,12],[13,10],[16,10],[15,13],[13,15],[10,15]], C.husk);
  polygon(pen, [[10,12],[13,10],[15,10],[14,12],[12,13],[10,13]], C.huskLight);
  polygon(pen, [[18,10],[21,11],[23,14],[22,17],[19,15]], C.huskDark);
  polygon(pen, [[18,10],[21,11],[22,13],[20,14],[19,13]], C.husk);
  polygon(pen, [[9,16],[12,17],[14,19],[12,22],[10,20]], C.huskDark);
  polygon(pen, [[10,16],[12,17],[13,19],[11,19]], C.husk);
  polygon(pen, [[16,20],[19,20],[21,18],[22,19],[20,22],[17,23],[14,22]], C.huskDark);
  polygon(pen, [[17,20],[19,20],[20,21],[17,22],[15,21]], C.husk);
  oval(pen, 19.5, 12.5, 1.1, 1, C.plumLight);
  polygon(pen, [[12,8],[13,8],[15,11],[13,11]], C.plum);
}

function sporeCapsule(pen: Pen) {
  polygon(pen, [[13,8],[17,8],[20,10],[23,13],[24,17],[22,21],[18,24],[13,23],[9,20],[8,16],[9,12]], C.edge);
  polygon(pen, [[13,9],[17,9],[20,11],[22,14],[23,17],[21,20],[18,23],[13,22],[10,19],[9,16],[10,12]], C.plumDark);
  polygon(pen, [[12,10],[17,10],[20,12],[21,15],[19,18],[14,20],[10,18],[10,14]], C.plum);
  polygon(pen, [[12,11],[15,10],[17,11],[15,13],[12,14],[10,16],[10,13]], C.plumLight);
  polygon(pen, [[10,18],[14,17],[19,19],[21,20],[18,23],[13,22]], C.rustDark);
  polygon(pen, [[10,18],[14,18],[17,20],[15,22],[12,21]], C.rust);
  polygon(pen, [[11,18],[14,18],[15,19],[13,20],[11,19]], C.rustLight);
  polygon(pen, [[17,9],[21,11],[23,15],[22,18],[19,17],[16,14],[15,11]], C.rustDark);
  polygon(pen, [[17,9],[20,11],[22,14],[21,16],[19,15],[17,13]], C.rust);
  polygon(pen, [[17,10],[19,11],[20,13],[18,13],[17,12]], C.rustLight);
  polygon(pen, [[13,9],[16,9],[17,12],[15,16],[12,16],[10,13]], C.rustDark);
  polygon(pen, [[13,9],[15,9],[16,12],[14,15],[12,14],[11,12]], C.rust);
  polygon(pen, [[13,10],[15,10],[15,12],[13,13],[12,12]], C.rustLight);
  polygon(pen, [[13,10],[15,10],[14,11],[12,12]], C.rustRidge);
  polygon(pen, [[16,15],[19,15],[21,18],[19,20],[16,19],[14,17]], C.edge);
  polygon(pen, [[16,16],[19,16],[20,18],[18,19],[15,17]], C.venom);
  polygon(pen, [[16,16],[18,16],[19,17],[17,18],[16,17]], C.venomLight);
  polygon(pen, [[16,16],[18,16],[17,17]], C.core);
  polygon(pen, [[20,18],[22,17],[24,18],[23,20],[21,20]], C.edge);
  polygon(pen, [[21,18],[23,18],[22,20],[21,19]], C.plum);
}

function venomSac(pen: Pen) {
  polygon(pen, [[11,9],[15,8],[18,9],[21,11],[23,14],[24,18],[22,22],[18,24],[13,23],[10,21],[8,18],[8,14],[10,12]], C.edge);
  polygon(pen, [[11,10],[15,9],[18,10],[20,12],[22,14],[23,18],[21,21],[18,23],[13,22],[10,20],[9,17],[9,14]], C.membraneDark);
  polygon(pen, [[11,11],[15,10],[18,11],[20,13],[21,16],[20,20],[17,22],[13,21],[10,18],[10,14]], C.membrane);
  polygon(pen, [[11,12],[14,10],[17,11],[15,12],[13,14],[12,17],[10,16]], C.membraneLight);
  polygon(pen, [[10,17],[13,18],[15,17],[18,18],[20,16],[22,17],[21,21],[18,23],[14,22],[11,20]], C.venomDark);
  polygon(pen, [[11,18],[13,19],[16,18],[18,19],[21,18],[20,21],[17,22],[14,21],[12,20]], C.venom);
  polygon(pen, [[12,18],[14,19],[16,18],[17,19],[16,20],[13,20]], C.venomLight);
  oval(pen, 17, 15, 2.1, 2.2, C.venomDark);
  oval(pen, 16.5, 14.5, 1.5, 1.7, C.venomLight);
  oval(pen, 16, 14, 0.8, 0.8, C.core);
  polygon(pen, [[18,10],[18,8],[21,7],[23,8],[22,10],[23,12],[21,14],[19,13]], C.edge);
  polygon(pen, [[19,10],[19,9],[21,8],[22,8],[21,10],[22,12],[21,13],[20,12]], C.plumDark);
  polygon(pen, [[19,9],[21,8],[21,9],[20,11],[19,11]], C.plumLight);
  polygon(pen, [[11,12],[12,11],[13,12],[12,14],[11,14]], C.core);
  polygon(pen, [[21,15],[22,16],[22,18],[21,17]], C.membraneLight);
}

export function drawPoisonBomb(style: PoisonStyle, frame: number): HdDraw {
  return put => {
    const pen = { put, angle: (frame % 8) * Math.PI / 4 };
    if (style === 'a') blightBomb(pen);
    else if (style === 'b') sporeCapsule(pen);
    else venomSac(pen);
  };
}
