/**
 * Balance API Routes — period-based Saldo system.
 *
 * Endpoints:
 * - GET /api/balance/report                   — all-clients report (admin) [registered FIRST to avoid :clientId capture]
 * - GET /api/balance/:clientId/periods        — active + closed periods for a client
 * - GET /api/balance/:clientId/transactions   — transaction history (grouped by period in the UI)
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import type {
  StorageBucket,
  ApiResponse,
  ContractPeriod,
  BalanceTransaction,
} from '@clever/shared';
import { createBalancePeriodService } from '../services/balance-service';
import { BalanceReportingService } from '../services/balance-reporting-service';
import { migrateSaldo } from '../services/migrate-saldo';
import { requireAuth, requireAdminAccess, requireUserContext } from '../middleware/clerk';
import { requireDeletePermission } from '../middleware/permissions';

const balanceRouter = new Hono();

balanceRouter.use('*', requireAuth);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ============================================================================
// GET /report — MUST be registered before /:clientId (route ordering fix)
// ============================================================================

balanceRouter.get('/report', requireAdminAccess, async (c: Context) => {
  try {
    const r2Bucket = c.env?.R2_BUCKET as StorageBucket;
    if (!r2Bucket) {
      return c.json<ApiResponse>({ success: false, error: 'Armazenamento não disponível', timestamp: new Date().toISOString() }, 500);
    }

    const reportingService = new BalanceReportingService(r2Bucket);
    const summary = await reportingService.getSummaryStatistics();
    const periods = await reportingService.getAllActivePeriods();

    return c.json<ApiResponse<{ summary: typeof summary; periods: ContractPeriod[] }>>({
      success: true,
      data: { summary, periods },
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('Error retrieving balance report:', JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    }, null, 2));
    return c.json<ApiResponse>({ success: false, error: 'Erro ao gerar relatório de saldos', timestamp: new Date().toISOString() }, 500);
  }
});

balanceRouter.get('/report/export', requireAdminAccess, async (c: Context) => {
  try {
    const r2Bucket = c.env?.R2_BUCKET as StorageBucket;
    if (!r2Bucket) {
      return c.json<ApiResponse>({ success: false, error: 'Armazenamento não disponível', timestamp: new Date().toISOString() }, 500);
    }
    const reportingService = new BalanceReportingService(r2Bucket);

    // ?summary=true → one row per client; otherwise one row per active period.
    const summary = c.req.query('summary') === 'true';
    const csv = summary
      ? await reportingService.exportClientSummaryCSV()
      : await reportingService.exportToCSV();

    const filename = summary
      ? `balance-summary-${new Date().toISOString().split('T')[0]}.csv`
      : `balance-report-${new Date().toISOString().split('T')[0]}.csv`;

    return c.text(csv, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
  } catch (error) {
    console.error('Error exporting balance report:', JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    }, null, 2));
    return c.json<ApiResponse>({ success: false, error: 'Erro ao exportar relatório', timestamp: new Date().toISOString() }, 500);
  }
});

// ============================================================================
// GET /:clientId/periods — active + closed periods for a client
// ============================================================================

balanceRouter.get('/:clientId/periods', requireAdminAccess, async (c: Context) => {
  try {
    const user = requireUserContext(c);
    const clientId = c.req.param('clientId');
    const r2Bucket = c.env?.R2_BUCKET as StorageBucket;

    if (!r2Bucket) {
      return c.json<ApiResponse>({ success: false, error: 'Armazenamento não disponível', timestamp: new Date().toISOString() }, 500);
    }
    if (!UUID_REGEX.test(clientId)) {
      return c.json<ApiResponse>({ success: false, error: 'Formato de ID de cliente inválido', timestamp: new Date().toISOString() }, 400);
    }

    const statusFilter = c.req.query('status'); // optional 'active'
    const service = createBalancePeriodService(r2Bucket);
    const index = await service.getPeriodsIndex(clientId);

    const filteredIndex = statusFilter === 'active'
      ? index.filter(e => e.status === 'active')
      : index;

    const periods = (
      await Promise.all(filteredIndex.map(e => service.getPeriod(clientId, e.periodId)))
    ).filter((p): p is ContractPeriod => p !== null);

    console.log('Retrieved client periods:', JSON.stringify({
      clientId, userId: user.userId, count: periods.length, statusFilter,
    }, null, 2));

    return c.json<ApiResponse<ContractPeriod[]>>({
      success: true,
      data: periods,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('Error retrieving client periods:', JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    }, null, 2));
    return c.json<ApiResponse>({ success: false, error: 'Erro ao obter períodos do cliente', timestamp: new Date().toISOString() }, 500);
  }
});

// ============================================================================
// POST /:clientId/recalculate — rebuild one client's balance (Admin only)
// Wipes and rebuilds this client's periods + transactions from current
// contracts, work sheets, and remote assistances. Same logic as the migration,
// scoped to a single client.
// ============================================================================

balanceRouter.post('/:clientId/recalculate', requireDeletePermission, async (c: Context) => {
  try {
    const user = requireUserContext(c);
    const clientId = c.req.param('clientId');
    const r2Bucket = c.env?.R2_BUCKET as StorageBucket;

    if (!r2Bucket) {
      return c.json<ApiResponse>({ success: false, error: 'Armazenamento não disponível', timestamp: new Date().toISOString() }, 500);
    }
    if (!UUID_REGEX.test(clientId)) {
      return c.json<ApiResponse>({ success: false, error: 'Formato de ID de cliente inválido', timestamp: new Date().toISOString() }, 400);
    }

    console.log('Recalculating balance for client:', JSON.stringify({ clientId, userId: user.userId }, null, 2));

    const report = await migrateSaldo(r2Bucket, { clientId });

    // migrateSaldo records a top-level error when the client has no contract
    if (report.clientsProcessed === 0 && report.errors.length > 0) {
      return c.json<ApiResponse>({ success: false, error: report.errors[0], timestamp: new Date().toISOString() }, 404);
    }

    return c.json<ApiResponse<typeof report>>({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('Error recalculating balance:', JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    }, null, 2));
    return c.json<ApiResponse>({ success: false, error: 'Erro ao recalcular saldo', timestamp: new Date().toISOString() }, 500);
  }
});

// ============================================================================
// GET /:clientId/transactions — transaction history (now backed by the index)
// ============================================================================

balanceRouter.get('/:clientId/transactions', requireAdminAccess, async (c: Context) => {
  try {
    const user = requireUserContext(c);
    const clientId = c.req.param('clientId');
    const r2Bucket = c.env?.R2_BUCKET as StorageBucket;

    if (!r2Bucket) {
      return c.json<ApiResponse>({ success: false, error: 'Armazenamento não disponível', timestamp: new Date().toISOString() }, 500);
    }
    if (!UUID_REGEX.test(clientId)) {
      return c.json<ApiResponse>({ success: false, error: 'Formato de ID de cliente inválido', timestamp: new Date().toISOString() }, 400);
    }

    const q = c.req.query();
    const options: {
      type?: 'ADD' | 'DEBT';
      startDate?: string;
      endDate?: string;
      periodId?: string;
      limit?: number;
      offset?: number;
    } = {};

    if (q.type) {
      if (q.type !== 'ADD' && q.type !== 'DEBT') {
        return c.json<ApiResponse>({ success: false, error: 'Tipo de transação inválido. Use "ADD" ou "DEBT".', timestamp: new Date().toISOString() }, 400);
      }
      options.type = q.type;
    }
    if (q.startDate) options.startDate = q.startDate;
    if (q.endDate) options.endDate = q.endDate;
    if (q.periodId) options.periodId = q.periodId;

    if (q.limit) {
      const limit = parseInt(q.limit, 10);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        return c.json<ApiResponse>({ success: false, error: 'Limite inválido. Use um número entre 1 e 1000.', timestamp: new Date().toISOString() }, 400);
      }
      options.limit = limit;
    } else {
      options.limit = 50;
    }

    if (q.offset) {
      const offset = parseInt(q.offset, 10);
      if (isNaN(offset) || offset < 0) {
        return c.json<ApiResponse>({ success: false, error: 'Offset inválido. Use um número maior ou igual a 0.', timestamp: new Date().toISOString() }, 400);
      }
      options.offset = offset;
    } else {
      options.offset = 0;
    }

    const service = createBalancePeriodService(r2Bucket);
    const transactions = await service.getTransactions(clientId, options);

    console.log('Retrieved transaction history:', JSON.stringify({
      clientId, userId: user.userId, count: transactions.length, options,
    }, null, 2));

    return c.json<ApiResponse<BalanceTransaction[]>>({
      success: true,
      data: transactions,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('Error retrieving transaction history:', JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
    }, null, 2));
    return c.json<ApiResponse>({ success: false, error: 'Erro ao obter histórico de transações', timestamp: new Date().toISOString() }, 500);
  }
});

export default balanceRouter;
