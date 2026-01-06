"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TeamInviteDialog from "@/components/TeamInviteDialog";
import { api } from "@/lib/api";

interface TeamMember {
  id: string;
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  invited_by_username: string;
  invited_at: string;
  accepted_at: string | null;
  is_active: boolean;
}

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const response = await api.get("/tenants/organizations/me/team/");
      setTeamMembers(response.data);
      setLoading(false);
    } catch (err: any) {
      setError("Failed to load team members");
      setLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    setShowInviteDialog(false);
    setSuccess("Team member invited successfully");
    loadTeamMembers();
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleRevoke = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this team member?")) {
      return;
    }

    try {
      await api.delete(`/tenants/organizations/me/team/${userId}/`);
      setSuccess("Team member removed successfully");
      loadTeamMembers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove team member");
      setTimeout(() => setError(""), 3000);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "manager":
        return "bg-green-100 text-green-800";
      case "staff":
        return "bg-yellow-100 text-yellow-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Team Management</h1>
        <Button onClick={() => setShowInviteDialog(true)}>
          Invite Team Member
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          {success}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your organization's team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    {member.first_name || member.last_name
                      ? `${member.first_name} ${member.last_name}`.trim()
                      : member.username}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.invited_by_username}</TableCell>
                  <TableCell>
                    {member.accepted_at
                      ? new Date(member.accepted_at).toLocaleDateString()
                      : "Pending"}
                  </TableCell>
                  <TableCell>
                    {member.role !== "owner" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevoke(member.user_id)}
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {teamMembers.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No team members found. Invite someone to get started!
            </p>
          )}
        </CardContent>
      </Card>

      <TeamInviteDialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}
