import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { verifyVercelBlobAdmin } from './_auth.ts';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return Response.json(
        { error: 'BLOB_READ_WRITE_TOKEN não configurado no ambiente.' },
        { status: 500 }
      );
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async () => {
        const authorized = await verifyVercelBlobAdmin(request);
        if (!authorized) {
          throw new Error('Não autorizado para gerar token de upload.');
        }
        return {
          allowedContentTypes: [
            'image/webp',
            'image/jpeg',
            'image/png',
            'image/avif',
            'image/gif',
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/octet-stream',
          ],
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Upload finalized cleanly in Vercel Blob
      },
    });

    return Response.json(jsonResponse);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Falha no token Vercel Blob.' },
      { status: 400 }
    );
  }
}
