import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, defineComponent } from 'vue';
import type { Activity, WorkSheet, RemoteAssistance, Client } from '@clever/shared';
import ActivityCard from '../ActivityCard.vue';

// --- Mock useApi composable ---
const mockFetchById = vi.fn().mockResolvedValue(undefined);
const mockCurrentItem = ref<unknown>(null);

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    fetchById: mockFetchById,
    currentItem: mockCurrentItem,
    items: ref([]),
    error: ref(null),
    loading: {
      loading: ref(false),
      creating: ref(false),
      updating: ref(false),
      deleting: ref(false),
    },
    pagination: ref({ page: 1, limit: 10, total: 0, totalPages: 0 }),
    fetchList: vi.fn(),
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

// --- Stubs for child components ---
const ClientSearchInputStub = defineComponent({
  name: 'ClientSearchInput',
  props: ['modelValue', 'readonly', 'disabled'],
  emits: ['update:modelValue', 'clientSelected'],
  template: '<div class="stub-client-search"></div>',
});

const WorkSheetSearchInputStub = defineComponent({
  name: 'WorkSheetSearchInput',
  props: ['modelValue', 'readonly', 'disabled', 'clientId'],
  emits: ['update:modelValue', 'workSheetSelected'],
  template: '<div class="stub-ws-search"></div>',
});

const RemoteAssistanceSearchInputStub = defineComponent({
  name: 'RemoteAssistanceSearchInput',
  props: ['modelValue', 'readonly', 'disabled', 'clientId'],
  emits: ['update:modelValue', 'remoteAssistanceSelected'],
  template: '<div class="stub-ra-search"></div>',
});

// --- Helpers ---
function createBaseActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    tipoAtividade: 'Interno',
    assunto: 'Test activity',
    horaInicio: '',
    horaFim: '',
    tempoPausa: 0,
    totalHoras: '00:00',
    tipoLigacao: 'Nenhuma',
    ...overrides,
  };
}

function mountActivityCard(activity: Activity, isEditMode = true) {
  return mount(ActivityCard, {
    props: { activity, isEditMode },
    global: {
      stubs: {
        ClientSearchInput: ClientSearchInputStub,
        WorkSheetSearchInput: WorkSheetSearchInputStub,
        RemoteAssistanceSearchInput: RemoteAssistanceSearchInputStub,
        Transition: false,
      },
    },
  });
}

function createMockClient(uuid: string): Client {
  return {
    uuid,
    contentType: 'clients',
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'user-1',
    updatedAt: '2024-01-01T00:00:00Z',
    updatedBy: 'user-1',
    version: 1,
    isDeleted: false,
    data: {
      nomeEmpresa: `Client ${uuid}`,
      contribuinte: '123456789',
      localidade: 'Lisbon',
    },
  } as Client;
}

function createMockWorkSheet(uuid: string, arrivalTime: string, departureTime: string): WorkSheet {
  return {
    uuid,
    contentType: 'work-sheets',
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'user-1',
    updatedAt: '2024-01-01T00:00:00Z',
    updatedBy: 'user-1',
    version: 1,
    isDeleted: false,
    data: {
      clientId: 'client-A',
      request: {
        date: '2024-01-15',
        receivedBy: 'João',
        assistanceDate: '2024-01-16',
        reason: 'Manutenção',
        arrivalTime,
        departureTime,
        totalHours: '08:00',
      },
      displacement: {
        hasDisplacement: false,
        weekendHoliday: false,
        oneWayKms: 0,
        totalKms: 0,
      },
      otherData: {},
    },
  } as unknown as WorkSheet;
}

function createMockRemoteAssistance(
  uuid: string,
  inicioAssistencia: string,
  fimAssistencia: string,
): RemoteAssistance {
  return {
    uuid,
    contentType: 'remote-assistance',
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'user-1',
    updatedAt: '2024-01-01T00:00:00Z',
    updatedBy: 'user-1',
    version: 1,
    isDeleted: false,
    data: {
      clientId: 'client-A',
      tipoAssistencia: 'REMOTA',
      tecnicoResponsavel: { userId: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B', userType: 'User' },
      dataPedido: '2024-01-15',
      dataAssistencia: '2024-01-16',
      inicioAssistencia,
      fimAssistencia,
      horasTotais: '08:00',
      motivoPedido: 'Teste',
      relatorioAssistencia: '',
      valorAssist: 0,
      paymentMethod: 'Faturação',
      resolvido: true,
      anexos: '',
      anexosFiles: [],
    },
  } as unknown as RemoteAssistance;
}

// =============================================================================
// MI — timeFieldsLocked computed
// Validates: Requirements DR-LIG-AC-006, DR-LIG-AC-009
// =============================================================================
describe('timeFieldsLocked computed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentItem.value = null;
  });

  it('returns false when timeAutoPopulated is false', () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Nenhuma',
    });
    const wrapper = mountActivityCard(activity);

    // timeAutoPopulated starts as false, so time inputs should NOT be disabled
    const timeInputs = wrapper.findAll('input[type="text"][placeholder="HH:MM"]');
    for (const input of timeInputs) {
      expect(input.attributes('disabled')).toBeUndefined();
    }
  });

  it('returns false when timeAutoPopulated is true but no workSheetId or remoteAssistanceId', async () => {
    // We need to trigger auto-population then clear the document to test this edge case
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
    });
    const wrapper = mountActivityCard(activity);

    // Set up mock to succeed
    const ws = createMockWorkSheet('ws-1', '09:00', '17:00');
    mockCurrentItem.value = ws;
    mockFetchById.mockResolvedValue(undefined);

    // Select work sheet to set timeAutoPopulated=true
    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    wsSearch.vm.$emit('workSheetSelected', { uuid: 'ws-1' } as WorkSheet);
    await flushPromises();

    // Now deselect (null) — clears workSheetId and resets timeAutoPopulated
    wsSearch.vm.$emit('workSheetSelected', null);
    await flushPromises();

    // Time inputs should be editable again
    const timeInputs = wrapper.findAll('input[type="text"][placeholder="HH:MM"]');
    for (const input of timeInputs) {
      expect(input.attributes('disabled')).toBeUndefined();
    }
  });

  it('returns true when timeAutoPopulated is true AND workSheetId is set', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
    });
    const wrapper = mountActivityCard(activity);

    const ws = createMockWorkSheet('ws-1', '09:00', '17:00');
    mockCurrentItem.value = ws;
    mockFetchById.mockResolvedValue(undefined);

    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    wsSearch.vm.$emit('workSheetSelected', { uuid: 'ws-1' } as WorkSheet);
    await flushPromises();

    // Time inputs should be disabled (locked)
    const timeInputs = wrapper.findAll('input[type="text"][placeholder="HH:MM"]');
    for (const input of timeInputs) {
      expect(input.attributes('disabled')).toBeDefined();
    }
    // Break time input should also be disabled
    const pauseInput = wrapper.find('input[type="number"]');
    expect(pauseInput.attributes('disabled')).toBeDefined();
  });

  it('returns true when timeAutoPopulated is true AND remoteAssistanceId is set', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Assistência Remota',
    });
    const wrapper = mountActivityCard(activity);

    const ra = createMockRemoteAssistance('ra-1', '10:00', '18:00');
    mockCurrentItem.value = ra;
    mockFetchById.mockResolvedValue(undefined);

    const raSearch = wrapper.findComponent(RemoteAssistanceSearchInputStub);
    raSearch.vm.$emit('remoteAssistanceSelected', { uuid: 'ra-1' } as RemoteAssistance);
    await flushPromises();

    const timeInputs = wrapper.findAll('input[type="text"][placeholder="HH:MM"]');
    for (const input of timeInputs) {
      expect(input.attributes('disabled')).toBeDefined();
    }
    const pauseInput = wrapper.find('input[type="number"]');
    expect(pauseInput.attributes('disabled')).toBeDefined();
  });
});

// =============================================================================
// MI — handleWorkSheetSelected
// Validates: Requirements DR-LIG-AC-005, DR-LIG-AC-006, DR-LIG-AC-018, DR-LIG-AC-019
// =============================================================================
describe('handleWorkSheetSelected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentItem.value = null;
  });

  it('on success: sets horaInicio, horaFim from work sheet, tempoPausa=0, timeAutoPopulated=true', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
      horaInicio: '08:00',
      horaFim: '12:00',
      tempoPausa: 30,
    });
    const wrapper = mountActivityCard(activity);

    const ws = createMockWorkSheet('ws-1', '09:30', '17:45');
    mockCurrentItem.value = ws;
    mockFetchById.mockResolvedValue(undefined);

    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    wsSearch.vm.$emit('workSheetSelected', { uuid: 'ws-1' } as WorkSheet);
    await flushPromises();

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.horaInicio).toBe('09:30');
    expect(lastUpdate.horaFim).toBe('17:45');
    expect(lastUpdate.tempoPausa).toBe(0);

    // Fields should be locked (timeAutoPopulated=true + workSheetId set)
    const timeInputs = wrapper.findAll('input[type="text"][placeholder="HH:MM"]');
    for (const input of timeInputs) {
      expect(input.attributes('disabled')).toBeDefined();
    }
  });

  it('on failure: sets fetchError message and does not lock fields', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
      horaInicio: '08:00',
      horaFim: '12:00',
    });
    const wrapper = mountActivityCard(activity);

    mockFetchById.mockRejectedValue(new Error('Network error'));

    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    wsSearch.vm.$emit('workSheetSelected', { uuid: 'ws-fail' } as WorkSheet);
    await flushPromises();

    // Error message should be displayed
    const warning = wrapper.find('.text-amber-600');
    expect(warning.exists()).toBe(true);
    expect(warning.text()).toContain('Os tempos não puderam ser preenchidos automaticamente');

    // Time fields should remain editable (not locked)
    const timeInputs = wrapper.findAll('input[type="text"][placeholder="HH:MM"]');
    for (const input of timeInputs) {
      expect(input.attributes('disabled')).toBeUndefined();
    }
  });

  it('on null: clears workSheetId and resets time if autoPopulated', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
    });
    const wrapper = mountActivityCard(activity);

    // First, select a work sheet to set timeAutoPopulated
    const ws = createMockWorkSheet('ws-1', '09:00', '17:00');
    mockCurrentItem.value = ws;
    mockFetchById.mockResolvedValue(undefined);

    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    wsSearch.vm.$emit('workSheetSelected', { uuid: 'ws-1' } as WorkSheet);
    await flushPromises();

    // Now deselect (null)
    wsSearch.vm.$emit('workSheetSelected', null);
    await flushPromises();

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.workSheetId).toBeUndefined();
    expect(lastUpdate.horaInicio).toBe('');
    expect(lastUpdate.horaFim).toBe('');
  });

  it('clears fetchError on new selection', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
    });
    const wrapper = mountActivityCard(activity);

    // First trigger a failure
    mockFetchById.mockRejectedValue(new Error('Network error'));
    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    wsSearch.vm.$emit('workSheetSelected', { uuid: 'ws-fail' } as WorkSheet);
    await flushPromises();

    // Verify error is shown
    expect(wrapper.find('.text-amber-600').exists()).toBe(true);

    // Now select a new work sheet that succeeds
    const ws = createMockWorkSheet('ws-2', '10:00', '18:00');
    mockCurrentItem.value = ws;
    mockFetchById.mockResolvedValue(undefined);
    wsSearch.vm.$emit('workSheetSelected', { uuid: 'ws-2' } as WorkSheet);
    await flushPromises();

    // Error should be cleared
    expect(wrapper.find('.text-amber-600').exists()).toBe(false);
  });
});

// =============================================================================
// MI — handleRemoteAssistanceSelected
// Validates: Requirements DR-LIG-AC-008, DR-LIG-AC-009, DR-LIG-AC-018, DR-LIG-AC-019
// =============================================================================
describe('handleRemoteAssistanceSelected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentItem.value = null;
  });

  it('on success: sets horaInicio, horaFim from remote assistance, tempoPausa=0, timeAutoPopulated=true', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Assistência Remota',
      horaInicio: '07:00',
      horaFim: '11:00',
      tempoPausa: 15,
    });
    const wrapper = mountActivityCard(activity);

    const ra = createMockRemoteAssistance('ra-1', '10:30', '16:45');
    mockCurrentItem.value = ra;
    mockFetchById.mockResolvedValue(undefined);

    const raSearch = wrapper.findComponent(RemoteAssistanceSearchInputStub);
    raSearch.vm.$emit('remoteAssistanceSelected', { uuid: 'ra-1' } as RemoteAssistance);
    await flushPromises();

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.horaInicio).toBe('10:30');
    expect(lastUpdate.horaFim).toBe('16:45');
    expect(lastUpdate.tempoPausa).toBe(0);

    // Fields should be locked
    const timeInputs = wrapper.findAll('input[type="text"][placeholder="HH:MM"]');
    for (const input of timeInputs) {
      expect(input.attributes('disabled')).toBeDefined();
    }
  });

  it('on failure: sets fetchError message and does not lock fields', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Assistência Remota',
      horaInicio: '08:00',
      horaFim: '12:00',
    });
    const wrapper = mountActivityCard(activity);

    mockFetchById.mockRejectedValue(new Error('Timeout'));

    const raSearch = wrapper.findComponent(RemoteAssistanceSearchInputStub);
    raSearch.vm.$emit('remoteAssistanceSelected', { uuid: 'ra-fail' } as RemoteAssistance);
    await flushPromises();

    // Error message should be displayed
    const warning = wrapper.find('.text-amber-600');
    expect(warning.exists()).toBe(true);
    expect(warning.text()).toContain('Os tempos não puderam ser preenchidos automaticamente');

    // Time fields should remain editable
    const timeInputs = wrapper.findAll('input[type="text"][placeholder="HH:MM"]');
    for (const input of timeInputs) {
      expect(input.attributes('disabled')).toBeUndefined();
    }
  });

  it('on null: clears remoteAssistanceId and resets time if autoPopulated', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Assistência Remota',
    });
    const wrapper = mountActivityCard(activity);

    // First select to set timeAutoPopulated
    const ra = createMockRemoteAssistance('ra-1', '10:00', '18:00');
    mockCurrentItem.value = ra;
    mockFetchById.mockResolvedValue(undefined);

    const raSearch = wrapper.findComponent(RemoteAssistanceSearchInputStub);
    raSearch.vm.$emit('remoteAssistanceSelected', { uuid: 'ra-1' } as RemoteAssistance);
    await flushPromises();

    // Now deselect
    raSearch.vm.$emit('remoteAssistanceSelected', null);
    await flushPromises();

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.remoteAssistanceId).toBeUndefined();
    expect(lastUpdate.horaInicio).toBe('');
    expect(lastUpdate.horaFim).toBe('');
  });

  it('clears fetchError on new selection', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Assistência Remota',
    });
    const wrapper = mountActivityCard(activity);

    // First trigger a failure
    mockFetchById.mockRejectedValue(new Error('Network error'));
    const raSearch = wrapper.findComponent(RemoteAssistanceSearchInputStub);
    raSearch.vm.$emit('remoteAssistanceSelected', { uuid: 'ra-fail' } as RemoteAssistance);
    await flushPromises();

    expect(wrapper.find('.text-amber-600').exists()).toBe(true);

    // Now select a new RA that succeeds
    const ra = createMockRemoteAssistance('ra-2', '11:00', '19:00');
    mockCurrentItem.value = ra;
    mockFetchById.mockResolvedValue(undefined);
    raSearch.vm.$emit('remoteAssistanceSelected', { uuid: 'ra-2' } as RemoteAssistance);
    await flushPromises();

    expect(wrapper.find('.text-amber-600').exists()).toBe(false);
  });
});

// =============================================================================
// MI — handleClientSelected
// Validates: Requirements DR-LIG-AC-010, DR-LIG-AC-011
// =============================================================================
describe('handleClientSelected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentItem.value = null;
  });

  it('clears fetchError', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
    });
    const wrapper = mountActivityCard(activity);

    // Trigger a fetch error first
    mockFetchById.mockRejectedValue(new Error('Fail'));
    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    wsSearch.vm.$emit('workSheetSelected', { uuid: 'ws-x' } as WorkSheet);
    await flushPromises();

    expect(wrapper.find('.text-amber-600').exists()).toBe(true);

    // Now change client — should clear fetchError
    const clientSearch = wrapper.findComponent(ClientSearchInputStub);
    clientSearch.vm.$emit('clientSelected', createMockClient('client-B'));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.text-amber-600').exists()).toBe(false);
  });

  it('on client change: clears linked document and resets time fields', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
      workSheetId: 'ws-1',
    });
    const wrapper = mountActivityCard(activity);

    // Auto-populate time first
    const ws = createMockWorkSheet('ws-1', '09:00', '17:00');
    mockCurrentItem.value = ws;
    mockFetchById.mockResolvedValue(undefined);
    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    wsSearch.vm.$emit('workSheetSelected', { uuid: 'ws-1' } as WorkSheet);
    await flushPromises();

    // Change client
    const clientSearch = wrapper.findComponent(ClientSearchInputStub);
    clientSearch.vm.$emit('clientSelected', createMockClient('client-B'));
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.clientId).toBe('client-B');
    expect(lastUpdate.workSheetId).toBeUndefined();
    expect(lastUpdate.remoteAssistanceId).toBeUndefined();
    expect(lastUpdate.horaInicio).toBe('');
    expect(lastUpdate.horaFim).toBe('');
  });

  it('on client removal: clears linked document and resets time fields', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Assistência Remota',
      remoteAssistanceId: 'ra-1',
    });
    const wrapper = mountActivityCard(activity);

    // Auto-populate time first
    const ra = createMockRemoteAssistance('ra-1', '10:00', '18:00');
    mockCurrentItem.value = ra;
    mockFetchById.mockResolvedValue(undefined);
    const raSearch = wrapper.findComponent(RemoteAssistanceSearchInputStub);
    raSearch.vm.$emit('remoteAssistanceSelected', { uuid: 'ra-1' } as RemoteAssistance);
    await flushPromises();

    // Remove client (null)
    const clientSearch = wrapper.findComponent(ClientSearchInputStub);
    clientSearch.vm.$emit('clientSelected', null);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.clientId).toBe('');
    expect(lastUpdate.workSheetId).toBeUndefined();
    expect(lastUpdate.remoteAssistanceId).toBeUndefined();
    expect(lastUpdate.horaInicio).toBe('');
    expect(lastUpdate.horaFim).toBe('');
  });
});

// =============================================================================
// MI — handleLinkTypeChange
// Validates: Requirements DR-LIG-AC-001, DR-LIG-AC-002
// =============================================================================
describe('handleLinkTypeChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentItem.value = null;
  });

  it('clears fetchError', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
    });
    const wrapper = mountActivityCard(activity);

    // Trigger a fetch error first
    mockFetchById.mockRejectedValue(new Error('Fail'));
    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    wsSearch.vm.$emit('workSheetSelected', { uuid: 'ws-x' } as WorkSheet);
    await flushPromises();

    expect(wrapper.find('.text-amber-600').exists()).toBe(true);

    // Change link type via select
    const selects = wrapper.findAll('select');
    const ligacaoSelect = selects[1]; // second select = Ligação
    await ligacaoSelect.setValue('Nenhuma');

    expect(wrapper.find('.text-amber-600').exists()).toBe(false);
  });

  it('when "Nenhuma": clears workSheetId, remoteAssistanceId, time fields, timeAutoPopulated', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
    });
    const wrapper = mountActivityCard(activity);

    // First select a work sheet
    const ws = createMockWorkSheet('ws-1', '09:00', '17:00');
    mockCurrentItem.value = ws;
    mockFetchById.mockResolvedValue(undefined);
    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    wsSearch.vm.$emit('workSheetSelected', { uuid: 'ws-1' } as WorkSheet);
    await flushPromises();

    // Now change to "Nenhuma"
    const selects = wrapper.findAll('select');
    const ligacaoSelect = selects[1];
    await ligacaoSelect.setValue('Nenhuma');

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.workSheetId).toBeUndefined();
    expect(lastUpdate.remoteAssistanceId).toBeUndefined();
    expect(lastUpdate.horaInicio).toBe('');
    expect(lastUpdate.horaFim).toBe('');

    // Time fields should be editable
    const timeInputs = wrapper.findAll('input[type="text"][placeholder="HH:MM"]');
    for (const input of timeInputs) {
      expect(input.attributes('disabled')).toBeUndefined();
    }
  });

  it('when "Folha de Obra": clears remoteAssistanceId only', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Assistência Remota',
      remoteAssistanceId: 'ra-1',
    });
    const wrapper = mountActivityCard(activity);

    // Change to "Folha de Obra"
    const selects = wrapper.findAll('select');
    const ligacaoSelect = selects[1];
    await ligacaoSelect.setValue('Folha de Obra');

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.remoteAssistanceId).toBeUndefined();
    expect(lastUpdate.tipoLigacao).toBe('Folha de Obra');
  });

  it('when "Assistência Remota": clears workSheetId only', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
      workSheetId: 'ws-1',
    });
    const wrapper = mountActivityCard(activity);

    // Change to "Assistência Remota"
    const selects = wrapper.findAll('select');
    const ligacaoSelect = selects[1];
    await ligacaoSelect.setValue('Assistência Remota');

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.workSheetId).toBeUndefined();
    expect(lastUpdate.tipoLigacao).toBe('Assistência Remota');
  });
});
