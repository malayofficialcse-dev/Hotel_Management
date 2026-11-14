"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type UserSession } from "@/lib/api-client";
import { FigmaIcon } from "@/components/figma-icon";
import { CheckIcon, UserIcon } from "@/components/icons";

interface AdminProfileData extends UserSession {
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export function ProfileWorkspace() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "security" | "permissions">("details");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const liveUser = await api.getProfile();
        if (!active) return;
        setProfile(liveUser);
        setName(liveUser.name || "");
        setPhone(liveUser.phone || "");
      } catch {
        if (!active) return;
        // Fallback to local session
        const local = api.getUser();
        if (local) {
          setProfile(local);
          setName(local.name || "");
          setPhone(local.phone || "");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadData();
    return () => {
      active = false;
    };
  }, []);

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNotice({ type: "error", text: "Name cannot be empty." });
      return;
    }
    setSavingDetails(true);
    setNotice(null);
    try {
      const updated = await api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
      });
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
      setNotice({ type: "success", text: "Profile details updated successfully." });
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update profile.",
      });
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      setNotice({ type: "error", text: "Please enter your current password." });
      return;
    }
    if (newPassword.length < 6) {
      setNotice({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: "error", text: "New password and confirmation do not match." });
      return;
    }
    setSavingPassword(true);
    setNotice(null);
    try {
      await api.updateProfile({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice({ type: "success", text: "Password changed successfully. Your next login will use your new password." });
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update password.",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AD";

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "Nov 2026";

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Header */}
      <div className="admin-page-heading" style={{ marginBottom: "20px" }}>
        <div>
          <div className="admin-eyebrow">WORKSPACE&nbsp; / &nbsp;MY PROFILE</div>
          <h1>Administrator Profile</h1>
          <p>Manage your account credentials, contact information, and security permissions.</p>
        </div>
        <div className="admin-heading-actions">
          <Link href="/admin" className="admin-secondary-button">
            ← Dashboard
          </Link>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => {
              api.logout();
              router.push("/admin/login");
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          style={{
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "6px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: notice.type === "success" ? "#EAF5EE" : "#FEE2E2",
            color: notice.type === "success" ? "#1E3A2B" : "#991B1B",
            border: `1px solid ${notice.type === "success" ? "#C6E4D1" : "#FECACA"}`,
          }}
        >
          {notice.type === "success" ? <CheckIcon size={16} /> : <span>✕</span>}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Identity Card */}
      <div
        className="admin-panel"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          padding: "24px",
          marginBottom: "24px",
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          border: "1px solid #E5EBE7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#1E3A2B",
              color: "#FFFFFF",
              fontSize: "26px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(30, 58, 43, 0.2)",
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                {profile?.name || "Administrator"}
              </h2>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  backgroundColor: "#EAF5EE",
                  color: "#1E3A2B",
                  border: "1px solid #C6E4D1",
                }}
              >
                {profile?.role || "ADMIN"}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  backgroundColor: "#ECFDF5",
                  color: "#059669",
                  border: "1px solid #A7F3D0",
                }}
              >
                ACTIVE
              </span>
            </div>
            <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#617169" }}>
              {profile?.email || "admin@stayease.com"}
            </p>
            <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "#8E9E96" }}>
              <span>User ID: <code style={{ backgroundColor: "#F3F6F4", padding: "1px 4px", borderRadius: "3px" }}>{profile?.id || "admin-root"}</code></span>
              <span>Account Created: <strong>{memberSince}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ padding: "10px 16px", backgroundColor: "#F9FAF9", borderRadius: "6px", border: "1px solid #E5EBE7", minWidth: "140px" }}>
            <span style={{ fontSize: "11px", color: "#617169", display: "block" }}>Security Level</span>
            <strong style={{ fontSize: "14px", color: "#1E3A2B" }}>JWT Bearer</strong>
          </div>
          <div style={{ padding: "10px 16px", backgroundColor: "#F9FAF9", borderRadius: "6px", border: "1px solid #E5EBE7", minWidth: "140px" }}>
            <span style={{ fontSize: "11px", color: "#617169", display: "block" }}>Access Scope</span>
            <strong style={{ fontSize: "14px", color: "#1E3A2B" }}>Full Workspace</strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginBottom: "20px" }}>
        <button
          type="button"
          className={activeTab === "details" ? "is-selected" : ""}
          onClick={() => setActiveTab("details")}
        >
          Personal Information
        </button>
        <button
          type="button"
          className={activeTab === "security" ? "is-selected" : ""}
          onClick={() => setActiveTab("security")}
        >
          Security & Password
        </button>
        <button
          type="button"
          className={activeTab === "permissions" ? "is-selected" : ""}
          onClick={() => setActiveTab("permissions")}
        >
          Role & Permissions
        </button>
      </div>

      {/* Tab 1: Personal Details */}
      {activeTab === "details" && (
        <section className="admin-panel" style={{ padding: "24px", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E5EBE7" }}>
          <div style={{ marginBottom: "20px", borderBottom: "1px solid #E5EBE7", paddingBottom: "12px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600 }}>Personal Details</h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#617169" }}>Update your display name and contact phone number.</p>
          </div>

          <form onSubmit={(e) => void handleSaveDetails(e)} style={{ display: "grid", gap: "16px", maxWidth: "600px" }}>
            <label className="admin-dialog-label" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>Full Name</span>
              <input
                type="text"
                required
                className="admin-dialog-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Malay Admin"
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px" }}
              />
            </label>

            <label className="admin-dialog-label" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>Email Address</span>
                <span style={{ fontSize: "10px", color: "#059669", fontWeight: 600 }}>Verified & Protected</span>
              </div>
              <input
                type="email"
                disabled
                className="admin-dialog-input"
                value={profile?.email || ""}
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #E5EBE7", fontSize: "13px", backgroundColor: "#F3F4F6", color: "#6B7280", cursor: "not-allowed" }}
              />
              <small style={{ fontSize: "11px", color: "#9CA3AF" }}>Email is tied to your system login credentials and cannot be changed here.</small>
            </label>

            <label className="admin-dialog-label" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>Phone Number</span>
              <input
                type="tel"
                className="admin-dialog-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px" }}
              />
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
              <button
                type="submit"
                disabled={savingDetails || loading}
                className="admin-primary-button"
                style={{ padding: "8px 18px", fontSize: "13px", cursor: savingDetails ? "wait" : "pointer" }}
              >
                {savingDetails ? "Saving changes…" : "Save profile changes"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === "security" && (
        <section className="admin-panel" style={{ padding: "24px", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E5EBE7" }}>
          <div style={{ marginBottom: "20px", borderBottom: "1px solid #E5EBE7", paddingBottom: "12px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600 }}>Account Security & Password</h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#617169" }}>Change your password to keep your administrator account secure.</p>
          </div>

          <form onSubmit={(e) => void handleSavePassword(e)} style={{ display: "grid", gap: "16px", maxWidth: "600px" }}>
            <label className="admin-dialog-label" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>Current Password</span>
              <input
                type="password"
                required
                className="admin-dialog-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px" }}
              />
            </label>

            <label className="admin-dialog-label" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>New Password</span>
              <input
                type="password"
                required
                minLength={6}
                className="admin-dialog-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px" }}
              />
            </label>

            <label className="admin-dialog-label" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>Confirm New Password</span>
              <input
                type="password"
                required
                minLength={6}
                className="admin-dialog-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px" }}
              />
            </label>

            <div style={{ backgroundColor: "#F9FAF9", padding: "12px", borderRadius: "6px", border: "1px solid #E5EBE7", fontSize: "12px", color: "#617169" }}>
              <span style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>Password Security Requirements:</span>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                <li>At least 6 characters in length</li>
                <li>Hashed with salt rounds using bcrypt before persisting</li>
                <li>Applies to next login session across all admin panels</li>
              </ul>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
              <button
                type="submit"
                disabled={savingPassword}
                className="admin-primary-button"
                style={{ padding: "8px 18px", fontSize: "13px", cursor: savingPassword ? "wait" : "pointer" }}
              >
                {savingPassword ? "Updating password…" : "Update password"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tab 3: Permissions Matrix */}
      {activeTab === "permissions" && (
        <section className="admin-panel" style={{ padding: "24px", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E5EBE7" }}>
          <div style={{ marginBottom: "20px", borderBottom: "1px solid #E5EBE7", paddingBottom: "12px" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600 }}>Active Role &amp; Permission Scopes</h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#617169" }}>Privileges granted to your administrator role.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {[
              { title: "Hotel & Catalog", desc: "Create, edit, view, and delete properties and destinations.", level: "Full Access" },
              { title: "Room Inventory", desc: "Manage room categories, amenities, pricing, and total inventory.", level: "Full Access" },
              { title: "Reservations & Bookings", desc: "Audit live guest bookings, dates, stay windows, and codes.", level: "Full Access" },
              { title: "Housekeeping Routing", desc: "Assign cleaning tasks, track live guest occupancy, advance status.", level: "Full Access" },
              { title: "Human Resources (Staff)", desc: "Manage employees, departments, salaries, joining dates, and sequential codes.", level: "Full Access" },
              { title: "Payment & Financials", desc: "Monitor checkout payments, settle transactions, review refunds.", level: "Full Access" },
              { title: "Excel Data Export", desc: "Generate full .xlsx spreadsheets across all admin workspace records.", level: "Full Access" },
              { title: "System Administration", desc: "Profile updates, password security, session management.", level: "Full Access" },
            ].map((perm) => (
              <div
                key={perm.title}
                style={{
                  padding: "16px",
                  borderRadius: "6px",
                  border: "1px solid #E5EBE7",
                  backgroundColor: "#F9FAF9",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "13px", color: "#1E3A2B" }}>{perm.title}</strong>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", backgroundColor: "#EAF5EE", color: "#1E3A2B" }}>
                    {perm.level}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "11px", color: "#617169", lineHeight: 1.4 }}>{perm.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

