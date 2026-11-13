import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  Eye,
  EyeOff,
  Home,
  Loader2,
  Menu,
  Plus,
  RotateCcw,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { BRAND_IMAGES, DEFAULT_CATEGORIES } from '../../data/seedData.ts';
import { slugify } from '../../lib/dataService.ts';
import { uploadMediaToBlob } from '../../lib/mediaOptimizer.ts';
import type { Property, SiteCategory } from '../../types.ts';
import { SafeImage } from '../SafeImage.tsx';

interface CategoriesTabProps {
  categories: SiteCategory[];
  properties: Property[];
  onSaveCategories: (
    nextCategories: SiteCategory[],
    renames?: Array<{ from: string; to: string }>
  ) => Promise<void>;
}

const createEmptyCategory = (): SiteCategory => ({
  id: `cat_${Date.now()}`,
  name: '',
  slug: '',
  kicker: '',
  description: '',
  image: BRAND_IMAGES.interiorLiving,
  showInMenu: true,
  showOnHome: true,
});

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  properties,
  onSaveCategories,
}) => {
  const [editing, setEditing] = useState<SiteCategory | null>(null);
  const [originalName, setOriginalName] = useState<string>('');
  const [syncPropertyNames, setSyncPropertyNames] = useState<boolean>(true);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingImg, setUploadingImg] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeList = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const showSavedFeedback = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 3000);
  };

  const countPropertiesInCategory = (name: string) =>
    properties.filter(
      (p) => p.propertyType.trim().toLowerCase() === name.trim().toLowerCase()
    ).length;

  const startNew = () => {
    setEditing(createEmptyCategory());
    setOriginalName('');
    setSyncPropertyNames(true);
    setIsNew(true);
  };

  const startEdit = (cat: SiteCategory) => {
    setEditing({ ...cat });
    setOriginalName(cat.name);
    setSyncPropertyNames(true);
    setIsNew(false);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingImg(true);
    try {
      const uploaded = await uploadMediaToBlob(
        file,
        `categories/${editing.id}`,
        { maxDimension: 1200 }
      );
      setEditing((prev) => (prev ? { ...prev, image: uploaded.url } : null));
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name.trim()) return;

    const cleanName = editing.name.trim().slice(0, 60);
    const cleanSlug = (editing.slug?.trim() || slugify(cleanName) || `cat-${Date.now()}`).slice(
      0,
      80
    );

    const prepared: SiteCategory = {
      id: editing.id || `cat_${cleanSlug}`,
      name: cleanName,
      slug: cleanSlug,
      kicker: editing.kicker?.trim() || undefined,
      description: editing.description?.trim() || undefined,
      image: editing.image?.trim() || undefined,
      showInMenu: Boolean(editing.showInMenu),
      showOnHome: Boolean(editing.showOnHome),
    };

    const nextList = isNew
      ? [...activeList, prepared]
      : activeList.map((c) => (c.id === prepared.id ? prepared : c));

    const renames =
      !isNew &&
      syncPropertyNames &&
      originalName.trim() &&
      originalName.trim() !== cleanName
        ? [{ from: originalName.trim(), to: cleanName }]
        : [];

    setSaving(true);
    try {
      await onSaveCategories(nextList, renames);
      setEditing(null);
      showSavedFeedback(
        isNew
          ? `Categoria "${cleanName}" adicionada e atualizada no menu e no site.`
          : `Categoria "${cleanName}" atualizada no menu e no site.`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMenu = async (cat: SiteCategory) => {
    setSaving(true);
    try {
      const nextList = activeList.map((c) =>
        c.id === cat.id ? { ...c, showInMenu: !c.showInMenu } : c
      );
      await onSaveCategories(nextList);
      showSavedFeedback(
        !cat.showInMenu
          ? `"${cat.name}" agora aparece no menu do site.`
          : `"${cat.name}" ocultada do menu do site.`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHome = async (cat: SiteCategory) => {
    setSaving(true);
    try {
      const nextList = activeList.map((c) =>
        c.id === cat.id ? { ...c, showOnHome: !c.showOnHome } : c
      );
      await onSaveCategories(nextList);
      showSavedFeedback(
        !cat.showOnHome
          ? `"${cat.name}" destacada na página inicial.`
          : `"${cat.name}" removida da página inicial.`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= activeList.length) return;
    const copy = [...activeList];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setSaving(true);
    try {
      await onSaveCategories(copy);
      showSavedFeedback('Ordem das categorias atualizada no menu e no site.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: SiteCategory) => {
    setSaving(true);
    try {
      const nextList = activeList.filter((c) => c.id !== cat.id);
      await onSaveCategories(nextList);
      showSavedFeedback(`Categoria "${cat.name}" removida.`);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreMissingDefaults = async () => {
    const existingNames = new Set(activeList.map((c) => c.name.trim().toLowerCase()));
    const missing = DEFAULT_CATEGORIES.filter(
      (def) => !existingNames.has(def.name.trim().toLowerCase())
    );
    if (missing.length === 0) {
      showSavedFeedback('Todas as categorias padrão (incluindo Terreno) já estão ativas.');
      return;
    }
    setSaving(true);
    try {
      await onSaveCategories([...activeList, ...missing]);
      showSavedFeedback(
        `${missing.length} categoria(s) padrão restaurada(s) no site e no menu.`
      );
    } finally {
      setSaving(false);
    }
  };

  const linkedCountForEditing =
    !isNew && originalName ? countPropertiesInCategory(originalName) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#0F2936]">
            Gestão de Categorias ({activeList.length})
          </h2>
          <p className="text-sm text-[#0F2936]/65">
            Adicione, renomeie, reordene e escolha quais categorias aparecem no menu e no site em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={handleRestoreMissingDefaults}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#0F2936]/20 hover:border-[#C59B48] text-[#0F2936] text-xs font-semibold rounded-xl cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#B08839]" />
            Garantir Padrões (incl. Terreno)
          </button>
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F2936] hover:bg-[#163A4D] text-white text-sm font-semibold rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D8B467]" />
            Nova Categoria
          </button>
        </div>
      </div>

      {feedback && (
        <div className="bg-[#16A34A]/10 border border-[#16A34A]/25 text-[#15803D] text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {editing && (
        <form
          onSubmit={handleFormSubmit}
          className="bg-white border border-[#C59B48]/50 rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#0F2936]/10">
            <h3 className="font-serif text-lg font-semibold text-[#0F2936] flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#C59B48]" />
              {isNew ? 'Adicionar Nova Categoria' : `Editando Categoria: ${originalName}`}
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
                disabled={saving || uploadingImg}
                className="px-4 py-2 bg-[#0F2936] text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Categoria'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/75 mb-1">
                Nome da Categoria *
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={60}
                value={editing.name}
                onChange={(e) => {
                  const nextName = e.target.value;
                  setEditing((prev) =>
                    prev
                      ? {
                          ...prev,
                          name: nextName,
                          slug: isNew ? slugify(nextName) : prev.slug,
                        }
                      : null
                  );
                }}
                placeholder="Ex: Terreno, Chácara, Loft..."
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/75 mb-1">
                Subtítulo / Destaque Curto
              </label>
              <input
                type="text"
                maxLength={100}
                value={editing.kicker || ''}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, kicker: e.target.value } : null))
                }
                placeholder="Ex: Construa do Seu Jeito"
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#0F2936]/75 mb-1">
                Descrição da Categoria
              </label>
              <textarea
                rows={2}
                maxLength={320}
                value={editing.description || ''}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, description: e.target.value } : null))
                }
                placeholder="Ex: Lotes urbanos planos e terrenos em condomínio fechado prontos para receber seu projeto."
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#FAF9F6] border border-[#0F2936]/10 rounded-xl p-4">
              <div className="w-24 h-16 rounded-lg overflow-hidden bg-white border border-[#0F2936]/10 shrink-0">
                {editing.image ? (
                  <SafeImage
                    src={editing.image}
                    alt={editing.name || 'Categoria'}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#0F2936]/80">
                    Imagem da Categoria (Vercel Blob · WebP otimizado)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingImg}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F2936] text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    {uploadingImg ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#D8B467]" />
                    )}
                    {uploadingImg ? 'Enviando...' : 'Enviar Foto'}
                  </button>
                </div>
                <input
                  type="url"
                  value={editing.image || ''}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, image: e.target.value } : null))
                  }
                  placeholder="https://... (opcional)"
                  className="w-full px-3 py-2 bg-white border border-[#0F2936]/15 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex flex-wrap items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F2936] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.showInMenu}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, showInMenu: e.target.checked } : null
                    )
                  }
                />
                Exibir no Menu de Navegação (Navbar e Rodapé)
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F2936] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.showOnHome}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, showOnHome: e.target.checked } : null
                    )
                  }
                />
                Destacar na Página Inicial
              </label>
            </div>

            {!isNew &&
              linkedCountForEditing > 0 &&
              editing.name.trim() !== originalName.trim() && (
                <div className="md:col-span-2 bg-[#C59B48]/12 border border-[#C59B48]/35 rounded-xl px-4 py-3">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F2936] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncPropertyNames}
                      onChange={(e) => setSyncPropertyNames(e.target.checked)}
                    />
                    Atualizar automaticamente {linkedCountForEditing} imóvel(is) cadastrado(s) como “
                    {originalName}” para “{editing.name.trim() || '...'}”
                  </label>
                </div>
              )}
          </div>
        </form>
      )}

      <div className="bg-white border border-[#0F2936]/10 rounded-2xl overflow-hidden">
        <div className="divide-y divide-[#0F2936]/8">
          {activeList.map((cat, index) => {
            const count = countPropertiesInCategory(cat.name);
            return (
              <div
                key={cat.id}
                className="p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#FAF9F6]/60"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={saving || index === 0}
                      onClick={() => handleMove(index, -1)}
                      aria-label={`Mover ${cat.name} para cima`}
                      className="p-1 rounded hover:bg-[#0F2936]/10 text-[#0F2936]/60 disabled:opacity-25 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={saving || index === activeList.length - 1}
                      onClick={() => handleMove(index, 1)}
                      aria-label={`Mover ${cat.name} para baixo`}
                      className="p-1 rounded hover:bg-[#0F2936]/10 text-[#0F2936]/60 disabled:opacity-25 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-14 h-12 rounded-lg overflow-hidden bg-[#F2F4F6] shrink-0">
                    {cat.image ? (
                      <SafeImage
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#0F2936]/30">
                        <Tag className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm sm:text-base text-[#0F2936]">
                        {cat.name}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#0F2936]/6 text-[#0F2936]/70 tabular-nums">
                        {count} {count === 1 ? 'imóvel' : 'imóveis'}
                      </span>
                    </div>
                    <div className="text-xs text-[#0F2936]/60 truncate">
                      {cat.kicker || cat.description || `/${cat.slug}`}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleToggleMenu(cat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      cat.showInMenu
                        ? 'bg-[#0F2936] text-white border-[#0F2936]'
                        : 'bg-white text-[#0F2936]/55 border-[#0F2936]/15 hover:border-[#0F2936]/35'
                    }`}
                  >
                    <Menu className="w-3.5 h-3.5" />
                    {cat.showInMenu ? 'Visível no Menu' : 'Oculto no Menu'}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleToggleHome(cat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      cat.showOnHome
                        ? 'bg-[#C59B48]/20 text-[#0F2936] border-[#C59B48]'
                        : 'bg-white text-[#0F2936]/55 border-[#0F2936]/15 hover:border-[#0F2936]/35'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5 text-[#B08839]" />
                    {cat.showOnHome ? (
                      <>
                        <Eye className="w-3 h-3" /> Na Home
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" /> Só Catálogo
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => startEdit(cat)}
                    className="p-2 text-[#0F2936] hover:bg-[#0F2936]/8 rounded-lg cursor-pointer"
                    aria-label={`Editar categoria ${cat.name}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={saving || activeList.length <= 1}
                    onClick={() => handleDelete(cat)}
                    className="p-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg cursor-pointer disabled:opacity-30"
                    aria-label={`Remover categoria ${cat.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
