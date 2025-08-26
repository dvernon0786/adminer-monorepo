#!/usr/bin/env node
// scripts/emit-job.ts - Test script for emitting Inngest events
import { inngest } from "../src/inngest/client";

async function emitTestEvent() {
  try {
    console.log("🚀 Emitting test job event...");
    
    await inngest.send({
      name: "keyword/requested",
      data: { 
        keyword: "demo",
        orgId: "org_123",
        jobId: "test-job-" + Date.now()
      },
      user: { id: "org_123" }
    });
    
    console.log("✅ Test event emitted successfully");
    
  } catch (error) {
    console.error("❌ Failed to emit test event:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  emitTestEvent();
}

export { emitTestEvent }; 