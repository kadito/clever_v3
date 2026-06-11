<template>
  <div class="flex flex-col sm:flex-row gap-3 w-full">
    <!-- Collaborator filter -->
    <div class="flex flex-col gap-1 flex-1">
      <label
        for="filter-collaborator"
        class="text-sm font-medium text-gray-700"
      >
        Colaborador
      </label>
      <select
        id="filter-collaborator"
        :value="selectedCollaborator ?? ''"
        :disabled="isLoadingCollaborators"
        :class="[
          'block w-full border border-gray-300 rounded-lg py-3 px-4 text-base',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'min-h-[44px] appearance-none bg-white',
          selectedCollaborator ? 'text-gray-700' : 'text-gray-400',
          isLoadingCollaborators ? 'opacity-60 cursor-not-allowed' : '',
        ]"
        @change="onCollaboratorChange"
      >
        <option
          value=""
          disabled
          hidden
        >
          {{ isLoadingCollaborators ? 'A carregar...' : 'Todos os colaboradores' }}
        </option>
        <template v-if="!isLoadingCollaborators">
          <option
            v-for="collaborator in collaborators"
            :key="collaborator.userId"
            :value="collaborator.userId"
            class="text-gray-700"
          >
            {{ collaborator.name }}
          </option>
          <option
            v-if="selectedCollaborator"
            value=""
          >
            Limpar filtro
          </option>
        </template>
      </select>
    </div>

    <!-- Date filter -->
    <div class="flex flex-col gap-1 flex-1">
      <label
        for="filter-date"
        class="text-sm font-medium text-gray-700"
      >
        Data
      </label>
      <input
        id="filter-date"
        type="date"
        :value="selectedDate ?? ''"
        :class="[
          'block w-full border border-gray-300 rounded-lg py-3 px-4 text-base',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'min-h-[44px] bg-white',
          selectedDate ? 'text-gray-700' : 'text-gray-400',
        ]"
        @input="onDateChange"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
interface Collaborator {
  userId: string;
  name: string;
}

withDefaults(
  defineProps<{
    collaborators: Collaborator[];
    selectedCollaborator: string | null;
    selectedDate: string | null;
    isLoadingCollaborators?: boolean;
  }>(),
  {
    isLoadingCollaborators: false,
  }
);

const emit = defineEmits<{
  'update:selectedCollaborator': [value: string | null];
  'update:selectedDate': [value: string | null];
}>();

function onCollaboratorChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  emit('update:selectedCollaborator', value === '' ? null : value);
}

function onDateChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  emit('update:selectedDate', value === '' ? null : value);
}
</script>
