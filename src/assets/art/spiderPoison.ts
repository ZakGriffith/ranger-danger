import { ellipse, poly, rect, type HdDraw, type HdPut, type RawPut } from './hd';
import { CFG } from '../../config';
import { POISON_SMOKE_FRAME_MS, POISON_SMOKE_RADIUS, POISON_SMOKE_DEPTH } from './poisonSmoke';
export const SPIDER_SMOKE_FRAMES = Array.from({ length: Math.ceil(CFG.infected.spiderPoisonLifetime / POISON_SMOKE_FRAME_MS) }, (_, frame) => frame);
type Point = readonly [
    number,
    number
];
const C = { deep: '#48324f', shade: '#705071', mist: '#a080a0', light: '#ccb0c5', red: '#b65674', coral: '#e18b9d' } as const;
const ROUND: readonly Point[] = [
    [-17, 4], [-18, -2], [-14, -7], [-9, -7], [-7, -12], [-1, -15], [5, -13], [7, -8],
    [13, -8], [17, -3], [16, 2], [19, 6], [14, 11], [7, 10], [2, 14], [-5, 12], [-9, 8], [-14, 9],
];
function pen(raw: RawPut, alpha: number): HdPut {
    return (x, y, color) => { if (color !== null)
        raw(Math.round(x), Math.round(y), color, alpha); };
}
function shape(put: HdPut, points: readonly Point[], x: number, y: number, sx: number, sy: number, color: `#${string}`) {
    poly(put, points.map(([px, py]) => [x + px * sx, y + py * sy]), color);
}
function life(age: number) {
    const spread = 1 - (1 - Math.min(1, age / 280)) ** 3;
    return { spread, alpha: Math.min(1, age / 90) * Math.min(1, (CFG.infected.spiderPoisonLifetime - age) / 650), time: age / 1000 };
}
export function drawSpiderSmoke(age: number, variant = 0): HdDraw {
    return (_put, raw) => {
        if (age <= 0 || age >= CFG.infected.spiderPoisonLifetime)
            return;
        const { spread, alpha, time } = life(age);
        const rx = POISON_SMOKE_RADIUS * spread, ry = rx * POISON_SMOKE_DEPTH;
        const groundRaw: RawPut = (x, y, color, opacity = 1) => {
            const dx = (x - 64) / rx, dy = (y - 74) / ry;
            const distance = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);
            const edge = 1.12 + Math.sin(angle * 5 + time * .7) * .025 + Math.cos(angle * 9 - time * .5) * .015;
            const fade = Math.max(0, Math.min(1, (distance - 1) / (edge - 1)));
            const softness = 1 - fade * fade * (3 - 2 * fade);
            if (softness > 0)
                raw(x, y, color, opacity * softness);
        };
        for (let y = Math.floor(74 - ry * 1.17); y <= 74 + ry * 1.17; y++) {
            for (let x = Math.floor(64 - rx * 1.17); x <= 64 + rx * 1.17; x++)
                groundRaw(x, y, C.mist, alpha * .30);
        }
        const skirts = [[28, 74, 1.15, .9], [98, 74, 1.15, .9], [43, 55, 1.15, .85],
            [83, 55, 1.1, .85], [43, 94, 1.15, .95], [83, 94, 1.15, .95], [64, 81, 1.25, .9]];
        skirts.forEach(([x, y, sx, sy], i) => {
            const px = 64 + (x - 64) * spread + Math.sin(time * 1.3 + i + variant * .25) * 1.4 + Math.sin(i + variant) * variant * .25;
            const py = 74 + (y - 74) * spread + Math.cos(time * 1.5 + i + variant * .25) * 1.1;
            shape(pen(groundRaw, alpha * .36), ROUND, px, py, sx * spread, sy * spread, C.shade);
            shape(pen(groundRaw, alpha * .40), ROUND, px - 1, py - 2, sx * spread * .85, sy * spread * .85, C.mist);
            shape(pen(groundRaw, alpha * .39), [[-15, 3], [-8, 1], [-1, 3], [7, 1], [14, 3], [9, 6], [1, 7], [-6, 5]], px, py + 2, sx * spread, sy * spread, C.red);
        });
        const lobes = [[38, 69, 1], [83, 68, 1.1], [53, 56, 1.02], [72, 53, .94], [64, 72, 1.12], [34, 82, .7], [88, 83, .75]];
        lobes.forEach(([x, y, size], i) => {
            const drift = Math.sin(time * 1.7 + i * 2.1 + variant * .25);
            const px = 64 + (x - 64) * spread + drift * 1.6 + Math.sin(i * 2 + variant) * variant * .35, py = 74 + (y - 74) * spread - Math.sin(time * 2 + i + variant * .2) * 1.5;
            const sx = size * (.3 + .7 * spread), sy = sx * .7;
            shape(pen(raw, alpha * .38), ROUND, px + 1, py + 2, sx, sy, C.deep);
            shape(pen(raw, alpha * .48), ROUND, px, py, sx, sy, C.shade);
            shape(pen(raw, alpha * .48), ROUND, px - 2, py - 3, sx * .78, sy * .75, C.mist);
            shape(pen(raw, alpha * .38), [[-10, 0], [-6, -5], [0, -7], [5, -5], [3, -3], [-2, -4], [-6, 0], [-5, 4], [-8, 3]], px, py, sx, sy, C.light);
            shape(pen(raw, alpha * .46), [[-9, 5], [-2, 3], [4, 5], [9, 3], [8, 7], [2, 9], [-4, 7]], px + 1, py + 3, sx, sy, C.red);
        });
    };
}
