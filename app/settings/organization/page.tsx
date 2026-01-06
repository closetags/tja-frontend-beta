"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api";

interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: string;
  timezone: string;
  status: string;
  owner_username: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
}

export default function OrganizationSettingsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    timezone: "",
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const response = await api.get("/tenants/organizations/me/");
      setOrganization(response.data);
      setFormData({
        name: response.data.name,
        industry: response.data.industry || "",
        timezone: response.data.timezone,
      });
      setLoading(false);
    } catch (err: any) {
      setError("Failed to load organization settings");
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.put("/tenants/organizations/me/", formData);
      setOrganization(response.data);
      setSuccess("Organization settings updated successfully");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update organization settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading organization settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Organization Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Update your organization's basic information
          </CardDescription>
        </CardHeader>
        <CardContent>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select industry</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="finance">Finance</option>
                <option value="retail">Retail</option>
                <option value="hospitality">Hospitality</option>
                <option value="nonprofit">Non-profit</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                type="text"
                value={formData.timezone}
                onChange={handleChange}
                placeholder="UTC"
              />
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Organization ID</p>
                  <p className="font-mono text-xs">{organization?.id}</p>
                </div>
                <div>
                  <p className="text-gray-600">Slug</p>
                  <p className="font-mono">{organization?.slug}</p>
                </div>
                <div>
                  <p className="text-gray-600">Owner</p>
                  <p>{organization?.owner_username} ({organization?.owner_email})</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="capitalize">{organization?.status}</p>
                </div>
                <div>
                  <p className="text-gray-600">Created</p>
                  <p>{organization?.created_at ? new Date(organization.created_at).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
