import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BRAND_IMAGES,
  SEED_DEVELOPMENTS,
  SEED_LANDING_PAGES,
  SEED_LEADS,
  SEED_PROPERTIES,
  SEED_SETTINGS,
  SEED_TESTIMONIALS,
} from './data/seedData.ts';
import {
  getSavedAdminToken,
  isFirebaseAdminActive,
  loadAdminStore,
  loadPublicCatalog,
  removeLandingPage,
  removeProperty,
  removeTestimonial,
  saveSiteSettings,
  setFirebaseAdminConfirmed,
  syncAdminsRegistryWithServer,
  updateLeadStatus,
  upsertDevelopment,
  upsertLandingPage,
  upsertProperty,
  upsertTestimonial,
  type AppDataState,
} from './lib/dataService.ts';
import {
  checkIsFirestoreAdmin,
  subscribeAuth,
  testFirestoreConnection,
} from './lib/firebase.ts';
import type {
  CatalogFilterPreset,
  Development,
  LandingPage,
  Lead,
  Property,
  SiteSettings,
  SmartSearchAnswers,
  SmartSearchResponse,
  Testimonial,
} from './types.ts';
import { CinematicIntro } from './components/CinematicIntro.tsx';
import { Footer, WhatsAppFloat } from './components/Footer.tsx';
import { SmoothScrollProvider } from './components/MotionPrimitives.tsx';
import { Navbar } from './components/Navbar.tsx';
import {
  PropertyCompareBar,
  PropertyCompareModal,
} from './components/PropertyCompareModal.tsx';
import { VirtualAssistant } from './components/VirtualAssistant.tsx';
import { AboutPage, ContactPage } from './pages/AboutAndContactPages.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { DevelopmentLandingPage } from './pages/DevelopmentLandingPage.tsx';
import { DevelopmentsPage } from './pages/DevelopmentsPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { PropertyDetailPage } from './pages/PropertyDetailPage.tsx';
import { ResultsAndCatalogPage } from './pages/ResultsAndCatalogPage.tsx';

const SAVED_STORAGE_KEY = 'luciana_domingos_saved_properties';

export default function App() {
  const [path, setPath] = useState<string>(() => window.location.pathname || '/');
  const [store, setStore] = useState<AppDataState>({
    properties: SEED_PROPERTIES,
    developments: SEED_DEVELOPMENTS,
    landingPages: SEED_LANDING_PAGES,
    leads: SEED_LEADS,
    testimonials: SEED_TESTIMONIALS,
    settings: SEED_SETTINGS,
  });
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<SmartSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [catalogPreset, setCatalogPreset] = useState<CatalogFilterPreset | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    const initialPath = window.location.pathname || '/';
    return !initialPath.startsWith('/admin') && !initialPath.startsWith('/empreendimento/');
  });
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const navigate = useCallback((nextPath: string) => {
    if (nextPath !== window.location.pathname) {
      window.history.pushState({}, '', nextPath);
    }
    setPath(nextPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBrowseCatalog = useCallback(
    (preset?: CatalogFilterPreset) => {
      setCatalogPreset(preset ?? null);
      setAiResult(null);
      navigate('/imoveis');
    },
    [navigate]
  );

  const handleToggleSave = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, []);

  const handleToggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }, []);

  const comparedProperties = useMemo(
    () => store.properties.filter((p) => compareIds.includes(p.id)),
    [compareIds, store.properties]
  );

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const refreshAdmin = useCallback(async () => {
    const adminData = await loadAdminStore();
    setStore(adminData);
  }, []);

  useEffect(() => {
    testFirestoreConnection();

    loadPublicCatalog().then((publicData) => {
      setStore((prev) => ({
        ...prev,
        ...publicData,
      }));
    });

    if (getSavedAdminToken() || isFirebaseAdminActive()) {
      refreshAdmin();
    }

    const unsub = subscribeAuth(async (user) => {
      const active = await checkIsFirestoreAdmin(user);
      setFirebaseAdminConfirmed(active);
      setFirebaseConnected(active);
      if (active) {
        await syncAdminsRegistryWithServer().catch(() => {});
        refreshAdmin();
      }
    });

    return () => unsub();
  }, [refreshAdmin]);

  const handleSmartSearch = async (answers: SmartSearchAnswers) => {
    setIsSearching(true);
    try {
      const res = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          properties: store.properties,
        }),
      });
      if (res.ok) {
        const result = (await res.json()) as SmartSearchResponse;
        setAiResult(result);
        setCatalogPreset(null);
        navigate('/resultados');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Route matching
  if (path === '/admin') {
    return (
      <AdminPage
        store={store}
        firebaseConnected={firebaseConnected}
        onRefreshAdminStore={refreshAdmin}
        onSaveProperty={async (p: Property, isNew: boolean) => {
          const next = await upsertProperty(p, isNew, store);
          setStore(next);
        }}
        onDeleteProperty={async (id: string) => {
          const next = await removeProperty(id, store);
          setStore(next);
        }}
        onSaveDevelopment={async (d: Development, isNew: boolean) => {
          const next = await upsertDevelopment(d, isNew, store);
          setStore(next);
        }}
        onSaveLandingPage={async (lp: LandingPage, isNew: boolean) => {
          const next = await upsertLandingPage(lp, isNew, store);
          setStore(next);
        }}
        onDeleteLandingPage={async (id: string) => {
          const next = await removeLandingPage(id, store);
          setStore(next);
        }}
        onUpdateLead={async (lead: Lead) => {
          const next = await updateLeadStatus(lead, store);
          setStore(next);
        }}
        onSaveTestimonial={async (t: Testimonial, isNew: boolean) => {
          const next = await upsertTestimonial(t, isNew, store);
          setStore(next);
        }}
        onDeleteTestimonial={async (id: string) => {
          const next = await removeTestimonial(id, store);
          setStore(next);
        }}
        onSaveSettings={async (s: SiteSettings) => {
          const next = await saveSiteSettings(s, store);
          setStore(next);
        }}
        onNavigate={navigate}
      />
    );
  }

  // Dedicated Premium Development Landing Page: /empreendimento/:slug
  if (path.startsWith('/empreendimento/')) {
    const slug = path.replace('/empreendimento/', '').split('/')[0];
    const lp = store.landingPages.find((item) => item.slug === slug);
    const hasAdminAccess = Boolean(getSavedAdminToken()) || firebaseConnected;

    if (!lp || (lp.status !== 'published' && !hasAdminAccess)) {
      return (
        <div className="min-h-screen flex flex-col">
          <Navbar currentPath={path} onNavigate={navigate} settings={store.settings} />
          <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <h1 className="font-serif text-3xl font-semibold text-[#0F2936]">
              Empreendimento não encontrado ou em preparação
            </h1>
            <p className="text-sm text-[#0F2936]/70 max-w-md">
              Esta página exclusiva ainda não está publicada ou o link foi atualizado.
            </p>
            <button
              type="button"
              onClick={() => navigate('/empreendimentos')}
              className="px-6 py-3 bg-[#0F2936] text-white text-sm font-semibold rounded-xl cursor-pointer"
            >
              Ver Todos os Empreendimentos
            </button>
          </main>
          <Footer settings={store.settings} onNavigate={navigate} />
        </div>
      );
    }

    const dev = store.developments.find((d) => d.id === lp.developmentId);

    return (
      <SmoothScrollProvider>
        <DevelopmentLandingPage
          landingPage={lp}
          development={dev}
          settings={store.settings}
          isAdminPreview={hasAdminAccess}
          onPublishFromPreview={async () => {
            const next = await upsertLandingPage(
              { ...lp, status: 'published', updatedAt: new Date().toISOString() },
              false,
              store
            );
            setStore(next);
          }}
          onNavigate={navigate}
        />
        <Footer settings={store.settings} onNavigate={navigate} />
        <WhatsAppFloat
          whatsappNumber={store.settings.whatsappNumber}
          instagramHandle={store.settings.instagramHandle}
        />
        <VirtualAssistant
          settings={store.settings}
          propertiesCount={store.properties.length}
          onNavigate={navigate}
        />
      </SmoothScrollProvider>
    );
  }

  // Standard Site Layout
  const propertyIdMatch = path.startsWith('/imovel/')
    ? path.replace('/imovel/', '').split('/')[0]
    : null;
  const selectedProperty = propertyIdMatch
    ? store.properties.find((p) => p.id === propertyIdMatch)
    : null;

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
        {showIntro && (
          <CinematicIntro
            brokerName={store.settings.brokerName}
            creci={store.settings.creci}
            backdropImage={store.developments[0]?.heroImage || BRAND_IMAGES.hero}
            onComplete={handleIntroComplete}
          />
        )}
        <Navbar currentPath={path} onNavigate={navigate} settings={store.settings} />

        <main className="flex-1">
          {selectedProperty ? (
            <PropertyDetailPage
              property={selectedProperty}
              allProperties={store.properties}
              settings={store.settings}
              onBack={() => navigate('/imoveis')}
              onSelectProperty={(id) => navigate(`/imovel/${id}`)}
              savedIds={savedIds}
              compareIds={compareIds}
              onToggleSave={handleToggleSave}
              onToggleCompare={handleToggleCompare}
            />
          ) : path === '/resultados' || path === '/imoveis' ? (
            <ResultsAndCatalogPage
              properties={store.properties}
              aiResult={path === '/resultados' ? aiResult : null}
              initialPreset={path === '/imoveis' ? catalogPreset : null}
              onClearAi={() => {
                setAiResult(null);
                navigate('/imoveis');
              }}
              onSelectProperty={(id) => navigate(`/imovel/${id}`)}
              onNavigateHome={() => navigate('/')}
              savedIds={savedIds}
              compareIds={compareIds}
              onToggleSave={handleToggleSave}
              onToggleCompare={handleToggleCompare}
            />
          ) : path === '/empreendimentos' ? (
            <DevelopmentsPage
              developments={store.developments}
              landingPages={store.landingPages}
              settings={store.settings}
              onNavigate={navigate}
            />
          ) : path === '/sobre' ? (
            <AboutPage settings={store.settings} onNavigate={navigate} />
          ) : path === '/contato' ? (
            <ContactPage settings={store.settings} />
          ) : (
            <HomePage
              properties={store.properties}
              developments={store.developments}
              landingPages={store.landingPages}
              testimonials={store.testimonials.filter((t) => t.approved)}
              settings={store.settings}
              onSmartSearch={handleSmartSearch}
              isSearching={isSearching}
              onNavigate={navigate}
              onBrowseCatalog={handleBrowseCatalog}
              savedIds={savedIds}
              compareIds={compareIds}
              onToggleSave={handleToggleSave}
              onToggleCompare={handleToggleCompare}
            />
          )}
        </main>

        <Footer settings={store.settings} onNavigate={navigate} />
        <WhatsAppFloat
          whatsappNumber={store.settings.whatsappNumber}
          instagramHandle={store.settings.instagramHandle}
        />
        <VirtualAssistant
          settings={store.settings}
          propertiesCount={store.properties.length}
          onNavigate={navigate}
        />

        <PropertyCompareBar
          properties={comparedProperties}
          onRemove={(id) => setCompareIds((prev) => prev.filter((i) => i !== id))}
          onClear={() => setCompareIds([])}
          onOpenModal={() => setCompareOpen(true)}
        />
        <PropertyCompareModal
          open={compareOpen}
          properties={comparedProperties}
          settings={store.settings}
          onClose={() => setCompareOpen(false)}
          onRemove={(id) => {
            setCompareIds((prev) => {
              const next = prev.filter((i) => i !== id);
              if (next.length < 2) setCompareOpen(false);
              return next;
            });
          }}
          onSelectProperty={(id) => navigate(`/imovel/${id}`)}
        />
      </div>
    </SmoothScrollProvider>
  );
}
