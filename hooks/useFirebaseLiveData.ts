import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { database } from "@/lib/firebase";
import { formatTime } from "@/utils/formatters";
import type { LiveDataPoint } from "@/types/energy";

/**
 * Hook to listen to real-time sensor data from Firebase.
 * This bypasses the API polling delay for a truly seamless experience.
 */
export function useFirebaseLiveData(deviceId: string = "energy") {
  const [data, setData] = useState<LiveDataPoint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const sensorRef = ref(database, deviceId);
    
    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val) {
          // Map Firebase data to our App's LiveDataPoint format
          const reading: LiveDataPoint = {
            time: formatTime(new Date()),
            voltage: parseFloat(val.voltage || "0"),
            current: parseFloat(val.current || "0"),
            power: parseFloat(val.power || val.power_watt || "0"),
            temperature: parseFloat(val.temp || val.temperature || "0"),
          };
          
          setData(reading);
          setIsLoading(false);
          setError(null);
        } else {
          console.warn(`[Firebase] No data found at path: ${deviceId}`);
          setIsLoading(false);
        }
      },
      (err) => {
        console.error(`[Firebase] Error fetching real-time data:`, err);
        setError(err);
        setIsLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [deviceId]);

  return { data, isLoading, isError: !!error, error };
}
