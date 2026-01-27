import type { DailyRecordCreationData, Activity } from './types';

/**
 * Validate time format (HH:MM)
 * Accepts 24-hour format from 00:00 to 23:59
 */
export function isValidTimeFormat(time: string): boolean {
  if (!time || typeof time !== 'string') {
    return false;
  }
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

/**
 * Convert HH:MM time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes to HH:MM time string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculate total hours from start time, end time, and break time
 * Handles overnight activities (end time before start time)
 * 
 * @param horaInicio - Start time in HH:MM format
 * @param horaFim - End time in HH:MM format
 * @param tempoPausa - Break time in minutes
 * @returns Total hours in HH:MM format, or '00:00' if invalid
 */
export function calculateActivityTotalHours(
  horaInicio: string,
  horaFim: string,
  tempoPausa: number
): string {
  if (!isValidTimeFormat(horaInicio) || !isValidTimeFormat(horaFim)) {
    return '00:00';
  }

  const startMinutes = timeToMinutes(horaInicio);
  const endMinutes = timeToMinutes(horaFim);

  let workMinutes: number;

  if (endMinutes < startMinutes) {
    // Overnight activity: add 24 hours (1440 minutes)
    workMinutes = endMinutes + 1440 - startMinutes;
  } else {
    workMinutes = endMinutes - startMinutes;
  }

  // Subtract break time
  const totalMinutes = workMinutes - tempoPausa;

  if (totalMinutes < 0) {
    return '00:00'; // Invalid: break time exceeds work time
  }

  return minutesToTime(totalMinutes);
}

/**
 * Validate a single activity
 * Returns array of error messages in Portuguese
 * 
 * @param activity - Activity to validate
 * @param index - Activity index for error messages
 * @returns Array of validation error messages
 */
export function validateActivity(activity: Activity, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Atividade ${index + 1}:`;

  // Activity type validation
  if (!activity.tipoAtividade) {
    errors.push(`${prefix} Tipo de atividade é obrigatório`);
  } else if (!['Interno', 'Externo'].includes(activity.tipoAtividade)) {
    errors.push(`${prefix} Tipo de atividade inválido`);
  }

  // Subject validation
  if (!activity.assunto || activity.assunto.trim() === '') {
    errors.push(`${prefix} Assunto é obrigatório`);
  }

  // Start time validation
  if (!activity.horaInicio) {
    errors.push(`${prefix} Hora de início é obrigatória`);
  } else if (!isValidTimeFormat(activity.horaInicio)) {
    errors.push(`${prefix} Hora de início deve estar no formato HH:MM`);
  }

  // End time validation
  if (!activity.horaFim) {
    errors.push(`${prefix} Hora de fim é obrigatória`);
  } else if (!isValidTimeFormat(activity.horaFim)) {
    errors.push(`${prefix} Hora de fim deve estar no formato HH:MM`);
  }

  // Validate end time is after start time (accounting for overnight)
  if (
    activity.horaInicio &&
    activity.horaFim &&
    isValidTimeFormat(activity.horaInicio) &&
    isValidTimeFormat(activity.horaFim)
  ) {
    const startMinutes = timeToMinutes(activity.horaInicio);
    const endMinutes = timeToMinutes(activity.horaFim);

    // End time must be different from start time
    if (endMinutes === startMinutes) {
      errors.push(`${prefix} Hora de fim deve ser diferente da hora de início`);
    }
  }

  // Break time validation
  if (activity.tempoPausa === undefined || activity.tempoPausa === null) {
    errors.push(`${prefix} Tempo de pausa é obrigatório`);
  } else if (activity.tempoPausa < 0) {
    errors.push(`${prefix} Tempo de pausa não pode ser negativo`);
  } else if (
    activity.horaInicio &&
    activity.horaFim &&
    isValidTimeFormat(activity.horaInicio) &&
    isValidTimeFormat(activity.horaFim)
  ) {
    // Validate break time doesn't exceed work duration
    const startMinutes = timeToMinutes(activity.horaInicio);
    const endMinutes = timeToMinutes(activity.horaFim);

    let workMinutes: number;
    if (endMinutes < startMinutes) {
      // Overnight activity
      workMinutes = endMinutes + 1440 - startMinutes;
    } else {
      workMinutes = endMinutes - startMinutes;
    }

    if (activity.tempoPausa > workMinutes) {
      errors.push(`${prefix} Tempo de pausa não pode exceder o tempo de trabalho`);
    }
  }

  // Link type validation
  if (!activity.tipoLigacao) {
    errors.push(`${prefix} Tipo de ligação é obrigatório`);
  } else if (
    !['Nenhuma', 'Folha de Obra', 'Assistência Remota'].includes(activity.tipoLigacao)
  ) {
    errors.push(`${prefix} Tipo de ligação inválido`);
  }

  // Conditional validation based on link type
  if (activity.tipoLigacao === 'Folha de Obra' && !activity.workSheetId) {
    errors.push(
      `${prefix} Folha de obra é obrigatória quando tipo de ligação é "Folha de Obra"`
    );
  }

  if (activity.tipoLigacao === 'Assistência Remota' && !activity.remoteAssistanceId) {
    errors.push(
      `${prefix} Assistência remota é obrigatória quando tipo de ligação é "Assistência Remota"`
    );
  }

  return errors;
}

/**
 * Validate date format (ISO date string YYYY-MM-DD)
 */
function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  // Check format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  // Check if it's a valid date
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate daily record creation data
 * Returns array of error messages in Portuguese
 * 
 * @param data - Daily record creation data to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateDailyRecordCreation(data: DailyRecordCreationData): string[] {
  const errors: string[] = [];

  // Date validation
  if (!data.dataRegistro) {
    errors.push('Data do registo é obrigatória');
  } else if (!isValidDate(data.dataRegistro)) {
    errors.push('Data do registo deve ser uma data válida');
  }

  // Activities validation
  if (!data.atividades || data.atividades.length === 0) {
    errors.push('Pelo menos uma atividade é obrigatória');
  } else {
    data.atividades.forEach((activity, index) => {
      const activityErrors = validateActivity(activity, index);
      errors.push(...activityErrors);
    });
  }

  return errors;
}

/**
 * Validate daily record update data
 * Same validation rules as creation
 * 
 * @param data - Daily record update data to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateDailyRecordUpdate(data: DailyRecordCreationData): string[] {
  // Update validation uses the same rules as creation
  return validateDailyRecordCreation(data);
}
