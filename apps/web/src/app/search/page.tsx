"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Globe,
  Phone,
  MapPin,
  Tag,
  ArrowLeft,
  AlertCircle,
  Star,
  ShieldCheck,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type RawResult = Record<string, unknown>;

interface Result {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  reviews: number;
  website?: string;
  phone?: string;
  konect_rank?: number;
  trust_score?: number;
  reason_codes?: string[];
}

interface ApiResponse {
  results?: RawResult[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Normalise raw API shape → typed Result
// ---------------------------------------------------------------------------
function toResult(raw: RawResult, i: number): Result {
  let reason_codes: string[] | undefined;
  if (raw.reason_codes) {
    if (Array.isArray(raw.reason_codes)) {
      reason_codes = (raw.reason_codes as unknown[]).map(String);
    } else if (typeof raw.reason_codes === "string") {
      try {
        const parsed = JSON.parse(raw.reason_codes);
        reason_codes = Array.isArray(parsed)
          ? parsed.map(String)
          : [raw.reason_codes];
      } catch {
        reason_codes = raw.reason_codes.split(",").map((s) => s.trim());
      }
    }
  }

  return {
    id: String(raw.id ?? raw.business_id ?? `${raw.name ?? "r"}-${i}`),
    name: String(raw.name ?? "Unknown"),
    category: String(raw.category ?? "General"),
    city: String(raw.city ?? ""),
    rating: Number(raw.rating ?? raw.avg_rating ?? 0),
    reviews: Number(raw.reviews ?? raw.review_count ?? 0),
    website: raw.website ? String(raw.website) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    konect_rank:
      raw.konect_rank != null ? Number(raw.konect_rank) : undefined,
    trust_score:
      raw.trust_score != null ? Number(raw.trust_score) : undefined,
    reason_codes,
  };
}

// Pretty-print snake_case reason codes → "High Rating"
function fmtCode(code: string) {
  return code
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2.5">
          <div className="h-5 w-2/3 rounded-lg bg-gray-100" />
          <div className="h-3.5 w-1/3 rounded-lg bg-gray-100" />
          <div className="flex gap-2 pt-1">
            <div className="h-6 w-20 rounded-full bg-gray-100" />
            <div className="h-6 w-24 rounded-full bg-gray-100" />
            <div className="h-6 w-16 rounded-full bg-gray-100" />
          </div>
        </div>
        <div className="h-12 w-12 rounded-xl bg-gray-100" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-24 rounded-xl bg-gray-100" />
        <div className="h-8 w-20 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700">No results found</p>
        <p className="mt-1 text-sm text-gray-400">
          Nothing matched{query ? ` "${query}"` : ""}. Try a different search.
        </p>
      </div>
    </motion.div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 py-12 text-center"
    >
      <AlertCircle className="h-8 w-8 text-red-400" />
      <div>
        <p className="text-sm font-medium text-red-700">Search failed</p>
        <p className="mt-0.5 text-xs text-red-500">{message}</p>
      </div>
    </motion.div>
  );
}

function RankBadge({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400">
        Rank
      </span>
      <span className="text-lg font-bold leading-none text-indigo-600">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function TrustBadge({ value }: { value: number }) {
  const pct = Math.min(100, Math.round(value * 10));
  const color =
    pct >= 80
      ? "text-emerald-600 bg-emerald-50 border-emerald-100"
      : pct >= 60
        ? "text-amber-600 bg-amber-50 border-amber-100"
        : "text-gray-500 bg-gray-50 border-gray-100";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        color
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      Trust {value.toFixed(1)}
    </span>
  );
}

function ReasonChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-xs text-gray-500">
      <Tag className="h-2.5 w-2.5 text-gray-400" />
      {fmtCode(label)}
    </span>
  );
}

function ResultCard({ result, index }: { result: Result; index: number }) {
  const {
    name,
    category,
    city,
    rating,
    reviews,
    website,
    phone,
    konect_rank,
    trust_score,
    reason_codes,
  } = result;

  const chips = reason_codes?.slice(0, 5) ?? [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.07)" }}
      className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Name */}
          <h2 className="truncate text-base font-semibold text-gray-900">
            {name}
          </h2>

          {/* Meta */}
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span className="font-medium text-gray-500">{category}</span>
            {city && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {city}
                </span>
              </>
            )}
            {rating > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {rating.toFixed(1)}
                  {reviews > 0 && (
                    <span className="text-gray-400">({reviews})</span>
                  )}
                </span>
              </>
            )}
          </div>

          {/* Trust + reason chips */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {trust_score !== undefined && (
              <TrustBadge value={trust_score} />
            )}
            {chips.map((code) => (
              <ReasonChip key={code} label={code} />
            ))}
          </div>
        </div>

        {/* Rank badge */}
        {konect_rank !== undefined && <RankBadge value={konect_rank} />}
      </div>

      {/* Action buttons */}
      {(website || phone) && (
        <div className="mt-4 flex gap-2">
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <Globe className="h-3.5 w-3.5" />
              Website
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          )}
        </div>
      )}
    </motion.article>
  );
}

// ---------------------------------------------------------------------------
// Core search UI — uses useSearchParams so must be inside <Suspense>
// ---------------------------------------------------------------------------
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(initialQ);
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ---------- fetch ----------
  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}&limit=20`,
        { signal: ctrl.signal }
      );
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as ApiResponse | RawResult[];
      const raw = Array.isArray(data) ? data : (data.results ?? []);
      setResults(raw.map(toResult));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fire on mount if URL has ?q=
  useEffect(() => {
    if (initialQ) doSearch(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setInputValue("");
        inputRef.current?.focus();
      }
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------- handlers ----------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q) return;
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
    });
    doSearch(q);
  };

  const handleClear = () => {
    setInputValue("");
    setResults([]);
    setHasSearched(false);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky search header */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          {/* Back to home */}
          <button
            onClick={() => router.push("/")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 gap-2">
            <div className="group relative flex flex-1 items-center overflow-hidden rounded-xl border border-gray-200 bg-white transition-all focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
              <Search className="ml-3 h-4 w-4 shrink-0 text-gray-400 transition-colors group-focus-within:text-indigo-400" />
              <input
                ref={inputRef}
                type="search"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search businesses…"
                className="min-w-0 flex-1 bg-transparent py-2.5 pl-2.5 pr-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                autoFocus
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="shrink-0 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? "…" : "Search"}
            </button>
          </form>
        </div>

        {/* Keyboard hint strip */}
        <div className="border-t border-gray-50 px-4 py-1.5">
          <p className="text-center text-[11px] text-gray-400">
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-mono text-[10px]">
              /
            </kbd>{" "}
            focus ·{" "}
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-mono text-[10px]">
              Esc
            </kbd>{" "}
            clear ·{" "}
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 font-mono text-[10px]">
              Enter
            </kbd>{" "}
            search
          </p>
        </div>
      </header>

      {/* Results area */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Result count */}
        {!isLoading && hasSearched && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 text-sm text-gray-400"
          >
            {results.length > 0
              ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${initialQ || inputValue}"`
              : null}
          </motion.p>
        )}

        {/* Skeletons */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && error && <ErrorState message={error} />}

        {/* Empty state */}
        {!isLoading && !error && hasSearched && results.length === 0 && (
          <EmptyState query={initialQ || inputValue} />
        )}

        {/* Results */}
        {!isLoading && !error && results.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={initialQ}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {results.map((r, i) => (
                <ResultCard key={r.id} result={r} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pre-search hint */}
        {!isLoading && !hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-16 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
              <Search className="h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-sm text-gray-500">
              Type a search above to discover top-ranked businesses.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton for Suspense fallback while searchParams resolves
// ---------------------------------------------------------------------------
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-9 flex-1 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-9 w-20 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-6">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export — Suspense wraps the hook consumer
// ---------------------------------------------------------------------------
export default function SearchPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}
