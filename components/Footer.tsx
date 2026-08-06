import React from "react";
import { eventConfig } from "../config/event.config";
import { SpeechBubble } from "./ui/SpeechBubble";
import { ComicButton } from "./ui/ComicButton";
import { SpiderMaskIcon } from "./ui/SpiderMaskIcon";
import { SpiderEmblem } from "./ui/SpiderEmblem";
import { MessageCircle, Heart, ShieldCheck, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  const whatsappUrl = `https://wa.me/${eventConfig.host.whatsappNumber}`;

  return (
    <footer className="relative bg-[#0B0E14] text-white pt-16 pb-12 px-4 sm:px-8 overflow-hidden border-t-[5px] border-[#111111]">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
        {/* Gift Note Banner */}
        <div className="mb-10 w-full max-w-lg">
          <SpeechBubble tailPosition="bottom-center" bg="bg-[#FFD700]" className="text-[#111111]">
            <div className="flex items-center justify-center gap-2 mb-1">
              <SpiderMaskIcon size={24} />
              <h3 className="font-display text-2xl uppercase tracking-wider text-[#111111]">
                HERO GIFT POLICY
              </h3>
            </div>
            <p className="font-body text-lg font-bold text-[#111111]">
              "{eventConfig.copy.giftNote}"
            </p>
          </SpeechBubble>
        </div>

        {/* WhatsApp Contact Action */}
        <div className="mb-12">
          <div className="font-display text-2xl uppercase text-[#FFD700] mb-4 flex items-center justify-center gap-2">
            <SpiderEmblem size={22} color="#FFD700" />
            <span>HAVE QUESTIONS OR NEED TO UPDATE YOUR SPIDER RSVP?</span>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <ComicButton
              variant="accent"
              size="lg"
              className="px-8 py-4 text-xl sm:text-2xl gap-3 shadow-[6px_6px_0px_#111111] hover:shadow-[3px_3px_0px_#111111]"
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
            <ShieldCheck className="w-4 h-4 text-[#E62429]" />
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
              Spider HQ Portal
            </a>
            <div className="flex items-center gap-1.5">
              <span>Built by</span>
              <a
                href={eventConfig.agency.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FFD700] hover:text-[#E62429] underline font-display text-base tracking-wider inline-flex items-center gap-1"
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

