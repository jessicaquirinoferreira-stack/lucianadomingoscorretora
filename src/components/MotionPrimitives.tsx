import React, { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';

const LUXURY_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * SmoothScrollProvider — powered by darkroomengineering/lenis.
 * Provides inertial momentum scrolling while preserving sticky positioning,
 * accessibility, and prefers-reduced-motion compliance.
 */
export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    let rafId = 0;
    const raf = (time: number) => {
      if (document.body.style.overflow !== 'hidden') {
        lenis.raf(time);
      }
      rafId = window.requestAnimationFrame(raf);
    };

    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [shouldReduceMotion]);

  return <>{children}</>;
};

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  delay = 0,
  yOffset = 22,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, delay, ease: LUXURY_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface StaggerGridProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerGrid: React.FC<StaggerGridProps> = ({
  children,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: LUXURY_EASE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface ParallaxMediaProps {
  children: React.ReactNode;
  className?: string;
  offsetRange?: [number, number];
  scale?: number;
}

export const ParallaxMedia: React.FC<ParallaxMediaProps> = ({
  children,
  className = '',
  offsetRange = [-24, 36],
  scale = 1.08,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], offsetRange);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        style={shouldReduceMotion ? undefined : { y, scale }}
        className="relative w-full h-full will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
};

interface EditorialImageRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const EditorialImageReveal: React.FC<EditorialImageRevealProps> = ({
  children,
  className = '',
  delay = 0,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.04 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.8, delay, ease: LUXURY_EASE }}
      className={`overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 1.25,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(shouldReduceMotion ? value : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(value);
      return;
    }
    if (!isInView) return;

    const controls = animate(0, value, {
      duration,
      ease: LUXURY_EASE,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [duration, isInView, shouldReduceMotion, value]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {display.toLocaleString('pt-BR')}
      {suffix}
    </span>
  );
};

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  onClick?: () => void;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  dark = false,
  onClick,
}) => {
  const [coords, setCoords] = useState({ x: 0, y: 0, visible: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setCoords((prev) => ({ ...prev, visible: false }))}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: coords.visible ? 1 : 0,
          background: dark
            ? `radial-gradient(420px circle at ${coords.x}px ${coords.y}px, rgba(216,180,103,0.14), transparent 65%)`
            : `radial-gradient(420px circle at ${coords.x}px ${coords.y}px, rgba(197,155,72,0.10), transparent 65%)`,
        }}
      />
      {children}
    </div>
  );
};

interface EditorialMarqueeProps {
  items: string[];
  dark?: boolean;
}

export const EditorialMarquee: React.FC<EditorialMarqueeProps> = ({
  items,
  dark = false,
}) => {
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div
      className={`overflow-hidden border-y py-3.5 select-none ${
        dark
          ? 'bg-[#081820] border-white/10 text-[#FAF9F6]/75'
          : 'bg-white border-[#0F2936]/10 text-[#0F2936]/70'
      }`}
    >
      <div className="animate-editorial-marquee items-center gap-8">
        {repeated.map((label, idx) => (
          <div
            key={`${label}-${idx}`}
            className="flex items-center gap-8 text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap"
          >
            <span>{label}</span>
            <span aria-hidden="true" className="text-[#C59B48]">
              ◆
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ScrollProgressHairline: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: scrollYProgress, transformOrigin: '0% 50%' }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C59B48] via-[#D8B467] to-[#C59B48] z-50 pointer-events-none"
    />
  );
};
