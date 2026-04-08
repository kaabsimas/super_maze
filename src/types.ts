export type CellType = 'wall' | 'floor' | 'player' | 'exit' | 'mud' | 'monster' | 'potion';

export interface Cell {
  type: CellType;
}

export interface Position {
  col: number;
  row: number;
}

export interface MazeData {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  cols: number;
  rows: number;
  cells: CellType[][];   // [row][col]
  playerStart: Position | null;
  exitPos: Position | null;
  playerHitpoints?: number;
  // Monster spawn positions and movement axes (saved separately so the cell
  // under each monster is stored as 'monster' in cells[][])
  monsterSpawns?: { pos: Position; axis: 'h' | 'v'; amplitude: number }[];
}

export type AlgorithmName = 'astar' | 'dijkstra';

export interface AlgorithmStep {
  visited: Set<string>;      // "col,row" keys
  frontier: Set<string>;     // "col,row" keys
  current: Position | null;
  path: Position[] | null;   // populated only on final step
  pathHpLost: number;        // monsters hit along the chosen path
  done: boolean;
  found: boolean;
}

// Runtime monster state (not persisted)
export interface MonsterState {
  col: number;
  row: number;
}

export type ScreenName = 'mainMenu' | 'savedMaps' | 'editor' | 'run';

export interface NavigatePayload {
  mazeId?: string;
  mode?: 'edit' | 'run';
}
