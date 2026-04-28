import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function GlassCard({ children, style }: GlassCardProps) {
  const styles = useStyles();

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, radius, shadows } = useResponsiveTokens();

  return StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 0.5,
      borderColor: theme.border,
      ...shadows.sm,
    },
  });
}
