import { schemaVersion, type PracticeState } from "./types";

const today = new Date();
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export const createInitialPracticeState = (): PracticeState => ({
  schemaVersion,
  updatedAt: new Date().toISOString(),
  profile: {
    businessName: "Solo Practice Studio",
    ownerName: "Florin Badita",
    email: "hello@example.com",
    address: "Remote",
    paymentDetails: "PayPal: https://www.paypal.com/paypalme/florinbadita",
    defaultHourlyRate: 120,
  },
  settings: {
    currency: "USD",
    paymentTermsDays: 14,
    taxYear: today.getFullYear(),
    repoUrl: "https://github.com/baditaflorin/solo-practice-flow",
    paypalUrl: "https://www.paypal.com/paypalme/florinbadita",
    localLlm: {
      enabled: false,
      endpoint: "http://localhost:11434",
      model: "llama3.2",
    },
  },
  leads: [
    {
      id: "lead-demo",
      name: "Avery Chen",
      company: "Northstar Operations",
      email: "avery@example.com",
      source: "Referral",
      status: "qualified",
      budget: 7800,
      need: "Replace scattered consulting admin tools with one private workflow.",
      createdAt: isoDate(today),
      followUpAt: isoDate(nextWeek),
      notes:
        "Wants a proposal this week and a signed kickoff before month end.",
    },
  ],
  proposals: [],
  contracts: [],
  invoices: [],
});
