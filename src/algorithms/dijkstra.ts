import type { AlgorithmStep, Position } from '../types';
import type { Grid } from '../grid/Grid';
import { posKey, reconstructPath, MinHeap } from './utils';

export function* dijkstra(grid: Grid, start: Position, end: Position): Generator<AlgorithmStep> {
  const pq = new MinHeap<string>();
  const cameFrom = new Map<string, string>();
  const dist = new Map<string, number>();
  const visited = new Set<string>();
  const frontier = new Set<string>();

  const startKey = posKey(start);
  const endKey = posKey(end);

  dist.set(startKey, 0);
  pq.push(startKey, 0);
  frontier.add(startKey);

  while (pq.size > 0) {
    const currentKey = pq.pop()!;
    frontier.delete(currentKey);

    if (visited.has(currentKey)) continue;
    visited.add(currentKey);

    const [colStr, rowStr] = currentKey.split(',');
    const current: Position = { col: Number(colStr), row: Number(rowStr) };

    if (currentKey === endKey) {
      const path = reconstructPath(cameFrom, start, end);
      yield {
        visited: new Set(visited),
        frontier: new Set(frontier),
        current,
        path,
        done: true,
        found: true,
      };
      return;
    }

    yield {
      visited: new Set(visited),
      frontier: new Set(frontier),
      current,
      path: null,
      done: false,
      found: false,
    };

    const currentDist = dist.get(currentKey) ?? Infinity;

    for (const neighbor of grid.neighbors(current)) {
      const nKey = posKey(neighbor);
      if (visited.has(nKey)) continue;

      const newDist = currentDist + 1;
      const prevDist = dist.get(nKey) ?? Infinity;

      if (newDist < prevDist) {
        dist.set(nKey, newDist);
        cameFrom.set(nKey, currentKey);
        pq.push(nKey, newDist);
        frontier.add(nKey);
      }
    }
  }

  yield {
    visited: new Set(visited),
    frontier: new Set(),
    current: null,
    path: null,
    done: true,
    found: false,
  };
}
