import { Put, P, rect } from './canvas';

// ==================================================================
//  ARROW (32x32)
// ==================================================================
export function drawArrow(frame: 0|1) {
  return (put: Put) => {
    const cy = 16;
    // shaft — shortened so total length is ~18 logical px (back at x=2, tip at x=19)
    rect(put, 4, cy - 1, 10, 1, P.arrowD);
    rect(put, 4, cy, 10, 1, P.arrow);
    rect(put, 4, cy + 1, 10, 1, P.arrowD);

    // head (diamond) — shifted left by 8
    put(14, cy, P.steel);
    put(15, cy - 1, P.steel); put(15, cy, P.steel); put(15, cy + 1, P.steel);
    put(16, cy - 2, P.steel); put(16, cy - 1, P.white); put(16, cy, P.steel); put(16, cy + 1, P.white); put(16, cy + 2, P.steel);
    put(17, cy - 1, P.steel); put(17, cy, P.steel); put(17, cy + 1, P.steel);
    put(18, cy, P.steelD);
    // head outline
    put(15, cy - 2, P.outline); put(15, cy + 2, P.outline);
    put(17, cy - 2, P.outline); put(17, cy + 2, P.outline);
    put(19, cy, P.outline);

    // fletching — unchanged; back at x=2 preserves existing nocked-arrow offsets
    put(3, cy - 2, P.white); put(4, cy - 2, P.white); put(5, cy - 2, P.white);
    put(3, cy + 2, P.white); put(4, cy + 2, P.white); put(5, cy + 2, P.white);
    put(2, cy - 1, P.red); put(2, cy, P.redD); put(2, cy + 1, P.red);
    put(6, cy - 2, P.redD); put(6, cy + 2, P.redD);

    if (frame === 1) {
      put(19, cy - 1, P.sparkL);
      put(20, cy, P.sparkL);
      put(19, cy + 1, P.sparkL);
    }
  };
}

// BOULDER (32x32) — mossy rock thrown by forest boss
export function drawBoulder(frame: 0|1) {
  return (put: Put) => {
    const cx = 16, cy = 16, r = 7;
    // Craggy rock body
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const dist = Math.sqrt(dx * dx + dy * dy) / r;
        let color: string;
        if (dist < 0.3) color = '#8a8078';
        else if (dist < 0.6) color = '#6a6058';
        else color = '#4a4038';
        // Rotate detail slightly per frame
        const rx = frame === 0 ? dx : dx + 1;
        if ((rx + dy) % 5 === 0) color = '#5a5048';
        put(cx + dx, cy + dy, color);
      }
    }
    // Outline
    for (let dy = -(r+1); dy <= r+1; dy++)
      for (let dx = -(r+1); dx <= r+1; dx++) {
        const d2 = dx*dx + dy*dy;
        if (d2 > (r+1)*(r+1) || d2 <= r*r) continue;
        put(cx + dx, cy + dy, P.outline);
      }
    // Highlight upper-left
    put(cx-3, cy-3, '#aaa098'); put(cx-2, cy-4, '#b0a898');
    put(cx-4, cy-2, '#9a9088');
    if (frame === 0) put(cx-3, cy-4, '#c0b8a8');
    else put(cx-2, cy-3, '#c0b8a8');
    // Moss patches
    put(cx+2, cy-3, P.leafM); put(cx+3, cy-2, P.leaf);
    put(cx-1, cy+3, P.leafM); put(cx+1, cy+4, P.leafD);
    // Cracks
    put(cx+1, cy, '#3a3028'); put(cx+1, cy+1, '#3a3028');
    put(cx-2, cy+1, '#3a3028');
  };
}

export function drawBoulderShadow() {
  return (put: Put) => {
    const cx = 16, cy = 16;
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -5; dx <= 5; dx++) {
        const nx = dx / 5, ny = dy / 3;
        if (nx * nx + ny * ny <= 1) put(cx + dx, cy + dy, P.outline);
      }
  };
}

// Cannonball shadow (32x32) — simple dark ellipse
export function drawCannonballShadow() {
  return (put: Put) => {
    const cx = 16, cy = 16;
    // Ellipse: wider than tall
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const nx = dx / 4, ny = dy / 2;
        if (nx * nx + ny * ny <= 1) {
          put(cx + dx, cy + dy, P.outline);
        }
      }
    }
  };
}
