#!/usr/bin/env tsx
/**
 * Script 2: Fix Contract Benefits
 * 
 * Automatically corrects contract benefit values based on planId.
 * Reads contracts from production, identifies incorrect values, and updates them.
 * 
 * Usage: 
 *   pnpm tsx scripts/fix-contract-benefits.ts --env production [--dry-run]
 *   pnpm tsx scripts/fix-contract-benefits.ts --env test [--dry-run]
 * 
 * Options:
 *   --env        Environment: test or production
 *   --dry-run    Show what would be changed without making changes
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import contractPlans from '../packages/frontend/src/config/contract-plans.json';

// Plan benefits mapping (same as audit script)
const PLAN_BENEFITS: Record<string, {
  type: 'CPA' | 'S&H';
  horasAssistenciaAnual: number;
  deslocacoesPorAno: number;
  manutencoesPorAno: number;
}> = {
  // CPA Plans
  cpa_essential: {
    type: 'CPA',
    horasAssistenciaAnual: 0,
    deslocacoesPorAno: 1,
    manutencoesPorAno: 1,
  },
  cpa_professional: {
    type: 'CPA',
    horasAssistenciaAnual: 0,
    deslocacoesPorAno: 2,
    manutencoesPorAno: 1,
  },
  cpa_premium: {
    type: 'CPA',
    horasAssistenciaAnual: 0,
    deslocacoesPorAno: 3,
    manutencoesPorAno: 2,
  },
  // S&H Plans
  sh_simple: {
    type: 'S&H',
    horasAssistenciaAnual: 10,
    deslocacoesPorAno: 2,
    manutencoesPorAno: 0,
  },
  sh_brass: {
    type: 'S&H',
    horasAssistenciaAnual: 10,
    deslocacoesPorAno: 2,
    manutencoesPorAno: 0,
  },
  sh_silver: {
    type: 'S&H',
    horasAssistenciaAnual: 10,
    deslocacoesPorAno: 2,
    manutencoesPorAno: 0,
  },
  sh_gold: {
    type: 'S&H',
    horasAssistenciaAnual: 15,
    deslocacoesPorAno: 3,
    manutencoesPorAno: 0,
  },
  sh_diamond: {
    type: 'S&H',
    horasAssistenciaAnual: 15,
    deslocacoesPorAno: 3,
    manutencoesPorAno: 0,
  },
  sh_platinum: {
    type: 'S&H',
    horasAssistenciaAnual: 15,
    deslocacoesPorAno: 3,
    manutencoesPorAno: 0,
  },
};

interface Contract {
  uuid: string;
  data: any;
  isDeleted: boolean;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

interface ContractIssue {
  uuid: string;
  clientId: string;
  type: 'CPA' | 'S&H';
  planId: string;
  planName: string;
  current: {
    horasAssistenciaAnual: number;
    deslocacoesPorAno: number;
    manutencoesPorAno: number;
  };
  expected: {
    horasAssistenciaAnual: number;
    deslocacoesPorAno: number;
    manutencoesPorAno: number;
  };
  issues: string[];
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
    const tmpFile = `/tmp/contract-${Date.now()}.json`;
    writeFileSync(tmpFile, data);
    const cmd = `pnpm wrangler r2 object put ${bucket}/${key} --file=${tmpFile} ${envFlag} 2>/dev/null`;
    execSync(cmd, { encoding: 'utf-8' });
  } catch (error) {
    throw new Error(`Failed to write ${key} to R2: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function fixContracts(env: string, dryRun: boolean = false) {
  console.log(`🔧 Contract Benefits Fix - ${env.toUpperCase()} Environment\n`);
  
  if (dryRun) {
    console.log('🚦 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('⚠️  LIVE MODE - Changes will be applied\n');
  }

  const bucket = env === 'production' ? 'clever-content-prod' : 'clever-content-test';
  const issuesFile = `contract-issues-${env}.json`;

  // Check if audit has been run
  if (!existsSync(issuesFile)) {
    console.error(`❌ Issues file not found: ${issuesFile}`);
    console.error(`Run audit first: pnpm tsx scripts/audit-contract-benefits.ts --env ${env}`);
    process.exit(1);
  }

  // Load issues from audit
  const issues: ContractIssue[] = JSON.parse(readFileSync(issuesFile, 'utf-8'));
  
  if (issues.length === 0) {
    console.log('✅ No contracts need fixing\n');
    return;
  }

  console.log(`📋 Found ${issues.length} contracts to fix\n`);

  let fixedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    
    console.log('━'.repeat(80));
    console.log(`Contract ${i + 1}/${issues.length}: ${issue.uuid}`);
    console.log(`Client:   ${issue.clientId}`);
    console.log(`Type:     ${issue.type}`);
    console.log(`Plan:     ${issue.planId} (${issue.planName})`);
    console.log('');
    
    try {
      // Read contract from R2
      const contractData = getR2Object(bucket, `content/contracts/${issue.uuid}.json`, env);
      const contract: Contract = JSON.parse(contractData);

      if (contract.isDeleted) {
        console.log('⏭️  Skipping deleted contract\n');
        continue;
      }

      // Apply fixes based on type
      let hasChanges = false;
      
      if (issue.type === 'CPA') {
        const suffix = 'CPA';
        const expected = issue.expected;
        
        console.log('Changes:');
        if (contract.data[`horasAssistenciaAnual${suffix}`] !== expected.horasAssistenciaAnual) {
          console.log(`  🔄 horasAssistenciaAnual${suffix}: ${contract.data[`horasAssistenciaAnual${suffix}`]} → ${expected.horasAssistenciaAnual}`);
          contract.data[`horasAssistenciaAnual${suffix}`] = expected.horasAssistenciaAnual;
          hasChanges = true;
        }
        if (contract.data[`deslocacoesPorAno${suffix}`] !== expected.deslocacoesPorAno) {
          console.log(`  🔄 deslocacoesPorAno${suffix}: ${contract.data[`deslocacoesPorAno${suffix}`]} → ${expected.deslocacoesPorAno}`);
          contract.data[`deslocacoesPorAno${suffix}`] = expected.deslocacoesPorAno;
          hasChanges = true;
        }
        if (contract.data[`manutencoesPorAno${suffix}`] !== expected.manutencoesPorAno) {
          console.log(`  🔄 manutencoesPorAno${suffix}: ${contract.data[`manutencoesPorAno${suffix}`]} → ${expected.manutencoesPorAno}`);
          contract.data[`manutencoesPorAno${suffix}`] = expected.manutencoesPorAno;
          hasChanges = true;
        }
      } else if (issue.type === 'S&H') {
        const suffix = 'SH';
        const expected = issue.expected;
        
        console.log('Changes:');
        if (contract.data[`horasAssistenciaAnual${suffix}`] !== expected.horasAssistenciaAnual) {
          console.log(`  🔄 horasAssistenciaAnual${suffix}: ${contract.data[`horasAssistenciaAnual${suffix}`]} → ${expected.horasAssistenciaAnual}`);
          contract.data[`horasAssistenciaAnual${suffix}`] = expected.horasAssistenciaAnual;
          hasChanges = true;
        }
        if (contract.data[`deslocacoesPorAno${suffix}`] !== expected.deslocacoesPorAno) {
          console.log(`  🔄 deslocacoesPorAno${suffix}: ${contract.data[`deslocacoesPorAno${suffix}`]} → ${expected.deslocacoesPorAno}`);
          contract.data[`deslocacoesPorAno${suffix}`] = expected.deslocacoesPorAno;
          hasChanges = true;
        }
        if (contract.data[`manutencoesPorAno${suffix}`] !== expected.manutencoesPorAno) {
          console.log(`  🔄 manutencoesPorAno${suffix}: ${contract.data[`manutencoesPorAno${suffix}`]} → ${expected.manutencoesPorAno}`);
          contract.data[`manutencoesPorAno${suffix}`] = expected.manutencoesPorAno;
          hasChanges = true;
        }
      }

      if (!hasChanges) {
        console.log('  ✓ No changes needed\n');
        continue;
      }

      // Update metadata
      contract.version = contract.version + 1;
      contract.updatedAt = new Date().toISOString();
      contract.updatedBy = 'system-fix';

      console.log('');
      console.log('Metadata updates:');
      console.log(`  - version: ${contract.version - 1} → ${contract.version}`);
      console.log(`  - updatedAt: ${contract.updatedAt}`);
      console.log(`  - updatedBy: system-fix`);
      console.log('');

      // Write back to R2
      if (!dryRun) {
        putR2Object(bucket, `content/contracts/${issue.uuid}.json`, JSON.stringify(contract, null, 2), env);
        console.log('✅ Contract updated in R2\n');
        fixedCount++;
      } else {
        console.log('🚦 DRY RUN: Changes not written\n');
      }

    } catch (error) {
      console.error(`❌ Error fixing contract: ${error instanceof Error ? error.message : String(error)}\n`);
      errorCount++;
    }
  }

  // Summary
  console.log('━'.repeat(80));
  console.log('\n📊 FIX SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total contracts processed: ${issues.length}`);
  if (dryRun) {
    console.log(`Would fix: ${issues.length}`);
  } else {
    console.log(`Fixed successfully: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);
  }
  console.log('');

  if (!dryRun && fixedCount > 0) {
    console.log('⚠️  Important Next Steps:');
    console.log('  1. Verify changes in production');
    console.log('  2. Recalculate balance indexes for affected clients');
    console.log('  3. Test creating remote assistance/work sheets\n');
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

// Run fix
fixContracts(env, dryRun)
  .then(() => {
    console.log('✅ Fix script complete\n');
    if (dryRun) {
      console.log('💡 Run without --dry-run to apply changes');
    }
  })
  .catch(error => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
