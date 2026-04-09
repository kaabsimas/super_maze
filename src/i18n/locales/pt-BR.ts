export const ptBR: Record<string, string> = {
  // Main Menu
  'menu.subtitle':  'Pathfinding Interativo',
  'menu.newGame':   '▶  Novo Jogo',
  'menu.savedMaps': '📁  Mapas Salvos',
  'menu.footer':    'A* e Dijkstra • Modo Depurar • Editor de Labirintos',

  // Saved Maps
  'savedMaps.title':         'Mapas Salvos',
  'savedMaps.back':          '← Voltar',
  'savedMaps.empty':         'Nenhum mapa salvo ainda.',
  'savedMaps.emptyHint':     'Crie um novo jogo para começar!',
  'savedMaps.scrollUp':      '▲ rolar acima',
  'savedMaps.scrollDown':    '▼ rolar abaixo',
  'savedMaps.edit':          '✏ Editar',
  'savedMaps.run':           '▶ Rodar',
  'savedMaps.del':           '✕',
  'savedMaps.confirmDelete': 'Excluir mapa "{name}"?',

  // Editor — toolbar
  'editor.algorithm':  'Algoritmo:',
  'editor.debug':      'Depurar',
  'editor.save':       '💾 Salvar',
  'editor.run':        '▶ Rodar',
  'editor.clear':      '🗑 Limpar',
  'editor.back':       '✕',
  'editor.defaultName':'Labirinto {date}',

  // Editor — side toolbar tools
  'editor.tool.wall':     'parede',
  'editor.tool.player':   'início',
  'editor.tool.exit':     'saída',
  'editor.tool.mud':      'lama',
  'editor.tool.monster':  'monstro',
  'editor.tool.potion':   'poção',
  'editor.tool.treasure': 'tesouro',
  'editor.tool.erase':    'apagar',

  // Editor — prompts / dialogs
  'editor.prompt.mapName':    'Nome do mapa:',
  'editor.prompt.hp':         'Hitpoints do personagem (1–99):',
  'editor.confirm.clear':     'Limpar todo o labirinto?',
  'editor.alert.noStart':     'Defina o ponto de início antes de executar.',
  'editor.alert.noExit':      'Defina a saída antes de executar.',

  // Editor — warnings
  'editor.hint.noStart': '⚠ defina início (🧭)',
  'editor.hint.noExit':  '⚠ defina saída (★)',

  // Run — toolbar
  'run.back':    '← Voltar',
  'run.restart': '↺ Reiniciar',
  'run.pause':   '⏸ Pausa',
  'run.resume':  '▶ Continuar',

  // Run — HP panel
  'run.hitpoints': 'HITPOINTS',

  // Run — state: caught
  'run.caught.title': 'Capturado pelo monstro! 👾',
  'run.caught.msg':   'O personagem colidiu com um monstro.',
  'run.caught.hint':  'Pressione ↺ Reiniciar ou ← Voltar para editar.',

  // Run — state: no path
  'run.notFound.title': 'Sem caminho disponível!',
  'run.notFound.msg':   'Não há rota da origem até a saída.',
  'run.notFound.hint':  'Pressione ↺ Reiniciar ou ← Voltar para editar.',

  // Run — state: path found
  'run.found.survived': 'Saída encontrada! 🎉',
  'run.found.dead':     'Sem HP suficiente! 💀',
  'run.found.steps':    'Caminho: {steps} passos • {iters} iterações',
  'run.found.hp':       'Monstros no caminho: {lost} • HP após colisões: {hp} / {max}',
  'run.found.hint':     'Pressione ↺ Reiniciar ou ← Voltar',

  // Language switcher
  'lang.icon': '🇧🇷',
  'lang.name': 'Português',
};
