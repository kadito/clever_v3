# Common Components

This directory contains reusable components for the CLEVER dashboard system.

## Five-View Pattern Architecture

Each content type follows a **Five-View Pattern** for consistent user experience:

1. **ListView** - Browse and search content
2. **DetailView** - View individual item details  
3. **CreateView** - Create new content
4. **UpdateView** - Edit existing content
5. **HomeView** - Dashboard navigation tiles

## Template Components

### Base Templates

- **ContentListTemplate** - Mobile-first list view with search, pagination, and FAB
- **ContentDetailTemplate** - Responsive detail view with sections and audit trail
- **ContentFormTemplate** - Mobile-optimized form with validation and Portuguese labels

### Create/Update Templates

- **ContentCreateTemplate** - Wrapper for creation forms
- **ContentUpdateTemplate** - Wrapper for update forms with field control

## Usage Examples

### Create View

```vue
<template>
  <ContentCreateTemplate
    content-type="clients"
    create-title="Criar Cliente"
    subtitle="Adicionar um novo cliente ao sistema"
    :form-sections="createFormSections"
    :custom-validator="validateClient"
    @create="handleCreate"
    @cancel="handleCancel"
  />
</template>
```

### Update View

```vue
<template>
  <ContentUpdateTemplate
    :item="client"
    content-type="clients"
    edit-title="Editar Cliente"
    :form-sections="updateFormSections"
    :disabled-fields="['createdAt', 'uuid']"
    :read-only-fields="['email']"
    :custom-validator="validateClientUpdate"
    @update="handleUpdate"
    @cancel="handleCancel"
  />
</template>
```

## Key Features

### Create vs Update Differences

**Create Components:**
- All fields enabled for new content creation
- Strict validation - all required fields must be filled
- Default values can be pre-set
- Creation-specific business logic
- No pre-population needed

**Update Components:**
- Some fields can be disabled (e.g., creation date, unique IDs)
- Flexible validation - allow partial updates
- Pre-populated with existing data
- Update-specific logic (audit trail, version control)
- Different field behaviors based on business rules

### Form Configuration

Both templates use the same `FormSection[]` structure but with different behaviors:

```typescript
interface FormSection {
  key: string;
  title: string;
  description?: string;
  fields: FormField[];
}

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date';
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  // ... other options
}
```

### Mobile-First Design

All components are designed mobile-first with:
- Touch-friendly targets (minimum 44px)
- Responsive layouts (320px+ width support)
- Portuguese labels and validation messages
- Optimized input types for mobile keyboards

### Validation

- **Create**: Strict validation, all required fields
- **Update**: Flexible validation, respects disabled/readonly fields
- **Custom validators**: Business-specific validation rules
- **Portuguese error messages**: Localized feedback

## File Structure

```
packages/frontend/src/components/common/
├── BackButton.vue              # Navigation component
├── ErrorComponent.vue          # Error display
├── SearchBar.vue              # Search with debouncing
├── ContentListTemplate.vue    # List view template
├── ContentDetailTemplate.vue  # Detail view template
├── ContentFormTemplate.vue    # Base form template
├── ContentCreateTemplate.vue  # Create wrapper
├── ContentUpdateTemplate.vue  # Update wrapper
├── types.ts                   # TypeScript interfaces
├── index.ts                   # Component exports
└── examples/                  # Usage examples
    ├── ExampleCreateView.vue
    └── ExampleUpdateView.vue
```

## Best Practices

1. **Consistent Structure**: Follow the Five-View Pattern for all content types
2. **Separation of Concerns**: Use separate Create/Update components for different business logic
3. **Mobile-First**: Design for mobile devices first, enhance for desktop
4. **Portuguese Localization**: All user-facing text in Portuguese
5. **Type Safety**: Use TypeScript interfaces for all props and data
6. **Validation**: Implement both client-side and server-side validation
7. **Error Handling**: Provide clear, actionable error messages
8. **Accessibility**: Ensure proper ARIA labels and keyboard navigation