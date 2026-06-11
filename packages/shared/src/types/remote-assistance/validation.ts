import type {
  RemoteAssistanceData,
  RemoteAssistanceCreationData,
  RemoteAssistanceUpdateData,
  TimeValidationResult,
  ValidMinute,
} from './types.js';
import { REMOTE_ASSISTANCE_CONSTANTS } from './types.js';

// Re-export constants for convenience
export { REMOTE_ASSISTANCE_CONSTANTS };

// ─── Split Billing Interfaces ────────────────────────────────────────────────

/**
 * Input for the unified remote assistance pricing calculation.
 */
export interface RemoteAssistancePricingInput {
  startTime: string;         // HH:MM format
  endTime: string;           // HH:MM format
  isWeekendOrHoliday: boolean;
  paymentMethod?: 'Contrato' | 'Faturação' | 'Garantia' | '';
}

/**
 * Result of the unified remote assistance pricing calculation with split billing.
 */
export interface RemoteAssistancePricingResult {
  totalValue: number;
  businessHoursValue: number;
  offHoursValue: number;
  totalMinutes: number;          // raw duration
  billingMinutes: number;        // rounded up to 15-min increments
  businessMinutes: number;       // minutes in business hours windows
  offHoursMinutes: number;       // minutes outside business hours
  isZeroCost: boolean;           // true when Contrato or Garantia
  breakdown: TimeSegment[];
}

/**
 * A time segment within a remote assistance session, classified by rate.
 */
export interface TimeSegment {
  startMinute: number;   // minutes from midnight
  endMinute: number;     // minutes from midnight
  isBusinessHours: boolean;
  rate: number;
  minutes: number;
  value: number;
}

// ─── Split Billing Implementation ───────────────────────────────────────────

/**
 * Boundary points for business hours windows (minutes from midnight).
 * 09:00, 12:30, 14:30, 18:00
 */
const BOUNDARIES = [540, 750, 870, 1080] as const;

/**
 * Determines if a minute from midnight falls within business hours.
 * Business hours: 09:00-12:30 (540-750) or 14:30-18:00 (870-1080).
 */
function isMinuteBusinessHours(m: number): boolean {
  return (
    (m >= REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_MORNING_START &&
      m < REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_MORNING_END) ||
    (m >= REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_AFTERNOON_START &&
      m < REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_AFTERNOON_END)
  );
}

/**
 * Parses a time string in HH:MM format to minutes from midnight.
 * Returns null if the format is invalid or the string is empty.
 */
function parseTimeToMinutesRA(time: string): number | null {
  if (!time || typeof time !== 'string') return null;
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Returns a zeroed pricing result.
 */
function zeroPricingResult(isZeroCost: boolean = false): RemoteAssistancePricingResult {
  return {
    totalValue: 0,
    businessHoursValue: 0,
    offHoursValue: 0,
    totalMinutes: 0,
    billingMinutes: 0,
    businessMinutes: 0,
    offHoursMinutes: 0,
    isZeroCost,
    breakdown: [],
  };
}

/**
 * Calculates remote assistance pricing with minute-level split billing.
 *
 * Algorithm:
 * 1. If paymentMethod is Contrato or Garantia → zero-cost result
 * 2. If isWeekendOrHoliday → entire duration at off-hours rate €60/h
 * 3. Otherwise: split session into segments by boundary crossings (09:00, 12:30, 14:30, 18:00)
 * 4. Round TOTAL duration up to 15-min ceiling, distribute proportionally across segments
 * 5. Calculate value per segment: minutes/60 × rate
 *
 * Covers: PRICE-AC-006, PRICE-AC-007, PRICE-AC-008, PRICE-AC-009, PRICE-AC-011,
 *         PRICE-BR-006, PRICE-BR-007, PRICE-BR-008, PRICE-BR-009, PRICE-BR-010, PRICE-BR-012
 */
export function calculateRemoteAssistancePricing(
  input: RemoteAssistancePricingInput
): RemoteAssistancePricingResult {
  const { startTime, endTime, isWeekendOrHoliday, paymentMethod } = input;

  // 1. Contract/Warranty → zero-cost
  if (paymentMethod === 'Contrato' || paymentMethod === 'Garantia') {
    return zeroPricingResult(true);
  }

  // Validate inputs
  const startMinutes = parseTimeToMinutesRA(startTime);
  const endMinutes = parseTimeToMinutesRA(endTime);

  if (startMinutes === null || endMinutes === null) {
    return zeroPricingResult();
  }

  // Calculate raw duration handling overnight wrap-around
  let totalMinutes: number;
  if (endMinutes > startMinutes) {
    totalMinutes = endMinutes - startMinutes;
  } else if (endMinutes < startMinutes) {
    // Overnight: add 24h to end
    totalMinutes = (endMinutes + 24 * 60) - startMinutes;
  } else {
    // Duration exactly 0
    return zeroPricingResult();
  }

  // Round total up to 15-min ceiling
  const billingMinutes = Math.ceil(totalMinutes / REMOTE_ASSISTANCE_CONSTANTS.BILLING_INCREMENT_MINUTES)
    * REMOTE_ASSISTANCE_CONSTANTS.BILLING_INCREMENT_MINUTES;

  // 2. Weekend/Holiday → entire duration at off-hours rate
  if (isWeekendOrHoliday) {
    const rate = REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS;
    const value = Math.round((billingMinutes / 60) * rate * 100) / 100;
    return {
      totalValue: value,
      businessHoursValue: 0,
      offHoursValue: value,
      totalMinutes,
      billingMinutes,
      businessMinutes: 0,
      offHoursMinutes: billingMinutes,
      isZeroCost: false,
      breakdown: [{
        startMinute: startMinutes,
        endMinute: endMinutes <= startMinutes ? endMinutes + 24 * 60 : endMinutes,
        isBusinessHours: false,
        rate,
        minutes: billingMinutes,
        value,
      }],
    };
  }

  // 3. Weekday: split session into segments by boundary crossings
  const effectiveEnd = endMinutes <= startMinutes ? endMinutes + 24 * 60 : endMinutes;

  // Collect boundaries between start and end (including next-day boundaries for overnight)
  const splitPoints: number[] = [];
  // First pass: boundaries as-is
  for (const b of BOUNDARIES) {
    if (b > startMinutes && b < effectiveEnd) {
      splitPoints.push(b);
    }
  }
  // Second pass: boundaries + 24h for overnight sessions
  if (effectiveEnd > 24 * 60) {
    for (const b of BOUNDARIES) {
      const shifted = b + 24 * 60;
      if (shifted > startMinutes && shifted < effectiveEnd) {
        splitPoints.push(shifted);
      }
    }
  }

  // Sort and deduplicate
  splitPoints.sort((a, b) => a - b);

  // Create segment boundaries
  const segmentBounds: Array<[number, number]> = [];
  let prev = startMinutes;
  for (const sp of splitPoints) {
    segmentBounds.push([prev, sp]);
    prev = sp;
  }
  segmentBounds.push([prev, effectiveEnd]);

  // Calculate raw minutes per classification (business vs off-hours)
  let rawBusinessMinutes = 0;
  let rawOffHoursMinutes = 0;

  interface RawSegment {
    startMinute: number;
    endMinute: number;
    isBusinessHours: boolean;
    rawMinutes: number;
  }

  const rawSegments: RawSegment[] = [];

  for (const [segStart, segEnd] of segmentBounds) {
    const segMinutes = segEnd - segStart;
    // Classify using the start minute of the segment (mod 1440 for overnight)
    const classificationMinute = segStart % (24 * 60);
    const isBusiness = isMinuteBusinessHours(classificationMinute);

    rawSegments.push({
      startMinute: segStart,
      endMinute: segEnd,
      isBusinessHours: isBusiness,
      rawMinutes: segMinutes,
    });

    if (isBusiness) {
      rawBusinessMinutes += segMinutes;
    } else {
      rawOffHoursMinutes += segMinutes;
    }
  }

  // 4. Distribute billing minutes proportionally across segments
  const rawTotal = rawBusinessMinutes + rawOffHoursMinutes; // should equal totalMinutes

  // Proportional distribution: each segment gets (rawMinutes / rawTotal) * billingMinutes
  // Use integer distribution to avoid floating point drift
  let distributedBusinessMinutes = 0;
  let distributedOffHoursMinutes = 0;

  if (rawTotal > 0) {
    distributedBusinessMinutes = Math.round((rawBusinessMinutes / rawTotal) * billingMinutes);
    distributedOffHoursMinutes = billingMinutes - distributedBusinessMinutes;
  }

  // Build breakdown segments with proportional billing minutes
  const breakdown: TimeSegment[] = [];
  let remainingBusinessBilling = distributedBusinessMinutes;
  let remainingOffHoursBilling = distributedOffHoursMinutes;

  for (const seg of rawSegments) {
    let segBillingMinutes: number;

    if (seg.isBusinessHours) {
      if (rawBusinessMinutes > 0) {
        segBillingMinutes = Math.round((seg.rawMinutes / rawBusinessMinutes) * distributedBusinessMinutes);
        // Clamp to remaining to handle rounding
        segBillingMinutes = Math.min(segBillingMinutes, remainingBusinessBilling);
        remainingBusinessBilling -= segBillingMinutes;
      } else {
        segBillingMinutes = 0;
      }
    } else {
      if (rawOffHoursMinutes > 0) {
        segBillingMinutes = Math.round((seg.rawMinutes / rawOffHoursMinutes) * distributedOffHoursMinutes);
        segBillingMinutes = Math.min(segBillingMinutes, remainingOffHoursBilling);
        remainingOffHoursBilling -= segBillingMinutes;
      } else {
        segBillingMinutes = 0;
      }
    }

    const rate = seg.isBusinessHours
      ? REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS
      : REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS;

    const value = Math.round((segBillingMinutes / 60) * rate * 100) / 100;

    breakdown.push({
      startMinute: seg.startMinute % (24 * 60),
      endMinute: seg.endMinute % (24 * 60),
      isBusinessHours: seg.isBusinessHours,
      rate,
      minutes: segBillingMinutes,
      value,
    });
  }

  // Distribute any remaining rounding leftovers to the last segment of that type
  if (remainingBusinessBilling > 0) {
    const lastBiz = breakdown.filter(s => s.isBusinessHours).pop();
    if (lastBiz) {
      lastBiz.minutes += remainingBusinessBilling;
      lastBiz.value = Math.round((lastBiz.minutes / 60) * lastBiz.rate * 100) / 100;
    }
  }
  if (remainingOffHoursBilling > 0) {
    const lastOff = breakdown.filter(s => !s.isBusinessHours).pop();
    if (lastOff) {
      lastOff.minutes += remainingOffHoursBilling;
      lastOff.value = Math.round((lastOff.minutes / 60) * lastOff.rate * 100) / 100;
    }
  }

  // 5. Sum values
  const businessHoursValue = breakdown
    .filter(s => s.isBusinessHours)
    .reduce((sum, s) => sum + s.value, 0);
  const offHoursValue = breakdown
    .filter(s => !s.isBusinessHours)
    .reduce((sum, s) => sum + s.value, 0);
  const totalValue = Math.round((businessHoursValue + offHoursValue) * 100) / 100;

  return {
    totalValue,
    businessHoursValue: Math.round(businessHoursValue * 100) / 100,
    offHoursValue: Math.round(offHoursValue * 100) / 100,
    totalMinutes,
    billingMinutes,
    businessMinutes: distributedBusinessMinutes,
    offHoursMinutes: distributedOffHoursMinutes,
    isZeroCost: false,
    breakdown,
  };
}

/**
 * Validation functions for remote assistance data
 * Based on analysis of AssistenciasRemotasForm.vue validation logic
 *
 * Requirements: 7.3, 7.4, 7.5
 */

/**
 * Validate time format and round to nearest 15-minute interval
 * Always rounds UP to the next valid minute (00, 15, 30, 45)
 */
export function validateAndFormatTime(timeString: string): TimeValidationResult {
  const result: TimeValidationResult = {
    isValid: false,
    errors: [],
  };

  if (!timeString) {
    result.isValid = true; // Empty time is valid (optional field)
    return result;
  }

  // Check format HH:MM
  const timeRegex = /^([01]?[0-9]|2[0-4]):([0-5][0-9])$/;
  if (!timeRegex.test(timeString)) {
    result.errors.push('Formato inválido. Use HH:MM (ex: 09:30)');
    return result;
  }

  const [hours, minutes] = timeString.split(':').map(Number);

  // Validate hours (0-24)
  if (hours < 0 || hours > 24) {
    result.errors.push('Horas devem estar entre 0 e 24');
    return result;
  }

  // Auto-round minutes to nearest valid value (00, 15, 30, 45) - always round UP
  let roundedMinutes: ValidMinute;
  let roundedHours = hours;

  if (minutes === 0) {
    roundedMinutes = 0;
  } else if (minutes <= 15) {
    roundedMinutes = 15;
  } else if (minutes <= 30) {
    roundedMinutes = 30;
  } else if (minutes <= 45) {
    roundedMinutes = 45;
  } else {
    // If minutes > 45, round to 00 of next hour
    roundedMinutes = 0;
    roundedHours = hours + 1;

    // Handle hour overflow
    if (roundedHours > 24) {
      roundedHours = 24;
      roundedMinutes = 0;
    }
  }

  result.isValid = true;
  result.formattedTime = `${roundedHours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;

  return result;
}

/**
 * Validate time sequence (end time must be after start time)
 */
export function validateTimeSequence(startTime: string, endTime: string): string[] {
  const errors: string[] = [];

  if (!startTime || !endTime) {
    return errors; // Skip validation if either time is empty
  }

  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      return errors; // Skip if times are invalid
    }

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Check if end time is not later than start time (same day scenario)
    if (endMinutes <= startMinutes) {
      // Only allow this if it's reasonable to assume it's next day
      const crossMidnightDuration = endMinutes + 24 * 60 - startMinutes;

      // If the cross-midnight duration is less than 30 minutes, it's likely an error
      if (crossMidnightDuration < 30) {
        errors.push('Fim da assistência deve ser posterior ao início');
      }
      // If start time is before 20:00 and end time is after 06:00, it's likely an error
      else if (startHour < 20 && endHour > 6) {
        errors.push('Fim da assistência deve ser posterior ao início');
      }
    }
  } catch (error) {
    console.warn('Error validating time sequence:', error);
  }

  return errors;
}

/**
 * Calculate total hours between start and end time
 */
export function calculateTotalHours(startTime: string, endTime: string): string {
  if (!startTime || !endTime) {
    return '';
  }

  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      return '';
    }

    // Convert to minutes since midnight
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle case where end time is next day
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours
    }

    // Calculate duration in minutes
    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes <= 0) {
      return '00:00';
    }

    // Convert back to hours and minutes
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('Error calculating total hours:', error);
    return '';
  }
}

/**
 * Calculate total hours between start and end time and round UP to the next 15-minute interval
 * This is used for billing purposes where time is billed in 15-minute increments (00, 15, 30, 45)
 * Examples: 1min → 0:15, 16min → 0:30, 31min → 0:45, 46min → 1:00, 1:01 → 1:15
 */
export function calculateRoundedTotalHours(startTime: string, endTime: string): string {
  if (!startTime || !endTime) {
    return '';
  }

  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      return '';
    }

    // Convert to minutes since midnight
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle case where end time is next day
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours
    }

    // Calculate duration in minutes
    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes <= 0) {
      return '00:00';
    }

    // Round UP to the next 15-minute interval
    // Valid intervals: 0, 15, 30, 45 minutes
    const roundedMinutes = Math.ceil(durationMinutes / 15) * 15;
    
    // Convert back to hours and minutes
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('Error calculating rounded total hours:', error);
    return '';
  }
}

/**
 * Validate remote assistance creation data
 */
export function validateRemoteAssistanceCreation(data: RemoteAssistanceCreationData): string[] {
  const errors: string[] = [];

  // Basic validation
  if (!data.clientId?.trim()) {
    errors.push('Por favor, selecione um cliente');
  }

  // Note: tecnicoResponsavel is automatically assigned by backend based on authenticated user
  // No need to validate this field during creation as it will be populated by auto-assignment

  // Data do Pedido is now required
  if (!data.dataPedido) {
    errors.push('Por favor, selecione a data do pedido');
  }

  if (!data.dataAssistencia) {
    errors.push('Por favor, selecione a data da assistência');
  }

  // Time fields are now required
  if (!data.inicioAssistencia) {
    errors.push('Por favor, informe o início da assistência');
  }

  if (!data.fimAssistencia) {
    errors.push('Por favor, informe o fim da assistência');
  }

  // Validate time inputs format
  if (data.inicioAssistencia) {
    const startTimeValidation = validateAndFormatTime(data.inicioAssistencia);
    if (!startTimeValidation.isValid) {
      errors.push(...startTimeValidation.errors.map(error => `Início da assistência: ${error}`));
    }
  }

  if (data.fimAssistencia) {
    const endTimeValidation = validateAndFormatTime(data.fimAssistencia);
    if (!endTimeValidation.isValid) {
      errors.push(...endTimeValidation.errors.map(error => `Fim da assistência: ${error}`));
    }
  }

  // Validate time sequence
  if (data.inicioAssistencia && data.fimAssistencia) {
    const sequenceErrors = validateTimeSequence(data.inicioAssistencia, data.fimAssistencia);
    errors.push(...sequenceErrors);
  }

  // Payment method validation (required field)
  if (!data.paymentMethod) {
    errors.push('Método de pagamento é obrigatório');
  } else if (data.paymentMethod !== 'Contrato' && data.paymentMethod !== 'Faturação' && data.paymentMethod !== 'Garantia') {
    errors.push('Método de pagamento inválido. Deve ser: Contrato, Faturação ou Garantia');
  }

  // Contract validation
  if (data.paymentMethod === 'Contrato') {
    if (!data.contractId) {
      errors.push('O contrato é obrigatório quando o método de pagamento é Contrato');
    } else if (!isValidUUID(data.contractId)) {
      errors.push('O ID do contrato deve ser um UUID válido');
    }
  }

  // Validate resolvido field (required)
  if (data.resolvido === undefined || data.resolvido === null) {
    errors.push('Por favor, indique se o problema foi resolvido');
  }

  // Validate relatorio field (required when resolvido is false)
  if (data.resolvido === false) {
    if (!data.relatorio?.trim()) {
      errors.push('Relatório final é obrigatório quando o problema não foi resolvido');
    }
  }

  // Validate value if provided
  if (data.valorAssist !== undefined) {
    if (typeof data.valorAssist !== 'number' || data.valorAssist < 0) {
      errors.push('Valor da assistência deve ser um número positivo');
    }
  }

  return errors;
}

/**
 * Validate remote assistance update data
 */
export function validateRemoteAssistanceUpdate(data: RemoteAssistanceUpdateData): string[] {
  const errors: string[] = [];

  // Basic validation (only if fields are being updated)
  if (data.clientId !== undefined && !data.clientId?.trim()) {
    errors.push('Cliente não pode estar vazio');
  }

  // Note: tecnicoResponsavel is automatically assigned by backend based on authenticated user
  // No need to validate this field during updates as it will be populated by auto-assignment

  // Data do Pedido is now required
  if (data.dataPedido !== undefined && !data.dataPedido) {
    errors.push('Data do pedido não pode estar vazia');
  }

  if (data.dataAssistencia !== undefined && !data.dataAssistencia) {
    errors.push('Data da assistência não pode estar vazia');
  }

  // Time fields are now required
  if (data.inicioAssistencia !== undefined && !data.inicioAssistencia) {
    errors.push('Início da assistência não pode estar vazio');
  }

  if (data.fimAssistencia !== undefined && !data.fimAssistencia) {
    errors.push('Fim da assistência não pode estar vazio');
  }

  // Validate time inputs format (if provided)
  if (data.inicioAssistencia !== undefined && data.inicioAssistencia) {
    const startTimeValidation = validateAndFormatTime(data.inicioAssistencia);
    if (!startTimeValidation.isValid) {
      errors.push(...startTimeValidation.errors.map(error => `Início da assistência: ${error}`));
    }
  }

  if (data.fimAssistencia !== undefined && data.fimAssistencia) {
    const endTimeValidation = validateAndFormatTime(data.fimAssistencia);
    if (!endTimeValidation.isValid) {
      errors.push(...endTimeValidation.errors.map(error => `Fim da assistência: ${error}`));
    }
  }

  // Validate time sequence (if both times are provided)
  if (data.inicioAssistencia !== undefined && data.fimAssistencia !== undefined) {
    const sequenceErrors = validateTimeSequence(data.inicioAssistencia, data.fimAssistencia);
    errors.push(...sequenceErrors);
  }

  // Payment method validation (required field if being updated)
  if (data.paymentMethod !== undefined) {
    if (!data.paymentMethod) {
      errors.push('Método de pagamento é obrigatório');
    } else if (data.paymentMethod !== 'Contrato' && data.paymentMethod !== 'Faturação' && data.paymentMethod !== 'Garantia') {
      errors.push('Método de pagamento inválido. Deve ser: Contrato, Faturação ou Garantia');
    }
  }

  // Contract ID validation (conditional - required when payment method is Contrato)
  if (data.paymentMethod === 'Contrato') {
    if (!data.contractId || data.contractId.trim() === '') {
      errors.push('Contrato é obrigatório quando o método de pagamento é "Contrato"');
    } else if (!isValidUUID(data.contractId)) {
      errors.push('ID do contrato inválido');
    }
  }

  // Validate resolvido field (required if being updated)
  if (data.resolvido !== undefined && data.resolvido === null) {
    errors.push('Estado de resolução não pode estar vazio');
  }

  // Validate relatorio field (required when resolvido is false)
  if (data.resolvido === false) {
    if (!data.relatorio?.trim()) {
      errors.push('Relatório final é obrigatório quando o problema não foi resolvido');
    }
  }

  // Validate value if provided
  if (data.valorAssist !== undefined) {
    if (typeof data.valorAssist !== 'number' || data.valorAssist < 0) {
      errors.push('Valor da assistência deve ser um número positivo');
    }
  }

  return errors;
}

/**
 * Validate remote assistance data for display
 */
export function validateRemoteAssistanceForDisplay(data: RemoteAssistanceData): string[] {
  const errors: string[] = [];

  if (!data.clientId) {
    errors.push('ID do cliente é obrigatório para exibição');
  }

  if (!data.clienteName) {
    errors.push('Nome do cliente é obrigatório para exibição');
  }

  if (!data.dataAssistencia) {
    errors.push('Data da assistência é obrigatória para exibição');
  }

  return errors;
}

/**
 * Generate assistance number for display
 * Format: RA-YYYY-NNNN (Remote Assistance - Year - Sequential Number)
 */
export function generateAssistanceNumber(year: string, sequentialNumber: number): string {
  return `RA-${year}-${sequentialNumber.toString().padStart(4, '0')}`;
}

/**
 * Extract year from assistance date
 */
export function getYearFromAssistanceDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.getFullYear().toString();
  } catch (error) {
    console.warn('Error extracting year from date:', error);
    return new Date().getFullYear().toString();
  }
}

/**
 * Get remote assistance display summary
 */
export function getRemoteAssistanceSummary(data: RemoteAssistanceData): {
  technician: string;
  date: string;
  value: number;
  status: string[];
  duration: string;
} {
  const status: string[] = [];

  // Add payment method to status (only if it's a valid value)
  if (data.paymentMethod === 'Contrato' || data.paymentMethod === 'Faturação' || data.paymentMethod === 'Garantia') {
    status.push(data.paymentMethod);
  }
  
  if (data.resolvido) status.push('Resolvido');

  const duration = calculateTotalHours(data.inicioAssistencia, data.fimAssistencia);

  return {
    technician: data.tecnicoResponsavel ? `${data.tecnicoResponsavel.firstName} ${data.tecnicoResponsavel.lastName}` : 'N/A',
    date: data.dataAssistencia || 'N/A',
    value: data.valorAssist || 0,
    status,
    duration,
  };
}

/**
 * Check if assistance has billable value
 * Assistance is billable when payment method is "Faturação" and has a value > 0
 */
export function hasBillableValue(data: RemoteAssistanceData): boolean {
  return data.paymentMethod === 'Faturação' && data.valorAssist > 0;
}

/**
 * Format time for display (HH:MM format)
 */
export function formatTimeForDisplay(timeString: string): string {
  if (!timeString) return 'N/A';

  // If it's already in HH:MM format, return as is
  if (/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(timeString)) {
    return timeString;
  }

  // Try to parse as a date string
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Format date for display (Portuguese format)
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return 'Data inválida';
  }
}

/**
 * Format datetime for display (Portuguese format with time)
 */
export function formatDateTimeForDisplay(dateString: string): string {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    return 'Data inválida';
  }
}

/**
 * Helper function for UUID validation
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
