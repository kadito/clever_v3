<template>
  <div v-if="files.length > 0" class="file-display">
    <label class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <!-- Image files -->
      <template v-for="file in files" :key="file.key">
        <div v-if="isImageMimeType(file.mimeType)" class="relative group">
          <a
            :href="getDownloadUrl(file)"
            target="_blank"
            rel="noopener noreferrer"
            class="block min-h-[44px] min-w-[44px]"
          >
            <img
              v-if="!unavailableKeys.has(file.key)"
              :src="getDownloadUrl(file)"
              :alt="file.name"
              class="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:border-green-500 transition-colors cursor-pointer"
              @error="handleImageError(file.key)"
            />
            <div
              v-else
              class="w-full aspect-square flex flex-col items-center justify-center bg-gray-100 rounded-lg border border-red-200 text-center p-2"
              role="alert"
            >
              <svg class="w-6 h-6 text-red-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span class="text-xs text-red-500">Ficheiro indisponível</span>
            </div>
          </a>
          <p class="mt-1 text-xs text-gray-500 truncate">{{ file.name }}</p>
        </div>

        <!-- Document files -->
        <div v-else class="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-green-500 transition-colors">
          <template v-if="!unavailableKeys.has(file.key)">
            <a
              :href="getDownloadUrl(file)"
              :download="file.name"
              class="flex flex-col items-center min-h-[44px] min-w-[44px] w-full text-center"
            >
              <svg class="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span class="text-sm text-gray-700 truncate w-full">{{ file.name }}</span>
              <span class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</span>
            </a>
          </template>
          <template v-else>
            <div
              class="flex flex-col items-center min-h-[44px] min-w-[44px] w-full text-center"
              role="alert"
            >
              <svg class="w-8 h-8 text-red-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span class="text-xs text-red-500">Ficheiro indisponível</span>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { isImageMimeType, type FileReference } from '@clever/shared';

interface Props {
  files: FileReference[];
  label?: string;
  contentType: string;
  contentUuid: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Ficheiros',
});

const unavailableKeys = ref<Set<string>>(new Set());

function extractFileKey(fileRef: FileReference): string {
  // key format: files/{type}/{uuid}/{fileId}.{ext}
  // We need the last part after the last /
  const parts = fileRef.key.split('/');
  return parts[parts.length - 1];
}

function getDownloadUrl(file: FileReference): string {
  const fileKey = extractFileKey(file);
  return `/api/content/${props.contentType}/${props.contentUuid}/files/${fileKey}`;
}

function handleImageError(key: string): void {
  const newSet = new Set(unavailableKeys.value);
  newSet.add(key);
  unavailableKeys.value = newSet;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>
