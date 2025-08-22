#!/bin/bash

# Create Free Plan price in Dodo (using production API)
curl -X POST "https://api.dodopayments.com/prices" \
  -H "Authorization: Bearer i8LbSlN7Bd4XnawY.JpJKArwZ_OOWa_B1XTgrlYR8sDTEIl1yl7N-hFsBlmogolR" \
  -H "Content-Type: application/json" \
  -d '{
    "unit_amount": 0,
    "currency": "usd",
    "recurring": {
      "interval": "month"
    },
    "product_data": {
      "name": "Free Plan",
      "description": "Free tier with limited quota",
      "metadata": {
        "plan_type": "free",
        "quota_limit": "10"
      }
    }
  }' 