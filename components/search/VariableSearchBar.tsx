"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface QuickResult {
  id: string;
  key: string;
  value: string;
  project: { name: string; slug: string };
  environment: { name: string; slug: string };
}

export function VariableSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/v1/search/variables?q=${encodeURIComponent(query)}&limit=5`
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleViewAll = () => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setShowDropdown(false);
  };

  const handleResultClick = (result: QuickResult) => {
    router.push(`/projects/${result.project.slug}/environments/${result.environment.slug}`);
    setShowDropdown(false);
    setQuery("");
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
        <Input
          type="search"
          placeholder="Search variables..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          onFocus={() => query.length >= 2 && results.length > 0 && setShowDropdown(true)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
        )}
        {query && !loading && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Results Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-glass-light-border dark:border-glass-dark-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-2">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-medium text-text-primary-light dark:text-text-primary-dark truncate">
                      {result.key}
                    </div>
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                      {result.project.name} • {result.environment.name}
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-mono">
                    {result.value}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-glass-light-border dark:border-glass-dark-border px-4 py-2">
            <button
              onClick={handleViewAll}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              View all results →
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {showDropdown && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-glass-light-border dark:border-glass-dark-border rounded-lg shadow-lg z-50 p-4 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
          No variables found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
