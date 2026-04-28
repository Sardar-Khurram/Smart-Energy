import { Platform, useWindowDimensions, ViewStyle } from "react-native";
import { useNavigationMode } from "react-native-navigation-mode";

export const BREAKPOINTS = {
  tablet: 768,
};

// ---------------------------------------------------------------------------------
// 1. COLOR PALETTE — ⚡ Electricity / Energy Monitoring Theme
// ---------------------------------------------------------------------------------

export const palette = {
  // ⚡ Electric Blues — Primary Energy / Current Flow
  blue50:  "#E6F4FF",
  blue100: "#B3DEFF",
  blue200: "#80C8FF",
  blue300: "#4DB2FF",
  blue400: "#1A9BFF",
  blue500: "#0080FF",  // Core electric blue
  blue600: "#0066CC",
  blue700: "#004D99",
  blue800: "#003366",
  blue900: "#001A33",

  // ⚡ Voltage Gradient (Electric Blue → Cyan Arc Flash)
  gradientStart: "#0047FF",  // High-voltage deep blue
  gradientEnd:   "#00D2FF",  // Arc flash cyan / live wire

  // 🔮 Secondary — Plasma Purple (high-frequency energy)
  purple: "#7B2FFF",

  // ⚡ Electric Cyan — Live Data / Active Sensors
  cyan50:  "#E0FFFE",
  cyan400: "#00E5FF",
  cyan500: "#00BCD4",
  cyan600: "#0097A7",

  // ⚡ Volt Yellow — Warning / High Load Indicator (classic electricity color)
  voltYellow:      "#FFD600",
  voltYellowLight: "#FFF9C4",
  voltYellowDark:  "#F9A825",

  // 🌡️ Thermal Orange — Overheating / Overload Alerts
  thermalOrange:      "#FF6D00",
  thermalOrangeLight: "#FFE0B2",

  // ✅ Safe Green — Normal Operating Status
  safeGreen:      "#00E676",
  safeGreenLight: "#E8F5E9",
  safeGreenDark:  "#00C853",

  // ❌ Critical Red — Fault / Danger / Trip
  criticalRed:      "#FF1744",
  criticalRedLight: "#FFEBEE",

  // ─── Neutrals (Dark-first — monitoring dashboards are dark) ───
  white:   "#FFFFFF",
  black:   "#000000",

  gray50:  "#F0F4FF",   // Very light blue-tinted white
  gray100: "#DCE4F5",
  gray200: "#B8C5E0",
  gray300: "#8FA0C0",
  gray400: "#607090",
  gray500: "#415070",
  gray600: "#2E3D58",
  gray700: "#1E2B40",
  gray800: "#131D30",   // Deep navy — card bg in dark mode
  gray900: "#08090F",   // Near-black with blue tint — main bg
};

// Soft tinted backgrounds for status badges / icon containers
export const softPalette = {
  // Voltage / Current
  blue:       "#0047FF1A",
  blueIconBg: "#0080FF",

  // Live / Active
  cyan:       "#00D2FF1A",
  cyanIconBg: "#00BCD4",

  // Normal status
  green:       "#00E6761A",
  greenIconBg: "#00C853",

  // Warning (high load, volt fluctuation)
  yellow:       "#FFD6001A",
  yellowIconBg: "#F9A825",

  // Overheating / Overload
  orange:       "#FF6D001A",
  orangeIconBg: "#FF6D00",

  // Fault / Trip / Disconnect
  red:       "#FF17441A",
  redIconBg: "#FF1744",
};

export const Colors = {
  light: {
    // Primary — Electric Blue
    primary:            palette.blue500,
    primaryForeground:  palette.white,
    primaryHover:       palette.blue700,

    // Secondary — Plasma Purple
    secondary:           palette.purple,
    secondaryForeground: palette.white,

    // Accent — Volt Yellow (high-visibility energy accent)
    accent:            palette.voltYellow,
    accentForeground:  palette.black,

    // Backgrounds
    background: "#F0F4FF",   // Light cool-blue tint (not pure white)
    card:       "#FFFFFF",   // Pure white cards on cool bg
    elevated:   "#FFFFFF",

    // Text
    foreground:       palette.gray900,
    mutedForeground:  palette.gray500,

    // UI Elements
    muted:   palette.gray100,
    border:  palette.gray200,
    input:   palette.gray50,
    divider: palette.gray200,

    // Status — Energy Semantics
    destructive:            palette.criticalRed,     // Fault / trip
    destructiveForeground:  palette.white,
    warning:                palette.voltYellowDark,  // Overload / high draw
    warningForeground:      palette.black,
    success:                palette.safeGreenDark,   // Normal operation
    successForeground:      palette.white,
    info:                   palette.cyan500,         // Sensor data / live readings
    infoForeground:         palette.white,
    thermal:                palette.thermalOrange,   // Overheating
    thermalForeground:      palette.white,
  },

  dark: {
    // Primary — Electric Blue (same, pops on dark)
    primary:            palette.blue500,
    primaryForeground:  palette.white,
    primaryHover:       palette.blue400,

    // Secondary — Plasma Purple
    secondary:           palette.purple,
    secondaryForeground: palette.white,

    // Accent — Volt Yellow
    accent:            palette.voltYellow,
    accentForeground:  palette.black,

    // Backgrounds — Dark control-panel aesthetic
    background: "#08090F",   // Near-black with electric blue undertone
    card:       "#0E1220",   // Dark navy — main card surface
    elevated:   "#151C2E",   // Slightly lighter for modals / sheets

    // Text
    foreground:      "#D0E4FF",   // Cool blue-white — easy on eyes
    mutedForeground: "#4A6080",   // Muted blue-gray

    // UI Elements
    muted:   "#0E1220",
    border:  "#1E2E48",   // Subtle blue border — feels electric
    input:   "#131D30",
    divider: "#1E2E48",

    // Status — Energy Semantics
    destructive:            palette.criticalRed,
    destructiveForeground:  palette.white,
    warning:                palette.voltYellow,
    warningForeground:      palette.black,
    success:                palette.safeGreen,
    successForeground:      palette.black,
    info:                   palette.cyan400,
    infoForeground:         palette.black,
    thermal:                palette.thermalOrange,
    thermalForeground:      palette.white,
  },
};

// ⚡ Primary gradient — Electric Arc (Blue → Cyan)
export const PRIMARY_GRADIENT = {
  start: palette.gradientStart,  // #0047FF deep electric blue
  end:   palette.gradientEnd,    // #00D2FF arc-flash cyan
};

// ⚡ Volt gradient — High-load / warning indicator
export const VOLT_GRADIENT = {
  start: "#FF8F00",   // Amber
  end:   "#FFD600",   // Volt yellow
};

// ⚡ Thermal gradient — Temperature / heat map
export const THERMAL_GRADIENT = {
  start: "#FF6D00",   // Orange
  end:   "#FF1744",   // Red (danger)
};

// ⚡ Safe gradient — Normal operation
export const SAFE_GRADIENT = {
  start: "#00BCD4",   // Cyan
  end:   "#00E676",   // Green
};

export type ThemeColors = typeof Colors.light;

// ---------------------------------------------------------------------------------
// 2. TYPOGRAPHY — Technical / Monitoring Dashboard Hierarchy
// ---------------------------------------------------------------------------------

export const Typography = {
  fontFamily: Platform.select({
    ios:     "System",
    android: "System",
    default: "sans-serif",
  }),

  fontSizes: {
    mobile: {
      // Display (Hero / Big metric numbers)
      display: 32,

      // Headings
      h1: 28,
      h2: 22,
      h3: 18,
      h4: 16,

      // Body
      lg:  16,
      base: 14,
      sm:  13,
      xs:  12,
      xxs: 10,  // Sensor labels, axis ticks
    },
    tablet: {
      display: 48,
      h1: 36,
      h2: 30,
      h3: 24,
      h4: 20,
      lg:  18,
      base: 16,
      sm:  14,
      xs:  13,
      xxs: 11,
    },
  },

  fontWeights: {
    light:     "300" as const,
    normal:    "400" as const,
    medium:    "500" as const,
    semibold:  "600" as const,
    bold:      "700" as const,
    extrabold: "800" as const,
  },

  lineHeights: {
    tight:   1.2,
    normal:  1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    tighter: -0.5,
    tight:   -0.25,
    normal:   0,
    wide:     0.25,
    wider:    0.5,
    // For large metric numbers (voltage, current readouts)
    metric:  -1.0,
  },
};

// ---------------------------------------------------------------------------------
// 3. SPACING & SIZES
// ---------------------------------------------------------------------------------

export const SIZES = {
  spacing: {
    mobile: {
      xxs: 2,
      xs:  4,
      sm:  8,
      md:  16,
      lg:  24,
      xl:  32,
      "2xl": 48,
      "3xl": 64,
    },
    tablet: {
      xxs: 4,
      xs:  8,
      sm:  12,
      md:  24,
      lg:  32,
      xl:  48,
      "2xl": 64,
      "3xl": 96,
    },
  },

  layout: {
    mobile: {
      inputHeight:      48,
      buttonHeight:     48,
      buttonHeightSm:   36,
      buttonHeightLg:   56,
      iconSize:         20,
      iconSizeLg:       24,
      avatarSize:       40,
      avatarSizeLg:     56,
      // Energy-specific
      metricCardHeight: 100,  // Live reading cards
      graphHeight:      180,  // Inline mini charts
    },
    tablet: {
      inputHeight:      56,
      buttonHeight:     56,
      buttonHeightSm:   44,
      buttonHeightLg:   64,
      iconSize:         24,
      iconSizeLg:       28,
      avatarSize:       48,
      avatarSizeLg:     64,
      metricCardHeight: 120,
      graphHeight:      240,
    },
  },
};

// ---------------------------------------------------------------------------------
// 4. BORDERS & SHADOWS — Electric Glow Style
// ---------------------------------------------------------------------------------

export const BORDERS = {
  radius: {
    mobile: {
      xs:   4,
      sm:   8,
      md:   12,
      lg:   16,
      xl:   24,
      full: 9999,
    },
    tablet: {
      xs:   6,
      sm:   10,
      md:   16,
      lg:   20,
      xl:   28,
      full: 9999,
    },
  },

  width: {
    thin:    1,
    default: 1.5,
    thick:   2,
  },
};

// ⚡ Glow shadows — electric/neon feel for dark mode cards
export const SHADOWS = {
  xs: {
    mobile: {
      shadowColor:   palette.blue500,
      shadowOffset:  { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius:  3,
      elevation: 1,
    },
    tablet: {
      shadowColor:   palette.blue500,
      shadowOffset:  { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius:  4,
      elevation: 1,
    },
  },
  sm: {
    mobile: {
      shadowColor:   palette.blue500,
      shadowOffset:  { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius:  6,
      elevation: 2,
    },
    tablet: {
      shadowColor:   palette.blue500,
      shadowOffset:  { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius:  8,
      elevation: 3,
    },
  },
  md: {
    mobile: {
      shadowColor:   palette.blue500,
      shadowOffset:  { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius:  12,
      elevation: 4,
    },
    tablet: {
      shadowColor:   palette.blue500,
      shadowOffset:  { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius:  18,
      elevation: 6,
    },
  },
  lg: {
    mobile: {
      shadowColor:   palette.gradientStart,
      shadowOffset:  { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius:  20,
      elevation: 8,
    },
    tablet: {
      shadowColor:   palette.gradientStart,
      shadowOffset:  { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius:  30,
      elevation: 10,
    },
  },

  // ⚡ Sensor-specific glow shadows
  voltGlow: {
    shadowColor:   palette.voltYellow,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius:  12,
    elevation: 6,
  },
  thermalGlow: {
    shadowColor:   palette.thermalOrange,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius:  12,
    elevation: 6,
  },
  safeGlow: {
    shadowColor:   palette.safeGreen,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius:  10,
    elevation: 5,
  },
  criticalGlow: {
    shadowColor:   palette.criticalRed,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius:  14,
    elevation: 8,
  },
};

// ---------------------------------------------------------------------------------
// 5. RESPONSIVE TOKENS HOOK
// ---------------------------------------------------------------------------------

type ResponsiveOverride = {
  screenStyles?: Partial<ViewStyle>;
};

export const useResponsiveTokens = (overrides?: ResponsiveOverride) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= BREAKPOINTS.tablet;

  const baseScreenStyles: ViewStyle = {
    maxWidth:       isTablet ? "80%" : "100%",
    marginHorizontal: isTablet ? "auto" : SIZES.spacing.mobile.md,
    width:          isTablet ? "100%" : "auto",
  };

  const screenStyles: ViewStyle = {
    ...baseScreenStyles,
    ...overrides?.screenStyles,
  };

  return {
    isTablet,
    fontSizes:     isTablet ? Typography.fontSizes.tablet   : Typography.fontSizes.mobile,
    fontWeights:   Typography.fontWeights,
    lineHeights:   Typography.lineHeights,
    letterSpacing: Typography.letterSpacing,
    spacing:       isTablet ? SIZES.spacing.tablet  : SIZES.spacing.mobile,
    layout:        isTablet ? SIZES.layout.tablet   : SIZES.layout.mobile,
    radius:        isTablet ? BORDERS.radius.tablet : BORDERS.radius.mobile,
    borderWidth:   BORDERS.width,
    shadows: {
      xs:           isTablet ? SHADOWS.xs.tablet  : SHADOWS.xs.mobile,
      sm:           isTablet ? SHADOWS.sm.tablet  : SHADOWS.sm.mobile,
      md:           isTablet ? SHADOWS.md.tablet  : SHADOWS.md.mobile,
      lg:           isTablet ? SHADOWS.lg.tablet  : SHADOWS.lg.mobile,
      voltGlow:     SHADOWS.voltGlow,
      thermalGlow:  SHADOWS.thermalGlow,
      safeGlow:     SHADOWS.safeGlow,
      criticalGlow: SHADOWS.criticalGlow,
    },
    screenStyles,
  };
};

// ---------------------------------------------------------------------------------
// 6. TABLET CHECK HOOK
// ---------------------------------------------------------------------------------

export function useIsTablet() {
  const { width } = useWindowDimensions();
  return width >= BREAKPOINTS.tablet;
}

// ---------------------------------------------------------------------------------
// 7. SAFE AREA CONSTANTS
// ---------------------------------------------------------------------------------

const NAVBAR_HEIGHT  = 48;
const SIDEBAR_PADDING = 110;

export { NAVBAR_HEIGHT, SIDEBAR_PADDING };

// ---------------------------------------------------------------------------------
// 8. SAFE AREA STYLES
// ---------------------------------------------------------------------------------

export function useSafeAreaStyles(): ViewStyle {
  const { navigationMode } = useNavigationMode();

  return {
    paddingBottom: navigationMode?.isGestureNavigation ? 114 : 100,
    paddingLeft: 0,
  };
}

// ---------------------------------------------------------------------------------
// 9. FONTS
// ---------------------------------------------------------------------------------

export const Fonts = Platform.select({
  ios: {
    sans:    "system-ui",
    serif:   "ui-serif",
    rounded: "ui-rounded",
    mono:    "ui-monospace",  // Great for numeric readouts (voltage, kWh)
  },
  default: {
    sans:    "normal",
    serif:   "serif",
    rounded: "normal",
    mono:    "monospace",
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ---------------------------------------------------------------------------------
// 10. ENERGY SEMANTIC TOKENS — Quick access for chart colors & status mapping
//     Use these directly in your chart configs, status indicators, and alert cards
// ---------------------------------------------------------------------------------

export const EnergyColors = {
  // Sensor / metric card accent colors
  voltage:     palette.blue500,       // #0080FF — Voltage readings
  current:     palette.cyan400,       // #00E5FF — Current (Amps)
  power:       palette.gradientStart, // #0047FF — Power (Watts)
  temperature: palette.thermalOrange, // #FF6D00 — Temperature
  units:       palette.safeGreenDark, // #00C853 — kWh consumed
  bill:        palette.voltYellow,    // #FFD600 — Bill / cost

  // Chart line colors (for recharts / victory native)
  chartVoltage:     "#0080FF",
  chartCurrent:     "#00E5FF",
  chartPower:       "#7B2FFF",
  chartTemperature: "#FF6D00",
  chartUnits:       "#00E676",

  // Alert severity levels
  alertInfo:     palette.cyan500,        // Informational
  alertWarning:  palette.voltYellowDark, // Caution / high load
  alertDanger:   palette.thermalOrange,  // Overheating / overload
  alertCritical: palette.criticalRed,    // Fault / trip / disconnect

  // Sensor status dots
  statusOnline:       "#00E676",  // Bright green pulse
  statusOffline:      "#FF1744",  // Red
  statusDegraded:     "#FFD600",  // Yellow
  statusReconnecting: "#00D2FF",  // Cyan blink
};