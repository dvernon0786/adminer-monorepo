import { serve } from "inngest/next";
import { inngest } from "../../src/inngest/client";
import { downgradeNightly } from "../../src/inngest/functions/downgradeCanceled";

export default serve({
  client: inngest,
  functions: [downgradeNightly],
});