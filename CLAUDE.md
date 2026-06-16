# CLAUDE.md

Guidance for working in this repo. Covers the non-obvious bits; for generic
React/Create-React-App usage see `README.md`.

## What this is

A browser clone of LinkedIn's **Zip** puzzle. The player drags a single path
that starts at `1`, passes through every cell exactly once, and hits the
numbered clues in ascending order. Each generated puzzle is shareable via a
compact URL hash.

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
  - `puzzle.js` — `generatePuzzle()` builds a full path then greedily removes
    clues while a backtracking solver (`hasUniqueSolution`) confirms the puzzle
    still has exactly one answer. `createGridFromPath` converts a path to a grid.
  - `urlCodec.js` — `encodePuzzleToHash` / `decodePuzzleFromHash` for the
    shareable URL.
  - `hamiltonian_path.js` — **vendored** (see below).
- `src/components/`
  - `NumberGrid.js` — the interactive board (drag handling, timer, win/share).
  - `SolutionGrid.js` — read-only SVG of the answer ("Show Answer").
  - `Button.js` — shared pill button; pick a look with `variant`.
- `src/App.js` — layout + orchestration only (load from URL or generate).
- `src/theme.js` — **all** colors / radii / fonts. Add new design values here;
  don't hardcode hex/spacing in components.

## Things to know before changing them

- **`SIZE` is load-bearing for the URL codec.** The codec encodes each cell as a
  single base-36 character, which only works because `SIZE * SIZE === 36` (cell
  indices `0–35` map to `0–z`). Changing `SIZE` away from 6 silently breaks
  `urlCodec.js` — you'd need a different encoding.
- **URL hash format:** `#<pathStr>-<maskStr>`. `pathStr` is the solution path as
  base-36 cell indices; `maskStr` is a base-36 bitmask of which path positions
  carry a clue. Clue numbers are re-derived sequentially on decode, not stored.
- **`hamiltonian_path.js` is vendored GPL code** (Nathan Clisby). It uses
  module-global mutable state (`path`, `n`, `left_end`, …) and has `eslint-disable`
  at the top. Keep the license header, don't "modernize" the algorithm, and don't
  rely on it being pure — `generate_hamiltonian_path` mutates and returns shared
  module state.
- **Styling is inline-style objects driven by `theme.js`**, not CSS files. Match
  that pattern; reusable button styling lives in `Button.js`.

## Tests

`src/App.test.js` is a render smoke test. The puzzle generator runs real
backtracking on render, so heavy assertions in component tests can be slow —
prefer unit-testing `src/lib/` functions directly.
