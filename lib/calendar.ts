import { eventConfig } from "../config/event.config";

export function generateGoogleCalendarUrl(): string {
  // Event start: 2026-10-17 12:00 WAT (+1) => 11:00 UTC
  // Event end:   2026-10-17 19:00 WAT (+1) => 18:00 UTC
  const startDate = "20261017T110000Z";
  const endDate = "20261017T180000Z";

  const title = encodeURIComponent(eventConfig.event.title);
  const details = encodeURIComponent(
    `Join us in celebrating ${eventConfig.celebrant.fullName} turning ${eventConfig.celebrant.age}!\n\nDress Code: ${eventConfig.event.dressCode}\nHost: ${eventConfig.host.contactName} (${eventConfig.host.contactPhone})`
  );
  const location = encodeURIComponent(
    `${eventConfig.event.venueName}, ${eventConfig.event.venueAddress}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}

export function generateWhatsAppShareUrl(guestName?: string): string {
  const text = encodeURIComponent(
    `Hi ${eventConfig.host.contactName}! I just RSVP'd for ${eventConfig.celebrant.name}'s 7th Superhero Birthday Party on ${eventConfig.event.dateDisplay}! 🚀${
      guestName ? ` (${guestName})` : ""
    }`
  );
  return `https://wa.me/${eventConfig.host.whatsappNumber}?text=${text}`;
}
