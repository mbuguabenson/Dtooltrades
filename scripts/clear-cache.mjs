import { rmSync } from 'fs'
import { resolve } from 'path'

const nextDir = resolve('.next')
console.log(`[v0] Removing .next cache directory: ${nextDir}`)

try {
  rmSync(nextDir, { recursive: true, force: true })
  console.log('[v0] Cache cleared successfully')
} catch (error) {
  console.error('[v0] Error clearing cache:', error.message)
  process.exit(1)
}
