#!/usr/bin/env node

/**
 * Script to query all rows from the jobs table in Neon database
 * and display the Drizzle schema information
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, varchar } from 'drizzle-orm/pg-core';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../../.env.local' });

// Drizzle schema for jobs table (from schema.ts)
const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull(),
  type: text('type').notNull(), // 'scrape', 'analyze', 'export'
  status: text('status').notNull().default('pending'), // pending, running, completed, failed
  input: jsonb('input').notNull(), // job parameters
  output: jsonb('output'), // job results
  error: text('error'), // error message if failed
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

async function queryJobsTable() {
  try {
    console.log('🔍 Connecting to Neon database...');
    
    // Create database connection
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql, { schema: { jobs } });
    
    console.log('📊 Querying all rows from jobs table...\n');
    
    // Query all jobs
    const allJobs = await db.select().from(jobs);
    
    console.log('📋 DRIZZLE SCHEMA FOR JOBS TABLE:');
    console.log('=====================================');
    console.log('Table Name: jobs');
    console.log('Columns:');
    console.log('  - id: uuid (Primary Key, auto-generated)');
    console.log('  - orgId: uuid (Foreign Key to organizations.id)');
    console.log('  - type: text (Job type: scrape, analyze, export)');
    console.log('  - status: text (pending, running, completed, failed)');
    console.log('  - input: jsonb (Job parameters)');
    console.log('  - output: jsonb (Job results)');
    console.log('  - error: text (Error message if failed)');
    console.log('  - startedAt: timestamp (When job started)');
    console.log('  - completedAt: timestamp (When job completed)');
    console.log('  - createdAt: timestamp (When job was created)');
    console.log('');
    
    console.log(`📈 TOTAL JOBS FOUND: ${allJobs.length}`);
    console.log('=====================================\n');
    
    if (allJobs.length === 0) {
      console.log('❌ No jobs found in the database.');
      console.log('This could mean:');
      console.log('  - No jobs have been created yet');
      console.log('  - Jobs table is empty');
      console.log('  - Database connection issue');
    } else {
      console.log('📝 ALL JOBS DATA:');
      console.log('==================');
      
      allJobs.forEach((job, index) => {
        console.log(`\n--- Job ${index + 1} ---`);
        console.log(`ID: ${job.id}`);
        console.log(`Organization ID: ${job.orgId}`);
        console.log(`Type: ${job.type}`);
        console.log(`Status: ${job.status}`);
        console.log(`Input: ${JSON.stringify(job.input, null, 2)}`);
        console.log(`Output: ${job.output ? JSON.stringify(job.output, null, 2) : 'null'}`);
        console.log(`Error: ${job.error || 'null'}`);
        console.log(`Started At: ${job.startedAt || 'null'}`);
        console.log(`Completed At: ${job.completedAt || 'null'}`);
        console.log(`Created At: ${job.createdAt}`);
      });
    }
    
    // Additional statistics
    console.log('\n📊 JOB STATISTICS:');
    console.log('==================');
    
    const statusCounts = allJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});
    
    const typeCounts = allJobs.reduce((acc, job) => {
      acc[job.type] = (acc[job.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\nType Distribution:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    // Check for recent jobs
    const recentJobs = allJobs.filter(job => {
      const createdAt = new Date(job.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt > oneDayAgo;
    });
    
    console.log(`\nRecent Jobs (last 24h): ${recentJobs.length}`);
    
  } catch (error) {
    console.error('❌ Error querying jobs table:');
    console.error(error.message);
    
    if (error.message.includes('DATABASE_URL')) {
      console.log('\n💡 Make sure your .env.local file contains a valid DATABASE_URL');
    }
  }
}

// Run the query
queryJobsTable();