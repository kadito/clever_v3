import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateActivity } from '../validation';
import type { Activity } from '../types';

// P-4
/**
 * Property-Based Test: Validation Completeness (P-4)
 * Validates: Requirements DR-LIG-AC-012, DR-LIG-AC-013, DR-LIG-AC-014, DR-LIG-AC-015
 *
 * For any Activity object with selective field omissions,
 * validateActivity returns expected error messages corresponding
 * to which fields are missing/invalid.
 */

/** Builds a fully valid Activity that produces no validation errors */
function buildFullyValidActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    tipoAtividade: 'Interno',
    clientId: 'client-uuid-123',
    assunto: 'Atividade válida',
    horaInicio: '09:00',
    horaFim: '17:00',
    tempoPausa: 30,
    totalHoras: '07:30',
    tipoLigacao: 'Nenhuma',
    ...overrides,
  };
}

/** Arbitrary for valid tipoLigacao values */
const validTipoLigacaoArb = fc.constantFrom(
  'Nenhuma' as const,
  'Folha de Obra' as const,
  'Assistência Remota' as const
);

/** Arbitrary for clientId: either empty/undefined (invalid) or a non-empty string (valid) */
const clientIdArb = fc.oneof(
  fc.constant('' as string | undefined),
  fc.constant(undefined as string | undefined),
  fc.uuid()
);

/** Arbitrary for tipoLigacao: either empty/undefined (invalid) or a valid value */
const tipoLigacaoArb = fc.oneof(
  fc.constant('' as string),
  fc.constant(undefined as unknown as string),
  ...['Nenhuma', 'Folha de Obra', 'Assistência Remota'].map((v) => fc.constant(v))
);

/** Arbitrary for optional document IDs */
const optionalIdArb = fc.oneof(
  fc.constant('' as string | undefined),
  fc.constant(undefined as string | undefined),
  fc.uuid()
);

describe('PBT — Validation Completeness (P-4)', () => {
  // P-4
  it('P-4.1: clientId empty/undefined on new record → errors MUST include client error', () => {
    /**
     * **Validates: Requirements DR-LIG-AC-012**
     * If clientId is empty or undefined for a new record, the validation
     * must return an error containing "Cliente é obrigatório".
     */
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(''), fc.constant(undefined as string | undefined)),
        validTipoLigacaoArb,
        optionalIdArb,
        optionalIdArb,
        (clientId, tipoLigacao, workSheetId, remoteAssistanceId) => {
          const activity = buildFullyValidActivity({
            clientId,
            tipoLigacao,
            workSheetId: tipoLigacao === 'Folha de Obra' ? (workSheetId || 'ws-123') : undefined,
            remoteAssistanceId:
              tipoLigacao === 'Assistência Remota'
                ? (remoteAssistanceId || 'ra-123')
                : undefined,
          });

          const errors = validateActivity(activity, 0, { isNewRecord: true });

          expect(errors.some((e) => e.includes('Cliente é obrigatório'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // P-4
  it('P-4.2: tipoLigacao empty/undefined → errors MUST include ligação error', () => {
    /**
     * **Validates: Requirements DR-LIG-AC-013**
     * If tipoLigacao is empty or undefined, validation must return an error
     * about tipo de ligação being required.
     */
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(''), fc.constant(undefined as unknown as string)),
        fc.uuid(),
        (tipoLigacao, clientId) => {
          const activity = buildFullyValidActivity({
            clientId,
            tipoLigacao: tipoLigacao as Activity['tipoLigacao'],
          });

          const errors = validateActivity(activity, 0, { isNewRecord: true });

          expect(errors.some((e) => e.includes('Tipo de ligação é obrigatório'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // P-4
  it('P-4.3: tipoLigacao === "Folha de Obra" AND workSheetId empty/undefined → errors MUST include work sheet error', () => {
    /**
     * **Validates: Requirements DR-LIG-AC-014**
     * If tipoLigacao is "Folha de Obra" and workSheetId is missing,
     * validation must return a "Folha de obra é obrigatória" error.
     */
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(''), fc.constant(undefined as string | undefined)),
        fc.uuid(),
        (workSheetId, clientId) => {
          const activity = buildFullyValidActivity({
            clientId,
            tipoLigacao: 'Folha de Obra',
            workSheetId,
          });

          const errors = validateActivity(activity, 0, { isNewRecord: true });

          expect(
            errors.some((e) =>
              e.includes('Folha de obra é obrigatória quando tipo de ligação é "Folha de Obra"')
            )
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // P-4
  it('P-4.4: tipoLigacao === "Assistência Remota" AND remoteAssistanceId empty/undefined → errors MUST include remote assistance error', () => {
    /**
     * **Validates: Requirements DR-LIG-AC-015**
     * If tipoLigacao is "Assistência Remota" and remoteAssistanceId is missing,
     * validation must return an "Assistência remota é obrigatória" error.
     */
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(''), fc.constant(undefined as string | undefined)),
        fc.uuid(),
        (remoteAssistanceId, clientId) => {
          const activity = buildFullyValidActivity({
            clientId,
            tipoLigacao: 'Assistência Remota',
            remoteAssistanceId,
            assunto: 'Assunto obrigatório',
          });

          const errors = validateActivity(activity, 0, { isNewRecord: true });

          expect(
            errors.some((e) =>
              e.includes(
                'Assistência remota é obrigatória quando tipo de ligação é "Assistência Remota"'
              )
            )
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // P-4
  it('P-4.5: all fields valid → errors MUST be empty (no ligação-related errors)', () => {
    /**
     * **Validates: Requirements DR-LIG-AC-012, DR-LIG-AC-013, DR-LIG-AC-014, DR-LIG-AC-015**
     * If all mandatory fields are valid, validateActivity must return no errors.
     */
    fc.assert(
      fc.property(
        fc.uuid(),
        validTipoLigacaoArb,
        fc.uuid(),
        fc.uuid(),
        (clientId, tipoLigacao, workSheetId, remoteAssistanceId) => {
          const activity = buildFullyValidActivity({
            clientId,
            tipoLigacao,
            workSheetId: tipoLigacao === 'Folha de Obra' ? workSheetId : undefined,
            remoteAssistanceId:
              tipoLigacao === 'Assistência Remota' ? remoteAssistanceId : undefined,
            assunto: tipoLigacao === 'Assistência Remota' ? 'Assunto obrigatório' : 'Assunto',
          });

          const errors = validateActivity(activity, 0, { isNewRecord: true });

          expect(errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
