declare module "https://esm.sh/pandoc-wasm@1.0.1?bundle" {
  export interface PandocResult {
    stdout: string;
    stderr: string;
    warnings: unknown[];
    files: Record<string, Blob | string>;
    mediaFiles: Record<string, Blob | string>;
  }

  export function convert(
    options: Record<string, unknown>,
    stdin: string | null,
    files: Record<string, Blob | string>,
  ): Promise<PandocResult>;
}
