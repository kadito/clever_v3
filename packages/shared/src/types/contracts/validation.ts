import type { ContractData, ContractCreationData, ContractUpdateData, ContractEquipment } from './types';

/**
 * Validation functions for contract data
 * Based on analysis of ContratoForm.vue validation logic
 */

/**
 * Validate contract equipment
 */
export function validateContractEquipment(equipment: ContractEquipment): string[] {
  const errors: string[] = [];

  if (!equipment.id) {
    errors.push('ID do equipamento é obrigatório');
  }

  // Model and serial number are optional but should be strings
  if (equipment.modelo && typeof equipment.modelo !== 'string') {
    errors.push('Modelo deve ser um texto');
  }

  if (equipment.numeroSerie && typeof equipment.numeroSerie !== 'string') {
    errors.push('Número de série deve ser um texto');
  }

  // Discount validation
  if (typeof equipment.desconto !== 'number' || equipment.desconto < 0 || equipment.desconto > 100) {
    errors.push('Desconto deve ser um número entre 0 e 100');
  }

  if (equipment.observacoes && typeof equipment.observacoes !== 'string') {
    errors.push('Observações devem ser um texto');
  }

  return errors;
}

/**
 * Validate contract creation data
 */
export function validateContractCreation(data: ContractCreationData): string[] {
  const errors: string[] = [];

  // Basic validation
  if (!data.clientId?.trim()) {
    errors.push('Por favor, selecione um cliente');
  }

  // Must have at least one contract type
  if (!data.hasCPAContract && !data.hasSHContract) {
    errors.push('Por favor, selecione pelo menos um tipo de contrato (CPA e/ou S&H)');
  }

  // CPA Contract validation
  if (data.hasCPAContract) {
    if (!data.cpaContractType) {
      errors.push('Por favor, selecione o tipo de contrato CPA');
    }

    if (!data.planIdCPA) {
      errors.push('Por favor, selecione um plano CPA');
    }

    if (!data.modalidadePagamentoCPA) {
      errors.push('Por favor, selecione a modalidade de pagamento CPA');
    }

    // Distance is only required for CPA (2023), not CPA_1500
    if (data.cpaContractType === 'CPA' && !data.distanceCPA) {
      errors.push('Por favor, selecione a distância para contratos CPA (2023)');
    }

    // Validate CPA equipment
    if (!data.cpaEquipments || data.cpaEquipments.length === 0) {
      errors.push('Por favor, adicione pelo menos um equipamento CPA');
    } else {
      data.cpaEquipments.forEach((equipment, index) => {
        const equipmentErrors = validateContractEquipment(equipment);
        equipmentErrors.forEach(error => {
          errors.push(`Equipamento ${index + 1}: ${error}`);
        });

        // Model is required for CPA equipment
        if (!equipment.modelo?.trim()) {
          errors.push(`Por favor, introduza o modelo do equipamento CPA ${index + 1}`);
        }

        // First equipment should have 0% discount
        if (index === 0 && equipment.desconto !== 0) {
          errors.push('O primeiro equipamento não deve ter desconto aplicado');
        }
      });
    }

    // Date validation
    if (data.inicioContratoCPA && data.fimContratoCPA) {
      const startDate = new Date(data.inicioContratoCPA);
      const endDate = new Date(data.fimContratoCPA);
      if (startDate >= endDate) {
        errors.push('A data de fim do contrato CPA deve ser posterior à data de início');
      }
    }
  }

  // S&H Contract validation
  if (data.hasSHContract) {
    if (!data.planIdSH) {
      errors.push('Por favor, selecione um plano S&H');
    }

    if (!data.distanceSH) {
      errors.push('Por favor, selecione a distância para o contrato S&H');
    }

    if (!data.modalidadePagamentoSH) {
      errors.push('Por favor, selecione a modalidade de pagamento S&H');
    }

    // Validate S&H equipment
    if (!data.shEquipments || data.shEquipments.length === 0) {
      errors.push('Por favor, adicione pelo menos um equipamento S&H');
    } else {
      data.shEquipments.forEach((equipment, index) => {
        if (!equipment.modelo?.trim()) {
          errors.push(`Por favor, introduza o modelo do equipamento S&H ${index + 1}`);
        }
      });
    }

    // Date validation
    if (data.inicioContratoSH && data.fimContratoSH) {
      const startDate = new Date(data.inicioContratoSH);
      const endDate = new Date(data.fimContratoSH);
      if (startDate >= endDate) {
        errors.push('A data de fim do contrato S&H deve ser posterior à data de início');
      }
    }
  }

  // Service details validation
  if (data.hasCPAContract) {
    if (typeof data.horasAssistenciaAnualCPA !== 'number' || data.horasAssistenciaAnualCPA < 0) {
      errors.push('As horas de assistência anual CPA devem ser um número positivo');
    }

    if (typeof data.deslocacoesPorAnoCPA !== 'number' || data.deslocacoesPorAnoCPA < 0) {
      errors.push('As deslocações por ano CPA devem ser um número positivo');
    }

    if (typeof data.manutencoesPorAnoCPA !== 'number' || data.manutencoesPorAnoCPA < 0) {
      errors.push('As manutenções por ano CPA devem ser um número positivo');
    }
  }

  if (data.hasSHContract) {
    if (typeof data.horasAssistenciaAnualSH !== 'number' || data.horasAssistenciaAnualSH < 0) {
      errors.push('As horas de assistência anual S&H devem ser um número positivo');
    }

    if (typeof data.deslocacoesPorAnoSH !== 'number' || data.deslocacoesPorAnoSH < 0) {
      errors.push('As deslocações por ano S&H devem ser um número positivo');
    }

    if (typeof data.manutencoesPorAnoSH !== 'number' || data.manutencoesPorAnoSH < 0) {
      errors.push('As manutenções por ano S&H devem ser um número positivo');
    }
  }

  // Payment method validation (required if any contract is configured)
  if ((data.hasCPAContract || data.hasSHContract) && !data.metodoPagamento) {
    errors.push('Por favor, selecione um método de pagamento');
  }

  return errors;
}

/**
 * Validate contract update data
 */
export function validateContractUpdate(data: ContractUpdateData): string[] {
  const errors: string[] = [];

  // If updating contract types, validate them
  if (data.hasCPAContract !== undefined || data.hasSHContract !== undefined) {
    const hasCPA = data.hasCPAContract ?? false;
    const hasSH = data.hasSHContract ?? false;
    
    if (!hasCPA && !hasSH) {
      errors.push('Deve manter pelo menos um tipo de contrato (CPA e/ou S&H)');
    }
  }

  // CPA Contract validation (if being updated)
  if (data.hasCPAContract) {
    if (data.cpaContractType !== undefined && !data.cpaContractType) {
      errors.push('Tipo de contrato CPA é obrigatório');
    }

    if (data.planIdCPA !== undefined && !data.planIdCPA) {
      errors.push('Plano CPA é obrigatório');
    }

    if (data.modalidadePagamentoCPA !== undefined && !data.modalidadePagamentoCPA) {
      errors.push('Modalidade de pagamento CPA é obrigatória');
    }

    // Distance validation for CPA (2023)
    if (data.cpaContractType === 'CPA' && data.distanceCPA !== undefined && !data.distanceCPA) {
      errors.push('Distância é obrigatória para contratos CPA (2023)');
    }

    // Validate CPA equipment if provided
    if (data.cpaEquipments) {
      if (data.cpaEquipments.length === 0) {
        errors.push('Pelo menos um equipamento CPA deve ser mantido');
      } else {
        data.cpaEquipments.forEach((equipment, index) => {
          const equipmentErrors = validateContractEquipment(equipment);
          equipmentErrors.forEach(error => {
            errors.push(`Equipamento ${index + 1}: ${error}`);
          });

          // Model is required for CPA equipment
          if (!equipment.modelo?.trim()) {
            errors.push(`Modelo do equipamento CPA ${index + 1} é obrigatório`);
          }

          // First equipment should have 0% discount
          if (index === 0 && equipment.desconto !== 0) {
            errors.push('O primeiro equipamento não deve ter desconto');
          }
        });
      }
    }

    // Date validation
    if (data.inicioContratoCPA && data.fimContratoCPA) {
      const startDate = new Date(data.inicioContratoCPA);
      const endDate = new Date(data.fimContratoCPA);
      if (startDate >= endDate) {
        errors.push('Data de fim do contrato CPA deve ser posterior à data de início');
      }
    }
  }

  // S&H Contract validation (if being updated)
  if (data.hasSHContract) {
    if (data.planIdSH !== undefined && !data.planIdSH) {
      errors.push('Plano S&H é obrigatório');
    }

    if (data.distanceSH !== undefined && !data.distanceSH) {
      errors.push('Distância S&H é obrigatória');
    }

    if (data.modalidadePagamentoSH !== undefined && !data.modalidadePagamentoSH) {
      errors.push('Modalidade de pagamento S&H é obrigatória');
    }

    // Validate S&H equipment if provided
    if (data.shEquipments) {
      if (data.shEquipments.length === 0) {
        errors.push('Pelo menos um equipamento S&H deve ser mantido');
      } else {
        data.shEquipments.forEach((equipment, index) => {
          if (!equipment.modelo?.trim()) {
            errors.push(`Modelo do equipamento S&H ${index + 1} é obrigatório`);
          }
        });
      }
    }

    // Date validation
    if (data.inicioContratoSH && data.fimContratoSH) {
      const startDate = new Date(data.inicioContratoSH);
      const endDate = new Date(data.fimContratoSH);
      if (startDate >= endDate) {
        errors.push('Data de fim do contrato S&H deve ser posterior à data de início');
      }
    }
  }

  // Service details validation (if provided)
  if (data.hasCPAContract) {
    if (data.horasAssistenciaAnualCPA !== undefined) {
      if (typeof data.horasAssistenciaAnualCPA !== 'number' || data.horasAssistenciaAnualCPA < 0) {
        errors.push('Horas de assistência anual CPA deve ser um número positivo');
      }
    }

    if (data.deslocacoesPorAnoCPA !== undefined) {
      if (typeof data.deslocacoesPorAnoCPA !== 'number' || data.deslocacoesPorAnoCPA < 0) {
        errors.push('Deslocações por ano CPA deve ser um número positivo');
      }
    }

    if (data.manutencoesPorAnoCPA !== undefined) {
      if (typeof data.manutencoesPorAnoCPA !== 'number' || data.manutencoesPorAnoCPA < 0) {
        errors.push('Manutenções por ano CPA deve ser um número positivo');
      }
    }
  }

  if (data.hasSHContract) {
    if (data.horasAssistenciaAnualSH !== undefined) {
      if (typeof data.horasAssistenciaAnualSH !== 'number' || data.horasAssistenciaAnualSH < 0) {
        errors.push('Horas de assistência anual S&H deve ser um número positivo');
      }
    }

    if (data.deslocacoesPorAnoSH !== undefined) {
      if (typeof data.deslocacoesPorAnoSH !== 'number' || data.deslocacoesPorAnoSH < 0) {
        errors.push('Deslocações por ano S&H deve ser um número positivo');
      }
    }

    if (data.manutencoesPorAnoSH !== undefined) {
      if (typeof data.manutencoesPorAnoSH !== 'number' || data.manutencoesPorAnoSH < 0) {
        errors.push('Manutenções por ano S&H deve ser um número positivo');
      }
    }
  }

  return errors;
}

/**
 * Validate contract data for display
 */
export function validateContractForDisplay(data: ContractData): string[] {
  const errors: string[] = [];

  if (!data.clientId) {
    errors.push('ID do cliente é obrigatório para exibição');
  }

  if (!data.clienteName) {
    errors.push('Nome do cliente é obrigatório para exibição');
  }

  return errors;
}

/**
 * Check if contract has active periods
 */
export function hasActiveContract(data: ContractData): boolean {
  const now = new Date();
  
  // Check CPA contract
  if (data.hasCPAContract) {
    if (data.inicioContratoCPA && data.fimContratoCPA) {
      const startDate = new Date(data.inicioContratoCPA);
      const endDate = new Date(data.fimContratoCPA);
      if (now >= startDate && now <= endDate) {
        return true;
      }
    } else if (data.inicioContratoCPA && !data.fimContratoCPA) {
      // Contract started but no end date = active
      const startDate = new Date(data.inicioContratoCPA);
      if (now >= startDate) {
        return true;
      }
    }
  }

  // Check S&H contract
  if (data.hasSHContract) {
    if (data.inicioContratoSH && data.fimContratoSH) {
      const startDate = new Date(data.inicioContratoSH);
      const endDate = new Date(data.fimContratoSH);
      if (now >= startDate && now <= endDate) {
        return true;
      }
    } else if (data.inicioContratoSH && !data.fimContratoSH) {
      // Contract started but no end date = active
      const startDate = new Date(data.inicioContratoSH);
      if (now >= startDate) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get contract display summary
 */
export function getContractSummary(data: ContractData): {
  contractTypes: string[];
  planNames: string[];
  paymentMethods: string[];
  startDate: string | null;
  endDate: string | null;
} {
  const contractTypes: string[] = [];
  const planNames: string[] = [];
  const paymentMethods: string[] = [];
  const dates: Date[] = [];
  const endDates: Date[] = [];

  if (data.hasCPAContract) {
    contractTypes.push('CPA');
    if (data.planIdCPA) {
      planNames.push(data.planIdCPA);
    }
    if (data.modalidadePagamentoCPA) {
      paymentMethods.push(data.modalidadePagamentoCPA);
    }
    if (data.inicioContratoCPA) {
      dates.push(new Date(data.inicioContratoCPA));
    }
    if (data.fimContratoCPA) {
      endDates.push(new Date(data.fimContratoCPA));
    }
  }

  if (data.hasSHContract) {
    contractTypes.push('S&H');
    if (data.planIdSH) {
      planNames.push(data.planIdSH);
    }
    if (data.modalidadePagamentoSH) {
      paymentMethods.push(data.modalidadePagamentoSH);
    }
    if (data.inicioContratoSH) {
      dates.push(new Date(data.inicioContratoSH));
    }
    if (data.fimContratoSH) {
      endDates.push(new Date(data.fimContratoSH));
    }
  }

  // Get earliest start date and latest end date
  const startDate = dates.length > 0 ? 
    new Date(Math.min(...dates.map(d => d.getTime()))).toISOString() : null;
  const endDate = endDates.length > 0 ? 
    new Date(Math.max(...endDates.map(d => d.getTime()))).toISOString() : null;

  return {
    contractTypes,
    planNames,
    paymentMethods,
    startDate,
    endDate
  };
}