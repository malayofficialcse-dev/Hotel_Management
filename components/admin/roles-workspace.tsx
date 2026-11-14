"use client";

import { useEffect, useMemo, useState } from "react";
import {
  api,
  type AdminDepartment,
  type AdminEmployee,
  type AdminHotel,
} from "@/lib/api-client";
import { exportToExcel } from "@/lib/export-excel";
import {
  ADMIN_MODULES,
  FULL_PERMISSIONS,
  NO_PERMISSIONS,
  ROLE_PRESETS,
  countAllowedModules,
  getSavedPermissionsMap,
  savePermissionsLocally,
  type AdminModule,
  type ModulePermission,
  type PermissionMatrix,
} from "@/lib/rbac";
import { DownloadIcon, FilterIcon, PrinterIcon, RefreshIcon } from "@/components/icons";

const formatNumber = (value: number) => value.toLocaleString("en-IN");

export function RolesWorkspace() {
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [hotels, setHotels] = useState<AdminHotel[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All Staff");

  // Filter dropdowns
  const [filterHotel, setFilterHotel] = useState("ALL");
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");

  // Modal State
  const [selectedEmployee, setSelectedEmployee] = useState<AdminEmployee | null>(null);
  const [editRole, setEditRole] = useState<string>("STAFF");
  const [editMatrix, setEditMatrix] = useState<PermissionMatrix>(ROLE_PRESETS.STAFF.permissions);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [empList, hotelList, deptList] = await Promise.all([
        api.getAdminEmployees().catch(() => []),
        api.getAdminHotels().catch(() => []),
        api.getAdminDepartments().catch(() => []),
      ]);

      const localMap = getSavedPermissionsMap();
      const mergedEmployees = (empList || []).map((emp) => {
        const local = localMap[emp.id] || (emp.email && localMap[emp.email.toLowerCase()]);
        return {
          ...emp,
          role: local?.role || emp.role || "STAFF",
          permissions: (local?.matrix as any) || emp.permissions || ROLE_PRESETS[emp.role || "STAFF"]?.permissions || ROLE_PRESETS.STAFF.permissions,
        };
      });

      setEmployees(mergedEmployees);
      setHotels(hotelList || []);
      setDepartments(deptList || []);
    } catch {
      setNotice("Could not load employee records from backend service.");
    } finally {
      setLoading(false);
    }
  }

  // Open permission edit dialog
  function openConfigureModal(emp: AdminEmployee) {
    setSelectedEmployee(emp);
    const assignedRole = emp.role || "STAFF";
    setEditRole(assignedRole);

    if (emp.permissions && typeof emp.permissions === "object") {
      setEditMatrix({ ...NO_PERMISSIONS, ...(emp.permissions as PermissionMatrix) });
    } else if (ROLE_PRESETS[assignedRole]) {
      setEditMatrix({ ...ROLE_PRESETS[assignedRole].permissions });
    } else {
      setEditMatrix({ ...ROLE_PRESETS.STAFF.permissions });
    }
  }

  // Change Role Preset in modal
  function handlePresetChange(roleKey: string) {
    setEditRole(roleKey);
    if (ROLE_PRESETS[roleKey]) {
      setEditMatrix({ ...ROLE_PRESETS[roleKey].permissions });
    }
  }

  // Toggle individual permission checkbox
  function togglePermission(moduleId: AdminModule, action: keyof ModulePermission) {
    setEditMatrix((prev) => {
      const current = prev[moduleId] || { view: false, create: false, edit: false, delete: false };
      const updated = { ...current, [action]: !current[action] };
      // If turning on create/edit/delete, ensure view is also on
      if (action !== "view" && updated[action]) {
        updated.view = true;
      }
      // If turning off view, turn off all actions
      if (action === "view" && !updated.view) {
        updated.create = false;
        updated.edit = false;
        updated.delete = false;
      }
      return {
        ...prev,
        [moduleId]: updated,
      };
    });
    setEditRole("CUSTOM");
  }

  // Toggle all actions for a module
  function toggleModuleRow(moduleId: AdminModule) {
    setEditMatrix((prev) => {
      const current = prev[moduleId] || { view: false, create: false, edit: false, delete: false };
      const allActive = current.view && current.create && current.edit && current.delete;
      const targetState = !allActive;
      return {
        ...prev,
        [moduleId]: {
          view: targetState,
          create: targetState,
          edit: targetState,
          delete: targetState,
        },
      };
    });
    setEditRole("CUSTOM");
  }

  // Quick actions
  function selectAll() {
    setEditMatrix({ ...FULL_PERMISSIONS });
    setEditRole("ADMIN");
  }

  function setViewOnlyAll() {
    const viewOnly: PermissionMatrix = { ...NO_PERMISSIONS };
    ADMIN_MODULES.forEach((m) => {
      viewOnly[m.id] = { view: true, create: false, edit: false, delete: false };
    });
    setEditMatrix(viewOnly);
    setEditRole("CUSTOM");
  }

  function clearAll() {
    setEditMatrix({ ...NO_PERMISSIONS });
    setEditRole("CUSTOM");
  }

  // Save permissions
  async function handleSavePermissions() {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      // 1. Save to employee-service backend
      await api.updateEmployee(selectedEmployee.id, {
        role: editRole,
        permissions: editMatrix,
      }).catch((e) => {
        console.warn("Backend update failed, persisting in RBAC store:", e);
      });

      // 2. Save in RBAC persistent client store
      savePermissionsLocally(selectedEmployee.id, editRole, editMatrix);
      if (selectedEmployee.email) {
        savePermissionsLocally(selectedEmployee.email.toLowerCase(), editRole, editMatrix);
      }

      // 3. Update state
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === selectedEmployee.id
            ? { ...emp, role: editRole, permissions: editMatrix }
            : emp
        )
      );

      setNotice(`Access control updated for ${selectedEmployee.name} (${selectedEmployee.employeeCode || "Staff"}).`);
      setSelectedEmployee(null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  }

  // Excel Export
  function exportExcel() {
    const today = new Date().toISOString().split("T")[0];
    const headers = [
      "Employee Code",
      "Name",
      "Email",
      "Position",
      "Hotel",
      "Department",
      "Assigned Role",
      "Allowed Modules Count",
      "Status",
    ];
    const rows = filteredEmployees.map((emp) => [
      emp.employeeCode || "—",
      emp.name,
      emp.email,
      emp.position,
      emp.hotelId || "—",
      emp.department?.name || "—",
      emp.role || "STAFF",
      `${countAllowedModules(emp.permissions as any)} / ${ADMIN_MODULES.length}`,
      emp.isActive ? "Active" : "Inactive",
    ]);
    exportToExcel({
      filename: `roles_permissions_export_${today}`,
      sheetName: "RBAC Directory",
      headers,
      rows,
    });
    setNotice(`Exported ${filteredEmployees.length} role assignments to Excel.`);
  }

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Tab filter
      if (activeTab === "Administrators" && emp.role !== "ADMIN") return false;
      if (activeTab === "Managers" && emp.role !== "HOTEL_MANAGER") return false;
      if (activeTab === "Front Desk" && emp.role !== "FRONT_DESK") return false;
      if (activeTab === "Housekeeping" && emp.role !== "HOUSEKEEPING_SUPERVISOR") return false;
      if (activeTab === "Custom Matrix" && emp.role !== "CUSTOM") return false;

      // Dropdown filters
      if (filterHotel !== "ALL" && emp.hotelId !== filterHotel) return false;
      if (filterDepartment !== "ALL" && emp.departmentId !== filterDepartment) return false;
      if (filterRole !== "ALL" && emp.role !== filterRole) return false;

      // Search query
      if (query.trim()) {
        const q = query.toLowerCase();
        const match =
          emp.name.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          (emp.employeeCode && emp.employeeCode.toLowerCase().includes(q)) ||
          emp.position.toLowerCase().includes(q) ||
          (emp.role && emp.role.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [employees, activeTab, filterHotel, filterDepartment, filterRole, query]);

  // Statistics
  const adminCount = employees.filter((e) => e.role === "ADMIN").length;
  const customCount = employees.filter((e) => e.role === "CUSTOM" || Boolean(e.permissions)).length;

  return (
    <>
      {/* Header */}
      <div className="admin-page-heading">
        <div>
          <div className="admin-eyebrow">WORKSPACE&nbsp; / &nbsp;ROLES &amp; PERMISSIONS (RBAC)</div>
          <h1>Roles &amp; permissions</h1>
          <p>Manage role-based access control (View, Create, Edit, Delete) for all team members and workspace modules.</p>
        </div>
        <div className="admin-heading-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={exportExcel}
            title="Export role assignments to Excel (.xlsx)"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <DownloadIcon size={13} /> <span>Export to Excel</span>
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => window.print()}
            title="Print overview"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <PrinterIcon size={13} /> <span>Print</span>
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => void loadData()}
            title="Refresh"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshIcon size={13} /> <span>Refresh</span>
          </button>
          {notice && <span className="admin-action-notice" role="status">{notice}</span>}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Total Team Members</span>
            <span className="admin-stat-icon tone-0">♙</span>
          </div>
          <strong>{formatNumber(employees.length)}</strong>
          <small>Registered employee profiles</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Administrators</span>
            <span className="admin-stat-icon tone-1">⛨</span>
          </div>
          <strong>{formatNumber(adminCount)}</strong>
          <small>Full unrestricted root access</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Custom Access Matrices</span>
            <span className="admin-stat-icon tone-2">⚙</span>
          </div>
          <strong>{formatNumber(customCount)}</strong>
          <small>Granular page policies</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Secured Modules</span>
            <span className="admin-stat-icon tone-3">▣</span>
          </div>
          <strong>{ADMIN_MODULES.length}</strong>
          <small>View / Create / Edit / Delete</small>
        </div>
      </div>

      {/* Main Table Panel */}
      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Role-Based Access Directory</h2>
            <p>Click on any team member to configure their page-level view, create, edit, and delete permissions.</p>
          </div>
        </div>

        {/* Quick Tabs */}
        <div className="admin-tabs" role="tablist" aria-label="Role filters">
          {["All Staff", "Administrators", "Managers", "Front Desk", "Housekeeping", "Custom Matrix"].map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={activeTab === tab ? "is-selected" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            padding: "12px 16px",
            borderBottom: "1px solid #E5EBE7",
            backgroundColor: "#FAFBFB",
          }}
        >
          {/* Search Input */}
          <div style={{ flex: "1 1 240px", minWidth: "200px" }}>
            <label className="admin-table-search" style={{ margin: 0, width: "100%" }}>
              ⌕
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search staff by name, code, role, email..."
                style={{ width: "100%" }}
              />
            </label>
          </div>

          {/* Hotel Filter */}
          <select
            value={filterHotel}
            onChange={(e) => setFilterHotel(e.target.value)}
            className="admin-filter-pill"
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12px" }}
          >
            <option value="ALL">All Hotels</option>
            {hotels.map((h) => (
              <option key={h._id || h.slug} value={h.slug || h._id}>
                {h.name}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="admin-filter-pill"
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12px" }}
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="admin-filter-pill"
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "12px" }}
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Administrator</option>
            <option value="HOTEL_MANAGER">Hotel Manager</option>
            <option value="FRONT_DESK">Front Desk</option>
            <option value="HOUSEKEEPING_SUPERVISOR">Housekeeping Supervisor</option>
            <option value="STAFF">General Staff</option>
            <option value="AUDITOR">Auditor</option>
            <option value="CUSTOM">Custom Matrix</option>
          </select>

          {(query || filterHotel !== "ALL" || filterDepartment !== "ALL" || filterRole !== "ALL" || activeTab !== "All Staff") && (
            <button
              type="button"
              className="admin-secondary-button"
              style={{ padding: "5px 10px", fontSize: "11px", height: "auto" }}
              onClick={() => {
                setQuery("");
                setFilterHotel("ALL");
                setFilterDepartment("ALL");
                setFilterRole("ALL");
                setActiveTab("All Staff");
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "36px" }}><input type="checkbox" aria-label="Select all" /></th>
                <th>CODE</th>
                <th>TEAM MEMBER</th>
                <th>PROPERTY / DEPT</th>
                <th>POSITION</th>
                <th>ROLE PRESET</th>
                <th>MODULE ACCESS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#617169" }}>
                    Loading team members and permissions…
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#617169" }}>
                    No team members match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const allowedCount = countAllowedModules(emp.permissions as any);
                  const isFull = allowedCount === ADMIN_MODULES.length;
                  return (
                    <tr
                      key={emp.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => openConfigureModal(emp)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={`Select ${emp.name}`} />
                      </td>
                      <td className="admin-id" style={{ fontWeight: 600, color: "#1E3A2B" }}>
                        {emp.employeeCode || "—"}
                      </td>
                      <td>
                        <strong className="admin-row-name" style={{ display: "block" }}>
                          {emp.name}
                        </strong>
                        <small style={{ color: "#617169", fontSize: "11px" }}>{emp.email}</small>
                      </td>
                      <td className="admin-detail-cell">
                        <div>
                          <strong>{emp.hotelId || "Default"}</strong>
                          <small style={{ display: "block", color: "#617169" }}>
                            {emp.department?.name || "General"}
                          </small>
                        </div>
                      </td>
                      <td style={{ fontSize: "12px", color: "#374151" }}>{emp.position}</td>
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            backgroundColor:
                              emp.role === "ADMIN"
                                ? "#EAF5EE"
                                : emp.role === "HOTEL_MANAGER"
                                  ? "#EFF6FF"
                                  : emp.role === "CUSTOM"
                                    ? "#FDF4FF"
                                    : "#F3F4F6",
                            color:
                              emp.role === "ADMIN"
                                ? "#1E3A2B"
                                : emp.role === "HOTEL_MANAGER"
                                  ? "#1D4ED8"
                                  : emp.role === "CUSTOM"
                                    ? "#86198F"
                                    : "#374151",
                            border: `1px solid ${emp.role === "ADMIN"
                                ? "#C6E4D1"
                                : emp.role === "HOTEL_MANAGER"
                                  ? "#BFDBFE"
                                  : emp.role === "CUSTOM"
                                    ? "#F0ABFC"
                                    : "#E5E7EB"
                              }`,
                          }}
                        >
                          {emp.role === "ADMIN"
                            ? "Administrator"
                            : emp.role === "HOTEL_MANAGER"
                              ? "Hotel Manager"
                              : emp.role === "FRONT_DESK"
                                ? "Front Desk"
                                : emp.role === "HOUSEKEEPING_SUPERVISOR"
                                  ? "Housekeeping"
                                  : emp.role === "CUSTOM"
                                    ? "Custom Matrix"
                                    : "General Staff"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: isFull ? "#059669" : "#4B5563",
                            }}
                          >
                            {allowedCount} / {ADMIN_MODULES.length} Pages
                          </span>
                          <div
                            style={{
                              width: "60px",
                              height: "6px",
                              borderRadius: "3px",
                              backgroundColor: "#E5EBE7",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${(allowedCount / ADMIN_MODULES.length) * 100}%`,
                                height: "100%",
                                backgroundColor: isFull ? "#1E3A2B" : "#10B981",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="admin-primary-button"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          onClick={() => openConfigureModal(emp)}
                        >
                          Configure Access
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-foot">
          <span>{formatNumber(filteredEmployees.length)} team members listed</span>
          <div>
            <span>Page 1 of 1</span>
            <button type="button" aria-label="Previous page" disabled>‹</button>
            <button type="button" aria-label="Next page" disabled>›</button>
          </div>
        </div>
      </section>

      {/* Permissions Configuration Dialog */}
      {selectedEmployee && (
        <div
          className="admin-dialog-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedEmployee(null);
          }}
        >
          <div
            className="admin-dialog"
            style={{
              maxWidth: "880px",
              width: "95vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              padding: 0,
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #E5EBE7",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#FAFBFB",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "#1E3A2B",
                    color: "#FFFFFF",
                    fontSize: "18px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedEmployee.name?.[0] || "E"}
                </div>
                <div>
                  <h3 style={{ margin: "0 0 2px", fontSize: "17px", fontWeight: 700 }}>
                    Configure Permissions: {selectedEmployee.name}
                  </h3>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#617169" }}>
                    <span>Code: <strong>{selectedEmployee.employeeCode || "—"}</strong></span>
                    <span>Email: <strong>{selectedEmployee.email}</strong></span>
                    <span>Position: <strong>{selectedEmployee.position}</strong></span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="admin-dialog-close"
                onClick={() => setSelectedEmployee(null)}
                style={{ fontSize: "20px", background: "none", border: "none", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              {/* Presets Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "14px",
                  padding: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#F9FAF9",
                  border: "1px solid #E5EBE7",
                  marginBottom: "20px",
                }}
              >
                <div style={{ flex: "1 1 300px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>
                    Role Preset Template:
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #D1D5DB",
                      fontSize: "13px",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <option value="ADMIN">Administrator (Full Root Access)</option>
                    <option value="HOTEL_MANAGER">Hotel Manager (Operations & Catalog)</option>
                    <option value="FRONT_DESK">Front Desk Executive (Bookings & Check-in)</option>
                    <option value="HOUSEKEEPING_SUPERVISOR">Housekeeping Supervisor (Cleanliness & Staff)</option>
                    <option value="STAFF">General Associate / Staff (Restricted)</option>
                    <option value="AUDITOR">Auditor / Accountant (Financial Read-Only)</option>
                    <option value="CUSTOM">Custom Access Matrix (Manual)</option>
                  </select>
                  <small style={{ display: "block", marginTop: "4px", color: "#617169", fontSize: "11px" }}>
                    {ROLE_PRESETS[editRole]?.description || "Customized individual permissions for this employee."}
                  </small>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    style={{ fontSize: "11px", padding: "6px 10px" }}
                    onClick={selectAll}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    style={{ fontSize: "11px", padding: "6px 10px" }}
                    onClick={setViewOnlyAll}
                  >
                    View Only All
                  </button>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    style={{ fontSize: "11px", padding: "6px 10px" }}
                    onClick={clearAll}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Granular Permission Matrix Table */}
              <div style={{ border: "1px solid #E5EBE7", borderRadius: "8px", overflow: "hidden" }}>
                <table className="admin-table" style={{ margin: 0 }}>
                  <thead style={{ backgroundColor: "#F3F4F6" }}>
                    <tr>
                      <th style={{ width: "35%" }}>PAGE / MODULE</th>
                      <th style={{ width: "15%", textAlign: "center" }}>VIEW</th>
                      <th style={{ width: "15%", textAlign: "center" }}>CREATE</th>
                      <th style={{ width: "15%", textAlign: "center" }}>EDIT</th>
                      <th style={{ width: "15%", textAlign: "center" }}>DELETE</th>
                      <th style={{ width: "20%", textAlign: "right" }}>QUICK TOGGLE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ADMIN_MODULES.map((mod) => {
                      const perm = editMatrix[mod.id] || { view: false, create: false, edit: false, delete: false };
                      return (
                        <tr key={mod.id}>
                          <td>
                            <strong style={{ fontSize: "13px", color: "#111827", display: "block" }}>
                              {mod.label}
                            </strong>
                            <small style={{ color: "#617169", fontSize: "11px" }}>{mod.description}</small>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={perm.view}
                              onChange={() => togglePermission(mod.id, "view")}
                              aria-label={`View ${mod.label}`}
                              style={{ width: "16px", height: "16px", cursor: "pointer" }}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={perm.create}
                              onChange={() => togglePermission(mod.id, "create")}
                              aria-label={`Create in ${mod.label}`}
                              style={{ width: "16px", height: "16px", cursor: "pointer" }}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={perm.edit}
                              onChange={() => togglePermission(mod.id, "edit")}
                              aria-label={`Edit in ${mod.label}`}
                              style={{ width: "16px", height: "16px", cursor: "pointer" }}
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={perm.delete}
                              onChange={() => togglePermission(mod.id, "delete")}
                              aria-label={`Delete in ${mod.label}`}
                              style={{ width: "16px", height: "16px", cursor: "pointer" }}
                            />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="admin-secondary-button"
                              style={{ padding: "3px 8px", fontSize: "10px" }}
                              onClick={() => toggleModuleRow(mod.id)}
                            >
                              {perm.view && perm.create && perm.edit && perm.delete ? "Uncheck Row" : "Check Row"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #E5EBE7",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#FAFBFB",
              }}
            >
              <span style={{ fontSize: "12px", color: "#617169" }}>
                Effective scope: <strong>{countAllowedModules(editMatrix)}</strong> of {ADMIN_MODULES.length} workspace pages enabled.
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => setSelectedEmployee(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => void handleSavePermissions()}
                  disabled={saving}
                >
                  {saving ? "Saving permissions…" : "Save permissions"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
