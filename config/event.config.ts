export const eventConfig = {
  celebrant: { name: "Zion", fullName: "Zion Awolowo", age: 7, photoUrl: "/images/celebrant.jpg" },
  event: {
    title: "Zion's 7th Birthday Celebration",
    date: "2026-10-18T14:00:00+01:00",
    dateDisplay: "Saturday, October 18th, 2026",
    timeDisplay: "2:00 PM - 7:00 PM",
    venueName: "PLACEHOLDER VENUE",
    venueAddress: "PLACEHOLDER ADDRESS, Lagos, Nigeria",
    googleMapsUrl: "https://maps.google.com/?q=PLACEHOLDER",
    dressCode: "Come dressed as your favourite hero!",
    rsvpDeadline: "2026-09-30T23:59:59+01:00",
    rsvpDeadlineDisplay: "September 30th, 2026",
  },
  host: { contactName: "Saidat", contactPhone: "+2348139927805", whatsappNumber: "2348139927805" },
  copy: {
    welcomeHeadline: "You're Invited",
    welcomeSubtext: "Thank you for joining us to celebrate Zion turning 7!",
    giftNote: "Your presence is the only present we need.",
  },
  activities: ["Games", "Cake", "Face Painting", "Photo Booth", "Party Bags"],
  faqs: [
    { q: "Can I bring my nanny?", a: "Yes — just let us know in the form so we can plan for them." },
    { q: "Should I stay or drop off?", a: "Parents are very welcome to stay. There'll be seating and refreshments." },
    { q: "What should we bring?", a: "Just yourselves! Your presence is the only present we need." },
    { q: "Can I change my RSVP?", a: "Yes — use the link in your confirmation email, or message Saidat directly." },
  ],
  theme: {
    heroRed: "#E23636", heroBlue: "#1B4C9B", ink: "#111111",
    newsprint: "#FDF6E3", popPink: "#FF4081", popCyan: "#00AEEF", popYellow: "#FFD700",
  },
  agency: { name: "FlagIQ", url: "https://flagiq.org" },
} as const;
