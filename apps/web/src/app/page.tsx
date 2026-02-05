"use client";

import { useState } from "react";
import ResultCard from "./components/ResultCard";
import type { Result } from "@/app/types/results";

/* =========================
   Types for API response
   ========================= */
type SearchResult = Record<string, any>;

type SearchResponse = {
  results?: SearchResult[];
};

/* =========================
   Helpers
   ========================= */
const getResultsFromResponse = (
  data: SearchResponse | SearchResult[]
): SearchResult[] => {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
};

/* =========================
   NORMALIZER (API → UI)
   ========================= */
function toResult(raw: SearchResult, index: number): Result {
  // Parse reason_codes - could be array, JSON string, or comma-separated
  let reasonCodes: string[] | undefined;
  if (raw.reason_codes) {
    if (Array.isArray(raw.reason_codes)) {
      reasonCodes = raw.reason_codes;
    } else if (typeof raw.reason_codes === 'string') {
      try {
        reasonCodes = JSON.parse(raw.reason_codes);
      } catch {
        reasonCodes = raw.reason_codes.split(',').map((s: string) => s.trim());
      }
    }
  }

  return {
    id: raw.id ?? raw.business_id ?? `${raw.name ?? "result"}-${index}`,
    name: raw.name ?? "Unknown",
    category: raw.category ?? "General",
    city: raw.city ?? "",
    rating: Number(raw.rating ?? raw.avg_rating ?? 0),
    reviews: Number(raw.reviews ?? raw.review_count ?? 0),

    imageUrl: raw.imageUrl ?? raw.image_url,
    website: raw.website,
    bookingUrl: raw.bookingUrl ?? raw.booking_url,
    phone: raw.phone,

    status: raw.status ?? "active",

    // Konect ranking
    konect_rank: raw.konect_rank != null ? Number(raw.konect_rank) : undefined,
    trust_score: raw.trust_score != null ? Number(raw.trust_score) : undefined,
    reason_codes: reasonCodes,

    // Legacy fields
    finalScore: raw.finalScore,
    score: raw.score,
    vertical: raw.vertical,
    _rank: raw._rank,
    _debug: raw._debug,
  };
}

/* =========================
   PAGE COMPONENT
   ========================= */
export default function Page() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSearch = async (nextQuery: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/search?q=${encodeURIComponent(nextQuery)}`);
      if (!response.ok) throw new Error("Search request failed");

      const data = (await response.json()) as SearchResponse | SearchResult[];
      setResults(getResultsFromResponse(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    await fetchSearch(query.trim());
  };

  /* =========================
     NORMALIZED RESULTS (KEY)
     ========================= */
  const normalizedResults: Result[] = results.map(toResult);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold">Search</h1>
        <p className="text-sm text-muted-foreground">
          Find the results you need by searching below.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="rounded-md border border-red-400 bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {normalizedResults.length === 0 && query && !isLoading && !error && (
        <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm">
          No results found.
        </div>
      )}

      {normalizedResults.length > 0 && (
        <section className="grid gap-4">
          {normalizedResults.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </section>
      )}
    </main>
  );
}
