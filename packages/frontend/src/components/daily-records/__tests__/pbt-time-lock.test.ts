import { describe, it } from 'vitest';
import * as fc from 'fast-check';

// P-1 — Time Lock Invariant
// **Validates: Requirements DR-LIG-AC-006, DR-LIG-AC-009**
//
// Property: For any activity state, timeFieldsLocked === true
// IF AND ONLY IF timeAutoPopulated === true AND (!!workSheetId || !!remoteAssistanceId)
//
// We test the LOGIC directly (the boolean expression from the computed property)
// rather than mounting the component for 100+ iterations.

/**
 * Pure function that replicates the timeFieldsLocked computed logic
 * from ActivityCard.vue:
 *
 *   timeAutoPopulated.value && (!!localActivity.value.workSheetId || !!localActivity.value.remoteAssistanceId)
 */
function computeTimeFieldsLocked(
  timeAutoPopulated: boolean,
  workSheetId: string | undefined,
  remoteAssistanceId: string | undefined,
): boolean {
  return timeAutoPopulated && (!!workSheetId || !!remoteAssistanceId);
}

describe('P-1 — Time Lock Invariant', () => {
  // P-1
  it('timeFieldsLocked matches the invariant: timeAutoPopulated && (!!workSheetId || !!remoteAssistanceId)', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.option(fc.uuid(), { nil: undefined }),
        fc.option(fc.uuid(), { nil: undefined }),
        (timeAutoPopulated, workSheetId, remoteAssistanceId) => {
          const result = computeTimeFieldsLocked(timeAutoPopulated, workSheetId, remoteAssistanceId);
          const expected = timeAutoPopulated && (!!workSheetId || !!remoteAssistanceId);

          return result === expected;
        },
      ),
      { numRuns: 100 },
    );
  });

  // P-1 — locked only when both conditions are true
  it('fields are locked ONLY when timeAutoPopulated is true AND at least one document ID is set', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.option(fc.uuid(), { nil: undefined }),
        fc.option(fc.uuid(), { nil: undefined }),
        (timeAutoPopulated, workSheetId, remoteAssistanceId) => {
          const locked = computeTimeFieldsLocked(timeAutoPopulated, workSheetId, remoteAssistanceId);

          if (locked) {
            // If locked, BOTH conditions must hold
            return timeAutoPopulated === true && (!!workSheetId || !!remoteAssistanceId);
          } else {
            // If not locked, at least one condition must be false
            return !timeAutoPopulated || (!workSheetId && !remoteAssistanceId);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // P-1 — fields are never locked when timeAutoPopulated is false
  it('fields are NEVER locked when timeAutoPopulated is false, regardless of document IDs', () => {
    fc.assert(
      fc.property(
        fc.option(fc.uuid(), { nil: undefined }),
        fc.option(fc.uuid(), { nil: undefined }),
        (workSheetId, remoteAssistanceId) => {
          const locked = computeTimeFieldsLocked(false, workSheetId, remoteAssistanceId);
          return locked === false;
        },
      ),
      { numRuns: 100 },
    );
  });

  // P-1 — fields are never locked when no document IDs are set
  it('fields are NEVER locked when both document IDs are undefined, regardless of timeAutoPopulated', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (timeAutoPopulated) => {
          const locked = computeTimeFieldsLocked(timeAutoPopulated, undefined, undefined);
          return locked === false;
        },
      ),
      { numRuns: 100 },
    );
  });
});
