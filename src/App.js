

import { generate_hamiltonian_path } from "./hamiltonian_path";
import { ObjectPathGrid, NumberGrid } from "./ObjectPathGrid";
import { useEffect, useState } from "react";

const SIZE = 6;

let unique_solution = (start, grid) => {
  let solutions = 0;
  let currentPath = [start];

  let backtrack = () => {
    if (currentPath.length === SIZE * SIZE) {
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
      if (checkPoint === n + 1 || checkPoint === 0) {
        neighbors.push([
          neighbor[0],
          neighbor[1],
          checkPoint === 0 ? n : checkPoint,
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

  return solutions === 1;
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
    setPath(null);
    setShowAnswer(false);

    let [n, generatedPath] = generate_hamiltonian_path(1);
    let originalPath = generatedPath.slice();
    setPath(originalPath);

    let start = [generatedPath[0][0], generatedPath[0][1], 1];

    let prevGrid = createGridFromPath(generatedPath);
    if (generatedPath.length > 2) {
      let indexToRemove = Math.floor(Math.random() * (generatedPath.length - 2)) + 1;
      generatedPath.splice(indexToRemove, 1);
    }
    let currentGrid = createGridFromPath(generatedPath);

    for (let j = 0; j < generatedPath.length; j++) {
      let minimum = true;

      for (let i = generatedPath.length - 2; i > 0; i--) {
        let newPath = [...generatedPath];
        let indexToRemove = i;
        newPath.splice(indexToRemove, 1);
        if (unique_solution(start, createGridFromPath(newPath))) {
          generatedPath = newPath;
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
    <div style={{
      backgroundColor: "#f3f2ef", // LinkedIn warm gray background
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px", // LinkedIn card radius
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)", // LinkedIn card shadow
        padding: "32px",
        width: "100%",
        maxWidth: "450px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h1 style={{
          fontSize: "24px",
          fontWeight: "600",
          color: "rgba(0,0,0,0.9)", // LinkedIn dark text
          margin: "0 0 24px 0"
        }}>
          LinkedIn Zip Practice
        </h1>

        {grid && <NumberGrid grid={grid}></NumberGrid>}

        <div style={{
          display: "flex",
          gap: "16px",
          width: "100%",
          marginTop: "24px",
          justifyContent: "center"
        }}>
          <button 
            onClick={() => setShowAnswer(!showAnswer)}
            style={{
              flex: 1,
              padding: "10px 24px",
              borderRadius: "24px",
              backgroundColor: "transparent",
              color: "#0a66c2", // LinkedIn Blue
              border: "1.5px solid #0a66c2",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
          >
            {showAnswer ? "Hide Answer" : "Show Answer"}
          </button>
          <button 
            onClick={() => createGame()}
            style={{
              flex: 1,
              padding: "10px 24px",
              borderRadius: "24px",
              backgroundColor: "#0a66c2", // LinkedIn Blue Primary
              color: "#ffffff",
              border: "none",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
          >
            New Game
          </button>
        </div>

        {showAnswer && (
          <div style={{ marginTop: "32px" }}>
            <h3 style={{ fontSize: "14px", color: "rgba(0,0,0,0.6)", marginBottom: "12px", textAlign: "center" }}>Solution Path</h3>
            <ObjectPathGrid path={path} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;