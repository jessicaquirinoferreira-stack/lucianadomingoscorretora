import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Film,
  ImagePlus,
  Loader2,
  Paperclip,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  deleteBlobAsset,
  formatFileSize,
  uploadMediaToBlob,
} from '../../lib/mediaOptimizer.ts';
import type { MediaAttachment } from '../../types.ts';
import { SafeImage } from '../SafeImage.tsx';

interface BlobMediaManagerProps {
  folder: string;
  photos: string[];
  onChangePhotos: (next: string[]) => void;
  photosLabel?: string;
  heroImage?: string;
  onChangeHeroImage?: (url: string) => void;
  floorPlans?: string[];
  onChangeFloorPlans?: (next: string[]) => void;
  videoUrls?: string[];
  onChangeVideoUrls?: (next: string[]) => void;
  attachments?: MediaAttachment[];
  onChangeAttachments?: (next: MediaAttachment[]) => void;
}

interface UploadStatusSummary {
  count: number;
  originalBytes: number;
  optimizedBytes: number;
}

export const BlobMediaManager: React.FC<BlobMediaManagerProps> = ({
  folder,
  photos,
  onChangePhotos,
  photosLabel = 'Galeria Ilimitada de Fotos (Vercel Blob)',
  heroImage,
  onChangeHeroImage,
  floorPlans,
  onChangeFloorPlans,
  videoUrls,
  onChangeVideoUrls,
  attachments,
  onChangeAttachments,
}) => {
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const floorPlanInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadingArea, setUploadingArea] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [stats, setStats] = useState<UploadStatusSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualPhotoUrl, setManualPhotoUrl] = useState('');
  const [manualVideoUrl, setManualVideoUrl] = useState('');

  const handlePhotoFiles = async (fileList: FileList | null, target: 'gallery' | 'floorplan') => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setUploadingArea(target);
    setErrorMsg(null);
    let totalOrig = 0;
    let totalOpt = 0;
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i += 1) {
        const f = files[i];
        setUploadProgress(`Otimizando e enviando foto ${i + 1} de ${files.length}...`);
        const uploaded = await uploadMediaToBlob(f, `${folder}/${target}`, {
          maxDimension: target === 'floorplan' ? 2048 : 1920,
        });
        totalOrig += uploaded.originalSize;
        totalOpt += uploaded.optimizedSize;
        uploadedUrls.push(uploaded.url);
      }

      if (target === 'gallery') {
        const nextPhotos = [...photos, ...uploadedUrls];
        onChangePhotos(nextPhotos);
        if (onChangeHeroImage && !heroImage && uploadedUrls[0]) {
          onChangeHeroImage(uploadedUrls[0]);
        }
      } else if (onChangeFloorPlans) {
        onChangeFloorPlans([...(floorPlans || []), ...uploadedUrls]);
      }

      setStats({
        count: files.length,
        originalBytes: totalOrig,
        optimizedBytes: totalOpt,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar fotos para Vercel Blob.');
    } finally {
      setUploadingArea(null);
      setUploadProgress('');
    }
  };

  const handleVideoFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !onChangeVideoUrls) return;
    const files = Array.from(fileList);
    setUploadingArea('video');
    setErrorMsg(null);
    const urls: string[] = [];
    try {
      for (let i = 0; i < files.length; i += 1) {
        setUploadProgress(`Enviando vídeo ${i + 1} de ${files.length} para Vercel Blob...`);
        const uploaded = await uploadMediaToBlob(files[i], `${folder}/videos`);
        urls.push(uploaded.url);
      }
      onChangeVideoUrls([...(videoUrls || []), ...urls]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar vídeo.');
    } finally {
      setUploadingArea(null);
      setUploadProgress('');
    }
  };

  const handleAttachmentFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !onChangeAttachments) return;
    const files = Array.from(fileList);
    setUploadingArea('attachment');
    setErrorMsg(null);
    const items: MediaAttachment[] = [];
    try {
      for (let i = 0; i < files.length; i += 1) {
        setUploadProgress(`Enviando anexo ${i + 1} de ${files.length}...`);
        const uploaded = await uploadMediaToBlob(files[i], `${folder}/anexos`, {
          maxDimension: 2048,
        });
        items.push({
          name: uploaded.name,
          url: uploaded.url,
          size: uploaded.size,
          contentType: uploaded.contentType,
        });
      }
      onChangeAttachments([...(attachments || []), ...items]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar anexo.');
    } finally {
      setUploadingArea(null);
      setUploadProgress('');
    }
  };

  const movePhoto = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChangePhotos(next);
  };

  const removePhoto = (idx: number) => {
    const removed = photos[idx];
    const next = photos.filter((_, i) => i !== idx);
    onChangePhotos(next);
    if (removed && removed === heroImage && onChangeHeroImage) {
      onChangeHeroImage(next[0] || '');
    }
    if (removed) void deleteBlobAsset(removed);
  };

  const savingsPct =
    stats && stats.originalBytes > 0
      ? Math.max(0, Math.round(((stats.originalBytes - stats.optimizedBytes) / stats.originalBytes) * 100))
      : 0;

  return (
    <div className="space-y-5 bg-[#FAF9F6] border border-[#0F2936]/12 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0F2936]">
          <Sparkles className="w-4 h-4 text-[#C59B48]" />
          <span>Mídia & Anexos via Vercel Blob · Compressão Automática sem Perda Visual</span>
        </div>
        {stats && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#15803D] bg-[#16A34A]/10 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {stats.count} foto(s): {formatFileSize(stats.originalBytes)} →{' '}
            {formatFileSize(stats.optimizedBytes)} ({savingsPct > 0 ? `-${savingsPct}%` : 'otimizado'})
          </span>
        )}
      </div>

      {uploadingArea && (
        <div className="flex items-center gap-2.5 text-xs font-semibold text-[#0F2936] bg-[#C59B48]/15 border border-[#C59B48]/40 rounded-xl px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-[#B08839]" />
          <span>{uploadProgress || 'Processando arquivos...'}</span>
        </div>
      )}

      {errorMsg && (
        <div className="text-xs font-medium text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/25 rounded-xl px-3.5 py-2.5">
          {errorMsg}
        </div>
      )}

      {/* 1. Unlimited Photos Dropzone & Grid */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold text-[#0F2936]">
            {photosLabel} ({photos.length} {photos.length === 1 ? 'foto' : 'fotos'})
          </label>
          <button
            type="button"
            disabled={uploadingArea !== null}
            onClick={() => photoInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F2936] hover:bg-[#163A4D] disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            <ImagePlus className="w-3.5 h-3.5 text-[#D8B467]" />
            Adicionar Fotos (Ilimitado)
          </button>
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void handlePhotoFiles(e.target.files, 'gallery');
            e.target.value = '';
          }}
        />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void handlePhotoFiles(e.dataTransfer.files, 'gallery');
          }}
          onClick={() => photoInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') photoInputRef.current?.click();
          }}
          className="border-2 border-dashed border-[#0F2936]/20 hover:border-[#C59B48] bg-white rounded-xl p-5 text-center cursor-pointer transition-colors"
        >
          <UploadCloud className="w-7 h-7 text-[#C59B48] mx-auto mb-1.5" />
          <div className="text-xs font-semibold text-[#0F2936]">
            Clique ou arraste quantas fotos quiser de uma só vez
          </div>
          <div className="text-[11px] text-[#0F2936]/60 mt-0.5">
            Todas as fotos são automaticamente refeitas em WebP ultra-leve sem perder qualidade
          </div>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {photos.map((url, idx) => {
              const isCover = heroImage ? url === heroImage : idx === 0;
              return (
                <div
                  key={`${url}-${idx}`}
                  className={`group relative rounded-xl overflow-hidden bg-white border ${
                    isCover ? 'border-[#C59B48] ring-2 ring-[#C59B48]/30' : 'border-[#0F2936]/12'
                  }`}
                >
                  <div className="aspect-[4/3] bg-[#F2F4F6]">
                    <SafeImage
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isCover && (
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-[#C59B48] text-[#081820] text-[10px] font-bold rounded">
                      Capa
                    </span>
                  )}
                  <div className="p-1.5 flex items-center justify-between gap-1 bg-white border-t border-[#0F2936]/8">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => movePhoto(idx, -1)}
                        disabled={idx === 0}
                        title="Mover para esquerda"
                        className="p-1 text-[#0F2936]/70 hover:text-[#0F2936] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePhoto(idx, 1)}
                        disabled={idx === photos.length - 1}
                        title="Mover para direita"
                        className="p-1 text-[#0F2936]/70 hover:text-[#0F2936] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      {onChangeHeroImage && (
                        <button
                          type="button"
                          onClick={() => onChangeHeroImage(url)}
                          title="Definir como foto principal (capa)"
                          className={`p-1 cursor-pointer ${
                            isCover ? 'text-[#C59B48]' : 'text-[#0F2936]/50 hover:text-[#C59B48]'
                          }`}
                        >
                          <Star className="w-3 h-3 fill-current" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      title="Remover foto"
                      className="p-1 text-[#DC2626] hover:bg-[#DC2626]/10 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="url"
            value={manualPhotoUrl}
            onChange={(e) => setManualPhotoUrl(e.target.value)}
            placeholder="Ou cole uma URL direta de imagem..."
            className="flex-1 px-3 py-1.5 bg-white border border-[#0F2936]/15 rounded-lg text-xs"
          />
          <button
            type="button"
            onClick={() => {
              const clean = manualPhotoUrl.trim();
              if (!clean) return;
              onChangePhotos([...photos, clean]);
              if (onChangeHeroImage && !heroImage) onChangeHeroImage(clean);
              setManualPhotoUrl('');
            }}
            className="px-3 py-1.5 bg-white border border-[#0F2936]/20 hover:border-[#C59B48] text-xs font-semibold text-[#0F2936] rounded-lg cursor-pointer"
          >
            + URL
          </button>
        </div>
      </div>

      {/* 2. Optional Floor Plans Section (Developments & LPs) */}
      {onChangeFloorPlans && (
        <div className="pt-4 border-t border-[#0F2936]/10 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-[#0F2936]">
              Plantas Baixas / Perspectivas Técnicas ({(floorPlans || []).length})
            </label>
            <button
              type="button"
              disabled={uploadingArea !== null}
              onClick={() => floorPlanInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#0F2936]/20 hover:border-[#C59B48] text-xs font-semibold text-[#0F2936] rounded-lg cursor-pointer"
            >
              <ImagePlus className="w-3.5 h-3.5 text-[#C59B48]" />
              Enviar Plantas (Ilimitado)
            </button>
          </div>
          <input
            ref={floorPlanInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void handlePhotoFiles(e.target.files, 'floorplan');
              e.target.value = '';
            }}
          />
          {floorPlans && floorPlans.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {floorPlans.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative rounded-lg overflow-hidden border border-[#0F2936]/12 bg-white aspect-[4/3]"
                >
                  <SafeImage src={url} alt={`Planta ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      onChangeFloorPlans(floorPlans.filter((_, i) => i !== idx));
                      void deleteBlobAsset(url);
                    }}
                    className="absolute top-1 right-1 p-1 bg-white/90 text-[#DC2626] rounded shadow cursor-pointer"
                    aria-label="Remover planta"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Videos via Vercel Blob */}
      {onChangeVideoUrls && (
        <div className="pt-4 border-t border-[#0F2936]/10 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2936]">
              <Film className="w-3.5 h-3.5 text-[#C59B48]" />
              Vídeos / Tours no Vercel Blob ({(videoUrls || []).length})
            </label>
            <button
              type="button"
              disabled={uploadingArea !== null}
              onClick={() => videoInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#0F2936]/20 hover:border-[#C59B48] text-xs font-semibold text-[#0F2936] rounded-lg cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 text-[#C59B48]" />
              Enviar Vídeo (.mp4, .webm)
            </button>
          </div>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleVideoFiles(e.target.files);
              e.target.value = '';
            }}
          />

          {videoUrls && videoUrls.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videoUrls.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="bg-white border border-[#0F2936]/12 rounded-xl overflow-hidden"
                >
                  <video src={url} controls playsInline preload="metadata" className="w-full aspect-video bg-black" />
                  <div className="px-3 py-2 flex items-center justify-between text-xs">
                    <span className="text-[#0F2936]/70 truncate max-w-[75%]">Vídeo {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        onChangeVideoUrls(videoUrls.filter((_, i) => i !== idx));
                        void deleteBlobAsset(url);
                      }}
                      className="text-[#DC2626] hover:underline font-semibold cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="url"
              value={manualVideoUrl}
              onChange={(e) => setManualVideoUrl(e.target.value)}
              placeholder="Ou cole URL direta de vídeo (.mp4/.webm)..."
              className="flex-1 px-3 py-1.5 bg-white border border-[#0F2936]/15 rounded-lg text-xs"
            />
            <button
              type="button"
              onClick={() => {
                const clean = manualVideoUrl.trim();
                if (!clean) return;
                onChangeVideoUrls([...(videoUrls || []), clean]);
                setManualVideoUrl('');
              }}
              className="px-3 py-1.5 bg-white border border-[#0F2936]/20 hover:border-[#C59B48] text-xs font-semibold text-[#0F2936] rounded-lg cursor-pointer"
            >
              + Vídeo
            </button>
          </div>
        </div>
      )}

      {/* 4. Documents & Attachments via Vercel Blob */}
      {onChangeAttachments && (
        <div className="pt-4 border-t border-[#0F2936]/10 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2936]">
              <Paperclip className="w-3.5 h-3.5 text-[#C59B48]" />
              Anexos / PDFs / Memoriais ({(attachments || []).length})
            </label>
            <button
              type="button"
              disabled={uploadingArea !== null}
              onClick={() => attachmentInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#0F2936]/20 hover:border-[#C59B48] text-xs font-semibold text-[#0F2936] rounded-lg cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#C59B48]" />
              Anexar PDF / Documento
            </button>
          </div>
          <input
            ref={attachmentInputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleAttachmentFiles(e.target.files);
              e.target.value = '';
            }}
          />

          {attachments && attachments.length > 0 && (
            <div className="space-y-1.5">
              {attachments.map((att, idx) => (
                <div
                  key={`${att.url}-${idx}`}
                  className="bg-white border border-[#0F2936]/10 rounded-lg px-3 py-2 flex items-center justify-between gap-3 text-xs"
                >
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#0F2936] hover:text-[#B08839] font-medium truncate"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#C59B48] shrink-0" />
                    <span className="truncate">{att.name}</span>
                    {att.size ? (
                      <span className="text-[11px] text-[#0F2936]/50 shrink-0">
                        ({formatFileSize(att.size)})
                      </span>
                    ) : null}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeAttachments(attachments.filter((_, i) => i !== idx));
                      void deleteBlobAsset(att.url);
                    }}
                    className="text-[#DC2626] hover:underline shrink-0 cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
