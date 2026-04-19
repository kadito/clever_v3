import { ref } from 'vue';
import type { FileReference } from '@clever/shared';

interface FileUploadReturn {
  uploading: ReturnType<typeof ref<boolean>>;
  deleting: ReturnType<typeof ref<boolean>>;
  error: ReturnType<typeof ref<string | null>>;
  uploadFiles: (contentType: string, uuid: string, fieldName: string, files: File[]) => Promise<FileReference[]>;
  deleteFile: (contentType: string, uuid: string, fileKey: string) => Promise<boolean>;
  getFileUrl: (contentType: string, uuid: string, fileKey: string) => string;
  clearError: () => void;
}

export function useFileUpload(): FileUploadReturn {
  const uploading = ref(false);
  const deleting = ref(false);
  const error = ref<string | null>(null);

  const clearError = (): void => {
    error.value = null;
  };

  const uploadFiles = async (
    contentType: string,
    uuid: string,
    fieldName: string,
    files: File[],
  ): Promise<FileReference[]> => {
    uploading.value = true;
    error.value = null;

    const formData = new FormData();
    formData.append('fieldName', fieldName);
    for (const file of files) {
      formData.append('files', file);
    }

    const result = await fetch(`/api/content/${contentType}/${uuid}/files`, {
      method: 'POST',
      body: formData,
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json() as { error?: { message?: string } };
          throw new Error(body.error?.message ?? 'Upload failed');
        }
        const json = (await response.json()) as { data: FileReference[] };
        console.log('Upload response:', JSON.stringify(json, null, 2));
        return json.data;
      })
      .catch((err: Error) => {
        console.error('Upload error:', JSON.stringify({ message: err.message }, null, 2));
        error.value = 'Falha no upload. Tente novamente.';
        return [] as FileReference[];
      })
      .finally(() => {
        uploading.value = false;
      });

    return result;
  };

  const deleteFile = async (
    contentType: string,
    uuid: string,
    fileKey: string,
  ): Promise<boolean> => {
    deleting.value = true;
    error.value = null;

    const result = await fetch(`/api/content/${contentType}/${uuid}/files/${fileKey}`, {
      method: 'DELETE',
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json() as { error?: { message?: string } };
          throw new Error(body.error?.message ?? 'Delete failed');
        }
        return true;
      })
      .catch((err: Error) => {
        console.error('Delete error:', JSON.stringify({ message: err.message }, null, 2));
        error.value = 'Não foi possível eliminar o ficheiro.';
        return false;
      })
      .finally(() => {
        deleting.value = false;
      });

    return result;
  };

  const getFileUrl = (contentType: string, uuid: string, fileKey: string): string => {
    return `/api/content/${contentType}/${uuid}/files/${fileKey}`;
  };

  return {
    uploading,
    deleting,
    error,
    uploadFiles,
    deleteFile,
    getFileUrl,
    clearError,
  };
}
