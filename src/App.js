import logo from "./logo.svg";
import "./App.css";

import { generate_hamiltonian_path } from "./hamiltonian_path";
import { ObjectPathGrid, NumberGrid } from "./ObjectPathGrid";
import { useEffect, useState } from "react";

const SIZE = 6;

let unique_solution = (start, grid) => {
  let solutions = 0;

  let currentPath = [start];

  let backtrack = () => {
    if (currentPath.length == SIZE * SIZE) {
      solutions += 1;

      if (solutions >= 2) return false;
    }

    let seenPaths = currentPath.map((x) => SIZE * x[0] + x[1]);

    let [currentX, currentY, n] = currentPath[currentPath.length - 1];

    let potentialNeighbors = [];
    if (currentX > 0) potentialNeighbors.push([currentX - 1, currentY]);
    if (currentX < SIZE - 1) potentialNeighbors.push([currentX + 1, currentY]);
    if (currentY > 0) potentialNeighbors.push([currentX, currentY - 1]);
    if (currentY < SIZE - 1) potentialNeighbors.push([currentX, currentY + 1]);

    potentialNeighbors = potentialNeighbors.filter(
      (x) => !seenPaths.includes(SIZE * x[0] + x[1])
    );

    let neighbors = [];
    for (let neighbor of potentialNeighbors) {
      let checkPoint = grid[neighbor[0]][neighbor[1]];
      if (checkPoint == n + 1 || checkPoint == 0) {
        neighbors.push([
          neighbor[0],
          neighbor[1],
          checkPoint == 0 ? n : checkPoint,
        ]);
      }
    }

    for (let neighbor of neighbors) {
      currentPath.push(neighbor);
      backtrack();
      currentPath.pop();
    }
  };
  backtrack();

  return solutions == 1;
};

let createGridFromPath = (path) => {
  let grid = Array(SIZE)
    .fill()
    .map(() => Array(SIZE).fill(0));
  for (let i = 0; i < path.length; i++) {
    let square = path[i];
    grid[square[0]][square[1]] = i + 1;
  }

  return grid;
};

function App() {
  const [path, setPath] = useState(null);
  const [grid, setGrid] = useState(null);

  const [showAnswer, setShowAnswer] = useState(false);

  let createGame = () => {
    let [n, path] = generate_hamiltonian_path(1);
    let originalPath = path.slice();
    setPath(originalPath);

    let start = [path[0][0], path[0][1], 1];

    let prevGrid = createGridFromPath(path);
    if (path.length > 2) {
      let indexToRemove = Math.floor(Math.random() * (path.length - 2)) + 1;
      path.splice(indexToRemove, 1);
    }
    let currentGrid = createGridFromPath(path);

    for (let j = 0; j < path.length; j++) {
      let minimum = true;

      for (let i = path.length - 2; i > 0; i--) {
        let newPath = [...path];
        let indexToRemove = i;
        newPath.splice(indexToRemove, 1);
        if (unique_solution(start, createGridFromPath(newPath))) {
          path = newPath;
          currentGrid = createGridFromPath(newPath);
          minimum = false;
        }
      }
      if (minimum) break;
    }

    setGrid(currentGrid);
  };

  useEffect(() => {
    createGame();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <p>Linkedin Zip Practice</p>
        {grid && <NumberGrid grid={grid}></NumberGrid>}
        <div>
          <button onClick={() => setShowAnswer(!showAnswer)}>
            Show Answer
          </button>
          <button onClick={() => createGame()}>New Game</button>
        </div>

        {showAnswer && (
          <div>
            <ObjectPathGrid path={path} />
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
