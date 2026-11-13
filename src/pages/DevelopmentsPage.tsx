import React from 'react';
import { ArrowRight, Calendar, MapPin, Sparkles } from 'lucide-react';
import { formatCurrency } from '../lib/dataService.ts';
import type { Development, LandingPage, SiteSettings } from '../types.ts';
import { Reveal, SpotlightCard } from '../components/MotionPrimitives.tsx';
import { SafeImage } from '../components/SafeImage.tsx';

interface DevelopmentsPageProps {
  developments: Development[];
  landingPages: LandingPage[];
  settings: SiteSettings;
  onNavigate: (path: string) => void;
}

export const DevelopmentsPage: React.FC<DevelopmentsPageProps> = ({
  developments,
  landingPages,
  settings,
  onNavigate,
}) => {
  const lpByDev = new Map(
    landingPages.filter((lp) => lp.status === 'published').map((lp) => [lp.developmentId, lp])
  );

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <Reveal className="max-w-3xl space-y-3">
          <div className="text-xs font-semibold text-[#B08839]">
            Empreendimentos em Estância Velha e Vale dos Sinos
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#0F2936]">
            Lançamentos e Projetos Exclusivos
          </h1>
          <p className="text-base text-[#0F2936]/75 leading-relaxed">
            Empreendimentos escolhidos a dedo pela solidez das construtoras, qualidade arquitetônica e alto potencial de valorização regional.
          </p>
        </Reveal>

        <div className="space-y-8">
          {developments.map((dev, idx) => {
            const lp = lpByDev.get(dev.id);
            const waUrl = `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
              `Olá Luciana! Gostaria de receber informações sobre o empreendimento ${dev.name}.`
            )}`;

            return (
              <Reveal key={dev.id} delay={idx * 0.06}>
                <SpotlightCard className="group bg-white border border-[#0F2936]/10 hover:border-[#C59B48]/70 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch transition-colors">
                  <div className="lg:col-span-5 min-h-[290px] bg-[#F2F4F6] overflow-hidden">
                    <SafeImage
                      src={dev.heroImage}
                      alt={dev.name}
                      fallbackLabel={dev.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between gap-6 relative z-10">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#B08839]">
                        <span>{dev.stage}</span>
                        <span aria-hidden="true">·</span>
                        <span>{dev.developer}</span>
                      </div>
                      <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-[#0F2936]">
                        {dev.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#0F2936]/65">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#C59B48]" />
                          {dev.neighborhood} · {dev.city}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[#C59B48]" />
                          Previsão de entrega: {dev.deliveryDate}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-[#0F2936]/75 leading-relaxed pt-1">
                        {dev.description}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-[#0F2936]/10 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-[#0F2936]/55">Unidades a partir de</div>
                        <div className="text-2xl font-bold text-[#0F2936] tabular-nums">
                          {formatCurrency(dev.startingPrice)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {lp && (
                          <button
                            type="button"
                            onClick={() => onNavigate(`/empreendimento/${lp.slug}`)}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-[#0F2936] hover:bg-[#163A4D] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 text-[#D8B467]" />
                            Abrir Página Exclusiva
                          </button>
                        )}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-3 border border-[#0F2936]/20 hover:border-[#C59B48] text-[#0F2936] text-sm font-semibold rounded-xl transition-colors"
                        >
                          Solicitar Tabela
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
};
