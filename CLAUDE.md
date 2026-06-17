# CLAUDE.md

Guidance for working in this repo. Covers the non-obvious bits; for generic
React/Create-React-App usage see `README.md`.

## What this is

A browser clone of LinkedIn's **Zip** puzzle. The player drags a single path
that starts at `1`, passes through every cell exactly once, hits the numbered
clues in ascending order, and never crosses a **wall** (a barrier on the edge
between two cells). Each generated puzzle is shareable via a compact URL hash.

## Commands

```bash
npm start                 # dev server at http://localhost:3000
CI=true npm test          # run tests once (plain `npm test` opens watch mode and hangs)
CI=true npm run build     # production build
```

> **`CI=true` matters.** The build/test harness treats lint warnings as errors
> when `CI` is set, and `npm test` without it starts an interactive watcher.
> Always run them with `CI=true` for a non-interactive, fail-on-warning check.

## Architecture

Logic, components, and styling are deliberately separated:

- `src/lib/` — pure, UI-free logic (easy to reason about / test):
  - `constants.js` — `DIFFICULTIES` (`easy: 4, medium: 6, hard: 8`, the grid is
    `size x size`) and `DEFAULT_SIZE` (Medium). `SIZE` is a legacy alias kept for
    the codec's size-less decode path; logic functions take an explicit `size`.
  - `puzzle.js` — `generatePuzzle({ size, budget })` builds a full path, greedily
    reduces clues, then trades clues for walls (see "walls" below). A
    backtracking solver (`findSolutions` / `hasUniqueSolution`, which read the
    size from `grid.length`) confirms uniqueness and supplies the counterexample
    solutions used to place walls. `createGridFromPath(path, size)` converts a
    path to a grid. `minClues(size)` scales the clue floor with the grid.
  - `walls.js` — wall representation: `edgeKey` (normalized, **coordinate-based**
    so it's size-independent), the canonical `allEdges(size)` list, and
    `pathEdgeKeys`. Walls are a `Set` of edge keys threaded through generation,
    solving, the codec, and both grids.
  - `urlCodec.js` — `encodePuzzleToHash` / `decodePuzzleFromHash` for the
    shareable URL (path + clue mask + optional wall mask).
  - `hamiltonian_path.js` — **vendored** (see below).
- `src/components/`
  - `NumberGrid.js` — the interactive board (drag handling, timer, win/share).
    Takes a `walls` prop: blocks drags across a wall and draws the wall overlay.
    Derives `size` from `grid.length` and scales the cell size (and clue/stroke
    sizes) to a fixed `BOARD_TARGET` width, so 4/6/8 grids all fit the same card.
  - `SolutionGrid.js` — read-only SVG of the answer ("Show Answer"), incl. walls.
    Derives `size` from the path bounds and scales similarly.
  - `Button.js` — shared pill button; pick a look with `variant`.
- `src/App.js` — layout + orchestration only. Holds the `difficulty` state and
  the Easy/Medium/Hard selector (picking one starts a new game at that `size`);
  loads from the URL or generates, and syncs `difficulty` from a loaded board.
- `src/theme.js` — **all** colors / radii / fonts. Add new design values here;
  don't hardcode hex/spacing in components.

## Things to know before changing them

- **The grid size is chosen at runtime (difficulty), not a constant.** It's
  threaded as a `size` parameter through the pure logic and derived from the data
  in components (`grid.length` / path bounds). Don't reintroduce a single global
  `SIZE` for logic — only the codec's legacy decode branch leans on the size-6
  default.
- **URL hash format:** `#<size>-<pathStr>-<maskStr>[-<wallStr>]`. `size` is the
  grid dimension (`4`/`6`/`8`). `pathStr` is the solution path as base-36 cell
  indices, **fixed-width per cell**: 1 char when `size*size <= 36` (4×4, 6×6) and
  2 chars for 8×8 (64 cells exceed a single base-36 digit). `maskStr` is a
  **`BigInt`** base-36 bitmask of which path positions carry a clue (BigInt
  because an 8×8 mask is 64 bits, beyond `Number`'s safe range). Clue numbers are
  re-derived sequentially on decode, not stored. This is safe because the grid's
  clues are *already* a dense `1..k` run in path order: `createGridFromPath`
  numbers cells by their index in the (reduced) path array, so removing clues
  renumbers the survivors rather than leaving their original step indices. Don't
  "fix" the codec to store raw clue values — they aren't the step indices you
  might expect, and re-deriving reproduces the grid exactly (see
  `urlCodec.test.js`).
- **Legacy hashes (no leading `size` segment) still decode** as 6×6, single-char
  cells. `decodePuzzleFromHash` distinguishes the new format by a leading
  `4`/`6`/`8` segment (`/^(4|6|8)$/`); anything else is treated as the original
  2-/3-segment 6×6 encoding. Keep this branch and its `urlCodec.test.js` case.
- **`wallStr` is an optional final segment** — a base-36 bitmask over
  `allEdges(size)` (`2*size*(size-1)` internal edges) of which edges are walls.
  Two things make it work:
  - The order of `allEdges(size)` in `walls.js` is **load-bearing** — encode and
    decode both index into it, so reordering it silently corrupts saved walls.
  - It can exceed `Number`'s safe range (60 bits at 6×6, 112 at 8×8), so this
    mask uses `BigInt` (hence the `/* global BigInt */` directive — ESLint's env
    doesn't know `BigInt`).
  The segment is **omitted entirely when there are no walls**.
- **Walls are load-bearing by construction, not decoration** *(small grids)*.
  `generatePuzzle` only ever places a wall on a non-path edge (the real solution
  never crosses it, so it stays valid), and only in response to an *alternative*
  solution it eliminates — then a final pass drops any wall whose removal keeps
  the puzzle unique. Net result: removing any remaining wall reintroduces other
  solutions. The variety knob is `budget` (clues traded for walls); `budget: 0`
  is a classic wall-free board.
- **Large grids (8×8) also guarantee *barrier* walls.** Proving a clue-traded
  wall load-bearing means proving the sparser board unique, which is too costly
  to force within the node cap (below), so 8×8 only lands load-bearing walls ~¼
  of the time. To make hard mode reliably feature walls, `ensureWalls` tops up to
  a small target (4–6) with **barrier walls on non-path edges**. These are *safe
  but not necessarily load-bearing*: a non-path edge is never crossed by the real
  solution, and walls can only remove solutions (never add), so a unique board
  stays exactly unique — no re-verification needed. The top-up is skipped for
  `budget: 0` (still a clean wall-free classic). So the "every wall is
  load-bearing" invariant is asserted only for 4×4/6×6; 8×8 asserts
  walls-present, walls-off-path, and uniqueness.
- **The solver is node-capped on large grids (`LARGE_GRID_NODE_CAP`, 8×8 only).**
  Proving a sparse 8×8 uniquely solvable is exponential and can run for *minutes*;
  `findSolutions` therefore returns `{ solutions, capped }`, where `capped` means
  it hit the ceiling before finishing. A capped search is treated **conservatively
  as not-unique** (`hasUniqueSolution` returns false; `resolveWithWalls` returns
  false). This never makes a board falsely "unique" — uniqueness is only ever
  *accepted* from a completed search, so every generated board (all sizes) is
  genuinely uniquely solvable. The cap only limits *how sparse* 8×8 gets: clue
  removal stops once uniqueness can no longer be cheaply proven. The cap is
  **tuned to the solver's speed**, not a fixed difficulty: it's sized so a typical
  8×8 board generates in ~1s. The current value (`1_800_000`) assumes the fast
  solver (incremental visited array + precomputed wall-aware adjacency); the old
  80k value predates it. If you change the solver's per-node cost, re-benchmark
  and retune this — higher caps buy sparser/more-walled boards at the cost of
  generation latency, lower caps the reverse.
- **Generator invariants (all sizes), guaranteed and tested:** the **start and
  end cells are always clued**, and there are **always ≥ `minClues(size)` clues**
  (`max(4, round(size²·0.18))` → 4 / 6 / 12 for 4×4 / 6×6 / 8×8). The floor
  scales with size deliberately: a denser grid is more constrained, which keeps
  the backtracking solver fast on 8×8.
- **`hamiltonian_path.js` is vendored GPL code** (Nathan Clisby). It uses
  module-global mutable state (`path`, `n`, `left_end`, …) and has `eslint-disable`
  at the top. Keep the license header, don't "modernize" the algorithm, and don't
  rely on it being pure — `generate_hamiltonian_path` mutates and returns shared
  module state. Two local touch-points: `setLatticeSize(size)` sets the
  `xmax`/`ymax` globals (call it before generating, as `generatePuzzle` does);
  and because the returned `path` array is **never truncated**, after a larger
  grid it carries a stale tail — `generatePuzzle` slices it to `size*size`. Don't
  drop that slice or smaller boards inherit junk cells.
- **Styling is inline-style objects driven by `theme.js`**, not CSS files. Match
  that pattern; reusable button styling lives in `Button.js`.
- **Drag input is mouse + touch, kept in sync by hand.** Mouse uses
  `onMouseEnter`; touch can't (it never fires on the cell under a moving finger),
  so `onTouchMove` resolves the cell via `document.elementFromPoint(...)`
  `.closest("[data-row]")` and routes it through the *same* handler. If you
  change the cell DOM, keep the `data-row`/`data-col` attributes or touch drag
  breaks. Scrolling-while-dragging is suppressed with `touchAction: "none"` on
  the board, **not** `preventDefault` — React registers touch listeners as
  passive, so `preventDefault` is a no-op there.
- **Some UI slots reserve fixed height on purpose** (the status banner and the
  Clear/Share button row in `NumberGrid.js`). They render an empty box of fixed
  height when idle so the board and the buttons below never shift when a
  message or button appears. Don't collapse them to conditional-only rendering.

## Tests

- `src/App.test.js` — render smoke test.
- `src/lib/urlCodec.test.js` — malformed-input handling; encode→decode
  round-trips per size (hand-built and generated); the leading `size` segment;
  the 8×8 case (2 chars/cell + a 64-bit `BigInt` mask); wall round-trips; and
  **legacy size-less (6×6) decode** compatibility.
- `src/lib/puzzle.test.js` — runs the core invariants across `[4, 6, 8]` via
  `test.each`: a full Hamiltonian path, a clue-grid-plus-walls that's uniquely
  solvable, dense `1..k` clues, both endpoints clued, ≥ 4 clues, and a wall-free
  `budget: 0` board. Wall-placement and load-bearing checks run on 4×4/6×6 only
  (cheap); a separate 8×8 test asserts walls-present, walls-off-path, and
  uniqueness. `findSolutions` / `hasUniqueSolution` are exported from `puzzle.js`
  so tests can assert uniqueness directly.

The puzzle generator runs real backtracking, so heavy assertions in component
tests can be slow — prefer unit-testing `src/lib/` functions directly. Tests that
call `generatePuzzle()` set a longer per-test timeout (the 3rd arg to `test`);
8×8 cases are the slowest (~1–4 s each), so keep their counts modest.
