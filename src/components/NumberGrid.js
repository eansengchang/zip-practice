import { useEffect, useState } from "react";
import { colors, radii } from "../theme";
import { ALL_EDGES, edgeKey } from "../lib/walls";
import { Button } from "./Button";

const CELL_SIZE = 60
const GAP_SIZE = 0;

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const isAdjacent = ([r1, c1], [r2, c2]) =>
  Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

// Interactive board: the player drags from 1 through every cell in order.
export const NumberGrid = ({ grid, walls = new Set() }) => {
  const [path, setPath] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [currentNumber, setCurrentNumber] = useState(1);
  const [copied, setCopied] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);

  const cols = grid[0].length;
  const totalWidth = cols * CELL_SIZE + (cols - 1) * GAP_SIZE;
  const totalHeight = grid.length * CELL_SIZE + (grid.length - 1) * GAP_SIZE;

  const hasWon = path.length > 0 && path.length === grid.length * grid.length;

  // Tick the timer once per second while the game is active.
  useEffect(() => {
    if (!isTimerActive) return undefined;
    const interval = setInterval(() => {
      setTimeElapsed((prevTime) => prevTime + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerActive]);

  useEffect(() => {
    if (hasWon) {
      setMessage("Great work! You completed the path.");
      setIsDragging(false);
      setIsTimerActive(false);
    }
  }, [hasWon]);

  // Reset everything whenever a new puzzle is loaded.
  useEffect(() => {
    setPath([]);
    setMessage("");
    setCurrentNumber(1);
    setTimeElapsed(0);
    setIsTimerActive(true);
    setCopied(false);
  }, [grid]);

  const isInPath = (row, col) => path.some(([r, c]) => r === row && c === col);

  const handleCellMouseDown = (row, col) => {
    if (hasWon) return;

    // Resume drawing if the player grabs the current end of the path.
    if (path.length > 0) {
      const [lastRow, lastCol] = path[path.length - 1];
      if (row === lastRow && col === lastCol) {
        setIsDragging(true);
        setMessage("");
        return;
      }
    }

    // Otherwise a fresh drag must start at the "1" cell.
    if (grid[row][col] === 1) {
      setMessage("");
      setCurrentNumber(1);
      setIsDragging(true);
      setPath([[row, col]]);
    } else {
      setMessage("You must start at 1, or click the end of your blue path to continue.");
    }
  };

  const handleCellMouseEnter = (row, col) => {
    if (!isDragging || hasWon) return;

    const last = path[path.length - 1];

    // Backtracking: dragging onto the second-to-last cell pops the last one.
    if (path.length >= 2) {
      const [prevRow, prevCol] = path[path.length - 2];
      if (row === prevRow && col === prevCol) {
        const [removedRow, removedCol] = last;
        if (grid[removedRow][removedCol] === currentNumber) {
          setCurrentNumber(currentNumber - 1);
        }
        setPath(path.slice(0, -1));
        setMessage("");
        return;
      }
    }

    // Ignore moves back onto the existing path (no self-intersection).
    if (isInPath(row, col)) return;

    // Valid forward move into an adjacent cell.
    if (isAdjacent(last, [row, col])) {
      // A wall on the shared edge blocks the move (handled silently, like a
      // diagonal: the barrier is visible, so no error message is needed).
      if (walls.has(edgeKey(last[0], last[1], row, col))) return;

      if (grid[row][col] === 0 || grid[row][col] === currentNumber + 1) {
        setPath([...path, [row, col]]);
        setMessage("");
        if (grid[row][col] === currentNumber + 1) {
          setCurrentNumber(currentNumber + 1);
        }
      } else {
        setMessage(`You need to connect to ${currentNumber + 1} next.`);
      }
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch dragging: mouseenter never fires on touch, so resolve the cell under
  // the finger from its coordinates and feed it through the same enter logic.
  const handleTouchMove = (e) => {
    if (!isDragging || hasWon) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = target && target.closest("[data-row]");
    if (!cell) return;
    handleCellMouseEnter(Number(cell.dataset.row), Number(cell.dataset.col));
  };

  // Wipe the current attempt without loading a different puzzle.
  const handleClear = () => {
    setPath([]);
    setMessage("");
    setCurrentNumber(1);
    setIsDragging(false);
  };

  const handleShare = () => {
    const shareText = `I solved this zip in ${timeElapsed} seconds!\n\nPlay my exact board here:\n${window.location.href}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const polylinePoints = path
    .map(([r, c]) => {
      const x = c * (CELL_SIZE + GAP_SIZE) + CELL_SIZE / 2;
      const y = r * (CELL_SIZE + GAP_SIZE) + CELL_SIZE / 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 600,
          color: isTimerActive ? colors.primary : colors.success,
          marginBottom: "4px",
          fontVariantNumeric: "tabular-nums", // consistent digit width avoids jitter
        }}
      >
        ⏱️ {formatTime(timeElapsed)}
      </div>

      {/* Status banner stays reserved-height so the board doesn't shift. */}
      <div
        style={{
          height: "24px",
          marginBottom: "16px",
          fontSize: "14px",
          fontWeight: 600,
          color: message.includes("Great work") ? colors.success : colors.error,
          opacity: message ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      >
        {message || " "}
      </div>

      <div
        style={{ position: "relative", width: totalWidth, height: totalHeight, touchAction: "none" }}
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Background layer: the 3D pipe tracing the player's path. */}
        {path.length > 0 && (
          <svg
            width={totalWidth}
            height={totalHeight}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 0, pointerEvents: "none" }}
          >
            <polyline points={polylinePoints} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 4)" />
            <polyline points={polylinePoints} fill="none" stroke={colors.primaryDark} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={polylinePoints} fill="none" stroke={colors.primary} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={polylinePoints} fill="none" stroke={colors.primaryLight} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" transform="translate(-2, -2)" />
          </svg>
        )}

        {/* Foreground layer: the interactive grid of cells. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${cols}, ${CELL_SIZE}px)`,
            gap: `${GAP_SIZE}px`,
            userSelect: "none",
            position: "relative",
            zIndex: 1,
          }}
        >
          {grid.map((row, rowIdx) =>
            row.map((num, colIdx) => {
              const active = isInPath(rowIdx, colIdx);
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  data-row={rowIdx}
                  data-col={colIdx}
                  onMouseDown={() => handleCellMouseDown(rowIdx, colIdx)}
                  onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
                  onTouchStart={() => handleCellMouseDown(rowIdx, colIdx)}
                  style={{
                    height: `${CELL_SIZE}px`,
                    width: `${CELL_SIZE}px`,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? "transparent" : colors.surface,
                    border: active ? "none" : `2px solid ${colors.border}`,
                    borderRadius: radii.md,
                    cursor: hasWon ? "default" : "pointer",
                    transition: "background-color 0.1s ease-in-out",
                  }}
                >
                  {num !== 0 && (
                    <div
                      style={{
                        backgroundColor: active ? colors.surface : "transparent",
                        color: active ? colors.primary : colors.text,
                        borderRadius: "50%",
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: 700,
                        boxShadow: active ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                      }}
                    >
                      {num}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Wall layer: thick segments on shared cell borders, above everything. */}
        {walls.size > 0 && (
          <svg
            width={totalWidth}
            height={totalHeight}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 2, pointerEvents: "none" }}
          >
            {ALL_EDGES.map(([r1, c1, r2, c2], i) => {
              if (!walls.has(edgeKey(r1, c1, r2, c2))) return null;
              const pitch = CELL_SIZE + GAP_SIZE;
              // Same row -> shared vertical border; same column -> horizontal.
              const [x1, y1, x2, y2] =
                r1 === r2
                  ? [(c1 + 1) * pitch, r1 * pitch, (c1 + 1) * pitch, (r1 + 1) * pitch]
                  : [c1 * pitch, (r1 + 1) * pitch, (c1 + 1) * pitch, (r1 + 1) * pitch];
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={colors.wall}
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* Reserved-height slot so Clear/Share appearing never shifts the buttons below. */}
      <div style={{ height: "44px", marginTop: "24px", display: "flex", alignItems: "center" }}>
        {!hasWon && path.length > 0 && (
          <Button variant="secondary" onClick={handleClear}>
            Clear Path
          </Button>
        )}

        {hasWon && (
          <Button
            variant={copied ? "successFilled" : "success"}
            onClick={handleShare}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            {copied ? "✅ Copied to Clipboard!" : "📤 Share Result"}
          </Button>
        )}
      </div>
    </div>
  );
};
