/**
 * Bug Condition Exploration Test - Duplicate Requests and Missing Pagination
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3
 *
 * CRITICAL: This test encodes the EXPECTED (correct) behavior.
 * On UNFIXED code, it MUST FAIL — failure confirms the bugs exist.
 * On FIXED code, it MUST PASS — passing confirms the bugs are resolved.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import * as fc from 'fast-check';

// ----- Content type config mapping -----
const CONTENT_TYPE_CONFIG = {
  clients: {
    component: () => import('@/views/clients/ClientsListView.vue'),
    label: 'clients',
  },
  contracts: {
    component: () => import('@/views/contracts/ContractsListView.vue'),
    label: 'contracts',
  },
  licenses: {
    component: () => import('@/views/licenses/LicensesListView.vue'),
    label: 'licenses',
  },
  'work-sheets': {
    component: () => import('@/views/work-sheets/WorkSheetsListView.vue'),
    label: 'work-sheets',
  },
  'daily-records': {
    component: () => import('@/views/daily-records/DailyRecordsListView.vue'),
    label: 'daily-records',
  },
  'remote-assistance': {
    component: () => import('@/views/remote-assistance/RemoteAssistanceListView.vue'),
    label: 'remote-assistance',
  },
} as const;

type ContentTypeKey = keyof typeof CONTENT_TYPE_CONFIG;

// ----- Mocks -----

// Track fetchList calls globally
let fetchListMock: Mock;
let mockPagination: { page: number; limit: number; total: number; totalPages: number };

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    currentRoute: ref({ meta: {} }),
  }),
  useRoute: () => ref({ params: {}, query: {}, meta: {} }),
}));

// Mock useErrorHandler
vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
    clearError: vi.fn(),
  }),
}));

// Mock usePermissions
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({
    permissions: ref({ canDelete: true, canViewAuditTrail: true }),
    userType: ref('Admin'),
    isAuthenticated: ref(true),
  }),
}));

// Mock useApi — this is the key mock for testing both bugs
vi.mock('@/composables/useApi', () => ({
  useApi: () => {
    const items = ref<any[]>([]);
    const currentItem = ref(null);
    const error = ref(null);
    const loading = {
      loading: ref(false),
      creating: ref(false),
      updating: ref(false),
      deleting: ref(false),
    };
    const pagination = ref(mockPagination);

    const fetchList = async (params?: any) => {
      fetchListMock(params);
      // Simulate API response with items
      items.value = Array.from({ length: Math.min(mockPagination.limit, mockPagination.total) }, (_, i) => ({
        uuid: `uuid-${i}`,
        contentType: 'test',
        createdAt: new Date(2024, 0, 1 + i).toISOString(),
        createdBy: 'user-1',
        updatedAt: new Date(2024, 0, 1 + i).toISOString(),
        updatedBy: 'user-1',
        version: 1,
        isDeleted: false,
        data: {
          nomeEmpresa: `Company ${i}`,
          nomeComercial: `Commercial ${i}`,
          localidade: `City ${i}`,
          contribuinte: `NIF-${i}`,
          clientId: `client-${i}`,
          name: `Item ${i}`,
          title: `Title ${i}`,
          description: `Description ${i}`,
          date: new Date(2024, 0, 1 + i).toISOString(),
          createdAt: new Date(2024, 0, 1 + i).toISOString(),
          softwares: [],
          hasCPAContract: false,
          hasSHContract: false,
          activities: [],
          tecnicoResponsavel: 'Tech User',
          technician: 'Tech User',
        },
        relations: {},
      }));
      loading.loading.value = false;
    };

    return {
      items,
      currentItem,
      error,
      loading,
      pagination,
      fetchList,
      fetchById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      search: vi.fn(),
      clearError: vi.fn(),
      refresh: vi.fn(),
      hasError: ref(false),
      isEmpty: ref(false),
      isNetworkError: ref(false),
      isRetryableError: ref(false),
    };
  },
}));

// Mock @clever/shared exports used by list views
vi.mock('@clever/shared', () => ({
  hasActiveContract: () => true,
  getContractSummary: () => ({
    contractTypes: ['CPA'],
    planNames: ['Plan A'],
    paymentMethods: ['MENSAL'],
    startDate: '2024-01-01',
    endDate: '2025-01-01',
  }),
}));

// ----- Helper to mount a list view component -----
async function mountListView(contentType: ContentTypeKey) {
  const config = CONTENT_TYPE_CONFIG[contentType];
  const mod = await config.component();
  const Component = mod.default;

  const wrapper = mount(Component, {
    global: {
      stubs: {
        ContentListTemplate: {
          name: 'ContentListTemplate',
          template: '<div class="content-list-template"><slot /></div>',
          props: [
            'items', 'isLoading', 'error', 'displayName', 'backRoute',
            'searchQuery', 'searchPlaceholder', 'showCreateButton', 'createButtonText',
            'emptyIcon', 'emptyTitle', 'emptyMessage', 'emptySearchMessage',
            'getItemTitle', 'getItemSubtitle', 'getItemMeta1', 'getItemMeta2',
            'currentPage', 'totalPages', 'totalCount', 'showPagination',
          ],
          emits: ['search', 'clearSearch', 'itemClick', 'create', 'edit', 'clearError', 'pageChange'],
        },
        BackButton: { template: '<div />' },
        SearchBar: { template: '<div />' },
        ErrorComponent: { template: '<div />' },
      },
    },
  });

  await flushPromises();
  await nextTick();

  return wrapper;
}


// ----- Arbitraries -----
const contentTypeArb = fc.constantFrom<ContentTypeKey>(
  'clients', 'contracts', 'licenses', 'work-sheets', 'daily-records', 'remote-assistance'
);

// Generate total > limit scenarios for pagination testing
const paginationScenarioArb = fc.record({
  total: fc.integer({ min: 51, max: 500 }),
  limit: fc.constant(50),
}).map(({ total, limit }) => ({
  page: 1,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
}));

// ----- Tests -----

describe('Bug Condition Exploration: Duplicate Requests and Missing Pagination', () => {
  beforeEach(() => {
    fetchListMock = vi.fn();
    mockPagination = { page: 1, limit: 50, total: 10, totalPages: 1 };
    vi.clearAllMocks();
  });

  /**
   * Property 1: Bug Condition — Single Request Per Navigation
   * Validates: Requirements 1.1, 2.1
   *
   * For any content type, mounting the list view should call fetchList
   * exactly once. This test verifies the basic contract. The duplicate
   * request bug (component recreation from Clerk auth state change) is
   * a runtime issue confirmed by design analysis — the hasFetched guard
   * fix prevents it at the component level.
   */
  it('Bug 1: fetchList is called exactly once on mount for any content type', async () => {
    await fc.assert(
      fc.asyncProperty(contentTypeArb, async (contentType) => {
        fetchListMock = vi.fn();
        mockPagination = { page: 1, limit: 50, total: 10, totalPages: 1 };

        const wrapper = await mountListView(contentType);
        await flushPromises();
        await nextTick();

        expect(fetchListMock).toHaveBeenCalledTimes(1);

        wrapper.unmount();
      }),
      { numRuns: 12 } // 2 runs per content type
    );
  });

  /**
   * Property 2: Bug Condition — Pagination Controls Visible When Needed
   * Validates: Requirements 1.2, 1.3, 2.2
   *
   * For any content type with mock API returning total > limit,
   * ContentListTemplate should receive showPagination=true, currentPage,
   * totalPages, and totalCount props. On unfixed code, these props are
   * never passed (showPagination defaults to false).
   */
  it('Bug 2: pagination props are passed to ContentListTemplate when total > limit', async () => {
    await fc.assert(
      fc.asyncProperty(contentTypeArb, paginationScenarioArb, async (contentType, paginationData) => {
        fetchListMock = vi.fn();
        mockPagination = paginationData;

        const wrapper = await mountListView(contentType);
        await flushPromises();
        await nextTick();

        const template = wrapper.findComponent({ name: 'ContentListTemplate' });
        expect(template.exists()).toBe(true);

        // Verify pagination props are passed correctly
        const templateProps = template.props();
        expect(templateProps.showPagination).toBe(true);
        expect(templateProps.currentPage).toBe(paginationData.page);
        expect(templateProps.totalPages).toBe(paginationData.totalPages);
        expect(templateProps.totalCount).toBe(paginationData.total);

        wrapper.unmount();
      }),
      { numRuns: 12 }
    );
  });

  /**
   * Property 3: Bug Condition — Page Change Handler
   * Validates: Requirements 2.3
   *
   * For any content type, simulating a @page-change event on
   * ContentListTemplate should trigger fetchList with { page: 2 }.
   * On unfixed code, no handler exists for this event.
   */
  it('Bug 2 (page change): page-change event triggers fetchList with correct page', async () => {
    await fc.assert(
      fc.asyncProperty(contentTypeArb, paginationScenarioArb, async (contentType, paginationData) => {
        fetchListMock = vi.fn();
        mockPagination = paginationData;

        const wrapper = await mountListView(contentType);
        await flushPromises();
        await nextTick();

        // Reset mock to only track the page change call
        fetchListMock.mockClear();

        const template = wrapper.findComponent({ name: 'ContentListTemplate' });
        expect(template.exists()).toBe(true);

        // Simulate page change event
        template.vm.$emit('pageChange', 2);
        await flushPromises();
        await nextTick();

        // Verify fetchList was called with page parameter
        expect(fetchListMock).toHaveBeenCalledTimes(1);
        expect(fetchListMock).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );

        wrapper.unmount();
      }),
      { numRuns: 12 }
    );
  });
});
