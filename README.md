# Zip Practice

A browser clone of LinkedIn's **Zip** puzzle, with an endless supply of
auto-generated boards. Every puzzle is uniquely solvable and shareable via a
compact URL.

▶︎ **Play:** https://zip-practice.netlify.app

## How to play

Draw a single continuous path that:

1. **Starts at `1`** and passes through the numbered clues in ascending order.
2. **Fills every cell** exactly once.
3. **Never crosses a wall** — the light barriers drawn on some cell edges.

Drag with the mouse or your finger to trace the path. **Show Answer** reveals the
solution, **New Game** deals a fresh board, and the **Easy / Medium / Hard**
buttons switch the grid size (4×4, 6×6, 8×8).

## Sharing

The current puzzle is always encoded in the page URL's hash, so copying the link
shares that exact board. The hash packs the solution path, which cells carry a
clue, and the wall positions into a short base-36 string.

## Generating puzzles

Each board is built by laying down a random Hamiltonian path, then greedily
removing clues and trading some for **walls** while a backtracking solver
verifies the puzzle stays uniquely solvable. The result is a board where the
clues and walls left on it are genuinely load-bearing rather than decorative.

## Development

```bash
npm start                 # dev server at http://localhost:3000
CI=true npm test          # run tests once (plain `npm test` opens a watch mode that hangs)
CI=true npm run build     # production build
```

> Run tests and builds with `CI=true`: the harness treats lint warnings as
> errors when `CI` is set, and bare `npm test` starts an interactive watcher.

The project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
The pure puzzle logic lives in [`src/lib/`](src/lib/) (generation, the solver,
the URL codec, walls) and the UI in [`src/components/`](src/components/). See
[`CLAUDE.md`](CLAUDE.md) for the architecture and the non-obvious details.

## Deployment

Hosted on Netlify and reachable two ways from the same build:

- **Standalone:** https://zip-practice.netlify.app
- **Under the portfolio:** https://eansengchang.com/zip-practice — proxied via a
  Netlify status-`200` rewrite in the personal-website repo, so the URL bar stays
  on `eansengchang.com`.

The `npm run build` script sets `PUBLIC_URL=/zip-practice` so production assets
resolve under that path for both URLs (the dev server is unaffected and stays at
the root). The base path is wired through three files that must change together:
this repo's `build` script, this repo's `public/_redirects`, and the
personal-website `public/_redirects`. See [`CLAUDE.md`](CLAUDE.md) for the full
rationale.
