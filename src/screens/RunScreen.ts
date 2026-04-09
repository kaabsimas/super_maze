import type { Screen } from './Screen';
import type { AppController } from '../state/AppController';
import {
  CANVAS_W, CANVAS_H, CELL_SIZE, GRID_COLS, GRID_ROWS,
  COLOR_BG, COLOR_ACCENT, COLOR_TEXT_DIM,
  COLOR_UI_BG, DEBUG_STEP_MS, RUN_STEP_MS,
} from '../constants';
import { drawButton, hitTest, type ButtonRect } from '../ui/button';
import { Grid } from '../grid/Grid';
import { GridRenderer } from '../grid/GridRenderer';
import { getMap } from '../storage';
import { astar } from '../algorithms/astar';
import { dijkstra } from '../algorithms/dijkstra';
import type { AlgorithmName, AlgorithmStep, MonsterState, Position } from '../types';
import { t } from '../i18n/index';

const TOOLBAR_H = 60;
// Center the grid horizontally and vertically in the available space
const GRID_OFFSET_X = Math.floor((CANVAS_W - GRID_COLS * CELL_SIZE) / 2);
const GRID_OFFSET_Y = TOOLBAR_H + Math.floor((CANVAS_H - TOOLBAR_H - GRID_ROWS * CELL_SIZE) / 2);

type RunState = 'idle' | 'running' | 'done_found' | 'done_not_found' | 'done_caught';

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

  // Treasure pathfinding - store calculated path segments
  private pathSegments: Position[][] = [];
  private hasTreasures = false;

  // Monsters
  private monsters: MonsterState[] = [];

  // Player HP
  private maxHp = 3;
  private currentHp = 3;

  private backBtn: ButtonRect = { x: 20, y: 12, w: 110, h: 36, label: '' };
  private restartBtn: ButtonRect = { x: 140, y: 12, w: 100, h: 36, label: '' };
  private pauseBtn: ButtonRect = { x: 250, y: 12, w: 90, h: 36, label: '' };
  private paused = false;

  constructor(
    ctx: CanvasRenderingContext2D,
    app: AppController,
    mazeId: string,
    algorithm: AlgorithmName = 'astar',
    debugMode = false,
    playerHitpoints?: number,
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

    // HP override from editor settings takes priority, then grid data
    const hp = playerHitpoints ?? this.grid.playerHitpoints;
    this.maxHp = hp;
    this.currentHp = hp;
    this.grid.playerHitpoints = hp;

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
    this.currentStep = null;
    this.state = 'running';
    this.paused = false;
    this.pathIndex = 0;
    this.totalSteps = 0;
    this.stepCount = 0;
    this.pathSegments = [];
    this.playerPos = this.grid.playerStart ? { ...this.grid.playerStart } : null;
    this.lastStepTime = performance.now();
    this.lastMoveTime = performance.now();
    this.currentHp = this.maxHp;

    // Initialise monsters from grid spawn data (static positions)
    this.monsters = this.grid.monsterSpawns.map(s => ({
      col: s.pos.col,
      row: s.pos.row,
    }));

    // Check if there are treasures to collect
    const treasures = this.grid.treasures ?? [];
    console.log('🎯 START: treasures.length =', treasures.length);
    this.hasTreasures = treasures.length > 0;
    if (treasures.length > 0) {
      // Build path segments for each treasure
      console.log('🎯 Building treasure path segments...');
      this.buildTreasurePathSegments(algo);
      console.log('🎯 After buildTreasurePathSegments: pathSegments.length =', this.pathSegments.length);
    }

    if (this.debugMode) {
      // Debug: Create a generator that shows each treasure segment, then final path
      if (treasures.length > 0) {
        // For treasures: show step-by-step calculation of each segment
        // But also pre-calculate segments so we can use them later for animation
        this.generator = this.createDebugGeneratorForTreasures(algo);
      } else {
        // No treasures, use normal path from start to exit
        this.generator = algo(this.grid, this.grid.playerStart, this.grid.exitPos);
      }
    } else {
      // Normal: run algorithm to completion immediately, store only the final path
      this.generator = null;
      
      if (this.pathSegments.length > 0) {
        // Use treasure path segments
        this.combineTreasureSegments();
      } else {
        // Direct path from start to exit
        const gen = algo(this.grid, this.grid.playerStart, this.grid.exitPos);
        let last: AlgorithmStep | null = null;
        let count = 0;
        for (const step of gen) {
          last = step;
          count++;
          if (step.done) break;
        }
        this.totalSteps = count;
        this.currentStep = last;
      }

      if (this.currentStep?.found) {
        this.state = 'done_found';
      } else {
        this.state = 'done_not_found';
      }
    }
  }

  private buildTreasurePathSegments(algo: typeof astar | typeof dijkstra): void {
    const treasures = this.grid.treasures!;
    console.log('📍 buildTreasurePathSegments: treasures =', treasures);
    let currentPos = this.grid.playerStart!;
    const collected = new Set<string>();

    // Process treasures in order of closest proximity
    while (collected.size < treasures.length) {
      let nearestTreasure: Position | null = null;
      let minDist = Infinity;

      // Find closest uncollected treasure
      for (const treasure of treasures) {
        const key = `${treasure.col},${treasure.row}`;
        if (collected.has(key)) continue;
        const dist = Math.abs(currentPos.col - treasure.col) + Math.abs(currentPos.row - treasure.row);
        if (dist < minDist) {
          minDist = dist;
          nearestTreasure = treasure;
        }
      }

      if (!nearestTreasure) break;

      console.log(`📍 Seeking treasure at (${nearestTreasure.col},${nearestTreasure.row}) from (${currentPos.col},${currentPos.row})`);

      // Try to find path to this treasure
      const gen = algo(this.grid, currentPos, nearestTreasure);
      let lastStep: AlgorithmStep | null = null;
      for (const step of gen) {
        lastStep = step;
        if (step.done) break;
      }

      // Record this segment
      if (lastStep?.found && lastStep?.path) {
        console.log(`📍 Found path to treasure: ${lastStep.path.length} steps`);
        this.pathSegments.push(lastStep.path);
        currentPos = nearestTreasure;
      } else {
        console.log(`📍 NO PATH to treasure at (${nearestTreasure.col},${nearestTreasure.row})`);
      }
      collected.add(`${nearestTreasure.col},${nearestTreasure.row}`);
    }

    // Add final segment to exit
    console.log(`📍 Seeking exit at (${this.grid.exitPos!.col},${this.grid.exitPos!.row}) from (${currentPos.col},${currentPos.row})`);
    const gen = algo(this.grid, currentPos, this.grid.exitPos!);
    let lastStep: AlgorithmStep | null = null;
    for (const step of gen) {
      lastStep = step;
      if (step.done) break;
    }
    if (lastStep?.found && lastStep?.path) {
      console.log(`📍 Found path to exit: ${lastStep.path.length} steps`);
      this.pathSegments.push(lastStep.path);
    } else {
      console.log(`📍 NO PATH to exit`);
    }
    console.log('📍 Total segments:', this.pathSegments.length);
  }

  private *createDebugGeneratorForTreasures(algo: typeof astar | typeof dijkstra): Generator<AlgorithmStep> {
    const treasures = this.grid.treasures!;
    let currentPos = this.grid.playerStart!;
    const collected = new Set<string>();

    // Show each treasure segment calculation
    while (collected.size < treasures.length) {
      let nearestTreasure: Position | null = null;
      let minDist = Infinity;

      // Find closest uncollected treasure
      for (const treasure of treasures) {
        const key = `${treasure.col},${treasure.row}`;
        if (collected.has(key)) continue;
        const dist = Math.abs(currentPos.col - treasure.col) + Math.abs(currentPos.row - treasure.row);
        if (dist < minDist) {
          minDist = dist;
          nearestTreasure = treasure;
        }
      }

      if (!nearestTreasure) break;

      // Calculate path to this treasure and yield each step
      const gen = algo(this.grid, currentPos, nearestTreasure);
      for (const step of gen) {
        yield step;
      }

      // Update current position
      currentPos = nearestTreasure;
      collected.add(`${nearestTreasure.col},${nearestTreasure.row}`);
    }

    // Finally, show path to exit
    const gen = algo(this.grid, currentPos, this.grid.exitPos!);
    for (const step of gen) {
      yield step;
    }
  }

  private combineTreasureSegments(): void {
    if (this.pathSegments.length === 0) {
      this.currentStep = {
        visited: new Set(),
        frontier: new Set(),
        current: null,
        path: null,
        pathHpLost: 0,
        done: true,
        found: false,
      };
      return;
    }

    // Combine all segments into one path
    let finalPath: Position[] = this.pathSegments[0]!.slice();
    for (let i = 1; i < this.pathSegments.length; i++) {
      const segment = this.pathSegments[i]!;
      // Skip first element (it's the same as last element of previous segment)
      finalPath = finalPath.concat(segment.slice(1));
    }

    // Calculate total HP lost
    let pathHpLost = 0;
    for (let i = 1; i < finalPath.length; i++) {
      pathHpLost += this.grid.cellHpCost(finalPath[i]!.col, finalPath[i]!.row);
    }

    this.currentStep = {
      visited: new Set(),
      frontier: new Set(),
      current: null,
      path: finalPath,
      pathHpLost,
      done: true,
      found: finalPath.length > 0,
    };
  }

  render(dt: number): void {
    const now = performance.now();
    const { ctx } = this;

    // Debug mode: advance generator one step per interval
    if (this.debugMode && this.state === 'running' && !this.paused && this.generator) {
      if (now - this.lastStepTime >= DEBUG_STEP_MS) {
        this.lastStepTime = now;
        const result = this.generator.next();
        if (!result.done) {
          this.currentStep = result.value;
          this.stepCount++;
          // In debug mode with treasures, we show each segment but don't mark done yet
          // (because there might be more segments coming from the generator)
          if (this.currentStep.done && !this.hasTreasures) {
            // Only mark done if this is NOT a treasure debug session
            this.totalSteps = this.stepCount;
            if (this.currentStep.found) {
              this.state = 'done_found';
            } else {
              this.state = 'done_not_found';
            }
          }
        } else {
          // Generator finished
          if (this.hasTreasures) {
            console.log('🎯 DEBUG: Generator finished, combining treasure segments');
            this.combineTreasureSegments();
            this.state = 'done_found';
          }
        }
      }
    }

    // Animate player along path once algorithm is done
    if (this.state === 'done_found' && this.currentStep?.path) {
      const path = this.currentStep.path;
      if (this.pathIndex < path.length && now - this.lastMoveTime >= RUN_STEP_MS) {
        this.lastMoveTime = now;
        this.playerPos = path[this.pathIndex] ?? this.playerPos;
        this.pathIndex++;
      }
    }

    // Collision detection — player touches a monster or potion
    if (this.state === 'done_found' && this.playerPos) {
      // Check for potion: restore 1 HP, consume it
      const cell = this.grid.getCell(this.playerPos.col, this.playerPos.row);
      if (cell === 'potion') {
        this.currentHp = Math.min(this.currentHp + 1, this.maxHp);
        this.grid.setCell(this.playerPos.col, this.playerPos.row, 'floor');
      }

      // Check for treasure: remove it when collected
      if (cell === 'treasure') {
        this.grid.treasures = this.grid.treasures!.filter(
          t => !(t.col === this.playerPos!.col && t.row === this.playerPos!.row)
        );
        this.grid.setCell(this.playerPos.col, this.playerPos.row, 'floor');
      }

      // Check for monster: lose 1 HP, remove monster
      const alive: MonsterState[] = [];
      for (const m of this.monsters) {
        if (m.col === this.playerPos.col && m.row === this.playerPos.row) {
          this.currentHp--;
        } else {
          alive.push(m);
        }
      }
      this.monsters = alive;
      if (this.currentHp <= 0) {
        this.state = 'done_caught';
      }
    }

    // Draw — only pass step overlay in debug mode
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.renderer.draw(this.grid, {
      step: this.debugMode ? (this.currentStep ?? undefined) : undefined,
      playerPos: this.playerPos ?? undefined,
      monsters: this.monsters,
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

    this.backBtn.label    = t('run.back');
    this.restartBtn.label = t('run.restart');

    drawButton(ctx, this.backBtn, hitTest(this.backBtn, this.mx, this.my));
    drawButton(ctx, this.restartBtn, hitTest(this.restartBtn, this.mx, this.my));

    if (this.state === 'running') {
      this.pauseBtn.label = this.paused ? t('run.resume') : t('run.pause');
      drawButton(ctx, this.pauseBtn, hitTest(this.pauseBtn, this.mx, this.my));
    }

    // Status info on the left
    const algoLabel = this.algorithm === 'astar' ? 'A*' : 'Dijkstra';
    const debugLabel = this.debugMode ? ' • Debug' : '';
    const iterCount = this.totalSteps > 0 ? this.totalSteps : this.stepCount;
    const stepLabel = iterCount > 0 ? ` • ${iterCount} iterações` : '';

    ctx.fillStyle = COLOR_TEXT_DIM;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${algoLabel}${debugLabel}${stepLabel}`, 360, TOOLBAR_H / 2);

    // HP Panel on the right — bigger and more visible
    this.drawHpPanel(ctx);

    // Overlay messages
    this.drawStateOverlay();
  }

  private drawHpPanel(ctx: CanvasRenderingContext2D): void {
    const panelW = 180;
    const panelH = 48;
    // Shifted 44px left to make room for the LangSwitcher button in the top-right corner
    const panelX = CANVAS_W - panelW - 52;
    const panelY = 6;

    // Panel background
    ctx.fillStyle = 'rgba(30, 30, 50, 0.9)';
    ctx.fillRect(panelX, panelY, panelW, panelH);

    // Panel border
    const hpColor = this.currentHp <= 1 ? '#e74c3c' : this.currentHp <= Math.ceil(this.maxHp / 2) ? '#e67e22' : '#2ecc71';
    ctx.strokeStyle = hpColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // HP label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(t('run.hitpoints'), panelX + 10, panelY + 6);

    // HP value and max
    ctx.fillStyle = hpColor;
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${this.currentHp}/${this.maxHp}`, panelX + 10, panelY + 18);

    // HP bar
    const barW = panelW - 20;
    const barH = 6;
    const barX = panelX + 10;
    const barY = panelY + 40;

    // Background of bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barW, barH);

    // HP fill
    const fillW = (this.currentHp / this.maxHp) * barW;
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, fillW, barH);

    // Bar border
    ctx.strokeStyle = hpColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }

  private drawStateOverlay(): void {
    const { ctx } = this;

    if (this.state === 'done_caught') {
      ctx.fillStyle = 'rgba(10,10,26,0.85)';
      ctx.fillRect(CANVAS_W / 2 - 240, CANVAS_H / 2 - 70, 480, 140);
      ctx.strokeStyle = '#8e44ad';
      ctx.lineWidth = 2;
      ctx.strokeRect(CANVAS_W / 2 - 240, CANVAS_H / 2 - 70, 480, 140);

      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('run.caught.title'), CANVAS_W / 2, CANVAS_H / 2 - 20);

      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.font = '15px monospace';
      ctx.fillText(
        t('run.caught.msg'),
        CANVAS_W / 2,
        CANVAS_H / 2 + 18
      );
      ctx.fillText(
        t('run.caught.hint'),
        CANVAS_W / 2,
        CANVAS_H / 2 + 42
      );
      return;
    }

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
      ctx.fillText(t('run.notFound.title'), CANVAS_W / 2, CANVAS_H / 2 - 20);

      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.font = '15px monospace';
      ctx.fillText(
        t('run.notFound.msg'),
        CANVAS_W / 2,
        CANVAS_H / 2 + 18
      );
      ctx.fillText(
        t('run.notFound.hint'),
        CANVAS_W / 2,
        CANVAS_H / 2 + 42
      );
      return;
    }

    if (this.state === 'done_found' && this.currentStep?.path) {
      const path = this.currentStep.path;
      const finished = this.pathIndex >= path.length;

      if (finished) {
        const hpLost = this.currentStep.pathHpLost;
        const hpRemaining = this.maxHp - hpLost;
        const survived = this.currentHp > 0;

        ctx.fillStyle = 'rgba(10,10,26,0.82)';
        ctx.fillRect(CANVAS_W / 2 - 260, CANVAS_H / 2 - 80, 520, 170);
        ctx.strokeStyle = survived ? '#2ecc71' : '#e74c3c';
        ctx.lineWidth = 2;
        ctx.strokeRect(CANVAS_W / 2 - 260, CANVAS_H / 2 - 80, 520, 170);

        ctx.fillStyle = survived ? '#2ecc71' : '#e74c3c';
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(survived ? t('run.found.survived') : t('run.found.dead'), CANVAS_W / 2, CANVAS_H / 2 - 32);

        ctx.fillStyle = COLOR_TEXT_DIM;
        ctx.font = '13px monospace';
        ctx.fillText(
          t('run.found.steps', { steps: path.length - 1, iters: this.totalSteps }),
          CANVAS_W / 2,
          CANVAS_H / 2 - 2
        );
        ctx.fillText(
          t('run.found.hp', { lost: this.currentStep.pathHpLost, hp: this.currentHp, max: this.maxHp }),
          CANVAS_W / 2,
          CANVAS_H / 2 + 18
        );
        ctx.fillText(
          t('run.found.hint'),
          CANVAS_W / 2,
          CANVAS_H / 2 + 52
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
