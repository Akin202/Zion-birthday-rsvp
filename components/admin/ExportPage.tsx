import React, { useState } from "react";
import { getAllRsvps } from "../../lib/data-access";
import { generateRsvpCsv, generateChildrenCsv, downloadCsvBlob } from "../../lib/csv-export";
import { Download, FileSpreadsheet, ShieldAlert, CheckCircle2 } from "lucide-react";

export const ExportPage: React.FC = () => {
  const [exportingRsvp, setExportingRsvp] = useState(false);
  const [exportingChildren, setExportingChildren] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDownloadRsvpCsv = async () => {
    setExportingRsvp(true);
    const rsvps = await getAllRsvps();
    const csvText = generateRsvpCsv(rsvps);
    const today = new Date().toISOString().split("T")[0];
    downloadCsvBlob(csvText, `rsvps-${today}.csv`);

    setExportingRsvp(false);
    setSuccessMsg(`Downloaded rsvps-${today}.csv successfully!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDownloadChildrenCsv = async () => {
    setExportingChildren(true);
    const rsvps = await getAllRsvps();
    const csvText = generateChildrenCsv(rsvps);
    const today = new Date().toISOString().split("T")[0];
    downloadCsvBlob(csvText, `children-list-${today}.csv`);

    setExportingChildren(false);
    setSuccessMsg(`Downloaded children-list-${today}.csv successfully!`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* HEADER CARD */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Data Export Console</span>
        </div>
        <h2 className="font-bold text-2xl text-slate-900">
          Export Event Reports & Guest Manifests
        </h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Generate clean, unformatted CSV spreadsheets for event coordinators, venue door staff, caterers, and children party activity planners.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TWO EXPORT BUTTON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EXPORT 1: FULL RSVP LIST */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Download RSVP List (CSV)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              One row per RSVP submission. Includes full guest names, attendance status, adult plus-ones, children counts & details formatted as age/gender (e.g., "6F, 8M"), nanny counts, total headcounts, dietary requirements, and door check-in status.
            </p>
          </div>

          <button
            onClick={handleDownloadRsvpCsv}
            disabled={exportingRsvp}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{exportingRsvp ? "Generating CSV..." : "Download RSVP List (CSV)"}</span>
          </button>
        </div>

        {/* EXPORT 2: CHILDREN LIST */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Download Children List (CSV)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              One row per child guest. Ideal for party favor bags, age-group activity planning, and entertainer headcount assignments. Includes parent/guardian contact details and child age/gender.
            </p>
          </div>

          <button
            onClick={handleDownloadChildrenCsv}
            disabled={exportingChildren}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{exportingChildren ? "Generating CSV..." : "Download Children List (CSV)"}</span>
          </button>
        </div>
      </div>

      {/* FOOTER SECURITY NOTE */}
      <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl flex items-start gap-3 text-slate-600 text-xs">
        <ShieldAlert className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <p className="font-medium">
          <strong className="text-slate-800">Data Privacy Notice:</strong> Guest data is stored securely and is accessible only to authorised admins. Do not share exports outside your team.
        </p>
      </div>
    </div>
  );
};
