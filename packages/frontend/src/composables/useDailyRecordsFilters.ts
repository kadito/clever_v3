import { ref, computed, type Ref, type ComputedRef } from 'vue';

interface Collaborator {
  userId: string;
  name: string;
}

interface CollaboratorsResponse {
  success: boolean;
  data: Collaborator[];
  timestamp: string;
}

interface UseDailyRecordsFiltersReturn {
  selectedCollaborator: Ref<string | null>;
  selectedDate: Ref<string | null>;
  collaborators: Ref<Collaborator[]>;
  isLoadingCollaborators: Ref<boolean>;
  hasActiveFilters: ComputedRef<boolean>;
  filterParams: ComputedRef<Record<string, string>>;
  clearCollaborator: () => void;
  clearDate: () => void;
  clearAll: () => void;
  fetchCollaborators: () => Promise<void>;
}

export function useDailyRecordsFilters(): UseDailyRecordsFiltersReturn {
  const selectedCollaborator = ref<string | null>(null);
  const selectedDate = ref<string | null>(null);
  const collaborators = ref<Collaborator[]>([]);
  const isLoadingCollaborators = ref(false);

  const hasActiveFilters = computed(
    (): boolean => selectedCollaborator.value !== null || selectedDate.value !== null
  );

  const filterParams = computed((): Record<string, string> => {
    const params: Record<string, string> = {};
    if (selectedCollaborator.value !== null) {
      params.collaborator = selectedCollaborator.value;
    }
    if (selectedDate.value !== null) {
      params.date = selectedDate.value;
    }
    return params;
  });

  const clearCollaborator = (): void => {
    selectedCollaborator.value = null;
  };

  const clearDate = (): void => {
    selectedDate.value = null;
  };

  const clearAll = (): void => {
    selectedCollaborator.value = null;
    selectedDate.value = null;
  };

  const fetchCollaborators = async (): Promise<void> => {
    isLoadingCollaborators.value = true;

    await fetch('/api/content/daily-records/collaborators')
      .then((response) => response.json() as Promise<CollaboratorsResponse>)
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          collaborators.value = data.data;
        } else {
          collaborators.value = [];
          console.error('Failed to load collaborators:', JSON.stringify(data, null, 2));
        }
      })
      .catch((error: unknown) => {
        collaborators.value = [];
        console.error(
          'Error fetching collaborators:',
          JSON.stringify({ message: error instanceof Error ? error.message : String(error) }, null, 2)
        );
      })
      .finally(() => {
        isLoadingCollaborators.value = false;
      });
  };

  return {
    selectedCollaborator,
    selectedDate,
    collaborators,
    isLoadingCollaborators,
    hasActiveFilters,
    filterParams,
    clearCollaborator,
    clearDate,
    clearAll,
    fetchCollaborators,
  };
}
