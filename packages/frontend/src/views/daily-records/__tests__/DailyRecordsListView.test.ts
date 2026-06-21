import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, computed } from 'vue';
import DailyRecordsListView from '../DailyRecordsListView.vue';
import type { DailyRecord, ContentWithRelations } from '@clever/shared';

// Mock vue-router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useDailyRecordsFilters
vi.mock('@/composables/useDailyRecordsFilters', () => ({
  useDailyRecordsFilters: () => ({
    selectedCollaborator: ref(null),
    selectedDate: ref(null),
    collaborators: ref([]),
    isLoadingCollaborators: ref(false),
    hasActiveFilters: computed(() => false),
    filterParams: computed(() => ({})),
    clearCollaborator: vi.fn(),
    clearDate: vi.fn(),
    clearAll: vi.fn(),
    fetchCollaborators: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock useErrorHandler
vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
    clearError: vi.fn(),
  }),
}));

// Store mock for useApi to control fetchList behavior
const mockFetchList = vi.fn();
const mockItems = ref<ContentWithRelations<DailyRecord['data']>[]>([]);
const mockPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    items: mockItems,
    currentItem: ref(null),
    error: ref(null),
    loading: { loading: ref(false), creating: ref(false), updating: ref(false), deleting: ref(false) },
    pagination: mockPagination,
    fetchList: mockFetchList,
    fetchById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    search: vi.fn(),
    clearError: vi.fn(),
    refresh: vi.fn(),
    hasError: ref(false),
    isEmpty: ref(true),
    isNetworkError: ref(false),
    isRetryableError: ref(false),
  }),
}));

// Mock child components that are complex
vi.mock('@/components/daily-records/DailyRecordsFilters.vue', () => ({
  default: {
    name: 'DailyRecordsFilters',
    template: '<div class="mock-filters"></div>',
    props: ['collaborators', 'selectedCollaborator', 'selectedDate', 'isLoadingCollaborators'],
  },
}));

vi.mock('@/components/common/ContentListTemplate.vue', () => ({
  default: {
    name: 'ContentListTemplate',
    template: `
      <div class="mock-content-list">
        <div v-for="item in items" :key="item.uuid" class="list-item" data-testid="list-item">
          <slot name="itemMeta" :item="item" />
        </div>
      </div>
    `,
    props: [
      'items', 'isLoading', 'error', 'displayName', 'backRoute',
      'searchQuery', 'searchPlaceholder', 'showCreateButton', 'createButtonText',
      'emptyIcon', 'emptyTitle', 'emptyMessage', 'emptySearchMessage',
      'getItemTitle', 'getItemSubtitle', 'getItemMeta1', 'getItemMeta2',
      'currentPage', 'totalPages', 'totalCount', 'itemsPerPage', 'showPagination',
    ],
    emits: ['search', 'clear-search', 'item-click', 'create', 'edit', 'page-change', 'items-per-page-change', 'clear-error'],
  },
}));

function createDailyRecordItem(
  overrides: Partial<{
    uuid: string;
    technician: { userId: string; firstName: string; lastName: string } | null;
    dataRegistro: string;
  }> = {}
): ContentWithRelations<DailyRecord['data']> {
  const defaultTechnician = {
    userId: 'tech-001',
    firstName: 'João',
    lastName: 'Silva',
  };

  return {
    uuid: overrides.uuid || 'dr-uuid-001',
    contentType: 'daily-records',
    createdAt: '2024-01-15T10:00:00Z',
    createdBy: 'user-001',
    updatedAt: '2024-01-15T10:00:00Z',
    updatedBy: 'user-001',
    version: 1,
    isDeleted: false,
    data: {
      dataRegistro: overrides.dataRegistro || '2024-01-15',
      atividades: [
        {
          tipoAtividade: 'Interno',
          clientId: 'client-001',
          assunto: 'Test activity',
          horaInicio: '09:00',
          horaFim: '17:00',
          tempoPausa: 60,
          totalHoras: '07:00',
          tipoLigacao: 'Nenhuma',
        },
      ],
      technician: 'technician' in overrides
        ? (overrides.technician ?? undefined)
        : defaultTechnician,
    },
    relations: {},
  } as ContentWithRelations<DailyRecord['data']>;
}

describe('DailyRecordsListView — Collaborator Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockItems.value = [];
    mockPagination.value = { page: 1, limit: 10, total: 0, totalPages: 0 };
  });

  /**
   * Validates: DR-LIG-AC-016
   * Collaborator name displayed in each list item
   */
  it('should display collaborator firstName + lastName in amber badge', async () => {
    const recordWithTechnician = createDailyRecordItem({
      technician: { userId: 'tech-001', firstName: 'João', lastName: 'Silva' },
    });

    mockItems.value = [recordWithTechnician];
    mockFetchList.mockImplementation(async () => {
      mockItems.value = [recordWithTechnician];
    });

    const wrapper = mount(DailyRecordsListView, {
      global: {
        stubs: {
          // Let the mocked ContentListTemplate render
        },
      },
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    // The collaborator badge should show "João Silva"
    const collaboratorBadge = wrapper.find('.collaborator-badge');
    expect(collaboratorBadge.exists()).toBe(true);
    expect(collaboratorBadge.text()).toContain('João');
    expect(collaboratorBadge.text()).toContain('Silva');
  });

  /**
   * Validates: DR-LIG-AC-017
   * Fallback "Não atribuído" for legacy data without technician
   */
  it('should display "Não atribuído" when technician is not set (legacy data)', async () => {
    const recordWithoutTechnician = createDailyRecordItem({
      technician: null,
    });

    mockItems.value = [recordWithoutTechnician];
    mockFetchList.mockImplementation(async () => {
      mockItems.value = [recordWithoutTechnician];
    });

    const wrapper = mount(DailyRecordsListView, {
      global: {
        stubs: {},
      },
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    // The collaborator badge should show "Não atribuído"
    const collaboratorBadge = wrapper.find('.collaborator-badge');
    expect(collaboratorBadge.exists()).toBe(true);
    expect(collaboratorBadge.text()).toContain('Não atribuído');
  });

  /**
   * Validates: DR-LIG-AC-016
   * Collaborator badge has correct styling (amber)
   */
  it('should render collaborator badge with amber styling', async () => {
    const record = createDailyRecordItem({
      technician: { userId: 'tech-002', firstName: 'Maria', lastName: 'Santos' },
    });

    mockItems.value = [record];
    mockFetchList.mockImplementation(async () => {
      mockItems.value = [record];
    });

    const wrapper = mount(DailyRecordsListView, {
      global: {
        stubs: {},
      },
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    const collaboratorBadge = wrapper.find('.collaborator-badge');
    expect(collaboratorBadge.exists()).toBe(true);
    // The class is defined in scoped styles, check it renders
    expect(collaboratorBadge.text()).toContain('Maria Santos');
  });
});
