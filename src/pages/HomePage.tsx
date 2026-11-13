import React, { useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  Quote,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BRAND_IMAGES } from '../data/seedData.ts';
import { formatCurrency } from '../lib/dataService.ts';
import type {
  CatalogFilterPreset,
  Development,
  LandingPage,
  Property,
  SiteSettings,
  SmartSearchAnswers,
  Testimonial,
} from '../types.ts';
import {
  AnimatedCounter,
  EditorialMarquee,
  ParallaxMedia,
  Reveal,
  SpotlightCard,
  StaggerGrid,
  StaggerItem,
} from '../components/MotionPrimitives.tsx';
import { PropertyCard } from '../components/PropertyCard.tsx';
import { SafeImage } from '../components/SafeImage.tsx';
import { SmartSearchWizard } from '../components/SmartSearchWizard.tsx';

interface HomePageProps {
  properties: Property[];
  developments: Development[];
  landingPages: LandingPage[];
  testimonials: Testimonial[];
  settings: SiteSettings;
  onSmartSearch: (answers: SmartSearchAnswers) => Promise<void>;
  isSearching: boolean;
  onNavigate: (path: string) => void;
  onBrowseCatalog: (preset?: CatalogFilterPreset) => void;
  savedIds: string[];
  compareIds: string[];
  onToggleSave: (id: string) => void;
  onToggleCompare: (id: string) => void;
}

interface HeroSlide {
  key: string;
  src: string;
  name: string;
  location: string;
  stage: string;
  lpSlug?: string;
}

interface LifestyleCollection {
  id: string;
  kicker: string;
  title: string;
  description: string;
  image: string;
  preset: CatalogFilterPreset;
}

interface RegionGuide {
  city: string;
  headline: string;
  summary: string;
  highlights: string[];
  idealFor: string;
}

const SLIDE_INTERVAL_MS = 5500;

const REGION_GUIDES: RegionGuide[] = [
  {
    city: 'Estância Velha',
    headline: 'Tranquilidade residencial e natureza a minutos do eixo metropolitano',
    summary:
      'Referência em qualidade de vida, ruas arborizadas e fácil acesso à BR-116, combinando casas amplas, condomínios modernos e excelente liquidez.',
    highlights: ['Centro', 'Rincão dos Ilhéus', 'Lago Azul', 'Floresta'],
    idealFor: 'Famílias e quem busca sossego com infraestrutura completa',
  },
  {
    city: 'Novo Hamburgo',
    headline: 'Polo universitário, gastronomia e arquitetura contemporânea',
    summary:
      'Concentra bairros nobres como Hamburgo Velho e Maurício Cardoso, além de forte demanda estudantil e corporativa no entorno da Universidade Feevale.',
    highlights: ['Hamburgo Velho', 'Vila Rosa', 'Mauá', 'Operário'],
    idealFor: 'Estudantes da Feevale, executivos e investidores de locação',
  },
  {
    city: 'São Leopoldo',
    headline: 'Conectividade tecnológica e praticidade junto à Unisinos e Trensurb',
    summary:
      'Unindo tradição acadêmica, parques tecnológicos e acesso rápido a Porto Alegre, oferece apartamentos funcionais e lançamentos com alta rentabilidade.',
    highlights: ['Cristo Rei', 'Centro', 'São José', 'Jardim América'],
    idealFor: 'Universitários, profissionais híbridos e primeiro imóvel',
  },
  {
    city: 'Campo Bom',
    headline: 'Planejamento urbano exemplar, lazer ao ar livre e ciclovias integradas',
    summary:
      'Reconhecida pelo urbanismo limpo e segurança cotidiana, atrai moradores que valorizam áreas verdes, comércio acessível e valorização constante.',
    highlights: ['Centro', 'Imigrante', 'Celeste', 'Paulista'],
    idealFor: 'Quem prioriza bem-estar urbano e contato com áreas verdes',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  properties,
  developments,
  landingPages,
  testimonials,
  settings,
  onSmartSearch,
  isSearching,
  onNavigate,
  onBrowseCatalog,
  savedIds,
  compareIds,
  onToggleSave,
  onToggleCompare,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeRegionCity, setActiveRegionCity] = useState<string>('Estância Velha');

  const [collectionsEmblaRef, collectionsEmblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  const featuredProperties = properties
    .filter((p) => p.status !== 'Vendido')
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 6);

  const publishedLpByDev = useMemo(
    () =>
      new Map(
        landingPages
          .filter((lp) => lp.status === 'published')
          .map((lp) => [lp.developmentId, lp])
      ),
    [landingPages]
  );

  const heroSlides = useMemo<HeroSlide[]>(() => {
    const slides: HeroSlide[] = [];
    const seenUrls = new Set<string>();

    developments.forEach((dev) => {
      const src = dev.heroImage?.trim();
      if (src && !seenUrls.has(src)) {
        seenUrls.add(src);
        slides.push({
          key: `${dev.id}-hero`,
          src,
          name: dev.name,
          location: `${dev.neighborhood} · ${dev.city}`,
          stage: dev.stage,
          lpSlug: publishedLpByDev.get(dev.id)?.slug,
        });
      }
    });

    developments.forEach((dev) => {
      (dev.galleryImages || []).forEach((imgUrl, idx) => {
        const src = imgUrl?.trim();
        if (src && !seenUrls.has(src)) {
          seenUrls.add(src);
          slides.push({
            key: `${dev.id}-gallery-${idx}`,
            src,
            name: dev.name,
            location: `${dev.neighborhood} · ${dev.city}`,
            stage: dev.stage,
            lpSlug: publishedLpByDev.get(dev.id)?.slug,
          });
        }
      });
    });

    if (slides.length === 0) {
      slides.push({
        key: 'fallback-hero',
        src: BRAND_IMAGES.hero,
        name: 'Estância Velha e Vale dos Sinos',
        location: 'Imóveis selecionados na região',
        stage: settings.creci,
      });
    }

    return slides;
  }, [developments, publishedLpByDev, settings.creci]);

  const lifestyleCollections = useMemo<LifestyleCollection[]>(
    () => [
      {
        id: 'universitario',
        kicker: 'Vida Acadêmica',
        title: 'Próximo a Faculdades',
        description:
          'Studios e apartamentos estratégicos perto da Feevale e Unisinos para estudar ou rentabilizar.',
        image: BRAND_IMAGES.devVista,
        preset: { onlyNearUni: true },
      },
      {
        id: 'casas',
        kicker: 'Espaço & Privacidade',
        title: 'Casas & Condomínios',
        description:
          'Residências térreas e sobrados com pátio, área gourmet e tranquilidade para a família.',
        image: BRAND_IMAGES.devReserva,
        preset: { propertyType: 'Casa' },
      },
      {
        id: 'altopadrao',
        kicker: 'Arquitetura & Conforto',
        title: 'Apartamentos Exclusivos',
        description:
          'Plantas amplas, varandas integradas e acabamentos nobres nos bairros mais desejados.',
        image: BRAND_IMAGES.interiorLiving,
        preset: { propertyType: 'Apartamento', purpose: 'Venda' },
      },
      {
        id: 'locacao',
        kicker: 'Agilidade & Praticidade',
        title: 'Locações Selecionadas',
        description:
          'Imóveis prontos para morar com excelente localização, segurança e atendimento humano.',
        image: BRAND_IMAGES.leisureAmenities,
        preset: { purpose: 'Locação' },
      },
    ],
    []
  );

  const regionStats = useMemo(() => {
    return REGION_GUIDES.map((guide) => {
      const cityProps = properties.filter(
        (p) => p.status !== 'Vendido' && p.city.toLowerCase() === guide.city.toLowerCase()
      );
      const saleProps = cityProps.filter((p) => p.purpose === 'Venda' && p.areaSqm > 0);
      const avgSqm =
        saleProps.length > 0
          ? Math.round(
              saleProps.reduce((sum, p) => sum + p.price / p.areaSqm, 0) / saleProps.length
            )
          : 0;
      const cityDevs = developments.filter(
        (d) => d.city.toLowerCase() === guide.city.toLowerCase()
      ).length;

      return {
        ...guide,
        availableCount: cityProps.length,
        devCount: cityDevs,
        avgSqm,
      };
    });
  }, [developments, properties]);

  const currentRegion =
    regionStats.find((r) => r.city === activeRegionCity) ?? regionStats[0];

  useEffect(() => {
    if (shouldReduceMotion || isPaused || heroSlides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [heroSlides.length, isPaused, shouldReduceMotion]);

  const safeIndex = slideIndex % heroSlides.length;
  const currentSlide = heroSlides[safeIndex];

  const handlePrevSlide = () => {
    setSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleNextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const flagshipDev = developments[0];
  const secondaryDev = developments[1];

  return (
    <div>
      {/* 1. Cinematic Parallax Hero + Registered Developments Slideshow */}
      <section
        className="relative bg-[#081820] overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <ParallaxMedia className="absolute inset-0" offsetRange={[-20, 48]}>
          <AnimatePresence mode="sync" initial={false}>
            <motion.div
              key={currentSlide.key}
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, scale: 1.09 }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1.01 }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.0 }
              }
              transition={{
                opacity: { duration: 1.15, ease: [0.16, 1, 0.3, 1] },
                scale: { duration: 6.2, ease: 'easeOut' },
              }}
              className="absolute inset-0 w-full h-full will-change-transform"
            >
              <SafeImage
                src={currentSlide.src}
                alt={`${currentSlide.name} — ${currentSlide.location}`}
                fallbackLabel={currentSlide.name}
                className="w-full h-full object-cover opacity-55"
              />
            </motion.div>
          </AnimatePresence>
        </ParallaxMedia>
        <div className="absolute inset-0 bg-gradient-to-b from-[#081820]/75 via-[#0F2936]/65 to-[#0F2936]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <Reveal className="max-w-3xl mb-10 space-y-5">
            <div className="text-xs sm:text-sm font-medium text-[#D8B467] tracking-wide">
              Estância Velha e Vale dos Sinos · {settings.creci}
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[62px] font-semibold text-white leading-[1.06] [text-wrap:balance]">
              {settings.heroHeadline}
            </h1>
            <p className="text-base sm:text-lg text-[#FAF9F6]/85 leading-relaxed max-w-2xl">
              {settings.heroSubheadline}
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <SmartSearchWizard onSubmit={onSmartSearch} isSearching={isSearching} />
          </Reveal>

          {heroSlides.length > 0 && (
            <div className="mt-7 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-white/80">
              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    currentSlide.lpSlug
                      ? `/empreendimento/${currentSlide.lpSlug}`
                      : '/empreendimentos'
                  )
                }
                className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-left hover:text-[#D8B467] transition-colors cursor-pointer group"
              >
                <span className="text-[#D8B467] font-semibold">
                  {currentSlide.name}
                </span>
                <span aria-hidden="true" className="text-white/35">
                  ·
                </span>
                <span className="text-white/75 group-hover:text-white transition-colors">
                  {currentSlide.location}
                </span>
                {currentSlide.stage && (
                  <>
                    <span aria-hidden="true" className="text-white/35">
                      ·
                    </span>
                    <span className="text-white/60">{currentSlide.stage}</span>
                  </>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-[#D8B467] transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>

              {heroSlides.length > 1 && (
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <div className="flex items-center gap-1" role="tablist" aria-label="Fotos dos empreendimentos">
                    {heroSlides.map((slide, idx) => {
                      const active = idx === safeIndex;
                      return (
                        <button
                          key={slide.key}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          aria-label={`Exibir foto de ${slide.name}`}
                          onClick={() => setSlideIndex(idx)}
                          className="py-3 px-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B467] rounded"
                        >
                          <span
                            className={`block h-[2px] rounded-full transition-all duration-300 ${
                              active
                                ? 'w-8 bg-[#D8B467]'
                                : 'w-4 bg-white/30 hover:bg-white/60'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevSlide}
                      aria-label="Foto anterior dos empreendimentos"
                      className="w-10 h-10 rounded-full border border-white/15 hover:border-[#D8B467]/70 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextSlide}
                      aria-label="Próxima foto dos empreendimentos"
                      className="w-10 h-10 rounded-full border border-white/15 hover:border-[#D8B467]/70 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Subtle Editorial Marquee Divider */}
      <EditorialMarquee
        items={[
          'Estância Velha & Vale dos Sinos',
          'Consultoria Imobiliária Personalizada',
          'Empreendimentos Selecionados',
          'Atendimento Consultivo Luciana Domingos',
          settings.creci,
        ]}
      />

      {/* 2. Sotheby's-inspired Editorial Lifestyle Collections (Embla Touch Carousel) */}
      <section className="py-16 sm:py-22 bg-white border-b border-[#0F2936]/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold text-[#B08839] mb-2">
                Estilos de Morar
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#0F2936]">
                Explore imóveis pelo seu momento de vida
              </h2>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => collectionsEmblaApi?.scrollPrev()}
                aria-label="Coleção anterior"
                className="w-10 h-10 rounded-full border border-[#0F2936]/15 flex items-center justify-center text-[#0F2936] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => collectionsEmblaApi?.scrollNext()}
                aria-label="Próxima coleção"
                className="w-10 h-10 rounded-full border border-[#0F2936]/15 flex items-center justify-center text-[#0F2936] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </Reveal>

          <div ref={collectionsEmblaRef} className="overflow-hidden lg:overflow-visible">
            <div className="flex lg:grid lg:grid-cols-4 gap-5">
              {lifestyleCollections.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => onBrowseCatalog(col.preset)}
                  className="group relative flex-[0_0_82%] sm:flex-[0_0_46%] lg:flex-none rounded-2xl overflow-hidden border border-[#0F2936]/10 bg-[#081820] text-left aspect-[4/5] cursor-pointer"
                >
                  <SafeImage
                    src={col.image}
                    alt={col.title}
                    fallbackLabel={col.title}
                    className="w-full h-full object-cover opacity-80 transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081820]/95 via-[#081820]/40 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6 space-y-2">
                    <div className="text-xs font-medium text-[#D8B467]">{col.kicker}</div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-serif text-2xl font-semibold text-white leading-snug">
                        {col.title}
                      </h3>
                      <ArrowUpRight className="w-4 h-4 text-[#D8B467] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <p className="text-xs text-white/75 leading-relaxed line-clamp-2">
                      {col.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Asymmetric Bento Showcase — Featured Developments */}
      <section className="py-16 sm:py-24 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold text-[#B08839] mb-2">
                Lançamentos e Empreendimentos
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#0F2936]">
                Projetos selecionados no Vale dos Sinos
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/empreendimentos')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F2936] hover:text-[#B08839] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ver todos os empreendimentos
              <ArrowRight className="w-4 h-4" />
            </button>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Flagship Bento Card (7 cols) */}
            {flagshipDev && (
              <Reveal className="lg:col-span-7 flex">
                <SpotlightCard
                  dark
                  className="bg-[#0F2936] text-white rounded-2xl border border-[#C59B48]/25 flex flex-col w-full overflow-hidden group"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#081820]">
                    <SafeImage
                      src={flagshipDev.heroImage}
                      alt={flagshipDev.name}
                      fallbackLabel={flagshipDev.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0F2936] via-[#0F2936]/45 to-transparent" />
                    <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs font-medium text-white">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#D8B467]" />
                        {flagshipDev.neighborhood} · {flagshipDev.city}
                      </span>
                      <span className="text-[#D8B467] font-semibold">
                        {flagshipDev.stage}
                      </span>
                    </div>
                  </div>

                  <div className="p-7 sm:p-9 flex-1 flex flex-col justify-between gap-6 relative z-10">
                    <div>
                      <div className="text-xs text-[#D8B467] font-medium mb-1.5">
                        {flagshipDev.developer} · Entrega prevista: {flagshipDev.deliveryDate}
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                        {flagshipDev.name}
                      </h3>
                      <p className="text-sm sm:text-base text-white/75 mt-2.5 leading-relaxed">
                        {flagshipDev.tagline}
                      </p>
                    </div>

                    <div className="pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-white/60">Unidades a partir de</div>
                        <div className="text-2xl font-bold text-white tabular-nums">
                          {formatCurrency(flagshipDev.startingPrice)}
                        </div>
                      </div>

                      {publishedLpByDev.get(flagshipDev.id) ? (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate(
                              `/empreendimento/${publishedLpByDev.get(flagshipDev.id)!.slug}`
                            )
                          }
                          className="inline-flex items-center gap-2 px-6 py-3 bg-[#C59B48] hover:bg-[#B08839] text-[#081820] text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          Explorar Página Exclusiva
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNavigate('/empreendimentos')}
                          className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          Ver Detalhes
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            )}

            {/* Right Column Bento Stack (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {secondaryDev && (
                <Reveal delay={0.08} className="flex-1 flex">
                  <SpotlightCard className="bg-white border border-[#0F2936]/10 hover:border-[#C59B48]/75 rounded-2xl flex flex-col w-full overflow-hidden group transition-colors">
                    <div className="relative aspect-[16/9] overflow-hidden bg-[#F2F4F6]">
                      <SafeImage
                        src={secondaryDev.heroImage}
                        alt={secondaryDev.name}
                        fallbackLabel={secondaryDev.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />
                      <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between text-white text-xs font-medium">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#D8B467]" />
                          {secondaryDev.neighborhood} · {secondaryDev.city}
                        </span>
                        <span className="text-[#D8B467] font-semibold">
                          {secondaryDev.stage}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between gap-4 relative z-10">
                      <div>
                        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#0F2936]">
                          {secondaryDev.name}
                        </h3>
                        <p className="text-sm text-[#0F2936]/75 mt-1.5 leading-relaxed">
                          {secondaryDev.tagline}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#0F2936]/8 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-[#0F2936]/55">A partir de</div>
                          <div className="text-lg font-bold text-[#0F2936] tabular-nums">
                            {formatCurrency(secondaryDev.startingPrice)}
                          </div>
                        </div>

                        {publishedLpByDev.get(secondaryDev.id) ? (
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate(
                                `/empreendimento/${publishedLpByDev.get(secondaryDev.id)!.slug}`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0F2936] hover:bg-[#163A4D] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            Conhecer Projeto
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onNavigate('/empreendimentos')}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-[#0F2936]/20 hover:border-[#C59B48] text-[#0F2936] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            Ver Detalhes
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </SpotlightCard>
                </Reveal>
              )}

              {/* Architectural Advisory Bento Tile with Animated Counters */}
              <Reveal delay={0.14}>
                <div className="bg-white border border-[#0F2936]/10 rounded-2xl p-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2936]">
                      <AnimatedCounter value={100} suffix="%" />
                    </div>
                    <div className="text-xs text-[#0F2936]/60 mt-0.5">
                      Seleção Direta
                    </div>
                  </div>
                  <div className="border-x border-[#0F2936]/10 px-2">
                    <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#C59B48]">
                      <AnimatedCounter value={4} suffix=" cidades" />
                    </div>
                    <div className="text-xs text-[#0F2936]/60 mt-0.5">
                      Vale dos Sinos
                    </div>
                  </div>
                  <div>
                    <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2936]">
                      CRECI
                    </div>
                    <div className="text-xs text-[#0F2936]/60 mt-0.5 tabular-nums">
                      73892F
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Curated Properties Grid with Save & Side-by-Side Comparison */}
      <section className="py-16 sm:py-24 bg-white border-y border-[#0F2936]/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold text-[#B08839] mb-2">
                Imóveis Selecionados
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#0F2936]">
                Opções prontas para morar ou investir
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onBrowseCatalog()}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F2936] hover:text-[#B08839] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Explorar catálogo completo
              <ArrowRight className="w-4 h-4" />
            </button>
          </Reveal>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {featuredProperties.map((property) => (
              <StaggerItem key={property.id}>
                <PropertyCard
                  property={property}
                  onSelect={(id) => onNavigate(`/imovel/${id}`)}
                  isSaved={savedIds.includes(property.id)}
                  onToggleSave={onToggleSave}
                  isCompared={compareIds.includes(property.id)}
                  onToggleCompare={onToggleCompare}
                />
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* 5. Compass-inspired Regional Neighborhood Explorer */}
      <section className="py-16 sm:py-24 bg-[#081820] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Reveal className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#D8B467]">
                <Compass className="w-4 h-4" />
                Guia Regional · Vale dos Sinos
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-white">
                Onde você imagina construir seu próximo capítulo?
              </h2>
            </div>

            {/* Interactive Segmented City Selector */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/8 border border-white/10 rounded-xl self-start lg:self-auto">
              {regionStats.map((reg) => {
                const active = reg.city === currentRegion.city;
                return (
                  <button
                    key={reg.city}
                    type="button"
                    onClick={() => setActiveRegionCity(reg.city)}
                    className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#C59B48] text-[#081820] font-semibold'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    {reg.city}
                  </button>
                );
              })}
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 bg-[#0F2936] border border-white/10 rounded-2xl p-7 sm:p-10 flex flex-col justify-between gap-8">
              <div className="space-y-4">
                <div className="text-xs font-medium text-[#D8B467]">
                  {currentRegion.city} · Rio Grande do Sul
                </div>
                <h3 className="font-serif text-2xl sm:text-4xl font-semibold text-white leading-snug">
                  {currentRegion.headline}
                </h3>
                <p className="text-sm sm:text-base text-white/75 leading-relaxed">
                  {currentRegion.summary}
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-white/55">Perfil recomendado</div>
                  <div className="text-sm font-medium text-white/90 mt-0.5">
                    {currentRegion.idealFor}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onBrowseCatalog({ city: currentRegion.city })}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#C59B48] hover:bg-[#B08839] text-[#081820] text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Ver imóveis em {currentRegion.city}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="bg-[#0F2936] border border-white/10 rounded-2xl p-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-serif text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                    {currentRegion.availableCount}
                  </div>
                  <div className="text-xs text-white/60 mt-1">Imóveis ativos</div>
                </div>
                <div className="border-x border-white/10 px-2">
                  <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#D8B467] tabular-nums">
                    {currentRegion.devCount}
                  </div>
                  <div className="text-xs text-white/60 mt-1">Empreendimentos</div>
                </div>
                <div>
                  <div className="font-serif text-xl sm:text-2xl font-semibold text-white tabular-nums">
                    {currentRegion.avgSqm > 0
                      ? formatCurrency(currentRegion.avgSqm)
                      : 'Sob consulta'}
                  </div>
                  <div className="text-xs text-white/60 mt-1">Média por m²</div>
                </div>
              </div>

              <div className="bg-[#0F2936] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="text-xs font-semibold text-[#D8B467]">
                  Principais bairros atendidos
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-white/85">
                  {currentRegion.highlights.map((bairro) => (
                    <div
                      key={bairro}
                      className="flex items-center gap-2 py-1.5 border-b border-white/8"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#D8B467] shrink-0" />
                      <span>{bairro}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. About Luciana Domingos + Adjacent Social Proof */}
      <section className="py-16 sm:py-24 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <Reveal className="lg:col-span-5">
              <ParallaxMedia
                className="w-full aspect-[1268/1241] rounded-2xl border border-[#0F2936]/10 bg-white"
                offsetRange={[0, 0]}
                scale={1}
              >
                <SafeImage
                  src="https://i.postimg.cc/J7Nj4FY9/Retrato-corporativo-de-mulher-sorridente.png"
                  alt="Luciana Domingos Corretora de Imóveis CRECI 73892F"
                  className="w-full h-full object-contain object-center"
                />
              </ParallaxMedia>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <div className="text-xs font-semibold text-[#B08839]">
                Consultoria Imobiliária Humana · {settings.creci}
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-semibold text-[#0F2936] leading-[1.1]">
                {settings.slogan}
              </h2>
              <p className="text-base text-[#0F2936]/75 leading-relaxed">
                Sou Luciana Domingos, corretora especialista em agenciamentos e vendas em Estância Velha e em todo o Vale dos Sinos. Meu trabalho nasce da escuta atenta: entender como você vive, quem vai compartilhar esse espaço e quais sonhos acompanham essa escolha.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C59B48] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-[#0F2936]">
                      Seleção sob medida
                    </div>
                    <div className="text-xs text-[#0F2936]/65 mt-0.5">
                      Menos visitas improdutivas e mais assertividade no perfil real.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-[#C59B48] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-[#0F2936]">
                      Segurança jurídica e regional
                    </div>
                    <div className="text-xs text-[#0F2936]/65 mt-0.5">
                      Domínio completo de bairros, construtoras e valorização local.
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('/sobre')}
                  className="px-6 py-3 bg-[#0F2936] hover:bg-[#163A4D] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Conhecer Minha História
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/contato')}
                  className="px-6 py-3 border border-[#0F2936]/20 hover:border-[#C59B48] text-[#0F2936] text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Agendar Conversa
                </button>
              </div>
            </Reveal>
          </div>

          {testimonials.length > 0 && (
            <div className="mt-16 pt-14 border-t border-[#0F2936]/10">
              <Reveal className="mb-8">
                <div className="text-xs font-semibold text-[#B08839] mb-2">
                  Histórias Reais no Vale dos Sinos
                </div>
                <h3 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0F2936]">
                  Quem realizou o sonho com nossa consultoria
                </h3>
              </Reveal>

              <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.slice(0, 3).map((t) => (
                  <StaggerItem key={t.id}>
                    <blockquote className="bg-white border border-[#0F2936]/10 rounded-2xl p-6 sm:p-7 h-full flex flex-col justify-between gap-5">
                      <div>
                        <Quote className="w-6 h-6 text-[#C59B48] mb-3" />
                        <p className="text-sm text-[#0F2936]/80 leading-relaxed">
                          “{t.quote}”
                        </p>
                      </div>
                      <footer className="pt-4 border-t border-[#0F2936]/8">
                        <div className="text-sm font-semibold text-[#0F2936]">
                          {t.clientName}
                        </div>
                        <div className="text-xs text-[#0F2936]/55 mt-0.5">
                          {t.clientRole} · {t.city}
                        </div>
                      </footer>
                    </blockquote>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
