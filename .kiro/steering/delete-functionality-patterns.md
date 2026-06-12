---
inclusion: fileMatch
fileMatchPattern: ["**/common/ConfirmationDialog*", "**/*Detail*"]
---

# Delete Functionality Patterns

## Rules

- Confirmation dialog always required before deletion
- Soft delete only — items marked as deleted, never removed from R2
- Delete buttons appear in detail views ONLY — never in list views
- Use `useApi.remove()` for the API call
- Navigate to list view on success; show error in detail view (not in dialog)
- ConfirmationDialog receives `isLoading` prop during API call

## Component integration

- `ContentDetailTemplate` exposes `showDeleteButton` prop + `delete` event
- Detail views generate a dynamic confirmation message identifying the item
- Desktop: delete button in header actions; Mobile: fixed bottom action bar

## Error handling

- API errors displayed via `ErrorComponent` in the detail view
- Never display errors inside the confirmation dialog
- Log errors with JSON.stringify: `console.error('Delete failed:', JSON.stringify(err, null, 2))`

## Portuguese labels

- Button: "Eliminar"
- Dialog title: "Confirmar Eliminação"
- Dialog message: "Tem a certeza que pretende eliminar \"{itemName}\"?"
- Confirm: "Confirmar" / Cancel: "Cancelar"

## Permissions

- Only Admin users can delete (checked via `usePermissions().permissions.canDelete`)
- Backend enforces via `requireDeletePermission` middleware
