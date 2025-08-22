#!/bin/bash

# Create Free Plan product in Dodo (based on actual API structure)
curl -sS -X POST "https://test.dodopayments.com/products" \
  -H "Authorization: Bearer $DODO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Free Plan",
    "description": "Free tier with limited quota",
    "is_recurring": true,
    "tax_category": "saas",
    "price": 0,
    "currency": "USD",
    "tax_inclusive": false,
    "price_detail": {
      "type": "recurring_price",
      "price": 0,
      "currency": "USD",
      "tax_inclusive": false,
      "discount": 0.0,
      "purchasing_power_parity": false,
      "payment_frequency_count": 1,
      "payment_frequency_interval": "Month",
      "subscription_period_count": 1,
      "subscription_period_interval": "Month",
      "trial_period_days": 0
    },
    "metadata": {
      "plan_type": "free",
      "quota_limit": "10"
    }
  }'