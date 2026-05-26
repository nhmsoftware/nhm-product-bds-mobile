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
  accent: string;
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

const feedbackColors = {
  danger: "#d14343",
  warning: "#c27803",
  success: "#16835c"
};

export const appThemes: Record<LayoutMode, AppTheme> = {
  default: {
    mode: "default",
    label: "Default",
    description: "Bố cục sáng cho khách hàng tìm kiếm bất động sản.",
    compact: false,
    colors: {
      ...feedbackColors,
      bg: "#f6f8f7",
      surface: "#ffffff",
      surfaceAlt: "#eef2f0",
      surfaceDark: "#e4e9e6",
      text: "#17211f",
      muted: "#66736f",
      border: "#dce4e0",
      primary: "#0f766e",
      primaryDark: "#0b5f59",
      accent: "#d97706",
      ink: "#ffffff",
      glassBackground: "rgba(255, 255, 255, 0.86)",
      glassBorder: "rgba(15, 118, 110, 0.18)"
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
      md: 14,
      lg: 20,
      xl: 28,
      screenPadding: 18
    },
    shadow: {
      shadowColor: "#0f172a",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      elevation: 3
    }
  },
  pro: {
    mode: "pro",
    label: "Pro",
    description: "Bố cục tối, dày thông tin cho môi giới và vận hành.",
    compact: true,
    colors: {
      danger: "#fb7185",
      warning: "#fbbf24",
      success: "#34d399",
      bg: "#0e1412",
      surface: "#151d1a",
      surfaceAlt: "#1f2a26",
      surfaceDark: "#09100e",
      text: "#f4f7f5",
      muted: "#94a39e",
      border: "rgba(148, 163, 158, 0.22)",
      primary: "#37b38d",
      primaryDark: "#1d8f73",
      accent: "#f59e0b",
      ink: "#07100d",
      glassBackground: "rgba(21, 29, 26, 0.82)",
      glassBorder: "rgba(255, 255, 255, 0.08)"
    },
    radius: {
      sm: 4,
      md: 8,
      lg: 10,
      xl: 14,
      full: 9999
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 18,
      xl: 24,
      screenPadding: 14
    },
    shadow: {
      shadowColor: "#000000",
      shadowOpacity: 0.28,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 14,
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
