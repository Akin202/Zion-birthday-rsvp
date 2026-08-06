import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RsvpForm } from "../components/rsvp/RsvpForm";
import { ComicPanel } from "../components/ui/ComicPanel";
import { ComicButton } from "../components/ui/ComicButton";
import { loadRsvpByToken, saveRsvpByToken } from "../lib/rsvp-edit";
import { eventConfig } from "../config/event.config";
import type { RsvpFormValues, SubmissionState } from "../types/rsvp";

/**
 * /rsvp/edit?token=... — reached only from the link in the confirmation email.
 *
 * The name gate that fronts the main RSVP section is deliberately absent here:
 * holding the token already establishes who this is, and asking again would be
 * friction for no gain.
 *
 * Three failure modes, kept distinct on purpose:
 *   - bad or unknown token  → a friendly dead end with a WhatsApp fallback, and
 *     wording that never reveals whether the token existed
 *   - network/server error  → retryable, clearly not the guest's fault
 *   - validation rejection  → handled inside RsvpForm as normal
 */

type PageState =
  | { kind: "loading" }
  | { kind: "ready"; values: RsvpFormValues }
  | { kind: "not_found" }
  | { kind: "error"; message: string };

function whatsappHref(message: string): string {
  return `https://wa.me/${eventConfig.host.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

const HelpPanel: React.FC<{
  heading: string;
  body: string;
  whatsappMessage: string;
  onRetry?: () => void;
}> = ({ heading, body, whatsappMessage, onRetry }) => (
  <ComicPanel className="mx-auto max-w-lg space-y-5 p-8 text-center">
    <h1 className="text-3xl font-black uppercase tracking-tight">{heading}</h1>
    <p className="text-base leading-relaxed">{body}</p>

    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      {onRetry && (
        <ComicButton variant="primary" onClick={onRetry}>
          TRY AGAIN
        </ComicButton>
      )}
      <a href={whatsappHref(whatsappMessage)} target="_blank" rel="noopener noreferrer">
        <ComicButton variant="secondary" fullWidth>
          MESSAGE {eventConfig.host.contactName.toUpperCase()}
        </ComicButton>
      </a>
    </div>
  </ComicPanel>
);

export const EditRsvpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [pageState, setPageState] = useState<PageState>({ kind: "loading" });
  const [submissionState, setSubmissionState] = useState<SubmissionState>({ status: "idle" });
  const [savedHeadcount, setSavedHeadcount] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setPageState({ kind: "not_found" });
      return;
    }

    let isMounted = true;
    setPageState({ kind: "loading" });

    loadRsvpByToken(token).then((result) => {
      if (!isMounted) return;

      if (result.status === "found") {
        setPageState({ kind: "ready", values: result.values });
      } else if (result.status === "not_found") {
        setPageState({ kind: "not_found" });
      } else {
        setPageState({ kind: "error", message: result.message });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [token, reloadKey]);

  const handleSubmit = useCallback(
    async (values: RsvpFormValues) => {
      setSubmissionState({ status: "submitting" });
      const result = await saveRsvpByToken(token, values);

      if (result.status === "success") {
        setSavedHeadcount(result.totalHeadcount);
        // Keep the edited values on screen rather than refetching — the server
        // is authoritative only on headcount, which we just took from it.
        setPageState({ kind: "ready", values });
        setSubmissionState({ status: "idle" });
      } else if (result.status === "not_found") {
        setPageState({ kind: "not_found" });
      } else {
        setSubmissionState({ status: "error", message: result.message });
      }
    },
    [token],
  );

  if (pageState.kind === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-lg font-bold" role="status">
          Loading your RSVP...
        </p>
      </main>
    );
  }

  if (pageState.kind === "not_found") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <HelpPanel
          heading="This link isn't working"
          body={`We couldn't open an RSVP with that link. It may have expired, or the address may have been cut short when it was copied. ${eventConfig.host.contactName} can update your RSVP for you in a moment.`}
          whatsappMessage={`Hi ${eventConfig.host.contactName}, my RSVP edit link isn't working and I'd like to change my details for ${eventConfig.event.title}.`}
        />
      </main>
    );
  }

  if (pageState.kind === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <HelpPanel
          heading="Something went wrong"
          body={`${pageState.message} Your RSVP is safe — this is a problem on our side, not with your link.`}
          whatsappMessage={`Hi ${eventConfig.host.contactName}, I'm having trouble loading my RSVP page.`}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 space-y-2 text-center">
        <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
          Update your RSVP
        </h1>
        <p className="text-base">
          Change anything you like before {eventConfig.event.rsvpDeadlineDisplay}.
        </p>
      </header>

      {savedHeadcount !== null && submissionState.status === "idle" && (
        <div
          role="status"
          className="mb-6 rounded-lg border-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-center font-bold text-emerald-900"
        >
          Saved. We now have you down for {savedHeadcount}{" "}
          {savedHeadcount === 1 ? "person" : "people"}.
        </div>
      )}

      <RsvpForm
        initialValues={pageState.values}
        submissionState={submissionState}
        onSubmit={handleSubmit}
      />
    </main>
  );
};

export default EditRsvpPage;
