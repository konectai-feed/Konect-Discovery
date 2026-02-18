"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ArrowRight, Sparkles } from "lucide-react";

const DEMO_CATEGORIES = [
  "Restaurants",
  "Fitness",
  "Spas",
  "Dentists",
  "Plumbers",
  "Lawyers",
];

export default function LandingPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  // Press "/" anywhere to focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [router]
  );

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4">
      {/* Soft background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-48 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #e0e7ff 0%, #f0f4ff 50%, transparent 80%)",
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #fae8ff 0%, #f5f3ff 50%, transparent 80%)",
          }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-xs font-medium text-indigo-600"
        >
          <Sparkles className="h-3 w-3" />
          AI-powered local discovery
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.07, ease: "easeOut" }}
          className="text-center text-5xl font-semibold tracking-tight text-gray-900 sm:text-6xl"
        >
          Find the best.
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
            }}
          >
            Ranked for you.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="max-w-md text-center text-base leading-relaxed text-gray-500 sm:text-lg"
        >
          Konect Discovery surfaces top local businesses by trust, quality, and
          real community signals — not ad spend.
        </motion.p>

        {/* Search box */}
        <motion.form
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.28, ease: "easeOut" }}
          className="w-full"
          onSubmit={(e) => {
            e.preventDefault();
            go(query);
          }}
        >
          <div className="group relative flex items-center overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-100/80 transition-all focus-within:border-indigo-300 focus-within:shadow-indigo-100/60 focus-within:ring-3 focus-within:ring-indigo-200/50">
            <Search className="ml-4 h-[18px] w-[18px] shrink-0 text-gray-400 transition-colors group-focus-within:text-indigo-400" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "best sushi in Toronto" …'
              className="min-w-0 flex-1 bg-transparent py-[15px] pl-3 pr-3 text-base text-gray-900 outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="m-2 flex shrink-0 items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Search
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2.5 text-center text-xs text-gray-400">
            Press{" "}
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-500">
              /
            </kbd>{" "}
            to focus · Enter to search
          </p>
        </motion.form>

        {/* Quick-access category pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.42 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {DEMO_CATEGORIES.map((cat, i) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 + i * 0.04 }}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => go(cat)}
              className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-600 shadow-xs transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Footer hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 text-xs text-gray-400"
      >
        Powered by Konect AI &mdash; real signals, no sponsored results
      </motion.p>
    </main>
  );
}
