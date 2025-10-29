"use client";

import { useEffect, useState } from "react";
import { Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  user: { name: string; email: string };
  createdAt: string;
  ipAddress?: string;
}

export default function AuditLogsPage({ params }: { params: { slug: string } }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/v1/projects/${params.slug}/audit`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [params.slug]);

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${params.slug}/audit/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${Date.now()}.csv`;
        a.click();
      }
    } catch (error) {
      console.error("Failed to export logs:", error);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            Audit Logs
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Track all changes and activities in your project
          </p>
        </div>
        <Button
          variant="secondary"
          size="lg"
          icon={<Download className="w-5 h-5" />}
          onClick={handleExport}
        >
          Export
        </Button>
      </div>

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
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="p-6 hover-lift">
              <div className="flex gap-4">
                <Avatar initials={log.user.name.charAt(0)} size="md" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                        {log.user.name}
                      </h4>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {log.action} {log.entityType}
                      </p>
                    </div>
                    <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {log.ipAddress && (
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-2">
                      IP: {log.ipAddress}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
