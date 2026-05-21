export type LayoutMode = "default" | "pro";

export type ThemeColors = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceDark: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primaryDark: string;
  danger: string;
  warning: string;
  success: string;
  ink: string;
  glassBackground: string;
  glassBorder: string;
};

export type ThemeRadius = {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
};

export type AppTheme = {
  mode: LayoutMode;
  label: string;
  description: string;
  compact: boolean;
  colors: ThemeColors;
  radius: ThemeRadius;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    screenPadding: number;
  };
  shadow: {
    shadowColor: string;
    shadowOpacity: number;
    shadowOffset: { width: number; height: number };
    shadowRadius: number;
    elevation: number;
  };
};

const baseColors = {
  danger: "#f6465d",
  warning: "#e9c320",
  success: "#0ecb81"
};

export const appThemes: Record<LayoutMode, AppTheme> = {
  default: {
    mode: "default",
    label: "Default",
    description: "Bố cục mặc định theo bản chuyên nghiệp trong Stitch.",
    compact: true,
    colors: {
      ...baseColors,
      bg: "#0b0e14",
      surface: "#161a1e",
      surfaceAlt: "#22272d",
      surfaceDark: "#070a0f",
      text: "#f5f5f5",
      muted: "#8b8e95",
      border: "rgba(252, 213, 53, 0.22)",
      primary: "#fcd535",
      primaryDark: "#e9c320",
      ink: "#05070a",
      glassBackground: "rgba(22, 26, 30, 0.82)",
      glassBorder: "rgba(255, 255, 255, 0.1)"
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 20,
      xl: 28,
      screenPadding: 16
    },
    shadow: {
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 3
    }
  },
  pro: {
    mode: "pro",
    label: "Pro Style",
    description: "Bố cục xanh/demo từ Stitch sau khi đổi lại hai chế độ.",
    compact: false,
    colors: {
      ...baseColors,
      bg: "#101419",
      surface: "#1c2025",
      surfaceAlt: "#272a30",
      surfaceDark: "#0b0e14",
      text: "#e0e2ea",
      muted: "#999079",
      border: "#4d4633",
      primary: "#38bdf8",
      primaryDark: "#0ea5e9",
      ink: "#0b0e14",
      glassBackground: "rgba(255, 255, 255, 0.04)",
      glassBorder: "rgba(255, 255, 255, 0.08)"
    },
    radius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      full: 9999
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      screenPadding: 20
    },
    shadow: {
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      elevation: 5
    }
  }
};

export function getAppTheme(mode: LayoutMode) {
  return appThemes[mode];
}

export const colors = appThemes.default.colors;
export const radius = appThemes.default.radius;
export const shadow = appThemes.default.shadow;

export const glassShadow = {
  shadowColor: colors.primary,
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 10,
  elevation: 2
};
