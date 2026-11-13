import { del } from '@vercel/blob';
import { verifyVercelBlobAdmin } from './_auth.ts';

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

    const { url } = (await request.json()) as { url?: string };
    if (!url || !url.includes('.blob.vercel-storage.com/') || url.includes('/site-assets/')) {
      return Response.json({ ok: true, skipped: true });
    }

    await del(url, { token });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Erro ao remover arquivo do Vercel Blob.' },
      { status: 500 }
    );
  }
}
