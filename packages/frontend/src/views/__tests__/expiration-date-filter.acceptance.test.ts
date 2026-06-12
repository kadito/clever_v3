/**
 * [MA] Acceptance Tests — End-to-end expiration date filter behavior
 *
 * Validates: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07
 *
 * Tests the full integration of useExpirationFilter composable + ExpirationDateFilter
 * component + ListView data flow. Each ListView is mounted with mocked dependencies
 * and the filter dropdown is exercised through the ContentListTemplate #filters slot.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, nextTick } from 'vue';

// ---------------------------------------------------------------------------
// Mocks — must be declared before any imports that use them
// ---------------------------------------------------------------------------

let fetchListMock = vi.fn();
let routerPushMock = vi.fn();
let mockItems: Record<string, unknown>[];
let mockPagination: { page: number; limit: number; total: number; totalPages: number };

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: (...args: unknown[]) => routerPushMock(...args),
    replace: vi.fn(),
    back: vi.fn(),
    currentRoute: ref({ meta: {} }),
  }),
  useRoute: () => ref({ params: {}, query: {}, meta: {} }),
}));

vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({
    permissions: ref({ canDelete: true, canViewAuditTrail: true }),
    userType: ref('Admin'),
    isAuthenticated: ref(true),
  }),
}));

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
}));


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBaseItem(
  contentType: string,
  data: Record<string, unknown>,
  uuid?: string,
): Record<string, unknown> {
  const id = uuid ?? `uuid-${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toISOString();
  return {
    uuid: id,
    contentType,
    createdAt: now,
    createdBy: 'user-1',
    updatedAt: now,
    updatedBy: 'user-1',
    version: 1,
    isDeleted: false,
    data: {
      clientName: 'Test Client',
      clientId: 'client-1',
      name: 'Item',
      title: 'Title',
      // License defaults
      versao: '1.0',
      numeroSerie: 'SN-001',
      modalidade: 'Anual',
      duracaoContrato: '12',
      software: { name: [], model: '', product: '', version: '', licenseType: '' },
      invoices: [],
      // Contract defaults
      hasCPAContract: false,
      hasSHContract: false,
      cpaEquipments: [],
      ...data,
    },
    relations: {},
  };
}

function makeLicense(data: Record<string, unknown>, uuid?: string): Record<string, unknown> {
  return makeBaseItem('licenses', data, uuid);
}

function makeContract(data: Record<string, unknown>, uuid?: string): Record<string, unknown> {
  return makeBaseItem('contracts', data, uuid);
}

/**
 * Mount a ListView and return wrapper + helpers.
 * The real ExpirationDateFilter component is NOT stubbed — it renders inside
 * the ContentListTemplate #filters slot so we can interact with the <select>.
 */
async function mountContractsView() {
  const mod = await import('@/views/contracts/ContractsListView.vue');
  const wrapper = mount(mod.default, {
    global: {
      stubs: {
        BackButton: { template: '<div />' },
        SearchBar: {
          name: 'SearchBar',
          template: '<input data-testid="search" @input="$emit(\'search\', $event.target.value)" />',
          props: ['modelValue', 'placeholder', 'debounceMs'],
          emits: ['update:modelValue', 'search', 'clear'],
        },
        ErrorComponent: { template: '<div />' },
      },
    },
  });
  await flushPromises();
  await nextTick();
  return wrapper;
}

async function mountLicensesView() {
  const mod = await import('@/views/licenses/LicensesListView.vue');
  const wrapper = mount(mod.default, {
    global: {
      stubs: {
        BackButton: { template: '<div />' },
        SearchBar: {
          name: 'SearchBar',
          template: '<input data-testid="search" @input="$emit(\'search\', $event.target.value)" />',
          props: ['modelValue', 'placeholder', 'debounceMs'],
          emits: ['update:modelValue', 'search', 'clear'],
        },
        ErrorComponent: { template: '<div />' },
      },
    },
  });
  await flushPromises();
  await nextTick();
  return wrapper;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('[MA] Acceptance Tests — Expiration Date Filter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15)); // March 15, 2026
    fetchListMock = vi.fn();
    routerPushMock = vi.fn();
    mockItems = [];
    mockPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // MA-01: Dropdown visible on Contratos listing
  // Validates: REQ-01 (CA-01.1)
  // -------------------------------------------------------------------------
  it('MA-01: dropdown is visible on Contratos listing', async () => {
    mockItems = [makeContract({ hasCPAContract: true })];
    mockPagination = { page: 1, limit: 10, total: 1, totalPages: 1 };

    const wrapper = await mountContractsView();
    const select = wrapper.find('select');
    expect(select.exists()).toBe(true);
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-02: Dropdown visible on Licenças listing
  // Validates: REQ-01 (CA-01.2)
  // -------------------------------------------------------------------------
  it('MA-02: dropdown is visible on Licenças listing', async () => {
    mockItems = [makeLicense({ dataVencimento: '2026-06-15' })];
    mockPagination = { page: 1, limit: 10, total: 1, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const select = wrapper.find('select');
    expect(select.exists()).toBe(true);
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-03: Label reads "Data de Expiração"
  // Validates: REQ-01 (CA-01.3)
  // -------------------------------------------------------------------------
  it('MA-03: dropdown label reads "Data de Expiração"', async () => {
    mockItems = [makeLicense({ dataVencimento: '2026-06-15' })];
    mockPagination = { page: 1, limit: 10, total: 1, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const select = wrapper.find('select');
    const placeholder = select.findAll('option')[0];
    expect(placeholder.text()).toBe('Data de Expiração');
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-04: Exactly 12 options
  // Validates: REQ-02 (CA-02.1)
  // -------------------------------------------------------------------------
  it('MA-04: dropdown has exactly 12 month options', async () => {
    mockItems = [makeLicense({ dataVencimento: '2026-06-15' })];
    mockPagination = { page: 1, limit: 10, total: 1, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const select = wrapper.find('select');
    const allOptions = select.findAll('option');
    // 1 placeholder + 12 month options (no "Limpar filtro" when no filter active)
    const monthOptions = allOptions.filter(o => o.attributes('disabled') === undefined && o.attributes('hidden') === undefined);
    expect(monthOptions).toHaveLength(12);
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-05: First option is "Março 2026" (mocked date)
  // Validates: REQ-02 (CA-02.2)
  // -------------------------------------------------------------------------
  it('MA-05: first option is "Março 2026"', async () => {
    mockItems = [makeLicense({ dataVencimento: '2026-06-15' })];
    mockPagination = { page: 1, limit: 10, total: 1, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const select = wrapper.find('select');
    const allOptions = select.findAll('option');
    // First non-placeholder option
    const firstMonth = allOptions[1];
    expect(firstMonth.text()).toBe('Março 2026');
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-06: Last option is "Fevereiro 2027" (mocked date)
  // Validates: REQ-02 (CA-02.3)
  // -------------------------------------------------------------------------
  it('MA-06: last option is "Fevereiro 2027"', async () => {
    mockItems = [makeLicense({ dataVencimento: '2026-06-15' })];
    mockPagination = { page: 1, limit: 10, total: 1, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const select = wrapper.find('select');
    const allOptions = select.findAll('option');
    // Last month option is at index 12 (1 placeholder + 12 months, index 12 = last month)
    const lastMonth = allOptions[12];
    expect(lastMonth.text()).toBe('Fevereiro 2027');
    wrapper.unmount();
  });


  // -------------------------------------------------------------------------
  // MA-07: Options show "Month YYYY" format
  // Validates: REQ-02 (CA-02.4)
  // -------------------------------------------------------------------------
  it('MA-07: all options show "Month YYYY" format', async () => {
    mockItems = [makeLicense({ dataVencimento: '2026-06-15' })];
    mockPagination = { page: 1, limit: 10, total: 1, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const select = wrapper.find('select');
    const allOptions = select.findAll('option');

    // Check month options (skip placeholder at index 0)
    const monthPattern = /^[A-ZÀ-Ú][a-zà-ú]+ \d{4}$/;
    for (let i = 1; i <= 12; i++) {
      expect(allOptions[i].text()).toMatch(monthPattern);
    }
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-08: Selecting "Junho 2026" shows only June items
  // Validates: REQ-03 (CA-03.1)
  // -------------------------------------------------------------------------
  it('MA-08: selecting "Junho 2026" shows only June 2026 items', async () => {
    mockItems = [
      makeContract({ fimContratoCPA: '2026-06-15', hasCPAContract: true }, 'june-contract'),
      makeContract({ fimContratoCPA: '2026-08-01', hasCPAContract: true }, 'aug-contract'),
      makeContract({ fimContratoCPA: '2026-06-28', hasCPAContract: true }, 'june-contract-2'),
    ];
    mockPagination = { page: 1, limit: 10, total: 3, totalPages: 1 };

    const wrapper = await mountContractsView();

    // Select June 2026
    const select = wrapper.find('select');
    await select.setValue('2026-06');
    await nextTick();

    // Find the ContentListTemplate and check its items prop
    const template = wrapper.findComponent({ name: 'ContentListTemplate' });
    const displayed = template.props('items') as Record<string, unknown>[];

    expect(displayed).toHaveLength(2);
    expect(displayed.every(item => (item as any).uuid.startsWith('june'))).toBe(true);
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-09: Items from other months hidden
  // Validates: REQ-03 (CA-03.2)
  // -------------------------------------------------------------------------
  it('MA-09: items from other months are hidden when filter active', async () => {
    mockItems = [
      makeLicense({ dataVencimento: '2026-06-15' }, 'june-lic'),
      makeLicense({ dataVencimento: '2026-07-01' }, 'july-lic'),
      makeLicense({ dataVencimento: '2026-05-20' }, 'may-lic'),
    ];
    mockPagination = { page: 1, limit: 10, total: 3, totalPages: 1 };

    const wrapper = await mountLicensesView();

    const select = wrapper.find('select');
    await select.setValue('2026-06');
    await nextTick();

    const template = wrapper.findComponent({ name: 'ContentListTemplate' });
    const displayed = template.props('items') as Record<string, unknown>[];

    expect(displayed).toHaveLength(1);
    expect((displayed[0] as any).uuid).toBe('june-lic');
    // July and May items are not present
    expect(displayed.some(i => (i as any).uuid === 'july-lic')).toBe(false);
    expect(displayed.some(i => (i as any).uuid === 'may-lic')).toBe(false);
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-10: List updates immediately on selection
  // Validates: REQ-03 (CA-03.3)
  // -------------------------------------------------------------------------
  it('MA-10: list updates immediately on selection', async () => {
    mockItems = [
      makeLicense({ dataVencimento: '2026-06-15' }, 'june-lic'),
      makeLicense({ dataVencimento: '2026-07-01' }, 'july-lic'),
    ];
    mockPagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

    const wrapper = await mountLicensesView();

    const template = wrapper.findComponent({ name: 'ContentListTemplate' });

    // Before filter: all items
    expect((template.props('items') as unknown[]).length).toBe(2);

    // Select June
    const select = wrapper.find('select');
    await select.setValue('2026-06');
    await nextTick();

    // After filter: only June item — immediate client-side filtering
    expect((template.props('items') as unknown[]).length).toBe(1);
    // Server-side filter is also triggered via watcher for data accuracy
    const callsAfterMount = fetchListMock.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThanOrEqual(1);
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-11: Clearing filter restores all items
  // Validates: REQ-04 (CA-04.1)
  // -------------------------------------------------------------------------
  it('MA-11: clearing filter restores all items', async () => {
    mockItems = [
      makeLicense({ dataVencimento: '2026-06-15' }, 'june-lic'),
      makeLicense({ dataVencimento: '2026-07-01' }, 'july-lic'),
    ];
    mockPagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const template = wrapper.findComponent({ name: 'ContentListTemplate' });

    // Apply filter
    const select = wrapper.find('select');
    await select.setValue('2026-06');
    await nextTick();
    expect((template.props('items') as unknown[]).length).toBe(1);

    // Clear filter by selecting empty value
    await select.setValue('');
    await nextTick();

    expect((template.props('items') as unknown[]).length).toBe(2);
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-12: Dropdown returns to default state after clear
  // Validates: REQ-04 (CA-04.2)
  // -------------------------------------------------------------------------
  it('MA-12: dropdown returns to default state after clear', async () => {
    mockItems = [makeLicense({ dataVencimento: '2026-06-15' })];
    mockPagination = { page: 1, limit: 10, total: 1, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const select = wrapper.find('select');

    // Apply filter
    await select.setValue('2026-06');
    await nextTick();
    expect((select.element as HTMLSelectElement).value).toBe('2026-06');

    // Clear filter
    await select.setValue('');
    await nextTick();

    // The select value should be empty (placeholder state)
    expect((select.element as HTMLSelectElement).value).toBe('');
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-13: Empty state when no items match
  // Validates: REQ-05 (CA-05.1)
  // -------------------------------------------------------------------------
  it('MA-13: empty state when no items match selected month', async () => {
    mockItems = [
      makeLicense({ dataVencimento: '2026-06-15' }, 'june-lic'),
    ];
    mockPagination = { page: 1, limit: 10, total: 1, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const template = wrapper.findComponent({ name: 'ContentListTemplate' });

    // Select a month with no matching items
    const select = wrapper.find('select');
    await select.setValue('2026-12');
    await nextTick();

    const displayed = template.props('items') as unknown[];
    expect(displayed).toHaveLength(0);
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-14: Items without expiration hidden when filter active
  // Validates: REQ-06 (CA-06.1)
  // -------------------------------------------------------------------------
  it('MA-14: items without expiration date are hidden when filter active', async () => {
    mockItems = [
      makeLicense({ dataVencimento: '2026-06-15' }, 'with-date'),
      makeLicense({}, 'no-date'), // No dataVencimento
    ];
    mockPagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const template = wrapper.findComponent({ name: 'ContentListTemplate' });

    // Select June
    const select = wrapper.find('select');
    await select.setValue('2026-06');
    await nextTick();

    const displayed = template.props('items') as Record<string, unknown>[];
    expect(displayed).toHaveLength(1);
    expect((displayed[0] as any).uuid).toBe('with-date');
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-15: Items without expiration visible when no filter
  // Validates: REQ-06 (CA-06.2)
  // -------------------------------------------------------------------------
  it('MA-15: items without expiration date are visible when no filter active', async () => {
    mockItems = [
      makeLicense({ dataVencimento: '2026-06-15' }, 'with-date'),
      makeLicense({}, 'no-date'),
    ];
    mockPagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const template = wrapper.findComponent({ name: 'ContentListTemplate' });

    // No filter active — all items visible
    const displayed = template.props('items') as unknown[];
    expect(displayed).toHaveLength(2);
    wrapper.unmount();
  });


  // -------------------------------------------------------------------------
  // MA-16: Search + filter apply simultaneously
  // Validates: REQ-07 (CA-07.1)
  // -------------------------------------------------------------------------
  it('MA-16: search and filter apply simultaneously', async () => {
    mockItems = [
      makeLicense({ dataVencimento: '2026-06-15', clientName: 'Alpha Corp' }, 'alpha-june'),
      makeLicense({ dataVencimento: '2026-06-20', clientName: 'Beta Inc' }, 'beta-june'),
      makeLicense({ dataVencimento: '2026-07-01', clientName: 'Alpha Ltd' }, 'alpha-july'),
    ];
    mockPagination = { page: 1, limit: 10, total: 3, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const template = wrapper.findComponent({ name: 'ContentListTemplate' });

    // Apply search for "Alpha"
    template.vm.$emit('search', 'Alpha');
    await nextTick();

    // Apply filter for June 2026
    const select = wrapper.find('select');
    await select.setValue('2026-06');
    await nextTick();

    const displayed = template.props('items') as Record<string, unknown>[];
    // Only alpha-june matches both search ("Alpha") and filter (June 2026)
    expect(displayed).toHaveLength(1);
    expect((displayed[0] as any).uuid).toBe('alpha-june');
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-17: Only items matching both search and filter shown
  // Validates: REQ-07 (CA-07.2)
  // -------------------------------------------------------------------------
  it('MA-17: only items matching both search and filter are shown', async () => {
    mockItems = [
      makeLicense({ dataVencimento: '2026-06-15', clientName: 'Gamma Corp', software: { name: ['SAP'], model: '', product: '', version: '', licenseType: '' } }, 'gamma-june'),
      makeLicense({ dataVencimento: '2026-06-20', clientName: 'Delta Inc' }, 'delta-june'),
      makeLicense({ dataVencimento: '2026-07-01', clientName: 'Gamma Ltd' }, 'gamma-july'),
      makeLicense({ dataVencimento: '2026-08-01', clientName: 'Epsilon SA' }, 'epsilon-aug'),
    ];
    mockPagination = { page: 1, limit: 10, total: 4, totalPages: 1 };

    const wrapper = await mountLicensesView();
    const template = wrapper.findComponent({ name: 'ContentListTemplate' });

    // Search for "Gamma"
    template.vm.$emit('search', 'Gamma');
    await nextTick();

    // Filter for June 2026
    const select = wrapper.find('select');
    await select.setValue('2026-06');
    await nextTick();

    const displayed = template.props('items') as Record<string, unknown>[];
    // Only gamma-june matches both
    expect(displayed).toHaveLength(1);
    expect((displayed[0] as any).uuid).toBe('gamma-june');
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-18: License filter matches dataVencimento
  // Validates: REQ-03 (CA-03.4)
  // -------------------------------------------------------------------------
  it('MA-18: license filter matches dataVencimento field', async () => {
    mockItems = [
      makeLicense({ dataVencimento: '2026-06-15' }, 'lic-june'),
      makeLicense({ dataVencimento: '2026-06-30' }, 'lic-june-end'),
      makeLicense({ dataVencimento: '2026-07-01' }, 'lic-july'),
    ];
    mockPagination = { page: 1, limit: 10, total: 3, totalPages: 1 };

    const wrapper = await mountLicensesView();

    const select = wrapper.find('select');
    await select.setValue('2026-06');
    await nextTick();

    const template = wrapper.findComponent({ name: 'ContentListTemplate' });
    const displayed = template.props('items') as Record<string, unknown>[];

    expect(displayed).toHaveLength(2);
    const uuids = displayed.map(i => (i as any).uuid);
    expect(uuids).toContain('lic-june');
    expect(uuids).toContain('lic-june-end');
    expect(uuids).not.toContain('lic-july');
    wrapper.unmount();
  });

  // -------------------------------------------------------------------------
  // MA-19: Contract filter uses soonest of fimContratoCPA/fimContratoSH
  // Validates: REQ-03 (CA-03.5)
  // -------------------------------------------------------------------------
  it('MA-19: contract filter uses soonest of fimContratoCPA/fimContratoSH', async () => {
    mockItems = [
      // CPA in June, SH in August → soonest is June
      makeContract(
        { fimContratoCPA: '2026-06-15', fimContratoSH: '2026-08-01', hasCPAContract: true, hasSHContract: true },
        'contract-both',
      ),
      // Only SH in June → uses SH
      makeContract(
        { fimContratoSH: '2026-06-20', hasSHContract: true },
        'contract-sh-only',
      ),
      // CPA in July, SH in June → soonest is June
      makeContract(
        { fimContratoCPA: '2026-07-01', fimContratoSH: '2026-06-10', hasCPAContract: true, hasSHContract: true },
        'contract-sh-sooner',
      ),
      // Both in August → not June
      makeContract(
        { fimContratoCPA: '2026-08-01', fimContratoSH: '2026-08-15', hasCPAContract: true, hasSHContract: true },
        'contract-aug',
      ),
    ];
    mockPagination = { page: 1, limit: 10, total: 4, totalPages: 1 };

    const wrapper = await mountContractsView();

    const select = wrapper.find('select');
    await select.setValue('2026-06');
    await nextTick();

    const template = wrapper.findComponent({ name: 'ContentListTemplate' });
    const displayed = template.props('items') as Record<string, unknown>[];

    expect(displayed).toHaveLength(3);
    const uuids = displayed.map(i => (i as any).uuid);
    expect(uuids).toContain('contract-both');
    expect(uuids).toContain('contract-sh-only');
    expect(uuids).toContain('contract-sh-sooner');
    expect(uuids).not.toContain('contract-aug');
    wrapper.unmount();
  });
});
