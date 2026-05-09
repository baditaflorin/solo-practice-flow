import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import {
  BadgeCheck,
  CalendarPlus,
  Check,
  ClipboardPaste,
  Copy,
  Download,
  FileUp,
  FileSignature,
  HandCoins,
  KeyRound,
  Loader2,
  PanelLeft,
  RefreshCcw,
  Share2,
  Sparkles,
  Star,
  Printer,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { usePracticeWorkspace } from "./usePracticeWorkspace";
import { analyzeIntake } from "./inference";
import { validatePracticeFlow } from "./validation";
import {
  formatMoney,
  invoiceOutstanding,
  invoiceTotal,
  statusCounts,
  taxSummary,
} from "./calculations";
import {
  buildContractFromProposal,
  buildInvoiceFromProposal,
  buildProposalFromLead,
  renderContractMarkdown,
  renderInvoiceMarkdown,
  renderProposalMarkdown,
  taxCategoryLabels,
} from "./documents";
import {
  decodeShareHash,
  detectIntakeFormat,
  encodeShareText,
  formatLoadedIntakeFiles,
  sampleIntake,
  type IntakeFormat,
  type LoadedIntakeFile,
} from "./io";
import { parseWorkspaceBackup } from "./workspaceImport";
import type {
  Contract,
  InferredValue,
  Invoice,
  IntakeAnalysis,
  IntakeAnomaly,
  Lead,
  LeadStatus,
  PracticeState,
  Proposal,
  TaxCategory,
} from "./types";
import { generateProposalScopeWithLocalLlm } from "../../lib/localLlm";
import { signMarkdown, verifyMarkdownSignature } from "../../lib/signing";
import {
  decryptTextWithPassphrase,
  encryptTextWithPassphrase,
} from "../../lib/ageVault";
import { buildDuckDbTaxCsv, buildTaxRows } from "../../lib/duckdb";
import { downloadText, toCsv } from "../../lib/downloads";
import { markdownToStandaloneHtml } from "../../lib/pandoc";
import { markdownToPrintableHtml } from "../../lib/printDocument";
import { buildLeadFollowUpIcs } from "../../lib/ics";
import {
  buildExportProvenance,
  buildStateExportEnvelope,
  renderProvenanceMarkdown,
} from "../../lib/provenance";

interface PracticeAppProps {
  version: string;
  commit: string;
}

interface LeadDraft {
  name: string;
  company: string;
  email: string;
  source: string;
  budget: string;
  need: string;
  followUpAt: string;
  notes: string;
}

const repoUrl = "https://github.com/baditaflorin/solo-practice-flow";
const paypalUrl = "https://www.paypal.com/paypalme/florinbadita";

const leadStatuses: LeadStatus[] = [
  "new",
  "qualified",
  "proposal",
  "contract",
  "active",
  "won",
  "lost",
];

const taxCategories: TaxCategory[] = [
  "consulting_income",
  "software_income",
  "maintenance_income",
  "reimbursable_expense",
];

const todayIso = () => new Date().toISOString().slice(0, 10);

const initialLeadDraft = (): LeadDraft => ({
  name: "",
  company: "",
  email: "",
  source: "Referral",
  budget: "5000",
  need: "",
  followUpAt: todayIso(),
  notes: "",
});

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const replaceById = <T extends { id: string }>(items: T[], item: T) =>
  items.map((current) => (current.id === item.id ? item : current));

const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const confidencePercent = (confidence?: number) =>
  `${Math.round((confidence ?? 0) * 100)}%`;

const appendActivity = (
  state: PracticeState,
  type: string,
  message: string,
  entityId?: string,
): PracticeState => ({
  ...state,
  activityLog: [
    {
      id: makeId("activity"),
      at: new Date().toISOString(),
      type,
      message,
      entityId,
    },
    ...(state.activityLog ?? []),
  ].slice(0, 50),
});

const inferredText = (analysis: IntakeAnalysis | undefined, fallback: string) =>
  analysis?.lead.need?.value ?? fallback;

export function PracticeApp({ version, commit }: PracticeAppProps) {
  const { state, ready, error, updateState, reset } = usePracticeWorkspace();
  const [activeLeadId, setActiveLeadId] = useState("");
  const [leadDraft, setLeadDraft] = useState<LeadDraft>(initialLeadDraft);
  const [toast, setToast] = useState("Ready");
  const [busy, setBusy] = useState("");
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [rawIntake, setRawIntake] = useState("");
  const [intakeFormat, setIntakeFormat] = useState<IntakeFormat>(
    detectIntakeFormat(""),
  );
  const [dragActive, setDragActive] = useState(false);
  const debugMode = useMemo(
    () => new URLSearchParams(window.location.search).has("debug"),
    [],
  );
  const intakeAnalysis = useMemo(
    () => (rawIntake.trim() ? analyzeIntake(rawIntake) : undefined),
    [rawIntake],
  );

  const activeLead =
    state.leads.find((lead) => lead.id === activeLeadId) ?? state.leads[0];
  const activeProposal = activeLead
    ? state.proposals.find((proposal) => proposal.leadId === activeLead.id)
    : undefined;
  const activeContract = activeProposal
    ? state.contracts.find(
        (contract) => contract.proposalId === activeProposal.id,
      )
    : undefined;
  const activeInvoice = activeProposal
    ? state.invoices.find((invoice) => invoice.proposalId === activeProposal.id)
    : undefined;

  const counts = useMemo(() => statusCounts(state), [state]);
  const taxRows = useMemo(() => taxSummary(state), [state]);
  const flowIssues = useMemo(
    () =>
      validatePracticeFlow({
        lead: activeLead,
        proposal: activeProposal,
        contract: activeContract,
        invoice: activeInvoice,
      }),
    [activeLead, activeProposal, activeContract, activeInvoice],
  );

  const setIntakeText = (text: string, filename = "") => {
    setRawIntake(text);
    setIntakeFormat(detectIntakeFormat(text, filename));
  };

  useEffect(() => {
    const decoded = decodeShareHash(window.location.hash);
    if (decoded.ok && decoded.value) {
      setRawIntake(decoded.value);
      setIntakeFormat(detectIntakeFormat(decoded.value));
      setToast("Shared intake loaded from URL");
    }
  }, []);

  const llmMutation = useMutation({
    mutationFn: (lead: Lead) =>
      generateProposalScopeWithLocalLlm(
        lead,
        state.profile,
        state.settings.localLlm.endpoint,
        state.settings.localLlm.model,
      ),
  });

  const loadIntakeFiles = async (files: FileList | File[]) => {
    const selectedFiles = Array.from(files);
    setBusy("files");
    try {
      const loadedFiles: LoadedIntakeFile[] = await Promise.all(
        selectedFiles.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          text: await file.text(),
        })),
      );
      const result = formatLoadedIntakeFiles(loadedFiles);
      if (!result.ok || !result.value) {
        setToast(result.detail ?? result.message);
        return;
      }
      setIntakeText(result.value.text, loadedFiles[0]?.name ?? "");
      setToast(result.value.summary);
    } catch (reason) {
      setToast(
        reason instanceof Error
          ? `File load failed: ${reason.message}`
          : "File load failed. Try pasting the text into Raw intake.",
      );
    } finally {
      setBusy("");
    }
  };

  const readClipboardIntoIntake = async () => {
    if (!navigator.clipboard?.readText) {
      setToast("Clipboard read is unavailable; paste into Raw intake instead");
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setToast("Clipboard is empty; paste intake text manually");
        return;
      }
      setIntakeText(text);
      setToast("Clipboard intake loaded");
    } catch {
      setToast("Clipboard permission blocked; paste into Raw intake instead");
    }
  };

  const loadSampleIntake = () => {
    setIntakeText(sampleIntake, "sample-intake.txt");
    setToast("Sample intake loaded");
  };

  const copyText = async (text: string, successMessage: string) => {
    if (!text.trim()) {
      setToast("Nothing to copy yet");
      return;
    }
    if (!navigator.clipboard?.writeText) {
      setToast("Clipboard write is unavailable in this browser");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setToast(successMessage);
    } catch {
      setToast("Clipboard permission blocked; download the output instead");
    }
  };

  const shareRawIntake = async () => {
    const encoded = encodeShareText(rawIntake);
    if (!encoded.ok) {
      setToast(encoded.detail ?? encoded.message);
      return;
    }

    const url = `${window.location.origin}${window.location.pathname}#intake=${encoded.value}`;
    await copyText(url, "Share link copied");
  };

  const dropIntakeFiles = async (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (!event.dataTransfer.files.length) {
      setToast("Drop text, CSV, HTML, Markdown, or JSON files");
      return;
    }
    await loadIntakeFiles(event.dataTransfer.files);
  };

  const saveLeadDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextLead: Lead = {
      id: intakeAnalysis?.lead.id ?? makeId("lead"),
      name: leadDraft.name.trim() || "Unnamed lead",
      company: leadDraft.company.trim(),
      email: leadDraft.email.trim(),
      source: leadDraft.source.trim() || "Direct",
      status: "new",
      budget: Number(leadDraft.budget) || 0,
      need: leadDraft.need.trim() || "Needs discovery.",
      createdAt: todayIso(),
      followUpAt: leadDraft.followUpAt || todayIso(),
      notes: leadDraft.notes.trim(),
      inference: intakeAnalysis,
    };

    await updateState((current) => ({
      ...appendActivity(
        current,
        "lead.captured",
        `Captured ${nextLead.company || nextLead.name} with ${
          intakeAnalysis
            ? confidencePercent(intakeAnalysis.confidence)
            : "manual"
        } confidence`,
        nextLead.id,
      ),
      leads: [nextLead, ...current.leads],
    }));
    setActiveLeadId(nextLead.id);
    setLeadDraft(initialLeadDraft());
    setToast(`Lead captured: ${nextLead.company || nextLead.name}`);
  };

  const applyIntakeGuess = () => {
    if (!intakeAnalysis) {
      return;
    }

    setLeadDraft({
      name: intakeAnalysis.lead.name?.value ?? leadDraft.name,
      company: intakeAnalysis.lead.company?.value ?? leadDraft.company,
      email: intakeAnalysis.lead.email?.value ?? leadDraft.email,
      source: intakeAnalysis.lead.source?.value ?? leadDraft.source,
      budget: String(
        intakeAnalysis.lead.budgetMax?.value ??
          intakeAnalysis.lead.budgetMin?.value ??
          leadDraft.budget,
      ),
      need: inferredText(intakeAnalysis, leadDraft.need),
      followUpAt: intakeAnalysis.lead.followUpAt?.value ?? leadDraft.followUpAt,
      notes: intakeAnalysis.normalizedText,
    });
    setToast(
      `First guess applied with ${confidencePercent(intakeAnalysis.confidence)} confidence`,
    );
  };

  const updateLead = async (lead: Lead) => {
    await updateState((current) => ({
      ...current,
      leads: replaceById(current.leads, lead),
    }));
  };

  const updateProposal = async (proposal: Proposal) => {
    await updateState((current) => ({
      ...current,
      proposals: replaceById(current.proposals, proposal),
    }));
  };

  const updateContract = async (contract: Contract) => {
    await updateState((current) => ({
      ...current,
      contracts: replaceById(current.contracts, contract),
    }));
  };

  const updateInvoice = async (invoice: Invoice) => {
    await updateState((current) => ({
      ...current,
      invoices: replaceById(current.invoices, invoice),
    }));
  };

  const generateProposal = async () => {
    if (!activeLead) {
      return;
    }

    setBusy("proposal");
    try {
      let llmScope = "";
      if (state.settings.localLlm.enabled) {
        try {
          llmScope = await llmMutation.mutateAsync(activeLead);
        } catch {
          setToast("Local LLM unavailable; template proposal used");
        }
      }

      const proposal = buildProposalFromLead(
        activeLead,
        state.profile,
        state.settings,
        llmScope || activeLead.inference?.lead.need?.value,
      );
      if (activeLead.inference) {
        const inferredDeliverables =
          activeLead.inference.proposal.deliverables.map((item) => item.value);
        if (inferredDeliverables.length) {
          proposal.deliverables = inferredDeliverables;
        }
        proposal.timeline =
          activeLead.inference.proposal.timeline?.value || proposal.timeline;
        proposal.terms =
          activeLead.inference.proposal.paymentTerms?.value || proposal.terms;
        proposal.confidence = activeLead.inference.confidence;
        proposal.evidence = [
          activeLead.inference.summary,
          ...activeLead.inference.proposal.deliverables.map(
            (item) => item.evidence,
          ),
        ];
      }
      await updateState((current) => ({
        ...appendActivity(
          current,
          "proposal.generated",
          `Generated proposal for ${activeLead.company || activeLead.name}`,
          proposal.id,
        ),
        leads: replaceById(current.leads, {
          ...activeLead,
          status: "proposal",
        }),
        proposals: [
          proposal,
          ...current.proposals.filter((item) => item.leadId !== activeLead.id),
        ],
      }));
      setToast(`Proposal generated from ${proposal.source}`);
    } finally {
      setBusy("");
    }
  };

  const generateContract = async () => {
    if (!activeLead || !activeProposal) {
      return;
    }

    const contract = buildContractFromProposal(
      activeProposal,
      activeLead,
      state.profile,
    );
    await updateState((current) => ({
      ...appendActivity(
        current,
        "contract.drafted",
        "Drafted contract from proposal evidence",
        contract.id,
      ),
      leads: replaceById(current.leads, { ...activeLead, status: "contract" }),
      contracts: [
        contract,
        ...current.contracts.filter(
          (item) => item.proposalId !== activeProposal.id,
        ),
      ],
    }));
    setToast("Contract drafted");
  };

  const signContract = async () => {
    if (!activeContract) {
      return;
    }

    setBusy("signature");
    try {
      const signature = await signMarkdown(
        activeContract.bodyMarkdown,
        state.profile.ownerName,
      );
      await updateState((current) => ({
        ...appendActivity(
          current,
          "contract.signed",
          "Signed contract with Ed25519",
          activeContract.id,
        ),
        contracts: replaceById(current.contracts, {
          ...activeContract,
          signature,
        }),
      }));
      setToast("Contract signed and verified locally");
    } finally {
      setBusy("");
    }
  };

  const verifyContract = async () => {
    if (!activeContract?.signature) {
      return;
    }

    const verified = await verifyMarkdownSignature(
      activeContract.bodyMarkdown,
      activeContract.signature,
    );
    await updateContract({
      ...activeContract,
      signature: { ...activeContract.signature, verified },
    });
    setToast(
      verified
        ? "Signature verified"
        : "Signature does not match current contract",
    );
  };

  const generateInvoice = async () => {
    if (!activeProposal) {
      return;
    }

    const invoice = buildInvoiceFromProposal(
      state,
      activeProposal,
      state.settings,
    );
    for (const [phrase, category] of Object.entries(
      state.corrections?.taxCategoryByPhrase ?? {},
    )) {
      if (
        activeProposal.title.toLowerCase().includes(phrase.toLowerCase()) &&
        invoice.lineItems[0]
      ) {
        invoice.lineItems[0].taxCategory = category;
      }
    }
    invoice.provenance = buildExportProvenance(state, `invoice:${invoice.id}`, {
      proposal_id: activeProposal.id,
      confidence: activeProposal.confidence ?? 0,
    });
    await updateState((current) => ({
      ...appendActivity(
        current,
        "invoice.created",
        `Created invoice ${invoice.number}`,
        invoice.id,
      ),
      invoices: [
        invoice,
        ...current.invoices.filter(
          (item) => item.proposalId !== activeProposal.id,
        ),
      ],
    }));
    setToast(`Invoice ${invoice.number} drafted`);
  };

  const exportBackup = () => {
    const envelope = buildStateExportEnvelope(state, "workspace-backup");
    downloadText(
      `solo-practice-flow-backup-${todayIso()}.json`,
      JSON.stringify(envelope, null, 2),
      "application/json",
    );
    setToast("JSON backup downloaded");
  };

  const exportEncryptedBackup = async () => {
    if (!backupPassphrase) {
      setToast("Enter a backup passphrase first");
      return;
    }

    setBusy("age");
    try {
      const encrypted = await encryptTextWithPassphrase(
        JSON.stringify(
          buildStateExportEnvelope(state, "encrypted-backup"),
          null,
          2,
        ),
        backupPassphrase,
      );
      downloadText(
        `solo-practice-flow-backup-${todayIso()}.age`,
        encrypted,
        "text/plain",
      );
      setToast("age-encrypted backup downloaded");
    } finally {
      setBusy("");
    }
  };

  const restoreWorkspaceContents = async (
    contents: string,
    sourceLabel: string,
  ) => {
    const parsed = parseWorkspaceBackup(contents);
    if (!parsed.ok) {
      setToast(parsed.detail ?? parsed.message);
      return;
    }

    const confirmed = window.confirm(
      `Restore ${parsed.value.summary} from ${sourceLabel}? This replaces the current local workspace.`,
    );
    if (!confirmed) {
      setToast("Workspace restore cancelled");
      return;
    }

    const restoredState = appendActivity(
      parsed.value.state,
      "workspace.restored",
      `Restored backup from ${parsed.value.sourceId}`,
    );
    await updateState(() => restoredState);
    setActiveLeadId(restoredState.leads[0]?.id ?? "");
    setLeadDraft(initialLeadDraft());
    setIntakeText("");
    setToast(`Workspace restored: ${parsed.value.summary}`);
  };

  const restoreWorkspaceFile = async (
    files: FileList | null,
    encrypted: boolean,
  ) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    if (encrypted && !backupPassphrase) {
      setToast("Enter the backup passphrase before restoring an age file");
      return;
    }

    setBusy(encrypted ? "restore-age" : "restore-json");
    try {
      const fileContents = await file.text();
      const contents = encrypted
        ? await decryptTextWithPassphrase(fileContents, backupPassphrase)
        : fileContents;
      await restoreWorkspaceContents(contents, file.name);
    } catch (reason) {
      setToast(
        reason instanceof Error
          ? `Workspace restore failed: ${reason.message}`
          : "Workspace restore failed. Check the file and passphrase.",
      );
    } finally {
      setBusy("");
    }
  };

  const taxCsvWithProvenance = (sourceId: string) => {
    const provenance = buildExportProvenance(state, sourceId, {
      tax_year: state.settings.taxYear,
      invoices: state.invoices.length,
    });
    return toCsv(buildTaxRows(state, provenance));
  };

  const exportTaxCsv = () => {
    downloadText(
      `solo-practice-flow-tax-${state.settings.taxYear}.csv`,
      taxCsvWithProvenance("tax-csv"),
      "text/csv",
    );
    setToast("Tax CSV downloaded");
  };

  const exportDuckDbCsv = async () => {
    setBusy("duckdb");
    try {
      const csv = await buildDuckDbTaxCsv(
        state,
        buildExportProvenance(state, "duckdb-tax-csv", {
          tax_year: state.settings.taxYear,
          invoices: state.invoices.length,
        }),
      );
      downloadText(
        `solo-practice-flow-duckdb-tax-${state.settings.taxYear}.csv`,
        csv,
        "text/csv",
      );
      setToast("DuckDB tax report downloaded");
    } catch {
      exportTaxCsv();
      setToast("DuckDB unavailable; fallback CSV downloaded");
    } finally {
      setBusy("");
    }
  };

  const currentMarkdown = () => {
    if (!activeLead || !activeProposal) {
      return "";
    }
    if (activeContract) {
      return renderContractMarkdown(activeContract);
    }
    if (activeInvoice) {
      return renderInvoiceMarkdown(
        activeInvoice,
        activeProposal,
        activeLead,
        state.profile,
        state.settings,
      );
    }
    return renderProposalMarkdown(
      activeProposal,
      activeLead,
      state.profile,
      state.settings.currency,
    );
  };

  const currentMarkdownWithProvenance = (sourceId: string) => {
    const markdown = currentMarkdown();
    if (!markdown) {
      return "";
    }
    return `${markdown}\n${renderProvenanceMarkdown(
      buildExportProvenance(state, sourceId, {
        active_lead_id: activeLead?.id ?? "",
        active_proposal_id: activeProposal?.id ?? "",
      }),
    )}`;
  };

  const exportMarkdown = () => {
    const markdown = currentMarkdownWithProvenance("markdown-document");
    if (!markdown) {
      setToast("Generate a proposal first");
      return;
    }
    downloadText(
      `solo-practice-flow-document-${todayIso()}.md`,
      markdown,
      "text/markdown",
    );
    setToast("Markdown document downloaded");
  };

  const copyCurrentDocument = async () => {
    const markdown = currentMarkdownWithProvenance("clipboard-document");
    if (!markdown) {
      setToast("Generate a proposal first");
      return;
    }
    await copyText(markdown, "Current document copied");
  };

  const printCurrentDocument = () => {
    const markdown = currentMarkdownWithProvenance("print-document");
    if (!markdown) {
      setToast("Generate a proposal first");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setToast("Print window blocked; download Markdown instead");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(
      markdownToPrintableHtml("Solo Practice Flow document", markdown),
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setToast("Print dialog opened");
  };

  const copyTaxCsv = async () => {
    await copyText(taxCsvWithProvenance("clipboard-tax-csv"), "Tax CSV copied");
  };

  const copyBackupJson = async () => {
    await copyText(
      JSON.stringify(
        buildStateExportEnvelope(state, "clipboard-workspace-backup"),
        null,
        2,
      ),
      "Automation JSON copied",
    );
  };

  const exportHtml = async () => {
    const markdown = currentMarkdownWithProvenance("html-document");
    if (!markdown) {
      setToast("Generate a proposal first");
      return;
    }

    setBusy("pandoc");
    try {
      const html = await markdownToStandaloneHtml(markdown);
      downloadText(
        `solo-practice-flow-document-${todayIso()}.html`,
        html,
        "text/html",
      );
      setToast("Pandoc HTML document downloaded");
    } finally {
      setBusy("");
    }
  };

  const exportIcs = async () => {
    if (!activeLead) {
      return;
    }

    const ics = await buildLeadFollowUpIcs(activeLead);
    downloadText(
      `follow-up-${activeLead.company || activeLead.name}.ics`,
      ics,
      "text/calendar",
    );
    setToast("ICS reminder downloaded");
  };

  const updateProfile = async (
    field: keyof PracticeState["profile"],
    value: string | number,
  ) => {
    await updateState((current) => ({
      ...current,
      profile: { ...current.profile, [field]: value },
    }));
  };

  const updateSettings = async (
    field: keyof PracticeState["settings"],
    value: string | number,
  ) => {
    await updateState((current) => ({
      ...current,
      settings: { ...current.settings, [field]: value },
    }));
  };

  const setLocalLlm = async (
    patch: Partial<PracticeState["settings"]["localLlm"]>,
  ) => {
    await updateState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        localLlm: { ...current.settings.localLlm, ...patch },
      },
    }));
  };

  if (error) {
    return (
      <main className="app-shell">
        <section className="empty-state">
          <h1>Solo Practice Flow</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Local-first freelance practice flow</p>
          <h1>Solo Practice Flow</h1>
        </div>
        <nav aria-label="Project links" className="top-actions">
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            title="Open GitHub repository"
          >
            <Star aria-hidden="true" size={18} />
            Star repo
          </a>
          <a
            href={paypalUrl}
            target="_blank"
            rel="noreferrer"
            title="Support with PayPal"
          >
            <HandCoins aria-hidden="true" size={18} />
            PayPal
          </a>
        </nav>
        <dl className="build-meta" aria-label="Build metadata">
          <div>
            <dt>Version</dt>
            <dd>{version}</dd>
          </div>
          <div>
            <dt>Commit</dt>
            <dd>{commit}</dd>
          </div>
        </dl>
      </header>

      <section className="metric-grid" aria-label="Workspace totals">
        <Metric label="Leads" value={counts.leads} />
        <Metric label="Proposals" value={counts.proposals} />
        <Metric label="Contracts" value={counts.contracts} />
        <Metric label="Invoices" value={counts.invoices} />
        <Metric label="Paid" value={counts.paidInvoices} />
      </section>

      <section className="workspace-grid" aria-busy={!ready}>
        <aside
          className="panel lead-panel"
          aria-label="Lead capture and pipeline"
        >
          <div className="panel-heading">
            <PanelLeft aria-hidden="true" size={18} />
            <h2>Pipeline</h2>
          </div>

          <form className="stack" onSubmit={saveLeadDraft}>
            <div
              className={classNames("drop-zone", dragActive && "active")}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={dropIntakeFiles}
            >
              <span>Drop intake files</span>
              <small>Text, CSV, HTML, Markdown, or JSON</small>
            </div>
            <div className="button-row intake-actions">
              <label className="secondary-button file-button">
                <FileUp aria-hidden="true" size={16} />
                Load files
                <input
                  aria-label="Load intake files"
                  type="file"
                  multiple
                  accept=".txt,.md,.csv,.json,.html,.htm,text/*,application/json,text/csv,text/html,text/markdown"
                  onChange={(event) => {
                    if (event.currentTarget.files?.length) {
                      void loadIntakeFiles(event.currentTarget.files);
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                className="secondary-button"
                onClick={readClipboardIntoIntake}
              >
                <ClipboardPaste aria-hidden="true" size={16} />
                Clipboard
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={loadSampleIntake}
              >
                Sample
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={shareRawIntake}
              >
                <Share2 aria-hidden="true" size={16} />
                Share
              </button>
            </div>
            <label>
              Raw intake
              <textarea
                value={rawIntake}
                onChange={(event) => setIntakeText(event.target.value)}
                placeholder="Paste an inquiry, DM, RFP excerpt, CSV rows, contract text, or payment export"
                rows={5}
              />
            </label>
            <p className="intake-meta">
              {intakeFormat.label} · {intakeFormat.detail} ·{" "}
              {confidencePercent(intakeFormat.confidence)}
            </p>
            {intakeAnalysis ? (
              <SmartIntakeReview
                analysis={intakeAnalysis}
                onApply={applyIntakeGuess}
              />
            ) : null}
            <label>
              Contact
              <input
                value={leadDraft.name}
                onChange={(event) =>
                  setLeadDraft({ ...leadDraft, name: event.target.value })
                }
                placeholder="Client name"
              />
            </label>
            <label>
              Company
              <input
                value={leadDraft.company}
                onChange={(event) =>
                  setLeadDraft({ ...leadDraft, company: event.target.value })
                }
                placeholder="Company"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={leadDraft.email}
                onChange={(event) =>
                  setLeadDraft({ ...leadDraft, email: event.target.value })
                }
                placeholder="client@example.com"
              />
            </label>
            <div className="two-col">
              <label>
                Source
                <input
                  value={leadDraft.source}
                  onChange={(event) =>
                    setLeadDraft({ ...leadDraft, source: event.target.value })
                  }
                />
              </label>
              <label>
                Budget
                <input
                  type="number"
                  min="0"
                  value={leadDraft.budget}
                  onChange={(event) =>
                    setLeadDraft({ ...leadDraft, budget: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Need
              <textarea
                value={leadDraft.need}
                onChange={(event) =>
                  setLeadDraft({ ...leadDraft, need: event.target.value })
                }
                rows={3}
                placeholder="What outcome are they buying?"
              />
            </label>
            <div className="two-col">
              <label>
                Follow-up
                <input
                  type="date"
                  value={leadDraft.followUpAt}
                  onChange={(event) =>
                    setLeadDraft({
                      ...leadDraft,
                      followUpAt: event.target.value,
                    })
                  }
                />
              </label>
              <button type="submit" className="primary-button">
                <Check aria-hidden="true" size={18} />
                Capture
              </button>
            </div>
          </form>

          <div className="lead-list">
            {state.leads.map((lead) => (
              <button
                key={lead.id}
                type="button"
                className={classNames(
                  "lead-card",
                  activeLead?.id === lead.id && "active",
                )}
                onClick={() => setActiveLeadId(lead.id)}
              >
                <span>{lead.company || lead.name}</span>
                <small>
                  {lead.status} ·{" "}
                  {formatMoney(lead.budget, state.settings.currency)}
                </small>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel flow-panel" aria-label="Practice workflow">
          <div className="selected-lead">
            <div>
              <p className="eyebrow">Active client</p>
              <h2>
                {activeLead
                  ? activeLead.company || activeLead.name
                  : "No lead selected"}
              </h2>
              <p>{activeLead?.need}</p>
            </div>
            {activeLead ? (
              <select
                aria-label="Lead status"
                value={activeLead.status}
                onChange={(event) =>
                  updateLead({
                    ...activeLead,
                    status: event.target.value as LeadStatus,
                  })
                }
              >
                {leadStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {flowIssues.length ? <FlowWarnings issues={flowIssues} /> : null}

          <div className="flow-columns">
            <section className="tool-section">
              <div className="section-title">
                <Sparkles aria-hidden="true" size={18} />
                <h3>Proposal</h3>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={generateProposal}
                disabled={!activeLead || busy === "proposal"}
              >
                {busy === "proposal" ? (
                  <Loader2 className="spin" aria-hidden="true" size={18} />
                ) : null}
                Generate proposal
              </button>
              {activeProposal ? (
                <div className="stack">
                  <label>
                    Title
                    <input
                      value={activeProposal.title}
                      onChange={(event) =>
                        updateProposal({
                          ...activeProposal,
                          title: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Scope
                    <textarea
                      value={activeProposal.scope}
                      onChange={(event) =>
                        updateProposal({
                          ...activeProposal,
                          scope: event.target.value,
                        })
                      }
                      rows={5}
                    />
                  </label>
                  <label>
                    Deliverables
                    <textarea
                      value={activeProposal.deliverables.join("\n")}
                      onChange={(event) =>
                        updateProposal({
                          ...activeProposal,
                          deliverables: event.target.value
                            .split("\n")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        })
                      }
                      rows={4}
                    />
                  </label>
                  <div className="two-col">
                    <label>
                      Fee
                      <input
                        type="number"
                        value={activeProposal.fee}
                        onChange={(event) =>
                          updateProposal({
                            ...activeProposal,
                            fee: Number(event.target.value) || 0,
                          })
                        }
                      />
                    </label>
                    <label>
                      Source
                      <input value={activeProposal.source} readOnly />
                    </label>
                  </div>
                  {activeProposal.confidence !== undefined ? (
                    <div className="confidence-callout">
                      <strong>
                        Proposal confidence{" "}
                        {confidencePercent(activeProposal.confidence)}
                      </strong>
                      <span>
                        Drafted from the captured intake. Review low-confidence
                        fields before sending.
                      </span>
                    </div>
                  ) : null}
                  {activeProposal.evidence?.length ? (
                    <details className="evidence-list">
                      <summary>Inference evidence</summary>
                      <ul>
                        {activeProposal.evidence.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </div>
              ) : (
                <p className="muted">No proposal yet.</p>
              )}
            </section>

            <section className="tool-section">
              <div className="section-title">
                <FileSignature aria-hidden="true" size={18} />
                <h3>Contract</h3>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={generateContract}
                disabled={!activeProposal}
              >
                Draft contract
              </button>
              {activeContract ? (
                <div className="stack">
                  <label>
                    Markdown
                    <textarea
                      value={activeContract.bodyMarkdown}
                      onChange={(event) =>
                        updateContract({
                          ...activeContract,
                          bodyMarkdown: event.target.value,
                          signature: undefined,
                        })
                      }
                      rows={10}
                    />
                  </label>
                  <div className="button-row">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={signContract}
                      disabled={busy === "signature"}
                    >
                      <KeyRound aria-hidden="true" size={18} />
                      Sign
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={verifyContract}
                      disabled={!activeContract.signature}
                    >
                      <BadgeCheck aria-hidden="true" size={18} />
                      Verify
                    </button>
                  </div>
                  {activeContract.signature ? (
                    <code className="signature-box">
                      SHA-256 {activeContract.signature.payloadHash}
                      {"\n"}Ed25519{" "}
                      {activeContract.signature.verified
                        ? "verified"
                        : "not verified"}
                    </code>
                  ) : null}
                </div>
              ) : (
                <p className="muted">No contract yet.</p>
              )}
            </section>

            <section className="tool-section">
              <div className="section-title">
                <HandCoins aria-hidden="true" size={18} />
                <h3>Invoice</h3>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={generateInvoice}
                disabled={!activeProposal}
              >
                Create invoice
              </button>
              {activeInvoice ? (
                <div className="stack">
                  <div className="invoice-total">
                    <span>{activeInvoice.number}</span>
                    <strong>
                      {formatMoney(
                        invoiceTotal(activeInvoice),
                        state.settings.currency,
                      )}
                    </strong>
                  </div>
                  <div className="two-col">
                    <label>
                      Status
                      <select
                        value={activeInvoice.status}
                        onChange={(event) =>
                          updateInvoice({
                            ...activeInvoice,
                            status: event.target.value as Invoice["status"],
                          })
                        }
                      >
                        <option value="draft">draft</option>
                        <option value="sent">sent</option>
                        <option value="paid">paid</option>
                        <option value="overdue">overdue</option>
                      </select>
                    </label>
                    <label>
                      Paid
                      <input
                        type="number"
                        value={activeInvoice.amountPaid}
                        onChange={(event) =>
                          updateInvoice({
                            ...activeInvoice,
                            amountPaid: Number(event.target.value) || 0,
                            status:
                              Number(event.target.value) >=
                              invoiceTotal(activeInvoice)
                                ? "paid"
                                : "sent",
                            paidDate:
                              Number(event.target.value) >=
                              invoiceTotal(activeInvoice)
                                ? todayIso()
                                : activeInvoice.paidDate,
                          })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Tax category
                    <select
                      value={
                        activeInvoice.lineItems[0]?.taxCategory ??
                        "consulting_income"
                      }
                      onChange={(event) => {
                        const [first, ...rest] = activeInvoice.lineItems;
                        if (!first) {
                          return;
                        }
                        const taxCategory = event.target.value as TaxCategory;
                        const nextInvoice = {
                          ...activeInvoice,
                          lineItems: [
                            {
                              ...first,
                              taxCategory,
                            },
                            ...rest,
                          ],
                        };
                        updateState((current) => ({
                          ...current,
                          corrections: {
                            ...(current.corrections ?? {
                              sourceLabels: {},
                              taxCategoryByPhrase: {},
                              preferredPaymentTerms: "Net 14",
                            }),
                            taxCategoryByPhrase: {
                              ...(current.corrections?.taxCategoryByPhrase ??
                                {}),
                              [first.description]: taxCategory,
                            },
                          },
                          invoices: replaceById(current.invoices, nextInvoice),
                        }));
                      }}
                    >
                      {taxCategories.map((category) => (
                        <option key={category} value={category}>
                          {taxCategoryLabels[category]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="muted">
                    Outstanding{" "}
                    {formatMoney(
                      invoiceOutstanding(activeInvoice),
                      state.settings.currency,
                    )}
                  </p>
                </div>
              ) : (
                <p className="muted">No invoice yet.</p>
              )}
            </section>
          </div>
        </section>

        <aside className="panel export-panel" aria-label="Exports and settings">
          <div className="panel-heading">
            <Download aria-hidden="true" size={18} />
            <h2>Exports</h2>
          </div>
          <div className="button-grid">
            <button
              type="button"
              className="secondary-button"
              onClick={exportBackup}
            >
              JSON backup
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={copyBackupJson}
            >
              <Copy aria-hidden="true" size={16} />
              Copy JSON
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={exportTaxCsv}
            >
              Tax CSV
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={copyTaxCsv}
            >
              <Copy aria-hidden="true" size={16} />
              Copy CSV
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={exportDuckDbCsv}
              disabled={busy === "duckdb"}
            >
              DuckDB CSV
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={exportMarkdown}
            >
              Markdown
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={copyCurrentDocument}
            >
              <Copy aria-hidden="true" size={16} />
              Copy doc
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={exportHtml}
              disabled={busy === "pandoc"}
            >
              Pandoc HTML
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={printCurrentDocument}
            >
              <Printer aria-hidden="true" size={16} />
              Print
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={exportIcs}
              disabled={!activeLead}
            >
              <CalendarPlus aria-hidden="true" size={16} />
              ICS
            </button>
          </div>

          <label>
            age passphrase
            <input
              type="password"
              value={backupPassphrase}
              onChange={(event) => setBackupPassphrase(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="primary-button full-width"
            onClick={exportEncryptedBackup}
            disabled={busy === "age"}
          >
            Encrypted backup
          </button>
          <div className="button-grid restore-grid">
            <label className="secondary-button file-button">
              <FileUp aria-hidden="true" size={16} />
              Restore JSON
              <input
                aria-label="Restore JSON backup"
                type="file"
                accept=".json,application/json"
                onChange={(event) => {
                  void restoreWorkspaceFile(event.currentTarget.files, false);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <label className="secondary-button file-button">
              <KeyRound aria-hidden="true" size={16} />
              Restore age
              <input
                aria-label="Restore encrypted backup"
                type="file"
                accept=".age,text/plain"
                onChange={(event) => {
                  void restoreWorkspaceFile(event.currentTarget.files, true);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          <div className="tax-table" role="table" aria-label="Tax summary">
            <div role="row" className="tax-row header">
              <span role="columnheader">Category</span>
              <span role="columnheader">Paid</span>
            </div>
            {taxRows.map((row) => (
              <div role="row" className="tax-row" key={row.category}>
                <span role="cell">{taxCategoryLabels[row.category]}</span>
                <span role="cell">
                  {formatMoney(row.paid, state.settings.currency)}
                </span>
              </div>
            ))}
          </div>

          <section className="activity-log" aria-label="Activity history">
            <h3>Activity</h3>
            {(state.activityLog ?? []).length ? (
              <ol>
                {(state.activityLog ?? []).slice(0, 6).map((event) => (
                  <li key={event.id}>
                    <span>{event.message}</span>
                    <time dateTime={event.at}>
                      {new Date(event.at).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">No workspace activity yet.</p>
            )}
          </section>

          {debugMode ? (
            <DebugPanel state={state} analysis={intakeAnalysis} />
          ) : null}

          <details>
            <summary>Practice settings</summary>
            <div className="stack">
              <label>
                Business
                <input
                  value={state.profile.businessName}
                  onChange={(event) =>
                    updateProfile("businessName", event.target.value)
                  }
                />
              </label>
              <label>
                Owner
                <input
                  value={state.profile.ownerName}
                  onChange={(event) =>
                    updateProfile("ownerName", event.target.value)
                  }
                />
              </label>
              <label>
                Payment details
                <textarea
                  value={state.profile.paymentDetails}
                  onChange={(event) =>
                    updateProfile("paymentDetails", event.target.value)
                  }
                  rows={3}
                />
              </label>
              <div className="two-col">
                <label>
                  Currency
                  <input
                    value={state.settings.currency}
                    onChange={(event) =>
                      updateSettings(
                        "currency",
                        event.target.value.toUpperCase(),
                      )
                    }
                  />
                </label>
                <label>
                  Tax year
                  <input
                    type="number"
                    value={state.settings.taxYear}
                    onChange={(event) =>
                      updateSettings("taxYear", Number(event.target.value))
                    }
                  />
                </label>
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={state.settings.localLlm.enabled}
                  onChange={(event) =>
                    setLocalLlm({ enabled: event.target.checked })
                  }
                />
                Local LLM
              </label>
              <label>
                Endpoint
                <input
                  value={state.settings.localLlm.endpoint}
                  onChange={(event) =>
                    setLocalLlm({ endpoint: event.target.value })
                  }
                />
              </label>
              <label>
                Model
                <input
                  value={state.settings.localLlm.model}
                  onChange={(event) =>
                    setLocalLlm({ model: event.target.value })
                  }
                />
              </label>
              <button
                type="button"
                className="secondary-button"
                onClick={reset}
              >
                <RefreshCcw aria-hidden="true" size={16} />
                Reset demo
              </button>
            </div>
          </details>
        </aside>
      </section>

      <div className="status-bar" role="status">
        <span>{ready ? toast : "Opening local workspace..."}</span>
        {busy ? (
          <Loader2 className="spin" aria-hidden="true" size={16} />
        ) : null}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FlowWarnings({ issues }: { issues: IntakeAnomaly[] }) {
  return (
    <section className="flow-warnings" aria-label="Flow checks">
      <strong>Flow checks</strong>
      <ul className="anomaly-list">
        {issues.slice(0, 4).map((issue) => (
          <li key={issue.code} className={`anomaly-${issue.severity}`}>
            <strong>{issue.message}</strong>
            <span>{issue.why}</span>
            <em>{issue.next}</em>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SmartIntakeReview({
  analysis,
  onApply,
}: {
  analysis: IntakeAnalysis;
  onApply: () => void;
}) {
  const leadFields: Array<{
    label: string;
    value?: InferredValue<string | number>;
  }> = [
    { label: "Contact", value: analysis.lead.name },
    { label: "Company", value: analysis.lead.company },
    { label: "Email", value: analysis.lead.email },
    { label: "Budget", value: analysis.lead.budgetMax },
    { label: "Follow-up", value: analysis.lead.followUpAt },
    { label: "Need", value: analysis.lead.need },
  ];
  const proposalFields: Array<{
    label: string;
    value?: InferredValue<string | number>;
  }> = [
    ...analysis.proposal.deliverables.slice(0, 3).map((value, index) => ({
      label: `Deliverable ${index + 1}`,
      value,
    })),
    { label: "Timeline", value: analysis.proposal.timeline },
    { label: "Terms", value: analysis.proposal.paymentTerms },
  ];

  return (
    <section
      className={classNames(
        "smart-review",
        `confidence-${analysis.confidenceLevel}`,
      )}
      aria-label="Smart intake review"
    >
      <div className="smart-review-header">
        <Sparkles aria-hidden="true" size={18} />
        <div>
          <strong>{analysis.summary}</strong>
          <span>
            {analysis.kind.replace("_", " ")} ·{" "}
            {confidencePercent(analysis.confidence)}
          </span>
        </div>
        <button type="button" className="secondary-button" onClick={onApply}>
          <Check aria-hidden="true" size={16} />
          Apply
        </button>
      </div>

      <div className="inference-grid">
        {[...leadFields, ...proposalFields]
          .filter((field) => field.value)
          .map((field) => (
            <InferencePill
              key={field.label}
              label={field.label}
              value={field.value!}
            />
          ))}
      </div>

      <DomainSummary analysis={analysis} />

      {analysis.anomalies.length ? (
        <ul className="anomaly-list">
          {analysis.anomalies.slice(0, 4).map((item) => (
            <li key={item.code} className={`anomaly-${item.severity}`}>
              <strong>{item.message}</strong>
              <span>{item.why}</span>
              <em>{item.next}</em>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No intake anomalies found.</p>
      )}

      {analysis.suggestedFixes.length ? (
        <details className="evidence-list">
          <summary>Suggested fixes</summary>
          <ul>
            {analysis.suggestedFixes.map((fix) => (
              <li key={fix.id}>
                <strong>{fix.label}</strong> · {fix.action}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function DomainSummary({ analysis }: { analysis: IntakeAnalysis }) {
  if (!analysis.invoice && !analysis.payment && !analysis.contract) {
    return null;
  }

  return (
    <div className="domain-summary">
      {analysis.invoice ? (
        <div>
          <strong>Invoice shape</strong>
          <span>
            {analysis.invoice.lineItems} lines · total {analysis.invoice.total}{" "}
            · paid {analysis.invoice.paid}
          </span>
          <small>
            Categories:{" "}
            {analysis.invoice.taxCategories
              .map((item) => taxCategoryLabels[item.value])
              .join(", ")}
          </small>
        </div>
      ) : null}
      {analysis.payment ? (
        <div>
          <strong>Payment shape</strong>
          <span>
            Gross {analysis.payment.gross?.value ?? "unknown"} · fee{" "}
            {analysis.payment.fee?.value ?? "unknown"} · net{" "}
            {analysis.payment.net?.value ?? "unknown"}
          </span>
          <small>
            {analysis.payment.currency?.value ?? "unknown currency"} ·{" "}
            {analysis.payment.transactionId?.value ?? "no transaction ID"}
          </small>
        </div>
      ) : null}
      {analysis.contract ? (
        <div>
          <strong>Contract shape</strong>
          <span>
            Jurisdiction {analysis.contract.jurisdiction?.value ?? "unknown"} ·
            confidentiality{" "}
            {analysis.contract.hasConfidentiality ? "present" : "missing"} ·
            termination{" "}
            {analysis.contract.hasTermination ? "present" : "missing"}
          </span>
          <small>
            Liability cap{" "}
            {analysis.contract.hasLiabilityCap ? "present" : "missing"}
          </small>
        </div>
      ) : null}
    </div>
  );
}

function InferencePill({
  label,
  value,
}: {
  label: string;
  value: InferredValue<string | number>;
}) {
  return (
    <details className={`inference-pill confidence-${value.level}`}>
      <summary>
        <span>{label}</span>
        <strong>{String(value.value)}</strong>
        <small>{confidencePercent(value.confidence)}</small>
      </summary>
      <p>{value.reason}</p>
      <code>{value.evidence}</code>
    </details>
  );
}

function DebugPanel({
  state,
  analysis,
}: {
  state: PracticeState;
  analysis?: IntakeAnalysis;
}) {
  return (
    <details className="debug-panel" open>
      <summary>Debug state</summary>
      <dl>
        <div>
          <dt>Schema</dt>
          <dd>{state.schemaVersion}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{state.updatedAt}</dd>
        </div>
        <div>
          <dt>Corrections</dt>
          <dd>
            {Object.keys(state.corrections?.taxCategoryByPhrase ?? {}).length}
          </dd>
        </div>
        <div>
          <dt>Intake</dt>
          <dd>{analysis ? analysis.summary : "none"}</dd>
        </div>
      </dl>
      <pre>
        {JSON.stringify(
          {
            version: __APP_VERSION__,
            commit: __COMMIT_SHA__,
            analysis: analysis
              ? {
                  id: analysis.id,
                  kind: analysis.kind,
                  confidence: analysis.confidence,
                  anomalies: analysis.anomalies.map((item) => item.code),
                  durationMs: analysis.metadata.durationMs,
                }
              : null,
            activity: (state.activityLog ?? []).slice(0, 5),
          },
          null,
          2,
        )}
      </pre>
    </details>
  );
}
