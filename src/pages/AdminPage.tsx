import React, { useEffect, useState } from 'react';
import {
  Building2,
  Check,
  Home,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import {
  fetchFirebaseAdminStatus,
  formatCurrency,
  getSavedAdminToken,
  isFirebaseAdminActive,
  registerNewFirebaseAdmin,
  saveAdminToken,
  seedFirestoreFromStore,
  setFirebaseAdminConfirmed,
  syncAdminsRegistryWithServer,
  type AppDataState,
  type FirebaseProvisionStatusResponse,
} from '../lib/dataService.ts';
import {
  auth,
  checkIsFirestoreAdmin,
  logoutFirebase,
  signInWithGoogleAdmin,
  tryFirebaseEmailLogin,
} from '../lib/firebase.ts';
import type {
  Development,
  LandingPage,
  Lead,
  LeadStatus,
  Property,
  SiteSettings,
  Testimonial,
} from '../types.ts';
import { BrandLogo } from '../components/BrandLogo.tsx';
import { LandingPageBuilderTab } from '../components/admin/LandingPageBuilderTab.tsx';
import { DevelopmentsTab, PropertiesTab } from '../components/admin/PropertiesAndDevsTab.tsx';

type AdminTab =
  | 'dashboard'
  | 'landing_pages'
  | 'properties'
  | 'developments'
  | 'leads'
  | 'testimonials'
  | 'settings';

interface AdminPageProps {
  store: AppDataState;
  firebaseConnected: boolean;
  onRefreshAdminStore: () => Promise<void>;
  onSaveProperty: (p: Property, isNew: boolean) => Promise<void>;
  onDeleteProperty: (id: string) => Promise<void>;
  onSaveDevelopment: (d: Development, isNew: boolean) => Promise<void>;
  onSaveLandingPage: (lp: LandingPage, isNew: boolean) => Promise<void>;
  onDeleteLandingPage: (id: string) => Promise<void>;
  onUpdateLead: (lead: Lead) => Promise<void>;
  onSaveTestimonial: (t: Testimonial, isNew: boolean) => Promise<void>;
  onDeleteTestimonial: (id: string) => Promise<void>;
  onSaveSettings: (s: SiteSettings) => Promise<void>;
  onNavigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  store,
  firebaseConnected,
  onRefreshAdminStore,
  onSaveProperty,
  onDeleteProperty,
  onSaveDevelopment,
  onSaveLandingPage,
  onDeleteLandingPage,
  onUpdateLead,
  onSaveTestimonial,
  onDeleteTestimonial,
  onSaveSettings,
  onNavigate,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => Boolean(getSavedAdminToken()) || isFirebaseAdminActive()
  );
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [leadFilter, setLeadFilter] = useState<string>('Todos');
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(store.settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Firebase Auth auto-provisioning state
  const [fbProvisionStatus, setFbProvisionStatus] =
    useState<FirebaseProvisionStatusResponse | null>(null);
  const [fbActionFeedback, setFbActionFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [registeringAdmin, setRegisteringAdmin] = useState(false);

  // Testimonial quick form
  const [newTestName, setNewTestName] = useState('');
  const [newTestRole, setNewTestRole] = useState('');
  const [newTestCity, setNewTestCity] = useState('Estância Velha · RS');
  const [newTestQuote, setNewTestQuote] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchFirebaseAdminStatus().then((status) => {
      if (status) setFbProvisionStatus(status);
    });
  }, [isAuthenticated, firebaseConnected]);

  const performCredentialLogin = async (rawEmail: string, rawPassword: string) => {
    setLoggingIn(true);
    setLoginError(null);
    setFbActionFeedback(null);

    const emailClean = rawEmail.trim().toLowerCase();
    let serverAuthorized = false;
    let serverStatus: { ok?: boolean; status?: string; uid?: string; message?: string } | undefined;

    // 1) Try Express session endpoint when full-stack backend is active
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailClean, password: rawPassword }),
      });
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          setLoginError(err.error || 'E-mail ou senha inválidos.');
          setLoggingIn(false);
          return;
        }
        const data = (await res.json()) as {
          token?: string;
          firebaseAdmin?: { ok?: boolean; status?: string; uid?: string; message?: string };
        };
        if (data.token) {
          saveAdminToken(data.token);
          serverAuthorized = true;
          serverStatus = data.firebaseAdmin;
        }
      }
    } catch {
      // Express endpoint unavailable (e.g., static Vercel deployment) — continue directly with Firebase Auth
    }

    // 2) Authenticate directly with Firebase Authentication (works on both AI Studio and Vercel)
    try {
      const isDefaultCredential =
        emailClean === 'admin@x.com' && rawPassword === 'admin4321';
      const fbResult = await tryFirebaseEmailLogin(
        emailClean,
        rawPassword,
        serverAuthorized || isDefaultCredential
      );

      if (fbResult.user) {
        const isFsAdmin = await checkIsFirestoreAdmin(fbResult.user);
        setFirebaseAdminConfirmed(isFsAdmin);

        if (isFsAdmin) {
          if (!getSavedAdminToken()) {
            saveAdminToken('firebase-session');
          }
          await syncAdminsRegistryWithServer().catch(() => {});
          setFbActionFeedback({
            type: 'success',
            text:
              fbResult.action === 'created'
                ? 'Login e senha cadastrados automaticamente no Firebase Auth e Firestore.'
                : 'Conectado automaticamente ao Firebase Auth e Firestore.',
          });
        } else {
          setFbActionFeedback({
            type: 'warning',
            text:
              fbResult.action === 'created' || serverStatus?.status === 'created'
                ? 'Conta cadastrada no Firebase Auth! Clique em "Sincronizar Firebase (Google)" no topo se desejar autorizar este UID no Firestore.'
                : 'Autenticado no Firebase Auth.',
          });
        }

        setIsAuthenticated(true);
        await onRefreshAdminStore().catch(() => {});
        return;
      }

      if (serverAuthorized) {
        if (
          fbResult.action === 'operation_not_allowed' ||
          serverStatus?.status === 'operation_not_allowed'
        ) {
          setFbActionFeedback({
            type: 'warning',
            text:
              fbResult.errorMessage ||
              'Ative o provedor E-mail/senha no Firebase Console (Authentication → Sign-in method).',
          });
        }
        setIsAuthenticated(true);
        await onRefreshAdminStore().catch(() => {});
        return;
      }

      if (fbResult.action === 'operation_not_allowed') {
        setLoginError(
          fbResult.errorMessage ||
            'Ative o provedor E-mail/senha no Firebase Console ou entre com Google.'
        );
      } else {
        setLoginError('E-mail ou senha inválidos.');
      }
    } catch {
      setLoginError('Não foi possível autenticar no Firebase. Tente novamente ou entre com Google.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performCredentialLogin(loginEmail, loginPassword);
  };

  const handleDirectAdminEntry = async () => {
    await performCredentialLogin('admin@x.com', 'admin4321');
  };

  const handleGoogleSync = async () => {
    setLoginError(null);
    try {
      const user = await signInWithGoogleAdmin();
      const isFsAdmin = await checkIsFirestoreAdmin(user);
      setFirebaseAdminConfirmed(isFsAdmin);
      if (isFsAdmin) {
        await syncAdminsRegistryWithServer().catch(() => {});
        await seedFirestoreFromStore(store);
        setFbActionFeedback({
          type: 'success',
          text: 'Firebase sincronizado e administradores autorizados automaticamente no Firestore.',
        });
      }
      setIsAuthenticated(true);
      await onRefreshAdminStore();
      const updatedStatus = await fetchFirebaseAdminStatus();
      if (updatedStatus) setFbProvisionStatus(updatedStatus);
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : 'Não foi possível conectar via Google.'
      );
    }
  };

  const handleVerifyDefaultFirebaseAdmin = async () => {
    setRegisteringAdmin(true);
    setFbActionFeedback(null);
    try {
      const result = await registerNewFirebaseAdmin();
      if (!result.ok) {
        setFbActionFeedback({
          type: result.status === 'operation_not_allowed' ? 'warning' : 'error',
          text: result.message || 'Não foi possível registrar o admin padrão no Firebase.',
        });
        return;
      }
      if (isFirebaseAdminActive()) {
        await syncAdminsRegistryWithServer().catch(() => {});
      }
      const status = await fetchFirebaseAdminStatus();
      if (status) setFbProvisionStatus(status);
      setFbActionFeedback({
        type: 'success',
        text: `Admin ${result.email} verificado no Firebase Auth (UID: ${result.uid || 'ativo'}).`,
      });
    } finally {
      setRegisteringAdmin(false);
    }
  };

  const handleRegisterNewAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || newAdminPassword.length < 6) return;
    setRegisteringAdmin(true);
    setFbActionFeedback(null);
    try {
      const result = await registerNewFirebaseAdmin(newAdminEmail.trim(), newAdminPassword);
      if (!result.ok) {
        setFbActionFeedback({
          type: result.status === 'operation_not_allowed' ? 'warning' : 'error',
          text: result.message || 'Erro ao cadastrar login/senha no Firebase.',
        });
        return;
      }
      setNewAdminEmail('');
      setNewAdminPassword('');
      const status = await fetchFirebaseAdminStatus();
      if (status) setFbProvisionStatus(status);
      setFbActionFeedback({
        type: 'success',
        text: result.firestoreSynced
          ? `Login ${result.email} cadastrado automaticamente no Firebase Auth e autorizado no Firestore!`
          : `Login ${result.email} cadastrado no Firebase Auth e no painel!${
              !firebaseConnected
                ? ' (Conecte via Google 1x para gravar o UID no Firestore.)'
                : ''
            }`,
      });
    } finally {
      setRegisteringAdmin(false);
    }
  };

  const handleLogout = async () => {
    saveAdminToken(null);
    setFirebaseAdminConfirmed(false);
    await logoutFirebase().catch(() => {});
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0F2936] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-7 sm:p-10 space-y-6">
          <div className="space-y-3">
            <BrandLogo variant="horizontal" />
            <h1 className="font-serif text-2xl font-semibold text-[#0F2936] pt-2">
              Painel Administrativo
            </h1>
            <p className="text-sm text-[#0F2936]/65">
              Acesse para gerenciar imóveis, leads, depoimentos e gerar Landing Pages de empreendimentos.
            </p>
          </div>

          {loginError && (
            <div className="text-xs font-medium text-[#DC2626] bg-[#DC2626]/8 border border-[#DC2626]/20 rounded-lg px-3.5 py-2.5">
              {loginError}
            </div>
          )}

          <button
            type="button"
            disabled={loggingIn}
            onClick={handleDirectAdminEntry}
            className="w-full py-3.5 px-5 bg-[#C59B48] hover:bg-[#B08839] text-[#081820] font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            {loggingIn ? 'Entrando no Painel...' : 'Entrar no Painel Admin'}
          </button>

          <div className="relative py-1 flex items-center">
            <div className="flex-grow border-t border-[#0F2936]/10" />
            <span className="px-3 text-xs text-[#0F2936]/45">ou entre com outra conta</span>
            <div className="flex-grow border-t border-[#0F2936]/10" />
          </div>

          <form onSubmit={handleCredentialLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/75 mb-1">
                E-mail de acesso
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@x.com"
                className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/75 mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 bg-[#0F2936] hover:bg-[#163A4D] text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
            >
              {loggingIn ? 'Entrando...' : 'Entrar com E-mail e Senha'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogleSync}
            className="w-full py-3 border border-[#0F2936]/20 hover:border-[#C59B48] text-[#0F2936] font-semibold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Entrar com Google (Firebase Auth)
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="block w-full text-center text-xs text-[#0F2936]/60 hover:text-[#0F2936] cursor-pointer"
          >
            ← Voltar ao site público
          </button>
        </div>
      </div>
    );
  }

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'landing_pages',
      label: 'Landing Pages',
      icon: <Sparkles className="w-4 h-4 text-[#C59B48]" />,
    },
    { id: 'properties', label: 'Gestão de Imóveis', icon: <Home className="w-4 h-4" /> },
    { id: 'developments', label: 'Empreendimentos', icon: <Building2 className="w-4 h-4" /> },
    { id: 'leads', label: 'Leads e Mensagens', icon: <Users className="w-4 h-4" /> },
    { id: 'testimonials', label: 'Depoimentos', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
  ];

  const publishedLpsCount = store.landingPages.filter((lp) => lp.status === 'published').length;
  const activePropsCount = store.properties.filter((p) => p.status === 'Disponível').length;
  const filteredLeads = store.leads.filter((l) =>
    leadFilter === 'Todos' ? true : l.status === leadFilter
  );

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestName.trim() || !newTestQuote.trim()) return;
    const now = new Date().toISOString();
    await onSaveTestimonial(
      {
        id: `test_${Date.now()}`,
        clientName: newTestName.trim(),
        clientRole: newTestRole.trim() || 'Cliente',
        city: newTestCity.trim() || 'Estância Velha · RS',
        quote: newTestQuote.trim(),
        approved: true,
        createdAt: now,
        updatedAt: now,
      },
      true
    );
    setNewTestName('');
    setNewTestRole('');
    setNewTestQuote('');
  };

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings({ ...settingsForm, updatedAt: new Date().toISOString() });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 bg-[#0F2936] text-white shrink-0 flex flex-col justify-between">
        <div className="p-5 space-y-6">
          <div className="pb-4 border-b border-white/10">
            <BrandLogo variant="light" />
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-white/12 text-white font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-5 border-t border-white/10 space-y-2 hidden lg:block">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="w-full text-left px-3 py-2 text-xs font-medium text-white/75 hover:text-white cursor-pointer"
          >
            Ver Site Público ↗
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#D8B467] hover:text-white cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#0F2936]/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm font-medium text-[#0F2936]/65">
            Painel Administrativo <span aria-hidden="true">/</span>{' '}
            <span className="text-[#0F2936] font-semibold">
              {navItems.find((n) => n.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!firebaseConnected ? (
              <button
                type="button"
                onClick={handleGoogleSync}
                className="px-3.5 py-2 border border-[#C59B48] text-[#0F2936] text-xs font-semibold rounded-lg hover:bg-[#C59B48]/10 cursor-pointer"
              >
                Sincronizar Firebase (Google)
              </button>
            ) : (
              <span className="text-xs font-semibold text-[#16A34A]">
                Firebase Sincronizado
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden px-3 py-1.5 text-xs font-semibold text-[#0F2936] border border-[#0F2936]/15 rounded-lg cursor-pointer"
            >
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8 max-w-6xl w-full mx-auto">
          {fbActionFeedback && activeTab !== 'settings' && (
            <div
              className={`mb-6 text-xs font-medium px-4 py-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                fbActionFeedback.type === 'success'
                  ? 'bg-[#16A34A]/10 border-[#16A34A]/25 text-[#15803D]'
                  : fbActionFeedback.type === 'warning'
                  ? 'bg-[#C59B48]/15 border-[#C59B48]/35 text-[#0F2936]'
                  : 'bg-[#DC2626]/10 border-[#DC2626]/25 text-[#DC2626]'
              }`}
            >
              <span>{fbActionFeedback.text}</span>
              <button
                type="button"
                onClick={() => setFbActionFeedback(null)}
                className="text-[11px] font-semibold underline cursor-pointer"
              >
                Fechar
              </button>
            </div>
          )}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#0F2936]/10 rounded-xl p-5">
                  <div className="text-xs text-[#0F2936]/60">Imóveis Disponíveis</div>
                  <div className="text-3xl font-bold text-[#0F2936] tabular-nums mt-1">
                    {activePropsCount}
                  </div>
                </div>
                <div className="bg-white border border-[#0F2936]/10 rounded-xl p-5">
                  <div className="text-xs text-[#0F2936]/60">Empreendimentos</div>
                  <div className="text-3xl font-bold text-[#0F2936] tabular-nums mt-1">
                    {store.developments.length}
                  </div>
                </div>
                <div className="bg-white border border-[#0F2936]/10 rounded-xl p-5">
                  <div className="text-xs text-[#0F2936]/60">Landing Pages Publicadas</div>
                  <div className="text-3xl font-bold text-[#C59B48] tabular-nums mt-1">
                    {publishedLpsCount}
                  </div>
                </div>
                <div className="bg-white border border-[#0F2936]/10 rounded-xl p-5">
                  <div className="text-xs text-[#0F2936]/60">Leads Capturados</div>
                  <div className="text-3xl font-bold text-[#0F2936] tabular-nums mt-1">
                    {store.leads.length}
                  </div>
                </div>
              </div>

              {/* Highlight CTA for Landing Page Generator */}
              <div className="bg-[#0F2936] text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="text-xs font-semibold text-[#D8B467]">
                    Ferramenta Estratégica de Vendas
                  </div>
                  <h2 className="font-serif text-2xl font-semibold">
                    Gerar Landing Page Premium de Empreendimento
                  </h2>
                  <p className="text-sm text-white/75">
                    Crie páginas exclusivas com link limpo para divulgar lançamentos no Instagram, WhatsApp e anúncios com formulário de captura integrado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('landing_pages')}
                  className="px-6 py-3 bg-[#C59B48] hover:bg-[#B08839] text-[#081820] text-sm font-semibold rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Abrir Gerador de Landing Pages
                </button>
              </div>

              {/* Recent Leads */}
              <div className="bg-white border border-[#0F2936]/10 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-semibold text-[#0F2936]">
                    Últimos Leads Recebidos
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('leads')}
                    className="text-xs font-semibold text-[#B08839] cursor-pointer"
                  >
                    Ver todos →
                  </button>
                </div>
                <div className="divide-y divide-[#0F2936]/8">
                  {store.leads.slice(0, 4).map((lead) => (
                    <div
                      key={lead.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
                    >
                      <div>
                        <span className="font-semibold text-[#0F2936]">{lead.name}</span>
                        <span className="text-[#0F2936]/55 text-xs ml-2">
                          {lead.referenceTitle || lead.source}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[#0F2936]/75">
                        {lead.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'landing_pages' && (
            <LandingPageBuilderTab
              developments={store.developments}
              landingPages={store.landingPages}
              onSaveLandingPage={onSaveLandingPage}
              onDeleteLandingPage={onDeleteLandingPage}
              onPreviewSlug={(slug) => onNavigate(`/empreendimento/${slug}`)}
            />
          )}

          {activeTab === 'properties' && (
            <PropertiesTab
              properties={store.properties}
              onSaveProperty={onSaveProperty}
              onDeleteProperty={onDeleteProperty}
            />
          )}

          {activeTab === 'developments' && (
            <DevelopmentsTab
              developments={store.developments}
              onSaveDevelopment={onSaveDevelopment}
            />
          )}

          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-serif text-2xl font-semibold text-[#0F2936]">
                  Gestão de Leads e Mensagens ({filteredLeads.length})
                </h2>

                <div className="flex items-center gap-1 p-1 bg-white border border-[#0F2936]/10 rounded-xl">
                  {['Todos', 'Novo', 'Em Atendimento', 'Agendado', 'Convertido'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setLeadFilter(st)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                        leadFilter === st
                          ? 'bg-[#0F2936] text-white'
                          : 'text-[#0F2936]/65 hover:text-[#0F2936]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredLeads.map((lead) => {
                  const cleanPhone = lead.whatsapp.replace(/\D/g, '');
                  const waHref = `https://wa.me/${
                    cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
                  }?text=${encodeURIComponent(
                    `Olá ${lead.name}, aqui é a Luciana Domingos! Recebi seu contato sobre ${
                      lead.referenceTitle || 'nosso atendimento imobiliário'
                    }.`
                  )}`;

                  return (
                    <div
                      key={lead.id}
                      className="bg-white border border-[#0F2936]/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#0F2936]/55">
                          <span className="font-semibold text-[#B08839]">{lead.source}</span>
                          {lead.referenceTitle && (
                            <>
                              <span>·</span>
                              <span>{lead.referenceTitle}</span>
                            </>
                          )}
                        </div>
                        <div className="text-base font-semibold text-[#0F2936]">
                          {lead.name}{' '}
                          <span className="text-sm font-normal text-[#0F2936]/70 tabular-nums ml-2">
                            {lead.whatsapp}
                          </span>
                        </div>
                        {lead.email && (
                          <div className="text-xs text-[#0F2936]/60">{lead.email}</div>
                        )}
                        {lead.message && (
                          <p className="text-sm text-[#0F2936]/80 pt-1">{lead.message}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            onUpdateLead({
                              ...lead,
                              status: e.target.value as LeadStatus,
                              updatedAt: new Date().toISOString(),
                            })
                          }
                          aria-label="Status do lead"
                          className="px-3 py-2 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-xs font-semibold text-[#0F2936]"
                        >
                          <option value="Novo">Novo</option>
                          <option value="Em Atendimento">Em Atendimento</option>
                          <option value="Agendado">Agendado</option>
                          <option value="Convertido">Convertido</option>
                        </select>

                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-lg"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Chamar no WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="space-y-8">
              <h2 className="font-serif text-2xl font-semibold text-[#0F2936]">
                Gestão de Depoimentos ({store.testimonials.length})
              </h2>

              <form
                onSubmit={handleAddTestimonial}
                className="bg-white border border-[#0F2936]/10 rounded-xl p-6 space-y-4"
              >
                <h3 className="font-serif text-lg font-semibold text-[#0F2936]">
                  Adicionar Novo Depoimento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    required
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    placeholder="Nome do cliente *"
                    className="px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={newTestRole}
                    onChange={(e) => setNewTestRole(e.target.value)}
                    placeholder="Perfil (ex: Comprador no Bairro Floresta)"
                    className="px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={newTestCity}
                    onChange={(e) => setNewTestCity(e.target.value)}
                    placeholder="Cidade"
                    className="px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  value={newTestQuote}
                  onChange={(e) => setNewTestQuote(e.target.value)}
                  placeholder="Depoimento do cliente *"
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2936] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Publicar Depoimento
                </button>
              </form>

              <div className="space-y-3">
                {store.testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white border border-[#0F2936]/10 rounded-xl p-5 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-[#0F2936]">
                        {t.clientName}{' '}
                        <span className="text-xs font-normal text-[#0F2936]/55">
                          · {t.clientRole} · {t.city}
                        </span>
                      </div>
                      <p className="text-sm text-[#0F2936]/80">“{t.quote}”</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onSaveTestimonial(
                            { ...t, approved: !t.approved, updatedAt: new Date().toISOString() },
                            false
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          t.approved
                            ? 'bg-[#16A34A]/15 text-[#15803D]'
                            : 'bg-[#0F2936]/10 text-[#0F2936]/60'
                        }`}
                      >
                        {t.approved ? 'Visível' : 'Oculto'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTestimonial(t.id)}
                        className="p-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg cursor-pointer"
                        aria-label="Remover depoimento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-3xl">
              <form
                onSubmit={handleSaveSettingsSubmit}
                className="bg-white border border-[#0F2936]/10 rounded-2xl p-6 sm:p-8 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-semibold text-[#0F2936]">
                    Configurações do Site
                  </h2>
                  {settingsSaved && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
                      <Check className="w-4 h-4" /> Configurações salvas
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                      Nome da Corretora
                    </label>
                    <input
                      type="text"
                      value={settingsForm.brokerName}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, brokerName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                      CRECI
                    </label>
                    <input
                      type="text"
                      value={settingsForm.creci}
                      onChange={(e) => setSettingsForm({ ...settingsForm, creci: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                      WhatsApp Oficial (somente dígitos com DDI)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.whatsappNumber}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={settingsForm.instagramHandle}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, instagramHandle: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                      Slogan Principal
                    </label>
                    <input
                      type="text"
                      value={settingsForm.slogan}
                      onChange={(e) => setSettingsForm({ ...settingsForm, slogan: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                      Título da Capa (Hero)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.heroHeadline}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, heroHeadline: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                      Endereço de Atendimento
                    </label>
                    <input
                      type="text"
                      value={settingsForm.officeAddress}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, officeAddress: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#0F2936] hover:bg-[#163A4D] text-white text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Salvar Configurações
                </button>
              </form>

              {/* Firebase Admin Auto-Provisioning Card */}
              <div className="bg-white border border-[#0F2936]/10 rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#B08839]">
                      <ShieldCheck className="w-4 h-4" />
                      Firebase Authentication & Firestore
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-[#0F2936]">
                      Cadastro Automático de Login e Senha Admin no Firebase
                    </h3>
                    <p className="text-xs text-[#0F2936]/65 max-w-xl leading-relaxed">
                      O acesso padrão (<span className="font-semibold">admin@x.com</span>) é verificado
                      e cadastrado automaticamente no Firebase Auth. Você também pode criar novos
                      logins administrativos abaixo.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={registeringAdmin}
                    onClick={handleVerifyDefaultFirebaseAdmin}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#0F2936]/20 hover:border-[#C59B48] text-xs font-semibold text-[#0F2936] rounded-lg cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${registeringAdmin ? 'animate-spin' : ''}`} />
                    Verificar Admin Padrão
                  </button>
                </div>

                {fbActionFeedback && (
                  <div
                    className={`text-xs font-medium px-3.5 py-2.5 rounded-lg border ${
                      fbActionFeedback.type === 'success'
                        ? 'bg-[#16A34A]/10 border-[#16A34A]/25 text-[#15803D]'
                        : fbActionFeedback.type === 'warning'
                        ? 'bg-[#C59B48]/15 border-[#C59B48]/35 text-[#0F2936]'
                        : 'bg-[#DC2626]/10 border-[#DC2626]/25 text-[#DC2626]'
                    }`}
                  >
                    {fbActionFeedback.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAF9F6] border border-[#0F2936]/10 rounded-xl p-4 text-xs">
                  <div>
                    <span className="text-[#0F2936]/55 block">Conta Firebase Auth ativa:</span>
                    <span className="font-semibold text-[#0F2936]">
                      {auth.currentUser?.email || fbProvisionStatus?.defaultAdmin?.email || 'admin@x.com'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#0F2936]/55 block">Status do Cadastro no Firebase:</span>
                    <span
                      className={`font-semibold ${
                        fbProvisionStatus?.defaultAdmin?.ok
                          ? 'text-[#15803D]'
                          : 'text-[#B08839]'
                      }`}
                    >
                      {fbProvisionStatus?.defaultAdmin?.ok
                        ? `Cadastrado automaticamente (UID: ${
                            fbProvisionStatus.defaultAdmin.uid?.slice(0, 10) || 'ativo'
                          }...)`
                        : fbProvisionStatus?.defaultAdmin?.message || 'Verificando...'}
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={handleRegisterNewAdminSubmit}
                  className="pt-2 border-t border-[#0F2936]/10 space-y-4"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F2936]">
                    <KeyRound className="w-4 h-4 text-[#C59B48]" />
                    Cadastrar Novo E-mail e Senha Admin no Firebase
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="novo-admin@lucianadomingos.com.br"
                      className="px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                    />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="Senha (mín. 6 caracteres)"
                      className="px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={registeringAdmin}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2936] hover:bg-[#163A4D] text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {registeringAdmin
                      ? 'Cadastrando no Firebase...'
                      : 'Cadastrar Admin Automaticamente no Firebase'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
