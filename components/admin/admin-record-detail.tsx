"use client";

import Link from "next/link";
import { useState } from "react";

export function AdminRecordDetail({ kind, id }: { kind: "employees" | "roles"; id: string }) {
  const [notice, setNotice] = useState("");
  const role = kind === "roles";
  const title = role ? (id === "RL-01" ? "Administrator" : id === "RL-02" ? "Property manager" : id === "RL-03" ? "Front desk" : "Finance") : id === "EM-2081" ? "Sarah Mitchell" : id === "EM-2074" ? "Rohan Desai" : "Team member";
  return (
    <>
      <div className="admin-page-heading">
        <div><div className="admin-eyebrow"><Link href={`/admin/${kind}`}>{role ? "ROLES & PERMISSIONS" : "EMPLOYEES"}</Link>&nbsp; / &nbsp;{role ? "ROLE DETAILS" : "EMPLOYEE PROFILE"}</div><h1>{title}</h1><p>{role ? "Review the access this role provides to your team." : "A closer look at your team member and their workspace access."}</p></div>
        <div className="admin-heading-actions"><Link href={`/admin/${kind}`} className="admin-secondary-button">← Back to {role ? "roles" : "employees"}</Link><button type="button" className="admin-primary-button" onClick={() => setNotice(role ? "Role permissions saved." : "Employee profile saved.")}>Save changes</button>{notice && <span className="admin-action-notice" role="status">{notice}</span>}</div>
      </div>
      <div className="admin-record-detail-grid">
        <section className="admin-panel admin-record-main">
          {!role && <div className="admin-record-profile"><span className="admin-record-avatar">{title.split(" ").map((word) => word[0]).join("")}</span><div><h2>{title}</h2><p>{id} · Full-time · Joined 12 March 2024</p></div><span className="admin-status status-green"><i />Active</span></div>}
          <div className="admin-record-section"><h2>{role ? "Role information" : "Personal information"}</h2><p className="admin-panel-subtitle">{role ? "Give the role a name and a clear description for your team." : "Contact information and team assignment."}</p>
            <div className="admin-form-grid">
              <label>{role ? "Role name" : "Full name"}<input defaultValue={title} /></label>
              <label>{role ? "Role status" : "Work email"}<input defaultValue={role ? "Active" : `${title.toLowerCase().replace(" ", ".")}@stayease.com`} /></label>
              {!role && <><label>Phone number<input defaultValue="+91 98765 43210" /></label><label>Department<select defaultValue="Front desk"><option>Front desk</option><option>Housekeeping</option><option>Reservations</option><option>Finance</option></select></label></>}
              <label>{role ? "Description" : "Assigned property"}<input defaultValue={role ? "Supports daily property operations and guest experience." : "The Palm House · Goa"} /></label>
              {!role && <label>Access role<select defaultValue="Property manager"><option>Property manager</option><option>Front desk</option><option>Finance</option><option>Administrator</option></select></label>}
            </div>
          </div>
          <div className="admin-record-section">
            <h2>{role ? "Permissions" : "Workspace access"}</h2>
            <p className="admin-panel-subtitle">{role ? "Choose what members assigned to this role can view and manage." : "Access follows the assigned role and property permissions."}</p>
            <div className="admin-permission-table">
              <div className="admin-permission-row admin-permission-head"><span>AREA</span><span>VIEW</span><span>CREATE</span><span>EDIT</span><span>DELETE</span></div>
              {["Dashboard", "Hotels & rooms", "Reservations", "Customers", "Payments", "Reports"].map((item, index) => <PermissionRow key={item} name={item} index={index} />)}
            </div>
          </div>
        </section>
        <aside className="admin-panel admin-record-side">
          <h2>{role ? "Members with this role" : "Profile overview"}</h2>
          {(role ? ["Sarah Mitchell", "Rohan Desai", "Aditi Sharma", "View all members"] : ["Employee ID", id, "Team", "Front desk", "Reports to", "Property manager"]).map((item, index) => <div className="admin-record-side-row" key={`${item}-${index}`}><span>{role ? (index === 3 ? "" : "TEAM MEMBER") : ["", "", "", "", "", ""][index]}</span><strong>{item}</strong></div>)}
          <div className="admin-info-card"><span>✓</span><div><strong>Workspace access is secure</strong><p>Changes are recorded in the audit log.</p></div></div>
        </aside>
      </div>
    </>
  );
}

function PermissionRow({ name, index }: { name: string; index: number }) {
  return <div className="admin-permission-row"><strong>{name}</strong>{["View", "Create", "Edit", "Delete"].map((permission, permissionIndex) => <label key={permission}><input type="checkbox" aria-label={`${permission} ${name}`} defaultChecked={permissionIndex === 0 || index < 3 && permissionIndex < 3} /></label>)}</div>;
}
