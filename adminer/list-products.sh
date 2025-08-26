#!/bin/bash

# List all recurring products in Dodo
curl -sS "https://test.dodopayments.com/products?recurring=true" \
  -H "Authorization: Bearer $DODO_API_KEY" | jq . 