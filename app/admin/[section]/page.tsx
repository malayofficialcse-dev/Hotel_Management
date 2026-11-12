import { notFound } from "next/navigation";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import type { AdminSection } from "@/components/admin/admin-data";

const sections: AdminSection[] = [
  "hotels",
  "rooms",
  "reservations",
  "customers",
  "departments",
  "employees",
  "housekeeping",
  "roles",
  "payments",
  "offers",
  "reviews",
  "reports",
  "notifications",
  "audit",
  "settings",
];

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as AdminSection)) notFound();
  return <AdminWorkspace section={section as AdminSection} />;
}

