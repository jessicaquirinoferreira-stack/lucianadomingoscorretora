import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Columns3, MessageCircle, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../lib/dataService.ts';
import type { Property, SiteSettings } from '../types.ts';
import { SafeImage } from './SafeImage.tsx';

interface PropertyCompareBarProps {
  properties: Property[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onOpenModal: () => void;
}

export const PropertyCompareBar: React.FC<PropertyCompareBarProps> = ({
  properties,
  onRemove,
  onClear,
  onOpenModal,
}) => {
  if (properties.length === 0) return null;

  return (
    <div className="fixed bottom-22 sm:bottom-5 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.25 }}
        className="bg-[#0F2936] text-white border border-[#C59B48]/40 rounded-2xl px-4 py-3 shadow-2xl flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Columns3 className="w-4 h-4 text-[#D8B467] shrink-0" />
          <div className="flex items-center gap-2 overflow-x-auto">
            {properties.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1 text-xs shrink-0"
              >
                <span className="max-w-[110px] truncate">{p.title}</span>
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  aria-label={`Remover ${p.title} da comparação`}
                  className="text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClear}
            title="Limpar comparação"
            aria-label="Limpar seleção"
            className="p-2 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenModal}
            disabled={properties.length < 2}
            className="px-4 py-2 bg-[#C59B48] hover:bg-[#B08839] disabled:opacity-45 text-[#081820] text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Comparar ({properties.length}/3)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface PropertyCompareModalProps {
  open: boolean;
  properties: Property[];
  settings: SiteSettings;
  onClose: () => void;
  onRemove: (id: string) => void;
  onSelectProperty: (id: string) => void;
}

export const PropertyCompareModal: React.FC<PropertyCompareModalProps> = ({
  open,
  properties,
  settings,
  onClose,
  onRemove,
  onSelectProperty,
}) => {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  if (!open || properties.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Comparativo lado a lado de imóveis"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-[#081820]/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#FAF9F6] text-[#0F2936] rounded-2xl border border-[#C59B48]/30 w-full max-w-6xl overflow-hidden shadow-2xl my-auto"
        >
          <div className="px-6 py-5 bg-white border-b border-[#0F2936]/10 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-[#B08839]">
                Análise Comparativa
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2936]">
                Compare seus imóveis selecionados
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar comparativo"
              className="w-10 h-10 rounded-full border border-[#0F2936]/15 hover:border-[#0F2936] flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-hidden" ref={emblaRef}>
            <div className="flex gap-5">
              {properties.map((p) => {
                const pricePerSqm = p.areaSqm > 0 ? Math.round(p.price / p.areaSqm) : 0;
                const waUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Olá Luciana! Comparei o imóvel "${p.title}" (${formatCurrency(p.price)}) no site e gostaria de mais informações.`
                )}`;

                return (
                  <div
                    key={p.id}
                    className="flex-[0_0_88%] sm:flex-[0_0_47%] lg:flex-[0_0_32%] min-w-0 bg-white border border-[#0F2936]/10 rounded-2xl overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-[16/10] bg-[#F2F4F6]">
                      <SafeImage
                        src={p.images[0]}
                        alt={p.title}
                        fallbackLabel={p.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => onRemove(p.id)}
                        aria-label={`Remover ${p.title}`}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#081820]/75 text-white hover:bg-[#081820] flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-[#B08839] font-medium">
                          {p.neighborhood} · {p.city}
                        </div>
                        <h3 className="font-serif text-xl font-semibold text-[#0F2936] line-clamp-2">
                          {p.title}
                        </h3>
                      </div>

                      <dl className="divide-y divide-[#0F2936]/8 text-xs sm:text-sm">
                        <div className="py-2.5 flex items-center justify-between gap-2">
                          <dt className="text-[#0F2936]/60">Valor ({p.purpose})</dt>
                          <dd className="font-bold text-[#0F2936] tabular-nums">
                            {formatCurrency(p.price)}
                          </dd>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-2">
                          <dt className="text-[#0F2936]/60">Valor por m²</dt>
                          <dd className="font-semibold text-[#0F2936] tabular-nums">
                            {pricePerSqm > 0 ? `${formatCurrency(pricePerSqm)}/m²` : '—'}
                          </dd>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-2">
                          <dt className="text-[#0F2936]/60">Área privativa</dt>
                          <dd className="font-semibold tabular-nums">{p.areaSqm} m²</dd>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-2">
                          <dt className="text-[#0F2936]/60">Dormitórios / Suítes</dt>
                          <dd className="font-semibold tabular-nums">
                            {p.bedrooms} dorms ({p.suites} suítes)
                          </dd>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-2">
                          <dt className="text-[#0F2936]/60">Vagas de garagem</dt>
                          <dd className="font-semibold tabular-nums">{p.parkingSpaces}</dd>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-2">
                          <dt className="text-[#0F2936]/60">Condomínio</dt>
                          <dd className="font-semibold tabular-nums">
                            {p.condoFee ? formatCurrency(p.condoFee) : 'Isento'}
                          </dd>
                        </div>
                        <div className="py-2.5 flex items-center justify-between gap-2">
                          <dt className="text-[#0F2936]/60">Próx. Faculdade</dt>
                          <dd className="font-semibold text-[#0F2936]">
                            {p.nearUniversity ? p.universityDistance || 'Sim' : 'Não'}
                          </dd>
                        </div>
                      </dl>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectProperty(p.id);
                          }}
                          className="py-2.5 px-3 border border-[#0F2936]/20 hover:border-[#C59B48] text-[#0F2936] text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                        >
                          Ver Imóvel
                        </button>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold rounded-xl inline-flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
