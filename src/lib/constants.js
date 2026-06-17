// The puzzle is played on a SIZE x SIZE grid. Size is chosen by difficulty.
export const DIFFICULTIES = { easy: 4, medium: 6, hard: 8 };

// Default grid size when none is specified (Medium). Used as the fallback for
// puzzle generation and for decoding legacy (size-less) shared URLs.
export const DEFAULT_SIZE = DIFFICULTIES.medium;

// Legacy alias. Kept for the codec's size-less decode path and any default
// callers; logic functions take an explicit `size` rather than importing this.
export const SIZE = DEFAULT_SIZE;
