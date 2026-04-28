import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Href, router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { palette, Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  gradient: [string, string];
  route: Href;
}

interface QuickActionsProps {
  actions: QuickActionItem[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id} style={styles.card}
          activeOpacity={0.85} onPress={() => router.navigate(action.route)}
        >
          <LinearGradient
            colors={action.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name={action.icon} size={26} color={palette.white} />
            </View>
            <Text style={styles.title}>{action.title}</Text>
            <Text style={styles.subtitle}>{action.subtitle}</Text>
            <View style={styles.arrow}>
              <MaterialCommunityIcons name="arrow-right" size={18} color={palette.white + "80"} />
            </View>
            <MaterialCommunityIcons
              name={action.icon} size={90} color={palette.white}
              style={styles.decorIcon}
            />
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius, shadows } = useResponsiveTokens();

  return StyleSheet.create({
    container: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    card: { width: "48%", borderRadius: radius.xl, overflow: "hidden", ...shadows.md },
    gradient: { padding: spacing.md, minHeight: 140, position: "relative", overflow: "hidden" },
    iconWrapper: {
      width: 44, height: 44, borderRadius: radius.lg,
      backgroundColor: palette.white + "20", alignItems: "center",
      justifyContent: "center", marginBottom: spacing.sm,
    },
    title: {
      fontSize: fontSizes.base, fontWeight: Typography.fontWeights.bold,
      color: palette.white, fontFamily: Typography.fontFamily,
    },
    subtitle: {
      fontSize: fontSizes.xs, color: palette.white + "88",
      fontFamily: Typography.fontFamily, marginTop: spacing.xxs,
    },
    arrow: {
      position: "absolute", bottom: spacing.md, right: spacing.md,
      width: 30, height: 30, borderRadius: radius.full,
      backgroundColor: palette.white + "20", alignItems: "center", justifyContent: "center",
    },
    decorIcon: { position: "absolute", right: -18, bottom: -18, opacity: 0.1 },
  });
}
