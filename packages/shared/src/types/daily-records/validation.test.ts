import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateActivity,
  validateDailyRecordCreation,
  validateDailyRecordUpdate,
} from './validation';
import type { Activity, DailyRecordCreationData } from './types';

/**
 * Helper: builds a valid Activity with all required fields populated.
 * Override specific fields per test case.
 */
function buildValidActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    tipoAtividade: 'Interno',
    assunto: 'Test activity',
    horaInicio: '09:00',
    horaFim: '17:00',
    tempoPausa: 30,
    totalHoras: '07:30',
    tipoLigacao: 'Nenhuma',
    clientId: 'client-uuid-123',
    ...overrides,
  };
}

/**
 * Arbitrary: generates a valid HH:MM time string (00:00–23:59)
 */
const arbTime = fc
  .tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
  .map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

/**
 * Arbitrary: generates a valid time pair where end > start (no overnight)
 */
const arbTimePair = fc
  .tuple(fc.integer({ min: 0, max: 1380 }), fc.integer({ min: 1, max: 59 }))
  .map(([startMin, gap]) => {
    const endMin = Math.min(startMin + gap, 1439);
    const actualGap = endMin - startMin;
    if (actualGap <= 0) return { start: '09:00', end: '17:00', gap: 480 };
    const sh = Math.floor(startMin / 60);
    const sm = startMin % 60;
    const eh = Math.floor(endMin / 60);
    const em = endMin % 60;
    return {
      start: `${sh.toString().padStart(2, '0')}:${sm.toString().padStart(2, '0')}`,
      end: `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`,
      gap: actualGap,
    };
  });

/**
 * Arbitrary: generates a non-empty trimmed string (for assunto)
 */
const arbNonEmptyString = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/**
 * Arbitrary: generates a UUID-like string
 */
const arbUuid = fc.uuid();

describe('validateActivity — clientId rules', () => {
  /**
   * MI-01: New activity without clientId → error
   * Validates: Requirements DR-BR-001, DR-DEC-004
   */
  describe('MI-01: new activity without clientId returns error', () => {
    it('returns "Cliente é obrigatório" when isNewRecord: true and no clientId', () => {
      const activity = buildValidActivity({ clientId: undefined });
      const errors = validateActivity(activity, 0, { isNewRecord: true });
      expect(errors).toContain('Atividade 1: Cliente é obrigatório');
    });

    it('does NOT return client error when isNewRecord: true and clientId is set', () => {
      const activity = buildValidActivity({ clientId: 'some-client-id' });
      const errors = validateActivity(activity, 0, { isNewRecord: true });
      expect(errors).not.toContain('Atividade 1: Cliente é obrigatório');
    });

    it('(property) any new activity without clientId always produces client error', () => {
      fc.assert(
        fc.property(
          arbTimePair,
          arbNonEmptyString,
          fc.integer({ min: 0, max: 2 }),
          (timePair, assunto, actIndex) => {
            const activity = buildValidActivity({
              clientId: undefined,
              horaInicio: timePair.start,
              horaFim: timePair.end,
              tempoPausa: Math.min(10, timePair.gap - 1),
              assunto,
            });
            const errors = validateActivity(activity, actIndex, { isNewRecord: true });
            const expectedMsg = `Atividade ${actIndex + 1}: Cliente é obrigatório`;
            return errors.includes(expectedMsg);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('defaults to isNewRecord: true when no options provided (strict mode)', () => {
      const activity = buildValidActivity({ clientId: undefined });
      const errors = validateActivity(activity, 0);
      expect(errors).toContain('Atividade 1: Cliente é obrigatório');
    });
  });

  /**
   * MI-02: Legacy activity without clientId + no linked doc → valid (no client error)
   * Validates: Requirements DR-DEC-003, DR-AC-011
   */
  describe('MI-02: legacy activity without clientId and no linked doc is valid', () => {
    it('does NOT return client error when isNewRecord: false, no clientId, tipoLigacao Nenhuma', () => {
      const activity = buildValidActivity({
        clientId: undefined,
        tipoLigacao: 'Nenhuma',
        workSheetId: undefined,
        remoteAssistanceId: undefined,
      });
      const errors = validateActivity(activity, 0, { isNewRecord: false });
      expect(errors).not.toContain('Atividade 1: Cliente é obrigatório');
      expect(errors).not.toContain('Atividade 1: Cliente é obrigatório quando existe ligação a documento');
    });

    it('(property) legacy activities with no doc link and no clientId never get client errors', () => {
      fc.assert(
        fc.property(
          arbTimePair,
          arbNonEmptyString,
          fc.integer({ min: 0, max: 4 }),
          (timePair, assunto, actIndex) => {
            const activity = buildValidActivity({
              clientId: undefined,
              tipoLigacao: 'Nenhuma',
              workSheetId: undefined,
              remoteAssistanceId: undefined,
              horaInicio: timePair.start,
              horaFim: timePair.end,
              tempoPausa: Math.min(10, timePair.gap - 1),
              assunto,
            });
            const errors = validateActivity(activity, actIndex, { isNewRecord: false });
            const clientErrors = errors.filter(
              (e) =>
                e.includes('Cliente é obrigatório') ||
                e.includes('Cliente é obrigatório quando existe ligação a documento')
            );
            return clientErrors.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * MI-03: Edit activity with linked doc but no clientId → error
   * Validates: Requirements DR-AC-012
   */
  describe('MI-03: edit with linked doc but no clientId returns error', () => {
    it('returns error when isNewRecord: false, has workSheetId, no clientId', () => {
      const activity = buildValidActivity({
        clientId: undefined,
        tipoLigacao: 'Folha de Obra',
        workSheetId: 'ws-uuid-123',
        remoteAssistanceId: undefined,
      });
      const errors = validateActivity(activity, 0, { isNewRecord: false });
      expect(errors).toContain(
        'Atividade 1: Cliente é obrigatório quando existe ligação a documento'
      );
    });

    it('returns error when isNewRecord: false, has remoteAssistanceId, no clientId', () => {
      const activity = buildValidActivity({
        clientId: undefined,
        tipoLigacao: 'Assistência Remota',
        remoteAssistanceId: 'ra-uuid-456',
        workSheetId: undefined,
        assunto: 'Remote test',
      });
      const errors = validateActivity(activity, 0, { isNewRecord: false });
      expect(errors).toContain(
        'Atividade 1: Cliente é obrigatório quando existe ligação a documento'
      );
    });

    it('does NOT return linked-doc error when clientId IS provided with linked doc', () => {
      const activity = buildValidActivity({
        clientId: 'client-uuid',
        tipoLigacao: 'Folha de Obra',
        workSheetId: 'ws-uuid-123',
      });
      const errors = validateActivity(activity, 0, { isNewRecord: false });
      expect(errors).not.toContain(
        'Atividade 1: Cliente é obrigatório quando existe ligação a documento'
      );
    });

    it('(property) any edit with linked doc and no clientId always triggers error', () => {
      fc.assert(
        fc.property(
          arbUuid,
          fc.constantFrom('Folha de Obra' as const, 'Assistência Remota' as const),
          fc.integer({ min: 0, max: 4 }),
          (docId, linkType, actIndex) => {
            const activity = buildValidActivity({
              clientId: undefined,
              tipoLigacao: linkType,
              workSheetId: linkType === 'Folha de Obra' ? docId : undefined,
              remoteAssistanceId: linkType === 'Assistência Remota' ? docId : undefined,
              assunto: 'Test subject',
            });
            const errors = validateActivity(activity, actIndex, { isNewRecord: false });
            const expectedMsg = `Atividade ${actIndex + 1}: Cliente é obrigatório quando existe ligação a documento`;
            return errors.includes(expectedMsg);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('validateDailyRecordCreation — enforces clientId', () => {
  it('returns clientId error for activities missing clientId', () => {
    const data: DailyRecordCreationData = {
      dataRegistro: '2024-01-15',
      atividades: [
        buildValidActivity({ clientId: undefined }),
      ],
    };
    const errors = validateDailyRecordCreation(data);
    expect(errors).toContain('Atividade 1: Cliente é obrigatório');
  });

  it('does NOT return clientId error when all activities have clientId', () => {
    const data: DailyRecordCreationData = {
      dataRegistro: '2024-01-15',
      atividades: [
        buildValidActivity({ clientId: 'client-1' }),
        buildValidActivity({ clientId: 'client-2' }),
      ],
    };
    const errors = validateDailyRecordCreation(data);
    const clientErrors = errors.filter((e) => e.includes('Cliente é obrigatório'));
    expect(clientErrors).toHaveLength(0);
  });

  it('(property) creation always enforces clientId (isNewRecord: true)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        (numActivities) => {
          const activities = Array.from({ length: numActivities }, () =>
            buildValidActivity({ clientId: undefined })
          );
          const data: DailyRecordCreationData = {
            dataRegistro: '2024-06-01',
            atividades: activities,
          };
          const errors = validateDailyRecordCreation(data);
          // Each activity without clientId should produce a client error
          const clientErrors = errors.filter((e) => e.includes('Cliente é obrigatório'));
          return clientErrors.length === numActivities;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('validateDailyRecordUpdate — uses isNewRecord: false', () => {
  it('does NOT return clientId error for legacy activity without clientId and no linked doc', () => {
    const data: DailyRecordCreationData = {
      dataRegistro: '2024-01-15',
      atividades: [
        buildValidActivity({
          clientId: undefined,
          tipoLigacao: 'Nenhuma',
          workSheetId: undefined,
          remoteAssistanceId: undefined,
        }),
      ],
    };
    const errors = validateDailyRecordUpdate(data);
    const clientErrors = errors.filter(
      (e) => e.includes('Cliente é obrigatório')
    );
    expect(clientErrors).toHaveLength(0);
  });

  it('returns error for activity with linked doc but no clientId', () => {
    const data: DailyRecordCreationData = {
      dataRegistro: '2024-01-15',
      atividades: [
        buildValidActivity({
          clientId: undefined,
          tipoLigacao: 'Folha de Obra',
          workSheetId: 'ws-uuid',
        }),
      ],
    };
    const errors = validateDailyRecordUpdate(data);
    expect(errors).toContain(
      'Atividade 1: Cliente é obrigatório quando existe ligação a documento'
    );
  });

  it('(property) update never enforces clientId on activities without linked docs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        (numActivities) => {
          const activities = Array.from({ length: numActivities }, () =>
            buildValidActivity({
              clientId: undefined,
              tipoLigacao: 'Nenhuma',
              workSheetId: undefined,
              remoteAssistanceId: undefined,
            })
          );
          const data: DailyRecordCreationData = {
            dataRegistro: '2024-06-01',
            atividades: activities,
          };
          const errors = validateDailyRecordUpdate(data);
          const clientErrors = errors.filter((e) => e.includes('Cliente é obrigatório'));
          return clientErrors.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
