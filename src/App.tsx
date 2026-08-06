import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../app/page";
import { ScrollToTop } from "../lib/router";

/**
 * Admin is lazy-loaded so guests never download it. This matters: the admin
 * bundle pulls in recharts, which dwarfs the entire guest-facing page. Guests
 * are on mid-range Androids over patchy mobile data — they get the invite only.
 */
const AdminLayout = lazy(() =>
  import("../components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const LoginPage = lazy(() =>
  import("../components/admin/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const OverviewDashboard = lazy(() =>
  import("../components/admin/OverviewDashboard").then((m) => ({
    default: m.OverviewDashboard,
  })),
);
const GuestListPage = lazy(() =>
  import("../components/admin/GuestListPage").then((m) => ({ default: m.GuestListPage })),
);
const CheckinPage = lazy(() =>
  import("../components/admin/CheckinPage").then((m) => ({ default: m.CheckinPage })),
);
const ExportPage = lazy(() =>
  import("../components/admin/ExportPage").then((m) => ({ default: m.ExportPage })),
);

function AdminFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <p className="text-sm font-semibold text-slate-500">Loading…</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<AdminFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminLayout>
                <OverviewDashboard />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/guests"
            element={
              <AdminLayout>
                <GuestListPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/checkin"
            element={
              <AdminLayout>
                <CheckinPage />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/export"
            element={
              <AdminLayout>
                <ExportPage />
              </AdminLayout>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
