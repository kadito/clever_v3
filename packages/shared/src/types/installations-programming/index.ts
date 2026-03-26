// Export all types
export type {
  VectronLeituraXData,
  VectronConsultaDiariaData,
  MaterialInstaladoData,
  Phase1Data,
  Phase2Data,
  Phase3Data,
  Phase4Data,
  Phase5Data,
  InstallationsProgrammingData,
  InstallationsProgramming,
  InstallationsProgrammingCreationData,
  InstallationsProgrammingUpdateData,
  InstallationsProgrammingDisplayData,
} from './types';

// Export constants
export {
  CHECKLIST_CATEGORIES,
  CHECKLIST_LABELS,
  CHECKLIST_CATEGORY_LABELS,
  PHASE_NAMES,
} from './types';

// Export validation
export { calculateCompletedPhases, calculateIsCompleted } from './validation';
