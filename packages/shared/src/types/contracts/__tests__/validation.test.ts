import { describe, it, expect } from 'vitest';
import { validateContractCreation, validateContractEquipment } from '../validation';
import type { ContractCreationData, ContractEquipment } from '../types';

/**
 * Helper: base valid CPA creation data to reuse across tests.
 */
const baseValidCPAData: ContractCreationData = {
  clientId: 'client-123',
  hasCPAContract: true,
  hasSHContract: false,
  planIdCPA: 'cpa_essential',
  modalidadePagamentoCPA: 'MENSAL',
  hasPOSPackage: false,
  cpaEquipments: [{ id: '1', modelo: 'GEST 15', numeroSerie: '123', observacoes: '' }],
  inicioContratoCPA: '2024-01-01',
  fimContratoCPA: '2025-01-01',
  horasAssistenciaAnualCPA: 0,
  deslocacoesPorAnoCPA: 1,
  manutencoesPorAnoCPA: 1,
  planIdSH: '',
  distanceSH: '' as const,
  modalidadePagamentoSH: '' as const,
  shEquipments: [],
  inicioContratoSH: '',
  fimContratoSH: '',
  horasAssistenciaAnualSH: 0,
  deslocacoesPorAnoSH: 0,
  manutencoesPorAnoSH: 0,
  metodoPagamento: 'TRANSFERENCIA_BANCARIA' as const,
};

/**
 * MI-05: validateContractCreation() single equipment — plan required
 * Validates: Requirements PLANS-AC-016
 */
describe('MI-05: validateContractCreation() single equipment — plan required', () => {
  it('with 1 CPA equipment and NO plan → errors include plan required message', () => {
    const data: ContractCreationData = {
      ...baseValidCPAData,
      cpaEquipments: [{ id: '1', modelo: 'GEST 15', numeroSerie: '123', observacoes: '' }],
      planIdCPA: '',
    };

    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('plano cpa'))).toBe(true);
  });

  it('with 1 CPA equipment and plan selected → no plan error', () => {
    const data: ContractCreationData = {
      ...baseValidCPAData,
      cpaEquipments: [{ id: '1', modelo: 'GEST 15', numeroSerie: '123', observacoes: '' }],
      planIdCPA: 'cpa_essential',
    };

    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('plano cpa'))).toBe(false);
  });

  it('with 1 S&H equipment and NO plan → errors include plan required message', () => {
    const data: ContractCreationData = {
      ...baseValidCPAData,
      hasCPAContract: false,
      hasSHContract: true,
      cpaEquipments: [],
      shEquipments: [{ id: '1', modelo: 'SH Model', numeroSerie: '456', software: '', observacoes: '' }],
      planIdSH: '',
      distanceSH: 'under180km',
      modalidadePagamentoSH: 'MENSAL',
    };

    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('plano s&h') || e.toLowerCase().includes('plano sh'))).toBe(true);
  });

  it('with 1 S&H equipment and plan selected → no plan error', () => {
    const data: ContractCreationData = {
      ...baseValidCPAData,
      hasCPAContract: false,
      hasSHContract: true,
      cpaEquipments: [],
      shEquipments: [{ id: '1', modelo: 'SH Model', numeroSerie: '456', software: '', observacoes: '' }],
      planIdSH: 'sh_essential',
      distanceSH: 'under180km',
      modalidadePagamentoSH: 'MENSAL',
    };

    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('plano s&h') || e.toLowerCase().includes('plano sh'))).toBe(false);
  });
});


/**
 * MI-06: validateContractCreation() multi equipment CPA
 * Validates: Requirements PLANS-AC-017
 */
describe('MI-06: validateContractCreation() multi equipment CPA — price required, parameters required', () => {
  const multiCPABase: ContractCreationData = {
    ...baseValidCPAData,
    cpaEquipments: [
      { id: '1', modelo: 'GEST 15', numeroSerie: '123', observacoes: '' },
      { id: '2', modelo: 'GEST 20', numeroSerie: '456', observacoes: '' },
    ],
  };

  it('with 2+ CPA equipments and NO precoCPA → errors include price required', () => {
    const data: ContractCreationData = {
      ...multiCPABase,
      precoCPA: undefined,
      deslocacoesPorAnoCPA: 2,
      manutencoesPorAnoCPA: 1,
    };

    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('preço') && e.toLowerCase().includes('cpa'))).toBe(true);
  });

  it('with 2+ CPA equipments and NO deslocacoesPorAnoCPA → errors include deslocações required', () => {
    const data: ContractCreationData = {
      ...multiCPABase,
      precoCPA: 100,
      deslocacoesPorAnoCPA: 0,
      manutencoesPorAnoCPA: 1,
    };

    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('deslocações') && e.toLowerCase().includes('cpa'))).toBe(true);
  });

  it('with 2+ CPA equipments and NO manutencoesPorAnoCPA → errors include manutenções required', () => {
    const data: ContractCreationData = {
      ...multiCPABase,
      precoCPA: 100,
      deslocacoesPorAnoCPA: 2,
      manutencoesPorAnoCPA: undefined as unknown as number,
    };

    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('manutenções') && e.toLowerCase().includes('cpa'))).toBe(true);
  });

  it('with 2+ CPA equipments and ALL values provided → no multi-equipment errors', () => {
    const data: ContractCreationData = {
      ...multiCPABase,
      precoCPA: 150,
      deslocacoesPorAnoCPA: 3,
      manutencoesPorAnoCPA: 2,
    };

    const errors = validateContractCreation(data);
    // No price or parameter errors
    expect(errors.some(e => e.toLowerCase().includes('preço') && e.toLowerCase().includes('cpa'))).toBe(false);
    expect(errors.some(e => e.toLowerCase().includes('deslocações') && e.toLowerCase().includes('cpa'))).toBe(false);
    expect(errors.some(e => e.toLowerCase().includes('manutenções') && e.toLowerCase().includes('cpa'))).toBe(false);
  });
});

/**
 * MI-07: validateContractCreation() multi equipment S&H
 * Validates: Requirements PLANS-AC-018
 */
describe('MI-07: validateContractCreation() multi equipment S&H — price required, horas + deslocações required', () => {
  const multiSHBase: ContractCreationData = {
    ...baseValidCPAData,
    hasCPAContract: false,
    hasSHContract: true,
    cpaEquipments: [],
    shEquipments: [
      { id: '1', modelo: 'SH Model A', numeroSerie: '100', software: '', observacoes: '' },
      { id: '2', modelo: 'SH Model B', numeroSerie: '200', software: '', observacoes: '' },
    ],
    planIdSH: 'sh_essential',
    distanceSH: 'under180km',
    modalidadePagamentoSH: 'MENSAL',
  };

  it('with 2+ S&H equipments and NO precoSH → errors include price required', () => {
    const data: ContractCreationData = {
      ...multiSHBase,
      precoSH: undefined,
      horasAssistenciaAnualSH: 10,
      deslocacoesPorAnoSH: 2,
    };

    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('preço') && e.toLowerCase().includes('s&h'))).toBe(true);
  });

  it('with 2+ S&H equipments and NO horasAssistenciaAnualSH → errors include horas required', () => {
    const data: ContractCreationData = {
      ...multiSHBase,
      precoSH: 200,
      horasAssistenciaAnualSH: 0,
      deslocacoesPorAnoSH: 2,
    };

    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('horas') && e.toLowerCase().includes('s&h'))).toBe(true);
  });

  it('with 2+ S&H equipments and NO deslocacoesPorAnoSH → errors include deslocações required', () => {
    const data: ContractCreationData = {
      ...multiSHBase,
      precoSH: 200,
      horasAssistenciaAnualSH: 10,
      deslocacoesPorAnoSH: 0,
    };

    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('deslocações') && e.toLowerCase().includes('s&h'))).toBe(true);
  });

  it('with 2+ S&H equipments and ALL values provided → no multi-equipment errors', () => {
    const data: ContractCreationData = {
      ...multiSHBase,
      precoSH: 200,
      horasAssistenciaAnualSH: 10,
      deslocacoesPorAnoSH: 3,
    };

    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('preço') && e.toLowerCase().includes('s&h'))).toBe(false);
    expect(errors.some(e => e.toLowerCase().includes('horas') && e.toLowerCase().includes('s&h'))).toBe(false);
    expect(errors.some(e => e.toLowerCase().includes('deslocações') && e.toLowerCase().includes('s&h'))).toBe(false);
  });
});

/**
 * MI-08: validateContractCreation() CPA unified — no cpaContractType/distanceCPA validation
 * Validates: Requirements PLANS-AC-019, PLANS-DEC-001
 */
describe('MI-08: validateContractCreation() CPA unified — no cpaContractType/distanceCPA validation', () => {
  it('a valid CPA contract does NOT require cpaContractType field', () => {
    const data: ContractCreationData = {
      ...baseValidCPAData,
    };

    // Should not have any error referencing "tipo de contrato" or "contractType"
    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('tipo de contrato cpa'))).toBe(false);
    expect(errors.some(e => e.toLowerCase().includes('cpacontracttype'))).toBe(false);
  });

  it('a valid CPA contract does NOT require distanceCPA field', () => {
    const data: ContractCreationData = {
      ...baseValidCPAData,
    };

    // Should not have any error referencing "distância" for CPA
    const errors = validateContractCreation(data);
    expect(errors.some(e => e.toLowerCase().includes('distância') && e.toLowerCase().includes('cpa'))).toBe(false);
  });

  it('passing data without cpaContractType/distanceCPA produces no errors related to them', () => {
    const data: ContractCreationData = {
      ...baseValidCPAData,
    };

    const errors = validateContractCreation(data);
    // The base valid data should produce zero errors
    expect(errors.length).toBe(0);
  });
});

/**
 * MI-09: validateContractEquipment() no discount
 * Validates: Requirements PLANS-BR-003
 */
describe('MI-09: validateContractEquipment() no discount — does not validate discount field', () => {
  it('equipment without desconto field passes validation', () => {
    const equipment: ContractEquipment = {
      id: 'eq-1',
      modelo: 'GEST 15',
      numeroSerie: 'SN-001',
      observacoes: '',
    };

    const errors = validateContractEquipment(equipment);
    expect(errors.length).toBe(0);
  });

  it('equipment with only id, modelo, numeroSerie, observacoes is valid', () => {
    const equipment: ContractEquipment = {
      id: 'eq-2',
      modelo: 'GEST 20',
      numeroSerie: 'SN-002',
      observacoes: 'Some notes',
    };

    const errors = validateContractEquipment(equipment);
    expect(errors.length).toBe(0);
  });

  it('no error message contains "desconto" or "discount"', () => {
    // Even with a minimal equipment, no discount-related errors should appear
    const equipment: ContractEquipment = {
      id: 'eq-3',
      modelo: '',
      numeroSerie: '',
      observacoes: '',
    };

    const errors = validateContractEquipment(equipment);
    expect(errors.some(e => e.toLowerCase().includes('desconto'))).toBe(false);
    expect(errors.some(e => e.toLowerCase().includes('discount'))).toBe(false);
  });
});
