# Form Architecture Patterns

## Core Form Components

### Component Architecture

- **ContentFormTemplate.vue**: Core form rendering with shared form data
  handling
- **ContentCreateTemplate.vue**: Wrapper for creation-specific logic and
  validation
- **ContentUpdateTemplate.vue**: Uses ContentFormTemplate directly for editing
- **useSharedFormData**: Composable to handle Vue component recreation issues

### Data Persistence

- Form data persists across component recreation during navigation
- Handles Vue Router navigation without losing form state
- Prevents data loss when components are recreated

## Form Field Patterns

### Input Types

- Use proper HTML5 input types for mobile keyboards:
  - `tel` for phone numbers
  - `email` for email addresses
  - `url` for website URLs
  - `textarea` for multi-line text
  - `select` for dropdowns
  - `checkbox` for boolean values

### Multiselect Dropdowns

- Replace individual checkboxes with touch-friendly multiselect dropdowns
- Visual tags show selected items with individual removal capability
- Click-outside closing with proper dropdown behavior and overlay handling
- Mobile-optimized with proper touch targets and responsive design

### Conditional Fields

- Dynamic field visibility based on other field values
- Dependency tracking with proper reactive updates when dependent values change
- All conditional logic defined in JSON configuration within form sections
- No hardcoded conditional logic in templates

### Dynamic Configuration Management

- Add/remove functionality for configuration items (e.g., software, invoices)
- Individual item editing with save/cancel functionality
- Touch-friendly card interface for configuration management
- Type-specific options with conditional suboptions based on configuration type

### Automatic Technician Assignment

- Remove manual technician selection fields from form configurations
- Technician assignment handled automatically in backend middleware
- Form sections should exclude technician input fields for work sheets and remote assistance
- Preserve technician display in detail views and list views
- Use TechnicianUser object structure for comprehensive user information

## Form Section Standards

### Section Ordering

Consistent order across all content types:

1. **Basic** - Core identification fields
2. **Contact** - Contact information
3. **Address** - Address details
4. **Financial** - Financial information
5. **Services** - Service-related fields
6. **Configuration** - Dynamic configuration items
7. **Observations** - Always last section

### Cross-View Consistency

- Same section ordering in Create, Update, and Detail views
- Consistent field grouping and labeling
- Uniform responsive behavior across breakpoints

## Validation Patterns

### Shared Validation

- Validation functions in shared package for consistency
- Content-specific validation can override default validation
- Portuguese validation messages with proper field mapping

### Create vs Update Validation

- Different validation rules between Create and Update components
- Create: Full validation for new content
- Update: May have disabled fields or different business rules
- Separate validation logic allows for different field behaviors

## Mobile-First Form Design

### Touch Targets

- All interactive elements meet 44px minimum requirement
- Form sections adapt from mobile to desktop layouts
- Touch-friendly controls and spacing

### Responsive Forms

- Mobile-first responsive design with proper breakpoints
- Form sections stack on mobile, may use columns on desktop
- Consistent behavior across all screen sizes

## Implementation Guidelines

### Form Section Configuration

```typescript
interface FormSection {
  title: string;
  fields: FormField[];
  order: number;
  conditionalDisplay?: ConditionalRule[];
}

interface FormField {
  name: string;
  type:
    | 'text'
    | 'email'
    | 'tel'
    | 'url'
    | 'textarea'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'dynamic';
  label: string;
  required?: boolean;
  validation?: ValidationRule[];
  conditionalDisplay?: ConditionalRule[];
  options?: SelectOption[]; // for select/multiselect
  dynamicConfig?: DynamicFieldConfig; // for dynamic fields
}
```

### Shared Form Data Usage

```typescript
// In Create/Update components
const { formData, updateFormData, resetFormData } = useSharedFormData();

// Form data persists across component recreation
// No need to manually handle form state in navigation
```

### Conditional Field Configuration

```typescript
interface ConditionalRule {
  dependsOn: string; // field name
  condition: 'equals' | 'not_equals' | 'contains' | 'not_contains';
  value: any;
  action: 'show' | 'hide' | 'enable' | 'disable';
}
```

## Best Practices

1. **Always use shared form data composable** for form state management
2. **Define conditional logic in JSON configuration**, not in templates
3. **Use proper HTML5 input types** for mobile keyboard optimization
4. **Implement multiselect dropdowns** instead of checkbox lists for mobile
5. **Follow consistent section ordering** across all content types
6. **Separate Create and Update components** for different validation needs
7. **Use Portuguese labels and validation messages** throughout
8. **Ensure 44px minimum touch targets** for all interactive elements
9. **Test on mobile devices** regularly during development
10. **Handle component recreation gracefully** with persistent form data
11. **Remove manual technician fields** from work sheets and remote assistance forms
12. **Preserve technician display functionality** in all view components
13. **Use TechnicianUser objects** instead of simple strings for technician data
