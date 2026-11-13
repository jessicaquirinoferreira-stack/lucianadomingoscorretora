import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SafeImage } from './SafeImage.tsx';

interface LightboxModalProps {
  images: string[];
  activeIndex: number | null;
  title?: string;
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  images,
  activeIndex,
  title,
  onClose,
  onChangeIndex,
}) => {
  const isOpen = activeIndex !== null && images.length > 0;

  useEffect(() => {
    if (!isOpen || activeIndex === null) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onChangeIndex((activeIndex + 1) % images.length);
      if (e.key === 'ArrowLeft')
        onChangeIndex((activeIndex - 1 + images.length) % images.length);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, activeIndex, images.length, onClose, onChangeIndex]);

  return (
    <AnimatePresence>
      {isOpen && activeIndex !== null && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title ? `Galeria de ${title}` : 'Galeria de imagens'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 bg-[#081820]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8"
          onClick={onClose}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between text-white max-w-6xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-0.5">
              {title && (
                <div className="font-serif text-lg sm:text-xl font-semibold text-white">
                  {title}
                </div>
              )}
              <div className="text-xs text-[#D8B467] tabular-nums">
                Imagem {String(activeIndex + 1).padStart(2, '0')} de{' '}
                {String(images.length).padStart(2, '0')}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar visualizador"
              className="w-11 h-11 rounded-full border border-white/20 hover:border-[#D8B467] text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Image */}
          <div
            className="relative flex-1 flex items-center justify-center max-w-6xl w-full mx-auto my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  onChangeIndex((activeIndex - 1 + images.length) % images.length)
                }
                aria-label="Imagem anterior"
                className="absolute left-2 sm:left-4 z-10 w-11 h-11 rounded-full bg-[#0F2936]/80 hover:bg-[#0F2936] border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-h-[74vh] aspect-[16/10] rounded-2xl overflow-hidden border border-white/15 bg-[#0F2936]"
            >
              <SafeImage
                src={images[activeIndex]}
                alt={`${title || 'Imóvel'} — foto ${activeIndex + 1}`}
                className="w-full h-full object-contain bg-[#081820]"
              />
            </motion.div>

            {images.length > 1 && (
              <button
                type="button"
                onClick={() => onChangeIndex((activeIndex + 1) % images.length)}
                aria-label="Próxima imagem"
                className="absolute right-2 sm:right-4 z-10 w-11 h-11 rounded-full bg-[#0F2936]/80 hover:bg-[#0F2936] border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div
              className="flex items-center justify-center gap-2.5 overflow-x-auto max-w-4xl mx-auto pb-1"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => onChangeIndex(idx)}
                  className={`w-16 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    idx === activeIndex
                      ? 'border-[#D8B467] opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-85'
                  }`}
                >
                  <SafeImage
                    src={img}
                    alt={`Miniatura ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
