import React from "react";
import { eventConfig } from "../config/event.config";
import { SpeechBubble } from "./ui/SpeechBubble";
import { ComicButton } from "./ui/ComicButton";
import { MessageCircle, Heart, ShieldCheck, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  const whatsappUrl = `https://wa.me/${eventConfig.host.whatsappNumber}`;

  return (
    <footer className="relative bg-[#111111] text-white pt-16 pb-12 px-4 sm:px-8 overflow-hidden">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Gift Note Banner */}
        <div className="mb-10 w-full max-w-lg">
          <SpeechBubble tailPosition="bottom-center" bg="bg-[#FFD700]" className="text-[#111111]">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="w-6 h-6 text-[#E23636] fill-[#E23636]" />
              <h3 className="font-display text-2xl uppercase tracking-wider text-[#111111]">
                GIFT POLICY
              </h3>
            </div>
            <p className="font-body text-lg font-bold text-[#111111]">
              "{eventConfig.copy.giftNote}"
            </p>
          </SpeechBubble>
        </div>

        {/* WhatsApp Contact Action */}
        <div className="mb-12">
          <p className="font-display text-2xl uppercase text-[#FFD700] mb-4">
            HAVE QUESTIONS OR NEED TO UPDATE YOUR RSVP?
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <ComicButton
              variant="primary"
              size="lg"
              className="px-8 py-4 text-xl sm:text-2xl gap-3 shadow-[6px_6px_0px_#FFD700] hover:shadow-[3px_3px_0px_#FFD700]"
            >
              <MessageCircle className="w-7 h-7 stroke-[2.5]" />
              <span>MESSAGE {eventConfig.host.contactName.toUpperCase()} ON WHATSAPP</span>
            </ComicButton>
          </a>
        </div>

        {/* Divider */}
        <div className="w-full border-t-2 border-dashed border-white/20 my-6" />

        {/* Host Contact Info & Agency Credit */}
        <div className="flex flex-col sm:flex-row items-center justify-between w-full font-body text-sm text-slate-400 gap-4">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-[#00AEEF]" />
            <span>Hosted with love by {eventConfig.host.contactName} ({eventConfig.host.contactPhone})</span>
          </div>

          <div className="flex items-center gap-4 font-bold">
            <a
              href="/admin/login"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, "", "/admin/login");
                window.dispatchEvent(new Event("popstate"));
              }}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Staff Portal
            </a>
            <div className="flex items-center gap-1.5">
              <span>Built by</span>
              <a
                href={eventConfig.agency.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00AEEF] hover:text-[#FFD700] underline font-display text-base tracking-wider inline-flex items-center gap-1"
              >
                <span>{eventConfig.agency.name}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
