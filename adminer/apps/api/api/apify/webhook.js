import crypto from 'crypto';
import { inngest } from '../src/lib/inngest.js';
import { jobDb } from '../src/lib/db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Apify-Signature');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Verify webhook signature
    const signature = req.headers['x-apify-signature'] || req.headers['x-webhook-signature'];
    const webhookSecret = process.env.WEBHOOK_SECRET_APIFY || process.env.APIFY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized - missing signature or secret' 
      });
    }

    // Verify HMAC signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');

    if (expectedSignature !== providedSignature) {
      console.error('Invalid webhook signature', {
        expected: expectedSignature,
        provided: providedSignature,
        hasSecret: !!webhookSecret
      });
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid signature' 
      });
    }

    const { eventType, data } = req.body;

    console.log('Apify webhook received:', {
      eventType,
      runId: data?.runId,
      status: data?.status,
      hasData: !!data
    });

    // Handle different webhook events
    let result = {};
    switch (eventType) {
      case 'ACTOR.RUN.SUCCEEDED':
        result = await handleRunSucceeded(data);
        break;
      case 'ACTOR.RUN.FAILED':
        result = await handleRunFailed(data);
        break;
      case 'ACTOR.RUN.ABORTED':
        result = await handleRunAborted(data);
        break;
      case 'ACTOR.RUN.TIMED_OUT':
        result = await handleRunTimedOut(data);
        break;
      default:
        console.log('Unhandled webhook event type:', eventType);
        result = { status: 'unhandled', eventType };
    }

    console.log('Webhook processed successfully:', { eventType, result });
    return res.status(200).json({
      success: true,
      eventType,
      result
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Processing failed',
      message: error.message
    });
  }
}

/**
 * Handle successful run completion
 */
async function handleRunSucceeded(data) {
  const { runId, actorId, defaultDatasetId, stats } = data;

  console.log('Run succeeded:', { runId, actorId, defaultDatasetId });

  try {
    // Emit Inngest event for run completion
    await inngest.send({
      name: 'apify/run.completed',
      data: {
        runId,
        actorId,
        defaultDatasetId,
        status: 'succeeded',
        stats,
        completedAt: new Date().toISOString()
      }
    });

    // Update any pending jobs that might be waiting for this run
    // This is a fallback in case the job wasn't tracked properly
    const pendingJobs = await jobDb.findByStatus('running');
    for (const job of pendingJobs) {
      if (job.input?.runId === runId) {
        await jobDb.updateStatus(job.id, 'completed', {
          runId,
          defaultDatasetId,
          stats,
          completedAt: new Date().toISOString()
        });
      }
    }

    return {
      status: 'processed',
      action: 'run_completed',
      runId,
      defaultDatasetId
    };

  } catch (error) {
    console.error('Failed to process run succeeded:', error);
    throw error;
  }
}

/**
 * Handle failed run
 */
async function handleRunFailed(data) {
  const { runId, actorId, errorMessage, stats } = data;

  console.log('Run failed:', { runId, actorId, errorMessage });

  try {
    // Emit Inngest event for run failure
    await inngest.send({
      name: 'apify/run.failed',
      data: {
        runId,
        actorId,
        status: 'failed',
        errorMessage,
        stats,
        failedAt: new Date().toISOString()
      }
    });

    // Update any pending jobs
    const pendingJobs = await jobDb.findByStatus('running');
    for (const job of pendingJobs) {
      if (job.input?.runId === runId) {
        await jobDb.updateStatus(job.id, 'failed', {
          runId,
          error: errorMessage,
          failedAt: new Date().toISOString()
        });
      }
    }

    return {
      status: 'processed',
      action: 'run_failed',
      runId,
      errorMessage
    };

  } catch (error) {
    console.error('Failed to process run failed:', error);
    throw error;
  }
}

/**
 * Handle aborted run
 */
async function handleRunAborted(data) {
  const { runId, actorId } = data;

  console.log('Run aborted:', { runId, actorId });

  try {
    // Emit Inngest event for run abortion
    await inngest.send({
      name: 'apify/run.aborted',
      data: {
        runId,
        actorId,
        status: 'aborted',
        abortedAt: new Date().toISOString()
      }
    });

    // Update any pending jobs
    const pendingJobs = await jobDb.findByStatus('running');
    for (const job of pendingJobs) {
      if (job.input?.runId === runId) {
        await jobDb.updateStatus(job.id, 'failed', {
          runId,
          error: 'Run was aborted',
          abortedAt: new Date().toISOString()
        });
      }
    }

    return {
      status: 'processed',
      action: 'run_aborted',
      runId
    };

  } catch (error) {
    console.error('Failed to process run aborted:', error);
    throw error;
  }
}

/**
 * Handle timed out run
 */
async function handleRunTimedOut(data) {
  const { runId, actorId } = data;

  console.log('Run timed out:', { runId, actorId });

  try {
    // Emit Inngest event for run timeout
    await inngest.send({
      name: 'apify/run.timed_out',
      data: {
        runId,
        actorId,
        status: 'timed_out',
        timedOutAt: new Date().toISOString()
      }
    });

    // Update any pending jobs
    const pendingJobs = await jobDb.findByStatus('running');
    for (const job of pendingJobs) {
      if (job.input?.runId === runId) {
        await jobDb.updateStatus(job.id, 'failed', {
          runId,
          error: 'Run timed out',
          timedOutAt: new Date().toISOString()
        });
      }
    }

    return {
      status: 'processed',
      action: 'run_timed_out',
      runId
    };

  } catch (error) {
    console.error('Failed to process run timed out:', error);
    throw error;
  }
}