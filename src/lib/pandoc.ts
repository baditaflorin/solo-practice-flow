export const markdownToStandaloneHtml = async (markdown: string) => {
  const { convert } = await import(
    /* @vite-ignore */ "https://esm.sh/pandoc-wasm@1.0.1?bundle"
  );
  const result = await convert(
    {
      from: "markdown",
      to: "html",
      standalone: true,
      metadata: { title: "Solo Practice Flow Export" },
    },
    markdown,
    {},
  );

  if (result.stderr) {
    console.info(result.stderr);
  }

  return result.stdout || markdown;
};
