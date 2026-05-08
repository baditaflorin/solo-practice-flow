import { useMemo, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  CalendarPlus,
  Check,
  Download,
  FileSignature,
  HandCoins,
  KeyRound,
  Loader2,
  PanelLeft,
  RefreshCcw,
  Sparkles,
  Star,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePracticeWorkspace } from "./usePracticeWorkspace";
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
import type {
  Contract,
  Invoice,
  Lead,
  LeadStatus,
  PracticeState,
  Proposal,
  TaxCategory,
} from "./types";
import { generateProposalScopeWithLocalLlm } from "../../lib/localLlm";
import { signMarkdown, verifyMarkdownSignature } from "../../lib/signing";
import { encryptTextWithPassphrase } from "../../lib/ageVault";
import { buildDuckDbTaxCsv, buildTaxRows } from "../../lib/duckdb";
import { downloadText, toCsv } from "../../lib/downloads";
import { markdownToStandaloneHtml } from "../../lib/pandoc";
import { buildLeadFollowUpIcs } from "../../lib/ics";

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

export function PracticeApp({ version, commit }: PracticeAppProps) {
  const { state, ready, error, updateState, reset } = usePracticeWorkspace();
  const [activeLeadId, setActiveLeadId] = useState("");
  const [leadDraft, setLeadDraft] = useState<LeadDraft>(initialLeadDraft);
  const [toast, setToast] = useState("Ready");
  const [busy, setBusy] = useState("");
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const latestCommit = useQuery({
    queryKey: ["latest-commit"],
    queryFn: async () => {
      const response = await fetch(
        "https://api.github.com/repos/baditaflorin/solo-practice-flow/commits/main",
      );
      if (!response.ok) {
        throw new Error(`GitHub returned ${response.status}`);
      }
      const payload = (await response.json()) as { sha: string };
      return payload.sha.slice(0, 7);
    },
    retry: false,
    staleTime: 1000 * 60 * 10,
  });

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

  const llmMutation = useMutation({
    mutationFn: (lead: Lead) =>
      generateProposalScopeWithLocalLlm(
        lead,
        state.profile,
        state.settings.localLlm.endpoint,
        state.settings.localLlm.model,
      ),
  });

  const saveLeadDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextLead: Lead = {
      id: makeId("lead"),
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
    };

    await updateState((current) => ({
      ...current,
      leads: [nextLead, ...current.leads],
    }));
    setActiveLeadId(nextLead.id);
    setLeadDraft(initialLeadDraft());
    setToast(`Lead captured: ${nextLead.company || nextLead.name}`);
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
        llmScope,
      );
      await updateState((current) => ({
        ...current,
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
      ...current,
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
      await updateContract({ ...activeContract, signature });
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
    await updateState((current) => ({
      ...current,
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
    downloadText(
      `solo-practice-flow-backup-${todayIso()}.json`,
      JSON.stringify(state, null, 2),
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
        JSON.stringify(state, null, 2),
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

  const exportTaxCsv = () => {
    downloadText(
      `solo-practice-flow-tax-${state.settings.taxYear}.csv`,
      toCsv(buildTaxRows(state)),
      "text/csv",
    );
    setToast("Tax CSV downloaded");
  };

  const exportDuckDbCsv = async () => {
    setBusy("duckdb");
    try {
      const csv = await buildDuckDbTaxCsv(state);
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

  const exportMarkdown = () => {
    const markdown = currentMarkdown();
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

  const exportHtml = async () => {
    const markdown = currentMarkdown();
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
            <dd>{latestCommit.data ?? commit}</dd>
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
                        updateInvoice({
                          ...activeInvoice,
                          lineItems: [
                            {
                              ...first,
                              taxCategory: event.target.value as TaxCategory,
                            },
                            ...rest,
                          ],
                        });
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
              onClick={exportTaxCsv}
            >
              Tax CSV
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
              onClick={exportHtml}
              disabled={busy === "pandoc"}
            >
              Pandoc HTML
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
