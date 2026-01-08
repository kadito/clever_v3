// Type definitions for common components

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'custom';
  placeholder?: string;
  help?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  fullWidth?: boolean;
  
  // Text/Number specific
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  
  // Textarea specific
  rows?: number;
  
  // Select specific
  options?: Array<{ value: any; label: string }>;
  
  // Checkbox specific
  checkboxLabel?: string;
  
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