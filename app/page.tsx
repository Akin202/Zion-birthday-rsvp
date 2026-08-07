import React, { useEffect } from "react";
import { Hero } from "../components/Hero";
import { Countdown } from "../components/Countdown";
import { EventDetails } from "../components/EventDetails";
import { WhatToExpect } from "../components/WhatToExpect";
import { RsvpSection } from "../components/RsvpSection";
import { FaqSection } from "../components/FaqSection";
import { Footer } from "../components/Footer";
import { SectionDivider } from "../components/ui/SectionDivider";
import { WebShooterFX } from "../components/ui/WebShooterFX";

export default function Home() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#FDF6E3] text-[#111111] font-body selection:bg-[#E62429] selection:text-white overflow-x-hidden relative">
      {/* Spider Web Shooter Global FX Layer */}
      <WebShooterFX />

      {/* 1. HERO SECTION */}
      <Hero />

      {/* 2. COUNTDOWN SECTION */}
      <Countdown />

      {/* 3. EVENT DETAILS SECTION */}
      <EventDetails />

      <SectionDivider color="#111111" />

      {/* 4. WHAT TO EXPECT SECTION */}
      <WhatToExpect />

      <SectionDivider color="#FDF6E3" flip />

      {/* 5. RSVP SECTION */}
      <RsvpSection />

      {/* 6. FAQ SECTION */}
      <FaqSection />

      {/* 7. FOOTER SECTION */}
      <Footer />
    </main>
  );
}

