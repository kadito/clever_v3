#!/usr/bin/env bash
set -e

# =============================================================
# Purge R2 test bucket and run all migration scripts
# Usage: bash scripts/purge-and-migrate-test.sh
# =============================================================

# Cloudflare credentials
export CF_API_TOKEN="QPNf_3mZ2qfF4aACQyQTRyxLFO1jDHu1zedSDM6I"
export CF_ACCOUNT_ID="98dfed939a59dca09770880eab939b79"
export CF_KV_NAMESPACE_ID="5e716e1caf904a67a709b033f981cac1"
export CF_R2_BUCKET_NAME="clever-content-test"

# Contracts migration uses different env var names
export R2_BUCKET_NAME="clever-content-test"
export KV_NAMESPACE_ID="5e716e1caf904a67a709b033f981cac1"

SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPTS_DIR/.." && pwd)"

echo "==========================================="
echo " CLEVER - Purge & Migrate (TEST environment)"
echo "==========================================="
echo ""

# Step 1: Purge R2 bucket
echo ">>> [1/6] Purging R2 bucket: clever-content-test..."
node "$SCRIPTS_DIR/purge-r2.mjs" clever-content-test
echo ""

# Step 2: Migrate clients (must be first - other migrations depend on clients index)
echo ">>> [2/6] Migrating clients..."
node "$SCRIPTS_DIR/clients/migrate-clients.js"
echo ""

# Step 3: Migrate licenses
echo ">>> [3/6] Migrating licenses..."
node "$SCRIPTS_DIR/licenses/migrate-licenses.js"
echo ""

# Step 4: Migrate contracts
echo ">>> [4/6] Migrating contracts..."
npx tsx "$SCRIPTS_DIR/contracts/migrate-contracts.ts"
echo ""

# Step 5: Migrate work sheets
echo ">>> [5/6] Migrating work sheets..."
node "$SCRIPTS_DIR/work-sheets/migrate-work-sheets.js"
echo ""

# Step 6: Migrate remote assistance
echo ">>> [6/6] Migrating remote assistance..."
node "$SCRIPTS_DIR/remote-assistance/migrate-remote-assistance.js"
echo ""

echo "==========================================="
echo " ALL DONE"
echo "==========================================="
