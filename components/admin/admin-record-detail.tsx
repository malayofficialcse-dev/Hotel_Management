"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type AdminEmployee } from "@/lib/api-client";

export function AdminRecordDetail({ kind, id }: { kind: "employees" | "roles"; id: string }) {
  const [employee, setEmployee] = useState<AdminEmployee | null>(null);
  const [loading, setLoading] = useState(kind === "employees");
  const [error, setError] = useState("");

  useEffect(() => {
    if (kind !== "employees") return;
    let active = true;
    api.getAdminEmployees()
      .then((employees) => {
        if (!active) return;
        const found = employees.find((item) => item.id === id);
        if (found) setEmployee(found);
        else setError("This employee is not present in the employee database.");
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load employee details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id, kind]);

  const title = kind === "roles" ? "Role details unavailable" : employee?.name || "Employee details";
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <div className="admin-eyebrow"><Link href={`/admin/${kind}`}>{kind === "roles" ? "ROLES & PERMISSIONS" : "EMPLOYEES"}</Link>&nbsp; / &nbsp;DETAILS</div>
          <h1>{title}</h1>
          <p>{kind === "roles" ? "Custom roles are not stored by the current auth service." : "Employee information loaded from the employee service."}</p>
        </div>
        <div className="admin-heading-actions"><Link href={`/admin/${kind}`} className="admin-secondary-button">← Back to {kind}</Link></div>
      </div>
      <section className="admin-panel admin-record-main">
        {kind === "roles" ? (
          <div className="admin-empty">No role details are stored. No sample permissions or members are shown.</div>
        ) : loading ? (
          <div className="admin-empty">Loading employee details…</div>
        ) : error ? (
          <div className="admin-empty" role="alert">{error}</div>
        ) : employee ? (
          <div className="admin-form-grid">
            <label>Employee ID<input readOnly value={employee.id} /></label>
            <label>Full name<input readOnly value={employee.name} /></label>
            <label>Work email<input readOnly value={employee.email} /></label>
            <label>Position<input readOnly value={employee.position} /></label>
            <label>Department<input readOnly value={employee.department?.name || employee.departmentId} /></label>
            <label>Status<input readOnly value={employee.isActive ? "Active" : "Inactive"} /></label>
          </div>
        ) : null}
      </section>
    </>
  );
}
