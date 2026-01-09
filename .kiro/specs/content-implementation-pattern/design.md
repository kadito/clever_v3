# Design Document

## Overview

This design defines the standard implementation pattern for all content types in the CLEVER dashboard system. The pattern establishes a consistent architecture across shared types, backend API endpoints, and frontend Vue components, ensuring maintainability and a unified user experience.

The design follows the established mobile-first approach with the Five-View Pattern (Home → List → Detail → Create → Update) and integrates with the existing monorepo structure using individual folders for each content type.

## Key Improvements from Implementation Experience

### Form Data Management Architecture

During implementation, we discovered and solved critical issues with Vue component recreation that affected form data persistence:

#### Shared Form Data Composable
```typescript
// packages/frontend/src/composables/useSharedFormData.ts
import { ref, reactive } from 'vue';

// Global shared form data for handling component recreation issues
const globalFormData = ref<Record<string, any>>({});
const globalValidationErrors = reactive<Record<string, string>>({});

export function useSharedFormData(formKey: string) {
  const initializeFormData = (initialData: Record<string, any>, formSections: any[]) => {
    // Create a new object
    const newFormData: Record<string, any> = {};
    
    // Start with initial data
    Object.assign(newFormData, initialData);
    
    // Ensure all form fields have keys
    for (const section of formSections) {
      for (const field of section.fields) {
        if (!(field.key in newFormData)) {
          // Set default values based on field type
          switch (field.type) {
            case 'checkbox':
              newFormData[field.key] = false;
              break;
            case 'number':
              newFormData[field.key] = field.defaultValue ?? null;
              break;
            default:
              newFormData[field.key] = field.defaultValue ?? '';
          }
        }
      }
    }
    
    // Replace the global form data
    globalFormData.value = newFormData;
  };

  const updateFieldValue = (fieldKey: string, value: any) => {
    if (!globalFormData.value) {
      console.warn('Global form data not initialized');
      return;
    }
    
    globalFormData.value[fieldKey] = value;
    
    // Clear validation error for this field
    delete globalValidationErrors[fieldKey];
  };

  const getFormData = () => {
    return globalFormData.value;
  };

  const clearFormData = () => {
    globalFormData.value = {};
    Object.keys(globalValidationErrors).forEach(key => {
      delete globalValidationErrors[key];
    });
  };

  return {
    formData: globalFormData,
    validationErrors: globalValidationErrors,
    initializeFormData,
    updateFieldValue,
    getFormData,
    clearFormData
  };
}
```

#### Component Architecture Split
The form handling was split into two components for better separation of concerns:

1. **ContentFormTemplate.vue**: Core form rendering engine
   - Handles form field rendering and input types (including multiselect)
   - Manages form validation and error display
   - Uses shared form data composable
   - Mobile-first responsive design
   - Supports conditional fields based on other field values

2. **ContentCreateTemplate.vue**: Creation-specific wrapper
   - Handles creation-specific validation logic
   - Manages create vs update differences
   - Provides default validation fallbacks

### Multiselect Dropdown Implementation

#### Enhanced Form Field Types
Added multiselect support to form fields with touch-friendly dropdown interface:

```typescript
// packages/frontend/src/components/common/types.ts
export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'multiselect' | 'password';
  required?: boolean;
  placeholder?: string;
  help?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  
  // Type-specific options
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
  checkboxLabel?: string;
  defaultValue?: any;
  
  // Conditional field support
  conditional?: {
    dependsOn: string;
    showWhen: (value: any) => boolean;
  };
  
  // Validation
  validator?: (value: any) => string | null;
}
```

#### Multiselect Component Features
- Touch-friendly dropdown with proper mobile optimization
- Click-outside closing functionality
- Tag-based selected items display with individual remove buttons
- Checkbox-style selection within dropdown
- Proper keyboard navigation support
- Responsive design for mobile and desktop

### Conditional Fields Support

#### Dynamic Field Visibility
Form fields can now be conditionally shown based on other field values:

```typescript
// Example conditional field configuration
{
  key: 'conditionalField',
  label: 'Conditional Field',
  type: 'url',
  fullWidth: true,
  placeholder: 'https://example.com/...',
  conditional: {
    dependsOn: 'selectedOptions',
    showWhen: (value: any) => Array.isArray(value) && value.includes('specificOption')
  }
}
```

### JSON Configuration for Form Sections

#### Centralized Form Configuration
All form sections moved to JSON configuration files for better maintenance:

```typescript
// packages/frontend/src/config/{content-type}-form-sections.ts
export const {contentType}FormSections: FormSection[] = [
  {
    key: 'basic',
    title: 'Informação Básica',
    description: 'Dados fundamentais do {content-type}',
    fields: [
      // Content-specific field definitions...
    ]
  },
  {
    key: 'services',
    title: 'Serviços',
    description: 'Selecione os serviços contratados',
    fields: [
      {
        key: 'selectedServices',
        label: 'Serviços Contratados',
        type: 'multiselect',
        fullWidth: true,
        options: [
          // Content-specific service options...
        ],
        placeholder: 'Selecione os serviços...'
      }
    ]
  },
  {
    key: 'conditionalFields',
    title: 'Configurações Adicionais',
    description: 'Configurações específicas dos serviços selecionados',
    fields: [
      // Conditional fields based on selected services...
    ]
  }
];
```

### Audit Trail Enhancement

#### User Email Display
Modified `ContentDetailTemplate.vue` to show user email addresses instead of user IDs:

```typescript
// Auth composable integration
const { user } = useAuth();

// User display name function
const getUserDisplayName = (userId: string | undefined): string => {
  if (!userId) return 'Sistema';
  
  // If it's the current user, show their email
  if (user.value && user.value.userId === userId) {
    return user.value.email || user.value.userId;
  }
  
  // For other users, show the user ID for now
  // Future enhancement: user lookup service
  return userId;
};
```

#### Template Updates
```vue
<template>
  <!-- Audit trail section -->
  <div class="audit-trail">
    <p><strong>Criado</strong> por {{ getUserDisplayName(item.createdBy) }}</p>
    <p><strong>Atualizado</strong> por {{ getUserDisplayName(item.updatedBy) }}</p>
  </div>
</template>
```

#### Responsive Edit Button
Edit button now shows conditionally based on screen size:
- Hidden on mobile (available in mobile action bar)
- Visible on desktop (≥768px) in header

```vue
<template>
  <button
    v-if="showEditButton"
    @click="handleEdit"
    class="btn-primary hidden sm:inline-flex items-center text-sm"
  >
    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
    Editar
  </button>
</template>
```

### Software Configuration Management

#### Complete Software Configuration
Implemented comprehensive software configuration system matching the legacy system:

**Generic Software Types**:
- Model/Product selection with type-specific options
- Version fields (software version, license version)
- Serial number tracking
- Conditional modules for specific products
- Dynamic software management (add/remove/edit)

#### Dynamic Software Management
- Add/remove software instances dynamically
- Edit mode for individual software configurations
- Proper validation for required software fields
- Mobile-optimized software cards with touch-friendly controls

### Section Ordering Requirements

#### Consistent Section Order
Established standard section ordering for all content types:

**Form Views (Create/Update)**:
1. Basic Information
2. Contact Information  
3. Address Information
4. Financial Information
5. Services (multiselect)
6. Conditional Fields (based on services)
7. Software Configuration
8. Observations (always last)

**Detail Views**:
1. Basic Information
2. Contact Information
3. Address Information
4. Financial Information
5. Serviços
6. Software
7. Observações (always last)

### Validation Architecture Improvements
All validation logic moved to shared package for consistency:

```typescript
// packages/shared/src/types/{content-type}/validation.ts
export function validate{ContentType}Creation(data: {ContentType}Data): string[] {
  const errors: string[] = [];
  
  if (!data.requiredField?.trim()) {
    errors.push('Campo obrigatório é necessário');
  }
  
  if (!data.anotherRequiredField?.trim()) {
    errors.push('Outro campo obrigatório é necessário');
  }
  
  // Additional validation rules...
  return errors;
}
```

#### Custom Validator Integration
Content-specific validation can override or extend default validation:

```typescript
// In ContentCreateTemplate.vue
const validateCreateForm = (data: Record<string, any>): Record<string, string> => {
  // If custom validator is provided, use it exclusively
  if (props.customValidator) {
    return props.customValidator(data);
  }
  
  // Default validation fallback
  const errors: Record<string, string> = {};
  for (const section of props.formSections) {
    for (const field of section.fields) {
      if (field.required && (!data[field.key] || data[field.key].trim() === '')) {
        errors[field.key] = `${field.label} é obrigatório`;
      }
    }
  }
  
  return errors;
};
```

### Mobile-First Enhancements

#### Touch Target Compliance
All interactive elements meet the 44px minimum requirement:

```css
.form-input,
.form-textarea,
.form-select {
  @apply min-h-touch; /* 44px minimum */
}

.form-checkbox {
  @apply w-5 h-5; /* Larger touch target */
}

.btn-icon-action {
  @apply p-2 rounded-touch transition-colors duration-200 touch-target;
}
```

#### Input Type Optimization
Proper HTML5 input types for mobile keyboards:

```typescript
// Form field definitions
{
  key: 'phoneField',
  label: 'Telefone',
  type: 'tel', // Mobile keyboard with numbers
  placeholder: '+351 123 456 789'
},
{
  key: 'emailField',
  label: 'E-mail',
  type: 'email', // Mobile keyboard with @ symbol
  placeholder: 'exemplo@dominio.com'
},
{
  key: 'urlField',
  label: 'Website',
  type: 'url', // Mobile keyboard optimized for URLs
  placeholder: 'https://exemplo.com/...'
}
```

#### Responsive Form Sections
Forms adapt from mobile to desktop layouts:

```css
.form-grid {
  @apply grid grid-cols-1 gap-4;
}

@media (min-width: 640px) {
  .form-grid {
    @apply grid-cols-2;
  }
}

@media (min-width: 1024px) {
  .form-grid {
    @apply grid-cols-3;
  }
}
```

### Error Handling Improvements

#### Portuguese Error Messages
All error messages are in Portuguese with proper field mapping:

```typescript
const validateCreateForm = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  validationErrors.forEach((errorMessage) => {
    if (errorMessage.includes('Campo obrigatório')) {
      errors.requiredField = errorMessage;
    } else if (errorMessage.includes('Email inválido')) {
      errors.emailField = errorMessage;
    }
    // Additional error mapping...
  });
  
  return errors;
};
```

#### Null Safety Improvements
Added proper null checking throughout the components:

```typescript
// Display functions with null safety
const getContentTitle = (item: BaseContent | null): string => {
  if (!item || !item.data) return 'Item';
  const content = item as ContentType;
  return content.data.title || content.data.name || 'Item';
};

// Event handlers with null safety
const handleEdit = (item: BaseContent | null) => {
  if (!item) return;
  const content = item as ContentType;
  router.push(`/{content-type}/${content.uuid}/editar`);
};
```

## Architecture

### Folder Structure Pattern

Each content type follows a consistent folder structure across all packages:

```
packages/
├── shared/
│   └── src/
│       └── types/
│           └── {content-type}/
│               ├── index.ts          # Main exports
│               ├── types.ts          # TypeScript interfaces
│               └── validation.ts     # Validation schemas
├── backend/
│   └── src/
│       └── routes/
│           └── {content-type}.ts     # CRUD API endpoints
└── frontend/
    └── src/
        └── views/
            └── {content-type}/
                ├── {Type}ListView.vue    # List/search view
                ├── {Type}DetailView.vue  # Detail view
                ├── {Type}CreateView.vue  # Create form
                ├── {Type}UpdateView.vue  # Update form
                └── index.ts              # Component exports
```

### Content Type Mapping

Based on analysis of the legacy system, content types follow this naming convention:

| Code Name           | Portuguese Label            | Legacy Reference    |
| ------------------- | --------------------------- | ------------------- |
| `{content-type}`    | {Portuguese Label}          | old_src/{legacy-folder} |

**Examples**:
- `clients` → Clientes → old_src/clientes
- `contracts` → Contratos → old_src/contratos  
- `licenses` → Licenças → old_src/licencas
- `work-sheets` → Folhas de Obra → old_src/folhas-obra
- `daily-records` → Registo Diário de Atividade → old_src/registo-diario-atividade
- `remote-assistance` → Assistências Remotas → old_src/assistencias-remotas
- `reminders` → Lembretes → (new content type)
- `pending` → Pendentes → (new content type)

## Components and Interfaces

### Shared Package Types

#### BaseContent Interface

```typescript
interface BaseContent {
  uuid: string;
  contentType: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  data: Record<string, any>;
}
```

#### Content-Specific Interface Pattern

Each content type extends BaseContent with its own data structure. The data structure is determined by analyzing the corresponding legacy components in old_src:

```typescript
// Pattern: packages/shared/src/types/{content-type}/types.ts
interface {ContentType} extends BaseContent {
  contentType: '{content-type}'; // e.g., 'clients', 'contracts', 'licenses'
  data: {
    // Content-specific fields extracted from legacy Detail and Form views
    // Each content type will have different fields based on old_src analysis
  };
}
```

**Implementation Process for Each Content Type**:
1. Analyze `old_src/views/{content-type}/` components (Detail and Form views)
2. Extract data structure from Vue component templates and form fields
3. Create TypeScript interfaces matching the legacy schema

**Example Analysis Pattern** (to be applied to all content types):
- **Content Type A**: Analyze `old_src/views/{content-type-a}/` components
- **Content Type B**: Analyze `old_src/views/{content-type-b}/` components
- **Content Type C**: Analyze `old_src/views/{content-type-c}/` components
- **New Content Types**: Design from requirements (no legacy reference)

#### API Response Types

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

interface ListResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

interface SearchResponse<T> extends ApiResponse<T[]> {
  query: string;
  count: number;
}
```

### Backend Package Implementation

#### Route Handler Pattern

Each content type gets its own route file following this pattern:

```typescript
// Pattern: packages/backend/src/routes/{content-type}.ts
import { Hono } from 'hono';
import type { {ContentType}, ApiResponse, ListResponse } from '@clever/shared';

const contentRouter = new Hono();

// List content with search
contentRouter.get('/', async (c) => {
  const query = c.req.query('search');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  
  try {
    if (query) {
      // Search using index
      const results = await searchContent(query);
      return c.json({
        success: true,
        data: results,
        query,
        count: results.length,
        timestamp: new Date().toISOString()
      } as SearchResponse<{ContentType}>);
    } else {
      // List all from index
      const results = await listContent(page, limit);
      return c.json({
        success: true,
        data: results.items,
        pagination: {
          page,
          limit,
          total: results.total
        },
        timestamp: new Date().toISOString()
      } as ListResponse<{ContentType}>);
    }
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    } as ApiResponse<never>, 500);
  }
});

// Get single content item
contentRouter.get('/:uuid', async (c) => {
  const uuid = c.req.param('uuid');
  
  try {
    const item = await getContentById(uuid);
    if (!item) {
      return c.json({
        success: false,
        error: 'Content not found',
        timestamp: new Date().toISOString()
      } as ApiResponse<never>, 404);
    }
    
    return c.json({
      success: true,
      data: item,
      timestamp: new Date().toISOString()
    } as ApiResponse<{ContentType}>);
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    } as ApiResponse<never>, 500);
  }
});

// Create content
contentRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const item = await createContent(body);
    
    return c.json({
      success: true,
      data: item,
      timestamp: new Date().toISOString()
    } as ApiResponse<{ContentType}>, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    } as ApiResponse<never>, 400);
  }
});

// Update content
contentRouter.put('/:uuid', async (c) => {
  const uuid = c.req.param('uuid');
  
  try {
    const body = await c.req.json();
    const item = await updateContent(uuid, body);
    
    return c.json({
      success: true,
      data: item,
      timestamp: new Date().toISOString()
    } as ApiResponse<{ContentType}>);
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    } as ApiResponse<never>, 400);
  }
});

// Soft delete content
contentRouter.delete('/:uuid', async (c) => {
  const uuid = c.req.param('uuid');
  
  try {
    await deleteContent(uuid);
    
    return c.json({
      success: true,
      timestamp: new Date().toISOString()
    } as ApiResponse<void>);
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    } as ApiResponse<never>, 400);
  }
});

export default contentRouter;
```

#### R2 Storage Operations

```typescript
// Storage service pattern
class ContentStorageService<T extends BaseContent> {
  constructor(
    private r2Bucket: R2Bucket,
    private contentType: string
  ) {}

  async get(uuid: string): Promise<T | null> {
    const key = `content/${this.contentType}/${uuid}.json`;
    const object = await this.r2Bucket.get(key);
    
    if (!object) return null;
    
    const content = await object.json() as T;
    return content.isDeleted ? null : content;
  }

  async create(data: Omit<T, keyof BaseContent>): Promise<T> {
    const uuid = crypto.randomUUID();
    const now = new Date().toISOString();
    const user = 'current-user'; // From Clerk context
    
    const content: T = {
      uuid,
      contentType: this.contentType,
      createdAt: now,
      createdBy: user,
      updatedAt: now,
      updatedBy: user,
      version: 1,
      isDeleted: false,
      data
    } as T;

    await this.save(content);
    await this.updateIndex(content, 'create');
    
    return content;
  }

  async update(uuid: string, data: Partial<T['data']>): Promise<T> {
    const existing = await this.get(uuid);
    if (!existing) throw new Error('Content not found');
    
    const now = new Date().toISOString();
    const user = 'current-user'; // From Clerk context
    
    const updated: T = {
      ...existing,
      data: { ...existing.data, ...data },
      updatedAt: now,
      updatedBy: user,
      version: existing.version + 1
    };

    await this.save(updated);
    await this.updateIndex(updated, 'update');
    
    return updated;
  }

  async delete(uuid: string): Promise<void> {
    const existing = await this.get(uuid);
    if (!existing) throw new Error('Content not found');
    
    const now = new Date().toISOString();
    const user = 'current-user'; // From Clerk context
    
    const deleted: T = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: user,
      version: existing.version + 1
    };

    await this.save(deleted);
    await this.updateIndex(deleted, 'delete');
  }

  private async save(content: T): Promise<void> {
    const key = `content/${this.contentType}/${content.uuid}.json`;
    await this.r2Bucket.put(key, JSON.stringify(content));
  }

  private async updateIndex(content: T, operation: 'create' | 'update' | 'delete'): Promise<void> {
    const indexKey = `indexes/${this.contentType}-index.json`;
    
    // Get current index
    const indexObject = await this.r2Bucket.get(indexKey);
    const index = indexObject ? await indexObject.json() : { items: [] };
    
    // Update index based on operation
    const existingIndex = index.items.findIndex((item: any) => item.uuid === content.uuid);
    
    if (operation === 'delete') {
      if (existingIndex !== -1) {
        index.items[existingIndex].isDeleted = true;
      }
    } else {
      const indexItem = {
        uuid: content.uuid,
        contentType: content.contentType,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
        isDeleted: content.isDeleted,
        // Searchable fields extracted from data
        searchableText: this.extractSearchableText(content),
        ...this.extractIndexFields(content)
      };
      
      if (existingIndex !== -1) {
        index.items[existingIndex] = indexItem;
      } else {
        index.items.push(indexItem);
      }
    }
    
    // Save updated index
    await this.r2Bucket.put(indexKey, JSON.stringify(index));
  }

  private extractSearchableText(content: T): string {
    // Override in subclasses for content-specific search
    return JSON.stringify(content.data).toLowerCase();
  }

  private extractIndexFields(content: T): Record<string, any> {
    // Override in subclasses for content-specific index fields
    return {};
  }
}
```

### Frontend Package Implementation

#### Mobile-First Component Pattern

Based on analysis of the legacy components, the frontend follows this pattern:

##### Five-View Pattern Architecture

The system uses a **Five-View Pattern** for each content type, providing better separation of concerns:

1. **ListView**: Browse and search content
2. **DetailView**: View individual item details
3. **CreateView**: Create new content with creation-specific logic
4. **UpdateView**: Edit existing content with update-specific logic
5. **HomeView**: Dashboard navigation tiles

**Benefits of Separate Create/Update Views:**
- **Different Validation Rules**: Create might require all fields, Update might allow partial updates
- **Field Behavior**: Some fields disabled on update (e.g., creation date, unique identifiers)
- **Business Logic**: Different workflows for creation vs modification
- **User Experience**: Tailored interfaces for different user intents
- **Maintainability**: Clear separation of concerns, easier to modify independently

##### Routing Configuration

Each content type follows this routing pattern:

```typescript
// Example routes for {content-type} content type
const {contentType}Routes = [
  {
    path: '/{content-type}',
    name: '{ContentType}List',
    component: () => import('@/views/{content-type}/{ContentType}ListView.vue')
  },
  {
    path: '/{content-type}/create',
    name: '{ContentType}Create', 
    component: () => import('@/views/{content-type}/{ContentType}CreateView.vue')
  },
  {
    path: '/{content-type}/:uuid',
    name: '{ContentType}Detail',
    component: () => import('@/views/{content-type}/{ContentType}DetailView.vue')
  },
  {
    path: '/{content-type}/:uuid/update',
    name: '{ContentType}Update',
    component: () => import('@/views/{content-type}/{ContentType}UpdateView.vue')
  }
];
```

##### List View Component

```vue
<!-- Example: packages/frontend/src/views/{content-type}/{ContentType}ListView.vue -->
<template>
  <div class="content-list-container">
    <!-- Mobile-first header -->
    <div class="list-header">
      <BackButton to="/" variant="inline" />
      <h1>{Portuguese Label} ({{ displayedItems.length }})</h1>
      <button @click="refreshData" :disabled="loading" class="btn-refresh">
        🔄
      </button>
    </div>

    <!-- Mobile-optimized search -->
    <div class="search-container">
      <input 
        type="text" 
        v-model="searchQuery" 
        @input="handleSearch"
        placeholder="Pesquisar {portuguese label}..." 
        class="search-input"
      >
      <span class="search-icon">🔍</span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>A carregar {portuguese label}...</p>
    </div>

    <!-- Error state -->
    <ErrorComponent v-if="error" :error="error" @close="clearError" />

    <!-- Mobile-first content cards -->
    <div v-if="!loading && displayedItems.length > 0" class="content-list">
      <div 
        v-for="item in displayedItems" 
        :key="item.uuid"
        class="content-card"
        @click="navigateToDetail(item)"
      >
        <div class="card-main">
          <h3>{{ getDisplayTitle(item) }}</h3>
          <div class="card-meta">
            <span class="meta-item">{{ getDisplayMeta1(item) }}</span>
            <span class="meta-item">{{ getDisplayMeta2(item) }}</span>
          </div>
          <div class="card-contact" v-if="getDisplayContact(item)">
            <span>{{ getDisplayContact(item) }}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="action-btn" @click.stop="showActions(item)">⋮</button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && displayedItems.length === 0" class="empty-state">
      <h3>Nenhum {portuguese label} encontrado</h3>
      <p v-if="searchQuery">
        Não foram encontrados {portuguese label} com o termo "{{ searchQuery }}".
      </p>
      <p v-else>
        Não há {portuguese label} cadastrados no sistema.
      </p>
    </div>

    <!-- Mobile FAB -->
    <button @click="navigateToCreate" class="fab">➕</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { {ContentType} } from '@clever/shared';
import BackButton from '@/components/BackButton.vue';
import ErrorComponent from '@/components/ErrorComponent.vue';

// Mobile-first responsive design with touch-friendly interactions
// Debounced search, error handling, loading states
// Portuguese labels throughout
</script>

<style scoped>
/* Mobile-first CSS with established color palette */
.content-list-container {
  padding: 1rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.content-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 44px; /* Touch target minimum */
}

.content-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.fab {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

/* Responsive breakpoints */
@media (min-width: 768px) {
  .content-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }
}
</style>
```

##### Detail View Component

```vue
<!-- Mobile-optimized detail view with sections -->
<template>
  <div class="content-detail-container">
    <!-- Mobile header with actions -->
    <div class="detail-header">
      <BackButton :to="`/{content-type}`" variant="inline" />
      <div class="header-content">
        <h1>{{ getDisplayTitle(item) }}</h1>
        <div class="header-meta">
          <span>{{ getDisplayMeta1(item) }}</span>
          <span>{{ getDisplayMeta2(item) }}</span>
        </div>
      </div>
      <div class="header-actions">
        <button @click="navigateToEdit" class="btn btn-edit">✏️ Editar</button>
      </div>
    </div>

    <!-- Loading/Error states -->
    <div v-if="loading" class="loading-state">
      <p>A carregar {portuguese label}...</p>
    </div>

    <ErrorComponent v-if="error" :error="error" @close="clearError" />

    <!-- Mobile-optimized content sections -->
    <div v-if="!loading && item" class="detail-content">
      <section class="detail-section">
        <h3>INFORMAÇÃO BÁSICA</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>CAMPO PRINCIPAL</label>
            <span>{{ item.data.mainField || '-' }}</span>
          </div>
          <!-- More content-specific fields... -->
        </div>
      </section>
      
      <!-- Additional sections following the same pattern -->
    </div>
  </div>
</template>
```
          </div>
          <!-- More fields... -->
        </div>
      </section>
      
      <!-- Additional sections following the same pattern -->
    </div>
  </div>
</template>
```

##### Create View Component

```vue
<!-- Example: packages/frontend/src/views/{content-type}/{ContentType}CreateView.vue -->
<template>
  <ContentCreateTemplate
    content-type="{content-type}"
    create-title="Criar {Portuguese Label}"
    subtitle="Adicionar um novo {portuguese label} ao sistema"
    cancel-route="/{content-type}"
    :form-sections="createFormSections"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :error="error"
    :custom-validator="validateCreateForm"
    @create="handleCreate"
    @cancel="handleCancel"
    @clear-error="clearError"
  >
    <!-- Custom sections for content creation -->
    <template #createSections="{ formData }">
      <!-- Content-specific form sections -->
      <div class="form-section">
        <div class="section-header">
          <h2 class="section-title">Configurações Específicas</h2>
          <p class="section-description">Configure as opções específicas do {portuguese label}</p>
        </div>
        
        <!-- Complex form logic for content-specific features -->
        <div class="content-specific-management">
          <!-- Dynamic content-specific configuration forms -->
        </div>
      </div>
    </template>
  </ContentCreateTemplate>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { {ContentType}Data, {ContentType} } from '@clever/shared';
import { validate{ContentType}Creation } from '@clever/shared';
import ContentCreateTemplate from '@/components/common/ContentCreateTemplate.vue';
import type { FormSection } from '@/components/common/types';
import { useApi } from '@/composables/useApi';

// Router and composables
const router = useRouter();
const api = useApi<{ContentType}>('{content-type}');

// State management
const isLoading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);

// Form sections configuration
const createFormSections: FormSection[] = [
  {
    key: 'basic',
    title: 'Informação Básica',
    description: 'Dados fundamentais do {portuguese label}',
    fields: [
      {
        key: 'mainField',
        label: 'Campo Principal',
        type: 'text',
        required: true,
        placeholder: 'Valor principal'
      },
      {
        key: 'secondaryField',
        label: 'Campo Secundário',
        type: 'text',
        required: true,
        placeholder: 'Valor secundário'
      },
      // Additional fields...
    ]
  },
  // Additional sections...
];

// Validation function using shared validation
const validateCreateForm = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  try {
    const contentData: {ContentType}Data = {
      mainField: data.mainField || '',
      secondaryField: data.secondaryField || '',
      // Map all form data to ContentData structure...
    };
    
    // Use shared validation
    const validationErrors = validate{ContentType}Creation(contentData);
    
    // Convert validation errors to form errors with Portuguese messages
    validationErrors.forEach((errorMessage) => {
      if (errorMessage.includes('Campo principal')) {
        errors.mainField = errorMessage;
      } else if (errorMessage.includes('Campo secundário')) {
        errors.secondaryField = errorMessage;
      }
      // Additional error mapping...
    });
  } catch (err) {
    console.error('Error in validation:', err);
    errors.general = 'Erro na validação dos dados';
  }
  
  return errors;
};

// Event handlers
const handleCreate = async (formData: Record<string, any>) => {
  try {
    isSaving.value = true;
    clearError();
    
    const contentData: {ContentType}Data = {
      // Map form data to ContentData structure
    };
    
    const response = await api.create({ data: contentData } as any);
    
    if (response) {
      router.push(`/{content-type}/${response.uuid}`);
    } else {
      throw new Error('Erro ao criar {portuguese label}');
    }
  } catch (err) {
    console.error('Error creating {content-type}:', err);
    error.value = err instanceof Error ? err.message : 'Erro ao criar {portuguese label}';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  router.push('/{content-type}');
};

const clearError = () => {
  error.value = null;
};
</script>

<style scoped>
/* Content-specific styling */
.content-specific-management {
  @apply space-y-4;
}

.content-card {
  @apply bg-white border border-gray-200 rounded-touch p-4 transition-all duration-200;
}

.content-card.editing {
  @apply border-primary-300 bg-primary-50;
}

/* Mobile-first responsive adjustments */
@media (max-width: 640px) {
  .content-card {
    @apply p-3;
  }
}
</style>
```

##### Update View Component

```vue
<!-- Example: packages/frontend/src/views/{content-type}/{ContentType}UpdateView.vue -->
<template>
  <ContentFormTemplate
    :form-sections="updateFormSections"
    :initial-data="existing{ContentType}Data"
    :is-editing="true"
    edit-title="Editar {Portuguese Label}"
    subtitle="Atualizar informações do {portuguese label}"
    :custom-validator="validateUpdateForm"
    @submit="handleUpdate"
    @cancel="handleCancel"
  >
    <!-- Custom form sections for updates -->
    <template #customSections="{ formData, errors }">
      <!-- Update-specific fields or sections -->
      <!-- Some fields might be disabled or read-only -->
    </template>
  </ContentFormTemplate>
</template>

<script setup lang="ts">
// Update-specific logic:
// - Some fields may be disabled (e.g., creation date, ID fields)
// - Different validation rules (e.g., optional fields that were required on creation)
// - Pre-population from existing data
// - Audit trail considerations
</script>
```
    subtitle="Atualizar informações do cliente"
    :custom-validator="validateUpdateForm"
    @submit="handleUpdate"
    @cancel="handleCancel"
  >
    <!-- Custom form sections for updates -->
    <template #customSections="{ formData, errors }">
      <!-- Update-specific fields or sections -->
      <!-- Some fields might be disabled or read-only -->
    </template>
  </ContentFormTemplate>
</template>

<script setup lang="ts">
// Update-specific logic:
// - Some fields may be disabled (e.g., creation date, ID fields)
// - Different validation rules (e.g., optional fields that were required on creation)
// - Pre-population from existing data
// - Audit trail considerations
</script>
```

## Data Models

### Content Schema Analysis

Based on analysis of the legacy `ClienteDetail.vue` and `ClienteForm.vue`, the content schemas follow these patterns:

1. **Basic Information Fields**: Core business data (names, IDs, contacts)
2. **Complex Nested Objects**: Software configurations, service flags
3. **Conditional Fields**: Fields that appear based on boolean flags
4. **Legacy Compatibility**: Support for old data structures during migration

### R2 Storage Structure

```
R2 Bucket: clever-dashboard-{env}
├── content/
│   ├── clients/
│   │   └── {uuid}.json
│   ├── contracts/
│   │   └── {uuid}.json
│   └── [other content types]/
├── indexes/
│   ├── clients-index.json
│   ├── contracts-index.json
│   └── [other content type indexes]
└── migrations/
    └── [migration files]
```

### Search Index Structure

```json
{
  "contentType": "clients",
  "lastUpdated": "2024-01-08T10:00:00Z",
  "items": [
    {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "contentType": "clients",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-05T15:30:00Z",
      "isDeleted": false,
      "searchableText": "empresa comercial contribuinte localidade",
      "nomeEmpresa": "Empresa Exemplo",
      "nomeComercial": "Comercial Exemplo",
      "contribuinte": "123456789",
      "localidade": "Lisboa"
    }
  ]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Let me analyze the acceptance criteria for testability using the prework tool:

<function_calls>
<invoke name="prework">
<parameter name="featureName">content-implementation-pattern

Based on the prework analysis, I'll now convert the testable acceptance criteria into correctness properties:

**Property 1: BaseContent Interface Compliance**
*For any* content type implementation, all content items should extend the BaseContent interface with uuid, contentType, audit trail fields, and version tracking.
**Validates: Requirements 1.1, 1.4**

**Property 2: Content Creation Audit Trail**
*For any* content type, creating a new content item should generate a unique UUID and set initial audit trail values (createdAt, createdBy, version 1).
**Validates: Requirements 1.2**

**Property 3: Content Update Versioning**
*For any* content item update operation, the system should increment the version number and update the audit trail fields (updatedAt, updatedBy).
**Validates: Requirements 1.3**

**Property 4: Soft Delete Consistency**
*For any* content item deletion, the system should set isDeleted flag to true and populate deletion audit trail (deletedAt, deletedBy) without removing the item from storage.
**Validates: Requirements 1.5**

**Property 5: R2 Storage Key Pattern**
*For any* content type and UUID, storing a content item should use the R2 key pattern content/{type}/{uuid}.json consistently.
**Validates: Requirements 2.1**

**Property 6: Content Retrieval Round Trip**
*For any* content item stored in R2, retrieving it using its UUID should return the same content data that was stored.
**Validates: Requirements 2.2**

**Property 7: Index-Storage Synchronization**
*For any* content modification (create, update, delete), both the individual R2 file and the search index should be updated consistently.
**Validates: Requirements 2.4, 3.2, 3.3, 3.4**

**Property 8: Search Index Structure**
*For any* content type, the search index should exist at indexes/{type}-index.json and contain searchable metadata for all non-deleted items.
**Validates: Requirements 3.1, 3.5**

**Property 9: API Endpoint Completeness**
*For any* content type, the system should provide all five CRUD endpoints (GET list, GET item, POST create, PUT update, DELETE) with consistent behavior.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

**Property 10: API Error Response Consistency**
*For any* invalid API request, the system should return appropriate HTTP status codes and structured error messages in the ApiResponse format.
**Validates: Requirements 4.6, 11.1**

**Property 11: Mobile Touch Target Compliance**
*For any* content list view, all interactive elements should have minimum 44px touch targets for mobile accessibility.
**Validates: Requirements 5.2**

**Property 12: Responsive Layout Compatibility**
*For any* content detail view, the layout should render correctly and remain usable on screens from 320px width.
**Validates: Requirements 5.3**

**Property 13: Mobile Form Optimization**
*For any* content form view, input fields should use appropriate mobile input types (tel, email, url) and provide mobile-friendly validation feedback.
**Validates: Requirements 5.4**

**Property 14: Color Palette Consistency**
*For any* content type component, the CSS should use the established color variables (--primary-color: #75AE93, --secondary-color: #2c3e50).
**Validates: Requirements 5.5**

**Property 15: Authentication Requirement**
*For any* content API endpoint access, the system should require valid Clerk authentication and return 401 for unauthenticated requests.
**Validates: Requirements 10.1, 10.4**

**Property 16: Audit Trail User Recording**
*For any* content creation or update operation, the system should record the authenticated user's information in the appropriate audit trail fields.
**Validates: Requirements 10.2, 10.3**

**Property 17: Error Component Display**
*For any* API request failure, the Vue application should display the error using the ErrorComponent with appropriate Portuguese error messages.
**Validates: Requirements 11.2, 12.5**

**Property 18: Authentication Redirect**
*For any* 401 Unauthorized API response, the system should redirect the user to the sign-in page.
**Validates: Requirements 11.3**

**Property 19: Portuguese UI Language**
*For any* content type interface, all UI labels, buttons, and messages should be displayed in Portuguese (Portugal variant) while maintaining English code identifiers.
**Validates: Requirements 12.1, 12.2, 12.3**

**Property 20: Portuguese Locale Formatting**
*For any* date or number display in content interfaces, the system should use Portuguese locale formatting (pt-PT).
**Validates: Requirements 12.4**

**Property 21: Search Input Debouncing**
*For any* content search interface, search inputs should be debounced to prevent excessive API calls during typing.
**Validates: Requirements 13.4**

**Property 22: Loading State Provision**
*For any* content loading operation, the interface should provide loading states or skeleton screens for better user experience.
**Validates: Requirements 13.5**

## Error Handling

### Simple Error Handling Strategy

The system follows a straightforward error handling approach without retry mechanisms:

1. **API Errors**: Display errors using Vue ErrorComponent
2. **Authentication Errors**: 401 responses redirect to sign-in page
3. **Validation Errors**: Show field-specific feedback in Portuguese
4. **Storage Errors**: Display error messages without retry attempts
5. **Network Errors**: Show error state with manual refresh option

### Error Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
```

### Frontend Error Component

```vue
<template>
  <div class="error-alert">
    <p>{{ error }}</p>
    <button @click="$emit('close')" class="close-btn">×</button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  error: string;
}

defineProps<Props>();
defineEmits<{
  close: [];
}>();
</script>
```

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific implementations and property-based tests for universal behaviors:

**Unit Tests**:
- Content-specific schema validation
- Component rendering with mock data
- API endpoint integration testing
- Form validation edge cases
- Mobile responsive breakpoint testing

**Property-Based Tests**:
- BaseContent interface compliance across all content types
- R2 storage and retrieval consistency
- Search index synchronization
- API endpoint behavior consistency
- Mobile touch target compliance
- Authentication and authorization behavior
- Error handling consistency
- Portuguese localization compliance

### Testing Framework Configuration

**Frontend Testing**:
- Vitest for unit tests and component testing
- Vue Test Utils for component testing
- fast-check for property-based testing
- Minimum 100 iterations per property test

**Backend Testing**:
- Vitest for unit tests and API testing
- Hono test utilities for request/response testing
- fast-check for property-based testing
- R2 mock for storage testing

**Property Test Tags**:
Each property test must be tagged with: **Feature: content-implementation-pattern, Property {number}: {property_text}**

### Test Organization

```
packages/
├── shared/
│   └── tests/
│       ├── base-content.test.ts
│       └── content-types.property.test.ts
├── backend/
│   └── tests/
│       ├── routes/
│       │   └── content-pattern.property.test.ts
│       └── storage/
│           └── r2-operations.property.test.ts
└── frontend/
    └── tests/
        ├── components/
        │   └── content-pattern.property.test.ts
        └── views/
            └── mobile-responsive.property.test.ts
```

The property tests will validate universal behaviors across all content types, ensuring consistency and correctness of the