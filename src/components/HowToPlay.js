import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

// "How to play" lives in a modal rather than an inline drop-down so opening it
// never grows the page height (which otherwise pushes the layout into a scroll).
export const HowToPlay = () => {
  const [open, setOpen] = useState(false);

  // Close on Escape while the modal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          marginTop: "16px",
          background: "none",
          border: "none",
          padding: "4px",
          cursor: "pointer",
          color: colors.textMuted,
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "underline",
          textUnderlineOffset: "3px",
        }}
      >
        How to play
      </button>

      {open &&
        createPortal(
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              zIndex: 100,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.md,
                padding: "24px",
                width: "100%",
                maxWidth: "360px",
                boxSizing: "border-box",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <span style={{ fontSize: "16px", fontWeight: 600, color: colors.text }}>How to play</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  style={{
                    background: "none",
                    border: "none",
                    padding: "4px",
                    cursor: "pointer",
                    color: colors.textMuted,
                    fontSize: "18px",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <Step glyph={<ConnectDots />} label="Connect the dots in order" />
                <Step glyph={<FillCells />} label="Fill every cell" />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
