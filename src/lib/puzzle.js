import { generate_hamiltonian_path } from "./hamiltonian_path";
import { SIZE } from "./constants";
import { ALL_EDGES, edgeKey, pathEdgeKeys } from "./walls";

// Builds a SIZE x SIZE grid where each visited cell holds its 1-based step
// index along the path (and unvisited cells stay 0).
export const createGridFromPath = (path) => {
  const grid = Array(SIZE)
    .fill()
    .map(() => Array(SIZE).fill(0));

  path.forEach(([row, col], i) => {
    grid[row][col] = i + 1;
  });

  return grid;
};

// Backtracking enumerator: returns up to `limit` Hamiltonian paths that satisfy
// the clue numbers in `grid`, start from `start` ([row, col, value]), and never
// cross a wall in `walls` (a Set of edge keys). Stops early once `limit` are
// found. Each returned solution is an array of [row, col] cells.
export const findSolutions = (start, grid, walls = new Set(), limit = 2) => {
  const solutions = [];
  const currentPath = [start];

  const backtrack = () => {
    if (solutions.length >= limit) return;

    if (currentPath.length === SIZE * SIZE) {
      solutions.push(currentPath.map(([r, c]) => [r, c]));
      return;
    }

    const seenPaths = currentPath.map((x) => SIZE * x[0] + x[1]);
    const [currentX, currentY, n] = currentPath[currentPath.length - 1];

    let potentialNeighbors = [];
    if (currentX > 0) potentialNeighbors.push([currentX - 1, currentY]);
    if (currentX < SIZE - 1) potentialNeighbors.push([currentX + 1, currentY]);
    if (currentY > 0) potentialNeighbors.push([currentX, currentY - 1]);
    if (currentY < SIZE - 1) potentialNeighbors.push([currentX, currentY + 1]);

    potentialNeighbors = potentialNeighbors.filter(
      (x) =>
        !seenPaths.includes(SIZE * x[0] + x[1]) &&
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
      if (solutions.length >= limit) return;
    }
  };
  backtrack();

  return solutions;
};

// Returns true iff exactly one solution satisfies the clues (and walls).
export const hasUniqueSolution = (start, grid, walls = new Set()) =>
  findSolutions(start, grid, walls, 2).length === 1;

// Every board keeps at least this many number clues (including the always-kept
// start and end), so puzzles never collapse to a near-blank grid.
const MIN_CLUES = 4;

// Variety lever: how many extra clues to sacrifice beyond the wall-free
// minimum. Each sacrificed clue is paid for with load-bearing walls, so a
// larger budget yields a more wall-heavy, harder board. 0 -> classic puzzle.
const randomBudget = (clueCount) => {
  const droppable = Math.max(0, clueCount - MIN_CLUES);
  if (droppable === 0 || Math.random() < 0.2) return 0; // share of wall-free games
  return 1 + Math.floor(Math.random() * droppable);
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

// Add walls to `walls` until `grid` is uniquely solvable. Every wall added is
// necessary at the moment it is added (it kills a live alternative solution).
// Always terminates: walling every non-path edge forces the single real path.
const resolveWithWalls = (start, grid, walls, realEdgeKeys) => {
  for (let guard = 0; guard <= ALL_EDGES.length; guard++) {
    const solutions = findSolutions(start, grid, walls, 2);
    if (solutions.length <= 1) return true;
    if (!addWallFromAlternative(solutions, walls, realEdgeKeys)) return false;
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

// Generates a fresh puzzle: a full Hamiltonian path, a reduced clue grid, and a
// set of walls. The clue grid alone may be ambiguous; the walls are what make
// the solution unique (see `budget`). Returns { path, grid, walls } where
// `path` is the full solution, `grid` the clue layout, `walls` the barriers.
//
// `budget` controls difficulty/variety: the number of clues traded for
// load-bearing walls. Defaults to a random value; pass it for deterministic
// tests (0 => wall-free classic puzzle).
export const generatePuzzle = ({ budget } = {}) => {
  let [, generatedPath] = generate_hamiltonian_path(1);
  const originalPath = generatedPath.slice();
  const start = [generatedPath[0][0], generatedPath[0][1], 1];

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
        generatedPath.length > MIN_CLUES &&
        hasUniqueSolution(start, createGridFromPath(newPath))
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
  const targetBudget = budget ?? randomBudget(generatedPath.length);

  for (let b = 0; b < targetBudget && generatedPath.length > MIN_CLUES; b++) {
    // Only ever drop an interior clue: the start (index 0) and end (last index)
    // clues are always kept, so every board is numbered at both ends.
    const removeIdx = 1 + Math.floor(Math.random() * (generatedPath.length - 2));
    const trial = [...generatedPath];
    trial.splice(removeIdx, 1);

    if (resolveWithWalls(start, createGridFromPath(trial), walls, realEdgeKeys)) {
      generatedPath = trial;
    }
    // resolveWithWalls only mutates `walls` on the way to success, so a failure
    // (never expected) just leaves the clue in place with whatever walls stuck.
  }

  // 3. Strip redundant walls so every remaining wall genuinely matters.
  const grid = createGridFromPath(generatedPath);
  minimizeWalls(start, grid, walls);

  return { path: originalPath, grid, walls };
};
