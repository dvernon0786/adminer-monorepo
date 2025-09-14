// VERCEL COMPATIBLE INNGEST CLIENT (CommonJS)
const { Inngest } = require("inngest");

// FIXED: Use correct Inngest configuration for local development
const inngest = new Inngest({
  id: "adminer-jobs",
  name: "Adminer Job Processor",
  eventKey: process.env.INNGEST_EVENT_KEY || "local-test-key",
  signingKey: process.env.INNGEST_SIGNING_KEY || "local-test-signing-key",
  isDev: process.env.NODE_ENV === "development",
  // FIXED: Use correct local dev server configuration
  eventBaseUrl: process.env.NODE_ENV === "development" ? "http://localhost:8288" : undefined,
  apiBaseUrl: process.env.NODE_ENV === "development" ? "http://localhost:8288" : undefined
});

module.exports = { inngest };
