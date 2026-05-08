import type { Lead } from "../features/practice/types";

export const buildLeadFollowUpIcs = async (lead: Lead) => {
  const { createEvent } = await import("ics");
  const date = new Date(`${lead.followUpAt || lead.createdAt}T09:00:00`);
  const result = createEvent({
    title: `Follow up with ${lead.company || lead.name}`,
    description: `${lead.need}\n\nNotes: ${lead.notes}`,
    start: [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
    ],
    duration: { minutes: 30 },
    attendees: lead.email ? [{ name: lead.name, email: lead.email }] : [],
  });

  if (result.error || !result.value) {
    throw result.error ?? new Error("Unable to create ICS reminder");
  }

  return result.value;
};
