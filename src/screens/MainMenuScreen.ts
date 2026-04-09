import type { Screen } from './Screen';
import type { AppController } from '../state/AppController';
import { CANVAS_W, CANVAS_H, COLOR_BG, COLOR_TEXT, COLOR_ACCENT, COLOR_TEXT_DIM } from '../constants';
import { drawButton, hitTest, type ButtonRect } from '../ui/button';
import { t } from '../i18n/index';

export class MainMenuScreen implements Screen {
  private ctx: CanvasRenderingContext2D;
  private app: AppController;
  private mx = 0;
  private my = 0;
  private t = 0;

  private buttons: ButtonRect[] = [
    { x: CANVAS_W / 2 - 130, y: 280, w: 260, h: 52, label: '' },
    { x: CANVAS_W / 2 - 130, y: 350, w: 260, h: 52, label: '' },
  ];

  constructor(ctx: CanvasRenderingContext2D, app: AppController) {
    this.ctx = ctx;
    this.app = app;
  }

  render(dt: number): void {
    this.t += dt;
    const { ctx } = this;

    // Update labels each frame so language changes are reflected immediately
    this.buttons[0]!.label = t('menu.newGame');
    this.buttons[1]!.label = t('menu.savedMaps');

    // Background
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Animated maze grid pattern in background
    this.drawBgPattern();

    // Title
    const pulse = Math.sin(this.t * 0.002) * 0.15 + 0.85;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLOR_ACCENT;
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SUPER MAZE', CANVAS_W / 2, 140);
    ctx.restore();

    ctx.fillStyle = COLOR_TEXT_DIM;
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t('menu.subtitle'), CANVAS_W / 2, 185);

    // Buttons
    for (const btn of this.buttons) {
      drawButton(ctx, btn, hitTest(btn, this.mx, this.my));
    }

    // Footer
    ctx.fillStyle = COLOR_TEXT_DIM;
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t('menu.footer'), CANVAS_W / 2, CANVAS_H - 24);
  }

  private drawBgPattern(): void {
    const { ctx } = this;
    const size = 20;
    for (let row = 0; row < CANVAS_H / size; row++) {
      for (let col = 0; col < CANVAS_W / size; col++) {
        const rand = ((row * 41 + col * 17) % 7);
        if (rand === 0) {
          ctx.fillStyle = 'rgba(44,62,80,0.6)';
          ctx.fillRect(col * size, row * size, size, size);
        }
      }
    }
  }

  onMouseMove(x: number, y: number): void {
    this.mx = x;
    this.my = y;
  }

  onMouseDown(_x: number, _y: number, _button: number): void {}

  onMouseUp(x: number, y: number, _button: number): void {
    if (hitTest(this.buttons[0]!, x, y)) {
      this.app.navigateTo('editor', {});
    } else if (hitTest(this.buttons[1]!, x, y)) {
      this.app.navigateTo('savedMaps', {});
    }
  }

  onKeyDown(_e: KeyboardEvent): void {}
  dispose(): void {}
}
