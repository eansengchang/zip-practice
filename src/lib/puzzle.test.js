import { generatePuzzle, hasUniqueSolution } from "./puzzle";
import { pathEdgeKeys } from "./walls";
import { SIZE } from "./constants";

describe("generatePuzzle", () => {
  test("path is a Hamiltonian path covering every cell exactly once", () => {
    const { path } = generatePuzzle();
    expect(path).toHaveLength(SIZE * SIZE);
    const seen = new Set(path.map(([r, c]) => r * SIZE + c));
    expect(seen.size).toBe(SIZE * SIZE);
  }, 20000);

  test("the clue grid + walls has exactly one solution", () => {
    const { path, grid, walls } = generatePuzzle();
    const [r0, c0] = path[0];
    expect(grid[r0][c0]).toBe(1); // the path start is always clue 1
    expect(hasUniqueSolution([r0, c0, 1], grid, walls)).toBe(true);
  }, 20000);

  test("clues are a dense 1..k run in path order", () => {
    const { path, grid } = generatePuzzle();
    const clues = path.map(([r, c]) => grid[r][c]).filter((n) => n !== 0);
    clues.forEach((n, i) => expect(n).toBe(i + 1));
  }, 20000);

  test("the start and end of the solution always carry a clue", () => {
    // Both the wall-free and wall-heavy regimes must keep both endpoints clued.
    for (const budget of [0, SIZE * SIZE]) {
      const { path, grid } = generatePuzzle({ budget });
      const [sr, sc] = path[0];
      const [er, ec] = path[path.length - 1];
      const clueCount = grid.flat().filter((n) => n !== 0).length;
      expect(grid[sr][sc]).toBe(1); // start is always clue 1
      expect(grid[er][ec]).toBe(clueCount); // end is always the highest clue
    }
  }, 30000);

  test("every puzzle has at least 4 clues", () => {
    for (const budget of [0, SIZE * SIZE]) {
      const { grid } = generatePuzzle({ budget });
      const clueCount = grid.flat().filter((n) => n !== 0).length;
      expect(clueCount).toBeGreaterThanOrEqual(4);
    }
  }, 30000);

  test("budget 0 yields a classic, wall-free puzzle", () => {
    const { path, grid, walls } = generatePuzzle({ budget: 0 });
    expect(walls.size).toBe(0);
    const [r0, c0] = path[0];
    expect(hasUniqueSolution([r0, c0, 1], grid, walls)).toBe(true);
  }, 20000);

  test("walls only ever sit on edges the solution does not use", () => {
    const { path, walls } = generatePuzzle({ budget: SIZE * SIZE });
    const realEdges = pathEdgeKeys(path);
    for (const key of walls) expect(realEdges.has(key)).toBe(false);
  }, 30000);

  test("every wall is load-bearing: removing them reintroduces ambiguity", () => {
    // A high budget makes walls overwhelmingly likely; retry to be robust.
    let puzzle = null;
    for (let i = 0; i < 30 && !puzzle; i++) {
      const p = generatePuzzle({ budget: SIZE * SIZE });
      if (p.walls.size > 0) puzzle = p;
    }
    expect(puzzle).not.toBeNull();

    const { path, grid, walls } = puzzle;
    const start = [path[0][0], path[0][1], 1];
    // Unique with walls...
    expect(hasUniqueSolution(start, grid, walls)).toBe(true);
    // ...but ambiguous once the walls are removed (so they do real work).
    expect(hasUniqueSolution(start, grid, new Set())).toBe(false);
  }, 30000);
});
