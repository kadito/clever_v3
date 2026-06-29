/**
 * Installations & Programming API routes — 7-phase workflow
 * Implements full CRUD operations with sequential phase completion, save, and admin unlock actions
 * Requirements: INST7-BR-001, INST7-BR-002, INST7-BR-006, INST7-BR-007, INST7-BR-008,
 *              INST7-BR-011, INST7-BR-012, INST7-BR-013, INST7-AC-034, INST7-AC-035,
 *              INST7-AC-038, INST7-AC-039, INST7-AC-040, INST7-NFR-001
 */

import {
  createContentRoutes,
  createStandardContentConfig,
  contentErrorHandler,
  HttpValidationError,
} from './content-route-template';
import type { UserContext, InstallationSevenPhases, InstallationSevenPhasesData, PhaseStatus } from '@clever/shared';
import { validatePhaseCompletion, deriveCurrentPhase, deriveInstallationStatus, canUnlockPhase } from '@clever/shared';
import { extractTechnicianUser } from '../utils/technician-assignment';
import { Hono } from 'hono';

// ── Types ───────────────────────────────────────────────────────────

type WorkflowAction = 'save' | 'complete-phase' | 'unlock-phase';

interface UpdatePayload {
  action?: WorkflowAction;
  targetPhase?: number;
  [key: string]: unknown;
}

// ── Default data factory ────────────────────────────────────────────

function createDefaultInstallationData(): Omit<InstallationSevenPhasesData, 'technician'> {
  return {
    clientId: '',
    installationEntries: [],
    phase1: {},
    phase2: {
      equipamentoCliente: null,
      equipamentoClienteDescricao: '',
      verificacaoCabo: false,
      verificacaoTransformador: false,
      verificacaoFechadura: false,
      verificacaoChaves: false,
      verificacaoTestesEquipamento: false,
      observacoes: '',
    },
    phase3: {
      software: null,
      identificacaoReferencia: '',
      numeroLicenca: '',
      verificacaoInicioProgramacao: false,
      testeFinalEquipamentos: false,
      notasProgramacao: '',
    },
    phase4: {
      checklist: {
        pos: { enabled: true, items: {} },
        impressora: { enabled: true, items: {} },
        gavetaMetalica: { enabled: true, items: {} },
        cpa: { enabled: true, items: {}, miniPcDetails: '' },
        acessorios: { enabled: true, items: {} },
      },
      equipamentoAdicional: true,
      equipamentoAdicionalMotivo: '',
    },
    phase5: {
      nrFatura: '',
      nrGuiaTransporte: '',
      dataInstalacao: '',
      tecnicoInstalacao: '',
      horaInicial: '',
      horaFinal: '',
      dataFormacao: '',
      formacaoHoraInicial: '',
      formacaoHoraFinal: '',
      quemRecebeuFormacao: '',
    },
    phase6: {
      anydeskConfigurado: null,
      anydeskCodigo: '',
      anydeskMotivo: '',
      vectronConnectConfigurado: null,
      vectronConnectCodigo: '',
      vectronConnectMotivo: '',
      falhasDetectadas: null,
      falhasDescricao: '',
    },
    phase7: {
      dumpLido: false,
      copiaSeguranca: false,
      fotosInstalacao: [],
    },
    phaseStatuses: ['in_progress', 'not_started', 'not_started', 'not_started', 'not_started', 'not_started', 'not_started'],
    currentPhase: 1,
    status: 'in_progress',
  };
}

// ── Validation functions ────────────────────────────────────────────

/**
 * Validate and initialize data on creation
 * - Auto-assign technician from user context
 * - Initialize all 7 phases with defaults
 * - Merge any provided Phase 1 data (clientId, installationType, equipment fields)
 * Requirements: INST7-BR-001, INST7-AC-034
 */
function validateCreate(requestData: Record<string, unknown>, userContext?: UserContext): void {
  const data = (requestData.data || requestData) as Record<string, unknown>;

  if (!userContext) {
    throw new Error('Autenticação necessária para criar registo de instalação');
  }

  // Auto-assign technician
  const technician = extractTechnicianUser(userContext);

  // Create defaults and merge provided Phase 1 data
  const defaults = createDefaultInstallationData();
  const mergedData: Record<string, unknown> = {
    ...defaults,
    technician,
    clientId: (data.clientId as string) || defaults.clientId,
    installationEntries: (data.installationEntries as unknown[]) || defaults.installationEntries,
  };

  // Update original request
  if (requestData.data) {
    requestData.data = mergedData;
  } else {
    Object.keys(requestData).forEach((key) => delete requestData[key]);
    Object.assign(requestData, mergedData);
  }
}

/**
 * Validate and process update based on action type
 * - 'save' (default): merge partial phase data without validation
 * - 'complete-phase': validate completion criteria, advance workflow
 * - 'unlock-phase': Admin-only, sets phase to unlocked state
 * Requirements: INST7-BR-002, INST7-BR-006, INST7-BR-007, INST7-BR-008,
 *              INST7-BR-011, INST7-BR-012, INST7-BR-013, INST7-AC-035,
 *              INST7-AC-038, INST7-AC-039, INST7-AC-040
 */
function validateUpdate(
  requestData: Record<string, unknown>,
  existingContent?: InstallationSevenPhases,
  userContext?: UserContext,
): void {
  const data = (requestData.data || requestData) as UpdatePayload;
  const action: WorkflowAction = data.action || 'save';

  if (!existingContent) {
    throw new Error('Conteúdo não encontrado');
  }

  if (!userContext) {
    throw new Error('Autenticação necessária');
  }

  const existing = existingContent.data;

  switch (action) {
    case 'save':
      handleSaveAction(data, existing, requestData);
      break;
    case 'complete-phase':
      handleCompletePhaseAction(data, existing, requestData);
      break;
    case 'unlock-phase':
      handleUnlockPhaseAction(data, existing, userContext, requestData);
      break;
    default:
      throw new Error(`Ação inválida: ${action as string}`);
  }
}

// ── Action Handlers ─────────────────────────────────────────────────

/**
 * Save action: merge partial phase data without completion validation
 * Requirements: INST7-BR-006, INST7-AC-035
 */
function handleSaveAction(
  data: UpdatePayload,
  existing: InstallationSevenPhasesData,
  requestData: Record<string, unknown>,
): void {
  const merged: Record<string, unknown> = { ...existing };

  // Merge top-level fields if provided
  if (data.clientId !== undefined) merged.clientId = data.clientId;
  if (data.installationEntries !== undefined) merged.installationEntries = data.installationEntries;

  // Merge phase data (shallow merge per phase)
  if (data.phase1) merged.phase1 = { ...existing.phase1, ...(data.phase1 as Record<string, unknown>) };
  if (data.phase2) merged.phase2 = { ...existing.phase2, ...(data.phase2 as Record<string, unknown>) };
  if (data.phase3) merged.phase3 = { ...existing.phase3, ...(data.phase3 as Record<string, unknown>) };
  if (data.phase4) {
    const incomingPhase4 = data.phase4 as Record<string, unknown>;
    const existingPhase4 = existing.phase4;
    merged.phase4 = {
      ...existingPhase4,
      ...incomingPhase4,
      checklist: incomingPhase4.checklist
        ? { ...existingPhase4.checklist, ...(incomingPhase4.checklist as Record<string, unknown>) }
        : existingPhase4.checklist,
    };
  }
  if (data.phase5) merged.phase5 = { ...existing.phase5, ...(data.phase5 as Record<string, unknown>) };
  if (data.phase6) merged.phase6 = { ...existing.phase6, ...(data.phase6 as Record<string, unknown>) };
  if (data.phase7) merged.phase7 = { ...existing.phase7, ...(data.phase7 as Record<string, unknown>) };

  // Remove action/targetPhase from persisted data
  delete (merged as UpdatePayload).action;
  delete (merged as UpdatePayload).targetPhase;

  setRequestData(requestData, merged);
}

/**
 * Complete-phase action: validate phase criteria, advance workflow state
 * Requirements: INST7-BR-007, INST7-BR-008, INST7-BR-011, INST7-AC-038, INST7-AC-039
 */
function handleCompletePhaseAction(
  data: UpdatePayload,
  existing: InstallationSevenPhasesData,
  requestData: Record<string, unknown>,
): void {
  const targetPhase = data.targetPhase;

  if (!targetPhase || targetPhase < 1 || targetPhase > 7) {
    throw new Error('targetPhase inválido: deve ser entre 1 e 7');
  }

  // First merge any incoming phase data with existing (same as save)
  const merged: Record<string, unknown> = { ...existing };

  // Merge top-level fields if provided
  if (data.clientId !== undefined) merged.clientId = data.clientId;
  if (data.installationEntries !== undefined) merged.installationEntries = data.installationEntries;

  // Merge phase data
  if (data.phase1) merged.phase1 = { ...existing.phase1, ...(data.phase1 as Record<string, unknown>) };
  if (data.phase2) merged.phase2 = { ...existing.phase2, ...(data.phase2 as Record<string, unknown>) };
  if (data.phase3) merged.phase3 = { ...existing.phase3, ...(data.phase3 as Record<string, unknown>) };
  if (data.phase4) {
    const incomingPhase4 = data.phase4 as Record<string, unknown>;
    const existingPhase4 = existing.phase4;
    merged.phase4 = {
      ...existingPhase4,
      ...incomingPhase4,
      checklist: incomingPhase4.checklist
        ? { ...existingPhase4.checklist, ...(incomingPhase4.checklist as Record<string, unknown>) }
        : existingPhase4.checklist,
    };
  }
  if (data.phase5) merged.phase5 = { ...existing.phase5, ...(data.phase5 as Record<string, unknown>) };
  if (data.phase6) merged.phase6 = { ...existing.phase6, ...(data.phase6 as Record<string, unknown>) };
  if (data.phase7) merged.phase7 = { ...existing.phase7, ...(data.phase7 as Record<string, unknown>) };

  // Validate phase completion criteria
  const isValid = validatePhaseCompletion(targetPhase, merged as unknown as InstallationSevenPhasesData);
  if (!isValid) {
    throw new Error(`Fase ${targetPhase} não pode ser concluída: campos obrigatórios em falta`);
  }

  // Update phase statuses
  const phaseStatuses = [...existing.phaseStatuses] as PhaseStatus[];
  phaseStatuses[targetPhase - 1] = 'completed';

  // If not the last phase, set next phase to in_progress
  if (targetPhase < 7 && phaseStatuses[targetPhase] === 'not_started') {
    phaseStatuses[targetPhase] = 'in_progress';
  }

  merged.phaseStatuses = phaseStatuses;
  merged.currentPhase = deriveCurrentPhase(phaseStatuses);
  merged.status = deriveInstallationStatus(phaseStatuses);

  // Remove action/targetPhase from persisted data
  delete (merged as UpdatePayload).action;
  delete (merged as UpdatePayload).targetPhase;

  setRequestData(requestData, merged);
}

/**
 * Unlock-phase action: Admin-only, set phase to unlocked for re-editing
 * Requirements: INST7-BR-012, INST7-BR-013, INST7-AC-040
 */
function handleUnlockPhaseAction(
  data: UpdatePayload,
  existing: InstallationSevenPhasesData,
  userContext: UserContext,
  requestData: Record<string, unknown>,
): void {
  // Permission check — Admin only
  if (!canUnlockPhase(userContext.userType)) {
    console.warn('Phase unlock denied:', JSON.stringify({
      userId: userContext.userId,
      userType: userContext.userType,
      path: 'installations-programming',
    }, null, 2));
    throw new HttpValidationError('Não tem permissão para desbloquear fases', 403);
  }

  const targetPhase = data.targetPhase;

  if (!targetPhase || targetPhase < 1 || targetPhase > 7) {
    throw new Error('targetPhase inválido: deve ser entre 1 e 7');
  }

  // Phase must be completed to be unlocked
  if (existing.phaseStatuses[targetPhase - 1] !== 'completed') {
    throw new Error(`Fase ${targetPhase} não está concluída e não pode ser desbloqueada`);
  }

  // Update phase statuses
  const phaseStatuses = [...existing.phaseStatuses] as PhaseStatus[];
  phaseStatuses[targetPhase - 1] = 'unlocked';

  const merged: Record<string, unknown> = {
    ...existing,
    phaseStatuses,
    currentPhase: targetPhase,
    status: deriveInstallationStatus(phaseStatuses),
  };

  // Remove action/targetPhase from persisted data
  delete (merged as UpdatePayload).action;
  delete (merged as UpdatePayload).targetPhase;

  setRequestData(requestData, merged);
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Replace requestData content with merged data */
function setRequestData(requestData: Record<string, unknown>, merged: Record<string, unknown>): void {
  if (requestData.data) {
    requestData.data = merged;
  } else {
    Object.keys(requestData).forEach((key) => delete requestData[key]);
    Object.assign(requestData, merged);
  }
}

// ── Search and index extraction ─────────────────────────────────────

/**
 * Extract searchable text from content
 * Returns technician name in lowercase (client name resolved via relation in template)
 */
function extractSearchableText(content: InstallationSevenPhases): string {
  const tech = content.data.technician;
  if (tech?.firstName || tech?.lastName) {
    return `${tech.firstName || ''} ${tech.lastName || ''}`.trim().toLowerCase();
  }
  return '';
}

/**
 * Extract index fields for the search index
 * Requirements: INST7-NFR-001
 */
function extractIndexFields(content: InstallationSevenPhases): Record<string, unknown> {
  const data = content.data;
  const tech = data.technician;
  const technicianName = tech
    ? `${tech.firstName || ''} ${tech.lastName || ''}`.trim()
    : '';

  return {
    clientId: data.clientId || '',
    technicianName,
    technicianUserId: tech?.userId || '',
    installationTypes: (data.installationEntries || []).map((e: { tipo: string }) => e.tipo),
    currentPhase: data.currentPhase || 1,
    status: data.status || 'in_progress',
    isCompleted: data.status === 'complete',
    completedPhasesCount: data.phaseStatuses
      ? data.phaseStatuses.filter((s: PhaseStatus) => s === 'completed').length
      : 0,
  };
}

// ── Router setup ────────────────────────────────────────────────────

const installationsProgrammingRouter = new Hono();

installationsProgrammingRouter.use('*', contentErrorHandler);

const config = createStandardContentConfig<InstallationSevenPhases>(
  'installations-programming',
  'date-desc',
);

config.searchFields = ['searchableText'];
config.validateCreate = validateCreate;
config.validateUpdate = validateUpdate;
config.extractSearchableText = extractSearchableText;
config.extractIndexFields = extractIndexFields;

const crudRoutes = createContentRoutes<InstallationSevenPhases>(config);
installationsProgrammingRouter.route('/', crudRoutes);

export default installationsProgrammingRouter;
