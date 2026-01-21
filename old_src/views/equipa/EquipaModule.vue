<template>
  <div class="equipa-module">
    <div class="module-header">
      <BackButton to="/" variant="inline" />
      <div class="module-info">
        <div class="module-icon">👷</div>
        <div class="module-content">
          <h1>Equipa</h1>
          <p class="module-description">Gestão da equipa</p>
        </div>
      </div>
    </div>

    <div class="module-actions">
      <button @click="navigateToList" class="action-btn primary">
        <span class="action-icon">📋</span>
        <span class="action-label">CONSULTAR</span>
        <span class="action-description">Ver lista de colaboradores</span>
      </button>

      <button @click="navigateToCreate" class="action-btn secondary">
        <span class="action-icon">➕</span>
        <span class="action-label">NOVO COLABORADOR</span>
        <span class="action-description">Adicionar um novo colaborador</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import BackButton from '@/components/BackButton.vue';

const router = useRouter();

const navigateToList = () => {
  router.push('/equipa/list');
};

const navigateToCreate = () => {
  router.push('/equipa/new');
};
</script>

<style scoped>
.equipa-module {
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  color: white;
}

.action-btn.secondary {
  background: white;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.action-icon {
  font-size: 1.5rem;
}

.action-label {
  font-weight: 600;
  font-size: 1rem;
}

.action-description {
  font-size: 0.85rem;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .equipa-module {
    padding: 0.5rem;
  }

  .module-info {
    flex-direction: column;
    text-align: center;
  }

  .module-content h1 {
    font-size: 1.5rem;
  }

  .action-btn {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }

  .action-label {
    font-size: 0.9rem;
  }

  .action-description {
    font-size: 0.8rem;
  }
}
</style>
