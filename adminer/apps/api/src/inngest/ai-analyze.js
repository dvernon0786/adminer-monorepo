/**
 * AI ANALYSIS INNGEST HANDLER - SIMPLE TEST VERSION
 * Tests if AI analysis function can execute and update database
 */

const { inngest } = require('./client.js');
const { neon } = require('@neondatabase/serverless');

const database = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// Simple AI Analysis Test Handler
const aiAnalyze = inngest.createFunction(
  { id: "ai-analyze" },
  { event: "ai/analyze.start" },
  async ({ event, step }) => {
    console.log("🔥 AI ANALYSIS TRIGGERED!");
    
    const { jobId } = event.data;
    
    // Simple database update to prove it works
    await step.run("update-job-with-test", async () => {
      if (!database) {
        console.log("⚠️ Database not available");
        return { success: false, message: "Database not available" };
      }
      
      await database.query(`
        UPDATE jobs 
        SET 
          summary = $1,
          content_type = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [
        "TEST: AI analysis function executed successfully",
        "test",
        jobId
      ]);
      
      console.log(`✅ Updated job ${jobId} with test data`);
    });
    
    return { success: true, message: "AI analysis test completed" };
  }
);

module.exports = { aiAnalyze };