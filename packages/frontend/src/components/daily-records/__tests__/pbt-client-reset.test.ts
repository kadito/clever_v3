// P-2 — Client Change Reset Invariant
// **Validates: Requirements DR-LIG-AC-010**
// Property: When client changes to a different non-empty client (previousClientId !== newClientId
// && previousClientId is non-empty), post-conditions:
//   - workSheetId is undefined
//   - remoteAssistanceId is undefined
//   - If timeAutoPopulated was true: horaInicio === '' AND horaFim === '' AND timeAutoPopulated === false
//   - fetchError is null

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Pure logic extracted from ActivityCard.handleClientSelected.
 * This mirrors the exact branching in the component without mounting Vue.
 */
interface ClientResetState {
  clientId: string;
  workSheetId: string | undefined;
  remoteAssistanceId: string | undefined;
  horaInicio: string;
  horaFim: string;
  timeAutoPopulated: boolean;
  fetchError: string | null;
}

interface ClientResetResult {
  clientId: string;
  workSheetId: string | undefined;
  remoteAssistanceId: string | undefined;
  horaInicio: string;
  horaFim: string;
  timeAutoPopulated: boolean;
  fetchError: string | null;
}

function handleClientSelectedLogic(
  state: ClientResetState,
  newClientId: string,
): ClientResetResult {
  const previousClientId = state.clientId;

  // fetchError is always cleared
  const result: ClientResetResult = {
    clientId: newClientId,
    workSheetId: state.workSheetId,
    remoteAssistanceId: state.remoteAssistanceId,
    horaInicio: state.horaInicio,
    horaFim: state.horaFim,
    timeAutoPopulated: state.timeAutoPopulated,
    fetchError: null,
  };

  // If client changed (not initial selection from empty)
  if (previousClientId && previousClientId !== newClientId) {
    result.workSheetId = undefined;
    result.remoteAssistanceId = undefined;

    if (state.timeAutoPopulated) {
      result.horaInicio = '';
      result.horaFim = '';
      result.timeAutoPopulated = false;
    }
  }

  // If client removed entirely
  if (!newClientId) {
    result.workSheetId = undefined;
    result.remoteAssistanceId = undefined;
    if (state.timeAutoPopulated) {
      result.horaInicio = '';
      result.horaFim = '';
      result.timeAutoPopulated = false;
    }
  }

  return result;
}

describe('P-2 — Client Change Reset Invariant', () => {
  it('when client changes to a different non-empty client, linked documents are cleared and time is reset if auto-populated', () => {
    fc.assert(
      fc.property(
        // previousClientId: always non-empty UUID (the property requires previousClientId is non-empty)
        fc.uuid(),
        // newClientId: different UUID from previous
        fc.uuid(),
        // workSheetId: optional UUID
        fc.option(fc.uuid()),
        // remoteAssistanceId: optional UUID
        fc.option(fc.uuid()),
        // timeAutoPopulated: boolean
        fc.boolean(),
        // horaInicio: arbitrary time-like string (HH:MM format)
        fc.string({ minLength: 0, maxLength: 5 }),
        // horaFim: arbitrary time-like string
        fc.string({ minLength: 0, maxLength: 5 }),
        (previousClientId, newClientId, workSheetId, remoteAssistanceId, timeAutoPopulated, horaInicio, horaFim) => {
          // Pre-condition: clients must be different (filter instead of assume for efficiency)
          fc.pre(previousClientId !== newClientId);

          const initialState: ClientResetState = {
            clientId: previousClientId,
            workSheetId: workSheetId ?? undefined,
            remoteAssistanceId: remoteAssistanceId ?? undefined,
            horaInicio,
            horaFim,
            timeAutoPopulated,
            fetchError: 'some previous error', // arbitrary non-null to verify it's cleared
          };

          const result = handleClientSelectedLogic(initialState, newClientId);

          // Post-condition 1: workSheetId is undefined
          expect(result.workSheetId).toBeUndefined();

          // Post-condition 2: remoteAssistanceId is undefined
          expect(result.remoteAssistanceId).toBeUndefined();

          // Post-condition 3: If timeAutoPopulated was true, time fields are cleared
          if (timeAutoPopulated) {
            expect(result.horaInicio).toBe('');
            expect(result.horaFim).toBe('');
            expect(result.timeAutoPopulated).toBe(false);
          }

          // Post-condition 4: fetchError is null
          expect(result.fetchError).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('when timeAutoPopulated was false, time fields are preserved on client change', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.option(fc.uuid()),
        fc.option(fc.uuid()),
        fc.string({ minLength: 0, maxLength: 5 }),
        fc.string({ minLength: 0, maxLength: 5 }),
        (previousClientId, newClientId, workSheetId, remoteAssistanceId, horaInicio, horaFim) => {
          fc.pre(previousClientId !== newClientId);

          const initialState: ClientResetState = {
            clientId: previousClientId,
            workSheetId: workSheetId ?? undefined,
            remoteAssistanceId: remoteAssistanceId ?? undefined,
            horaInicio,
            horaFim,
            timeAutoPopulated: false, // Not auto-populated
            fetchError: null,
          };

          const result = handleClientSelectedLogic(initialState, newClientId);

          // Documents are still cleared
          expect(result.workSheetId).toBeUndefined();
          expect(result.remoteAssistanceId).toBeUndefined();

          // But time fields are preserved when not auto-populated
          expect(result.horaInicio).toBe(horaInicio);
          expect(result.horaFim).toBe(horaFim);
          expect(result.timeAutoPopulated).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
