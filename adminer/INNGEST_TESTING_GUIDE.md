# 🔧 Inngest Testing Guide - Local & Production

## 🏠 **Local Development Setup**

### 1. **Install Inngest CLI**
```bash
# Install globally
npm install -g inngest-cli

# Or use npx (recommended)
npx inngest-cli@latest dev
```

### 2. **Start Inngest Dev Server**
```bash
cd adminer/apps/api
npx inngest-cli@latest dev
```

**Expected Output:**
```
✅ Inngest dev server running at http://localhost:8288
🔍 Functions discovered at http://localhost:3000/api/inngest
📊 Dashboard available at http://localhost:8288
```

### 3. **Start Your API Server**
```bash
# In another terminal
cd adminer/apps/api
npm run dev
```

### 4. **Verify Local Setup**

#### **Check Inngest Dashboard**
- Visit: `http://localhost:8288`
- You should see your functions listed:
  - `job-created`
  - `quota-exceeded` 
  - `subscription-updated`

#### **Test Function Discovery**
```bash
curl http://localhost:3000/api/inngest
```
**Expected Response:** Function definitions in JSON format

#### **Test Job Creation**
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -H "x-org-id: test-org" \
  -d '{
    "type": "scrape",
    "input": {
      "url": "https://example.com",
      "pages": 5
    }
  }'
```

#### **Monitor Function Execution**
- Watch the Inngest dashboard at `http://localhost:8288`
- Check the "Runs" tab to see function executions
- View logs and errors in real-time

---

## 🌐 **Production Testing**

### 1. **Deploy to Vercel**
```bash
git add .
git commit -m "Add Inngest functions"
git push origin main
```

### 2. **Set Production Environment Variables**
In Vercel Dashboard → Settings → Environment Variables:

```bash
# Required for production
INNGEST_EVENT_KEY=your_production_event_key
INNGEST_SIGNING_KEY=your_production_signing_key
DATABASE_URL=your_production_database_url
```

### 3. **Connect Inngest to Production**

#### **Option A: Inngest Cloud Dashboard**
1. Go to [Inngest Dashboard](https://app.inngest.com)
2. Create a new app or use existing
3. Add your Vercel URL: `https://adminer.online/api/inngest`
4. Inngest will auto-discover your functions

#### **Option B: Self-Hosted Inngest**
```bash
# If using self-hosted Inngest
INNGEST_URL=https://your-inngest-instance.com
```

### 4. **Verify Production Setup**

#### **Check Function Discovery**
```bash
curl https://adminer.online/api/inngest
```

#### **Test Production Job Creation**
```bash
curl -X POST https://adminer.online/api/jobs \
  -H "Content-Type: application/json" \
  -H "x-org-id: test-org" \
  -d '{
    "type": "analyze",
    "input": {
      "dataSize": 5000
    }
  }'
```

#### **Monitor Production Functions**
- Check Inngest dashboard for function runs
- Monitor Vercel function logs
- Check database for job records

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Job Processing**
```bash
# Create a scrape job
curl -X POST https://adminer.online/api/jobs \
  -H "Content-Type: application/json" \
  -H "x-org-id: test-org" \
  -d '{
    "type": "scrape",
    "input": {
      "url": "https://example.com",
      "pages": 10
    }
  }'

# Expected: Job created, function triggered, quota consumed
```

### **Scenario 2: Quota Exceeded**
```bash
# Create multiple jobs to exceed quota
for i in {1..15}; do
  curl -X POST https://adminer.online/api/jobs \
    -H "Content-Type: application/json" \
    -H "x-org-id: test-org" \
    -d '{
      "type": "scrape",
      "input": {
        "url": "https://example.com",
        "pages": 10
      }
    }'
done

# Expected: 402 response, upgrade flow triggered
```

### **Scenario 3: Subscription Update**
```bash
# Simulate webhook event
curl -X POST https://adminer.online/api/webhook \
  -H "Content-Type: application/json" \
  -H "dodo-signature: test-signature" \
  -d '{
    "type": "subscription.updated",
    "data": {
      "metadata": {
        "orgId": "test-org"
      },
      "plan": {
        "id": "pro"
      },
      "status": "active"
    }
  }'

# Expected: Subscription updated, quota reset
```

---

## 🔍 **Debugging & Monitoring**

### **Local Debugging**
```bash
# Check Inngest dev server logs
npx inngest-cli@latest dev --verbose

# Check API server logs
npm run dev

# Test individual functions
curl -X POST http://localhost:3000/api/inngest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "job/created",
    "data": {
      "jobId": "test-job",
      "orgId": "test-org",
      "type": "scrape",
      "input": {"url": "https://example.com"}
    }
  }'
```

### **Production Monitoring**
```bash
# Check Vercel function logs
vercel logs --follow

# Check Inngest dashboard
# Visit: https://app.inngest.com

# Test function health
curl https://adminer.online/api/inngest/health
```

### **Common Issues & Fixes**

#### **Function Not Discovered**
- ✅ Check API endpoint is accessible: `curl https://adminer.online/api/inngest`
- ✅ Verify function exports in `src/lib/inngest.ts`
- ✅ Check Inngest client configuration

#### **Function Not Executing**
- ✅ Check environment variables are set
- ✅ Verify database connection
- ✅ Check function logs in Inngest dashboard

#### **Database Connection Issues**
- ✅ Verify `DATABASE_URL` is correct
- ✅ Check database permissions
- ✅ Test connection: `node test-db.js`

---

## 📊 **Success Indicators**

### **Local Development**
- ✅ Inngest dev server running on port 8288
- ✅ Functions discovered at `/api/inngest`
- ✅ Jobs can be created and processed
- ✅ Quota enforcement working
- ✅ Webhook events processed

### **Production**
- ✅ Functions deployed and discoverable
- ✅ Jobs processing successfully
- ✅ Database operations working
- ✅ Error handling and logging
- ✅ Performance within acceptable limits

---

## 🚀 **Quick Commands**

### **Start Local Development**
```bash
# Terminal 1: Start Inngest
cd adminer/apps/api && npx inngest-cli@latest dev

# Terminal 2: Start API
cd adminer/apps/api && npm run dev

# Terminal 3: Test
curl http://localhost:3000/api/inngest
```

### **Deploy to Production**
```bash
git add .
git commit -m "Deploy Inngest functions"
git push origin main

# Wait for deployment, then test
curl https://adminer.online/api/inngest
```

### **Monitor Production**
```bash
# Check function health
curl https://adminer.online/api/consolidated?action=health

# Test job creation
curl -X POST https://adminer.online/api/jobs \
  -H "Content-Type: application/json" \
  -H "x-org-id: test-org" \
  -d '{"type": "scrape", "input": {"url": "https://example.com"}}'
```