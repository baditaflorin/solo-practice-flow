import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";
import pkg from "./package.json" with { type: "json" };

const commit = (() => {
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
})();

// https://vite.dev/config/
export default defineConfig({
  base: "/solo-practice-flow/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "docs",
    emptyOutDir: false,
    sourcemap: false,
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT_SHA__: JSON.stringify(commit),
    __REPO_URL__: JSON.stringify(
      "https://github.com/baditaflorin/solo-practice-flow",
    ),
    __PAYPAL_URL__: JSON.stringify(
      "https://www.paypal.com/paypalme/florinbadita",
    ),
  },
});
