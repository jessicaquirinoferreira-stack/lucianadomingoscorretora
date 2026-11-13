import React from 'react';

interface BrandLogoProps {
  variant?: 'horizontal' | 'light' | 'icon';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  className = '',
}) => {
  const isLight = variant === 'light';
  const primaryColor = isLight ? '#FAF9F6' : '#0F2936';
  const accentColor = '#C59B48';

  const mark = (
    <svg
      width="36"
      height="36"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        width="64"
        height="64"
        rx="12"
        fill={isLight ? '#153647' : '#0F2936'}
      />
      <path
        d="M14 48V24L32 12L50 24V48"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 26V44H33"
        stroke="#FAF9F6"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 26H38.5C43.1944 26 46 29.5817 46 35C46 40.4183 43.1944 44 38.5 44H34V26Z"
        stroke={accentColor}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <span className={`inline-flex items-center ${className}`}>{mark}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-3 whitespace-nowrap shrink-0 ${className}`}>
      {mark}
      <span
        className="font-serif text-lg sm:text-xl font-semibold tracking-tight whitespace-nowrap"
        style={{ color: primaryColor }}
      >
        Luciana Domingos
      </span>
    </span>
  );
};
