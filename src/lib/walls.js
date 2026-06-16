import { SIZE } from "./constants";

// A "wall" sits on the edge between two orthogonally-adjacent cells: the path
// may not cross it. A wall is therefore a removed edge in the grid graph, not a
// property of a single cell.
//
// Walls are represented everywhere as a Set of normalized edge keys. A key is
// "<minCellIndex>-<maxCellIndex>" where a cell's index is `row * SIZE + col`.

// Normalized, order-independent key for the edge between two adjacent cells.
export const edgeKey = (r1, c1, r2, c2) => {
  const a = r1 * SIZE + c1;
  const b = r2 * SIZE + c2;
  return a < b ? `${a}-${b}` : `${b}-${a}`;
};

// Every internal edge of the grid, in a FIXED canonical order. The order must
// stay stable: urlCodec encodes walls as a bitmask indexed by this list.
// First all vertical walls (between horizontal neighbours), then all horizontal
// walls (between vertical neighbours), each row-major. For SIZE 6 that is
// 30 + 30 = 60 possible walls. Each entry is [r1, c1, r2, c2].
export const ALL_EDGES = (() => {
  const edges = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE - 1; c++) {
      edges.push([r, c, r, c + 1]);
    }
  }
  for (let r = 0; r < SIZE - 1; r++) {
    for (let c = 0; c < SIZE; c++) {
      edges.push([r, c, r + 1, c]);
    }
  }
  return edges;
})();

// The set of edge keys traversed by a path (consecutive cell pairs). Walls may
// only ever be placed on edges NOT in this set, so the path stays valid.
export const pathEdgeKeys = (path) => {
  const keys = new Set();
  for (let i = 1; i < path.length; i++) {
    const [r1, c1] = path[i - 1];
    const [r2, c2] = path[i];
    keys.add(edgeKey(r1, c1, r2, c2));
  }
  return keys;
};
