"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  api,
  type AdminEmployee,
  type AdminHotel,
  type AdminDepartment,
} from "@/lib/api-client";
import { exportToExcel } from "@/lib/export-excel";
import {
  BuildingIcon,
  BriefcaseIcon,
  CalendarIcon,
  FilterIcon,
  PrinterIcon,
  DownloadIcon,
  RefreshIcon,
  PlusIcon,
  CheckIcon,
  UserIcon,
  ReactLogo,
  NextjsLogo,
} from "@/components/icons";

export function EmployeesWorkspace() {
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [hotels, setHotels] = useState<AdminHotel[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter States (All Multi-Select)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Date Filter States
  const [datePreset, setDatePreset] = useState<"all" | "month" | "3months" | "year" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Dropdown Popover Open States
  const [hotelDropdownOpen, setHotelDropdownOpen] = useState(false);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [positionDropdownOpen, setPositionDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [salaryDropdownOpen, setSalaryDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const hotelRef = useRef<HTMLDivElement>(null);
  const deptRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const salaryRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Create Employee Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    hotelId: "",
    departmentId: "",
    name: "",
    email: "",
    phone: "",
    position: "",
    joiningDate: new Date().toISOString().slice(0, 10),
    salary: "",
  });

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (hotelRef.current && !hotelRef.current.contains(target)) setHotelDropdownOpen(false);
      if (deptRef.current && !deptRef.current.contains(target)) setDeptDropdownOpen(false);
      if (positionRef.current && !positionRef.current.contains(target)) setPositionDropdownOpen(false);
      if (statusRef.current && !statusRef.current.contains(target)) setStatusDropdownOpen(false);
      if (salaryRef.current && !salaryRef.current.contains(target)) setSalaryDropdownOpen(false);
      if (dateRef.current && !dateRef.current.contains(target)) setDateDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadData() {
    setLoading(true);
    setLoadFailed(false);
    setNotice("");
    try {
      const [empsRes, hotelsRes, deptsRes] = await Promise.allSettled([
        api.getAdminEmployees(),
        api.getAdminHotels(),
        api.getAdminDepartments(),
      ]);

      if (empsRes.status === "fulfilled") setEmployees(empsRes.value || []);
      else setLoadFailed(true);

      if (hotelsRes.status === "fulfilled") setHotels(hotelsRes.value || []);
      if (deptsRes.status === "fulfilled") setDepartments(deptsRes.value || []);
    } catch (err) {
      setLoadFailed(true);
      setNotice(err instanceof Error ? err.message : "Failed to load employee records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Helper maps
  const hotelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of hotels) {
      if (h._id) map.set(h._id, h.name);
      if (h.slug) map.set(h.slug, h.name);
    }
    return map;
  }, [hotels]);

  const departmentMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of departments) {
      map.set(d._id, d.name);
    }
    return map;
  }, [departments]);

  // Helper: Resolve department name for employee
  function resolveEmployeeDepartment(emp: AdminEmployee): string {
    if (emp.department?.name) return emp.department.name;
    if (emp.departmentId && departmentMap.has(emp.departmentId)) {
      return departmentMap.get(emp.departmentId)!;
    }
    return "General Operations";
  }

  // Helper: Resolve hotel name for employee
  function resolveEmployeeHotel(emp: AdminEmployee): string {
    if (emp.hotelId) {
      const name = hotelMap.get(emp.hotelId);
      if (name) return name;
      return emp.hotelId;
    }
    if (emp.department?.hotelId) {
      const name = hotelMap.get(emp.department.hotelId);
      if (name) return name;
      return emp.department.hotelId;
    }
    return "All Properties";
  }

  // Distinct filter options
  const uniqueHotels = useMemo(() => {
    const set = new Set<string>();
    for (const emp of employees) {
      const name = resolveEmployeeHotel(emp);
      if (name && name !== "All Properties") set.add(name);
    }
    for (const h of hotels) {
      if (h.name) set.add(h.name);
    }
    return Array.from(set).sort();
  }, [employees, hotels, hotelMap]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    for (const emp of employees) {
      const name = resolveEmployeeDepartment(emp);
      if (name) set.add(name);
    }
    for (const d of departments) {
      if (d.name) set.add(d.name);
    }
    return Array.from(set).sort();
  }, [employees, departments, departmentMap]);

  const uniquePositions = useMemo(() => {
    const set = new Set<string>();
    for (const emp of employees) {
      if (emp.position) set.add(emp.position.trim());
    }
    return Array.from(set).sort();
  }, [employees]);

  // Salary range matcher
  function matchSalaryRange(salary: number | null | undefined, rangeKey: string): boolean {
    const val = salary ?? 0;
    if (rangeKey === "under25k") return val < 25000;
    if (rangeKey === "25k-50k") return val >= 25000 && val <= 50000;
    if (rangeKey === "50k-100k") return val > 50000 && val <= 100000;
    if (rangeKey === "100kplus") return val > 100000;
    return true;
  }

  // Date Preset handler
  function handlePresetChange(preset: "all" | "month" | "3months" | "year" | "custom") {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "month") {
      const past = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
      setStartDate(past);
      setEndDate(todayStr);
    } else if (preset === "3months") {
      const past = new Date(now.getTime() - 90 * 86400000).toISOString().split("T")[0];
      setStartDate(past);
      setEndDate(todayStr);
    } else if (preset === "year") {
      const y = now.getFullYear();
      setStartDate(`${y}-01-01`);
      setEndDate(todayStr);
    }
  }

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Quick Tabs
      if (activeTab === "ACTIVE" && !emp.isActive) return false;
      if (activeTab === "INACTIVE" && emp.isActive) return false;

      // 2. Free Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (emp.employeeCode || emp.id || "").toLowerCase();
        const name = (emp.name || "").toLowerCase();
        const email = (emp.email || "").toLowerCase();
        const phone = (emp.phone || "").toLowerCase();
        const pos = (emp.position || "").toLowerCase();
        const dept = resolveEmployeeDepartment(emp).toLowerCase();
        const hotel = resolveEmployeeHotel(emp).toLowerCase();

        const match =
          code.includes(q) ||
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          pos.includes(q) ||
          dept.includes(q) ||
          hotel.includes(q);

        if (!match) return false;
      }

      // 3. Hotel Multi-Select
      if (selectedHotels.length > 0) {
        const hotelName = resolveEmployeeHotel(emp);
        if (!selectedHotels.includes(hotelName)) return false;
      }

      // 4. Department Multi-Select
      if (selectedDepartments.length > 0) {
        const deptName = resolveEmployeeDepartment(emp);
        if (!selectedDepartments.includes(deptName)) return false;
      }

      // 5. Position Multi-Select
      if (selectedPositions.length > 0) {
        if (!selectedPositions.includes(emp.position?.trim() || "")) return false;
      }

      // 6. Status Multi-Select
      if (selectedStatuses.length > 0) {
        const statusKey = emp.isActive ? "ACTIVE" : "INACTIVE";
        if (!selectedStatuses.includes(statusKey)) return false;
      }

      // 7. Salary Multi-Select
      if (selectedSalaryRanges.length > 0) {
        const matched = selectedSalaryRanges.some((rangeKey) => matchSalaryRange(emp.salary, rangeKey));
        if (!matched) return false;
      }

      // 8. Date Range (Joining Date)
      if (startDate || endDate) {
        if (emp.joiningDate) {
          const itemDate = new Date(emp.joiningDate.slice(0, 10)).getTime();
          if (startDate) {
            const startLimit = new Date(startDate).getTime();
            if (itemDate < startLimit) return false;
          }
          if (endDate) {
            const endLimit = new Date(endDate).getTime();
            if (itemDate > endLimit) return false;
          }
        }
      }

      return true;
    });
  }, [
    employees,
    activeTab,
    searchQuery,
    selectedHotels,
    selectedDepartments,
    selectedPositions,
    selectedStatuses,
    selectedSalaryRanges,
    startDate,
    endDate,
    hotelMap,
    departmentMap,
  ]);

  // Overall KPI stats
  const stats = useMemo(() => {
    let activeCount = 0;
    let inactiveCount = 0;
    let totalPayroll = 0;
    const depts = new Set<string>();

    for (const emp of employees) {
      if (emp.isActive) {
        activeCount++;
        totalPayroll += emp.salary || 0;
      } else {
        inactiveCount++;
      }
      depts.add(resolveEmployeeDepartment(emp));
    }

    return {
      total: employees.length,
      active: activeCount,
      inactive: inactiveCount,
      payroll: totalPayroll,
      departmentCount: depts.size,
    };
  }, [employees, departmentMap]);

  // Bulk Selection
  const allSelected = filteredEmployees.length > 0 && filteredEmployees.every((e) => selectedIds.has(e.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmployees.map((e) => e.id)));
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    selectedHotels.length +
    selectedDepartments.length +
    selectedPositions.length +
    selectedStatuses.length +
    selectedSalaryRanges.length +
    (startDate || endDate ? 1 : 0);

  function clearAllFilters() {
    setSearchQuery("");
    setSelectedHotels([]);
    setSelectedDepartments([]);
    setSelectedPositions([]);
    setSelectedStatuses([]);
    setSelectedSalaryRanges([]);
    setStartDate("");
    setEndDate("");
    setDatePreset("all");
    setActiveTab("ALL");
  }

  // Deactivate/Delete Employee
  async function handleDeactivateEmployee(emp: AdminEmployee) {
    const codeOrId = emp.employeeCode || emp.id;
    if (!window.confirm(`Deactivate team member ${emp.name} (${codeOrId})?`)) return;
    try {
      await api.deleteEmployee(codeOrId);
      setNotice(`Team member ${emp.name} deactivated.`);
      await loadData();
    } catch (err) {
      setNotice(err instanceof Error ? `Could not deactivate: ${err.message}` : "Failed to deactivate employee.");
    }
  }

  // Excel Export
  function exportExcel() {
    if (filteredEmployees.length === 0) {
      setNotice("No employee records match current filters to export.");
      return;
    }
    const headers = [
      "Employee Code",
      "Full Name",
      "Email",
      "Phone",
      "Hotel",
      "Department",
      "Position / Role",
      "Salary (INR)",
      "Joining Date",
      "Status",
    ];

    const rows = filteredEmployees.map((e) => [
      e.employeeCode || e.id,
      e.name,
      e.email,
      e.phone || "",
      resolveEmployeeHotel(e),
      resolveEmployeeDepartment(e),
      e.position,
      e.salary || 0,
      e.joiningDate ? e.joiningDate.slice(0, 10) : "",
      e.isActive ? "Active" : "Inactive",
    ]);

    exportToExcel({
      filename: `employees_export_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Employees",
      headers,
      rows,
    });
    setNotice(`Exported ${filteredEmployees.length} employee records to Excel.`);
  }

  // Create Employee Form - Modal Department Options
  const modalDepartments = useMemo(() => {
    if (!createForm.hotelId) return departments;
    const selHotel = hotels.find((h) => (h.slug || h._id) === createForm.hotelId || h._id === createForm.hotelId);
    const filtered = departments.filter((d) => {
      if (selHotel) {
        return d.hotelId === selHotel.slug || d.hotelId === selHotel._id || d.hotelId === createForm.hotelId;
      }
      return d.hotelId === createForm.hotelId;
    });
    return filtered.length > 0 ? filtered : departments;
  }, [createForm.hotelId, departments, hotels]);

  async function handleCreateEmployee(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setNotice("");
    try {
      const payload: Record<string, unknown> = {
        hotelId: createForm.hotelId,
        departmentId: createForm.departmentId,
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim() || undefined,
        position: createForm.position.trim(),
        joiningDate: createForm.joiningDate,
        salary: createForm.salary ? Number(createForm.salary) : undefined,
      };

      await api.createEmployee(payload);
      setNotice(`Employee ${createForm.name} onboarded successfully!`);
      setCreateOpen(false);
      setCreateForm({
        hotelId: "",
        departmentId: "",
        name: "",
        email: "",
        phone: "",
        position: "",
        joiningDate: new Date().toISOString().slice(0, 10),
        salary: "",
      });
      await loadData();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to create employee.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="admin-page">
      {/* Top Page Heading */}
      <div className="admin-page-heading">
        <div>
          <div className="admin-eyebrow" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>WORKSPACE / HUMAN RESOURCES & STAFF</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#61DAFB", fontWeight: 600 }}>
              <ReactLogo size={12} /> React 19
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--admin-ink)", fontWeight: 600 }}>
              <NextjsLogo size={11} /> Next.js
            </span>
          </div>
          <h1>Employees</h1>
          <p>
            Enterprise workforce directory, hotel property assignments, departmental routing, and automated employee code sequencing.
          </p>
        </div>
        <div className="admin-heading-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={exportExcel}
            title="Export filtered records to Excel"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <DownloadIcon size={13} /> <span>Export to Excel</span>
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => window.print()}
            title="Print staff roster"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <PrinterIcon size={13} /> <span>Print</span>
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={loadData}
            title="Refresh database records"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshIcon size={13} /> <span>Refresh</span>
          </button>
          <button
            type="button"
            className="admin-primary-button"
            onClick={() => setCreateOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <PlusIcon size={13} /> <span>Add employee</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="admin-notice" role="status" style={{ marginBottom: "16px" }}>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} style={{ border: "none", background: "none", cursor: "pointer", marginLeft: "auto" }}>
            ×
          </button>
        </div>
      )}

      {/* KPI Stats Cards (Unified .admin-stats-grid) */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Total Team Members</span>
            <span className="admin-stat-icon">
              <UserIcon size={14} />
            </span>
          </div>
          <strong>{stats.total}</strong>
          <small>Active &amp; archived employees across hotels</small>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Active Staff</span>
            <span className="admin-stat-icon tone-1">
              <CheckIcon size={14} />
            </span>
          </div>
          <strong style={{ color: "#15803d" }}>{stats.active}</strong>
          <small>Currently scheduled &amp; assigned to operations</small>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Departments</span>
            <span className="admin-stat-icon tone-2">
              <BriefcaseIcon size={14} />
            </span>
          </div>
          <strong>{stats.departmentCount}</strong>
          <small>Operational departments staffed</small>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Monthly Payroll</span>
            <span className="admin-stat-icon tone-3">₹</span>
          </div>
          <strong>₹{stats.payroll.toLocaleString("en-IN")}</strong>
          <small>Total active monthly compensation</small>
        </div>
      </div>

      {/* Main Table Panel */}
      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>All Team Members</h2>
            <p>
              Showing {filteredEmployees.length} of {employees.length} database records
            </p>
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--admin-forest)",
                fontSize: "11px",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Clear all filters ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Quick Tabs */}
        <div className="admin-tabs" role="tablist" style={{ borderBottom: "1px solid var(--admin-line)" }}>
          {[
            { id: "ALL", label: `All staff (${employees.length})` },
            { id: "ACTIVE", label: `Active (${stats.active})` },
            { id: "INACTIVE", label: `Inactive (${stats.inactive})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "is-selected" : ""}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Multi-Select Filter Toolbar */}
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--admin-line)",
            backgroundColor: "#fcfdfe",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* 1. Free-Text Search */}
          <div className="admin-table-search" style={{ minWidth: "220px", flex: "1 1 200px" }}>
            <span>⌕</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, name, email, role, department..."
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#9aa59f", fontSize: "10px" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* 2. Hotel Multi-Select */}
          <div style={{ position: "relative" }} ref={hotelRef}>
            <button
              type="button"
              className={`admin-secondary-button ${selectedHotels.length > 0 ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setHotelDropdownOpen(!hotelDropdownOpen);
                setDeptDropdownOpen(false);
                setPositionDropdownOpen(false);
                setStatusDropdownOpen(false);
                setSalaryDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <BuildingIcon size={12} />
              <span>Hotel {selectedHotels.length > 0 ? `(${selectedHotels.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {hotelDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "240px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #f0f3f1", paddingBottom: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedHotels(uniqueHotels)}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "var(--admin-forest)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedHotels([])}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "#94a3b8", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                </div>
                {uniqueHotels.map((hName) => (
                  <label
                    key={hName}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedHotels.includes(hName)}
                      onChange={() => {
                        setSelectedHotels((prev) =>
                          prev.includes(hName) ? prev.filter((h) => h !== hName) : [...prev, hName]
                        );
                      }}
                    />
                    <span>{hName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 3. Department Multi-Select */}
          <div style={{ position: "relative" }} ref={deptRef}>
            <button
              type="button"
              className={`admin-secondary-button ${selectedDepartments.length > 0 ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setDeptDropdownOpen(!deptDropdownOpen);
                setHotelDropdownOpen(false);
                setPositionDropdownOpen(false);
                setStatusDropdownOpen(false);
                setSalaryDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <BriefcaseIcon size={12} />
              <span>Department {selectedDepartments.length > 0 ? `(${selectedDepartments.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {deptDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "230px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #f0f3f1", paddingBottom: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDepartments(uniqueDepartments)}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "var(--admin-forest)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDepartments([])}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "#94a3b8", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                </div>
                {uniqueDepartments.map((dName) => (
                  <label
                    key={dName}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepartments.includes(dName)}
                      onChange={() => {
                        setSelectedDepartments((prev) =>
                          prev.includes(dName) ? prev.filter((d) => d !== dName) : [...prev, dName]
                        );
                      }}
                    />
                    <span>{dName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 4. Position / Role Multi-Select */}
          <div style={{ position: "relative" }} ref={positionRef}>
            <button
              type="button"
              className={`admin-secondary-button ${selectedPositions.length > 0 ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setPositionDropdownOpen(!positionDropdownOpen);
                setHotelDropdownOpen(false);
                setDeptDropdownOpen(false);
                setStatusDropdownOpen(false);
                setSalaryDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <UserIcon size={12} />
              <span>Position {selectedPositions.length > 0 ? `(${selectedPositions.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {positionDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "230px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #f0f3f1", paddingBottom: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPositions(uniquePositions)}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "var(--admin-forest)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPositions([])}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "#94a3b8", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                </div>
                {uniquePositions.map((pName) => (
                  <label
                    key={pName}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPositions.includes(pName)}
                      onChange={() => {
                        setSelectedPositions((prev) =>
                          prev.includes(pName) ? prev.filter((p) => p !== pName) : [...prev, pName]
                        );
                      }}
                    />
                    <span>{pName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 5. Status Multi-Select */}
          <div style={{ position: "relative" }} ref={statusRef}>
            <button
              type="button"
              className={`admin-secondary-button ${selectedStatuses.length > 0 ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setStatusDropdownOpen(!statusDropdownOpen);
                setHotelDropdownOpen(false);
                setDeptDropdownOpen(false);
                setPositionDropdownOpen(false);
                setSalaryDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <FilterIcon size={12} />
              <span>Status {selectedStatuses.length > 0 ? `(${selectedStatuses.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {statusDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "170px",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #f0f3f1", paddingBottom: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedStatuses(["ACTIVE", "INACTIVE"])}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "var(--admin-forest)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatuses([])}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "#94a3b8", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                </div>
                {[
                  { id: "ACTIVE", label: "Active" },
                  { id: "INACTIVE", label: "Inactive" },
                ].map((s) => (
                  <label
                    key={s.id}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(s.id)}
                      onChange={() => {
                        setSelectedStatuses((prev) =>
                          prev.includes(s.id) ? prev.filter((item) => item !== s.id) : [...prev, s.id]
                        );
                      }}
                    />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 6. Salary Multi-Select */}
          <div style={{ position: "relative" }} ref={salaryRef}>
            <button
              type="button"
              className={`admin-secondary-button ${selectedSalaryRanges.length > 0 ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setSalaryDropdownOpen(!salaryDropdownOpen);
                setHotelDropdownOpen(false);
                setDeptDropdownOpen(false);
                setPositionDropdownOpen(false);
                setStatusDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <span>Salary {selectedSalaryRanges.length > 0 ? `(${selectedSalaryRanges.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {salaryDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "190px",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #f0f3f1", paddingBottom: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedSalaryRanges(["under25k", "25k-50k", "50k-100k", "100kplus"])}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "var(--admin-forest)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSalaryRanges([])}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "#94a3b8", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                </div>
                {[
                  { id: "under25k", label: "Under ₹25,000" },
                  { id: "25k-50k", label: "₹25,000 – ₹50,000" },
                  { id: "50k-100k", label: "₹50,000 – ₹1,00,000" },
                  { id: "100kplus", label: "Over ₹1,00,000" },
                ].map((range) => (
                  <label
                    key={range.id}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSalaryRanges.includes(range.id)}
                      onChange={() => {
                        setSelectedSalaryRanges((prev) =>
                          prev.includes(range.id) ? prev.filter((r) => r !== range.id) : [...prev, range.id]
                        );
                      }}
                    />
                    <span>{range.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 7. Joining Date Filter */}
          <div style={{ position: "relative" }} ref={dateRef}>
            <button
              type="button"
              className={`admin-secondary-button ${startDate || endDate ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setDateDropdownOpen(!dateDropdownOpen);
                setHotelDropdownOpen(false);
                setDeptDropdownOpen(false);
                setPositionDropdownOpen(false);
                setStatusDropdownOpen(false);
                setSalaryDropdownOpen(false);
              }}
            >
              <CalendarIcon size={12} />
              <span>
                {startDate && endDate
                  ? `${startDate} → ${endDate}`
                  : startDate
                    ? `From ${startDate}`
                    : endDate
                      ? `Until ${endDate}`
                      : "Joining Date"}
              </span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {dateDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  right: 0,
                  zIndex: 50,
                  width: "270px",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "12px",
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <label style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    QUICK PRESETS
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                    {[
                      { id: "all", label: "All dates" },
                      { id: "month", label: "Last 30 days" },
                      { id: "3months", label: "Last 90 days" },
                      { id: "year", label: "This year" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        style={{
                          padding: "4px 6px",
                          fontSize: "10px",
                          border: "1px solid var(--admin-line)",
                          borderRadius: "4px",
                          backgroundColor: datePreset === p.id ? "var(--admin-forest)" : "#fff",
                          color: datePreset === p.id ? "#fff" : "inherit",
                          cursor: "pointer",
                        }}
                        onClick={() => handlePresetChange(p.id as any)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "9px", color: "#64748b", display: "block" }}>From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDatePreset("custom");
                      }}
                      style={{ width: "100%", height: "28px", fontSize: "10px", border: "1px solid var(--admin-line)", borderRadius: "4px", padding: "0 4px" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "9px", color: "#64748b", display: "block" }}>To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setDatePreset("custom");
                      }}
                      style={{ width: "100%", height: "28px", fontSize: "10px", border: "1px solid var(--admin-line)", borderRadius: "4px", padding: "0 4px" }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setDatePreset("all");
                    setDateDropdownOpen(false);
                  }}
                  style={{ width: "100%", padding: "4px", fontSize: "10px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#475569" }}
                >
                  Clear Date Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Employees Table */}
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "36px" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all team members"
                  />
                </th>
                <th>EMPLOYEE CODE</th>
                <th style={{ minWidth: "180px" }}>TEAM MEMBER</th>
                <th>HOTEL</th>
                <th style={{ minWidth: "130px" }}>DEPARTMENT</th>
                <th>POSITION / ROLE</th>
                <th>SALARY</th>
                <th>JOINING DATE</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                    Loading employee records...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="admin-empty" style={{ padding: "40px 16px", textAlign: "center" }}>
                      <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#334155" }}>
                        No employees match your selected filters
                      </p>
                      <small style={{ color: "#64748b" }}>
                        Try clearing some filter criteria or onboard a new employee.
                      </small>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const hotelName = resolveEmployeeHotel(emp);
                  const deptName = resolveEmployeeDepartment(emp);
                  const code = emp.employeeCode || emp.id;

                  return (
                    <tr key={emp.id} className={selectedIds.has(emp.id) ? "is-selected-row" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(emp.id)}
                          onChange={() => toggleSelectRow(emp.id)}
                          aria-label={`Select ${emp.name}`}
                        />
                      </td>

                      {/* Employee Code */}
                      <td className="admin-id" style={{ fontSize: "11px", fontWeight: 600, fontFamily: "monospace" }}>
                        <Link
                          className="admin-row-detail-link"
                          href={`/admin/employees/${encodeURIComponent(code)}`}
                          style={{ color: "var(--admin-forest)" }}
                        >
                          {code}
                        </Link>
                      </td>

                      {/* Name & Contact */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <strong className="admin-row-name" style={{ fontSize: "12px", color: "#1e293b" }}>
                            {emp.name}
                          </strong>
                          <span style={{ fontSize: "10px", color: "#64748b" }}>
                            {emp.email}
                            {emp.phone ? ` · ${emp.phone}` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Hotel */}
                      <td>
                        <div style={{ fontSize: "11px", fontWeight: 500, color: "#334155" }}>
                          {hotelName}
                        </div>
                      </td>

                      {/* Department */}
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: 600,
                            backgroundColor: deptName.toLowerCase().includes("housekeeping")
                              ? "#f0fdf4"
                              : deptName.toLowerCase().includes("front")
                                ? "#eff6ff"
                                : deptName.toLowerCase().includes("kitchen") || deptName.toLowerCase().includes("food")
                                  ? "#fff7ed"
                                  : "#f1f5f9",
                            color: deptName.toLowerCase().includes("housekeeping")
                              ? "#166534"
                              : deptName.toLowerCase().includes("front")
                                ? "#1d4ed8"
                                : deptName.toLowerCase().includes("kitchen") || deptName.toLowerCase().includes("food")
                                  ? "#c2410c"
                                  : "#475569",
                            border: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          <BriefcaseIcon size={10} />
                          <span>{deptName}</span>
                        </span>
                      </td>

                      {/* Position / Role */}
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: 500,
                            backgroundColor: "#f8fafc",
                            color: "#334155",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {emp.position}
                        </span>
                      </td>

                      {/* Salary */}
                      <td style={{ fontSize: "11px", fontWeight: 600, color: "#1e293b" }}>
                        {emp.salary ? `₹${emp.salary.toLocaleString("en-IN")}` : "—"}
                      </td>

                      {/* Joining Date */}
                      <td className="admin-date-cell" style={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                        {emp.joiningDate ? emp.joiningDate.slice(0, 10) : "—"}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: 600,
                            backgroundColor: emp.isActive ? "#dcfce7" : "#fee2e2",
                            color: emp.isActive ? "#166534" : "#991b1b",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              backgroundColor: emp.isActive ? "#16a34a" : "#dc2626",
                            }}
                          />
                          <span>{emp.isActive ? "Active" : "Inactive"}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="admin-secondary-button"
                          style={{ height: "24px", fontSize: "10px", padding: "0 8px", color: emp.isActive ? "#b91c1c" : "#64748b" }}
                          onClick={() => handleDeactivateEmployee(emp)}
                          title="Deactivate employee record"
                        >
                          {emp.isActive ? "Deactivate" : "Remove"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Employee Modal */}
      {createOpen && (
        <div
          className="admin-dialog-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreateOpen(false);
          }}
        >
          <form className="admin-dialog" onSubmit={handleCreateEmployee} style={{ maxWidth: "560px" }}>
            <div className="admin-dialog-heading">
              <div>
                <span className="admin-eyebrow">NEW RECORD</span>
                <h2>Onboard Team Member</h2>
              </div>
              <button
                type="button"
                className="admin-row-menu"
                aria-label="Close dialog"
                onClick={() => setCreateOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-dialog-fields">
              {/* Hotel */}
              <label>
                Hotel
                <select
                  required
                  value={createForm.hotelId}
                  onChange={(e) => {
                    const hId = e.target.value;
                    setCreateForm((prev) => ({ ...prev, hotelId: hId, departmentId: "" }));
                  }}
                >
                  <option value="">Select a hotel</option>
                  {hotels.map((h) => (
                    <option key={h._id || h.slug} value={h.slug || h._id}>
                      {h.name} · {h.city || h.slug}
                    </option>
                  ))}
                </select>
              </label>

              {/* Department (dynamically filtered by chosen hotel) */}
              <label>
                Department
                <select
                  required
                  value={createForm.departmentId}
                  disabled={!createForm.hotelId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                >
                  <option value="">
                    {!createForm.hotelId
                      ? "Select a hotel first"
                      : modalDepartments.length === 0
                        ? "No departments for this hotel"
                        : "Select department"}
                  </option>
                  {modalDepartments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Full Name */}
              <label>
                Full name
                <input
                  required
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </label>

              {/* Email */}
              <label>
                Email
                <input
                  required
                  type="email"
                  placeholder="e.g. rahul@stayease.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </label>

              {/* Phone */}
              <label>
                Phone number
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </label>

              {/* Position / Role */}
              <label>
                Position / Role
                <input
                  required
                  type="text"
                  placeholder="e.g. Front Desk Officer"
                  value={createForm.position}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, position: e.target.value }))}
                />
              </label>

              {/* Joining Date */}
              <label>
                Joining date
                <input
                  required
                  type="date"
                  value={createForm.joiningDate}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, joiningDate: e.target.value }))}
                />
              </label>

              {/* Salary */}
              <label>
                Salary (INR)
                <input
                  type="number"
                  placeholder="e.g. 35000"
                  value={createForm.salary}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, salary: e.target.value }))}
                />
              </label>
            </div>

            <div className="admin-dialog-actions" style={{ marginTop: "20px" }}>
              <button type="button" className="admin-secondary-button" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="admin-primary-button"
                disabled={creating || !createForm.hotelId || !createForm.departmentId || !createForm.name || !createForm.email}
              >
                {creating ? "Onboarding..." : "Save record"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

