import { heroui } from "@heroui/theme";

// Shared neutral bases — every theme uses the same grays.
// Only the primary accent color changes per theme.
const DARK_BASE = {
  background: "#09090B",
  foreground: "#FAFAFA",
  content1: "#18181B",
  content2: "#27272A",
  content3: "#3F3F46",
  content4: "#52525B",
  default: {
    50: "#18181B",
    100: "#27272A",
    200: "#3F3F46",
    300: "#52525B",
    400: "#71717A",
    500: "#A1A1AA",
    600: "#D4D4D8",
    700: "#E4E4E7",
    800: "#F4F4F5",
    900: "#FAFAFA",
    DEFAULT: "#3F3F46",
    foreground: "#FAFAFA",
  },
};

const LIGHT_BASE = {
  background: "#FAFAFA",
  foreground: "#09090B",
  content1: "#FFFFFF",
  content2: "#F4F4F5",
  content3: "#E4E4E7",
  content4: "#D4D4D8",
  default: {
    50: "#FAFAFA",
    100: "#F4F4F5",
    200: "#E4E4E7",
    300: "#D4D4D8",
    400: "#A1A1AA",
    500: "#71717A",
    600: "#52525B",
    700: "#3F3F46",
    800: "#27272A",
    900: "#18181B",
    DEFAULT: "#E4E4E7",
    foreground: "#09090B",
  },
};

export default heroui({
  themes: {
    // ── LIGHT: Indigo ──
    light: {
      colors: {
        ...LIGHT_BASE,
        primary: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          DEFAULT: "#6366F1",
          foreground: "#FFFFFF",
        },
        focus: "#6366F1",
      },
    },

    // ── DARK: Indigo ──
    dark: {
      colors: {
        ...DARK_BASE,
        primary: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          DEFAULT: "#818CF8",
          foreground: "#FFFFFF",
        },
        focus: "#818CF8",
      },
    },

    // ── OCEAN: Blue ──
    ocean: {
      extend: "dark",
      colors: {
        ...DARK_BASE,
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          DEFAULT: "#60A5FA",
          foreground: "#FFFFFF",
        },
        focus: "#60A5FA",
      },
    },

    // ── FOREST: Emerald ──
    forest: {
      extend: "dark",
      colors: {
        ...DARK_BASE,
        primary: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          DEFAULT: "#34D399",
          foreground: "#FFFFFF",
        },
        focus: "#34D399",
      },
    },

    // ── SUNSET: Orange ──
    sunset: {
      extend: "light",
      colors: {
        ...LIGHT_BASE,
        primary: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          DEFAULT: "#F97316",
          foreground: "#FFFFFF",
        },
        focus: "#F97316",
      },
    },

    // ── PURPLE: Violet ──
    "purple-dark": {
      extend: "dark",
      colors: {
        ...DARK_BASE,
        primary: {
          50: "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          400: "#C084FC",
          500: "#A855F7",
          600: "#9333EA",
          700: "#7E22CE",
          800: "#6B21A8",
          900: "#581C87",
          DEFAULT: "#C084FC",
          foreground: "#FFFFFF",
        },
        focus: "#C084FC",
      },
    },

    // ── ROSE: Pink ──
    rose: {
      extend: "light",
      colors: {
        ...LIGHT_BASE,
        primary: {
          50: "#FFF1F2",
          100: "#FFE4E6",
          200: "#FECDD3",
          300: "#FDA4AF",
          400: "#FB7185",
          500: "#F43F5E",
          600: "#E11D48",
          700: "#BE123C",
          800: "#9F1239",
          900: "#881337",
          DEFAULT: "#F43F5E",
          foreground: "#FFFFFF",
        },
        focus: "#F43F5E",
      },
    },

    // ── MIDNIGHT: Cyan ──
    midnight: {
      extend: "dark",
      colors: {
        ...DARK_BASE,
        primary: {
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
          DEFAULT: "#22D3EE",
          foreground: "#FFFFFF",
        },
        focus: "#22D3EE",
      },
    },
  },
});
