import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { SafeImage } from './SafeImage.tsx';

interface EmblaPropertyGalleryProps {
  images: string[];
  title: string;
  onOpenLightbox: (index: number) => void;
  aspectClass?: string;
}

/**
 * Synchronized touch-physics property gallery built on davidjerleke/embla-carousel.
 */
export const EmblaPropertyGallery: React.FC<EmblaPropertyGalleryProps> = ({
  images,
  title,
  onOpenLightbox,
  aspectClass = 'aspect-[16/10]',
}) => {
  const safeImages = images.length > 0 ? images : [''];
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [mainRef, mainApi] = useEmblaCarousel({ loop: safeImages.length > 1 });
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  });

  const onSelect = useCallback(() => {
    if (!mainApi) return;
    const snap = mainApi.selectedScrollSnap();
    setSelectedIndex(snap);
    thumbApi?.scrollTo(snap);
  }, [mainApi, thumbApi]);

  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on('select', onSelect);
    mainApi.on('reInit', onSelect);
    return () => {
      mainApi.off('select', onSelect);
      mainApi.off('reInit', onSelect);
    };
  }, [mainApi, onSelect]);

  useEffect(() => {
    setSelectedIndex(0);
    mainApi?.scrollTo(0, true);
    thumbApi?.scrollTo(0, true);
  }, [images, mainApi, thumbApi]);

  const scrollPrev = () => mainApi?.scrollPrev();
  const scrollNext = () => mainApi?.scrollNext();
  const scrollTo = (idx: number) => mainApi?.scrollTo(idx);

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden bg-[#0F2936]/5 border border-[#0F2936]/10 group">
        <div ref={mainRef} className="overflow-hidden">
          <div className="flex">
            {safeImages.map((src, idx) => (
              <div
                key={`${src}-${idx}`}
                className={`min-w-0 flex-[0_0_100%] ${aspectClass} max-h-[580px] relative`}
              >
                <button
                  type="button"
                  onClick={() => onOpenLightbox(idx)}
                  className="w-full h-full block cursor-zoom-in text-left"
                  aria-label={`Ampliar foto ${idx + 1} de ${title}`}
                >
                  <SafeImage
                    src={src}
                    alt={`${title} - imagem ${idx + 1}`}
                    fallbackLabel={title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Foto anterior"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#081820]/75 hover:bg-[#081820] text-white border border-white/15 flex items-center justify-center transition-colors backdrop-blur-md cursor-pointer z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Próxima foto"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#081820]/75 hover:bg-[#081820] text-white border border-white/15 flex items-center justify-center transition-colors backdrop-blur-md cursor-pointer z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter & Fullscreen Lightbox Trigger */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          <span className="px-3 py-1.5 rounded-lg bg-[#081820]/80 backdrop-blur-md text-white/90 text-xs font-medium tabular-nums border border-white/15">
            {String(selectedIndex + 1).padStart(2, '0')} /{' '}
            {String(safeImages.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => onOpenLightbox(selectedIndex)}
            className="pointer-events-auto px-4 py-2 rounded-xl bg-[#081820]/85 hover:bg-[#081820] backdrop-blur-md text-white text-xs font-semibold inline-flex items-center gap-2 border border-white/15 cursor-pointer transition-colors"
          >
            <Expand className="w-3.5 h-3.5 text-[#D8B467]" />
            Ampliar fotos ({safeImages.length})
          </button>
        </div>
      </div>

      {/* Synchronized Thumbnail Strip */}
      {safeImages.length > 1 && (
        <div ref={thumbRef} className="overflow-hidden">
          <div className="flex gap-3">
            {safeImages.map((img, idx) => (
              <button
                key={`${img}-thumb-${idx}`}
                type="button"
                onClick={() => scrollTo(idx)}
                onDoubleClick={() => onOpenLightbox(idx)}
                aria-label={`Selecionar foto ${idx + 1}`}
                className={`relative aspect-[16/10] flex-[0_0_28%] sm:flex-[0_0_20%] lg:flex-[0_0_16%] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  selectedIndex === idx
                    ? 'border-[#C59B48] opacity-100'
                    : 'border-transparent opacity-65 hover:opacity-100'
                }`}
              >
                <SafeImage
                  src={img}
                  alt={`${title} miniatura ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
