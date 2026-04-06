import type { AlgorithmStep, Position } from '../types';
import type { Grid } from '../grid/Grid';
import { posKey, heuristic, reconstructPath, MinHeap } from './utils';

export function* astar(grid: Grid, start: Position, end: Position): Generator<AlgorithmStep> {
  const openSet = new MinHeap<string>();
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const visited = new Set<string>();
  const frontier = new Set<string>();

  const startKey = posKey(start);
  const endKey = posKey(end);

  gScore.set(startKey, 0);
  openSet.push(startKey, heuristic(start, end));
  frontier.add(startKey);

  while (openSet.size > 0) {
    const currentKey = openSet.pop()!;
    frontier.delete(currentKey);

    if (currentKey === endKey) {
      const path = reconstructPath(cameFrom, start, end);
      yield {
        visited: new Set(visited),
        frontier: new Set(frontier),
        current: end,
        path,
        done: true,
        found: true,
      };
      return;
    }

    visited.add(currentKey);
    const [colStr, rowStr] = currentKey.split(',');
    const current: Position = { col: Number(colStr), row: Number(rowStr) };

    yield {
      visited: new Set(visited),
      frontier: new Set(frontier),
      current,
      path: null,
      done: false,
      found: false,
    };

    const currentG = gScore.get(currentKey) ?? Infinity;

    for (const neighbor of grid.neighbors(current)) {
      const nKey = posKey(neighbor);
      if (visited.has(nKey)) continue;

      const tentativeG = currentG + 1;
      const prevG = gScore.get(nKey) ?? Infinity;

      if (tentativeG < prevG) {
        cameFrom.set(nKey, currentKey);
        gScore.set(nKey, tentativeG);
        const f = tentativeG + heuristic(neighbor, end);
        openSet.push(nKey, f);
        frontier.add(nKey);
      }
    }
  }

  // No path found
  yield {
    visited: new Set(visited),
    frontier: new Set(),
    current: null,
    path: null,
    done: true,
    found: false,
  };
}
