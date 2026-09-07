export const eventConfig = {
  celebrant: { name: "Zion", fullName: "Zion Awolowo", age: 7, photoUrl: "/images/celebrant.jpg" },
  event: {
    title: "Zion's 7th Birthday Spider-Verse Celebration",
    date: "2026-10-17T12:00:00+01:00",
    dateDisplay: "Saturday, October 17th, 2026",
    timeDisplay: "12:00 PM - 7:00 PM",
    venueName: "SPIDER HQ — THE AMORE GARDENS",
    venueAddress: "The Amore Gardens, 1 Amore Street, Freedom Way, Lekki Phase 1, Lagos",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent("The Amore Gardens, 1 Amore Street, Freedom Way, Lekki Phase 1, Lagos"),
    dressCode: "Kids: Superhero Costumes | Adults: Colourful & Classy (Emerald Green & Royal Blue)",
    kidsDressCode: "Suit up in your favourite Spider-Man suit or Superhero costume!",
    adultDressCode: "Colourful & Classy",
    adultColors: [
      { name: "Emerald Green", hex: "#046A38", bgClass: "bg-[#046A38]" },
      { name: "Royal Blue", hex: "#4169E1", bgClass: "bg-[#4169E1]" }
    ],
    rsvpDeadline: "2026-09-30T23:59:59+01:00",
    rsvpDeadlineDisplay: "September 30th, 2026",
  },
  host: { contactName: "Saidat", contactPhone: "+2348184014971", whatsappNumber: "2348184014971" },
  copy: {
    welcomeHeadline: "SPIDER-SENSE IS TINGLING!",
    welcomeSubtext: "Calling all Web-Slingers & Heroes to Zion's Secret Headquarters!",
    giftNote: "Your presence is the only web-tastic present we need!",
  },
  activities: [
    "🕷️ Web Shooter Training",
    "🎂 Spider-Man Cake Cut",
    "🏃 Spider Obstacle Course",
    "🎨 Face Painting & Masks",
    "📸 Superhero Photo Booth",
    "🎁 Web-Slinger Party Bags",
  ],
  faqs: [
    { q: "What is the dress code for kids?", a: "Costumes are super encouraged! Whether it's classic Spidey, Miles Morales, Spider-Gwen, or any hero suit — come ready to swing into action!" },
    { q: "What is the dress code for adults?", a: "For parents & adult guests: Colourful & Classy! The requested colours are Emerald Green and Royal Blue." },
    { q: "Can I bring my nanny or extra caretaker?", a: "Yes — just list them in the RSVP form so we can prepare their Spider HQ pass." },
    { q: "Should parents stay or drop off?", a: "Parents are very welcome to stay in the Heroes Lounge! There will be comfortable seating and refreshments." },
    { q: "What should we bring to Spider HQ?", a: "Your hero energy — plus a spare change of clothes for your little hero! Spider-suits can get warm after all that web-slinging, so pack a comfy backup outfit they can change into if needed." },
    { q: "How do I update my RSVP?", a: "You can update it anytime using the link in your confirmation email or by messaging Saidat directly on WhatsApp." },
  ],
  theme: {
    heroRed: "#E23636",
    spideyRed: "#E62429",
    heroBlue: "#114593",
    spideyBlue: "#154785",
    spiderBlack: "#0B0E14",
    ink: "#111111",
    newsprint: "#FDF6E3",
    popPink: "#FF4081",
    popCyan: "#00AEEF",
    popYellow: "#FFD700",
    spiderSenseOrange: "#FF5722",
  },
  agency: { name: "FlagIQ", url: "https://flagiq.org" },
} as const;
