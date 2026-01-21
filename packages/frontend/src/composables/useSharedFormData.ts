import { ref, reactive } from 'vue';

// Global shared form data for handling component recreation issues
const globalFormData = ref<Record<string, any>>({});
const globalValidationErrors = reactive<Record<string, string>>({});

export function useSharedFormData(formKey: string) {
  const initializeFormData = (initialData: Record<string, any>, formSections: any[]) => {
    // Create a new object
    const newFormData: Record<string, any> = {};
    
    // Start with initial data
    Object.assign(newFormData, initialData);
    
    // Ensure all form fields have keys
    for (const section of formSections || []) {
      for (const field of section.fields || []) {
        if (!(field.key in newFormData)) {
          // Set default values based on field type
          switch (field.type) {
            case 'checkbox':
            case 'switch':
              newFormData[field.key] = field.defaultValue ?? false;
              break;
            case 'number':
              newFormData[field.key] = field.defaultValue ?? null;
              break;
            default:
              newFormData[field.key] = field.defaultValue ?? '';
          }
        }
      }
    }
    
    // Replace the global form data
    globalFormData.value = newFormData;
  };

  const updateFieldValue = (fieldKey: string, value: any) => {
    if (!globalFormData.value) {
      globalFormData.value = {};
    }
    
    globalFormData.value[fieldKey] = value;
    
    // Clear validation error for this field
    delete globalValidationErrors[fieldKey];
  };

  const getFormData = () => {
    return globalFormData.value;
  };

  const clearFormData = () => {
    globalFormData.value = {};
    Object.keys(globalValidationErrors).forEach(key => {
      delete globalValidationErrors[key];
    });
  };

  return {
    formData: globalFormData,
    validationErrors: globalValidationErrors,
    initializeFormData,
    updateFieldValue,
    getFormData,
    clearFormData
  };
}