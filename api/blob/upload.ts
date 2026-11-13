import { put } from '@vercel/blob';
import { sanitizeSegment, verifyVercelBlobAdmin } from './_auth.ts';

export async function POST(request: Request): Promise<Response> {
  try {
    const authorized = await verifyVercelBlobAdmin(request);
    if (!authorized) {
      return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return Response.json(
        { error: 'BLOB_READ_WRITE_TOKEN não configurado no ambiente.' },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const rawFilename =
      url.searchParams.get('filename') ||
      request.headers.get('x-blob-filename') ||
      `arquivo-${Date.now()}`;
    const rawFolder =
      url.searchParams.get('folder') ||
      request.headers.get('x-blob-folder') ||
      'uploads';
    const contentType = request.headers.get('content-type') || 'application/octet-stream';

    const bodyBuffer = await request.arrayBuffer();
    if (!bodyBuffer || bodyBuffer.byteLength === 0) {
      return Response.json({ error: 'Arquivo vazio.' }, { status: 400 });
    }

    const safeFolder = sanitizeSegment(rawFolder, 'uploads');
    const safeFile = sanitizeSegment(rawFilename, `arquivo-${Date.now()}`);
    const pathname = `${safeFolder}/${safeFile}`;

    const blob = await put(pathname, bodyBuffer, {
      access: 'public',
      token,
      contentType,
      addRandomSuffix: true,
    });

    return Response.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: bodyBuffer.byteLength,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Falha ao enviar para o Vercel Blob.' },
      { status: 500 }
    );
  }
}
