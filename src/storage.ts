import type { MazeData } from './types';

const STORAGE_KEY = 'super_maze_maps';

export function loadMaps(): MazeData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MazeData[];
  } catch {
    return [];
  }
}

export function saveMap(map: MazeData): void {
  try {
    const maps = loadMaps();
    const idx = maps.findIndex(m => m.id === map.id);
    if (idx >= 0) {
      maps[idx] = map;
    } else {
      maps.push(map);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
  } catch (e) {
    console.warn('Super Maze: failed to save map', e);
  }
}

export function deleteMap(id: string): void {
  try {
    const maps = loadMaps().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
  } catch (e) {
    console.warn('Super Maze: failed to delete map', e);
  }
}

export function getMap(id: string): MazeData | null {
  return loadMaps().find(m => m.id === id) ?? null;
}

export function generateId(): string {
  return `maze_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
