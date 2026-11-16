import { Put, P, rect, disc } from './canvas';

// ==================================================================
//  OFF-SCREEN TOWER INDICATORS (32x32 logical → 64 physical)
// ==================================================================
export function drawIndicatorArrow() {
  return (put: Put) => {
    const cx = 16, cy = 16;
    // Dark circle background
    disc(put, cx, cy, 13, P.outline);
    disc(put, cx, cy, 12, P.blueD);
    disc(put, cx, cy, 11, P.blueM);
    // Arrow icon in center
    // shaft
    rect(put, cx - 5, cy - 1, 10, 2, P.arrow);
    rect(put, cx - 5, cy, 10, 1, P.arrowD);
    // arrowhead
    put(cx + 5, cy - 3, P.stone); put(cx + 6, cy - 2, P.stone);
    put(cx + 7, cy - 1, P.stoneL); put(cx + 7, cy, P.stoneL);
    put(cx + 6, cy + 1, P.stone); put(cx + 5, cy + 2, P.stone);
    // fletching
    put(cx - 5, cy - 2, P.white); put(cx - 6, cy - 3, P.white);
    put(cx - 5, cy + 1, P.white); put(cx - 6, cy + 2, P.white);
  };
}

export function drawIndicatorCannon() {
  return (put: Put) => {
    const cx = 16, cy = 16;
    // Dark circle background
    disc(put, cx, cy, 13, P.outline);
    disc(put, cx, cy, 12, '#2a1a0e');
    disc(put, cx, cy, 11, '#3e2a18');
    // Cannonball icon
    disc(put, cx, cy, 5, P.outline);
    disc(put, cx, cy, 4, P.stoneD);
    disc(put, cx, cy, 3, P.stoneM);
    // highlight
    put(cx - 1, cy - 2, P.stone);
    put(cx, cy - 2, P.stoneL);
    put(cx - 2, cy - 1, P.stone);
  };
}

export function drawIndicatorBoss() {
  return (put: Put) => {
    const cx = 16, cy = 16;
    // Red circle background
    disc(put, cx, cy, 13, P.outline);
    disc(put, cx, cy, 12, '#4a0a0a');
    disc(put, cx, cy, 11, '#6a1a1a');
    // Skull icon: cranium
    disc(put, cx, cy - 1, 5, '#e8d8c8');
    disc(put, cx, cy - 2, 4, '#f0e4d4');
    // Eye sockets
    put(cx - 2, cy - 2, P.outline); put(cx - 2, cy - 1, P.outline);
    put(cx + 2, cy - 2, P.outline); put(cx + 2, cy - 1, P.outline);
    // Red eye glow
    put(cx - 2, cy - 2, '#ff3333'); put(cx + 2, cy - 2, '#ff3333');
    // Nose
    put(cx, cy, P.outline);
    // Jaw
    rect(put, cx - 3, cy + 2, 7, 2, '#d8c8b8');
    // Teeth
    put(cx - 2, cy + 2, P.outline); put(cx, cy + 2, P.outline); put(cx + 2, cy + 2, P.outline);
    put(cx - 2, cy + 3, P.outline); put(cx, cy + 3, P.outline); put(cx + 2, cy + 3, P.outline);
  };
}

export function drawIndicatorPointer() {
  return (put: Put) => {
    // 16x16 — small triangle/chevron pointing right
    // Will be rotated at runtime to point toward the tower
    const cx = 8, cy = 8;
    // Triangle pointing right
    for (let row = 0; row < 7; row++) {
      const w = 7 - row;
      for (let col = 0; col < w; col++) {
        const px = cx + col;
        const py = cy - 3 + row;
        if (row === 0 || row === 6 || col >= w - 1) {
          put(px, py, P.outline);
        } else {
          put(px, py, P.white);
        }
      }
    }
  };
}
