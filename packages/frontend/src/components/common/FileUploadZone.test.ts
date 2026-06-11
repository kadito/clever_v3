import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import FileUploadZone from './FileUploadZone.vue';
import type { FileReference } from '@clever/shared';

// Mock URL.createObjectURL / revokeObjectURL
const mockCreateObjectURL = vi.fn((blob: Blob) => `blob:mock-${Math.random()}`);
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  vi.stubGlobal('URL', {
    ...globalThis.URL,
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createMockFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

/** Simulate setting files on an input element by directly calling the handler */
async function simulateFileSelect(wrapper: ReturnType<typeof mount>, files: File[]): Promise<void> {
  const input = wrapper.find('input[type="file"]');
  const inputEl = input.element as HTMLInputElement;

  // Create a minimal FileList-like object
  const fileList = {
    length: files.length,
    item: (i: number) => files[i] || null,
    *[Symbol.iterator] () {
      for (let i = 0; i < files.length; i++) yield files[i];
    },
  } as unknown as FileList;

  // Assign files and trigger change
  Object.defineProperty(inputEl, 'files', { value: fileList, writable: true, configurable: true });
  await input.trigger('change');
}

const defaultProps = {
  fieldName: 'fotos_instalacao',
  label: 'Fotos da Instalação',
};

/**
 * MI-IT-17: Selecção de ficheiro válido emite evento
 * Validates: Requirements REQ-01
 */
describe('MI-IT-17: Valid file selection emits files-changed', () => {
  it('emits files-changed with newFiles when a valid JPG is selected', async () => {
    const wrapper = mount(FileUploadZone, { props: defaultProps });

    const file = createMockFile('photo.jpg', 2 * 1024 * 1024, 'image/jpeg');
    await simulateFileSelect(wrapper, [file]);

    const emitted = wrapper.emitted('files-changed');
    expect(emitted).toBeTruthy();
    expect(emitted!.length).toBe(1);

    const payload = emitted![0][0] as { fieldName: string; newFiles: File[]; removedKeys: string[] };
    expect(payload.fieldName).toBe('fotos_instalacao');
    expect(payload.newFiles).toHaveLength(1);
    expect(payload.newFiles[0].name).toBe('photo.jpg');
    expect(payload.removedKeys).toHaveLength(0);
  });
});

/**
 * MI-IT-18: Rejeição de ficheiro com tipo inválido
 * Validates: Requirements REQ-01
 */
describe('MI-IT-18: Invalid file type is rejected with inline error', () => {
  it('does not emit files-changed and shows error for .exe file', async () => {
    const wrapper = mount(FileUploadZone, { props: defaultProps });

    const file = createMockFile('malware.exe', 1024, 'application/x-msdownload');
    await simulateFileSelect(wrapper, [file]);

    const emitted = wrapper.emitted('files-changed');
    expect(emitted).toBeUndefined();

    // Error message should be visible
    const errorText = wrapper.text();
    expect(errorText).toContain('malware.exe');
    expect(errorText).toContain('Tipo de ficheiro não suportado');
  });
});

/**
 * MI-IT-19: Rejeição de ficheiro > 10 MB
 * Validates: Requirements REQ-01
 */
describe('MI-IT-19: File exceeding 10 MB is rejected with inline error', () => {
  it('does not emit files-changed and shows size error for 15 MB file', async () => {
    const wrapper = mount(FileUploadZone, { props: defaultProps });

    const file = createMockFile('huge.jpg', 15 * 1024 * 1024, 'image/jpeg');
    await simulateFileSelect(wrapper, [file]);

    const emitted = wrapper.emitted('files-changed');
    expect(emitted).toBeUndefined();

    const errorText = wrapper.text();
    expect(errorText).toContain('huge.jpg');
    expect(errorText).toContain('tamanho máximo de 10 MB');
  });
});

/**
 * MI-IT-20: Pré-visualização de imagem
 * Validates: Requirements REQ-02
 */
describe('MI-IT-20: Image preview via URL.createObjectURL', () => {
  it('calls URL.createObjectURL and shows thumbnail for PNG file', async () => {
    const wrapper = mount(FileUploadZone, { props: defaultProps });

    const file = createMockFile('photo.png', 500_000, 'image/png');
    await simulateFileSelect(wrapper, [file]);

    expect(mockCreateObjectURL).toHaveBeenCalled();

    // Should have an img element with the blob URL
    const imgs = wrapper.findAll('img');
    const previewImg = imgs.find(img => img.attributes('src')?.startsWith('blob:'));
    expect(previewImg).toBeTruthy();
    expect(previewImg!.attributes('alt')).toBe('photo.png');
  });
});

/**
 * MI-IT-21: Marcação de ficheiro existente para remoção
 * Validates: Requirements REQ-04
 */
describe('MI-IT-21: Marking existing file for removal', () => {
  it('emits files-changed with removedKeys when remove button is clicked', async () => {
    const existingFile: FileReference = {
      key: 'files/installations-programming/uuid-123/file1.jpg',
      name: 'existing-photo.jpg',
      mimeType: 'image/jpeg',
      size: 1_000_000,
    };

    const wrapper = mount(FileUploadZone, {
      props: {
        ...defaultProps,
        existingFiles: [existingFile],
      },
    });

    // Find the remove button for the existing file
    const removeBtn = wrapper.find('button[aria-label="Remover existing-photo.jpg"]');
    expect(removeBtn.exists()).toBe(true);

    await removeBtn.trigger('click');

    const emitted = wrapper.emitted('files-changed');
    expect(emitted).toBeTruthy();
    expect(emitted!.length).toBe(1);

    const payload = emitted![0][0] as { fieldName: string; newFiles: File[]; removedKeys: string[] };
    expect(payload.removedKeys).toContain(existingFile.key);
    expect(payload.newFiles).toHaveLength(0);
  });
});

/**
 * MI-IT-22: Modo singular substitui ficheiro existente
 * Validates: Requirements REQ-01
 */
describe('MI-IT-22: Single mode replaces existing file', () => {
  it('marks old file for removal and adds new file when multiple=false', async () => {
    const existingFile: FileReference = {
      key: 'files/installations-programming/uuid-123/old-photo.jpg',
      name: 'old-photo.jpg',
      mimeType: 'image/jpeg',
      size: 500_000,
    };

    const wrapper = mount(FileUploadZone, {
      props: {
        ...defaultProps,
        multiple: false,
        existingFiles: [existingFile],
      },
    });

    const newFile = createMockFile('new-photo.jpg', 2 * 1024 * 1024, 'image/jpeg');
    await simulateFileSelect(wrapper, [newFile]);

    const emitted = wrapper.emitted('files-changed');
    expect(emitted).toBeTruthy();

    const payload = emitted![emitted!.length - 1][0] as { fieldName: string; newFiles: File[]; removedKeys: string[] };
    expect(payload.removedKeys).toContain(existingFile.key);
    expect(payload.newFiles).toHaveLength(1);
    expect(payload.newFiles[0].name).toBe('new-photo.jpg');
  });
});
