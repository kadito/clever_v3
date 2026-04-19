import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFileUpload } from './useFileUpload';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * MI-IT-13: uploadFiles sends correct multipart request and returns FileReference[]
   * Validates: Requirements REQ-01, REQ-05
   */
  it('MI-IT-13: uploadFiles sends correct POST multipart and returns FileReference[]', async () => {
    const fileRefs = [
      { key: 'files/work-sheets/uuid-1/f1.jpg', name: 'photo.jpg', mimeType: 'image/jpeg', size: 2_000_000 },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: fileRefs }),
    });

    const { uploadFiles, uploading, error } = useFileUpload();

    const file = new File(['x'.repeat(100)], 'photo.jpg', { type: 'image/jpeg' });

    // uploading should be false before call
    expect(uploading.value).toBe(false);

    const result = await uploadFiles('work-sheets', 'uuid-1', 'fotos_instalacao', [file]);

    // Verify fetch was called with correct URL and method
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/content/work-sheets/uuid-1/files');
    expect(options.method).toBe('POST');

    // Verify FormData contents
    const body = options.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('fieldName')).toBe('fotos_instalacao');
    expect(body.get('files')).toBeInstanceOf(File);

    // Verify return value
    expect(result).toEqual(fileRefs);

    // Verify states after completion
    expect(uploading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  /**
   * MI-IT-14: deleteFile sends DELETE request and returns true on success
   * Validates: Requirements REQ-04
   */
  it('MI-IT-14: deleteFile sends DELETE request and returns true', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { deleteFile, deleting, error } = useFileUpload();

    expect(deleting.value).toBe(false);

    const result = await deleteFile('work-sheets', 'uuid-1', 'f1.jpg');

    // Verify fetch was called with correct URL and method
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/content/work-sheets/uuid-1/files/f1.jpg');
    expect(options.method).toBe('DELETE');

    // Verify return value and states
    expect(result).toBe(true);
    expect(deleting.value).toBe(false);
    expect(error.value).toBeNull();
  });

  /**
   * MI-IT-15: getFileUrl returns correct URL without HTTP call
   * Validates: Requirements REQ-03
   */
  it('MI-IT-15: getFileUrl returns correct URL without HTTP call', () => {
    const { getFileUrl } = useFileUpload();

    const url = getFileUrl('work-sheets', 'uuid-1', 'f1.jpg');

    expect(url).toBe('/api/content/work-sheets/uuid-1/files/f1.jpg');
    // No fetch call should have been made
    expect(mockFetch).not.toHaveBeenCalled();
  });

  /**
   * MI-IT-16: uploadFiles handles network error with Portuguese error message
   * Validates: Requirements REQ-01
   */
  it('MI-IT-16: uploadFiles handles network error with Portuguese message', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const { uploadFiles, uploading, error } = useFileUpload();

    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const result = await uploadFiles('work-sheets', 'uuid-1', 'fotos', [file]);

    // Should return empty array on error
    expect(result).toEqual([]);

    // Should set Portuguese error message
    expect(error.value).toBe('Falha no upload. Tente novamente.');

    // uploading should be false after error
    expect(uploading.value).toBe(false);
  });
});
