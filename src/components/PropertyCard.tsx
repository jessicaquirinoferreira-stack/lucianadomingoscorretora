import React from 'react';
import { ArrowUpRight, Check, Columns3, Heart, MapPin } from 'lucide-react';
import { formatCurrency } from '../lib/dataService.ts';
import type { Property } from '../types.ts';
import { SpotlightCard } from './MotionPrimitives.tsx';
import { SafeImage } from './SafeImage.tsx';

interface PropertyCardProps {
  property: Property;
  onSelect: (id: string) => void;
  matchScore?: number;
  matchReason?: string;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  isCompared?: boolean;
  onToggleCompare?: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSelect,
  matchScore,
  matchReason,
  isSaved = false,
  onToggleSave,
  isCompared = false,
  onToggleCompare,
}) => {
  const hasSecondPhoto = property.images.length > 1;

  return (
    <SpotlightCard
      onClick={() => onSelect(property.id)}
      className="group bg-white border border-[#0F2936]/10 rounded-2xl transition-all duration-300 hover:border-[#C59B48]/80 hover:shadow-xl cursor-pointer flex flex-col h-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F2F4F6]">
        <SafeImage
          src={property.images[0]}
          alt={property.title}
          fallbackLabel={property.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        {hasSecondPhoto && (
          <SafeImage
            src={property.images[1]}
            alt={`${property.title} - vista interna`}
            fallbackLabel={property.title}
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.04]"
          />
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#081820]/80 via-[#081820]/25 to-transparent pointer-events-none" />

        {/* Subtle Save & Compare Action Triggers */}
        {(onToggleSave || onToggleCompare) && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            {onToggleCompare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(property.id);
                }}
                aria-label={isCompared ? 'Remover da comparação' : 'Comparar imóvel'}
                title={isCompared ? 'Selecionado para comparar' : 'Comparar imóvel'}
                className={`h-9 px-2.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 backdrop-blur-md transition-colors cursor-pointer ${
                  isCompared
                    ? 'bg-[#C59B48] text-[#081820] border border-[#C59B48]'
                    : 'bg-[#081820]/70 text-white/90 hover:bg-[#081820] border border-white/15'
                }`}
              >
                {isCompared ? <Check className="w-3.5 h-3.5" /> : <Columns3 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isCompared ? 'Comparando' : 'Comparar'}</span>
              </button>
            )}

            {onToggleSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(property.id);
                }}
                aria-label={isSaved ? 'Remover dos favoritos' : 'Salvar imóvel'}
                title={isSaved ? 'Salvo nos favoritos' : 'Salvar imóvel'}
                className={`w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-[#C59B48] text-[#081820] border border-[#C59B48]'
                    : 'bg-[#081820]/70 text-white/90 hover:bg-[#081820] border border-white/15'
                }`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        )}

        <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white text-xs font-medium">
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#D8B467] shrink-0" />
            <span className="truncate">
              {property.neighborhood} · {property.city}
            </span>
          </span>
          {matchScore ? (
            <span className="tabular-nums font-semibold text-[#D8B467] shrink-0 ml-2">
              {matchScore}% compatível
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between gap-4 relative z-10">
        <div>
          {/* Unboxed metadata line per zero-pill discipline */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#0F2936]/60 font-medium mb-2">
            <span>{property.propertyType}</span>
            <span aria-hidden="true">·</span>
            <span>{property.purpose}</span>
            {property.status !== 'Disponível' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#B08839] font-semibold">{property.status}</span>
              </>
            )}
            {property.nearUniversity && (
              <>
                <span aria-hidden="true">·</span>
                <span>Próximo de faculdade</span>
              </>
            )}
          </div>

          <h3 className="font-serif text-xl sm:text-[22px] font-semibold text-[#0F2936] leading-snug group-hover:text-[#163A4D] transition-colors line-clamp-2">
            {property.title}
          </h3>

          {matchReason && (
            <p className="mt-3 text-xs sm:text-sm text-[#0F2936]/80 bg-[#FAF9F6] border border-[#C59B48]/35 rounded-xl px-3.5 py-2.5 leading-relaxed">
              {matchReason}
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-[#0F2936]/8 flex items-end justify-between gap-3">
          <div>
            <div className="text-xs text-[#0F2936]/55 mb-0.5 tabular-nums">
              {property.bedrooms > 0 ? `${property.bedrooms} dorms` : 'Studio'} ·{' '}
              {property.areaSqm} m²
              {property.parkingSpaces > 0 ? ` · ${property.parkingSpaces} vagas` : ''}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#0F2936] tabular-nums">
              {formatCurrency(property.price)}
              {property.purpose === 'Locação' && (
                <span className="text-xs font-normal text-[#0F2936]/60"> / mês</span>
              )}
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F2936] group-hover:text-[#B08839] transition-colors whitespace-nowrap shrink-0">
            Ver detalhes
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </SpotlightCard>
  );
};
