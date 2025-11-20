"use client";

import { use, useEffect, useState } from "react";
import { Plus, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "DEVELOPER" | "VIEWER";
  createdAt: string;
}

export default function ProjectMembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/v1/projects/${slug}/members`);
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
        addToast({
          type: "error",
          title: "Failed to load team members",
          message: "Please try again or check your connection.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [slug, addToast]);

  const getRoleBadgeColor = (role: Member["role"]) => {
    switch (role) {
      case "OWNER":
        return "primary";
      case "ADMIN":
        return "secondary";
      case "DEVELOPER":
        return "success";
      default:
        return "default";
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/v1/projects/${slug}/members/${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        addToast({
          type: "success",
          title: "Member removed",
          message: "Team member has been successfully removed.",
        });
      } else {
        const error = await response.json();
        addToast({
          type: "error",
          title: "Failed to remove member",
          message: error.message || "Please try again.",
        });
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
      addToast({
        type: "error",
        title: "Failed to remove member",
        message: "Please try again.",
      });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Team Members"
        description="Manage team permissions and access"
        actions={
          <Button
            variant="primary"
            size="lg"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setShowInviteModal(true)}
          >
            Invite Member
          </Button>
        }
      />

      {/* Members Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : members.length === 0 ? (
        <Card className="p-8 text-center">
          <Mail className="w-12 h-12 text-text-muted-light dark:text-text-muted-dark mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
            No team members yet
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowInviteModal(true)}
          >
            Invite your first member
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-glass-light-border dark:border-glass-dark-border bg-glass-light dark:bg-glass-dark">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-light-border dark:divide-glass-dark-border">
                {members.map((member, idx) => (
                  <tr
                    key={member.id}
                    className={`transition-colors ${
                      idx % 2 === 0
                        ? "bg-white/40 dark:bg-white/5"
                        : "bg-white/20 dark:bg-white/0"
                    } hover:bg-glass-light dark:hover:bg-glass-dark`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={member.name.charAt(0)} size="sm" />
                        <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          {member.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark text-sm">
                      {member.email}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getRoleBadgeColor(member.role) as any} size="sm">
                        {member.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark text-sm">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleRemoveMember(member.id)}
                        title="Remove member"
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
