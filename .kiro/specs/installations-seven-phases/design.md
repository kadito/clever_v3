# Instalações 7 Fases — Design

## 1. Data Model

### 1.1 Installation Content Type

```typescript
interface InstallationSevenPhasesData {
  // Relation
  clientId: string; // resolved via relations system

  // Metadata
  technician: TechnicianUser; // auto-assigned from auth context
  installationType: InstallationType; // selected in Phase 1

  // Equipment (Phase 1)
  equipmentMarca: string;
  equipmentModelo: string;
  equipmentNumeroSerie: string;
  equipmentFornecedor: string;

  // Phase data
  phase1: Phase1SetupData;
  phase2: Phase2RececaoData;
  phase3: Phase3ProgramacaoData;
  phase4: Phase4PreparacaoData;
  phase5: Phase5InstalacaoData;
  phase6: Phase6TestesData;
  phase7: Phase7FinalizacaoData;

  // Workflow state
  phaseStatuses: PhaseStatus[]; // length 7, index 0 = phase 1
  currentPhase: number; // 1-7, the active phase
  status: InstallationStatus; // 'in_progress' | 'complete'
}

type InstallationType = 'POS' | 'CPA' | 'balanças' | 'CCTV' | 'Alarmes' | 'Botões de chamada e relógios';

type PhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'unlocked';

type InstallationStatus = 'in_progress' | 'complete';

interface InstallationSevenPhases extends BaseContent {
  contentType: 'installations-programming'; // keeps same content type slug for backward compat
  data: InstallationSevenPhasesData;
}
```

**Decision: Content type slug**
Options: [A] New slug `installations-seven-phases` / [B] Reuse `installations-programming`
Chosen: [B] Reuse `installations-programming`
Reason: Avoids router changes, R2 migration, index rebuilds. Old data stays accessible. Frontend and backend routes remain `/installations-programming`.

### 1.2 Phase Interfaces

```typescript
// Phase 1 — Setup
interface Phase1SetupData {
  // Equipment selection already at top-level (installationType, equipment*)
  // Phase 1 has no additional fields beyond top-level equipment + client
}

// Phase 2 — Receção do Material
interface Phase2RececaoData {
  numeroSerie: string;
  marca: string;
  modelo: string;
  equipmentConditionOk: boolean | null; // null = not yet answered
  // Conditional fields (shown when equipmentConditionOk === false)
  verificacaoCabo: string;
  verificacaoFechadura: string;
  verificacaoChaves: string;
  verificacaoTestes: string;
  observacoes: string;
}

// Phase 3 — Programação / Preparação
interface Phase3ProgramacaoData {
  software: string;
  identificacaoReferencia: string;
  numeroLicenca: string;
  verificacaoInicioProgramacao: boolean;
  testeFinalEquipamentos: boolean;
  notasProgramacao: string; // multiline text area (supports line breaks)
}

// Phase 4 — Preparação Instalação
interface Phase4PreparacaoData {
  materialAdicional: string;
  checklist: EquipmentChecklist; // all categories always displayed
}

// Phase 5 — Instalação no Cliente
interface Phase5InstalacaoData {
  nrFatura: string;
  nrGuiaTransporte: string;
  dataInstalacao: string; // ISO date
  tecnicoInstalacao: string;
  horaInicial: string; // HH:MM
  horaFinal: string; // HH:MM
  // Training
  dataFormacao: string; // ISO date
  formacaoHoraInicial: string; // HH:MM
  formacaoHoraFinal: string; // HH:MM
  quemRecebeuFormacao: string;
}

// Phase 6 — Testes
interface Phase6TestesData {
  anydeskConfigurado: boolean | null; // null = not yet answered
  anydeskCodigo: string; // required when anydeskConfigurado === true
  anydeskMotivo: string; // required when anydeskConfigurado === false
  vectronConnectConfigurado: boolean | null;
  vectronConnectCodigo: string;
  vectronConnectMotivo: string;
}

// Phase 7 — Finalização
interface Phase7FinalizacaoData {
  dumpLido: boolean;
  copiaSeguranca: boolean;
  fotosInstalacao: FileReference[]; // multiple photos
}
```

### 1.3 Equipment Checklist

```typescript
interface EquipmentChecklist {
  pos: ChecklistCategory;
  impressora: ChecklistCategory;
  gavetaMetalica: ChecklistCategory;
  cpa: CpaChecklistCategory;
  acessorios: ChecklistCategory;
}

// Standard category — items are boolean checkboxes
interface ChecklistCategory {
  items: Record<string, boolean>;
}

// CPA has an additional text area for mini PC details
interface CpaChecklistCategory extends ChecklistCategory {
  miniPcDetails: string; // placeholder: "Marca, Modelo, n.º série, materiais"
}
```

**Checklist constants** (from INST7-CL-001 to CL-005):

```typescript
const CHECKLIST_ITEMS = {
  pos: ['caboPower', 'transformador', 'caboRede', 'displayCliente', 'impressora', 'autocolantes'],
  impressora: ['rolo', 'caboPower', 'transformador', 'caboLigacaoPOS', 'fichaAdaptadorRS232', 'autocolantes'],
  gavetaMetalica: ['chaves', 'autocolantes'],
  cpa: ['base', 'parafusos', 'transformador', 'caboComunicacaoMoedasNotas', 'caboRede', 'caboSerie'],
  acessorios: ['bobineCabo', 'fichasRede', 'adaptadoresImpressora', 'monitorInterior', 'soprador', 'alcool', 'pincel', 'panos', 'bracadeiras', 'mangueira', 'malaFerramentas', 'autocolantes'],
} as const;
```

### 1.4 Invariants & Edge Cases

| Invariant | Assertion |
|-----------|-----------|
| phaseStatuses length | `phaseStatuses.length === 7` always |
| Sequential progression | Phase N can only be `in_progress` if phase N-1 is `completed` (or `unlocked` then re-completed) |
| Status derivation | `status === 'complete'` iff all 7 phaseStatuses are `completed` |
| currentPhase bounds | `1 <= currentPhase <= 7` |
| equipmentConditionOk conditional | If `phase2.equipmentConditionOk === false`, at least one verification field must be non-empty |
| Anydesk/Vectron conditional | If configured = true → code required. If configured = false → motivo required |
| fotosInstalacao | Array of FileReference, can be empty (upload is optional until phase completion) |
| clientId required | Must be non-empty before completing Phase 1 |
| installationType required | Must be set before completing Phase 1 |
| Null booleans | `equipmentConditionOk`, `anydeskConfigurado`, `vectronConnectConfigurado` start as `null` (unanswered) |

### 1.5 Defaults on Creation

```typescript
const DEFAULT_INSTALLATION_DATA: Partial<InstallationSevenPhasesData> = {
  clientId: '',
  installationType: '' as any, // must be selected
  equipmentMarca: '',
  equipmentModelo: '',
  equipmentNumeroSerie: '',
  equipmentFornecedor: '',
  phase1: {},
  phase2: { equipmentConditionOk: null, numeroSerie: '', marca: '', modelo: '', verificacaoCabo: '', verificacaoFechadura: '', verificacaoChaves: '', verificacaoTestes: '', observacoes: '' },
  phase3: { software: '', identificacaoReferencia: '', numeroLicenca: '', verificacaoInicioProgramacao: false, testeFinalEquipamentos: false, notasProgramacao: '' },
  phase4: { materialAdicional: '', checklist: /* all items false */ },
  phase5: { nrFatura: '', nrGuiaTransporte: '', dataInstalacao: '', tecnicoInstalacao: '', horaInicial: '', horaFinal: '', dataFormacao: '', formacaoHoraInicial: '', formacaoHoraFinal: '', quemRecebeuFormacao: '' },
  phase6: { anydeskConfigurado: null, anydeskCodigo: '', anydeskMotivo: '', vectronConnectConfigurado: null, vectronConnectCodigo: '', vectronConnectMotivo: '' },
  phase7: { dumpLido: false, copiaSeguranca: false, fotosInstalacao: [] },
  phaseStatuses: ['in_progress', 'not_started', 'not_started', 'not_started', 'not_started', 'not_started', 'not_started'],
  currentPhase: 1,
  status: 'in_progress',
};
```

## 2. Phase Workflow & State Machine

### 2.1 State Transitions

```
Phase States: not_started → in_progress → completed
                                ↑               │
                                └───────────────┘ (Admin unlock → sets 'unlocked' → user edits → re-completes to 'completed')
```

**Sequential progression rule**: Phase N can transition to `in_progress` only when Phase N-1 is `completed`.

Exception: Phase 1 starts as `in_progress` on creation.

### 2.2 Phase Completion Logic

Each phase has a `validatePhaseCompletion(phaseNumber, data)` function in shared validation:

| Phase | Completion Criteria |
|-------|-------------------|
| 1 | clientId non-empty + installationType set + equipmentMarca non-empty |
| 2 | equipmentConditionOk answered (true or false). If false: at least one verification field non-empty |
| 3 | software non-empty + verificacaoInicioProgramacao = true + testeFinalEquipamentos = true |
| 4 | All checklist categories have at least one item checked |
| 5 | dataInstalacao non-empty + horaInicial non-empty + horaFinal non-empty |
| 6 | anydeskConfigurado answered + vectronConnectConfigurado answered. If true → code required. If false → motivo required |
| 7 | dumpLido = true + copiaSeguranca = true |

### 2.3 Save vs Complete Actions

- **Save**: Persists current phase data without validation. Phase status remains `in_progress`. User can save partial work and return later.
- **Complete Phase**: Validates all mandatory fields for the current phase. On success: sets phaseStatus to `completed`, advances `currentPhase` to N+1 (if N < 7). On Phase 7 completion: sets `status = 'complete'`.

### 2.4 Admin Unlock Flow

1. Admin clicks "Desbloquear" on a completed phase
2. Backend sets `phaseStatuses[N-1] = 'unlocked'`, `currentPhase = N`
3. Phase becomes editable again
4. On re-completion, status returns to `completed`
5. If a phase between 1 and currentPhase is unlocked, subsequent phases remain `completed` (no cascading reset)

### 2.5 Derived State

```typescript
function deriveCurrentPhase(phaseStatuses: PhaseStatus[]): number {
  // First non-completed phase (1-indexed)
  const idx = phaseStatuses.findIndex(s => s !== 'completed');
  return idx === -1 ? 7 : idx + 1;
}

function deriveInstallationStatus(phaseStatuses: PhaseStatus[]): InstallationStatus {
  return phaseStatuses.every(s => s === 'completed') ? 'complete' : 'in_progress';
}
```

## 3. API Layer

### 3.1 Endpoints

Same CRUD endpoints as current (`/api/content/installations-programming`). No new routes needed.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/content/installations-programming` | List all (with pagination, filters) |
| POST | `/api/content/installations-programming` | Create new installation |
| GET | `/api/content/installations-programming/:uuid` | Get single |
| PUT | `/api/content/installations-programming/:uuid` | Update (save or complete phase) |
| DELETE | `/api/content/installations-programming/:uuid` | Soft delete (Admin only) |
| POST | `/api/content/installations-programming/:uuid/files` | Upload photos (Phase 7) |
| GET | `/api/content/installations-programming/:uuid/files/:key` | Download file |

### 3.2 Request Payloads

**Create** — minimal payload (Phase 1 data only):
```typescript
{
  data: {
    clientId: string;
    installationType: InstallationType;
    equipmentMarca: string;
    equipmentModelo: string;
    equipmentNumeroSerie: string;
    equipmentFornecedor: string;
  }
}
```

**Update (Save Partial)** — sends only the current phase's data:
```typescript
{
  data: {
    phase2: { /* partial Phase2RececaoData */ },
    // action omitted or action: 'save'
  }
}
```

**Update (Complete Phase)** — sends phase data + action flag:
```typescript
{
  data: {
    phase3: { /* complete Phase3ProgramacaoData */ },
    action: 'complete-phase',
    targetPhase: 3
  }
}
```

**Update (Admin Unlock)** — admin sends unlock action:
```typescript
{
  data: {
    action: 'unlock-phase',
    targetPhase: 2
  }
}
```

### 3.3 Backend Validation Hooks

```typescript
// validateCreate: initializes all 7 phases with defaults, sets phaseStatuses, assigns technician
// validateUpdate: handles three actions:
//   1. 'save' (default) — merge partial phase data, no phase completion validation
//   2. 'complete-phase' — validate targetPhase completion criteria, update phaseStatuses
//   3. 'unlock-phase' — require Admin role, set phaseStatuses[N-1] = 'unlocked'
```

### 3.4 Index Fields

```typescript
function extractIndexFields(content: InstallationSevenPhases): Record<string, unknown> {
  return {
    clientId: content.data.clientId,
    technicianName: `${content.data.technician.firstName} ${content.data.technician.lastName}`.trim(),
    technicianUserId: content.data.technician.userId,
    installationType: content.data.installationType,
    currentPhase: content.data.currentPhase,
    status: content.data.status,
    isCompleted: content.data.status === 'complete',
    completedPhasesCount: content.data.phaseStatuses.filter(s => s === 'completed').length,
  };
}
```

## 4. Frontend Architecture

### 4.1 View Structure

Reuses existing 4-view pattern at same routes:

| View | Path | Purpose |
|------|------|---------|
| ListView | `/installations-programming` | List with status/phase indicators |
| CreateView | `/installations-programming/criar` | Phase 1 form only (create + complete Phase 1) |
| DetailView | `/installations-programming/:uuid` | Read-only phase viewer with navigation |
| UpdateView | `/installations-programming/:uuid/editar` | Phase editor (save/complete current phase) |

### 4.2 Component Hierarchy

```
views/installations-programming/
├── InstallationsProgrammingListView.vue    (refactored: status + current phase display)
├── InstallationsProgrammingCreateView.vue  (refactored: Phase 1 only → create)
├── InstallationsProgrammingDetailView.vue  (refactored: 7 phases read-only)
└── InstallationsProgrammingUpdateView.vue  (refactored: active phase editor)

components/installations-programming/
├── PhaseNavigation.vue          (refactored: 7 phases + locked indicators)
├── PhaseChecklist.vue           (refactored: new checklist categories from brief)
├── Phase1SetupForm.vue          (new: client selection + installation type + equipment)
├── Phase2RececaoForm.vue        (new: equipment condition + conditional verification)
├── Phase3ProgramacaoForm.vue    (new: software, license, programming toggles)
├── Phase4PreparacaoForm.vue     (new: material adicional + equipment checklists)
├── Phase5InstalacaoForm.vue     (new: installation data + training data)
├── Phase6TestesForm.vue         (new: anydesk + vectron connect toggles)
└── Phase7FinalizacaoForm.vue    (new: dump, backup, photo upload)
```

### 4.3 Phase Form Components

Each `PhaseNForm.vue` component:
- Receives `modelValue` (the phase data) + `disabled` prop (for locked phases)
- Emits `update:modelValue` on field changes (v-model pattern)
- Used in both DetailView (disabled=true, read-only display) and UpdateView (disabled=false, editable)

### 4.4 UpdateView Workflow

1. Load installation data
2. Display PhaseNavigation (locked phases show lock icon, only current active phase editable)
3. Show the active phase's form component
4. Two buttons: "Guardar" (save partial) and "Concluir Fase" (complete phase)
5. On "Concluir Fase": validate → PUT with `action: 'complete-phase'` → advance to next phase
6. On Phase 7 "Concluir Fase": installation status becomes `complete` → navigate to detail view

### 4.5 CreateView Workflow

1. Show Phase 1 form only (client selection, installation type, equipment fields)
2. On submit: POST creates installation → PUT with `action: 'complete-phase', targetPhase: 1` → navigate to UpdateView at Phase 2

**Simplification**: CreateView calls POST to create (which initializes all defaults), then immediately redirects to UpdateView. Phase 1 completion happens on creation if all required fields are filled.

### 4.6 ListView Enhancements

Display per item:
- Client name (from resolved relation)
- Installation type badge
- Status: "Em curso — Fase N" or "Completa"
- Phase progress dots (7 circles, filled for completed)

### 4.7 PhaseNavigation Refactor

Update from 5 phases to 7 phases:
- Update `PHASE_NAMES` constant to 7 entries
- Add lock icon overlay for `completed` phases (when user is not Admin)
- Add "unlocked" state styling (amber indicator, like current `in_progress`)

## 5. Permissions & Admin Actions

### 5.1 Permission Matrix

| Action | Admin | User |
|--------|-------|------|
| Create installation | ✅ | ✅ |
| Save partial phase | ✅ | ✅ |
| Complete phase | ✅ | ✅ |
| Edit completed phase (after unlock) | ✅ | ❌ |
| Unlock completed phase | ✅ | ❌ |
| Delete installation | ✅ | ❌ |
| View audit trail | ✅ | ❌ |

### 5.2 Implementation

**Shared permissions** — add new permission function:
```typescript
// In @clever/shared/permissions.ts
export function canUnlockPhase(userType: UserType | null | undefined): boolean {
  return isAdmin(userType);
}
```

**Frontend** — extend `usePermissions()` to expose `canUnlockPhase`.

**Backend** — check Admin role in `validateUpdate` when `action === 'unlock-phase'`. Return 403 with message "Não tem permissão para desbloquear fases" if not Admin.

### 5.3 UI Behavior

- User role: completed phases show lock icon, no unlock button visible
- Admin role: completed phases show lock icon + "Desbloquear" button in phase header
- Delete button: visible only to Admin in DetailView (existing pattern via `ContentDetailTemplate`)

## 6. Migration & Backward Compatibility

### 6.1 Strategy: In-Place Evolution

Since we reuse the `installations-programming` content type slug:
- No R2 key migration needed
- No index key changes
- No router changes
- Existing data continues to work

### 6.2 Data Compatibility

Old records (5-phase structure) need to be readable by the new 7-phase UI:

```typescript
// Migration adapter function (runs at read time in frontend)
function adaptLegacyData(data: any): InstallationSevenPhasesData {
  // Detect legacy format: has 'completedPhases' array of numbers + no 'phaseStatuses'
  if (Array.isArray(data.completedPhases) && !data.phaseStatuses) {
    return {
      ...DEFAULT_INSTALLATION_DATA,
      clientId: data.clientId || '',
      technician: data.technician,
      installationType: '', // legacy didn't have this
      // Map old phase data where possible
      phase3: mapLegacyPhase1ToPhase3(data.phase1), // old phase1 (Programação) → new phase3
      phase4: { ...DEFAULT_INSTALLATION_DATA.phase4, checklist: mapLegacyChecklist(data.phase2) },
      phase5: mapLegacyPhase3ToPhase5(data.phase3), // old phase3 (Instalação) → new phase5
      phase6: mapLegacyPhase4ToPhase6(data.phase4), // old phase4 (Testes) → new phase6
      phase7: mapLegacyPhase5ToPhase7(data.phase5), // old phase5 (Finalização) → new phase7
      phaseStatuses: ['completed', 'completed', ...], // derive from legacy completedPhases
      currentPhase: deriveLegacyCurrentPhase(data),
      status: data.isCompleted ? 'complete' : 'in_progress',
    };
  }
  return data; // Already new format
}
```

### 6.3 Migration Decision

**Options:**
- [A] Runtime adapter (read-time transformation, no data modification)
- [B] One-time batch migration script

**Chosen: [A] Runtime adapter**
Reason: Simpler, no downtime, no risk of data corruption. Old records are rare (~low frequency module). Performance impact negligible since it's a simple object mapping.

### 6.4 Shared Type Exports

Update `@clever/shared` index.ts to export new types alongside old ones:
- New types: `InstallationSevenPhasesData`, `Phase1SetupData` through `Phase7FinalizacaoData`, `PhaseStatus`, `InstallationStatus`, `EquipmentChecklist`, `InstallationType`
- Keep old types exported for backward compatibility during transition
- New constants: `PHASE_NAMES_SEVEN`, `CHECKLIST_ITEMS_SEVEN`, `INSTALLATION_TYPES`

### 6.5 Deletion of Old Code

After the new 7-phase system is validated in production:
- Remove old `Phase1Data` through `Phase5Data` interfaces
- Remove old `calculateCompletedPhases` function
- Remove old `CHECKLIST_CATEGORIES` / `CHECKLIST_LABELS` constants
- Remove runtime adapter
- This cleanup is **out of scope** for this spec — tracked as future tech debt
