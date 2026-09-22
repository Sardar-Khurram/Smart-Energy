// ─────────────────────────────────────────────────────────────────────────────
// Protected Fetch — Central API client
// ─────────────────────────────────────────────────────────────────────────────

async function protectedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error occurred. Please try again.");
  }
}

export default protectedFetch;
