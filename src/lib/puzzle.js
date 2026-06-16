import { generate_hamiltonian_path } from "./hamiltonian_path";
import { SIZE } from "./constants";

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

// Backtracking solver: returns true iff exactly one Hamiltonian path satisfies
// the clue numbers in `grid`, starting from `start` ([row, col, value]).
const hasUniqueSolution = (start, grid) => {
  let solutions = 0;
  const currentPath = [start];

  const backtrack = () => {
    if (currentPath.length === SIZE * SIZE) {
      solutions += 1;
      if (solutions >= 2) return false;
    }

    const seenPaths = currentPath.map((x) => SIZE * x[0] + x[1]);
    const [currentX, currentY, n] = currentPath[currentPath.length - 1];

    let potentialNeighbors = [];
    if (currentX > 0) potentialNeighbors.push([currentX - 1, currentY]);
    if (currentX < SIZE - 1) potentialNeighbors.push([currentX + 1, currentY]);
    if (currentY > 0) potentialNeighbors.push([currentX, currentY - 1]);
    if (currentY < SIZE - 1) potentialNeighbors.push([currentX, currentY + 1]);

    potentialNeighbors = potentialNeighbors.filter(
      (x) => !seenPaths.includes(SIZE * x[0] + x[1])
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
    }
  };
  backtrack();

  return solutions === 1;
};

// Generates a fresh puzzle: a full Hamiltonian path plus a clue grid reduced to
// (close to) the minimum set of numbers that still yields a unique solution.
// Returns { path, grid } where `path` is the full solution and `grid` is the
// clue layout shown to the player.
export const generatePuzzle = () => {
  let [, generatedPath] = generate_hamiltonian_path(1);
  const originalPath = generatedPath.slice();
  const start = [generatedPath[0][0], generatedPath[0][1], 1];

  // Drop one interior clue up front, then greedily remove any others we can
  // while keeping the solution unique.
  if (generatedPath.length > 2) {
    const indexToRemove =
      Math.floor(Math.random() * (generatedPath.length - 2)) + 1;
    generatedPath.splice(indexToRemove, 1);
  }
  let currentGrid = createGridFromPath(generatedPath);

  for (let j = 0; j < generatedPath.length; j++) {
    let minimum = true;

    for (let i = generatedPath.length - 2; i > 0; i--) {
      const newPath = [...generatedPath];
      newPath.splice(i, 1);
      if (hasUniqueSolution(start, createGridFromPath(newPath))) {
        generatedPath = newPath;
        currentGrid = createGridFromPath(newPath);
        minimum = false;
      }
    }
    if (minimum) break;
  }

  return { path: originalPath, grid: currentGrid };
};
