'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Clock, User, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { logger } from '@/lib/logger';

interface HistoryEntry {
  id: string;
  key: string;
  newValue: string;
  masked: boolean;
  decryptionError?: string | null;
  changedBy: string;
  changedByEmail: string;
  createdAt: string;
}

interface VariableHistoryModalProps {
  variableId: string;
  variableKey: string;
  projectSlug: string;
  environmentSlug: string;
  onClose: () => void;
  onRollback?: (historyId: string) => void;
}

export function VariableHistoryModal({
  variableId,
  variableKey,
  projectSlug,
  environmentSlug,
  onClose,
  onRollback,
}: VariableHistoryModalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [rollbackConfirm, setRollbackConfirm] = useState<string | null>(null);
  const [canReveal, setCanReveal] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);

  const fetchHistory = useCallback(async (reveal: boolean) => {
    try {
      setLoading(true);
      const url = new URL(
        `/api/v1/projects/${projectSlug}/environments/${environmentSlug}/variables/${variableId}/history`,
        window.location.origin
      );

      if (reveal) {
        url.searchParams.set('reveal', 'true');
      }

      const res = await fetch(url.toString());
      
      if (!res.ok) throw new Error('Failed to fetch history');
      
      const data = await res.json();
      setHistory(data.history || []);
      setCanReveal(Boolean(data.canReveal));
      setRevealed(Boolean(data.reveal));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch variable history');
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  }, [projectSlug, environmentSlug, variableId]);

  useEffect(() => {
    fetchHistory(false);
  }, [fetchHistory]);

  async function handleRevealToggle() {
    if (!canReveal) return;

    try {
      if (!revealed) {
        const confirmReveal = window.confirm(
          'Reveal decrypted history values? Make sure no unauthorized viewers can see your screen.'
        );

        if (!confirmReveal) {
          return;
        }
      }

      setRevealLoading(true);
      await fetchHistory(!revealed);
    } catch (error) {
      console.error('Failed to toggle reveal:', error);
    } finally {
      setRevealLoading(false);
    }
  }

  async function handleRollback(historyId: string) {
    if (!onRollback) return;
    
    try {
      await onRollback(historyId);
      setRollbackConfirm(null);
      onClose();
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderValue(entry: HistoryEntry) {
    if (entry.decryptionError) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
          <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            Decryption Error
          </div>
          <div className="text-sm text-red-700 dark:text-red-300 font-mono">
            {entry.decryptionError}
          </div>
        </div>
      );
    }

    if (entry.masked) {
      return (
        <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded p-3">
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
            Value Hidden
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 font-mono">
            {entry.newValue}
          </div>
          {canReveal && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Use the reveal toggle to view decrypted values if you have permission.
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
        <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
          Decrypted Value
        </div>
        <div className="text-sm text-green-700 dark:text-green-300 font-mono break-words">
          {entry.newValue}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Variable History
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {variableKey}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {canReveal && (
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={handleRevealToggle}
                disabled={revealLoading}
                className="px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {revealLoading
                  ? 'Loading...'
                  : revealed
                  ? 'Hide decrypted values'
                  : 'Reveal decrypted values'}
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No history available for this variable
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Entry Header */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{entry.changedByEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(entry.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onRollback && index > 0 && (
                        <button
                          onClick={() => setRollbackConfirm(entry.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Rollback
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setExpandedEntry(expandedEntry === entry.id ? null : entry.id)
                        }
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {expandedEntry === entry.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedEntry === entry.id && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      {renderValue(entry)}
                    </div>
                  )}

                  {/* Rollback Confirmation */}
                  {rollbackConfirm === entry.id && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        Are you sure you want to rollback to this version? This will create a
                        new entry with the old value.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRollback(entry.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                        >
                          Confirm Rollback
                        </button>
                        <button
                          onClick={() => setRollbackConfirm(null)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
