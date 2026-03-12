import { Table, TableType } from '../types';
import { COLORS, PIXELS_PER_METER, ROUND_TABLE_DIAMETER, LONG_TABLE_1_WIDTH, LONG_TABLE_1_DEPTH, LONG_TABLE_2_WIDTH, LONG_TABLE_2_DEPTH } from './constants';

export function metersToPixels(meters: number): number {
  return meters * PIXELS_PER_METER;
}

export function pixelsToMeters(pixels: number): number {
  return pixels / PIXELS_PER_METER;
}

export function cmToPixels(cm: number): number {
  return (cm / 100) * PIXELS_PER_METER;
}

export function getTableDimensions(type: TableType): { width: number; height: number } {
  switch (type) {
    case 'round':
      return {
        width: cmToPixels(ROUND_TABLE_DIAMETER),
        height: cmToPixels(ROUND_TABLE_DIAMETER),
      };
    case 'long1':
      return {
        width: cmToPixels(LONG_TABLE_1_WIDTH),
        height: cmToPixels(LONG_TABLE_1_DEPTH),
      };
    case 'long2':
      return {
        width: cmToPixels(LONG_TABLE_2_WIDTH),
        height: cmToPixels(LONG_TABLE_2_DEPTH),
      };
  }
}

export function getSeatPositions(table: Table): Array<{ x: number; y: number; angle?: number }> {
  const { type, seats } = table;
  const positions: Array<{ x: number; y: number; angle?: number }> = [];

  if (type === 'round') {
    const radius = cmToPixels(ROUND_TABLE_DIAMETER / 2);
    const seatRadius = radius + 12;
    for (let i = 0; i < seats; i++) {
      const angle = (i / seats) * 2 * Math.PI - Math.PI / 2;
      positions.push({
        x: Math.cos(angle) * seatRadius,
        y: Math.sin(angle) * seatRadius,
        angle,
      });
    }
  } else {
    const dims = getTableDimensions(type);
    const sideSeats = Math.floor(seats / 2);
    
    for (let i = 0; i < sideSeats; i++) {
      positions.push({
        x: ((i + 0.5) / sideSeats) * dims.width - dims.width / 2,
        y: -dims.height / 2 - 12,
      });
    }
    for (let i = 0; i < sideSeats; i++) {
      positions.push({
        x: ((i + 0.5) / sideSeats) * dims.width - dims.width / 2,
        y: dims.height / 2 + 12,
      });
    }
  }

  return positions;
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function calculateTableDistance(t1: Table, t2: Table): number {
  const dx = t1.position.x - t2.position.x;
  const dy = t1.position.y - t2.position.y;
  const pixelDist = Math.sqrt(dx * dx + dy * dy);
  return pixelsToMeters(pixelDist);
}

export function checkTableOverlap(t1: Table, t2: Table, minDistance: number): boolean {
  const d1 = getTableDimensions(t1.type);
  const d2 = getTableDimensions(t2.type);
  const r1 = Math.max(d1.width, d1.height) / 2;
  const r2 = Math.max(d2.width, d2.height) / 2;
  const minPixelDist = r1 + r2 + metersToPixels(minDistance);
  
  const pixelDist = Math.sqrt(
    Math.pow(t1.position.x - t2.position.x, 2) +
    Math.pow(t1.position.y - t2.position.y, 2)
  );
  
  return pixelDist < minPixelDist;
}

// Re-export COLORS so canvas utilities are self-contained
export { COLORS };
