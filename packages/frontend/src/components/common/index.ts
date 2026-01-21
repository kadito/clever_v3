// Common reusable components for the CLEVER dashboard

// Base components
export { default as BackButton } from './BackButton.vue';
export { default as ErrorComponent } from './ErrorComponent.vue';
export { default as SearchBar } from './SearchBar.vue';
export { default as UserAvatar } from './UserAvatar.vue';
export { default as UserProfile } from './UserProfile.vue';
export { default as ErrorNotification } from './ErrorNotification.vue';
export { default as ClientSearchInput } from './ClientSearchInput.vue';
export { default as RelationInfoDisplay } from './RelationInfoDisplay.vue';
export { default as ConfirmationDialog } from './ConfirmationDialog.vue';

// Template components
export { default as ContentListTemplate } from './ContentListTemplate.vue';
export { default as ContentDetailTemplate } from './ContentDetailTemplate.vue';
export { default as ContentFormTemplate } from './ContentFormTemplate.vue';

// Create/Update templates
export { default as ContentCreateTemplate } from './ContentCreateTemplate.vue';
export { default as ContentUpdateTemplate } from './ContentUpdateTemplate.vue';

// Types
export type {
  FormField,
  FormSection,
  ContentListProps,
  ContentDetailProps,
  ContentFormProps,
  RelationInfoDisplayProps,
  RelationFieldConfig,
  RelationDisplayConfig,
  ConfirmationDialogProps,
  ConfirmationDialogEmits,
} from './types';
