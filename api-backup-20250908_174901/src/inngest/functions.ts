import { Inngest } from 'inngest';

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: 'adminer-jobs',
  name: 'Adminer Job Pipeline'
});

// Job Created Handler
export const jobCreated = inngest.createFunction(
  { id: 'job-created' },
  { event: 'job/created' },
  async ({ event, step }) => {
    await step.run('update-job-status', async () => {
      console.log('Updating job status for:', event.data);
      return { status: 'processing' };
    });

    await step.run('process-job', async () => {
      console.log('Processing job:', event.data);
      return { processed: true };
    });

    await step.run('complete-job', async () => {
      console.log('Completing job:', event.data);
      return { completed: true };
    });

    await step.run('consume-quota', async () => {
      console.log('Consuming quota for:', event.data);
      return { quotaConsumed: true };
    });

    return { message: 'Job created and processed successfully' };
  }
);

// Quota Exceeded Handler
export const quotaExceeded = inngest.createFunction(
  { id: 'quota-exceeded' },
  { event: 'quota/exceeded' },
  async ({ event, step }) => {
    await step.run('send-quota-notification', async () => {
      console.log('Sending quota notification for:', event.data);
      return { notificationSent: true };
    });

    await step.run('trigger-upgrade-flow', async () => {
      console.log('Triggering upgrade flow for:', event.data);
      return { upgradeFlowTriggered: true };
    });

    return { message: 'Quota exceeded handling completed' };
  }
);

// Subscription Updated Handler
export const subscriptionUpdated = inngest.createFunction(
  { id: 'subscription-updated' },
  { event: 'subscription/updated' },
  async ({ event, step }) => {
    await step.run('update-org-quota', async () => {
      console.log('Updating org quota for:', event.data);
      return { quotaUpdated: true };
    });

    await step.run('send-confirmation', async () => {
      console.log('Sending confirmation for:', event.data);
      return { confirmationSent: true };
    });

    return { message: 'Subscription updated successfully' };
  }
);

// Apify Run Completed Handler
export const apifyRunCompleted = inngest.createFunction(
  { id: 'apify-run-completed' },
  { event: 'apify/run.completed' },
  async ({ event, step }) => {
    await step.run('get-dataset-items', async () => {
      console.log('Getting dataset items for:', event.data);
      return { itemsRetrieved: true };
    });

    await step.run('update-job-status', async () => {
      console.log('Updating job status for:', event.data);
      return { statusUpdated: true };
    });

    return { message: 'Apify run completed successfully' };
  }
);

// Apify Run Failed Handler
export const apifyRunFailed = inngest.createFunction(
  { id: 'apify-run-failed' },
  { event: 'apify/run.failed' },
  async ({ event, step }) => {
    await step.run('update-job-status', async () => {
      console.log('Updating job status for failed run:', event.data);
      return { statusUpdated: 'failed' };
    });

    return { message: 'Apify run failure handled' };
  }
);