<template>
  <div class="agendamentos-module">
    <div class="module-header">
      <BackButton
        to="/"
        variant="inline"
      />
      <div class="module-info">
        <div class="module-icon">
          📅
        </div>
        <div class="module-content">
          <h1>Agendamentos</h1>
          <p class="module-description">
            Gestão de agendamentos e marcações
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
        <span class="action-description">Ver lista de agendamentos</span>
      </button>

      <button
        class="action-btn secondary"
        @click="navigateToCreate"
      >
        <span class="action-icon">➡</span>
        <span class="action-label">NOVO AGENDAMENTO</span>
        <span class="action-description">Criar um novo agendamento</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAgendamentosStore } from '@/stores/agendamentos.js';
import { storeToRefs } from 'pinia';
import BackButton from '@/components/BackButton.vue';
import YearSelector from '@/components/YearSelector.vue';

// Router
const router = useRouter();

const navigateToList = () => {
  router.push('/agendamentos/list');
};

const navigateToCreate = () => {
  router.push('/agendamentos/new?from=module');
};

// Store
const agendamentosStore = useAgendamentosStore();
</script>

<style scoped>
.agendamentos-module {
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

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.stat-card p {
  color: #666;
  margin: 0;
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

.loading-container {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-container p {
  color: #dc3545;
  margin-bottom: 1rem;
}

.search-results,
.agendamentos-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.results-header,
.content-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.results-header h3,
.content-header h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.results-header p,
.content-header p {
  color: #666;
  margin: 0;
}

.no-results,
.no-agendamentos {
  text-align: center;
  padding: 3rem;
}

.empty-state h3 {
  color: #666;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #999;
  margin-bottom: 2rem;
}

.agendamentos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.agendamento-card {
  background: #f9f9f9;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.agendamento-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-color);
}

.agendamento-card.completed {
  border-color: #28a745;
  background: #f8fff9;
}

.agendamento-card.postponed {
  border-color: #ffc107;
  background: #fffbf0;
}

.agendamento-card.overdue {
  border-color: #dc3545;
  background: #fff5f5;
}

.agendamento-card.due-today {
  border-color: #17a2b8;
  background: #f0faff;
}

.agendamento-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.agendamento-header h4 {
  color: #2c3e50;
  margin: 0;
  flex: 1;
  margin-right: 1rem;
}

.agendamento-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.postponed {
  background: #fff3cd;
  color: #856404;
}

.status-badge.overdue {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.due-today {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.pending {
  background: #e2e3e5;
  color: #383d41;
}

.agendamento-info p {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.year-info {
  font-style: italic;
  color: #999 !important;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn.primary {
  background: var(--primary-color);
  color: white;
}

.btn.primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.secondary:hover {
  background: #5a6268;
}

/* Mobile styles */
@media (max-width: 768px) {
  .agendamentos-module {
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
