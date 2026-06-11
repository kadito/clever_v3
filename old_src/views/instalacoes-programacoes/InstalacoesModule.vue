<template>
  <div class="instalacoes-module">
    <div class="module-header">
      <BackButton
        to="/"
        variant="inline"
      />
      <div class="module-info">
        <div class="module-icon">
          💻
        </div>
        <div class="module-content">
          <h1>Instalações e Programações</h1>
          <p class="module-description">
            Gestão de instalações de equipamentos e programações de sistemas
          </p>
        </div>
      </div>
    </div>

    <div class="module-actions">
      <button
        class="action-btn primary"
        @click="navigateToList"
      >
        <span class="action-icon">📋</span>
        <span class="action-label">CONSULTAR</span>
        <span class="action-description">Ver lista de instalações e programações</span>
      </button>

      <button
        class="action-btn secondary"
        @click="navigateToCreate"
      >
        <span class="action-icon">➕</span>
        <span class="action-label">NOVA INSTALAÇÃO</span>
        <span class="action-description">Criar uma nova instalação e programação</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import BackButton from '@/components/BackButton.vue';

const router = useRouter();

const navigateToList = () => {
  router.push('/instalacoes-programacoes/list');
};

const navigateToCreate = () => {
  router.push('/instalacoes-programacoes/new?from=module');
};
</script>

<style scoped>
.instalacoes-module {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.module-header {
  margin-bottom: 2rem;
}

.module-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.module-icon {
  font-size: 3rem;
  background: #f8f9fa;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e9ecef;
}

.module-content h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 2rem;
}

.module-description {
  margin: 0;
  color: #6c757d;
  font-size: 1rem;
}

.module-actions {
  display: grid;
  gap: 1rem;
  max-width: 500px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: none;
  border-radius: 12px;
  background: white;
  border: 2px solid #e9ecef;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
  border-color: var(--primary-color);
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, var(--primary-hover) 0%, var(--primary-dark) 100%);
  border-color: var(--primary-hover);
}

.action-btn.secondary {
  background: white;
  color: #2c3e50;
}

.action-btn.secondary:hover {
  background: #f8f9fa;
}

.action-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.action-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.action-label {
  font-weight: 600;
  font-size: 1rem;
}

.action-description {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Mobile styles */
@media (max-width: 768px) {
  .instalacoes-module {
    padding: 1rem 0.5rem;
  }

  .module-info {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .module-content h1 {
    font-size: 1.75rem;
  }

  .action-btn {
    padding: 1.25rem;
    gap: 0.75rem;
  }

  .action-icon {
    font-size: 1.25rem;
  }

  .action-label {
    font-size: 0.9rem;
  }

  .action-description {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .module-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .module-content h1 {
    font-size: 1.5rem;
  }

  .action-btn {
    padding: 1rem;
  }
}
</style>
