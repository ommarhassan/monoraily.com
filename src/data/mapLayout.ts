import { stations } from './network';

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
