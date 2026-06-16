import { colors, radii } from "../theme";

const VARIANTS = {
  primary: {
    backgroundColor: colors.primary,
    color: colors.surface,
    border: "none",
  },
  secondary: {
    backgroundColor: "transparent",
    color: colors.primary,
    border: `1.5px solid ${colors.primary}`,
  },
  success: {
    backgroundColor: colors.surface,
    color: colors.success,
    border: `1.5px solid ${colors.success}`,
  },
  successFilled: {
    backgroundColor: colors.success,
    color: colors.surface,
    border: `1.5px solid ${colors.success}`,
  },
};

// Shared pill button used for every action in the app. `variant` selects the
// color scheme; any extra style overrides are merged last.
export const Button = ({ variant = "primary", style, ...props }) => (
  <button
    {...props}
    style={{
      padding: "10px 24px",
      borderRadius: radii.pill,
      fontSize: "16px",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s",
      ...VARIANTS[variant],
      ...style,
    }}
  />
);
