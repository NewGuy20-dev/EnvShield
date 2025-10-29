"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderOpen, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    projects: 0,
    variables: 0,
    activity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/v1/projects");
        if (response.ok) {
          const data = await response.json();
          setStats({
            projects: data.projects?.length || 0,
            variables: data.projects?.reduce((sum: number, p: any) => sum + (p.variablesCount || 0), 0) || 0,
            activity: data.recentActivity?.length || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="mb-10 animate-fade-in">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3 tracking-tight">
              Welcome to EnvShield
            </h1>
            <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark">
              Manage your secrets securely across all environments
            </p>
          </div>
          <Link href="/projects">
            <Button variant="primary" size="lg" icon={<Plus className="w-5 h-5" />}>
              Create New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-slide-up">
          <Card className="p-8 relative overflow-hidden group hover-lift">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FolderOpen className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Total</span>
              </div>
              <p className="text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2 tracking-tight">
                {stats.projects}
              </p>
              <h3 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">Projects</h3>
            </div>
          </Card>

          <Card className="p-8 relative overflow-hidden group hover-lift">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                  <Zap className="w-6 h-6 text-secondary" />
                </div>
                <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Encrypted</span>
              </div>
              <p className="text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2 tracking-tight">
                {stats.variables}
              </p>
              <h3 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">Variables</h3>
            </div>
          </Card>

          <Card className="p-8 relative overflow-hidden group hover-lift">
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-success/5 to-transparent" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-2xl group-hover:bg-success/10 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-success/10 group-hover:bg-success/20 transition-colors">
                  <Activity className="w-6 h-6 text-success" />
                </div>
                <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Last 24h</span>
              </div>
              <p className="text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2 tracking-tight">
                {stats.activity}
              </p>
              <h3 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">Activities</h3>
            </div>
          </Card>
        </div>
      )}

      {/* Get Started */}
      <Card className="p-10 lg:p-12 relative overflow-hidden group animate-slide-up animation-delay-100">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
        <div className="relative">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3 tracking-tight">
                Get started with EnvShield
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6 max-w-2xl text-lg leading-relaxed">
                Securely manage environment variables across your organization. With end-to-end encryption, team collaboration, and comprehensive audit logs.
              </p>
            </div>
          </div>
          <div className="flex gap-4 flex-wrap">
            <Link href="/projects">
              <Button variant="primary" size="lg" icon={<Plus className="w-4 h-4" />}>
                Create Your First Project
              </Button>
            </Link>
            <Link href="#">
              <Button variant="secondary" size="lg">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
