#!/bin/bash

# Create Free Plan product in Dodo (clean JSON)
curl -sS -X POST "https://test.dodopayments.com/products" \
  -H "Authorization: Bearer $DODO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Free Plan",
    "description": "Free tier with limited quota",
    "metadata": {
      "plan_type": "free",
      "quota_limit": "10"
    },
    "is_recurring": true,
    "billing_cycle": "monthly",
    "price": {
      "type": "recurring_price",
      "price": 0,
      "currency": "USD",
      "tax_inclusive": true
    },
    "digital_product_delivery": null,
    "tax_category": "digital_products"
  }'