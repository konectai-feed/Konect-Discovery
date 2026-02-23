import { NextResponse } from "next/server";

const API_BASE =
  process.env.KONECT_API_BASE_URL || "https://konect-discovery.onrender.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const limit = searchParams.get("limit") || "20";
  const offset = searchParams.get("offset") || "0";

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  params.set("limit", limit);
  params.set("offset", offset);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const apiRes = await fetch(`${API_BASE}/search?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Pass the backend error body through so the client can see reason + requestId
    if (!apiRes.ok) {
      let errorBody: unknown;
      try {
        errorBody = await apiRes.json();
      } catch {
        errorBody = { error: "Search service unavailable" };
      }
      return NextResponse.json(errorBody, { status: apiRes.status });
    }

    const data = await apiRes.json();
    return NextResponse.json(data);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[search proxy] Error:", error);

    const isTimeout = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        error: "Search service unavailable",
        reason: isTimeout
          ? "Backend request timed out after 10s"
          : "Could not reach backend",
      },
      { status: 503 }
    );
  }
}
