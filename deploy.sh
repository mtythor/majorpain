#!/bin/bash
set -e
cd ~/majorpain
git fetch origin
git checkout master
git pull origin master
cd FrontEnd
npm install
rm -rf .next
npm run build
pm2 restart major-pain
echo "Deploy complete"
