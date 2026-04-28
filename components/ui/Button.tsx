import { palette, Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title, variant = "primary", size = "md", loading = false, loadingText,
  leftIcon, rightIcon, style, textStyle, fullWidth = false, disabled, ...pressableProps
}: ButtonProps) {
  const theme = useThemeColor();
  const styles = useStyles({ variant, size, fullWidth, disabled: disabled || loading });
  const displayText = loading && loadingText ? loadingText : title;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style,
        variant === "primary" && { backgroundColor: "transparent", overflow: "hidden" as const },
      ]}
      disabled={isDisabled} {...pressableProps}
    >
      {variant === "primary" && !isDisabled && (
        <LinearGradient colors={[palette.gradientStart, palette.gradientEnd]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      )}
      {variant === "primary" && isDisabled && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.muted }]} />
      )}
      {loading && <ActivityIndicator size="small" color={variant === "primary" ? "#FFF" : styles.text.color} style={styles.spinner} />}
      {leftIcon && !loading && <>{leftIcon}</>}
      <Text maxFontSizeMultiplier={1} style={[styles.text, textStyle]}>{displayText}</Text>
      {rightIcon && !loading && <>{rightIcon}</>}
    </Pressable>
  );
}

interface StyleProps { variant: string; size: string; fullWidth: boolean; disabled: boolean }

function useStyles({ variant, size, fullWidth, disabled }: StyleProps) {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius, layout } = useResponsiveTokens();

  const colors = disabled
    ? { background: theme.muted, text: theme.mutedForeground, border: theme.border }
    : variant === "primary" ? { background: theme.primary, text: theme.primaryForeground, border: theme.primary }
    : variant === "secondary" ? { background: theme.accent, text: theme.accentForeground, border: theme.accent }
    : variant === "outline" ? { background: "transparent", text: theme.foreground, border: theme.border }
    : variant === "destructive" ? { background: theme.destructive, text: theme.destructiveForeground, border: theme.destructive }
    : { background: "transparent", text: theme.foreground, border: "transparent" };

  const dims = size === "sm"
    ? { px: spacing.md, py: spacing.sm, fs: fontSizes.sm, h: layout.buttonHeight - 8, gap: spacing.xs }
    : size === "lg"
    ? { px: spacing.xl, py: spacing.md + spacing.xs, fs: fontSizes.lg, h: layout.buttonHeight + 8, gap: spacing.sm }
    : { px: spacing.lg, py: spacing.md, fs: fontSizes.base, h: layout.buttonHeight, gap: spacing.sm };

  return StyleSheet.create({
    button: {
      backgroundColor: colors.background, borderWidth: variant === "outline" ? 1 : 0,
      borderColor: colors.border, borderRadius: radius.full,
      paddingHorizontal: dims.px, paddingVertical: dims.py, minHeight: dims.h,
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: dims.gap, alignSelf: fullWidth ? "stretch" : "auto", opacity: disabled ? 0.6 : 1,
    },
    pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    text: { color: colors.text, fontFamily: Typography.fontFamily, fontSize: dims.fs, fontWeight: Typography.fontWeights.semibold, textAlign: "center" } as TextStyle,
    spinner: { marginRight: -spacing.xs },
  });
}

export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) { return <Button variant="primary" {...props} />; }
export function OutlineButton(props: Omit<ButtonProps, 'variant'>) { return <Button variant="outline" {...props} />; }
export function GhostButton(props: Omit<ButtonProps, 'variant'>) { return <Button variant="ghost" {...props} />; }
