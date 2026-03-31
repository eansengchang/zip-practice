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

  let createGame = (forceNew = false) => {
    setPath(null);
    setShowAnswer(false);

    // 1. Check if we have a compressed game in the URL
    if (!forceNew) {
      const hash = window.location.hash.slice(1);
      if (hash && hash.includes("-")) {
        try {
          const [pathStr, maskStr] = hash.split("-");
          
          // Decode the single-character path
          const decodedPath = [];
          for (let i = 0; i < pathStr.length; i++) {
            const val = parseInt(pathStr[i], 36);
            decodedPath.push([Math.floor(val / SIZE), val % SIZE]);
          }
          
          // Decode the bitmask for the grid
          const bitMask = parseInt(maskStr, 36).toString(2).padStart(decodedPath.length, "0");
          let decodedGrid = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
          
          // FIX: Assign sequential clue numbers (1, 2, 3...) rather than path distances
          let clueNumber = 1;
          for (let i = 0; i < decodedPath.length; i++) {
            if (bitMask[i] === "1") {
              const [r, c] = decodedPath[i];
              decodedGrid[r][c] = clueNumber++;
            }
          }

          setPath(decodedPath);
          setGrid(decodedGrid);
          return; // Exit early, rendering the saved game
        } catch (e) {
          console.error("Failed to parse URL data. Generating new game instead.");
        }
      }
    }

    // 2. Generate a new game
    let [n, generatedPath] = generate_hamiltonian_path(1);
    let originalPath = generatedPath.slice();
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

    setPath(originalPath);
    setGrid(currentGrid);

    // 3. Ultra-short URL Encoding
    // Encode path coordinates as base36 characters (0-35 map perfectly to 0-z)
    const pathStr = originalPath.map(([r, c]) => (r * SIZE + c).toString(36)).join("");
    
    // Encode the grid as a binary string, then to base36
    let bitStr = "";
    for (let i = 0; i < originalPath.length; i++) {
      const [r, c] = originalPath[i];
      bitStr += currentGrid[r][c] !== 0 ? "1" : "0";
    }
    const maskStr = parseInt(bitStr, 2).toString(36);
    
    window.history.replaceState(null, "", `#${pathStr}-${maskStr}`);
  };

  useEffect(() => {
    createGame();
  }, []);

  return (
    <div style={{
      backgroundColor: "#f3f2ef", 
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px", 
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)", 
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
          color: "rgba(0,0,0,0.9)", 
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
              color: "#0a66c2", 
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
            onClick={() => createGame(true)} 
            style={{
              flex: 1,
              padding: "10px 24px",
              borderRadius: "24px",
              backgroundColor: "#0a66c2", 
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