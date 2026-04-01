import React, { useEffect, useState } from "react";

export const ObjectPathGrid = ({ path, cellSize = 40, showGrid = true }) => {
  if (!path) return <></>;
  const allX = path.map(([x]) => x);
  const allY = path.map(([, y]) => y);
  const width = (Math.max(...allX) + 1) * cellSize;
  const height = (Math.max(...allY) + 1) * cellSize;

  const renderGrid = () => {
    const lines = [];
    for (let x = 0; x <= width; x += cellSize) {
      lines.push(
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} stroke="#e6e9ec" strokeWidth="2" />
      );
    }
    for (let y = 0; y <= height; y += cellSize) {
      lines.push(
        <line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke="#e6e9ec" strokeWidth="2" />
      );
    }
    return lines;
  };

  const renderPath = () => {
    const points = path
      .map(
        ([y, x]) =>
          `${x * cellSize + cellSize / 2},${y * cellSize + cellSize / 2}`
      )
      .join(" ");
    return (
      <g>
        {/* 3D Pipe Effect for the Solution View */}
        <polyline points={points} fill="none" stroke="#004b8b" strokeWidth={cellSize / 2.2} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points} fill="none" stroke="#0a66c2" strokeWidth={cellSize / 3} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points} fill="none" stroke="#60a8ea" strokeWidth={cellSize / 8} strokeLinecap="round" strokeLinejoin="round" transform="translate(-2, -2)" />
      </g>
    );
  };

  return (
    <svg width={width} height={height} style={{ backgroundColor: "#faf9f7", borderRadius: "4px" }}>
      {showGrid && renderGrid()}
      {renderPath()}
    </svg>
  );
};

function isListInListOfLists(list, listOfLists) {
  return listOfLists.some(
    (subList) =>
      subList.length === list.length &&
      subList.every((value, index) => value === list[index])
  );
}

export const NumberGrid = ({ grid }) => {
  const [path, setPath] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [currentNumber, setCurrentNumber] = useState(1);
  const [copied, setCopied] = useState(false);

  // --- Timer State ---
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);

  const cellSize = 50;
  const gapSize = 6;
  const totalWidth = grid[0].length * cellSize + (grid[0].length - 1) * gapSize;
  const totalHeight = grid.length * cellSize + (grid.length - 1) * gapSize;

  const hasWon = path.length > 0 && path.length === grid.length * grid.length;

  // --- Timer Logic ---
  useEffect(() => {
    let interval = null;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimeElapsed((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  useEffect(() => {
    if (hasWon) {
      setMessage("Great work! You completed the path.");
      setIsDragging(false); // Stop dragging on win
      setIsTimerActive(false); // Stop timer on win
    }
  }, [hasWon]);

  useEffect(() => {
    setPath([]);
    setMessage("");
    setCurrentNumber(1);
    setTimeElapsed(0); // Reset timer
    setIsTimerActive(true); // Start timer
    setCopied(false); // Reset copy state
  }, [grid]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleCellMouseDown = (row, col) => {
    if (hasWon) return; // Prevent interaction after winning

    // 1. Check if clicking on the very end of the current path to resume drawing
    if (path.length > 0) {
      const [lastRow, lastCol] = path[path.length - 1];
      if (row === lastRow && col === lastCol) {
        setIsDragging(true);
        setMessage("");
        return;
      }
    }

    // 2. Start a new game, but enforce starting at 1
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

    // 1. Check for Backtracking (moving to the previous square)
    if (path.length >= 2) {
      const [prevRow, prevCol] = path[path.length - 2];
      if (row === prevRow && col === prevCol) {
        const [removedRow, removedCol] = last;
        
        // If we backtrack over a required number, decrement our target counter
        if (grid[removedRow][removedCol] === currentNumber) {
          setCurrentNumber(currentNumber - 1);
        }
        
        setPath(path.slice(0, -1)); // Pop the last element off the path
        setMessage(""); 
        return;
      }
    }

    // 2. Prevent intersecting our own path
    if (isListInListOfLists([row, col], path)) {
      return; // Just ignore the move instead of destroying the whole path
    }

    // 3. Check for valid forward move
    if (isAdjacent(last, [row, col])) {
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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleShare = () => {
    const shareText = `I solved this zip in ${timeElapsed} seconds!\n\nPlay my exact board here:\n${window.location.href}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isInPath = (row, col) => path.some(([r, c]) => r === row && c === col);
  const isAdjacent = ([r1, c1], [r2, c2]) => Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

  const getPolylinePoints = () => {
    return path.map(([r, c]) => {
      const x = c * (cellSize + gapSize) + (cellSize / 2);
      const y = r * (cellSize + gapSize) + (cellSize / 2);
      return `${x},${y}`;
    }).join(" ");
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      
      {/* Timer UI */}
      <div style={{
        fontSize: "20px",
        fontWeight: "600",
        color: isTimerActive ? "#0a66c2" : "#057642", // Turns green when won
        marginBottom: "4px",
        fontVariantNumeric: "tabular-nums", // Keeps character width consistent so text doesn't jitter
      }}>
        ⏱️ {formatTime(timeElapsed)}
      </div>

      {/* Status Message Banner */}
      <div style={{
        height: "24px",
        marginBottom: "16px",
        fontSize: "14px",
        fontWeight: "600",
        color: message.includes("Great work") ? "#057642" : "#cc1016", 
        opacity: message ? 1 : 0,
        transition: "opacity 0.2s"
      }}>
        {message || " "}
      </div>

      {/* Layered Play Area Container */}
      <div 
        style={{ position: "relative", width: totalWidth, height: totalHeight }}
        onMouseLeave={handleMouseUp} // Stops drawing if mouse leaves the board
        onMouseUp={handleMouseUp}
        onDragStart={(e) => e.preventDefault()}
      >
        
        {/* BACKGROUND LAYER: The 3D Pipe */}
        {path.length > 0 && (
          <svg
            width={totalWidth}
            height={totalHeight}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 0, pointerEvents: "none" }}
          >
            <polyline points={getPolylinePoints()} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 4)" />
            <polyline points={getPolylinePoints()} fill="none" stroke="#004b8b" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={getPolylinePoints()} fill="none" stroke="#0a66c2" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={getPolylinePoints()} fill="none" stroke="#60a8ea" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" transform="translate(-2, -2)" />
          </svg>
        )}

        {/* FOREGROUND LAYER: The Interactive Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${grid[0].length}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${grid[0].length}, ${cellSize}px)`,
            gap: `${gapSize}px`,
            userSelect: "none",
            position: "relative",
            zIndex: 1
          }}
        >
          {grid.map((row, rowIdx) =>
            row.map((num, colIdx) => {
              const active = isInPath(rowIdx, colIdx);
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  onMouseDown={() => handleCellMouseDown(rowIdx, colIdx)}
                  onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
                  style={{
                    height: `${cellSize}px`,
                    width: `${cellSize}px`,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? "transparent" : "#ffffff", 
                    border: active ? "none" : "2px solid #e6e9ec",
                    borderRadius: "8px", 
                    cursor: hasWon ? "default" : "pointer",
                    transition: "background-color 0.1s ease-in-out"
                  }}
                >
                  {num !== 0 && (
                    <div style={{
                      backgroundColor: active ? "#ffffff" : "transparent",
                      color: active ? "#0a66c2" : "rgba(0,0,0,0.9)",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: "700",
                      boxShadow: active ? "0 2px 4px rgba(0,0,0,0.2)" : "none"
                    }}>
                      {num}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Win State / Share Button */}
      {hasWon && (
        <button
          onClick={handleShare}
          style={{
            marginTop: "24px",
            padding: "10px 24px",
            borderRadius: "24px",
            backgroundColor: copied ? "#057642" : "#ffffff",
            color: copied ? "#ffffff" : "#057642",
            border: "1.5px solid #057642",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {copied ? "✅ Copied to Clipboard!" : "📤 Share Result"}
        </button>
      )}
    </div>
  );
};