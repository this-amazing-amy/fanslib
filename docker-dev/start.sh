#!/bin/bash
set -e

cd /app

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo "Installing dependencies..."
  bun install
fi

# Start dev server
exec bun run dev
