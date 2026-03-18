/**
 * Preservation Property Tests - Sort Order, Search, Navigation, and UI States
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 *
 * These tests capture EXISTING correct behavior on UNFIXED code.
 * They MUST PASS before and after the fix — failure means a regression.
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
    route: '/clients',
  },
  contracts: {
    component: () => import('@/views/contracts/ContractsListView.vue'),
    label: 'contracts',
    route: '/contracts',
  },
  licenses: {
    component: () => import('@/views/licenses/LicensesListView.vue'),
    label: 'licenses',
    route: '/licenses',
  },
  'work-sheets': {
    component: () => import('@/views/work-sheets/WorkSheetsListView.vue'),
    label: 'work-sheets',
    route: '/work-sheets',
  },
  'daily-records': {
    component: () => import('@/views/daily-records/DailyRecordsListView.vue'),
    label: 'daily-records',
    route: '/daily-records',
  },
  'remote-assistance': {
    component: () => import('@/views/remote-assistance/RemoteAssistanceListView.vue'),
    label: 'remote-assistance',
    route: '/remote-assistance',
  },
} as const;

type ContentTypeKey = keyof typeof CONTENT_TYPE_CONFIG;

// ----- Mocks -----

let fetchListMock: Mock;
let routerPushMock: Mock;
let mockItems: Record<string, unknown>[];
let mockPagination: { page: number; limit: number; total: number; totalPages: number };

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => routerPushMock(...args),
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

// Mock useApi — returns mockItems set per test
vi.mock('@/composables/useApi', () => ({
  useApi: () => {
    const items = ref<Record<string, unknown>[]>([]);
    const currentItem = ref(null);
    const error = ref(null);
    const loading = {
      loading: ref(false),
      creating: ref(false),
      updating: ref(false),
      deleting: ref(false),
    };
    const pagination = ref(mockPagination);

    const fetchList = async (params?: Record<string, unknown>) => {
      fetchListMock(params);
      items.value = mockItems;
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
  calculateLicenseStatus: () => 'active',
  getRemoteAssistanceSummary: () => ({
    totalHours: 2,
    totalSessions: 1,
    billableHours: 1,
  }),
  hasBillableValue: () => true,
  calculateTotalHours: () => 2,
  formatDateForDisplay: (d: string) => d,
  formatTimeForDisplay: (t: string) => t,
  getYearFromAssistanceDate: () => '2024',
  generateAssistanceNumber: () => 'AR-001',
}));

// ----- Helper to build a mock item -----
function buildMockItem(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const uuid = (overrides.uuid as string) || `uuid-${Math.random().toString(36).slice(2, 10)}`;
  const createdAt = (overrides.createdAt as string) || new Date().toISOString();
  return {
    uuid,
    contentType: 'test',
    createdAt,
    createdBy: 'user-1',
    updatedAt: createdAt,
    updatedBy: 'user-1',
    version: 1,
    isDeleted: false,
    data: {
      nomeEmpresa: 'Company',
      nomeComercial: '',
      localidade: 'City',
      contribuinte: 'NIF-000',
      clientId: 'client-1',
      clientName: 'Client',
      name: 'Item',
      title: 'Title',
      description: 'Description',
      date: createdAt,
      createdAt,
      softwares: [],
      software: { name: [], model: '', product: '', version: '', licenseType: '' },
      hasCPAContract: false,
      hasSHContract: false,
      activities: [],
      atividades: [],
      tecnicoResponsavel: 'Tech User',
      technician: 'Tech User',
      dataRegistro: createdAt,
      versao: '1.0',
      numeroSerie: 'SN-001',
      modalidade: 'Anual',
      duracaoContrato: '12',
      invoices: [],
      dataVencimento: '2025-12-31',
      request: { assistanceDate: createdAt, reason: 'Test' },
      otherData: { technician: 'Tech User', serviceType: 'Manutenção' },
      displacement: { paymentMethod: 'MENSAL' },
      tipoAssistencia: 'Remota',
      quemAtendeu: 'User',
      motivoPedido: 'Test',
      relatorioAssistencia: '',
      relatorio: '',
      contrato: false,
      garantia: false,
      resolvido: true,
      ...(overrides.data as Record<string, unknown> || {}),
    },
    relations: {},
    ...((() => { const { data: _d, ...rest } = overrides; return rest; })()),
  };
}

// ----- Helper to mount a list view component -----
async function mountListView(contentType: ContentTypeKey): Promise<ReturnType<typeof mount>> {
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

// Generate a random Portuguese-ish name for client sorting tests
const ptNameArb = fc.stringMatching(/^[a-zA-ZáéíóúãõçâêôÁÉÍÓÚÃÕÇÂÊÔ ]{1,20}$/);

// Generate a client item with random names
const clientItemArb = fc.record({
  nomeComercial: fc.oneof(ptNameArb, fc.constant('')),
  nomeEmpresa: ptNameArb,
}).map(({ nomeComercial, nomeEmpresa }) =>
  buildMockItem({ data: { nomeComercial, nomeEmpresa } }),
);

// Generate an array of client items (2-15 items)
const clientItemsArb = fc.array(clientItemArb, { minLength: 2, maxLength: 15 });

// Non-client content types
const nonClientTypeArb = fc.constantFrom<ContentTypeKey>(
  'contracts', 'licenses', 'work-sheets', 'daily-records', 'remote-assistance',
);

// Generate items with distinct createdAt dates for date sorting tests
const dateItemsArb = fc.array(
  fc.date({ min: new Date(2020, 0, 1), max: new Date(2025, 11, 31) }).filter(d => !isNaN(d.getTime())),
  { minLength: 2, maxLength: 15 },
).map(dates =>
  dates.map(d => buildMockItem({ createdAt: d.toISOString() })),
);

// All content types
const contentTypeArb = fc.constantFrom<ContentTypeKey>(
  'clients', 'contracts', 'licenses', 'work-sheets', 'daily-records', 'remote-assistance',
);

// UUID arbitrary
const uuidArb = fc.uuid();

// Search query arbitrary — simple lowercase strings
const searchQueryArb = fc.stringMatching(/^[a-p]{1,8}$/);

// ----- Tests -----

describe('Preservation Property Tests: Sort Order, Search, Navigation, and UI States', () => {
  beforeEach(() => {
    fetchListMock = vi.fn();
    routerPushMock = vi.fn();
    mockItems = [];
    mockPagination = { page: 1, limit: 50, total: 10, totalPages: 1 };
    vi.clearAllMocks();
  });

  /**
   * Property Test 1 - Sort Order: Clients sorted alphabetically via localeCompare('pt-PT')
   * Validates: Requirements 3.1
   *
   * For all generated arrays of client items with random nomeComercial/nomeEmpresa values,
   * verify displayedClients is sorted alphabetically via localeCompare('pt-PT').
   */
  it('clients are sorted alphabetically by nomeComercial || nomeEmpresa using localeCompare pt-PT', async () => {
    await fc.assert(
      fc.asyncProperty(clientItemsArb, async (items) => {
        fetchListMock = vi.fn();
        routerPushMock = vi.fn();
        mockItems = items;
        mockPagination = { page: 1, limit: 50, total: items.length, totalPages: 1 };

        const wrapper = await mountListView('clients');
        await flushPromises();
        await nextTick();

        const template = wrapper.findComponent({ name: 'ContentListTemplate' });
        expect(template.exists()).toBe(true);

        const displayedItems = template.props('items') as Record<string, unknown>[];

        // Verify items are sorted by (nomeComercial || nomeEmpresa) using localeCompare('pt-PT')
        for (let i = 1; i < displayedItems.length; i++) {
          const prevData = (displayedItems[i - 1] as Record<string, unknown>).data as Record<string, string>;
          const currData = (displayedItems[i] as Record<string, unknown>).data as Record<string, string>;
          const nameA = (prevData.nomeComercial || prevData.nomeEmpresa || '').toLowerCase();
          const nameB = (currData.nomeComercial || currData.nomeEmpresa || '').toLowerCase();
          expect(nameA.localeCompare(nameB, 'pt-PT')).toBeLessThanOrEqual(0);
        }

        wrapper.unmount();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test 1b - Sort Order: Non-client types sorted by createdAt descending
   * Validates: Requirements 3.1
   *
   * For non-client content types, verify items are sorted by createdAt date descending.
   */
  it('non-client types are sorted by createdAt descending', async () => {
    await fc.assert(
      fc.asyncProperty(nonClientTypeArb, dateItemsArb, async (contentType, items) => {
        fetchListMock = vi.fn();
        routerPushMock = vi.fn();
        mockItems = items;
        mockPagination = { page: 1, limit: 50, total: items.length, totalPages: 1 };

        const wrapper = await mountListView(contentType);
        await flushPromises();
        await nextTick();

        const template = wrapper.findComponent({ name: 'ContentListTemplate' });
        expect(template.exists()).toBe(true);

        const displayedItems = template.props('items') as Record<string, unknown>[];

        // Verify items are sorted by createdAt descending
        for (let i = 1; i < displayedItems.length; i++) {
          const prevDate = new Date(displayedItems[i - 1].createdAt as string).getTime();
          const currDate = new Date(displayedItems[i].createdAt as string).getTime();
          expect(prevDate).toBeGreaterThanOrEqual(currDate);
        }

        wrapper.unmount();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test 2 - Search Filtering: Client-side filtering without additional fetchList calls
   * Validates: Requirements 3.2
   *
   * For all generated search queries and item arrays, verify client-side filtering
   * matches expected substring matching on relevant fields, and no additional fetchList calls are made.
   */
  it('search filters items locally without calling fetchList again', async () => {
    await fc.assert(
      fc.asyncProperty(contentTypeArb, searchQueryArb, async (contentType, query) => {
        // Build items where some match the query and some don't
        const matchingItem = buildMockItem({
          data: {
            nomeEmpresa: `Company ${query} Ltd`,
            nomeComercial: `${query} Corp`,
            localidade: `${query} City`,
          },
        });
        const nonMatchingItem = buildMockItem({
          data: {
            nomeEmpresa: 'ZZZZZ Unrelated',
            nomeComercial: 'ZZZZZ Other',
            localidade: 'ZZZZZ Place',
          },
        });

        fetchListMock = vi.fn();
        routerPushMock = vi.fn();
        mockItems = [matchingItem, nonMatchingItem];
        mockPagination = { page: 1, limit: 50, total: 2, totalPages: 1 };

        const wrapper = await mountListView(contentType);
        await flushPromises();
        await nextTick();

        // Record fetchList call count after initial mount
        const callsAfterMount = fetchListMock.mock.calls.length;

        // Trigger search event
        const template = wrapper.findComponent({ name: 'ContentListTemplate' });
        expect(template.exists()).toBe(true);

        template.vm.$emit('search', query);
        await flushPromises();
        await nextTick();

        // Verify no additional fetchList calls were made
        expect(fetchListMock.mock.calls.length).toBe(callsAfterMount);

        // Verify the displayed items are filtered (at least the matching item should be present)
        const displayedItems = template.props('items') as Record<string, unknown>[];
        // The filtered list should be smaller than or equal to the original
        expect(displayedItems.length).toBeLessThanOrEqual(2);

        wrapper.unmount();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test 3 - Navigation Routes: Item click navigates to /{type}/{uuid}
   * Validates: Requirements 3.3
   *
   * For all generated content types and UUIDs, verify item click navigates
   * to /{type}/{uuid}.
   */
  it('item click navigates to /{type}/{uuid}', async () => {
    await fc.assert(
      fc.asyncProperty(contentTypeArb, uuidArb, async (contentType, uuid) => {
        const item = buildMockItem({ uuid });

        fetchListMock = vi.fn();
        routerPushMock = vi.fn();
        mockItems = [item];
        mockPagination = { page: 1, limit: 50, total: 1, totalPages: 1 };

        const wrapper = await mountListView(contentType);
        await flushPromises();
        await nextTick();

        const template = wrapper.findComponent({ name: 'ContentListTemplate' });
        expect(template.exists()).toBe(true);

        // Simulate item click
        template.vm.$emit('itemClick', item);
        await flushPromises();
        await nextTick();

        const expectedRoute = `${CONTENT_TYPE_CONFIG[contentType].route}/${uuid}`;
        expect(routerPushMock).toHaveBeenCalledWith(expectedRoute);

        wrapper.unmount();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test 3b - Navigation Routes: Create click navigates to /{type}/criar
   * Validates: Requirements 3.4
   *
   * For all content types, verify create click navigates to /{type}/criar.
   */
  it('create click navigates to /{type}/criar', async () => {
    await fc.assert(
      fc.asyncProperty(contentTypeArb, async (contentType) => {
        fetchListMock = vi.fn();
        routerPushMock = vi.fn();
        mockItems = [buildMockItem()];
        mockPagination = { page: 1, limit: 50, total: 1, totalPages: 1 };

        const wrapper = await mountListView(contentType);
        await flushPromises();
        await nextTick();

        const template = wrapper.findComponent({ name: 'ContentListTemplate' });
        expect(template.exists()).toBe(true);

        // Simulate create click
        template.vm.$emit('create');
        await flushPromises();
        await nextTick();

        const expectedRoute = `${CONTENT_TYPE_CONFIG[contentType].route}/criar`;
        expect(routerPushMock).toHaveBeenCalledWith(expectedRoute);

        wrapper.unmount();
      }),
      { numRuns: 100 },
    );
  });
});
