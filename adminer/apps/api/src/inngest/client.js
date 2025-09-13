// VERCEL COMPATIBLE INNGEST CLIENT (CommonJS)
const { Inngest } = require("inngest");

const inngest = new Inngest({
  id: "adminer-jobs",
  name: "Adminer Job Processor",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  isDev: process.env.NODE_ENV === "development"
});

module.exports = { inngest };