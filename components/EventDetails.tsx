import React from "react";
import { eventConfig } from "../config/event.config";
import { ComicPanel } from "./ui/ComicPanel";
import { ComicButton } from "./ui/ComicButton";
import { SpiderMaskIcon } from "./ui/SpiderMaskIcon";
import { SpiderEmblem } from "./ui/SpiderEmblem";
import { Calendar, MapPin, ShieldAlert, Navigation } from "lucide-react";

export const EventDetails: React.FC = () => {
  return (
    <section className="py-12 sm:py-20 px-4 sm:px-8 bg-[#FDF6E3] border-b-[5px] border-[#111111] relative overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#111111] text-[#FFD700] px-4 py-1.5 border-2 border-[#FFD700] font-display text-base uppercase tracking-widest mb-3 shadow-[3px_3px_0px_#E62429]">
            <SpiderMaskIcon size={20} />
            <span>CONFIDENTIAL HERO BRIEFING</span>
          </div>
          <h2 className="font-display text-5xl sm:text-7xl uppercase tracking-wider text-[#111111] drop-shadow-[4px_4px_0px_#FFD700]">
            SPIDER HQ MISSION DETAILS
          </h2>
          <p className="font-body text-lg sm:text-xl text-[#111111] font-bold mt-2">
            Everything web-slingers need to know before reporting for duty!
          </p>
        </div>

        {/* 3 Comic Panels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* PANEL 1: WHEN */}
          <ComicPanel rotate={-2} bg="bg-white" className="flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
            <div>
              <div className="w-14 h-14 bg-[#E62429] text-white border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center mb-4 rotate-3">
                <Calendar className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="font-display text-3xl uppercase text-[#E62429] mb-3 flex items-center gap-2">
                <span>WHEN</span>
                <SpiderEmblem size={20} color="#E62429" />
              </h3>
              <div className="font-body space-y-2 text-[#111111] font-bold text-base sm:text-lg">
                <p className="border-b-2 border-dashed border-[#111111]/20 pb-2">
                  <span className="text-[#E62429]">Date:</span> {eventConfig.event.dateDisplay}
                </p>
                <p className="border-b-2 border-dashed border-[#111111]/20 pb-2">
                  <span className="text-[#114593]">Time:</span> {eventConfig.event.timeDisplay}
                </p>
                <p className="text-sm font-semibold text-slate-600 pt-1">
                  RSVP Deadline: {eventConfig.event.rsvpDeadlineDisplay}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-3 border-t-2 border-[#111111] text-xs font-display uppercase tracking-widest text-[#E62429]">
              PANEL 01 • SPIDER TIME SIGNAL
            </div>
          </ComicPanel>

          {/* PANEL 2: WHERE */}
          <ComicPanel rotate={2} bg="bg-[#FFFDF5]" className="flex flex-col justify-between border-[#114593] hover:scale-[1.02] transition-transform duration-200">
            <div>
              <div className="w-14 h-14 bg-[#114593] text-white border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center mb-4 -rotate-3">
                <MapPin className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="font-display text-3xl uppercase text-[#114593] mb-3 flex items-center gap-2">
                <span>WHERE</span>
                <SpiderEmblem size={20} color="#114593" />
              </h3>
              <div className="font-body space-y-2 text-[#111111] font-bold text-base sm:text-lg mb-6">
                <p className="text-xl font-display text-[#111111] flex items-center gap-1.5">
                  <span>🕷️ {eventConfig.event.venueName}</span>
                </p>
                <p className="text-slate-700">
                  {eventConfig.event.venueAddress}
                </p>
              </div>
            </div>

            <div>
              <a
                href={eventConfig.event.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <ComicButton variant="secondary" fullWidth className="gap-2 text-lg shadow-[4px_4px_0px_#E62429]">
                  <Navigation className="w-5 h-5" />
                  <span>WEB-SLING DIRECTIONS</span>
                </ComicButton>
              </a>
              <div className="mt-4 pt-3 border-t-2 border-[#111111] text-xs font-display uppercase tracking-widest text-[#114593]">
                PANEL 02 • LOCATION SPIDER HQ
              </div>
            </div>
          </ComicPanel>

          {/* PANEL 3: DRESS CODE */}
          <ComicPanel rotate={-1} bg="bg-white" className="flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
            <div>
              <div className="w-14 h-14 bg-[#FFD700] text-[#111111] border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center mb-4 rotate-2">
                <ShieldAlert className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="font-display text-3xl uppercase text-[#111111] mb-3 flex items-center gap-2">
                <span>HERO SUIT</span>
                <SpiderEmblem size={20} color="#E62429" />
              </h3>
              <div className="font-body text-[#111111] font-bold text-lg bg-[#FFD700]/30 border-2 border-[#111111] p-4 rounded-none rotate-1 mb-4">
                "{eventConfig.event.dressCode}"
              </div>
              <p className="font-body text-sm text-slate-700 font-medium">
                Spider-Man suits, Spider-Gwen, Miles Morales, capes, masks, and superhero gear strongly encouraged!
              </p>
            </div>
            <div className="mt-6 pt-3 border-t-2 border-[#111111] text-xs font-display uppercase tracking-widest text-[#111111]">
              PANEL 03 • SUIT UP OUTFIT
            </div>
          </ComicPanel>
        </div>
      </div>
    </section>
  );
};

