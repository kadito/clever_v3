---
inclusion: fileMatch
fileMatchPattern: ["**/forms/**", "**/*Create*", "**/*Update*", "**/useSharedFormData*", "**/config/*-form-sections*"]
---

# Form Architecture Patterns

## Core components

- **ContentFormTemplate.vue** — renders form sections from config, manages field state
- **ContentCreateTemplate.vue** — creation wrapper with validation
- **ContentUpdateTemplate.vue** — uses ContentFormTemplate for editing
- **useSharedFormData** — persists form data across component recreation (Vue Router nav)

## Form section config

- One config file per content type in `config/{type}-form-sections.ts`
- Section ordering: Basic → Contact → Address → Financial → Services → Configuration → Observations
- Same order in Create, Update, and Detail views

## Field patterns

- Proper HTML5 input types for mobile keyboards (tel, email, url, textarea)
- Multiselect dropdowns over checkbox lists (touch-friendly)
- Conditional field visibility defined in JSON config (`conditionalDisplay` rules), not in templates
- Dynamic configuration management (add/remove/edit) via card interface

## Validation

- Validation functions in `shared/src/types/{contentType}/validation.ts`
- Portuguese error messages
- Create and Update may have different validation rules (separate logic)
- Submission blocked on validation failure

## Read-only fields in update views

- Mark fields via computed `modifiedFormSections` with `readonly: true`
- Components support `readonly` prop (e.g., `ClientSearchInput`)
- Visual indicator: lock icon + Portuguese explanation text

## Mobile-first

- 44px minimum touch targets on all interactive elements
- Form sections stack on mobile, columns on desktop
- Touch-friendly controls and spacing throughout

## Automatic technician assignment

- Work sheets + remote assistance: no manual technician input fields
- Handled in backend middleware (see `automatic-technician-assignment.md`)
- Preserve technician display in detail/list views

## Rules

- Always use `useSharedFormData` for form state
- Define conditional logic in config, never in templates
- Separate Create and Update components (different validation needs)
- All labels and messages in Portuguese
