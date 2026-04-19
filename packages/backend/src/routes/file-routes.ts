/**
 * File upload, download, and deletion routes.
 * Generic for any content type — works with R2 storage.
 * Design ref: API — Endpoints de Ficheiros (design.md#3)
 * Covers: REQ-01, REQ-03, REQ-04, REQ-05
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { requireUserContext } from '../middleware/clerk';
import { validateFile, ACCEPTED_MIME_TYPES, MAX_FILE_SIZE } from '@clever/shared';
import type { FileReference } from '@clever/shared';
import type { StorageBucket, StorageObject } from '@clever/shared';

/** R2 bucket interface extended for binary operations (actual R2 supports ArrayBuffer) */
interface R2BucketLike {
  get(key: string): Promise<R2ObjectLike | null>;
  put(
    key: string,
    value: ArrayBuffer | string,
    options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
}

interface R2ObjectLike {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  json(): Promise<unknown>;
}

/**
 * Extract file extension from filename.
 * Returns lowercase extension without dot, or empty string.
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

const fileRoutes = new Hono();

/**
 * POST /api/content/:type/:uuid/files
 * Upload one or more files via multipart/form-data.
 * Form fields: files (File[]), fieldName (string)
 */
fileRoutes.post('/:type/:uuid/files', async (c: Context) => {
  const user = requireUserContext(c);
  const type = c.req.param('type');
  const uuid = c.req.param('uuid');
  const r2 = c.env?.R2_BUCKET as R2BucketLike;

  if (!r2) {
    return c.json({ success: false, error: { code: 500, message: 'Storage not available' } }, 500);
  }

  // Parse multipart form data
  const formData = await c.req.formData().catch(() => null);
  if (!formData) {
    return c.json(
      { success: false, error: { code: 400, message: 'Formato de dados inválido' } },
      400
    );
  }

  const fieldName = formData.get('fieldName');
  if (!fieldName || typeof fieldName !== 'string') {
    return c.json(
      { success: false, error: { code: 400, message: "Campo 'fieldName' é obrigatório" } },
      400
    );
  }

  const files = formData.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return c.json(
      { success: false, error: { code: 400, message: 'Nenhum ficheiro enviado' } },
      400
    );
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile({ name: file.name, type: file.type, size: file.size });
    if (!result.valid) {
      // Return specific error messages per design
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        return c.json(
          {
            success: false,
            error: { code: 400, message: `Tipo de ficheiro não suportado: ${file.type}` },
          },
          400
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return c.json(
          {
            success: false,
            error: { code: 400, message: 'O ficheiro excede o tamanho máximo de 10 MB' },
          },
          400
        );
      }
    }
  }

  // Check content exists
  const contentKey = `content/${type}/${uuid}.json`;
  const contentObj = await r2.get(contentKey);
  if (!contentObj) {
    return c.json(
      { success: false, error: { code: 404, message: 'Conteúdo não encontrado' } },
      404
    );
  }

  const content = (await contentObj.json()) as Record<string, unknown> & {
    data: Record<string, unknown>;
    version: number;
    updatedAt: string;
    updatedBy: string;
  };

  if ((content as Record<string, unknown>).isDeleted) {
    return c.json(
      { success: false, error: { code: 404, message: 'Conteúdo não encontrado' } },
      404
    );
  }

  // Upload each file to R2 and build FileReference array
  const created: FileReference[] = [];

  for (const file of files) {
    const fileId = crypto.randomUUID();
    const ext = getExtension(file.name);
    const fileKey = ext ? `${fileId}.${ext}` : fileId;
    const r2Key = `files/${type}/${uuid}/${fileKey}`;

    const buffer = await file.arrayBuffer();
    await r2.put(r2Key, buffer, {
      httpMetadata: { contentType: file.type },
    });

    created.push({
      key: r2Key,
      name: file.name,
      mimeType: file.type,
      size: file.size,
    });
  }

  // Update content data — add FileReferences to the indicated field
  // Support dot-notation for nested fields (e.g., "phase5.fotoURL")
  const data = content.data;
  const fieldParts = (fieldName as string).split('.');
  let target: Record<string, unknown> = data;
  for (let i = 0; i < fieldParts.length - 1; i++) {
    const part = fieldParts[i];
    if (target[part] && typeof target[part] === 'object' && !Array.isArray(target[part])) {
      target = target[part] as Record<string, unknown>;
    } else {
      // Create intermediate object if it doesn't exist
      target[part] = {};
      target = target[part] as Record<string, unknown>;
    }
  }
  const leafField = fieldParts[fieldParts.length - 1];
  const existing = target[leafField];

  if (Array.isArray(existing)) {
    target[leafField] = [...existing, ...created];
  } else if (existing === null || existing === undefined) {
    // If field doesn't exist yet, decide based on count
    target[leafField] = created.length === 1 ? created[0] : created;
  } else {
    // Single value field — replace with latest
    target[leafField] = created.length === 1 ? created[0] : created;
  }

  // Save updated content (increment version)
  const now = new Date().toISOString();
  content.version = (content.version || 1) + 1;
  content.updatedAt = now;
  content.updatedBy = user.userId;

  await r2.put(contentKey, JSON.stringify(content, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });

  return c.json({ success: true, data: created });
});

/**
 * GET /api/content/:type/:uuid/files/:fileKey
 * Download a file — serves binary with correct Content-Type.
 */
fileRoutes.get('/:type/:uuid/files/:fileKey', async (c: Context) => {
  const type = c.req.param('type');
  const uuid = c.req.param('uuid');
  const fileKey = c.req.param('fileKey');
  const r2 = c.env?.R2_BUCKET as R2BucketLike;

  if (!r2) {
    return c.json({ success: false, error: { code: 500, message: 'Storage not available' } }, 500);
  }

  const r2Key = `files/${type}/${uuid}/${fileKey}`;
  const obj = await r2.get(r2Key);

  if (!obj) {
    return c.json(
      { success: false, error: { code: 404, message: 'Ficheiro não encontrado' } },
      404
    );
  }

  const contentType = obj.httpMetadata?.contentType || 'application/octet-stream';

  return new Response(obj.body, {
    status: 200,
    headers: { 'Content-Type': contentType },
  });
});

/**
 * DELETE /api/content/:type/:uuid/files/:fileKey
 * Delete a file from R2 and remove its reference from content data.
 */
fileRoutes.delete('/:type/:uuid/files/:fileKey', async (c: Context) => {
  const user = requireUserContext(c);
  const type = c.req.param('type');
  const uuid = c.req.param('uuid');
  const fileKey = c.req.param('fileKey');
  const r2 = c.env?.R2_BUCKET as R2BucketLike;

  if (!r2) {
    return c.json({ success: false, error: { code: 500, message: 'Storage not available' } }, 500);
  }

  const r2Key = `files/${type}/${uuid}/${fileKey}`;

  // Check file exists before deleting
  const obj = await r2.get(r2Key);
  if (!obj) {
    return c.json(
      { success: false, error: { code: 404, message: 'Ficheiro não encontrado' } },
      404
    );
  }

  // Delete from R2
  await r2.delete(r2Key);

  // Update content data — remove matching FileReference
  const contentKey = `content/${type}/${uuid}.json`;
  const contentObj = await r2.get(contentKey);

  if (contentObj) {
    const content = (await contentObj.json()) as Record<string, unknown> & {
      data: Record<string, unknown>;
      version: number;
      updatedAt: string;
      updatedBy: string;
    };

    const data = content.data;

    // Recursively search all fields in data for the matching FileReference
    const removeFileRef = (obj: Record<string, unknown>): void => {
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (Array.isArray(val)) {
          const filtered = val.filter(
            (item: unknown) =>
              typeof item === 'object' &&
              item !== null &&
              (item as FileReference).key !== r2Key
          );
          if (filtered.length !== val.length) {
            obj[key] = filtered;
          }
        } else if (
          typeof val === 'object' &&
          val !== null &&
          'key' in (val as Record<string, unknown>) &&
          (val as FileReference).key === r2Key
        ) {
          obj[key] = null;
        } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          // Recurse into nested objects
          removeFileRef(val as Record<string, unknown>);
        }
      }
    };
    removeFileRef(data);

    // Save updated content
    const now = new Date().toISOString();
    content.version = (content.version || 1) + 1;
    content.updatedAt = now;
    content.updatedBy = user.userId;

    await r2.put(contentKey, JSON.stringify(content, null, 2), {
      httpMetadata: { contentType: 'application/json' },
    });
  }

  return c.json({ success: true });
});

export default fileRoutes;
