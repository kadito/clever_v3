<template>
  <div class="signature-pad-container w-full">
    <!-- Signature canvas -->
    <div class="signature-canvas-wrapper border-2 border-gray-300 rounded-md bg-white mb-4 w-full">
      <canvas
        ref="canvasRef"
        class="signature-canvas w-full touch-none"
        :class="{ 'cursor-not-allowed': disabled }"
      />
    </div>

    <!-- Action buttons -->
    <div
      v-if="!disabled"
      class="signature-actions flex gap-2"
    >
      <button
        type="button"
        class="btn-secondary px-4 py-2 min-h-[44px] bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        @click="clearSignature"
      >
        Limpar
      </button>
    </div>

    <!-- Signature preview (when disabled/viewing) -->
    <div
      v-if="disabled && modelValue"
      class="signature-preview mt-4 w-full"
    >
      <img
        :src="modelValue"
        alt="Assinatura do Cliente"
        class="w-full h-auto border border-gray-300 rounded-md"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import SignaturePad from 'signature_pad';

interface Props {
  modelValue?: string;
  disabled?: boolean;
  hasError?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'signature-cleared'): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  hasError: false,
});

const emit = defineEmits<Emits>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const signaturePad = ref<SignaturePad | null>(null);

// Initialize signature pad
const initSignaturePad = () => {
  if (!canvasRef.value) return;

  // Set canvas size based on container
  const canvas = canvasRef.value;
  const container = canvas.parentElement;
  if (!container) return;

  // Set canvas dimensions
  const isMobile = window.innerWidth < 768;
  const canvasHeight = isMobile ? 200 : 250;

  canvas.width = container.clientWidth;
  canvas.height = canvasHeight;

  signaturePad.value = new SignaturePad(canvas, {
    backgroundColor: 'rgb(255, 255, 255)',
    penColor: 'rgb(0, 0, 0)',
    minWidth: 1,
    maxWidth: 3,
  });

  // Handle signature changes
  signaturePad.value.addEventListener('endStroke', handleSignatureChange);

  // Load existing signature if provided
  if (props.modelValue && !props.disabled) {
    loadSignature(props.modelValue);
  }
};

// Convert signature to base64 PNG
const handleSignatureChange = () => {
  if (!signaturePad.value || signaturePad.value.isEmpty()) {
    emit('update:modelValue', '');
    return;
  }

  try {
    const dataURL = signaturePad.value.toDataURL('image/png');
    
    // Check signature size (base64 string size)
    const sizeInBytes = dataURL.length;
    const sizeInKB = sizeInBytes / 1024;
    
    if (sizeInKB > 100) {
      console.warn(`Signature size (${sizeInKB.toFixed(2)}KB) exceeds 100KB limit`);
      // Still emit the value but log warning
      // In production, you might want to show a user-friendly message
    }
    
    emit('update:modelValue', dataURL);
  } catch (error) {
    console.error('Error converting signature to data URL:', JSON.stringify(error, null, 2));
  }
};

// Clear signature
const clearSignature = () => {
  if (signaturePad.value) {
    signaturePad.value.clear();
    emit('update:modelValue', '');
    emit('signature-cleared');
  }
};

// Load signature from data URL
const loadSignature = (dataURL: string) => {
  if (!signaturePad.value || !dataURL) return;

  try {
    signaturePad.value.fromDataURL(dataURL);
  } catch (error) {
    console.error('Error loading signature:', JSON.stringify(error, null, 2));
  }
};

// Handle window resize
const handleResize = () => {
  if (!canvasRef.value || !signaturePad.value) return;

  const data = signaturePad.value.toData();
  initSignaturePad();
  if (data && data.length > 0) {
    signaturePad.value?.fromData(data);
  }
};

onMounted(async () => {
  await nextTick();
  initSignaturePad();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  if (signaturePad.value) {
    signaturePad.value.off();
  }
  window.removeEventListener('resize', handleResize);
});

// Watch for modelValue changes from parent
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && signaturePad.value && signaturePad.value.isEmpty()) {
      loadSignature(newValue);
    }
  }
);
</script>

<style scoped>
.signature-canvas {
  display: block;
}

.signature-canvas-wrapper {
  width: 100%;
}
</style>
