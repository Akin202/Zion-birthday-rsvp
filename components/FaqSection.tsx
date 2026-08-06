import React, { useState } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "motion/react";
import { eventConfig } from "../config/event.config";
import { ComicPanel } from "./ui/ComicPanel";
import { SpiderMaskIcon } from "./ui/SpiderMaskIcon";
import { SpiderEmblem } from "./ui/SpiderEmblem";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Plus, Minus } from "lucide-react";

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  const toggleFaq = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <LazyMotion features={domAnimation}>
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-[#FDF6E3] border-b-[5px] border-[#111111] relative overflow-hidden">
        <div className="max-w-3xl mx-auto flex flex-col items-center relative z-10">
          {/* Header */}
          <div className="inline-flex items-center gap-2 bg-[#E62429] text-white font-display text-lg sm:text-2xl uppercase tracking-wider px-5 py-2 border-[3.5px] border-[#111111] shadow-[4px_4px_0px_#111111] -rotate-1 mb-4">
            <SpiderMaskIcon size={26} />
            <span>SPIDER-HQ KNOWLEDGE BASE</span>
          </div>

          <h2 className="font-display text-5xl sm:text-7xl uppercase tracking-wider text-[#111111] text-center drop-shadow-[4px_4px_0px_#FFD700] mb-10">
            FREQUENTLY ASKED QUESTIONS
          </h2>

          {/* Accordion List */}
          <div className="w-full space-y-4">
            {eventConfig.faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <ComicPanel
                  key={faq.q}
                  rotate={idx % 2 === 0 ? -1 : 1}
                  bg="bg-white"
                  className="p-0 overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform duration-200 border-[3.5px]"
                  onClick={() => toggleFaq(idx)}
                >
                  <div className="p-4 sm:p-6 flex items-center justify-between gap-4 select-none bg-white hover:bg-[#FFFDF5] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 min-w-[40px] bg-[#E62429] border-2 border-[#111111] font-display text-lg text-white flex items-center justify-center shadow-[2px_2px_0px_#111111]">
                        Q{idx + 1}
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl uppercase text-[#111111] leading-tight flex items-center gap-2">
                        <span>{faq.q}</span>
                      </h3>
                    </div>

                    <button
                      type="button"
                      aria-expanded={isOpen}
                      className="w-10 h-10 min-w-[40px] bg-[#111111] text-[#FFD700] border-2 border-[#111111] flex items-center justify-center font-display transition-transform duration-200"
                    >
                      {isOpen ? (
                        <Minus className="w-6 h-6 stroke-[3]" />
                      ) : (
                        <Plus className="w-6 h-6 stroke-[3]" />
                      )}
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <m.div
                        initial={shouldReduceMotion ? {} : { height: 0, opacity: 0 }}
                        animate={shouldReduceMotion ? {} : { height: "auto", opacity: 1 }}
                        exit={shouldReduceMotion ? {} : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden border-t-2 border-dashed border-[#111111]/30 bg-[#FFFDF5]"
                      >
                        <div className="p-4 sm:p-6 font-body text-base sm:text-lg text-[#111111] font-semibold leading-relaxed flex items-start gap-3">
                          <SpiderEmblem size={20} color="#E62429" className="min-w-[20px] mt-1" />
                          <div>{faq.a}</div>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </ComicPanel>
              );
            })}
          </div>
        </div>
      </section>
    </LazyMotion>
  );
};

