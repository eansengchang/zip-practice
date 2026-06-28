import { useEffect, useRef, useState } from "react";
import { colors, radii } from "../theme";
import { allEdges, edgeKey } from "../lib/walls";
import { Button } from "./Button";

// The board renders at most this wide, but shrinks to fit narrow viewports
// (phones) so it never overflows the card. The cell size is derived from the
// grid size so 4x4 / 6x6 / 8x8 all fit the same card.
const BOARD_TARGET = 360;
const GAP_SIZE = 0;

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const isAdjacent = ([r1, c1], [r2, c2]) =>
  Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

// Interactive board: the player drags from 1 through every cell in order.
export const NumberGrid = ({ grid, walls = new Set(), solution = null, showAnswer = false }) => {
  const [path, setPath] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [currentNumber, setCurrentNumber] = useState(1);
  const [copied, setCopied] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);

  // Available width, measured from the outer container, so the board can shrink
  // to fit a phone instead of overflowing the card at a fixed 360px.
  const containerRef = useRef(null);
  const [boardWidth, setBoardWidth] = useState(BOARD_TARGET);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setBoardWidth(Math.min(BOARD_TARGET, w));
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const size = grid.length;
  const cols = grid[0].length;
  const CELL_SIZE = Math.floor(boardWidth / size);
  // Visual elements scale with the cell so smaller (harder) grids stay legible.
  const clueDiameter = Math.round(CELL_SIZE * 0.47);
  const clueFont = Math.round(CELL_SIZE * 0.27);
  const pathStroke = Math.round(CELL_SIZE * 0.37);
  const wallStroke = Math.max(4, Math.round(CELL_SIZE * 0.1));

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

  // Re-derive the "current clue" from a path. Clues are a dense 1..k run in
  // path order, so we walk the cells and bump the counter each time the next
  // expected clue is hit. Used after Undo/Hint mutate the path wholesale.
  const clueNumberForPath = (cells) => {
    let n = 1;
    for (const [r, c] of cells) {
      if (grid[r][c] === n + 1) n += 1;
    }
    return n;
  };

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

  // Undo: drop the last cell off the path (one step), then re-derive the
  // current clue from what's left.
  const handleUndo = () => {
    if (hasWon || path.length === 0) return;
    const newPath = path.slice(0, -1);
    setPath(newPath);
    setCurrentNumber(clueNumberForPath(newPath));
    setMessage("");
    setIsDragging(false);
  };

  // Hint: snap the path to the longest prefix it shares with the real solution,
  // then reveal one more correct cell. If the player has drifted off the
  // solution, this also trims the wrong tail.
  const handleHint = () => {
    if (hasWon || !solution) return;
    let match = 0;
    while (
      match < path.length &&
      match < solution.length &&
      path[match][0] === solution[match][0] &&
      path[match][1] === solution[match][1]
    ) {
      match += 1;
    }
    const newPath = solution.slice(0, Math.min(match + 1, solution.length));
    setPath(newPath);
    setCurrentNumber(clueNumberForPath(newPath));
    setMessage("");
    setIsDragging(false);
  };

  const handleShare = () => {
    const shareText = `I solved this zip in ${timeElapsed} seconds!\n\nPlay my exact board here:\n${window.location.href}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const cellCenter = (r, c) => [
    c * (CELL_SIZE + GAP_SIZE) + CELL_SIZE / 2,
    r * (CELL_SIZE + GAP_SIZE) + CELL_SIZE / 2,
  ];

  const polylinePoints = path.map(([r, c]) => cellCenter(r, c).join(",")).join(" ");
  const solutionPoints = solution
    ? solution.map(([r, c]) => cellCenter(r, c).join(",")).join(" ")
    : "";

  return (
    <div ref={containerRef} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Top bar: timer (left), Clear (right). Difficulty lives in the selector
          above the board, so it's not repeated here. */}
      <div
        style={{
          width: totalWidth,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: isTimerActive ? colors.textMuted : colors.success,
            fontVariantNumeric: "tabular-nums", // consistent digit width avoids jitter
          }}
        >
          ⏱️ {formatTime(timeElapsed)}
        </span>

        <Button
          variant="secondary"
          onClick={handleClear}
          style={{ padding: "6px 16px", fontSize: "14px" }}
        >
          Clear
        </Button>
      </div>

      {/* Status banner stays reserved-height so the board doesn't shift. */}
      <div
        style={{
          height: "20px",
          marginBottom: "8px",
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
        style={{
          position: "relative",
          width: totalWidth,
          height: totalHeight,
          touchAction: "none",
          borderRadius: radii.md,
          overflow: "hidden",
          border: `1px solid ${colors.border}`,
        }}
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Layer 0: interactive cells. Always opaque, square-cornered and flush
            (no border-radius) so they never vanish under the line and leave no
            gaps where four corners meet. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${cols}, ${CELL_SIZE}px)`,
            gap: `${GAP_SIZE}px`,
            userSelect: "none",
            position: "relative",
            zIndex: 0,
          }}
        >
          {grid.map((row, rowIdx) =>
            row.map((num, colIdx) => (
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
                  backgroundColor: num === 1 ? colors.cellStart : colors.cell,
                  border: `1px solid ${colors.border}`,
                  cursor: hasWon ? "default" : "pointer",
                }}
              />
            ))
          )}
        </div>

        {/* Layer 1: the player's path, a constant accent color. */}
        {path.length > 1 && (
          <svg
            width={totalWidth}
            height={totalHeight}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 1, pointerEvents: "none" }}
          >
            <polyline points={polylinePoints} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={pathStroke} strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 3)" />
            <polyline points={polylinePoints} fill="none" stroke={colors.primary} strokeWidth={pathStroke} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        {/* Answer overlay: the full solution drawn translucently on top of the
            board (Show Answer), so it reads as a guide over the player's grid. */}
        {showAnswer && solution && (
          <svg
            width={totalWidth}
            height={totalHeight}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 2, pointerEvents: "none" }}
          >
            <polyline
              points={solutionPoints}
              fill="none"
              stroke={colors.primaryLight}
              strokeWidth={pathStroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.55}
            />
          </svg>
        )}

        {/* Layer 2: clue circles, sitting on top of the line like the real board. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${cols}, ${CELL_SIZE}px)`,
            gap: `${GAP_SIZE}px`,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          {grid.map((row, rowIdx) =>
            row.map((num, colIdx) => (
              <div
                key={`${rowIdx}-${colIdx}`}
                style={{
                  height: `${CELL_SIZE}px`,
                  width: `${CELL_SIZE}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {num !== 0 && (
                  <div
                    style={{
                      backgroundColor: colors.clue,
                      color: colors.clueText,
                      borderRadius: "50%",
                      width: `${clueDiameter}px`,
                      height: `${clueDiameter}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: `${clueFont}px`,
                      fontWeight: 700,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
                    }}
                  >
                    {num}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Wall layer: thick segments on shared cell borders, above everything. */}
        {walls.size > 0 && (
          <svg
            width={totalWidth}
            height={totalHeight}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 2, pointerEvents: "none" }}
          >
            {allEdges(size).map(([r1, c1, r2, c2], i) => {
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
                  strokeWidth={wallStroke}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* Undo / Hint row (fixed height so it never reflows). */}
      <div
        style={{
          width: totalWidth,
          display: "flex",
          gap: "12px",
          marginTop: "12px",
          height: "40px",
        }}
      >
        <Button
          variant="subtle"
          style={{ flex: 1 }}
          onClick={handleUndo}
          disabled={hasWon || path.length === 0}
        >
          Undo
        </Button>
        <Button
          variant="secondary"
          style={{ flex: 1 }}
          onClick={handleHint}
          disabled={hasWon || !solution}
        >
          Hint
        </Button>
      </div>

      {/* Reserved-height slot so the Share button appearing on a win never
          shifts the content below. */}
      <div style={{ height: "40px", marginTop: "10px", display: "flex", alignItems: "center" }}>
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
