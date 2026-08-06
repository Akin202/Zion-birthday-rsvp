import { RsvpRecord } from "../types/rsvp";

/**
 * Escapes a cell value for CSV format according to RFC 4180 rules.
 * Handles double quotes, commas, and newlines.
 */
export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Triggers a client-side Blob download for CSV text.
 */
export function downloadCsvBlob(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates CSV string for the full RSVP list (one row per RSVP).
 */
export function generateRsvpCsv(rsvps: RsvpRecord[]): string {
  const headers = [
    "Guest Name",
    "Email",
    "Phone",
    "Attending",
    "Adults",
    "Plus One Name",
    "Children Count",
    "Children Details",
    "Nannies",
    "Total Headcount",
    "Dietary Notes",
    "Checked In",
    "Submitted At",
  ];

  const rows = rsvps.map((r) => {
    const childrenDetails = r.children
      .map((c) => `${c.age}${c.gender === "male" ? "M" : "F"}`)
      .join(", ");

    const adults = r.isAttending ? 1 + (r.hasPlusOne ? 1 : 0) : 0;
    const nannies = r.isAttending && r.hasNanny ? r.nannyCount : 0;

    return [
      escapeCsvCell(r.guestFullName),
      escapeCsvCell(r.email),
      escapeCsvCell(r.phone),
      escapeCsvCell(r.isAttending ? "Yes" : "No"),
      escapeCsvCell(adults),
      escapeCsvCell(r.hasPlusOne ? r.plusOneName || "Yes" : "None"),
      escapeCsvCell(r.children.length),
      escapeCsvCell(childrenDetails),
      escapeCsvCell(nannies),
      escapeCsvCell(r.totalHeadcount),
      escapeCsvCell(r.dietaryNotes),
      escapeCsvCell(r.checkedIn ? "Yes" : "No"),
      escapeCsvCell(new Date(r.createdAt).toLocaleString()),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Generates CSV string for the Children list (one row per child).
 */
export function generateChildrenCsv(rsvps: RsvpRecord[]): string {
  const headers = [
    "Parent/Guardian Name",
    "Parent Email",
    "Parent Phone",
    "Child Age",
    "Child Gender",
    "Parent Dietary Notes",
  ];

  const rows: string[] = [];
  rsvps.forEach((r) => {
    if (r.isAttending && r.children.length > 0) {
      r.children.forEach((c) => {
        rows.push(
          [
            escapeCsvCell(r.guestFullName),
            escapeCsvCell(r.email),
            escapeCsvCell(r.phone),
            escapeCsvCell(c.age),
            escapeCsvCell(c.gender === "male" ? "Boy" : "Girl"),
            escapeCsvCell(r.dietaryNotes),
          ].join(",")
        );
      });
    }
  });

  return [headers.join(","), ...rows].join("\n");
}
