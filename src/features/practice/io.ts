export interface LoadedIntakeFile {
  name: string;
  type: string;
  size: number;
  text: string;
}

export type IntakeFormatKind =
  | "empty"
  | "json_backup"
  | "json"
  | "csv"
  | "html"
  | "markdown"
  | "plain_text";

export interface IntakeFormat {
  kind: IntakeFormatKind;
  label: string;
  detail: string;
  confidence: number;
}

export interface Result<T> {
  ok: boolean;
  value?: T;
  message: string;
  detail?: string;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const base64Alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export const maxShareTextBytes = 6_000;

export const sampleIntake = `From: Morgan Lee <morgan@example.com>
Company: Atlas Labs

Hi Florin,

We need a private proposal-to-cash workflow for a consulting practice.
Budget is $8,400, timeline is 4 weeks, and we want proposal, contract,
invoice, payment-status review, and tax-ready export help.

Please follow up on June 1.`;

export const detectIntakeFormat = (
  text: string,
  filename = "",
): IntakeFormat => {
  const trimmed = text.trim();
  const lowerName = filename.toLowerCase();

  if (!trimmed) {
    return {
      kind: "empty",
      label: "Empty intake",
      detail: "Nothing has been loaded yet.",
      confidence: 1,
    };
  }

  if (
    (trimmed.startsWith("{") || trimmed.startsWith("[")) &&
    trimmed.includes('"state"') &&
    trimmed.includes('"provenance"')
  ) {
    return {
      kind: "json_backup",
      label: "Workspace backup JSON",
      detail: "Looks like a Solo Practice Flow backup.",
      confidence: 0.94,
    };
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return {
      kind: "json",
      label: "JSON text",
      detail: "Looks like structured JSON text.",
      confidence: 0.78,
    };
  }

  if (lowerName.endsWith(".csv") || looksLikeCsv(trimmed)) {
    return {
      kind: "csv",
      label: "CSV or spreadsheet export",
      detail: "Rows and separators were detected.",
      confidence: 0.86,
    };
  }

  if (
    lowerName.endsWith(".html") ||
    lowerName.endsWith(".htm") ||
    /<\/?[a-z][\s\S]*>/i.test(trimmed)
  ) {
    return {
      kind: "html",
      label: "HTML document",
      detail: "Markup tags were detected.",
      confidence: 0.82,
    };
  }

  if (
    lowerName.endsWith(".md") ||
    /^#{1,6}\s/m.test(trimmed) ||
    /\n[-*]\s+\S/.test(trimmed)
  ) {
    return {
      kind: "markdown",
      label: "Markdown notes",
      detail: "Markdown headings or list structure were detected.",
      confidence: 0.74,
    };
  }

  return {
    kind: "plain_text",
    label: "Plain text intake",
    detail: "The app will infer lead details from natural language.",
    confidence: 0.66,
  };
};

export const formatLoadedIntakeFiles = (
  files: LoadedIntakeFile[],
): Result<{ text: string; format: IntakeFormat; summary: string }> => {
  if (!files.length) {
    return {
      ok: false,
      message: "No files were loaded.",
      detail: "Choose at least one text, CSV, HTML, Markdown, or JSON file.",
    };
  }

  const text =
    files.length === 1
      ? files[0].text
      : files
          .map(
            (file) =>
              `--- ${file.name} (${file.type || "text/plain"}, ${file.size} bytes) ---\n${file.text.trim()}`,
          )
          .join("\n\n");

  const format = detectIntakeFormat(text, files[0].name);
  return {
    ok: true,
    value: {
      text,
      format,
      summary:
        files.length === 1
          ? `${files[0].name} loaded as ${format.label.toLowerCase()}`
          : `${files.length} files combined as ${format.label.toLowerCase()}`,
    },
    message: "Files loaded.",
  };
};

export const encodeShareText = (text: string): Result<string> => {
  const bytes = textEncoder.encode(text);
  if (bytes.length > maxShareTextBytes) {
    return {
      ok: false,
      message: "This intake is too large for a share URL.",
      detail: `Keep share links under ${maxShareTextBytes} bytes, or export a backup instead.`,
    };
  }

  return {
    ok: true,
    value: bytesToBase64(bytes)
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/u, ""),
    message: "Share text encoded.",
  };
};

export const decodeShareHash = (hash: string): Result<string> => {
  const match = hash.match(/^#intake=([A-Za-z0-9_-]+)$/u);
  if (!match) {
    return {
      ok: false,
      message: "No shared intake was found in the URL.",
    };
  }

  try {
    const base64 = match[1].replaceAll("-", "+").replaceAll("_", "/");
    return {
      ok: true,
      value: textDecoder.decode(base64ToBytes(base64)),
      message: "Shared intake decoded.",
    };
  } catch (error) {
    return {
      ok: false,
      message: "The shared intake link is not valid.",
      detail:
        error instanceof Error
          ? error.message
          : "The URL hash could not be decoded.",
    };
  }
};

const looksLikeCsv = (text: string) => {
  const lines = text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (lines.length < 2) {
    return false;
  }
  const commaRows = lines.filter((line) => line.split(",").length >= 2).length;
  const semicolonRows = lines.filter(
    (line) => line.split(";").length >= 2,
  ).length;
  return Math.max(commaRows, semicolonRows) >= 2;
};

const bytesToBase64 = (bytes: Uint8Array) => {
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const triplet = (first << 16) | (second << 8) | third;

    output += base64Alphabet[(triplet >> 18) & 63];
    output += base64Alphabet[(triplet >> 12) & 63];
    output +=
      index + 1 < bytes.length ? base64Alphabet[(triplet >> 6) & 63] : "=";
    output += index + 2 < bytes.length ? base64Alphabet[triplet & 63] : "=";
  }
  return output;
};

const base64ToBytes = (input: string) => {
  const padded = input.padEnd(Math.ceil(input.length / 4) * 4, "=");
  const bytes: number[] = [];

  for (let index = 0; index < padded.length; index += 4) {
    const values = padded
      .slice(index, index + 4)
      .split("")
      .map((character) =>
        character === "=" ? 0 : base64Alphabet.indexOf(character),
      );

    if (values.some((value) => value < 0)) {
      throw new Error("The URL hash contains characters outside base64url.");
    }

    const triplet =
      (values[0] << 18) |
      (values[1] << 12) |
      ((values[2] ?? 0) << 6) |
      (values[3] ?? 0);
    bytes.push((triplet >> 16) & 255);
    if (padded[index + 2] !== "=") {
      bytes.push((triplet >> 8) & 255);
    }
    if (padded[index + 3] !== "=") {
      bytes.push(triplet & 255);
    }
  }

  return new Uint8Array(bytes);
};
