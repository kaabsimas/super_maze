import type { Position } from '../types';

export function posKey(p: Position): string {
  return `${p.col},${p.row}`;
}

export function parseKey(key: string): Position {
  const [col, row] = key.split(',').map(Number);
  return { col: col ?? 0, row: row ?? 0 };
}

export function heuristic(a: Position, b: Position): number {
  // Manhattan distance
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

export function reconstructPath(
  cameFrom: Map<string, string>,
  start: Position,
  end: Position
): Position[] {
  const path: Position[] = [];
  let current = posKey(end);
  const startKey = posKey(start);

  while (current !== startKey) {
    path.unshift(parseKey(current));
    const prev = cameFrom.get(current);
    if (!prev) break;
    current = prev;
  }
  path.unshift(start);
  return path;
}

/** Minimal binary-heap priority queue */
export class MinHeap<T> {
  private heap: { priority: number; value: T }[] = [];

  push(value: T, priority: number): void {
    this.heap.push({ priority, value });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0]!;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top.value;
  }

  get size(): number {
    return this.heap.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent]!.priority <= this.heap[i]!.priority) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i]!, this.heap[parent]!];
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.heap[l]!.priority < this.heap[smallest]!.priority) smallest = l;
      if (r < n && this.heap[r]!.priority < this.heap[smallest]!.priority) smallest = r;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest]!, this.heap[i]!];
      i = smallest;
    }
  }
}
