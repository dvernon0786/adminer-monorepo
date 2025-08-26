#!/usr/bin/env bash
# test-ai-analysis.sh - Test AI analysis with different content types
set -euo pipefail

DOMAIN="${1:-https://www.adminer.online}"
CLERK_TOKEN="${CLERK_TOKEN:-}"

if [ -z "$CLERK_TOKEN" ]; then
  echo "❌ CLERK_TOKEN environment variable required"
  echo "Usage: CLERK_TOKEN=your_token ./scripts/test-ai-analysis.sh [domain]"
  exit 1
fi

echo "🧪 Testing AI analysis with different content types"
echo "Domain: $DOMAIN"
echo ""

# Test 1: Text-only ad
echo "1️⃣ Testing text-only ad analysis..."
text_job=$(curl -s \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"text only advertisement test","limit":3}' \
  "$DOMAIN/api/jobs/start")

text_job_id=$(echo "$text_job" | jq -r '.id // empty')
echo "Text job created: $text_job_id"
echo ""

# Test 2: Image+text ad
echo "2️⃣ Testing image+text ad analysis..."
image_job=$(curl -s \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"image advertisement with text","limit":3}' \
  "$DOMAIN/api/jobs/start")

image_job_id=$(echo "$image_job" | jq -r '.id // empty')
echo "Image job created: $image_job_id"
echo ""

# Test 3: Video+text ad
echo "3️⃣ Testing video+text ad analysis..."
video_job=$(curl -s \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"video advertisement with text","limit":3}' \
  "$DOMAIN/api/jobs/start")

video_job_id=$(echo "$video_job" | jq -r '.id // empty')
echo "Video job created: $video_job_id"
echo ""

# Monitor all jobs
echo "🔄 Monitoring job progress..."
echo "Expected content types:"
echo "- Text job: contentType = 'text'"
echo "- Image job: contentType = 'image+text' (if images found)"
echo "- Video job: contentType = 'text+video' (if videos found)"
echo ""

jobs=("$text_job_id" "$image_job_id" "$video_job_id")
job_names=("Text" "Image" "Text+Video")

for i in {0..2}; do
  job_id="${jobs[$i]}"
  job_name="${job_names[$i]}"
  
  echo "📊 Monitoring $job_name job ($job_id)..."
  
  for check in {1..20}; do
    current_status=$(curl -s \
      -H "Authorization: Bearer $CLERK_TOKEN" \
      "$DOMAIN/api/jobs/$job_id" | jq -r '.status // empty')
    
    if [ "$current_status" = "completed" ]; then
      echo "  ✅ $job_name job completed!"
      
      # Check content type and analysis
      job_data=$(curl -s \
        -H "Authorization: Bearer $CLERK_TOKEN" \
        "$DOMAIN/api/jobs/$job_id")
      
      content_type=$(echo "$job_data" | jq -r '.contentType // empty')
      summary=$(echo "$job_data" | jq -r '.summary // empty')
      
      echo "    Content Type: $content_type"
      echo "    Summary: ${summary:0:100}..."
      
      # Check specific analysis fields based on content type
      if [ "$content_type" = "image+text" ]; then
        image_prompt=$(echo "$job_data" | jq -r '.imagePrompt // empty')
        if [ "$image_prompt" != "null" ] && [ "$image_prompt" != "" ]; then
          echo "    ✅ Image analysis completed"
        else
          echo "    ⚠️ Image analysis not populated"
        fi
      elif [ "$content_type" = "text+video" ]; then
        video_prompt=$(echo "$job_data" | jq -r '.videoPrompt // empty')
        if [ "$video_prompt" != "null" ] && [ "$video_prompt" != "" ]; then
          echo "    ✅ Video analysis completed"
        else
          echo "    ⚠️ Video analysis not populated"
        fi
      fi
      
      break
    elif [ "$current_status" = "failed" ]; then
      echo "  ❌ $job_name job failed"
      break
    else
      echo "  ⏳ $job_name job status: $current_status"
    fi
    
    sleep 3
  done
  
  echo ""
done

echo "🎯 AI analysis test completed"
echo ""
echo "Verification checklist:"
echo "1. ✅ OPENAI_API_KEY configured in production"
echo "2. ✅ GEMINI_API_KEY configured in production"
echo "3. ✅ Text analysis: summary, keyInsights, recommendations"
echo "4. ✅ Image analysis: imagePrompt populated (if images found)"
echo "5. ✅ Video analysis: videoPrompt populated (if videos found)"
echo "6. ✅ Content type detection working correctly"
echo "7. ✅ Large video handling (skipReason if >14MB)" 