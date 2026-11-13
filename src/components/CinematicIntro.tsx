import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface CinematicIntroProps {
  brokerName: string;
  creci: string;
  backdropImage: string;
  onComplete: () => void;
}

const LUXURY_EASE = [0.16, 1, 0.3, 1] as const;

export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  brokerName,
  creci,
  backdropImage,
  onComplete,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const exitDelay = shouldReduceMotion ? 900 : 5250;
    const doneDelay = shouldReduceMotion ? 1400 : 6000;

    const exitTimer = window.setTimeout(() => setIsExiting(true), exitDelay);
    const doneTimer = window.setTimeout(() => onComplete(), doneDelay);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete, shouldReduceMotion]);

  const handleSkip = () => {
    if (isExiting) return;
    setIsExiting(true);
    window.setTimeout(() => onComplete(), 380);
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Apresentação ${brokerName}`}
      initial={{ opacity: 1 }}
      animate={
        isExiting
          ? { opacity: 0, scale: shouldReduceMotion ? 1 : 1.035 }
          : { opacity: 1, scale: 1 }
      }
      transition={{ duration: 0.75, ease: LUXURY_EASE }}
      className="fixed inset-0 z-[100] bg-[#061117] text-[#FAF9F6] overflow-hidden flex flex-col items-center justify-center select-none"
    >
      {/* Layer 1: Photorealistic Architectural Atmosphere & Slow Dolly */}
      <motion.div
        aria-hidden="true"
        initial={shouldReduceMotion ? { opacity: 0.3 } : { opacity: 0, scale: 1.12 }}
        animate={
          shouldReduceMotion
            ? { opacity: 0.3 }
            : { opacity: [0, 0.14, 0.36], scale: 1.01 }
        }
        transition={{
          opacity: { duration: 3.6, times: [0, 0.45, 1], ease: 'easeOut' },
          scale: { duration: 5.8, ease: 'easeOut' },
        }}
        className="absolute inset-0 pointer-events-none"
      >
        <img
          src={backdropImage}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
      </motion.div>

      {/* Atmospheric Depth Vignette & Golden-Hour Horizon Light */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#061117]/90 via-[#061117]/60 to-[#061117]/95"
      />
      <motion.div
        aria-hidden="true"
        initial={shouldReduceMotion ? { opacity: 0.65 } : { opacity: 0, scale: 0.85 }}
        animate={shouldReduceMotion ? { opacity: 0.65 } : { opacity: 0.9, scale: 1 }}
        transition={{ duration: 2.8, delay: 0.6, ease: 'easeOut' }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 68% 42% at 50% 48%, rgba(216,180,103,0.18), rgba(15,41,54,0.22) 52%, transparent 78%)',
        }}
      />

      {/* Layer 2: Open, Unframed Large Composition (Zero circles or boxes) */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 flex flex-col items-center justify-center">
        {/* Contemporary Luxury Residence Architectural Elevation */}
        <svg
          viewBox="0 0 960 350"
          className="w-full max-w-[860px] h-auto overflow-visible"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="goldDraftStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9D7A32" />
              <stop offset="35%" stopColor="#E6C982" />
              <stop offset="65%" stopColor="#FAF3E0" />
              <stop offset="100%" stopColor="#B88E3D" />
            </linearGradient>

            <linearGradient id="softGoldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D8B467" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#FAF9F6" stopOpacity="0.55" />
            </linearGradient>

            <linearGradient id="warmInteriorLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F5D78E" stopOpacity="0.52" />
              <stop offset="55%" stopColor="#D8A74E" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0F2936" stopOpacity="0.06" />
            </linearGradient>

            <linearGradient id="glassReflectionSheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#F8E7B9" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="volumeShadowFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0C222D" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#061117" stopOpacity="0.82" />
            </linearGradient>

            <filter id="architecturalGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Architectural Volume & Dusk Interior Lighting Materialization (Realism Layer) */}
          <motion.g
            initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: shouldReduceMotion ? 0 : 1.75, ease: 'easeOut' }}
          >
            {/* Subtle Architectural Facade Shading */}
            <polygon points="154,118 378,104 378,184 154,186" fill="url(#volumeShadowFill)" />
            <polygon points="154,118 118,134 118,200 154,186" fill="#050E13" fillOpacity="0.72" />
            <polygon points="586,184 794,188 794,264 586,264" fill="url(#volumeShadowFill)" />

            {/* Warm Interior Window Illumination */}
            <rect x="386" y="108" width="188" height="154" fill="url(#warmInteriorLight)" />
            <rect x="196" y="128" width="144" height="44" fill="url(#warmInteriorLight)" />
            <rect x="606" y="196" width="154" height="66" fill="url(#warmInteriorLight)" />

            {/* Diagonal Glass Specular Reflection */}
            <polygon points="390,108 455,108 418,262 386,262" fill="url(#glassReflectionSheen)" />
            <polygon points="484,108 532,108 498,262 465,262" fill="url(#glassReflectionSheen)" />
            <polygon points="614,196 668,196 640,262 606,262" fill="url(#glassReflectionSheen)" />

            {/* Subtle Downlight Pools on Terrace */}
            <ellipse cx="480" cy="264" rx="145" ry="12" fill="#E6C67A" fillOpacity="0.14" />
            <ellipse cx="680" cy="264" rx="90" ry="9" fill="#E6C67A" fillOpacity="0.1" />
          </motion.g>

          {/* 1. Ground Horizon, Steps & Water Reflection Plane */}
          <motion.path
            d="M 40 264 L 920 264"
            stroke="url(#goldDraftStroke)"
            strokeWidth="1.4"
            strokeLinecap="round"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: 0.95 }}
            transition={{ duration: 1.0, delay: 0.1, ease: LUXURY_EASE }}
          />
          <motion.path
            d="M 225 276 L 765 276"
            stroke="#D8B467"
            strokeOpacity="0.5"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: 0.35, ease: LUXURY_EASE }}
          />
          <motion.path
            d="M 320 290 L 670 290 M 390 304 L 590 304"
            stroke="#D8B467"
            strokeOpacity="0.22"
            strokeWidth="0.9"
            strokeLinecap="round"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.0, delay: 1.65, ease: LUXURY_EASE }}
          />

          {/* 2. Primary Architectural Roofline & Sculptural Atrium Gable */}
          <motion.path
            d="M 324 108 L 480 48 L 642 122"
            stroke="url(#goldDraftStroke)"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#architecturalGlow)"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.25, delay: 0.3, ease: LUXURY_EASE }}
          />
          <motion.path
            d="M 342 114 L 480 61 L 624 126"
            stroke="#FAF9F6"
            strokeOpacity="0.65"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, delay: 0.55, ease: LUXURY_EASE }}
          />

          {/* 3. Left Cantilevered Upper Suite Volume & Perspective Side Wall */}
          <motion.path
            d="M 154 118 L 378 104 L 378 184 L 154 186 Z"
            stroke="url(#goldDraftStroke)"
            strokeWidth="1.9"
            strokeLinejoin="round"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.35, delay: 0.45, ease: LUXURY_EASE }}
          />
          <motion.path
            d="M 154 118 L 118 134 L 118 200 L 154 186 M 118 200 L 245 200 L 245 264"
            stroke="url(#softGoldStroke)"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.15, delay: 0.7, ease: LUXURY_EASE }}
          />
          {/* Upper Panoramic Window & Balcony Balustrade */}
          <motion.path
            d="M 196 128 L 340 122 L 340 172 L 196 174 Z M 244 126 L 244 173 M 292 124 L 292 172"
            stroke="#FAF9F6"
            strokeOpacity="0.8"
            strokeWidth="1.05"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.05, delay: 1.05, ease: LUXURY_EASE }}
          />

          {/* 4. Central Double-Height Glass Atrium, Mezzanine & Entrance Portal */}
          <motion.path
            d="M 378 104 L 378 264 M 586 112 L 586 264 M 378 184 L 586 184"
            stroke="url(#goldDraftStroke)"
            strokeWidth="1.65"
            strokeLinecap="round"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.15, delay: 0.85, ease: LUXURY_EASE }}
          />
          <motion.path
            d="M 430 82 L 430 264 M 482 62 L 482 264 M 534 86 L 534 264 M 378 142 L 586 142"
            stroke="#FAF9F6"
            strokeOpacity="0.6"
            strokeWidth="0.95"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, delay: 1.15, ease: LUXURY_EASE }}
          />
          {/* Pivot Entrance Door & Porch */}
          <motion.path
            d="M 294 186 L 294 264 M 342 185 L 342 264 M 294 186 L 342 185 M 331 224 L 331 236"
            stroke="#E6C982"
            strokeWidth="1.35"
            strokeLinecap="round"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: 1.35, ease: LUXURY_EASE }}
          />

          {/* 5. Right Gourmet Terrace Wing & Architectural Pergola */}
          <motion.path
            d="M 586 176 L 826 182 L 826 192 L 586 188 M 784 191 L 784 264 M 800 191 L 800 264"
            stroke="url(#goldDraftStroke)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.95, ease: LUXURY_EASE }}
          />
          <motion.path
            d="M 606 196 L 760 196 L 760 264 M 656 196 L 656 264 M 708 196 L 708 264 M 618 176 L 642 148 L 810 156 L 826 182"
            stroke="#FAF9F6"
            strokeOpacity="0.65"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, delay: 1.35, ease: LUXURY_EASE }}
          />

          {/* 6. Landscape Cypress & Minimalist Foliage Context */}
          <motion.path
            d="M 92 264 C 86 226, 94 176, 102 154 C 110 176, 118 226, 112 264 M 74 264 C 70 240, 76 208, 82 194 C 88 208, 92 240, 88 264"
            stroke="#D8B467"
            strokeOpacity="0.45"
            strokeWidth="1.1"
            strokeLinecap="round"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.95, delay: 1.55, ease: LUXURY_EASE }}
          />
          <motion.path
            d="M 838 264 C 833 230, 842 184, 850 162 C 858 184, 866 230, 860 264 M 872 264 C 868 240, 875 210, 881 196 C 887 210, 892 240, 888 264"
            stroke="#D8B467"
            strokeOpacity="0.45"
            strokeWidth="1.1"
            strokeLinecap="round"
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.95, delay: 1.65, ease: LUXURY_EASE }}
          />
        </svg>

        {/* Layer 3: Large Free-Floating Written Signature of the Broker */}
        <div className="w-full max-w-[880px] -mt-2 sm:-mt-5 flex flex-col items-center text-center">
          <svg
            viewBox="0 0 960 126"
            className="w-full h-auto overflow-visible"
            role="img"
            aria-label={brokerName}
          >
            <defs>
              <linearGradient id="brokerNameFill" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FAF9F6" />
                <stop offset="48%" stopColor="#FFF8E8" />
                <stop offset="100%" stopColor="#E6C67A" />
              </linearGradient>

              <linearGradient id="writeEdgeSoft" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="88%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>

              <radialGradient id="penNibGlint" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFDF5" stopOpacity="1" />
                <stop offset="40%" stopColor="#E6C982" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#E6C982" stopOpacity="0" />
              </radialGradient>

              <mask id="writeRevealMask">
                <motion.rect
                  x="0"
                  y="0"
                  height="126"
                  fill="url(#writeEdgeSoft)"
                  initial={{ width: shouldReduceMotion ? 960 : 0 }}
                  animate={{ width: 960 }}
                  transition={{ duration: 1.75, delay: 2.25, ease: [0.22, 1, 0.36, 1] }}
                />
              </mask>
            </defs>

            {/* Left-to-right feathered writing sweep + calligraphic serif contour-to-fill */}
            <g mask={shouldReduceMotion ? undefined : 'url(#writeRevealMask)'}>
              <motion.text
                x="480"
                y="78"
                textAnchor="middle"
                fontFamily="'Cormorant Garamond', Georgia, serif"
                fontSize="78"
                fontStyle="italic"
                fontWeight="600"
                letterSpacing="1.5"
                fill="url(#brokerNameFill)"
                stroke="#E6C67A"
                strokeWidth="1.25"
                strokeDasharray="650"
                initial={
                  shouldReduceMotion
                    ? { strokeDashoffset: 0, fillOpacity: 1, strokeOpacity: 0.4 }
                    : { strokeDashoffset: 650, fillOpacity: 0, strokeOpacity: 1 }
                }
                animate={{
                  strokeDashoffset: 0,
                  fillOpacity: 1,
                  strokeOpacity: 0.42,
                }}
                transition={{
                  strokeDashoffset: { duration: 1.85, delay: 2.25, ease: LUXURY_EASE },
                  fillOpacity: { duration: 1.05, delay: 3.1, ease: 'easeOut' },
                  strokeOpacity: { duration: 0.85, delay: 3.6, ease: 'easeOut' },
                }}
              >
                {brokerName}
              </motion.text>
            </g>

            {/* Subtle Golden Writing Light Glint tracking across the signature */}
            {!shouldReduceMotion && (
              <motion.circle
                cy="62"
                r="14"
                fill="url(#penNibGlint)"
                initial={{ cx: 195, opacity: 0 }}
                animate={{
                  cx: [195, 765],
                  opacity: [0, 0.95, 0.9, 0],
                }}
                transition={{
                  cx: { duration: 1.65, delay: 2.28, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 1.65, delay: 2.28, times: [0, 0.12, 0.84, 1] },
                }}
              />
            )}

            {/* Sweeping Calligraphic Gold Pen Flourish */}
            <motion.path
              d="M 195 104 Q 480 116 765 101"
              stroke="url(#goldDraftStroke)"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: shouldReduceMotion ? 1 : 0, opacity: 0.2 }}
              animate={{ pathLength: 1, opacity: 0.95 }}
              transition={{ duration: 1.35, delay: 2.85, ease: LUXURY_EASE }}
            />
          </svg>

          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: shouldReduceMotion ? 0 : 3.65, ease: LUXURY_EASE }}
            className="mt-1 sm:mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm text-[#D8B467] tracking-[0.14em]"
          >
            <span className="text-[#FAF9F6]/90 font-medium">Corretora de Imóveis</span>
            <span aria-hidden="true" className="text-[#D8B467]/50">
              ·
            </span>
            <span>Estância Velha &amp; Vale dos Sinos</span>
            <span aria-hidden="true" className="text-[#D8B467]/50">
              ·
            </span>
            <span className="tabular-nums">{creci}</span>
          </motion.div>
        </div>
      </div>

      {/* Subtle Skip Affordance (Bottom Right, Accessible 44px Touch Target) */}
      <motion.button
        type="button"
        onClick={handleSkip}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.78 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="fixed bottom-6 right-6 z-20 min-h-[44px] px-4 py-2 text-xs font-medium text-[#FAF9F6]/75 hover:text-[#D8B467] transition-colors cursor-pointer"
      >
        Entrar no site →
      </motion.button>

      {/* Bottom Edge Cinematic Progress Hairline (5.25s draw + 0.75s dissolve = 6.0s) */}
      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 5.25, ease: 'linear' }}
          style={{ transformOrigin: '0% 50%' }}
          className="fixed bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#9D7A32] via-[#E6C982] to-[#C59B48]"
        />
      )}
    </motion.div>
  );
};
