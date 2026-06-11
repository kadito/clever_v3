<template>
  <div class="file-upload-zone">
    <label class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>

    <!-- Select files button -->
    <button
      type="button"
      :disabled="disabled"
      class="min-h-[44px] min-w-[44px] px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      @click="triggerFileInput"
    >
      Selecionar ficheiros
    </button>

    <input
      ref="fileInputRef"
      type="file"
      :accept="acceptAttribute"
      :multiple="multiple"
      :disabled="disabled"
      class="hidden"
      @change="handleFileSelect"
    >

    <!-- Validation errors -->
    <div
      v-if="errors.length > 0"
      class="mt-2 space-y-1"
    >
      <p
        v-for="(err, idx) in errors"
        :key="idx"
        class="text-sm text-red-600"
      >
        {{ err }}
      </p>
    </div>

    <!-- Existing files -->
    <div
      v-if="displayExistingFiles.length > 0"
      class="mt-3 space-y-2"
    >
      <div
        v-for="file in displayExistingFiles"
        :key="file.key"
        class="flex items-center gap-3 p-2 rounded-lg border border-gray-200"
        :class="{ 'opacity-50': removedKeys.has(file.key) }"
      >
        <!-- Existing image thumbnail -->
        <img
          v-if="isImageMimeType(file.mimeType)"
          :src="getExistingFileUrl(file)"
          :alt="file.name"
          class="w-12 h-12 object-cover rounded"
        >
        <!-- Document icon -->
        <div
          v-else
          class="w-12 h-12 flex items-center justify-center bg-gray-100 rounded"
        >
          <svg
            class="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-700 truncate">
            {{ file.name }}
          </p>
          <p class="text-xs text-gray-500">
            {{ formatFileSize(file.size) }}
          </p>
        </div>

        <button
          v-if="!disabled"
          type="button"
          class="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:text-red-700"
          :aria-label="'Remover ' + file.name"
          @click="toggleExistingFileRemoval(file.key)"
        >
          <svg
            v-if="removedKeys.has(file.key)"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
          <svg
            v-else
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- New files (with previews) -->
    <div
      v-if="newFiles.length > 0"
      class="mt-3 space-y-2"
    >
      <div
        v-for="(file, idx) in newFiles"
        :key="'new-' + idx"
        class="flex items-center gap-3 p-2 rounded-lg border border-green-200 bg-green-50"
      >
        <!-- Image preview thumbnail -->
        <img
          v-if="previewUrls[idx]"
          :src="previewUrls[idx]"
          :alt="file.name"
          class="w-12 h-12 object-cover rounded"
        >
        <!-- Document icon for non-images -->
        <div
          v-else
          class="w-12 h-12 flex items-center justify-center bg-gray-100 rounded"
        >
          <svg
            class="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-700 truncate">
            {{ file.name }}
          </p>
          <p class="text-xs text-gray-500">
            {{ formatFileSize(file.size) }}
          </p>
        </div>

        <button
          v-if="!disabled"
          type="button"
          class="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:text-red-700"
          :aria-label="'Remover ' + file.name"
          @click="removeNewFile(idx)"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue';
import {
  validateFile,
  isImageMimeType,
  ACCEPTED_EXTENSIONS,
  type FileReference,
} from '@clever/shared';

interface Props {
  fieldName: string;
  label: string;
  multiple?: boolean;
  existingFiles?: FileReference[];
  acceptImages?: boolean;
  acceptDocuments?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  existingFiles: () => [],
  acceptImages: true,
  acceptDocuments: true,
  disabled: false,
});

const emit = defineEmits<{
  'files-changed': [payload: { fieldName: string; newFiles: File[]; removedKeys: string[] }];
}>();

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

const fileInputRef = ref<HTMLInputElement | null>(null);
const newFiles = ref<File[]>([]);
const previewUrls = ref<string[]>([]);
const removedKeys = ref<Set<string>>(new Set());
const errors = ref<string[]>([]);

/** Build the accept attribute based on acceptImages/acceptDocuments props */
const acceptAttribute = computed((): string => {
  if (props.acceptImages && props.acceptDocuments) {
    return ACCEPTED_EXTENSIONS.join(',');
  }
  if (props.acceptImages && !props.acceptDocuments) {
    return IMAGE_EXTENSIONS.join(',');
  }
  if (!props.acceptImages && props.acceptDocuments) {
    return DOCUMENT_EXTENSIONS.join(',');
  }
  return ACCEPTED_EXTENSIONS.join(',');
});

/** Existing files to display (from props) — filter out invalid entries */
const displayExistingFiles = computed((): FileReference[] =>
  props.existingFiles.filter(f => f && f.key && f.name && typeof f.size === 'number')
);

/** Placeholder URL for existing files — parent handles actual URLs */
function getExistingFileUrl(file: FileReference): string {
  // Build a relative API URL from the file key
  // key format: files/{type}/{uuid}/{fileId}.{ext}
  const parts = file.key.split('/');
  if (parts.length >= 4) {
    const type = parts[1];
    const uuid = parts[2];
    const fileKey = parts.slice(3).join('/');
    return `/api/content/${type}/${uuid}/files/${fileKey}`;
  }
  return '';
}

function triggerFileInput(): void {
  fileInputRef.value?.click();
}

function handleFileSelect(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  errors.value = [];
  const selectedFiles = Array.from(input.files);
  const validFiles: File[] = [];

  for (const file of selectedFiles) {
    const result = validateFile({ name: file.name, type: file.type, size: file.size });
    if (!result.valid) {
      errors.value.push(`${file.name}: ${result.error}`);
      continue;
    }
    validFiles.push(file);
  }

  if (validFiles.length === 0) {
    // Reset input so the same file can be re-selected
    input.value = '';
    return;
  }

  if (!props.multiple) {
    // Singular mode: replace everything
    // Revoke old preview URLs
    revokeAllPreviews();

    // Mark all existing files for removal
    const allExistingKeys = props.existingFiles.map(f => f.key);
    removedKeys.value = new Set(allExistingKeys);

    // Keep only the last valid file
    const singleFile = validFiles[validFiles.length - 1];
    newFiles.value = [singleFile];
    previewUrls.value = [];

    if (isImageMimeType(singleFile.type)) {
      previewUrls.value = [URL.createObjectURL(singleFile)];
    } else {
      previewUrls.value = [''];
    }
  } else {
    // Multiple mode: append
    for (const file of validFiles) {
      newFiles.value.push(file);
      if (isImageMimeType(file.type)) {
        previewUrls.value.push(URL.createObjectURL(file));
      } else {
        previewUrls.value.push('');
      }
    }
  }

  // Reset input so the same file can be re-selected
  input.value = '';

  emitChange();
}

function removeNewFile(index: number): void {
  // Revoke preview URL if it exists
  if (previewUrls.value[index]) {
    URL.revokeObjectURL(previewUrls.value[index]);
  }
  newFiles.value.splice(index, 1);
  previewUrls.value.splice(index, 1);
  emitChange();
}

function toggleExistingFileRemoval(key: string): void {
  const newSet = new Set(removedKeys.value);
  if (newSet.has(key)) {
    newSet.delete(key);
  } else {
    newSet.add(key);
  }
  removedKeys.value = newSet;
  emitChange();
}

function emitChange(): void {
  emit('files-changed', {
    fieldName: props.fieldName,
    newFiles: [...newFiles.value],
    removedKeys: Array.from(removedKeys.value),
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function revokeAllPreviews(): void {
  for (const url of previewUrls.value) {
    if (url) URL.revokeObjectURL(url);
  }
}

// Watch for existingFiles changes to reset removed keys for files no longer present
watch(
  () => props.existingFiles,
  () => {
    const existingKeys = new Set(props.existingFiles.map(f => f.key));
    const newRemoved = new Set<string>();
    for (const key of removedKeys.value) {
      if (existingKeys.has(key)) newRemoved.add(key);
    }
    removedKeys.value = newRemoved;
  }
);

// Cleanup object URLs on unmount
onUnmounted(() => {
  revokeAllPreviews();
});
</script>
