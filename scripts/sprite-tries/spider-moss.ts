import { line, rect, type HdDraw, type HdPut } from '../../src/assets/art/hd';
import { blit, type Palette, type Part } from '../../src/assets/art/pixels';

const PAL: Palette = {
  o: '#23251e',
  d: '#35452c',
  s: '#4e6037',
  m: '#718447',
  h: '#98a75c',
  l: '#b7c17b',
  c: '#e4d99d',
  q: '#b9ad76',
  b: '#49372c',
  n: '#69503a',
  w: '#927047',
  t: '#ba9560',
  e: '#eaa94c',
  f: '#ffe5a4',
};

type Point = readonly [number, number];

function leg(put: HdPut, root: Point, knee: Point, tip: Point, near: boolean) {
  const width = near ? 4 : 3;
  line(put, ...root, ...knee, PAL.b, width);
  line(put, ...knee, ...tip, PAL.b, near ? 3 : 2);
  line(put, root[0], root[1] - 1, knee[0], knee[1] - 1, near ? PAL.w : PAL.n, width - 1);
  line(put, knee[0], knee[1] - 1, tip[0], tip[1] - 1, near ? PAL.n : PAL.b, near ? 2 : 1);
  if (near) {
    const mid: Point = [Math.round((root[0] + knee[0]) / 2), Math.round((root[1] + knee[1]) / 2)];
    line(put, mid[0], mid[1] - 2, knee[0] - 1, knee[1] - 2, PAL.t);
    rect(put, knee[0] - 1, knee[1] - 1, 2, 2, PAL.w);
    rect(put, tip[0] - 1, tip[1], 3, 1, PAL.o);
  }
}

const ABDOMEN: Part = { y0: 20, rows: [
  [[18, 'sssssssss']],
  [[15, 'sshhhhhhhhhhss']],
  [[13, 'shhllllllllhhhss']],
  [[12, 'shhllllllhhhhhhhss']],
  [[11, 'shhlllhhhhhmmmmmmmss']],
  [[11, 'shhllhhhhmmmmmmmmmmss']],
  [[10, 'shhlhhhmmmmmmmmmmmmmms']],
  [[10, 'shhhhhmmmmmmmmmmmmmmss']],
  [[10, 'shhhhmmmmmmmmmmmmmmsss']],
  [[10, 'shhhmmmmmmmmmmmmmmssss']],
  [[10, 'ssmmmmmmmmmmmmmmmsssss']],
  [[10, 'dsmmmmmmmmmmmmmmssssss']],
  [[11, 'dssmmmmmmmmmmmsssssss']],
  [[11, 'dsssmmmmmmmsssssssss']],
  [[12, 'ddssssssssssssssssd']],
  [[13, 'ddssssssssssssssdd']],
  [[14, 'dddsssssssssssddd']],
  [[16, 'ddddssssssdddd']],
  [[19, 'ddddddddd']],
] };

const LEAF: Part = { y0: 23, rows: [
  [[23, 'cc']],
  [[21, 'cccc']],
  [[19, 'ccccccq']],
  [[18, 'cccqccq']],
  [[18, 'ccqmccq']],
  [[19, 'ccqcccq']],
  [[20, 'ccqccq']],
  [[21, 'ccqcq']],
  [[22, 'cqq']],
  [[23, 'qq']],
  [[24, 'q']],
] };

const THORAX: Part = { y0: 27, rows: [
  [[34, 'nnnnnn']],
  [[32, 'nwwwwwwwnn']],
  [[31, 'nwwtttwwwwnn']],
  [[31, 'nwwttwwwwwwwn']],
  [[30, 'nnwwwwwwwwwwwn']],
  [[30, 'bnwwwwwwwwwwwn']],
  [[30, 'bnnwwwwwwwwnnnn']],
  [[31, 'bnnnwwwwwnnnnn']],
  [[31, 'bbnnnwwnnnnnnb']],
  [[32, 'bbnnnnnnnnnnb']],
  [[33, 'bbbnnnnnnbbb']],
  [[35, 'bbbbbbbb']],
] };

const FACE: Part = { y0: 30, rows: [
  [[44, 'nnnn']],
  [[44, 'wwwwnn']],
  [[44, 'wtwwwwn']],
  [[44, 'wnwnwwn']],
  [[44, 'nbbebbwn']],
  [[44, 'nnbefbwn']],
  [[44, 'nnnbbbbn']],
  [[44, 'bnnnnnn']],
  [[44, 'bbnnnnb']],
  [[45, 'bqbbqb']],
  [[45, 'bcbbc']],
  [[46, 'b..b']],
] };

export const drawMossSpider: HdDraw = (put, raw) => {
  for (let y = 49; y <= 54; y++) {
    const inset = Math.abs(y - 52) * 3;
    for (let x = 10 + inset; x < 60 - inset; x++) raw(x, y, '#152019', 0.22);
  }

  leg(put, [34, 30], [25, 18], [17, 27], false);
  leg(put, [37, 29], [37, 16], [29, 23], false);
  leg(put, [40, 30], [48, 20], [53, 29], false);
  leg(put, [43, 32], [55, 28], [60, 38], false);

  blit(put, PAL, ABDOMEN);
  blit(put, PAL, LEAF);
  rect(put, 29, 32, 5, 4, PAL.b);
  blit(put, PAL, THORAX);

  leg(put, [33, 36], [21, 41], [11, 51], true);
  leg(put, [36, 37], [31, 45], [25, 55], true);
  leg(put, [39, 37], [44, 46], [42, 56], true);
  leg(put, [42, 35], [53, 41], [57, 53], true);

  rect(put, 33, 35, 2, 2, PAL.t);
  rect(put, 36, 36, 2, 2, PAL.w);
  rect(put, 39, 36, 2, 2, PAL.w);
  rect(put, 42, 34, 2, 2, PAL.t);
  blit(put, PAL, FACE);
};

export const TRIES: { name: string; frames: { label: string; draw: HdDraw }[] }[] = [
  { name: 'B Moss orb-weaver', frames: [{ label: 'static concept', draw: drawMossSpider }] },
];
