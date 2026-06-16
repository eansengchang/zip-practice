import { SIZE } from "./constants";

// Compact, shareable encoding of a puzzle in the URL hash.
//
// Format: "<pathStr>-<maskStr>"
//   pathStr  each cell index (row * SIZE + col) as a single base-36 character,
//            in path order. Works because SIZE * SIZE === 36 maps 0-35 -> 0-z.
//   maskStr  a bitmask (base-36) marking which path positions carry a clue.

export const encodePuzzleToHash = (path, grid) => {
  const pathStr = path
    .map(([r, c]) => (r * SIZE + c).toString(36))
    .join("");

  let bitStr = "";
  for (const [r, c] of path) {
    bitStr += grid[r][c] !== 0 ? "1" : "0";
  }
  const maskStr = parseInt(bitStr, 2).toString(36);

  return `${pathStr}-${maskStr}`;
};

// Parses a hash produced by encodePuzzleToHash. Returns { path, grid } or null
// if the hash is missing/malformed. Clue numbers are re-assigned sequentially
// (1, 2, 3, ...) along the path rather than stored explicitly.
export const decodePuzzleFromHash = (hash) => {
  if (!hash || !hash.includes("-")) return null;

  try {
    const [pathStr, maskStr] = hash.split("-");

    const path = [];
    for (let i = 0; i < pathStr.length; i++) {
      const val = parseInt(pathStr[i], 36);
      path.push([Math.floor(val / SIZE), val % SIZE]);
    }

    const bitMask = parseInt(maskStr, 36)
      .toString(2)
      .padStart(path.length, "0");

    const grid = Array(SIZE)
      .fill()
      .map(() => Array(SIZE).fill(0));

    let clueNumber = 1;
    for (let i = 0; i < path.length; i++) {
      if (bitMask[i] === "1") {
        const [r, c] = path[i];
        grid[r][c] = clueNumber++;
      }
    }

    return { path, grid };
  } catch (e) {
    console.error("Failed to parse URL data. Generating new game instead.");
    return null;
  }
};
