import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import "@/components/admin/admin.css";

export const metadata: Metadata = {
  title: "StayEase Admin",
  description: "Manage the StayEase hotel portfolio.",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
