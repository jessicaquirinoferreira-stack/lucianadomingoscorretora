import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { getLocalFallbackImageUrl, normalizeAssetImageUrl } from '../data/seedData.ts';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const primarySrc = normalizeAssetImageUrl(src);
  const [currentSrc, setCurrentSrc] = useState(primarySrc);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(normalizeAssetImageUrl(src));
    setFailed(false);
  }, [src]);

  const handleError = () => {
    const localBackup = getLocalFallbackImageUrl(currentSrc);
    if (localBackup && currentSrc !== localBackup) {
      setCurrentSrc(localBackup);
      return;
    }
    setFailed(true);
  };

  if (!currentSrc || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0F2936] via-[#163A4D] to-[#1F4E66] text-[#FAF9F6] p-6 text-center ${className}`}
      >
        <Building2 className="w-8 h-8 text-[#C59B48] mb-2" strokeWidth={1.5} />
        <span className="font-serif text-sm text-[#FAF9F6]/90 max-w-[220px] leading-snug">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
      loading="lazy"
    />
  );
};
