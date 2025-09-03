#!/bin/bash
echo "Deploying web app to Vercel..."
cd adminer/apps/web
vercel --prod
