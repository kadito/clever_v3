#!/usr/bin/env tsx
/**
 * Script 3: Migrate Legacy CPA_1500 Contract
 * 
 * Migrates the legacy cpa_1500_professional contract to the current cpa_premium plan.
 * This is a one-time migration for the single contract using the old plan structure.
 * 
 * Contract: aeec89ce-d6f9-42c6-9102-1afe1f924cd2
 * From: cpa_1500_professional (2 manutenções, 2 deslocações)
 * To:   cpa_premium (2 manutenções, 3 deslocações)
 * 
 * Usage: 
 *   pnpm tsx scripts/migrate-legacy-contract.ts --env production [--dry-run]
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const CONTRACT_UUID = 'aeec89ce-d6f9-42c6-9102-1afe1f924cd2';
const OLD_PLAN = 'cpa_1500_professional';
const NEW_PLAN = 'cpa_premium';

interface Contract {
  uuid: string;
  data: any;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

function getR2Object(bucket: string, key: string, env: string): string {
  try {
    const envFlag = env === 'production' ? '--env production' : '';
    const cmd = `pnpm wrangler r2 object get ${bucket}/${key} ${envFlag} --pipe 2>/dev/null`;
    return execSync(cmd, { encoding: 'utf-8' });
  } catch (error) {
    throw new Error(`Failed to read ${key} from R2: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function putR2Object(bucket: string, key: string, data: string, env: string): void {
  try {
    const envFlag = env === 'production' ? '--env production' : '';
    const tmpFile = `/tmp/contract-migration-${Date.now()}.json`;
    writeFileSync(tmpFile, data);
    const cmd = `pnpm wrangler r2 object put ${bucket}/${key} --file=${tmpFile} ${envFlag} 2>/dev/null`;
    execSync(cmd, { encoding: 'utf-8' });
  } catch (error) {
    throw new Error(`Failed to write ${key} to R2: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function migrateContract(env: string, dryRun: boolean) {
  console.log('🔄 Legacy Contract Migration\n');
  console.log(`Contract: ${CONTRACT_UUID}`);
  console.log(`Migration: ${OLD_PLAN} → ${NEW_PLAN}\n`);
  
  if (dryRun) {
    console.log('🚦 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('⚠️  LIVE MODE - Changes will be applied\n');
  }

  const bucket = env === 'production' ? 'clever-content-prod' : 'clever-content-test';

  try {
    // Read contract
    console.log('📖 Reading contract from R2...');
    const contractData = getR2Object(bucket, `content/contracts/${CONTRACT_UUID}.json`, env);
    const contract: Contract = JSON.parse(contractData);

    // Verify it's the right contract
    if (contract.data.planIdCPA !== OLD_PLAN) {
      console.log(`\n❌ Contract does not have ${OLD_PLAN} plan`);
      console.log(`   Current plan: ${contract.data.planIdCPA}`);
      console.log(`   No migration needed.\n`);
      return;
    }

    console.log('✅ Contract loaded\n');

    // Show current state
    console.log('📋 Current State:');
    console.log(`   Plan ID: ${contract.data.planIdCPA}`);
    console.log(`   Horas: ${contract.data.horasAssistenciaAnualCPA || 0}`);
    console.log(`   Deslocações: ${contract.data.deslocacoesPorAnoCPA || 0}`);
    console.log(`   Manutenções: ${contract.data.manutencoesPorAnoCPA || 0}`);
    console.log('');

    // Apply migration
    console.log('🔄 Applying Migration:');
    console.log(`   ✓ planIdCPA: ${OLD_PLAN} → ${NEW_PLAN}`);
    contract.data.planIdCPA = NEW_PLAN;

    // Update benefits to cpa_premium values
    const needsHorasUpdate = contract.data.horasAssistenciaAnualCPA !== 0;
    const needsDeslocacoesUpdate = contract.data.deslocacoesPorAnoCPA !== 3;
    const needsManutencoesUpdate = contract.data.manutencoesPorAnoCPA !== 2;

    if (needsHorasUpdate) {
      console.log(`   ✓ horasAssistenciaAnualCPA: ${contract.data.horasAssistenciaAnualCPA} → 0`);
      contract.data.horasAssistenciaAnualCPA = 0;
    } else {
      console.log(`   - horasAssistenciaAnualCPA: 0 (no change)`);
    }

    if (needsDeslocacoesUpdate) {
      console.log(`   ✓ deslocacoesPorAnoCPA: ${contract.data.deslocacoesPorAnoCPA} → 3`);
      contract.data.deslocacoesPorAnoCPA = 3;
    } else {
      console.log(`   - deslocacoesPorAnoCPA: 3 (no change)`);
    }

    if (needsManutencoesUpdate) {
      console.log(`   ✓ manutencoesPorAnoCPA: ${contract.data.manutencoesPorAnoCPA} → 2`);
      contract.data.manutencoesPorAnoCPA = 2;
    } else {
      console.log(`   - manutencoesPorAnoCPA: 2 (no change)`);
    }

    console.log('');

    // Update metadata
    contract.version = contract.version + 1;
    contract.updatedAt = new Date().toISOString();
    contract.updatedBy = 'system-migration';

    console.log('📝 Metadata Updates:');
    console.log(`   - version: ${contract.version - 1} → ${contract.version}`);
    console.log(`   - updatedAt: ${contract.updatedAt}`);
    console.log(`   - updatedBy: system-migration`);
    console.log('');

    // Show new state
    console.log('📊 New State:');
    console.log(`   Plan ID: ${contract.data.planIdCPA}`);
    console.log(`   Horas: ${contract.data.horasAssistenciaAnualCPA}`);
    console.log(`   Deslocações: ${contract.data.deslocacoesPorAnoCPA}`);
    console.log(`   Manutenções: ${contract.data.manutencoesPorAnoCPA}`);
    console.log('');

    // Write back
    if (!dryRun) {
      console.log('💾 Writing contract to R2...');
      putR2Object(bucket, `content/contracts/${CONTRACT_UUID}.json`, JSON.stringify(contract, null, 2), env);
      console.log('✅ Contract migrated successfully\n');
    } else {
      console.log('🚦 DRY RUN: Changes not written\n');
    }

    console.log('━'.repeat(80));
    console.log('\n✅ Migration Complete\n');
    
    if (!dryRun) {
      console.log('⚠️  Important Next Steps:');
      console.log('   1. Verify the contract in the application');
      console.log('   2. Recalculate balance index for this client');
      console.log('   3. Test creating remote assistance/work sheets\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const envIndex = args.indexOf('--env');
const env = envIndex >= 0 && args[envIndex + 1] ? args[envIndex + 1] : 'test';
const dryRun = args.includes('--dry-run');

if (!['test', 'production'].includes(env)) {
  console.error('❌ Invalid environment. Use: test or production');
  process.exit(1);
}

// Run migration
migrateContract(env, dryRun)
  .then(() => {
    console.log('✅ Script complete\n');
    if (dryRun) {
      console.log('💡 Run without --dry-run to apply changes');
    }
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
