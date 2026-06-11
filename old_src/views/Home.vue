<template>
  <div class="home">
    <div class="modules-grid">
      <div
        v-for="module in modules"
        :key="module.id"
        :class="[
          'module-card',
          { 'module-incomplete': module.status === 'incomplete' || module.status === 'disabled' },
        ]"
        @click="navigateToModule(module)"
      >
        <div class="module-icon">
          {{ module.icon }}
        </div>
        <h3>{{ module.name }}</h3>
        <div
          v-if="module.status === 'incomplete' || module.status === 'disabled'"
          class="incomplete-badge"
        >
          Em breve
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import modulesConfig from '@/config/modules.json';

// Router
const router = useRouter();

// Reactive data
const modules = modulesConfig.modules;

// Methods
const navigateToModule = module => {
  // Only navigate if module is complete
  if (module.status === 'complete') {
    router.push(module.path);
  }
  // Do nothing if module is incomplete (already visually disabled)
};
</script>

<style scoped>
.home {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(117, 174, 147, 0.3);
}

.header-section h1 {
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.module-card {
  background: white;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(117, 174, 147, 0.15);
  border-color: var(--primary-color);
}

.module-card:active {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(117, 174, 147, 0.2);
}

.module-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  filter: grayscale(0.2);
}

.module-card h3 {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
  text-align: center;
}

/* Incomplete module styles */
.module-incomplete {
  opacity: 0.5;
  position: relative;
  cursor: not-allowed !important;
  background: #e9ecef;
  border: 2px dashed #adb5bd !important;
  pointer-events: none;
}

.module-incomplete:hover {
  transform: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px dashed #adb5bd !important;
}

.module-incomplete:active {
  transform: none !important;
}

.module-incomplete .module-icon {
  filter: grayscale(1);
  opacity: 0.4;
}

.module-incomplete h3 {
  color: #6c757d;
  font-weight: 400;
}

.incomplete-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #dc3545;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(220, 53, 69, 0.4);
  pointer-events: auto;
  z-index: 1;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .home {
    padding: 0.5rem;
  }

  .header-section {
    padding: 1.5rem 1rem;
    margin-bottom: 1.5rem;
  }

  .header-section h1 {
    font-size: 2rem;
  }

  .modules-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1rem;
  }

  .module-card {
    padding: 1.5rem 1rem;
    min-height: 130px;
  }

  .module-icon {
    font-size: 2rem;
  }

  .module-card h3 {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .header-section h1 {
    font-size: 1.75rem;
  }

  .modules-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .module-card {
    padding: 1rem 0.75rem;
    min-height: 120px;
    gap: 0.75rem;
  }

  .module-icon {
    font-size: 1.75rem;
  }

  .module-card h3 {
    font-size: 0.85rem;
    line-height: 1.2;
  }
}

/* Touch-friendly interactions */
@media (hover: none) and (pointer: coarse) {
  .module-card {
    min-height: 120px;
    padding: 1.25rem 1rem;
  }

  .module-card:active {
    background-color: #f8f9fa;
  }
}

/* Very small screens */
@media (max-width: 360px) {
  .modules-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .module-card {
    padding: 0.75rem 0.5rem;
    min-height: 100px;
  }

  .module-icon {
    font-size: 1.5rem;
  }

  .module-card h3 {
    font-size: 0.8rem;
  }
}

/* Loading and interaction states */
.module-card:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.module-card:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
</style>
