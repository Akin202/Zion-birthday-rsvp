import React, { useState, useEffect } from "react";
import Home from "../app/page";
import { RouterProvider, useRouter } from "../lib/router";
import { AdminLayout } from "../components/admin/AdminLayout";
import { LoginPage } from "../components/admin/LoginPage";
import { OverviewDashboard } from "../components/admin/OverviewDashboard";
import { GuestListPage } from "../components/admin/GuestListPage";
import { CheckinPage } from "../components/admin/CheckinPage";
import { ExportPage } from "../components/admin/ExportPage";

function AppContent() {
  const { path } = useRouter();

  if (path === "/admin/login") {
    return <LoginPage />;
  }

  if (path.startsWith("/admin")) {
    let child = <OverviewDashboard />;
    if (path === "/admin/guests" || path.startsWith("/admin/guests")) {
      child = <GuestListPage />;
    } else if (path === "/admin/checkin" || path.startsWith("/admin/checkin")) {
      child = <CheckinPage />;
    } else if (path === "/admin/export" || path.startsWith("/admin/export")) {
      child = <ExportPage />;
    }

    return <AdminLayout>{child}</AdminLayout>;
  }

  return <Home />;
}

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
