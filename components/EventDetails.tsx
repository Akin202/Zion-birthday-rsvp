import React from "react";
import { eventConfig } from "../config/event.config";
import { ComicPanel } from "./ui/ComicPanel";
import { ComicButton } from "./ui/ComicButton";
import { Calendar, MapPin, ShieldAlert, Navigation } from "lucide-react";

export const EventDetails: React.FC = () => {
  return (
    <section className="py-12 sm:py-20 px-4 sm:px-8 bg-[#FDF6E3] border-b-[4px] border-[#111111]">
      <div className="max-w-5xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-12">
          <h2 className="font-display text-5xl sm:text-7xl uppercase tracking-wider text-[#111111] drop-shadow-[4px_4px_0px_#FFD700]">
            MISSION DETAILS
          </h2>
          <p className="font-body text-lg sm:text-xl text-[#111111] font-bold mt-2">
            Everything heroes need to know before reporting for duty!
          </p>
        </div>

        {/* 3 Comic Panels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* PANEL 1: WHEN */}
          <ComicPanel rotate={-2} bg="bg-white" className="flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-[#E23636] text-white border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center mb-4 rotate-3">
                <Calendar className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="font-display text-3xl uppercase text-[#E23636] mb-3">
                WHEN
              </h3>
              <div className="font-body space-y-2 text-[#111111] font-bold text-base sm:text-lg">
                <p className="border-b-2 border-dashed border-[#111111]/20 pb-2">
                  <span className="text-[#E23636]">Date:</span> {eventConfig.event.dateDisplay}
                </p>
                <p className="border-b-2 border-dashed border-[#111111]/20 pb-2">
                  <span className="text-[#1B4C9B]">Time:</span> {eventConfig.event.timeDisplay}
                </p>
                <p className="text-sm font-semibold text-slate-600 pt-1">
                  RSVP Deadline: {eventConfig.event.rsvpDeadlineDisplay}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-3 border-t-2 border-[#111111] text-xs font-display uppercase tracking-widest text-[#E23636]">
              PANEL 01 • TIME SIGNAL
            </div>
          </ComicPanel>

          {/* PANEL 2: WHERE */}
          <ComicPanel rotate={2} bg="bg-[#FFFDF5]" className="flex flex-col justify-between border-[#1B4C9B]">
            <div>
              <div className="w-14 h-14 bg-[#1B4C9B] text-white border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center mb-4 -rotate-3">
                <MapPin className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="font-display text-3xl uppercase text-[#1B4C9B] mb-3">
                WHERE
              </h3>
              <div className="font-body space-y-2 text-[#111111] font-bold text-base sm:text-lg mb-6">
                <p className="text-xl font-display text-[#111111]">
                  {eventConfig.event.venueName}
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
                <ComicButton variant="secondary" fullWidth className="gap-2 text-lg">
                  <Navigation className="w-5 h-5" />
                  <span>GET DIRECTIONS</span>
                </ComicButton>
              </a>
              <div className="mt-4 pt-3 border-t-2 border-[#111111] text-xs font-display uppercase tracking-widest text-[#1B4C9B]">
                PANEL 02 • LOCATION HQ
              </div>
            </div>
          </ComicPanel>

          {/* PANEL 3: DRESS CODE */}
          <ComicPanel rotate={-1} bg="bg-white" className="flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-[#FFD700] text-[#111111] border-[3px] border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-center mb-4 rotate-2">
                <ShieldAlert className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="font-display text-3xl uppercase text-[#111111] mb-3">
                DRESS CODE
              </h3>
              <div className="font-body text-[#111111] font-bold text-lg bg-[#FFD700]/30 border-2 border-[#111111] p-4 rounded-none rotate-1 mb-4">
                "{eventConfig.event.dressCode}"
              </div>
              <p className="font-body text-sm text-slate-700">
                Costumes, capes, masks, and superhero gear strongly encouraged! Come as your favourite hero!
              </p>
            </div>
            <div className="mt-6 pt-3 border-t-2 border-[#111111] text-xs font-display uppercase tracking-widest text-[#111111]">
              PANEL 03 • HERO OUTFIT
            </div>
          </ComicPanel>
        </div>
      </div>
    </section>
  );
};
