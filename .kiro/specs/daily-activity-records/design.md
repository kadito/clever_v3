# Design Document: Daily Activity Records

## Overview

The Daily Activity Records feature enables users to track their daily work activities with comprehensive time tracking, client associations, and optional links to related work sheets or remote assistance records. This content type follows the established CLEVER dashboard patterns for content management, including the 5-view pattern (Home → List → Detail → Create → Update), mobile-first responsive design, and automatic technician assignment.

### Key Features

- **Date-based Organization**: Activities grouped by date for easy daily tracking
- **Multiple Activities**: Support for unlimited activities per daily record
- **Activity Classification**: Internal vs External activity types
- **Time Tracking**: Start time, end time, break time with automatic total hours calculation
- **Activity Linking**: Optional references to Work Sheets or Remote Assistance records
- **Search Integration**: Searchable work sheet and remote assistance selection
- **Automatic Calculations**: Real-time total hours computation
- **Mobile Optimization**: Touch-friendly interface with 44px minimum touch targets
- **Relation Resolution**: Automatic resolution of linked content at display time

## Architecture

### Content Type Configuration

- **Content Type Code**: `daily-records`
- **Portuguese Label**: "Registo Diário de Atividade"
- **Storage Path**: `content/daily-records/{uuid}.json`
- **Index Path**: `indexes/daily-records-index.json`
- **API Base Path**: `/api/content/daily-records`

### Data Model

The daily record follows the BaseContent interface with a specialized data structure:

```typescript
interface DailyRecordContent extends BaseContent {
  contentType: 'daily-records';
  data: DailyRecordData;
  relations: {
    // Activities may have work sheet or remote assistance relations
    // Relations are resolved at display time
    [activityIndex: string]: {
      workSheet?: RelationResult;
      remoteAssistance?: RelationResult;
    };
  };
}

interface DailyRecordData {
  dataRegistro: string; // ISO date string (YYYY-MM-DD)
  atividades: Activity[];
}

interface Activity {
  tipoAtividade: 'Interno' | 'Externo';
  assunto: string;
  horaInicio: string; // HH:MM format
  horaFim: string; // HH:MM format
  tempoPausa: number; // minutes
  totalHoras: string; // Calculated HH:MM format
  descricao?: string;
  tipoLigacao: 'Nenhuma' | 'Folha de Obra' | 'Assistência Remota';
  workSheetId?: string; // UUID when tipoLigacao = 'Folha de Obra'
  remoteAssistanceId?: string; // UUID when tipoLigacao = 'Assistência Remota'
}
```


## Components and Interfaces

### Frontend Components

#### View Components

1. **DailyRecordsListView.vue**
   - Displays paginated list of daily records
   - Shows date, number of activities, and total hours summary
   - Supports search and filtering by date range
   - Reverse chronological order (newest first)
   - Mobile-responsive card layout

2. **DailyRecordsDetailView.vue**
   - Displays complete daily record information
   - Shows all activities with full details
   - Displays resolved relations (work sheets, remote assistance)
   - Handles relation resolution errors gracefully
   - Shows audit trail (Admin only)
   - Includes delete functionality (Admin only)

3. **DailyRecordsCreateView.vue**
   - Form for creating new daily records
   - Uses ContentCreateTemplate wrapper
   - Implements dynamic activity management
   - Time input formatting (XXXX → XX:XX)
   - Conditional field visibility based on link type
   - Real-time total hours calculation

4. **DailyRecordsUpdateView.vue**
   - Form for updating existing daily records
   - Uses ContentFormTemplate directly
   - Same functionality as create view
   - Pre-populates with existing data
   - Maintains activity order

#### Reusable Components

5. **ActivityCard.vue**
   - Displays or edits a single activity
   - Supports both view and edit modes
   - Handles time input formatting
   - Shows/hides conditional fields based on link type
   - Calculates total hours automatically
   - Touch-friendly add/remove buttons

6. **WorkSheetSearchInput.vue**
   - Search and select work sheets
   - Similar pattern to ClientSearchInput
   - Displays work sheet identification (date, client, service type)
   - Debounced search with loading states
   - Dropdown with recent work sheets
   - Mobile-optimized

7. **RemoteAssistanceSearchInput.vue**
   - Search and select remote assistance records
   - Similar pattern to ClientSearchInput
   - Displays assistance identification (date, client, type)
   - Debounced search with loading states
   - Dropdown with recent records
   - Mobile-optimized

### Form Configuration

**File**: `packages/frontend/src/config/daily-records-form-sections.ts`

```typescript
export const dailyRecordsFormSections: FormSection[] = [
  {
    key: 'general',
    title: 'Informação Geral',
    fields: [
      {
        key: 'dataRegistro',
        label: 'Data do Registo',
        type: 'date',
        required: true,
        placeholder: 'Selecione a data',
      },
    ],
  },
  {
    key: 'activities',
    title: 'Atividades',
    fields: [
      // Dynamic activity management
      // Activities are managed through ActivityCard components
      // Not traditional form fields
    ],
  },
];
```


### Backend Components

#### API Routes

**File**: `packages/backend/src/routes/content/daily-records.ts`

Standard content CRUD operations with automatic relation resolution:

- `GET /api/content/daily-records` - List with search/filter
- `GET /api/content/daily-records/:uuid` - Get single record with resolved relations
- `POST /api/content/daily-records` - Create new record
- `PUT /api/content/daily-records/:uuid` - Update record
- `DELETE /api/content/daily-records/:uuid` - Soft delete (Admin only)

#### Validation

**File**: `packages/shared/src/types/daily-records/validation.ts`

```typescript
export function validateDailyRecordCreation(data: DailyRecordCreationData): string[] {
  const errors: string[] = [];

  // Date validation
  if (!data.dataRegistro) {
    errors.push('Data do registo é obrigatória');
  } else if (!isValidDate(data.dataRegistro)) {
    errors.push('Data do registo deve ser uma data válida');
  }

  // Activities validation
  if (!data.atividades || data.atividades.length === 0) {
    errors.push('Pelo menos uma atividade é obrigatória');
  } else {
    data.atividades.forEach((activity, index) => {
      const activityErrors = validateActivity(activity, index);
      errors.push(...activityErrors);
    });
  }

  return errors;
}

function validateActivity(activity: Activity, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Atividade ${index + 1}:`;

  // Activity type
  if (!activity.tipoAtividade) {
    errors.push(`${prefix} Tipo de atividade é obrigatório`);
  } else if (!['Interno', 'Externo'].includes(activity.tipoAtividade)) {
    errors.push(`${prefix} Tipo de atividade inválido`);
  }

  // Subject
  if (!activity.assunto || activity.assunto.trim() === '') {
    errors.push(`${prefix} Assunto é obrigatório`);
  }

  // Time validation
  if (!activity.horaInicio) {
    errors.push(`${prefix} Hora de início é obrigatória`);
  } else if (!isValidTimeFormat(activity.horaInicio)) {
    errors.push(`${prefix} Hora de início deve estar no formato HH:MM`);
  }

  if (!activity.horaFim) {
    errors.push(`${prefix} Hora de fim é obrigatória`);
  } else if (!isValidTimeFormat(activity.horaFim)) {
    errors.push(`${prefix} Hora de fim deve estar no formato HH:MM`);
  }

  // Validate end time is after start time (accounting for overnight)
  if (activity.horaInicio && activity.horaFim && 
      isValidTimeFormat(activity.horaInicio) && isValidTimeFormat(activity.horaFim)) {
    const startMinutes = timeToMinutes(activity.horaInicio);
    const endMinutes = timeToMinutes(activity.horaFim);
    
    // For same-day activities, end must be after start
    if (endMinutes <= startMinutes && endMinutes !== 0) {
      // Allow overnight activities (end time before start time)
      // But not when end time equals start time
      if (endMinutes === startMinutes) {
        errors.push(`${prefix} Hora de fim deve ser diferente da hora de início`);
      }
    }
  }

  // Break time
  if (activity.tempoPausa === undefined || activity.tempoPausa === null) {
    errors.push(`${prefix} Tempo de pausa é obrigatório`);
  } else if (activity.tempoPausa < 0) {
    errors.push(`${prefix} Tempo de pausa não pode ser negativo`);
  }

  // Link type
  if (!activity.tipoLigacao) {
    errors.push(`${prefix} Tipo de ligação é obrigatório`);
  } else if (!['Nenhuma', 'Folha de Obra', 'Assistência Remota'].includes(activity.tipoLigacao)) {
    errors.push(`${prefix} Tipo de ligação inválido`);
  }

  // Conditional validation based on link type
  if (activity.tipoLigacao === 'Folha de Obra' && !activity.workSheetId) {
    errors.push(`${prefix} Folha de obra é obrigatória quando tipo de ligação é "Folha de Obra"`);
  }

  if (activity.tipoLigacao === 'Assistência Remota' && !activity.remoteAssistanceId) {
    errors.push(`${prefix} Assistência remota é obrigatória quando tipo de ligação é "Assistência Remota"`);
  }

  return errors;
}
```


## Data Models

### TypeScript Interfaces

**File**: `packages/shared/src/types/daily-records/index.ts`

```typescript
/**
 * Daily Record Creation Data
 * Used when creating a new daily record
 */
export interface DailyRecordCreationData {
  dataRegistro: string; // ISO date string (YYYY-MM-DD)
  atividades: Activity[];
}

/**
 * Daily Record Update Data
 * Used when updating an existing daily record
 */
export interface DailyRecordUpdateData {
  dataRegistro?: string;
  atividades?: Activity[];
}

/**
 * Activity within a daily record
 */
export interface Activity {
  tipoAtividade: 'Interno' | 'Externo';
  assunto: string;
  horaInicio: string; // HH:MM format
  horaFim: string; // HH:MM format
  tempoPausa: number; // minutes
  totalHoras: string; // Calculated HH:MM format
  descricao?: string;
  tipoLigacao: 'Nenhuma' | 'Folha de Obra' | 'Assistência Remota';
  workSheetId?: string; // UUID when tipoLigacao = 'Folha de Obra'
  remoteAssistanceId?: string; // UUID when tipoLigacao = 'Assistência Remota'
}

/**
 * Daily Record with resolved relations
 * Returned by API endpoints
 */
export interface DailyRecordWithRelations extends ContentWithRelations<DailyRecordData> {
  contentType: 'daily-records';
  data: DailyRecordData;
  relations: DailyRecordRelations;
}

/**
 * Daily Record Data structure
 */
export interface DailyRecordData {
  dataRegistro: string;
  atividades: Activity[];
}

/**
 * Relations structure for daily records
 * Each activity may have work sheet or remote assistance relations
 */
export interface DailyRecordRelations {
  [activityIndex: string]: {
    workSheet?: RelationResult;
    remoteAssistance?: RelationResult;
  };
}
```

### Relation Configuration

**File**: `packages/shared/src/relation-configs.ts`

```typescript
export const CONTENT_RELATION_CONFIGS: Record<ContentType, RelationFieldConfig[]> = {
  // ... existing configs
  'daily-records': [
    {
      fieldName: 'workSheetId',
      relationType: 'workSheet',
      targetContentType: 'work-sheets',
      isRequired: false,
      isArray: false,
    },
    {
      fieldName: 'remoteAssistanceId',
      relationType: 'remoteAssistance',
      targetContentType: 'remote-assistance',
      isRequired: false,
      isArray: false,
    },
  ],
};
```

### Time Calculation Logic

```typescript
/**
 * Calculate total hours from start time, end time, and break time
 * Handles overnight activities (end time before start time)
 */
export function calculateTotalHours(
  horaInicio: string,
  horaFim: string,
  tempoPausa: number
): string {
  const startMinutes = timeToMinutes(horaInicio);
  const endMinutes = timeToMinutes(horaFim);
  
  let workMinutes: number;
  
  if (endMinutes < startMinutes) {
    // Overnight activity: add 24 hours (1440 minutes)
    workMinutes = (endMinutes + 1440) - startMinutes;
  } else {
    workMinutes = endMinutes - startMinutes;
  }
  
  // Subtract break time
  const totalMinutes = workMinutes - tempoPausa;
  
  if (totalMinutes < 0) {
    return '00:00'; // Invalid: break time exceeds work time
  }
  
  return minutesToTime(totalMinutes);
}

/**
 * Convert HH:MM time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes to HH:MM time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Validate time format (HH:MM)
 */
function isValidTimeFormat(time: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be combined or consolidated:

- Properties 5.1 and 5.2 (time format validation) can be combined into a single property about time format validation
- Properties 9.1-9.5 and 10.1-10.5 (search input behavior) follow the same pattern and can be generalized
- Properties 1.4 and 1.5 (UUID and audit trail initialization) are part of standard content creation and can be combined
- Properties 2.1 and 2.3 (add/remove activities) are inverse operations and can be combined into activity array management
- Properties 7.1 and 7.2 (calculation trigger) can be combined into reactive calculation property
- Properties 13.3 and 13.4 (relation resolution and error handling) can be combined
- Properties 15.1 and 15.3 (soft delete behavior) can be combined
- Properties 20.1 and 20.2 (audit trail visibility) can be combined into permission-based display

### Core Properties

**Property 1: Date Validation**
*For any* daily record creation or update, the dataRegistro field must be a valid ISO date string, and records without valid dates must be rejected.
**Validates: Requirements 1.1, 14.1**

**Property 2: Minimum Activity Requirement**
*For any* daily record, at least one activity must be present in the atividades array, and records with zero activities must be rejected.
**Validates: Requirements 1.2**

**Property 3: Content Creation Initialization**
*For any* created daily record, the system must assign a unique UUID, initialize audit trail fields (createdAt, createdBy, version), and automatically assign the authenticated user as technician.
**Validates: Requirements 1.3, 1.4, 1.5**

**Property 4: Activity Array Management**
*For any* daily record with N activities, adding an activity results in N+1 activities, and removing an activity results in N-1 activities, while maintaining the order of remaining activities.
**Validates: Requirements 2.1, 2.3, 2.4**

**Property 5: Activity Isolation During Edit**
*For any* daily record with multiple activities, editing one activity must not modify any other activities in the array.
**Validates: Requirements 2.2**

**Property 6: Activity Capacity**
*For any* daily record, the system must support adding at least 100 activities without errors.
**Validates: Requirements 2.5**

**Property 7: Activity Type Validation**
*For any* activity, the tipoAtividade field must be either "Interno" or "Externo", and activities with other values or missing activity type must be rejected.
**Validates: Requirements 3.1, 3.2**

**Property 8: Subject Requirement**
*For any* activity, the assunto field must be a non-empty string, and activities with empty or missing subjects must be rejected.
**Validates: Requirements 4.1**

**Property 9: Description Optionality**
*For any* activity, the descricao field may be omitted or empty, and such activities must be accepted if all required fields are valid.
**Validates: Requirements 4.3**

**Property 10: Time Format Validation**
*For any* activity, both horaInicio and horaFim must match the HH:MM format pattern (00:00 to 23:59), and activities with invalid time formats must be rejected.
**Validates: Requirements 5.1, 5.2, 6.4**

**Property 11: Time Relationship Validation**
*For any* activity with same-day times (horaFim > horaInicio), the end time must be after the start time, and activities where end time equals start time must be rejected.
**Validates: Requirements 5.3, 16.3**

**Property 12: Break Time Validation**
*For any* activity, tempoPausa must be a non-negative number, and activities with negative break times must be rejected.
**Validates: Requirements 5.4**

**Property 13: Total Hours Calculation**
*For any* activity with valid horaInicio, horaFim, and tempoPausa, the totalHoras must equal (horaFim - horaInicio - tempoPausa) in HH:MM format, accounting for overnight activities where horaFim < horaInicio.
**Validates: Requirements 5.5, 7.1, 7.2, 7.3**

**Property 14: Break Time Constraint**
*For any* activity, when tempoPausa exceeds the duration between horaInicio and horaFim, the system must display a validation error and reject the activity.
**Validates: Requirements 7.5, 16.4**

**Property 15: Time Input Formatting**
*For any* time input receiving 4 consecutive digits (e.g., "1030"), the system must automatically format it as "XX:XX" (e.g., "10:30").
**Validates: Requirements 6.1**

**Property 16: Link Type Requirement**
*For any* activity, the tipoLigacao field must be one of "Nenhuma", "Folha de Obra", or "Assistência Remota", and activities with other values or missing link type must be rejected.
**Validates: Requirements 8.1**

**Property 17: Conditional Link Validation**
*For any* activity where tipoLigacao is "Folha de Obra", workSheetId must be present; where tipoLigacao is "Assistência Remota", remoteAssistanceId must be present; where tipoLigacao is "Nenhuma", neither ID is required.
**Validates: Requirements 8.2, 8.3, 8.4**

**Property 18: Relation ID Storage**
*For any* activity with linked content, only the relation UUID (workSheetId or remoteAssistanceId) must be stored, not the full relation object.
**Validates: Requirements 8.5**

**Property 19: Conditional Field Visibility**
*For any* activity form, when tipoLigacao is "Nenhuma", both search inputs must be hidden; when "Folha de Obra", only work sheet search must be visible; when "Assistência Remota", only remote assistance search must be visible.
**Validates: Requirements 11.1, 11.2, 11.3**

**Property 20: Link Type Change Clears Selection**
*For any* activity, changing tipoLigacao must clear any previously selected workSheetId or remoteAssistanceId.
**Validates: Requirements 11.4**

**Property 21: Search Functionality**
*For any* search input (work sheet or remote assistance), typing a query must trigger a debounced search that returns matching records based on relevant fields.
**Validates: Requirements 9.2, 10.2**

**Property 22: Selection Storage**
*For any* search input, selecting a result must store the selected item's UUID in the appropriate field (workSheetId or remoteAssistanceId).
**Validates: Requirements 9.4, 10.4**

**Property 23: Deleted Records Exclusion**
*For any* daily records list request, the response must exclude all records where isDeleted is true.
**Validates: Requirements 12.1, 15.4**

**Property 24: List Display Information**
*For any* daily record in a list view, the display must include dataRegistro, the count of activities, and the sum of all totalHoras values.
**Validates: Requirements 12.2**

**Property 25: Date Range Filtering**
*For any* daily records list request with date range parameters, the response must include only records where dataRegistro falls within the specified range.
**Validates: Requirements 12.4**

**Property 26: Chronological Ordering**
*For any* daily records list response, records must be ordered by dataRegistro in descending order (newest first).
**Validates: Requirements 12.5**

**Property 27: Relation Resolution**
*For any* daily record retrieval, all activity relations (workSheetId and remoteAssistanceId) must be resolved, returning either the related content's basic data or a structured error object (404 or 500).
**Validates: Requirements 13.3, 13.4, 18.1, 18.2, 18.3, 18.4**

**Property 28: Update Validation Consistency**
*For any* daily record update, all validation rules must match those applied during creation.
**Validates: Requirements 14.5**

**Property 29: Version Increment on Update**
*For any* daily record update, the version number must increment by 1, and updatedAt and updatedBy fields must be updated.
**Validates: Requirements 14.3, 14.4**

**Property 30: Soft Delete Behavior**
*For any* daily record deletion by an admin user, the record must have isDeleted set to true, and deletedAt and deletedBy fields must be populated, without removing the record from storage.
**Validates: Requirements 15.1, 15.3**

**Property 31: Delete Permission Enforcement**
*For any* delete attempt by a non-admin user, the system must reject the operation and return a 403 Forbidden error.
**Validates: Requirements 15.2**

**Property 32: Validation Error Messages**
*For any* validation failure, the system must return field-specific error messages in Portuguese that clearly identify the invalid field and the validation rule that failed.
**Validates: Requirements 16.1, 16.2**

**Property 33: Form Submission Prevention**
*For any* form with validation errors, the submit action must be prevented until all errors are resolved.
**Validates: Requirements 16.5**

**Property 34: Touch Target Compliance**
*For any* interactive element in the daily records interface, the minimum touch target size must be 44px × 44px.
**Validates: Requirements 17.1, 17.5**

**Property 35: Responsive Layout Adaptation**
*For any* viewport width from 320px to 1280px+, the daily records interface must adapt its layout appropriately, with activity cards stacking vertically on mobile devices.
**Validates: Requirements 17.3, 17.4**

**Property 36: Storage Path Consistency**
*For any* daily record creation, the record must be stored at the path `content/daily-records/{uuid}.json`, and the daily-records-index.json file must be updated.
**Validates: Requirements 19.1, 19.3**

**Property 37: JSON Format Validity**
*For any* daily record stored in R2, the file content must be valid JSON that can be parsed without errors.
**Validates: Requirements 19.4**

**Property 38: Audit Trail Visibility by Role**
*For any* daily record detail view, admin users must see the Histórico section with complete audit trail information, while non-admin users must not see this section.
**Validates: Requirements 20.1, 20.2, 13.5**

**Property 39: Audit Trail Completeness**
*For any* displayed audit trail, it must include createdBy, createdAt, updatedBy, and updatedAt fields, with user email addresses shown when available and "Sistema" shown for system-generated actions.
**Validates: Requirements 20.3, 20.4, 20.5**


## Error Handling

### Validation Errors

All validation errors must be returned in Portuguese with field-specific messages:

```typescript
const VALIDATION_ERRORS = {
  DATE_REQUIRED: 'Data do registo é obrigatória',
  DATE_INVALID: 'Data do registo deve ser uma data válida',
  ACTIVITIES_REQUIRED: 'Pelo menos uma atividade é obrigatória',
  ACTIVITY_TYPE_REQUIRED: 'Tipo de atividade é obrigatório',
  ACTIVITY_TYPE_INVALID: 'Tipo de atividade inválido',
  SUBJECT_REQUIRED: 'Assunto é obrigatório',
  START_TIME_REQUIRED: 'Hora de início é obrigatória',
  START_TIME_INVALID: 'Hora de início deve estar no formato HH:MM',
  END_TIME_REQUIRED: 'Hora de fim é obrigatória',
  END_TIME_INVALID: 'Hora de fim deve estar no formato HH:MM',
  END_TIME_SAME_AS_START: 'Hora de fim deve ser diferente da hora de início',
  BREAK_TIME_REQUIRED: 'Tempo de pausa é obrigatório',
  BREAK_TIME_NEGATIVE: 'Tempo de pausa não pode ser negativo',
  BREAK_TIME_EXCEEDS_WORK: 'Tempo de pausa não pode exceder o tempo de trabalho',
  LINK_TYPE_REQUIRED: 'Tipo de ligação é obrigatório',
  LINK_TYPE_INVALID: 'Tipo de ligação inválido',
  WORK_SHEET_REQUIRED: 'Folha de obra é obrigatória quando tipo de ligação é "Folha de Obra"',
  REMOTE_ASSISTANCE_REQUIRED: 'Assistência remota é obrigatória quando tipo de ligação é "Assistência Remota"',
};
```

### Relation Resolution Errors

When relations cannot be resolved, return structured error objects:

```typescript
// 404 - Related content not found
{
  type: 'error',
  code: 404,
  message: 'Not found'
}

// 500 - Server error during resolution
{
  type: 'error',
  code: 500,
  message: 'Internal Server Error'
}
```

### Permission Errors

```typescript
// 403 - Delete permission denied
{
  error: 'Não tem permissão para eliminar conteúdo',
  code: 403
}

// 401 - Not authenticated
{
  error: 'Não autenticado',
  code: 401
}
```

### API Error Responses

All API errors follow the standard format:

```typescript
{
  success: false,
  error: string,
  timestamp: string
}
```

## Testing Strategy

### Dual Testing Approach

The daily activity records feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Specific time calculation examples (e.g., 09:00 to 17:00 with 60 min break = 07:00)
- Overnight activity examples (e.g., 23:00 to 02:00 = 03:00)
- Edge cases: midnight times, zero break time, maximum activities
- Component integration: ActivityCard, search inputs, form templates
- Error display and user feedback

**Property-Based Tests**: Verify universal properties across all inputs
- Time calculation correctness for all valid time combinations
- Activity array management for any number of activities
- Validation rules for all possible input combinations
- Relation resolution for all relation types
- Permission enforcement for all user roles

### Property Test Configuration

- **Library**: fast-check for TypeScript
- **Iterations**: Minimum 100 per property test
- **Tagging**: Each test must reference its design property
- **Format**: `Feature: daily-activity-records, Property {number}: {property_text}`

### Test Coverage Requirements

**Backend Tests** (`packages/backend/src/routes/content/daily-records.test.ts`):
- Property 1: Date validation across all date formats
- Property 2: Minimum activity requirement
- Property 3: Content creation initialization
- Property 13: Total hours calculation for all time combinations
- Property 27: Relation resolution with various scenarios
- Property 30: Soft delete behavior
- Property 31: Delete permission enforcement

**Frontend Tests** (`packages/frontend/src/views/daily-records/*.test.ts`):
- Property 4: Activity array management
- Property 15: Time input formatting
- Property 19: Conditional field visibility
- Property 34: Touch target compliance
- Property 35: Responsive layout adaptation

**Shared Tests** (`packages/shared/src/types/daily-records/validation.test.ts`):
- Property 7: Activity type validation
- Property 10: Time format validation
- Property 11: Time relationship validation
- Property 12: Break time validation
- Property 14: Break time constraint
- Property 16: Link type requirement
- Property 17: Conditional link validation

### Manual Testing Checklist

- [ ] Create daily record with single activity
- [ ] Create daily record with multiple activities
- [ ] Add/edit/remove activities dynamically
- [ ] Test time input formatting (type 1030 → 10:30)
- [ ] Test overnight activities (23:00 to 02:00)
- [ ] Test break time exceeding work duration (error)
- [ ] Link activity to work sheet
- [ ] Link activity to remote assistance
- [ ] Change link type and verify field clearing
- [ ] Search for work sheets and remote assistance
- [ ] View daily record with resolved relations
- [ ] View daily record with relation errors (404)
- [ ] Update existing daily record
- [ ] Delete daily record as admin
- [ ] Attempt delete as non-admin (should fail)
- [ ] Test on mobile device (320px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1280px+ width)
- [ ] Verify all touch targets are 44px minimum
- [ ] Test Portuguese error messages
- [ ] Verify audit trail visibility (admin vs non-admin)

