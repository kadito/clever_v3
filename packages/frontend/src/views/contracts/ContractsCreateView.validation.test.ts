import { describe, it, expect, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { ContractEquipment } from '@clever/shared';

// Mock the equipment array that would be used in the component
const mockCpaEquipments = ref<ContractEquipment[]>([]);

// Mock validation function (extracted from the component)
const validateContractCreate = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  try {
    // Client validation
    if (!data.clientId) {
      errors.clientId = 'Cliente é obrigatório';
    }
    
    // Contract type validation - at least one must be configured
    const hasCPA = data.hasCPAContract;
    const hasSH = data.hasSHContract;
    
    if (!hasCPA && !hasSH) {
      errors.contractTypes = 'Configure pelo menos um tipo de contrato (CPA ou S&H)';
    }
    
    // CPA-specific validation (if CPA is configured)
    if (hasCPA) {
      if (!data.cpaContractType) {
        errors.cpaContractType = 'Tipo de contrato CPA é obrigatório';
      }
      
      if (!data.planIdCPA) {
        errors.planIdCPA = 'Plano CPA é obrigatório';
      }
      
      // Distance is only required for CPA (2023), not CPA_1500
      if (data.cpaContractType === 'CPA' && !data.distanceCPA) {
        errors.distanceCPA = 'Distância é obrigatória para contratos CPA (2023)';
      }
      
      if (!data.modalidadePagamentoCPA) {
        errors.modalidadePagamentoCPA = 'Modalidade de pagamento CPA é obrigatória';
      }
      
      // Validate CPA equipment
      if (!mockCpaEquipments.value || mockCpaEquipments.value.length === 0) {
        errors.cpaEquipments = 'Pelo menos um equipamento CPA é obrigatório';
      } else {
        // Validate each equipment
        mockCpaEquipments.value.forEach((equipment, index) => {
          if (!equipment.modelo?.trim()) {
            errors[`cpaEquipment${index}Model`] = `Modelo do equipamento ${index + 1} é obrigatório`;
          }
          
          // First equipment should have 0% discount
          if (index === 0 && equipment.desconto !== 0) {
            errors[`cpaEquipment${index}Discount`] = 'O primeiro equipamento não deve ter desconto';
          }
          
          // Discount validation for additional equipment
          if (index > 0 && (typeof equipment.desconto !== 'number' || equipment.desconto < 0 || equipment.desconto > 100)) {
            errors[`cpaEquipment${index}Discount`] = `Desconto do equipamento ${index + 1} deve ser entre 0 e 100%`;
          }
        });
      }
      
      // Validate contract dates
      if (!data.inicioContratoCPA) {
        errors.inicioContratoCPA = 'Data de início do contrato CPA é obrigatória';
      }
      
      if (!data.fimContratoCPA) {
        errors.fimContratoCPA = 'Data de fim do contrato CPA é obrigatória';
      }
      
      // Date range validation
      if (data.inicioContratoCPA && data.fimContratoCPA) {
        const startDate = new Date(data.inicioContratoCPA);
        const endDate = new Date(data.fimContratoCPA);
        if (startDate >= endDate) {
          errors.fimContratoCPA = 'Data de fim deve ser posterior à data de início';
        }
      }
    }
    
    // S&H-specific validation (if S&H is configured)
    if (hasSH) {
      if (!data.planIdSH) {
        errors.planIdSH = 'Plano S&H é obrigatório';
      }
      
      if (!data.distanceSH) {
        errors.distanceSH = 'Distância S&H é obrigatória';
      }
      
      if (!data.modalidadePagamentoSH) {
        errors.modalidadePagamentoSH = 'Modalidade de pagamento S&H é obrigatória';
      }
      
      // Validate contract dates
      if (!data.inicioContratoSH) {
        errors.inicioContratoSH = 'Data de início do contrato S&H é obrigatória';
      }
      
      if (!data.fimContratoSH) {
        errors.fimContratoSH = 'Data de fim do contrato S&H é obrigatória';
      }
      
      // Date range validation
      if (data.inicioContratoSH && data.fimContratoSH) {
        const startDate = new Date(data.inicioContratoSH);
        const endDate = new Date(data.fimContratoSH);
        if (startDate >= endDate) {
          errors.fimContratoSH = 'Data de fim deve ser posterior à data de início';
        }
      }
    }
    
  } catch (err) {
    errors.general = 'Erro na validação do contrato';
  }
  
  return errors;
};

describe('Contract Create Validation - Display Toggle System', () => {
  beforeEach(() => {
    // Reset equipment array before each test
    mockCpaEquipments.value = [];
  });

  describe('Basic Validation', () => {
    it('should require client selection', () => {
      const data = {
        hasCPAContract: true,
        cpaContractType: 'CPA',
        planIdCPA: 'essential_care'
      };

      const errors = validateContractCreate(data);
      expect(errors.clientId).toBe('Cliente é obrigatório');
    });

    it('should require at least one contract type', () => {
      const data = {
        clientId: 'client-123',
        hasCPAContract: false,
        hasSHContract: false
      };

      const errors = validateContractCreate(data);
      expect(errors.contractTypes).toBe('Configure pelo menos um tipo de contrato (CPA ou S&H)');
    });
  });

  describe('CPA Contract Validation', () => {
    it('should validate CPA contract fields when CPA is enabled', () => {
      const data = {
        clientId: 'client-123',
        hasCPAContract: true,
        hasSHContract: false
      };

      const errors = validateContractCreate(data);
      
      expect(errors.cpaContractType).toBe('Tipo de contrato CPA é obrigatório');
      expect(errors.planIdCPA).toBe('Plano CPA é obrigatório');
      expect(errors.modalidadePagamentoCPA).toBe('Modalidade de pagamento CPA é obrigatória');
      expect(errors.cpaEquipments).toBe('Pelo menos um equipamento CPA é obrigatório');
      expect(errors.inicioContratoCPA).toBe('Data de início do contrato CPA é obrigatória');
      expect(errors.fimContratoCPA).toBe('Data de fim do contrato CPA é obrigatória');
    });

    it('should require distance only for CPA (2023) contracts', () => {
      const data = {
        clientId: 'client-123',
        hasCPAContract: true,
        cpaContractType: 'CPA',
        planIdCPA: 'essential_care',
        modalidadePagamentoCPA: 'mensal',
        inicioContratoCPA: '2024-01-01',
        fimContratoCPA: '2024-12-31'
      };

      mockCpaEquipments.value = [{
        id: '1',
        modelo: 'Test Model',
        numeroSerie: '123',
        desconto: 0,
        observacoes: ''
      }];

      const errors = validateContractCreate(data);
      expect(errors.distanceCPA).toBe('Distância é obrigatória para contratos CPA (2023)');
    });

    it('should not require distance for CPA_1500 contracts', () => {
      const data = {
        clientId: 'client-123',
        hasCPAContract: true,
        cpaContractType: 'CPA_1500',
        planIdCPA: 'essential_care',
        modalidadePagamentoCPA: 'mensal',
        inicioContratoCPA: '2024-01-01',
        fimContratoCPA: '2024-12-31'
      };

      mockCpaEquipments.value = [{
        id: '1',
        modelo: 'Test Model',
        numeroSerie: '123',
        desconto: 0,
        observacoes: ''
      }];

      const errors = validateContractCreate(data);
      expect(errors.distanceCPA).toBeUndefined();
    });

    it('should validate equipment requirements', () => {
      const data = {
        clientId: 'client-123',
        hasCPAContract: true,
        cpaContractType: 'CPA',
        planIdCPA: 'essential_care',
        distanceCPA: 'under180km',
        modalidadePagamentoCPA: 'mensal',
        inicioContratoCPA: '2024-01-01',
        fimContratoCPA: '2024-12-31'
      };

      // Test with equipment missing model
      mockCpaEquipments.value = [{
        id: '1',
        modelo: '',
        numeroSerie: '123',
        desconto: 0,
        observacoes: ''
      }];

      const errors = validateContractCreate(data);
      expect(errors.cpaEquipment0Model).toBe('Modelo do equipamento 1 é obrigatório');
    });

    it('should validate first equipment has 0% discount', () => {
      const data = {
        clientId: 'client-123',
        hasCPAContract: true,
        cpaContractType: 'CPA',
        planIdCPA: 'essential_care',
        distanceCPA: 'under180km',
        modalidadePagamentoCPA: 'mensal',
        inicioContratoCPA: '2024-01-01',
        fimContratoCPA: '2024-12-31'
      };

      // Test with first equipment having discount
      mockCpaEquipments.value = [{
        id: '1',
        modelo: 'Test Model',
        numeroSerie: '123',
        desconto: 10, // Should be 0
        observacoes: ''
      }];

      const errors = validateContractCreate(data);
      expect(errors.cpaEquipment0Discount).toBe('O primeiro equipamento não deve ter desconto');
    });

    it('should validate date range for CPA contracts', () => {
      const data = {
        clientId: 'client-123',
        hasCPAContract: true,
        cpaContractType: 'CPA',
        planIdCPA: 'essential_care',
        distanceCPA: 'under180km',
        modalidadePagamentoCPA: 'mensal',
        inicioContratoCPA: '2024-12-31',
        fimContratoCPA: '2024-01-01' // End before start
      };

      mockCpaEquipments.value = [{
        id: '1',
        modelo: 'Test Model',
        numeroSerie: '123',
        desconto: 0,
        observacoes: ''
      }];

      const errors = validateContractCreate(data);
      expect(errors.fimContratoCPA).toBe('Data de fim deve ser posterior à data de início');
    });
  });

  describe('S&H Contract Validation', () => {
    it('should validate S&H contract fields when S&H is enabled', () => {
      const data = {
        clientId: 'client-123',
        hasCPAContract: false,
        hasSHContract: true
      };

      const errors = validateContractCreate(data);
      
      expect(errors.planIdSH).toBe('Plano S&H é obrigatório');
      expect(errors.distanceSH).toBe('Distância S&H é obrigatória');
      expect(errors.modalidadePagamentoSH).toBe('Modalidade de pagamento S&H é obrigatória');
      expect(errors.inicioContratoSH).toBe('Data de início do contrato S&H é obrigatória');
      expect(errors.fimContratoSH).toBe('Data de fim do contrato S&H é obrigatória');
    });

    it('should validate date range for S&H contracts', () => {
      const data = {
        clientId: 'client-123',
        hasCPAContract: false,
        hasSHContract: true,
        planIdSH: 'simple',
        distanceSH: 'under180km',
        modalidadePagamentoSH: 'mensal',
        inicioContratoSH: '2024-12-31',
        fimContratoSH: '2024-01-01' // End before start
      };

      const errors = validateContractCreate(data);
      expect(errors.fimContratoSH).toBe('Data de fim deve ser posterior à data de início');
    });
  });

  describe('Both Contract Types', () => {
    it('should validate both CPA and S&H when both are enabled', () => {
      const data = {
        clientId: 'client-123',
        hasCPAContract: true,
        hasSHContract: true
      };

      const errors = validateContractCreate(data);
      
      // Should have errors for both contract types
      expect(errors.cpaContractType).toBe('Tipo de contrato CPA é obrigatório');
      expect(errors.planIdSH).toBe('Plano S&H é obrigatório');
    });

    it('should pass validation with complete data for both contract types', () => {
      const data = {
        clientId: 'client-123',
        hasCPAContract: true,
        hasSHContract: true,
        cpaContractType: 'CPA_1500', // No distance required
        planIdCPA: 'essential_care',
        modalidadePagamentoCPA: 'mensal',
        inicioContratoCPA: '2024-01-01',
        fimContratoCPA: '2024-12-31',
        planIdSH: 'simple',
        distanceSH: 'under180km',
        modalidadePagamentoSH: 'mensal',
        inicioContratoSH: '2024-01-01',
        fimContratoSH: '2024-12-31'
      };

      mockCpaEquipments.value = [{
        id: '1',
        modelo: 'Test Model',
        numeroSerie: '123',
        desconto: 0,
        observacoes: ''
      }];

      const errors = validateContractCreate(data);
      
      // Should have no validation errors
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });
});