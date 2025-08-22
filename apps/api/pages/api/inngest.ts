import { serve } from "inngest/next";
import { inngest } from "../../src/inngest/client";
import { downgradeCanceled } from "../../src/inngest/functions/downgradeCanceled";

export default serve({
  client: inngest,
  functions: [downgradeCanceled],
});