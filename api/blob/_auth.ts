import fs from 'node:fs';
import path from 'node:path';

interface FirebaseConfigFile {
  apiKey?: string;
  projectId?: string;
  firestoreDatabaseId?: string;
}

let cachedConfig: FirebaseConfigFile | null = null;

function getFirebaseConfig(): FirebaseConfigFile | null {
  if (cachedConfig) return cachedConfig;
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
    cachedConfig = JSON.parse(raw) as FirebaseConfigFile;
    return cachedConfig;
  } catch {
    return null;
  }
}

export function sanitizeSegment(value: string, fallback: string): string {
  const cleaned = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
  return cleaned || fallback;
}

export async function verifyVercelBlobAdmin(request: Request): Promise<boolean> {
  const idToken = request.headers.get('x-firebase-id-token');
  if (!idToken) return false;
  const config = getFirebaseConfig();
  if (!config?.apiKey) return false;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(config.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return false;
    const data = (await res.json()) as {
      users?: Array<{ localId?: string; email?: string; emailVerified?: boolean }>;
    };
    const user = data.users?.[0];
    if (!user?.localId) return false;
    if (user.localId === '1Amp29n9LocEt1ezfjx5rC0USC92') return true;
    if (user.email?.toLowerCase() === 'admin@x.com') return true;
    if (user.emailVerified && user.email?.toLowerCase() === 'jessicaq2204@gmail.com') return true;

    if (config.projectId) {
      const dbId = config.firestoreDatabaseId || '(default)';
      const adminDocUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/${encodeURIComponent(dbId)}/documents/admins/${encodeURIComponent(user.localId)}`;
      const fsRes = await fetch(adminDocUrl, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (fsRes.ok) return true;
    }

    return false;
  } catch {
    return false;
  }
}
