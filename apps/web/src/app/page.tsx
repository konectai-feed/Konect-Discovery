"use client";

import { useState } from "react";

import ResultCard from "@/components/ResultCard";

type SearchResult = Record<string, unknown>;

type SearchResponse = {
  results?: SearchResult[];
};

const getResultsFromResponse = (data: SearchResponse | SearchResult[]): SearchResult[] => {
  if (Array.isArray(data)) {
    return data;
  }

  return data.results ?? [];
};

const getResultKey = (result: SearchResult, index: number) => {
  const id = result.id ?? result.name;

  if (typeof id === "string" || typeof id === "number") {
    return id;
  }

  return index;
};

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

      if (!response.ok) {
        throw new Error("Search request failed.");
      }

      const data = (await response.json()) as SearchResponse | SearchResult[];
      setResults(getResultsFromResponse(data));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch results.";
      setError(message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setError(null);
      return;
    }

    await fetchSearch(trimmedQuery);
  };

  const shouldShowEmptyState =
    !isLoading && !error && query.trim().length > 0 && results.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Search</h1>
        <p className="text-sm text-muted-foreground">
          Find the results you need by searching below.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => query.trim() && fetchSearch(query)}
          placeholder="Search..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          disabled={isLoading}
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {shouldShowEmptyState ? (
        <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No results found. Try a different query.
        </div>
      ) : null}

      {results.length > 0 ? (
        <section className="grid gap-4">
          {results.map((result, index) => (
            <ResultCard key={getResultKey(result, index)} result={result} />
          ))}
        </section>
      ) : null}
    </main>
  );
}
