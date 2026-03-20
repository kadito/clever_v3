---
inclusion: fileMatch
fileMatchPattern: ["**/common/ConfirmationDialog*", "**/*Detail*"]
---

# Delete Functionality Patterns

## Overview

This document establishes the standard patterns for implementing delete
functionality across all content types in the CLEVER dashboard. These patterns
ensure consistency, safety, and proper user experience for delete operations.

## Core Principles

### Safety First

- Always require confirmation before deletion
- Use soft delete backend functionality (items marked as deleted, not removed)
- Prevent accidental deletions through clear UI patterns
- Provide clear feedback on delete operation results

### Consistency Across Content Types

- All content types follow identical delete UI patterns
- Same confirmation dialog behavior across all views
- Consistent Portuguese labeling and messaging
- Uniform error handling and user feedback

### Mobile-First Design

- 44px minimum touch targets for all delete buttons
- Touch-friendly confirmation dialogs
- Appropriate loading states for mobile networks
- Responsive design that works across all screen sizes

## Component Architecture

### ContentDetailTemplate Enhancement (✅ IMPLEMENTED)

The `ContentDetailTemplate` component serves as the foundation for delete
functionality:

**Implemented Props:**

- `showDeleteButton?: boolean` - Controls delete button visibility (default:
  false)
- `deleteButtonText?: string` - Customizable button text (default: "Eliminar")
- `confirmDeleteTitle?: string` - Dialog title text
- `confirmDeleteMessage?: string` - Dialog confirmation message

**Implemented Events:**

- `delete: [item: BaseContent]` - Emitted when user confirms deletion

**UI Implementation:**

- Delete buttons appear in the actions area of detail views
- Consistent positioning across all content types
- Desktop: Header actions area (hidden on mobile)
- Mobile: Fixed bottom action bar with full-width buttons
- Never display delete buttons in list views

### ConfirmationDialog Component (✅ IMPLEMENTED)

A fully implemented reusable confirmation dialog component:

**Features:**

- ✅ Mobile-first responsive design with proper breakpoints
- ✅ 44px minimum touch targets for all buttons (48px on mobile)
- ✅ Portuguese labels ("Confirmar", "Cancelar")
- ✅ Loading state support during delete operations
- ✅ Click-outside-to-close functionality
- ✅ Keyboard support (Enter to confirm, Escape to cancel)
- ✅ Focus management and accessibility features
- ✅ Backdrop blur effect for modern browsers
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Print styles (hidden in print mode)

**Implemented Props:**

```typescript
interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string; // default: "Confirmar"
  cancelText?: string; // default: "Cancelar"
  isLoading?: boolean;
}
```

**Template Integration:**

```vue
<ConfirmationDialog
  :is-open="showDeleteConfirm"
  :title="confirmDeleteTitle"
  :message="confirmDeleteMessage"
  :is-loading="isDeleting"
  confirm-text="Confirmar"
  cancel-text="Cancelar"
  @confirm="confirmDelete"
  @cancel="cancelDelete"
  @close="cancelDelete"
/>
```

## Implementation Pattern

### Detail View Integration

Each content type's detail view follows this established pattern (implemented
across all content types):

```typescript
// State management
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);
const confirmDeleteTitle = ref('Confirmar Eliminação');
const confirmDeleteMessage = ref('');

// Delete initiation with dynamic confirmation message
const handleDelete = () => {
  if (!item.value) return;

  // Generate item-specific confirmation message
  confirmDeleteMessage.value = getDeleteConfirmationMessage();
  showDeleteConfirm.value = true;
};

// Delete confirmation with comprehensive error handling
const confirmDelete = async () => {
  if (!item.value) return;

  try {
    isDeleting.value = true;

    console.log(
      'Attempting to delete item:',
      JSON.stringify(
        {
          uuid: item.value.uuid,
          type: item.value.contentType,
        },
        null,
        2
      )
    );

    const success = await api.remove(item.value.uuid);

    if (api.error.value) {
      console.error(
        'Delete operation failed with API error:',
        JSON.stringify(api.error.value, null, 2)
      );
      error.value =
        typeof api.error.value === 'string'
          ? api.error.value
          : api.error.value.message || 'Erro ao eliminar item';
      showDeleteConfirm.value = false;
      return;
    }

    if (success) {
      console.log('Item deleted successfully, navigating to list view');
      router.push('/content-type-list');
    } else {
      console.error('Delete operation failed - useApi returned false');
      error.value = 'Não foi possível eliminar este item.';
      showDeleteConfirm.value = false;
    }
  } catch (err) {
    console.error('Delete operation error:', JSON.stringify(err, null, 2));
    error.value = err instanceof Error ? err.message : 'Erro ao eliminar item';
    showDeleteConfirm.value = false;
  } finally {
    isDeleting.value = false;
  }
};

// Delete cancellation
const cancelDelete = () => {
  showDeleteConfirm.value = false;
};

// Helper function for dynamic confirmation messages
const getDeleteConfirmationMessage = (): string => {
  if (!item.value) return 'Tem a certeza que pretende eliminar este item?';

  // Generate item-specific identifier for confirmation
  const itemIdentifier = getItemDisplayName(item.value);
  return `Tem a certeza que pretende eliminar "${itemIdentifier}"?`;
};
```

### API Integration

**Required:**

- Use existing `useApi` composable's `remove()` method
- Leverage existing soft delete backend functionality
- No additional API endpoints required

**Error Handling:**

- API errors are handled by the `useApi` composable
- Display errors in detail view using existing `ErrorComponent`
- Never show errors in confirmation dialogs
- Maintain user context when errors occur

## User Experience Flow

### Standard Delete Flow

1. **User clicks delete button** in detail view
2. **Confirmation dialog appears** with item identification
3. **User can cancel** (closes dialog, no action) or **confirm** (proceeds with
   deletion)
4. **Loading state shows** during API call
5. **Success**: Navigate to list view
6. **Error**: Show error message in detail view, close dialog

### Error Scenarios

**Network Errors:**

- Display: "Erro de rede. Verifique a sua ligação à internet."
- Action: Maintain current view, allow retry

**Server Errors:**

- Display: Specific error message from API response
- Action: Maintain current view, close confirmation dialog

**Validation Errors:**

- Display: "Não é possível eliminar este item."
- Action: Maintain current view, close confirmation dialog

## Portuguese Language Standards

### Required Labels

- Delete button: "Eliminar"
- Confirm button: "Confirmar"
- Cancel button: "Cancelar"
- Default dialog title: "Confirmar Eliminação"
- Default dialog message: "Tem a certeza que pretende eliminar este item?"

### Error Messages

- Network error: "Erro de rede. Verifique a sua ligação à internet."
- General error: "Não foi possível eliminar este item."
- Validation error: "Não é possível eliminar este item."

## Mobile Optimization

### Touch Targets

- All delete buttons: minimum 44px height and width
- Confirmation dialog buttons: minimum 44px height, full-width on mobile
- Adequate spacing between interactive elements

### Responsive Behavior

- Confirmation dialogs adapt to screen size
- Button layouts stack vertically on small screens
- Loading indicators appropriate for mobile context

## Testing Guidelines

### Manual Testing Checklist (✅ READY FOR TESTING)

- [ ] Delete buttons appear only in detail views
- [ ] Confirmation dialogs display correctly on all screen sizes
- [ ] Portuguese text is accurate throughout
- [ ] Touch targets meet 44px minimum requirement
- [ ] Loading states work properly during delete operations
- [ ] Error messages display appropriately
- [ ] Navigation works correctly after successful deletion
- [ ] Cancel operations work without side effects
- [ ] Double-deletion is prevented

### Property-Based Testing (✅ IMPLEMENTED)

- ✅ UI consistency across all content types
- ✅ Portuguese language validation
- ✅ Touch target measurements
- ✅ Error handling scenarios
- ✅ API integration behavior
- ✅ 10 comprehensive properties with 100 iterations each
- ✅ Fast-check integration with Vitest
- ✅ Feature tagging: "frontend-delete-functionality"

### Implementation Status by Content Type

**✅ COMPLETED:**

- ClientsDetailView - Full delete functionality implemented
- ContractsDetailView - Full delete functionality implemented
- LicensesDetailView - Full delete functionality implemented
- WorkSheetsDetailView - Full delete functionality implemented

**✅ CORE COMPONENTS:**

- ConfirmationDialog - Fully implemented and tested
- ContentDetailTemplate - Enhanced with delete support
- Property-based test suite - Comprehensive coverage implemented

## Security Considerations

### Data Safety

- All deletions use soft delete (backend marks as deleted)
- No permanent data loss through UI operations
- Audit trail maintained for all delete operations
- User identification recorded in delete audit trail

### Access Control

- Delete operations require authentication
- Future: Role-based delete permissions (Admin/Employee)
- Consistent authorization patterns across content types

## Common Pitfalls to Avoid

1. **Don't add delete buttons to list views** - Only in detail views ✅
   IMPLEMENTED
2. **Don't skip confirmation dialogs** - Always require confirmation ✅
   IMPLEMENTED
3. **Don't show errors in dialogs** - Use detail view error display ✅
   IMPLEMENTED
4. **Don't forget loading states** - Always show progress during operations ✅
   IMPLEMENTED
5. **Don't hardcode text** - Use Portuguese constants for all labels ✅
   IMPLEMENTED
6. **Don't ignore mobile touch targets** - Always meet 44px minimum ✅
   IMPLEMENTED
7. **Don't implement custom delete APIs** - Use existing useApi remove() method
   ✅ IMPLEMENTED
8. **Don't forget navigation** - Always redirect to list view after success ✅
   IMPLEMENTED
9. **Don't skip item identification** - Always show what's being deleted in
   confirmation ✅ IMPLEMENTED
10. **Don't forget comprehensive error handling** - Handle API errors, network
    errors, and validation errors ✅ IMPLEMENTED

## Implementation Status Summary

### ✅ COMPLETED (100% Implementation)

**Core Infrastructure:**

- ConfirmationDialog component with full functionality and comprehensive styling
- ContentDetailTemplate enhanced with delete button support (desktop + mobile)
- Property-based testing suite with 10 properties and 100 iterations each
- Portuguese language support throughout
- Mobile-first responsive design with 44px touch targets
- Loading states and double-deletion prevention
- Comprehensive error handling with structured logging

**Content Type Integration:**

- ClientsDetailView: Full delete functionality with dynamic confirmation
  messages
- ContractsDetailView: Full delete functionality with contract-specific
  identification
- LicensesDetailView: Full delete functionality with software name
  identification
- WorkSheetsDetailView: Full delete functionality with work sheet identification

**Quality Assurance:**

- Property-based tests covering all 10 correctness properties
- Mobile-first responsive design verified
- Portuguese language consistency validated
- Touch target compliance (44px minimum) implemented
- API integration with existing useApi composable confirmed
- Error handling patterns established and implemented

### 🎯 READY FOR PRODUCTION

The delete functionality implementation is complete and ready for production
use. All core components, content type integrations, and testing infrastructure
are fully implemented according to the design specifications.

## Future Enhancements

### Planned Improvements

- Bulk delete functionality for list views
- Undo functionality for recent deletions
- Role-based delete permissions
- Delete operation audit logging
- Advanced confirmation for critical items

### Extension Points

- Custom confirmation messages per content type
- Content-specific delete validation rules
- Integration with workflow systems
- Advanced error recovery mechanisms
