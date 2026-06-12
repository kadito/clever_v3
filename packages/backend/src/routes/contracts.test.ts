/**
 * Contracts API route tests
 * Tests the contracts-specific implementation of the generic content route template
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import contractsRouter from './contracts';
import type { Contract, ContractData } from '@clever/shared';

// Mock the middleware
vi.mock('../middleware/clerk', () => ({
  requireAuth: vi.fn((c, next) => next()),
  requireUserContext: vi.fn(() => ({
    userId: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    userType: 'User',
    sessionId: 'test-session',
    isAuthenticated: true,
  })),
}));

// Mock storage bucket for testing
class MockStorageBucket {
  private storage = new Map<string, string>();

  async get(key: string) {
    const data = this.storage.get(key);
    if (!data) return null;
    return {
      json: async () => JSON.parse(data),
    };
  }

  async put(key: string, value: string) {
    this.storage.set(key, value);
  }

  clear() {
    this.storage.clear();
  }
}

describe('Contracts API Routes', () => {
  let app: Hono;
  let mockBucket: MockStorageBucket;
  let mockEnv: any;

  beforeEach(() => {
    app = new Hono();
    mockBucket = new MockStorageBucket();
    mockEnv = { R2_BUCKET: mockBucket };
    vi.clearAllMocks();

    // Mount the contracts router
    app.route('/api/content/contracts', contractsRouter);
  });

  describe('Contract Creation', () => {
    it('should create a contract with valid data', async () => {
      const contractData: ContractData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        clienteName: 'Test Client Lda',
        hasCPAContract: true,
        hasSHContract: false,
        planIdCPA: 'cpa_essential',
        modalidadePagamentoCPA: 'MENSAL',
        hasPOSPackage: false,
        cpaEquipments: [
          {
            id: 'eq1',
            modelo: 'Test Model',
            numeroSerie: 'TEST123',
            observacoes: 'Test equipment',
          },
        ],
        inicioContratoCPA: '2024-01-01',
        fimContratoCPA: '2024-12-31',
        horasAssistenciaAnualCPA: 0,
        deslocacoesPorAnoCPA: 1,
        manutencoesPorAnoCPA: 1,
        planIdSH: '',
        distanceSH: '',
        modalidadePagamentoSH: '',
        shEquipments: [],
        inicioContratoSH: '',
        fimContratoSH: '',
        horasAssistenciaAnualSH: 0,
        deslocacoesPorAnoSH: 0,
        manutencoesPorAnoSH: 0,
        metodoPagamento: 'TRANSFERENCIA_BANCARIA',
      };

      const response = await app.request(
        '/api/content/contracts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: contractData }),
        },
        mockEnv
      );

      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.contentType).toBe('contracts');
      expect(result.data.data.clienteName).toBe('Test Client Lda');
    });

    it('should reject contract creation without required fields', async () => {
      const invalidData = {
        clientId: '', // Missing required client
        hasCPAContract: false,
        hasSHContract: false, // No contract types selected
      };

      const response = await app.request(
        '/api/content/contracts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: invalidData }),
        },
        mockEnv
      );

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Contract Search and Indexing', () => {
    it('should create searchable index fields for contracts', async () => {
      const contractData: ContractData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        clienteName: 'Empresa ABC Lda',
        hasCPAContract: true,
        hasSHContract: true,
        planIdCPA: 'cpa_premium',
        modalidadePagamentoCPA: 'ANUAL',
        hasPOSPackage: true,
        cpaEquipments: [
          {
            id: 'eq1',
            modelo: 'Modelo XYZ',
            numeroSerie: 'XYZ789',
            observacoes: '',
          },
        ],
        inicioContratoCPA: '2024-01-01',
        fimContratoCPA: '2024-12-31',
        horasAssistenciaAnualCPA: 0,
        deslocacoesPorAnoCPA: 3,
        manutencoesPorAnoCPA: 2,
        planIdSH: 'sh_simple',
        distanceSH: 'under180km',
        modalidadePagamentoSH: 'MENSAL',
        shEquipments: [
          {
            id: 'eq2',
            modelo: 'PSO Model',
            numeroSerie: 'PSO456',
            software: 'Software XYZ',
            observacoes: '',
          },
        ],
        inicioContratoSH: '2024-01-01',
        fimContratoSH: '2024-12-31',
        horasAssistenciaAnualSH: 10,
        deslocacoesPorAnoSH: 2,
        manutencoesPorAnoSH: 0,
        metodoPagamento: 'DEBITO_DIRETO',
      };

      const response = await app.request(
        '/api/content/contracts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: contractData }),
        },
        mockEnv
      );

      expect(response.status).toBe(201);
      const result = await response.json();

      // Verify the contract was created with proper indexing
      expect(result.success).toBe(true);
      expect(result.data.data.clienteName).toBe('Empresa ABC Lda');
      expect(result.data.data.hasCPAContract).toBe(true);
      expect(result.data.data.hasSHContract).toBe(true);
    });
  });

  describe('Contract Validation', () => {
    it('should validate CPA contract requirements', async () => {
      const invalidCPAData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        clienteName: 'Test Client',
        hasCPAContract: true,
        hasSHContract: false,
        planIdCPA: '', // Missing required plan
        modalidadePagamentoCPA: '', // Missing required payment method
        cpaEquipments: [], // Missing required equipment
        horasAssistenciaAnualCPA: 0,
        deslocacoesPorAnoCPA: 0,
        manutencoesPorAnoCPA: 0,
      };

      const response = await app.request(
        '/api/content/contracts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: invalidCPAData }),
        },
        mockEnv
      );

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate S&H contract requirements', async () => {
      const invalidSHData = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        clienteName: 'Test Client',
        hasCPAContract: false,
        hasSHContract: true,
        planIdSH: '', // Missing required plan
        distanceSH: '', // Missing required distance
        modalidadePagamentoSH: '', // Missing required payment method
        horasAssistenciaAnual: 0,
        deslocacoesPorAno: 0,
        manutencoesPorAno: 0,
      };

      const response = await app.request(
        '/api/content/contracts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: invalidSHData }),
        },
        mockEnv
      );

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
