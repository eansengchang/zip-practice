import { colors, radii } from "../theme";
import { ALL_EDGES, edgeKey } from "../lib/walls";

// Read-only SVG rendering of a completed path, used by the "Show Answer" view.
export const SolutionGrid = ({ path, walls = new Set(), cellSize = 40, showGrid = true }) => {
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
      {/* Walls: thick segments on the shared cell borders (col -> x, row -> y). */}
      {ALL_EDGES.map(([r1, c1, r2, c2], i) => {
        if (!walls.has(edgeKey(r1, c1, r2, c2))) return null;
        const [x1, y1, x2, y2] =
          r1 === r2
            ? [(c1 + 1) * cellSize, r1 * cellSize, (c1 + 1) * cellSize, (r1 + 1) * cellSize]
            : [c1 * cellSize, (r1 + 1) * cellSize, (c1 + 1) * cellSize, (r1 + 1) * cellSize];
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.wall} strokeWidth={cellSize / 6} strokeLinecap="round" />
        );
      })}
    </svg>
  );
};
