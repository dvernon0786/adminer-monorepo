#!/bin/bash

# Get details of a specific product
# Usage: ./get-product.sh <product_id>
if [ $# -ne 1 ]; then
    echo "Usage: $0 <product_id>"
    echo "Example: $0 prod_abc123"
    exit 1
fi

PRODUCT_ID=$1

curl -sS "https://test.dodopayments.com/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $DODO_API_KEY" | jq . 