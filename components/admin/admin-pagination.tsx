"use client";

import React from "react";

export interface AdminPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  selectedCount?: number;
}

export function AdminPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = "records",
  selectedCount = 0,
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / (pageSize || 10)));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, safePage * pageSize);

  // Generate numbered pages window (up to 5 visible pills)
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [];
    if (safePage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (safePage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className="admin-table-foot"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        minHeight: "48px",
        borderTop: "1px solid #E5EBE7",
        backgroundColor: "#FFFFFF",
        fontSize: "12px",
        color: "#617169",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      {/* Left: Data count */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span>
          Showing <strong style={{ color: "#111827" }}>{startItem}–{endItem}</strong> of{" "}
          <strong style={{ color: "#111827" }}>{totalItems}</strong> {itemLabel}
          {selectedCount > 0 && ` (${selectedCount} selected)`}
        </span>

        {onPageSizeChange && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginLeft: "8px" }}>
            <span style={{ color: "#8a968f", fontSize: "11px" }}>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                fontSize: "11px",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid #D1D5DB",
                backgroundColor: "#F9FAFB",
                color: "#374151",
                cursor: "pointer",
                outline: "none",
              }}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page navigation */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "11px", color: "#6B7280", marginRight: "4px" }}>
          Page <strong style={{ color: "#111827" }}>{safePage}</strong> of{" "}
          <strong style={{ color: "#111827" }}>{totalPages}</strong>
        </span>

        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safePage <= 1}
          aria-label="First page"
          title="First page"
          style={{
            minWidth: "26px",
            height: "26px",
            padding: "0 6px",
            borderRadius: "4px",
            border: "1px solid #E5EBE7",
            backgroundColor: "#FFFFFF",
            color: safePage <= 1 ? "#D1D5DB" : "#374151",
            cursor: safePage <= 1 ? "not-allowed" : "pointer",
            fontSize: "11px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
          }}
        >
          «
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Previous page"
          title="Previous page"
          style={{
            minWidth: "26px",
            height: "26px",
            padding: "0 6px",
            borderRadius: "4px",
            border: "1px solid #E5EBE7",
            backgroundColor: "#FFFFFF",
            color: safePage <= 1 ? "#D1D5DB" : "#374151",
            cursor: safePage <= 1 ? "not-allowed" : "pointer",
            fontSize: "12px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ‹
        </button>

        {/* Numbered Page Buttons */}
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                style={{
                  minWidth: "20px",
                  textAlign: "center",
                  fontSize: "11px",
                  color: "#9CA3AF",
                }}
              >
                …
              </span>
            );
          }
          const isActive = p === safePage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={isActive ? "page" : undefined}
              style={{
                minWidth: "26px",
                height: "26px",
                padding: "0 6px",
                borderRadius: "4px",
                border: isActive ? "1px solid #2D5A43" : "1px solid #E5EBE7",
                backgroundColor: isActive ? "#2D5A43" : "#FFFFFF",
                color: isActive ? "#FFFFFF" : "#374151",
                cursor: isActive ? "default" : "pointer",
                fontSize: "11px",
                fontWeight: isActive ? 700 : 500,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              {p}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Next page"
          title="Next page"
          style={{
            minWidth: "26px",
            height: "26px",
            padding: "0 6px",
            borderRadius: "4px",
            border: "1px solid #E5EBE7",
            backgroundColor: "#FFFFFF",
            color: safePage >= totalPages ? "#D1D5DB" : "#374151",
            cursor: safePage >= totalPages ? "not-allowed" : "pointer",
            fontSize: "12px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ›
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safePage >= totalPages}
          aria-label="Last page"
          title="Last page"
          style={{
            minWidth: "26px",
            height: "26px",
            padding: "0 6px",
            borderRadius: "4px",
            border: "1px solid #E5EBE7",
            backgroundColor: "#FFFFFF",
            color: safePage >= totalPages ? "#D1D5DB" : "#374151",
            cursor: safePage >= totalPages ? "not-allowed" : "pointer",
            fontSize: "11px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
          }}
        >
          »
        </button>
      </div>
    </div>
  );
}

