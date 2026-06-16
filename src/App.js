import { useCallback, useEffect, useState } from "react";
import { NumberGrid } from "./components/NumberGrid";
import { SolutionGrid } from "./components/SolutionGrid";
import { Button } from "./components/Button";
import { generatePuzzle } from "./lib/puzzle";
import { decodePuzzleFromHash, encodePuzzleToHash } from "./lib/urlCodec";
import { colors, fonts, radii } from "./theme";

const styles = {
  page: {
    backgroundColor: colors.background,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
    fontFamily: fonts.sans,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)",
    padding: "32px",
    width: "100%",
    maxWidth: "450px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    color: colors.text,
    margin: "0 0 24px 0",
  },
  actions: {
    display: "flex",
    gap: "16px",
    width: "100%",
    marginTop: "24px",
    justifyContent: "center",
  },
  solution: { marginTop: "32px" },
  solutionLabel: {
    fontSize: "14px",
    color: colors.textMuted,
    marginBottom: "12px",
    textAlign: "center",
  },
};

function App() {
  const [path, setPath] = useState(null);
  const [grid, setGrid] = useState(null);
  const [walls, setWalls] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Loads a puzzle: from the URL hash when present (unless a new game is
  // forced), otherwise generates a fresh one and writes it back to the hash.
  const createGame = useCallback((forceNew = false) => {
    setShowAnswer(false);

    if (!forceNew) {
      const saved = decodePuzzleFromHash(window.location.hash.slice(1));
      if (saved) {
        setPath(saved.path);
        setGrid(saved.grid);
        setWalls(saved.walls);
        return;
      }
    }

    const { path: newPath, grid: newGrid, walls: newWalls } = generatePuzzle();
    setPath(newPath);
    setGrid(newGrid);
    setWalls(newWalls);
    window.history.replaceState(null, "", `#${encodePuzzleToHash(newPath, newGrid, newWalls)}`);
  }, []);

  useEffect(() => {
    createGame();
  }, [createGame]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>LinkedIn Zip Practice</h1>

        {grid && <NumberGrid grid={grid} walls={walls} />}

        <div style={styles.actions}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={() => setShowAnswer((v) => !v)}>
            {showAnswer ? "Hide Answer" : "Show Answer"}
          </Button>
          <Button variant="primary" style={{ flex: 1 }} onClick={() => createGame(true)}>
            New Game
          </Button>
        </div>

        {showAnswer && (
          <div style={styles.solution}>
            <h3 style={styles.solutionLabel}>Solution Path</h3>
            <SolutionGrid path={path} walls={walls} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
