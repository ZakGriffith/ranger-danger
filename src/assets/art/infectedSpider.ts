import { ellipse, poly, rect, type HdDraw, type HdPut, type Paint } from './hd';
type Point = readonly [
    number,
    number
];
const C = {
    edge: '#302a38', deep: '#46384d', shade: '#604c66', hide: '#82677f', light: '#a888a0',
    rim: '#c2a1b5', belly: '#766373', far: '#504153', farLight: '#786075',
    boilEdge: '#502838', boilShade: '#812f46', blood: '#b64659', coral: '#df7880',
    blisterGlint: '#f2b0a8', glint: '#f1dba6', fangShade: '#a7987f', fang: '#ded2b1', eye: '#edae66',
} as const;
function segment(put: HdPut, a: Point, b: Point, width: number, color: Paint) {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = (b[1] - a[1]) / length * width / 2, ny = (a[0] - b[0]) / length * width / 2;
    poly(put, [[a[0] - nx, a[1] - ny], [a[0] + nx, a[1] + ny], [b[0] + nx * .65, b[1] + ny * .65], [b[0] - nx * .65, b[1] - ny * .65]], color);
}
function drawLeg(put: HdPut, root: Point, knee: Point, toe: Point, far: boolean) {
    segment(put, root, knee, 6, C.edge);
    segment(put, knee, toe, 4, C.edge);
    segment(put, [root[0], root[1] - 1], [knee[0], knee[1] - 1], 3, far ? C.far : C.hide);
    segment(put, [knee[0], knee[1] - 1], [toe[0], toe[1] - 1], 2, far ? C.farLight : C.light);
    ellipse(put, knee[0], knee[1], 2, 2, far ? C.far : C.shade);
    put(knee[0] - 1, knee[1] - 1, far ? C.farLight : C.rim);
    rect(put, toe[0], toe[1], 3, 1, C.edge);
}
function blister(put: HdPut, x: number, y: number, r: number) {
    ellipse(put, x, y, r + 1, r, C.boilEdge);
    ellipse(put, x, y - 1, r, r - 1, C.boilShade);
    ellipse(put, x - 1, y - 2, r - 1, Math.max(1, r - 2), C.blood);
    ellipse(put, x - 1, y - 3, Math.max(1, r - 2), 1, C.coral);
    put(x - 2, y - 3, C.blisterGlint);
}
export const INFECTED_SPIDER_MOVE_FRAMES = Array.from({ length: 16 }, (_, i) => `move${i}`);
export const INFECTED_SPIDER_ATTACK_FRAMES = Array.from({ length: 8 }, (_, i) => `atk${i}`);
export const INFECTED_SPIDER_FRAMES = [...INFECTED_SPIDER_MOVE_FRAMES, ...INFECTED_SPIDER_ATTACK_FRAMES];
export const INFECTED_SPIDER_MOVE_FPS = 28;
export const INFECTED_SPIDER_ATTACK_FPS = 10;
const STRIKE = [
    [-1, -1, 1, 0], [-2, -2, 3, 1], [-2, -3, 5, 2],
    [2, -1, 3, 2], [3, 0, 0, 0], [2, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0],
] as const;
export function drawInfectedSpider(frame: string): HdDraw {
    return output => {
        const moving = frame.startsWith('move');
        const index = Number(frame.slice(moving ? 4 : 3));
        const phase = moving ? index / INFECTED_SPIDER_MOVE_FRAMES.length : 0;
        const [shift, rise, lift, gape] = moving ? [0, Math.round(Math.sin(phase * Math.PI * 4) * .6), 0, 0] : STRIKE[index];
        const put: HdPut = (x, y, color) => output(x + shift, y + rise, color);
        let legIndex = 0;
        const leg = (root: Point, knee: Point, toe: Point, far: boolean) => {
            const index = legIndex++ % 4;
            let swing = 0, footLift = 0;
            if (moving) {
                const step = (phase + (index % 2) * .5 + (far ? .5 : 0)) % 1;
                if (step < .6)
                    swing = 3 - 6 * step / .6;
                else {
                    const recovery = (step - .6) / .4;
                    swing = -3 + 6 * recovery;
                    footLift = Math.sin(recovery * Math.PI) * 3;
                }
            }
            else if (index >= 2) {
                swing = shift;
                footLift = lift * (far ? .6 : 1);
            }
            drawLeg(output, [root[0] + shift, root[1] + rise], [knee[0] + shift * .5 + swing * .4, knee[1] + rise * .5 - footLift * .4], [toe[0] + swing, toe[1] - footLift], far);
        };
        leg([29, 30], [18, 24], [8, 35], true);
        leg([35, 29], [30, 21], [25, 35], true);
        leg([40, 30], [43, 22], [49, 34], true);
        leg([45, 32], [54, 26], [56, 38], true);
        poly(put, [[6, 27], [8, 20], [13, 15], [21, 12], [29, 13], [35, 17], [38, 23], [38, 31], [34, 38], [27, 42], [18, 42], [10, 38], [6, 33]], C.edge);
        poly(put, [[8, 27], [10, 21], [15, 17], [21, 14], [28, 15], [33, 18], [36, 24], [36, 30], [32, 36], [26, 40], [18, 40], [12, 36], [8, 32]], C.hide);
        poly(put, [[9, 29], [15, 31], [21, 30], [26, 32], [32, 28], [35, 25], [36, 30], [32, 36], [26, 40], [18, 40], [12, 36], [9, 32]], C.shade);
        poly(put, [[11, 24], [15, 19], [21, 16], [26, 16], [30, 18], [31, 21], [26, 23], [22, 22], [18, 25], [13, 27], [10, 27]], C.light);
        poly(put, [[14, 21], [18, 18], [22, 16], [26, 17], [24, 19], [20, 19], [16, 22]], C.rim);
        poly(put, [[13, 34], [18, 36], [24, 35], [29, 34], [32, 33], [29, 37], [24, 39], [18, 38]], C.deep);
        poly(put, [[15, 29], [19, 27], [23, 28], [24, 30], [21, 31], [18, 30], [15, 31]], C.shade);
        rect(put, 17, 28, 3, 1, C.hide);
        blister(put, 13, 21, 4);
        blister(put, 23, 15, 4);
        blister(put, 30, 22, 4);
        blister(put, 9, 30, 3);
        blister(put, 24, 32, 3);
        poly(put, [[20, 20], [21, 22], [20, 25], [18, 27], [19, 24], [19, 21]], C.deep);
        poly(put, [[31, 28], [33, 29], [31, 32], [29, 33], [30, 30]], C.deep);
        poly(put, [[34, 27], [40, 25], [46, 27], [51, 32], [52, 38], [48, 43], [40, 44], [33, 41], [30, 35], [31, 30]], C.edge);
        poly(put, [[35, 29], [40, 27], [45, 29], [49, 33], [50, 37], [47, 41], [40, 42], [35, 39], [32, 35], [33, 31]], C.shade);
        poly(put, [[35, 30], [39, 28], [44, 29], [47, 32], [43, 33], [39, 32], [35, 34], [33, 33]], C.hide);
        poly(put, [[36, 30], [40, 29], [43, 30], [41, 31], [37, 32]], C.light);
        poly(put, [[35, 36], [39, 35], [43, 37], [45, 40], [41, 41], [36, 39]], C.deep);
        leg([33, 36], [20, 34], [9, 47], false);
        leg([37, 39], [29, 37], [24, 51], false);
        leg([42, 39], [43, 37], [45, 51], false);
        leg([47, 36], [54, 35], [56, 47], false);
        poly(put, [[44, 32], [49, 31], [54, 34], [55, 39], [51, 43], [45, 42], [42, 38]], C.edge);
        poly(put, [[45, 33], [49, 33], [52, 35], [53, 38], [50, 41], [46, 40], [44, 37]], C.hide);
        poly(put, [[45, 35], [48, 34], [52, 35], [53, 37], [50, 38], [46, 38]], C.deep);
        rect(put, 46, 35, 2, 2, C.eye);
        rect(put, 50, 35, 2, 2, C.eye);
        put(46, 35, C.glint);
        put(50, 35, C.glint);
        put(45, 33, C.eye);
        put(49, 32, C.eye);
        put(52, 33, C.eye);
        const fangPut: HdPut = (x, y, color) => put(x + (x < 49 ? -gape : gape), y, color);
        poly(fangPut, [[45, 39], [48, 39], [48, 43], [46, 46], [44, 44]], C.fangShade);
        poly(fangPut, [[45, 39], [47, 39], [47, 42], [45, 44]], C.fang);
        poly(fangPut, [[50, 39], [53, 38], [55, 42], [53, 45], [50, 44], [52, 42]], C.fangShade);
        poly(fangPut, [[51, 39], [53, 39], [54, 42], [52, 44], [53, 41]], C.fang);
    };
}
