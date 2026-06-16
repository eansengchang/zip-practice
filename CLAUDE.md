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
  - `constants.js` — `SIZE` (the grid is `SIZE x SIZE`).
  - `puzzle.js` — `generatePuzzle()` builds a full path, greedily reduces clues,
    then trades clues for walls (see "walls" below). A backtracking solver
    (`findSolutions` / `hasUniqueSolution`) confirms uniqueness and supplies the
    counterexample solutions used to place walls. `createGridFromPath` converts a
    path to a grid.
  - `walls.js` — wall representation: `edgeKey` (normalized edge id), the
    canonical `ALL_EDGES` list, and `pathEdgeKeys`. Walls are a `Set` of edge
    keys threaded through generation, solving, the codec, and both grids.
  - `urlCodec.js` — `encodePuzzleToHash` / `decodePuzzleFromHash` for the
    shareable URL (path + clue mask + optional wall mask).
  - `hamiltonian_path.js` — **vendored** (see below).
- `src/components/`
  - `NumberGrid.js` — the interactive board (drag handling, timer, win/share).
    Takes a `walls` prop: blocks drags across a wall and draws the wall overlay.
  - `SolutionGrid.js` — read-only SVG of the answer ("Show Answer"), incl. walls.
  - `Button.js` — shared pill button; pick a look with `variant`.
- `src/App.js` — layout + orchestration only (load from URL or generate).
- `src/theme.js` — **all** colors / radii / fonts. Add new design values here;
  don't hardcode hex/spacing in components.

## Things to know before changing them

- **`SIZE` is load-bearing for the URL codec.** The codec encodes each cell as a
  single base-36 character, which only works because `SIZE * SIZE === 36` (cell
  indices `0–35` map to `0–z`). Changing `SIZE` away from 6 silently breaks
  `urlCodec.js` — you'd need a different encoding.
- **URL hash format:** `#<pathStr>-<maskStr>[-<wallStr>]`. `pathStr` is the
  solution path as base-36 cell indices; `maskStr` is a base-36 bitmask of which
  path positions carry a clue. Clue numbers are re-derived sequentially on
  decode, not stored. This is safe because the grid's clues are *already* a dense
  `1..k` run in path order: `createGridFromPath` numbers cells by their index in
  the (reduced) path array, so removing clues renumbers the survivors rather than
  leaving their original step indices. Don't "fix" the codec to store raw clue
  values — they aren't the step indices you might expect, and re-deriving
  reproduces the grid exactly (see `urlCodec.test.js`).
- **`wallStr` is an optional third segment** — a base-36 bitmask over `ALL_EDGES`
  (60 internal edges) of which edges are walls. Two things make it work:
  - The order of `ALL_EDGES` in `walls.js` is **load-bearing** — encode and
    decode both index into it, so reordering it silently corrupts saved walls.
  - It's 60 bits, which exceeds `Number`'s safe range, so this mask uses
    `BigInt` (hence the `/* global BigInt */` directive — ESLint's env doesn't
    know `BigInt`). The clue mask stays on `parseInt`.
  The segment is **omitted entirely when there are no walls**, so wall-free
  hashes are byte-identical to the old 2-segment format and pre-walls shared
  links still decode (to an empty wall set).
- **Walls are load-bearing by construction, not decoration.** `generatePuzzle`
  only ever places a wall on a non-path edge (the real solution never crosses
  it, so it stays valid), and only in response to an *alternative* solution it
  eliminates — then a final pass drops any wall whose removal keeps the puzzle
  unique. Net result: removing any remaining wall reintroduces other solutions.
  The variety knob is `budget` (clues traded for walls); `budget: 0` is a
  classic wall-free board. Two invariants the generator guarantees and tests
  assert: the **start and end cells are always clued**, and there are **always
  ≥ `MIN_CLUES` (4) clues**.
- **`hamiltonian_path.js` is vendored GPL code** (Nathan Clisby). It uses
  module-global mutable state (`path`, `n`, `left_end`, …) and has `eslint-disable`
  at the top. Keep the license header, don't "modernize" the algorithm, and don't
  rely on it being pure — `generate_hamiltonian_path` mutates and returns shared
  module state.
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
- `src/lib/urlCodec.test.js` — malformed-input handling, encode→decode
  round-trips (hand-built and generated), wall round-trips, and legacy
  (wall-free, 2-segment) compatibility.
- `src/lib/puzzle.test.js` — `generatePuzzle()` produces a full Hamiltonian path,
  a clue-grid-plus-walls that's uniquely solvable, dense `1..k` clues, both
  endpoints clued, ≥ 4 clues, walls only on non-path edges, and walls that are
  load-bearing (unique *with* walls, ambiguous *without*). `findSolutions` /
  `hasUniqueSolution` are exported from `puzzle.js` so tests can assert
  uniqueness (and the load-bearing property) directly.

The puzzle generator runs real backtracking, so heavy assertions in component
tests can be slow — prefer unit-testing `src/lib/` functions directly. Tests that
call `generatePuzzle()` set a longer per-test timeout (the 3rd arg to `test`) for
the same reason.
