import React, { useState } from "react";
import { Dimensions, StyleSheet, View, ViewStyle } from "react-native";
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
  spacing?: number;
  initialSpacing?: number;
  style?: ViewStyle;
}

export default function BarChart({
  data,
  color,
  height = 200,
  barWidth,
  spacing,
  initialSpacing,
  style,
}: BarChartProps) {
  const theme = useThemeColor();
  const { fontSizes, radius } = useResponsiveTokens();
  const barColor = color || theme.primary;

  // Initial estimate based on window width minus screen & card margins
  const windowWidth = Dimensions.get("window").width;
  const [layoutWidth, setLayoutWidth] = useState<number>(windowWidth - 64);

  const count = data.length;
  // Reserve space for Y-axis labels and padding (~45px)
  const availablePlotWidth = Math.max(layoutWidth - 45, 240);

  // 4 items (Weeks): Expand bars and space them out to occupy 100% of the card width
  // 7 items (Days): Standard balanced width
  // 12 items (Months): Compact bars so all 12 fit without horizontal cutoff
  let calculatedBarWidth = barWidth;
  let calculatedSpacing = spacing;
  let calculatedInitialSpacing = initialSpacing;

  if (calculatedBarWidth === undefined) {
    if (count <= 4) {
      // 4 weeks: nice wide bars
      calculatedBarWidth = 50;
    } else if (count <= 7) {
      calculatedBarWidth = 24;
    } else {
      // 12 months: compact
      calculatedBarWidth = 12;
    }
  }

  if (calculatedInitialSpacing === undefined) {
    if (count <= 4) {
      calculatedInitialSpacing = 16;
    } else if (count <= 7) {
      calculatedInitialSpacing = 10;
    } else {
      calculatedInitialSpacing = 6;
    }
  }

  if (calculatedSpacing === undefined) {
    if (count <= 4) {
      // Distribute evenly across full width: (available - (4 * barWidth) - initialSpacing - endSpacing) / 3
      const totalBarsWidth = count * calculatedBarWidth;
      const remainingSpace = availablePlotWidth - totalBarsWidth - calculatedInitialSpacing - 12;
      calculatedSpacing = Math.max(18, Math.floor(remainingSpace / Math.max(count - 1, 1)));
    } else if (count <= 7) {
      const totalBarsWidth = count * calculatedBarWidth;
      const remainingSpace = availablePlotWidth - totalBarsWidth - calculatedInitialSpacing - 8;
      calculatedSpacing = Math.max(12, Math.floor(remainingSpace / Math.max(count - 1, 1)));
    } else {
      const totalBarsWidth = count * calculatedBarWidth;
      const remainingSpace = availablePlotWidth - totalBarsWidth - calculatedInitialSpacing - 4;
      calculatedSpacing = Math.max(6, Math.floor(remainingSpace / Math.max(count - 1, 1)));
    }
  }

  // Calculate highest value to prevent 0-value chart scaling issues
  const maxVal = Math.max(...data.map((d) => d.value || 0), 0);
  const chartMaxValue = maxVal > 0 ? maxVal * 1.25 : 10;

  const chartData = data.map((d) => ({
    ...d,
    frontColor: d.frontColor || barColor,
    topLabelComponent: undefined,
  }));

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - layoutWidth) > 5) {
          setLayoutWidth(w);
        }
      }}
    >
      <GiftedBarChart
        data={chartData}
        height={height}
        width={layoutWidth - 10}
        barWidth={calculatedBarWidth}
        barBorderRadius={radius.xs}
        spacing={calculatedSpacing}
        initialSpacing={calculatedInitialSpacing}
        maxValue={chartMaxValue}
        noOfSections={4}
        backgroundColor="transparent"
        rulesColor={theme.border}
        rulesType="dashed"
        yAxisColor="transparent"
        xAxisColor={theme.border}
        yAxisLabelWidth={35}
        yAxisTextStyle={{ color: theme.mutedForeground, fontSize: fontSizes.xxs }}
        xAxisLabelTextStyle={{
          color: theme.mutedForeground,
          fontSize: count > 8 ? 8 : count <= 4 ? 10 : fontSizes.xxs,
          fontWeight: count <= 4 ? "600" : "normal",
        }}
        disableScroll
        isAnimated
        animationDuration={500}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", overflow: "hidden" },
});
