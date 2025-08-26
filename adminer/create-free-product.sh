#!/bin/bash

# Create Free Plan product in Dodo
curl -X POST "https://test.dodopayments.com/products" \
  -H "Authorization: Bearer i8LbSlN7Bd4XnawY.JpJKArwZ_OOWa_B1XTgrlYR8sDTEIl1yl7N-hFsBlmogolR" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Free Plan",
    "description": "Free tier with limited quota",
    "price": 0,
    "currency": "usd",
    "recurring": {
      "interval": "month"
    },
    "metadata": {
      "plan_type": "free",
      "quota_limit": "10"
    }
  }' 