import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * Official WhatsApp brand icon (speech bubble with handset silhouette).
 */
export const OfficialWhatsAppIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16 3C8.82 3 3 8.82 3 16c0 2.46.69 4.76 1.88 6.72L3.25 28.75l6.21-1.6A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3Zm0 23.62c-2.09 0-4.05-.6-5.7-1.64l-.41-.25-3.68.95.98-3.59-.27-.42A10.56 10.56 0 0 1 5.38 16C5.38 10.14 10.14 5.38 16 5.38S26.62 10.14 26.62 16 21.86 26.62 16 26.62Zm5.81-7.93c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.36-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.07 1.3 3.28c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.15-1.51.26-.74.26-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z"
    />
  </svg>
);

/**
 * Official Instagram brand icon with authentic rounded camera silhouette.
 */
export const OfficialInstagramIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="2.5"
      y="2.5"
      width="19"
      height="19"
      rx="5.5"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
    <circle cx="17.4" cy="6.6" r="1.25" fill="currentColor" />
  </svg>
);
