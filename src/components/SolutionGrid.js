import { colors, radii } from "../theme";

// Read-only SVG rendering of a completed path, used by the "Show Answer" view.
export const SolutionGrid = ({ path, cellSize = 40, showGrid = true }) => {
  if (!path) return null;

  const allX = path.map(([x]) => x);
  const allY = path.map(([, y]) => y);
  const width = (Math.max(...allX) + 1) * cellSize;
  const height = (Math.max(...allY) + 1) * cellSize;

  const renderGrid = () => {
    const lines = [];
    for (let x = 0; x <= width; x += cellSize) {
      lines.push(
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} stroke={colors.border} strokeWidth="2" />
      );
    }
    for (let y = 0; y <= height; y += cellSize) {
      lines.push(
        <line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke={colors.border} strokeWidth="2" />
      );
    }
    return lines;
  };

  const points = path
    .map(([y, x]) => `${x * cellSize + cellSize / 2},${y * cellSize + cellSize / 2}`)
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      style={{ backgroundColor: colors.gridBackground, borderRadius: radii.sm }}
    >
      {showGrid && renderGrid()}
      {/* Layered strokes create a 3D "pipe" look. */}
      <g>
        <polyline points={points} fill="none" stroke={colors.primaryDark} strokeWidth={cellSize / 2.2} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points} fill="none" stroke={colors.primary} strokeWidth={cellSize / 3} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points} fill="none" stroke={colors.primaryLight} strokeWidth={cellSize / 8} strokeLinecap="round" strokeLinejoin="round" transform="translate(-2, -2)" />
      </g>
    </svg>
  );
};
