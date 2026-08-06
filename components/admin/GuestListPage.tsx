import React, { useState, useEffect, useMemo } from "react";
import { getAllRsvps, updateRsvp } from "../../lib/data-access";
import { AdminError } from "./AdminError";
import { RsvpRecord, ChildEntry } from "../../types/rsvp";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Plus,
  Trash2,
  UserCheck,
} from "lucide-react";

type FilterChip = "All" | "Attending" | "Not Attending" | "Checked In" | "Not Checked In";
type SortField =
  | "guestFullName"
  | "email text"
  | "isAttending"
  | "totalHeadcount"
  | "createdAt";

export const GuestListPage: React.FC = () => {
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("All");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("guestFullName");
  const [sortAsc, setSortAsc] = useState(true);

  // Edit Modal State
  const [editingGuest, setEditingGuest] = useState<RsvpRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getAllRsvps()
      .then((data) => {
        if (!isMounted) return;
        setRsvps(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error("[admin] failed to load guest list:", err);
        setError(err instanceof Error ? err.message : "Could not load the guest list.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  // Debounce search term 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredAndSorted = useMemo(() => {
    return rsvps
      .filter((item) => {
        // Filter Chips
        if (activeFilter === "Attending" && !item.isAttending) return false;
        if (activeFilter === "Not Attending" && item.isAttending) return false;
        if (activeFilter === "Checked In" && !item.checkedIn) return false;
        if (activeFilter === "Not Checked In" && item.checkedIn) return false;

        // Search Input
        if (!debouncedSearch.trim()) return true;
        const q = debouncedSearch.toLowerCase().trim();
        return (
          item.guestFullName.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.phone.includes(q) ||
          (item.plusOneName && item.plusOneName.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        let valA: any = a[sortField === "email text" ? "email" : sortField];
        let valB: any = b[sortField === "email text" ? "email" : sortField];

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [rsvps, activeFilter, debouncedSearch, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredAndSorted.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, currentPage]);

  // Always paired with clearing the save error, so a failed save from a previous
  // guest never shows up over a freshly opened one.
  const openEditor = (row: RsvpRecord) => {
    setSaveError(null);
    setEditingGuest({ ...row });
  };

  const closeEditor = () => {
    setSaveError(null);
    setEditingGuest(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;

    setSaving(true);
    setSaveError(null);

    try {
      await updateRsvp(editingGuest.id, editingGuest);
      const refreshed = await getAllRsvps();
      setRsvps(refreshed);
      setEditingGuest(null);
    } catch (err: unknown) {
      // Keep the modal open with the operator's edits intact so the save can be
      // retried — discarding their typing on a network blip is worse.
      console.error("[admin] failed to save guest edit:", err);
      setSaveError(
        err instanceof Error ? err.message : "Could not save those changes. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return <AdminError message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        <p className="text-sm font-semibold text-slate-500">Loading guest registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SEARCH & FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search guest name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 transition-all"
            />
          </div>

          {/* Records Counter */}
          <div className="text-xs font-semibold text-slate-500 text-right shrink-0">
            Showing <span className="font-bold text-slate-900">{filteredAndSorted.length}</span> of{" "}
            <span className="font-bold text-slate-900">{rsvps.length}</span> entries
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {(["All", "Attending", "Not Attending", "Checked In", "Not Checked In"] as FilterChip[]).map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setActiveFilter(chip);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeFilter === chip
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort("guestFullName")}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    {sortField === "guestFullName" && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th
                  onClick={() => handleSort("isAttending")}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  Status
                </th>
                <th className="px-4 py-3 text-center">Adults</th>
                <th className="px-4 py-3 text-center">Children</th>
                <th className="px-4 py-3 text-center">Nannies</th>
                <th
                  onClick={() => handleSort("totalHeadcount")}
                  className="px-4 py-3 text-center cursor-pointer hover:text-slate-900 transition-colors"
                >
                  Total
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No guest records matching your filter.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const isExpanded = expandedRowId === row.id;
                  const adultsCount = row.isAttending ? 1 + (row.hasPlusOne ? 1 : 0) : 0;

                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          isExpanded ? "bg-slate-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{row.guestFullName}</span>
                            {row.checkedIn && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                Checked In
                              </span>
                            )}
                          </div>
                          {row.hasPlusOne && (
                            <span className="text-[11px] text-slate-400 font-normal block">
                              +1: {row.plusOneName || "Declared Plus One"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">{row.email || "—"}</td>
                        <td className="px-4 py-3.5 text-slate-500">{row.phone || "—"}</td>
                        <td className="px-4 py-3.5">
                          {row.isAttending ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Attending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                              <XCircle className="w-3 h-3" /> Declined
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                          {adultsCount}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                          {row.isAttending ? row.children.length : 0}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                          {row.isAttending && row.hasNanny ? row.nannyCount : 0}
                        </td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-slate-900 text-sm">
                          {row.totalHeadcount}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditor(row);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                            title="Edit Guest Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDED DETAILS ROW */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-t border-b border-slate-200/80">
                          <td colSpan={9} className="p-4">
                            <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3 text-xs">
                              <div className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
                                <span>Expanded Details for {row.guestFullName}</span>
                                <span className="text-[11px] text-slate-400 font-normal">
                                  Submitted: {new Date(row.createdAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <span className="font-bold text-slate-700 block mb-1">
                                    Children Breakdown ({row.children.length}):
                                  </span>
                                  {row.children.length === 0 ? (
                                    <p className="text-slate-400 italic">No children listed.</p>
                                  ) : (
                                    <ul className="space-y-1 text-slate-600">
                                      {row.children.map((c, idx) => (
                                        <li key={c.id || idx} className="flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                          <span>
                                            Age {c.age} ({c.gender === "male" ? "Boy" : "Girl"})
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>

                                <div>
                                  <span className="font-bold text-slate-700 block mb-1">
                                    Dietary Notes:
                                  </span>
                                  <p className="text-rose-700 font-medium">
                                    {row.dietaryNotes || "None declared."}
                                  </p>
                                </div>

                                <div>
                                  <span className="font-bold text-slate-700 block mb-1">
                                    Message to Celebrant:
                                  </span>
                                  <p className="text-slate-600 italic">
                                    "{row.messageToCelebrant || "No message."}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE STACKED CARDS VIEW (<768px) */}
      <div className="md:hidden space-y-3">
        {paginatedRows.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            No guest records match your search filter.
          </div>
        ) : (
          paginatedRows.map((row) => (
            <div
              key={row.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{row.guestFullName}</h4>
                  <p className="text-slate-500">{row.email || row.phone || "No contact info"}</p>
                </div>
                <div className="text-right space-y-1">
                  {row.isAttending ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold block">
                      Attending
                    </span>
                  ) : (
                    <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold block">
                      Declined
                    </span>
                  )}
                  {row.checkedIn && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold block">
                      Checked In
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg text-center font-bold">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Adults</span>
                  <span className="text-slate-900">{row.isAttending ? 1 + (row.hasPlusOne ? 1 : 0) : 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Kids</span>
                  <span className="text-slate-900">{row.children.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Nannies</span>
                  <span className="text-slate-900">{row.hasNanny ? row.nannyCount : 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Total</span>
                  <span className="text-rose-600 font-extrabold">{row.totalHeadcount}</span>
                </div>
              </div>

              {row.dietaryNotes && (
                <div className="text-[11px] text-rose-700 font-semibold bg-rose-50 p-2 rounded border border-rose-100">
                  Dietary: {row.dietaryNotes}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() =>
                    setExpandedRowId(expandedRowId === row.id ? null : row.id)
                  }
                  className="text-slate-600 font-bold underline text-[11px]"
                >
                  {expandedRowId === row.id ? "Hide Details" : "View Children & Notes"}
                </button>

                <button
                  onClick={() => setEditingGuest({ ...row })}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-[11px] flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {expandedRowId === row.id && (
                <div className="bg-slate-50 p-3 rounded-lg space-y-2 border border-slate-200">
                  <div className="font-bold text-slate-800">Children List:</div>
                  {row.children.length === 0 ? (
                    <p className="text-slate-400">No children listed.</p>
                  ) : (
                    row.children.map((c, i) => (
                      <div key={i} className="text-slate-600">
                        • Age {c.age} ({c.gender})
                      </div>
                    ))
                  )}
                  {row.messageToCelebrant && (
                    <p className="text-slate-600 italic border-t border-slate-200 pt-2">
                      "{row.messageToCelebrant}"
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* EDIT MODAL */}
      {editingGuest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Edit Guest Details — {editingGuest.guestFullName}
              </h3>
              <button
                onClick={closeEditor}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingGuest.guestFullName}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, guestFullName: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingGuest.email}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, email: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingGuest.phone}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, phone: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attending Status</label>
                  <select
                    value={editingGuest.isAttending ? "yes" : "no"}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        isAttending: e.target.value === "yes",
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 font-bold"
                  >
                    <option value="yes">Attending</option>
                    <option value="no">Not Attending</option>
                  </select>
                </div>
              </div>

              {/* Plus One Details */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editingGuest.hasPlusOne}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        hasPlusOne: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300 text-rose-600"
                  />
                  <span>Has Adult Plus One</span>
                </label>
                {editingGuest.hasPlusOne && (
                  <input
                    type="text"
                    placeholder="Plus One Full Name"
                    value={editingGuest.plusOneName}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, plusOneName: e.target.value })
                    }
                    className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900"
                  />
                )}
              </div>

              {/* Nanny Details */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editingGuest.hasNanny}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        hasNanny: e.target.checked,
                        nannyCount: e.target.checked ? 1 : 0,
                      })
                    }
                    className="rounded border-slate-300 text-rose-600"
                  />
                  <span>Bringing Nanny / Caretaker</span>
                </label>
                {editingGuest.hasNanny && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-semibold">Nanny Count:</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={editingGuest.nannyCount}
                      onChange={(e) =>
                        setEditingGuest({
                          ...editingGuest,
                          nannyCount: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-20 p-1.5 bg-white border border-slate-300 rounded text-center font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Dietary & Message */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dietary Notes</label>
                <input
                  type="text"
                  value={editingGuest.dietaryNotes}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, dietaryNotes: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message to Celebrant</label>
                <textarea
                  rows={2}
                  value={editingGuest.messageToCelebrant}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, messageToCelebrant: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>

              {saveError && <AdminError variant="banner" message={saveError} />}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
