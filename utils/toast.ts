import { Toast } from "@/components/Toast";

// ─────────────────────────────────────────────────────────────────────────────
// Toast Helper Utilities
// ─────────────────────────────────────────────────────────────────────────────

export const showSuccess = (message: string, duration?: number) =>
  Toast.success(message, duration);

export const showError = (message: string, duration?: number) =>
  Toast.error(message, duration);

export const showInfo = (message: string, duration?: number) =>
  Toast.info(message, duration);

export const showSubtle = (message: string, duration?: number) =>
  Toast.subtle(message, duration);
