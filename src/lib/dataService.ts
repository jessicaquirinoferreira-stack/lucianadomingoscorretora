import {
  auth,
  collection,
  db,
  deleteDoc,
  doc,
  ensureAdminDocInFirestore,
  FieldValue,
  getDoc,
  getDocs,
  handleFirestoreError,
  isBootstrappedOrDefaultAdmin,
  normalizeTimestamps,
  onSnapshot,
  OperationType,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from './firebase.ts';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  DEFAULT_CATEGORIES,
  normalizeAssetImageUrl,
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
  SiteCategory,
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

let firebaseAdminConfirmed = false;

export function setFirebaseAdminConfirmed(active: boolean) {
  firebaseAdminConfirmed = active;
}

export function isFirebaseAdminActive(): boolean {
  const user = auth.currentUser;
  if (!user) return false;
  if (firebaseAdminConfirmed) return true;
  return isBootstrappedOrDefaultAdmin(user);
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

async function getAsyncAuthHeaders(): Promise<Record<string, string>> {
  const headers = authHeaders();
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (idToken) headers['x-firebase-id-token'] = idToken;
  } catch {
    // ignore
  }
  return headers;
}

export interface FirebaseProvisionStatusResponse {
  defaultAdmin: {
    ok: boolean;
    status: string;
    email: string;
    uid?: string;
    message?: string;
  };
  registeredAdmins: Array<{
    email: string;
    uid: string | null;
    createdAt: string;
  }>;
}

export async function fetchFirebaseAdminStatus(): Promise<FirebaseProvisionStatusResponse | null> {
  try {
    const res = await fetch('/api/admin/firebase-status', {
      headers: await getAsyncAuthHeaders(),
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      return (await res.json()) as FirebaseProvisionStatusResponse;
    }
  } catch {
    // Static hosting fallback below
  }

  if (auth.currentUser) {
    return {
      defaultAdmin: {
        ok: true,
        status: 'existing',
        email: auth.currentUser.email || 'admin@x.com',
        uid: auth.currentUser.uid,
      },
      registeredAdmins: [
        {
          email: auth.currentUser.email || 'admin@x.com',
          uid: auth.currentUser.uid,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }
  return null;
}

export async function syncAdminsRegistryWithServer(): Promise<number> {
  if (!isFirebaseAdminActive() || !auth.currentUser) return 0;
  let synced = 0;

  if (auth.currentUser.email) {
    const okSelf = await ensureAdminDocInFirestore(
      auth.currentUser.uid,
      auth.currentUser.email
    );
    if (okSelf) synced += 1;
  }

  const status = await fetchFirebaseAdminStatus();
  if (status) {
    if (status.defaultAdmin?.uid && status.defaultAdmin?.email) {
      const ok = await ensureAdminDocInFirestore(
        status.defaultAdmin.uid,
        status.defaultAdmin.email
      );
      if (ok) synced += 1;
    }
    for (const item of status.registeredAdmins) {
      if (item.uid && item.email) {
        const ok = await ensureAdminDocInFirestore(item.uid, item.email);
        if (ok) synced += 1;
      }
    }
  }

  return synced;
}

export async function registerNewFirebaseAdmin(
  email?: string,
  password?: string
): Promise<{
  ok: boolean;
  status: string;
  email: string;
  uid?: string;
  firestoreSynced?: boolean;
  message?: string;
}> {
  const targetEmail = (email || 'admin@x.com').trim().toLowerCase();
  const targetPassword = password || (targetEmail === 'admin@x.com' ? 'admin4321' : '');

  try {
    const res = await fetch('/api/admin/firebase-register', {
      method: 'POST',
      headers: await getAsyncAuthHeaders(),
      body: JSON.stringify({ email: targetEmail, password: targetPassword }),
    });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = (await res.json()) as {
        ok?: boolean;
        status?: string;
        email?: string;
        uid?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          status: data.status || 'error',
          email: data.email || targetEmail,
          message: data.message || data.error || 'Falha ao cadastrar admin no Firebase.',
        };
      }
      let firestoreSynced = false;
      if (data.uid && data.email && isFirebaseAdminActive()) {
        firestoreSynced = await ensureAdminDocInFirestore(data.uid, data.email);
      }
      return {
        ok: true,
        status: data.status || 'created',
        email: data.email || targetEmail,
        uid: data.uid,
        firestoreSynced,
        message: data.message,
      };
    }
  } catch {
    // Static hosting fallback below via Identity Toolkit
  }

  if (!targetPassword || targetPassword.length < 6) {
    return {
      ok: false,
      status: 'error',
      email: targetEmail,
      message: 'A senha precisa ter pelo menos 6 caracteres.',
    };
  }

  try {
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword, returnSecureToken: true }),
      }
    );
    const signInJson = (await signInRes.json()) as { localId?: string; error?: { message?: string } };
    let uid = signInRes.ok ? signInJson.localId : undefined;
    let status = signInRes.ok ? 'existing' : 'error';

    if (!uid) {
      const signUpRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, password: targetPassword, returnSecureToken: true }),
        }
      );
      const signUpJson = (await signUpRes.json()) as { localId?: string; error?: { message?: string } };
      if (signUpRes.ok && signUpJson.localId) {
        uid = signUpJson.localId;
        status = 'created';
      } else {
        return {
          ok: false,
          status: 'error',
          email: targetEmail,
          message: signUpJson.error?.message || signInJson.error?.message || 'Erro ao cadastrar no Firebase.',
        };
      }
    }

    let firestoreSynced = false;
    if (uid && isFirebaseAdminActive()) {
      firestoreSynced = await ensureAdminDocInFirestore(uid, targetEmail);
    }

    return {
      ok: true,
      status,
      email: targetEmail,
      uid,
      firestoreSynced,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'error',
      email: targetEmail,
      message: err instanceof Error ? err.message : 'Erro ao conectar ao Firebase.',
    };
  }
}

function cleanForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    if (
      value instanceof Date ||
      value instanceof FieldValue ||
      value instanceof Timestamp
    ) {
      return value;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = cleanForFirestore(v);
      }
    }
    return out as T;
  }
  return value;
}

function normalizePropertyEntity(p: Property): Property {
  return {
    ...p,
    images: Array.isArray(p.images) ? p.images.map((img) => normalizeAssetImageUrl(img)) : [],
    videoUrls: Array.isArray(p.videoUrls) ? p.videoUrls.filter(Boolean) : [],
    attachments: Array.isArray(p.attachments) ? p.attachments : [],
  };
}

function normalizeDevelopmentEntity(d: Development): Development {
  return {
    ...d,
    heroImage: normalizeAssetImageUrl(d.heroImage),
    galleryImages: Array.isArray(d.galleryImages)
      ? d.galleryImages.map((img) => normalizeAssetImageUrl(img))
      : [],
    floorPlanImages: Array.isArray(d.floorPlanImages)
      ? d.floorPlanImages.map((img) => normalizeAssetImageUrl(img))
      : [],
    videoUrls: Array.isArray(d.videoUrls) ? d.videoUrls.filter(Boolean) : [],
    attachments: Array.isArray(d.attachments) ? d.attachments : [],
  };
}

function normalizeLandingPageEntity(lp: LandingPage): LandingPage {
  return {
    ...lp,
    heroImage: normalizeAssetImageUrl(lp.heroImage),
    galleryImages: Array.isArray(lp.galleryImages)
      ? lp.galleryImages.map((img) => normalizeAssetImageUrl(img))
      : [],
    floorPlanImages: Array.isArray(lp.floorPlanImages)
      ? lp.floorPlanImages.map((img) => normalizeAssetImageUrl(img))
      : [],
    videoUrls: Array.isArray(lp.videoUrls) ? lp.videoUrls.filter(Boolean) : [],
    attachments: Array.isArray(lp.attachments) ? lp.attachments : [],
  };
}

function normalizeCategoryItem(cat: SiteCategory): SiteCategory {
  const cleanName = (cat.name || '').trim().slice(0, 60) || 'Categoria';
  const cleanSlug = (cat.slug || slugify(cleanName) || 'categoria').slice(0, 80);
  const item: SiteCategory = {
    id: (cat.id || `cat_${cleanSlug}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80),
    name: cleanName,
    slug: cleanSlug,
    showInMenu: Boolean(cat.showInMenu),
    showOnHome: Boolean(cat.showOnHome),
  };
  if (cat.kicker !== undefined && cat.kicker.trim()) {
    item.kicker = cat.kicker.trim().slice(0, 100);
  }
  if (cat.description !== undefined && cat.description.trim()) {
    item.description = cat.description.trim().slice(0, 320);
  }
  if (cat.image !== undefined && cat.image.trim()) {
    item.image = normalizeAssetImageUrl(cat.image.trim()).slice(0, 1200);
  }
  return item;
}

export function normalizeSettingsEntity(s: SiteSettings): SiteSettings {
  const categories = Array.isArray(s.categories)
    ? s.categories.map(normalizeCategoryItem)
    : DEFAULT_CATEGORIES.map(normalizeCategoryItem);
  return {
    ...s,
    categories,
  };
}

function normalizeCatalogEntities<T extends Omit<AppDataState, 'leads'>>(data: T): T {
  return {
    ...data,
    properties: data.properties.map(normalizePropertyEntity),
    developments: data.developments.map(normalizeDevelopmentEntity),
    landingPages: data.landingPages.map(normalizeLandingPageEntity),
    settings: normalizeSettingsEntity(data.settings),
  };
}

export function subscribePublicCatalog(
  onPatch: (patch: Partial<Omit<AppDataState, 'leads'>>) => void
): () => void {
  const unsubProps = onSnapshot(
    query(
      collection(db, 'properties'),
      where('status', 'in', ['Disponível', 'Reservado', 'Vendido'])
    ),
    (snap) => {
      const items = snap.docs
        .map((d) => normalizePropertyEntity(normalizeTimestamps(d.data() as Property)))
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onPatch({ properties: items });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'properties');
    }
  );

  const unsubDevs = onSnapshot(
    query(
      collection(db, 'developments'),
      where('stage', 'in', ['Lançamento', 'Em Obras', 'Pronto para Morar'])
    ),
    (snap) => {
      const items = snap.docs
        .map((d) => normalizeDevelopmentEntity(normalizeTimestamps(d.data() as Development)))
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onPatch({ developments: items });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'developments');
    }
  );

  const unsubLps = onSnapshot(
    query(collection(db, 'landing_pages'), where('status', '==', 'published')),
    (snap) => {
      const items = snap.docs
        .map((d) => normalizeLandingPageEntity(normalizeTimestamps(d.data() as LandingPage)))
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onPatch({ landingPages: items });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'landing_pages');
    }
  );

  const unsubTests = onSnapshot(
    query(collection(db, 'testimonials'), where('approved', '==', true)),
    (snap) => {
      const items = snap.docs
        .map((d) => normalizeTimestamps(d.data() as Testimonial))
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onPatch({ testimonials: items });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'testimonials');
    }
  );

  const unsubSettings = onSnapshot(
    doc(db, 'settings', 'main'),
    (snap) => {
      if (snap.exists()) {
        onPatch({
          settings: normalizeSettingsEntity(normalizeTimestamps(snap.data() as SiteSettings)),
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/main');
    }
  );

  return () => {
    unsubProps();
    unsubDevs();
    unsubLps();
    unsubTests();
    unsubSettings();
  };
}

export function subscribeAdminStore(
  onPatch: (patch: Partial<AppDataState>) => void
): () => void {
  if (!isFirebaseAdminActive()) return () => {};

  const unsubProps = onSnapshot(
    collection(db, 'properties'),
    (snap) => {
      const items = snap.docs
        .map((d) => normalizePropertyEntity(normalizeTimestamps(d.data() as Property)))
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onPatch({ properties: items });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'properties');
    }
  );

  const unsubDevs = onSnapshot(
    collection(db, 'developments'),
    (snap) => {
      const items = snap.docs
        .map((d) => normalizeDevelopmentEntity(normalizeTimestamps(d.data() as Development)))
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onPatch({ developments: items });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'developments');
    }
  );

  const unsubLps = onSnapshot(
    collection(db, 'landing_pages'),
    (snap) => {
      const items = snap.docs
        .map((d) => normalizeLandingPageEntity(normalizeTimestamps(d.data() as LandingPage)))
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onPatch({ landingPages: items });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'landing_pages');
    }
  );

  const unsubLeads = onSnapshot(
    collection(db, 'leads'),
    (snap) => {
      const items = snap.docs
        .map((d) => normalizeTimestamps(d.data() as Lead))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onPatch({ leads: items });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    }
  );

  const unsubTests = onSnapshot(
    collection(db, 'testimonials'),
    (snap) => {
      const items = snap.docs
        .map((d) => normalizeTimestamps(d.data() as Testimonial))
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onPatch({ testimonials: items });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'testimonials');
    }
  );

  const unsubSettings = onSnapshot(
    doc(db, 'settings', 'main'),
    (snap) => {
      if (snap.exists()) {
        onPatch({
          settings: normalizeSettingsEntity(normalizeTimestamps(snap.data() as SiteSettings)),
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/main');
    }
  );

  return () => {
    unsubProps();
    unsubDevs();
    unsubLps();
    unsubLeads();
    unsubTests();
    unsubSettings();
  };
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
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
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

    return normalizeCatalogEntities({
      properties: fsProps.length > 0 ? fsProps : serverCatalog.properties,
      developments: fsDevs.length > 0 ? fsDevs : serverCatalog.developments,
      landingPages: fsLps.length > 0 ? fsLps : serverCatalog.landingPages,
      testimonials: fsTests.length > 0 ? fsTests : serverCatalog.testimonials,
      settings: fsSettings ?? serverCatalog.settings,
    });
  } catch (err) {
    console.warn('Firestore public catalog fallback:', err);
    return normalizeCatalogEntities(serverCatalog);
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
  if (token || isFirebaseAdminActive()) {
    try {
      const res = await fetch('/api/admin/store', {
        headers: await getAsyncAuthHeaders(),
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        state = (await res.json()) as AppDataState;
      }
    } catch {
      // ignore
    }
  }

  if (isFirebaseAdminActive()) {
    try {
      const [propsSnap, devsSnap, lpsSnap, leadsSnap, testsSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'properties')),
        getDocs(collection(db, 'developments')),
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

  return normalizeCatalogEntities(state);
}

export async function seedFirestoreFromStore(store: AppDataState): Promise<void> {
  if (!isFirebaseAdminActive()) return;

  for (const p of store.properties) {
    try {
      await setDoc(
        doc(db, 'properties', p.id),
        cleanForFirestore({
          ...normalizePropertyEntity(p),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `properties/${p.id}`);
    }
  }

  for (const d of store.developments) {
    try {
      await setDoc(
        doc(db, 'developments', d.id),
        cleanForFirestore({
          ...normalizeDevelopmentEntity(d),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `developments/${d.id}`);
    }
  }

  for (const lp of store.landingPages) {
    try {
      await setDoc(
        doc(db, 'landing_pages', lp.id),
        cleanForFirestore({
          ...normalizeLandingPageEntity(lp),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `landing_pages/${lp.id}`);
    }
  }

  for (const t of store.testimonials) {
    try {
      await setDoc(
        doc(db, 'testimonials', t.id),
        cleanForFirestore({
          ...t,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `testimonials/${t.id}`);
    }
  }

  try {
    await setDoc(
      doc(db, 'settings', 'main'),
      cleanForFirestore({
        ...store.settings,
        id: 'main',
        updatedAt: serverTimestamp(),
      })
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/main');
  }
}

export async function persistFullAdminStore(store: AppDataState): Promise<void> {
  const token = getSavedAdminToken();
  if (token || isFirebaseAdminActive()) {
    try {
      await fetch('/api/admin/store', {
        method: 'PUT',
        headers: await getAsyncAuthHeaders(),
        body: JSON.stringify(store),
      });
    } catch {
      // Optional Express backend unavailable on static hosting; Firestore remains primary
    }
  }
}

export async function upsertProperty(
  property: Property,
  isNew: boolean,
  fullStore: AppDataState
): Promise<AppDataState> {
  const normalized = normalizePropertyEntity(property);
  const nextProps = isNew
    ? [normalized, ...fullStore.properties]
    : fullStore.properties.map((p) => (p.id === normalized.id ? normalized : p));
  const nextStore = { ...fullStore, properties: nextProps };

  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      const existingSnap = await getDoc(doc(db, 'properties', normalized.id));
      await setDoc(
        doc(db, 'properties', normalized.id),
        cleanForFirestore({
          ...normalized,
          createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(
        err,
        isNew ? OperationType.CREATE : OperationType.UPDATE,
        `properties/${normalized.id}`
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
  const normalized = normalizeDevelopmentEntity(dev);
  const nextDevs = isNew
    ? [normalized, ...fullStore.developments]
    : fullStore.developments.map((d) => (d.id === normalized.id ? normalized : d));
  const nextStore = { ...fullStore, developments: nextDevs };

  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      const existingSnap = await getDoc(doc(db, 'developments', normalized.id));
      await setDoc(
        doc(db, 'developments', normalized.id),
        cleanForFirestore({
          ...normalized,
          createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(
        err,
        isNew ? OperationType.CREATE : OperationType.UPDATE,
        `developments/${normalized.id}`
      );
    }
  }

  return nextStore;
}

export async function removeDevelopment(
  id: string,
  fullStore: AppDataState
): Promise<AppDataState> {
  const nextStore = {
    ...fullStore,
    developments: fullStore.developments.filter((d) => d.id !== id),
  };
  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      await deleteDoc(doc(db, 'developments', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `developments/${id}`);
    }
  }

  return nextStore;
}

export async function upsertLandingPage(
  lp: LandingPage,
  isNew: boolean,
  fullStore: AppDataState
): Promise<AppDataState> {
  const normalized = normalizeLandingPageEntity(lp);
  const nextLps = isNew
    ? [normalized, ...fullStore.landingPages.filter((x) => x.id !== normalized.id)]
    : fullStore.landingPages.map((x) => (x.id === normalized.id ? normalized : x));
  const nextStore = { ...fullStore, landingPages: nextLps };

  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      const existingSnap = await getDoc(doc(db, 'landing_pages', normalized.id));
      await setDoc(
        doc(db, 'landing_pages', normalized.id),
        cleanForFirestore({
          ...normalized,
          createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(
        err,
        isNew ? OperationType.CREATE : OperationType.UPDATE,
        `landing_pages/${normalized.id}`
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

  let saved: Lead = {
    ...payload,
    id,
    status: 'Novo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Persist to Express backend when available
  try {
    const res = await fetch('/api/public/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, id }),
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      saved = (await res.json()) as Lead;
    }
  } catch {
    // Express API unavailable on static hosting; Firestore write below handles persistence
  }

  // Write directly to Firestore `leads` collection (allowed publicly for `create` with status 'Novo')
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
        await setDoc(
          doc(db, 'leads', lead.id),
          cleanForFirestore({
            ...existingSnap.data(),
            status: lead.status,
            message: lead.message ?? '',
            updatedAt: serverTimestamp(),
          })
        );
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
      await setDoc(
        doc(db, 'testimonials', item.id),
        cleanForFirestore({
          ...item,
          createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
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
  const normalizedSettings = normalizeSettingsEntity(settings);
  const nextStore = { ...fullStore, settings: normalizedSettings };
  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      await setDoc(
        doc(db, 'settings', 'main'),
        cleanForFirestore({
          ...normalizedSettings,
          id: 'main',
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/main');
    }
  }
  return nextStore;
}

export async function saveCategoriesAndSyncProperties(
  categories: SiteCategory[],
  renames: Array<{ from: string; to: string }>,
  fullStore: AppDataState
): Promise<AppDataState> {
  const normalizedSettings = normalizeSettingsEntity({
    ...fullStore.settings,
    categories,
    updatedAt: new Date().toISOString(),
  });

  const renameMap = new Map<string, string>();
  renames.forEach((r) => {
    if (r.from && r.to && r.from !== r.to) {
      renameMap.set(r.from, r.to);
    }
  });

  const changedProperties: Property[] = [];
  const nextProperties = fullStore.properties.map((p) => {
    const renamed = renameMap.get(p.propertyType);
    if (!renamed) return p;
    const updated = {
      ...p,
      propertyType: renamed,
      updatedAt: new Date().toISOString(),
    };
    changedProperties.push(updated);
    return updated;
  });

  const nextStore: AppDataState = {
    ...fullStore,
    properties: nextProperties,
    settings: normalizedSettings,
  };

  await persistFullAdminStore(nextStore);

  if (isFirebaseAdminActive()) {
    try {
      await setDoc(
        doc(db, 'settings', 'main'),
        cleanForFirestore({
          ...normalizedSettings,
          id: 'main',
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/main');
    }

    for (const prop of changedProperties) {
      try {
        const existingSnap = await getDoc(doc(db, 'properties', prop.id));
        await setDoc(
          doc(db, 'properties', prop.id),
          cleanForFirestore({
            ...normalizePropertyEntity(prop),
            createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `properties/${prop.id}`);
      }
    }
  }

  return nextStore;
}

function buildClientLandingPageCopy(dev: Development) {
  return {
    heroTitle: dev.name,
    heroSlogan:
      dev.tagline ||
      `Um novo padrão de moradia e valorização em ${dev.neighborhood}, ${dev.city}.`,
    heroSubtitle:
      dev.description ||
      `Conheça o ${dev.name}, selecionado pela consultoria Luciana Domingos para quem busca arquitetura contemporânea, localização estratégica e alto potencial de valorização em ${dev.city}.`,
    ctaPrimaryText: 'Receber Tabela e Plantas Exclusivas',
    differentials: (dev.differentials.length > 0
      ? dev.differentials
      : [
          `Localização privilegiada no bairro ${dev.neighborhood} em ${dev.city}`,
          'Arquitetura contemporânea com amplo aproveitamento de luz natural',
          'Acabamentos de alto padrão e excelente isolamento termoacústico',
          'Condições especiais de lançamento com fluxo facilitado',
        ]
    )
      .slice(0, 6)
      .map((item, idx) => ({
        title: `Diferencial 0${idx + 1}`,
        description: item,
      })),
    locationSummary: `${dev.name} está localizado em ${dev.address || `${dev.neighborhood}, ${dev.city}`}, conectando tranquilidade residencial com acesso ágil aos principais serviços, universidades e vias do Vale dos Sinos.`,
    nearbyHighlights: [
      `Coração do bairro ${dev.neighborhood} (${dev.city})`,
      'Acesso rápido à BR-116 e RS-239',
      'Próximo a supermercados, escolas e academias',
      'Conexão facilitada com Feevale e eixo empresarial',
    ],
    leisureHighlights:
      dev.amenities.length > 0
        ? dev.amenities
        : [
            'Salão de festas gourmet equipado',
            'Espaço fitness panorâmico',
            'Coworking e sala de reuniões',
            'Áreas verdes com paisagismo autoral',
          ],
    whyInvestTitle: `Por que investir no ${dev.name}`,
    whyInvestReasons: [
      {
        title: 'Valorização Imobiliária Consistente',
        description: `${dev.city} e o eixo Vale dos Sinos registram demanda crescente por imóveis contemporâneos com infraestrutura completa.`,
      },
      {
        title: 'Qualidade Construtiva e Liquidez',
        description: `Assinado por ${dev.developer || 'incorporadora consolidada'}, o projeto entrega plantas funcionais altamente desejadas tanto para moradia quanto para locação.`,
      },
      {
        title: 'Assessoria Personalizada Luciana Domingos',
        description:
          'Atendimento consultivo do estudo de fluxo financeiro até a entrega das chaves, garantindo segurança jurídica total (CRECI 73892F).',
      },
    ],
    trustQuote:
      'Seleciono pessoalmente empreendimentos com solidez construtiva, boa insolação e potencial real de valorização para que cada cliente invista com tranquilidade.',
    trustAuthor: 'Luciana Domingos · Corretora de Imóveis (CRECI 73892F)',
    seoTitle: `${dev.name} | ${dev.city} · Luciana Domingos Imóveis`,
    seoDescription: `Conheça o ${dev.name} em ${dev.neighborhood}, ${dev.city}. Veja plantas, tipologias, infraestrutura e solicite atendimento exclusivo com Luciana Domingos.`,
  };
}

export async function generateAiLandingPageCopy(development: Development) {
  try {
    const res = await fetch('/api/ai/generate-landing-page', {
      method: 'POST',
      headers: await getAsyncAuthHeaders(),
      body: JSON.stringify({ development }),
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      return await res.json();
    }
  } catch {
    // Fallback to deterministic copy on static hosting
  }
  return buildClientLandingPageCopy(development);
}
