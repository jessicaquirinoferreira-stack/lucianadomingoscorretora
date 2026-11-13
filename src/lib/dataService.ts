import {
  auth,
  collection,
  db,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  handleFirestoreError,
  normalizeTimestamps,
  OperationType,
  query,
  serverTimestamp,
  setDoc,
  where,
} from './firebase.ts';
import {
  SEED_DEVELOPMENTS,
  SEED_LANDING_PAGES,
  SEED_LEADS,
  SEED_PROPERTIES,
  SEED_SETTINGS,
  SEED_TESTIMONIALS,
} from '../data/seedData.ts';
import type {
  Development,
  LandingPage,
  Lead,
  Property,
  SiteSettings,
  Testimonial,
} from '../types.ts';

export interface AppDataState {
  properties: Property[];
  developments: Development[];
  landingPages: LandingPage[];
  leads: Lead[];
  testimonials: Testimonial[];
  settings: SiteSettings;
}

const ADMIN_TOKEN_KEY = 'ld_admin_token';

export function getSavedAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function saveAdminToken(token: string | null) {
  if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function isFirebaseAdminActive(): boolean {
  return Boolean(auth.currentUser && auth.currentUser.emailVerified);
}

function authHeaders(): Record<string, string> {
  const token = getSavedAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (isFirebaseAdminActive()) headers['x-firebase-admin'] = 'true';
  return headers;
}

export async function loadPublicCatalog(): Promise<Omit<AppDataState, 'leads'>> {
  // Fetch from Express public store first for instant availability
  let serverCatalog: Omit<AppDataState, 'leads'> = {
    properties: SEED_PROPERTIES,
    developments: SEED_DEVELOPMENTS,
    landingPages: SEED_LANDING_PAGES,
    testimonials: SEED_TESTIMONIALS,
    settings: SEED_SETTINGS,
  };

  try {
    const res = await fetch('/api/public/store');
    if (res.ok) {
      serverCatalog = (await res.json()) as Omit<AppDataState, 'leads'>;
    }
  } catch {
    // Fallback to seed
  }

  // Merge/prefer live Firestore data when populated
  try {
    const [propsSnap, devsSnap, lpsSnap, testsSnap, settingsSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, 'properties'),
          where('status', 'in', ['Disponível', 'Reservado', 'Vendido'])
        )
      ),
      getDocs(
        query(
          collection(db, 'developments'),
          where('stage', 'in', ['Lançamento', 'Em Obras', 'Pronto para Morar'])
        )
      ),
      getDocs(query(collection(db, 'landing_pages'), where('status', '==', 'published'))),
      getDocs(query(collection(db, 'testimonials'), where('approved', '==', true))),
      getDoc(doc(db, 'settings', 'main')),
    ]);

    const fsProps = propsSnap.docs.map((d) => normalizeTimestamps(d.data() as Property));
    const fsDevs = devsSnap.docs.map((d) => normalizeTimestamps(d.data() as Development));
    const fsLps = lpsSnap.docs.map((d) => normalizeTimestamps(d.data() as LandingPage));
    const fsTests = testsSnap.docs.map((d) => normalizeTimestamps(d.data() as Testimonial));
    const fsSettings = settingsSnap.exists()
      ? normalizeTimestamps(settingsSnap.data() as SiteSettings)
      : null;

    return {
      properties: fsProps.length > 0 ? fsProps : serverCatalog.properties,
      developments: fsDevs.length > 0 ? fsDevs : serverCatalog.developments,
      landingPages: fsLps.length > 0 ? fsLps : serverCatalog.landingPages,
      testimonials: fsTests.length > 0 ? fsTests : serverCatalog.testimonials,
      settings: fsSettings ?? serverCatalog.settings,
    };
  } catch (err) {
    console.warn('Firestore public catalog fallback:', err);
    return serverCatalog;
  }
}

export async function loadAdminStore(): Promise<AppDataState> {
  let state: AppDataState = {
    properties: SEED_PROPERTIES,
    developments: SEED_DEVELOPMENTS,
    landingPages: SEED_LANDING_PAGES,
    leads: SEED_LEADS,
    testimonials: SEED_TESTIMONIALS,
    settings: SEED_SETTINGS,
  };

  const token = getSavedAdminToken();
  if (token) {
    try {
      const res = await fetch('/api/admin/store', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        state = (await res.json()) as AppDataState;
      }
    } catch {
      // ignore
    }
  }

  if (isFirebaseAdminActive()) {
    try {
      const [propsSnap, devsSnap, lpsSnap, leadsSnap, testsSnap, settingsSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, 'properties'),
            where('status', 'in', ['Disponível', 'Reservado', 'Vendido'])
          )
        ),
        getDocs(
          query(
            collection(db, 'developments'),
            where('stage', 'in', ['Lançamento', 'Em Obras', 'Pronto para Morar'])
          )
        ),
        getDocs(collection(db, 'landing_pages')),
        getDocs(collection(db, 'leads')),
        getDocs(collection(db, 'testimonials')),
        getDoc(doc(db, 'settings', 'main')),
      ]);

      // If Firestore is empty on first admin login, seed it automatically
      if (propsSnap.empty && devsSnap.empty) {
        await seedFirestoreFromStore(state);
      } else {
        state = {
          properties: propsSnap.docs.map((d) => normalizeTimestamps(d.data() as Property)),
          developments: devsSnap.docs.map((d) => normalizeTimestamps(d.data() as Development)),
          landingPages: lpsSnap.docs.map((d) => normalizeTimestamps(d.data() as LandingPage)),
          leads: leadsSnap.docs.map((d) => normalizeTimestamps(d.data() as Lead)),
          testimonials: testsSnap.docs.map((d) => normalizeTimestamps(d.data() as Testimonial)),
          settings: settingsSnap.exists()
            ? normalizeTimestamps(settingsSnap.data() as SiteSettings)
            : state.settings,
        };
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('permission')) {
        handleFirestoreError(err, OperationType.LIST, 'admin_store');
      }
    }
  }

  return state;
}

export async function seedFirestoreFromStore(store: AppDataState): Promise<void> {
  if (!isFirebaseAdminActive()) return;

  for (const p of store.properties) {
    try {
      await setDoc(doc(db, 'properties', p.id), {
        ...p,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `properties/${p.id}`);
    }
  }

  for (const d of store.developments) {
    try {
      await setDoc(doc(db, 'developments', d.id), {
        ...d,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `developments/${d.id}`);
    }
  }

  for (const lp of store.landingPages) {
    try {
      await setDoc(doc(db, 'landing_pages', lp.id), {
        ...lp,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `landing_pages/${lp.id}`);
    }
  }

  for (const t of store.testimonials) {
    try {
      await setDoc(doc(db, 'testimonials', t.id), {
        ...t,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `testimonials/${t.id}`);
    }
  }

  try {
    await setDoc(doc(db, 'settings', 'main'), {
      ...store.settings,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/main');
  }
}

export async function persistFullAdminStore(store: AppDataState): Promise<void> {
  const token = getSavedAdminToken();
  if (token) {
    await fetch('/api/admin/store', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(store),
    });
  }
}

export async function upsertProperty(
  property: Property,
  isNew: boolean,
  fullStore: AppDataState
): Promise<AppDataState> {
  const nextProps = isNew
    ? [property, ...fullStore.properties]
    : fullStore.properties.map((p) => (p.id === property.id ? property : p));
  const nextStore = { ...fullStore, properties: nextProps };

  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      const existingSnap = await getDoc(doc(db, 'properties', property.id));
      await setDoc(doc(db, 'properties', property.id), {
        ...property,
        createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        isNew ? OperationType.CREATE : OperationType.UPDATE,
        `properties/${property.id}`
      );
    }
  }

  return nextStore;
}

export async function removeProperty(id: string, fullStore: AppDataState): Promise<AppDataState> {
  const nextStore = {
    ...fullStore,
    properties: fullStore.properties.filter((p) => p.id !== id),
  };
  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      await deleteDoc(doc(db, 'properties', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `properties/${id}`);
    }
  }
  return nextStore;
}

export async function upsertDevelopment(
  dev: Development,
  isNew: boolean,
  fullStore: AppDataState
): Promise<AppDataState> {
  const nextDevs = isNew
    ? [dev, ...fullStore.developments]
    : fullStore.developments.map((d) => (d.id === dev.id ? dev : d));
  const nextStore = { ...fullStore, developments: nextDevs };

  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      const existingSnap = await getDoc(doc(db, 'developments', dev.id));
      await setDoc(doc(db, 'developments', dev.id), {
        ...dev,
        createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        isNew ? OperationType.CREATE : OperationType.UPDATE,
        `developments/${dev.id}`
      );
    }
  }

  return nextStore;
}

export async function upsertLandingPage(
  lp: LandingPage,
  isNew: boolean,
  fullStore: AppDataState
): Promise<AppDataState> {
  const nextLps = isNew
    ? [lp, ...fullStore.landingPages.filter((x) => x.id !== lp.id)]
    : fullStore.landingPages.map((x) => (x.id === lp.id ? lp : x));
  const nextStore = { ...fullStore, landingPages: nextLps };

  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      const existingSnap = await getDoc(doc(db, 'landing_pages', lp.id));
      await setDoc(doc(db, 'landing_pages', lp.id), {
        ...lp,
        createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        isNew ? OperationType.CREATE : OperationType.UPDATE,
        `landing_pages/${lp.id}`
      );
    }
  }

  return nextStore;
}

export async function removeLandingPage(id: string, fullStore: AppDataState): Promise<AppDataState> {
  const nextStore = {
    ...fullStore,
    landingPages: fullStore.landingPages.filter((x) => x.id !== id),
  };
  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      await deleteDoc(doc(db, 'landing_pages', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `landing_pages/${id}`);
    }
  }
  return nextStore;
}

export async function submitPublicLead(
  payload: Omit<Lead, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<Lead> {
  const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Persist to Express backend
  const res = await fetch('/api/public/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, id }),
  });

  const saved = res.ok
    ? ((await res.json()) as Lead)
    : {
        ...payload,
        id,
        status: 'Novo' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

  // Also write directly to Firestore `leads` collection (allowed publicly for `create` with status 'Novo')
  try {
    await setDoc(doc(db, 'leads', id), {
      id,
      name: payload.name.slice(0, 120),
      whatsapp: payload.whatsapp.slice(0, 40),
      email: (payload.email ?? '').slice(0, 160),
      message: (payload.message ?? '').slice(0, 2000),
      source: payload.source,
      referenceId: (payload.referenceId ?? '').slice(0, 128),
      referenceTitle: (payload.referenceTitle ?? '').slice(0, 180),
      status: 'Novo',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore public lead write note:', err);
  }

  return saved;
}

export async function updateLeadStatus(
  lead: Lead,
  fullStore: AppDataState
): Promise<AppDataState> {
  const nextStore = {
    ...fullStore,
    leads: fullStore.leads.map((l) => (l.id === lead.id ? lead : l)),
  };
  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      const existingSnap = await getDoc(doc(db, 'leads', lead.id));
      if (existingSnap.exists()) {
        await setDoc(doc(db, 'leads', lead.id), {
          ...existingSnap.data(),
          status: lead.status,
          message: lead.message ?? '',
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leads/${lead.id}`);
    }
  }
  return nextStore;
}

export async function upsertTestimonial(
  item: Testimonial,
  isNew: boolean,
  fullStore: AppDataState
): Promise<AppDataState> {
  const nextList = isNew
    ? [item, ...fullStore.testimonials]
    : fullStore.testimonials.map((t) => (t.id === item.id ? item : t));
  const nextStore = { ...fullStore, testimonials: nextList };
  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      const existingSnap = await getDoc(doc(db, 'testimonials', item.id));
      await setDoc(doc(db, 'testimonials', item.id), {
        ...item,
        createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(
        err,
        isNew ? OperationType.CREATE : OperationType.UPDATE,
        `testimonials/${item.id}`
      );
    }
  }
  return nextStore;
}

export async function removeTestimonial(id: string, fullStore: AppDataState): Promise<AppDataState> {
  const nextStore = {
    ...fullStore,
    testimonials: fullStore.testimonials.filter((t) => t.id !== id),
  };
  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      await deleteDoc(doc(db, 'testimonials', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `testimonials/${id}`);
    }
  }
  return nextStore;
}

export async function saveSiteSettings(
  settings: SiteSettings,
  fullStore: AppDataState
): Promise<AppDataState> {
  const nextStore = { ...fullStore, settings };
  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      await setDoc(doc(db, 'settings', 'main'), {
        ...settings,
        id: 'main',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/main');
    }
  }
  return nextStore;
}

export async function generateAiLandingPageCopy(development: Development) {
  const res = await fetch('/api/ai/generate-landing-page', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ development }),
  });
  if (!res.ok) {
    throw new Error('Não foi possível gerar a Landing Page automaticamente.');
  }
  return res.json();
}
