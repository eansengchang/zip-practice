import { colors, radii } from "../theme";
import { allEdges, edgeKey } from "../lib/walls";

// Read-only SVG rendering of a completed path, used by the "Show Answer" view.
// The grid size is read from the path's coordinate bounds; when no explicit
// cellSize is given it scales so the answer view stays a consistent width.
export const SolutionGrid = ({ path, walls = new Set(), cellSize, showGrid = true }) => {
  if (!path) return null;

  const allX = path.map(([x]) => x);
  const allY = path.map(([, y]) => y);
  const size = Math.max(...allX, ...allY) + 1;
  const cell = cellSize ?? Math.floor(320 / size);
  const width = (Math.max(...allX) + 1) * cell;
  const height = (Math.max(...allY) + 1) * cell;

  const renderGrid = () => {
    const lines = [];
    for (let x = 0; x <= width; x += cell) {
      lines.push(
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} stroke={colors.border} strokeWidth="2" />
      );
    }
    for (let y = 0; y <= height; y += cell) {
      lines.push(
        <line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke={colors.border} strokeWidth="2" />
      );
    }
    return lines;
  };

  const points = path
    .map(([y, x]) => `${x * cell + cell / 2},${y * cell + cell / 2}`)
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
        <polyline points={points} fill="none" stroke={colors.primaryDark} strokeWidth={cell / 2.2} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points} fill="none" stroke={colors.primary} strokeWidth={cell / 3} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={points} fill="none" stroke={colors.primaryLight} strokeWidth={cell / 8} strokeLinecap="round" strokeLinejoin="round" transform="translate(-2, -2)" />
      </g>
      {/* Walls: thick segments on the shared cell borders (col -> x, row -> y). */}
      {allEdges(size).map(([r1, c1, r2, c2], i) => {
        if (!walls.has(edgeKey(r1, c1, r2, c2))) return null;
        const [x1, y1, x2, y2] =
          r1 === r2
            ? [(c1 + 1) * cell, r1 * cell, (c1 + 1) * cell, (r1 + 1) * cell]
            : [c1 * cell, (r1 + 1) * cell, (c1 + 1) * cell, (r1 + 1) * cell];
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.wall} strokeWidth={cell / 6} strokeLinecap="round" />
        );
      })}
    </svg>
  );
};
