#!/bin/sh

echo "Running database migrations..."
pnpm db:migrate

if [ $? -ne 0 ]; then
  echo "\nDatabase migration failed! Exiting."
  exit 1
fi

echo "\nStarting Next.js application..."

if [ "$NEXT_PUBLIC_USE_STANDALONE_OUTPUT" = "true" ]; then
  echo "Starting in standalone mode..."
  exec node .next/standalone/server.js
else
  echo "Starting in standard mode..."
  exec pnpm start
fi
