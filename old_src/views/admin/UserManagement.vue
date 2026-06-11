<template>
  <div class="user-management">
    <div class="page-header">
      <BackButton to="/dashboard" />
      <div class="header-content">
        <h1>👥 Gestão de Utilizadores</h1>
        <p>Gerir utilizadores e permissões do sistema</p>
      </div>
    </div>

    <!-- Admin Check -->
    <div
      v-if="!isAdmin"
      class="access-denied"
    >
      <div class="access-denied-card">
        <div class="access-denied-icon">
          🚫
        </div>
        <h2>Acesso Negado</h2>
        <p>Não tem permissões para aceder a esta página.</p>
        <router-link
          to="/dashboard"
          class="btn btn-primary"
        >
          Voltar ao Dashboard
        </router-link>
      </div>
    </div>

    <div
      v-else
      class="admin-content"
    >
      <!-- Actions Bar -->
      <div class="actions-bar">
        <button
          class="btn btn-primary"
          @click="showInviteModal = true"
        >
          ➕ Convidar Utilizador
        </button>
        <button
          class="btn btn-secondary"
          :disabled="loading"
          @click="refreshUsers"
        >
          🔄 Actualizar Lista
        </button>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="loading-state"
      >
        <p>A carregar utilizadores...</p>
      </div>

      <!-- Error State -->
      <div
        v-if="error"
        class="error-alert"
      >
        <p>{{ error }}</p>
        <button
          class="close-btn"
          @click="clearError"
        >
          ×
        </button>
      </div>

      <!-- Users List -->
      <div
        v-if="!loading"
        class="users-grid"
      >
        <div
          v-for="user in users"
          :key="user.id"
          class="user-card"
        >
          <div class="user-avatar">
            <img
              v-if="user.imageUrl"
              :src="user.imageUrl"
              :alt="user.firstName"
            >
            <div
              v-else
              class="avatar-placeholder"
            >
              {{ (user.firstName?.[0] || '') + (user.lastName?.[0] || '') }}
            </div>
          </div>

          <div class="user-info">
            <h3>{{ user.firstName }} {{ user.lastName }}</h3>
            <p class="user-email">
              {{ user.emailAddresses?.[0]?.emailAddress }}
            </p>
            <div class="user-meta">
              <span
                class="user-role"
                :class="getUserRole(user)"
              >
                {{ getUserRole(user) === 'admin' ? '👑 Admin' : '👤 Utilizador' }}
              </span>
              <span
                class="user-status"
                :class="user.banned ? 'banned' : 'active'"
              >
                {{ user.banned ? '🚫 Banido' : '✅ Activo' }}
              </span>
            </div>
            <p class="user-created">
              Registado: {{ formatDate(user.createdAt) }}
            </p>
          </div>

          <div class="user-actions">
            <button
              v-if="user.id !== currentUser?.id"
              class="btn btn-sm btn-outline"
              :disabled="updatingUser === user.id"
              @click="toggleUserRole(user)"
            >
              {{ getUserRole(user) === 'admin' ? '👤 Remover Admin' : '👑 Tornar Admin' }}
            </button>

            <button
              v-if="user.id !== currentUser?.id"
              class="btn btn-sm"
              :class="user.banned ? 'btn-success' : 'btn-danger'"
              :disabled="updatingUser === user.id"
              @click="toggleUserBan(user)"
            >
              {{ user.banned ? '✅ Desbanir' : '🚫 Banir' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!loading && users.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">
          👥
        </div>
        <h3>Nenhum utilizador encontrado</h3>
        <p>Comece por convidar utilizadores para o sistema.</p>
      </div>
    </div>

    <!-- Invite User Modal -->
    <div
      v-if="showInviteModal"
      class="modal-overlay"
      @click="closeInviteModal"
    >
      <div
        class="modal-card"
        @click.stop
      >
        <div class="modal-header">
          <h2>Convidar Utilizador</h2>
          <button
            class="close-btn"
            @click="closeInviteModal"
          >
            ×
          </button>
        </div>

        <form
          class="invite-form"
          @submit.prevent="sendInvite"
        >
          <div class="form-group">
            <label for="inviteEmail">Email *</label>
            <input
              id="inviteEmail"
              v-model="inviteForm.email"
              type="email"
              class="form-control"
              placeholder="utilizador@exemplo.com"
              required
            >
          </div>

          <div class="form-group">
            <label for="inviteRole">Papel</label>
            <select
              id="inviteRole"
              v-model="inviteForm.role"
              class="form-control"
            >
              <option value="user">
                👤 Utilizador
              </option>
              <option value="admin">
                👑 Administrador
              </option>
            </select>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="btn btn-cancel"
              @click="closeInviteModal"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="sendingInvite"
            >
              {{ sendingInvite ? 'A enviar...' : '📧 Enviar Convite' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUser, useClerk } from '@clerk/vue';
import BackButton from '@/components/BackButton.vue';

// Clerk composables
const { user: currentUser, isLoaded } = useUser();
const clerk = useClerk();

// State
const users = ref([]);
const loading = ref(false);
const error = ref(null);
const updatingUser = ref(null);
const showInviteModal = ref(false);
const sendingInvite = ref(false);

// Form data
const inviteForm = ref({
  email: '',
  role: 'user',
});

// Check if current user is admin
const isAdmin = computed(() => {
  if (!isLoaded.value || !currentUser.value) return false;
  return currentUser.value.publicMetadata?.role === 'admin';
});

// Methods
const refreshUsers = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Note: In a real implementation, you would call your backend API
    // that uses Clerk's Backend API to fetch users
    const response = await fetch('/api/admin/users', {
      headers: {
        Authorization: `Bearer ${await clerk.value.session?.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const data = await response.json();
    users.value = data.users || [];
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching users:', err);
  } finally {
    loading.value = false;
  }
};

const getUserRole = user => {
  return user.publicMetadata?.role === 'admin' ? 'admin' : 'user';
};

const toggleUserRole = async user => {
  updatingUser.value = user.id;
  const newRole = getUserRole(user) === 'admin' ? 'user' : 'admin';

  try {
    const response = await fetch(`/api/admin/users/${user.id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await clerk.value.session?.getToken()}`,
      },
      body: JSON.stringify({ role: newRole }),
    });

    if (!response.ok) {
      throw new Error('Failed to update user role');
    }

    // Update local state
    const userIndex = users.value.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users.value[userIndex].publicMetadata = {
        ...users.value[userIndex].publicMetadata,
        role: newRole,
      };
    }
  } catch (err) {
    error.value = err.message;
    console.error('Error updating user role:', err);
  } finally {
    updatingUser.value = null;
  }
};

const toggleUserBan = async user => {
  updatingUser.value = user.id;

  try {
    const action = user.banned ? 'unban' : 'ban';
    const response = await fetch(`/api/admin/users/${user.id}/${action}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${await clerk.value.session?.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to ${action} user`);
    }

    // Update local state
    const userIndex = users.value.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users.value[userIndex].banned = !user.banned;
    }
  } catch (err) {
    error.value = err.message;
    console.error('Error updating user ban status:', err);
  } finally {
    updatingUser.value = null;
  }
};

const sendInvite = async () => {
  if (!inviteForm.value.email) return;

  sendingInvite.value = true;

  try {
    const response = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await clerk.value.session?.getToken()}`,
      },
      body: JSON.stringify({
        email: inviteForm.value.email,
        role: inviteForm.value.role,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send invitation');
    }

    // Reset form and close modal
    inviteForm.value = { email: '', role: 'user' };
    showInviteModal.value = false;

    // Refresh users list
    await refreshUsers();
  } catch (err) {
    error.value = err.message;
    console.error('Error sending invitation:', err);
  } finally {
    sendingInvite.value = false;
  }
};

const closeInviteModal = () => {
  showInviteModal.value = false;
  inviteForm.value = { email: '', role: 'user' };
};

const clearError = () => {
  error.value = null;
};

const formatDate = dateString => {
  return new Date(dateString).toLocaleDateString('pt-PT');
};

// Lifecycle
onMounted(() => {
  if (isAdmin.value) {
    refreshUsers();
  }
});
</script>

<style scoped>
.user-management {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header-content h1 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-dark);
  font-size: 1.8rem;
}

.header-content p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.access-denied {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.access-denied-card {
  text-align: center;
  background: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.access-denied-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.access-denied-card h2 {
  color: var(--danger);
  margin-bottom: 1rem;
}

.actions-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-avatar {
  display: flex;
  justify-content: center;
}

.user-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
}

.user-info {
  text-align: center;
}

.user-info h3 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-dark);
}

.user-email {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.user-meta {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.user-role,
.user-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.user-role.admin {
  background: #ffeaa7;
  color: #d63031;
}

.user-role.user {
  background: #dfe6e9;
  color: #2d3436;
}

.user-status.active {
  background: #d1f2eb;
  color: #00b894;
}

.user-status.banned {
  background: #fadbd8;
  color: #e74c3c;
}

.user-created {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover {
  background: var(--primary-color);
  color: white;
}

.btn-success {
  background: #00b894;
  color: white;
}

.btn-success:hover {
  background: #00a085;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;
  color: var(--primary-dark);
}

.invite-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text-color);
}

.form-control {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 1rem;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(117, 174, 147, 0.1);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-cancel {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.btn-cancel:hover {
  background: var(--background);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.error-alert {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .users-grid {
    grid-template-columns: 1fr;
  }

  .actions-bar {
    flex-direction: column;
  }

  .user-meta {
    flex-direction: column;
    align-items: center;
  }

  .modal-card {
    margin: 0.5rem;
    padding: 1.5rem;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
