#!/bin/bash

# Create Free Plan subscription for a user
# Usage: ./create-free-subscription.sh <customer_id> <product_id>
if [ $# -ne 2 ]; then
    echo "Usage: $0 <customer_id> <product_id>"
    echo "Example: $0 cus_123 prod_abc123"
    exit 1
fi

CUSTOMER_ID=$1
PRODUCT_ID=$2

curl -sS -X POST "https://test.dodopayments.com/subscriptions" \
  -H "Authorization: Bearer $DODO_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer\": { \"customer_id\": \"$CUSTOMER_ID\" },
    \"product_id\": \"$PRODUCT_ID\",
    \"quantity\": 1,
    \"billing\": { \"street\": \"-\", \"city\": \"-\", \"state\": \"-\", \"zipcode\": \"00000\", \"country\": \"US\" },
    \"payment_link\": false
  }" 