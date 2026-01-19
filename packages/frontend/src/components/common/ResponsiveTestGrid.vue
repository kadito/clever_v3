<template>
  <div class="responsive-test-container">
    <div class="test-header">
      <h2 class="test-title">Responsive Design Test Grid</h2>
      <div class="current-breakpoint">
        <span class="breakpoint-indicator xs-only">XS (< 475px)</span>
        <span class="breakpoint-indicator sm-only">SM (475px - 640px)</span>
        <span class="breakpoint-indicator md-only">MD (640px - 768px)</span>
        <span class="breakpoint-indicator lg-only">LG (768px - 1024px)</span>
        <span class="breakpoint-indicator xl-only">XL (1024px+)</span>
      </div>
    </div>

    <!-- Form Grid Test -->
    <div class="test-section">
      <h3 class="section-title">Form Grid Layout</h3>
      <div class="form-grid-consistent">
        <div class="test-field">
          <label class="form-label-consistent">Field 1</label>
          <input class="form-input-consistent" placeholder="Test input 1" />
        </div>
        <div class="test-field">
          <label class="form-label-consistent">Field 2</label>
          <input class="form-input-consistent" placeholder="Test input 2" />
        </div>
        <div class="test-field">
          <label class="form-label-consistent">Field 3</label>
          <select class="form-select-consistent">
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </div>
        <div class="test-field form-field-full-width">
          <label class="form-label-consistent">Full Width Field</label>
          <textarea class="form-textarea-consistent" placeholder="Full width textarea"></textarea>
        </div>
      </div>
    </div>

    <!-- Button Layout Test -->
    <div class="test-section">
      <h3 class="section-title">Button Layout</h3>
      <div class="button-test-grid">
        <button class="btn-primary-consistent">Primary</button>
        <button class="btn-secondary-consistent">Secondary</button>
        <button class="btn-outline-consistent">Outline</button>
        <button class="btn-danger-consistent">Danger</button>
      </div>
    </div>

    <!-- Toggle Switch Test -->
    <div class="test-section">
      <h3 class="section-title">Toggle Switch</h3>
      <div class="toggle-test">
        <div class="toggle-item">
          <span class="toggle-label">Test Toggle</span>
          <button class="toggle-switch-consistent" :class="{ active: testToggle }" @click="testToggle = !testToggle">
            <span class="toggle-slider-consistent" :class="{ active: testToggle }"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- Touch Target Test -->
    <div class="test-section">
      <h3 class="section-title">Touch Targets (44px minimum)</h3>
      <div class="touch-target-test">
        <button class="touch-target-button">Touch Me</button>
        <input type="checkbox" class="form-checkbox-consistent" />
        <input type="radio" class="form-radio-consistent" name="test-radio" />
        <select class="form-select-consistent touch-target">
          <option>Touch-friendly select</option>
        </select>
      </div>
    </div>

    <!-- Loading States Test -->
    <div class="test-section">
      <h3 class="section-title">Loading States</h3>
      <div class="loading-test-grid">
        <div class="loading-test-item">
          <LoadingIndicator type="spinner" size="sm" text="Loading..." />
        </div>
        <div class="loading-test-item">
          <LoadingIndicator type="dots" size="md" />
        </div>
        <div class="loading-test-item">
          <LoadingIndicator type="pulse" size="lg" color="primary" />
        </div>
      </div>
    </div>

    <!-- Mobile Action Bar Test -->
    <div class="test-section">
      <h3 class="section-title">Mobile Action Bar</h3>
      <div class="mobile-action-bar-test">
        <div class="mobile-actions">
          <button class="btn-secondary-consistent flex-1">Cancel</button>
          <button class="btn-primary-consistent flex-1">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoadingIndicator from './LoadingIndicator.vue'

const testToggle = ref(false)
</script>

<style scoped>
.responsive-test-container {
  @apply p-4 space-y-8 max-w-4xl mx-auto;
}

.test-header {
  @apply text-center mb-8;
}

.test-title {
  @apply text-2xl font-bold text-gray-900 mb-4;
}

.current-breakpoint {
  @apply text-sm font-medium text-primary-600;
}

.breakpoint-indicator {
  @apply hidden;
}

/* Show appropriate breakpoint indicator */
@media (max-width: 474px) {
  .xs-only {
    @apply inline;
  }
}

@media (min-width: 475px) and (max-width: 639px) {
  .sm-only {
    @apply inline;
  }
}

@media (min-width: 640px) and (max-width: 767px) {
  .md-only {
    @apply inline;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .lg-only {
    @apply inline;
  }
}

@media (min-width: 1024px) {
  .xl-only {
    @apply inline;
  }
}

.test-section {
  @apply form-section-consistent;
}

.section-title {
  @apply form-section-title-consistent mb-4 p-4 bg-gray-50 border-b border-gray-200;
}

.test-field {
  @apply space-y-2;
}

.button-test-grid {
  @apply grid grid-cols-1 gap-3 p-4;
}

@media (min-width: 640px) {
  .button-test-grid {
    @apply grid-cols-2;
  }
}

@media (min-width: 768px) {
  .button-test-grid {
    @apply grid-cols-4;
  }
}

.toggle-test {
  @apply p-4;
}

.toggle-item {
  @apply flex justify-between items-center p-4 border border-gray-200 rounded-lg;
}

.toggle-label {
  @apply font-medium text-gray-700;
}

.touch-target-test {
  @apply grid grid-cols-1 gap-4 p-4;
}

@media (min-width: 640px) {
  .touch-target-test {
    @apply grid-cols-2;
  }
}

@media (min-width: 768px) {
  .touch-target-test {
    @apply grid-cols-4;
  }
}

.touch-target-button {
  @apply btn-primary-consistent;
}

.loading-test-grid {
  @apply grid grid-cols-1 gap-4 p-4;
}

@media (min-width: 640px) {
  .loading-test-grid {
    @apply grid-cols-3;
  }
}

.loading-test-item {
  @apply flex justify-center p-4 border border-gray-200 rounded-lg;
}

.mobile-action-bar-test {
  @apply p-4;
}

.mobile-actions {
  @apply flex gap-3;
}

/* Mobile-specific styles */
@media (max-width: 640px) {
  .responsive-test-container {
    @apply p-2 space-y-6;
  }
  
  .test-title {
    @apply text-xl;
  }
  
  .section-title {
    @apply text-base p-3;
  }
  
  .button-test-grid,
  .touch-target-test,
  .loading-test-grid {
    @apply gap-2 p-3;
  }
  
  .toggle-item {
    @apply p-3;
  }
}

/* Tablet-specific adjustments */
@media (min-width: 641px) and (max-width: 1023px) {
  .responsive-test-container {
    @apply p-6;
  }
}

/* Desktop-specific adjustments */
@media (min-width: 1024px) {
  .responsive-test-container {
    @apply p-8;
  }
}
</style>