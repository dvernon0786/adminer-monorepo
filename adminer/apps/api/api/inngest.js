// Inngest Serve Handler
// Properly registers functions with Inngest Cloud using serve() function

import { serve } from "inngest/next";
import { inngest } from "../src/inngest/client";
import { jobCreatedFunction, aiAnalyze } from "../src/inngest/functions";

export default serve({
  client: inngest,
  functions: [jobCreatedFunction, aiAnalyze]
});
