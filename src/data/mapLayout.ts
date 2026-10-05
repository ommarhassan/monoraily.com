import { stations } from './network';
import { westNile } from './westNile';

/** Schematic map canvas size (SVG viewBox units). */
export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 640;

/** One [x, y] per station, in the same order as the East Nile line. Edit these to re-shape the map. */
const eastNileCoordinates: [number, number][] = [
  [70, 120],
  [135, 113],
  [199, 107],
  [264, 106],
  [328, 118],
  [387, 145],
  [440, 182],
  [485, 228],
  [516, 286],
  [543, 344],
  [582, 397],
  [625, 445],
  [675, 487],
  [735, 510],
  [800, 511],
  [860, 490],
  [902, 441],
  [925, 380],
  [928, 316],
  [913, 253],
  [892, 191],
  [870, 130],
];

export const stationPositions = new Map<string, [number, number]>();
stations.forEach((station, index) => {
  stationPositions.set(station.id, eastNileCoordinates[index]);
});

/**
 * West Nile line (under construction): schematic route in the free lower-left area.
 * One [x, y] per station, in line order (New October first, Wadi El Nile last).
 */
const westNileCoordinates: [number, number][] = [
  [60, 590],
  [120, 590],
  [180, 590],
  [240, 586],
  [295, 572],
  [343, 548],
  [383, 516],
  [410, 476],
  [420, 430],
  [418, 384],
  [404, 340],
  [380, 302],
  [345, 270],
];

/** Kept separate from `stationPositions`: the West Nile line is for information only (no routing or booking). */
export const westNilePositions = new Map<string, [number, number]>();
westNile.stations.forEach((station, index) => {
  westNilePositions.set(station.name, westNileCoordinates[index]);
});
