import { generatePuzzle, hasUniqueSolution } from "./puzzle";
import { pathEdgeKeys } from "./walls";
import { DIFFICULTIES } from "./constants";

const SIZES = [DIFFICULTIES.easy, DIFFICULTIES.medium, DIFFICULTIES.hard];

describe("generatePuzzle", () => {
  test.each(SIZES)(
    "%ix%i: path is a Hamiltonian path covering every cell exactly once",
    (size) => {
      const { path } = generatePuzzle({ size });
      expect(path).toHaveLength(size * size);
      const seen = new Set(path.map(([r, c]) => r * size + c));
      expect(seen.size).toBe(size * size);
    },
    30000
  );

  test.each(SIZES)(
    "%ix%i: the clue grid + walls has exactly one solution",
    (size) => {
      const { path, grid, walls } = generatePuzzle({ size });
      const [r0, c0] = path[0];
      expect(grid[r0][c0]).toBe(1); // the path start is always clue 1
      expect(hasUniqueSolution([r0, c0, 1], grid, walls)).toBe(true);
    },
    30000
  );

  test.each(SIZES)("%ix%i: clues are a dense 1..k run in path order", (size) => {
    const { path, grid } = generatePuzzle({ size });
    const clues = path.map(([r, c]) => grid[r][c]).filter((n) => n !== 0);
    clues.forEach((n, i) => expect(n).toBe(i + 1));
  }, 30000);

  test.each(SIZES)(
    "%ix%i: the start and end of the solution always carry a clue",
    (size) => {
      // Both the wall-free and wall-heavy regimes must keep both endpoints clued.
      for (const budget of [0, size * size]) {
        const { path, grid } = generatePuzzle({ size, budget });
        const [sr, sc] = path[0];
        const [er, ec] = path[path.length - 1];
        const clueCount = grid.flat().filter((n) => n !== 0).length;
        expect(grid[sr][sc]).toBe(1); // start is always clue 1
        expect(grid[er][ec]).toBe(clueCount); // end is always the highest clue
      }
    },
    40000
  );

  test.each(SIZES)("%ix%i: every puzzle has at least 4 clues", (size) => {
    for (const budget of [0, size * size]) {
      const { grid } = generatePuzzle({ size, budget });
      const clueCount = grid.flat().filter((n) => n !== 0).length;
      expect(clueCount).toBeGreaterThanOrEqual(4);
    }
  }, 40000);

  test.each(SIZES)("%ix%i: budget 0 yields a classic, wall-free puzzle", (size) => {
    const { path, grid, walls } = generatePuzzle({ size, budget: 0 });
    expect(walls.size).toBe(0);
    const [r0, c0] = path[0];
    expect(hasUniqueSolution([r0, c0, 1], grid, walls)).toBe(true);
  }, 30000);

  // Wall-placement invariants are exercised on the smaller grids to keep the
  // suite fast; the codec test covers an 8x8 walled board end-to-end.
  test.each([DIFFICULTIES.easy, DIFFICULTIES.medium])(
    "%ix%i: walls only ever sit on edges the solution does not use",
    (size) => {
      const { path, walls } = generatePuzzle({ size, budget: size * size });
      const realEdges = pathEdgeKeys(path);
      for (const key of walls) expect(realEdges.has(key)).toBe(false);
    },
    30000
  );

  test.each([DIFFICULTIES.easy, DIFFICULTIES.medium])(
    "%ix%i: every wall is load-bearing: removing them reintroduces ambiguity",
    (size) => {
      // A high budget makes walls overwhelmingly likely; retry to be robust.
      let puzzle = null;
      for (let i = 0; i < 30 && !puzzle; i++) {
        const p = generatePuzzle({ size, budget: size * size });
        if (p.walls.size > 0) puzzle = p;
      }
      expect(puzzle).not.toBeNull();

      const { path, grid, walls } = puzzle;
      const start = [path[0][0], path[0][1], 1];
      // Unique with walls...
      expect(hasUniqueSolution(start, grid, walls)).toBe(true);
      // ...but ambiguous once the walls are removed (so they do real work).
      expect(hasUniqueSolution(start, grid, new Set())).toBe(false);
    },
    30000
  );

  test("8x8 boards always include walls, on non-path edges, staying unique", () => {
    // Hard mode guarantees walls (load-bearing where cheap, safe barriers
    // otherwise); all walls sit off the solution path and the board stays unique.
    for (let i = 0; i < 3; i++) {
      const { path, grid, walls } = generatePuzzle({ size: DIFFICULTIES.hard });
      expect(walls.size).toBeGreaterThan(0);
      const realEdges = pathEdgeKeys(path);
      for (const key of walls) expect(realEdges.has(key)).toBe(false);
      expect(hasUniqueSolution([path[0][0], path[0][1], 1], grid, walls)).toBe(true);
    }
  }, 40000);
});
