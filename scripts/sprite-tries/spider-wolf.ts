import type { HdDraw, HdPut } from '../../src/assets/art/hd';
import { blit, type Palette, type Part } from '../../src/assets/art/pixels';

type Point = readonly [number, number];
type Try = { name: string; frames: { label: string; draw: HdDraw }[] };

const PAL: Palette = {
  o: '#29201d', d: '#443229', s: '#624833', b: '#87613e',
  t: '#a87c4c', h: '#c49964', l: '#ddbb86', c: '#eddbac',
  m: '#b5a07a', f: '#d3c5a4', e: '#e5ab45', w: '#fff0bb',
};

function pixelsBetween(a: Point, b: Point, pixel: (x: number, y: number) => void): void {
  let [x, y] = a;
  const dx = Math.abs(b[0] - x), sx = x < b[0] ? 1 : -1;
  const dy = -Math.abs(b[1] - y), sy = y < b[1] ? 1 : -1;
  let error = dx + dy;
  while (true) {
    pixel(x, y);
    if (x === b[0] && y === b[1]) break;
    const twiceError = 2 * error;
    if (twiceError >= dy) { error += dy; x += sx; }
    if (twiceError <= dx) { error += dx; y += sy; }
  }
}

function leg(put: HdPut, root: Point, knee: Point, ankle: Point, toe: Point, far: boolean): void {
  const base = far ? PAL.s : PAL.t;
  const shade = far ? PAL.d : PAL.s;
  const light = far ? PAL.b : PAL.h;
  pixelsBetween(root, knee, (x, y) => {
    put(x, y - 1, light);
    put(x, y, base);
    put(x, y + 1, shade);
  });
  pixelsBetween(knee, ankle, (x, y) => {
    put(x, y, base);
    put(x + 1, y, shade);
  });
  pixelsBetween(ankle, toe, (x, y) => put(x, y, shade));
  put(knee[0], knee[1], far ? PAL.b : PAL.l);
  put(knee[0] + 1, knee[1] + 1, shade);
}

const ABDOMEN: Part = { y0: 24, rows: [
  [[20, 'hhhhh']],
  [[17, 'hllllhhhhh']],
  [[15, 'hlllccccclthh']],
  [[14, 'hlttccccccclbh']],
  [[13, 'httbbmmmccclbbh']],
  [[12, 'btttbbbbmmmtbbbh']],
  [[12, 'bttttbbbbttttbbbh']],
  [[12, 'stttttbbbbtttbbbbh']],
  [[12, 'sttmmtttttbbtbbbbh']],
  [[13, 'bmmmtbbbttbbtbbbs']],
  [[13, 'sbmmbbbbbbbbbbbbs']],
  [[14, 'sbbmbbbbbbbbbbbss']],
  [[15, 'ssbbbbbbbbbbbsss']],
  [[17, 'ssbbbbbbssssss']],
  [[19, 'sssssssssss']],
  [[22, 'ddddd']],
] };

const CARAPACE: Part = { y0: 25, rows: [
  [[34, 'hhhhh']],
  [[32, 'hllcclth']],
  [[31, 'hlccclttth']],
  [[30, 'htcccltttth']],
  [[30, 'btccclttttbh']],
  [[30, 'btccmltttbbbh']],
  [[30, 'sbmmltttbbtbb']],
  [[30, 'sbbmbttbbbttbs']],
  [[31, 'sbbbbbbbbtbbbs']],
  [[31, 'sbbbbbbbbbbbss']],
  [[32, 'ssbbbbbbbbsss']],
  [[33, 'ssssbbbsssss']],
  [[35, 'ddssssddd']],
  [[37, 'dddd']],
] };

const FACE: Part = { y0: 29, rows: [
  [[42, 'hht']],
  [[42, 'tltth']],
  [[43, 'bewbh']],
  [[43, 'bboeb']],
  [[43, 'sbob']],
  [[43, 'sssf']],
  [[44, 'dff']],
  [[44, 'ff']],
] };

export const drawWolfSpider: HdDraw = (put, raw) => {
  for (let y = 47; y <= 51; y++) {
    const inset = y === 47 || y === 51 ? 8 : y === 48 || y === 50 ? 3 : 0;
    for (let x = 10 + inset; x <= 54 - inset; x++) raw(x, y, '#152016', 0.24);
  }

  leg(put, [33, 29], [20, 21], [10, 42], [8, 45], true);
  leg(put, [36, 28], [29, 19], [24, 42], [22, 45], true);
  leg(put, [39, 29], [47, 21], [49, 41], [51, 44], true);
  leg(put, [41, 30], [53, 25], [58, 41], [60, 44], true);

  blit(put, PAL, ABDOMEN);
  blit(put, PAL, CARAPACE);

  leg(put, [33, 35], [16, 33], [8, 48], [5, 51], false);
  leg(put, [35, 36], [25, 33], [22, 50], [19, 53], false);
  leg(put, [38, 36], [46, 33], [46, 49], [49, 53], false);
  leg(put, [41, 35], [53, 35], [56, 47], [60, 50], false);

  blit(put, PAL, { y0: 34, rows: [
    [[32, 'ht'], [35, 'ht'], [38, 'ht'], [41, 'tb']],
    [[33, 'bs'], [36, 'bs'], [39, 'bs']],
  ] });
  blit(put, PAL, FACE);
};

export const TRIES: Try[] = [
  { name: 'C - Woodland wolf spider', frames: [{ label: 'static', draw: drawWolfSpider }] },
];
