import { poly as fillPolygon, type HdDraw, type HdPut, type Paint } from './hd';
import { drawIroncapHeavy } from './ironcapIdle';

export const IRONCAP_SIZE = 96;
export const IRONCAP_FOOT_Y = 76;
export const IRONCAP_ANCHOR_X = 48;
export const IRONCAP_ORIGIN_Y = 60 / IRONCAP_SIZE;
export const IRONCAP_MOVE_FRAMES = Array.from({ length: 24 }, (_, i) => `move${i}`);
export const IRONCAP_ATTACK_FRAMES = Array.from({ length: 24 }, (_, i) => `atk${i}`);
export const IRONCAP_MOVE_FPS = 24;
export const IRONCAP_ATTACK_FPS = 24;
export const IRONCAP_IMPACT_FRAME = 12;
export const IRONCAP_FRAMES = ['idle', ...IRONCAP_MOVE_FRAMES, ...IRONCAP_ATTACK_FRAMES, 'hit'];

const C = {
  edge: '#27252f', deep: '#35313f', shade: '#49414f', hide: '#625561',
  light: '#7b6b77', ridge: '#97858d',
  plateDeep: '#5c5c62', plateShade: '#7c7c7c', plate: '#a5a49a',
  plateLight: '#c9c7b6', ivory: '#e6e1ca', glint: '#f5efd8',
  rustDeep: '#684333', rust: '#a26643', rustLight: '#c98d59',
  eye: '#efbb64', eyeLight: '#ffe1a0',
} as const;


type Point = readonly [number, number];
type MapPoint = (x: number, y: number) => Point;
type Limb = { shoulder: Point; elbow: Point; hand: Point };
type Pose = {
  torso: MapPoint;
  head: MapPoint;
  nearLeg: MapPoint;
  farLeg: MapPoint;
  nearArm: MapPoint;
  farArm: MapPoint;
};
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const blend = (a: Point, b: Point, t: number): Point => [mix(a[0], b[0], t), mix(a[1], b[1], t)];

function painter(output: HdPut, map: MapPoint) {
  const vertex = (x: number, y: number): Point => {
    const [px, py] = map(x, y);
    return [Math.round(px + 16), Math.round(py + 16)];
  };
  const put: HdPut = (x, y, paint) => {
    const [px, py] = vertex(x, y);
    output(px, py, paint);
  };
  const poly = (_put: HdPut, points: readonly Point[], paint: Paint | null) =>
    fillPolygon(output, points.map(([x, y]) => vertex(x, y)), paint);
  const rect = (_put: HdPut, x: number, y: number, w: number, h: number, paint: Paint | null) =>
    poly(put, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], paint);
  const ellipse = (_put: HdPut, cx: number, cy: number, rx: number, ry: number, paint: Paint | null) =>
    poly(put, Array.from({ length: 16 }, (_, i): Point => {
      const angle = i * Math.PI / 8;
      return [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry];
    }), paint);
  return { put, poly, rect, ellipse };
}
type Painter = ReturnType<typeof painter>;

function torsoMap(dx: number, dy: number, lean: number, compression = 1): MapPoint {
  return (x, y) => [x + dx + (42 - y) * lean, 42 + (y - 42) * compression + dy];
}

function limbMap(reference: Limb, posed: Limb): MapPoint {
  return (x, y) => {
    const upper = y <= reference.elbow[1];
    const a = upper ? reference.shoulder : reference.elbow;
    const b = upper ? reference.elbow : reference.hand;
    const pa = upper ? posed.shoulder : posed.elbow;
    const pb = upper ? posed.elbow : posed.hand;
    const t = (y - a[1]) / (b[1] - a[1]);
    const center = blend(pa, pb, t);
    const offset = x - mix(a[0], b[0], t);
    const upperNormal: Point = [posed.elbow[1] - posed.shoulder[1], posed.shoulder[0] - posed.elbow[0]];
    const lowerNormal: Point = [posed.hand[1] - posed.elbow[1], posed.elbow[0] - posed.hand[0]];
    const normalAt = smooth((y - reference.elbow[1] + 3) / 6);
    const normal = blend(upperNormal, lowerNormal, normalAt);
    const length = Math.hypot(normal[0], normal[1]);
    return [center[0] + offset * normal[0] / length, center[1] + offset * normal[1] / length];
  };
}
const NEAR_ARM: Limb = { shoulder: [18, 24], elbow: [14, 38], hand: [13, 50] };
const FAR_ARM: Limb = { shoulder: [47, 24], elbow: [50, 35], hand: [52, 48] };

function legMap(near: boolean, torso: MapPoint, footX: number, lift: number): MapPoint {
  const hipY = 40, kneeY = near ? 49 : 48, ankleY = near ? 57 : 55;
  const hipX = near ? 26 : 38;
  const [hx, hy] = torso(hipX, hipY);
  const hip: Point = [hx - hipX, hy - hipY];
  const knee: Point = [footX * .5 - lift * .32, lift * -.55 + hip[1] * .45];
  const foot: Point = [footX, -lift];
  return (x, y) => {
    const offset = y < kneeY
      ? blend(hip, knee, clamp((y - hipY) / (kneeY - hipY)))
      : blend(knee, foot, clamp((y - kneeY) / (ankleY - kneeY)));
    return [x + offset[0], y + offset[1]];
  };
}

function step(phase: number): Point {
  const p = ((phase % 1) + 1) % 1;
  if (p < .62) return [mix(4.5, -4.5, p / .62), 0];
  const swing = (p - .62) / .38;
  return [mix(-4.5, 4.5, smooth(swing)), Math.sin(swing * Math.PI) * 4.5];
}

function movingPose(frame: number): Pose {
  const phase = frame / 24, a = phase * Math.PI * 2;
  const near = step(phase), far = step(phase + .5);
  const torso = torsoMap(Math.sin(a) * .8, -.5 + Math.cos(a * 2) * .55, Math.sin(a) * .025);
  const nearShoulder = torso(...NEAR_ARM.shoulder);
  const farShoulder = torso(...FAR_ARM.shoulder);
  return {
    torso,
    head: torsoMap(Math.sin(a - .4) * .65, -.3 + Math.cos(a * 2 - .35) * .45, Math.sin(a - .3) * .022),
    nearLeg: legMap(true, torso, near[0], near[1]),
    farLeg: legMap(false, torso, far[0], far[1]),
    nearArm: limbMap(NEAR_ARM, { shoulder: nearShoulder, elbow: [14 - near[0] * .45, 38 + nearShoulder[1] - 24], hand: [13 - near[0] * .9, 50 - Math.abs(near[0]) * .13] }),
    farArm: limbMap(FAR_ARM, { shoulder: farShoulder, elbow: [50 - far[0] * .4, 35 + farShoulder[1] - 24], hand: [52 - far[0] * .75, 48 - Math.abs(far[0]) * .1] }),
  };
}

// The long windup and recovery give the strike weight without a jump or full-body spin.
const ATTACK_POSES = [
  [0, 0, 0, 0, 14, 38, 13, 50, 0],
  [3, -1, -.5, -.025, 10, 32, 5, 40, .5],
  [6, -1.5, -1, -.04, 7, 23, 1, 17, 1],
  [8, -1.5, -1, -.05, 8, 18, 8, 4, 1],
  [9, -.5, -1, .01, 19, 12, 23, -3, 1],
  [10, 1, 0, .05, 28, 17, 38, 8, 1],
  [11, 2.5, 1, .09, 35, 25, 49, 24, 1],
  [12, 3, 2.5, .12, 32, 39, 47, 41, 1],
  [14, 3.5, 3, .10, 29, 40, 44, 46, 1],
  [16, 2.5, 2, .08, 27, 39, 39, 46, 1],
  [19, 1, 1, .035, 21, 37, 27, 50, .5],
  [23, 0, 0, 0, 14, 38, 13, 50, 0],
] as const;

function attackingPose(frame: number): Pose {
  let next = 1;
  while (next < ATTACK_POSES.length - 1 && ATTACK_POSES[next][0] < frame) next++;
  const a = ATTACK_POSES[next - 1], b = ATTACK_POSES[next];
  const t = smooth((frame - a[0]) / (b[0] - a[0]));
  const pose = a.map((v, i) => mix(v, b[i], t));
  const [, dx, dy, lean, ex, ey, hx, hy, brace] = pose;
  const torso = torsoMap(dx, dy, lean, 1 - brace * .025);
  return {
    torso,
    head: torsoMap(dx * .8, dy * .72, lean * .7, 1 - brace * .02),
    nearLeg: legMap(true, torso, -3 * brace, 0),
    farLeg: legMap(false, torso, 3 * brace, 0),
    nearArm: limbMap(NEAR_ARM, { shoulder: torso(...NEAR_ARM.shoulder), elbow: [ex, ey], hand: [hx, hy] }),
    farArm: limbMap(FAR_ARM, { shoulder: torso(...FAR_ARM.shoulder), elbow: [50 + dx * .4, 35 + dy], hand: [52 - brace * 3, 48 - brace] }),
  };
}

function drawFarLeg(p: Painter) {
  const { put, poly, rect } = p;
  poly(put, [[32, 39], [43, 39], [45, 45], [43, 52], [49, 55], [49, 58],
    [35, 58], [33, 55], [35, 48]], C.edge);
  poly(put, [[34, 41], [41, 41], [42, 45], [40, 53], [47, 55], [47, 57],
    [36, 57], [35, 54], [37, 47]], C.shade);
  poly(put, [[35, 42], [39, 42], [39, 48], [37, 53], [42, 54], [39, 55],
    [36, 54], [38, 47]], C.hide);
  rect(put, 42, 56, 2, 1, C.plateShade);
  rect(put, 46, 56, 2, 1, C.plateShade);
}

function drawFarArm(p: Painter) {
  const { put, poly, rect } = p;
  poly(put, [[43, 21], [49, 20], [55, 25], [56, 31], [54, 36], [57, 44],
    [57, 49], [54, 52], [48, 51], [46, 48], [47, 42], [45, 36], [43, 31]], C.edge);
  poly(put, [[45, 23], [49, 22], [53, 26], [54, 31], [51, 35], [54, 43],
    [55, 48], [53, 50], [49, 49], [48, 46], [49, 42], [47, 35], [45, 30]], C.shade);
  poly(put, [[46, 24], [49, 23], [52, 27], [51, 31], [48, 34], [46, 30]], C.hide);
  poly(put, [[49, 37], [51, 37], [52, 43], [51, 46], [49, 45]], C.hide);
  rect(put, 50, 47, 2, 2, C.plateShade);
  rect(put, 53, 47, 1, 2, C.plateShade);
}

function drawTorso(p: Painter) {
  const { put, poly, rect } = p;
  poly(put, [[19, 16], [27, 11], [35, 11], [42, 14], [48, 20], [49, 29],
    [44, 35], [43, 42], [38, 47], [27, 47], [20, 42], [17, 35], [15, 26]], C.edge);
  poly(put, [[20, 18], [28, 13], [35, 13], [41, 16], [46, 21], [47, 28],
    [42, 34], [41, 41], [37, 45], [28, 45], [22, 40], [19, 34], [17, 26]], C.hide);
  poly(put, [[35, 17], [41, 18], [46, 23], [45, 29], [40, 34], [40, 41],
    [36, 44], [29, 43], [27, 38], [32, 33], [32, 25]], C.shade);
  poly(put, [[23, 25], [29, 23], [34, 26], [33, 31], [29, 34], [24, 32]], C.light);
  poly(put, [[24, 27], [29, 25], [31, 26], [30, 29], [26, 30]], C.ridge);
  poly(put, [[35, 27], [40, 25], [44, 28], [40, 32], [35, 32]], C.hide);
  poly(put, [[28, 34], [32, 33], [35, 35], [34, 40], [29, 41], [27, 38]], C.deep);
  poly(put, [[28, 34], [31, 34], [31, 37], [28, 38]], C.hide);
  poly(put, [[35, 35], [40, 34], [39, 39], [35, 41]], C.deep);
  rect(put, 29, 42, 8, 1, C.hide);
}

function drawNearLeg(p: Painter) {
  const { put, poly, rect } = p;
  poly(put, [[21, 39], [30, 39], [34, 44], [32, 50], [31, 55], [35, 57],
    [35, 60], [20, 60], [18, 57], [21, 51], [19, 45]], C.edge);
  poly(put, [[22, 41], [29, 41], [32, 45], [30, 50], [29, 56], [33, 58],
    [33, 59], [21, 59], [20, 57], [23, 51], [21, 45]], C.hide);
  poly(put, [[23, 42], [27, 42], [29, 45], [27, 49], [26, 54], [22, 56],
    [24, 49], [22, 46]], C.light);
  poly(put, [[28, 45], [31, 45], [29, 52], [29, 56], [32, 58], [26, 58],
    [26, 54]], C.shade);
  poly(put, [[23, 43], [27, 43], [28, 45], [25, 47], [23, 46]], C.ridge);
  rect(put, 22, 56, 6, 1, C.light);
  rect(put, 27, 58, 2, 1, C.plate);
  rect(put, 31, 58, 2, 1, C.plate);
}

function drawNearArm(p: Painter) {
  const { put, poly, rect } = p;
  poly(put, [[15, 21], [23, 23], [25, 31], [22, 37], [20, 42], [20, 49],
    [18, 54], [10, 55], [7, 52], [8, 44], [11, 38], [10, 32]], C.edge);
  poly(put, [[16, 23], [21, 24], [23, 30], [20, 37], [18, 42], [18, 49],
    [17, 52], [11, 53], [9, 51], [10, 45], [13, 38], [12, 32]], C.hide);
  poly(put, [[15, 25], [18, 25], [20, 29], [18, 34], [15, 37], [13, 34]], C.light);
  poly(put, [[14, 27], [17, 26], [18, 28], [16, 32], [14, 32]], C.ridge);
  poly(put, [[20, 30], [22, 31], [19, 38], [17, 43], [17, 49], [15, 51],
    [12, 51], [14, 47], [14, 41], [16, 36]], C.shade);
  poly(put, [[12, 39], [15, 38], [15, 42], [13, 46], [10, 48]], C.light);
  rect(put, 10, 49, 3, 3, C.plateShade);
  rect(put, 14, 49, 3, 3, C.plateShade);
  rect(put, 10, 49, 3, 1, C.plateLight);
  rect(put, 14, 49, 3, 1, C.plate);
}

function drawNearShoulder(p: Painter) {
  const { put, poly, rect } = p;
  poly(put, [[14, 16], [20, 11], [27, 9], [31, 11], [32, 15], [29, 20],
    [24, 24], [18, 25], [13, 23], [11, 20]], C.edge);
  poly(put, [[15, 17], [21, 12], [27, 10], [30, 12], [30, 15], [27, 19],
    [23, 22], [18, 23], [13, 21]], C.plateShade);
  poly(put, [[15, 17], [21, 12], [27, 11], [29, 12], [27, 16], [23, 19],
    [18, 20], [13, 20]], C.plateLight);
  poly(put, [[16, 16], [21, 12], [26, 11], [28, 12], [23, 14], [19, 17]], C.ivory);
  rect(put, 21, 12, 4, 1, C.glint);
}

function drawNearArmPlate(p: Painter) {
  const { put, poly } = p;
  poly(put, [[11, 22], [17, 21], [22, 23], [24, 27], [22, 30], [17, 31],
    [12, 28], [10, 25]], C.edge);
  poly(put, [[12, 23], [17, 22], [21, 24], [22, 27], [20, 29], [16, 29],
    [12, 27], [11, 25]], C.plate);
  poly(put, [[12, 23], [17, 22], [20, 24], [17, 25], [13, 25]], C.ivory);
  poly(put, [[13, 27], [18, 27], [21, 26], [21, 28], [18, 29], [15, 28]], C.plateShade);
}

function drawTopPlate(p: Painter) {
  const { put, poly } = p;
  poly(put, [[28, 10], [33, 8], [39, 9], [42, 12], [41, 16], [36, 19],
    [29, 19], [26, 16]], C.edge);
  poly(put, [[29, 11], [33, 9], [38, 10], [40, 12], [39, 15], [35, 17],
    [29, 17], [27, 15]], C.plate);
  poly(put, [[29, 11], [33, 9], [37, 10], [39, 12], [34, 13], [29, 15],
    [28, 14]], C.plateLight);
  poly(put, [[30, 11], [34, 10], [37, 11], [33, 11], [30, 13]], C.ivory);
  poly(put, [[30, 15], [35, 14], [39, 13], [38, 15], [34, 17], [30, 17]], C.plateShade);
}

function drawFarShoulder(p: Painter) {
  const { put, poly } = p;
  poly(put, [[41, 14], [46, 13], [51, 16], [54, 21], [54, 25], [50, 28],
    [44, 26], [41, 22]], C.edge);
  poly(put, [[42, 16], [46, 14], [50, 17], [52, 21], [52, 24], [49, 26],
    [45, 24], [42, 21]], C.plateShade);
  poly(put, [[42, 16], [46, 14], [49, 17], [50, 21], [46, 22], [43, 20]], C.plateLight);
  poly(put, [[43, 16], [46, 15], [48, 17], [46, 18], [43, 18]], C.ivory);
}

function drawFarArmPlate(p: Painter) {
  const { put, poly, rect } = p;
  poly(put, [[48, 23], [53, 23], [56, 26], [55, 30], [51, 33], [47, 30],
    [46, 27]], C.edge);
  poly(put, [[48, 24], [52, 24], [54, 26], [54, 29], [51, 31], [48, 29],
    [47, 27]], C.plateShade);
  poly(put, [[48, 24], [51, 24], [53, 26], [50, 28], [47, 27]], C.plate);
  rect(put, 48, 24, 3, 1, C.plateLight);
}

function drawHead(p: Painter) {
  const { put, poly, rect } = p;
  poly(put, [[33, 16], [39, 15], [44, 17], [47, 21], [47, 26], [44, 30],
    [38, 30], [34, 27], [32, 22]], C.edge);
  poly(put, [[34, 17], [39, 16], [43, 18], [45, 21], [45, 25], [43, 28],
    [38, 28], [35, 25], [34, 21]], C.shade);
  poly(put, [[35, 18], [39, 17], [42, 18], [43, 20], [39, 21], [36, 23]], C.hide);
  poly(put, [[35, 18], [39, 17], [42, 19], [38, 19], [36, 21]], C.light);
  poly(put, [[38, 21], [42, 20], [46, 21], [45, 23], [40, 24], [37, 23]], C.deep);
  rect(put, 40, 22, 2, 1, C.eye);
  put(40, 22, C.eyeLight);
  put(45, 22, C.eye);
  poly(put, [[43, 23], [47, 23], [48, 25], [46, 27], [42, 27], [40, 25]], C.hide);
  rect(put, 44, 23, 3, 1, C.light);
  rect(put, 42, 27, 4, 1, C.deep);
  put(44, 27, C.plateShade);
}

function drawRust(p: Painter) {
  const { put, poly, rect, ellipse } = p;
  ellipse(put, 21, 19, 3, 2, C.rustDeep);
  poly(put, [[19, 18], [22, 18], [23, 19], [21, 20], [19, 20]], C.rust);
  rect(put, 20, 18, 2, 1, C.rustLight);
  poly(put, [[25, 30], [27, 31], [27, 34], [25, 35], [24, 33]], C.rustDeep);
  rect(put, 25, 31, 1, 2, C.rust);
  poly(put, [[36, 13], [38, 13], [38, 15], [36, 16]], C.plateDeep);

}

export function drawIroncap(frame: string): HdDraw {
  if (frame === 'idle' || frame === 'hit' || frame === 'atk0' || frame === 'atk23') return (put, raw) => drawIroncapHeavy((x, y, paint) => put(x + 16, y + 16, paint), (x, y, color, alpha) => raw(x + 16, y + 16, color, alpha));
  const pose = frame.startsWith('atk') ? attackingPose(Number(frame.slice(3))) : movingPose(Number(frame.slice(4)));
  return output => {
    const pixels: (Paint | null)[] = Array(IRONCAP_SIZE * IRONCAP_SIZE).fill(null);
    const put: HdPut = (x, y, paint) => { pixels[y * IRONCAP_SIZE + x] = paint; };
    drawFarLeg(painter(put, pose.farLeg));
    drawFarArm(painter(put, pose.farArm));
    drawTorso(painter(put, pose.torso));
    drawNearLeg(painter(put, pose.nearLeg));
    drawNearArm(painter(put, pose.nearArm));
    drawNearShoulder(painter(put, pose.torso));
    drawNearArmPlate(painter(put, pose.nearArm));
    drawTopPlate(painter(put, pose.torso));
    drawFarShoulder(painter(put, pose.torso));
    drawFarArmPlate(painter(put, pose.farArm));
    drawHead(painter(put, pose.head));
    drawRust(painter(put, pose.torso));
    const armDetail = painter(put, pose.nearArm);
    armDetail.rect(armDetail.put, 17, 26, 2, 1, C.plateDeep);

    // Snapped edges can enclose a one-pixel pinhole where two bent polygons meet.
    // Preserve larger openings between limbs while sealing only fully surrounded gaps.
    const sealed = pixels.slice();
    for (let y = 1; y < IRONCAP_SIZE - 1; y++) for (let x = 1; x < IRONCAP_SIZE - 1; x++) {
      const i = y * IRONCAP_SIZE + x;
      if (pixels[i] !== null) continue;
      const neighbors = [pixels[i - 1], pixels[i + 1], pixels[i - IRONCAP_SIZE], pixels[i + IRONCAP_SIZE]];
      if (neighbors.every(color => color !== null)) {
        sealed[i] = neighbors.find(color => neighbors.filter(other => color === other).length > 1) ?? neighbors[2];
      }
    }
    for (let y = 0; y < IRONCAP_SIZE; y++) for (let x = 0; x < IRONCAP_SIZE; x++) {
      const paint = sealed[y * IRONCAP_SIZE + x];
      if (paint !== null) output(x, y, paint);
    }
  };
}
