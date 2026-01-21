# Delete Functionality Patterns

## Overview

This document establishes the standard patterns for implementing delete functionality across all content types in the CLEVER dashboard. These patterns ensure consistency, safety, and proper user experience for delete operations.

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

### ContentDetailTemplate Enhancement

The `ContentDetailTemplate` component serves as the foundation for delete functionality:

**Required Props:**
- `showDeleteButton?: boolean` - Controls delete button visibility (default: false)
- `deleteButtonText?: string` - Customizable button text (default: "Eliminar")
- `confirmDeleteTitle?: string` - Dialog title text
- `confirmDeleteMessage?: string` - Dialog confirmation message

**Required Events:**
- `delete: [item: BaseContent]` - Emitted when user confirms deletion

**UI Placement:**
- Delete buttons appear in the actions area of detail views
- Consistent positioning across all content types
- Never display delete buttons in list views

### ConfirmationDialog Component

A reusable confirmation dialog component with these characteristics:

**Features:**
- Mobile-first responsive design
- 44px minimum touch targets for all buttons
- Portuguese labels ("Confirmar", "Cancelar")
- Loading state support during delete operations
- Click-outside-to-close functionality
- Keyboard support (Enter to confirm, Escape to cancel)

**Required Props:**
```typescript
interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string; // default: "Confirmar"
  cancelText?: string;  // default: "Cancelar"
  isLoading?: boolean;
}
```

## Implementation Pattern

### Detail View Integration

Each content type's detail view follows this pattern:

```typescript
// State management
const isDeleting = ref(false);
const showDeleteConfirm = ref(false);

// Delete initiation
const handleDelete = () => {
  showDeleteConfirm.value = true;
};

// Delete confirmation
const confirmDelete = async () => {
  isDeleting.value = true;
  const success = await api.remove(item.value.uuid);
  
  if (success) {
    // Navigate to list view after successful deletion
    router.push('/content-type-list');
  } else {
    // Error handling is managed by useApi composable
    showDeleteConfirm.value = false;
  }
  isDeleting.value = false;
};

// Delete cancellation
const cancelDelete = () => {
  showDeleteConfirm.value = false;
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
3. **User can cancel** (closes dialog, no action) or **confirm** (proceeds with deletion)
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

### Manual Testing Checklist
- [ ] Delete buttons appear only in detail views
- [ ] Confirmation dialogs display correctly on all screen sizes
- [ ] Portuguese text is accurate throughout
- [ ] Touch targets meet 44px minimum requirement
- [ ] Loading states work properly during delete operations
- [ ] Error messages display appropriately
- [ ] Navigation works correctly after successful deletion
- [ ] Cancel operations work without side effects
- [ ] Double-deletion is prevented

### Property-Based Testing
- UI consistency across all content types
- Portuguese language validation
- Touch target measurements
- Error handling scenarios
- API integration behavior

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

1. **Don't add delete buttons to list views** - Only in detail views
2. **Don't skip confirmation dialogs** - Always require confirmation
3. **Don't show errors in dialogs** - Use detail view error display
4. **Don't forget loading states** - Always show progress during operations
5. **Don't hardcode text** - Use Portuguese constants for all labels
6. **Don't ignore mobile touch targets** - Always meet 44px minimum
7. **Don't implement custom delete APIs** - Use existing useApi remove() method
8. **Don't forget navigation** - Always redirect to list view after success

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