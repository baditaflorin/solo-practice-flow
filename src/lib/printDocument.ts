export const markdownToPrintableHtml = (
  title: string,
  markdown: string,
) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        color: #19211f;
        font-family: ui-serif, Georgia, "Times New Roman", serif;
        line-height: 1.55;
        margin: 32px auto;
        max-width: 780px;
        padding: 0 24px;
      }
      pre {
        font: inherit;
        white-space: pre-wrap;
      }
      @media print {
        body {
          margin: 0;
          max-width: none;
        }
      }
    </style>
  </head>
  <body>
    <pre>${escapeHtml(markdown)}</pre>
  </body>
</html>`;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
