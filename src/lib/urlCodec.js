/* global BigInt */
import { SIZE } from "./constants";
import { ALL_EDGES, edgeKey } from "./walls";

// Compact, shareable encoding of a puzzle in the URL hash.
//
// Format: "<pathStr>-<maskStr>[-<wallStr>]"
//   pathStr  each cell index (row * SIZE + col) as a single base-36 character,
//            in path order. Works because SIZE * SIZE === 36 maps 0-35 -> 0-z.
//   maskStr  a bitmask (base-36) marking which path positions carry a clue.
//   wallStr  a 60-bit bitmask (base-36) over ALL_EDGES marking which edges are
//            walls. Omitted entirely when there are no walls, so wall-free
//            hashes are byte-identical to the original 2-segment format and old
//            shared links keep decoding.

// 60 bits exceeds Number's safe-integer range, so the wall mask uses BigInt.
const wallStrFromSet = (walls) => {
  let bits = "";
  for (const [r1, c1, r2, c2] of ALL_EDGES) {
    bits += walls.has(edgeKey(r1, c1, r2, c2)) ? "1" : "0";
  }
  return BigInt("0b" + bits).toString(36);
};

const wallSetFromStr = (wallStr) => {
  const walls = new Set();
  if (!wallStr) return walls;

  let value = 0n;
  for (const ch of wallStr) value = value * 36n + BigInt(parseInt(ch, 36));
  const bits = value.toString(2).padStart(ALL_EDGES.length, "0");

  ALL_EDGES.forEach(([r1, c1, r2, c2], i) => {
    if (bits[i] === "1") walls.add(edgeKey(r1, c1, r2, c2));
  });
  return walls;
};

export const encodePuzzleToHash = (path, grid, walls = new Set()) => {
  const pathStr = path
    .map(([r, c]) => (r * SIZE + c).toString(36))
    .join("");

  let bitStr = "";
  for (const [r, c] of path) {
    bitStr += grid[r][c] !== 0 ? "1" : "0";
  }
  const maskStr = parseInt(bitStr, 2).toString(36);

  const base = `${pathStr}-${maskStr}`;
  return walls.size > 0 ? `${base}-${wallStrFromSet(walls)}` : base;
};

// Parses a hash produced by encodePuzzleToHash. Returns { path, grid, walls } or
// null if the hash is missing/malformed. Clue numbers are re-assigned
// sequentially (1, 2, 3, ...) along the path rather than stored explicitly.
export const decodePuzzleFromHash = (hash) => {
  if (!hash || !hash.includes("-")) return null;

  try {
    const [pathStr, maskStr, wallStr] = hash.split("-");

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

    return { path, grid, walls: wallSetFromStr(wallStr) };
  } catch (e) {
    console.error("Failed to parse URL data. Generating new game instead.");
    return null;
  }
};
