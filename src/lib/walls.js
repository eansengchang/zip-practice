// A "wall" sits on the edge between two orthogonally-adjacent cells: the path
// may not cross it. A wall is therefore a removed edge in the grid graph, not a
// property of a single cell.
//
// Walls are represented everywhere as a Set of normalized edge keys. A key is
// "<r1>,<c1>-<r2>,<c2>" with the lexicographically-smaller cell first. The key
// is coordinate-based (size-independent) on purpose: keys only live in memory
// (Set membership / lookups), while the SHARED url stores a bitmask over
// `allEdges(size)`, not these strings. So the key format can stay size-free.

// Normalized, order-independent key for the edge between two adjacent cells.
export const edgeKey = (r1, c1, r2, c2) => {
  const a = [r1, c1];
  const b = [r2, c2];
  const aFirst = a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]);
  const [[ar, ac], [br, bc]] = aFirst ? [a, b] : [b, a];
  return `${ar},${ac}-${br},${bc}`;
};

// Every internal edge of a size x size grid, in a FIXED canonical order. The
// order must stay stable: urlCodec encodes walls as a bitmask indexed by this
// list. First all vertical walls (between horizontal neighbours), then all
// horizontal walls (between vertical neighbours), each row-major. For size 6
// that is 30 + 30 = 60 edges; in general 2 * size * (size - 1). Each entry is
// [r1, c1, r2, c2].
export const allEdges = (size) => {
  const edges = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      edges.push([r, c, r, c + 1]);
    }
  }
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size; c++) {
      edges.push([r, c, r + 1, c]);
    }
  }
  return edges;
};

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
