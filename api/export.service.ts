import { API_URL } from "@/constants/variables";
import { Directory, File, Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export type ExportType = "consumption" | "billing" | "alerts";
export type ExportFormat = "csv" | "pdf";
export type ExportAction = "share" | "save";

export async function exportReport(
  deviceId: string,
  type: ExportType,
  format: ExportFormat,
  action: ExportAction = "share",
  startDate?: string,
  endDate?: string
) {
  try {
    const filename = `smart_energy_${type}_report_${new Date().getTime()}.${format}`;
    
    const isAndroidSave = action === 'save' && Platform.OS === 'android';
    let userSelectedDirectoryUri: string | null = null;

    if (isAndroidSave) {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        return;
      }
      userSelectedDirectoryUri = permissions.directoryUri;
    }

    // Always download to cache first to avoid content:// URI issues on Android
    const tempFile = new File(Paths.cache, filename);
    
    // Construct URL with query parameters
    let url = `${API_URL}/devices/${deviceId}/export?type=${type}&format=${format}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;

    // Download the file using Expo FileSystem (SDK 55 API)
    const downloadedFile = await File.downloadFileAsync(url, tempFile);

    // If it was an Android direct save, move it to the selected directory
    if (isAndroidSave && userSelectedDirectoryUri) {
      try {
        const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv';
        const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(
          userSelectedDirectoryUri,
          filename,
          mimeType
        );
        
        const base64 = await downloadedFile.base64();
        await FileSystem.writeAsStringAsync(createdUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        await downloadedFile.delete();
        return;
      } catch (moveError) {
        console.error("[exportReport] Failed to move file to selected directory:", moveError);
        // Important: Stop execution here instead of falling back to share if that's what user prefers
        throw moveError;
      }
    }

    // Otherwise (Share or iOS Save), use the Share sheet
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(downloadedFile.uri, {
        mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv',
        dialogTitle: action === 'save' ? `Save ${type.charAt(0).toUpperCase() + type.slice(1)} Report` : `Share ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        UTI: format === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text' // iOS
      });
    } else {
      throw new Error("Sharing is not available on this device.");
    }
  } catch (error) {
    console.error("[exportReport] Error:", error);
    throw error;
  }
}
