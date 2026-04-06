import type { Screen } from './Screen';
import type { AppController } from '../state/AppController';
import {
  CANVAS_W, CANVAS_H, CELL_SIZE, GRID_COLS, GRID_ROWS,
  COLOR_BG, COLOR_TEXT, COLOR_ACCENT, COLOR_TEXT_DIM,
  COLOR_UI_BG, DEBUG_STEP_MS, RUN_STEP_MS,
} from '../constants';
import { drawButton, hitTest, type ButtonRect } from '../ui/button';
import { Grid } from '../grid/Grid';
import { GridRenderer } from '../grid/GridRenderer';
import { getMap } from '../storage';
import { astar } from '../algorithms/astar';
import { dijkstra } from '../algorithms/dijkstra';
import type { AlgorithmName, AlgorithmStep, Position } from '../types';

const TOOLBAR_H = 60;
const GRID_OFFSET_X = (CANVAS_W - GRID_COLS * CELL_SIZE) / 2;
const GRID_OFFSET_Y = TOOLBAR_H + (CANVAS_H - TOOLBAR_H - GRID_ROWS * CELL_SIZE) / 2;

type RunState = 'idle' | 'running' | 'done_found' | 'done_not_found';

export class RunScreen implements Screen {
  private ctx: CanvasRenderingContext2D;
  private app: AppController;
  private renderer: GridRenderer;
  private grid: Grid;
  private mx = 0;
  private my = 0;
  private algorithm: AlgorithmName;
  private debugMode: boolean;
  private mazeId: string;

  private generator: Generator<AlgorithmStep> | null = null;
  private currentStep: AlgorithmStep | null = null;
  private state: RunState = 'idle';
  private lastStepTime = 0;
  private playerPos: Position | null = null;
  private pathIndex = 0;
  private lastMoveTime = 0;
  private totalSteps = 0;
  private stepCount = 0;

  private backBtn: ButtonRect = { x: 20, y: 12, w: 110, h: 36, label: '← Voltar' };
  private restartBtn: ButtonRect = { x: 140, y: 12, w: 100, h: 36, label: '↺ Reiniciar' };
  private pauseBtn: ButtonRect = { x: 250, y: 12, w: 90, h: 36, label: '⏸ Pausa' };
  private paused = false;

  constructor(
    ctx: CanvasRenderingContext2D,
    app: AppController,
    mazeId: string,
    algorithm: AlgorithmName = 'astar',
    debugMode = false
  ) {
    this.ctx = ctx;
    this.app = app;
    this.mazeId = mazeId;
    this.algorithm = algorithm;
    this.debugMode = debugMode;

    const data = getMap(mazeId);
    if (!data) {
      this.grid = Grid.createNew();
    } else {
      this.grid = Grid.fromMazeData(data);
    }

    this.renderer = new GridRenderer(ctx, GRID_OFFSET_X, GRID_OFFSET_Y);
    this.playerPos = this.grid.playerStart ? { ...this.grid.playerStart } : null;
    this.start();
  }

  private start(): void {
    if (!this.grid.playerStart || !this.grid.exitPos) {
      this.state = 'done_not_found';
      return;
    }

    const algo = this.algorithm === 'astar' ? astar : dijkstra;
    this.generator = algo(this.grid, this.grid.playerStart, this.grid.exitPos);
    this.currentStep = null;
    this.state = 'running';
    this.paused = false;
    this.pathIndex = 0;
    this.totalSteps = 0;
    this.stepCount = 0;
    this.playerPos = this.grid.playerStart ? { ...this.grid.playerStart } : null;
    this.lastStepTime = performance.now();
    this.lastMoveTime = performance.now();
  }

  render(dt: number): void {
    const now = performance.now();
    const { ctx } = this;

    // Advance algorithm
    if (this.state === 'running' && !this.paused && this.generator) {
      const interval = this.debugMode ? DEBUG_STEP_MS : 4;
      if (now - this.lastStepTime >= interval) {
        this.lastStepTime = now;
        const result = this.generator.next();
        if (!result.done) {
          this.currentStep = result.value;
          this.stepCount++;
          if (this.currentStep.done) {
            this.totalSteps = this.stepCount;
            if (this.currentStep.found) {
              this.state = 'done_found';
            } else {
              this.state = 'done_not_found';
            }
          }
        }
      }
    }

    // Animate player along path after algorithm finishes
    if (this.state === 'done_found' && this.currentStep?.path) {
      const path = this.currentStep.path;
      if (this.pathIndex < path.length && now - this.lastMoveTime >= RUN_STEP_MS) {
        this.lastMoveTime = now;
        this.playerPos = path[this.pathIndex] ?? this.playerPos;
        this.pathIndex++;
      }
    }

    // Draw
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.renderer.draw(this.grid, {
      step: this.currentStep ?? undefined,
      playerPos: this.playerPos ?? undefined,
    });

    // Toolbar
    ctx.fillStyle = COLOR_UI_BG;
    ctx.fillRect(0, 0, CANVAS_W, TOOLBAR_H);
    ctx.strokeStyle = COLOR_ACCENT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, TOOLBAR_H);
    ctx.lineTo(CANVAS_W, TOOLBAR_H);
    ctx.stroke();

    drawButton(ctx, this.backBtn, hitTest(this.backBtn, this.mx, this.my));
    drawButton(ctx, this.restartBtn, hitTest(this.restartBtn, this.mx, this.my));

    if (this.state === 'running') {
      this.pauseBtn.label = this.paused ? '▶ Continuar' : '⏸ Pausa';
      drawButton(ctx, this.pauseBtn, hitTest(this.pauseBtn, this.mx, this.my));
    }

    // Status info
    const algoLabel = this.algorithm === 'astar' ? 'A*' : 'Dijkstra';
    const debugLabel = this.debugMode ? ' • Debug' : '';
    const stepLabel = this.totalSteps > 0
      ? ` • ${this.totalSteps} iterações`
      : this.stepCount > 0 ? ` • ${this.stepCount} iterações` : '';

    ctx.fillStyle = COLOR_TEXT_DIM;
    ctx.font = '13px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${algoLabel}${debugLabel}${stepLabel}`, CANVAS_W - 16, TOOLBAR_H / 2);

    // Overlay messages
    this.drawStateOverlay();
  }

  private drawStateOverlay(): void {
    const { ctx } = this;

    if (this.state === 'done_not_found') {
      // Dark overlay
      ctx.fillStyle = 'rgba(10,10,26,0.82)';
      ctx.fillRect(
        CANVAS_W / 2 - 240, CANVAS_H / 2 - 70,
        480, 140
      );
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 2;
      ctx.strokeRect(CANVAS_W / 2 - 240, CANVAS_H / 2 - 70, 480, 140);

      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Sem caminho disponível!', CANVAS_W / 2, CANVAS_H / 2 - 20);

      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.font = '15px monospace';
      ctx.fillText(
        'Não há rota da origem até a saída.',
        CANVAS_W / 2,
        CANVAS_H / 2 + 18
      );
      ctx.fillText(
        'Pressione ↺ Reiniciar ou ← Voltar para editar.',
        CANVAS_W / 2,
        CANVAS_H / 2 + 42
      );
      return;
    }

    if (this.state === 'done_found' && this.currentStep?.path) {
      const path = this.currentStep.path;
      const finished = this.pathIndex >= path.length;

      if (finished) {
        ctx.fillStyle = 'rgba(10,10,26,0.82)';
        ctx.fillRect(CANVAS_W / 2 - 220, CANVAS_H / 2 - 60, 440, 120);
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2;
        ctx.strokeRect(CANVAS_W / 2 - 220, CANVAS_H / 2 - 60, 440, 120);

        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Saída encontrada! 🎉', CANVAS_W / 2, CANVAS_H / 2 - 16);

        ctx.fillStyle = COLOR_TEXT_DIM;
        ctx.font = '14px monospace';
        ctx.fillText(
          `Caminho: ${path.length - 1} passos • ${this.totalSteps} iterações`,
          CANVAS_W / 2,
          CANVAS_H / 2 + 18
        );
        ctx.fillText(
          'Pressione ↺ Reiniciar ou ← Voltar',
          CANVAS_W / 2,
          CANVAS_H / 2 + 42
        );
      }
    }
  }

  onMouseMove(x: number, y: number): void {
    this.mx = x;
    this.my = y;
  }

  onMouseDown(_x: number, _y: number, _button: number): void {}

  onMouseUp(x: number, y: number, _button: number): void {
    if (hitTest(this.backBtn, x, y)) {
      this.app.navigateTo('editor', { mazeId: this.mazeId, mode: 'edit' });
    } else if (hitTest(this.restartBtn, x, y)) {
      this.start();
    } else if (hitTest(this.pauseBtn, x, y) && this.state === 'running') {
      this.paused = !this.paused;
    }
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.app.navigateTo('editor', { mazeId: this.mazeId, mode: 'edit' });
    } else if (e.key === ' ') {
      this.paused = !this.paused;
    } else if (e.key === 'r' || e.key === 'R') {
      this.start();
    }
  }

  dispose(): void {
    this.generator = null;
  }
}
