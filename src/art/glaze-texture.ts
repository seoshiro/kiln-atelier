/** Original 512px glaze study, filled in place without changing its pixel arithmetic. */
export function fillGlazePixels(data: Uint8ClampedArray, color: { r: number; g: number; b: number }): void {
  const red = Math.pow(color.r, 1 / 2.2) * 255;
  const green = Math.pow(color.g, 1 / 2.2) * 255;
  const blue = Math.pow(color.b, 1 / 2.2) * 255;
  let seed = 3271;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let y = 0; y < 512; y++) {
    const wheel = Math.sin(y * .76) * .009 + Math.sin(y * .163) * .012;
    const drift = Math.sin(y * .014) * 1.5;
    for (let x = 0; x < 512; x++) {
      const noise = (random() - .5) * .105;
      const brush = Math.sin(x * .037 + drift) * .022;
      const wash = .88 + noise + wheel + brush;
      const i = (y * 512 + x) * 4;
      data[i] = Math.min(255, red * wash);
      data[i + 1] = Math.min(255, green * wash);
      data[i + 2] = Math.min(255, blue * wash);
      data[i + 3] = 255;
    }
  }
}
