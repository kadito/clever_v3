/**
 * Balance API Routes
 * 
 * Provides REST API endpoints for accessing client balance information,
 * transaction history, and balance reporting.
 * 
 * Endpoints:
 * - GET /api/balance/:clientId - Get balance index for a client
 * - GET /api/balance/:clientId/transactions - Get transaction history for a client
 * - GET /api/balance/report - Get balance report for all clients (admin only)
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5, 15.1, 15.2, 15.3, 15.4
 * 
 * Design Principles:
 * - Authentication required for all endpoints
 * - Admin-only access for reporting endpoints
 * - Portuguese error messages for user-facing errors
 * - Structured logging with JSON.stringify for objects
 * - Query parameter support for filtering and pagination
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import type {
  StorageBucket,
  ApiResponse,
  BalanceIndex,
  BalanceTransaction,
  QueryOptions,
  BalanceSummary,
  ClientBalanceReport,
} from '@clever/shared';
import { createBalanceService } from '../services/balance-service';
import { requireAuth, requireAdminAccess, requireUserContext } from '../middleware/clerk';

// Create the balance router
const balanceRouter = new Hono();

// Apply authentication middleware to all routes
balanceRouter.use('*', requireAuth);

// ============================================================================
// GET /api/balance/:clientId - Get Balance Index
// ============================================================================

/**
 * Get balance index for a specific client.
 * Returns current debt and contract usage information.
 * 
 * Requirements: 8.1, 8.2, 9.1
 * 
 * Response:
 * - 200: Balance index found
 * - 404: Balance index not found (client has no transactions)
 * - 401: Not authenticated
 * - 403: Not authorized (admin only)
 * - 500: Server error
 */
balanceRouter.get('/:clientId', requireAdminAccess, async (c: Context) => {
  try {
    const user = requireUserContext(c);
    const clientId = c.req.param('clientId');
    const r2Bucket = c.env?.R2_BUCKET as StorageBucket;

    if (!r2Bucket) {
      console.error('Balance index retrieval failed: R2 bucket not available');
      const response: ApiResponse = {
        success: false,
        error: 'Armazenamento não disponível',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 500);
    }

    // Validate clientId format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      console.warn('Invalid clientId format:', JSON.stringify({ clientId, userId: user.userId }, null, 2));
      const response: ApiResponse = {
        success: false,
        error: 'Formato de ID de cliente inválido',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }

    console.log('Retrieving balance index:', JSON.stringify({
      clientId,
      userId: user.userId,
    }, null, 2));

    // Get balance from service
    const balanceService = createBalanceService(r2Bucket);
    const balance = await balanceService.getBalance(clientId);

    if (!balance) {
      console.log('Balance index not found:', JSON.stringify({ clientId }, null, 2));
      const response: ApiResponse = {
        success: false,
        error: 'Saldo não encontrado para este cliente',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 404);
    }

    console.log('Balance index retrieved successfully:', JSON.stringify({
      clientId,
      balance: balance.balance,
      version: balance.version,
    }, null, 2));

    const response: ApiResponse<BalanceIndex> = {
      success: true,
      data: balance,
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 200);
  } catch (error) {
    console.error('Error retrieving balance index:', JSON.stringify({
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error),
    }, null, 2));

    const response: ApiResponse = {
      success: false,
      error: 'Erro ao obter saldo do cliente',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

// ============================================================================
// GET /api/balance/:clientId/transactions - Get Transaction History
// ============================================================================

/**
 * Get transaction history for a specific client.
 * Supports filtering by type, date range, and pagination.
 * 
 * Query Parameters:
 * - type: Filter by transaction type ('ADD' or 'DEBT')
 * - startDate: Filter by start date (ISO timestamp)
 * - endDate: Filter by end date (ISO timestamp)
 * - limit: Maximum number of results (default: 50)
 * - offset: Number of results to skip (default: 0)
 * 
 * Requirements: 8.3, 9.2, 9.3, 9.4, 9.5
 * 
 * Response:
 * - 200: Transaction history retrieved
 * - 400: Invalid query parameters
 * - 401: Not authenticated
 * - 403: Not authorized (admin only)
 * - 500: Server error
 */
balanceRouter.get('/:clientId/transactions', requireAdminAccess, async (c: Context) => {
  try {
    const user = requireUserContext(c);
    const clientId = c.req.param('clientId');
    const r2Bucket = c.env?.R2_BUCKET as StorageBucket;

    if (!r2Bucket) {
      console.error('Transaction history retrieval failed: R2 bucket not available');
      const response: ApiResponse = {
        success: false,
        error: 'Armazenamento não disponível',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 500);
    }

    // Validate clientId format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      console.warn('Invalid clientId format:', JSON.stringify({ clientId, userId: user.userId }, null, 2));
      const response: ApiResponse = {
        success: false,
        error: 'Formato de ID de cliente inválido',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }

    // Parse query parameters
    const queryParams = c.req.query();
    const options: QueryOptions = {};

    // Type filter
    if (queryParams.type) {
      if (queryParams.type !== 'ADD' && queryParams.type !== 'DEBT') {
        console.warn('Invalid transaction type filter:', JSON.stringify({
          type: queryParams.type,
          clientId,
        }, null, 2));
        const response: ApiResponse = {
          success: false,
          error: 'Tipo de transação inválido. Use "ADD" ou "DEBT".',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }
      options.type = queryParams.type as 'ADD' | 'DEBT';
    }

    // Date range filters
    if (queryParams.startDate) {
      options.startDate = queryParams.startDate;
    }
    if (queryParams.endDate) {
      options.endDate = queryParams.endDate;
    }

    // Pagination
    if (queryParams.limit) {
      const limit = parseInt(queryParams.limit, 10);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        console.warn('Invalid limit parameter:', JSON.stringify({
          limit: queryParams.limit,
          clientId,
        }, null, 2));
        const response: ApiResponse = {
          success: false,
          error: 'Limite inválido. Use um número entre 1 e 1000.',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }
      options.limit = limit;
    } else {
      options.limit = 50; // Default limit
    }

    if (queryParams.offset) {
      const offset = parseInt(queryParams.offset, 10);
      if (isNaN(offset) || offset < 0) {
        console.warn('Invalid offset parameter:', JSON.stringify({
          offset: queryParams.offset,
          clientId,
        }, null, 2));
        const response: ApiResponse = {
          success: false,
          error: 'Offset inválido. Use um número maior ou igual a 0.',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }
      options.offset = offset;
    } else {
      options.offset = 0; // Default offset
    }

    console.log('Retrieving transaction history:', JSON.stringify({
      clientId,
      userId: user.userId,
      options,
    }, null, 2));

    // Get transactions from service
    const balanceService = createBalanceService(r2Bucket);
    const transactions = await balanceService.getTransactionHistory(clientId, options);

    console.log('Transaction history retrieved successfully:', JSON.stringify({
      clientId,
      transactionCount: transactions.length,
      options,
    }, null, 2));

    const response: ApiResponse<BalanceTransaction[]> = {
      success: true,
      data: transactions,
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 200);
  } catch (error) {
    console.error('Error retrieving transaction history:', JSON.stringify({
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error),
    }, null, 2));

    const response: ApiResponse = {
      success: false,
      error: 'Erro ao obter histórico de transações',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

// ============================================================================
// POST /api/balance/:clientId/recalculate - Recalculate Balance (Admin Only)
// ============================================================================

/**
 * Recalculate balance from scratch by reading all transactions.
 * This is an administrative operation for verifying balance integrity.
 * 
 * If no balance exists, this will initialize it by:
 * 1. Finding all contracts for the client
 * 2. Creating ADD transactions for each contract
 * 3. Calculating the final balance
 * 
 * Requirements: 18.1, 18.2, 18.3
 * 
 * Response:
 * - 200: Balance recalculated successfully
 * - 400: Invalid client ID
 * - 401: Not authenticated
 * - 403: Not authorized (admin only)
 * - 500: Server error
 */
balanceRouter.post('/:clientId/recalculate', requireAdminAccess, async (c: Context) => {
  try {
    const user = requireUserContext(c);
    const clientId = c.req.param('clientId');
    const r2Bucket = c.env?.R2_BUCKET as StorageBucket;

    if (!r2Bucket) {
      console.error('Balance recalculation failed: R2 bucket not available');
      const response: ApiResponse = {
        success: false,
        error: 'Armazenamento não disponível',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 500);
    }

    // Validate clientId format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      console.warn('Invalid clientId format:', JSON.stringify({ clientId, userId: user.userId }, null, 2));
      const response: ApiResponse = {
        success: false,
        error: 'Formato de ID de cliente inválido',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }

    console.log('Recalculating balance:', JSON.stringify({
      clientId,
      userId: user.userId,
    }, null, 2));

    // Get balance service
    const balanceService = createBalanceService(r2Bucket);
    
    // Recalculate balance (this will initialize if no balance exists)
    // Pass userId so missing transactions are attributed to the admin user
    const balance = await balanceService.recalculateBalance(clientId, user.userId);

    console.log('Balance recalculated successfully:', JSON.stringify({
      clientId,
      balance: balance.balance,
      version: balance.version,
    }, null, 2));

    const response: ApiResponse<BalanceIndex> = {
      success: true,
      data: balance,
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 200);
  } catch (error) {
    console.error('Error recalculating balance:', JSON.stringify({
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error),
    }, null, 2));

    const response: ApiResponse = {
      success: false,
      error: 'Erro ao recalcular saldo',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

// ============================================================================
// GET /api/balance/report - Get Balance Report (Admin Only)
// ============================================================================

/**
 * Get balance report for all clients with summary statistics.
 * Admin-only endpoint for financial reporting.
 * 
 * Query Parameters:
 * - minDebt: Filter clients with debt >= this amount (euros)
 * - maxDebt: Filter clients with debt <= this amount (euros)
 * - lowUsage: Filter clients with low contract usage (boolean)
 * - format: Response format ('json' or 'csv') - default: 'json'
 * 
 * Requirements: 8.4, 15.1, 15.2, 15.3, 15.4
 * 
 * Response:
 * - 200: Balance report retrieved
 * - 400: Invalid query parameters
 * - 401: Not authenticated
 * - 403: Not authorized (admin only)
 * - 500: Server error
 */
balanceRouter.get('/report', requireAdminAccess, async (c: Context) => {
  try {
    const user = requireUserContext(c);
    const r2Bucket = c.env?.R2_BUCKET as StorageBucket;

    if (!r2Bucket) {
      console.error('Balance report retrieval failed: R2 bucket not available');
      const response: ApiResponse = {
        success: false,
        error: 'Armazenamento não disponível',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 500);
    }

    // Parse query parameters
    const queryParams = c.req.query();
    let minDebt: number | undefined;
    let maxDebt: number | undefined;
    let lowUsage: boolean | undefined;
    const format = queryParams.format || 'json';

    // Validate format parameter
    if (format !== 'json' && format !== 'csv') {
      console.warn('Invalid format parameter:', JSON.stringify({
        format,
        userId: user.userId,
      }, null, 2));
      const response: ApiResponse = {
        success: false,
        error: 'Formato inválido. Use "json" ou "csv".',
        timestamp: new Date().toISOString(),
      };
      return c.json(response, 400);
    }

    // Parse minDebt filter
    if (queryParams.minDebt) {
      minDebt = parseFloat(queryParams.minDebt);
      if (isNaN(minDebt) || minDebt < 0) {
        console.warn('Invalid minDebt parameter:', JSON.stringify({
          minDebt: queryParams.minDebt,
          userId: user.userId,
        }, null, 2));
        const response: ApiResponse = {
          success: false,
          error: 'Dívida mínima inválida. Use um número maior ou igual a 0.',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }
    }

    // Parse maxDebt filter
    if (queryParams.maxDebt) {
      maxDebt = parseFloat(queryParams.maxDebt);
      if (isNaN(maxDebt) || maxDebt < 0) {
        console.warn('Invalid maxDebt parameter:', JSON.stringify({
          maxDebt: queryParams.maxDebt,
          userId: user.userId,
        }, null, 2));
        const response: ApiResponse = {
          success: false,
          error: 'Dívida máxima inválida. Use um número maior ou igual a 0.',
          timestamp: new Date().toISOString(),
        };
        return c.json(response, 400);
      }
    }

    // Parse lowUsage filter
    if (queryParams.lowUsage) {
      lowUsage = queryParams.lowUsage === 'true';
    }

    console.log('Retrieving balance report:', JSON.stringify({
      userId: user.userId,
      filters: { minDebt, maxDebt, lowUsage },
      format,
    }, null, 2));

    // Get balance service
    const balanceService = createBalanceService(r2Bucket);

    // TODO: Implement balance report generation
    // This requires:
    // 1. List all client IDs (from clients index or balance indexes)
    // 2. Get balance for each client
    // 3. Apply filters (minDebt, maxDebt, lowUsage)
    // 4. Calculate summary statistics
    // 5. Format response (JSON or CSV)
    
    // For now, return a placeholder response
    console.warn('Balance report not fully implemented:', JSON.stringify({
      userId: user.userId,
      note: 'Report generation requires client listing functionality',
    }, null, 2));

    // Placeholder response structure
    const summary: BalanceSummary = {
      totalDebt: 0,
      averageDebt: 0,
      clientsWithDebt: 0,
      totalClients: 0,
    };

    const clientBalances: ClientBalanceReport[] = [];

    if (format === 'csv') {
      // Generate CSV format
      const csvHeader = 'Client ID,Client Name,Balance,Maintenance Visits,Displacements,Assistance Hours,Has Debt,Has Low Usage\n';
      const csvRows = clientBalances.map(cb => {
        return `${cb.clientId},${cb.clientName},${cb.balance.balance},${cb.balance.contracts.manutencoesPorAno},${cb.balance.contracts.deslocacoesPorAno},${cb.balance.contracts.horasAssistenciaAnuais},${cb.hasDebt},${cb.hasLowUsage}`;
      }).join('\n');
      
      const csv = csvHeader + csvRows;
      
      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="balance-report-${new Date().toISOString()}.csv"`,
      });
    }

    // JSON format
    const response: ApiResponse<{
      summary: BalanceSummary;
      clients: ClientBalanceReport[];
    }> = {
      success: true,
      data: {
        summary,
        clients: clientBalances,
      },
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 200);
  } catch (error) {
    console.error('Error retrieving balance report:', JSON.stringify({
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error),
    }, null, 2));

    const response: ApiResponse = {
      success: false,
      error: 'Erro ao gerar relatório de saldos',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, 500);
  }
});

export default balanceRouter;
