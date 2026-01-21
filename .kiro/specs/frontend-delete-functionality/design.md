# Design Document

## Overview

This design implements delete functionality for the CLEVER dashboard frontend by
adding delete buttons to detail views, confirmation dialogs, and proper error
handling. The solution leverages existing infrastructure (useApi composable,
ContentDetailTemplate) and follows established patterns for simplicity and
consistency.

**✅ IMPLEMENTATION STATUS: COMPLETED**

All components, integrations, and testing have been fully implemented according
to this design specification. The delete functionality is production-ready
across all content types (Clients, Contracts, Licenses, Work Sheets).

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

### Enhanced ContentDetailTemplate (✅ IMPLEMENTED)

The existing `ContentDetailTemplate.vue` has been enhanced to include delete
functionality:

**Implemented Props:**

- `showDeleteButton?: boolean` - Controls delete button visibility
- `deleteButtonText?: string` - Customizable delete button text (default:
  "Eliminar")
- `confirmDeleteTitle?: string` - Confirmation dialog title
- `confirmDeleteMessage?: string` - Confirmation dialog message

**Implemented Events:**

- `delete: [item: BaseContent]` - Emitted when user confirms deletion

**Implemented Slots:**

- `deleteButton` - Custom delete button slot (optional)

**UI Implementation:**

- Delete buttons appear in header actions area (desktop) and mobile action bar
- Consistent positioning across all content types
- 44px minimum touch targets on all screen sizes
- Hidden on mobile in header, shown in fixed bottom action bar

### ConfirmationDialog Component (✅ IMPLEMENTED)

A fully implemented, reusable confirmation dialog component:

```typescript
interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string; // default: "Confirmar"
  cancelText?: string; // default: "Cancelar"
  isLoading?: boolean;
}

interface ConfirmationDialogEmits {
  confirm: [];
  cancel: [];
  close: [];
}
```

**Implemented Features:**

- ✅ Mobile-first responsive design with proper breakpoints
- ✅ 44px minimum touch targets (48px on mobile)
- ✅ Portuguese labels with proper defaults
- ✅ Loading state support with spinner animation
- ✅ Click-outside-to-close functionality
- ✅ Keyboard support (Enter/Escape)
- ✅ Focus management and accessibility
- ✅ Backdrop blur effect for modern browsers
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Print styles (hidden in print mode)

### Enhanced Detail View Components (✅ ALL IMPLEMENTED)

All content type detail view components have been updated to handle delete
operations:

**Implemented Pattern for all detail views:**

```typescript
// State management
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);
const confirmDeleteTitle = ref('Confirmar Eliminação');
const confirmDeleteMessage = ref('');

// Dynamic confirmation message generation
const getDeleteConfirmationMessage = (): string => {
  if (!item.value) return 'Tem a certeza que pretende eliminar este item?';

  const itemIdentifier = getItemDisplayName(item.value);
  return `Tem a certeza que pretende eliminar "${itemIdentifier}"?`;
};

// Delete handlers with comprehensive error handling
const handleDelete = () => {
  if (!item.value) return;
  confirmDeleteMessage.value = getDeleteConfirmationMessage();
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  // Comprehensive implementation with logging and error handling
  // (See implementation pattern in steering/delete-functionality-patterns.md)
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};
```

**Content Types Implemented:**

- ✅ ClientsDetailView - Full delete functionality
- ✅ ContractsDetailView - Full delete functionality
- ✅ LicensesDetailView - Full delete functionality
- ✅ WorkSheetsDetailView - Full delete functionality

## Data Models

No new data models are required. The implementation uses existing:

- `BaseContent` interface
- `useApi` composable return types
- Existing error handling patterns

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all
valid executions of a system-essentially, a formal statement about what the
system should do. Properties serve as the bridge between human-readable
specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing the acceptance criteria, several properties can be consolidated:

- Properties about Portuguese text (1.3, 4.4) can be combined into one
  comprehensive language property
- Properties about touch targets (1.2, 5.1) are redundant and can be merged
- Properties about navigation after deletion (3.3, 4.1) are the same behavior
- Properties about dialog content (2.2, 8.2) overlap significantly

### Core Properties

**Property 1: Delete button presence and positioning** _For any_ content detail
view, the delete button should appear in the actions area with consistent
positioning across all content types **Validates: Requirements 1.1, 1.4**

**Property 2: Touch target compliance** _For any_ delete button or confirmation
dialog button, the touch target should meet the 44px minimum requirement
**Validates: Requirements 1.2, 2.7**

**Property 3: Portuguese language consistency** _For any_ delete-related UI
element (buttons, dialogs, messages), the text should be in Portuguese with
correct labels **Validates: Requirements 1.3, 2.3, 4.4**

**Property 4: Confirmation dialog behavior** _For any_ delete button click, a
confirmation dialog should appear with item identification and proper
cancel/confirm options **Validates: Requirements 2.1, 2.2, 2.3**

**Property 5: Cancel operation safety** _For any_ confirmation dialog cancel
action, the dialog should close without performing deletion **Validates:
Requirements 2.4**

**Property 6: Delete operation execution** _For any_ confirmed deletion, the
system should call the useApi remove() method and show loading indicators
**Validates: Requirements 2.5, 3.1, 3.2**

**Property 7: Successful deletion navigation** _For any_ successful delete
operation, the system should redirect to the appropriate list view **Validates:
Requirements 3.3**

**Property 8: Error handling display** _For any_ failed delete operation, the
system should display an error message with specific error information
**Validates: Requirements 4.2, 4.3, 7.1**

**Property 9: API integration consistency** _For any_ delete operation, the
system should use the existing soft delete backend functionality **Validates:
Requirements 8.1**

**Property 10: Double-deletion prevention** _For any_ item, attempting to delete
it multiple times should be prevented or handled gracefully **Validates:
Requirements 8.3**

<function_calls> <invoke name="prework">
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

### Unit Testing Approach (✅ IMPLEMENTED)

**Component Tests:**

- ✅ ConfirmationDialog component behavior and styling
- ✅ Delete button rendering and interaction patterns
- ✅ Error state handling across all scenarios
- ✅ Loading state management and double-deletion prevention

**Integration Tests:**

- ✅ ContentDetailTemplate with delete functionality integration
- ✅ API integration with useApi composable verification
- ✅ Navigation after successful deletion validation
- ✅ Error handling flows across all content types

### Property-Based Testing Configuration (✅ IMPLEMENTED)

- ✅ Vitest with fast-check for property-based testing
- ✅ Minimum 100 iterations per property test
- ✅ Each test tagged with: **Feature: frontend-delete-functionality, Property
  {number}: {property_text}**

**Implemented Test Areas:**

- ✅ UI consistency across content types (Property 1, 4, Integration Property)
- ✅ Portuguese language validation (Property 3)
- ✅ Touch target measurements (Property 2)
- ✅ Error handling scenarios (Property 8)
- ✅ API integration behavior (Property 6, 9)
- ✅ Delete operation execution (Property 6, 7)
- ✅ Cancel operation safety (Property 5)
- ✅ Double-deletion prevention (Property 10)

### Manual Testing Checklist (✅ COMPLETED)

- ✅ Delete buttons appear in all detail views
- ✅ Confirmation dialogs display correctly
- ✅ Portuguese text is correct throughout
- ✅ Mobile touch targets are adequate
- ✅ Loading states work properly
- ✅ Error messages display appropriately
- ✅ Navigation works after deletion
- ✅ Double-deletion is prevented
- ✅ All content types support deletion consistently
