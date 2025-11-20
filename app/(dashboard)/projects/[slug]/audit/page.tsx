"use client";

import { use, useEffect, useState } from "react";
import { Clock, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  user: { name: string; email: string };
  createdAt: string;
  ipAddress?: string;
}

export default function AuditLogsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/v1/projects/${slug}/audit`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        addToast({
          type: "error",
          title: "Failed to load audit logs",
          message: "Please try again or check your connection.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [slug, addToast]);

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${slug}/audit/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${Date.now()}.csv`;
        a.click();
        addToast({
          type: "success",
          title: "Audit logs exported",
          message: "Your audit logs have been downloaded.",
        });
      } else {
        addToast({
          type: "error",
          title: "Failed to export logs",
          message: "Please try again.",
        });
      }
    } catch (error) {
      console.error("Failed to export logs:", error);
      addToast({
        type: "error",
        title: "Failed to export logs",
        message: "Please try again.",
      });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Audit Logs"
        description="Track all changes and activities in your project"
        actions={
          <Button
            variant="secondary"
            size="lg"
            icon={<Download className="w-5 h-5" />}
            onClick={handleExport}
          >
            Export
          </Button>
        }
      />

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : logs.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="w-12 h-12 text-text-muted-light dark:text-text-muted-dark mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            No audit logs yet
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log, idx) => (
            <Card
              key={log.id}
              className="p-6 hover-lift transition-all duration-200 border-l-4 border-l-primary/50"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Avatar initials={log.user.name.charAt(0)} size="md" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                        {log.user.name}
                      </h4>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        <span className="font-mono">{log.action}</span>
                        {" on "}
                        <span className="font-mono">{log.entityType}</span>
                      </p>
                    </div>
                    <span className="text-sm text-text-muted-light dark:text-text-muted-dark flex-shrink-0 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-glass-light-border dark:border-glass-dark-border space-y-1">
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                      <span className="font-medium">Email:</span> {log.user.email}
                    </p>
                    {log.ipAddress && (
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        <span className="font-medium">IP:</span> {log.ipAddress}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
