import type { Screen } from './Screen';
import type { AppController } from '../state/AppController';
import {
  CANVAS_W, CANVAS_H, COLOR_BG, COLOR_TEXT, COLOR_ACCENT,
  COLOR_TEXT_DIM, COLOR_UI_BG, COLOR_UI_PANEL,
} from '../constants';
import { drawButton, hitTest, type ButtonRect } from '../ui/button';
import { loadMaps, deleteMap } from '../storage';
import type { MazeData } from '../types';
import { t, localeDateString } from '../i18n/index';

const LIST_Y = 120;
const ITEM_H = 64;
const ITEM_W = 660;
const ITEM_X = (CANVAS_W - ITEM_W) / 2;
const VISIBLE = 6;

export class SavedMapsScreen implements Screen {
  private ctx: CanvasRenderingContext2D;
  private app: AppController;
  private mx = 0;
  private my = 0;
  private maps: MazeData[] = [];
  private scroll = 0;
  private hoveredIndex = -1;

  private backBtn: ButtonRect = {
    x: 20, y: 14, w: 110, h: 36, label: '',
  };

  constructor(ctx: CanvasRenderingContext2D, app: AppController) {
    this.ctx = ctx;
    this.app = app;
    this.maps = loadMaps().sort((a, b) => b.updatedAt - a.updatedAt);
  }

  render(_dt: number): void {
    const { ctx } = this;

    this.backBtn.label = t('savedMaps.back');

    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Header
    ctx.fillStyle = COLOR_UI_BG;
    ctx.fillRect(0, 0, CANVAS_W, 80);
    ctx.fillStyle = COLOR_ACCENT;
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t('savedMaps.title'), CANVAS_W / 2, 40);

    drawButton(ctx, this.backBtn, hitTest(this.backBtn, this.mx, this.my));

    if (this.maps.length === 0) {
      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.font = '18px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('savedMaps.empty'), CANVAS_W / 2, CANVAS_H / 2);
      ctx.font = '14px monospace';
      ctx.fillText(t('savedMaps.emptyHint'), CANVAS_W / 2, CANVAS_H / 2 + 30);
      return;
    }

    const start = this.scroll;
    const end = Math.min(start + VISIBLE, this.maps.length);

    for (let i = start; i < end; i++) {
      const map = this.maps[i]!;
      const iy = LIST_Y + (i - start) * ITEM_H;
      const hovered = this.hoveredIndex === i;

      // Item bg
      ctx.fillStyle = hovered ? '#1e1e42' : COLOR_UI_PANEL;
      ctx.beginPath();
      ctx.roundRect(ITEM_X, iy + 4, ITEM_W, ITEM_H - 8, 8);
      ctx.fill();

      if (hovered) {
        ctx.strokeStyle = COLOR_ACCENT;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Name
      ctx.fillStyle = COLOR_TEXT;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(map.name, ITEM_X + 16, iy + 22);

      // Meta
      const date = localeDateString(new Date(map.updatedAt));
      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.font = '12px monospace';
      ctx.fillText(
        `${map.cols}×${map.rows} • ${date}`,
        ITEM_X + 16,
        iy + 42
      );

      // Action buttons
      const editBtn: ButtonRect = {
        x: ITEM_X + ITEM_W - 220, y: iy + 12, w: 90, h: 32, label: t('savedMaps.edit'),
      };
      const runBtn: ButtonRect = {
        x: ITEM_X + ITEM_W - 120, y: iy + 12, w: 80, h: 32, label: t('savedMaps.run'),
      };
      const delBtn: ButtonRect = {
        x: ITEM_X + ITEM_W - 30, y: iy + 12, w: 24, h: 32, label: t('savedMaps.del'), danger: true,
      };

      drawButton(ctx, editBtn, hitTest(editBtn, this.mx, this.my));
      drawButton(ctx, runBtn, hitTest(runBtn, this.mx, this.my));
      drawButton(ctx, delBtn, hitTest(delBtn, this.mx, this.my));
    }

    // Scroll indicators
    if (this.scroll > 0) {
      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t('savedMaps.scrollUp'), CANVAS_W / 2, LIST_Y - 10);
    }
    if (end < this.maps.length) {
      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t('savedMaps.scrollDown'), CANVAS_W / 2, LIST_Y + VISIBLE * ITEM_H + 10);
    }
  }

  private getItemButtons(i: number): {
    edit: ButtonRect; run: ButtonRect; del: ButtonRect;
  } {
    const iy = LIST_Y + (i - this.scroll) * ITEM_H;
    return {
      edit: { x: ITEM_X + ITEM_W - 220, y: iy + 12, w: 90, h: 32, label: t('savedMaps.edit') },
      run:  { x: ITEM_X + ITEM_W - 120, y: iy + 12, w: 80, h: 32, label: t('savedMaps.run') },
      del:  { x: ITEM_X + ITEM_W - 30,  y: iy + 12, w: 24, h: 32, label: t('savedMaps.del'), danger: true },
    };
  }

  onMouseMove(x: number, y: number): void {
    this.mx = x;
    this.my = y;

    this.hoveredIndex = -1;
    const start = this.scroll;
    const end = Math.min(start + VISIBLE, this.maps.length);
    for (let i = start; i < end; i++) {
      const iy = LIST_Y + (i - start) * ITEM_H;
      if (y >= iy && y <= iy + ITEM_H) {
        this.hoveredIndex = i;
        break;
      }
    }
  }

  onMouseDown(_x: number, _y: number, _button: number): void {}

  onMouseUp(x: number, y: number, _button: number): void {
    if (hitTest(this.backBtn, x, y)) {
      this.app.navigateTo('mainMenu', {});
      return;
    }

    const start = this.scroll;
    const end = Math.min(start + VISIBLE, this.maps.length);
    for (let i = start; i < end; i++) {
      const map = this.maps[i]!;
      const btns = this.getItemButtons(i);

      if (hitTest(btns.edit, x, y)) {
        this.app.navigateTo('editor', { mazeId: map.id, mode: 'edit' });
        return;
      }
      if (hitTest(btns.run, x, y)) {
        this.app.navigateTo('run', { mazeId: map.id });
        return;
      }
      if (hitTest(btns.del, x, y)) {
        if (confirm(t('savedMaps.confirmDelete', { name: map.name }))) {
          deleteMap(map.id);
          this.maps = loadMaps().sort((a, b) => b.updatedAt - a.updatedAt);
          if (this.scroll > 0 && this.scroll >= this.maps.length) {
            this.scroll = Math.max(0, this.maps.length - VISIBLE);
          }
        }
        return;
      }
    }
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      this.scroll = Math.max(0, this.scroll - 1);
    } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      this.scroll = Math.min(Math.max(0, this.maps.length - VISIBLE), this.scroll + 1);
    } else if (e.key === 'Escape') {
      this.app.navigateTo('mainMenu', {});
    }
  }

  dispose(): void {}
}
