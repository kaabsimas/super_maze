import {
  CELL_SIZE,
  COLOR_WALL, COLOR_FLOOR, COLOR_EXIT,
  COLOR_PLAYER, COLOR_VISITED, COLOR_FRONTIER, COLOR_PATH,
  PLAYER_EMOJI,
} from '../constants';
import type { AlgorithmStep, Position } from '../types';
import type { Grid } from './Grid';

export interface RenderOverlay {
  step?: AlgorithmStep;
  playerPos?: Position;   // animated player position during run
}

export class GridRenderer {
  private ctx: CanvasRenderingContext2D;
  private offsetX: number;
  private offsetY: number;

  constructor(ctx: CanvasRenderingContext2D, offsetX = 0, offsetY = 0) {
    this.ctx = ctx;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  draw(grid: Grid, overlay: RenderOverlay = {}): void {
    const { ctx, offsetX, offsetY } = this;
    const { step, playerPos } = overlay;

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const x = offsetX + col * CELL_SIZE;
        const y = offsetY + row * CELL_SIZE;
        const cell = grid.cells[row]?.[col] ?? 'floor';
        const key = `${col},${row}`;

        // Base cell color
        let color: string;
        if (cell === 'wall') {
          color = COLOR_WALL;
        } else if (cell === 'exit') {
          color = COLOR_EXIT;
        } else if (cell === 'player') {
          color = COLOR_FLOOR;
        } else {
          color = COLOR_FLOOR;
        }

        // Algorithm overlay
        if (step && cell !== 'wall') {
          if (step.path && step.path.some(p => p.col === col && p.row === row)) {
            color = COLOR_PATH;
          } else if (step.visited.has(key)) {
            color = COLOR_VISITED;
          } else if (step.frontier.has(key)) {
            color = COLOR_FRONTIER;
          }
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        // Cell border
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

        // Exit marker
        if (cell === 'exit') {
          ctx.fillStyle = '#ffffff';
          ctx.font = `${CELL_SIZE * 0.65}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        }
      }
    }

    // Draw player — animated position overrides grid cell
    const pPos = playerPos ?? grid.playerStart;
    if (pPos) {
      this.drawPlayer(pPos.col, pPos.row);
    }
  }

  private drawPlayer(col: number, row: number): void {
    const { ctx, offsetX, offsetY } = this;
    const x = offsetX + col * CELL_SIZE;
    const y = offsetY + row * CELL_SIZE;

    // Background circle
    ctx.fillStyle = COLOR_PLAYER;
    ctx.beginPath();
    ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Emoji
    ctx.font = `${CELL_SIZE * 0.6}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PLAYER_EMOJI, x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 1);
  }

  cellAt(canvasX: number, canvasY: number): { col: number; row: number } | null {
    const col = Math.floor((canvasX - this.offsetX) / CELL_SIZE);
    const row = Math.floor((canvasY - this.offsetY) / CELL_SIZE);
    return { col, row };
  }

  setOffset(x: number, y: number): void {
    this.offsetX = x;
    this.offsetY = y;
  }
}
