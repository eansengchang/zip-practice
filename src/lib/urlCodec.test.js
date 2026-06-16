import { encodePuzzleToHash, decodePuzzleFromHash } from "./urlCodec";
import { generatePuzzle } from "./puzzle";
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
  });

  test("a generated puzzle survives a round-trip", () => {
    const { path, grid } = generatePuzzle();
    const decoded = decodePuzzleFromHash(encodePuzzleToHash(path, grid));
    expect(decoded.path).toEqual(path);
    expect(decoded.grid).toEqual(grid);
  }, 20000);
});
