import { GRID_COLS, GRID_ROWS, COST_FLOOR, COST_MUD, COST_MONSTER } from '../constants';
import type { CellType, MazeData, Position } from '../types';
import { generateId } from '../storage';

export interface MonsterSpawn {
  pos: Position;
  axis: 'h' | 'v';
  amplitude: number;
}

export class Grid {
  cols: number;
  rows: number;
  cells: CellType[][];
  playerStart: Position | null = null;
  exitPos: Position | null = null;
  playerHitpoints = 3;
  monsterSpawns: MonsterSpawn[] = [];

  constructor(cols = GRID_COLS, rows = GRID_ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => 'floor' as CellType)
    );
  }

  getCell(col: number, row: number): CellType | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.cells[row]?.[col] ?? null;
  }

  setCell(col: number, row: number, type: CellType): void {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    const rowArr = this.cells[row];
    if (!rowArr) return;

    // If we're overwriting a monster cell, remove its spawn entry
    if (this.cells[row]?.[col] === 'monster') {
      this.monsterSpawns = this.monsterSpawns.filter(
        m => !(m.pos.col === col && m.pos.row === row)
      );
    }

    // Clear previous player/exit if reassigning
    if (type === 'player') {
      if (this.playerStart) {
        const r = this.cells[this.playerStart.row];
        if (r) r[this.playerStart.col] = 'floor';
      }
      this.playerStart = { col, row };
    } else if (type === 'exit') {
      if (this.exitPos) {
        const r = this.cells[this.exitPos.row];
        if (r) r[this.exitPos.col] = 'floor';
      }
      this.exitPos = { col, row };
    } else if (type === 'monster') {
      // Add spawn with default axis; alternates h/v each placement for variety
      const axis: 'h' | 'v' = this.monsterSpawns.length % 2 === 0 ? 'h' : 'v';
      this.monsterSpawns.push({ pos: { col, row }, axis, amplitude: 3 });
      if (this.playerStart?.col === col && this.playerStart?.row === row) this.playerStart = null;
      if (this.exitPos?.col === col && this.exitPos?.row === row) this.exitPos = null;
    } else {
      // Clearing a special cell
      if (this.playerStart?.col === col && this.playerStart?.row === row) {
        this.playerStart = null;
      }
      if (this.exitPos?.col === col && this.exitPos?.row === row) {
        this.exitPos = null;
      }
    }

    rowArr[col] = type;
  }

  fill(type: CellType): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.cells[r]![c] = type;
      }
    }
    if (type !== 'player') this.playerStart = null;
    if (type !== 'exit') this.exitPos = null;
    if (type !== 'monster') this.monsterSpawns = [];
  }

  isWalkable(col: number, row: number): boolean {
    const cell = this.getCell(col, row);
    return cell === 'floor' || cell === 'player' || cell === 'exit'
        || cell === 'mud'   || cell === 'monster';
  }

  /** Cost to enter a cell (used by pathfinding algorithms). */
  cellCost(col: number, row: number): number {
    const cell = this.getCell(col, row);
    if (cell === 'mud')     return COST_MUD;
    if (cell === 'monster') return COST_MONSTER;
    return COST_FLOOR;
  }

  /** HP damage taken when entering a cell (1 for monster, 0 otherwise). */
  cellHpCost(col: number, row: number): number {
    return this.getCell(col, row) === 'monster' ? 1 : 0;
  }

  neighbors(pos: Position): { pos: Position; cost: number }[] {
    const dirs = [
      { col: 0, row: -1 },
      { col: 0, row: 1 },
      { col: -1, row: 0 },
      { col: 1, row: 0 },
    ];
    return dirs
      .map(d => ({ col: pos.col + d.col, row: pos.row + d.row }))
      .filter(p => this.isWalkable(p.col, p.row))
      .map(p => ({ pos: p, cost: this.cellCost(p.col, p.row) }));
  }

  toMazeData(id: string, name: string): MazeData {
    return {
      id,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      cols: this.cols,
      rows: this.rows,
      cells: this.cells.map(row => [...row]),
      playerStart: this.playerStart ? { ...this.playerStart } : null,
      exitPos: this.exitPos ? { ...this.exitPos } : null,
      playerHitpoints: this.playerHitpoints,
      monsterSpawns: this.monsterSpawns.map(m => ({
        pos: { ...m.pos },
        axis: m.axis,
        amplitude: m.amplitude,
      })),
    };
  }

  static fromMazeData(data: MazeData): Grid {
    const grid = new Grid(data.cols, data.rows);
    grid.cells = data.cells.map(row => [...row]);
    grid.playerStart = data.playerStart ? { ...data.playerStart } : null;
    grid.exitPos = data.exitPos ? { ...data.exitPos } : null;
    grid.playerHitpoints = data.playerHitpoints ?? 3;
    grid.monsterSpawns = (data.monsterSpawns ?? []).map(m => ({
      pos: { ...m.pos },
      axis: m.axis,
      amplitude: m.amplitude,
    }));
    return grid;
  }

  static createNew(): Grid {
    return new Grid(GRID_COLS, GRID_ROWS);
  }

  clone(): Grid {
    const g = new Grid(this.cols, this.rows);
    g.cells = this.cells.map(row => [...row]);
    g.playerStart = this.playerStart ? { ...this.playerStart } : null;
    g.exitPos = this.exitPos ? { ...this.exitPos } : null;
    g.playerHitpoints = this.playerHitpoints;
    g.monsterSpawns = this.monsterSpawns.map(m => ({ pos: { ...m.pos }, axis: m.axis, amplitude: m.amplitude }));
    return g;
  }
}
