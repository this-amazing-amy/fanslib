#!/bin/bash
cd /app

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo "Installing dependencies..."
  bun install
fi

echo "Container ready. Run 'bun run dev:docker' manually."
tail -f /dev/null
