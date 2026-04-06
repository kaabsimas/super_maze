import type { Screen } from './Screen';
import type { AppController } from '../state/AppController';
import {
  CANVAS_W, CANVAS_H, CELL_SIZE, GRID_COLS, GRID_ROWS,
  COLOR_BG, COLOR_ACCENT, COLOR_TEXT_DIM,
  COLOR_UI_BG, COLOR_WALL, COLOR_FLOOR, COLOR_EXIT, COLOR_PLAYER,
} from '../constants';
import { drawButton, hitTest, type ButtonRect } from '../ui/button';
import { Grid } from '../grid/Grid';
import { GridRenderer } from '../grid/GridRenderer';
import { saveMap, getMap, generateId } from '../storage';
import type { CellType, AlgorithmName } from '../types';

// Two-row toolbar: row1 = tools, row2 = algo + debug + actions
const ROW_H = 36;
const TOOLBAR_H = ROW_H * 2 + 16; // 88px total
const ROW1_Y = 8;
const ROW2_Y = ROW_H + 12;

const GRID_OFFSET_X = (CANVAS_W - GRID_COLS * CELL_SIZE) / 2;
const GRID_OFFSET_Y = TOOLBAR_H + (CANVAS_H - TOOLBAR_H - GRID_ROWS * CELL_SIZE) / 2;

type Tool = 'wall' | 'floor' | 'player' | 'exit' | 'erase';

export class MapEditorScreen implements Screen {
  private ctx: CanvasRenderingContext2D;
  private app: AppController;
  private renderer: GridRenderer;
  private grid: Grid;
  private mx = 0;
  private my = 0;
  // null = not painting, 0 = left button, 2 = right button
  private paintButton: number | null = null;
  private activeTool: Tool = 'wall';
  private algorithm: AlgorithmName = 'astar';
  private debugMode = false;
  private mazeId: string;
  private mazeName: string;

  private toolBtns: { tool: Tool; btn: ButtonRect }[] = [];
  private algoBtns: { algo: AlgorithmName; btn: ButtonRect }[] = [];
  private debugBtn!: ButtonRect;
  private actionBtns: { id: string; btn: ButtonRect }[] = [];

  constructor(ctx: CanvasRenderingContext2D, app: AppController, mazeId?: string) {
    this.ctx = ctx;
    this.app = app;
    this.mazeId = mazeId ?? generateId();

    if (mazeId) {
      const data = getMap(mazeId);
      if (data) {
        this.grid = Grid.fromMazeData(data);
        this.mazeName = data.name;
      } else {
        this.grid = Grid.createNew();
        this.mazeName = 'Labirinto';
      }
    } else {
      this.grid = Grid.createNew();
      this.mazeName = `Labirinto ${new Date().toLocaleDateString('pt-BR')}`;
    }

    this.renderer = new GridRenderer(ctx, GRID_OFFSET_X, GRID_OFFSET_Y);
    this.buildButtons();
  }

  private buildButtons(): void {
    // Row 1 — tool selector (5 tools)
    const toolDefs: { tool: Tool; label: string }[] = [
      { tool: 'wall',   label: '■ Parede'  },
      { tool: 'floor',  label: '□ Chão'    },
      { tool: 'player', label: '🧭 Início' },
      { tool: 'exit',   label: '★ Saída'   },
      { tool: 'erase',  label: '✕ Apagar'  },
    ];
    const toolW = 108;
    const toolGap = 6;
    // Center the tool row
    const toolsTotal = toolDefs.length * toolW + (toolDefs.length - 1) * toolGap;
    const toolsStartX = (CANVAS_W - toolsTotal) / 2;

    this.toolBtns = toolDefs.map((t, i) => ({
      tool: t.tool,
      btn: { x: toolsStartX + i * (toolW + toolGap), y: ROW1_Y, w: toolW, h: ROW_H, label: t.label },
    }));

    // Row 2 — algo + debug on left, actions on right
    const r2y = ROW2_Y;
    const btnH = ROW_H;

    this.algoBtns = [
      { algo: 'astar',    btn: { x: 10,       y: r2y, w: 72, h: btnH, label: 'A*'       } },
      { algo: 'dijkstra', btn: { x: 10 + 78,  y: r2y, w: 92, h: btnH, label: 'Dijkstra' } },
    ];

    this.debugBtn = { x: 10 + 78 + 98, y: r2y, w: 80, h: btnH, label: 'Debug' };

    this.actionBtns = [
      { id: 'save',  btn: { x: CANVAS_W - 326, y: r2y, w: 90,  h: btnH, label: '💾 Salvar' } },
      { id: 'run',   btn: { x: CANVAS_W - 228, y: r2y, w: 90,  h: btnH, label: '▶ Rodar'   } },
      { id: 'clear', btn: { x: CANVAS_W - 130, y: r2y, w: 80,  h: btnH, label: '🗑 Limpar'  } },
      { id: 'back',  btn: { x: CANVAS_W - 44,  y: r2y, w: 34,  h: btnH, label: '✕'         } },
    ];
  }

  render(_dt: number): void {
    const { ctx } = this;

    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this.renderer.draw(this.grid);

    // Toolbar background
    ctx.fillStyle = COLOR_UI_BG;
    ctx.fillRect(0, 0, CANVAS_W, TOOLBAR_H);

    // Bottom border of toolbar
    ctx.strokeStyle = COLOR_ACCENT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, TOOLBAR_H);
    ctx.lineTo(CANVAS_W, TOOLBAR_H);
    ctx.stroke();

    // Separator between rows
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ROW_H + 10);
    ctx.lineTo(CANVAS_W, ROW_H + 10);
    ctx.stroke();

    // Row 1 — tool buttons
    for (const { tool, btn } of this.toolBtns) {
      drawButton(ctx, { ...btn, active: this.activeTool === tool }, hitTest(btn, this.mx, this.my));
    }

    // Row 2 — algo label
    ctx.fillStyle = COLOR_TEXT_DIM;
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Algoritmo:', 10, ROW2_Y - 8);

    for (const { algo, btn } of this.algoBtns) {
      drawButton(ctx, { ...btn, active: this.algorithm === algo }, hitTest(btn, this.mx, this.my));
    }

    drawButton(ctx, { ...this.debugBtn, active: this.debugMode }, hitTest(this.debugBtn, this.mx, this.my));

    for (const { btn } of this.actionBtns) {
      drawButton(ctx, btn, hitTest(btn, this.mx, this.my));
    }

    // Mouse-button hint
    ctx.fillStyle = COLOR_TEXT_DIM;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      '🖱 esquerdo = parede   🖱 direito = chão',
      CANVAS_W / 2,
      TOOLBAR_H - 10,
    );

    this.drawHints();
    this.drawCursorCell();
  }

  private drawHints(): void {
    const hints: string[] = [];
    if (!this.grid.playerStart) hints.push('⚠ defina início (🧭)');
    if (!this.grid.exitPos)     hints.push('⚠ defina saída (★)');
    if (hints.length === 0) return;

    this.ctx.fillStyle = '#e67e22';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText(hints.join('   '), 10, CANVAS_H - 6);
  }

  private drawCursorCell(): void {
    const cell = this.renderer.cellAt(this.mx, this.my);
    if (!cell) return;
    const { col, row } = cell;
    if (col < 0 || col >= this.grid.cols || row < 0 || row >= this.grid.rows) return;
    if (this.my < TOOLBAR_H) return;

    const x = GRID_OFFSET_X + col * CELL_SIZE;
    const y = GRID_OFFSET_Y + row * CELL_SIZE;

    this.ctx.strokeStyle = COLOR_ACCENT;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }

  /**
   * Resolve which cell type to paint based on button and active tool.
   * Left click  (button=0): paint wall (or player/exit/erase if those tools are active)
   * Right click (button=2): always paint floor
   */
  private resolveType(button: number): CellType {
    if (button === 2) return 'floor';
    // Left button: use active tool
    return this.activeTool === 'erase' ? 'floor' : this.activeTool;
  }

  private applyTool(col: number, row: number, button: number): void {
    if (col < 0 || col >= this.grid.cols || row < 0 || row >= this.grid.rows) return;
    this.grid.setCell(col, row, this.resolveType(button));
  }

  onMouseMove(x: number, y: number): void {
    this.mx = x;
    this.my = y;
    if (this.paintButton !== null && y >= TOOLBAR_H) {
      const cell = this.renderer.cellAt(x, y);
      if (cell) this.applyTool(cell.col, cell.row, this.paintButton);
    }
  }

  onMouseDown(x: number, y: number, button: number): void {
    // Clicks on toolbar are handled on mouseUp
    if (y < TOOLBAR_H) return;

    if (button === 0 || button === 2) {
      this.paintButton = button;
      const cell = this.renderer.cellAt(x, y);
      if (cell) this.applyTool(cell.col, cell.row, button);
    }
  }

  onMouseUp(x: number, y: number, button: number): void {
    if (button === 0 || button === 2) {
      this.paintButton = null;
    }

    // Only handle toolbar clicks on left button up
    if (button !== 0) return;
    if (y >= TOOLBAR_H) return;

    // Row 1 — tool selection
    for (const { tool, btn } of this.toolBtns) {
      if (hitTest(btn, x, y)) {
        this.activeTool = tool;
        return;
      }
    }

    // Row 2 — algo selection
    for (const { algo, btn } of this.algoBtns) {
      if (hitTest(btn, x, y)) {
        this.algorithm = algo;
        return;
      }
    }

    if (hitTest(this.debugBtn, x, y)) {
      this.debugMode = !this.debugMode;
      return;
    }

    for (const { id, btn } of this.actionBtns) {
      if (hitTest(btn, x, y)) {
        this.handleAction(id);
        return;
      }
    }
  }

  private handleAction(id: string): void {
    switch (id) {
      case 'save': {
        const name = prompt('Nome do mapa:', this.mazeName);
        if (name === null) return;
        this.mazeName = name.trim() || this.mazeName;
        saveMap(this.grid.toMazeData(this.mazeId, this.mazeName));
        break;
      }
      case 'run': {
        if (!this.grid.playerStart) {
          alert('Defina o ponto de início antes de executar.');
          return;
        }
        if (!this.grid.exitPos) {
          alert('Defina a saída antes de executar.');
          return;
        }
        saveMap(this.grid.toMazeData(this.mazeId, this.mazeName));
        this.app.navigateTo('run', { mazeId: this.mazeId });
        break;
      }
      case 'clear': {
        if (confirm('Limpar todo o labirinto?')) {
          this.grid = Grid.createNew();
        }
        break;
      }
      case 'back': {
        this.app.navigateTo('mainMenu', {});
        break;
      }
    }
  }

  getSettings(): { algorithm: AlgorithmName; debugMode: boolean } {
    return { algorithm: this.algorithm, debugMode: this.debugMode };
  }

  getMazeId(): string { return this.mazeId; }

  onKeyDown(e: KeyboardEvent): void {
    const keyToolMap: Record<string, Tool> = {
      'w': 'wall', 'f': 'floor', 'p': 'player', 'e': 'exit', 'x': 'erase',
    };
    const t = keyToolMap[e.key.toLowerCase()];
    if (t) this.activeTool = t;
    if (e.key === 'Escape') this.app.navigateTo('mainMenu', {});
    if (e.key === 'd') this.debugMode = !this.debugMode;
  }

  dispose(): void {}
}
