import Phaser from 'phaser';

/**
 * Animates the river surface. Each river chunk carries a flow map (see
 * drawRiverFlowChunk): per texel the distance along the river, the distance
 * across it, the white-water strength and a mask that fades at the banks and
 * under bridge decks. This fragment shader turns that into pale and dark
 * streaks sliding downstream in river-local coordinates, and a finer, faster
 * churn of foam where the water is white. The along coordinate wraps every
 * 256 px, so the noise is made periodic in it and the wrap never shows.
 */
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uMainSampler;
uniform float uTime;
varying vec2 outTexCoord;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// value noise, periodic in x with period px cells
float vnoise(vec2 p, float px) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, px), x1 = mod(i.x + 1.0, px);
  float a = hash(vec2(x0, i.y)), b = hash(vec2(x1, i.y)), c = hash(vec2(x0, i.y + 1.0)), d = hash(vec2(x1, i.y + 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
void main() {
  vec4 m = texture2D(uMainSampler, outTexCoord);
  if (m.a < 0.01) discard;
  float along = m.r;             // 0..1 over one 256 px period
  float across = m.g * 510.0;    // px from the centreline
  float rp = m.b;                // white water 0..1
  // streaks: about 64 px long and 12 px wide, sliding downstream and quicker in white water
  float u = along - uTime * (0.4 + 0.2 * rp);
  float n = 0.65 * vnoise(vec2(u * 4.0, across / 12.0), 4.0) + 0.35 * vnoise(vec2(u * 8.0 + 0.5, across / 6.0 + 3.0), 8.0);
  vec3 col = vec3(0.0);
  float a = 0.0;
  float pale = smoothstep(0.56, 0.70, n);
  float dark = smoothstep(0.44, 0.30, n);
  col = vec3(0.62, 0.85, 0.88) * pale + vec3(0.16, 0.34, 0.50) * dark;
  a = pale * (0.34 + 0.25 * rp) + dark * 0.18;
  // white water: a finer, faster churn whose coverage grows with the strength
  if (rp > 0.02) {
    float u2 = along - uTime * (0.25 + 0.1 * rp);
    float f = 0.6 * vnoise(vec2(u2 * 16.0, across / 6.0), 16.0) + 0.4 * vnoise(vec2(u2 * 32.0 + 0.37, across / 3.0 + 0.3 * across), 32.0);
    float th = 0.76 - 0.14 * rp;
    float fa = smoothstep(th, th + 0.07, f) * 0.8 * min(1.0, rp * 1.4);
    col = mix(col, vec3(0.94, 0.98, 0.97), fa);
    a = max(a, fa);
  }
  gl_FragColor = vec4(col * a, a) * m.a;
}
`;

export class RiverFlowPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  static readonly KEY = 'RiverFlow';
  constructor(game: Phaser.Game) {
    super({ game, name: RiverFlowPipeline.KEY, fragShader: FRAG });
  }
  onPreRender(): void {
    // Every speed below is a multiple of 0.05 periods/s, so the pattern repeats
    // exactly every 20 s; wrapping keeps the uniform small and precise.
    this.set1f('uTime', (this.game.loop.time / 1000) % 20);
  }
}

/** Registers the pipeline once; a no-op on the canvas renderer, where the water stays still. */
export function ensureRiverFlowPipeline(scene: Phaser.Scene): boolean {
  const renderer = scene.game.renderer;
  if (renderer.type !== Phaser.WEBGL) return false;
  const pipelines = (renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines;
  if (!pipelines.has(RiverFlowPipeline.KEY)) pipelines.add(RiverFlowPipeline.KEY, new RiverFlowPipeline(scene.game));
  return true;
}
