import React from "react";
import { useRouter } from "../../lib/router";
import { eventConfig } from "../../config/event.config";
import { signOut } from "../../lib/auth";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Download,
  LogOut,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Menu,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { path, navigate } = useRouter();

  const navItems = [
    { label: "Overview", route: "/admin", icon: LayoutDashboard },
    { label: "Guest List", route: "/admin/guests", icon: Users },
    { label: "Check-In Door Tool", route: "/admin/checkin", icon: UserCheck, highlight: true },
    { label: "Export CSV", route: "/admin/export", icon: Download },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col md:flex-row antialiased">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 bg-[#0F172A] text-slate-200 flex-col justify-between border-r border-slate-800 shrink-0">
        <div>
          {/* Brand & Event Title */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-2.5 text-rose-500 font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Admin Control Center</span>
            </div>
            <h1 className="font-bold text-lg text-white leading-tight">
              {eventConfig.celebrant.name}'s 7th Birthday
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Event Date: {eventConfig.event.dateDisplay}
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                path === item.route ||
                (item.route !== "/admin" && path.startsWith(item.route));

              return (
                <button
                  key={item.route}
                  onClick={() => navigate(item.route)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-rose-600 text-white shadow-sm"
                      : item.highlight
                      ? "bg-slate-800 text-amber-300 hover:bg-slate-700 hover:text-amber-200"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 stroke-[2]" />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Website</span>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-semibold transition-colors border border-slate-700"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-0">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <span className="bg-slate-900 text-white font-bold text-xs px-2.5 py-1 rounded">
                ADMIN
              </span>
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                {path === "/admin/guests"
                  ? "Guest List & RSVP Records"
                  : path === "/admin/checkin"
                  ? "Door Check-in Station"
                  : path === "/admin/export"
                  ? "Data Export & Reports"
                  : "Event Overview & Analytics"}
              </h2>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Door Check-in & Event Management Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE RSVPs ACTIVE</span>
            </div>

            <button
              onClick={() => navigate("/")}
              className="md:hidden text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Public Site
            </button>

            <button
              onClick={handleSignOut}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY CHILD ROUTE */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A] border-t border-slate-800 flex items-center justify-around z-40 px-2 py-2 text-slate-400">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            path === item.route ||
            (item.route !== "/admin" && path.startsWith(item.route));

          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-md text-[11px] font-medium transition-colors ${
                isActive
                  ? "text-rose-500 font-bold"
                  : item.highlight
                  ? "text-amber-300"
                  : "hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2]" />
              <span>{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
