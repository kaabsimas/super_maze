import { AppController } from './state/AppController';
import { CANVAS_W, CANVAS_H } from './constants';

const canvas = document.getElementById('app') as HTMLCanvasElement;
const dpr = window.devicePixelRatio || 1;

canvas.width = CANVAS_W * dpr;
canvas.height = CANVAS_H * dpr;
canvas.style.width = `${CANVAS_W}px`;
canvas.style.height = `${CANVAS_H}px`;

const ctx = canvas.getContext('2d')!;
ctx.scale(dpr, dpr);

new AppController(canvas, ctx);
