import { generate_hamiltonian_path, setLatticeSize } from "./hamiltonian_path";
import { DEFAULT_SIZE } from "./constants";
import { allEdges, edgeKey, pathEdgeKeys } from "./walls";

// Builds a size x size grid where each visited cell holds its 1-based step
// index along the path (and unvisited cells stay 0).
export const createGridFromPath = (path, size) => {
  const grid = Array(size)
    .fill()
    .map(() => Array(size).fill(0));

  path.forEach(([row, col], i) => {
    grid[row][col] = i + 1;
  });

  return grid;
};

// Per-solve ceiling on backtracking nodes, used only for large grids (8x8).
// Proving uniqueness of a sparsely-clued 8x8 is exponential and can run for
// minutes; capping the search keeps generation responsive. A capped search is
// reported via `capped` and is treated conservatively by callers (never assumed
// unique). Effect: 8x8 boards keep as many clues as uniqueness can be *cheaply*
// proven for. Smaller grids are never capped, so their behavior is unchanged.
const LARGE_GRID_NODE_CAP = 80000;

// Backtracking enumerator: returns up to `limit` Hamiltonian paths that satisfy
// the clue numbers in `grid`, start from `start` ([row, col, value]), and never
// cross a wall in `walls` (a Set of edge keys). Stops early once `limit` are
// found. The grid is always full (size x size), so the size is read from it.
// Returns { solutions, capped }: `solutions` is an array of [row, col]-cell
// paths; `capped` is true if the search hit the node ceiling before completing.
export const findSolutions = (start, grid, walls = new Set(), limit = 2) => {
  const size = grid.length;
  const cap = size >= 8 ? LARGE_GRID_NODE_CAP : Infinity;
  const solutions = [];
  const currentPath = [start];
  let nodes = 0;
  let capped = false;

  const backtrack = () => {
    if (solutions.length >= limit || capped) return;
    if (++nodes > cap) {
      capped = true;
      return;
    }

    if (currentPath.length === size * size) {
      solutions.push(currentPath.map(([r, c]) => [r, c]));
      return;
    }

    const seenPaths = currentPath.map((x) => size * x[0] + x[1]);
    const [currentX, currentY, n] = currentPath[currentPath.length - 1];

    let potentialNeighbors = [];
    if (currentX > 0) potentialNeighbors.push([currentX - 1, currentY]);
    if (currentX < size - 1) potentialNeighbors.push([currentX + 1, currentY]);
    if (currentY > 0) potentialNeighbors.push([currentX, currentY - 1]);
    if (currentY < size - 1) potentialNeighbors.push([currentX, currentY + 1]);

    potentialNeighbors = potentialNeighbors.filter(
      (x) =>
        !seenPaths.includes(size * x[0] + x[1]) &&
        !walls.has(edgeKey(currentX, currentY, x[0], x[1]))
    );

    const neighbors = [];
    for (const neighbor of potentialNeighbors) {
      const checkPoint = grid[neighbor[0]][neighbor[1]];
      if (checkPoint === n + 1 || checkPoint === 0) {
        neighbors.push([
          neighbor[0],
          neighbor[1],
          checkPoint === 0 ? n : checkPoint,
        ]);
      }
    }

    for (const neighbor of neighbors) {
      currentPath.push(neighbor);
      backtrack();
      currentPath.pop();
      if (solutions.length >= limit || capped) return;
    }
  };
  backtrack();

  return { solutions, capped };
};

// Returns true iff exactly one solution satisfies the clues (and walls). A
// capped (incomplete) search is conservatively reported as NOT unique, so we
// never claim uniqueness we could not actually prove.
export const hasUniqueSolution = (start, grid, walls = new Set()) => {
  const { solutions, capped } = findSolutions(start, grid, walls, 2);
  return !capped && solutions.length === 1;
};

// Smallest clue count a board keeps, scaled with size. Includes the always-kept
// start and end. Larger grids keep proportionally more clues: this keeps the
// backtracking solver fast (a denser grid is more constrained) and stops a board
// from collapsing to a near-blank grid. 4x4 -> 4, 6x6 -> 6, 8x8 -> 12.
const minClues = (size) => Math.max(4, Math.round(size * size * 0.18));

// A grid is "large" when its uniqueness proofs are capped (see LARGE_GRID_NODE_CAP).
const isLargeGrid = (size) => size >= 8;

// Variety lever: how many extra clues to sacrifice beyond the wall-free
// minimum. Each sacrificed clue is paid for with load-bearing walls, so a
// larger budget yields a more wall-heavy, harder board. 0 -> classic puzzle.
const randomBudget = (clueCount, size) => {
  const droppable = Math.max(0, clueCount - minClues(size));
  if (droppable === 0) return 0;
  // Small grids are a classic wall-free board ~20% of the time. Large grids
  // (8x8) always lean on walls: every extra clue is traded for walls, so hard
  // boards reliably feature them. Bias large grids toward dropping more clues.
  if (!isLargeGrid(size)) {
    if (Math.random() < 0.2) return 0;
    return 1 + Math.floor(Math.random() * droppable);
  }
  return Math.max(1, Math.ceil(droppable * (0.6 + Math.random() * 0.4)));
};

// Given alternative solutions, wall one edge that an alternative uses but the
// real path does not. Such an edge is always a non-path edge (safe: the real
// solution survives) and removes at least that alternative. Returns true if a
// wall was added. `walls` is mutated.
const addWallFromAlternative = (solutions, walls, realEdgeKeys) => {
  for (const sol of solutions) {
    for (let i = 1; i < sol.length; i++) {
      const [r1, c1] = sol[i - 1];
      const [r2, c2] = sol[i];
      const key = edgeKey(r1, c1, r2, c2);
      if (!realEdgeKeys.has(key) && !walls.has(key)) {
        walls.add(key);
        return true;
      }
    }
  }
  return false;
};

// Try to make `grid` uniquely solvable by adding walls. Works on a COPY and
// only commits back into `walls` on success, so a failed attempt (e.g. a capped
// uniqueness proof on a large grid) leaves no redundant walls behind. Every wall
// added is necessary at the moment it is added (it kills a live alternative
// solution). Returns true (and commits) iff uniqueness was confirmed.
const resolveWithWalls = (start, grid, walls, realEdgeKeys) => {
  const trial = new Set(walls);
  const edgeCount = allEdges(grid.length).length;
  for (let guard = 0; guard <= edgeCount; guard++) {
    const { solutions, capped } = findSolutions(start, grid, trial, 2);
    if (solutions.length <= 1) {
      // <=1 solution means unique — but only trust a search that completed.
      if (capped) return false;
      walls.clear();
      for (const key of trial) walls.add(key);
      return true;
    }
    if (!addWallFromAlternative(solutions, trial, realEdgeKeys)) return false;
  }
  return false;
};

// Drop any wall whose removal keeps the puzzle unique, leaving a minimal set in
// which EVERY wall is load-bearing: removing it reintroduces other solutions.
const minimizeWalls = (start, grid, walls) => {
  for (const key of [...walls]) {
    walls.delete(key);
    if (!hasUniqueSolution(start, grid, walls)) walls.add(key);
  }
};

// Guarantee a board visibly features walls by adding barriers on non-path edges
// up to `target`. This is always safe and preserves the (already unique)
// solution exactly: the real path never crosses a non-path edge, so the path
// stays valid, and walls can only ever remove solutions, never add one — so a
// unique board stays unique. Used on large grids, where proving a *traded* wall
// load-bearing is too expensive to do reliably (see LARGE_GRID_NODE_CAP). Edges
// are picked by how far apart their two cells sit in path order (a larger gap is
// a more tempting "shortcut" for the player), with ties broken randomly.
const ensureWalls = (path, walls, size, target) => {
  if (walls.size >= target) return;

  const realEdges = pathEdgeKeys(path);
  const order = new Map();
  path.forEach(([r, c], i) => order.set(r * size + c, i));

  const candidates = allEdges(size)
    .map(([r1, c1, r2, c2]) => ({
      key: edgeKey(r1, c1, r2, c2),
      gap: Math.abs(order.get(r1 * size + c1) - order.get(r2 * size + c2)),
    }))
    .filter(({ key, gap }) => gap > 1 && !realEdges.has(key) && !walls.has(key));

  // Shuffle first so equal-gap edges are chosen at random, then prefer the
  // larger gaps. Spreads the added walls instead of clustering them.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  candidates.sort((a, b) => b.gap - a.gap);

  for (const { key } of candidates) {
    if (walls.size >= target) break;
    walls.add(key);
  }
};

// Generates a fresh puzzle: a full Hamiltonian path, a reduced clue grid, and a
// set of walls. The clue grid alone may be ambiguous; the walls are what make
// the solution unique (see `budget`). Returns { path, grid, walls } where
// `path` is the full solution, `grid` the clue layout, `walls` the barriers.
//
// `size` picks the grid dimensions (difficulty). `budget` controls
// difficulty/variety: the number of clues traded for load-bearing walls.
// Defaults to a random value; pass it for deterministic tests (0 => wall-free).
export const generatePuzzle = ({ size = DEFAULT_SIZE, budget } = {}) => {
  setLatticeSize(size);
  // generate_hamiltonian_path returns a shared module-global array that it never
  // truncates, so after a larger grid it can carry a stale tail. Slice to the
  // exact cell count for this size to drop any leftover cells.
  const [, rawPath] = generate_hamiltonian_path(1);
  let generatedPath = rawPath.slice(0, size * size);
  const originalPath = generatedPath.slice();
  const start = [generatedPath[0][0], generatedPath[0][1], 1];
  const floor = minClues(size);

  // Edges used by the true solution; walls may only ever go elsewhere.
  const realEdgeKeys = pathEdgeKeys(originalPath);

  // 1. Reduce to a minimal wall-free clue set (the classic, uniquely-solvable
  //    baseline). Drop one interior clue up front, then greedily remove others.
  if (generatedPath.length > 2) {
    const indexToRemove =
      Math.floor(Math.random() * (generatedPath.length - 2)) + 1;
    generatedPath.splice(indexToRemove, 1);
  }

  for (let j = 0; j < generatedPath.length; j++) {
    let minimum = true;
    for (let i = generatedPath.length - 2; i > 0; i--) {
      const newPath = [...generatedPath];
      newPath.splice(i, 1);
      if (
        generatedPath.length > floor &&
        hasUniqueSolution(start, createGridFromPath(newPath, size))
      ) {
        generatedPath = newPath;
        minimum = false;
      }
    }
    if (minimum) break;
  }

  // 2. Trade clues for load-bearing walls. Each iteration removes one more clue
  //    and (if that creates ambiguity) walls the edges that the resulting
  //    alternative solutions rely on, until the puzzle is unique again.
  const walls = new Set();
  const targetBudget = budget ?? randomBudget(generatedPath.length, size);

  for (let b = 0; b < targetBudget && generatedPath.length > floor; b++) {
    // Only ever drop an interior clue: the start (index 0) and end (last index)
    // clues are always kept, so every board is numbered at both ends.
    const removeIdx = 1 + Math.floor(Math.random() * (generatedPath.length - 2));
    const trial = [...generatedPath];
    trial.splice(removeIdx, 1);

    if (resolveWithWalls(start, createGridFromPath(trial, size), walls, realEdgeKeys)) {
      generatedPath = trial;
    }
    // resolveWithWalls commits walls only on success, so a failed trial leaves
    // both the clue and the wall set untouched.
  }

  // 3. Strip redundant walls so every remaining wall genuinely matters.
  const grid = createGridFromPath(generatedPath, size);
  minimizeWalls(start, grid, walls);

  // 4. Large grids (unless explicitly wall-free via budget 0): guarantee the
  //    board features walls. Clue-traded walls are load-bearing but only land on
  //    ~a quarter of 8x8 boards (proving them unique is too costly to force), so
  //    top up with safe barrier walls.
  if (isLargeGrid(size) && targetBudget > 0) {
    ensureWalls(originalPath, walls, size, 4 + Math.floor(Math.random() * 3));
  }

  return { path: originalPath, grid, walls };
};
