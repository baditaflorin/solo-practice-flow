import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const port = Number(process.env.PORT || 4173);
const basePath = "/solo-practice-flow";
const docsDir = resolve("docs");

const contentTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

const resolveRequest = (url) => {
  const parsed = new URL(url, `http://127.0.0.1:${port}`);
  let pathname = decodeURIComponent(parsed.pathname);

  if (pathname === "/") {
    pathname = `${basePath}/`;
  }

  if (!pathname.startsWith(basePath)) {
    return null;
  }

  const stripped = pathname.slice(basePath.length) || "/";
  const candidate = normalize(join(docsDir, stripped));
  if (!candidate.startsWith(docsDir)) {
    return null;
  }

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }

  if (existsSync(join(candidate, "index.html"))) {
    return join(candidate, "index.html");
  }

  return join(docsDir, "index.html");
};

const server = createServer((request, response) => {
  const file = resolveRequest(request.url ?? "/");
  if (!file) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Pages preview: http://127.0.0.1:${port}${basePath}/`);
});

process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
