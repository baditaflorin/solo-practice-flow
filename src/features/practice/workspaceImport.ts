import { z } from "zod";
import type { UserResult } from "../../lib/result";
import { normalizePracticeState } from "./seed";
import { practiceStateSchema } from "./schemas";
import type { PracticeState } from "./types";

const provenanceSchema = z
  .object({
    app_version: z.string().optional(),
    commit: z.string().optional(),
    schema_version: z.number().optional(),
    generated_at: z.string().optional(),
    source_id: z.string().optional(),
    parameters: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  })
  .passthrough();

const workspaceEnvelopeSchema = z
  .object({
    provenance: provenanceSchema.optional(),
    state: z.unknown(),
  })
  .passthrough();

export interface WorkspaceImport {
  state: PracticeState;
  summary: string;
  sourceId: string;
}

export const parseWorkspaceBackup = (
  contents: string,
): UserResult<WorkspaceImport> => {
  if (!contents.trim()) {
    return {
      ok: false,
      message: "Backup restore failed.",
      detail:
        "The selected file is empty. Choose a JSON backup exported by this app.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    return {
      ok: false,
      message: "Backup restore failed.",
      detail:
        "The file is not valid JSON. Choose a JSON backup or decrypt the age backup first.",
    };
  }

  const envelope = workspaceEnvelopeSchema.safeParse(parsed);
  const candidate = envelope.success ? envelope.data.state : parsed;
  const stateResult = practiceStateSchema.safeParse(candidate);
  if (!stateResult.success) {
    return {
      ok: false,
      message: "Backup restore failed.",
      detail:
        "The JSON does not contain a recognizable workspace state with profile, settings, leads, proposals, contracts, and invoices.",
    };
  }

  const state = normalizePracticeState(stateResult.data);
  const sourceId = envelope.success
    ? (envelope.data.provenance?.source_id ?? "workspace-envelope")
    : "legacy-state-json";
  return {
    ok: true,
    value: {
      state,
      sourceId,
      summary: describePracticeState(state),
    },
    message: "Workspace backup parsed.",
  };
};

export const describePracticeState = (state: PracticeState) =>
  `${state.leads.length} leads, ${state.proposals.length} proposals, ${state.contracts.length} contracts, ${state.invoices.length} invoices`;
