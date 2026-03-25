#!/usr/bin/env node
/**
 * Purge all objects from a Cloudflare R2 bucket using the CF REST API.
 *
 * Usage:
 *   node scripts/purge-r2.mjs <bucket-name>
 *
 * Requires env vars:
 *   CF_ACCOUNT_ID, CF_API_TOKEN
 */

const bucketName = process.argv[2]
if (!bucketName) {
  console.error('Usage: node scripts/purge-r2.mjs <bucket-name>')
  process.exit(1)
}

const { CF_ACCOUNT_ID, CF_API_TOKEN } = process.env
if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error('Missing env vars: CF_ACCOUNT_ID, CF_API_TOKEN')
  process.exit(1)
}

const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${bucketName}/objects`
const headers = { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' }

let deleted = 0
let cursor

do {
  const params = new URLSearchParams({ per_page: '500' })
  if (cursor) params.set('cursor', cursor)

  const listRes = await fetch(`${baseUrl}?${params}`, { headers })
    .then((r) => r.json())
    .catch((err) => {
      console.error('List request failed:', err.message)
      process.exit(1)
    })

  if (!listRes.success) {
    console.error('List failed:', listRes.errors)
    process.exit(1)
  }

  const keys = listRes.result.map((o) => o.key)
  if (keys.length === 0) break

  const delRes = await fetch(`${baseUrl}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify(keys),
  })
    .then((r) => r.json())
    .catch((err) => {
      console.error('Delete request failed:', err.message)
      process.exit(1)
    })

  if (!delRes.success) {
    console.error('Delete failed:', delRes.errors)
    process.exit(1)
  }

  deleted += keys.length
  console.log(`Deleted ${deleted} objects...`)

  cursor = listRes.result_info?.cursor
} while (cursor)

console.log(`Done. Purged ${deleted} objects from "${bucketName}".`)
