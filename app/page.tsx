import React from "react";
import { Hero } from "../components/Hero";
import { Countdown } from "../components/Countdown";
import { EventDetails } from "../components/EventDetails";
import { WhatToExpect } from "../components/WhatToExpect";
import { RsvpSection } from "../components/RsvpSection";
import { FaqSection } from "../components/FaqSection";
import { Footer } from "../components/Footer";
import { SectionDivider } from "../components/ui/SectionDivider";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FDF6E3] text-[#111111] font-body selection:bg-[#FF4081] selection:text-white overflow-x-hidden">
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
