<template>
  <div class="phase7-form">
    <!-- Dump Lido (toggle switch) -->
    <div class="form-field">
      <div class="toggle-field">
        <span class="form-label">Dump lido</span>
        <button
          type="button"
          role="switch"
          :aria-checked="modelValue.dumpLido"
          aria-label="Dump lido"
          class="switch"
          :class="{ 'switch--on': modelValue.dumpLido }"
          :disabled="disabled"
          @click="updateField('dumpLido', !modelValue.dumpLido)"
        >
          <span class="switch-thumb" />
        </button>
      </div>
    </div>

    <!-- Cópia de segurança (toggle switch) -->
    <div class="form-field">
      <div class="toggle-field">
        <span class="form-label">Cópia de segurança</span>
        <button
          type="button"
          role="switch"
          :aria-checked="modelValue.copiaSeguranca"
          aria-label="Cópia de segurança"
          class="switch"
          :class="{ 'switch--on': modelValue.copiaSeguranca }"
          :disabled="disabled"
          @click="updateField('copiaSeguranca', !modelValue.copiaSeguranca)"
        >
          <span class="switch-thumb" />
        </button>
      </div>
    </div>

    <!-- Fotos de Instalação — Upload Zone (hidden when disabled) -->
    <div
      v-if="!disabled"
      class="form-field"
    >
      <FileUploadZone
        field-name="fotosInstalacao"
        label="Fotos de Instalação"
        :multiple="true"
        :accept-documents="false"
        :existing-files="modelValue.fotosInstalacao"
        :disabled="disabled"
        @files-changed="handleFilesChanged"
      />
    </div>

    <!-- Fotos de Instalação — Display existing photos (shown when disabled/read-only) -->
    <div
      v-if="disabled && modelValue.fotosInstalacao.length > 0"
      class="form-field"
    >
      <FileDisplay
        :files="modelValue.fotosInstalacao"
        label="Fotos de Instalação"
        content-type="installations-programming"
        :content-uuid="installationUuid"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Phase7FinalizacaoData } from '@clever/shared';
import FileUploadZone from '@/components/common/FileUploadZone.vue';
import FileDisplay from '@/components/common/FileDisplay.vue';

interface Props {
  modelValue: Phase7FinalizacaoData;
  disabled?: boolean;
  installationUuid: string;
  validationErrors?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  validationErrors: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: Phase7FinalizacaoData): void;
  (e: 'files-changed', payload: { fieldName: string; newFiles: File[]; removedKeys: string[] }): void;
}>();

const updateField = (field: keyof Phase7FinalizacaoData, value: boolean): void => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  });
};

const handleFilesChanged = (payload: { fieldName: string; newFiles: File[]; removedKeys: string[] }): void => {
  emit('files-changed', payload);
};
</script>

<style scoped>
.phase7-form {
  @apply flex flex-col gap-4;
}

.form-field {
  @apply flex flex-col gap-1;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
  font-size: 16px;
}

/* Toggle field layout */
.toggle-field {
  @apply flex items-center justify-between;
  min-height: 44px;
}

/* Switch (same as Phase3ProgramacaoForm.vue) */
.switch {
  @apply relative inline-flex flex-shrink-0 rounded-full
         transition-colors duration-200 ease-in-out cursor-pointer;
  width: 50px;
  height: 26px;
  background-color: #e5e7eb;
  -webkit-tap-highlight-color: transparent;
}

.switch:disabled {
  @apply cursor-not-allowed opacity-60;
}

.switch--on {
  background-color: rgb(117, 174, 147);
}

.switch-thumb {
  @apply absolute rounded-full bg-white
         transition-transform duration-200 ease-in-out;
  top: 50%;
  left: 3px;
  width: 20px;
  height: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1);
  transform: translateY(-50%) translateX(0);
}

.switch--on .switch-thumb {
  transform: translateY(-50%) translateX(24px);
}

@media (max-width: 640px) {
  .switch {
    width: 48px;
    height: 28px;
  }

  .switch-thumb {
    width: 22px;
    height: 22px;
  }

  .switch--on .switch-thumb {
    transform: translateY(-50%) translateX(20px);
  }
}

.switch:focus-visible {
  @apply outline-none ring-2 ring-offset-2;
  ring-color: #75AE93;
}
</style>
