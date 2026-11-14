"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface, TextField } from "@/components/ui";
import { FigmaIcon } from "@/components/figma-icon";
import { api, type UserSession } from "@/lib/api-client";

const sideNav = [
  ["user", "Personal information"],
  ["sliders", "Travel preferences"],
  ["bell", "Notifications"],
  ["shield", "Security & privacy"],
  ["credit-card", "Payment methods"],
  ["support", "Help & support"],
];

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState("Personal information");

  useEffect(() => {
    let activeEffect = true;
    async function loadUser() {
      const current = api.getUser();
      if (!current) {
        router.push("/auth/login");
        return;
      }
      setUser(current);
      const parts = (current.name || "").split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setPhone(current.phone || "");

      try {
        const live = await api.getProfile();
        if (!activeEffect) return;
        setUser(live);
        const liveParts = (live.name || "").split(" ");
        setFirstName(liveParts[0] || "");
        setLastName(liveParts.slice(1).join(" ") || "");
        if (live.phone) setPhone(live.phone);
      } catch {
        // use local
      }
    }
    void loadUser();
    return () => {
      activeEffect = false;
    };
  }, [router]);

  async function handleSaveChanges() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (!fullName) {
        setError("Name cannot be empty.");
        setSaving(false);
        return;
      }
      const updated = await api.updateProfile({
        name: fullName,
        phone: phone.trim(),
      });
      setUser((prev) => (prev ? { ...prev, ...updated } : updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    api.logout();
    router.push("/auth/login");
  }

  const initials = user?.name
    ? user.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "ST";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1296px] px-5 py-8 lg:px-0">
        <PageHeading eyebrow="YOUR STAYEASE" title="A little more you." description="Keep your details, preferences and peace of mind in one place." />
        <div className="mt-6 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside>
            <div className="rounded-[4px] bg-lilac p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-semibold text-forest">
                {initials}
              </span>
              <h2 className="mt-3 text-sm font-semibold">{user?.name || "StayEase Guest"}</h2>
              <p className="mt-1 text-[10px] text-muted">{user?.email || "guest@stayease.com"}</p>
              <span className="mt-3 inline-block rounded-[4px] bg-white px-2 py-1 text-[9px] font-semibold text-forest">
                {user?.role === "ADMIN" ? "Administrator" : "StayEase Explorer"}
              </span>
            </div>
            <nav className="mt-3 space-y-1" aria-label="Account settings">
              {sideNav.map(([icon, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActive(label)}
                  className={`flex w-full items-center gap-3 rounded-[4px] px-3 py-2.5 text-left text-[10px] ${active === label ? "bg-mint font-semibold text-forest" : "text-ink hover:bg-mist"}`}
                >
                  <FigmaIcon name={icon as "user"} className="h-3.5 w-3.5" />{label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-[4px] px-3 py-2.5 text-left text-[10px] text-red-600 hover:bg-red-50"
              >
                <span aria-hidden="true">↪</span> Sign out
              </button>
            </nav>
          </aside>
          <div className="space-y-4">
            <Surface className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Personal information</h2>
                <span className="rounded-[4px] bg-mint px-2 py-1 text-[9px] font-semibold text-forest">Email verified</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <TextField
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
                <TextField
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
                <TextField
                  label="Email address"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="opacity-75"
                />
                <TextField
                  label="Phone number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
                <TextField label="Date of birth" type="text" defaultValue="14 August 1994" />
                <label className="block text-[11px] font-medium">
                  Country of residence
                  <select className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs font-normal">
                    <option>India</option>
                    <option>United Kingdom</option>
                    <option>United States</option>
                  </select>
                </label>
              </div>
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[9px] text-muted">
                  {saved ? "Your details have been saved successfully." : "Your details are only used to make your stays smoother."}
                </p>
                <Button onClick={() => void handleSaveChanges()} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </Surface>
            <Surface className="p-5">
              <h2 className="text-sm font-semibold">Travel preferences</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-[10px] font-medium">Preferred currency<select className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs font-normal"><option>INR – Indian Rupee</option><option>USD – US Dollar</option></select></label>
                <label className="text-[10px] font-medium">Language<select className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs font-normal"><option>English</option><option>Hindi</option></select></label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[9px]"><span className="rounded-[4px] bg-mist px-2 py-1">✓ Non-smoking rooms</span><span className="rounded-[4px] bg-mist px-2 py-1">✓ Breakfast included</span><button type="button" className="rounded-[4px] bg-mist px-2 py-1">+ Add preference</button></div>
              <p className="mt-4 flex items-center gap-2 rounded-[4px] bg-butter p-3 text-[10px]"><FigmaIcon name="sun" className="h-4 w-4" /> Appearance: Light mode · A brighter way to plan your travels.</p>
            </Surface>
            <Surface className="p-5">
              <h2 className="text-sm font-semibold">Stay in the loop</h2>
              <ToggleRow title="Booking updates" description="Essential confirmations, reminders and changes to your stay." defaultChecked />
              <ToggleRow title="Travel inspiration & offers" description="Handpicked stays, member-only deals and places worth discovering." defaultChecked />
              <ToggleRow title="SMS & WhatsApp updates" description="Helpful reminders and check-in details sent to your phone." />
            </Surface>
            <Surface className="p-5">
              <h2 className="text-sm font-semibold">Security &amp; privacy</h2>
              <div className="flex items-center justify-between border-b border-line py-4 text-[10px]">
                <div><p className="font-semibold">Password</p><p className="mt-1 text-muted">Last updated 12 July 2026</p></div>
                <Button variant="outline" className="min-h-8" onClick={() => router.push(user?.role === "ADMIN" ? "/admin/profile" : "/account")}>
                  Change password
                </Button>
              </div>
              <ToggleRow title="Two-step verification" description="Add an extra layer of security with a one-time code." />
              <div className="flex justify-between pt-4 text-[10px]"><button type="button" className="text-forest">Manage my data</button><button type="button" className="text-muted">Delete account</button></div>
            </Surface>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function ToggleRow({ title, description, defaultChecked = false }: { title: string; description: string; defaultChecked?: boolean }) {
  const [enabled, setEnabled] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-4 last:border-b-0">
      <div><p className="text-[10px] font-semibold">{title}</p><p className="mt-1 text-[9px] text-muted">{description}</p></div>
      <button type="button" onClick={() => setEnabled(!enabled)} aria-pressed={enabled} aria-label={`${enabled ? "Disable" : "Enable"} ${title}`} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${enabled ? "bg-forest" : "bg-line"}`}>
        <span className={`absolute top-[2px] h-4 w-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
      </button>
    </div>
  );
}
