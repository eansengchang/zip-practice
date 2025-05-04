import React from "react";
import { useState } from "react";

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
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} stroke="#ccc" />
      );
    }
    for (let y = 0; y <= height; y += cellSize) {
      lines.push(
        <line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke="#ccc" />
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
      <polyline
        points={points}
        fill="none"
        stroke="yellow"
        strokeWidth={cellSize / 2}
      />
    );
  };

  return (
    <svg width={width} height={height}>
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

  const handleCellMouseDown = (row, col) => {
    setMessage("");
    setCurrentNumber(1);
    setIsDragging(true);
    setPath([[row, col]]);
  };

  useState(() => {
    if (path.length == grid.length * grid.length) {
      setMessage("YOU WON");
    }
  }, [path]);

  const handleCellMouseEnter = (row, col) => {
    if (!isDragging) return;

    const last = path[path.length - 1];
    // Prevent duplicate and enforce adjacent cell movement
    if (
      isAdjacent(last, [row, col]) &&
      !isListInListOfLists([row, col], path) &&
      (grid[row][col] == 0 || grid[row][col] == currentNumber + 1)
    ) {
      if (path.length == grid.length * grid.length - 1) {
        setMessage("YOU WON");
      }
      setPath([...path, [row, col]]);
      if (grid[row][col] == currentNumber + 1) {
        setCurrentNumber(currentNumber + 1);
      }
    } else {
      setMessage("YOU LOST");

      setPath([]);
      setIsDragging(false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const isInPath = (row, col) => path.some(([r, c]) => r === row && c === col);

  const isAdjacent = ([r1, c1], [r2, c2]) =>
    Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

  return (
    <>
      {message}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${grid[0].length}, 50px)`,
          gridTemplateRows: `repeat(${grid[0].length}, 50px)`,
          gap: "2px",
          userSelect: "none",
        }}
        onMouseUp={handleMouseUp}
      >
        {grid.map((row, rowIdx) =>
          row.map((num, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              onMouseDown={() => handleCellMouseDown(rowIdx, colIdx)}
              onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
              style={{
                border: "1px solid black",
                height: "50px",
                width: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                backgroundColor: isInPath(rowIdx, colIdx)
                  ? "darkblue"
                  : "#696969",
                cursor: "pointer",
              }}
            >
              {num !== 0 ? num : ""}
            </div>
          ))
        )}
      </div>
    </>
  );
};
