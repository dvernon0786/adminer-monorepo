# ARCHITECTURE CONSOLIDATION PLAN

## DUPLICATE DETECTION RESULTS

### 1. QUOTA CONSUMPTION DUPLICATES
**KEEP**: 
- `src/lib/db.ts` - orgDb.consumeQuota() (TypeScript - PREFERRED)
- All Inngest functions using orgDb.consumeQuota()

**REMOVE**:
- Any direct SQL quota updates in Inngest functions
- Custom quota consumption functions
- Hardcoded quota increments

### 2. PAYMENT INTEGRATION DUPLICATES  
**KEEP**:
- `/api/dodo/checkout.js` - Dodo checkout API (NEW)
- `/api/dodo/webhook.js` - Dodo webhook API (NEW)  
- `/api/dodo/free.js` - Free plan API (NEW)
- `src/lib/dodo.js` - DodoClient library (NEW)

**REMOVE**:
- Any Stripe payment references
- Old backup payment files
- Mock payment implementations in production

### 3. COMPONENT DUPLICATES
**KEEP**:
- `components/homepage/Pricing.tsx` - Main pricing component
- `components/dashboard/QuotaExceededModal.tsx` - Quota exceeded modal (NEW)
- `pages/mock-payment.tsx` - Development testing (NEW)

**REMOVE**:
- Old pricing components in other directories
- Duplicate modal components
- Unused billing components

### 4. API ENDPOINT DUPLICATES
**KEEP**:
- `/api/dodo/*` - All Dodo payment APIs (NEW)
- `/api/quota` - Quota status API
- `/api/jobs` - Job creation with quota validation

**REMOVE**:
- Old payment APIs (if any)
- Duplicate quota endpoints
- Unused billing endpoints

## CONSOLIDATION ACTIONS

1. **Backup conflicting files**
2. **Remove duplicate implementations** 
3. **Update imports/references**
4. **Test single architecture**
5. **Deploy consolidated version**
