<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="max-w-2xl mx-auto">
      <!-- Page header -->
      <header class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="flex-1">
            <!-- Breadcrumb -->
            <nav class="mb-3">
              <ol class="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <router-link
                    :to="{ name: `${contentType}-list` }"
                    class="hover:text-primary-600 transition-colors duration-200"
                  >
                    {{ displayName }}
                  </router-link>
                </li>
                <li>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </li>
                <li v-if="isEditMode">
                  <router-link
                    :to="{ name: `${contentType}-detail`, params: { id: route.params.id } }"
                    class="hover:text-primary-600 transition-colors duration-200"
                  >
                    Detalhes
                  </router-link>
                </li>
                <li v-if="isEditMode">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </li>
                <li class="text-gray-900 font-medium">
                  {{ isEditMode ? 'Editar' : 'Criar' }}
                </li>
              </ol>
            </nav>

            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {{ isEditMode ? 'Editar' : 'Criar' }} {{ displayName.slice(0, -1) }}
            </h1>
            <p class="text-gray-600">
              {{
                isEditMode
                  ? `Modifique os campos necessários para o ${displayName.toLowerCase().slice(0, -1)} #${route.params.id}`
                  : `Preencha os campos obrigatórios para criar um novo ${displayName.toLowerCase().slice(0, -1)}`
              }}
            </p>
          </div>
        </div>
      </header>

      <!-- Loading state -->
      <div v-if="isLoading" class="animate-pulse">
        <div class="bg-white rounded-lg border border-gray-200 p-6">
          <div class="space-y-6">
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              <div class="h-10 bg-gray-200 rounded"></div>
            </div>
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
              <div class="h-24 bg-gray-200 rounded"></div>
            </div>
            <div class="flex justify-end space-x-3">
              <div class="h-10 bg-gray-200 rounded w-20"></div>
              <div class="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div v-else class="bg-white rounded-lg border border-gray-200 p-6">
        <ContentForm
          :content-type="contentType"
          :initial-data="formData"
          :is-edit-mode="isEditMode"
          :is-submitting="isSubmitting"
          @submit="handleSubmit"
          @cancel="handleCancel"
        >
          <template #fields>
            <!-- Dynamic fields based on content type -->
            <div class="space-y-6">
              <!-- Common fields for all content types -->
              <div class="form-group">
                <label class="form-label" for="name"> Nome * </label>
                <input
                  id="name"
                  v-model="formData.name"
                  type="text"
                  class="form-input"
                  :class="{ 'border-red-500': errors.name }"
                  placeholder="Digite o nome"
                  required
                />
                <p v-if="errors.name" class="form-error">
                  {{ errors.name }}
                </p>
              </div>

              <div class="form-group">
                <label class="form-label" for="description"> Descrição </label>
                <textarea
                  id="description"
                  v-model="formData.description"
                  class="form-input"
                  :class="{ 'border-red-500': errors.description }"
                  rows="3"
                  placeholder="Digite uma descrição (opcional)"
                ></textarea>
                <p v-if="errors.description" class="form-error">
                  {{ errors.description }}
                </p>
              </div>

              <!-- Content type specific fields -->
              <div v-if="contentType === 'clientes'" class="space-y-6">
                <div class="form-group">
                  <label class="form-label" for="email"> Email </label>
                  <input
                    id="email"
                    v-model="formData.email"
                    type="email"
                    class="form-input"
                    :class="{ 'border-red-500': errors.email }"
                    placeholder="cliente@exemplo.com"
                  />
                  <p v-if="errors.email" class="form-error">
                    {{ errors.email }}
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label" for="phone"> Telefone </label>
                  <input
                    id="phone"
                    v-model="formData.phone"
                    type="tel"
                    class="form-input"
                    placeholder="+351 123 456 789"
                  />
                </div>
              </div>

              <div v-else-if="contentType === 'contratos'" class="space-y-6">
                <div class="form-group">
                  <label class="form-label" for="clientId"> Cliente * </label>
                  <select
                    id="clientId"
                    v-model="formData.clientId"
                    class="form-input"
                    :class="{ 'border-red-500': errors.clientId }"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    <option value="1">Cliente de Exemplo 1</option>
                    <option value="2">Cliente de Exemplo 2</option>
                  </select>
                  <p v-if="errors.clientId" class="form-error">
                    {{ errors.clientId }}
                  </p>
                </div>

                <div class="form-group">
                  <label class="form-label" for="value"> Valor (€) </label>
                  <input
                    id="value"
                    v-model="formData.value"
                    type="number"
                    step="0.01"
                    min="0"
                    class="form-input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <!-- Status field for all content types -->
              <div class="form-group">
                <label class="form-label" for="status"> Estado </label>
                <select id="status" v-model="formData.status" class="form-input">
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
            </div>
          </template>
        </ContentForm>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getContentTypeDisplayName, getContentTypeIcon } from '../../router';
import ContentForm from '../../components/forms/ContentForm.vue';

const route = useRoute();
const router = useRouter();

// Reactive data
const isLoading = ref(false);
const isSubmitting = ref(false);
const errors = ref<Record<string, string>>({});

// Form data - reactive to allow for dynamic fields
const formData = reactive({
  name: '',
  description: '',
  email: '',
  phone: '',
  clientId: '',
  value: '',
  status: 'active',
});

// Computed properties
const contentType = computed(() => route.meta.contentType as string);
const displayName = computed(() => getContentTypeDisplayName(contentType.value));
const contentIcon = computed(() => getContentTypeIcon(contentType.value));
const isEditMode = computed(() => route.meta.mode === 'edit');

// Methods
const loadData = async () => {
  if (!isEditMode.value) return;

  isLoading.value = true;
  try {
    // Simulate API call to load existing data
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock data for edit mode
    Object.assign(formData, {
      name: `${displayName.value.slice(0, -1)} de Exemplo`,
      description: 'Esta é uma descrição de exemplo para demonstrar o modo de edição.',
      email: 'exemplo@cliente.com',
      phone: '+351 123 456 789',
      clientId: '1',
      value: '1500.00',
      status: 'active',
    });

    // API call will be implemented in subsequent tasks
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleSubmit = async (data: Record<string, any>) => {
  isSubmitting.value = true;
  errors.value = {};

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Navigate back to list or detail view
    if (isEditMode.value) {
      router.push({ name: `${contentType.value}-detail`, params: { id: route.params.id } });
    } else {
      router.push({ name: `${contentType.value}-list` });
    }

    // API call will be implemented in subsequent tasks
  } catch (error) {
    console.error('Error submitting form:', error);
    errors.value.general = 'Ocorreu um erro ao guardar. Tente novamente.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  if (isEditMode.value) {
    router.push({ name: `${contentType.value}-detail`, params: { id: route.params.id } });
  } else {
    router.push({ name: `${contentType.value}-list` });
  }
};

// Lifecycle
onMounted(() => {
  loadData();
});
</script>
