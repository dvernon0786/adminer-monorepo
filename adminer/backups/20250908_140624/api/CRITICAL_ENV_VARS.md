# 🚨 CRITICAL ENVIRONMENT VARIABLES - IMMEDIATE ACTION REQUIRED

## **Production Site is CRASHING - These Variables Must Be Set in Vercel**

### **🔴 CRITICAL (Site Won't Load Without These)**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `CLERK_SECRET_KEY` | Clerk authentication server key | `sk_live_...` |
| `CLERK_PUBLISHABLE_KEY` | Clerk authentication client key | `pk_live_...` |
| `APIFY_TOKEN` | Apify web scraping API token | `apify_api_...` |
| `APIFY_ACTOR_ID` | Apify actor ID for scraping | `actor_id_...` |

### **🟡 IMPORTANT (Features Won't Work Without These)**

| Variable | Description | Example |
|----------|-------------|---------|
| `DODO_SECRET_KEY` | Dodo payments secret key | `dodo_live_...` |
| `DODO_WEBHOOK_SECRET` | Dodo webhook verification | `whsec_...` |
| `OPENAI_API_KEY` | OpenAI API key for AI analysis | `sk-...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `INNGEST_EVENT_KEY` | Inngest background jobs | `your_event_key` |

### **🚨 IMMEDIATE STEPS**

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add ALL variables above** with correct production values
3. **Set Environment to 'Production'** for critical variables
4. **Redeploy your application**
5. **Test https://adminer.online**

### **✅ SUCCESS INDICATOR**

- ❌ **Before**: "💥 A runtime error occurred"
- ✅ **After**: Dashboard loads with content, no runtime errors

### **🔍 WHERE TO FIND VALUES**

- **Database**: Your Neon PostgreSQL connection string
- **Clerk**: Your Clerk production dashboard
- **Apify**: Your Apify account settings
- **Dodo**: Your Dodo payments dashboard
- **AI Keys**: Your OpenAI and Google AI Studio accounts

---

**⚠️ WARNING: Production site will continue to crash until these variables are set!** 