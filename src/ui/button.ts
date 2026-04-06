import { COLOR_ACCENT, COLOR_TEXT, COLOR_UI_PANEL } from '../constants';

export interface ButtonRect {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

export function drawButton(
  ctx: CanvasRenderingContext2D,
  btn: ButtonRect,
  hovered: boolean
): void {
  const { x, y, w, h, label, active, danger, disabled } = btn;
  const radius = 6;

  let bg: string;
  if (disabled) {
    bg = '#2a2a4a';
  } else if (danger) {
    bg = hovered ? '#c0392b' : '#922b21';
  } else if (active) {
    bg = COLOR_ACCENT;
  } else {
    bg = hovered ? '#2d2d5e' : COLOR_UI_PANEL;
  }

  // Rounded rect
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  ctx.fillStyle = bg;
  ctx.fill();

  if (active && !disabled) {
    ctx.strokeStyle = COLOR_ACCENT;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (hovered && !disabled) {
    ctx.strokeStyle = 'rgba(124,58,237,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillStyle = disabled ? '#4a4a6a' : COLOR_TEXT;
  ctx.font = `${h * 0.4}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
}

export function hitTest(btn: ButtonRect, mx: number, my: number): boolean {
  return mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
}
