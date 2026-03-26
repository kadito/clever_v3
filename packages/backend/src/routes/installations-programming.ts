/**
 * Installations & Programming API routes using the generic content route template
 * Implements full CRUD operations with phase-based validation and progress tracking
 * Requirements: REQ-01, REQ-07, REQ-08, REQ-10
 */

import {
  createContentRoutes,
  createStandardContentConfig,
  contentErrorHandler,
} from './content-route-template';
import type {
  UserContext,
  InstallationsProgramming,
  InstallationsProgrammingData,
} from '@clever/shared';
import { calculateCompletedPhases } from '@clever/shared';
import { extractTechnicianUser } from '../utils/technician-assignment';
import { Hono } from 'hono';

// ── Default phase data factories ────────────────────────────────────

function defaultPhase1() {
  return {
    plus: '',
    departamento: '',
    cabecalho: '',
    rede: '',
    vectronConnect: '',
    anydesk: '',
    seriesEquipamentos: '',
    ligacaoCPA: false,
    ligacaoGaveta: false,
    ligacaoImpressoraMonitor: false,
    ligacaoFaturadora: false,
    ligacaoDisplayClientes: false,
    ligacaoScanner: false,
    ligacaoLeitorCartoes: false,
    ligacaoFechaduraChaves: false,
    turnos: '',
    isVectron: false,
    vectronLeituraX: {
      plus1: '',
      plus2: '',
      departamentos: '',
      operadores: '',
      transacoesComIVA: '',
    },
    vectronConsultaDiaria: {
      leituraGerenteNormal: '',
      leituraSupervisor: '',
    },
  };
}

function defaultPhase2() {
  return { checklist: {} as Record<string, Record<string, boolean>> };
}

function defaultPhase3() {
  return {
    nrFatura: '',
    nrGuiaTransportes: '',
    dataInstalacao: '',
    horaInicialInstalacao: '',
    horaFinalInstalacao: '',
    dataFormacao: '',
    horaInicialFormacao: '',
    horaFinalFormacao: '',
    quemRecebeuFormacao: '',
    materialInstalado: {
      pos: false,
      cpa: false,
      balanca: false,
      cctv: false,
      alarme: false,
      impressora: false,
      ups: false,
      router: false,
      switchEquip: false,
      rolos: false,
      rolosQuantidade: 0,
    },
  };
}

function defaultPhase4() {
  return {
    anydeskTestado: false,
    anydeskCodigo: '',
    anydeskMotivo: '',
    vectronConnectTestado: false,
    vectronConnectCodigo: '',
    vectronConnectMotivo: '',
  };
}

function defaultPhase5() {
  return {
    dumpLido: false,
    copiaSeguranca: false,
    fotoInstalacao: false,
    fotoURL: '',
  };
}

// ── Validation functions ────────────────────────────────────────────

/**
 * Validate and initialize data on creation
 * - Auto-assign technician from user context
 * - Initialize all phases with defaults
 * - Set completedPhases: [] and isCompleted: false
 * Requirements: CA-01.1, CA-01.6
 */
function validateCreate(requestData: Record<string, unknown>, userContext?: UserContext): void {
  const data = (requestData.data || requestData) as Record<string, unknown>;

  if (!userContext) {
    throw new Error('Autenticação necessária para criar registo de instalação');
  }

  // Auto-assign technician
  data.technician = extractTechnicianUser(userContext);

  // Initialize phases with defaults (preserve any provided values)
  data.phase1 = { ...defaultPhase1(), ...(data.phase1 as Record<string, unknown> || {}) };
  data.phase2 = { ...defaultPhase2(), ...(data.phase2 as Record<string, unknown> || {}) };
  data.phase3 = { ...defaultPhase3(), ...(data.phase3 as Record<string, unknown> || {}) };
  data.phase4 = { ...defaultPhase4(), ...(data.phase4 as Record<string, unknown> || {}) };
  data.phase5 = { ...defaultPhase5(), ...(data.phase5 as Record<string, unknown> || {}) };

  // Initialize progress tracking
  data.completedPhases = [];
  data.isCompleted = false;
  data.clientId = data.clientId || '';

  // Update original request
  if (requestData.data) {
    requestData.data = data;
  } else {
    Object.assign(requestData, data);
  }
}

/**
 * Validate and merge data on update
 * - Auto-assign technician to current user
 * - Merge partial phase data (preserve existing for phases not in payload)
 * - Recalculate completedPhases and isCompleted
 * Requirements: CA-01.3, CA-08.4, CA-08.5
 */
function validateUpdate(
  requestData: Record<string, unknown>,
  existingContent?: InstallationsProgramming,
  userContext?: UserContext
): void {
  const data = (requestData.data || requestData) as Record<string, unknown>;

  // Auto-assign technician to current user
  if (userContext) {
    data.technician = extractTechnicianUser(userContext);
  }

  // Merge partial phase data — preserve existing data for phases not included in payload
  if (existingContent) {
    const existing = existingContent.data;

    if (!data.phase1) data.phase1 = existing.phase1;
    else data.phase1 = { ...existing.phase1, ...(data.phase1 as Record<string, unknown>) };

    if (!data.phase2) data.phase2 = existing.phase2;
    else data.phase2 = { ...existing.phase2, ...(data.phase2 as Record<string, unknown>) };

    if (!data.phase3) data.phase3 = existing.phase3;
    else data.phase3 = { ...existing.phase3, ...(data.phase3 as Record<string, unknown>) };

    if (!data.phase4) data.phase4 = existing.phase4;
    else data.phase4 = { ...existing.phase4, ...(data.phase4 as Record<string, unknown>) };

    if (!data.phase5) data.phase5 = existing.phase5;
    else data.phase5 = { ...existing.phase5, ...(data.phase5 as Record<string, unknown>) };

    // Preserve clientId if not provided
    if (data.clientId === undefined) data.clientId = existing.clientId;
  }

  // Recalculate completed phases
  const completedPhases = calculateCompletedPhases(data as unknown as InstallationsProgrammingData);
  data.completedPhases = completedPhases;
  data.isCompleted = completedPhases.length === 5;

  // Update original request
  if (requestData.data) {
    requestData.data = data;
  } else {
    Object.assign(requestData, data);
  }
}

// ── Search and index extraction ─────────────────────────────────────

/**
 * Extract searchable text from content
 * Returns technician name in lowercase (client name resolved via relation in template)
 * Requirements: CA-01.5, CA-10.5
 */
function extractSearchableText(content: InstallationsProgramming): string {
  const tech = content.data.technician;
  if (tech?.firstName || tech?.lastName) {
    return `${tech.firstName || ''} ${tech.lastName || ''}`.trim().toLowerCase();
  }
  return '';
}

/**
 * Extract index fields for the search index
 * Requirements: CA-10.5
 */
function extractIndexFields(content: InstallationsProgramming): Record<string, unknown> {
  const data = content.data;
  const tech = data.technician;
  const technicianName = tech
    ? `${tech.firstName || ''} ${tech.lastName || ''}`.trim()
    : '';

  return {
    clientId: data.clientId || '',
    technicianName,
    completedPhasesCount: data.completedPhases?.length || 0,
    isCompleted: data.isCompleted || false,
  };
}

// ── Router setup ────────────────────────────────────────────────────

const installationsProgrammingRouter = new Hono();

installationsProgrammingRouter.use('*', contentErrorHandler);

const config = createStandardContentConfig<InstallationsProgramming>(
  'installations-programming',
  'date-desc'
);

config.searchFields = ['searchableText'];
config.validateCreate = validateCreate;
config.validateUpdate = validateUpdate;
config.extractSearchableText = extractSearchableText;
config.extractIndexFields = extractIndexFields;

const crudRoutes = createContentRoutes<InstallationsProgramming>(config);
installationsProgrammingRouter.route('/', crudRoutes);

export default installationsProgrammingRouter;
