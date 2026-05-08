import { z } from "zod";
import type { PracticeState } from "./types";

export const practiceStateSchema = z.custom<PracticeState>((value) => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PracticeState>;
  return (
    typeof candidate.schemaVersion === "number" &&
    Array.isArray(candidate.leads) &&
    Array.isArray(candidate.proposals) &&
    Array.isArray(candidate.contracts) &&
    Array.isArray(candidate.invoices) &&
    Boolean(candidate.profile) &&
    Boolean(candidate.settings)
  );
});
