<template>
  <div class="year-selector">
    <div class="dropdown-wrapper">
      <select
        :value="modelValue"
        class="year-dropdown"
        :class="{ 'has-all-option': showAllOption }"
        @change="handleChange"
      >
        <option
          v-if="showAllOption"
          value=""
        >
          Todos os anos
        </option>
        <option
          v-for="year in years"
          :key="year"
          :value="year"
        >
          {{ year }}
        </option>
      </select>
      <div class="dropdown-icon">
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

// Props
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  years: {
    type: Array,
    default: () => [],
  },
  showAllOption: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: 'Selecionar ano',
  },
});

// Emits
const emit = defineEmits(['update:modelValue', 'change']);

// Methods
const handleChange = event => {
  const value = event.target.value;
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<style scoped>
.year-selector {
  position: relative;
  min-width: 140px;
  max-width: 200px;
  flex-shrink: 0;
  /* Ensure proper stacking context */
  z-index: 1;
}

.dropdown-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
  /* Ensure dropdown is contained within wrapper */
  overflow: visible;
}

.year-dropdown {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: left;
  text-align-last: left;
  direction: ltr;
  /* Fix for mobile dropdown positioning */
  position: relative;
  z-index: 1;
}

.year-dropdown:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 6px rgba(117, 174, 147, 0.15);
}

.year-dropdown:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(117, 174, 147, 0.1);
}

.year-dropdown:active {
  transform: translateY(1px);
}

/* Custom dropdown icon */
.dropdown-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #666;
  transition: all 0.2s ease;
}

.year-dropdown:focus + .dropdown-icon,
.year-dropdown:hover + .dropdown-icon {
  color: var(--primary-color);
  transform: translateY(-50%) rotate(180deg);
}

/* Custom option styling */
.year-dropdown option {
  padding: 0.75rem 1rem;
  background: white;
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.9rem;
  text-align: left;
  direction: ltr;
  min-height: 44px; /* Ensure touch-friendly size */
  line-height: 1.4;
}

.year-dropdown option:hover {
  background: #f8fafa;
}

.year-dropdown option:checked,
.year-dropdown option:selected {
  background: var(--primary-color);
  color: white;
  font-weight: 600;
}

/* Special styling for "Todos os anos" option */
.has-all-option option:first-child {
  font-style: italic;
  color: #666;
  border-bottom: 1px solid #eee;
}

/* Desktop-specific styling to ensure custom appearance works */
@media (min-width: 769px) {
  .year-dropdown {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }

  .dropdown-icon {
    display: block;
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .year-selector {
    min-width: 140px;
    max-width: 100%;
    flex-shrink: 0;
    /* Force proper positioning context */
    position: relative;
    z-index: 1;
    isolation: isolate;
  }

  .dropdown-wrapper {
    width: 100%;
    /* Ensure wrapper creates proper stacking context */
    position: relative;
    transform: translateZ(0); /* Force hardware acceleration */
  }

  .year-dropdown {
    padding: 0.65rem 2.25rem 0.65rem 0.875rem;
    font-size: 0.85rem;
    text-align: left;
    text-align-last: left;
    /* Enhanced mobile positioning */
    position: relative;
    z-index: 2;
    /* Use native mobile dropdown */
    -webkit-appearance: menulist;
    -moz-appearance: menulist;
    appearance: menulist;
    /* Force repaint and proper positioning */
    transform: translateZ(0);
    /* Ensure proper width and positioning */
    width: 100%;
    box-sizing: border-box;
  }

  .year-dropdown option {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    min-height: 48px;
    background: white;
    color: #2c3e50;
    /* Ensure options inherit proper styles */
    font-family: inherit;
    line-height: 1.4;
  }

  .dropdown-icon {
    /* Hide custom icon on mobile */
    display: none;
  }
}

@media (max-width: 480px) {
  .year-selector {
    min-width: 120px;
    max-width: 100%;
    flex-shrink: 0;
    /* Enhanced positioning for small screens */
    position: relative;
    z-index: 1;
    isolation: isolate;
  }

  .dropdown-wrapper {
    width: 100%;
    /* Force proper stacking context */
    position: relative;
    transform: translateZ(0);
  }

  .year-dropdown {
    padding: 0.6rem 2rem 0.6rem 0.75rem;
    font-size: 0.8rem;
    text-align: left;
    text-align-last: left;
    /* Enhanced positioning */
    position: relative;
    z-index: 2;
    /* Native appearance for mobile */
    -webkit-appearance: menulist;
    -moz-appearance: menulist;
    appearance: menulist;
    /* Hardware acceleration and proper positioning */
    transform: translateZ(0);
    width: 100%;
    box-sizing: border-box;
  }

  .year-dropdown option {
    padding: 0.75rem 0.75rem;
    font-size: 0.8rem;
    min-height: 50px;
    background: white;
    color: #2c3e50;
    line-height: 1.5;
    font-family: inherit;
  }

  .dropdown-icon {
    /* Hide custom icon on mobile */
    display: none;
  }
}

/* Dark mode support (future-proofing) */
@media (prefers-color-scheme: dark) {
  .year-dropdown {
    background: #2c3e50;
    color: white;
    border-color: #4a5568;
  }

  .year-dropdown option {
    background: #2c3e50;
    color: white;
  }

  .year-dropdown:hover {
    border-color: var(--primary-color);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .year-dropdown {
    border-width: 3px;
    border-color: #000;
  }

  .year-dropdown:focus {
    border-color: #0066cc;
    box-shadow: 0 0 0 2px #0066cc;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .year-dropdown,
  .dropdown-icon {
    transition: none;
  }

  .year-dropdown:active {
    transform: none;
  }
}
</style>
