"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api";

interface TeamInviteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeamInviteDialog({ open, onClose, onSuccess }: TeamInviteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    role: "staff",
    first_name: "",
    last_name: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/tenants/organizations/me/team/invite/", formData);
      setFormData({ email: "", role: "staff", first_name: "", last_name: "" });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Invite Team Member</h2>

        {error && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="colleague@example.com"
            />
          </div>

          <div>
            <Label htmlFor="role">Role *</Label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin - Full access except ownership transfer</option>
              <option value="manager">Manager - Can manage events and team</option>
              <option value="staff">Staff - Can manage events</option>
              <option value="viewer">Viewer - Read-only access</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Select the appropriate role for this team member
            </p>
          </div>

          <div>
            <Label htmlFor="first_name">First Name (Optional)</Label>
            <Input
              id="first_name"
              name="first_name"
              type="text"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="John"
            />
          </div>

          <div>
            <Label htmlFor="last_name">Last Name (Optional)</Label>
            <Input
              id="last_name"
              name="last_name"
              type="text"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Doe"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
