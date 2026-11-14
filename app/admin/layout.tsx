"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { api } from "@/lib/api-client";
import "@/components/admin/admin.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
      if (pathname === "/admin/login") {
        setAuthorized(true);
        return;
      }

      const token = api.getToken();
      const user = api.getUser();

      if (!token || !user || user.role !== "ADMIN") {
        router.replace("/admin/login");
      } else {
        setAuthorized(true);
      }
    }, [pathname, router]);

    if (pathname === "/admin/login") {
      return <>{children}</>;
    }

    if (!authorized) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#0d1614", color: "#6ee7b7", fontFamily: "sans-serif" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #134e4a", borderTopColor: "#10b981", borderRadius: "50%", margin: "0 auto 16px" }} />
            <p style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.05em" }}>Verifying admin authorization…</p>
          </div>
        </div>
      );
    }

    return <AdminShell>{children}</AdminShell>;
  }
