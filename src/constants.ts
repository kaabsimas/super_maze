// Grid dimensions — 4:3 ratio at 20px per cell = 800×600
export const CELL_SIZE = 20;
export const GRID_COLS = 40;
export const GRID_ROWS = 30;

// Padding around the grid
export const GRID_PADDING = 12;

// Side toolbar width (tile picker in editor)
export const SIDE_TOOLBAR_W = 64;

const GRID_W = CELL_SIZE * GRID_COLS; // 800
const GRID_H = CELL_SIZE * GRID_ROWS; // 600

// Canvas dimensions
// Width: side toolbar + padding + grid + padding
// Height: top toolbar + padding + grid + padding
export const CANVAS_W = SIDE_TOOLBAR_W + GRID_PADDING + GRID_W + GRID_PADDING; // 888
export const CANVAS_H = GRID_H + GRID_PADDING * 2 + 88; // top toolbar (88) + grid + padding

// Colors
export const COLOR_WALL    = '#2c3e50';
export const COLOR_FLOOR   = '#ecf0f1';
export const COLOR_PLAYER  = '#e74c3c';
export const COLOR_EXIT    = '#2ecc71';
export const COLOR_VISITED = '#aed6f1';
export const COLOR_FRONTIER= '#f9e79f';
export const COLOR_PATH    = '#f39c12';
export const COLOR_BG      = '#0a0a1a';
export const COLOR_UI_BG   = '#12122a';
export const COLOR_UI_PANEL= '#1a1a35';
export const COLOR_ACCENT  = '#7c3aed';
export const COLOR_TEXT    = '#e2e8f0';
export const COLOR_TEXT_DIM = '#64748b';

// Player emoji
export const PLAYER_EMOJI = '🧭';

// Debug step interval in ms
export const DEBUG_STEP_MS = 80;

// Run animation step interval in ms
export const RUN_STEP_MS = 60;
