"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "../Navbar";
import Footer from "../Footer";

/**
 * Public site shell for non-dashboard routes.
 * Dashboard pages provide their own structural chrome via DashboardLayout.
 */
const dashboardSegments = new Set([
  "patients",
  "lab-results",
  "drug-orders",
  "inventories",
  "payments",
  "reports",
  "feedback",
  "profile",
  "walk-in-services",
]);

export const SiteShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();
  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  const isDashboardRoute = dashboardSegments.has(firstSegment);

  return (
    <>
      {!isDashboardRoute && (
        <>
          <Navbar />
          {/* Spacer to offset fixed navbar height on public pages */}
          <div aria-hidden className="h-16 md:h-20" />
        </>
      )}
      {children}
      {!isDashboardRoute && <Footer />}
    </>
  );
};

export default SiteShell;
