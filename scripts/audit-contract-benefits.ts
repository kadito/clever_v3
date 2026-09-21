#!/usr/bin/env tsx
/**
 * Script 1: Audit Contract Benefits
 * 
 * Lists all contracts in production and identifies incorrect benefit values (zeros).
 * Shows what the correct values should be based on the plan configuration.
 * 
 * Usage: 
 *   pnpm tsx scripts/audit-contract-benefits.ts
 *   pnpm tsx scripts/audit-contract-benefits.ts --env production
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import contractPlans from '../packages/frontend/src/config/contract-plans.json';

// Plan benefits mapping
const PLAN_BENEFITS: Record<string, {
  type: 'CPA' | 'S&H';
  horasAssistenciaAnual: number;
  deslocacoesPorAno: number;
  manutencoesPorAno: number;
}> = {
  // CPA Plans (current)
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
  // CPA Plans (legacy CPA_1500 - Cashlogy 1500 equipment)
  cpa_1500_essential: {
    type: 'CPA',
    horasAssistenciaAnual: 0,
    deslocacoesPorAno: 1,
    manutencoesPorAno: 1,
  },
  cpa_1500_professional: {
    type: 'CPA',
    horasAssistenciaAnual: 0,
    deslocacoesPorAno: 2,
    manutencoesPorAno: 2,
  },
  cpa_1500_premium: {
    type: 'CPA',
    horasAssistenciaAnual: 0,
    deslocacoesPorAno: 3,
    manutencoesPorAno: 3,
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
  data: {
    clientId: string;
    hasCPAContract: boolean;
    hasSHContract: boolean;
    planIdCPA?: string;
    planIdSH?: string;
    horasAssistenciaAnualCPA?: number;
    deslocacoesPorAnoCPA?: number;
    manutencoesPorAnoCPA?: number;
    horasAssistenciaAnualSH?: number;
    deslocacoesPorAnoSH?: number;
    manutencoesPorAnoSH?: number;
  };
  isDeleted: boolean;
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

async function auditContracts(env: string) {
  console.log(`🔍 Contract Benefits Audit - ${env.toUpperCase()} Environment\n`);

  const bucket = env === 'production' ? 'clever-content-prod' : 'clever-content-test';
  
  console.log(`📦 Reading from R2 bucket: ${bucket}\n`);

  // Read contracts index
  console.log('📋 Reading contracts index...');
  let contractsIndexData: string;
  try {
    contractsIndexData = getR2Object(bucket, 'indexes/contracts-index.json', env);
  } catch (error) {
    console.error('❌ Failed to read contracts index:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const contractsIndex = JSON.parse(contractsIndexData);
  const contractUUIDs: string[] = contractsIndex.items?.map((item: any) => item.uuid) || [];
  
  console.log(`✅ Found ${contractUUIDs.length} contracts\n`);

  const issues: ContractIssue[] = [];
  let processedCount = 0;
  let correctCount = 0;

  console.log('🔎 Analyzing contracts...\n');

  for (const uuid of contractUUIDs) {
    try {
      const contractData = getR2Object(bucket, `content/contracts/${uuid}.json`, env);
      const contract: Contract = JSON.parse(contractData);

      if (contract.isDeleted) {
        continue;
      }

      processedCount++;

      // Check CPA contract
      if (contract.data.hasCPAContract && contract.data.planIdCPA) {
        const planId = contract.data.planIdCPA;
        const expected = PLAN_BENEFITS[planId];
        
        if (!expected) {
          console.log(`⚠️  Unknown plan: ${planId} for contract ${uuid}`);
          continue;
        }

        const current = {
          horasAssistenciaAnual: contract.data.horasAssistenciaAnualCPA || 0,
          deslocacoesPorAno: contract.data.deslocacoesPorAnoCPA || 0,
          manutencoesPorAno: contract.data.manutencoesPorAnoCPA || 0,
        };

        const contractIssues: string[] = [];
        if (current.horasAssistenciaAnual !== expected.horasAssistenciaAnual) {
          contractIssues.push(`Horas: ${current.horasAssistenciaAnual} → ${expected.horasAssistenciaAnual}`);
        }
        if (current.deslocacoesPorAno !== expected.deslocacoesPorAno) {
          contractIssues.push(`Deslocações: ${current.deslocacoesPorAno} → ${expected.deslocacoesPorAno}`);
        }
        if (current.manutencoesPorAno !== expected.manutencoesPorAno) {
          contractIssues.push(`Manutenções: ${current.manutencoesPorAno} → ${expected.manutencoesPorAno}`);
        }

        if (contractIssues.length > 0) {
          const plan = contractPlans.CPA.plans.find(p => p.id === planId);
          issues.push({
            uuid,
            clientId: contract.data.clientId,
            type: 'CPA',
            planId,
            planName: plan?.name || planId,
            current,
            expected,
            issues: contractIssues,
          });
        } else {
          correctCount++;
        }
      }

      // Check S&H contract
      if (contract.data.hasSHContract && contract.data.planIdSH) {
        const planId = contract.data.planIdSH;
        const expected = PLAN_BENEFITS[planId];
        
        if (!expected) {
          console.log(`⚠️  Unknown plan: ${planId} for contract ${uuid}`);
          continue;
        }

        const current = {
          horasAssistenciaAnual: contract.data.horasAssistenciaAnualSH || 0,
          deslocacoesPorAno: contract.data.deslocacoesPorAnoSH || 0,
          manutencoesPorAno: contract.data.manutencoesPorAnoSH || 0,
        };

        const contractIssues: string[] = [];
        if (current.horasAssistenciaAnual !== expected.horasAssistenciaAnual) {
          contractIssues.push(`Horas: ${current.horasAssistenciaAnual} → ${expected.horasAssistenciaAnual}`);
        }
        if (current.deslocacoesPorAno !== expected.deslocacoesPorAno) {
          contractIssues.push(`Deslocações: ${current.deslocacoesPorAno} → ${expected.deslocacoesPorAno}`);
        }
        if (current.manutencoesPorAno !== expected.manutencoesPorAno) {
          contractIssues.push(`Manutenções: ${current.manutencoesPorAno} → ${expected.manutencoesPorAno}`);
        }

        if (contractIssues.length > 0) {
          const plan = contractPlans['S&H'].plans.find(p => p.id === planId);
          issues.push({
            uuid,
            clientId: contract.data.clientId,
            type: 'S&H',
            planId,
            planName: plan?.name || planId,
            current,
            expected,
            issues: contractIssues,
          });
        } else {
          correctCount++;
        }
      }

    } catch (error) {
      console.error(`❌ Error processing contract ${uuid}:`, error instanceof Error ? error.message : String(error));
    }
  }

  // Print summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 AUDIT SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total contracts processed: ${processedCount}`);
  console.log(`Contracts with correct benefits: ${correctCount}`);
  console.log(`Contracts needing fixes: ${issues.length}\n`);

  if (issues.length === 0) {
    console.log('✅ All contracts have correct benefit values!\n');
    return;
  }

  // Print issues
  console.log('❌ Contracts with incorrect benefits:\n');
  
  issues.forEach((issue, index) => {
    console.log('━'.repeat(80));
    console.log(`Contract ${index + 1}/${issues.length}: ${issue.uuid}`);
    console.log(`Client:   ${issue.clientId}`);
    console.log(`Type:     ${issue.type}`);
    console.log(`Plan:     ${issue.planId} (${issue.planName})`);
    console.log('');
    console.log('Issues:');
    issue.issues.forEach(iss => console.log(`  🔄 ${iss}`));
    console.log('');
  });

  console.log('━'.repeat(80));
  console.log('\n💡 Next Steps:');
  console.log(`  Run: pnpm fix-contracts --env ${env}`);
  console.log(`  Or with dry-run: pnpm fix-contracts --env ${env} --dry-run\n`);

  // Write issues to file for fix script
  const issuesFile = `contract-issues-${env}.json`;
  writeFileSync(issuesFile, JSON.stringify(issues, null, 2));
  console.log(`📝 Issues written to: ${issuesFile}\n`);
}

// Parse arguments
const args = process.argv.slice(2);
const envIndex = args.indexOf('--env');
const env = envIndex >= 0 && args[envIndex + 1] ? args[envIndex + 1] : 'test';

if (!['test', 'production'].includes(env)) {
  console.error('❌ Invalid environment. Use: test or production');
  process.exit(1);
}

// Run audit
auditContracts(env)
  .then(() => {
    console.log('✅ Audit complete\n');
  })
  .catch(error => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
