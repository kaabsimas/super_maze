export const es: Record<string, string> = {
  // Main Menu
  'menu.subtitle':  'Búsqueda de Caminos Interactiva',
  'menu.newGame':   '▶  Nuevo Juego',
  'menu.savedMaps': '📁  Mapas Guardados',
  'menu.footer':    'A* y Dijkstra • Modo Depuración • Editor de Laberintos',

  // Saved Maps
  'savedMaps.title':         'Mapas Guardados',
  'savedMaps.back':          '← Volver',
  'savedMaps.empty':         'No hay mapas guardados aún.',
  'savedMaps.emptyHint':     '¡Crea un nuevo juego para comenzar!',
  'savedMaps.scrollUp':      '▲ subir',
  'savedMaps.scrollDown':    '▼ bajar',
  'savedMaps.edit':          '✏ Editar',
  'savedMaps.run':           '▶ Jugar',
  'savedMaps.del':           '✕',
  'savedMaps.confirmDelete': '¿Eliminar mapa "{name}"?',

  // Editor — toolbar
  'editor.algorithm':  'Algoritmo:',
  'editor.debug':      'Depurar',
  'editor.save':       '💾 Guardar',
  'editor.run':        '▶ Jugar',
  'editor.clear':      '🗑 Borrar',
  'editor.back':       '✕',
  'editor.defaultName':'Laberinto {date}',

  // Editor — side toolbar tools
  'editor.tool.wall':     'muro',
  'editor.tool.player':   'inicio',
  'editor.tool.exit':     'salida',
  'editor.tool.mud':      'barro',
  'editor.tool.monster':  'monstruo',
  'editor.tool.potion':   'poción',
  'editor.tool.treasure': 'tesoro',
  'editor.tool.erase':    'borrar',

  // Editor — prompts / dialogs
  'editor.prompt.mapName':    'Nombre del mapa:',
  'editor.prompt.hp':         'Puntos de vida del personaje (1–99):',
  'editor.confirm.clear':     '¿Borrar todo el laberinto?',
  'editor.alert.noStart':     'Define el punto de inicio antes de ejecutar.',
  'editor.alert.noExit':      'Define la salida antes de ejecutar.',

  // Editor — warnings
  'editor.hint.noStart': '⚠ define inicio (🧭)',
  'editor.hint.noExit':  '⚠ define salida (★)',

  // Run — toolbar
  'run.back':    '← Volver',
  'run.restart': '↺ Reiniciar',
  'run.pause':   '⏸ Pausa',
  'run.resume':  '▶ Continuar',

  // Run — HP panel
  'run.hitpoints': 'VIDA',

  // Run — state: caught
  'run.caught.title': '¡Capturado por un monstruo! 👾',
  'run.caught.msg':   'El personaje chocó con un monstruo.',
  'run.caught.hint':  'Presiona ↺ Reiniciar o ← Volver para editar.',

  // Run — state: no path
  'run.notFound.title': '¡Sin camino disponible!',
  'run.notFound.msg':   'No hay ruta desde el inicio hasta la salida.',
  'run.notFound.hint':  'Presiona ↺ Reiniciar o ← Volver para editar.',

  // Run — state: path found
  'run.found.survived': '¡Salida encontrada! 🎉',
  'run.found.dead':     '¡Sin HP suficiente! 💀',
  'run.found.steps':    'Camino: {steps} pasos • {iters} iteraciones',
  'run.found.hp':       'Monstruos en el camino: {lost} • HP tras colisiones: {hp} / {max}',
  'run.found.hint':     'Presiona ↺ Reiniciar o ← Volver',

  // Language switcher
  'lang.icon': 'Ñ',
  'lang.name': 'Español',
};
