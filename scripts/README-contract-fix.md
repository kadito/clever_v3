# Contract Benefits Fix Scripts

Scripts para auditar e corrigir valores de benefícios (horas, deslocações, manutenções) em contratos CPA e S&H.

## Problema

Contratos migrados do sistema antigo podem ter valores incorretos (zeros) para os benefícios, impedindo a criação de Assistências Remotas e Folhas de Obra com método de pagamento "Contrato".

## Solução

Dois scripts:
1. **audit-contract-benefits.ts** - Lista todos os contratos e identifica valores incorretos
2. **fix-contract-benefits.ts** - Corrige automaticamente com base no `planId`

---

## Script 1: Audit (Listar e Identificar)

### Comando

```bash
# Ambiente de teste
pnpm tsx scripts/audit-contract-benefits.ts --env test

# Ambiente de produção
pnpm tsx scripts/audit-contract-benefits.ts --env production
```

### O que faz

1. Lê o índice de contratos do R2
2. Para cada contrato:
   - Lê o `planId` (CPA ou S&H)
   - Compara valores atuais com valores esperados do plano
   - Identifica discrepâncias
3. Gera relatório detalhado
4. Guarda issues em `contract-issues-{env}.json`

### Exemplo de output

```
🔍 Contract Benefits Audit - PRODUCTION Environment

📦 Reading from R2 bucket: clever-content-prod

📋 Reading contracts index...
✅ Found 45 contracts

🔎 Analyzing contracts...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract 1/12: 3e856a92-56cb-4d54-a699-31a972db3d7d
Client:   584fbe6c-cf75-4e41-899d-f30a13caeb00
Type:     CPA
Plan:     cpa_professional (PROFESSIONAL CARE)

Issues:
  🔄 Deslocações: 0 → 2
  🔄 Manutenções: 0 → 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 AUDIT SUMMARY
═══════════════════════════════════════════════════════════════════
Total contracts processed: 45
Contracts with correct benefits: 33
Contracts needing fixes: 12

💡 Next Steps:
  Run: pnpm tsx scripts/fix-contract-benefits.ts --env production

📝 Issues written to: contract-issues-production.json
```

---

## Script 2: Fix (Corrigir Automaticamente)

### Comandos

```bash
# DRY RUN (mostra o que seria alterado sem fazer alterações)
pnpm tsx scripts/fix-contract-benefits.ts --env production --dry-run

# LIVE (aplica as correções)
pnpm tsx scripts/fix-contract-benefits.ts --env production
```

### Pré-requisitos

1. Ter executado o audit primeiro (gera `contract-issues-{env}.json`)
2. Ter wrangler configurado: `pnpm wrangler login`

### O que faz

1. Lê `contract-issues-{env}.json` gerado pelo audit
2. Para cada contrato com issues:
   - Lê o contrato completo do R2
   - Aplica os valores corretos com base no `planId`
   - Incrementa `version`
   - Atualiza `updatedAt` e `updatedBy: "system-fix"`
   - Escreve de volta no R2
3. Mostra resumo de alterações

### Exemplo de output

```
🔧 Contract Benefits Fix - PRODUCTION Environment

⚠️  LIVE MODE - Changes will be applied

📋 Found 12 contracts to fix

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract 1/12: 3e856a92-56cb-4d54-a699-31a972db3d7d
Client:   584fbe6c-cf75-4e41-899d-f30a13caeb00
Type:     CPA
Plan:     cpa_professional (PROFESSIONAL CARE)

Changes:
  🔄 deslocacoesPorAnoCPA: 0 → 2
  🔄 manutencoesPorAnoCPA: 0 → 1

Metadata updates:
  - version: 1 → 2
  - updatedAt: 2026-09-21T15:30:00.000Z
  - updatedBy: system-fix

✅ Contract updated in R2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FIX SUMMARY
═══════════════════════════════════════════════════════════════════
Total contracts processed: 12
Fixed successfully: 12
Errors: 0

⚠️  Important Next Steps:
  1. Verify changes in production
  2. Recalculate balance indexes for affected clients
  3. Test creating remote assistance/work sheets
```

---

## Valores Esperados por Plano

### CPA Plans

| Plan ID | Plan Name | Horas | Deslocações | Manutenções |
|---------|-----------|-------|-------------|-------------|
| `cpa_essential` | ESSENTIAL CARE | 0 | 1 | 1 |
| `cpa_professional` | PROFESSIONAL CARE | 0 | 2 | 1 |
| `cpa_premium` | PREMIUM CARE | 0 | 3 | 2 |

**Nota:** Planos CPA **não incluem horas** - apenas deslocações e manutenções.

### S&H Plans

| Plan ID | Plan Name | Horas | Deslocações | Manutenções |
|---------|-----------|-------|-------------|-------------|
| `sh_simple` | SIMPLE | 10 | 2 | 0 |
| `sh_brass` | BRASS | 10 | 2 | 0 |
| `sh_silver` | SILVER | 10 | 2 | 0 |
| `sh_gold` | GOLD | 15 | 3 | 0 |
| `sh_diamond` | DIAMOND | 15 | 3 | 0 |
| `sh_platinum` | PLATINUM | 15 | 3 | 0 |

**Nota:** Planos S&H **não incluem manutenções** - apenas horas e deslocações.

---

## Workflow Recomendado

### 1. Backup (Opcional mas Recomendado)

```bash
# Backup do índice de contratos
pnpm wrangler r2 object get clever-content-prod/indexes/contracts-index.json --env production > backup-contracts-index.json

# Backup de um contrato específico (exemplo)
pnpm wrangler r2 object get clever-content-prod/content/contracts/3e856a92-56cb-4d54-a699-31a972db3d7d.json --env production > backup-contract.json
```

### 2. Audit em Teste

```bash
# Testar em ambiente de teste primeiro
pnpm tsx scripts/audit-contract-benefits.ts --env test
```

### 3. Fix em Teste (Dry Run)

```bash
# Ver o que seria alterado sem aplicar
pnpm tsx scripts/fix-contract-benefits.ts --env test --dry-run
```

### 4. Fix em Teste (Live)

```bash
# Aplicar em teste
pnpm tsx scripts/fix-contract-benefits.ts --env test
```

### 5. Verificar em Teste

- Tentar criar Assistência Remota com "Contrato"
- Tentar criar Folha de Obra com "Contrato"
- Verificar balances

### 6. Audit em Produção

```bash
pnpm tsx scripts/audit-contract-benefits.ts --env production
```

### 7. Fix em Produção (Dry Run)

```bash
# Verificar mudanças antes de aplicar
pnpm tsx scripts/fix-contract-benefits.ts --env production --dry-run
```

### 8. Fix em Produção (Live)

```bash
# ATENÇÃO: Isto altera dados em produção
pnpm tsx scripts/fix-contract-benefits.ts --env production
```

### 9. Verificar em Produção

- Verificar contratos atualizados
- Testar criação de AR/FO
- Recalcular balances se necessário

---

## Troubleshooting

### Erro: "wrangler not found"

```bash
# Instalar wrangler
pnpm install

# Verificar instalação
pnpm wrangler --version
```

### Erro: "Failed to read from R2"

```bash
# Login no Cloudflare
pnpm wrangler login

# Verificar permissões
pnpm wrangler r2 bucket list --env production
```

### Erro: "Issues file not found"

Execute o audit primeiro:
```bash
pnpm tsx scripts/audit-contract-benefits.ts --env production
```

---

## Notas Importantes

1. **CPA vs S&H**: Planos CPA não têm horas; planos S&H não têm manutenções
2. **Valores Zero**: Zero significa "sem benefício", **não** ilimitado
3. **Valores -1**: -1 significa "ilimitado" (pouco usado nos planos atuais)
4. **Version Bump**: O script incrementa a versão do contrato automaticamente
5. **Balance Recalc**: Após corrigir contratos, pode ser necessário recalcular balances
6. **Audit First**: Sempre execute o audit antes do fix para gerar o ficheiro de issues

---

## Caso de Uso Real

O contrato `3e856a92-56cb-4d54-a699-31a972db3d7d` (cliente `584fbe6c-cf75-4e41-899d-f30a13caeb00`) tinha:

```json
{
  "planIdCPA": "cpa_professional",
  "horasAssistenciaAnualCPA": 0,  // ✅ correto
  "deslocacoesPorAnoCPA": 0,      // ❌ deveria ser 2
  "manutencoesPorAnoCPA": 0       // ❌ deveria ser 1
}
```

Isto impedia a criação de Assistências Remotas/Folhas de Obra com método "Contrato" porque o sistema verificava recursos disponíveis e encontrava zeros.

Após executar o fix script, o contrato ficou:

```json
{
  "planIdCPA": "cpa_professional",
  "horasAssistenciaAnualCPA": 0,
  "deslocacoesPorAnoCPA": 2,      // ✅ corrigido
  "manutencoesPorAnoCPA": 1       // ✅ corrigido
}
```

Agora é possível criar AR/FO normalmente.
