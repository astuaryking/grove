// ============================================================
// Homestead Manager — Color System
// ============================================================

export interface ProjectColor {
  hex: string;
  name: string;
  bg: string;      // 10% opacity fill for cards/backgrounds
  border: string;  // 30% opacity for borders
  text: string;    // full color for text on dark backgrounds
}

// Fixed project color palette — designed for contrast on #0A0A0A
export const PROJECT_COLORS: Record<string, ProjectColor> = {
  lime: {
    hex: "#A3E635",
    name: "Lime",
    bg: "rgba(163, 230, 53, 0.10)",
    border: "rgba(163, 230, 53, 0.30)",
    text: "#A3E635",
  },
  amber: {
    hex: "#FBBF24",
    name: "Amber",
    bg: "rgba(251, 191, 36, 0.10)",
    border: "rgba(251, 191, 36, 0.30)",
    text: "#FBBF24",
  },
  orange: {
    hex: "#FB923C",
    name: "Orange",
    bg: "rgba(251, 146, 60, 0.10)",
    border: "rgba(251, 146, 60, 0.30)",
    text: "#FB923C",
  },
  teal: {
    hex: "#2DD4BF",
    name: "Teal",
    bg: "rgba(45, 212, 191, 0.10)",
    border: "rgba(45, 212, 191, 0.30)",
    text: "#2DD4BF",
  },
  purple: {
    hex: "#A78BFA",
    name: "Purple",
    bg: "rgba(167, 139, 250, 0.10)",
    border: "rgba(167, 139, 250, 0.30)",
    text: "#A78BFA",
  },
  pink: {
    hex: "#F472B6",
    name: "Pink",
    bg: "rgba(244, 114, 182, 0.10)",
    border: "rgba(244, 114, 182, 0.30)",
    text: "#F472B6",
  },
  blue: {
    hex: "#60A5FA",
    name: "Blue",
    bg: "rgba(96, 165, 250, 0.10)",
    border: "rgba(96, 165, 250, 0.30)",
    text: "#60A5FA",
  },
  red: {
    hex: "#F87171",
    name: "Red",
    bg: "rgba(248, 113, 113, 0.10)",
    border: "rgba(248, 113, 113, 0.30)",
    text: "#F87171",
  },
};

// Default project → color assignments
export const DEFAULT_PROJECT_COLORS: Record<string, string> = {
  "fruit-trees": "lime",
  "bee-hives": "amber",
  chickens: "orange",
  cannabis: "teal",
  "vegetable-garden": "purple",
  "cut-flowers": "pink",
};

// Priority colors (used for dots/badges)
export const PRIORITY_COLORS: Record<string, string> = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#A3E635",
};

// System colors
export const SYSTEM_COLORS = {
  bg: {
    page: "#0A0A0A",
    surface: "#111111",
    card: "#141414",
    hover: "#1A1A1A",
    elevated: "#1E1E1E",
  },
  text: {
    primary: "#FAFAFA",
    secondary: "#888888",
    tertiary: "#555555",
  },
  border: {
    default: "#222222",
    emphasized: "#333333",
  },
  accent: {
    primary: "#A3E635",  // lime
    secondary: "#2DD4BF", // teal
  },
  semantic: {
    danger: "#EF4444",
    warning: "#F59E0B",
    success: "#A3E635",
  },
} as const;

/**
 * Get the ProjectColor for a color key. Falls back to lime.
 */
export function getProjectColor(colorKey: string): ProjectColor {
  return PROJECT_COLORS[colorKey] ?? PROJECT_COLORS.lime;
}

/**
 * Available color keys for project creation/editing.
 */
export function getAvailableColors(): { key: string; color: ProjectColor }[] {
  return Object.entries(PROJECT_COLORS).map(([key, color]) => ({
    key,
    color,
  }));
}
