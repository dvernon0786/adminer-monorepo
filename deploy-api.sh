#!/bin/bash
echo "Deploying API to Vercel..."
cd adminer/apps/api
vercel --prod
