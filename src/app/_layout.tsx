import { ToastProvider } from "@/components/Toast";
import QueryClientProvider from "@/lib/QueryClientProvider";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

export default function RootLayout() {
  return (
    <QueryClientProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ToastProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
