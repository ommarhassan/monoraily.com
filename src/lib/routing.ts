import { fareForStops, MINUTES_PER_STOP } from '../data/fares';
import { linePaths, stations, type LineId } from '../data/network';

export type Route = {
  /** Every station on the way, start to finish. */
  names: string[];
  /** Line used for each hop (length = names.length - 1). */
  lines: LineId[];
  stops: number;
  transfers: number;
  minutes: number;
  /** Full-price fare. Use `fareForStops(route.stops, 'half')` for the half ticket. */
  fare: number;
};

type Edge = { to: string; line: LineId };

const graph = new Map<string, Edge[]>(stations.map((station) => [station.id, []]));
for (const path of linePaths) {
  for (let i = 1; i < path.names.length; i++) {
    graph.get(path.names[i - 1])!.push({ to: path.names[i], line: path.line });
    graph.get(path.names[i])!.push({ to: path.names[i - 1], line: path.line });
  }
}

type SearchNode = {
  station: string;
  line: LineId | null;
  cost: number;
  names: string[];
  lines: LineId[];
  transfers: number;
};

const TRANSFER_PENALTY = 100;

/**
 * Finds the best route: fewest transfers first, then fewest stops.
 * With a single line it is simply the stations in between, but the search
 * already supports interchanges for when a second line is added.
 */
export function planRoute(from: string, to: string): Route | null {
  if (!graph.has(from) || !graph.has(to) || from === to) return null;

  const queue: SearchNode[] = [{ station: from, line: null, cost: 0, names: [from], lines: [], transfers: 0 }];
  const bestCost = new Map<string, number>();

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;
    const key = `${current.station}:${current.line}`;
    if ((bestCost.get(key) ?? Infinity) <= current.cost) continue;
    bestCost.set(key, current.cost);

    if (current.station === to) {
      const stops = current.lines.length;
      return {
        names: current.names,
        lines: current.lines,
        stops,
        transfers: current.transfers,
        minutes: Math.round(stops * MINUTES_PER_STOP + current.transfers * 5),
        fare: fareForStops(stops),
      };
    }

    for (const edge of graph.get(current.station)!) {
      const isTransfer = current.line !== null && current.line !== edge.line ? 1 : 0;
      const cost = current.cost + 1 + isTransfer * TRANSFER_PENALTY;
      if (cost < (bestCost.get(`${edge.to}:${edge.line}`) ?? Infinity)) {
        queue.push({
          station: edge.to,
          line: edge.line,
          cost,
          names: [...current.names, edge.to],
          lines: [...current.lines, edge.line],
          transfers: current.transfers + isTransfer,
        });
      }
    }
  }
  return null;
}
