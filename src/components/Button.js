import { colors, radii } from "../theme";

const VARIANTS = {
  primary: {
    backgroundColor: colors.primary,
    color: "#ffffff",
    border: "none",
  },
  secondary: {
    backgroundColor: "transparent",
    color: colors.text,
    border: `1.5px solid ${colors.border}`,
  },
  // Filled-grey pill used for Undo: present but quieter than the accent.
  subtle: {
    backgroundColor: colors.chip,
    color: colors.text,
    border: "none",
  },
  success: {
    backgroundColor: "transparent",
    color: colors.success,
    border: `1.5px solid ${colors.success}`,
  },
  successFilled: {
    backgroundColor: colors.success,
    color: "#ffffff",
    border: `1.5px solid ${colors.success}`,
  },
};

// Shared pill button used for every action in the app. `variant` selects the
// color scheme; a disabled button dims and stops responding; any extra style
// overrides are merged last.
export const Button = ({ variant = "primary", style, disabled, ...props }) => (
  <button
    disabled={disabled}
    {...props}
    style={{
      padding: "10px 24px",
      borderRadius: radii.pill,
      fontSize: "16px",
      fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.2s",
      ...VARIANTS[variant],
      ...(disabled ? { opacity: 0.4 } : null),
      ...style,
    }}
  />
);
