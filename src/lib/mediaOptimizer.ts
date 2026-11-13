import { upload } from '@vercel/blob/client';
import { auth } from './firebase.ts';
import { getSavedAdminToken, isFirebaseAdminActive } from './dataService.ts';

export interface OptimizedImageResult {
  file: File;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  savingsPercent: number;
}

export interface UploadedBlobMedia {
  url: string;
  name: string;
  size: number;
  contentType: string;
  originalSize: number;
  optimizedSize: number;
  savingsPercent: number;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

async function loadImageSource(
  file: File
): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; cleanup: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fallback to HTMLImageElement
    }
  }

  const objectUrl = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Falha ao decodificar a imagem.'));
    el.src = objectUrl;
  });

  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    cleanup: () => URL.revokeObjectURL(objectUrl),
  };
}

/**
 * Re-encodes any uploaded photo via HTML5 Canvas to crisp WebP (or high-efficiency JPEG fallback)
 * at the smallest possible file size while preserving architectural sharpness and color fidelity.
 */
export async function optimizeImageForWeb(
  file: File,
  maxDimension = 1920
): Promise<OptimizedImageResult> {
  const originalSize = file.size;
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return {
      file,
      originalSize,
      optimizedSize: originalSize,
      width: 0,
      height: 0,
      savingsPercent: 0,
    };
  }

  let source: Awaited<ReturnType<typeof loadImageSource>> | null = null;
  try {
    source = await loadImageSource(file);
    const scale = Math.min(1, maxDimension / Math.max(source.width, source.height, 1));
    const targetW = Math.max(1, Math.round(source.width * scale));
    const targetH = Math.max(1, Math.round(source.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        file,
        originalSize,
        optimizedSize: originalSize,
        width: source.width,
        height: source.height,
        savingsPercent: 0,
      };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    source.draw(ctx, targetW, targetH);

    // Try progressive WebP quality thresholds to get smallest clean file without losing visible quality
    let bestBlob = await canvasToBlob(canvas, 'image/webp', 0.82);
    let targetMime = 'image/webp';
    let targetExt = 'webp';

    if (!bestBlob || bestBlob.type !== 'image/webp') {
      bestBlob = await canvasToBlob(canvas, 'image/jpeg', 0.82);
      targetMime = 'image/jpeg';
      targetExt = 'jpg';
    } else {
      if (bestBlob.size > 320 * 1024) {
        const q76 = await canvasToBlob(canvas, 'image/webp', 0.76);
        if (q76 && q76.size < bestBlob.size) bestBlob = q76;
      }
      if (bestBlob.size > 460 * 1024) {
        const q70 = await canvasToBlob(canvas, 'image/webp', 0.7);
        if (q70 && q70.size < bestBlob.size) bestBlob = q70;
      }
    }

    if (!bestBlob) {
      return {
        file,
        originalSize,
        optimizedSize: originalSize,
        width: targetW,
        height: targetH,
        savingsPercent: 0,
      };
    }

    // Only keep original if it's already a tiny compressed WebP smaller than re-encoded output
    if (file.type === 'image/webp' && file.size <= bestBlob.size && scale === 1) {
      return {
        file,
        originalSize,
        optimizedSize: file.size,
        width: targetW,
        height: targetH,
        savingsPercent: 0,
      };
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || `foto-${Date.now()}`;
    const optimizedFile = new File([bestBlob], `${baseName}.${targetExt}`, {
      type: targetMime,
      lastModified: Date.now(),
    });

    const savingsPercent =
      originalSize > 0
        ? Math.max(0, Math.round(((originalSize - optimizedFile.size) / originalSize) * 100))
        : 0;

    return {
      file: optimizedFile,
      originalSize,
      optimizedSize: optimizedFile.size,
      width: targetW,
      height: targetH,
      savingsPercent,
    };
  } finally {
    source?.cleanup();
  }
}

async function getBlobUploadHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...(extra || {}) };
  const token = getSavedAdminToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (isFirebaseAdminActive()) headers['x-firebase-admin'] = 'true';
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (idToken) headers['x-firebase-id-token'] = idToken;
  } catch {
    // ignore
  }
  return headers;
}

export async function uploadMediaToBlob(
  rawFile: File,
  folder: string,
  options?: { maxDimension?: number }
): Promise<UploadedBlobMedia> {
  const isImage = rawFile.type.startsWith('image/');
  const optimization = isImage
    ? await optimizeImageForWeb(rawFile, options?.maxDimension ?? 1920)
    : {
        file: rawFile,
        originalSize: rawFile.size,
        optimizedSize: rawFile.size,
        width: 0,
        height: 0,
        savingsPercent: 0,
      };

  const fileToUpload = optimization.file;
  const headers = await getBlobUploadHeaders({
    'Content-Type': fileToUpload.type || 'application/octet-stream',
    'x-blob-filename': encodeURIComponent(fileToUpload.name),
    'x-blob-folder': folder,
  });

  const directUrl = `/api/blob/upload?filename=${encodeURIComponent(fileToUpload.name)}&folder=${encodeURIComponent(folder)}`;
  const res = await fetch(directUrl, {
    method: 'POST',
    headers,
    body: fileToUpload,
  });

  const ct = res.headers.get('content-type') || '';
  if (res.ok && ct.includes('application/json')) {
    const data = (await res.json()) as { url: string; contentType?: string; size?: number };
    return {
      url: data.url,
      name: rawFile.name,
      size: fileToUpload.size,
      contentType: data.contentType || fileToUpload.type,
      originalSize: optimization.originalSize,
      optimizedSize: optimization.optimizedSize,
      savingsPercent: optimization.savingsPercent,
    };
  }

  // Large files on Vercel Serverless (>4.5MB) seamlessly use @vercel/blob/client direct upload
  if (res.status === 413 || !res.ok) {
    const clientHeaders = await getBlobUploadHeaders();
    const safeName = fileToUpload.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
    const blob = await upload(`${folder}/${safeName}`, fileToUpload, {
      access: 'public',
      handleUploadUrl: '/api/blob/client-upload',
      headers: clientHeaders,
    });
    return {
      url: blob.url,
      name: rawFile.name,
      size: fileToUpload.size,
      contentType: blob.contentType || fileToUpload.type,
      originalSize: optimization.originalSize,
      optimizedSize: optimization.optimizedSize,
      savingsPercent: optimization.savingsPercent,
    };
  }

  const errText = await res.text().catch(() => 'Falha ao enviar arquivo.');
  throw new Error(errText || 'Falha ao enviar arquivo para o Vercel Blob.');
}

export async function deleteBlobAsset(url: string): Promise<void> {
  if (!url || !url.includes('.blob.vercel-storage.com/') || url.includes('/site-assets/')) {
    return;
  }
  try {
    const headers = await getBlobUploadHeaders({ 'Content-Type': 'application/json' });
    await fetch('/api/blob/delete', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });
  } catch {
    // Non-blocking cleanup
  }
}
