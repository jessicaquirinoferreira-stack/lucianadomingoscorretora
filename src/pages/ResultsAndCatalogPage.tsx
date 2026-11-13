import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Filter,
  Heart,
  LayoutGrid,
  List,
  MapPin,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../data/seedData.ts';
import { formatCurrency } from '../lib/dataService.ts';
import type {
  CatalogFilterPreset,
  Property,
  SiteCategory,
  SmartSearchResponse,
} from '../types.ts';
import {
  Reveal,
  SpotlightCard,
  StaggerGrid,
  StaggerItem,
} from '../components/MotionPrimitives.tsx';
import { PropertyCard } from '../components/PropertyCard.tsx';
import { SafeImage } from '../components/SafeImage.tsx';

interface ResultsAndCatalogPageProps {
  properties: Property[];
  categories?: SiteCategory[];
  aiResult: SmartSearchResponse | null;
  initialPreset?: CatalogFilterPreset | null;
  onClearAi: () => void;
  onSelectProperty: (id: string) => void;
  onNavigateHome: () => void;
  savedIds: string[];
  compareIds: string[];
  onToggleSave: (id: string) => void;
  onToggleCompare: (id: string) => void;
}

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'area_desc';

export const ResultsAndCatalogPage: React.FC<ResultsAndCatalogPageProps> = ({
  properties,
  categories,
  aiResult,
  initialPreset,
  onClearAi,
  onSelectProperty,
  onNavigateHome,
  savedIds,
  compareIds,
  onToggleSave,
  onToggleCompare,
}) => {
  const [purpose, setPurpose] = useState<string>(initialPreset?.purpose ?? 'Todos');
  const [city, setCity] = useState<string>(initialPreset?.city ?? 'Todas');
  const [propertyType, setPropertyType] = useState<string>(
    initialPreset?.propertyType ?? 'Todos'
  );
  const [minBedrooms, setMinBedrooms] = useState<number>(0);
  const [onlyNearUni, setOnlyNearUni] = useState<boolean>(
    initialPreset?.onlyNearUni ?? false
  );
  const [onlySaved, setOnlySaved] = useState<boolean>(
    initialPreset?.onlySaved ?? false
  );
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!initialPreset) return;
    setPurpose(initialPreset.purpose ?? 'Todos');
    setCity(initialPreset.city ?? 'Todas');
    setPropertyType(initialPreset.propertyType ?? 'Todos');
    setOnlyNearUni(initialPreset.onlyNearUni ?? false);
    setOnlySaved(initialPreset.onlySaved ?? false);
  }, [initialPreset]);

  const cities = useMemo(
    () => ['Todas', ...Array.from(new Set(properties.map((p) => p.city)))],
    [properties]
  );

  const types = useMemo(() => {
    const configuredNames = (
      categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES
    ).map((c) => c.name);
    const propertyNames = properties.map((p) => p.propertyType);
    return ['Todos', ...Array.from(new Set([...configuredNames, ...propertyNames]))];
  }, [categories, properties]);

  const recommendationMap = useMemo(() => {
    const map = new Map<string, { score: number; reason: string }>();
    if (aiResult?.recommendations) {
      aiResult.recommendations.forEach((rec) => {
        map.set(rec.propertyId, { score: rec.matchScore, reason: rec.reason });
      });
    }
    return map;
  }, [aiResult]);

  const displayedProperties = useMemo(() => {
    const filtered = properties.filter((p) => {
      if (p.status === 'Vendido') return false;
      if (purpose !== 'Todos' && p.purpose !== purpose) return false;
      if (city !== 'Todas' && p.city !== city) return false;
      if (propertyType !== 'Todos' && p.propertyType !== propertyType) return false;
      if (minBedrooms > 0 && p.bedrooms < minBedrooms) return false;
      if (onlyNearUni && !p.nearUniversity) return false;
      if (onlySaved && !savedIds.includes(p.id)) return false;
      if (maxPrice && Number(maxPrice) > 0 && p.price > Number(maxPrice)) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sortBy === 'price_asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'area_desc') {
      sorted.sort((a, b) => b.areaSqm - a.areaSqm);
    } else if (aiResult?.recommendations?.length) {
      sorted.sort((a, b) => {
        const sa = recommendationMap.get(a.id)?.score ?? 0;
        const sb = recommendationMap.get(b.id)?.score ?? 0;
        return sb - sa;
      });
    } else {
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    }

    return sorted;
  }, [
    properties,
    purpose,
    city,
    propertyType,
    minBedrooms,
    onlyNearUni,
    onlySaved,
    savedIds,
    maxPrice,
    sortBy,
    aiResult,
    recommendationMap,
  ]);

  const resetFilters = () => {
    setPurpose('Todos');
    setCity('Todas');
    setPropertyType('Todos');
    setMinBedrooms(0);
    setOnlyNearUni(false);
    setOnlySaved(false);
    setMaxPrice('');
    setSortBy('relevance');
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {aiResult ? (
          <Reveal>
            <SpotlightCard
              dark
              className="bg-[#0F2936] text-white rounded-2xl p-6 sm:p-10 space-y-4 border border-[#C59B48]/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#D8B467]">
                  <Sparkles className="w-4 h-4" />
                  Seleção Personalizada pela Consultoria Inteligente
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={onNavigateHome}
                    className="text-xs font-medium text-[#FAF9F6]/80 hover:text-white underline cursor-pointer"
                  >
                    Refazer busca guiada
                  </button>
                  <button
                    type="button"
                    onClick={onClearAi}
                    className="text-xs font-medium text-[#D8B467] hover:text-white cursor-pointer"
                  >
                    Ver todos os imóveis
                  </button>
                </div>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight relative z-10">
                “{aiResult.headline}”
              </h1>
              <p className="text-sm sm:text-base text-[#FAF9F6]/80 max-w-3xl leading-relaxed relative z-10">
                {aiResult.summary}
              </p>
            </SpotlightCard>
          </Reveal>
        ) : (
          <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-[#B08839] mb-1">
                Estância Velha e Vale dos Sinos
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#0F2936]">
                Catálogo de Imóveis Selecionados
              </h1>
            </div>
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#0F2936] text-white text-sm font-semibold rounded-xl hover:bg-[#163A4D] transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D8B467]" />
              Usar Busca Inteligente
            </button>
          </Reveal>
        )}

        <Reveal delay={0.08}>
          <div className="bg-white border border-[#0F2936]/10 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F2936]">
                <Filter className="w-4 h-4 text-[#C59B48]" />
                Refinar seleção
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOnlySaved((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    onlySaved
                      ? 'bg-[#0F2936] text-white border-[#0F2936]'
                      : 'bg-[#FAF9F6] text-[#0F2936] border-[#0F2936]/15 hover:border-[#C59B48]'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${onlySaved ? 'fill-current text-[#D8B467]' : ''}`} />
                  Salvos ({savedIds.length})
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F2936]/65 hover:text-[#0F2936] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar filtros
                </button>
              </div>
            </div>

            {/* Quick Category Tabs Synced with Admin Panel */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {types.map((t) => {
                const active = propertyType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPropertyType(t)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0F2936] text-white border-[#0F2936]'
                        : 'bg-[#FAF9F6] text-[#0F2936]/75 border-[#0F2936]/12 hover:border-[#C59B48]'
                    }`}
                  >
                    {t === 'Todos' ? 'Todas as categorias' : t}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                aria-label="Finalidade"
                className="px-3 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm text-[#0F2936]"
              >
                <option value="Todos">Venda e Locação</option>
                <option value="Venda">Venda</option>
                <option value="Locação">Locação</option>
              </select>

              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Cidade"
                className="px-3 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm text-[#0F2936]"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c === 'Todas' ? 'Todas as cidades' : c}
                  </option>
                ))}
              </select>

              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                aria-label="Tipo de imóvel"
                className="px-3 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm text-[#0F2936]"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t === 'Todos' ? 'Todos os tipos' : t}
                  </option>
                ))}
              </select>

              <select
                value={minBedrooms}
                onChange={(e) => setMinBedrooms(Number(e.target.value))}
                aria-label="Dormitórios"
                className="px-3 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm text-[#0F2936]"
              >
                <option value={0}>Qualquer dormitório</option>
                <option value={1}>1+ dormitório</option>
                <option value={2}>2+ dormitórios</option>
                <option value={3}>3+ dormitórios</option>
                <option value={4}>4+ dormitórios</option>
              </select>

              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Valor máximo (R$)"
                aria-label="Valor máximo"
                className="px-3 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm text-[#0F2936] tabular-nums"
              />

              <button
                type="button"
                onClick={() => setOnlyNearUni((prev) => !prev)}
                className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                  onlyNearUni
                    ? 'bg-[#0F2936] text-white border-[#0F2936]'
                    : 'bg-[#FAF9F6] text-[#0F2936] border-[#0F2936]/15 hover:border-[#C59B48]'
                }`}
              >
                Próx. Faculdade
              </button>
            </div>
          </div>
        </Reveal>

        {/* Count, Sort & View Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-[#0F2936]/65 tabular-nums">
            {displayedProperties.length}{' '}
            {displayedProperties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Ordenar imóveis"
              className="px-3 py-2 bg-white border border-[#0F2936]/12 rounded-xl text-xs sm:text-sm text-[#0F2936]"
            >
              <option value="relevance">Ordenar: Relevância</option>
              <option value="price_asc">Menor valor</option>
              <option value="price_desc">Maior valor</option>
              <option value="area_desc">Maior metragem</option>
            </select>

            <div className="flex items-center p-1 bg-white border border-[#0F2936]/12 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Visualizar em grade"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#0F2936] text-white'
                    : 'text-[#0F2936]/60 hover:text-[#0F2936]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="Visualizar em lista editorial"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#0F2936] text-white'
                    : 'text-[#0F2936]/60 hover:text-[#0F2936]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {displayedProperties.length === 0 ? (
          <div className="bg-white border border-[#0F2936]/10 rounded-2xl p-12 text-center space-y-3">
            <h3 className="font-serif text-2xl font-semibold text-[#0F2936]">
              Nenhum imóvel encontrado com esses filtros exatos
            </h3>
            <p className="text-sm text-[#0F2936]/65 max-w-md mx-auto">
              Ajuste os critérios acima ou converse diretamente com a Luciana para opções fora de catálogo.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 px-5 py-2.5 bg-[#0F2936] text-white text-sm font-semibold rounded-xl cursor-pointer"
            >
              Restaurar Catálogo
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {displayedProperties.map((property) => {
              const rec = recommendationMap.get(property.id);
              return (
                <StaggerItem key={property.id}>
                  <PropertyCard
                    property={property}
                    onSelect={onSelectProperty}
                    matchScore={rec?.score}
                    matchReason={rec?.reason}
                    isSaved={savedIds.includes(property.id)}
                    onToggleSave={onToggleSave}
                    isCompared={compareIds.includes(property.id)}
                    onToggleCompare={onToggleCompare}
                  />
                </StaggerItem>
              );
            })}
          </StaggerGrid>
        ) : (
          <div className="space-y-5">
            {displayedProperties.map((property) => {
              const rec = recommendationMap.get(property.id);
              return (
                <SpotlightCard
                  key={property.id}
                  onClick={() => onSelectProperty(property.id)}
                  className="group bg-white border border-[#0F2936]/10 hover:border-[#C59B48]/80 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch cursor-pointer transition-colors"
                >
                  <div className="md:col-span-4 aspect-[16/10] md:aspect-auto bg-[#F2F4F6] overflow-hidden">
                    <SafeImage
                      src={property.images[0]}
                      alt={property.title}
                      fallbackLabel={property.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between gap-4 relative z-10">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#B08839]">
                        <span>{property.propertyType}</span>
                        <span aria-hidden="true">·</span>
                        <span>{property.purpose}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#0F2936]/65">
                          <MapPin className="w-3.5 h-3.5 text-[#C59B48]" />
                          {property.neighborhood}, {property.city}
                        </span>
                        {rec?.score ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#0F2936] tabular-nums">
                              {rec.score}% compatível
                            </span>
                          </>
                        ) : null}
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F2936]">
                        {property.title}
                      </h3>
                      <p className="text-sm text-[#0F2936]/75 line-clamp-2 leading-relaxed">
                        {rec?.reason || property.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#0F2936]/8 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-xs text-[#0F2936]/55">Valor</div>
                          <div className="text-xl sm:text-2xl font-bold text-[#0F2936] tabular-nums">
                            {formatCurrency(property.price)}
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm text-[#0F2936]/70 tabular-nums">
                          {property.areaSqm} m² · {property.bedrooms} dorms ·{' '}
                          {property.parkingSpaces} vagas
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F2936] group-hover:text-[#B08839]">
                        Ver detalhes
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
