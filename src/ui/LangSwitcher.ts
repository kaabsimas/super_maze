import { CANVAS_W } from '../constants';
import { getLanguage, setLanguage, LANGUAGES } from '../i18n/index';
import type { LangCode, LangMeta } from '../i18n/index';

// ── Geometry ──────────────────────────────────────────────────────────────────

const BTN_W  = 36;
const BTN_H  = 36;
const BTN_X  = CANVAS_W - BTN_W - 6;   // 846
const BTN_Y  = 8;

const DROP_W     = 152;
const DROP_ITEM_H = 44;
const DROP_PAD    = 6;
const DROP_X     = CANVAS_W - DROP_W - 6;  // right-anchored
const DROP_Y     = BTN_Y + BTN_H + 4;       // just below the button

// ── Helper ────────────────────────────────────────────────────────────────────

function inRect(
  x: number, y: number,
  rx: number, ry: number, rw: number, rh: number,
): boolean {
  return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

// ── Component ─────────────────────────────────────────────────────────────────

export class LangSwitcher {
  private ctx: CanvasRenderingContext2D;
  private open = false;
  private mx = 0;
  private my = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  // ── Rendering ───────────────────────────────────────────────────────────────

  render(): void {
    this.drawButton();
    if (this.open) this.drawDropdown();
  }

  private drawButton(): void {
    const { ctx } = this;
    const hovered = inRect(this.mx, this.my, BTN_X, BTN_Y, BTN_W, BTN_H);
    const lang = LANGUAGES.find(l => l.code === getLanguage())!;

    // Background
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(BTN_X + radius, BTN_Y);
    ctx.lineTo(BTN_X + BTN_W - radius, BTN_Y);
    ctx.quadraticCurveTo(BTN_X + BTN_W, BTN_Y, BTN_X + BTN_W, BTN_Y + radius);
    ctx.lineTo(BTN_X + BTN_W, BTN_Y + BTN_H - radius);
    ctx.quadraticCurveTo(BTN_X + BTN_W, BTN_Y + BTN_H, BTN_X + BTN_W - radius, BTN_Y + BTN_H);
    ctx.lineTo(BTN_X + radius, BTN_Y + BTN_H);
    ctx.quadraticCurveTo(BTN_X, BTN_Y + BTN_H, BTN_X, BTN_Y + BTN_H - radius);
    ctx.lineTo(BTN_X, BTN_Y + radius);
    ctx.quadraticCurveTo(BTN_X, BTN_Y, BTN_X + radius, BTN_Y);
    ctx.closePath();

    ctx.fillStyle = this.open ? '#7c3aed' : hovered ? '#2d2d5e' : '#1a1a35';
    ctx.fill();

    ctx.strokeStyle = this.open ? '#ffffff' : (hovered ? '#7c3aed' : '#3a3a6a');
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Icon — emoji flag or Ñ
    const isEmoji = lang.icon !== 'Ñ';
    ctx.font = isEmoji ? '20px monospace' : 'bold 17px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(lang.icon, BTN_X + BTN_W / 2, BTN_Y + BTN_H / 2 + (isEmoji ? 1 : 0));
  }

  private drawDropdown(): void {
    const { ctx } = this;
    const totalH = DROP_PAD + LANGUAGES.length * DROP_ITEM_H + DROP_PAD;
    const currentCode = getLanguage();

    // Dropdown background
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(DROP_X + radius, DROP_Y);
    ctx.lineTo(DROP_X + DROP_W - radius, DROP_Y);
    ctx.quadraticCurveTo(DROP_X + DROP_W, DROP_Y, DROP_X + DROP_W, DROP_Y + radius);
    ctx.lineTo(DROP_X + DROP_W, DROP_Y + totalH - radius);
    ctx.quadraticCurveTo(DROP_X + DROP_W, DROP_Y + totalH, DROP_X + DROP_W - radius, DROP_Y + totalH);
    ctx.lineTo(DROP_X + radius, DROP_Y + totalH);
    ctx.quadraticCurveTo(DROP_X, DROP_Y + totalH, DROP_X, DROP_Y + totalH - radius);
    ctx.lineTo(DROP_X, DROP_Y + radius);
    ctx.quadraticCurveTo(DROP_X, DROP_Y, DROP_X + radius, DROP_Y);
    ctx.closePath();

    ctx.fillStyle = '#12122a';
    ctx.fill();
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Items
    for (let i = 0; i < LANGUAGES.length; i++) {
      const lang: LangMeta = LANGUAGES[i]!;
      const itemY = DROP_Y + DROP_PAD + i * DROP_ITEM_H;
      const isActive  = lang.code === currentCode;
      const isHovered = inRect(this.mx, this.my, DROP_X + 2, itemY, DROP_W - 4, DROP_ITEM_H);

      // Item background
      if (isActive || isHovered) {
        const r = 5;
        const ix = DROP_X + 4, iy = itemY + 2, iw = DROP_W - 8, ih = DROP_ITEM_H - 4;
        ctx.beginPath();
        ctx.moveTo(ix + r, iy);
        ctx.lineTo(ix + iw - r, iy);
        ctx.quadraticCurveTo(ix + iw, iy, ix + iw, iy + r);
        ctx.lineTo(ix + iw, iy + ih - r);
        ctx.quadraticCurveTo(ix + iw, iy + ih, ix + iw - r, iy + ih);
        ctx.lineTo(ix + r, iy + ih);
        ctx.quadraticCurveTo(ix, iy + ih, ix, iy + ih - r);
        ctx.lineTo(ix, iy + r);
        ctx.quadraticCurveTo(ix, iy, ix + r, iy);
        ctx.closePath();
        ctx.fillStyle = isActive ? '#7c3aed' : '#2d2d5e';
        ctx.fill();
      }

      // Icon
      const isEmoji = lang.icon !== 'Ñ';
      const centerY = itemY + DROP_ITEM_H / 2;
      ctx.font = isEmoji ? '20px monospace' : 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(lang.icon, DROP_X + 20, centerY + (isEmoji ? 1 : 0));

      // Name
      ctx.font = isActive ? 'bold 13px monospace' : '13px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = isActive ? '#ffffff' : '#a0a0c0';
      ctx.fillText(lang.name, DROP_X + 38, centerY);

      // Active checkmark
      if (isActive) {
        ctx.font = '13px monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('✓', DROP_X + DROP_W - 10, centerY);
      }
    }
  }

  // ── Event handling ───────────────────────────────────────────────────────────

  onMouseMove(x: number, y: number): void {
    this.mx = x;
    this.my = y;
  }

  /**
   * Handle mousedown. Returns true if the event was consumed (within
   * the switcher's interactive area) so the caller can skip the active screen.
   */
  onMouseDown(x: number, y: number): boolean {
    // Click on the flag button — toggle dropdown
    if (inRect(x, y, BTN_X, BTN_Y, BTN_W, BTN_H)) {
      this.open = !this.open;
      return true;
    }

    if (this.open) {
      // Click on a dropdown item — select language
      for (let i = 0; i < LANGUAGES.length; i++) {
        const itemY = DROP_Y + DROP_PAD + i * DROP_ITEM_H;
        if (inRect(x, y, DROP_X, itemY, DROP_W, DROP_ITEM_H)) {
          setLanguage(LANGUAGES[i]!.code);
          this.open = false;
          return true;
        }
      }
      // Click outside — close dropdown and consume event
      this.open = false;
      return true;
    }

    return false;
  }

  /** Close the dropdown (e.g. when navigating to a new screen). */
  close(): void {
    this.open = false;
  }

  /** Whether an in-progress drag/interaction should be blocked by the switcher. */
  isOpen(): boolean {
    return this.open;
  }
}
