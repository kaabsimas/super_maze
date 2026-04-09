export const en: Record<string, string> = {
  // Main Menu
  'menu.subtitle':  'Interactive Pathfinding',
  'menu.newGame':   '▶  New Game',
  'menu.savedMaps': '📁  Saved Maps',
  'menu.footer':    'A* & Dijkstra • Debug Mode • Maze Editor',

  // Saved Maps
  'savedMaps.title':         'Saved Maps',
  'savedMaps.back':          '← Back',
  'savedMaps.empty':         'No saved maps yet.',
  'savedMaps.emptyHint':     'Create a new game to get started!',
  'savedMaps.scrollUp':      '▲ scroll up',
  'savedMaps.scrollDown':    '▼ scroll down',
  'savedMaps.edit':          '✏ Edit',
  'savedMaps.run':           '▶ Run',
  'savedMaps.del':           '✕',
  'savedMaps.confirmDelete': 'Delete map "{name}"?',

  // Editor — toolbar
  'editor.algorithm':  'Algorithm:',
  'editor.debug':      'Debug',
  'editor.save':       '💾 Save',
  'editor.run':        '▶ Run',
  'editor.clear':      '🗑 Clear',
  'editor.back':       '✕',
  'editor.defaultName':'Maze {date}',

  // Editor — side toolbar tools
  'editor.tool.wall':     'wall',
  'editor.tool.player':   'start',
  'editor.tool.exit':     'exit',
  'editor.tool.mud':      'mud',
  'editor.tool.monster':  'monster',
  'editor.tool.potion':   'potion',
  'editor.tool.treasure': 'treasure',
  'editor.tool.erase':    'erase',

  // Editor — prompts / dialogs
  'editor.prompt.mapName':    'Map name:',
  'editor.prompt.hp':         'Character hitpoints (1–99):',
  'editor.confirm.clear':     'Clear the entire maze?',
  'editor.alert.noStart':     'Set a start point before running.',
  'editor.alert.noExit':      'Set an exit before running.',

  // Editor — warnings
  'editor.hint.noStart': '⚠ set start (🧭)',
  'editor.hint.noExit':  '⚠ set exit (★)',

  // Run — toolbar
  'run.back':    '← Back',
  'run.restart': '↺ Restart',
  'run.pause':   '⏸ Pause',
  'run.resume':  '▶ Resume',

  // Run — HP panel
  'run.hitpoints': 'HITPOINTS',

  // Run — state: caught
  'run.caught.title': 'Caught by a monster! 👾',
  'run.caught.msg':   'The character collided with a monster.',
  'run.caught.hint':  'Press ↺ Restart or ← Back to edit.',

  // Run — state: no path
  'run.notFound.title': 'No path available!',
  'run.notFound.msg':   'There is no route from start to exit.',
  'run.notFound.hint':  'Press ↺ Restart or ← Back to edit.',

  // Run — state: path found
  'run.found.survived': 'Exit found! 🎉',
  'run.found.dead':     'Not enough HP! 💀',
  'run.found.steps':    'Path: {steps} steps • {iters} iterations',
  'run.found.hp':       'Monsters on path: {lost} • HP after collisions: {hp} / {max}',
  'run.found.hint':     'Press ↺ Restart or ← Back',

  // Language switcher
  'lang.icon': '🇺🇸',
  'lang.name': 'English',
};
