#!/usr/bin/env node

import('./launch-playwright-extension.mjs').catch((error) => {
  console.error(error)
  process.exit(1)
})
