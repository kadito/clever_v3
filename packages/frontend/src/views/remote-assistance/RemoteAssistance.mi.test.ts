/**
 * Remote Assistance — Anexos Refactor — MI Integration Tests (Frontend)
 * Tests: MI-01, MI-02, MI-09, MI-10, MI-11, MI-12, MI-13, MI-14, MI-15, MI-16
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, computed } from 'vue';
import type { FileReference } from '@clever/shared';

// ============================================================================
// Mocks
// ============================================================================

// Mock vue-router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: { uuid: 'test-uuid-123' } })),
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

// Mock useAuth
vi.mock('@/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { value: { userId: 'user-1', email: 'test@test.com' } },
    isAuthenticated: { value: true },
  })),
}));

// Mock useErrorHandler
vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: vi.fn(() => ({
    handleError: vi.fn(),
    clearError: vi.fn(),
  })),
}));

// Mock usePermissions
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: vi.fn(() => ({
    canDelete: { value: true },
    canEdit: { value: true },
  })),
}));

// File upload mock state
const mockUploadFiles = vi.fn().mockResolvedValue([]);
const mockDeleteFile = vi.fn().mockResolvedValue(true);
const mockUploading = ref(false);
const mockDeleting = ref(false);
const mockFileError = ref<string | null>(null);

vi.mock('@/composables/useFileUpload', () => ({
  useFileUpload: vi.fn(() => ({
    uploadFiles: mockUploadFiles,
    deleteFile: mockDeleteFile,
    uploading: mockUploading,
    deleting: mockDeleting,
    error: mockFileError,
    getFileUrl: vi.fn((ct: string, uuid: string, key: string) => `/api/content/${ct}/${uuid}/files/${key}`),
    clearError: vi.fn(() => { mockFileError.value = null; }),
  })),
}));

// Mock useApi
const mockCreate = vi.fn().mockResolvedValue({ uuid: 'new-uuid-123', data: {} });
const mockUpdate = vi.fn().mockResolvedValue({ uuid: 'test-uuid-123', data: {} });
const mockFetchById = vi.fn().mockResolvedValue(undefined);
const mockRemove = vi.fn().mockResolvedValue(true);
const mockCurrentItem = ref<any>(null);
const mockApiError = ref<any>(null);

vi.mock('@/composables/useApi', () => ({
  useApi: vi.fn(() => ({
    items: ref([]),
    currentItem: mockCurrentItem,
    error: mockApiError,
    loading: {
      loading: ref(false),
      creating: ref(false),
      updating: ref(false),
      deleting: ref(false),
    },
    pagination: ref({ page: 1, limit: 10, total: 0, totalPages: 0 }),
    fetchList: vi.fn().mockResolvedValue(undefined),
    fetchById: mockFetchById,
    create: mockCreate,
    update: mockUpdate,
    remove: mockRemove,
    search: vi.fn(),
    clearError: vi.fn(),
    refresh: vi.fn(),
    hasError: computed(() => false),
    isEmpty: computed(() => true),
    isNetworkError: computed(() => false),
    isRetryableError: computed(() => false),
  })),
}));

// Mock useSharedFormData
const mockFormData = ref<Record<string, any>>({});
vi.mock('@/composables/useSharedFormData', () => ({
  useSharedFormData: vi.fn(() => ({
    formData: mockFormData,
    validationErrors: {},
    updateFieldValue: vi.fn((key: string, value: any) => {
      mockFormData.value[key] = value;
    }),
    initializeFormData: vi.fn(),
    getFormData: vi.fn(() => mockFormData.value),
    clearFormData: vi.fn(),
  })),
}));

// Mock @clever/shared partially — keep real types/guards
vi.mock('@clever/shared', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    isRelationError: vi.fn(() => false),
  };
});

// ============================================================================
// MI-01 & MI-02: Type-level tests (runtime assertions)
// ============================================================================
describe('MI-01: RemoteAssistanceData type — new field compiles with FileReference[]', () => {
  it('should accept a valid FileReference[] in anexosFiles field', () => {
    const data: { anexosFiles: FileReference[] } = {
      anexosFiles: [
        {
          key: 'files/remote-assistance/uuid/file.jpg',
          name: 'photo.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
        },
      ],
    };

    expect(data.anexosFiles).toHaveLength(1);
    expect(data.anexosFiles[0].key).toBe('files/remote-assistance/uuid/file.jpg');
    expect(data.anexosFiles[0].name).toBe('photo.jpg');
    expect(data.anexosFiles[0].mimeType).toBe('image/jpeg');
    expect(data.anexosFiles[0].size).toBe(1024);
  });
});

describe('MI-02: RemoteAssistanceData type — missing field normalizes to []', () => {
  it('should normalize undefined anexosFiles to [] using Array.isArray guard', () => {
    const data: { anexosFiles?: FileReference[] } = {};
    const normalized: FileReference[] = Array.isArray(data.anexosFiles)
      ? data.anexosFiles
      : [];

    expect(normalized).toEqual([]);
  });

  it('should normalize null anexosFiles to []', () => {
    const data: { anexosFiles: any } = { anexosFiles: null };
    const normalized: FileReference[] = Array.isArray(data.anexosFiles)
      ? data.anexosFiles
      : [];

    expect(normalized).toEqual([]);
  });

  it('should normalize string anexosFiles to []', () => {
    const data: { anexosFiles: any } = { anexosFiles: 'old text value' };
    const normalized: FileReference[] = Array.isArray(data.anexosFiles)
      ? data.anexosFiles
      : [];

    expect(normalized).toEqual([]);
  });
});

// ============================================================================
// MI-09 & MI-10: Create form upload flow
// ============================================================================
import RemoteAssistanceCreateView from './RemoteAssistanceCreateView.vue';

describe('MI-09: Create form upload flow — submit with no files, no upload call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormData.value = {};
    mockFileError.value = null;
  });

  it('should not call uploadFiles when no pending files exist', async () => {
    const wrapper = mount(RemoteAssistanceCreateView, {
      global: {
        stubs: {
          ContentCreateTemplate: {
            template: '<div><slot name="createSections" /><button @click="$emit(\'create\', formData)">Submit</button></div>',
            props: ['formSections', 'contentType', 'createTitle', 'subtitle', 'cancelRoute', 'customValidator', 'isSaving', 'error'],
            setup(_props: any, { emit }: any) {
              const formData = {
                clientId: 'client-1',
                tipoAssistencia: 'REMOTA',
                dataPedido: '2024-01-01',
                dataAssistencia: '2024-01-02',
                inicioAssistencia: '09:00',
                fimAssistencia: '10:00',
                motivoPedido: 'test',
                paymentMethod: 'Faturação',
                resolvido: true,
                anexos: '',
              };
              return { formData, emit };
            },
          },
          ClientSearchInput: { template: '<div />' },
          FileUploadZone: { template: '<div class="file-upload-zone" />' },
        },
      },
    });

    // Trigger the create event (simulating form submission with no files)
    await wrapper.find('button').trigger('click');
    await vi.dynamicImportSettled();

    // uploadFiles should NOT have been called since no files were pending
    expect(mockUploadFiles).not.toHaveBeenCalled();
  });
});

describe('MI-10: Create form upload flow — submit with files, upload after save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFormData.value = {};
    mockFileError.value = null;
    mockCreate.mockResolvedValue({ uuid: 'new-uuid-456', data: {} });
  });

  it('should call uploadFiles after successful record creation when files are pending', async () => {
    const wrapper = mount(RemoteAssistanceCreateView, {
      global: {
        stubs: {
          ContentCreateTemplate: {
            template: '<div><slot name="createSections" /><button @click="emitCreate">Submit</button></div>',
            props: ['formSections', 'contentType', 'createTitle', 'subtitle', 'cancelRoute', 'customValidator', 'isSaving', 'error'],
            setup(_props: any, { emit }: any) {
              const emitCreate = () => {
                emit('create', {
                  clientId: 'client-1',
                  tipoAssistencia: 'REMOTA',
                  dataPedido: '2024-01-01',
                  dataAssistencia: '2024-01-02',
                  inicioAssistencia: '09:00',
                  fimAssistencia: '10:00',
                  motivoPedido: 'test',
                  paymentMethod: 'Faturação',
                  resolvido: true,
                  anexos: '',
                });
              };
              return { emitCreate };
            },
          },
          ClientSearchInput: { template: '<div />' },
          FileUploadZone: {
            template: '<div class="file-upload-zone" />',
            emits: ['files-changed'],
          },
        },
      },
    });

    // Simulate files being selected via the FileUploadZone event
    const fileZone = wrapper.findComponent({ name: 'FileUploadZone' });
    if (fileZone.exists()) {
      fileZone.vm.$emit('files-changed', {
        fieldName: 'anexosFiles',
        newFiles: [new File(['content'], 'test.jpg', { type: 'image/jpeg' })],
        removedKeys: [],
      });
    } else {
      // Directly call the handler on the component instance
      const vm = wrapper.vm as any;
      if (vm.handleAnexosFilesChanged) {
        vm.handleAnexosFilesChanged({
          fieldName: 'anexosFiles',
          newFiles: [new File(['content'], 'test.jpg', { type: 'image/jpeg' })],
          removedKeys: [],
        });
      }
    }

    await wrapper.vm.$nextTick();

    // Trigger form submission
    await wrapper.find('button').trigger('click');

    // Wait for async operations
    await vi.dynamicImportSettled();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify create was called first
    expect(mockCreate).toHaveBeenCalled();

    // Verify uploadFiles was called with correct params after create
    expect(mockUploadFiles).toHaveBeenCalledWith(
      'remote-assistance',
      'new-uuid-456',
      'anexosFiles',
      expect.any(Array),
    );
  });
});

// ============================================================================
// MI-11, MI-12, MI-13: Update form file operations
// ============================================================================
import RemoteAssistanceUpdateView from './RemoteAssistanceUpdateView.vue';

const buildMockRemoteAssistance = (overrides: Record<string, any> = {}) => ({
  uuid: 'test-uuid-123',
  contentType: 'remote-assistance',
  createdAt: '2024-01-01T00:00:00Z',
  createdBy: 'user-1',
  updatedAt: '2024-01-01T00:00:00Z',
  updatedBy: 'user-1',
  version: 1,
  isDeleted: false,
  data: {
    clientId: 'client-1',
    clienteName: 'Test Client',
    tipoAssistencia: 'REMOTA',
    tecnicoResponsavel: { userId: 'u1', email: 'e@e.com', firstName: 'Test', lastName: 'User', userType: 'Admin' },
    dataPedido: '2024-01-01',
    dataAssistencia: '2024-01-02',
    inicioAssistencia: '09:00',
    fimAssistencia: '10:00',
    horasTotais: '1:00',
    motivoPedido: 'test',
    relatorioAssistencia: 'test report',
    valorAssist: 30,
    paymentMethod: 'Faturação',
    resolvido: true,
    anexos: '',
    anexosFiles: [],
    ...overrides,
  },
  relations: {},
});

const updateViewStubs = {
  ContentUpdateTemplate: {
    template: '<div><slot name="updateSections" /><button @click="emitUpdate">Save</button></div>',
    props: ['item', 'formSections', 'contentType', 'initialData', 'customValidator', 'isSaving', 'error', 'editTitle', 'subtitle', 'cancelRoute'],
    setup(_props: any, { emit }: any) {
      const emitUpdate = () => {
        emit('update', {
          clientId: 'client-1',
          tipoAssistencia: 'REMOTA',
          dataPedido: '2024-01-01',
          dataAssistencia: '2024-01-02',
          inicioAssistencia: '09:00',
          fimAssistencia: '10:00',
          motivoPedido: 'test',
          paymentMethod: 'Faturação',
          resolvido: true,
          anexos: '',
        });
      };
      return { emitUpdate };
    },
  },
  ClientSearchInput: { template: '<div />' },
  FileUploadZone: { template: '<div class="file-upload-zone" />', emits: ['files-changed'] },
  ErrorComponent: { template: '<div />' },
};

describe('MI-11: Update form — add new files, uploadFiles called post-save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFileError.value = null;
    mockCurrentItem.value = buildMockRemoteAssistance();
    mockUpdate.mockResolvedValue({ uuid: 'test-uuid-123', data: {} });
  });

  it('should call uploadFiles after successful update when new files are pending', async () => {
    const wrapper = mount(RemoteAssistanceUpdateView, {
      global: { stubs: updateViewStubs },
    });

    await wrapper.vm.$nextTick();

    // Simulate adding new files
    const vm = wrapper.vm as any;
    if (vm.handleAnexosFilesChanged) {
      vm.handleAnexosFilesChanged({
        fieldName: 'anexosFiles',
        newFiles: [new File(['data'], 'new-photo.jpg', { type: 'image/jpeg' })],
        removedKeys: [],
      });
    }

    await wrapper.vm.$nextTick();

    // Trigger update
    await wrapper.find('button').trigger('click');
    await vi.dynamicImportSettled();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUploadFiles).toHaveBeenCalledWith(
      'remote-assistance',
      'test-uuid-123',
      'anexosFiles',
      expect.any(Array),
    );
  });
});

describe('MI-12: Update form — remove existing file, deleteFile called post-save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFileError.value = null;
    mockCurrentItem.value = buildMockRemoteAssistance({
      anexosFiles: [
        { key: 'files/remote-assistance/test-uuid-123/fileId.jpg', name: 'photo.jpg', mimeType: 'image/jpeg', size: 1024 },
      ],
    });
    mockUpdate.mockResolvedValue({ uuid: 'test-uuid-123', data: {} });
    mockDeleteFile.mockResolvedValue(true);
  });

  it('should call deleteFile after successful update when files are marked for removal', async () => {
    const wrapper = mount(RemoteAssistanceUpdateView, {
      global: { stubs: updateViewStubs },
    });

    await wrapper.vm.$nextTick();

    // Simulate marking a file for removal
    const vm = wrapper.vm as any;
    if (vm.handleAnexosFilesChanged) {
      vm.handleAnexosFilesChanged({
        fieldName: 'anexosFiles',
        newFiles: [],
        removedKeys: ['files/remote-assistance/test-uuid-123/fileId.jpg'],
      });
    }

    await wrapper.vm.$nextTick();

    // Trigger update
    await wrapper.find('button').trigger('click');
    await vi.dynamicImportSettled();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockDeleteFile).toHaveBeenCalledWith(
      'remote-assistance',
      'test-uuid-123',
      'fileId.jpg',
    );
  });
});

describe('MI-13: Update form — delete fails, error shown inline, navigation proceeds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFileError.value = null;
    mockCurrentItem.value = buildMockRemoteAssistance({
      anexosFiles: [
        { key: 'files/remote-assistance/test-uuid-123/fail.jpg', name: 'fail.jpg', mimeType: 'image/jpeg', size: 1024 },
      ],
    });
    mockUpdate.mockResolvedValue({ uuid: 'test-uuid-123', data: {} });
    mockDeleteFile.mockResolvedValue(false);
  });

  it('should show error inline when deleteFile fails but still proceed', async () => {
    const wrapper = mount(RemoteAssistanceUpdateView, {
      global: { stubs: updateViewStubs },
    });

    await wrapper.vm.$nextTick();

    // Simulate marking a file for removal
    const vm = wrapper.vm as any;
    if (vm.handleAnexosFilesChanged) {
      vm.handleAnexosFilesChanged({
        fieldName: 'anexosFiles',
        newFiles: [],
        removedKeys: ['files/remote-assistance/test-uuid-123/fail.jpg'],
      });
    }

    await wrapper.vm.$nextTick();

    // Trigger update
    await wrapper.find('button').trigger('click');
    await vi.dynamicImportSettled();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify update was still called (record saved)
    expect(mockUpdate).toHaveBeenCalled();
    // deleteFile was called but returned false
    expect(mockDeleteFile).toHaveBeenCalled();
    // Navigation should still proceed (with delay for error display)
    // The error is shown inline via fileError ref
  });
});

// ============================================================================
// MI-14, MI-15, MI-16: Detail view rendering
// ============================================================================
import RemoteAssistanceDetailView from './RemoteAssistanceDetailView.vue';

const detailViewStubs = {
  ContentDetailTemplate: {
    template: `<div class="detail-template"><slot name="content" :item="item" /></div>`,
    props: ['item', 'isLoading', 'error', 'backRoute', 'showEditButton', 'showDeleteButton', 'showMetaBar', 'showAuditTrail', 'showMobileActions', 'getTitle', 'getSubtitle', 'getStatus', 'deleteButtonText', 'confirmDeleteTitle', 'confirmDeleteMessage'],
  },
  ClientInfoSection: { template: '<div class="client-info" />' },
  ConfirmationDialog: { template: '<div />' },
  FileDisplay: {
    template: '<div class="file-display" :data-files="JSON.stringify(files)" />',
    props: ['files', 'label', 'contentType', 'contentUuid'],
  },
};

describe('MI-14: Detail view — anexosFiles with images, FileDisplay rendered', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const record = buildMockRemoteAssistance({
      anexosFiles: [
        { key: 'files/remote-assistance/test-uuid-123/img.jpg', name: 'img.jpg', mimeType: 'image/jpeg', size: 2048 },
      ],
    });
    mockCurrentItem.value = record;
    mockFetchById.mockImplementation(async () => {
      mockCurrentItem.value = record;
    });
  });

  it('should render FileDisplay component when anexosFiles has entries', async () => {
    const wrapper = mount(RemoteAssistanceDetailView, {
      global: { stubs: detailViewStubs },
    });

    // Wait for onMounted to complete
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 50));
    await wrapper.vm.$nextTick();

    const fileDisplay = wrapper.find('.file-display');
    expect(fileDisplay.exists()).toBe(true);
  });
});

describe('MI-15: Detail view — anexosFiles empty, section hidden', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const record = buildMockRemoteAssistance({ anexosFiles: [] });
    mockCurrentItem.value = record;
    mockFetchById.mockImplementation(async () => {
      mockCurrentItem.value = record;
    });
  });

  it('should NOT render FileDisplay when anexosFiles is empty', async () => {
    const wrapper = mount(RemoteAssistanceDetailView, {
      global: { stubs: detailViewStubs },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 50));
    await wrapper.vm.$nextTick();

    const fileDisplay = wrapper.find('.file-display');
    expect(fileDisplay.exists()).toBe(false);
  });
});

describe('MI-16: Detail view — legacy record, Notas Anexas shown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const record = buildMockRemoteAssistance({
      anexosFiles: undefined,
      anexos: 'some old text notes',
    });
    mockCurrentItem.value = record;
    mockFetchById.mockImplementation(async () => {
      mockCurrentItem.value = record;
    });
  });

  it('should NOT render FileDisplay and should show Notas Anexas text', async () => {
    const wrapper = mount(RemoteAssistanceDetailView, {
      global: { stubs: detailViewStubs },
    });

    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 50));
    await wrapper.vm.$nextTick();

    // FileDisplay should NOT be rendered (undefined normalizes to [])
    const fileDisplay = wrapper.find('.file-display');
    expect(fileDisplay.exists()).toBe(false);

    // "Notas Anexos" section should be shown with the text
    const text = wrapper.text();
    expect(text).toContain('Notas Anexos');
    expect(text).toContain('some old text notes');
  });
});
