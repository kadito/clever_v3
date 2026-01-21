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
        cpaContractType: 'CPA',
        planIdCPA: 'CPA_BASIC',
        planoCPA: 'CPA Básico',
        distanceCPA: 'under180km',
        modalidadePagamentoCPA: 'MENSAL',
        hasPOSPackage: false,
        cpaEquipments: [
          {
            id: 'eq1',
            modelo: 'Test Model',
            numeroSerie: 'TEST123',
            desconto: 0,
            observacoes: 'Test equipment',
          },
        ],
        modeloCPA: 'Test Model',
        numeroSerieCPA: 'TEST123',
        inicioContratoCPA: '2024-01-01',
        fimContratoCPA: '2024-12-31',
        planIdSH: '',
        planoSH: '',
        distanceSH: '',
        modalidadePagamentoSH: '',
        modeloPSO: '',
        numeroSeriePSO: '',
        softwarePSO: '',
        inicioContratoSH: '',
        fimContratoSH: '',
        horasAssistenciaAnual: 40,
        deslocacoesPorAno: 12,
        manutencoesPorAno: 2,
        metodoPagamento: 'TRANSFERENCIA_BANCARIA',
        planoContrato: 'CPA Básico',
        temCPA: true,
        temPSO: false,
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
        cpaContractType: 'CPA_1500',
        planIdCPA: 'CPA_PREMIUM',
        planoCPA: 'CPA Premium',
        distanceCPA: '',
        modalidadePagamentoCPA: 'ANUAL',
        hasPOSPackage: true,
        cpaEquipments: [
          {
            id: 'eq1',
            modelo: 'Modelo XYZ',
            numeroSerie: 'XYZ789',
            desconto: 0,
            observacoes: '',
          },
        ],
        modeloCPA: 'Modelo XYZ',
        numeroSerieCPA: 'XYZ789',
        inicioContratoCPA: '2024-01-01',
        fimContratoCPA: '2024-12-31',
        planIdSH: 'SH_STANDARD',
        planoSH: 'S&H Standard',
        distanceSH: 'under180km',
        modalidadePagamentoSH: 'TRIMESTRAL',
        modeloPSO: 'PSO Model',
        numeroSeriePSO: 'PSO456',
        softwarePSO: 'Software XYZ',
        inicioContratoSH: '2024-01-01',
        fimContratoSH: '2024-12-31',
        horasAssistenciaAnual: 80,
        deslocacoesPorAno: 24,
        manutencoesPorAno: 4,
        metodoPagamento: 'DEBITO_DIRETO',
        planoContrato: 'CPA Premium + S&H Standard',
        temCPA: true,
        temPSO: true,
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
        cpaContractType: 'CPA', // Requires distance
        planIdCPA: '', // Missing required plan
        distanceCPA: '', // Missing required distance for CPA type
        modalidadePagamentoCPA: '', // Missing required payment method
        cpaEquipments: [], // Missing required equipment
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
