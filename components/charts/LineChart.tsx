import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { LineChart as GiftedLineChart } from "react-native-gifted-charts";

import { useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

interface DataPoint {
  value: number;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  areaChart?: boolean;
  curved?: boolean;
  showDataPoints?: boolean;
  style?: ViewStyle;
}

export default function LineChart({
  data, color, height = 200, areaChart = true, curved = true,
  showDataPoints = true, style,
}: LineChartProps) {
  const theme = useThemeColor();
  const { spacing, radius, fontSizes } = useResponsiveTokens();
  const lineColor = color || theme.primary;

  return (
    <View style={[styles.container, style]}>
      <GiftedLineChart
        data={data}
        height={height}
        color={lineColor}
        thickness={2.5}
        curved={curved}
        areaChart={areaChart}
        startFillColor={lineColor + "40"}
        endFillColor={lineColor + "05"}
        startOpacity={0.4}
        endOpacity={0.05}
        showDataPointOnFocus
        dataPointsColor={lineColor}
        dataPointsRadius={showDataPoints ? 4 : 0}
        spacing={data.length > 0 ? 300 / Math.max(data.length - 1, 1) : 50}
        backgroundColor="transparent"
        rulesColor={theme.border}
        rulesType="dashed"
        yAxisColor="transparent"
        xAxisColor={theme.border}
        yAxisTextStyle={{ color: theme.mutedForeground, fontSize: fontSizes.xxs }}
        xAxisLabelTextStyle={{ color: theme.mutedForeground, fontSize: fontSizes.xxs }}
        hideRules={false}
        noOfSections={4}
        isAnimated
        animationDuration={800}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden" },
});
