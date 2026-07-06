import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  npm run pw:extension -- --extension=PATH [--url=URL] [--profile=PATH] [--headless]

Examples:
  npm run pw:install-chromium
  npm run pw:extension -- --extension=./extensions/my-extension
  npm run pw:extension -- --extension=./extensions/my-extension --url=http://127.0.0.1:3000

Environment variables:
  PLAYWRIGHT_EXTENSION_PATH   Path to an unpacked Chrome extension folder
  PLAYWRIGHT_EXTENSION_URL    Optional page to open after launch
  PLAYWRIGHT_USER_DATA_DIR    Optional persistent profile path
`)
  process.exit(0)
}

const readArg = (name) => {
  const prefix = `${name}=`
  const match = args.find(arg => arg.startsWith(prefix))
  return match ? match.slice(prefix.length) : ''
}

const extensionInput = readArg('--extension') || process.env.PLAYWRIGHT_EXTENSION_PATH || ''
const startUrl = readArg('--url') || process.env.PLAYWRIGHT_EXTENSION_URL || ''
const profileInput = readArg('--profile') || process.env.PLAYWRIGHT_USER_DATA_DIR || '.tmp/playwright-extension-profile'
const headless = args.includes('--headless')

if (!extensionInput) {
  console.error('Missing extension path. Pass --extension=PATH or set PLAYWRIGHT_EXTENSION_PATH.')
  process.exit(1)
}

const extensionPath = path.resolve(process.cwd(), extensionInput)
const manifestPath = path.join(extensionPath, 'manifest.json')
const userDataDir = path.resolve(process.cwd(), profileInput)

if (!existsSync(extensionPath)) {
  console.error(`Extension folder not found: ${extensionPath}`)
  process.exit(1)
}

if (!existsSync(manifestPath)) {
  console.error(`manifest.json not found in extension folder: ${manifestPath}`)
  process.exit(1)
}

const context = await chromium.launchPersistentContext(userDataDir, {
  channel: 'chromium',
  headless,
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
  ],
})

const shutdown = async () => {
  await context.close().catch(() => {})
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

let extensionId = ''

try {
  let [serviceWorker] = context.serviceWorkers()
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 10000 }).catch(() => null)
  }

  if (serviceWorker) {
    extensionId = serviceWorker.url().split('/')[2] || ''
  }
}
catch {
  // Some extensions do not expose a service worker immediately.
}

if (startUrl) {
  const page = context.pages()[0] ?? await context.newPage()
  await page.goto(startUrl, { waitUntil: 'domcontentloaded' })
}

console.log(`Playwright Chromium launched with extension: ${extensionPath}`)
console.log(`Persistent profile: ${userDataDir}`)

if (extensionId) {
  console.log(`Extension ID: ${extensionId}`)
  console.log(`Extensions page: chrome://extensions/?id=${extensionId}`)
}
else {
  console.log('Extension loaded, but no service worker ID was detected yet.')
}

console.log('Press Ctrl+C to close the browser session.')
await new Promise(() => {})
