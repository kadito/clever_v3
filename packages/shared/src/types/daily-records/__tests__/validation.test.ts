import { describe, it, expect } from 'vitest';
import { validateActivity } from '../validation';
import type { Activity } from '../types';

/**
 * Unit tests for validateActivity — ligação flow validation rules
 * Covers: DR-LIG-AC-012, DR-LIG-AC-013, DR-LIG-AC-014, DR-LIG-AC-015
 */

/** Factory: builds a fully valid Activity for new records */
function buildValidActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    tipoAtividade: 'Interno',
    clientId: 'client-uuid-123',
    assunto: 'Atividade de teste',
    horaInicio: '09:00',
    horaFim: '17:00',
    tempoPausa: 30,
    totalHoras: '07:30',
    tipoLigacao: 'Nenhuma',
    ...overrides,
  };
}

describe('validateActivity — DR-LIG-AC-012: clientId missing (new record)', () => {
  it('returns error when clientId is missing on a new record', () => {
    const activity = buildValidActivity({ clientId: undefined });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).toContain('Atividade 1: Cliente é obrigatório');
  });

  it('returns error when clientId is empty string on a new record', () => {
    const activity = buildValidActivity({ clientId: '' });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).toContain('Atividade 1: Cliente é obrigatório');
  });

  it('does not return client error when clientId is provided', () => {
    const activity = buildValidActivity({ clientId: 'valid-client-id' });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).not.toContain('Atividade 1: Cliente é obrigatório');
  });
});

describe('validateActivity — DR-LIG-AC-013: tipoLigacao empty', () => {
  it('returns error when tipoLigacao is empty string', () => {
    const activity = buildValidActivity({ tipoLigacao: '' as Activity['tipoLigacao'] });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).toContain('Atividade 1: Tipo de ligação é obrigatório');
  });

  it('returns error when tipoLigacao is undefined', () => {
    const activity = buildValidActivity({ tipoLigacao: undefined as unknown as Activity['tipoLigacao'] });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).toContain('Atividade 1: Tipo de ligação é obrigatório');
  });

  it('returns error when tipoLigacao is an invalid value', () => {
    const activity = buildValidActivity({ tipoLigacao: 'Invalid' as Activity['tipoLigacao'] });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).toContain('Atividade 1: Tipo de ligação inválido');
  });

  it('does not return tipoLigacao error when a valid value is set', () => {
    const activity = buildValidActivity({ tipoLigacao: 'Nenhuma' });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    const ligacaoErrors = errors.filter((e) => e.includes('Tipo de ligação'));
    expect(ligacaoErrors).toHaveLength(0);
  });
});

describe('validateActivity — DR-LIG-AC-014: workSheetId missing when Folha de Obra', () => {
  it('returns error when tipoLigacao is Folha de Obra and workSheetId is missing', () => {
    const activity = buildValidActivity({
      tipoLigacao: 'Folha de Obra',
      workSheetId: undefined,
    });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).toContain(
      'Atividade 1: Folha de obra é obrigatória quando tipo de ligação é "Folha de Obra"'
    );
  });

  it('returns error when tipoLigacao is Folha de Obra and workSheetId is empty string', () => {
    const activity = buildValidActivity({
      tipoLigacao: 'Folha de Obra',
      workSheetId: '',
    });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).toContain(
      'Atividade 1: Folha de obra é obrigatória quando tipo de ligação é "Folha de Obra"'
    );
  });

  it('does not return workSheetId error when workSheetId is provided', () => {
    const activity = buildValidActivity({
      tipoLigacao: 'Folha de Obra',
      workSheetId: 'ws-uuid-456',
    });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).not.toContain(
      'Atividade 1: Folha de obra é obrigatória quando tipo de ligação é "Folha de Obra"'
    );
  });

  it('does not return workSheetId error when tipoLigacao is not Folha de Obra', () => {
    const activity = buildValidActivity({
      tipoLigacao: 'Nenhuma',
      workSheetId: undefined,
    });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).not.toContain(
      'Atividade 1: Folha de obra é obrigatória quando tipo de ligação é "Folha de Obra"'
    );
  });
});

describe('validateActivity — DR-LIG-AC-015: remoteAssistanceId missing when Assistência Remota', () => {
  it('returns error when tipoLigacao is Assistência Remota and remoteAssistanceId is missing', () => {
    const activity = buildValidActivity({
      tipoLigacao: 'Assistência Remota',
      remoteAssistanceId: undefined,
      assunto: 'Assunto obrigatório',
    });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).toContain(
      'Atividade 1: Assistência remota é obrigatória quando tipo de ligação é "Assistência Remota"'
    );
  });

  it('returns error when tipoLigacao is Assistência Remota and remoteAssistanceId is empty string', () => {
    const activity = buildValidActivity({
      tipoLigacao: 'Assistência Remota',
      remoteAssistanceId: '',
      assunto: 'Assunto obrigatório',
    });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).toContain(
      'Atividade 1: Assistência remota é obrigatória quando tipo de ligação é "Assistência Remota"'
    );
  });

  it('does not return remoteAssistanceId error when remoteAssistanceId is provided', () => {
    const activity = buildValidActivity({
      tipoLigacao: 'Assistência Remota',
      remoteAssistanceId: 'ra-uuid-789',
      assunto: 'Assunto obrigatório',
    });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).not.toContain(
      'Atividade 1: Assistência remota é obrigatória quando tipo de ligação é "Assistência Remota"'
    );
  });

  it('does not return remoteAssistanceId error when tipoLigacao is not Assistência Remota', () => {
    const activity = buildValidActivity({
      tipoLigacao: 'Nenhuma',
      remoteAssistanceId: undefined,
    });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).not.toContain(
      'Atividade 1: Assistência remota é obrigatória quando tipo de ligação é "Assistência Remota"'
    );
  });
});

describe('validateActivity — all valid scenarios (no errors)', () => {
  it('returns no errors for valid activity with tipoLigacao Nenhuma', () => {
    const activity = buildValidActivity({
      clientId: 'client-uuid',
      tipoLigacao: 'Nenhuma',
    });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).toHaveLength(0);
  });

  it('returns no errors for valid activity with Folha de Obra and workSheetId', () => {
    const activity = buildValidActivity({
      clientId: 'client-uuid',
      tipoLigacao: 'Folha de Obra',
      workSheetId: 'ws-uuid-123',
    });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).toHaveLength(0);
  });

  it('returns no errors for valid activity with Assistência Remota and remoteAssistanceId', () => {
    const activity = buildValidActivity({
      clientId: 'client-uuid',
      tipoLigacao: 'Assistência Remota',
      remoteAssistanceId: 'ra-uuid-456',
      assunto: 'Assunto válido',
    });
    const errors = validateActivity(activity, 0, { isNewRecord: true });

    expect(errors).toHaveLength(0);
  });
});
