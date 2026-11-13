import React, { useState } from 'react';
import {
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  Globe,
  Plus,
  Share2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { BRAND_IMAGES } from '../../data/seedData.ts';
import { generateAiLandingPageCopy, slugify } from '../../lib/dataService.ts';
import type { Development, LandingPage } from '../../types.ts';
import { SafeImage } from '../SafeImage.tsx';
import { BlobMediaManager } from './BlobMediaManager.tsx';

interface LandingPageBuilderTabProps {
  developments: Development[];
  landingPages: LandingPage[];
  onSaveLandingPage: (lp: LandingPage, isNew: boolean) => Promise<void>;
  onDeleteLandingPage: (id: string) => Promise<void>;
  onPreviewSlug: (slug: string) => void;
}

export const LandingPageBuilderTab: React.FC<LandingPageBuilderTabProps> = ({
  developments,
  landingPages,
  onSaveLandingPage,
  onDeleteLandingPage,
  onPreviewSlug,
}) => {
  const [selectedDevId, setSelectedDevId] = useState<string>(developments[0]?.id ?? '');
  const [generating, setGenerating] = useState(false);
  const [editingLp, setEditingLp] = useState<LandingPage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleGenerate = async () => {
    const dev = developments.find((d) => d.id === selectedDevId);
    if (!dev) return;
    setGenerating(true);
    setFeedback(null);
    try {
      const generated = await generateAiLandingPageCopy(dev);
      const now = new Date().toISOString();
      const baseSlug = slugify(dev.slug || dev.name);
      const existingForDev = landingPages.find((lp) => lp.developmentId === dev.id);
      const uniqueSlug = existingForDev
        ? existingForDev.slug
        : landingPages.some((lp) => lp.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;

      const newLp: LandingPage = {
        id: existingForDev?.id ?? `lp_${dev.id}_${Date.now().toString().slice(-4)}`,
        developmentId: dev.id,
        slug: uniqueSlug,
        status: existingForDev?.status ?? 'draft',
        heroTitle: generated.heroTitle || dev.name,
        heroSlogan: generated.heroSlogan || dev.tagline,
        heroSubtitle: generated.heroSubtitle || dev.description,
        heroImage: dev.heroImage || BRAND_IMAGES.devReserva,
        ctaPrimaryText: generated.ctaPrimaryText || 'Receber Tabela e Plantas Exclusivas',
        differentials: Array.isArray(generated.differentials) ? generated.differentials : [],
        galleryImages: dev.galleryImages.length > 0 ? dev.galleryImages : [dev.heroImage],
        floorPlanImages:
          dev.floorPlanImages.length > 0 ? dev.floorPlanImages : [BRAND_IMAGES.interiorLiving],
        videoUrls: dev.videoUrls || [],
        attachments: dev.attachments || [],
        typologies: dev.typologies,
        locationSummary: generated.locationSummary || `${dev.neighborhood}, ${dev.city}`,
        nearbyHighlights: Array.isArray(generated.nearbyHighlights)
          ? generated.nearbyHighlights
          : [],
        mapQuery: `${dev.neighborhood}, ${dev.city}, RS`,
        leisureHighlights: Array.isArray(generated.leisureHighlights)
          ? generated.leisureHighlights
          : dev.amenities,
        whyInvestTitle: generated.whyInvestTitle || `Por que investir no ${dev.name}`,
        whyInvestReasons: Array.isArray(generated.whyInvestReasons)
          ? generated.whyInvestReasons
          : [],
        trustQuote:
          generated.trustQuote ||
          'Atendimento consultivo e transparente para você investir com segurança em Estância Velha e Vale dos Sinos.',
        trustAuthor: generated.trustAuthor || 'Luciana Domingos · CRECI 73892F',
        seoTitle: generated.seoTitle || `${dev.name} | Luciana Domingos Imóveis`,
        seoDescription: generated.seoDescription || dev.tagline,
        createdAt: existingForDev?.createdAt ?? now,
        updatedAt: now,
      };

      await onSaveLandingPage(newLp, !existingForDev);
      setEditingLp(newLp);
      setFeedback(
        `Landing Page Premium gerada para "${dev.name}". Revise os textos abaixo, pré-visualize e publique quando estiver pronta!`
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Erro ao gerar Landing Page.');
    } finally {
      setGenerating(false);
    }
  };

  const getPublicUrl = (slug: string) =>
    `${window.location.origin}/empreendimento/${slug}`;

  const handleCopy = async (lp: LandingPage) => {
    const url = getPublicUrl(lp.slug);
    await navigator.clipboard.writeText(url);
    setCopiedId(lp.id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const handleShare = (lp: LandingPage) => {
    const url = getPublicUrl(lp.slug);
    const text = `Conheça o empreendimento ${lp.heroTitle} com atendimento exclusivo da Luciana Domingos: ${url}`;
    if (navigator.share) {
      navigator.share({ title: lp.heroTitle, text, url }).catch(() => {});
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  const handleToggleStatus = async (lp: LandingPage) => {
    const updated: LandingPage = {
      ...lp,
      status: lp.status === 'published' ? 'draft' : 'published',
      updatedAt: new Date().toISOString(),
    };
    await onSaveLandingPage(updated, false);
    if (editingLp?.id === lp.id) setEditingLp(updated);
  };

  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLp) return;
    setSaving(true);
    try {
      const cleaned: LandingPage = {
        ...editingLp,
        slug: slugify(editingLp.slug || editingLp.heroTitle),
        updatedAt: new Date().toISOString(),
      };
      await onSaveLandingPage(cleaned, false);
      setEditingLp(null);
      setFeedback('Landing Page atualizada com sucesso!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* AI Generator Bar */}
      <div className="bg-white border border-[#0F2936]/12 rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#B08839]">
            Gerador Automático de Alta Conversão
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[#0F2936]">
            Landing Pages de Empreendimentos
          </h2>
          <p className="text-sm text-[#0F2936]/70 max-w-2xl">
            Selecione um empreendimento cadastrado para gerar automaticamente uma Landing Page completa com copywriting persuasivo, galeria, tipologias, mapa, tese de investimento e link exclusivo para Instagram, WhatsApp e anúncios.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedDevId}
            onChange={(e) => setSelectedDevId(e.target.value)}
            aria-label="Selecionar empreendimento"
            className="flex-1 px-4 py-3 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-xl text-sm font-medium text-[#0F2936]"
          >
            {developments.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.name} ({dev.neighborhood} · {dev.city})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || developments.length === 0}
            className="px-6 py-3 bg-[#0F2936] hover:bg-[#163A4D] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#D8B467]" />
            {generating ? 'Gerando Landing Page com IA...' : 'Gerar Landing Page Premium'}
          </button>
        </div>

        {feedback && (
          <div className="text-sm text-[#0F2936] bg-[#FAF9F6] border border-[#C59B48]/50 rounded-xl px-4 py-3">
            {feedback}
          </div>
        )}
      </div>

      {/* Existing Landing Pages List */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl font-semibold text-[#0F2936]">
          Landing Pages Geradas ({landingPages.length})
        </h3>

        {landingPages.length === 0 ? (
          <div className="bg-white border border-[#0F2936]/10 rounded-xl p-10 text-center text-sm text-[#0F2936]/65">
            Nenhuma Landing Page gerada ainda. Selecione um empreendimento acima e clique em “Gerar Landing Page Premium”.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {landingPages.map((lp) => {
              const publicUrl = getPublicUrl(lp.slug);
              return (
                <div
                  key={lp.id}
                  className="bg-white border border-[#0F2936]/10 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-24 h-16 rounded-lg overflow-hidden bg-[#F2F4F6] shrink-0">
                      <SafeImage
                        src={lp.heroImage}
                        alt={lp.heroTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span
                          className={
                            lp.status === 'published' ? 'text-[#16A34A]' : 'text-[#D97706]'
                          }
                        >
                          {lp.status === 'published' ? 'Publicada' : 'Rascunho'}
                        </span>
                        <span aria-hidden="true" className="text-[#0F2936]/30">
                          ·
                        </span>
                        <span className="text-[#0F2936]/60 truncate">
                          /empreendimento/{lp.slug}
                        </span>
                      </div>
                      <h4 className="font-serif text-lg font-semibold text-[#0F2936] truncate">
                        {lp.heroTitle}
                      </h4>
                      <div className="text-xs text-[#0F2936]/65 truncate max-w-xl">
                        {publicUrl}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(lp)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF9F6] hover:bg-[#F2F4F6] border border-[#0F2936]/15 rounded-lg text-xs font-semibold text-[#0F2936] cursor-pointer"
                    >
                      {copiedId === lp.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                          Link Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#C59B48]" />
                          Copiar Link
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShare(lp)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF9F6] hover:bg-[#F2F4F6] border border-[#0F2936]/15 rounded-lg text-xs font-semibold text-[#0F2936] cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#C59B48]" />
                      Compartilhar
                    </button>

                    <button
                      type="button"
                      onClick={() => onPreviewSlug(lp.slug)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF9F6] hover:bg-[#F2F4F6] border border-[#0F2936]/15 rounded-lg text-xs font-semibold text-[#0F2936] cursor-pointer"
                    >
                      {lp.status === 'published' ? (
                        <ExternalLink className="w-3.5 h-3.5 text-[#0F2936]" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-[#0F2936]" />
                      )}
                      {lp.status === 'published' ? 'Abrir Página' : 'Pré-visualizar'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingLp(lp)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF9F6] hover:bg-[#F2F4F6] border border-[#0F2936]/15 rounded-lg text-xs font-semibold text-[#0F2936] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(lp)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                        lp.status === 'published'
                          ? 'bg-[#D97706]/15 text-[#B45309] hover:bg-[#D97706]/25'
                          : 'bg-[#0F2936] text-white hover:bg-[#163A4D]'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {lp.status === 'published' ? 'Mover p/ Rascunho' : 'Publicar'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteLandingPage(lp.id)}
                      aria-label="Excluir Landing Page"
                      className="p-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comprehensive Section Editor */}
      {editingLp && (
        <form
          onSubmit={handleSaveEditor}
          className="bg-white border border-[#C59B48]/50 rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#0F2936]/10">
            <div>
              <div className="text-xs font-semibold text-[#B08839]">
                Editor Completo da Landing Page
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#0F2936]">
                {editingLp.heroTitle}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditingLp(null)}
                className="px-4 py-2 text-xs font-semibold text-[#0F2936]/70 hover:text-[#0F2936] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#0F2936] hover:bg-[#163A4D] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Nome / Título Principal (Hero)
              </label>
              <input
                type="text"
                required
                value={editingLp.heroTitle}
                onChange={(e) => setEditingLp({ ...editingLp, heroTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Slug da URL (/empreendimento/...)
              </label>
              <input
                type="text"
                required
                value={editingLp.slug}
                onChange={(e) => setEditingLp({ ...editingLp, slug: slugify(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Slogan Forte do Empreendimento
              </label>
              <input
                type="text"
                required
                value={editingLp.heroSlogan}
                onChange={(e) => setEditingLp({ ...editingLp, heroSlogan: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Subtítulo de Apresentação
              </label>
              <textarea
                rows={2}
                value={editingLp.heroSubtitle}
                onChange={(e) => setEditingLp({ ...editingLp, heroSubtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Texto do Botão Principal (CTA)
              </label>
              <input
                type="text"
                value={editingLp.ctaPrimaryText}
                onChange={(e) => setEditingLp({ ...editingLp, ctaPrimaryText: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <BlobMediaManager
                folder={`landing-pages/${editingLp.id}`}
                heroImage={editingLp.heroImage}
                onChangeHeroImage={(heroImage) => setEditingLp({ ...editingLp, heroImage })}
                photos={editingLp.galleryImages}
                onChangePhotos={(galleryImages) => setEditingLp({ ...editingLp, galleryImages })}
                photosLabel="Fotos da Landing Page (Ilimitado · Vercel Blob)"
                floorPlans={editingLp.floorPlanImages}
                onChangeFloorPlans={(floorPlanImages) =>
                  setEditingLp({ ...editingLp, floorPlanImages })
                }
                videoUrls={editingLp.videoUrls || []}
                onChangeVideoUrls={(videoUrls) => setEditingLp({ ...editingLp, videoUrls })}
                attachments={editingLp.attachments || []}
                onChangeAttachments={(attachments) => setEditingLp({ ...editingLp, attachments })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Resumo da Localização e Mapa (Query do Google Maps)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <textarea
                  rows={2}
                  value={editingLp.locationSummary}
                  onChange={(e) =>
                    setEditingLp({ ...editingLp, locationSummary: e.target.value })
                  }
                  className="md:col-span-2 px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={editingLp.mapQuery}
                  onChange={(e) => setEditingLp({ ...editingLp, mapQuery: e.target.value })}
                  placeholder="Cidade, Bairro, RS"
                  className="px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm self-start"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Itens de Lazer e Infraestrutura (um por linha)
              </label>
              <textarea
                rows={3}
                value={editingLp.leisureHighlights.join('\n')}
                onChange={(e) =>
                  setEditingLp({
                    ...editingLp,
                    leisureHighlights: e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#0F2936]/70">
                  Diferenciais do Empreendimento
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setEditingLp({
                      ...editingLp,
                      differentials: [
                        ...editingLp.differentials,
                        { title: 'Novo Diferencial', description: '' },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F2936] hover:text-[#B08839] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar diferencial
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {editingLp.differentials.map((diff, idx) => (
                  <div key={idx} className="p-3 bg-[#FAF9F6] rounded-xl space-y-2 border border-[#0F2936]/10">
                    <input
                      type="text"
                      value={diff.title}
                      onChange={(e) => {
                        const next = [...editingLp.differentials];
                        next[idx] = { ...diff, title: e.target.value };
                        setEditingLp({ ...editingLp, differentials: next });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#0F2936]/15 rounded text-xs font-semibold"
                    />
                    <textarea
                      rows={2}
                      value={diff.description}
                      onChange={(e) => {
                        const next = [...editingLp.differentials];
                        next[idx] = { ...diff, description: e.target.value };
                        setEditingLp({ ...editingLp, differentials: next });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#0F2936]/15 rounded text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Depoimento / Selo de Confiança
              </label>
              <textarea
                rows={2}
                value={editingLp.trustQuote}
                onChange={(e) => setEditingLp({ ...editingLp, trustQuote: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F2936]/70 mb-1">
                Status de Publicação
              </label>
              <select
                value={editingLp.status}
                onChange={(e) =>
                  setEditingLp({
                    ...editingLp,
                    status: e.target.value as 'draft' | 'published',
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#0F2936]/15 rounded-lg text-sm"
              >
                <option value="draft">Rascunho (Pré-visualização apenas)</option>
                <option value="published">Publicada (Link aberto ao público)</option>
              </select>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
