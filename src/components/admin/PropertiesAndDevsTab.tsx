import React, { useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { BRAND_IMAGES } from '../../data/seedData.ts';
import { formatCurrency, slugify } from '../../lib/dataService.ts';
import type {
  Development,
  DevelopmentStage,
  OccupancyType,
  Property,
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
} from '../../types.ts';
import { SafeImage } from '../SafeImage.tsx';

interface PropertiesTabProps {
  properties: Property[];
  onSaveProperty: (p: Property, isNew: boolean) => Promise<void>;
  onDeleteProperty: (id: string) => Promise<void>;
}

const EMPTY_PROPERTY = (): Property => {
  const now = new Date().toISOString();
  return {
    id: `prop_${Date.now()}`,
    title: '',
    slug: '',
    description: '',
    propertyType: 'Apartamento',
    purpose: 'Venda',
    status: 'Disponível',
    price: 450000,
    condoFee: 350,
    iptu: 900,
    areaSqm: 78,
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    parkingSpaces: 1,
    city: 'Estância Velha',
    neighborhood: 'Floresta',
    address: '',
    nearUniversity: false,
    universityDistance: '',
    occupancyType: 'Exclusivo',
    idealForPeople: '2 a 3 pessoas',
    lifestyleTags: ['Tranquilidade e natureza'],
    features: ['Sacada com churrasqueira', 'Vaga coberta'],
    images: [BRAND_IMAGES.interiorLiving],
    featured: false,
    createdAt: now,
    updatedAt: now,
  };
};

export const PropertiesTab: React.FC<PropertiesTabProps> = ({
  properties,
  onSaveProperty,
  onDeleteProperty,
}) => {
  const [editing, setEditing] = useState<Property | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const startNew = () => {
    setEditing(EMPTY_PROPERTY());
    setIsNew(true);
  };

  const startEdit = (p: Property) => {
    setEditing({ ...p });
    setIsNew(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await onSaveProperty(
        {
          ...editing,
          slug: slugify(editing.title),
          updatedAt: new Date().toISOString(),
        },
        isNew
      );
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#0F2936]">
            Gestão de Imóveis ({properties.length})
          </h2>
          <p className="text-sm text-[#0F2936]/65">
            Cadastre, edite fotos e tags de estilo de vida usadas na busca inteligente.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2936] hover:bg-[#163A4D] text-white text-sm font-semibold rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D8B467]" />
          Cadastrar Imóvel
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#C59B48]/50 rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#0F2936]/10">
            <h3 className="font-serif text-lg font-semibold text-[#0F2936]">
              {isNew ? 'Novo Imóvel' : `Editando: ${editing.title}`}
            </h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-xs font-semibold text-[#0F2936]/65 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[#0F2936] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                {saving ? 'Salvando...' : 'Salvar Imóvel'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Título do Anúncio *
              </label>
              <input
                type="text"
                required
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Status
              </label>
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as PropertyStatus })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              >
                <option value="Disponível">Disponível</option>
                <option value="Reservado">Reservado</option>
                <option value="Vendido">Vendido</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Tipo
              </label>
              <select
                value={editing.propertyType}
                onChange={(e) =>
                  setEditing({ ...editing, propertyType: e.target.value as PropertyType })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              >
                {['Apartamento', 'Casa', 'Sobrado', 'Cobertura', 'Studio', 'Terreno', 'Comercial'].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Finalidade
              </label>
              <select
                value={editing.purpose}
                onChange={(e) =>
                  setEditing({ ...editing, purpose: e.target.value as PropertyPurpose })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              >
                <option value="Venda">Venda</option>
                <option value="Locação">Locação</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                required
                value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Cidade *
              </label>
              <input
                type="text"
                required
                value={editing.city}
                onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Bairro *
              </label>
              <input
                type="text"
                required
                value={editing.neighborhood}
                onChange={(e) => setEditing({ ...editing, neighborhood: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Ocupação Ideal (Busca IA)
              </label>
              <select
                value={editing.occupancyType}
                onChange={(e) =>
                  setEditing({ ...editing, occupancyType: e.target.value as OccupancyType })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              >
                <option value="Exclusivo">Exclusivo</option>
                <option value="Compartilhado">Compartilhado</option>
                <option value="Ambos">Ambos</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-[#0F2936]/70 mb-1">Área (m²)</label>
                <input
                  type="number"
                  value={editing.areaSqm}
                  onChange={(e) => setEditing({ ...editing, areaSqm: Number(e.target.value) })}
                  className="w-full px-2.5 py-2 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs text-[#0F2936]/70 mb-1">Dorms</label>
                <input
                  type="number"
                  value={editing.bedrooms}
                  onChange={(e) => setEditing({ ...editing, bedrooms: Number(e.target.value) })}
                  className="w-full px-2.5 py-2 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs text-[#0F2936]/70 mb-1">Vagas</label>
                <input
                  type="number"
                  value={editing.parkingSpaces}
                  onChange={(e) =>
                    setEditing({ ...editing, parkingSpaces: Number(e.target.value) })
                  }
                  className="w-full px-2.5 py-2 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm tabular-nums"
                />
              </div>
            </div>

            <div className="flex items-center gap-5 md:col-span-2 pt-4">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0F2936]">
                <input
                  type="checkbox"
                  checked={editing.nearUniversity}
                  onChange={(e) =>
                    setEditing({ ...editing, nearUniversity: e.target.checked })
                  }
                />
                Próximo de faculdade (Feevale / Unisinos)
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#0F2936]">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                />
                Destaque na Home
              </label>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Descrição Completa
              </label>
              <textarea
                rows={3}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                URLs das Fotos (uma por linha)
              </label>
              <textarea
                rows={2}
                value={editing.images.join('\n')}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    images: e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>
          </div>
        </form>
      )}

      <div className="bg-white border border-[#0F2936]/10 rounded-xl overflow-hidden">
        <div className="divide-y divide-[#0F2936]/8">
          {properties.map((p) => (
            <div
              key={p.id}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9F6]/60"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#F2F4F6] shrink-0">
                  <SafeImage src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-[#0F2936]/55">
                    {p.propertyType} · {p.purpose} · {p.neighborhood}, {p.city} ·{' '}
                    <span className="font-semibold text-[#0F2936]">{p.status}</span>
                  </div>
                  <div className="font-semibold text-sm text-[#0F2936] truncate">{p.title}</div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <div className="text-sm font-bold text-[#0F2936] tabular-nums">
                  {formatCurrency(p.price)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="p-2 text-[#0F2936] hover:bg-[#0F2936]/8 rounded-lg cursor-pointer"
                    aria-label="Editar imóvel"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProperty(p.id)}
                    className="p-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg cursor-pointer"
                    aria-label="Excluir imóvel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface DevelopmentsTabProps {
  developments: Development[];
  onSaveDevelopment: (d: Development, isNew: boolean) => Promise<void>;
}

export const DevelopmentsTab: React.FC<DevelopmentsTabProps> = ({
  developments,
  onSaveDevelopment,
}) => {
  const [editing, setEditing] = useState<Development | null>(null);
  const [isNew, setIsNew] = useState(false);

  const startNew = () => {
    const now = new Date().toISOString();
    setEditing({
      id: `dev_${Date.now()}`,
      name: '',
      slug: '',
      developer: '',
      tagline: '',
      description: '',
      stage: 'Lançamento',
      deliveryDate: 'Dezembro de 2028',
      city: 'Estância Velha',
      neighborhood: 'Centro',
      address: '',
      startingPrice: 480000,
      heroImage: BRAND_IMAGES.devReserva,
      galleryImages: [BRAND_IMAGES.devReserva, BRAND_IMAGES.interiorLiving],
      floorPlanImages: [BRAND_IMAGES.interiorLiving],
      typologies: [
        {
          name: 'Apartamento 2 Dormitórios',
          areaSqm: '74 m²',
          bedrooms: '2 Dormitórios',
          parking: '1 vaga',
          priceFrom: 480000,
        },
      ],
      amenities: ['Salão Gourmet', 'Espaço Fitness', 'Coworking'],
      differentials: ['Localização privilegiada', 'Acabamentos nobres'],
      createdAt: now,
      updatedAt: now,
    });
    setIsNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    await onSaveDevelopment(
      {
        ...editing,
        slug: slugify(editing.slug || editing.name),
        updatedAt: new Date().toISOString(),
      },
      isNew
    );
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#0F2936]">
            Empreendimentos ({developments.length})
          </h2>
          <p className="text-sm text-[#0F2936]/65">
            Estes empreendimentos alimentam o catálogo e o Gerador de Landing Pages Premium.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2936] text-white text-sm font-semibold rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D8B467]" />
          Novo Empreendimento
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-[#C59B48]/50 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#0F2936]/10">
            <h3 className="font-serif text-lg font-semibold text-[#0F2936]">
              {isNew ? 'Cadastrar Empreendimento' : editing.name}
            </h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-xs font-semibold text-[#0F2936]/65 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0F2936] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Salvar Empreendimento
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Nome do Empreendimento *
              </label>
              <input
                type="text"
                required
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Estágio
              </label>
              <select
                value={editing.stage}
                onChange={(e) =>
                  setEditing({ ...editing, stage: e.target.value as DevelopmentStage })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              >
                <option value="Lançamento">Lançamento</option>
                <option value="Em Obras">Em Obras</option>
                <option value="Pronto para Morar">Pronto para Morar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Construtora
              </label>
              <input
                type="text"
                value={editing.developer}
                onChange={(e) => setEditing({ ...editing, developer: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Cidade *
              </label>
              <input
                type="text"
                required
                value={editing.city}
                onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Bairro *
              </label>
              <input
                type="text"
                required
                value={editing.neighborhood}
                onChange={(e) => setEditing({ ...editing, neighborhood: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Valor Inicial (R$)
              </label>
              <input
                type="number"
                value={editing.startingPrice}
                onChange={(e) =>
                  setEditing({ ...editing, startingPrice: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm tabular-nums"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Imagem Principal (URL)
              </label>
              <input
                type="text"
                value={editing.heroImage}
                onChange={(e) => setEditing({ ...editing, heroImage: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Tagline / Descrição
              </label>
              <textarea
                rows={2}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {developments.map((dev) => (
          <div
            key={dev.id}
            className="bg-white border border-[#0F2936]/10 rounded-xl p-5 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#F2F4F6] shrink-0">
                <SafeImage src={dev.heroImage} alt={dev.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-[#B08839] font-semibold">
                  {dev.stage} · {dev.city}
                </div>
                <div className="font-serif text-base font-semibold text-[#0F2936] truncate">
                  {dev.name}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditing({ ...dev });
                setIsNew(false);
              }}
              className="p-2 text-[#0F2936] hover:bg-[#0F2936]/8 rounded-lg cursor-pointer"
              aria-label="Editar empreendimento"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
