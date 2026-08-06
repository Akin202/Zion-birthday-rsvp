import React, { useState, useEffect, useRef } from "react";
import { searchRsvpsByName, setCheckedIn, getAllRsvps } from "../../lib/data-access";
import { RsvpRecord } from "../../types/rsvp";
import { Search, CheckCircle2, AlertTriangle, Wifi, Minus, Plus, RotateCcw } from "lucide-react";
import { AdminError } from "./AdminError";

export const CheckinPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<RsvpRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [flashSuccessId, setFlashSuccessId] = useState<string | null>(null);

  // Two separate failure surfaces on purpose. A search that failed shows an empty
  // list, which reads as "not on the guest list" — staff would turn someone away
  // over a network error. A check-in that failed to write is worse still: the row
  // must not look checked in when it isn't.
  const [searchError, setSearchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // Headcount Stepper modal state
  const [stepperRecord, setStepperRecord] = useState<RsvpRecord | null>(null);
  const [stepperCount, setStepperCount] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Autofocus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Debounce query 200ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Perform search
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setSearchError(null);

    searchRsvpsByName(debouncedQuery)
      .then((data) => {
        if (!isMounted) return;
        setResults(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error("[checkin] search failed:", err);
        // Clear the stale list rather than leave last-good results on screen —
        // showing a guest we can no longer verify is worse than showing nothing.
        setResults([]);
        setSearchError(
          err instanceof Error ? err.message : "Could not reach the guest list.",
        );
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, retryKey]);

  const handleCheckInToggle = async (record: RsvpRecord) => {
    setActionError(null);

    try {
      if (record.checkedIn) {
        await setCheckedIn(record.id, false);
      } else {
        // Confirm the write landed before showing any success affordance.
        await setCheckedIn(record.id, true, record.totalHeadcount);

        setFlashSuccessId(record.id);
        setTimeout(() => setFlashSuccessId(null), 1500);

        setStepperRecord(record);
        setStepperCount(record.totalHeadcount);
      }

      setResults(await searchRsvpsByName(debouncedQuery));
    } catch (err: unknown) {
      console.error("[checkin] check-in write failed:", err);
      setActionError(
        `Could not save the check-in for ${record.guestFullName}. They are NOT checked in — try again.`,
      );
    }
  };

  const handleSaveActualCount = async () => {
    if (!stepperRecord) return;
    setActionError(null);

    try {
      await setCheckedIn(stepperRecord.id, true, stepperCount);
      setResults(await searchRsvpsByName(debouncedQuery));
      setStepperRecord(null);
    } catch (err: unknown) {
      console.error("[checkin] headcount save failed:", err);
      // Leave the stepper open so the count isn't lost and can be retried.
      setActionError(
        `Could not save the headcount for ${stepperRecord.guestFullName}. Try again.`,
      );
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 font-sans text-slate-900 bg-[#F8FAFC]">
      {/* HEADER WITH OFFLINE INDICATOR */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border-2 border-slate-300 shadow-sm">
        <div>
          <h2 className="font-extrabold text-xl text-slate-900">Door Check-In Station</h2>
          <p className="text-xs font-bold text-slate-600">Scan & Verify Entry Headcount</p>
        </div>

        {/* Offline Indicator */}
        <div className="flex items-center gap-2 bg-emerald-100 border-2 border-emerald-500 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide">
          <Wifi className="w-4 h-4 text-emerald-700 stroke-[3]" />
          <span>ONLINE</span>
        </div>
        {/* TODO(claude-code): wire to navigator.onLine and the sync queue */}
      </div>

      {/* PINNED LARGE SEARCH INPUT */}
      <div className="sticky top-16 z-20 bg-[#F8FAFC] py-2">
        <div className="relative">
          <Search className="w-6 h-6 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2 stroke-[3]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search guest name..."
            className="w-full pl-13 pr-4 py-4 bg-white border-3 border-slate-800 rounded-xl text-lg sm:text-xl font-black text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-slate-900/20"
          />
        </div>
      </div>

      {actionError && <AdminError variant="banner" message={actionError} />}

      {/* RESULTS FEED */}
      {loading ? (
        <div className="p-8 text-center text-slate-600 font-bold text-base">
          Searching guest list...
        </div>
      ) : searchError ? (
        /* Must outrank the "NO RSVP FOUND" card below — a failed lookup is not
           evidence the guest is uninvited. */
        <AdminError
          message={`${searchError} This is a connection problem, not proof the guest is missing — do not turn anyone away on this screen.`}
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      ) : results.length === 0 ? (
        /* NO RESULTS PROMINENT RED CARD */
        <div className="bg-red-600 text-white border-4 border-red-800 p-8 rounded-2xl text-center space-y-3 shadow-lg">
          <AlertTriangle className="w-12 h-12 mx-auto stroke-[3]" />
          <h3 className="font-black text-2xl uppercase tracking-wider">
            NO RSVP FOUND
          </h3>
          <p className="font-bold text-lg text-red-100">
            "{debouncedQuery}" is NOT on the confirmed RSVP list.
          </p>
          <p className="text-xs font-semibold text-red-200">
            Please direct guest to event host or entry supervisor desk.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((record) => {
            const adultsCount = record.isAttending ? 1 + (record.hasPlusOne ? 1 : 0) : 0;
            const kidsCount = record.isAttending ? record.children.length : 0;
            const nannyCount = record.isAttending && record.hasNanny ? record.nannyCount : 0;
            const isFlash = flashSuccessId === record.id;

            return (
              <div
                key={record.id}
                className={`bg-white border-3 rounded-2xl p-6 shadow-md space-y-5 ${
                  isFlash
                    ? "bg-emerald-200 border-emerald-600"
                    : record.checkedIn
                    ? "border-emerald-500 bg-emerald-50/40"
                    : "border-slate-800"
                }`}
              >
                {/* GUEST NAME & STATUS BADGE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-200 pb-3">
                  <div>
                    <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tight">
                      {record.guestFullName}
                    </h3>
                    {record.hasPlusOne && (
                      <p className="text-sm font-bold text-slate-600">
                        +1: {record.plusOneName || "Declared Guest"}
                      </p>
                    )}
                  </div>

                  {record.checkedIn && (
                    <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 self-start sm:self-auto">
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                      <span>
                        ✓ CHECKED IN{" "}
                        {record.checkedInAt
                          ? `at ${new Date(record.checkedInAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* BREAKDOWN TABLE */}
                <div className="border-2 border-slate-800 rounded-xl overflow-hidden bg-white">
                  <div className="grid grid-cols-3 bg-slate-100 border-b-2 border-slate-800 text-center text-xs font-black uppercase tracking-wider text-slate-700 py-2">
                    <div>ADULTS</div>
                    <div className="border-x-2 border-slate-800">CHILDREN</div>
                    <div>NANNIES</div>
                  </div>
                  <div className="grid grid-cols-3 text-center text-2xl font-black py-3 text-slate-900">
                    <div>{adultsCount}</div>
                    <div className="border-x-2 border-slate-800 text-rose-600">
                      {kidsCount}
                    </div>
                    <div>{nannyCount}</div>
                  </div>
                </div>

                {/* TOTAL HEADCOUNT SUMMARY */}
                <div className="flex items-center justify-between bg-slate-900 text-white p-3.5 rounded-xl font-black text-base">
                  <span>TOTAL EXPECTED:</span>
                  <span className="text-2xl text-amber-300">{record.totalHeadcount} GUESTS</span>
                </div>

                {/* DIETARY ALERT IF PRESENT */}
                {record.dietaryNotes && (
                  <div className="bg-amber-100 border-2 border-amber-400 p-3 rounded-xl text-xs font-extrabold text-amber-900">
                    ⚠️ DIETARY / ALLERGY: {record.dietaryNotes}
                  </div>
                )}

                {/* FULL-WIDTH CHECK IN BUTTON (MINIMUM 56PX TALL) */}
                <button
                  onClick={() => handleCheckInToggle(record)}
                  className={`w-full min-h-[56px] rounded-xl font-black text-lg sm:text-xl uppercase tracking-wider flex items-center justify-center gap-2 border-3 text-white transition-none ${
                    record.checkedIn
                      ? "bg-slate-700 hover:bg-slate-800 border-slate-900"
                      : "bg-emerald-600 hover:bg-emerald-700 border-emerald-800"
                  }`}
                >
                  {record.checkedIn ? (
                    <>
                      <RotateCcw className="w-6 h-6 stroke-[3]" />
                      <span>UNDO CHECK-IN</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-7 h-7 stroke-[3]" />
                      <span>CHECK IN</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* HEADCOUNT VERIFICATION STEPPER MODAL */}
      {stepperRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-900 rounded-2xl p-6 w-full max-w-md text-slate-900 space-y-6 shadow-2xl">
            <div className="text-center space-y-1">
              <h4 className="font-black text-2xl uppercase">Did Headcount Match?</h4>
              <p className="text-sm font-bold text-slate-600">
                {stepperRecord.guestFullName} declared {stepperRecord.totalHeadcount} expected guests.
              </p>
            </div>

            {/* STEPPER CONTROL */}
            <div className="flex items-center justify-center gap-6 bg-slate-100 p-4 rounded-xl border-2 border-slate-300">
              <button
                onClick={() => setStepperCount(Math.max(1, stepperCount - 1))}
                className="w-14 h-14 bg-slate-800 text-white rounded-xl font-black text-2xl flex items-center justify-center border-2 border-slate-900"
              >
                <Minus className="w-6 h-6 stroke-[3]" />
              </button>

              <div className="text-center">
                <span className="text-4xl font-black text-rose-600 block">{stepperCount}</span>
                <span className="text-xs font-bold text-slate-500 uppercase">Actual Present</span>
              </div>

              <button
                onClick={() => setStepperCount(stepperCount + 1)}
                className="w-14 h-14 bg-slate-800 text-white rounded-xl font-black text-2xl flex items-center justify-center border-2 border-slate-900"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>

            <button
              onClick={handleSaveActualCount}
              className="w-full min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white border-3 border-emerald-900 rounded-xl font-black text-lg uppercase tracking-wider"
            >
              Confirm Headcount ({stepperCount})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
