import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BarChart as GiftedBarChart } from "react-native-gifted-charts";

import { useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

interface DataPoint {
  value: number;
  label?: string;
  frontColor?: string;
}

interface BarChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  barWidth?: number;
  style?: ViewStyle;
}

export default function BarChart({
  data, color, height = 200, barWidth = 28, style,
}: BarChartProps) {
  const theme = useThemeColor();
  const { fontSizes, radius } = useResponsiveTokens();
  const barColor = color || theme.primary;

  const chartData = data.map((d) => ({
    ...d,
    frontColor: d.frontColor || barColor,
    topLabelComponent: undefined,
  }));

  return (
    <View style={[styles.container, style]}>
      <GiftedBarChart
        data={chartData}
        height={height}
        barWidth={barWidth}
        barBorderRadius={radius.xs}
        spacing={16}
        noOfSections={4}
        backgroundColor="transparent"
        rulesColor={theme.border}
        rulesType="dashed"
        yAxisColor="transparent"
        xAxisColor={theme.border}
        yAxisTextStyle={{ color: theme.mutedForeground, fontSize: fontSizes.xxs }}
        xAxisLabelTextStyle={{ color: theme.mutedForeground, fontSize: fontSizes.xxs }}
        isAnimated
        animationDuration={600}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden" },
});
