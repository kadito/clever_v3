import type {
  WorkSheetData,
  WorkSheetCreationData,
  WorkSheetUpdateData,
  WorkSheetDisplayData,
  WorkSheet,
} from './types';
import { WORK_SHEET_CONSTANTS } from './types';

/**
 * Input for the unified work sheet pricing calculation.
 */
export interface WorkSheetPricingInput {
  weekendHoliday: boolean;
  hasDisplacement: boolean;
  totalKms: number;
  arrivalTime: string;   // HH:MM format
  departureTime: string; // HH:MM format
}

/**
 * Result of the unified work sheet pricing calculation.
 */
export interface WorkSheetPricingResult {
  hourlyRate: number;
  laborHours: number;       // actual chargeable hours (minimum 1h applied)
  laborPrice: number;
  hasDisplacement: boolean;
  travelFee: number;        // 0 if no displacement
  mileagePrice: number;     // 0 if no displacement
  totalKms: number;
  totalPrice: number;       // laborPrice + travelFee + mileagePrice (only displacement costs when hasDisplacement)
}

/**
 * Calculates work sheet pricing using centralized constants.
 * Single source of truth for all views and backend extraction.
 */
export function calculateWorkSheetPricing(input: WorkSheetPricingInput): WorkSheetPricingResult {
  const { weekendHoliday, hasDisplacement, arrivalTime, departureTime } = input;
  const totalKms = input.totalKms < 0 ? 0 : input.totalKms;

  const hourlyRate = weekendHoliday
    ? WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKEND_HOLIDAY
    : WORK_SHEET_CONSTANTS.HOURLY_RATE_WEEKDAY;

  const zeroed: WorkSheetPricingResult = {
    hourlyRate,
    laborHours: 0,
    laborPrice: 0,
    hasDisplacement,
    travelFee: 0,
    mileagePrice: 0,
    totalKms,
    totalPrice: 0,
  };

  // Parse and validate times
  const arrivalMinutes = parseTimeToMinutes(arrivalTime);
  const departureMinutes = parseTimeToMinutes(departureTime);

  if (arrivalMinutes === null || departureMinutes === null) {
    return zeroed;
  }

  // Calculate duration in minutes, handle overnight wrap-around
  let durationMinutes = departureMinutes - arrivalMinutes;
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }

  // Duration exactly 0 → zeroed result
  if (durationMinutes === 0) {
    return zeroed;
  }

  // Apply minimum 1 hour rule
  const durationHours = durationMinutes / 60;
  const laborHours = durationHours < WORK_SHEET_CONSTANTS.MINIMUM_HOURS
    ? WORK_SHEET_CONSTANTS.MINIMUM_HOURS
    : durationHours;

  const laborPrice = Math.round(laborHours * hourlyRate * 100) / 100;

  // Displacement costs
  let travelFee = 0;
  let mileagePrice = 0;

  if (hasDisplacement) {
    mileagePrice = Math.round(totalKms * WORK_SHEET_CONSTANTS.MILEAGE_RATE_PER_KM * 100) / 100;
    travelFee = totalKms > WORK_SHEET_CONSTANTS.TRAVEL_FEE_THRESHOLD_KM
      ? WORK_SHEET_CONSTANTS.TRAVEL_FEE_LONG
      : WORK_SHEET_CONSTANTS.TRAVEL_FEE_SHORT;
  }

  const totalPrice = Math.round((laborPrice + travelFee + mileagePrice) * 100) / 100;

  return {
    hourlyRate,
    laborHours,
    laborPrice,
    hasDisplacement,
    travelFee,
    mileagePrice,
    totalKms,
    totalPrice,
  };
}

/**
 * Parses a time string in HH:MM format to minutes from midnight.
 * Returns null if the format is invalid or the string is empty.
 */
function parseTimeToMinutes(time: string): number | null {
  if (!time || typeof time !== 'string') return null;
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

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

  // Note: Technician field is automatically assigned by backend based on authenticated user
  // No need to validate this field during creation as it will be populated by auto-assignment

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
  const validPaymentMethods = [
    'PENDENTE',
    'CARTÃO MB',
    'DINHEIRO',
    'TRANSFERÊNCIA BANCÁRIA',
    'CONTRATO',
    'GARANTIA',
  ];
  if (
    data.displacement?.paymentMethod &&
    !validPaymentMethods.includes(data.displacement.paymentMethod)
  ) {
    errors.push('Método de pagamento inválido');
  }

  // Contract validation
  if (data.displacement?.paymentMethod === 'CONTRATO') {
    if (!data.contractId) {
      errors.push('O contrato é obrigatório quando o método de pagamento é CONTRATO');
    } else if (!isValidUUID(data.contractId)) {
      errors.push('O ID do contrato deve ser um UUID válido');
    }
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
    errors.push(
      'Observações sobre problemas não resolvidos são obrigatórias quando o serviço não está totalmente resolvido'
    );
  }

  // Technical operations validation - all must be completed before saving
  if (!data.otherData?.dumpReading) {
    errors.push('Leitura de Dump é obrigatória');
  }
  if (!data.otherData?.backup) {
    errors.push('Cópia de Segurança é obrigatória');
  }
  if (!data.otherData?.remoteAccessCheck) {
    errors.push('Verificação do Acesso Remoto é obrigatória');
  }
  if (!data.otherData?.anydesk) {
    errors.push('AnyDesk é obrigatório');
  }

  // Service report validation
  if (!data.otherData?.serviceReport?.trim()) {
    errors.push('Descrição detalhada do serviço é obrigatória');
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

  // Note: Technician field is automatically assigned by backend based on authenticated user
  // No need to validate this field during updates as it will be populated by auto-assignment

  // Time format validation if provided
  if (
    data.request?.arrivalTime !== undefined &&
    data.request.arrivalTime &&
    !isValidTimeFormat(data.request.arrivalTime)
  ) {
    errors.push('Hora de chegada deve estar no formato HH:MM');
  }

  if (
    data.request?.departureTime !== undefined &&
    data.request.departureTime &&
    !isValidTimeFormat(data.request.departureTime)
  ) {
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
      technician: workSheet.data.otherData?.technician 
        ? `${workSheet.data.otherData.technician.firstName} ${workSheet.data.otherData.technician.lastName}` 
        : 'Não especificado',
      assistanceDate: workSheet.data.request?.assistanceDate || '',
      totalHours: workSheet.data.request?.totalHours || '0:00',
      hasDisplacement: workSheet.data.displacement?.hasDisplacement || false,
      totallyResolved: workSheet.data.otherData?.totallyResolved || false,
      paymentMethod: workSheet.data.displacement?.paymentMethod || 'PENDENTE',
      createdAt: workSheet.createdAt,
      updatedAt: workSheet.updatedAt,
    };
  } catch (error) {
    console.error('Error validating work sheet for display:', error);
    return null;
  }
}

/**
 * Calculates work sheet totals (hours, pricing, etc.)
 * Based on legacy pricing calculation methods
 *
 * @deprecated Use `calculateWorkSheetPricing()` instead. This function uses outdated
 * hardcoded rates (€45/€60 hourly, €40/€55 displacement). Still referenced by
 * `packages/shared/src/balance-extraction.ts` — remove once balance extraction is migrated.
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
    totalPrice: 0,
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
        const hours = Math.floor(diff / 3600000)
          .toString()
          .padStart(2, '0');
        const minutes = Math.floor((diff % 3600000) / 60000)
          .toString()
          .padStart(2, '0');
        result.totalHours = `${hours}:${minutes}`;
      }
    }
  }

  // Calculate pricing if displacement is enabled
  if (data.displacement?.hasDisplacement) {
    const totalKms = data.displacement.totalKms || 0;

    // Displacement rate based on total km
    result.displacementRate = totalKms > 180 ? 55 : 40;

    // KMs price = 0.45€ per km × total km
    result.kmsPrice = Math.round(0.45 * totalKms * 100) / 100;

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
    result.totalPrice =
      Math.round((result.displacementRate + result.kmsPrice + result.laborPrice) * 100) / 100;
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

/**
 * Helper function for UUID validation
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
