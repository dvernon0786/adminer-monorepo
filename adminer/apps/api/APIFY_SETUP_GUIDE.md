# Apify Integration Setup Guide

## 🚀 Complete Apify Integration Implementation

This guide covers the complete implementation of Apify integration with direct API calls, proper error handling, and database storage.

## 📋 Prerequisites

### 1. Apify Account Setup
1. **Sign up for Apify**: Visit [https://apify.com](https://apify.com)
2. **Get API Token**: Go to [https://console.apify.com/account/integrations](https://console.apify.com/account/integrations)
3. **Copy your API token** (starts with `apify_api_`)

### 2. Environment Variables
Set the following environment variables:

```bash
# Apify Configuration
export APIFY_TOKEN=your_apify_token_here
export APIFY_ACTOR_ID=apify/google-search-scraper

# Database Configuration
export DATABASE_URL=your_neon_database_url

# Inngest Configuration
export INNGEST_EVENT_KEY=your_event_key
export INNGEST_SIGNING_KEY=your_signing_key
```

## 🔧 Implementation Files

### 1. Direct Apify Service (`src/lib/apify-direct.js`)
- **Purpose**: Direct HTTP calls to Apify API
- **Features**: 
  - Bearer token authentication
  - Proper error handling
  - Response parsing
  - Health checks
  - Test functionality

### 2. Enhanced Inngest Functions (`src/inngest/functions-enhanced.js`)
- **Purpose**: Complete job processing pipeline
- **Features**:
  - Organization management with UPSERT
  - Job creation and status tracking
  - Direct Apify scraping integration
  - Database storage of results
  - Quota management
  - AI analysis triggering

### 3. Test Scripts
- **`test-apify-integration.js`**: Tests Apify service directly
- **`test-complete-pipeline.js`**: Tests entire job pipeline

## 🧪 Testing

### 1. Test Apify Integration
```bash
# Set environment variables first
export APIFY_TOKEN=your_token_here
export APIFY_ACTOR_ID=apify/google-search-scraper

# Run the test
node test-apify-integration.js
```

### 2. Test Complete Pipeline
```bash
# Set all environment variables
export APIFY_TOKEN=your_token_here
export APIFY_ACTOR_ID=apify/google-search-scraper
export DATABASE_URL=your_database_url

# Run the complete test
node test-complete-pipeline.js
```

## 📊 Expected Results

### Successful Test Output
```
✅ Apify integration test PASSED!
📊 Successfully scraped X items
⏱️ Processing time: Xms

✅ COMPLETE PIPELINE TEST PASSED!
✅ Job created and processed successfully
✅ Organization created in database
✅ Job stored in database with results
✅ Apify scraping completed
```

## 🔍 Key Features

### 1. Direct API Integration
- Uses official Apify API v2 endpoints
- Proper Bearer token authentication
- Comprehensive error handling
- Response validation

### 2. Database Integration
- Stores scraped data in `jobs.output` JSONB column
- Proper organization management
- Quota tracking and enforcement
- Status tracking throughout pipeline

### 3. Error Handling
- Graceful failure handling
- Detailed error logging
- Database rollback on failures
- Retry mechanisms

### 4. Performance
- 5-minute timeout for scraping
- Efficient database queries
- Proper resource cleanup
- Memory optimization

## 🚨 Troubleshooting

### Common Issues

1. **APIFY_TOKEN not found**
   - Ensure environment variable is set
   - Check token format (starts with `apify_api_`)

2. **Database connection failed**
   - Verify DATABASE_URL is correct
   - Check Neon database is accessible

3. **Apify API errors**
   - Check token permissions
   - Verify actor ID is correct
   - Check rate limits

4. **Job processing failures**
   - Check database schema
   - Verify foreign key relationships
   - Check quota limits

## 📈 Next Steps

1. **Production Deployment**
   - Set environment variables in production
   - Configure monitoring and alerting
   - Set up error tracking

2. **Performance Optimization**
   - Implement caching strategies
   - Add request queuing
   - Optimize database queries

3. **Enhanced Features**
   - Add retry mechanisms
   - Implement webhook handling
   - Add data validation

## 🔗 API Documentation

- **Apify API v2**: [https://docs.apify.com/api/v2](https://docs.apify.com/api/v2)
- **Google Search Scraper**: [https://console.apify.com/actors/apify~google-search-scraper](https://console.apify.com/actors/apify~google-search-scraper)
- **Synchronous Run Endpoint**: [https://docs.apify.com/api/v2#/reference/actors/run-actor-synchronously-and-get-dataset-items](https://docs.apify.com/api/v2#/reference/actors/run-actor-synchronously-and-get-dataset-items)

## ✅ Implementation Status

- ✅ **Direct Apify API Integration**: Complete
- ✅ **Database Storage**: Complete
- ✅ **Error Handling**: Complete
- ✅ **Testing Scripts**: Complete
- ✅ **Documentation**: Complete

**Ready for production deployment!** 🚀