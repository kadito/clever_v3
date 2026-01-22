import type {
  RemoteAssistanceData,
  RemoteAssistanceCreationData,
  RemoteAssistanceUpdateData,
  TimeValidationResult,
  ValueCalculationResult,
  ValidMinute,
} from './types.js';
import { REMOTE_ASSISTANCE_CONSTANTS } from './types.js';

// Re-export constants for convenience
export { REMOTE_ASSISTANCE_CONSTANTS };

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
 * Determine if a time is within business hours (09:00-18:00)
 */
export function isBusinessHours(hour: number): boolean {
  return (
    hour >= REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_START &&
    hour < REMOTE_ASSISTANCE_CONSTANTS.BUSINESS_HOURS_END
  );
}

/**
 * Calculate assistance value with proper business hours logic
 * If either start time OR end time is outside business hours (09:00-18:00), 
 * charge the after-hours rate for the entire duration
 */
export function calculateAssistanceValueWithBusinessHours(
  startTime: string,
  endTime: string,
  isContract: boolean = false,
  isWarranty: boolean = false
): ValueCalculationResult {
  const result: ValueCalculationResult = {
    totalValue: 0,
    businessHoursValue: 0,
    afterHoursValue: 0,
    totalHours: 0,
    businessHours: 0,
    afterHours: 0,
    breakdown: [],
  };

  // If contract or warranty, value should be 0
  if (isContract || isWarranty) {
    return result;
  }

  if (!startTime || !endTime) {
    return result;
  }

  try {
    // Calculate the actual duration and round up to next 15-minute interval
    const actualDuration = calculateTotalHours(startTime, endTime);
    if (!actualDuration) return result;

    const [hours, minutes] = actualDuration.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // Round up to next 15-minute interval for billing
    const billingMinutes = Math.ceil(totalMinutes / 15) * 15;
    const billingHours = billingMinutes / 60;
    
    result.totalHours = billingHours;

    // Parse start and end times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    // Check if either start time OR end time is outside business hours (09:00-18:00)
    const isStartOutsideBusinessHours = startHour < 9 || startHour >= 18;
    const isEndOutsideBusinessHours = endHour < 9 || endHour >= 18;
    
    // If either time is outside business hours, charge after-hours rate for entire duration
    if (isStartOutsideBusinessHours || isEndOutsideBusinessHours) {
      // Charge after-hours rate for entire duration
      result.afterHours = billingHours;
      result.afterHoursValue = billingHours * REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS;
      result.totalValue = result.afterHoursValue;
      
      result.breakdown.push({
        hour: startHour,
        rate: REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS,
        value: result.afterHoursValue,
        isBusinessHours: false,
      });
    } else {
      // Both times are within business hours, charge business rate
      result.businessHours = billingHours;
      result.businessHoursValue = billingHours * REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS;
      result.totalValue = result.businessHoursValue;
      
      result.breakdown.push({
        hour: startHour,
        rate: REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS,
        value: result.businessHoursValue,
        isBusinessHours: true,
      });
    }
  } catch (error) {
    console.warn('Error calculating assistance value with business hours:', error);
  }

  return result;
}

/**
 * Calculate assistance value based on time difference and business rules
 */
export function calculateAssistanceValue(
  startTime: string,
  endTime: string,
  isContract: boolean = false,
  isWarranty: boolean = false
): ValueCalculationResult {
  const result: ValueCalculationResult = {
    totalValue: 0,
    businessHoursValue: 0,
    afterHoursValue: 0,
    totalHours: 0,
    businessHours: 0,
    afterHours: 0,
    breakdown: [],
  };

  // If contract or warranty, value should be 0
  if (isContract || isWarranty) {
    return result;
  }

  if (!startTime || !endTime) {
    return result;
  }

  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    // Convert to minutes since midnight
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle case where end time is next day
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours
    }

    // Calculate duration in minutes
    const durationMinutes = endMinutes - startMinutes;
    result.totalHours = durationMinutes / 60;

    // Calculate value hour by hour to apply correct pricing
    let currentMinutes = startMinutes;
    let businessHoursMinutes = 0;
    let afterHoursMinutes = 0;

    while (currentMinutes < endMinutes) {
      const currentHour = Math.floor(currentMinutes / 60) % 24;
      const minutesUntilNextHour = 60 - (currentMinutes % 60);
      const minutesInThisHour = Math.min(minutesUntilNextHour, endMinutes - currentMinutes);

      // Apply appropriate rate based on hour
      const pricePerHour = isBusinessHours(currentHour)
        ? REMOTE_ASSISTANCE_CONSTANTS.PRICE_BUSINESS_HOURS
        : REMOTE_ASSISTANCE_CONSTANTS.PRICE_AFTER_HOURS;

      const hourValue = (minutesInThisHour / 60) * pricePerHour;
      result.totalValue += hourValue;

      // Track business vs after hours
      if (isBusinessHours(currentHour)) {
        result.businessHoursValue += hourValue;
        businessHoursMinutes += minutesInThisHour;
      } else {
        result.afterHoursValue += hourValue;
        afterHoursMinutes += minutesInThisHour;
      }

      // Add to breakdown
      result.breakdown.push({
        hour: currentHour,
        rate: pricePerHour,
        value: hourValue,
        isBusinessHours: isBusinessHours(currentHour),
      });

      currentMinutes += minutesInThisHour;
    }

    result.businessHours = businessHoursMinutes / 60;
    result.afterHours = afterHoursMinutes / 60;
  } catch (error) {
    console.warn('Error calculating assistance value:', error);
  }

  return result;
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

  if (!data.tipoAssistencia) {
    errors.push('Por favor, selecione o tipo de assistência');
  } else if (!REMOTE_ASSISTANCE_CONSTANTS.ASSISTANCE_TYPES.includes(data.tipoAssistencia as any)) {
    errors.push('Tipo de assistência inválido');
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

  if (data.tipoAssistencia !== undefined) {
    if (!data.tipoAssistencia) {
      errors.push('Tipo de assistência não pode estar vazio');
    } else if (
      !REMOTE_ASSISTANCE_CONSTANTS.ASSISTANCE_TYPES.includes(data.tipoAssistencia as any)
    ) {
      errors.push('Tipo de assistência inválido');
    }
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

  // Validate time inputs format (if provided)
  if (data.inicioAssistencia !== undefined) {
    const startTimeValidation = validateAndFormatTime(data.inicioAssistencia);
    if (!startTimeValidation.isValid) {
      errors.push(...startTimeValidation.errors.map(error => `Início da assistência: ${error}`));
    }
  }

  if (data.fimAssistencia !== undefined) {
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
  assistanceType: string;
  technician: string;
  date: string;
  value: number;
  status: string[];
  duration: string;
} {
  const status: string[] = [];

  if (data.contrato) status.push('Contrato');
  if (data.garantia) status.push('Garantia');
  if (data.resolvido) status.push('Resolvido');

  const duration = calculateTotalHours(data.inicioAssistencia, data.fimAssistencia);

  return {
    assistanceType: data.tipoAssistencia || 'N/A',
    technician: data.tecnicoResponsavel ? `${data.tecnicoResponsavel.firstName} ${data.tecnicoResponsavel.lastName}` : 'N/A',
    date: data.dataAssistencia || 'N/A',
    value: data.valorAssist || 0,
    status,
    duration,
  };
}

/**
 * Check if assistance has billable value
 */
export function hasBillableValue(data: RemoteAssistanceData): boolean {
  return !data.contrato && !data.garantia && data.valorAssist > 0;
}

/**
 * Format time for display (HH:MM format)
 */
export function formatTimeForDisplay(timeString: string): string {
  if (!timeString) return 'N/A';

  try {
    const date = new Date(timeString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    // If it's already in HH:MM format, return as is
    if (/^([01]?[0-9]|2[0-4]):([0-5][0-9])$/.test(timeString)) {
      return timeString;
    }
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
