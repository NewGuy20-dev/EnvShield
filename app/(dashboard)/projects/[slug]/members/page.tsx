"use client";

import { useEffect, useState } from "react";
import { Plus, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "DEVELOPER" | "VIEWER";
  createdAt: string;
}

export default function ProjectMembersPage({ params }: { params: { slug: string } }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/v1/projects/${params.slug}/members`);
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [params.slug]);

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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            Team Members
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Manage team permissions and access
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5" />}
        >
          Invite Member
        </Button>
      </div>

      {/* Members Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : members.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            No team members yet
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-glass-light-border dark:border-glass-dark-border">
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
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-glass-light dark:hover:bg-glass-dark transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={member.name.charAt(0)} size="sm" />
                        <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          {member.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark">
                      {member.email}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getRoleBadgeColor(member.role) as any} size="sm">
                        {member.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
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
