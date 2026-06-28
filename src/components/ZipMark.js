import { colors, fonts } from "../theme";

// Small brand mark: the LinkedIn-Zip app icon (a single path weaving through a
// grid, starting at the "1" clue), inlined as SVG so it scales crisply and
// pulls its accent from the theme. This mirrors `public/icon.svg`, which is the
// source for the favicon and logo192/512 PNGs — keep the two in sync if either
// changes. `#fff` here is the mark's own artwork color, not a theme token.
export function ZipMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="zipMarkTile" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={colors.primary} />
          <stop offset="1" stopColor={colors.primaryDeep} />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="512" height="512" rx="112" fill="url(#zipMarkTile)" />

      <path
        d="M 150 150 H 362 V 256 H 150 V 362 H 362"
        fill="none"
        stroke="#fff"
        strokeWidth="40"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="150" cy="150" r="40" fill="#fff" />
      <text
        x="150"
        y="151"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={fonts.sans}
        fontSize="48"
        fontWeight="700"
        fill={colors.primaryDeep}
      >
        1
      </text>

      <circle cx="362" cy="362" r="30" fill="#fff" />
    </svg>
  );
}
