# Super Maze

Simulador interativo de labirintos com visualização de algoritmos de pathfinding. Construído com TypeScript puro e Canvas 2D — zero dependências em runtime.

---

## Status atual

| Área | Estado |
|------|--------|
| Editor de mapas | ✅ Completo |
| Algoritmos A\* e Dijkstra | ✅ Completo |
| Sistema de HP do jogador | ✅ Completo |
| Tiles especiais (lama, monstro, poção, tesouro) | ✅ Completo |
| Modo Depurar (visualização passo a passo) | ✅ Completo |
| Coleta de tesouros com pathfinding encadeado | ✅ Completo |
| Persistência via localStorage | ✅ Completo |
| Suporte a HiDPI (devicePixelRatio) | ✅ Completo |

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
npm run build   # tsc --noEmit + vite build
npm run preview # serve a pasta dist/ localmente
```

---

## Como usar

### Menu inicial

Ao abrir o jogo, duas opções estão disponíveis:

- **Novo Jogo** — abre o editor com um grid em branco
- **Mapas Salvos** — lista os labirintos criados anteriormente

---

### Editor de mapas

O canvas mede **888×688 px** (grid 40×30 células de 20 px cada). A interface é dividida em:

- **Barra superior** (52 px) — seleção de algoritmo, modo depurar, HP e ações
- **Painel lateral esquerdo** (64 px) — paleta de tiles
- **Grid central** — área de edição

#### Paleta de tiles

Clique em um tile no painel lateral e depois clique ou arraste sobre o grid:

| Tile | Ícone | Custo | Função |
|------|-------|-------|--------|
| Parede | ■ | ∞ | Bloqueia a passagem (intransponível) |
| Início | 🧭 | 1 | Define o ponto de partida do personagem |
| Saída | ★ | 1 | Define a saída do labirinto |
| Lama | 💧 | 3 | Transitável, mas custa mais iterações |
| Monstro | 👾 | 8 | Transitável (alto custo); entra em colisão com o jogador e drena 1 HP |
| Poção | 🧪 | 1 | Restaura 1 HP ao ser coletada |
| Tesouro | 💎 | 1 | O algoritmo desvia da rota para coletar todos os tesouros antes da saída |
| Apagar | ✕ | — | Converte a célula em chão (custo 1) |

> Só pode existir **um ponto de início** e **uma saída** por mapa. Novos posicionamentos removem os anteriores automaticamente.

#### Atalhos de teclado — editor

| Tecla | Ação |
|-------|------|
| `W` | Seleciona Parede |
| `P` | Seleciona Início |
| `E` | Seleciona Saída |
| `X` | Seleciona Apagar |
| `D` | Ativa/desativa modo Depurar |
| `Esc` | Volta ao menu inicial |

> Botão direito do mouse também apaga a célula clicada.

#### Configurações da barra superior

- **A\*** / **Dijkstra** — algoritmo usado na execução
- **Depurar** — ativa visualização passo a passo com delay de 80 ms entre iterações
- **❤ HP:N** — define os pontos de vida iniciais do personagem (clique para ciclar entre 1–5)

#### Ações

| Botão | Atalho | Função |
|-------|--------|--------|
| 💾 Salvar | — | Salva o mapa no localStorage (solicita nome) |
| ▶ Rodar | — | Salva automaticamente e executa |
| 🗑 Limpar | — | Apaga todo o grid |
| ✕ | `Esc` | Volta ao menu inicial |

---

### Escolha do algoritmo

Ambos os algoritmos consideram os **custos de célula** ao calcular o caminho:

| Algoritmo | Heurística | Garante menor custo? |
|-----------|-----------|----------------------|
| **A\*** | Distância Manhattan | Sim (com heurística admissível) |
| **Dijkstra** | Nenhuma | Sim (custo uniforme) |

Custos por tipo de célula: chão = 1 · lama = 3 · monstro = 8.

---

### Modo Depurar

Ative o botão **Depurar** (ou pressione `D`) para visualizar o algoritmo célula a célula:

| Cor | Significado |
|-----|-------------|
| Azul claro | Células já visitadas |
| Amarelo | Fronteira atual (candidatas a visitar) |
| Laranja | Caminho final encontrado |

Quando há tesouros no mapa, o modo depurar exibe o cálculo de **cada segmento de rota** em sequência (início → tesouro 1 → tesouro 2 → … → saída).

Com Depurar desativado, o algoritmo roda em velocidade máxima e exibe diretamente a animação do personagem.

---

### Tela de execução

O algoritmo controla o personagem automaticamente.

- O personagem percorre o caminho calculado até a saída ★
- **Tesouros** são coletados ao longo do trajeto (o algoritmo encadeia segmentos de pathfinding)
- **Poções** restauram 1 HP ao serem pisadas
- **Monstros** drenam 1 HP ao colidirem com o personagem
- O **painel de HP** no canto superior direito muda de cor: verde → laranja → vermelho
- Se o HP chegar a zero, o estado muda para **Capturado** e o jogo termina

#### Estados da execução

| Estado | Descrição |
|--------|-----------|
| Rodando | Algoritmo em progresso |
| Caminho encontrado | Personagem animado percorrendo a rota |
| Sem caminho | Nenhuma rota possível entre início e saída |
| Capturado | Jogador ficou sem HP |

#### Controles

| Botão / Tecla | Função |
|---------------|--------|
| ← Voltar | Retorna ao editor |
| ↺ Reiniciar | Recomeça a execução do zero |
| ⏸ Pausa / ▶ Continuar | Pausa ou retoma (modo depurar) |
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
├── constants.ts             # Tamanhos, custos, cores e intervalos
├── types.ts                 # Interfaces TypeScript compartilhadas
├── storage.ts               # Persistência via localStorage
├── grid/
│   ├── Grid.ts              # Modelo de dados (células, spawns, tesouros, HP)
│   └── GridRenderer.ts      # Renderização do grid (tiles, overlay de algoritmo, monstros)
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

- **Canvas:** 888×688 px — barra lateral (64 px) + padding (12 px) + grid (800 px) + padding (12 px); altura = toolbar (88 px) + padding + grid (600 px) + padding
- **Grid:** 40 colunas × 30 linhas × 20 px por célula = 800×600 px
- **Algoritmos:** implementados como [generators JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*), produzindo um `AlgorithmStep` por iteração — permite o modo depurar sem pré-computar todos os passos
- **Pathfinding de tesouros:** o algoritmo encadeia segmentos (início → tesouro mais próximo → próximo tesouro → saída) usando busca gulosa por proximidade Manhattan
- **Custos de célula:** chão = 1, lama = 3, monstro = 8 (custo alto para desviar quando possível)
- **Persistência:** `localStorage` com chave `super_maze_maps` (JSON); dados incluem spawns de monstros, posições de tesouros e HP inicial
- **UI:** 100% canvas — nenhum elemento HTML além do `<canvas>`, exceto `prompt()` e `confirm()` nativos do browser
- **HiDPI:** canvas escalado por `devicePixelRatio` para telas retina

---

## Regras para desenvolvimento

1. **Zero dependências em runtime.** Adicione pacotes apenas como `devDependencies`. Runtime deve ser TypeScript puro + Canvas 2D.
2. **Novos tiles** devem ser adicionados em: `types.ts` (`CellType`), `constants.ts` (cor + custo se aplicável), `Grid.ts` (`setCell` / `fill` / `cellHpCost`), `GridRenderer.ts` (renderização) e `MapEditorScreen.ts` (paleta lateral).
3. **Algoritmos** devem ser implementados como generators (`function*`) retornando `AlgorithmStep` a cada iteração para manter compatibilidade com o modo depurar.
4. **Não adicione elementos HTML.** Toda a UI deve ser desenhada via Canvas 2D API.
5. **Persistência** só via `localStorage` usando as funções em `storage.ts`. Não acesse `localStorage` diretamente em outras camadas.
6. **Tipos compartilhados** ficam em `types.ts`. Não duplique definições de tipo entre módulos.
7. **Constantes visuais** (cores, tamanhos, intervalos) ficam em `constants.ts`. Não use valores literais espalhados no código.
8. **Antes do build**, rode `tsc --noEmit` para garantir que não há erros de tipo (já incluído no script `npm run build`).
