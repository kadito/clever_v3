<template>
  <button
    :class="['back-button', variant]"
    @click="handleBack"
  >
    ← Voltar
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router';

// Props
const props = defineProps({
  to: {
    type: String,
    default: null,
  },
  variant: {
    type: String,
    default: 'default', // 'default', 'inline', 'full-width'
    validator: value => ['default', 'inline', 'full-width'].includes(value),
  },
});

// Router
const router = useRouter();

// Methods
const handleBack = () => {
  if (props.to) {
    router.push(props.to);
  } else {
    router.go(-1);
  }
};
</script>

<style scoped>
.back-button {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.back-button:hover {
  background: var(--primary-hover);
}

/* Default variant - positioned */
.back-button.default {
  padding: 0.5rem 1rem;
}

/* Inline variant - fits content */
.back-button.inline {
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  align-self: flex-start;
}

/* Full width variant */
.back-button.full-width {
  padding: 0.75rem 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .back-button.default {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }

  .back-button.inline {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .back-button {
    font-size: 0.85rem;
  }
}
</style>
