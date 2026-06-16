import { encodePuzzleToHash, decodePuzzleFromHash } from "./urlCodec";
import { generatePuzzle } from "./puzzle";
import { edgeKey } from "./walls";
import { SIZE } from "./constants";

const emptyGrid = () =>
  Array(SIZE)
    .fill()
    .map(() => Array(SIZE).fill(0));

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
    const grid = emptyGrid();
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
    const grid = emptyGrid();
    grid[0][0] = 1;
    grid[1][1] = 2;
    const walls = new Set([edgeKey(0, 0, 1, 0), edgeKey(1, 0, 1, 1)]);

    const decoded = decodePuzzleFromHash(encodePuzzleToHash(path, grid, walls));
    expect(decoded.path).toEqual(path);
    expect(decoded.grid).toEqual(grid);
    expect([...decoded.walls].sort()).toEqual([...walls].sort());
  });

  test("a wall-free hash stays 2-segment and decodes to no walls (legacy compat)", () => {
    const path = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ];
    const grid = emptyGrid();
    grid[0][0] = 1;
    grid[1][1] = 2;

    const legacy = encodePuzzleToHash(path, grid);
    expect(legacy.split("-")).toHaveLength(2);
    expect(decodePuzzleFromHash(legacy).walls.size).toBe(0);
  });

  test("a generated puzzle (walls included) survives a round-trip", () => {
    const { path, grid, walls } = generatePuzzle({ budget: SIZE * SIZE });
    const decoded = decodePuzzleFromHash(encodePuzzleToHash(path, grid, walls));
    expect(decoded.path).toEqual(path);
    expect(decoded.grid).toEqual(grid);
    expect([...decoded.walls].sort()).toEqual([...walls].sort());
  }, 30000);
});
