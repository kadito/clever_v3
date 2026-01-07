<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Manage your data using Pinia store and Cloudflare Workers API</p>
    </div>
    
    <div class="user-section">
      <h2>User Status</h2>
      <div class="user-card">
        <p><strong>Name:</strong> {{ user.name }}</p>
        <p><strong>Status:</strong> 
          <span :class="{ authenticated: user.isAuthenticated, guest: !user.isAuthenticated }">
            {{ user.isAuthenticated ? 'Authenticated' : 'Guest' }}
          </span>
        </p>
        <button v-if="!user.isAuthenticated" @click="simulateLogin" class="btn primary">
          Simulate Login
        </button>
        <button v-else @click="logout" class="btn secondary">
          Logout
        </button>
      </div>
    </div>
    
    <div class="data-section">
      <div class="section-header">
        <h2>Data Management</h2>
        <button @click="fetchItems" :disabled="loading" class="btn primary">
          {{ loading ? 'Loading...' : 'Refresh Data' }}
        </button>
      </div>
      
      <div v-if="error" class="error-message">
        <p>{{ error }}</p>
        <button @click="clearError" class="btn small">Dismiss</button>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <h3>{{ itemCount }}</h3>
          <p>Total Items</p>
        </div>
        <div class="stat-card">
          <h3>{{ hasItems ? 'Yes' : 'No' }}</h3>
          <p>Has Data</p>
        </div>
      </div>
      
      <div class="add-item-form">
        <h3>Add New Item</h3>
        <form @submit.prevent="handleAddItem">
          <input 
            v-model="newItem.name" 
            type="text" 
            placeholder="Item name" 
            required
            class="form-input"
          >
          <input 
            v-model="newItem.description" 
            type="text" 
            placeholder="Description" 
            required
            class="form-input"
          >
          <button type="submit" :disabled="loading" class="btn primary">
            {{ loading ? 'Adding...' : 'Add Item' }}
          </button>
        </form>
      </div>
      
      <div class="items-list">
        <h3>Items ({{ itemCount }})</h3>
        <div v-if="loading && !hasItems" class="loading">
          Loading items...
        </div>
        <div v-else-if="!hasItems" class="no-items">
          No items found. Click "Refresh Data" to load sample data.
        </div>
        <div v-else class="item-grid">
          <div v-for="item in items" :key="item.id" class="item-card">
            <h4>{{ item.name }}</h4>
            <p>{{ item.description }}</p>
            <small>ID: {{ item.id }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useMainStore } from '@/stores/main.js'
import { storeToRefs } from 'pinia'

// Store
const store = useMainStore()
const { items, loading, error, user, itemCount, hasItems } = storeToRefs(store)
const { fetchItems, addItem, clearError, setUser, logout } = store

// Local reactive state
const newItem = ref({
  name: '',
  description: ''
})

// Methods
const handleAddItem = async () => {
  if (newItem.value.name && newItem.value.description) {
    await addItem(newItem.value)
    newItem.value = { name: '', description: '' }
  }
}

const simulateLogin = () => {
  setUser({
    name: 'John Doe',
    email: 'john@example.com'
  })
}
</script>

<style scoped>
.dashboard {
  max-width: 1000px;
  margin: 0 auto;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: #666;
  font-size: 1.1rem;
}

.user-section, .data-section {
  margin-bottom: 3rem;
}

.user-section h2, .data-section h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.user-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-card p {
  margin-bottom: 0.5rem;
}

.authenticated {
  color: #28a745;
  font-weight: 600;
}

.guest {
  color: #dc3545;
  font-weight: 600;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
  color: #667eea;
  margin-bottom: 0.5rem;
}

.add-item-form {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.add-item-form h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.add-item-form form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
}

/* Mobile-first form layout */
@media (max-width: 768px) {
  .add-item-form form {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.items-list {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.items-list h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.loading, .no-items {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.item-card {
  border: 1px solid #eee;
  padding: 1rem;
  border-radius: 6px;
  background: #f9f9f9;
}

.item-card h4 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.item-card p {
  color: #666;
  margin-bottom: 0.5rem;
}

.item-card small {
  color: #999;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  background: #667eea;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #5a6fd8;
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn.small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

/* Enhanced mobile styles */
@media (max-width: 768px) {
  .dashboard {
    padding: 0;
  }
  
  .dashboard-header {
    margin-bottom: 2rem;
    padding: 0 0.5rem;
  }
  
  .dashboard-header h1 {
    font-size: 2rem;
  }
  
  .dashboard-header p {
    font-size: 1rem;
  }
  
  .user-section, .data-section {
    margin-bottom: 2rem;
  }
  
  .user-card, .add-item-form, .items-list {
    margin: 0 0.5rem;
  }
  
  .stats {
    margin: 0 0.5rem 1.5rem 0.5rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 0 0.5rem;
  }
  
  .item-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .dashboard-header h1 {
    font-size: 1.75rem;
  }
  
  .dashboard-header p {
    font-size: 0.95rem;
  }
  
  .user-card, .add-item-form, .items-list {
    padding: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-card h3 {
    font-size: 1.5rem;
  }
}
</style> 