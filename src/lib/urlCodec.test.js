import { encodePuzzleToHash, decodePuzzleFromHash } from "./urlCodec";
import { generatePuzzle } from "./puzzle";
import { edgeKey } from "./walls";
import { DIFFICULTIES } from "./constants";

const emptyGrid = (size) =>
  Array(size)
    .fill()
    .map(() => Array(size).fill(0));

describe("decodePuzzleFromHash", () => {
  test("returns null for missing or malformed input", () => {
    expect(decodePuzzleFromHash("")).toBeNull();
    expect(decodePuzzleFromHash(null)).toBeNull();
    expect(decodePuzzleFromHash("nodash")).toBeNull();
  });
});

describe("encode/decode round-trip", () => {
  test("a hand-built puzzle survives a round-trip", () => {
    const path = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ];
    const grid = emptyGrid(DIFFICULTIES.medium);
    grid[0][0] = 1; // clue at path index 0
    grid[1][1] = 2; // clue at path index 2

    const decoded = decodePuzzleFromHash(encodePuzzleToHash(path, grid));
    expect(decoded.path).toEqual(path);
    expect(decoded.grid).toEqual(grid);
    expect(decoded.walls.size).toBe(0);
  });

  test("a puzzle with walls survives a round-trip", () => {
    const path = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ];
    const grid = emptyGrid(DIFFICULTIES.medium);
    grid[0][0] = 1;
    grid[1][1] = 2;
    const walls = new Set([edgeKey(0, 0, 1, 0), edgeKey(1, 0, 1, 1)]);

    const decoded = decodePuzzleFromHash(encodePuzzleToHash(path, grid, walls));
    expect(decoded.path).toEqual(path);
    expect(decoded.grid).toEqual(grid);
    expect([...decoded.walls].sort()).toEqual([...walls].sort());
  });

  test("the hash carries the grid size as a leading segment", () => {
    const grid = emptyGrid(DIFFICULTIES.hard);
    grid[0][0] = 1;
    const hash = encodePuzzleToHash([[0, 0]], grid);
    expect(hash.split("-")[0]).toBe("8");
  });

  test("an 8x8 puzzle uses 2 chars per cell and round-trips a 64-bit mask", () => {
    // A 64-cell path needs >1 base-36 char per cell and a BigInt clue mask.
    const path = [];
    for (let r = 0; r < 8; r++) {
      const cols = r % 2 === 0 ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
      for (const c of cols) path.push([r, c]);
    }
    const grid = emptyGrid(DIFFICULTIES.hard);
    grid[0][0] = 1; // first clue
    grid[7][0] = 2; // a clue near the very end (high bit of the 64-bit mask)

    const hash = encodePuzzleToHash(path, grid);
    const [, pathStr] = hash.split("-");
    expect(pathStr.length).toBe(path.length * 2); // 2 chars per cell

    const decoded = decodePuzzleFromHash(hash);
    expect(decoded.path).toEqual(path);
    expect(decoded.grid).toEqual(grid);
  });

  test("a legacy (size-less) 6x6 hash still decodes", () => {
    // Old 2-segment format: single-char cells, Number-range clue mask, no size.
    // "01-2": path [[0,0],[0,1]], clue at index 0, no walls, on a 6x6 grid.
    const decoded = decodePuzzleFromHash("01-2");
    expect(decoded.path).toEqual([
      [0, 0],
      [0, 1],
    ]);
    expect(decoded.grid.length).toBe(DIFFICULTIES.medium);
    expect(decoded.grid[0][0]).toBe(1);
    expect(decoded.walls.size).toBe(0);
  });

  test.each([DIFFICULTIES.easy, DIFFICULTIES.medium, DIFFICULTIES.hard])(
    "a generated %ix%i puzzle (walls included) survives a round-trip",
    (size) => {
      const { path, grid, walls } = generatePuzzle({ size, budget: size * size });
      const decoded = decodePuzzleFromHash(encodePuzzleToHash(path, grid, walls));
      expect(decoded.path).toEqual(path);
      expect(decoded.grid).toEqual(grid);
      expect([...decoded.walls].sort()).toEqual([...walls].sort());
    },
    30000
  );
});
