import { serve } from "inngest/next";
import { 
  downgradeNightly, 
  downgradeCanceledOrgs,
  onJobStarted,
  onJobCompleted,
  onApifyWebhook,
  onApifyRunFailed,
  onApifyRunCompleted,
  inngest
} from "../../src/inngest";

export default serve({
  client: inngest,
  functions: [
    // Legacy functions
    downgradeNightly,
    downgradeCanceledOrgs,
    
    // New job system functions
    onJobStarted,
    onJobCompleted,
    onApifyWebhook,
    onApifyRunFailed,
    onApifyRunCompleted,
  ],
});