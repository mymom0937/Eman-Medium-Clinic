"use client";

import React from "react";

interface PaginationControlsProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// Utility to build a compact page number list with ellipses
function buildPageList(
  current: number,
  totalPages: number
): (number | "...")[] {
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  const showLeftEllipsis = current > 4;
  const showRightEllipsis = current < totalPages - 3;
  const firstPages = [1, 2];
  const lastPages = [totalPages - 1, totalPages];
  const middlePages: number[] = [];
  const start = Math.max(3, current - 1);
  const end = Math.min(totalPages - 2, current + 1);
  for (let i = start; i <= end; i++) middlePages.push(i);
  pages.push(...firstPages);
  if (showLeftEllipsis) pages.push("...");
  pages.push(
    ...middlePages.filter(
      (p) => !firstPages.includes(p) && !lastPages.includes(p)
    )
  );
  if (showRightEllipsis) pages.push("...");
  pages.push(...lastPages);
  // Deduplicate & keep order
  const seen = new Set<number | "...">();
  return pages.filter((p) => {
    if (p === "...") return true;
    if (seen.has(p)) return false;
    seen.add(p);
    return true;
  });
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  total,
  pageSize,
  onPageChange,
  className = "",
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null; // No need to render

  const safeChange = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange(p);
  };

  const pageList = buildPageList(page, totalPages);
  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(total, page * pageSize);

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border-color ${className}`}
    >
      <div className="text-xs sm:text-sm text-text-secondary">
        Showing{" "}
        <span className="font-medium text-text-primary">
          {startIdx}-{endIdx}
        </span>{" "}
        of <span className="font-medium text-text-primary">{total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => safeChange(1)}
          disabled={page === 1}
          className="px-2 h-8 text-xs rounded-md border border-border-color bg-background disabled:opacity-40 hover:bg-card-bg transition-colors"
          aria-label="First page"
        >
          «
        </button>
        <button
          onClick={() => safeChange(page - 1)}
          disabled={page === 1}
          className="px-2 h-8 text-xs rounded-md border border-border-color bg-background disabled:opacity-40 hover:bg-card-bg transition-colors"
          aria-label="Previous page"
        >
          ‹
        </button>
        {pageList.map((p, idx) =>
          p === "..." ? (
            <span
              key={idx}
              className="px-2 h-8 flex items-center text-xs text-text-muted select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => safeChange(p)}
              className={`min-w-[2rem] h-8 px-2 text-xs rounded-md border border-border-color transition-colors ${
                p === page
                  ? "bg-accent-color text-white border-accent-color"
                  : "bg-background hover:bg-card-bg text-text-primary"
              }`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => safeChange(page + 1)}
          disabled={page === totalPages}
          className="px-2 h-8 text-xs rounded-md border border-border-color bg-background disabled:opacity-40 hover:bg-card-bg transition-colors"
          aria-label="Next page"
        >
          ›
        </button>
        <button
          onClick={() => safeChange(totalPages)}
          disabled={page === totalPages}
          className="px-2 h-8 text-xs rounded-md border border-border-color bg-background disabled:opacity-40 hover:bg-card-bg transition-colors"
          aria-label="Last page"
        >
          »
        </button>
      </div>
    </div>
  );
};
