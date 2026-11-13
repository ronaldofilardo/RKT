// ---------------------------------------------------------------------------
// SVG radar geometry
// ---------------------------------------------------------------------------
export const SIZE = 260;
export const CX = SIZE / 2;
export const CY = SIZE / 2;
export const R = 95;
export const LEVELS = 4;

export function polarToXY(angle: number, radius: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

export function polygonPoints(values: number[], r: number) {
  return values
    .map((v, i) => {
      const { x, y } = polarToXY((360 / values.length) * i, (v / 100) * r);
      return `${x},${y}`;
    })
    .join(' ');
}
