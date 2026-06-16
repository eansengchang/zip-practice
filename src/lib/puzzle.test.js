import { generatePuzzle, hasUniqueSolution } from "./puzzle";
import { SIZE } from "./constants";

describe("generatePuzzle", () => {
  test("path is a Hamiltonian path covering every cell exactly once", () => {
    const { path } = generatePuzzle();
    expect(path).toHaveLength(SIZE * SIZE);
    const seen = new Set(path.map(([r, c]) => r * SIZE + c));
    expect(seen.size).toBe(SIZE * SIZE);
  }, 20000);

  test("the clue grid has exactly one solution", () => {
    const { path, grid } = generatePuzzle();
    const [r0, c0] = path[0];
    expect(grid[r0][c0]).toBe(1); // the path start is always clue 1
    expect(hasUniqueSolution([r0, c0, 1], grid)).toBe(true);
  }, 20000);

  test("clues are a dense 1..k run in path order", () => {
    const { path, grid } = generatePuzzle();
    const clues = path.map(([r, c]) => grid[r][c]).filter((n) => n !== 0);
    clues.forEach((n, i) => expect(n).toBe(i + 1));
  }, 20000);
});
