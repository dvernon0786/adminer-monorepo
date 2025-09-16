# 📊 **COMPLETE QUOTA SYSTEM CODE SUMMARY**

**Date**: September 14, 2025  
**Status**: ✅ **COMPREHENSIVE QUOTA CODE DOCUMENTATION**  
**Priority**: **COMPLETE QUOTA FUNCTIONALITY OVERVIEW**

---

## 🎯 **QUOTA SYSTEM OVERVIEW**

The Adminer platform implements a comprehensive quota system to track and limit usage across different plans. The system includes:

- **Database Schema**: Quota tracking in organizations and detailed usage logging
- **API Endpoints**: Real-time quota status and consumption tracking
- **Inngest Functions**: Automatic quota updates during job processing
- **Frontend Integration**: Quota display and upgrade prompts
- **Billing Integration**: Plan-based quota limits and enforcement

---

## 🗄️ **DATABASE SCHEMA**

### **1. Organizations Table** (`src/db/schema.ts`)

```typescript
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: text('clerk_org_id').notNull().unique(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('free'), // free, pro, enterprise
  quotaLimit: integer('quota_limit').notNull().default(100),
  quotaUsed: integer('quota_used').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Key Fields**:
- `quotaLimit`: Maximum quota allowed for the organization (100 for free, 500 for pro, etc.)
- `quotaUsed`: Current quota consumption (incremented with each job)
- `plan`: Determines quota limits (free, pro, enterprise)

### **2. Quota Usage Table** (`src/db/schema.ts`)

```typescript
export const quotaUsage = pgTable('quota_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  jobId: uuid('job_id').references(() => jobs.id),
  type: text('type').notNull(), // 'scrape', 'analyze', 'export'
  amount: integer('amount').notNull(), // quota units consumed
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Purpose**: Detailed tracking of quota consumption per job/action

---

## 🔌 **API ENDPOINTS**

### **1. Quota Status Endpoint** (`/api/quota`)

**File**: `api/consolidated.js` (lines 410-440)

```javascript
// QUOTA ENDPOINT - Real database integration
if (path === '/api/quota') {
  try {
    console.log('Quota endpoint hit:', { method: req.method, path });
    
    if (req.method === 'GET') {
      // Get organization ID from headers (Clerk)
      const orgId = req.headers['x-org-id'] || 'default-org';
      
      // Initialize database on first request
      await initializeDatabase();
      
      // Get real quota status from database
      const quotaData = await getRealQuotaStatus(orgId);
      
      res.status(200).json({
        success: true,
        data: quotaData,
        source: 'real_database',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Quota endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quota',
      message: error.message
    });
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "used": 5,
    "limit": 100,
    "percentage": 5,
    "plan": "free"
  },
  "source": "real_database",
  "timestamp": "2025-09-14T10:30:00.000Z"
}
```

### **2. Quota Status Function** (`getRealQuotaStatus`)

**File**: `api/consolidated.js` (lines 51-100)

```javascript
async function getRealQuotaStatus(orgId = 'default-org') {
  try {
    console.log('🔍 Starting quota query for orgId:', orgId);
    const database = await initializeDatabase();
    if (!database) {
      throw new Error('Database not available');
    }
    
    // Query real organization data using raw SQL
    const orgResult = await database.execute(sql`
      SELECT quota_used, quota_limit, plan 
      FROM organizations 
      WHERE clerk_org_id = ${orgId} 
      LIMIT 1
    `);
    
    if (!orgResult.rows || orgResult.rows.length === 0) {
      console.log('🆕 No organization found, creating default...');
      // Create default organization if it doesn't exist
      await database.execute(sql`
        INSERT INTO organizations (clerk_org_id, name, plan, quota_limit, quota_used)
        VALUES (${orgId}, 'Default Organization', 'free', 100, 0)
        ON CONFLICT (clerk_org_id) DO NOTHING
      `);
      
      return {
        used: 0,
        limit: 100,
        percentage: 0,
        plan: 'free'
      };
    }
    
    const org = orgResult.rows[0];
    return {
      used: org.quota_used || 0,
      limit: org.quota_limit || 100,
      percentage: Math.round(((org.quota_used || 0) / (org.quota_limit || 100)) * 100),
      plan: org.plan || 'free'
    };
    
  } catch (error) {
    console.error('❌ Database query failed:', error);
    // Fallback to default values
    return {
      used: 0,
      limit: 100,
      percentage: 0,
      plan: 'free',
      error: `Database query failed: ${error.message}`
    };
  }
}
```

---

## ⚙️ **INNGEST FUNCTIONS**

### **1. Quota Update in Job Processing** (`src/inngest/functions.js`)

**File**: `src/inngest/functions.js` (lines 125-135)

```javascript
// Step 6: Update quota
try {
  await database.query(`
    UPDATE organizations 
    SET quota_used = quota_used + 1, updated_at = NOW() 
    WHERE clerk_org_id = $1
  `, [orgId]);
  
  console.log(`✅ Quota updated for organization: ${orgId}`);
  
} catch (quotaError) {
  console.error('⚠️ Failed to update quota:', quotaError);
  // Don't fail the job for quota update errors
}
```

**Purpose**: Automatically increments quota usage when jobs complete successfully

### **2. Quota Exceeded Handler** (Legacy - `src/inngest/functions_complex.js`)

```javascript
// Quota Exceeded Handler
const quotaExceeded = inngest.createFunction(
  { id: 'quota-exceeded' },
  { event: 'quota/exceeded' },
  async ({ event }) => {
    await step.run('send-quota-notification', async () => {
      console.log('Sending quota notification for:', event.data);
      return { notificationSent: true };
    });
    
    await step.run('log-quota-exceeded', async () => {
      console.log('Logging quota exceeded event:', event.data);
      return { logged: true };
    });
    
    return { message: 'Quota exceeded handling completed' };
  }
);
```

---

## 🧪 **TESTING AND VERIFICATION**

### **1. Database Storage Test** (`test-database-storage.js`)

```javascript
// Check quota usage
const quotaResult = await database.query(`
  SELECT id, name, quota_used, quota_limit, 
         ((quota_used::float / quota_limit::float) * 100)::numeric(5,2) as usage_percentage
  FROM orgs 
  ORDER BY quota_used DESC 
  LIMIT 3
`);

console.log('   Organization quota usage:');
quotaResult.forEach((org, index) => {
  console.log(`   ${index + 1}. Org ID: ${org.id}`);
  console.log(`      Name: ${org.name}`);
  console.log(`      Used: ${org.quota_used}/${org.quota_limit} (${org.usage_percentage}%)`);
});
```

### **2. Complete Pipeline Test** (`test-complete-pipeline.js`)

```javascript
// Check organization quota
const orgResult = await database.query(`
  SELECT id, name, quota_used, quota_limit 
  FROM orgs 
  WHERE id = $1
`, [organization.id]);

console.log('📊 Organization quota:', {
  quota_used: orgResult[0].quota_used,
  quota_limit: orgResult[0].quota_limit
});
```

---

## 💳 **BILLING INTEGRATION**

### **1. Plan-Based Quota Limits**

**Free Plan**:
- `quota_limit`: 10 (from Dodo product metadata)
- `quota_used`: 0 (incremented with usage)

**Pro Plan**:
- `quota_limit`: 500 (from Dodo product metadata)
- `quota_used`: Current usage

### **2. Dodo Product Configuration**

**File**: `create-free-price-prod.sh`

```bash
"metadata": {
  "plan_type": "free",
  "quota_limit": "10"
}
```

### **3. Quota Enforcement**

**File**: `src/inngest/functions_complex.js` (lines 52-53)

```javascript
if (organization.quota_used >= organization.quota_limit) {
  throw new Error(`Quota exceeded for organization: ${orgId} (${organization.quota_used}/${organization.quota_limit})`);
}
```

---

## 📊 **QUOTA CALCULATIONS**

### **1. Usage Percentage**

```javascript
percentage: Math.round(((org.quota_used || 0) / (org.quota_limit || 100)) * 100)
```

### **2. Quota Consumption**

```javascript
// Increment quota usage
UPDATE organizations 
SET quota_used = quota_used + 1, updated_at = NOW() 
WHERE clerk_org_id = $1
```

### **3. Quota Status Response**

```javascript
{
  used: org.quota_used || 0,           // Current usage
  limit: org.quota_limit || 100,       // Maximum allowed
  percentage: Math.round(...),         // Usage percentage
  plan: org.plan || 'free'             // Current plan
}
```

---

## 🔧 **QUOTA MANAGEMENT FUNCTIONS**

### **1. Create Organization with Quota**

```javascript
INSERT INTO organizations (clerk_org_id, name, plan, quota_limit, quota_used)
VALUES ($1, $2, 'free', 100, 0)
ON CONFLICT (clerk_org_id) DO UPDATE SET
  updated_at = NOW(),
  name = EXCLUDED.name
```

### **2. Update Quota Usage**

```javascript
UPDATE organizations 
SET quota_used = quota_used + 1, updated_at = NOW() 
WHERE clerk_org_id = $1
```

### **3. Check Quota Status**

```javascript
SELECT quota_used, quota_limit, plan 
FROM organizations 
WHERE clerk_org_id = $1
```

---

## 🎯 **QUOTA SYSTEM FEATURES**

### **✅ Implemented Features**:
- **Real-time Quota Tracking**: Database-backed quota monitoring
- **Automatic Quota Updates**: Inngest functions increment usage
- **Plan-based Limits**: Different limits for free/pro/enterprise
- **Usage Percentage**: Calculated usage percentage display
- **Quota API Endpoint**: RESTful API for quota status
- **Database Integration**: Persistent quota storage
- **Error Handling**: Graceful fallbacks for quota errors

### **🔄 Quota Flow**:
1. **Job Creation** → Check quota availability
2. **Job Processing** → Increment quota usage
3. **Quota Monitoring** → Real-time status updates
4. **Plan Upgrades** → Increase quota limits
5. **Usage Tracking** → Detailed consumption logging

---

## 📋 **FILES CONTAINING QUOTA CODE**

### **Core Files**:
- ✅ `src/db/schema.ts` - Database schema definitions
- ✅ `api/consolidated.js` - Quota API endpoint and functions
- ✅ `src/inngest/functions.js` - Quota updates in job processing
- ✅ `test-database-storage.js` - Quota testing and verification

### **Configuration Files**:
- ✅ `create-free-price-prod.sh` - Dodo product quota configuration
- ✅ `env.local.template` - Environment variable templates
- ✅ `BILLING_SYSTEM_README.md` - Billing and quota documentation

### **Legacy Files**:
- ✅ `src/inngest/functions_complex.js` - Advanced quota handling
- ✅ `src/inngest/functions_clean.js` - Clean quota implementation
- ✅ `backup-*/` - Historical quota implementations

---

## 🚀 **USAGE EXAMPLES**

### **1. Get Quota Status**

```bash
curl -X GET "https://www.adminer.online/api/quota" \
  -H "x-org-id: your-org-id"
```

### **2. Check Quota in Frontend**

```javascript
const response = await fetch('/api/quota', {
  headers: { 'x-org-id': orgId }
});
const { data } = await response.json();
console.log(`Usage: ${data.used}/${data.limit} (${data.percentage}%)`);
```

### **3. Database Quota Query**

```sql
SELECT 
  id, 
  name, 
  quota_used, 
  quota_limit,
  ((quota_used::float / quota_limit::float) * 100)::numeric(5,2) as usage_percentage
FROM organizations 
WHERE clerk_org_id = 'your-org-id';
```

---

**Status**: ✅ **COMPLETE QUOTA SYSTEM DOCUMENTATION** - All quota-related code identified and documented! 🎉

This comprehensive summary covers all quota functionality in the Adminer platform, including database schema, API endpoints, Inngest functions, testing, billing integration, and usage examples.