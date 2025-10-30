/**
 * Advanced Search and Filtering
 * 
 * Provides powerful search capabilities for variables with
 * fuzzy matching, filters, and advanced query syntax
 */

import Fuse from 'fuse.js';

export interface SearchableVariable {
  id: string;
  key: string;
  description?: string | null;
  environment: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface SearchOptions {
  query: string;
  fuzzy?: boolean;
  environment?: string;
  dateFrom?: Date;
  dateTo?: Date;
  updatedBy?: string;
}

export interface SearchResult {
  item: SearchableVariable;
  score: number;
  matches: Array<{
    field: string;
    value: string;
    indices: ReadonlyArray<[number, number]>;
  }>;
}

/**
 * Parse advanced query syntax
 * Examples:
 *   - key:DATABASE_*
 *   - env:production
 *   - updated:>2024-01-01
 *   - user:john@example.com
 */
export function parseQuery(query: string): {
  text: string;
  filters: Map<string, string>;
} {
  const filters = new Map<string, string>();
  let text = query;

  // Extract filter patterns: field:value
  const filterPattern = /(\w+):([^\s]+)/g;
  let match;

  while ((match = filterPattern.exec(query)) !== null) {
    const [fullMatch, field, value] = match;
    filters.set(field.toLowerCase(), value);
    text = text.replace(fullMatch, '').trim();
  }

  return { text, filters };
}

/**
 * Search variables with Fuse.js
 */
export function searchVariables(
  variables: SearchableVariable[],
  options: SearchOptions
): SearchResult[] {
  const { query, fuzzy = true, environment, dateFrom, dateTo, updatedBy } = options;
  
  // Parse query for advanced syntax
  const { text, filters } = parseQuery(query);

  // Apply filters first
  let filtered = variables;

  // Environment filter
  const envFilter = filters.get('env') || filters.get('environment') || environment;
  if (envFilter) {
    filtered = filtered.filter(v =>
      v.environment.toLowerCase().includes(envFilter.toLowerCase())
    );
  }

  // Date filters
  const dateFilter = filters.get('updated');
  if (dateFilter) {
    const { operator, date } = parseDateFilter(dateFilter);
    filtered = filtered.filter(v => {
      const varDate = v.updatedAt.getTime();
      const filterDate = date.getTime();
      switch (operator) {
        case '>': return varDate > filterDate;
        case '<': return varDate < filterDate;
        case '>=': return varDate >= filterDate;
        case '<=': return varDate <= filterDate;
        case '=': return varDate === filterDate;
        default: return true;
      }
    });
  }

  if (dateFrom) {
    filtered = filtered.filter(v => v.updatedAt >= dateFrom);
  }

  if (dateTo) {
    filtered = filtered.filter(v => v.updatedAt <= dateTo);
  }

  // User filter
  const userFilter = filters.get('user') || updatedBy;
  if (userFilter) {
    filtered = filtered.filter(v =>
      v.updatedBy?.toLowerCase().includes(userFilter.toLowerCase())
    );
  }

  // Key pattern filter (supports wildcards)
  const keyFilter = filters.get('key');
  if (keyFilter) {
    const pattern = wildcardToRegex(keyFilter);
    filtered = filtered.filter(v => pattern.test(v.key));
  }

  // If no text query, return filtered results
  if (!text) {
    return filtered.map(item => ({
      item,
      score: 1,
      matches: [],
    }));
  }

  // Fuzzy search on remaining text
  if (fuzzy) {
    const fuse = new Fuse(filtered, {
      keys: ['key', 'description'],
      includeScore: true,
      includeMatches: true,
      threshold: 0.4,
      minMatchCharLength: 2,
    });

    return fuse.search(text).map(result => ({
      item: result.item,
      score: result.score || 0,
      matches: result.matches?.map(m => ({
        field: m.key || '',
        value: m.value || '',
        indices: m.indices || [],
      })) || [],
    }));
  }

  // Exact search
  const lowerText = text.toLowerCase();
  return filtered
    .filter(v =>
      v.key.toLowerCase().includes(lowerText) ||
      v.description?.toLowerCase().includes(lowerText)
    )
    .map(item => ({
      item,
      score: 0,
      matches: [],
    }));
}

/**
 * Parse date filter (e.g., ">2024-01-01", "<=2024-12-31")
 */
function parseDateFilter(filter: string): {
  operator: string;
  date: Date;
} {
  const match = filter.match(/^([><=]+)(.+)$/);
  
  if (!match) {
    return { operator: '=', date: new Date(filter) };
  }

  const [, operator, dateStr] = match;
  return {
    operator,
    date: new Date(dateStr),
  };
}

/**
 * Convert wildcard pattern to regex
 * Examples:
 *   - DATABASE_* -> /^DATABASE_.*$/
 *   - *_KEY -> /^.*_KEY$/
 *   - *SECRET* -> /^.*SECRET.*$/
 */
function wildcardToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
    .replace(/\*/g, '.*'); // Replace * with .*
  
  return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Highlight search matches in text
 */
export function highlightMatches(
  text: string,
  matches: SearchResult['matches']
): string {
  if (matches.length === 0) return text;

  const relevantMatches = matches.filter(m => m.value === text);
  if (relevantMatches.length === 0) return text;

  const indices = relevantMatches[0].indices;
  let result = '';
  let lastIndex = 0;

  indices.forEach(([start, end]) => {
    result += text.slice(lastIndex, start);
    result += `<mark>${text.slice(start, end + 1)}</mark>`;
    lastIndex = end + 1;
  });

  result += text.slice(lastIndex);
  return result;
}

/**
 * Get search suggestions based on history
 */
export function getSearchSuggestions(
  searchHistory: string[],
  currentQuery: string
): string[] {
  if (!currentQuery) {
    return searchHistory.slice(0, 5);
  }

  const lowerQuery = currentQuery.toLowerCase();
  return searchHistory
    .filter(query => query.toLowerCase().includes(lowerQuery))
    .slice(0, 5);
}

/**
 * Save search query to history
 */
export function saveSearchQuery(
  history: string[],
  query: string,
  maxSize: number = 20
): string[] {
  // Remove duplicates and add to front
  const filtered = history.filter(q => q !== query);
  const updated = [query, ...filtered];
  
  // Limit size
  return updated.slice(0, maxSize);
}
