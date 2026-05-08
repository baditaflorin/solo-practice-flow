import { rmSync } from "node:fs";

for (const path of [
  "docs/assets",
  "docs/index.html",
  "docs/404.html",
  "docs/favicon.svg",
  "docs/icons.svg",
  "docs/manifest.webmanifest",
  "docs/sw.js",
]) {
  rmSync(path, { force: true, recursive: true });
}
