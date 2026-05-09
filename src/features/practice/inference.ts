import { schemaVersion, type IntakeAnalysis, type IntakeAnomaly, type IntakeKind, type InferredValue, type SuggestedFix, type TaxCategory } from "./types";

export interface AnalyzeOptions {
  now?: string;
}

interface NormalizedInput {
  text: string;
  anomalies: IntakeAnomaly[];
}

interface CsvParseResult {
  headers: string[];
  rows: string[][];
  malformedRows: number[];
}

const defaultNow = "2026-05-09T00:00:00.000Z";

const confidenceLevel = (confidence: number) => {
  if (confidence >= 0.75) {
    return "high" as const;
  }
  if (confidence >= 0.45) {
    return "medium" as const;
  }
  return "low" as const;
};

const inferred = <T>(
  value: T,
  confidence: number,
  evidence: string,
  reason: string,
): InferredValue<T> => ({
  value,
  confidence,
  level: confidenceLevel(confidence),
  evidence,
  reason,
});

export const stableHash = (value: string) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const stableId = (prefix: string, value: string) => `${prefix}-${stableHash(value).slice(0, 10)}`;

const anomaly = (
  code: string,
  severity: IntakeAnomaly["severity"],
  message: string,
  why: string,
  next: string,
  evidence?: string,
): IntakeAnomaly => ({ code, severity, message, why, next, evidence });

const normalizeInput = (raw: string): NormalizedInput => {
  const anomalies: IntakeAnomaly[] = [];
  let text = raw.replace(/^\uFEFF/, "");

  if (raw.startsWith("\uFEFF")) {
    anomalies.push(
      anomaly(
        "bom",
        "info",
        "Removed a spreadsheet byte-order marker.",
        "Some CSV exports start with a hidden BOM.",
        "No action needed.",
      ),
    );
  }

  if (/\r\n?/.test(text)) {
    text = text.replace(/\r\n?/g, "\n");
  }

  if (/[“”‘’]/.test(text)) {
    anomalies.push(
      anomaly(
        "smart_punctuation",
        "info",
        "Smart punctuation was normalized for parsing.",
        "Spreadsheet and document exports often contain curly quotes.",
        "Review quoted CSV fields if a row looks wrong.",
      ),
    );
    text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  }

  if (/\u00A0/.test(text)) {
    anomalies.push(
      anomaly(
        "nbsp",
        "info",
        "Non-breaking spaces were normalized.",
        "Copied web or PDF text often contains NBSP characters.",
        "No action needed.",
      ),
    );
    text = text.replace(/\u00A0/g, " ");
  }

  if (/[\u200E\u200F\u202A-\u202E]/.test(text) || /[оехауі]/i.test(text)) {
    anomalies.push(
      anomaly(
        "suspicious_unicode",
        "warning",
        "Suspicious Unicode marks or lookalike letters detected.",
        "Client names or emails may contain hidden direction marks or homoglyphs.",
        "Verify identity fields before sending or signing.",
      ),
    );
  }

  if (/ignore (all )?(previous|prior) instructions|sign immediately|set .*fee .*0/i.test(text)) {
    anomalies.push(
      anomaly(
        "prompt_injection",
        "danger",
        "Instruction-like text was treated as client data.",
        "The input tries to steer generation instead of describing the engagement.",
        "Review fee, scope, and signing fields before accepting.",
      ),
    );
  }

  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .trim();

  return { text, anomalies };
};

const parseCsv = (text: string): CsvParseResult | null => {
  const firstLine = text.split("\n")[0] ?? "";
  const delimiter = ["\t", ";", ","].sort(
    (a, b) => firstLine.split(b).length - firstLine.split(a).length,
  )[0];
  if (!delimiter || firstLine.split(delimiter).length < 3) {
    return null;
  }

  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      row.push(field.trim());
      field = "";
    } else if (char === "\n" && !inQuotes) {
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field.trim());
  rows.push(row);

  const [headers = [], ...bodyRows] = rows.filter((candidate) => candidate.some(Boolean));
  const malformedRows = bodyRows
    .map((candidate, index) => ({ candidate, index }))
    .filter(({ candidate }) => candidate.length !== headers.length)
    .map(({ index }) => index + 2);

  return { headers: headers.map((header) => header.toLowerCase().trim()), rows: bodyRows, malformedRows };
};

const byHeader = (csv: CsvParseResult, row: string[], aliases: string[]) => {
  const index = csv.headers.findIndex((header) =>
    aliases.some((alias) => header === alias || header.includes(alias)),
  );
  return index >= 0 ? row[index]?.trim() ?? "" : "";
};

const parseMoney = (raw: string) => {
  const lower = raw.toLowerCase();
  const multiplier = /\d\s*k\b/.test(lower) ? 1000 : 1;
  const number = Number(lower.replace(/[$€£,\s?]/g, "").replace(/k\b/, ""));
  return Number.isFinite(number) ? number * multiplier : undefined;
};

const findBudget = (text: string) => {
  const budgetLine = text.match(/\bbudget:\s*(?:usd\s*|eur\s*|gbp\s*|\$|€|£)?([\d,.]+)(?:\s*k)?/i);
  if (budgetLine?.[1]) {
    const multiplier = /k/i.test(budgetLine[0]) ? 1000 : 1;
    const value = Number(budgetLine[1].replace(/,/g, "")) * multiplier;
    if (Number.isFinite(value)) {
      return { min: value, max: value, evidence: budgetLine[0] };
    }
  }

  const range = text.match(/(?:budget is|budget:|maybe)\s*(?:usd |eur |gbp |\$|€|£)?([\d,.]+)\s*k?\s*[-–]\s*(?:\$|€|£)?([\d,.]+)\s*k?/i);
  if (range?.[1] && range[2]) {
    const firstHasK = /k/i.test(range[0]);
    const min = Number(range[1].replace(/,/g, "")) * (firstHasK ? 1000 : 1);
    const max = Number(range[2].replace(/,/g, "")) * (firstHasK ? 1000 : 1);
    return { min, max, evidence: range[0] };
  }

  const single = text.match(/(?:budget is|budget:|fee:)?\s*(?:usd |eur |gbp |\$|€|£)([\d,.]+)(?:\s*k)?/i);
  if (single?.[1]) {
    const multiplier = /k/i.test(single[0]) ? 1000 : 1;
    const value = Number(single[1].replace(/,/g, "")) * multiplier;
    if (Number.isFinite(value)) {
      return { min: value, max: value, evidence: single[0] };
    }
  }

  return undefined;
};

const findEmail = (text: string) => text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];

const findDate = (text: string) => {
  const iso = text.match(/\b(20\d{2})[-/](\d{2})[-/](\d{2})\b/);
  if (iso) {
    const normalized = `${iso[1]}-${iso[2]}-${iso[3]}`;
    const date = new Date(`${normalized}T00:00:00Z`);
    if (
      date.getUTCFullYear() === Number(iso[1]) &&
      date.getUTCMonth() + 1 === Number(iso[2]) &&
      date.getUTCDate() === Number(iso[3])
    ) {
      return { value: normalized, evidence: iso[0], invalid: false };
    }
    return { value: normalized, evidence: iso[0], invalid: true };
  }

  const us = text.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
  if (us) {
    const normalized = `${us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
    const date = new Date(`${normalized}T00:00:00Z`);
    const invalid =
      date.getUTCFullYear() !== Number(us[3]) ||
      date.getUTCMonth() + 1 !== Number(us[1]) ||
      date.getUTCDate() !== Number(us[2]);
    return { value: normalized, evidence: us[0], invalid };
  }

  const followMonth = text.match(
    /follow up on\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,\s*(20\d{2}))?/i,
  );
  if (followMonth) {
    const months = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    const year = followMonth[3] ?? text.match(/\b(20\d{2})\b/)?.[1] ?? "2026";
    const monthNumber = months.indexOf(followMonth[1].toLowerCase()) + 1;
    return {
      value: `${year}-${String(monthNumber).padStart(2, "0")}-${followMonth[2].padStart(2, "0")}`,
      evidence: followMonth[0],
      invalid: false,
    };
  }

  const month = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,\s*(20\d{2}))?/i,
  );
  if (month) {
    const months = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    const year = month[3] ?? text.match(/\b(20\d{2})\b/)?.[1] ?? "2026";
    const monthNumber = months.indexOf(month[1].toLowerCase()) + 1;
    const normalized = `${year}-${String(monthNumber).padStart(2, "0")}-${month[2].padStart(2, "0")}`;
    return { value: normalized, evidence: month[0], invalid: false };
  }

  if (/next friday/i.test(text)) {
    return { value: "", evidence: "next Friday", invalid: false, relative: true };
  }

  return undefined;
};

const extractCompany = (text: string) => {
  const labeled = text.match(/(?:Client|Company|Parties):\s*([^\n]+)/i)?.[1]?.trim();
  if (labeled) {
    if (/ and /i.test(labeled)) {
      return labeled.split(/\s+and\s+/i).at(-1)?.trim();
    }
    return labeled;
  }
  const weAre = text.match(/\bwe are ([A-Z][A-Za-z0-9 &.-]+)/i)?.[1]?.trim();
  return weAre?.replace(/\s+and need.*$/i, "");
};

const extractName = (text: string) => text.match(/From:\s*([^<\n]+)/i)?.[1]?.trim();

const detectKind = (text: string, csv: CsvParseResult | null, anomalies: IntakeAnomaly[]): IntakeKind => {
  const headers = csv?.headers.join(" ") ?? "";
  if (anomalies.some((item) => item.code === "prompt_injection" || item.code === "suspicious_unicode")) {
    return "adversarial";
  }
  if (csv && /gross|fee|net|transaction/.test(headers)) {
    return "payment_csv";
  }
  if (csv && /invoice|qty|unit price|paid/.test(headers)) {
    return "invoice_csv";
  }
  if (csv && /company|email|budget|follow/.test(headers)) {
    return "lead_csv";
  }
  if (/consulting agreement|liability cap|termination|confidentiality/i.test(text)) {
    return "contract";
  }
  if (/transcript|stakeholders|action item|decision:/i.test(text)) {
    return "transcript";
  }
  if (/request for proposal|required deliverables|acceptance criteria/i.test(text)) {
    return "rfp";
  }
  if (/^subject:|^from:/im.test(text)) {
    return "email";
  }
  if (/hey |linkedin|saw your/i.test(text)) {
    return "message";
  }
  return "unknown";
};

const inferTaxCategory = (description: string): TaxCategory => {
  if (/software|setup|implementation/i.test(description)) {
    return "software_income";
  }
  if (/maintenance|support|retainer/i.test(description)) {
    return "maintenance_income";
  }
  if (/reimburse|travel|expense/i.test(description)) {
    return "reimbursable_expense";
  }
  return "consulting_income";
};

const estimateConfidence = (analysis: Pick<IntakeAnalysis, "lead" | "anomalies" | "kind">) => {
  const fields = [
    analysis.lead.name,
    analysis.lead.company,
    analysis.lead.email,
    analysis.lead.budgetMin,
    analysis.lead.followUpAt,
    analysis.lead.need,
  ].filter(Boolean) as Array<InferredValue<unknown>>;
  const fieldScore = fields.length
    ? fields.reduce((total, field) => total + field.confidence, 0) / fields.length
    : 0.25;
  const penalty = analysis.anomalies.filter((item) => item.severity !== "info").length * 0.08;
  const kindBoost = analysis.kind === "unknown" ? -0.1 : 0.08;
  return Math.max(0.1, Math.min(0.98, fieldScore - penalty + kindBoost));
};

export const analyzeIntake = (raw: string, options: AnalyzeOptions = {}): IntakeAnalysis => {
  const generatedAt = options.now ?? defaultNow;
  const normalized = normalizeInput(raw);
  const csv = parseCsv(normalized.text);
  const anomalies = [...normalized.anomalies];

  if (csv?.malformedRows.length) {
    anomalies.push(
      anomaly(
        "malformed_row",
        "warning",
        "One or more spreadsheet rows do not match the header shape.",
        "A row has fewer or more cells than the header.",
        "Review the highlighted row before accepting the import.",
        `Rows ${csv.malformedRows.join(", ")}`,
      ),
    );
  }

  const date = findDate(normalized.text);
  if (date?.invalid) {
    anomalies.push(
      anomaly(
        "invalid_date",
        "danger",
        "An impossible date was detected.",
        "The calendar date cannot exist.",
        "Correct the date before sending a proposal or contract.",
        date.evidence,
      ),
    );
  }
  if (date?.relative) {
    anomalies.push(
      anomaly(
        "relative_date",
        "warning",
        "A relative date needs confirmation.",
        "Phrases like next Friday depend on when the message was written.",
        "Confirm the follow-up date before accepting.",
        date.evidence,
      ),
    );
  }

  if (/set .*fee .*0/i.test(normalized.text)) {
    anomalies.push(
      anomaly(
        "suspicious_fee_instruction",
        "danger",
        "Fee-changing instruction detected in client text.",
        "The input asks the app to change pricing rather than describing a requirement.",
        "Verify fee fields manually.",
      ),
    );
  }

  const kind = detectKind(normalized.text, csv, anomalies);
  const sourceId = stableId("source", normalized.text);
  const budget = findBudget(normalized.text);
  const email = findEmail(normalized.text);
  const company = extractCompany(normalized.text);
  const name = extractName(normalized.text);

  const lead = {
    id: stableId("lead", `${email ?? company ?? normalized.text.slice(0, 80)}`),
    name: name ? inferred(name, 0.82, name, "Detected from email From header.") : undefined,
    company: company ? inferred(company, 0.78, company, "Detected from client/company wording.") : undefined,
    email: email ? inferred(email, 0.94, email, "Detected by email pattern.") : undefined,
    source: inferred(
      kind === "message" ? "LinkedIn" : kind === "email" ? "Email" : kind === "lead_csv" ? "Spreadsheet" : "Direct",
      kind === "message" || kind === "email" || kind === "lead_csv" ? 0.8 : 0.45,
      kind,
      "Inferred from input shape.",
    ),
    budgetMin: budget ? inferred(budget.min, 0.86, budget.evidence, "Detected budget amount.") : undefined,
    budgetMax: budget ? inferred(budget.max, 0.82, budget.evidence, "Detected budget amount.") : undefined,
    followUpAt:
      date && date.value && !date.invalid
        ? inferred(date.value, 0.74, date.evidence, "Detected date pattern.")
        : undefined,
    need: inferred(
      normalized.text.split("\n").find((line) => /need|scope|trying|focus|action item/i.test(line)) ??
        normalized.text.slice(0, 240),
      0.58,
      normalized.text.slice(0, 180),
      "Selected the strongest problem/scope sentence.",
    ),
    notes: inferred(normalized.text.slice(0, 500), 0.5, "raw intake", "Preserved original intake excerpt."),
  };

  if (!lead.email) {
    anomalies.push(
      anomaly(
        "missing_email",
        "warning",
        "No client email was detected.",
        "The app can draft, but sending and invoice records need a reliable contact.",
        "Add or confirm the client email.",
      ),
    );
  }

  const deliverables = [...normalized.text.matchAll(/-\s+([^\n]+)/g)].map((match) =>
    inferred(match[1].trim(), 0.82, match[0], "Detected from a bullet list."),
  );
  if (/proposal|contract|invoice|tax export|lead intake/i.test(normalized.text) && deliverables.length < 3) {
    deliverables.push(
      inferred("Lead intake and proposal workflow", 0.52, "workflow wording", "Derived from practice workflow terms."),
      inferred("Contract evidence and invoice tracking", 0.52, "workflow wording", "Derived from practice workflow terms."),
      inferred("Tax-ready export with provenance", 0.52, "export wording", "Derived from export requirements."),
    );
  }

  const proposal = {
    deliverables,
    timeline: date?.value
      ? inferred(date.value, 0.62, date.evidence, "Detected deadline or milestone date.")
      : undefined,
    paymentTerms: normalized.text.match(/payment terms:\s*([^\n.]+)/i)?.[1]
      ? inferred(
          normalized.text.match(/payment terms:\s*([^\n.]+)/i)![1].trim(),
          0.86,
          normalized.text.match(/payment terms:\s*([^\n.]+)/i)![0],
          "Detected payment terms label.",
        )
      : undefined,
    acceptanceCriteria: normalized.text.match(/acceptance criteria:\s*([^\n]+)/i)?.[1]
      ? inferred(
          normalized.text.match(/acceptance criteria:\s*([^\n]+)/i)![1].trim(),
          0.82,
          normalized.text.match(/acceptance criteria:\s*([^\n]+)/i)![0],
          "Detected acceptance criteria label.",
        )
      : undefined,
    risks: [...normalized.text.matchAll(/risks?:\s*([^\n]+)/gi)].map((match) =>
      inferred(match[1].trim(), 0.76, match[0], "Detected risk label."),
    ),
  };

  let invoice: IntakeAnalysis["invoice"];
  let payment: IntakeAnalysis["payment"];

  if (csv && kind === "invoice_csv") {
    const validRows = csv.rows.filter((row) => row.length === csv.headers.length);
    const totals = validRows.map((row) => {
      const qty = Number(byHeader(csv, row, ["qty", "quantity"])) || 1;
      const unit = parseMoney(byHeader(csv, row, ["unit price", "price"])) ?? 0;
      return qty * unit;
    });
    if (totals.some((total) => total < 0)) {
      anomalies.push(
        anomaly(
          "negative_line_item",
          "info",
          "A negative invoice line was treated as a discount.",
          "Negative lines usually represent discounts or credits.",
          "Confirm the tax treatment before export.",
        ),
      );
    }
    invoice = {
      lineItems: validRows.length,
      total: totals.reduce((total, value) => total + value, 0),
      paid: validRows.reduce((total, row) => total + (parseMoney(byHeader(csv, row, ["paid"])) ?? 0), 0),
      taxCategories: validRows.map((row) => {
        const description = byHeader(csv, row, ["description"]);
        const category = inferTaxCategory(description);
        return inferred(category, 0.72, description, "Inferred from invoice line description.");
      }),
    };
  }

  if (csv && kind === "payment_csv") {
    const first = csv.rows.find((row) => /completed/i.test(byHeader(csv, row, ["status"]))) ?? csv.rows[0];
    if (csv.rows.some((row) => /pending/i.test(byHeader(csv, row, ["status"])))) {
      anomalies.push(
        anomaly(
          "pending_payment",
          "warning",
          "At least one payment is pending.",
          "Pending payments should not mark an invoice paid yet.",
          "Review payment status before applying it.",
        ),
      );
    }
    if (first) {
      payment = {
        currency: inferred(byHeader(csv, first, ["currency"]) || "USD", 0.84, "Currency column", "Detected payment currency."),
        gross: inferred(parseMoney(byHeader(csv, first, ["gross"])) ?? 0, 0.88, "Gross column", "Detected gross payment."),
        fee: inferred(parseMoney(byHeader(csv, first, ["fee"])) ?? 0, 0.86, "Fee column", "Detected payment fee."),
        net: inferred(parseMoney(byHeader(csv, first, ["net"])) ?? 0, 0.88, "Net column", "Detected net payment."),
        transactionId: inferred(
          byHeader(csv, first, ["transaction id"]),
          0.86,
          "Transaction ID column",
          "Detected payment transaction ID.",
        ),
      };
    }
  }

  if (csv && kind === "lead_csv") {
    const validRows = csv.rows.filter((row) => row.length === csv.headers.length);
    const first = validRows[0];
    if (first) {
      const rowEmail = byHeader(csv, first, ["email"]);
      const rowCompany = byHeader(csv, first, ["company"]);
      const rowBudget = parseMoney(byHeader(csv, first, ["budget"]));
      lead.email = rowEmail ? inferred(rowEmail, 0.9, rowEmail, "Detected from Email column.") : lead.email;
      lead.company = rowCompany ? inferred(rowCompany, 0.86, rowCompany, "Detected from Company column.") : lead.company;
      lead.budgetMin = rowBudget ? inferred(rowBudget, 0.84, String(rowBudget), "Detected from Budget column.") : lead.budgetMin;
      lead.budgetMax = lead.budgetMin;
      lead.name = byHeader(csv, first, ["name"])
        ? inferred(byHeader(csv, first, ["name"]), 0.84, "Name column", "Detected from Name column.")
        : lead.name;
      lead.followUpAt = byHeader(csv, first, ["follow-up", "follow"])
        ? inferred(findDate(byHeader(csv, first, ["follow-up", "follow"]))?.value ?? "", 0.72, "Follow-up column", "Detected follow-up date.")
        : lead.followUpAt;
    }
    if (validRows.some((row) => !byHeader(csv, row, ["email"]))) {
      anomalies.push(
        anomaly(
          "missing_email",
          "warning",
          "One or more lead rows have no email.",
          "Those leads cannot be contacted directly from exports.",
          "Add missing emails before sending proposals.",
        ),
      );
    }
  }

  if (kind === "transcript") {
    anomalies.push(
      anomaly(
        "large_or_partial_input",
        "info",
        "Transcript-like input was summarized from visible evidence.",
        "Long transcripts may contain decisions outside the pasted excerpt.",
        "Review extracted risks and dates before accepting.",
      ),
    );
  }

  const contract =
    kind === "contract"
      ? {
          jurisdiction: normalized.text.match(/jurisdiction:\s*([^\n]+)/i)?.[1]
            ? inferred(
                normalized.text.match(/jurisdiction:\s*([^\n]+)/i)![1].trim(),
                0.82,
                "Jurisdiction label",
                "Detected jurisdiction clause.",
              )
            : undefined,
          hasConfidentiality: /confidentiality/i.test(normalized.text),
          hasTermination: /termination/i.test(normalized.text),
          hasLiabilityCap: /liability cap/i.test(normalized.text),
        }
      : undefined;

  const partial = { lead, anomalies, kind };
  const validCsvRows = csv?.rows.filter((row) => row.length === csv.headers.length).length ?? 0;
  const confidence = Math.min(
    0.98,
    estimateConfidence(partial) + (invoice || payment ? 0.16 : 0),
  );
  const suggestedFixes: SuggestedFix[] = anomalies
    .filter((item) => item.severity !== "info")
    .map((item) => ({
      id: `fix-${item.code}`,
      label: item.next,
      reason: item.why,
      action: item.code,
    }));

  return {
    id: stableId("analysis", `${kind}:${normalized.text}`),
    sourceId,
    kind,
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    normalizedText: normalized.text,
    summary: `${kind.replace("_", " ")} detected with ${confidenceLevel(confidence)} confidence`,
    lead,
    proposal,
    invoice,
    payment,
    contract,
    anomalies,
    suggestedFixes,
    metadata: {
      schemaVersion,
      generatedAt,
      inputBytes: new TextEncoder().encode(raw).length,
      durationMs: 0,
      parameters: {
        engine: "deterministic-v1",
        csvRows: validCsvRows,
        normalized: true,
      },
    },
  };
};
