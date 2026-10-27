function prepareBlobTexture(data) {
  const colors = new Uint8ClampedArray(256 * 64 * 4);
  for (let direction = 0; direction < 256; direction++) {
    const angle = direction / 256 * Math.PI * 2;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    let edge = 30;
    const sourceIndex = radius => (Math.round(31.5 + dy * radius) * 64 + Math.round(31.5 + dx * radius)) * 4;
    while (data[sourceIndex(edge) + 3] === 0) edge -= .25;
    for (let depth = 0; depth < 64; depth++) {
      let radius = edge * depth / 63;
      // Extend the painted surface through gaps between the original round lobes.
      while (data[sourceIndex(radius) + 3] === 0) radius -= .25;
      const src = sourceIndex(radius), dest = (direction * 64 + depth) * 4;
      colors.set(data.subarray(src, src + 4), dest);
    }
  }
  return colors;
}

function deformBlob(texture, angle, squash = 1, air = 0) {
  const width = 96, height = 80, foot = 72;
  const data = new Uint8ClampedArray(width * height * 4);
  const smooth = t => t * t * (3 - 2 * t);
  const phase = angle * 2;
  const bodyHeight = ((35 + 2 * Math.sin(phase + .5)) * (1 - air) + 40 * air) / squash;
  const top = foot - bodyHeight;
  for (let y = Math.floor(top); y < foot; y++) {
    const t = (y + .5 - top) / bodyHeight;
    if (t < 0 || t > 1) continue;
    const footTaper = smooth(Math.max(0, (t - .79) / .21));
    const mound = Math.sqrt(Math.max(0, 1 - ((t - .72) / .72) ** 2)) * (21 + 9 * t) * (1 - .43 * footTaper);
    const drop = 20 * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2)) * (.86 + .25 * t);
    const radius = (mound * (1 - air) + drop * air) * squash;
    const drift = (1 - air) * ((2.6 + 3 * Math.sin(phase)) * (1 - t) ** 1.8 + 1.5 * Math.sin(phase - t * 4) * Math.sin(Math.PI * t));
    const center = 48 + drift;
    const left = radius * (1 + .065 * Math.sin(phase - t * 4)) * (1 - .04 * air);
    const right = radius * (1 + .07 * Math.sin(phase + t * 5 + 1));
    const ny = t * 2 - 1;
    for (let x = Math.ceil(center - left); x < center + right; x++) {
      const nx = (x + .5 - center) / (x < center ? left : right);
      if (Math.abs(nx) > 1) continue;
      const circleX = nx * Math.sqrt(Math.max(0, 1 - ny * ny));
      const radiusInTexture = Math.min(1, Math.hypot(circleX, ny));
      const direction = ((Math.round((Math.atan2(ny, circleX) - angle) / (Math.PI * 2) * 256) % 256) + 256) % 256;
      const src = (direction * 64 + Math.round(radiusInTexture * 63)) * 4;
      const dest = (y * width + x) * 4;
      data.set(texture.subarray(src, src + 4), dest);
    }
  }
  return { data, width, height, foot };
}

module.exports = { prepareBlobTexture, deformBlob };
