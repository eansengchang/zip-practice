// Centralized design tokens. Keeping colors/spacing in one place avoids the
// magic-hex duplication that was previously scattered across every component.
//
// The palette is a dark, LinkedIn-Zip-style theme: a near-black page, dark
// raised panels, light "chip" surfaces for pills/buttons, and a bright blue
// accent for the player's path.

export const colors = {
  background: "#0a0a0a", // page background (near-black)
  surface: "#161719", // raised panels: the main card, the how-to-play card
  chip: "#26272b", // pills + subtle buttons (a notch lighter than surface)
  cell: "#050506", // grid cell fill; gridlines (border) define the cells
  primary: "#4f8ff7", // accent + player's path (brightened for a dark bg)
  primaryDark: "#2f6fd0",
  primaryLight: "#7eb0fb",
  success: "#4caf78",
  error: "#ff6b6b",
  text: "#f4f5f6",
  textMuted: "rgba(255,255,255,0.5)",
  border: "#3a3c40", // grid lines / outline-button borders
  gridBackground: "#0a0a0a",
  wall: "#e8e8e8", // walls show light so they read against the dark board
  clue: "#f4f5f6", // numbered clue circle fill
  clueText: "#0a0a0a", // numbered clue circle text
};

export const radii = {
  sm: "4px",
  md: "8px",
  pill: "24px",
};

export const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};
