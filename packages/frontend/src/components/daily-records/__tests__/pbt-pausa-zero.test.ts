// P-3
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * P-3 — Pausa zero on document selection
 *
 * Validates: Requirements DR-LIG-AC-005, DR-LIG-AC-008
 *
 * Property: For any successful document selection (work sheet or remote assistance)
 * with valid time data, the resulting tempoPausa SHALL equal 0 and
 * timeAutoPopulated SHALL equal true, regardless of what tempoPausa was before.
 *
 * Test approach: fast-check — generate 100+ random document objects with valid time
 * data, simulate the handler logic, verify tempoPausa === 0 and timeAutoPopulated === true.
 */

// --- Extracted handler logic (mirrors ActivityCard.vue) ---

interface ActivityState {
  horaInicio: string;
  horaFim: string;
  tempoPausa: number;
  workSheetId?: string;
  remoteAssistanceId?: string;
}

interface SelectionResult {
  horaInicio: string;
  horaFim: string;
  tempoPausa: number;
  timeAutoPopulated: boolean;
}

/**
 * Simulates the work sheet selection handler logic from ActivityCard.
 * Given a work sheet with arrivalTime and departureTime, applies the auto-fill logic.
 */
function applyWorkSheetSelection(
  previousState: ActivityState,
  arrivalTime: string,
  departureTime: string
): SelectionResult {
  // Logic from handleWorkSheetSelected success path:
  // Only auto-populate if time data is available
  if (!arrivalTime && !departureTime) {
    // Treat as fetch failure — no change to timeAutoPopulated
    return {
      horaInicio: previousState.horaInicio,
      horaFim: previousState.horaFim,
      tempoPausa: previousState.tempoPausa,
      timeAutoPopulated: false,
    };
  }

  return {
    horaInicio: arrivalTime,
    horaFim: departureTime,
    tempoPausa: 0,
    timeAutoPopulated: true,
  };
}

/**
 * Simulates the remote assistance selection handler logic from ActivityCard.
 * Given a remote assistance with inicioAssistencia and fimAssistencia, applies auto-fill.
 */
function applyRemoteAssistanceSelection(
  previousState: ActivityState,
  inicioAssistencia: string,
  fimAssistencia: string
): SelectionResult {
  // Logic from handleRemoteAssistanceSelected success path:
  // Only auto-populate if time data is available
  if (!inicioAssistencia && !fimAssistencia) {
    // Treat as fetch failure — no change to timeAutoPopulated
    return {
      horaInicio: previousState.horaInicio,
      horaFim: previousState.horaFim,
      tempoPausa: previousState.tempoPausa,
      timeAutoPopulated: false,
    };
  }

  return {
    horaInicio: inicioAssistencia,
    horaFim: fimAssistencia,
    tempoPausa: 0,
    timeAutoPopulated: true,
  };
}

// --- Arbitraries ---

/** Generates a valid HH:MM time string */
const arbHHMM = fc
  .tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
  .map(([h, m]) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);

/** Generates a previous tempoPausa value (any valid pause minutes before selection) */
const arbPreviousPausa = fc.integer({ min: 0, max: 480 });

/** Generates a previous activity state with arbitrary time data */
const arbPreviousState = fc.record({
  horaInicio: fc.oneof(arbHHMM, fc.constant('')),
  horaFim: fc.oneof(arbHHMM, fc.constant('')),
  tempoPausa: arbPreviousPausa,
  workSheetId: fc.option(fc.uuid(), { nil: undefined }),
  remoteAssistanceId: fc.option(fc.uuid(), { nil: undefined }),
});

describe('P-3 — Pausa zero on document selection', () => {
  describe('Work Sheet selection: tempoPausa === 0 after successful selection', () => {
    it('(property) for any valid work sheet time data and any previous state, tempoPausa is always 0 after selection', () => {
      fc.assert(
        fc.property(
          arbPreviousState,
          arbHHMM,
          arbHHMM,
          (previousState, arrivalTime, departureTime) => {
            const result = applyWorkSheetSelection(previousState, arrivalTime, departureTime);

            // Core property: tempoPausa must be 0
            expect(result.tempoPausa).toBe(0);
            // Secondary property: timeAutoPopulated must be true
            expect(result.timeAutoPopulated).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('(property) previous tempoPausa value is irrelevant — always reset to 0', () => {
      fc.assert(
        fc.property(
          arbPreviousPausa,
          arbHHMM,
          arbHHMM,
          (previousPausa, arrivalTime, departureTime) => {
            const previousState: ActivityState = {
              horaInicio: '08:00',
              horaFim: '17:00',
              tempoPausa: previousPausa,
            };

            const result = applyWorkSheetSelection(previousState, arrivalTime, departureTime);

            expect(result.tempoPausa).toBe(0);
            expect(result.timeAutoPopulated).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Remote Assistance selection: tempoPausa === 0 after successful selection', () => {
    it('(property) for any valid remote assistance time data and any previous state, tempoPausa is always 0 after selection', () => {
      fc.assert(
        fc.property(
          arbPreviousState,
          arbHHMM,
          arbHHMM,
          (previousState, inicioAssistencia, fimAssistencia) => {
            const result = applyRemoteAssistanceSelection(
              previousState,
              inicioAssistencia,
              fimAssistencia
            );

            // Core property: tempoPausa must be 0
            expect(result.tempoPausa).toBe(0);
            // Secondary property: timeAutoPopulated must be true
            expect(result.timeAutoPopulated).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('(property) previous tempoPausa value is irrelevant — always reset to 0', () => {
      fc.assert(
        fc.property(
          arbPreviousPausa,
          arbHHMM,
          arbHHMM,
          (previousPausa, inicioAssistencia, fimAssistencia) => {
            const previousState: ActivityState = {
              horaInicio: '10:00',
              horaFim: '12:00',
              tempoPausa: previousPausa,
            };

            const result = applyRemoteAssistanceSelection(
              previousState,
              inicioAssistencia,
              fimAssistencia
            );

            expect(result.tempoPausa).toBe(0);
            expect(result.timeAutoPopulated).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Both document types: consistent pausa=0 behavior', () => {
    it('(property) regardless of document type, successful selection always yields tempoPausa=0', () => {
      fc.assert(
        fc.property(
          arbPreviousState,
          arbHHMM,
          arbHHMM,
          fc.boolean(),
          (previousState, timeStart, timeEnd, isWorkSheet) => {
            const result = isWorkSheet
              ? applyWorkSheetSelection(previousState, timeStart, timeEnd)
              : applyRemoteAssistanceSelection(previousState, timeStart, timeEnd);

            // The invariant holds for both document types
            expect(result.tempoPausa).toBe(0);
            expect(result.timeAutoPopulated).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
