# Super Maze

Simulador interativo de labirintos com visualização de algoritmos de pathfinding. Construído com TypeScript puro e Canvas 2D — zero dependências em runtime.

---

## Requisitos

- Node.js 18+
- npm 9+

---

## Instalação e execução

```bash
# 1. Instalar dependências (apenas Vite + TypeScript como devDependencies)
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173` no navegador.

---

## Build para produção

```bash
npm run build
```

Gera a pasta `dist/` com um bundle único de ~22KB (gzip ~7KB). Para servir localmente:

```bash
npm run preview
```

---

## Como usar

### Menu inicial

Ao abrir o jogo, duas opções estão disponíveis:

- **Novo Jogo** — abre o editor com um grid em branco
- **Mapas Salvos** — lista os labirintos criados anteriormente

---

### Editor de mapas

O editor ocupa a tela inteira (grid 40×30 células, proporção 4:3).

#### Ferramentas de pintura

Clique em uma ferramenta na barra superior e depois clique ou arraste sobre o grid:

| Botão | Atalho | Função |
|-------|--------|--------|
| ■ Parede | `W` | Pinta células como parede (bloqueadas) |
| □ Chão | `F` | Pinta células como chão (transitáveis) |
| 🧭 Início | `P` | Define o ponto de partida do personagem |
| ★ Saída | `E` | Define a saída do labirinto |
| ✕ Apagar | `X` | Apaga a célula (vira chão) |

> Só pode existir **um ponto de início** e **uma saída** por mapa. Ao colocar um novo, o anterior é removido automaticamente.

#### Escolha do algoritmo

Na barra superior, selecione o algoritmo que será usado na execução:

- **A\*** — usa heurística de distância Manhattan; encontra o caminho mais curto de forma eficiente
- **Dijkstra** — explora por custo uniforme; garante o caminho mais curto sem heurística

#### Debug Mode

Ative o botão **Debug** (ou pressione `D`) para visualizar o algoritmo célula a célula com delay entre cada iteração:

| Cor | Significado |
|-----|-------------|
| Azul claro | Células já visitadas |
| Amarelo | Fronteira atual (candidatas a visitar) |
| Laranja | Caminho final encontrado |

Com Debug desativado, o algoritmo roda em velocidade máxima e exibe diretamente a animação do personagem.

#### Ações

| Botão | Atalho | Função |
|-------|--------|--------|
| 💾 Salvar | — | Salva o mapa no localStorage (pede nome) |
| ▶ Rodar | — | Salva automaticamente e executa |
| 🗑 Limpar | — | Apaga todo o grid |
| ✕ | `Esc` | Volta ao menu inicial |

---

### Tela de execução

O algoritmo controla o personagem automaticamente.

- Durante a busca, as células visitadas e a fronteira são coloridas em tempo real
- Ao encontrar o caminho, o personagem 🧭 percorre a rota até a saída ★
- Se não houver caminho possível, uma mensagem é exibida na tela

#### Controles

| Botão / Tecla | Função |
|---------------|--------|
| ← Voltar | Retorna ao editor |
| ↺ Reiniciar / `R` | Recomeça a execução do zero |
| ⏸ Pausa / `Espaço` | Pausa ou retoma o algoritmo |
| `Esc` | Retorna ao editor |

---

### Mapas salvos

Lista todos os labirintos salvos, ordenados por data de modificação.

- **✏ Editar** — abre o mapa no editor
- **▶ Rodar** — executa diretamente
- **✕** — exclui o mapa (pede confirmação)

Navegação pela lista: `↑` / `↓` ou `PageUp` / `PageDown`.

---

## Estrutura do projeto

```
src/
├── main.ts                  # Bootstrap: canvas HiDPI + AppController
├── constants.ts             # Tamanhos, cores e intervalos
├── types.ts                 # Interfaces TypeScript compartilhadas
├── storage.ts               # Persistência via localStorage
├── grid/
│   ├── Grid.ts              # Modelo de dados do labirinto
│   └── GridRenderer.ts      # Renderização do grid no canvas
├── algorithms/
│   ├── utils.ts             # MinHeap, heurística Manhattan, reconstrução de caminho
│   ├── astar.ts             # Implementação A* (generator)
│   └── dijkstra.ts          # Implementação Dijkstra (generator)
├── ui/
│   └── button.ts            # Botões canvas com hit-test
├── screens/
│   ├── Screen.ts            # Interface base das telas
│   ├── MainMenuScreen.ts
│   ├── SavedMapsScreen.ts
│   ├── MapEditorScreen.ts
│   └── RunScreen.ts
└── state/
    └── AppController.ts     # Roteamento entre telas e game loop
```

---

## Detalhes técnicos

- **Grid:** 40 colunas × 30 linhas × 20px por célula = 800×600px (4:3)
- **Algoritmos:** implementados como [generators JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*), produzindo um `AlgorithmStep` por iteração — o que permite o debug mode sem pré-computar todos os passos
- **Persistência:** `localStorage` com chave `super_maze_maps` (JSON)
- **UI:** 100% canvas — nenhum elemento HTML além do `<canvas>`, exceto `prompt()` e `confirm()` nativos do browser
- **HiDPI:** canvas escalado por `devicePixelRatio` para telas retina
