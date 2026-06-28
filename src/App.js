import { useCallback, useEffect, useState } from "react";
import { NumberGrid } from "./components/NumberGrid";
import { HowToPlay } from "./components/HowToPlay";
import { Button } from "./components/Button";
import { generatePuzzle } from "./lib/puzzle";
import { decodePuzzleFromHash, encodePuzzleToHash } from "./lib/urlCodec";
import { DIFFICULTIES } from "./lib/constants";
import { colors, fonts, radii } from "./theme";

// Map a grid dimension back to its difficulty key (for shared-link loads).
const sizeToDifficulty = (size) =>
  size <= DIFFICULTIES.easy ? "easy" : size >= DIFFICULTIES.hard ? "hard" : "medium";

const styles = {
  page: {
    backgroundColor: colors.background,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px 12px 40px",
    fontFamily: fonts.sans,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.5)",
    padding: "20px",
    width: "100%",
    maxWidth: "420px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: "20px",
    fontWeight: 600,
    color: colors.text,
    margin: "0 0 14px 0",
  },
  difficultyRow: {
    display: "flex",
    gap: "8px",
    width: "100%",
    marginBottom: "14px",
  },
  actions: {
    display: "flex",
    gap: "12px",
    width: "100%",
    marginTop: "12px",
    justifyContent: "center",
  },
};

function App() {
  const [path, setPath] = useState(null);
  const [grid, setGrid] = useState(null);
  const [walls, setWalls] = useState(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [showAnswer, setShowAnswer] = useState(false);

  // Loads a puzzle: from the URL hash when present (unless a new game is
  // forced), otherwise generates a fresh one at `size` and writes it back to
  // the hash. The difficulty state is kept in sync with whatever loads.
  const createGame = useCallback((forceNew = false, size = DIFFICULTIES.medium) => {
    setShowAnswer(false);

    if (!forceNew) {
      const saved = decodePuzzleFromHash(window.location.hash.slice(1));
      if (saved) {
        setPath(saved.path);
        setGrid(saved.grid);
        setWalls(saved.walls);
        setDifficulty(sizeToDifficulty(saved.grid.length));
        return;
      }
    }

    const { path: newPath, grid: newGrid, walls: newWalls } = generatePuzzle({ size });
    setPath(newPath);
    setGrid(newGrid);
    setWalls(newWalls);
    setDifficulty(sizeToDifficulty(size));
    window.history.replaceState(null, "", `#${encodePuzzleToHash(newPath, newGrid, newWalls)}`);
  }, []);

  useEffect(() => {
    createGame();
  }, [createGame]);

  // The browser's default body margin shows the page's white background as a
  // border around our dark layout. Zero it and match the background instead.
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.backgroundColor = colors.background;
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>LinkedIn Zip Practice</h1>

        <div style={styles.difficultyRow}>
          {Object.keys(DIFFICULTIES).map((key) => (
            <Button
              key={key}
              variant={difficulty === key ? "primary" : "secondary"}
              style={{ flex: 1, padding: "8px 0", fontSize: "14px", textTransform: "capitalize" }}
              onClick={() => createGame(true, DIFFICULTIES[key])}
            >
              {key}
            </Button>
          ))}
        </div>

        {grid && (
          <NumberGrid grid={grid} walls={walls} solution={path} showAnswer={showAnswer} />
        )}

        <div style={styles.actions}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={() => setShowAnswer((v) => !v)}>
            {showAnswer ? "Hide Answer" : "Show Answer"}
          </Button>
          <Button variant="primary" style={{ flex: 1 }} onClick={() => createGame(true, DIFFICULTIES[difficulty])}>
            New Game
          </Button>
        </div>

        <HowToPlay />
      </div>
    </div>
  );
}

export default App;
