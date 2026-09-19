// ─────────────────────────────────────────────────────────────────────────────
// Protected Fetch — Central API client with full request/response debugging
// ─────────────────────────────────────────────────────────────────────────────

let requestCounter = 0;

async function protectedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const id = ++requestCounter;
  const method = options.method || "GET";
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const shortUrl = url.replace(/https?:\/\/[^/]+/, ""); // Show only path for readability

  console.log(
    `\n🌐 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  );
  console.log(`🌐 [#${id}] REQUEST  → ${method} ${shortUrl}`);
  console.log(`🌐 [#${id}] Full URL → ${url}`);
  console.log(`🌐 [#${id}] Time     → ${timestamp}`);

  if (options.body) {
    try {
      const bodyPreview = typeof options.body === "string"
        ? JSON.parse(options.body)
        : options.body;
      console.log(`🌐 [#${id}] Body     →`, JSON.stringify(bodyPreview, null, 2));
    } catch {
      console.log(`🌐 [#${id}] Body     → (raw)`, options.body);
    }
  }

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const duration = Date.now() - startTime;
    const statusEmoji = response.ok ? "✅" : "❌";

    console.log(`${statusEmoji} [#${id}] RESPONSE ← ${response.status} ${response.statusText} (${duration}ms)`);

    if (!response.ok) {
      const errorText = await response.clone().text();
      console.log(`❌ [#${id}] ERROR BODY ↓`);
      try {
        console.log(`❌ [#${id}]`, JSON.stringify(JSON.parse(errorText), null, 2));
      } catch {
        console.log(`❌ [#${id}]`, errorText.substring(0, 500));
      }
    }

    console.log(
      `🌐 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    );

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`💥 [#${id}] NETWORK FAILURE after ${duration}ms`);
    console.log(`💥 [#${id}] Error:`, error instanceof Error ? error.message : error);
    console.log(`💥 [#${id}] This usually means:`);
    console.log(`💥 [#${id}]   • Server is not running (check XAMPP / Apache)`);
    console.log(`💥 [#${id}]   • Wrong API_URL in constants/variables.ts`);
    console.log(`💥 [#${id}]   • Network/CORS issue`);
    console.log(
      `🌐 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    );

    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error occurred. Please try again.");
  }
}

export default protectedFetch;
