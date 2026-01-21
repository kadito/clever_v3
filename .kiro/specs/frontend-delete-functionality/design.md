# Design Document

## Overview

This design implements delete functionality for the CLEVER dashboard frontend by adding delete buttons to detail views, confirmation dialogs, and proper error handling. The solution leverages existing infrastructure (useApi composable, ContentDetailTemplate) and follows established patterns for simplicity and consistency.

## Architecture

### Component Architecture

The delete functionality integrates with the existing component hierarchy:

```
ContentDetailTemplate (enhanced)
├── Delete Button (new)
├── ConfirmationDialog (new component)
└── Error handling (existing ErrorComponent)
```

### Data Flow

```
User clicks delete → Confirmation dialog → API call → Success/Error handling → Navigation
```

## Components and Interfaces

### Enhanced ContentDetailTemplate

The existing `ContentDetailTemplate.vue` will be enhanced to include delete functionality:

**New Props:**
- `showDeleteButton?: boolean` - Controls delete button visibility
- `deleteButtonText?: string` - Customizable delete button text (default: "Eliminar")
- `confirmDeleteTitle?: string` - Confirmation dialog title
- `confirmDeleteMessage?: string` - Confirmation dialog message

**New Events:**
- `delete: [item: BaseContent]` - Emitted when user confirms deletion

**New Slots:**
- `deleteButton` - Custom delete button slot (optional)

### New ConfirmationDialog Component

A simple, reusable confirmation dialog component:

```typescript
interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string; // default: "Confirmar"
  cancelText?: string;  // default: "Cancelar"
  isLoading?: boolean;
}

interface ConfirmationDialogEmits {
  confirm: [];
  cancel: [];
  close: [];
}
```

**Features:**
- Mobile-first responsive design
- 44px minimum touch targets
- Portuguese labels
- Loading state support
- Click-outside-to-close functionality
- Keyboard support (Enter/Escape)

### Enhanced Detail View Components

Each content type's detail view component will be updated to handle delete operations:

**Example for WorkSheetsDetailView.vue:**
```typescript
// New state
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);

// New methods
const handleDelete = () => {
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  isDeleting.value = true;
  const success = await api.remove(workSheet.value.uuid);
  
  if (success) {
    router.push('/work-sheets');
  } else {
    // Error is handled by useApi composable
    showDeleteConfirm.value = false;
  }
  isDeleting.value = false;
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};
```

## Data Models

No new data models are required. The implementation uses existing:
- `BaseContent` interface
- `useApi` composable return types
- Existing error handling patterns

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, several properties can be consolidated:
- Properties about Portuguese text (1.3, 4.4) can be combined into one comprehensive language property
- Properties about touch targets (1.2, 5.1) are redundant and can be merged
- Properties about navigation after deletion (3.3, 4.1) are the same behavior
- Properties about dialog content (2.2, 8.2) overlap significantly

### Core Properties

**Property 1: Delete button presence and positioning**
*For any* content detail view, the delete button should appear in the actions area with consistent positioning across all content types
**Validates: Requirements 1.1, 1.4**

**Property 2: Touch target compliance**
*For any* delete button or confirmation dialog button, the touch target should meet the 44px minimum requirement
**Validates: Requirements 1.2, 2.7**

**Property 3: Portuguese language consistency**
*For any* delete-related UI element (buttons, dialogs, messages), the text should be in Portuguese with correct labels
**Validates: Requirements 1.3, 2.3, 4.4**

**Property 4: Confirmation dialog behavior**
*For any* delete button click, a confirmation dialog should appear with item identification and proper cancel/confirm options
**Validates: Requirements 2.1, 2.2, 2.3**

**Property 5: Cancel operation safety**
*For any* confirmation dialog cancel action, the dialog should close without performing deletion
**Validates: Requirements 2.4**

**Property 6: Delete operation execution**
*For any* confirmed deletion, the system should call the useApi remove() method and show loading indicators
**Validates: Requirements 2.5, 3.1, 3.2**

**Property 7: Successful deletion navigation**
*For any* successful delete operation, the system should redirect to the appropriate list view
**Validates: Requirements 3.3**

**Property 8: Error handling display**
*For any* failed delete operation, the system should display an error message with specific error information
**Validates: Requirements 4.2, 4.3, 7.1**

**Property 9: API integration consistency**
*For any* delete operation, the system should use the existing soft delete backend functionality
**Validates: Requirements 8.1**

**Property 10: Double-deletion prevention**
*For any* item, attempting to delete it multiple times should be prevented or handled gracefully
**Validates: Requirements 8.3**

<function_calls>
<invoke name="prework">
<parameter name="featureName">frontend-delete-functionality

## Error Handling

### Error Types and Responses

**Network Errors:**
- Display: "Erro de rede. Verifique a sua ligação à internet."
- Action: Maintain current view, allow retry

**Server Errors (4xx/5xx):**
- Display: Specific error message from API response
- Action: Maintain current view, close confirmation dialog

**Validation Errors:**
- Display: "Não é possível eliminar este item."
- Action: Maintain current view, close confirmation dialog

### Error Display Strategy

- Use existing `ErrorComponent` for consistency
- Show errors in the detail view (not in dialogs)
- Preserve user context and form state
- Use Portuguese error messages throughout

## Testing Strategy

### Unit Testing Approach

**Component Tests:**
- ConfirmationDialog component behavior
- Delete button rendering and interaction
- Error state handling
- Loading state management

**Integration Tests:**
- ContentDetailTemplate with delete functionality
- API integration with useApi composable
- Navigation after successful deletion
- Error handling flows

### Property-Based Testing Configuration

- Use Vitest for property-based testing
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: frontend-delete-functionality, Property {number}: {property_text}**

**Key Test Areas:**
- UI consistency across content types
- Portuguese language validation
- Touch target measurements
- Error handling scenarios
- API integration behavior

### Manual Testing Checklist

- [ ] Delete buttons appear in all detail views
- [ ] Confirmation dialogs display correctly
- [ ] Portuguese text is correct throughout
- [ ] Mobile touch targets are adequate
- [ ] Loading states work properly
- [ ] Error messages display appropriately
- [ ] Navigation works after deletion
- [ ] Double-deletion is prevented
- [ ] All content types support deletion