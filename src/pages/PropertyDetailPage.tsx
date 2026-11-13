import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Calculator,
  Car,
  Check,
  Columns3,
  GraduationCap,
  Heart,
  MapPin,
  Maximize2,
  MessageCircle,
} from 'lucide-react';
import { formatCurrency, submitPublicLead } from '../lib/dataService.ts';
import type { Property, SiteSettings } from '../types.ts';
import { EmblaPropertyGallery } from '../components/EmblaPropertyGallery.tsx';
import { LightboxModal } from '../components/LightboxModal.tsx';
import { Reveal } from '../components/MotionPrimitives.tsx';
import { PropertyCard } from '../components/PropertyCard.tsx';

interface PropertyDetailPageProps {
  property: Property;
  allProperties?: Property[];
  settings: SiteSettings;
  onBack: () => void;
  onSelectProperty?: (id: string) => void;
  savedIds?: string[];
  compareIds?: string[];
  onToggleSave?: (id: string) => void;
  onToggleCompare?: (id: string) => void;
}

export const PropertyDetailPage: React.FC<PropertyDetailPageProps> = ({
  property,
  allProperties = [],
  settings,
  onBack,
  onSelectProperty,
  savedIds = [],
  compareIds = [],
  onToggleSave,
  onToggleCompare,
}) => {
  const isSaved = savedIds.includes(property.id);
  const isCompared = compareIds.includes(property.id);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(
    `Olá Luciana, tenho interesse no imóvel "${property.title}". Gostaria de agendar uma visita ou receber mais detalhes.`
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Interactive Financing Simulator state (for Venda)
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [termYears, setTermYears] = useState(30);
  const [annualRate, setAnnualRate] = useState(9.9);
  const [amortizationSystem, setAmortizationSystem] = useState<'SAC' | 'PRICE'>('SAC');

  const simulation = useMemo(() => {
    const downPayment = Math.round((property.price * downPaymentPct) / 100);
    const financed = Math.max(0, property.price - downPayment);
    const months = termYears * 12;
    const monthlyRate = annualRate / 100 / 12;

    if (financed <= 0 || months <= 0) {
      return { downPayment, financed, firstInstallment: 0, lastInstallment: 0 };
    }

    if (amortizationSystem === 'SAC') {
      const amortization = financed / months;
      const firstInstallment = Math.round(amortization + financed * monthlyRate);
      const lastInstallment = Math.round(amortization + amortization * monthlyRate);
      return { downPayment, financed, firstInstallment, lastInstallment };
    }

    const factor = Math.pow(1 + monthlyRate, months);
    const pmt =
      monthlyRate > 0 ? financed * ((monthlyRate * factor) / (factor - 1)) : financed / months;
    return {
      downPayment,
      financed,
      firstInstallment: Math.round(pmt),
      lastInstallment: Math.round(pmt),
    };
  }, [amortizationSystem, annualRate, downPaymentPct, property.price, termYears]);

  const similarProperties = useMemo(() => {
    return allProperties
      .filter((p) => p.id !== property.id && p.status !== 'Vendido')
      .sort((a, b) => {
        const scoreA =
          (a.city === property.city ? 3 : 0) +
          (a.purpose === property.purpose ? 2 : 0) +
          (a.propertyType === property.propertyType ? 2 : 0);
        const scoreB =
          (b.city === property.city ? 3 : 0) +
          (b.purpose === property.purpose ? 2 : 0) +
          (b.propertyType === property.propertyType ? 2 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }, [allProperties, property]);

  const waUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá Luciana! Tenho interesse no imóvel "${property.title}" (${property.neighborhood}, ${property.city}) no valor de ${formatCurrency(property.price)}.`
  )}`;

  const waSimUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Olá Luciana! Fiz uma simulação no imóvel "${property.title}" (${formatCurrency(property.price)}): entrada de ${downPaymentPct}% (${formatCurrency(simulation.downPayment)}), prazo de ${termYears} anos (${amortizationSystem}), parcela inicial estimada em ${formatCurrency(simulation.firstInstallment)}/mês. Podemos conversar sobre aprovação?`
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim()) return;
    setSending(true);
    try {
      await submitPublicLead({
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        message: message.trim(),
        source: 'imovel',
        referenceId: property.id,
        referenceTitle: property.title,
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-8 sm:py-14">
      <LightboxModal
        images={property.images}
        activeIndex={lightboxIndex}
        title={property.title}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={(idx) => setLightboxIndex(idx)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0F2936]/75 hover:text-[#0F2936] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para imóveis
          </button>

          {(onToggleSave || onToggleCompare) && (
            <div className="flex items-center gap-2.5">
              {onToggleCompare && (
                <button
                  type="button"
                  onClick={() => onToggleCompare(property.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isCompared
                      ? 'bg-[#C59B48] text-[#081820] border-[#C59B48]'
                      : 'bg-white text-[#0F2936] border-[#0F2936]/15 hover:border-[#C59B48]'
                  }`}
                >
                  <Columns3 className="w-3.5 h-3.5" />
                  {isCompared ? 'Na comparação' : 'Comparar imóvel'}
                </button>
              )}
              {onToggleSave && (
                <button
                  type="button"
                  onClick={() => onToggleSave(property.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isSaved
                      ? 'bg-[#0F2936] text-white border-[#0F2936]'
                      : 'bg-white text-[#0F2936] border-[#0F2936]/15 hover:border-[#C59B48]'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-[#D8B467]' : ''}`} />
                  {isSaved ? 'Salvo' : 'Salvar'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Synchronized Embla Carousel Photo Gallery + Lightbox */}
        <Reveal>
          <EmblaPropertyGallery
            images={property.images}
            title={property.title}
            onOpenLightbox={(idx) => setLightboxIndex(idx)}
          />
        </Reveal>

        {/* Main Content + Sticky Lead Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <Reveal delay={0.08} className="lg:col-span-8 space-y-10">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#B08839]">
                <span>{property.propertyType}</span>
                <span aria-hidden="true">·</span>
                <span>{property.purpose}</span>
                <span aria-hidden="true">·</span>
                <span>{property.status}</span>
                <span aria-hidden="true">·</span>
                <span>{property.occupancyType}</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#0F2936] leading-[1.1]">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-[#0F2936]/70">
                <MapPin className="w-4 h-4 text-[#C59B48] shrink-0" />
                <span>{property.address || `${property.neighborhood} · ${property.city}`}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-[#0F2936]/10 rounded-2xl p-6">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#0F2936]/60 mb-1">
                  <Maximize2 className="w-3.5 h-3.5 text-[#C59B48]" />
                  Área Privativa
                </div>
                <div className="text-xl font-bold text-[#0F2936] tabular-nums">
                  {property.areaSqm} m²
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#0F2936]/60 mb-1">
                  <BedDouble className="w-3.5 h-3.5 text-[#C59B48]" />
                  Dormitórios
                </div>
                <div className="text-xl font-bold text-[#0F2936] tabular-nums">
                  {property.bedrooms} ({property.suites} suítes)
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#0F2936]/60 mb-1">
                  <Bath className="w-3.5 h-3.5 text-[#C59B48]" />
                  Banheiros
                </div>
                <div className="text-xl font-bold text-[#0F2936] tabular-nums">
                  {property.bathrooms}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#0F2936]/60 mb-1">
                  <Car className="w-3.5 h-3.5 text-[#C59B48]" />
                  Vagas
                </div>
                <div className="text-xl font-bold text-[#0F2936] tabular-nums">
                  {property.parkingSpaces}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2936]">
                Sobre este imóvel
              </h2>
              <p className="text-base text-[#0F2936]/80 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
              {property.nearUniversity && property.universityDistance && (
                <div className="flex items-center gap-2.5 text-sm font-medium text-[#0F2936] bg-white border border-[#C59B48]/40 rounded-xl px-4 py-3 mt-4">
                  <GraduationCap className="w-5 h-5 text-[#C59B48] shrink-0" />
                  <span>Proximidade universitária: {property.universityDistance}</span>
                </div>
              )}
            </div>

            {property.features.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2936]">
                  Destaques e Infraestrutura
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {property.features.map((feat) => (
                    <div
                      key={feat}
                      className="flex items-center gap-2.5 bg-white border border-[#0F2936]/8 rounded-xl px-4 py-3.5 text-sm text-[#0F2936]"
                    >
                      <Check className="w-4 h-4 text-[#C59B48] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Financing Simulator for Sale Properties */}
            {property.purpose === 'Venda' && (
              <div className="bg-white border border-[#0F2936]/12 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B08839] mb-1">
                      <Calculator className="w-3.5 h-3.5" />
                      Planejamento Financeiro
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2936]">
                      Simulador de Financiamento
                    </h2>
                  </div>

                  <div className="flex items-center p-1 bg-[#FAF9F6] border border-[#0F2936]/12 rounded-xl">
                    {(['SAC', 'PRICE'] as const).map((sys) => (
                      <button
                        key={sys}
                        type="button"
                        onClick={() => setAmortizationSystem(sys)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          amortizationSystem === sys
                            ? 'bg-[#0F2936] text-white'
                            : 'text-[#0F2936]/70 hover:text-[#0F2936]'
                        }`}
                      >
                        Tabela {sys}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-[#0F2936]/75 mb-2">
                      <span>Entrada</span>
                      <span className="font-bold text-[#0F2936] tabular-nums">
                        {downPaymentPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={70}
                      step={5}
                      value={downPaymentPct}
                      onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                      className="w-full accent-[#C59B48] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-[#0F2936]/75 mb-2">
                      <span>Prazo</span>
                      <span className="font-bold text-[#0F2936] tabular-nums">
                        {termYears} anos
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={35}
                      step={5}
                      value={termYears}
                      onChange={(e) => setTermYears(Number(e.target.value))}
                      className="w-full accent-[#C59B48] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-[#0F2936]/75 mb-2">
                      <span>Taxa anual estimada</span>
                      <span className="font-bold text-[#0F2936] tabular-nums">
                        {annualRate.toFixed(1)}% a.a.
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8.0}
                      max={13.0}
                      step={0.3}
                      value={annualRate}
                      onChange={(e) => setAnnualRate(Number(e.target.value))}
                      className="w-full accent-[#C59B48] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FAF9F6] border border-[#0F2936]/8 rounded-xl p-5">
                  <div>
                    <div className="text-xs text-[#0F2936]/60">Valor de entrada</div>
                    <div className="text-lg font-bold text-[#0F2936] tabular-nums mt-0.5">
                      {formatCurrency(simulation.downPayment)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#0F2936]/60">Valor financiado</div>
                    <div className="text-lg font-bold text-[#0F2936] tabular-nums mt-0.5">
                      {formatCurrency(simulation.financed)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#0F2936]/60">
                      {amortizationSystem === 'SAC' ? '1ª parcela estimada' : 'Parcela fixa estimada'}
                    </div>
                    <div className="text-xl font-bold text-[#B08839] tabular-nums mt-0.5">
                      {formatCurrency(simulation.firstInstallment)}/mês
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#0F2936]/60">
                  <span>
                    * Simulação referencial. Auxiliamos na aprovação bancária completa junto aos principais bancos.
                  </span>
                  <a
                    href={waSimUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2936] hover:text-[#B08839] underline"
                  >
                    Enviar simulação no WhatsApp
                  </a>
                </div>
              </div>
            )}
          </Reveal>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 bg-white border border-[#0F2936]/12 rounded-2xl p-6 sm:p-7 space-y-6 shadow-md">
              <div className="pb-5 border-b border-[#0F2936]/10">
                <div className="text-xs font-medium text-[#0F2936]/60">
                  Valor de {property.purpose}
                </div>
                <div className="text-3xl font-bold text-[#0F2936] tabular-nums mt-1">
                  {formatCurrency(property.price)}
                  {property.purpose === 'Locação' && (
                    <span className="text-sm font-normal text-[#0F2936]/60"> / mês</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-[#0F2936]/60 mt-2 tabular-nums">
                  {property.condoFee ? (
                    <span>Condomínio: {formatCurrency(property.condoFee)}</span>
                  ) : null}
                  {property.iptu ? <span>IPTU anual: {formatCurrency(property.iptu)}</span> : null}
                </div>
              </div>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Falar no WhatsApp Agora
              </a>

              {sent ? (
                <div className="bg-[#FAF9F6] border border-[#C59B48]/50 rounded-xl p-5 text-center space-y-2">
                  <div className="text-sm font-semibold text-[#0F2936]">
                    Solicitação enviada com sucesso!
                  </div>
                  <p className="text-xs text-[#0F2936]/70">
                    A corretora Luciana Domingos entrará em contato pelo seu WhatsApp em breve.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="text-sm font-semibold text-[#0F2936]">
                    Agendar visita ou tirar dúvidas
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm"
                  />
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Seu WhatsApp (51) 99999-9999"
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu e-mail (opcional)"
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm"
                  />
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3.5 bg-[#0F2936] hover:bg-[#163A4D] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    {sending ? 'Enviando...' : 'Solicitar Atendimento'}
                  </button>
                </form>
              )}
            </div>
          </aside>
        </div>

        {/* Similar Properties Recommendations */}
        {similarProperties.length > 0 && onSelectProperty && (
          <div className="pt-12 border-t border-[#0F2936]/10 space-y-6">
            <div>
              <div className="text-xs font-semibold text-[#B08839] mb-1">
                Continue Explorando
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0F2936]">
                Imóveis semelhantes no Vale dos Sinos
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProperties.map((item) => (
                <PropertyCard
                  key={item.id}
                  property={item}
                  onSelect={onSelectProperty}
                  isSaved={savedIds.includes(item.id)}
                  isCompared={compareIds.includes(item.id)}
                  onToggleSave={onToggleSave}
                  onToggleCompare={onToggleCompare}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
