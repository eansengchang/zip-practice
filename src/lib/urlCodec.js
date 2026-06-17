/* global BigInt */
import { SIZE } from "./constants";
import { allEdges, edgeKey } from "./walls";

// Compact, shareable encoding of a puzzle in the URL hash.
//
// Current format: "<size>-<pathStr>-<maskStr>[-<wallStr>]"
//   size     the grid dimension (4, 6, or 8). Stored so any size decodes.
//   pathStr  each cell index (row * size + col) as a FIXED-WIDTH base-36 string,
//            in path order. Width is 1 char when size*size <= 36 (4x4, 6x6) and
//            2 chars for 8x8 (64 cells exceed a single base-36 digit).
//   maskStr  a BigInt bitmask (base-36) marking which path positions carry a
//            clue. BigInt because an 8x8 mask is 64 bits (beyond Number's range).
//   wallStr  a bitmask (base-36, BigInt) over allEdges(size) marking which edges
//            are walls. Omitted entirely when there are no walls.
//
// Legacy format (no leading size segment): "<pathStr>-<maskStr>[-<wallStr>]"
//   The original 6x6-only encoding: single-char cells, a Number-range clue mask.
//   Still decoded for backwards compatibility with old shared links.

// base-36 string for the BigInt whose binary representation is `bits`.
const bitsToBase36 = (bits) => BigInt("0b" + bits).toString(36);

// `length`-wide binary string for a base-36 BigInt value.
const base36ToBits = (str, length) => {
  let value = 0n;
  for (const ch of str) value = value * 36n + BigInt(parseInt(ch, 36));
  return value.toString(2).padStart(length, "0");
};

const wallStrFromSet = (walls, size) => {
  let bits = "";
  for (const [r1, c1, r2, c2] of allEdges(size)) {
    bits += walls.has(edgeKey(r1, c1, r2, c2)) ? "1" : "0";
  }
  return bitsToBase36(bits);
};

const wallSetFromStr = (wallStr, size) => {
  const walls = new Set();
  if (!wallStr) return walls;

  const edges = allEdges(size);
  const bits = base36ToBits(wallStr, edges.length);
  edges.forEach(([r1, c1, r2, c2], i) => {
    if (bits[i] === "1") walls.add(edgeKey(r1, c1, r2, c2));
  });
  return walls;
};

// Width (in base-36 chars) used to encode one cell index on a size x size grid.
const cellWidth = (size) => (size * size <= 36 ? 1 : 2);

export const encodePuzzleToHash = (path, grid, walls = new Set()) => {
  const size = grid.length;
  const width = cellWidth(size);

  const pathStr = path
    .map(([r, c]) => (r * size + c).toString(36).padStart(width, "0"))
    .join("");

  let bitStr = "";
  for (const [r, c] of path) {
    bitStr += grid[r][c] !== 0 ? "1" : "0";
  }
  const maskStr = bitsToBase36(bitStr);

  const base = `${size}-${pathStr}-${maskStr}`;
  return walls.size > 0 ? `${base}-${wallStrFromSet(walls, size)}` : base;
};

// Builds { path, grid, walls } from the decoded pieces. `size` and `width`
// govern how the cell/clue/wall strings are interpreted.
const buildPuzzle = (size, width, pathStr, maskStr, wallStr) => {
  const path = [];
  for (let i = 0; i < pathStr.length; i += width) {
    const val = parseInt(pathStr.slice(i, i + width), 36);
    path.push([Math.floor(val / size), val % size]);
  }

  const bitMask = base36ToBits(maskStr, path.length);

  const grid = Array(size)
    .fill()
    .map(() => Array(size).fill(0));

  let clueNumber = 1;
  for (let i = 0; i < path.length; i++) {
    if (bitMask[i] === "1") {
      const [r, c] = path[i];
      grid[r][c] = clueNumber++;
    }
  }

  return { path, grid, walls: wallSetFromStr(wallStr, size) };
};

// Parses a hash produced by encodePuzzleToHash (or the legacy 6x6 format).
// Returns { path, grid, walls } or null if missing/malformed. Clue numbers are
// re-assigned sequentially (1, 2, 3, ...) along the path rather than stored.
export const decodePuzzleFromHash = (hash) => {
  if (!hash || !hash.includes("-")) return null;

  try {
    const segments = hash.split("-");

    // New format: a leading size segment (4 / 6 / 8).
    if (/^(4|6|8)$/.test(segments[0])) {
      const size = parseInt(segments[0], 10);
      const [, pathStr, maskStr, wallStr] = segments;
      return buildPuzzle(size, cellWidth(size), pathStr, maskStr, wallStr);
    }

    // Legacy format: 6x6, single-char cells, no size segment.
    const [pathStr, maskStr, wallStr] = segments;
    return buildPuzzle(SIZE, 1, pathStr, maskStr, wallStr);
  } catch (e) {
    console.error("Failed to parse URL data. Generating new game instead.");
    return null;
  }
};
