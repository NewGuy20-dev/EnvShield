"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Filter, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
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

  const projectOptions = [
    { value: "", label: "All Projects" },
    ...(facets?.projects.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.count})`,
    })) || []),
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Search Variables"
        description="Find environment variables across all your projects"
      />

      {/* Search Bar */}
      <div className="mb-8 animate-slide-up">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              type="search"
              placeholder="Search by key or description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button
            variant="primary"
            onClick={performSearch}
            disabled={loading || !query}
            icon={loading ? <LoadingSpinner size="sm" /> : <Search className="w-4 h-4" />}
          >
            Search
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 animate-slide-up animation-delay-100">
        {/* Filters Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <Card className="p-4 sticky top-24">
            <div className="flex items-center gap-2 mb-4 font-semibold text-text-primary-light dark:text-text-primary-dark">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </div>

            {/* Project Filter */}
            {facets && facets.projects.length > 0 && (
              <div className="mb-6">
                <Select
                  label="Project"
                  value={filters.projectId}
                  onChange={(e) => handleFilterChange("projectId", e.target.value)}
                  options={projectOptions}
                />
              </div>
            )}

            {/* Decrypt Option */}
            <div className="mb-6">
              <Checkbox
                label="Show full values"
                description="Requires DEVELOPER+ permissions"
                checked={filters.decrypt}
                onChange={(e) => handleFilterChange("decrypt", e.target.checked)}
              />
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
              <LoadingSpinner size="lg" />
            </div>
          ) : results.length === 0 && query ? (
            <EmptyState
              icon={<Search className="w-12 h-12" />}
              title="No results found"
              description="Try adjusting your search terms or filters"
            />
          ) : !query ? (
            <EmptyState
              icon={<Search className="w-12 h-12" />}
              title="Start searching"
              description="Enter a search term to find variables"
            />
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
                  <Card key={result.id} className="p-4 hover-lift group">
                    <Link
                      href={`/projects/${result.project.slug}/environments/${result.environment.slug}`}
                      className="block"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Lock className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark flex-shrink-0" />
                            <code className="font-mono font-semibold text-lg text-text-primary-light dark:text-text-primary-dark group-hover:text-primary transition-colors">
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
                          <code className="font-mono text-sm text-text-secondary-light dark:text-text-secondary-dark bg-glass-light-input dark:bg-glass-dark-input px-2 py-1 rounded">
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
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
