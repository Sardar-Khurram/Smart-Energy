const API_URL = process.env.EXPO_PUBLIC_API_URL;
const IMG_URL = process.env.EXPO_PUBLIC_IMG_URL;
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;

if (!API_URL) throw new Error("API_URL is missing");
if (!IMG_URL) throw new Error("IMG_URL is missing");
if (!GEMINI_KEY) throw new Error("GEMINI_KEY is missing");

export { API_URL, GEMINI_KEY, IMG_URL };

