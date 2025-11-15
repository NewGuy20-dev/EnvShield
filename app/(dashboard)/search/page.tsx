"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Filter, Download, Lock, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import Link from "next/link";

interface SearchResult {
  id: string;
  key: string;
  value: string;
  description?: string;
  environment: { id: string; name: string; slug: string };
  project: { id: string; name: string; slug: string };
  updatedAt: string;
  canDecrypt: boolean;
}

interface Facet {
  projects: Array<{ id: string; name: string; count: number }>;
  environments: Array<{ id: string; name: string; count: number }>;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [facets, setFacets] = useState<Facet | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    projectId: "",
    environmentId: "",
    decrypt: false,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const performSearch = async () => {
    if (!query) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.projectId) params.append("projectId", filters.projectId);
      if (filters.environmentId) params.append("environmentId", filters.environmentId);
      if (filters.decrypt) params.append("decrypt", "true");

      const response = await fetch(`/api/v1/search/variables?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setFacets(data.facets || null);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters, pagination.page]);

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
          Search Variables
        </h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          Find environment variables across all your projects
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
            <Input
              type="search"
              placeholder="Search by key or description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="primary"
            onClick={performSearch}
            disabled={loading || !query}
            icon={loading ? <LoadingSpinner /> : <Search className="w-4 h-4" />}
          >
            Search
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Filters Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4 font-semibold text-text-primary-light dark:text-text-primary-dark">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </div>

            {/* Project Filter */}
            {facets && facets.projects.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Project</label>
                <select
                  value={filters.projectId}
                  onChange={(e) => handleFilterChange("projectId", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input bg-glass-light-input dark:bg-glass-dark-input border border-glass-light-border dark:border-glass-dark-border"
                >
                  <option value="">All Projects</option>
                  {facets.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Decrypt Option */}
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.decrypt}
                  onChange={(e) => handleFilterChange("decrypt", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show full values</span>
              </label>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                Requires DEVELOPER+ permissions
              </p>
            </div>

            {/* Clear Filters */}
            {(filters.projectId || filters.environmentId || filters.decrypt) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({ projectId: "", environmentId: "", decrypt: false });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            )}
          </Card>
        </div>

        {/* Results */}
        <div className="col-span-12 md:col-span-9">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : results.length === 0 && query ? (
            <Card className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-text-muted-light dark:text-text-muted-dark" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Try adjusting your search terms or filters
              </p>
            </Card>
          ) : !query ? (
            <Card className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-text-muted-light dark:text-text-muted-dark" />
              <h3 className="text-xl font-semibold mb-2">Start searching</h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Enter a search term to find variables
              </p>
            </Card>
          ) : (
            <>
              {/* Results Header */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Found {pagination.total} result{pagination.total !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Results List */}
              <div className="space-y-4">
                {results.map((result) => (
                  <Card key={result.id} className="p-4 hover:shadow-lg transition-shadow">
                    <Link
                      href={`/projects/${result.project.slug}/environments/${result.environment.slug}`}
                      className="block"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Lock className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark flex-shrink-0" />
                            <code className="font-mono font-semibold text-lg text-text-primary-light dark:text-text-primary-dark">
                              {result.key}
                            </code>
                          </div>
                          {result.description && (
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
                              {result.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-text-muted-light dark:text-text-muted-dark">
                            <span className="font-medium">{result.project.name}</span>
                            <span>•</span>
                            <span>{result.environment.name}</span>
                            <span>•</span>
                            <span>{new Date(result.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <code className="font-mono text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            {result.value}
                          </code>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
