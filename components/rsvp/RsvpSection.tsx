import React, { useState } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "motion/react";
import { eventConfig } from "../../config/event.config";
import { RsvpFormValues, RsvpRecord, SubmissionState, calculateHeadcount } from "../../types/rsvp";
import { submitRsvp } from "../../lib/data-access";
import { RsvpForm } from "./RsvpForm";
import { SpeechBubble } from "../ui/SpeechBubble";
import { ComicPanel } from "../ui/ComicPanel";
import { ComicButton } from "../ui/ComicButton";
import { BurstBadge } from "../ui/BurstBadge";
import { ConfettiBurst } from "../ui/ConfettiBurst";
import { SpiderMaskIcon } from "../ui/SpiderMaskIcon";
import { SpiderEmblem } from "../ui/SpiderEmblem";
import { generateGoogleCalendarUrl, generateWhatsAppShareUrl } from "../../lib/calendar";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import {
  Calendar,
  MapPin,
  Share2,
  CheckCircle2,
  AlertOctagon,
  MessageCircle,
  Sparkles,
  ArrowRight,
  UserCheck,
  RefreshCw,
  Clock,
} from "lucide-react";

export const RsvpSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Helper to scroll smoothly to top of RSVP section
  const scrollToRsvpSection = () => {
    if (typeof window !== "undefined") {
      const el = document.getElementById("rsvp");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // 1. Name Gate State
  const [gateInputName, setGateInputName] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);
  const [enteredName, setEnteredName] = useState("");

  // 2. Submission State
  const [submissionState, setSubmissionState] = useState<SubmissionState>({ status: "idle" });

  // Check deadline
  const isDeadlinePassed = Date.now() > new Date(eventConfig.event.rsvpDeadline).getTime();

  // Name gate submit validation: trimmed, min 3 chars, at least 2 words
  const handleNameGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = gateInputName.trim();
    if (!trimmed || trimmed.length < 3) {
      setGateError("Please enter your name (at least 3 characters).");
      return;
    }
    const words = trimmed.split(/\s+/);
    if (words.length < 2) {
      setGateError("Please enter both your first and last name (e.g. Samuel Okon).");
      return;
    }

    setGateError(null);
    setEnteredName(trimmed);
    setIsNameSubmitted(true);
    setTimeout(scrollToRsvpSection, 50);
  };

  // Handle Form Submit
  const handleFormSubmit = async (values: RsvpFormValues) => {
    setSubmissionState({ status: "submitting" });

    try {
      const result = await submitRsvp(values);
      setSubmissionState(result);

      // Scroll to top of RSVP section so user clearly sees the result
      setTimeout(scrollToRsvpSection, 50);
    } catch (err) {
      console.error("RSVP submission failed:", err);
      setSubmissionState({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
      setTimeout(scrollToRsvpSection, 50);
    }
  };

  const firstName = enteredName ? enteredName.split(" ")[0] : "Hero";

  const activeStatus = submissionState.status;

  const activeRecord = submissionState.status === "success" ? submissionState.record : null;

  // Google Maps Directions Link (points at the exact venue pin)
  const directionsUrl = eventConfig.event.googleMapsUrl;

  return (
    <LazyMotion features={domAnimation}>
      <section
        id="rsvp"
        className="py-16 sm:py-24 px-4 sm:px-8 bg-[#FDF6E3] bg-halftone-red border-b-[5px] border-[#111111] scroll-mt-6 relative"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
          {/* MANDATORY CONTRACT PLACEHOLDER DIV FOR LANDING PAGE ANCHOR */}
          <div className="w-full max-w-3xl mb-4" />

          {/* DEADLINE EXPIRED STATE */}
          {isDeadlinePassed ? (
            <ComicPanel rotate={-1} bg="bg-white" className="w-full max-w-2xl p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-[#E62429] text-white border-[3px] border-[#111111] flex items-center justify-center font-display text-3xl mx-auto shadow-[4px_4px_0px_#111111]">
                <Clock className="w-10 h-10 text-[#FFD700]" />
              </div>

              <div className="space-y-3">
                <BurstBadge text="SPIDER-HQ RSVP CLOSED" color="#E62429" textColor="#FFFFFF" size="lg" />
                <h3 className="font-display text-3xl sm:text-4xl uppercase text-[#111111]">
                  RESERVATIONS ARE NOW CLOSED
                </h3>
                <p className="font-body text-lg font-bold text-slate-700 max-w-md mx-auto">
                  RSVP closed on {eventConfig.event.rsvpDeadlineDisplay}. Please contact {eventConfig.host.contactName} directly for last-minute availability.
                </p>
              </div>

              <div className="pt-4 border-t-2 border-dashed border-[#111111]/20 flex justify-center">
                <a
                  href={`https://wa.me/${eventConfig.host.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ComicButton variant="primary" size="lg" className="gap-2">
                    <MessageCircle className="w-6 h-6 stroke-[2.5]" />
                    <span>CONTACT {eventConfig.host.contactName.toUpperCase()} ON WHATSAPP</span>
                  </ComicButton>
                </a>
              </div>
            </ComicPanel>
          ) : (
            <div className="w-full max-w-3xl">
              {/* STATE DISPLAY DECISION MATRIX */}
              <AnimatePresence mode="wait">
                {/* 1. NAME GATE VIEW */}
                {!isNameSubmitted && activeStatus === "idle" && (
                  <m.div
                    key="name-gate"
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
                    exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="w-full flex justify-center"
                  >
                    <ComicPanel rotate={1} bg="bg-white" className="w-full max-w-xl p-8 sm:p-10 text-center space-y-6">
                      <div className="w-16 h-16 bg-[#114593] text-white border-[3px] border-[#111111] flex items-center justify-center font-display text-2xl mx-auto shadow-[4px_4px_0px_#E62429]">
                        <SpiderMaskIcon size={36} />
                      </div>

                      <div>
                        <h3 className="font-display text-3xl sm:text-4xl uppercase tracking-wide text-[#111111]">
                          BEFORE WE BEGIN — WHAT'S YOUR HERO NAME?
                        </h3>
                        <p className="font-body text-sm font-semibold text-slate-600 mt-2">
                          Enter your full name so we can personalize your Spider-HQ invitation.
                        </p>
                      </div>

                      <form onSubmit={handleNameGateSubmit} className="space-y-4">
                        <div className="space-y-2 text-left">
                          <label htmlFor="gateNameInput" className="sr-only">Your Full Name</label>
                          <input
                            id="gateNameInput"
                            type="text"
                            value={gateInputName}
                            onChange={(e) => {
                              setGateInputName(e.target.value);
                              if (gateError) setGateError(null);
                            }}
                            placeholder="e.g. Samuel Okon"
                            className="w-full bg-[#FFFDF5] border-[3.5px] border-[#111111] p-4 text-center font-display text-2xl uppercase tracking-wider text-[#111111] placeholder:text-slate-400 placeholder:normal-case placeholder:font-body placeholder:text-lg outline-none focus:border-[#E62429] focus:ring-4 focus:ring-[#E62429]/20"
                          />
                          {gateError && (
                            <SpeechBubble tailPosition="top-center" bg="bg-[#E62429]" className="text-white text-center">
                              <p className="font-body text-xs font-bold flex items-center justify-center gap-1.5">
                                <AlertOctagon className="w-4 h-4 text-[#FFD700]" />
                                <span>{gateError}</span>
                              </p>
                            </SpeechBubble>
                          )}
                        </div>

                        <ComicButton
                          type="submit"
                          variant="accent"
                          size="lg"
                          className="w-full text-xl py-4 gap-2 shadow-[6px_6px_0px_#111111]"
                        >
                          <span>CONTINUE TO SPIDER-HQ RSVP</span>
                          <ArrowRight className="w-6 h-6 stroke-[3]" />
                        </ComicButton>
                      </form>
                    </ComicPanel>
                  </m.div>
                )}

                {/* 2. FORM VIEW (IDLE OR SUBMITTING) */}
                {isNameSubmitted &&
                  (activeStatus === "idle" || activeStatus === "submitting") && (
                    <m.div
                      key="form-view"
                      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? {} : { opacity: 0, y: -20 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="space-y-6"
                    >
                      {/* Personal Greeting Strip */}
                      <ComicPanel rotate={-1} bg="bg-[#FFD700]" className="p-4 sm:p-5 flex items-center justify-between border-[3.5px]">
                        <div className="flex items-center gap-3">
                          <SpiderMaskIcon size={28} />
                          <div>
                            <h3 className="font-display text-2xl uppercase text-[#111111]">
                              ALRIGHT HERO {firstName.toUpperCase()}, LET'S SUIT YOU UP!
                            </h3>
                            <p className="font-body text-xs font-bold text-[#111111]/80">
                              Fill out your guest details below for Zion's 7th Birthday Party
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsNameSubmitted(false);
                            setGateInputName("");
                            scrollToRsvpSection();
                          }}
                          className="font-body text-xs font-bold text-[#111111] underline hover:text-[#E62429] transition-colors"
                        >
                          Change name
                        </button>
                      </ComicPanel>

                      {/* RsvpForm Presentational Component */}
                      <RsvpForm
                        initialValues={{
                          guestFullName: enteredName || "Adebayo Ogunlesi",
                        }}
                        submissionState={submissionState}
                        onSubmit={handleFormSubmit}
                      />
                    </m.div>
                  )}

                {/* 3. SUCCESS STATE VIEW */}
                {activeStatus === "success" && activeRecord && (
                  <m.div
                    key="success-view"
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
                    exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="relative w-full"
                    aria-live="polite"
                  >
                    {/* CSS Confetti Burst */}
                    <ConfettiBurst />

                    <ComicPanel rotate={1} bg="bg-white" className="p-6 sm:p-10 space-y-8 relative z-10 border-[4.5px]">
                      {/* Top Burst Badge & Header */}
                      <div className="text-center space-y-4">
                        <BurstBadge text="THWIP! YOU'RE IN!" color="#E62429" textColor="#FFFFFF" size="lg" />

                        <h3 className="font-display text-4xl sm:text-6xl uppercase text-[#111111] tracking-wider drop-shadow-[3px_3px_0px_#FFD700] flex items-center justify-center gap-3">
                          <SpiderMaskIcon size={44} />
                          <span>SPIDER-HQ RSVP CONFIRMED!</span>
                        </h3>

                        <p className="font-body text-lg font-bold text-slate-700 max-w-xl mx-auto">
                          Thank you hero <span className="text-[#E62429] underline">{activeRecord.guestFullName}</span>! Your Spider-Man party pass and superhero gear are secured.
                        </p>

                        <div className="inline-flex items-center gap-2 bg-[#FFFDF5] border-2 border-[#111111] px-4 py-1.5 font-body text-xs font-bold text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>A confirmation email is on its way to your inbox.</span>
                        </div>
                      </div>

                      {/* Summary of Answers */}
                      <div className="bg-[#FDF6E3] border-[3.5px] border-[#111111] p-6 shadow-[5px_5px_0px_#111111] space-y-4">
                        <div className="flex items-center justify-between border-b-2 border-[#111111] pb-3">
                          <h4 className="font-display text-xl uppercase text-[#111111] flex items-center gap-2">
                            <SpiderEmblem size={18} color="#E62429" />
                            <span>YOUR SPIDER DISPATCH SUMMARY</span>
                          </h4>
                          <span className="bg-[#FFD700] border border-[#111111] font-display text-xs px-2.5 py-1">
                            {activeRecord.totalHeadcount} TOTAL HEROES
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body text-sm">
                          <div>
                            <span className="text-slate-500 font-bold block text-xs">Primary Guest:</span>
                            <span className="font-bold text-[#111111] text-base">{activeRecord.guestFullName}</span>
                          </div>

                          <div>
                            <span className="text-slate-500 font-bold block text-xs">Contact Email & Phone:</span>
                            <span className="font-bold text-[#111111]">{activeRecord.email}</span>
                            <span className="block text-slate-600 text-xs font-mono">{activeRecord.phone}</span>
                          </div>

                          <div>
                            <span className="text-slate-500 font-bold block text-xs">Attendance Status:</span>
                            <span className="font-bold text-[#E62429]">
                              {activeRecord.isAttending ? "REPORTING FOR DUTY 🕷️" : "DECLINED 😢"}
                            </span>
                          </div>

                          {activeRecord.hasPlusOne && (
                            <div>
                              <span className="text-slate-500 font-bold block text-xs">Plus-One Sidekick:</span>
                              <span className="font-bold text-[#111111]">{activeRecord.plusOneName}</span>
                            </div>
                          )}

                          {activeRecord.children.length > 0 && (
                            <div>
                              <span className="text-slate-500 font-bold block text-xs">Little Heroes Attending:</span>
                              <span className="font-bold text-[#111111]">
                                {activeRecord.children.length} ({activeRecord.children.map((c) => `Age ${c.age}`).join(", ")})
                              </span>
                            </div>
                          )}

                          {activeRecord.hasNanny && (
                            <div>
                              <span className="text-slate-500 font-bold block text-xs">Hero Caretakers:</span>
                              <span className="font-bold text-[#111111]">{activeRecord.nannyCount} caretaker(s)</span>
                            </div>
                          )}
                        </div>

                        {activeRecord.messageToCelebrant && (
                          <div className="pt-3 border-t-2 border-dashed border-[#111111]/20">
                            <span className="text-slate-500 font-bold block text-xs">Hero Message for {eventConfig.celebrant.name}:</span>
                            <p className="font-body text-sm font-bold text-[#111111] italic mt-1 bg-white p-3 border border-[#111111]">
                              "{activeRecord.messageToCelebrant}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Event Date, Time, Venue Recap */}
                      <div className="bg-[#111111] text-white p-6 border-[3.5px] border-[#111111] shadow-[5px_5px_0px_#FFD700] grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-6 h-6 text-[#FFD700] min-w-[24px]" />
                          <div>
                            <span className="font-display text-sm text-[#FFD700] uppercase block">DATE & TIME</span>
                            <span className="font-body text-base font-bold">{eventConfig.event.dateDisplay}</span>
                            <span className="block font-body text-xs text-slate-300">{eventConfig.event.timeDisplay}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-6 h-6 text-[#FFD700] min-w-[24px]" />
                          <div>
                            <span className="font-display text-sm text-[#FFD700] uppercase block">VENUE</span>
                            <span className="font-body text-base font-bold">{eventConfig.event.venueName}</span>
                            <span className="block font-body text-xs text-slate-300">{eventConfig.event.venueAddress}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Add to Calendar, Get Directions, Share Invite */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                        <a
                          href={generateGoogleCalendarUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <ComicButton variant="secondary" size="md" className="w-full gap-2 text-base">
                            <Calendar className="w-5 h-5" />
                            <span>ADD TO CALENDAR</span>
                          </ComicButton>
                        </a>

                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <ComicButton variant="yellow" size="md" className="w-full gap-2 text-base">
                            <MapPin className="w-5 h-5" />
                            <span>WEB-SLING DIRECTIONS</span>
                          </ComicButton>
                        </a>

                        <a
                          href={generateWhatsAppShareUrl(activeRecord.guestFullName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <ComicButton variant="primary" size="md" className="w-full gap-2 text-base">
                            <Share2 className="w-5 h-5" />
                            <span>SHARE THIS DISPATCH</span>
                          </ComicButton>
                        </a>
                      </div>

                      {/* Reset / Edit Button */}
                      <div className="text-center pt-4 border-t-2 border-dashed border-[#111111]/20">
                        <button
                          type="button"
                          onClick={() => {
                            setSubmissionState({ status: "idle" });
                            scrollToRsvpSection();
                          }}
                          className="font-body text-xs font-bold text-slate-600 underline hover:text-[#E62429]"
                        >
                          Need to update your answers? Click to re-open form.
                        </button>
                      </div>
                    </ComicPanel>
                  </m.div>
                )}

                {/* 4. DUPLICATE STATE VIEW */}
                {activeStatus === "duplicate" && (
                  <m.div
                    key="duplicate-view"
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
                    exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    aria-live="polite"
                    className="w-full flex justify-center"
                  >
                    <ComicPanel rotate={-1} bg="bg-[#FFD700]" className="w-full max-w-xl p-8 sm:p-10 text-center space-y-6">
                      <div className="w-16 h-16 bg-[#111111] text-[#FFD700] border-[3px] border-[#111111] flex items-center justify-center font-display text-3xl mx-auto shadow-[4px_4px_0px_#FFFFFF]">
                        <RefreshCw className="w-10 h-10" />
                      </div>

                      <div className="space-y-3">
                        <BurstBadge text="ALREADY IN SPIDER HQ!" color="#111111" textColor="#FFD700" size="lg" />
                        <h3 className="font-display text-3xl sm:text-4xl uppercase text-[#111111]">
                          LOOKS LIKE YOU'VE ALREADY RSVP'D!
                        </h3>
                        <p className="font-body text-base font-bold text-[#111111] max-w-md mx-auto">
                          We've sent a link to your email to update your response. If you didn't receive it or want to update now, contact our host directly on WhatsApp!
                        </p>
                      </div>

                      <div className="pt-4 border-t-2 border-dashed border-[#111111]/30 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a
                          href={generateWhatsAppShareUrl(enteredName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <ComicButton variant="primary" size="md" className="w-full gap-2">
                            <MessageCircle className="w-5 h-5" />
                            <span>UPDATE VIA WHATSAPP</span>
                          </ComicButton>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setSubmissionState({ status: "idle" });
                            scrollToRsvpSection();
                          }}
                          className="font-body text-xs font-bold text-[#111111] underline hover:text-[#E62429] px-4 py-2"
                        >
                          Back to Form
                        </button>
                      </div>
                    </ComicPanel>
                  </m.div>
                )}

                {/* 5. ERROR STATE VIEW */}
                {activeStatus === "error" && (
                  <m.div
                    key="error-view"
                    initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
                    exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    role="alert"
                    aria-live="assertive"
                    className="w-full flex justify-center"
                  >
                    <ComicPanel rotate={1} bg="bg-white" className="w-full max-w-xl p-8 sm:p-10 text-center space-y-6">
                      <div className="w-16 h-16 bg-[#E62429] text-white border-[3px] border-[#111111] flex items-center justify-center font-display text-3xl mx-auto shadow-[4px_4px_0px_#111111]">
                        <AlertOctagon className="w-10 h-10 text-[#FFD700]" />
                      </div>

                      <div className="space-y-3">
                        <BurstBadge text="SPIDER DISPATCH ERROR" color="#E62429" textColor="#FFFFFF" size="lg" />
                        <h3 className="font-display text-3xl sm:text-4xl uppercase text-[#111111]">
                          SPIDER-HQ COMMUNICATIONS ARE DOWN!
                        </h3>
                        <p className="font-body text-base font-bold text-slate-700 max-w-md mx-auto">
                          {submissionState.status === "error"
                            ? submissionState.message
                            : "We encountered an issue processing your RSVP online. Don't worry — send your hero details via WhatsApp to secure your spot!"}
                        </p>
                      </div>

                      <div className="pt-4 border-t-2 border-dashed border-[#111111]/20 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a
                          href={generateWhatsAppShareUrl(enteredName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <ComicButton variant="primary" size="md" className="w-full gap-2">
                            <MessageCircle className="w-5 h-5" />
                            <span>RSVP VIA WHATSAPP</span>
                          </ComicButton>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setSubmissionState({ status: "idle" });
                            scrollToRsvpSection();
                          }}
                          className="font-body text-xs font-bold text-slate-600 underline hover:text-[#E62429] px-4 py-2"
                        >
                          Try Again
                        </button>
                      </div>
                    </ComicPanel>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </LazyMotion>
  );
};

