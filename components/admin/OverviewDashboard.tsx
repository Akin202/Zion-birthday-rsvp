import React, { useEffect, useState } from "react";
import { getRsvpStats } from "../../lib/data-access";
import { RsvpStats } from "../../types/rsvp";
import { eventConfig } from "../../config/event.config";
import { AdminError } from "./AdminError";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Baby,
  ShieldAlert,
  Heart,
  Printer,
  Loader2,
  Utensils,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const GENDER_COLORS = {
  male: "#00AEEF",
  female: "#FF4081",
};

export const OverviewDashboard: React.FC = () => {
  const [stats, setStats] = useState<RsvpStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // TODO(claude-code): subscribe to Supabase realtime so these figures live-update
    let isMounted = true;
    setLoading(true);
    setError(null);

    getRsvpStats()
      .then((data) => {
        if (!isMounted) return;
        setStats(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error("[admin] failed to load stats:", err);
        setError(
          err instanceof Error ? err.message : "Could not load the event statistics.",
        );
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const handlePrintMessages = () => {
    window.print();
  };

  if (error) {
    return <AdminError message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  }

  if (loading || !stats) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        <p className="text-sm font-semibold text-slate-500">
          Loading event statistics & headcounts...
        </p>
      </div>
    );
  }

  // Gender chart data formatting for Recharts
  const genderChartData = stats.childrenByGender.map((g) => ({
    name: g.gender === "male" ? "Boys" : "Girls",
    value: g.count,
    color: g.gender === "male" ? GENDER_COLORS.male : GENDER_COLORS.female,
  }));

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Print-Only Header */}
      <div className="hidden print:block text-slate-900 border-b border-slate-300 pb-4 mb-6">
        <h1 className="font-bold text-2xl">Zion's 7th Birthday Party — Guest Messages & Notes</h1>
        <p className="text-xs text-slate-600">Printed on {new Date().toLocaleDateString()}</p>
      </div>

      {/* ROW 1: LARGE STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wide">
            <span>Total Responses</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.totalResponses}
          </div>
          <p className="text-xs text-slate-500 font-medium">RSVP submissions received</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wide">
            <span>Attending</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {stats.attendingCount}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {((stats.attendingCount / (stats.totalResponses || 1)) * 100).toFixed(0)}% acceptance rate
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wide">
            <span>Not Attending</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-700">
            {stats.notAttendingCount}
          </div>
          <p className="text-xs text-slate-500 font-medium">Declined invitations</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 bg-gradient-to-br from-white to-amber-50/50">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wide">
            <span>Total Expected Headcount</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">
            {stats.totalExpectedHeadcount}
          </div>
          <p className="text-xs text-slate-500 font-medium">Total adults + kids + nannies</p>
        </div>
      </div>

      {/* ROW 2: BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wide block">Adults</span>
            <span className="text-xl font-bold text-slate-900">{stats.adultsCount}</span>
            <span className="text-[11px] text-slate-400 block">Primary + Plus-ones</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center shrink-0">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wide block">Children</span>
            <span className="text-xl font-bold text-slate-900">{stats.childrenCount}</span>
            <span className="text-[11px] text-slate-400 block">Ages 0 - 17</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wide block">Nannies</span>
            <span className="text-xl font-bold text-slate-900">{stats.nanniesCount}</span>
            <span className="text-[11px] text-slate-400 block">Declared caretakers</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wide block">Checked In</span>
            <span className="text-xl font-bold text-emerald-600">
              {stats.checkedInCount} of {stats.attendingCount}
            </span>
            <span className="text-[11px] text-slate-400 block">
              {stats.checkedInExpectedHeadcount} headcount present
            </span>
          </div>
        </div>
      </div>

      {/* ROW 3: RECHARTS CHARTS PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Children by Age Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Children Demographics by Age</h3>
              <p className="text-xs text-slate-500">Count of child guests per age (0–17)</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
              Total: {stats.childrenCount}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.childrenByAge} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`${Number(val ?? 0)} children`, "Count"]}
                  labelFormatter={(age) => `Age ${age}`}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Children by Gender Donut Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">Children Gender Ratio</h3>
            <p className="text-xs text-slate-500 font-medium">Boys vs Girls ratio for favor bags</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {stats.childrenCount === 0 ? (
              <p className="text-xs text-slate-400">No children declared yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {genderChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${Number(val ?? 0)} children`, "Total"]}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ROW 4: DIETARY REQUIREMENTS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 print:border-none print:shadow-none print:p-0">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Utensils className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">Dietary Requirements & Allergies</h3>
            <p className="text-xs text-slate-500 font-medium">Direct notes for catering & food safety</p>
          </div>
        </div>

        {stats.dietaryRequirements.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">No special dietary notes declared by guests.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.dietaryRequirements.map((item) => (
              <div
                key={item.id}
                className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3.5 text-xs text-slate-900 space-y-1"
              >
                <span className="font-bold text-slate-900 block">{item.guestName}</span>
                <p className="text-rose-700 font-semibold italic">"{item.notes}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ROW 5: MESSAGES TO CELEBRANT */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 print:border-none print:shadow-none print:p-0">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Messages to {eventConfig.celebrant.name} ({stats.messagesToCelebrant.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">Guest birthday wishes and notes</p>
            </div>
          </div>

          <button
            onClick={handlePrintMessages}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors print:hidden shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Messages</span>
          </button>
        </div>

        {stats.messagesToCelebrant.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">No messages submitted yet.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1 print:max-h-none print:overflow-visible">
            {stats.messagesToCelebrant.map((msg) => (
              <div
                key={msg.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{msg.guestName}</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {new Date(msg.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-700 font-medium italic text-sm pt-1">
                  "{msg.message}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
