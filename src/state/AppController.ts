import { CANVAS_W, CANVAS_H } from '../constants';
import type { Screen } from '../screens/Screen';
import type { NavigatePayload, ScreenName } from '../types';
import { MainMenuScreen } from '../screens/MainMenuScreen';
import { SavedMapsScreen } from '../screens/SavedMapsScreen';
import { MapEditorScreen } from '../screens/MapEditorScreen';
import { RunScreen } from '../screens/RunScreen';
import { LangSwitcher } from '../ui/LangSwitcher';

export class AppController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private activeScreen: Screen;
  private rafId = 0;
  private lastTime = 0;
  private langSwitcher: LangSwitcher;
  /** True when the last mousedown was consumed by the LangSwitcher. */
  private langConsumed = false;

  // Track editor state so RunScreen can inherit algo/debug settings
  private editorScreen: MapEditorScreen | null = null;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.langSwitcher = new LangSwitcher(ctx);
    this.activeScreen = new MainMenuScreen(ctx, this);
    this.bindEvents();
    this.loop(0);
  }

  navigateTo(screen: ScreenName, payload: NavigatePayload): void {
    this.langSwitcher.close();
    this.activeScreen.dispose();

    switch (screen) {
      case 'mainMenu':
        this.editorScreen = null;
        this.activeScreen = new MainMenuScreen(this.ctx, this);
        break;

      case 'savedMaps':
        this.activeScreen = new SavedMapsScreen(this.ctx, this);
        break;

      case 'editor': {
        const ed = new MapEditorScreen(this.ctx, this, payload.mazeId);
        this.editorScreen = ed;
        this.activeScreen = ed;
        break;
      }

      case 'run': {
        const mazeId = payload.mazeId ?? this.editorScreen?.getMazeId() ?? '';
        const settings = this.editorScreen?.getSettings() ?? {
          algorithm: 'astar' as const,
          debugMode: false,
          playerHitpoints: undefined as number | undefined,
        };
        this.activeScreen = new RunScreen(
          this.ctx,
          this,
          mazeId,
          settings.algorithm,
          settings.debugMode,
          settings.playerHitpoints,
        );
        break;
      }
    }
  }

  private loop(time: number): void {
    const dt = time - this.lastTime;
    this.lastTime = time;

    this.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    this.activeScreen.render(dt);
    // LangSwitcher renders on top of everything
    this.langSwitcher.render();

    this.rafId = requestAnimationFrame(t => this.loop(t));
  }

  private bindEvents(): void {
    const c = this.canvas;

    const coords = (e: MouseEvent) => {
      const rect = c.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left),
        y: (e.clientY - rect.top),
      };
    };

    c.addEventListener('mousemove', e => {
      const { x, y } = coords(e);
      this.langSwitcher.onMouseMove(x, y);
      this.activeScreen.onMouseMove(x, y);
    });

    c.addEventListener('mousedown', e => {
      const { x, y } = coords(e);
      this.langConsumed = this.langSwitcher.onMouseDown(x, y);
      if (!this.langConsumed) {
        this.activeScreen.onMouseDown(x, y, e.button);
      }
    });

    c.addEventListener('mouseup', e => {
      const { x, y } = coords(e);
      if (this.langConsumed) {
        this.langConsumed = false;
      } else {
        this.activeScreen.onMouseUp(x, y, e.button);
      }
    });

    // Prevent context menu on right-click
    c.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('keydown', e => {
      this.activeScreen.onKeyDown(e);
    });
  }
}
