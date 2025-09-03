#!/bin/bash
echo "Deploying both web and API..."

echo "1. Deploying API first..."
cd adminer/apps/api
vercel --prod

echo "2. Deploying web app..."
cd ../web  
vercel --prod

echo "Deployment complete!"
echo "Web app: https://adminer-web.vercel.app"
echo "API: https://adminer-api.vercel.app"
