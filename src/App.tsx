import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../app/page";
import { ScrollToTop } from "../lib/router";

/**
 * Admin is lazy-loaded so guests never download it. This matters: the admin
 * bundle pulls in recharts, which dwarfs the entire guest-facing page. Guests
 * are on mid-range Androids over patchy mobile data — they get the invite only.
 */
/**
 * The edit page is lazy too. Most guests never open it — it is reached only from
 * a link in the confirmation email — so its loader has no business sitting in
 * the bundle every invite visitor downloads.
 */
const EditRsvpPage = lazy(() =>
  import("../app/edit-rsvp").then((m) => ({ default: m.EditRsvpPage })),
);

const AdminLayout = lazy(() =>
  import("../components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const RequireAuth = lazy(() =>
  import("../components/admin/RequireAuth").then((m) => ({ default: m.RequireAuth })),
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

/** Every admin page gets the same guard + chrome; only the body differs. */
function AdminRoute({ page }: { page: ReactNode }) {
  return (
    <RequireAuth>
      <AdminLayout>{page}</AdminLayout>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<AdminFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rsvp/edit" element={<EditRsvpPage />} />

          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminRoute page={<OverviewDashboard />} />} />
          <Route path="/admin/guests" element={<AdminRoute page={<GuestListPage />} />} />
          <Route path="/admin/checkin" element={<AdminRoute page={<CheckinPage />} />} />
          <Route path="/admin/export" element={<AdminRoute page={<ExportPage />} />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
