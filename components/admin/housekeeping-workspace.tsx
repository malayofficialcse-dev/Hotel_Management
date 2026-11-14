"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  api,
  type HousekeepingTask,
  type AdminHotel,
  type AdminRoom,
  type AdminDepartment,
  type AdminEmployee,
  type AdminBooking,
} from "@/lib/api-client";
import { exportToExcel } from "@/lib/export-excel";
import {
  BuildingIcon,
  BedIcon,
  CalendarIcon,
  FilterIcon,
  PrinterIcon,
  DownloadIcon,
  RefreshIcon,
  PlusIcon,
  CheckIcon,
  BriefcaseIcon,
  SparklesIcon,
  ReactLogo,
  NextjsLogo,
} from "@/components/icons";

const TASK_STATUSES = [
  { value: "DIRTY", label: "Dirty" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CLEAN", label: "Clean" },
  { value: "INSPECTED", label: "Inspected" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

const TASK_TYPES = [
  { value: "CLEAN", label: "Daily Clean" },
  { value: "CHECKOUT CLEAN", label: "Checkout Clean" },
  { value: "DEEP CLEAN", label: "Deep Clean" },
  { value: "INSPECTION", label: "Room Inspection" },
  { value: "REPAIR", label: "Maintenance / Repair" },
  { value: "TURNDOWN", label: "Evening Turndown" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "#64748b" },
  { value: "NORMAL", label: "Normal", color: "#0ea5e9" },
  { value: "HIGH", label: "High", color: "#f59e0b" },
  { value: "URGENT", label: "Urgent", color: "#ef4444" },
];

export function HousekeepingWorkspace() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [hotels, setHotels] = useState<AdminHotel[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [reservations, setReservations] = useState<AdminBooking[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter States (All Multiple Selection)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // Date Filter States
  const [dateField, setDateField] = useState<"taskDate" | "createdAt">("taskDate");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "tomorrow" | "7days" | "month" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Dropdown Popover States
  const [hotelDropdownOpen, setHotelDropdownOpen] = useState(false);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [roomDropdownOpen, setRoomDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [taskTypeDropdownOpen, setTaskTypeDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const hotelRef = useRef<HTMLDivElement>(null);
  const deptRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const taskTypeRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Create Task Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    hotelId: "",
    departmentId: "",
    roomNumber: "",
    taskDate: new Date().toISOString().slice(0, 10),
    taskType: "CLEAN",
    assignedTo: "",
    priority: "NORMAL",
  });

  // Click outside to close filter popovers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (hotelRef.current && !hotelRef.current.contains(target)) setHotelDropdownOpen(false);
      if (deptRef.current && !deptRef.current.contains(target)) setDeptDropdownOpen(false);
      if (roomRef.current && !roomRef.current.contains(target)) setRoomDropdownOpen(false);
      if (statusRef.current && !statusRef.current.contains(target)) setStatusDropdownOpen(false);
      if (taskTypeRef.current && !taskTypeRef.current.contains(target)) setTaskTypeDropdownOpen(false);
      if (priorityRef.current && !priorityRef.current.contains(target)) setPriorityDropdownOpen(false);
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
      const [tasksRes, hotelsRes, roomsRes, deptsRes, empsRes, resRes] = await Promise.allSettled([
        api.getAdminHousekeepingTasks(),
        api.getAdminHotels(),
        api.getAdminRooms(),
        api.getAdminDepartments(),
        api.getAdminEmployees(),
        api.getAdminReservations(),
      ]);

      if (tasksRes.status === "fulfilled") setTasks(tasksRes.value || []);
      else setLoadFailed(true);

      if (hotelsRes.status === "fulfilled") setHotels(hotelsRes.value || []);
      if (roomsRes.status === "fulfilled") setRooms(roomsRes.value || []);
      if (deptsRes.status === "fulfilled") setDepartments(deptsRes.value || []);
      if (empsRes.status === "fulfilled") setEmployees(empsRes.value || []);
      if (resRes.status === "fulfilled") setReservations(resRes.value?.bookings || []);
    } catch (err) {
      setLoadFailed(true);
      setNotice(err instanceof Error ? err.message : "Failed to load housekeeping data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Helper map: Employee Code/ID -> Employee
  const employeeMap = useMemo(() => {
    const map = new Map<string, AdminEmployee>();
    for (const emp of employees) {
      if (emp.id) map.set(emp.id, emp);
      if (emp.employeeCode) map.set(emp.employeeCode, emp);
    }
    return map;
  }, [employees]);

  // Helper map: Department ID -> Department Name
  const departmentMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of departments) {
      map.set(d._id, d.name);
    }
    return map;
  }, [departments]);

  // Helper map: Hotel ID/slug -> Hotel Name
  const hotelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of hotels) {
      if (h._id) map.set(h._id, h.name);
      if (h.slug) map.set(h.slug, h.name);
    }
    return map;
  }, [hotels]);

  // Helper function: Resolve department for a housekeeping task
  function resolveTaskDepartment(task: HousekeepingTask): string {
    if (task.departmentName) return task.departmentName;
    if (task.departmentId && departmentMap.has(task.departmentId)) {
      return departmentMap.get(task.departmentId)!;
    }
    if (task.assignedTo) {
      const emp = employeeMap.get(task.assignedTo);
      if (emp?.department?.name) return emp.department.name;
      if (emp?.departmentId && departmentMap.has(emp.departmentId)) {
        return departmentMap.get(emp.departmentId)!;
      }
    }
    // Default to Housekeeping
    return "Housekeeping";
  }

  // Distinct options for filters
  const uniqueHotels = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) {
      const name = hotelMap.get(t.hotelId) || t.hotelId;
      if (name) set.add(name);
    }
    for (const h of hotels) {
      if (h.name) set.add(h.name);
    }
    return Array.from(set).sort();
  }, [tasks, hotels, hotelMap]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) {
      set.add(resolveTaskDepartment(t));
    }
    for (const d of departments) {
      if (d.name) set.add(d.name);
    }
    if (set.size === 0) set.add("Housekeeping");
    return Array.from(set).sort();
  }, [tasks, departments, departmentMap, employeeMap]);

  const uniqueRooms = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) {
      if (t.roomNumber) set.add(t.roomNumber);
    }
    return Array.from(set).sort();
  }, [tasks]);

  // Date Preset Handler
  function handlePresetChange(preset: "all" | "today" | "tomorrow" | "7days" | "month" | "custom") {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "tomorrow") {
      const tmrw = new Date(now.getTime() + 86400000).toISOString().split("T")[0];
      setStartDate(tmrw);
      setEndDate(tmrw);
    } else if (preset === "7days") {
      const past = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
      const future = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];
      setStartDate(past);
      setEndDate(future);
    } else if (preset === "month") {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      setStartDate(`${y}-${m}-01`);
      setEndDate(new Date(y, now.getMonth() + 1, 0).toISOString().split("T")[0]);
    }
  }

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Quick Tab Filter
      if (activeTab !== "ALL") {
        if (t.status.toUpperCase() !== activeTab) return false;
      }

      // 2. Free Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hotelName = (hotelMap.get(t.hotelId) || t.hotelId || "").toLowerCase();
        const deptName = resolveTaskDepartment(t).toLowerCase();
        const emp = employeeMap.get(t.assignedTo || "");
        const empName = emp ? emp.name.toLowerCase() : "";
        const empCode = emp?.employeeCode ? emp.employeeCode.toLowerCase() : "";

        const match =
          t.roomNumber.toLowerCase().includes(q) ||
          hotelName.includes(q) ||
          deptName.includes(q) ||
          (t.guestName || "").toLowerCase().includes(q) ||
          (t.bookingReference || "").toLowerCase().includes(q) ||
          (t.taskType || "").toLowerCase().includes(q) ||
          (t.assignedTo || "").toLowerCase().includes(q) ||
          empName.includes(q) ||
          empCode.includes(q) ||
          t.status.toLowerCase().includes(q) ||
          (t.priority || "").toLowerCase().includes(q);

        if (!match) return false;
      }

      // 3. Hotel Multi-Select
      if (selectedHotels.length > 0) {
        const hotelName = hotelMap.get(t.hotelId) || t.hotelId;
        if (!hotelName || !selectedHotels.includes(hotelName)) return false;
      }

      // 4. Department Multi-Select
      if (selectedDepartments.length > 0) {
        const dept = resolveTaskDepartment(t);
        if (!selectedDepartments.includes(dept)) return false;
      }

      // 5. Room Multi-Select
      if (selectedRooms.length > 0) {
        if (!selectedRooms.includes(t.roomNumber)) return false;
      }

      // 6. Status Multi-Select
      if (selectedStatuses.length > 0) {
        if (!selectedStatuses.includes(t.status.toUpperCase())) return false;
      }

      // 7. Task Type Multi-Select
      if (selectedTaskTypes.length > 0) {
        const currentType = (t.taskType || "CLEAN").toUpperCase();
        if (!selectedTaskTypes.includes(currentType)) return false;
      }

      // 8. Priority Multi-Select
      if (selectedPriorities.length > 0) {
        const currentPriority = (t.priority || "NORMAL").toUpperCase();
        if (!selectedPriorities.includes(currentPriority)) return false;
      }

      // 9. Date Range Filter
      if (startDate || endDate) {
        const targetStr = dateField === "taskDate" ? (t.taskDate || t.createdAt || "") : (t.createdAt || "");
        if (targetStr) {
          const itemDate = new Date(targetStr.slice(0, 10)).getTime();
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
    tasks,
    activeTab,
    searchQuery,
    selectedHotels,
    selectedDepartments,
    selectedRooms,
    selectedStatuses,
    selectedTaskTypes,
    selectedPriorities,
    dateField,
    startDate,
    endDate,
    hotelMap,
    departmentMap,
    employeeMap,
  ]);

  // KPI Stats
  const stats = useMemo(() => {
    let dirtyCount = 0;
    let inProgressCount = 0;
    let cleanCount = 0;
    let maintenanceCount = 0;

    for (const t of tasks) {
      const st = t.status.toUpperCase();
      if (st === "DIRTY") dirtyCount++;
      else if (st === "IN_PROGRESS") inProgressCount++;
      else if (st === "CLEAN" || st === "INSPECTED") cleanCount++;
      else if (st === "MAINTENANCE") maintenanceCount++;
    }

    return {
      total: tasks.length,
      dirty: dirtyCount,
      inProgress: inProgressCount,
      clean: cleanCount,
      maintenance: maintenanceCount,
    };
  }, [tasks]);

  // Bulk Select
  const allSelected = filteredTasks.length > 0 && filteredTasks.every((t) => selectedIds.has(t._id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map((t) => t._id)));
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
    selectedRooms.length +
    selectedStatuses.length +
    selectedTaskTypes.length +
    selectedPriorities.length +
    (startDate || endDate ? 1 : 0);

  function clearAllFilters() {
    setSearchQuery("");
    setSelectedHotels([]);
    setSelectedDepartments([]);
    setSelectedRooms([]);
    setSelectedStatuses([]);
    setSelectedTaskTypes([]);
    setSelectedPriorities([]);
    setStartDate("");
    setEndDate("");
    setDatePreset("all");
    setActiveTab("ALL");
  }

  // Quick Status Transition
  async function handleStatusTransition(task: HousekeepingTask) {
    const transitions: Record<string, string> = {
      DIRTY: "IN_PROGRESS",
      IN_PROGRESS: "CLEAN",
      CLEAN: "INSPECTED",
      INSPECTED: "DIRTY",
      MAINTENANCE: "DIRTY",
    };
    const nextStatus = transitions[task.status.toUpperCase()] || "IN_PROGRESS";
    try {
      await api.updateHousekeepingTask(task._id, { status: nextStatus });
      setNotice(`Room ${task.roomNumber} marked ${nextStatus.toLowerCase().replaceAll("_", " ")}.`);
      await loadData();
    } catch (err) {
      setNotice(err instanceof Error ? `Could not update: ${err.message}` : "Failed to update task status.");
    }
  }

  async function handleDeleteTask(task: HousekeepingTask) {
    if (!window.confirm(`Delete housekeeping task for Room ${task.roomNumber}?`)) return;
    try {
      await api.deleteHousekeepingTask(task._id);
      setNotice(`Task for Room ${task.roomNumber} removed.`);
      await loadData();
    } catch (err) {
      setNotice(err instanceof Error ? `Could not delete: ${err.message}` : "Failed to delete task.");
    }
  }

  // Excel Export
  function exportExcel() {
    if (filteredTasks.length === 0) {
      setNotice("No tasks match current filters to export.");
      return;
    }
    const headers = [
      "Task ID",
      "Room",
      "Hotel",
      "Department",
      "Task Type",
      "Scheduled Date",
      "Guest Name",
      "Booking Reference",
      "Guest Contact",
      "Stay Window",
      "Assigned Employee",
      "Priority",
      "Status",
      "Created At",
    ];

    const rows = filteredTasks.map((t) => {
      const hotelName = hotelMap.get(t.hotelId) || t.hotelId;
      const deptName = resolveTaskDepartment(t);
      const emp = employeeMap.get(t.assignedTo || "");
      const empText = emp ? `${emp.name} (${emp.employeeCode || emp.id})` : t.assignedTo || "Unassigned";
      return [
        t._id,
        t.roomNumber,
        hotelName,
        deptName,
        t.taskType || "CLEAN",
        t.taskDate || "",
        t.guestName || "Vacant",
        t.bookingReference || "",
        `${t.guestEmail || ""}${t.guestPhone ? ` / ${t.guestPhone}` : ""}`,
        `${t.checkInDate || ""} to ${t.checkOutDate || ""}`,
        empText,
        t.priority || "NORMAL",
        t.status,
        t.createdAt || "",
      ];
    });

    exportToExcel({
      filename: `housekeeping_export_${new Date().toISOString().split("T")[0]}`,
      sheetName: "Housekeeping",
      headers,
      rows,
    });
    setNotice(`Exported ${filteredTasks.length} housekeeping records to Excel.`);
  }

  // Create Task: Dynamically filter rooms & departments by selected hotel
  const modalRooms = useMemo(() => {
    if (!createForm.hotelId) return [];
    const selHotel = hotels.find((h) => (h.slug || h._id) === createForm.hotelId || h._id === createForm.hotelId);
    return rooms.filter((r) => {
      if (selHotel) {
        return r.hotelId === selHotel.slug || r.hotelId === selHotel._id || r.hotelId === createForm.hotelId;
      }
      return r.hotelId === createForm.hotelId;
    });
  }, [createForm.hotelId, rooms, hotels]);

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

  // Create Task: Real-Time Guest Lookup
  const modalMatchedGuest = useMemo(() => {
    if (!createForm.hotelId || !createForm.roomNumber || !createForm.taskDate) return null;
    const dateStr = createForm.taskDate.slice(0, 10);
    const selHotel = hotels.find((h) => (h.slug || h._id) === createForm.hotelId || h._id === createForm.hotelId);
    const selRoom = rooms.find(
      (r) =>
        r.name === createForm.roomNumber &&
        (selHotel ? r.hotelId === selHotel.slug || r.hotelId === selHotel._id || r.hotelId === createForm.hotelId : true),
    );

    return (
      reservations.find((b) => {
        if (b.status === "CANCELLED" || b.status === "EXPIRED") return false;
        const hotelMatch =
          b.hotel_id === createForm.hotelId ||
          (selHotel &&
            (b.hotel_id === selHotel.slug ||
              b.hotel_id === selHotel._id ||
              b.hotel_name.toLowerCase() === selHotel.name.toLowerCase()));
        if (!hotelMatch) return false;

        const roomMatch =
          (b.room_type_name && b.room_type_name.toLowerCase() === createForm.roomNumber.toLowerCase()) ||
          (selRoom && b.room_type_id === selRoom._id);
        if (!roomMatch) return false;

        const checkIn = b.check_in_date.slice(0, 10);
        const checkOut = b.check_out_date.slice(0, 10);
        return dateStr >= checkIn && dateStr <= checkOut;
      }) || null
    );
  }, [createForm.hotelId, createForm.roomNumber, createForm.taskDate, reservations, hotels, rooms]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setNotice("");
    try {
      const selDept = departments.find((d) => d._id === createForm.departmentId);
      const payload: Record<string, unknown> = {
        hotelId: createForm.hotelId,
        departmentId: createForm.departmentId || undefined,
        departmentName: selDept ? selDept.name : "Housekeeping",
        roomNumber: createForm.roomNumber,
        taskDate: createForm.taskDate,
        taskType: createForm.taskType,
        assignedTo: createForm.assignedTo || undefined,
        priority: createForm.priority,
      };

      if (modalMatchedGuest) {
        payload.guestName = `${modalMatchedGuest.guest_first_name} ${modalMatchedGuest.guest_last_name}`.trim();
        payload.guestEmail = modalMatchedGuest.guest_email || "";
        payload.guestPhone = modalMatchedGuest.guest_phone || "";
        payload.bookingReference = modalMatchedGuest.booking_code || "";
        payload.checkInDate = modalMatchedGuest.check_in_date;
        payload.checkOutDate = modalMatchedGuest.check_out_date;
      } else {
        payload.guestName = "Vacant";
      }

      await api.createHousekeepingTask(payload);
      setNotice(`Housekeeping task for Room ${createForm.roomNumber} created successfully.`);
      setCreateOpen(false);
      setCreateForm({
        hotelId: "",
        departmentId: "",
        roomNumber: "",
        taskDate: new Date().toISOString().slice(0, 10),
        taskType: "CLEAN",
        assignedTo: "",
        priority: "NORMAL",
      });
      await loadData();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to create housekeeping task.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="admin-page">
      {/* Top Page Header */}
      <div className="admin-page-heading">
        <div>
          <div className="admin-eyebrow" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>WORKSPACE / HOUSEKEEPING & MAINTENANCE</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#61DAFB", fontWeight: 600 }}>
              <ReactLogo size={12} /> React 19
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--admin-ink)", fontWeight: 600 }}>
              <NextjsLogo size={11} /> Next.js
            </span>
          </div>
          <h1>Housekeeping</h1>
          <p>
            Real-time room turns, department routing, scheduled cleaning assignments, and live guest occupancy auditing.
          </p>
        </div>
        <div className="admin-heading-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={exportExcel}
            title="Export filtered housekeeping records to Excel"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <DownloadIcon size={13} /> <span>Export to Excel</span>
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => window.print()}
            title="Print housekeeping assignments"
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
            <PlusIcon size={13} /> <span>Create task</span>
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

      {/* KPI Stats Banner */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Total Tasks</span>
            <span className="admin-stat-icon">
              <SparklesIcon size={14} />
            </span>
          </div>
          <strong>{stats.total}</strong>
          <small>Tracked housekeeping tasks across portfolio</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Dirty / Attention</span>
            <span className="admin-stat-icon tone-3">
              <BedIcon size={14} />
            </span>
          </div>
          <strong style={{ color: stats.dirty > 0 ? "#b45309" : "inherit" }}>{stats.dirty}</strong>
          <small>Rooms pending turnover or initial servicing</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>In Progress</span>
            <span className="admin-stat-icon tone-1">
              <BriefcaseIcon size={14} />
            </span>
          </div>
          <strong>{stats.inProgress}</strong>
          <small>Active cleaning and servicing in progress</small>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Clean & Inspected</span>
            <span className="admin-stat-icon tone-0">
              <CheckIcon size={14} />
            </span>
          </div>
          <strong style={{ color: "#15803d" }}>{stats.clean}</strong>
          <small>Ready for guest check-in and release</small>
        </div>
      </div>

      {/* Main Table Panel */}
      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>All Housekeeping Tasks</h2>
            <p>
              Showing {filteredTasks.length} of {tasks.length} database records
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

        {/* Quick Filter Tabs */}
        <div className="admin-tabs" role="tablist" style={{ borderBottom: "1px solid var(--admin-line)" }}>
          {[
            { id: "ALL", label: `All tasks (${tasks.length})` },
            { id: "DIRTY", label: `Dirty (${stats.dirty})` },
            { id: "IN_PROGRESS", label: `In Progress (${stats.inProgress})` },
            { id: "CLEAN", label: `Clean (${tasks.filter((t) => t.status.toUpperCase() === "CLEAN").length})` },
            { id: "INSPECTED", label: `Inspected (${tasks.filter((t) => t.status.toUpperCase() === "INSPECTED").length})` },
            { id: "MAINTENANCE", label: `Maintenance (${stats.maintenance})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "is-selected" : ""}
              onClick={() => setActiveTab(tab.id)}
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
          {/* 1. Free-Text Search Input */}
          <div className="admin-table-search" style={{ minWidth: "220px", flex: "1 1 200px" }}>
            <span>⌕</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room, hotel, department, guest, employee..."
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
                setRoomDropdownOpen(false);
                setStatusDropdownOpen(false);
                setTaskTypeDropdownOpen(false);
                setPriorityDropdownOpen(false);
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
                {uniqueHotels.map((hotelName) => (
                  <label
                    key={hotelName}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedHotels.includes(hotelName)}
                      onChange={() => {
                        setSelectedHotels((prev) =>
                          prev.includes(hotelName) ? prev.filter((h) => h !== hotelName) : [...prev, hotelName]
                        );
                      }}
                    />
                    <span>{hotelName}</span>
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
                setRoomDropdownOpen(false);
                setStatusDropdownOpen(false);
                setTaskTypeDropdownOpen(false);
                setPriorityDropdownOpen(false);
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
                {uniqueDepartments.map((deptName) => (
                  <label
                    key={deptName}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepartments.includes(deptName)}
                      onChange={() => {
                        setSelectedDepartments((prev) =>
                          prev.includes(deptName) ? prev.filter((d) => d !== deptName) : [...prev, deptName]
                        );
                      }}
                    />
                    <span>{deptName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 4. Room Multi-Select */}
          <div style={{ position: "relative" }} ref={roomRef}>
            <button
              type="button"
              className={`admin-secondary-button ${selectedRooms.length > 0 ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setRoomDropdownOpen(!roomDropdownOpen);
                setHotelDropdownOpen(false);
                setDeptDropdownOpen(false);
                setStatusDropdownOpen(false);
                setTaskTypeDropdownOpen(false);
                setPriorityDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <BedIcon size={12} />
              <span>Room {selectedRooms.length > 0 ? `(${selectedRooms.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {roomDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "200px",
                  maxHeight: "260px",
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
                    onClick={() => setSelectedRooms(uniqueRooms)}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "var(--admin-forest)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRooms([])}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "#94a3b8", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                </div>
                {uniqueRooms.map((roomName) => (
                  <label
                    key={roomName}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(roomName)}
                      onChange={() => {
                        setSelectedRooms((prev) =>
                          prev.includes(roomName) ? prev.filter((r) => r !== roomName) : [...prev, roomName]
                        );
                      }}
                    />
                    <span>{roomName}</span>
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
                setRoomDropdownOpen(false);
                setTaskTypeDropdownOpen(false);
                setPriorityDropdownOpen(false);
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
                  width: "180px",
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
                    onClick={() => setSelectedStatuses(TASK_STATUSES.map((s) => s.value))}
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
                {TASK_STATUSES.map((status) => (
                  <label
                    key={status.value}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status.value)}
                      onChange={() => {
                        setSelectedStatuses((prev) =>
                          prev.includes(status.value) ? prev.filter((s) => s !== status.value) : [...prev, status.value]
                        );
                      }}
                    />
                    <span>{status.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 6. Task Type Multi-Select */}
          <div style={{ position: "relative" }} ref={taskTypeRef}>
            <button
              type="button"
              className={`admin-secondary-button ${selectedTaskTypes.length > 0 ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setTaskTypeDropdownOpen(!taskTypeDropdownOpen);
                setHotelDropdownOpen(false);
                setDeptDropdownOpen(false);
                setRoomDropdownOpen(false);
                setStatusDropdownOpen(false);
                setPriorityDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <SparklesIcon size={12} />
              <span>Task Type {selectedTaskTypes.length > 0 ? `(${selectedTaskTypes.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {taskTypeDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "210px",
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
                    onClick={() => setSelectedTaskTypes(TASK_TYPES.map((t) => t.value))}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "var(--admin-forest)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTaskTypes([])}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "#94a3b8", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                </div>
                {TASK_TYPES.map((type) => (
                  <label
                    key={type.value}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTaskTypes.includes(type.value)}
                      onChange={() => {
                        setSelectedTaskTypes((prev) =>
                          prev.includes(type.value) ? prev.filter((t) => t !== type.value) : [...prev, type.value]
                        );
                      }}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 7. Priority Multi-Select */}
          <div style={{ position: "relative" }} ref={priorityRef}>
            <button
              type="button"
              className={`admin-secondary-button ${selectedPriorities.length > 0 ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setPriorityDropdownOpen(!priorityDropdownOpen);
                setHotelDropdownOpen(false);
                setDeptDropdownOpen(false);
                setRoomDropdownOpen(false);
                setStatusDropdownOpen(false);
                setTaskTypeDropdownOpen(false);
                setDateDropdownOpen(false);
              }}
            >
              <span>Priority {selectedPriorities.length > 0 ? `(${selectedPriorities.length})` : ""}</span>
              <span style={{ fontSize: "8px" }}>⌄</span>
            </button>

            {priorityDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: 0,
                  zIndex: 50,
                  width: "160px",
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
                    onClick={() => setSelectedPriorities(PRIORITIES.map((p) => p.value))}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "var(--admin-forest)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPriorities([])}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "#94a3b8", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                </div>
                {PRIORITIES.map((p) => (
                  <label
                    key={p.value}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 6px", fontSize: "11px", cursor: "pointer", borderRadius: "4px" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPriorities.includes(p.value)}
                      onChange={() => {
                        setSelectedPriorities((prev) =>
                          prev.includes(p.value) ? prev.filter((item) => item !== p.value) : [...prev, p.value]
                        );
                      }}
                    />
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: p.color }} />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 8. Date Range Filter */}
          <div style={{ position: "relative" }} ref={dateRef}>
            <button
              type="button"
              className={`admin-secondary-button ${startDate || endDate ? "admin-primary-button" : ""}`}
              style={{ height: "30px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                setDateDropdownOpen(!dateDropdownOpen);
                setHotelDropdownOpen(false);
                setDeptDropdownOpen(false);
                setRoomDropdownOpen(false);
                setStatusDropdownOpen(false);
                setTaskTypeDropdownOpen(false);
                setPriorityDropdownOpen(false);
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
                      : "Date Filter"}
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
                  width: "280px",
                  backgroundColor: "#fff",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "6px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  padding: "12px",
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <label style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    DATE FIELD
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className={`admin-secondary-button ${dateField === "taskDate" ? "admin-primary-button" : ""}`}
                      style={{ flex: 1, height: "26px", fontSize: "10px" }}
                      onClick={() => setDateField("taskDate")}
                    >
                      Task Scheduled Date
                    </button>
                    <button
                      type="button"
                      className={`admin-secondary-button ${dateField === "createdAt" ? "admin-primary-button" : ""}`}
                      style={{ flex: 1, height: "26px", fontSize: "10px" }}
                      onClick={() => setDateField("createdAt")}
                    >
                      Created Date
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <label style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    QUICK PRESETS
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                    {[
                      { id: "all", label: "All dates" },
                      { id: "today", label: "Today" },
                      { id: "tomorrow", label: "Tomorrow" },
                      { id: "7days", label: "Next 7 days" },
                      { id: "month", label: "This month" },
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
                    <label style={{ fontSize: "9px", color: "#64748b", display: "block" }}>Start Date</label>
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
                    <label style={{ fontSize: "9px", color: "#64748b", display: "block" }}>End Date</label>
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

        {/* Housekeeping Data Table */}
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "36px" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all housekeeping tasks"
                  />
                </th>
                <th>TASK ID</th>
                <th>ROOM</th>
                <th>HOTEL</th>
                <th style={{ minWidth: "120px" }}>DEPARTMENT</th>
                <th>TASK TYPE</th>
                <th>SCHEDULED DATE</th>
                <th style={{ minWidth: "180px" }}>GUEST OCCUPANCY</th>
                <th style={{ minWidth: "150px" }}>ASSIGNED EMPLOYEE</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                    Loading housekeeping records...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={12}>
                    <div className="admin-empty" style={{ padding: "40px 16px", textAlign: "center" }}>
                      <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#334155" }}>
                        No housekeeping tasks match your filters
                      </p>
                      <small style={{ color: "#64748b" }}>
                        Try clearing filter selections or create a new housekeeping task.
                      </small>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const hotelName = hotelMap.get(t.hotelId) || t.hotelId;
                  const deptName = resolveTaskDepartment(t);
                  const emp = employeeMap.get(t.assignedTo || "");
                  const isOccupied = t.guestName && t.guestName !== "Vacant";

                  return (
                    <tr key={t._id} className={selectedIds.has(t._id) ? "is-selected-row" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(t._id)}
                          onChange={() => toggleSelectRow(t._id)}
                          aria-label={`Select task for room ${t.roomNumber}`}
                        />
                      </td>

                      {/* Task ID */}
                      <td className="admin-id" style={{ fontSize: "10px", fontFamily: "monospace" }}>
                        {t._id.slice(-6).toUpperCase()}
                      </td>

                      {/* Room */}
                      <td>
                        <strong className="admin-row-name" style={{ color: "var(--admin-forest)", fontSize: "12px" }}>
                          Room {t.roomNumber}
                        </strong>
                      </td>

                      {/* Hotel */}
                      <td>
                        <div style={{ fontSize: "11px", fontWeight: 500, color: "#334155" }}>{hotelName}</div>
                      </td>

                      {/* Department Column (Requested by User) */}
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
                              : deptName.toLowerCase().includes("maintenance")
                                ? "#fef3c7"
                                : "#f1f5f9",
                            color: deptName.toLowerCase().includes("housekeeping")
                              ? "#166534"
                              : deptName.toLowerCase().includes("maintenance")
                                ? "#92400e"
                                : "#475569",
                            border: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          <BriefcaseIcon size={10} />
                          <span>{deptName}</span>
                        </span>
                      </td>

                      {/* Task Type */}
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
                          {t.taskType || "CLEAN"}
                        </span>
                      </td>

                      {/* Scheduled Date */}
                      <td className="admin-date-cell" style={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                        {t.taskDate || (t.createdAt ? t.createdAt.slice(0, 10) : "—")}
                      </td>

                      {/* Guest Occupancy Details */}
                      <td>
                        {isOccupied ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontWeight: 600, fontSize: "11px", color: "#1e293b" }}>{t.guestName}</span>
                              <span
                                style={{
                                  fontSize: "9px",
                                  padding: "1px 5px",
                                  borderRadius: "10px",
                                  backgroundColor: "#e0f2fe",
                                  color: "#0369a1",
                                  fontWeight: 600,
                                }}
                              >
                                Occupied
                              </span>
                            </div>
                            {t.bookingReference && (
                              <span style={{ fontSize: "10px", color: "#64748b", fontFamily: "monospace" }}>
                                Ref: {t.bookingReference}
                              </span>
                            )}
                            {(t.checkInDate || t.checkOutDate) && (
                              <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                                {t.checkInDate} → {t.checkOutDate}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "10px",
                              backgroundColor: "#f1f5f9",
                              color: "#64748b",
                              fontWeight: 500,
                            }}
                          >
                            Vacant
                          </span>
                        )}
                      </td>

                      {/* Assigned Employee */}
                      <td>
                        {emp ? (
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 500, fontSize: "11px", color: "#1e293b" }}>{emp.name}</span>
                            <span style={{ fontSize: "9px", color: "#64748b" }}>{emp.employeeCode || emp.position}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>
                            {t.assignedTo || "Unassigned"}
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "9.5px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            backgroundColor:
                              t.priority === "URGENT"
                                ? "#fee2e2"
                                : t.priority === "HIGH"
                                  ? "#fef3c7"
                                  : t.priority === "LOW"
                                    ? "#f1f5f9"
                                    : "#e0f2fe",
                            color:
                              t.priority === "URGENT"
                                ? "#991b1b"
                                : t.priority === "HIGH"
                                  ? "#92400e"
                                  : t.priority === "LOW"
                                    ? "#475569"
                                    : "#075985",
                          }}
                        >
                          {t.priority || "NORMAL"}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: 600,
                            backgroundColor:
                              t.status === "CLEAN" || t.status === "INSPECTED"
                                ? "#dcfce7"
                                : t.status === "IN_PROGRESS"
                                  ? "#e0f2fe"
                                  : t.status === "MAINTENANCE"
                                    ? "#fef3c7"
                                    : "#fee2e2",
                            color:
                              t.status === "CLEAN" || t.status === "INSPECTED"
                                ? "#166534"
                                : t.status === "IN_PROGRESS"
                                  ? "#0369a1"
                                  : t.status === "MAINTENANCE"
                                    ? "#92400e"
                                    : "#991b1b",
                          }}
                        >
                          {t.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="admin-secondary-button"
                            style={{ height: "24px", fontSize: "10px", padding: "0 8px" }}
                            onClick={() => handleStatusTransition(t)}
                            title="Advance to next status"
                          >
                            Advance
                          </button>
                          <button
                            type="button"
                            className="admin-secondary-button"
                            style={{ height: "24px", fontSize: "10px", padding: "0 6px", color: "#b91c1c" }}
                            onClick={() => handleDeleteTask(t)}
                            title="Remove task"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create Housekeeping Task Dialog */}
      {createOpen && (
        <div
          className="admin-dialog-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreateOpen(false);
          }}
        >
          <form className="admin-dialog" onSubmit={handleCreateTask} style={{ maxWidth: "560px" }}>
            <div className="admin-dialog-heading">
              <div>
                <span className="admin-eyebrow">NEW RECORD</span>
                <h2>Create Housekeeping Task</h2>
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
                    setCreateForm((prev) => ({ ...prev, hotelId: hId, roomNumber: "" }));
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

              {/* Department (Requested Column & Field) */}
              <label>
                Department
                <select
                  value={createForm.departmentId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                >
                  <option value="">Housekeeping (Default)</option>
                  {modalDepartments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Room (Filtered dynamically by chosen hotel) */}
              <label>
                Room
                <select
                  required
                  value={createForm.roomNumber}
                  disabled={!createForm.hotelId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, roomNumber: e.target.value }))}
                >
                  <option value="">
                    {!createForm.hotelId
                      ? "Select a hotel first"
                      : modalRooms.length === 0
                        ? "No rooms available for this hotel"
                        : "Select a room"}
                  </option>
                  {modalRooms.map((r) => (
                    <option key={r._id} value={r.name}>
                      {r.name} ({r.capacity} guests)
                    </option>
                  ))}
                </select>
              </label>

              {/* Task Date */}
              <label>
                Task date
                <input
                  required
                  type="date"
                  value={createForm.taskDate}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, taskDate: e.target.value }))}
                />
              </label>

              {/* Task Type */}
              <label>
                Task type
                <select
                  value={createForm.taskType}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, taskType: e.target.value }))}
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Assigned Employee */}
              <label>
                Assigned employee
                <select
                  value={createForm.assignedTo}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                >
                  <option value="">Select an employee (optional)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.employeeCode || emp.id}>
                      {emp.name} · {emp.position} ({emp.employeeCode || emp.id.slice(0, 6)})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Priority Selector */}
            <label className="admin-dialog-select" style={{ marginTop: "12px" }}>
              Priority
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, priority: e.target.value }))}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>

            {/* Real-time Guest Occupancy Card */}
            {createForm.hotelId && createForm.roomNumber && createForm.taskDate && (
              <div className={`admin-occupancy-card ${modalMatchedGuest ? "is-occupied" : "is-vacant"}`}>
                <div className="admin-occupancy-card-header">
                  <span className="admin-occupancy-title">Guest Occupancy ({createForm.taskDate})</span>
                  {modalMatchedGuest ? (
                    <span
                      className={`admin-occupancy-badge ${createForm.taskDate.slice(0, 10) === modalMatchedGuest.check_in_date.slice(0, 10)
                          ? "arriving"
                          : createForm.taskDate.slice(0, 10) === modalMatchedGuest.check_out_date.slice(0, 10)
                            ? "departing"
                            : "occupied"
                        }`}
                    >
                      {createForm.taskDate.slice(0, 10) === modalMatchedGuest.check_in_date.slice(0, 10)
                        ? "Arriving today"
                        : createForm.taskDate.slice(0, 10) === modalMatchedGuest.check_out_date.slice(0, 10)
                          ? "Departing today"
                          : "In-House (Stayover)"}
                    </span>
                  ) : (
                    <span className="admin-occupancy-badge vacant">Vacant</span>
                  )}
                </div>
                {modalMatchedGuest ? (
                  <div className="admin-occupancy-grid">
                    <div className="admin-occupancy-item">
                      <span className="admin-occupancy-label">Guest</span>
                      <span className="admin-occupancy-val">
                        {modalMatchedGuest.guest_first_name} {modalMatchedGuest.guest_last_name}
                      </span>
                    </div>
                    <div className="admin-occupancy-item">
                      <span className="admin-occupancy-label">Booking Reference</span>
                      <span className="admin-occupancy-val">{modalMatchedGuest.booking_code}</span>
                    </div>
                    <div className="admin-occupancy-item">
                      <span className="admin-occupancy-label">Contact</span>
                      <span className="admin-occupancy-val">
                        {modalMatchedGuest.guest_email || "—"}
                        {modalMatchedGuest.guest_phone ? ` · ${modalMatchedGuest.guest_phone}` : ""}
                      </span>
                    </div>
                    <div className="admin-occupancy-item">
                      <span className="admin-occupancy-label">Stay Window</span>
                      <span className="admin-occupancy-val">
                        {modalMatchedGuest.check_in_date} → {modalMatchedGuest.check_out_date}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: "4px 0 0", color: "#617169", fontSize: "9px" }}>
                    Room is vacant. No active guest reservation occupying this room on this date.
                  </p>
                )}
              </div>
            )}

            <div className="admin-dialog-actions" style={{ marginTop: "18px" }}>
              <button type="button" className="admin-secondary-button" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="admin-primary-button"
                disabled={creating || !createForm.hotelId || !createForm.roomNumber || !createForm.taskDate}
              >
                {creating ? "Saving..." : "Save record"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

