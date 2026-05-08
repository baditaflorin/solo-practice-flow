import assert from "node:assert/strict";
import { chromium } from "playwright";

const port = Number(process.env.PORT || 4273);
const url = `http://127.0.0.1:${port}/solo-practice-flow/`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(url);
  await page.getByRole("heading", { name: "Solo Practice Flow" }).waitFor();
  assert.equal(
    await page.getByRole("link", { name: "Star repo" }).getAttribute("href"),
    "https://github.com/baditaflorin/solo-practice-flow",
  );
  assert.equal(
    await page.getByRole("link", { name: "PayPal" }).getAttribute("href"),
    "https://www.paypal.com/paypalme/florinbadita",
  );
  await page.getByText("Version").waitFor();
  await page.getByText("Commit").waitFor();

  await page.getByPlaceholder("Client name").fill("Morgan Lee");
  await page.getByPlaceholder("Company").fill("Atlas Labs");
  await page.getByPlaceholder("client@example.com").fill("morgan@example.com");
  await page
    .getByPlaceholder("What outcome are they buying?")
    .fill("A private proposal to cash workflow.");
  await page.getByRole("button", { name: "Capture" }).click();
  await page.getByText("Atlas Labs").first().waitFor();

  await page.getByRole("button", { name: "Generate proposal" }).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("input")].some((input) =>
      input.value.includes("Atlas Labs consulting sprint"),
    ),
  );
  await page.getByRole("button", { name: "Draft contract" }).click();
  await page.getByText(/consulting agreement is between/i).waitFor();
  await page.getByRole("button", { name: "Sign" }).click();
  await page.getByText(/Ed25519 verified/i).waitFor();
  await page.getByRole("button", { name: "Create invoice" }).click();
  await page.getByText(/Outstanding/).waitFor();
} finally {
  await browser.close();
}
