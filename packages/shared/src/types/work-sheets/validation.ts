import type { 
  WorkSheetData, 
  WorkSheetCreationData, 
  WorkSheetUpdateData,
  WorkSheetDisplayData,
  WorkSheet
} from './types';

/**
 * Validates work sheet data for creation
 * Based on analysis of legacy form validation rules
 */
export function validateWorkSheetCreation(data: WorkSheetCreationData): string[] {
  const errors: string[] = [];

  // Required fields validation
  if (!data.clientId?.trim()) {
    errors.push('Cliente é obrigatório');
  }

  if (!data.request?.assistanceDate?.trim()) {
    errors.push('Data da assistência é obrigatória');
  }

  if (!data.otherData?.technician?.trim()) {
    errors.push('Técnico responsável é obrigatório');
  }

  // Date validation
  if (data.request?.assistanceDate) {
    const assistanceDate = new Date(data.request.assistanceDate);
    if (isNaN(assistanceDate.getTime())) {
      errors.push('Data da assistência deve ser uma data válida');
    }
  }

  if (data.request?.date) {
    const requestDate = new Date(data.request.date);
    if (isNaN(requestDate.getTime())) {
      errors.push('Data do pedido deve ser uma data válida');
    }
  }

  // Time format validation
  if (data.request?.arrivalTime && !isValidTimeFormat(data.request.arrivalTime)) {
    errors.push('Hora de chegada deve estar no formato HH:MM');
  }

  if (data.request?.departureTime && !isValidTimeFormat(data.request.departureTime)) {
    errors.push('Hora de saída deve estar no formato HH:MM');
  }

  // Displacement validation
  if (data.displacement?.hasDisplacement) {
    if (typeof data.displacement.oneWayKms !== 'number' || data.displacement.oneWayKms < 0) {
      errors.push('Quilómetros de ida deve ser um número positivo');
    }
  }

  // Payment method validation
  const validPaymentMethods = ['PENDENTE', 'CARTÃO MB', 'DINHEIRO', 'TRANSFERÊNCIA BANCÁRIA', 'CONTRATO'];
  if (data.displacement?.paymentMethod && !validPaymentMethods.includes(data.displacement.paymentMethod)) {
    errors.push('Método de pagamento inválido');
  }

  // Service type validation
  const validServiceTypes = ['ASSISTÊNCIA PRESENCIAL', 'MANUTENÇÃO', 'INSTALAÇÃO', ''];
  if (data.otherData?.serviceType && !validServiceTypes.includes(data.otherData.serviceType)) {
    errors.push('Tipo de serviço inválido');
  }

  // Conditional field validation
  if (data.displacement?.paymentMethod === 'CONTRATO') {
    if (!data.otherData?.contractYear?.trim()) {
      errors.push('Ano de contrato é obrigatório quando método de pagamento é CONTRATO');
    }
  }

  if (data.otherData?.materialUsed && !data.otherData?.materialDetails?.trim()) {
    errors.push('Descrição do material é obrigatória quando material utilizado está marcado');
  }

  if (data.otherData?.equipment && !data.otherData?.equipmentDetails?.trim()) {
    errors.push('Descrição dos equipamentos é obrigatória quando equipamentos está marcado');
  }

  if (!data.otherData?.totallyResolved && !data.otherData?.resolutionIssues?.trim()) {
    errors.push('Observações sobre problemas não resolvidos são obrigatórias quando o serviço não está totalmente resolvido');
  }

  return errors;
}

/**
 * Validates work sheet data for updates
 * More lenient validation for partial updates
 */
export function validateWorkSheetUpdate(data: WorkSheetUpdateData): string[] {
  const errors: string[] = [];

  // Only validate fields that are present
  if (data.request?.assistanceDate !== undefined) {
    if (!data.request.assistanceDate.trim()) {
      errors.push('Data da assistência não pode estar vazia');
    } else {
      const assistanceDate = new Date(data.request.assistanceDate);
      if (isNaN(assistanceDate.getTime())) {
        errors.push('Data da assistência deve ser uma data válida');
      }
    }
  }

  if (data.otherData?.technician !== undefined && !data.otherData.technician.trim()) {
    errors.push('Técnico responsável não pode estar vazio');
  }

  // Time format validation if provided
  if (data.request?.arrivalTime !== undefined && data.request.arrivalTime && !isValidTimeFormat(data.request.arrivalTime)) {
    errors.push('Hora de chegada deve estar no formato HH:MM');
  }

  if (data.request?.departureTime !== undefined && data.request.departureTime && !isValidTimeFormat(data.request.departureTime)) {
    errors.push('Hora de saída deve estar no formato HH:MM');
  }

  // Displacement validation if provided
  if (data.displacement?.hasDisplacement && data.displacement?.oneWayKms !== undefined) {
    if (typeof data.displacement.oneWayKms !== 'number' || data.displacement.oneWayKms < 0) {
      errors.push('Quilómetros de ida deve ser um número positivo');
    }
  }

  return errors;
}

/**
 * Validates work sheet data for display purposes
 * Ensures all required display fields are present
 */
export function validateWorkSheetForDisplay(workSheet: WorkSheet): WorkSheetDisplayData | null {
  if (!workSheet.data) return null;

  try {
    return {
      uuid: workSheet.uuid,
      clientName: 'Cliente não especificado', // Will be resolved from relations
      serviceType: workSheet.data.otherData?.serviceType || 'Não especificado',
      technician: workSheet.data.otherData?.technician || 'Não especificado',
      assistanceDate: workSheet.data.request?.assistanceDate || '',
      totalHours: workSheet.data.request?.totalHours || '0:00',
      hasDisplacement: workSheet.data.displacement?.hasDisplacement || false,
      totallyResolved: workSheet.data.otherData?.totallyResolved || false,
      paymentMethod: workSheet.data.displacement?.paymentMethod || 'PENDENTE',
      createdAt: workSheet.createdAt,
      updatedAt: workSheet.updatedAt
    };
  } catch (error) {
    console.error('Error validating work sheet for display:', error);
    return null;
  }
}

/**
 * Calculates work sheet totals (hours, pricing, etc.)
 * Based on legacy pricing calculation methods
 */
export function calculateWorkSheetTotals(data: WorkSheetData): {
  totalHours: string;
  displacementRate: number;
  kmsPrice: number;
  hourlyRate: number;
  laborPrice: number;
  totalPrice: number;
} {
  const result = {
    totalHours: '0:00',
    displacementRate: 0,
    kmsPrice: 0,
    hourlyRate: 0,
    laborPrice: 0,
    totalPrice: 0
  };

  // Calculate total hours
  if (data.request?.arrivalTime && data.request?.departureTime) {
    const arrivalMatch = data.request.arrivalTime.match(/^(\d{1,2}):(\d{1,2})$/);
    const departureMatch = data.request.departureTime.match(/^(\d{1,2}):(\d{1,2})$/);
    
    if (arrivalMatch && departureMatch) {
      const arrivalHours = parseInt(arrivalMatch[1]);
      const arrivalMinutes = parseInt(arrivalMatch[2]);
      const departureHours = parseInt(departureMatch[1]);
      const departureMinutes = parseInt(departureMatch[2]);
      
      const arrival = new Date(2000, 0, 1, arrivalHours, arrivalMinutes);
      const departure = new Date(2000, 0, 1, departureHours, departureMinutes);
      
      if (departure >= arrival) {
        const diff = departure.getTime() - arrival.getTime();
        const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        result.totalHours = `${hours}:${minutes}`;
      }
    }
  }

  // Calculate pricing if displacement is enabled
  if (data.displacement?.hasDisplacement) {
    const totalKms = data.displacement.totalKms || 0;
    
    // Displacement rate based on total km
    result.displacementRate = totalKms > 180 ? 50 : 35;
    
    // KMs price = 0.4€ per km × total km
    result.kmsPrice = Math.round(0.4 * totalKms * 100) / 100;
    
    // Hourly rate based on weekend/holiday
    result.hourlyRate = data.displacement.weekendHoliday ? 60 : 45;
    
    // Labor price calculation
    if (data.request?.arrivalTime && data.request?.departureTime) {
      const [arrivalHours, arrivalMinutes] = data.request.arrivalTime.split(':').map(Number);
      const [departureHours, departureMinutes] = data.request.departureTime.split(':').map(Number);
      
      const arrivalTotalMinutes = arrivalHours * 60 + arrivalMinutes;
      const departureTotalMinutes = departureHours * 60 + departureMinutes;
      
      let diffMinutes = departureTotalMinutes - arrivalTotalMinutes;
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60; // Handle next day
      }
      
      const totalHours = diffMinutes / 60;
      const chargeableHours = totalHours < 1 ? 1 : totalHours; // Minimum 1 hour
      
      result.laborPrice = Math.round(chargeableHours * result.hourlyRate * 100) / 100;
    }
    
    // Total price
    result.totalPrice = Math.round((result.displacementRate + result.kmsPrice + result.laborPrice) * 100) / 100;
  }

  return result;
}

/**
 * Gets a summary of the work sheet for display purposes
 */
export function getWorkSheetSummary(workSheet: WorkSheet): string {
  const data = workSheet.data;
  const clientName = 'Cliente não especificado'; // Will be resolved from relations
  const serviceType = data.otherData?.serviceType || 'Serviço';
  const date = data.request?.assistanceDate || '';
  
  if (date) {
    const formattedDate = new Date(date).toLocaleDateString('pt-PT');
    return `${serviceType} - ${clientName} (${formattedDate})`;
  }
  
  return `${serviceType} - ${clientName}`;
}

/**
 * Helper function to validate time format (HH:MM)
 */
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}