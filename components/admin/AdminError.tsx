import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface AdminErrorProps {
  message: string;
  onRetry?: () => void;
  /** `banner` sits above working content; `panel` replaces it. */
  variant?: "panel" | "banner";
}

/**
 * Admin-side failure surface.
 *
 * Every admin screen loads from the network, and on event day the venue's wifi
 * is the least reliable part of the system. A silent failure that leaves a
 * spinner spinning is worse than an error: staff cannot tell "no results" from
 * "the query died", and a check-in that did not save must never look like one
 * that did.
 */
export const AdminError: React.FC<AdminErrorProps> = ({
  message,
  onRetry,
  variant = "panel",
}) => {
  const isBanner = variant === "banner";

  return (
    <div
      role="alert"
      className={
        isBanner
          ? "flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3"
          : "flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center"
      }
    >
      <AlertTriangle
        className={isBanner ? "mt-0.5 h-5 w-5 shrink-0 text-red-600" : "h-10 w-10 text-red-600"}
        aria-hidden="true"
      />

      <div className={isBanner ? "flex-1" : "space-y-1"}>
        <p className="font-bold text-red-900">Something went wrong</p>
        <p className="text-sm text-red-800">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
};
