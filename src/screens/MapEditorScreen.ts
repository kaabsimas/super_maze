import type { Screen } from './Screen';
import type { AppController } from '../state/AppController';
import {
  CANVAS_W, CANVAS_H, CELL_SIZE, GRID_COLS, GRID_ROWS, GRID_PADDING,
  SIDE_TOOLBAR_W,
  COLOR_BG, COLOR_ACCENT, COLOR_TEXT_DIM,
  COLOR_UI_BG, COLOR_WALL, COLOR_EXIT, COLOR_PLAYER, COLOR_MUD, COLOR_MONSTER, COLOR_POTION,
} from '../constants';
import { drawButton, hitTest, type ButtonRect } from '../ui/button';
import { Grid } from '../grid/Grid';
import { GridRenderer } from '../grid/GridRenderer';
import { saveMap, getMap, generateId } from '../storage';
import type { CellType, AlgorithmName } from '../types';

// Single-row toolbar
const ROW_H = 36;
const TOOLBAR_H = ROW_H + 16; // 52px total
const ROW1_Y = 8;

const GRID_OFFSET_X = SIDE_TOOLBAR_W + GRID_PADDING;
const GRID_OFFSET_Y = TOOLBAR_H + GRID_PADDING;

type Tool = 'wall' | 'player' | 'exit' | 'mud' | 'monster' | 'potion' | 'erase';

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
  private playerHitpoints = 3;

  private algoBtns: { algo: AlgorithmName; btn: ButtonRect }[] = [];
  private debugBtn!: ButtonRect;
  private hpBtn!: ButtonRect;
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
        this.playerHitpoints = this.grid.playerHitpoints;
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
    // Single row — algo + debug on left, actions on right
    const y = ROW1_Y;
    const h = ROW_H;

    this.algoBtns = [
      { algo: 'astar',    btn: { x: 10,      y, w: 72, h, label: 'A*'       } },
      { algo: 'dijkstra', btn: { x: 10 + 78, y, w: 92, h, label: 'Dijkstra' } },
    ];

    this.debugBtn = { x: 10 + 78 + 98, y, w: 90, h, label: 'Depurar' };
    this.hpBtn    = { x: 10 + 78 + 98 + 96, y, w: 70, h, label: `❤ HP:${this.playerHitpoints}` };

    this.actionBtns = [
      { id: 'save',  btn: { x: CANVAS_W - 326, y, w: 90, h, label: '💾 Salvar' } },
      { id: 'run',   btn: { x: CANVAS_W - 228, y, w: 90, h, label: '▶ Rodar'   } },
      { id: 'clear', btn: { x: CANVAS_W - 130, y, w: 80, h, label: '🗑 Limpar'  } },
      { id: 'back',  btn: { x: CANVAS_W - 44,  y, w: 34, h, label: '✕'         } },
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

    // Algo label
    ctx.fillStyle = COLOR_TEXT_DIM;
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Algoritmo:', 10, TOOLBAR_H / 2 - 10);

    for (const { algo, btn } of this.algoBtns) {
      drawButton(ctx, { ...btn, active: this.algorithm === algo }, hitTest(btn, this.mx, this.my));
    }

    drawButton(ctx, { ...this.debugBtn, active: this.debugMode }, hitTest(this.debugBtn, this.mx, this.my));
    drawButton(ctx, this.hpBtn, hitTest(this.hpBtn, this.mx, this.my));

    for (const { btn } of this.actionBtns) {
      drawButton(ctx, btn, hitTest(btn, this.mx, this.my));
    }

    this.drawHints();
    this.drawCursorCell();
    this.drawSideToolbar();
  }

  private drawSideToolbar(): void {
    const { ctx } = this;
    const PAD = 6;
    const btnSize = SIDE_TOOLBAR_W - PAD * 2; // 52px square

    // Side panel background
    ctx.fillStyle = COLOR_UI_BG;
    ctx.fillRect(0, TOOLBAR_H, SIDE_TOOLBAR_W, CANVAS_H - TOOLBAR_H);

    // Right border
    ctx.strokeStyle = COLOR_ACCENT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(SIDE_TOOLBAR_W, TOOLBAR_H);
    ctx.lineTo(SIDE_TOOLBAR_W, CANVAS_H);
    ctx.stroke();

    const toolDefs: { tool: Tool; icon: string; color: string; label: string }[] = [
      { tool: 'wall',    icon: '■',  color: COLOR_WALL,    label: 'parede'  },
      { tool: 'player',  icon: '🧭', color: COLOR_PLAYER,  label: 'início'  },
      { tool: 'exit',    icon: '★',  color: COLOR_EXIT,    label: 'saída'   },
      { tool: 'mud',     icon: '💧', color: COLOR_MUD,     label: 'lama'    },
      { tool: 'monster', icon: '👾', color: COLOR_MONSTER, label: 'monstro' },
      { tool: 'potion',  icon: '🧪', color: COLOR_POTION,  label: 'poção'   },
      { tool: 'erase',   icon: '✕',  color: '#e74c3c',     label: 'apagar'  },
    ];

    const startY = TOOLBAR_H + 16;
    const spacing = btnSize + 10;

    for (let i = 0; i < toolDefs.length; i++) {
      const { tool, icon, color, label } = toolDefs[i]!;
      const x = PAD;
      const y = startY + i * spacing;
      const isActive = this.activeTool === tool;
      const isHovered = hitTest({ x, y, w: btnSize, h: btnSize, label: '' }, this.mx, this.my);

      // Button background
      const radius = 8;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + btnSize - radius, y);
      ctx.quadraticCurveTo(x + btnSize, y, x + btnSize, y + radius);
      ctx.lineTo(x + btnSize, y + btnSize - radius);
      ctx.quadraticCurveTo(x + btnSize, y + btnSize, x + btnSize - radius, y + btnSize);
      ctx.lineTo(x + radius, y + btnSize);
      ctx.quadraticCurveTo(x, y + btnSize, x, y + btnSize - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      if (isActive) {
        ctx.fillStyle = COLOR_ACCENT;
      } else if (isHovered) {
        ctx.fillStyle = '#2d2d5e';
      } else {
        ctx.fillStyle = '#1a1a35';
      }
      ctx.fill();

      // Active border
      if (isActive) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (isHovered) {
        ctx.strokeStyle = 'rgba(124,58,237,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Tool color swatch for non-emoji tools
      if (tool === 'wall' || tool === 'mud') {
        ctx.fillStyle = color;
        ctx.fillRect(x + 6, y + 6, 10, 10);
      }

      // Icon
      ctx.font = tool === 'player' ? '22px serif' : '20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isActive ? '#ffffff' : color;
      ctx.fillText(icon, x + btnSize / 2, y + btnSize / 2 + (tool === 'player' ? 1 : 0));

      // Label (small text below icon)
      ctx.font = '9px monospace';
      ctx.fillStyle = isActive ? '#ffffff' : COLOR_TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, x + btnSize / 2, y + btnSize - 3);
    }
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
    if (this.activeTool === 'erase') return 'floor';
    return this.activeTool;
  }

  private applyTool(col: number, row: number, button: number): void {
    if (col < 0 || col >= this.grid.cols || row < 0 || row >= this.grid.rows) return;
    this.grid.setCell(col, row, this.resolveType(button));
  }

  onMouseMove(x: number, y: number): void {
    this.mx = x;
    this.my = y;
    if (this.paintButton !== null && y >= TOOLBAR_H && x >= SIDE_TOOLBAR_W) {
      const cell = this.renderer.cellAt(x, y);
      if (cell) this.applyTool(cell.col, cell.row, this.paintButton);
    }
  }

  onMouseDown(x: number, y: number, button: number): void {
    // Clicks on toolbar are handled on mouseUp
    if (y < TOOLBAR_H) return;
    // Clicks on side toolbar are handled on mouseUp
    if (x < SIDE_TOOLBAR_W) return;

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

    // Side toolbar — tool selection
    if (x < SIDE_TOOLBAR_W && y >= TOOLBAR_H) {
      const PAD = 6;
      const btnSize = SIDE_TOOLBAR_W - PAD * 2;
      const startY = TOOLBAR_H + 16;
      const spacing = btnSize + 10;
      const tools: Tool[] = ['wall', 'player', 'exit', 'mud', 'monster', 'potion', 'erase'];
      for (let i = 0; i < tools.length; i++) {
        const bx = PAD, by = startY + i * spacing;
        if (x >= bx && x <= bx + btnSize && y >= by && y <= by + btnSize) {
          this.activeTool = tools[i]!;
          return;
        }
      }
      return;
    }

    if (y >= TOOLBAR_H) return;

    // Algo selection
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

    if (hitTest(this.hpBtn, x, y)) {
      const raw = prompt(`Hitpoints do personagem (1–99):`, String(this.playerHitpoints));
      if (raw === null) return;
      const v = parseInt(raw, 10);
      if (!isNaN(v) && v >= 1 && v <= 99) {
        this.playerHitpoints = v;
        this.grid.playerHitpoints = v;
        this.hpBtn.label = `❤ HP:${v}`;
      }
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

  getSettings(): { algorithm: AlgorithmName; debugMode: boolean; playerHitpoints: number } {
    return { algorithm: this.algorithm, debugMode: this.debugMode, playerHitpoints: this.playerHitpoints };
  }

  getMazeId(): string { return this.mazeId; }

  onKeyDown(e: KeyboardEvent): void {
    const keyToolMap: Record<string, Tool> = {
      'w': 'wall', 'p': 'player', 'e': 'exit', 'x': 'erase',
    };
    const t = keyToolMap[e.key.toLowerCase()];
    if (t) this.activeTool = t;
    if (e.key === 'Escape') this.app.navigateTo('mainMenu', {});
    if (e.key === 'd') this.debugMode = !this.debugMode;
  }

  dispose(): void {}
}
