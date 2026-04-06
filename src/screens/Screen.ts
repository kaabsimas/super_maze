export interface Screen {
  /** Called every animation frame */
  render(dt: number): void;

  onMouseMove(x: number, y: number): void;
  /** button: 0 = left, 2 = right */
  onMouseDown(x: number, y: number, button: number): void;
  /** button: 0 = left, 2 = right */
  onMouseUp(x: number, y: number, button: number): void;
  onKeyDown(e: KeyboardEvent): void;

  /** Called when screen is about to be replaced */
  dispose(): void;
}
