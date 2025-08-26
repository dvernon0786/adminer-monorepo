# Free Plan Implementation - Silent Server-Side Creation

## Overview

This implementation removes all Free-plan "checkout/pay" code and UI. When a signed-in user clicks "Start Free", it calls `/api/dodo/free` which creates a Dodo "Free" subscription with price: 0 and updates the database (plan + quota), then redirects to `/dashboard`.

## What Changed

### 1. Database Schema
- **New Table**: `orgs` table with plan, quota, and Dodo subscription tracking
- **Location**: `adminer/apps/api/src/db/schema.ts`
- **Migration**: `adminer/apps/api/scripts/create-tables.sql`

### 2. New API Endpoint
- **Route**: `/api/dodo/free`
- **Method**: POST only
- **Auth**: Clerk protected
- **Function**: Creates Dodo customer + free subscription (price: 0)

### 3. Updated Components
- **Pricing Component**: Free plan now calls API instead of navigating
- **Button Text**: Changed from "Go to Dashboard" to "Start Free"
- **Flow**: API call → Database update → Redirect to dashboard

### 4. Environment Variables
- **New Variables**:
  - `DODO_API_BASE`: Dodo API base URL
  - `DODO_SECRET_KEY`: Server-only Dodo secret key
  - `DODO_FREE_PLAN_ID`: Dodo product ID for free plan
  - `DODO_CURRENCY`: Currency (default: usd)

## Setup Instructions

### 1. Install Dependencies
```bash
cd adminer/apps/api
npm install
```

### 2. Database Setup
```bash
# Run the SQL script in your Neon PostgreSQL database
psql $DATABASE_URL -f scripts/create-tables.sql
```

### 3. Environment Configuration
Copy `env.local.template` to `.env.local` and fill in:
```bash
# Dodo Payments (Test Mode)
DODO_MODE=test
DODO_API_BASE=https://test.dodopayments.com
DODO_API_KEY=dodo_test_YOUR_TEST_API_KEY_HERE
DODO_SECRET_KEY=dodo_test_YOUR_TEST_SECRET_KEY_HERE
DODO_WEBHOOK_SECRET=whsec_YOUR_GENERATED_WEBHOOK_SECRET_HERE
DODO_PRODUCT_FREE=prod_FREE_PRODUCT_ID_HERE
DODO_PRODUCT_PRO=prod_PRO_PRODUCT_ID_HERE
DODO_PRODUCT_ENTERPRISE=prod_ENTERPRISE_PRODUCT_ID_HERE
DODO_CURRENCY=usd
```

### 4. Dodo Dashboard Setup
1. Create a "Free" product in Dodo with price: $0
2. Note the product ID for `DODO_PRODUCT_FREE`
3. Ensure your API key has permissions to create customers and subscriptions

## How It Works

### 1. User Flow
1. User clicks "Start Free" button
2. System checks if user has organization
3. Calls `/api/dodo/free` with orgId and orgName
4. API creates Dodo customer + free subscription
5. Updates local database with plan and quota info
6. Redirects to `/dashboard`

### 2. API Flow
1. **Auth Check**: Verifies Clerk user session
2. **Org Validation**: Ensures orgId is provided
3. **Database Upsert**: Creates/updates org record
4. **Dodo Customer**: Creates customer in Dodo
5. **Free Subscription**: Creates subscription with price: 0
6. **Database Update**: Links Dodo IDs to local org
7. **Response**: Returns success with plan details

### 3. Security Features
- **Server-Only Keys**: `DODO_SECRET_KEY` never exposed to client
- **Auth Required**: All endpoints require Clerk authentication
- **Input Validation**: orgId required, proper error handling
- **Rate Limiting**: Can be added if needed

## Testing

### 1. Local Testing
```bash
# Start API
cd adminer/apps/api
npm run dev

# Test free plan creation
curl -X POST http://localhost:3000/api/dodo/free \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{"orgId": "test-org", "orgName": "Test Organization"}'
```

### 2. Production Testing
1. Deploy with proper environment variables
2. Test free plan creation flow
3. Verify database updates
4. Check quota endpoint returns correct values

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check `DATABASE_URL` environment variable
   - Ensure Neon database is accessible
   - Run migration script

2. **Dodo API Errors**
   - Verify `DODO_SECRET_KEY` is correct
   - Check `DODO_FREE_PLAN_ID` exists in Dodo
   - Ensure API key has proper permissions

3. **Clerk Auth Issues**
   - Verify `CLERK_SECRET_KEY` is set
   - Check user is properly authenticated
   - Ensure orgId is provided

### Debug Steps

1. Check API logs for errors
2. Verify environment variables are loaded
3. Test database connection separately
4. Validate Dodo API credentials

## Future Enhancements

1. **Quota Tracking**: Implement actual usage tracking
2. **Plan Upgrades**: Add upgrade flow from free to paid
3. **Usage Analytics**: Track feature usage per plan
4. **Admin Panel**: Manage orgs and plans

## Files Modified

- `adminer/apps/api/package.json` - Added Drizzle dependencies
- `adminer/apps/api/src/db/schema.ts` - New database schema
- `adminer/apps/api/src/db/client.ts` - Database client
- `adminer/apps/api/pages/api/dodo/free.ts` - New free plan endpoint
- `adminer/apps/api/pages/api/consolidated.ts` - Updated quota handling
- `adminer/apps/web/src/components/homepage/Pricing.tsx` - Updated UI flow
- `adminer/apps/api/pages/api/dodo/checkout.ts` - Excluded free plans
- `adminer/apps/api/env.production.template` - Updated environment variables
- `adminer/apps/api/env.local.template` - New local environment template
- `adminer/apps/api/scripts/create-tables.sql` - Database migration script 