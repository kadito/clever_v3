import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, defineComponent } from 'vue';
import type { Activity, WorkSheet, Client } from '@clever/shared';
import ActivityCard from './ActivityCard.vue';

// --- Mock useApi composable ---
const mockFetchById = vi.fn().mockResolvedValue(undefined);
const mockCurrentItem = ref<unknown>(null);

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    fetchById: mockFetchById,
    currentItem: mockCurrentItem,
    items: ref([]),
    error: ref(null),
    loading: { loading: ref(false), creating: ref(false), updating: ref(false), deleting: ref(false) },
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

// --- Stubs ---
const ClientSearchInputStub = defineComponent({
  name: 'ClientSearchInput',
  template: '<div class="stub-client-search"></div>',
  props: ['modelValue', 'readonly', 'disabled'],
  emits: ['update:modelValue', 'clientSelected'],
});

const WorkSheetSearchInputStub = defineComponent({
  name: 'WorkSheetSearchInput',
  template: '<div class="stub-ws-search"></div>',
  props: ['modelValue', 'readonly', 'disabled', 'clientId'],
  emits: ['update:modelValue', 'workSheetSelected'],
});

const RemoteAssistanceSearchInputStub = defineComponent({
  name: 'RemoteAssistanceSearchInput',
  template: '<div class="stub-ra-search"></div>',
  props: ['modelValue', 'readonly', 'disabled', 'clientId'],
  emits: ['update:modelValue', 'remoteAssistanceSelected'],
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

// =============================================================================
// MI-07: Client change cascade
// Validates: Requirements DR-AC-007, DR-AC-008, DR-BR-003, DR-UX-004
// =============================================================================
describe('MI-07: Client change cascade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentItem.value = null;
  });

  it('changing client clears workSheetId and remoteAssistanceId', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
      workSheetId: 'ws-1',
    });

    const wrapper = mountActivityCard(activity);
    const clientSearch = wrapper.findComponent(ClientSearchInputStub);
    const newClient = createMockClient('client-B');
    clientSearch.vm.$emit('clientSelected', newClient);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.clientId).toBe('client-B');
    expect(lastUpdate.workSheetId).toBeUndefined();
    expect(lastUpdate.remoteAssistanceId).toBeUndefined();
  });

  it('changing client clears remoteAssistanceId when linked to RA', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Assistência Remota',
      remoteAssistanceId: 'ra-1',
    });

    const wrapper = mountActivityCard(activity);
    const clientSearch = wrapper.findComponent(ClientSearchInputStub);
    const newClient = createMockClient('client-B');
    clientSearch.vm.$emit('clientSelected', newClient);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.remoteAssistanceId).toBeUndefined();
  });

  it('auto-populated time fields reset on client change', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
      workSheetId: 'ws-1',
      horaInicio: '09:00',
      horaFim: '17:00',
    });

    const wrapper = mountActivityCard(activity);

    // Mock fetchById to set currentItem with time data
    mockCurrentItem.value = {
      uuid: 'ws-1',
      contentType: 'work-sheets',
      data: {
        clientId: 'client-A',
        request: { arrivalTime: '09:00', departureTime: '17:00' },
        displacement: {},
        otherData: {},
      },
    } as unknown as WorkSheet;
    mockFetchById.mockResolvedValue(undefined);

    // Trigger work-sheet selection to set timeAutoPopulated = true
    const wsComponent = wrapper.findComponent(WorkSheetSearchInputStub);
    wsComponent.vm.$emit('workSheetSelected', { uuid: 'ws-1' } as WorkSheet);

    // Wait for the async fetchById promise chain to fully resolve
    await flushPromises();
    await wrapper.vm.$nextTick();

    // Now change client — should reset auto-populated time
    const clientSearch = wrapper.findComponent(ClientSearchInputStub);
    const newClient = createMockClient('client-C');
    clientSearch.vm.$emit('clientSelected', newClient);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.horaInicio).toBe('');
    expect(lastUpdate.horaFim).toBe('');
  });

  it('same-client re-select does NOT trigger clearing', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
      workSheetId: 'ws-1',
      horaInicio: '09:00',
      horaFim: '17:00',
    });

    const wrapper = mountActivityCard(activity);
    const clientSearch = wrapper.findComponent(ClientSearchInputStub);
    const sameClient = createMockClient('client-A');
    clientSearch.vm.$emit('clientSelected', sameClient);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.workSheetId).toBe('ws-1');
    expect(lastUpdate.horaInicio).toBe('09:00');
    expect(lastUpdate.horaFim).toBe('17:00');
  });

  it('manual time preserved when not auto-populated', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Nenhuma',
      horaInicio: '08:30',
      horaFim: '16:30',
    });

    const wrapper = mountActivityCard(activity);
    const clientSearch = wrapper.findComponent(ClientSearchInputStub);
    const newClient = createMockClient('client-B');
    clientSearch.vm.$emit('clientSelected', newClient);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.horaInicio).toBe('08:30');
    expect(lastUpdate.horaFim).toBe('16:30');
  });

  it('client removal (null) clears linked doc fields', async () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
      workSheetId: 'ws-1',
    });

    const wrapper = mountActivityCard(activity);
    const clientSearch = wrapper.findComponent(ClientSearchInputStub);
    clientSearch.vm.$emit('clientSelected', null);
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.clientId).toBe('');
    expect(lastUpdate.workSheetId).toBeUndefined();
    expect(lastUpdate.remoteAssistanceId).toBeUndefined();
  });
});

// =============================================================================
// MI-08: Field ordering/disabled states
// Validates: Requirements DR-UX-001, DR-UX-002, DR-AC-010
// =============================================================================
describe('MI-08: Field ordering and disabled states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentItem.value = null;
  });

  it('ClientSearchInput is rendered in the form', () => {
    const activity = createBaseActivity();
    const wrapper = mountActivityCard(activity);

    const clientSearch = wrapper.findComponent(ClientSearchInputStub);
    expect(clientSearch.exists()).toBe(true);
  });

  it('Ligação select is disabled when no client selected', () => {
    const activity = createBaseActivity({ clientId: undefined });
    const wrapper = mountActivityCard(activity);

    const selects = wrapper.findAll('select');
    const ligacaoSel = selects[1]; // Ligação is the second select
    expect(ligacaoSel.attributes('disabled')).toBeDefined();
  });

  it('Document search not visible when no client selected and tipoLigacao is Folha de Obra', () => {
    const activity = createBaseActivity({
      clientId: undefined,
      tipoLigacao: 'Folha de Obra',
    });
    const wrapper = mountActivityCard(activity);

    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    expect(wsSearch.exists()).toBe(false);
  });

  it('Document search not visible when no client selected and tipoLigacao is Assistência Remota', () => {
    const activity = createBaseActivity({
      clientId: undefined,
      tipoLigacao: 'Assistência Remota',
    });
    const wrapper = mountActivityCard(activity);

    const raSearch = wrapper.findComponent(RemoteAssistanceSearchInputStub);
    expect(raSearch.exists()).toBe(false);
  });

  it('Document search visible when client IS selected and tipoLigacao is Folha de Obra', () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
    });
    const wrapper = mountActivityCard(activity);

    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    expect(wsSearch.exists()).toBe(true);
  });

  it('Document search visible when client IS selected and tipoLigacao is Assistência Remota', () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Assistência Remota',
    });
    const wrapper = mountActivityCard(activity);

    const raSearch = wrapper.findComponent(RemoteAssistanceSearchInputStub);
    expect(raSearch.exists()).toBe(true);
  });

  it('Ligação select is enabled when client is selected', () => {
    const activity = createBaseActivity({ clientId: 'client-A' });
    const wrapper = mountActivityCard(activity);

    const selects = wrapper.findAll('select');
    const ligacaoSel = selects[1];
    expect(ligacaoSel.attributes('disabled')).toBeUndefined();
  });

  it('field order: Tipo de Atividade → Cliente → Ligação → Document → Assunto → Time → Descrição', () => {
    const activity = createBaseActivity({
      clientId: 'client-A',
      tipoLigacao: 'Folha de Obra',
      workSheetId: 'ws-1',
    });
    const wrapper = mountActivityCard(activity);

    const formFields = wrapper.findAll('.form-field');
    const labels = formFields.map(f => {
      const label = f.find('.form-label');
      return label.exists() ? label.text() : '';
    });

    const tipoIdx = labels.indexOf('Tipo de Atividade *');
    const clienteIdx = labels.indexOf('Cliente *');
    const ligacaoIdx = labels.indexOf('Ligação *');
    const folhaIdx = labels.indexOf('Folha de Obra *');
    const assuntoIdx = labels.indexOf('Assunto *');

    expect(tipoIdx).toBeLessThan(clienteIdx);
    expect(clienteIdx).toBeLessThan(ligacaoIdx);
    expect(ligacaoIdx).toBeLessThan(folhaIdx);
    expect(folhaIdx).toBeLessThan(assuntoIdx);
  });
});

// =============================================================================
// MI-09: Legacy backward compatibility
// Validates: Requirements DR-AC-011, DR-DEC-003
// =============================================================================
describe('MI-09: Legacy backward compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentItem.value = null;
  });

  it('Legacy activity (has workSheetId but no clientId) shows link fields enabled', () => {
    const activity = createBaseActivity({
      clientId: undefined,
      tipoLigacao: 'Folha de Obra',
      workSheetId: 'ws-legacy-1',
    });
    const wrapper = mountActivityCard(activity);

    const selects = wrapper.findAll('select');
    const ligacaoSel = selects[1];
    expect(ligacaoSel.attributes('disabled')).toBeUndefined();

    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    expect(wsSearch.exists()).toBe(true);
  });

  it('Legacy activity (has remoteAssistanceId but no clientId) shows link fields enabled', () => {
    const activity = createBaseActivity({
      clientId: undefined,
      tipoLigacao: 'Assistência Remota',
      remoteAssistanceId: 'ra-legacy-1',
    });
    const wrapper = mountActivityCard(activity);

    const selects = wrapper.findAll('select');
    const ligacaoSel = selects[1];
    expect(ligacaoSel.attributes('disabled')).toBeUndefined();

    const raSearch = wrapper.findComponent(RemoteAssistanceSearchInputStub);
    expect(raSearch.exists()).toBe(true);
  });

  it("Legacy activity's Ligação select is NOT disabled", () => {
    const activity = createBaseActivity({
      clientId: undefined,
      tipoLigacao: 'Folha de Obra',
      workSheetId: 'ws-legacy-1',
    });
    const wrapper = mountActivityCard(activity);

    const selects = wrapper.findAll('select');
    const ligacaoSel = selects[1];
    expect(ligacaoSel.attributes('disabled')).toBeUndefined();
  });

  it('After clearing linked doc on legacy, fields become disabled (must select client)', async () => {
    const activity = createBaseActivity({
      clientId: undefined,
      tipoLigacao: 'Folha de Obra',
      workSheetId: 'ws-legacy-1',
    });
    const wrapper = mountActivityCard(activity);

    // Initially it's legacy — link fields should be enabled
    let selects = wrapper.findAll('select');
    let ligacaoSel = selects[1];
    expect(ligacaoSel.attributes('disabled')).toBeUndefined();

    // Simulate clearing the work sheet (deselect)
    const wsSearch = wrapper.findComponent(WorkSheetSearchInputStub);
    wsSearch.vm.$emit('workSheetSelected', null);
    await wrapper.vm.$nextTick();

    // After clearing doc, handler sets workSheetId to undefined
    const emitted = wrapper.emitted('activity-updated');
    expect(emitted).toBeTruthy();
    const lastUpdate = emitted![emitted!.length - 1][0] as Activity;
    expect(lastUpdate.workSheetId).toBeUndefined();

    // Now the component's localActivity has no clientId + no workSheetId = not legacy
    // The Ligação select should now be disabled
    await wrapper.vm.$nextTick();
    selects = wrapper.findAll('select');
    ligacaoSel = selects[1];
    expect(ligacaoSel.attributes('disabled')).toBeDefined();
  });
});
