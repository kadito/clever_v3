---
inclusion: fileMatch
fileMatchPattern: ["**/work-sheets/**", "**/remote-assistance/**", "**/technician*"]
---

# Automatic Technician Assignment

## Principle

Technician fields are auto-populated from Clerk auth context — no manual selection in forms.

## TechnicianUser object

```typescript
interface TechnicianUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'Admin' | 'User';
}
```

## How it works

1. Clerk middleware extracts user context from JWT
2. `autoAssignTechnician()` in `utils/technician-assignment.ts` populates the field
3. Applied automatically during content create and update operations

## Content type mapping

| Content type | Field in `data` |
|-------------|-----------------|
| Work Sheets | `technician` (TechnicianUser) |
| Remote Assistance | `tecnicoResponsavel` (TechnicianUser) |

## Form rules

- Remove manual technician input fields from form section configs
- Preserve technician display in detail views and list views
- Display helper: show `firstName lastName` or fallback to `email`

## Backward compatibility

- Display components handle both legacy string and TechnicianUser object formats
- `typeof technician === 'string'` → show as-is (old data)
- `typeof technician === 'object'` → format as `${firstName} ${lastName}`
