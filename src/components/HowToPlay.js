import { useState } from "react";
import { colors, radii } from "../theme";

// Three numbered dots joined by a line — the "connect the dots in order" glyph.
const ConnectDots = () => (
  <svg width="76" height="24" viewBox="0 0 76 24" aria-hidden="true">
    <line x1="12" y1="12" x2="64" y2="12" stroke={colors.primary} strokeWidth="3" />
    {[12, 38, 64].map((cx, i) => (
      <g key={cx}>
        <circle cx={cx} cy="12" r="11" fill={colors.clue} />
        <text
          x={cx}
          y="16"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill={colors.clueText}
        >
          {i + 1}
        </text>
      </g>
    ))}
  </svg>
);

// A short blue path that snakes through a small grid — "fill every cell".
const FillCells = () => (
  <svg width="60" height="40" viewBox="0 0 60 40" aria-hidden="true">
    <polyline
      points="12,10 12,30 30,30 30,10 48,10 48,30"
      fill="none"
      stroke={colors.primary}
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Step = ({ glyph, label }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
    <div style={{ height: "40px", display: "flex", alignItems: "center" }}>{glyph}</div>
    <span style={{ fontSize: "13px", color: colors.textMuted, textAlign: "center", lineHeight: 1.4 }}>
      {label}
    </span>
  </div>
);

// Collapsible explainer card, mirroring LinkedIn Zip's "How to play" panel.
export const HowToPlay = () => {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        width: "100%",
        marginTop: "16px",
        backgroundColor: colors.chip,
        borderRadius: radii.md,
        padding: "14px 20px",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: colors.text,
          fontSize: "15px",
          fontWeight: 600,
        }}
      >
        How to play
        <span style={{ fontSize: "12px", color: colors.textMuted, transform: open ? "none" : "rotate(180deg)" }}>
          ▲
        </span>
      </button>

      {open && (
        <div style={{ display: "flex", gap: "16px", marginTop: "18px" }}>
          <Step glyph={<ConnectDots />} label="Connect the dots in order" />
          <Step glyph={<FillCells />} label="Fill every cell" />
        </div>
      )}
    </div>
  );
};
