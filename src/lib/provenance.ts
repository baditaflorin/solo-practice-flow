import type {
  ExportProvenance,
  PracticeState,
} from "../features/practice/types";

export const buildExportProvenance = (
  state: PracticeState,
  sourceId: string,
  parameters: Record<string, string | number | boolean> = {},
): ExportProvenance => ({
  app_version: __APP_VERSION__,
  commit: __COMMIT_SHA__,
  schema_version: state.schemaVersion,
  generated_at: state.updatedAt,
  source_id: sourceId,
  parameters,
});

export const buildStateExportEnvelope = (
  state: PracticeState,
  sourceId: string,
) => ({
  provenance: buildExportProvenance(state, sourceId, {
    leads: state.leads.length,
    proposals: state.proposals.length,
    contracts: state.contracts.length,
    invoices: state.invoices.length,
  }),
  state,
});

export const renderProvenanceMarkdown = (
  provenance: ExportProvenance,
) => `## Provenance

- App version: ${provenance.app_version}
- Commit: ${provenance.commit}
- Schema version: ${provenance.schema_version}
- Generated at: ${provenance.generated_at}
- Source: ${provenance.source_id}
- Parameters: ${JSON.stringify(provenance.parameters)}
`;
