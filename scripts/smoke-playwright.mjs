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

  await page.getByLabel("Raw intake").fill(`Hi Florin,

I'm Morgan Lee at Atlas Labs. We need a private proposal to cash workflow and can budget $8,400.
Please follow up on June 1.

morgan@example.com`);
  await page.getByText(/email detected with/i).waitFor();
  await page.getByRole("button", { name: "Apply" }).click();
  assert.equal(
    await page.getByPlaceholder("Company").inputValue(),
    "Atlas Labs",
  );
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
