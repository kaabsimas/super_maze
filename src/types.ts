export type CellType = 'wall' | 'floor' | 'player' | 'exit';

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
}

export type AlgorithmName = 'astar' | 'dijkstra';

export interface AlgorithmStep {
  visited: Set<string>;      // "col,row" keys
  frontier: Set<string>;     // "col,row" keys
  current: Position | null;
  path: Position[] | null;   // populated only on final step
  done: boolean;
  found: boolean;
}

export type ScreenName = 'mainMenu' | 'savedMaps' | 'editor' | 'run';

export interface NavigatePayload {
  mazeId?: string;
  mode?: 'edit' | 'run';
}
