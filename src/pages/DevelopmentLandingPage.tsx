import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Quote,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, submitPublicLead } from '../lib/dataService.ts';
import type { Development, LandingPage, SiteSettings } from '../types.ts';
import { BrandLogo } from '../components/BrandLogo.tsx';
import { EmblaPropertyGallery } from '../components/EmblaPropertyGallery.tsx';
import { LightboxModal } from '../components/LightboxModal.tsx';
import {
  EditorialMarquee,
  ParallaxMedia,
  Reveal,
  ScrollProgressHairline,
  SpotlightCard,
  StaggerGrid,
  StaggerItem,
} from '../components/MotionPrimitives.tsx';
import { SafeImage } from '../components/SafeImage.tsx';

interface DevelopmentLandingPageProps {
  landingPage: LandingPage;
  development?: Development;
  settings: SiteSettings;
  isAdminPreview?: boolean;
  onPublishFromPreview?: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export const DevelopmentLandingPage: React.FC<DevelopmentLandingPageProps> = ({
  landingPage,
  development,
  settings,
  isAdminPreview = false,
  onPublishFromPreview,
  onNavigate,
}) => {
  const [galleryTab, setGalleryTab] = useState<'perspectivas' | 'plantas'>('perspectivas');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (landingPage.seoTitle) {
      document.title = landingPage.seoTitle;
    }
    return () => {
      document.title = 'Luciana Domingos Imóveis | Estância Velha e Vale dos Sinos';
    };
  }, [landingPage.seoTitle]);

  const activeMediaList =
    galleryTab === 'plantas' && landingPage.floorPlanImages.length > 0
      ? landingPage.floorPlanImages
      : landingPage.galleryImages;

  const waUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá Luciana! Vi a página exclusiva do empreendimento ${landingPage.heroTitle} e quero receber a tabela e disponibilidade.`
  )}`;

  const scrollToForm = () => {
    document.getElementById('lp-lead-capture')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim()) return;
    setSending(true);
    try {
      await submitPublicLead({
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        message: `Interesse na Landing Page do empreendimento ${landingPage.heroTitle}.`,
        source: 'landing_page',
        referenceId: landingPage.id,
        referenceTitle: landingPage.heroTitle,
      });
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#FAF9F6] text-[#0F2936] min-h-screen">
      <ScrollProgressHairline />

      <LightboxModal
        images={activeMediaList}
        activeIndex={lightboxIndex}
        title={landingPage.heroTitle}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={(idx) => setLightboxIndex(idx)}
      />

      {/* Draft Admin Preview Bar */}
      {isAdminPreview && landingPage.status === 'draft' && (
        <div className="bg-[#C59B48] text-[#081820] px-4 py-2.5 text-xs sm:text-sm font-semibold flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="inline-flex items-center gap-1.5 underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Painel
            </button>
            <span>Modo Pré-visualização (Rascunho — ainda não visível ao público)</span>
          </div>
          {onPublishFromPreview && (
            <button
              type="button"
              onClick={onPublishFromPreview}
              className="px-4 py-1.5 bg-[#0F2936] text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Publicar Landing Page Agora
            </button>
          )}
        </div>
      )}

      {/* Clean Dedicated LP Header (3-Zone Contract) */}
      <header className="bg-[#081820]/95 backdrop-blur-xl text-white border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="cursor-pointer shrink-0"
          >
            <BrandLogo variant="light" />
          </button>

          <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm text-white/80 font-medium">
            <a href="#lp-diferenciais" className="hover:text-[#D8B467] whitespace-nowrap">
              Diferenciais
            </a>
            <a href="#lp-galeria" className="hover:text-[#D8B467] whitespace-nowrap">
              Galeria & Plantas
            </a>
            <a href="#lp-tipologias" className="hover:text-[#D8B467] whitespace-nowrap">
              Tipologias
            </a>
            <a href="#lp-localizacao" className="hover:text-[#D8B467] whitespace-nowrap">
              Localização
            </a>
            <a href="#lp-investir" className="hover:text-[#D8B467] whitespace-nowrap">
              Investimento
            </a>
          </nav>

          <button
            type="button"
            onClick={scrollToForm}
            className="px-4 py-2.5 bg-[#C59B48] hover:bg-[#B08839] text-[#081820] text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Receber Tabela
          </button>
        </div>
      </header>

      {/* 1. Impactful Parallax Hero */}
      <section className="relative bg-[#081820] text-white overflow-hidden">
        <ParallaxMedia className="absolute inset-0" offsetRange={[-24, 52]}>
          <SafeImage
            src={landingPage.heroImage || development?.heroImage}
            alt={landingPage.heroTitle}
            className="w-full h-full object-cover opacity-55"
          />
        </ParallaxMedia>
        <div className="absolute inset-0 bg-gradient-to-t from-[#081820] via-[#081820]/65 to-[#081820]/35" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <Reveal className="max-w-3xl space-y-6">
            <div className="text-xs sm:text-sm font-semibold text-[#D8B467] tracking-wide">
              {development
                ? `${development.neighborhood} · ${development.city} · ${development.stage}`
                : 'Apresentação Exclusiva · Luciana Domingos Imóveis'}
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-semibold leading-[1.04]">
              {landingPage.heroTitle}
            </h1>
            <p className="font-serif italic text-xl sm:text-3xl text-[#FAF9F6]/90 leading-snug">
              {landingPage.heroSlogan}
            </p>
            <p className="text-base sm:text-lg text-[#FAF9F6]/80 leading-relaxed max-w-2xl">
              {landingPage.heroSubtitle}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={scrollToForm}
                className="px-7 py-4 bg-[#C59B48] hover:bg-[#B08839] text-[#081820] font-semibold text-sm sm:text-base rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                {landingPage.ctaPrimaryText || 'Receber Tabela e Plantas Exclusivas'}
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 bg-white/10 hover:bg-white/15 border border-white/25 text-white font-semibold text-sm sm:text-base rounded-xl transition-colors inline-flex items-center gap-2 backdrop-blur-md"
              >
                <MessageCircle className="w-4 h-4 text-[#D8B467]" />
                Falar com Luciana no WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <EditorialMarquee
        dark
        items={[
          landingPage.heroTitle,
          development ? `${development.neighborhood} · ${development.city}` : 'Vale dos Sinos',
          development?.stage || 'Apresentação Exclusiva',
          `Assessoria ${settings.brokerName} · ${settings.creci}`,
        ]}
      />

      {/* 2. Differentials & Strengths */}
      <section id="lp-diferenciais" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mb-12">
            <div className="text-xs font-semibold text-[#B08839] mb-2">
              Arquitetura e Propósito
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#0F2936]">
              Diferenciais que elevam sua qualidade de vida
            </h2>
          </Reveal>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {landingPage.differentials.map((diff, idx) => (
              <StaggerItem key={`${diff.title}-${idx}`}>
                <SpotlightCard className="p-7 sm:p-8 rounded-2xl bg-[#FAF9F6] border border-[#0F2936]/10 hover:border-[#C59B48]/70 h-full space-y-3 transition-colors">
                  <div className="font-serif text-3xl font-semibold text-[#C59B48] tabular-nums relative z-10">
                    0{idx + 1}.
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-[#0F2936] relative z-10">
                    {diff.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#0F2936]/75 leading-relaxed relative z-10">
                    {diff.description}
                  </p>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* 3. Gallery & Floor Plans with Fullscreen Lightbox */}
      <section id="lp-galeria" className="py-16 sm:py-24 bg-[#FAF9F6] border-y border-[#0F2936]/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-[#B08839] mb-2">
                Ambientes e Espaços
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#0F2936]">
                Galeria de Perspectivas e Plantas
              </h2>
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-white border border-[#0F2936]/10 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setGalleryTab('perspectivas')}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  galleryTab === 'perspectivas'
                    ? 'bg-[#0F2936] text-white'
                    : 'text-[#0F2936]/70 hover:text-[#0F2936]'
                }`}
              >
                Perspectivas
              </button>
              <button
                type="button"
                onClick={() => setGalleryTab('plantas')}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  galleryTab === 'plantas'
                    ? 'bg-[#0F2936] text-white'
                    : 'text-[#0F2936]/70 hover:text-[#0F2936]'
                }`}
              >
                Plantas Baixas
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <EmblaPropertyGallery
              images={activeMediaList}
              title={landingPage.heroTitle}
              aspectClass="aspect-[16/9]"
              onOpenLightbox={(idx) => setLightboxIndex(idx)}
            />
          </Reveal>
        </div>
      </section>

      {/* 4. Available Typologies */}
      <section id="lp-tipologias" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Reveal className="max-w-2xl">
            <div className="text-xs font-semibold text-[#B08839] mb-2">
              Plantas Disponíveis
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#0F2936]">
              Tipologias pensadas para cada momento
            </h2>
          </Reveal>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {landingPage.typologies.map((typ, idx) => (
              <StaggerItem key={`${typ.name}-${idx}`}>
                <SpotlightCard className="bg-[#FAF9F6] border border-[#0F2936]/12 hover:border-[#C59B48]/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6 h-full transition-colors">
                  <div className="space-y-3 relative z-10">
                    <h3 className="font-serif text-2xl font-semibold text-[#0F2936]">
                      {typ.name}
                    </h3>
                    <div className="space-y-1.5 text-sm text-[#0F2936]/75">
                      <div>Metragem: {typ.areaSqm}</div>
                      <div>Configuração: {typ.bedrooms}</div>
                      <div>Garagem: {typ.parking}</div>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-[#0F2936]/10 space-y-4 relative z-10">
                    <div>
                      <div className="text-xs text-[#0F2936]/55">A partir de</div>
                      <div className="text-2xl font-bold text-[#0F2936] tabular-nums">
                        {typ.priceFrom > 0 ? formatCurrency(typ.priceFrom) : 'Sob consulta'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={scrollToForm}
                      className="w-full py-3 px-4 bg-[#0F2936] hover:bg-[#163A4D] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Solicitar Unidades Disponíveis
                    </button>
                  </div>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* 5. Location & Map + 6. Leisure Bento */}
      <section id="lp-localizacao" className="py-16 sm:py-24 bg-[#0F2936] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <Reveal className="lg:col-span-6 space-y-6">
              <div className="text-xs font-semibold text-[#D8B467]">
                Localização Estratégica
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-semibold">
                Conectado ao melhor de Estância Velha e Vale dos Sinos
              </h2>
              <p className="text-base text-[#FAF9F6]/80 leading-relaxed">
                {landingPage.locationSummary}
              </p>
              <div className="space-y-3 pt-2">
                {landingPage.nearbyHighlights.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-[#FAF9F6]/90">
                    <MapPin className="w-4 h-4 text-[#D8B467] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#153647] aspect-[16/10] shadow-xl">
                <iframe
                  title={`Mapa de ${landingPage.heroTitle}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    landingPage.mapQuery || 'Estância Velha, RS'
                  )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>

          <div className="pt-14 border-t border-white/10">
            <Reveal className="max-w-2xl mb-8">
              <div className="text-xs font-semibold text-[#D8B467] mb-2">
                Lazer e Infraestrutura
              </div>
              <h3 className="font-serif text-3xl sm:text-4xl font-semibold">
                Áreas comuns projetadas para convívio, bem-estar e praticidade
              </h3>
            </Reveal>

            <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {landingPage.leisureHighlights.map((item) => (
                <StaggerItem key={item}>
                  <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-4 text-sm text-[#FAF9F6] transition-colors h-full">
                    <Check className="w-4 h-4 text-[#D8B467] shrink-0" />
                    <span>{item}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </div>
      </section>

      {/* 7. Why Invest + 8. Trust */}
      <section id="lp-investir" className="py-16 sm:py-24 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <Reveal className="lg:col-span-5 space-y-4">
              <div className="text-xs font-semibold text-[#B08839]">
                Tese de Valorização
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#0F2936]">
                {landingPage.whyInvestTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#0F2936]/70 leading-relaxed">
                Cada imóvel indicado pela nossa consultoria passa por análise técnica de liquidez, reputação construtiva e potencial de valorização na região.
              </p>
            </Reveal>

            <StaggerGrid className="lg:col-span-7 space-y-4">
              {landingPage.whyInvestReasons.map((reason) => (
                <StaggerItem key={reason.title}>
                  <div className="bg-white border border-[#0F2936]/10 rounded-2xl p-6 flex items-start gap-4">
                    <TrendingUp className="w-5 h-5 text-[#C59B48] shrink-0 mt-1" />
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-[#0F2936]">
                        {reason.title}
                      </h3>
                      <p className="text-sm text-[#0F2936]/75 mt-1 leading-relaxed">
                        {reason.description}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>

          <Reveal>
            <div className="bg-white border border-[#0F2936]/10 rounded-2xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <Quote className="w-7 h-7 text-[#C59B48]" />
                <p className="font-serif text-2xl sm:text-3xl text-[#0F2936] leading-relaxed">
                  “{landingPage.trustQuote}”
                </p>
                <div className="text-sm font-semibold text-[#B08839]">
                  {landingPage.trustAuthor}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-3 border-t lg:border-t-0 lg:border-l border-[#0F2936]/10 pt-6 lg:pt-0 lg:pl-8">
                <div className="flex items-center gap-3 text-sm font-medium text-[#0F2936]">
                  <ShieldCheck className="w-5 h-5 text-[#C59B48] shrink-0" />
                  <span>{settings.creci} · Atendimento Direto</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-[#0F2936]">
                  <Award className="w-5 h-5 text-[#C59B48] shrink-0" />
                  <span>Negociação Transparente</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-[#0F2936]">
                  <CheckCircle2 className="w-5 h-5 text-[#C59B48] shrink-0" />
                  <span>Especialista Vale dos Sinos</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 9. High-Conversion Lead Capture Form */}
      <section id="lp-lead-capture" className="py-16 sm:py-24 bg-[#081820] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SpotlightCard
              dark
              className="bg-[#0F2936] border border-[#C59B48]/35 rounded-2xl p-7 sm:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
            >
              <div className="md:col-span-6 space-y-4 relative z-10">
                <div className="text-xs font-semibold text-[#D8B467]">
                  Atendimento Exclusivo Luciana Domingos
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold">
                  Receba a apresentação completa e tabela atualizada
                </h2>
                <p className="text-sm text-[#FAF9F6]/75 leading-relaxed">
                  Preencha seus dados para receber plantas em alta resolução, condições de pagamento e agendar uma visita privativa com a corretora.
                </p>
                <div className="pt-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#D8B467] hover:text-white transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Preferir conversar direto no WhatsApp
                  </a>
                </div>
              </div>

              <div className="md:col-span-6 relative z-10">
                {submitted ? (
                  <div className="bg-[#081820] border border-[#C59B48]/60 rounded-xl p-6 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-[#D8B467] mx-auto" />
                    <h3 className="font-serif text-xl font-semibold">
                      Cadastro recebido!
                    </h3>
                    <p className="text-sm text-[#FAF9F6]/80">
                      Luciana Domingos enviará o material exclusivo do {landingPage.heroTitle} no seu WhatsApp em instantes.
                    </p>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-sm rounded-lg"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Abrir WhatsApp Agora
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs text-[#FAF9F6]/75 mb-1">
                        Seu nome completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Ana Paula Silva"
                        className="w-full px-4 py-3 bg-[#081820] border border-white/15 rounded-xl text-sm text-white placeholder:text-white/40 focus:border-[#C59B48]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#FAF9F6]/75 mb-1">
                        WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="(51) 99999-9999"
                        className="w-full px-4 py-3 bg-[#081820] border border-white/15 rounded-xl text-sm text-white placeholder:text-white/40 focus:border-[#C59B48]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#FAF9F6]/75 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@email.com"
                        className="w-full px-4 py-3 bg-[#081820] border border-white/15 rounded-xl text-sm text-white placeholder:text-white/40 focus:border-[#C59B48]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full py-3.5 bg-[#C59B48] hover:bg-[#B08839] text-[#081820] font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                    >
                      {sending ? 'Enviando...' : 'Quero Receber Tabela e Plantas'}
                    </button>
                  </form>
                )}
              </div>
            </SpotlightCard>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
