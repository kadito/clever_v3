// Type definitions for common components

export interface FormField {
  key: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'tel'
    | 'url'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'switch'
    | 'date'
    | 'custom';
  placeholder?: string;
  help?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  fullWidth?: boolean;
  defaultValue?: any;

  // Text/Number specific
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;

  // Textarea specific
  rows?: number;

  // Select/Multiselect specific
  options?: Array<{ value: any; label: string }>;

  // Checkbox specific
  checkboxLabel?: string;

  // Switch specific
  switchLabel?: string;

  // Conditional field support
  conditional?: {
    dependsOn: string;
    showWhen: (value: any) => boolean;
  };

  // Validation
  validator?: (value: any) => string | null;
}

export interface FormSection {
  key: string;
  title: string;
  description?: string;
  fields: FormField[];
}

// Content template props interfaces
export interface ContentListProps {
  items: any[];
  isLoading?: boolean;
  error?: string | null;
  displayName: string;
  description?: string;
  backRoute?: string;
  searchQuery?: string;
  searchPlaceholder?: string;
  showCreateButton?: boolean;
  createButtonText?: string;
}

export interface ContentDetailProps {
  item: any | null;
  isLoading?: boolean;
  error?: string | null;
  backRoute?: string;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  deleteButtonText?: string;
  confirmDeleteTitle?: string;
  confirmDeleteMessage?: string;
}

export interface ContentFormProps {
  formSections: FormSection[];
  initialData?: Record<string, any>;
  isLoading?: boolean;
  isSaving?: boolean;
  error?: string | null;
  isEditing?: boolean;
  createTitle?: string;
  editTitle?: string;
  subtitle?: string;
  cancelRoute?: string;
}

// Relation display component props
export interface RelationInfoDisplayProps {
  /** The relation data (resolved relation or error) */
  relationData: import('@clever/shared').RelationResult | null | undefined;
  /** The relation type (e.g., 'client', 'contract') */
  relationType: string;
  /** The original relation ID for debugging */
  relationId?: string;
  /** Whether to show debug information (relation ID) */
  showDebugInfo?: boolean;
  /** Custom display name for the relation */
  customDisplayName?: string;
  /** Custom fields to display (overrides default fields) */
  customFields?: Array<{ key: string; label: string }>;
}

// Relation field configuration for display
export interface RelationFieldConfig {
  key: string;
  label: string;
}

// Relation display configuration
export interface RelationDisplayConfig {
  displayName: string;
  icon: string;
  fields: RelationFieldConfig[];
}

// Confirmation dialog props
export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export interface ConfirmationDialogEmits {
  confirm: [];
  cancel: [];
  close: [];
}
